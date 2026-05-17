const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const https = require("https");
const { v4: uuidv4 } = require("uuid");
const { google } = require("googleapis");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const app = express();

console.log("=== SERVER STARTUP ===");

app.use(cors());

//////////////////////////////////////////////////////
// Body parsers
//////////////////////////////////////////////////////

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//////////////////////////////////////////////////////
// 📁 LOCAL STORAGE
//////////////////////////////////////////////////////

const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

app.use("/uploads", express.static(uploadDir));
const upload = multer({ dest: "uploads/" });

//////////////////////////////////////////////////////
// 🔐 SUPABASE
//////////////////////////////////////////////////////

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

//////////////////////////////////////////////////////
// 🔐 GOOGLE DRIVE AUTH (for PDFs + Assessments)
//////////////////////////////////////////////////////

const driveOAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "https://developers.google.com/oauthplayground"
);

driveOAuth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

const drive = google.drive({
  version: "v3",
  auth: driveOAuth2Client,
});

//////////////////////////////////////////////////////
// 🔐 BUNNY STORAGE CONFIG
//////////////////////////////////////////////////////

const BUNNY_STORAGE_ZONE     = process.env.BUNNY_STORAGE_ZONE;     // osmania-lms-videos
const BUNNY_STORAGE_HOST     = process.env.BUNNY_STORAGE_HOST;     // sg.storage.bunnycdn.com
const BUNNY_STORAGE_PASSWORD = process.env.BUNNY_STORAGE_PASSWORD;
const BUNNY_CDN_URL          = process.env.BUNNY_CDN_URL;          // https://osmania-lms-cdn.b-cdn.net

//////////////////////////////////////////////////////
// 🔗 Persistent HTTPS agent for Bunny Storage
// Keeps TCP connections alive between requests so each
// upload doesn't pay the TLS handshake cost again.
//////////////////////////////////////////////////////

const bunnyAgent = new https.Agent({
  keepAlive:            true,
  keepAliveMsecs:       10_000,
  maxSockets:           8,      // up to 8 parallel connections to Bunny
  maxFreeSockets:       4,
  scheduling:           "lifo",
  timeout:              0,      // no socket idle timeout
});

//////////////////////////////////////////////////////
// 🛠️ HELPERS
//////////////////////////////////////////////////////

async function uploadToDrive(file) {
  const fileMetadata = {
    name: file.originalname,
    parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
  };

  const media = {
    mimeType: file.mimetype,
    body: fs.createReadStream(file.path),
  };

  const response = await drive.files.create({
    requestBody: fileMetadata,
    media,
    fields: "id",
  });

  await drive.permissions.create({
    fileId: response.data.id,
    requestBody: {
      role: "reader",
      type: "anyone",
    },
  });

  return response.data.id;
}

async function getFacultyName(faculty_id) {
  const { data, error } = await supabase
    .from("faculty")
    .select("name")
    .eq("id", faculty_id)
    .single();

  if (error || !data) return "Unknown Faculty";
  return data.name;
}

//////////////////////////////////////////////////////
// 🧪 TEST ROUTES
//////////////////////////////////////////////////////

app.get("/", (req, res) => {
  res.json({
    status: "running",
    env: {
      GOOGLE_CLIENT_ID:       !!process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET:   !!process.env.GOOGLE_CLIENT_SECRET,
      GOOGLE_REFRESH_TOKEN:   !!process.env.GOOGLE_REFRESH_TOKEN,
      GOOGLE_DRIVE_FOLDER_ID: !!process.env.GOOGLE_DRIVE_FOLDER_ID,
      SUPABASE_URL:           !!process.env.SUPABASE_URL,
      SUPABASE_SERVICE_KEY:   !!process.env.SUPABASE_SERVICE_KEY,
      BUNNY_STORAGE_ZONE:     !!process.env.BUNNY_STORAGE_ZONE,
      BUNNY_STORAGE_HOST:     !!process.env.BUNNY_STORAGE_HOST,
      BUNNY_STORAGE_PASSWORD: !!process.env.BUNNY_STORAGE_PASSWORD,
      BUNNY_CDN_URL:          !!process.env.BUNNY_CDN_URL,
    },
  });
});

app.get("/test-drive", async (req, res) => {
  try {
    const token = await driveOAuth2Client.getAccessToken();
    res.json({ ok: true, accessTokenWorking: !!token?.token });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

//////////////////////////////////////////////////////
// 🎬 BUNNY STORAGE — Streaming proxy upload
//
// POST /upload-video
//
// The browser sends the raw MP4 directly to this endpoint as
// multipart/form-data (using multer disk storage). Node then
// streams the file to Bunny Storage using a persistent HTTPS
// agent — no RAM buffering, no base64, pure pipe().
//
// Why proxy instead of direct browser → Bunny PUT?
//   • The Bunny Storage password never reaches the browser
//   • Node's TCP stack saturates the uplink far better than a
//     single browser XHR to a distant region (Singapore)
//   • Progress is tracked server-side and streamed back via
//     SSE on a separate endpoint (/upload-video-progress/:id)
//   • In local dev the browser → localhost hop is effectively
//     free, so the only real bottleneck is localhost → Bunny
//
// Flow:
//   1. Browser POSTs file + metadata here (multipart)
//   2. Server streams file → Bunny Storage via persistent agent
//   3. Server saves metadata to Supabase
//   4. Returns { cdnUrl, filePath }
//
// Body fields: file (MP4), faculty_id, faculty_name, department,
//              year, semester, subject, unit, title
//////////////////////////////////////////////////////

// Multer config for video — no size limit enforced here (validated
// on the frontend); multer just writes to disk as it streams in.
const videoUpload = multer({
  dest:   "uploads/",
  limits: { fileSize: 7 * 1024 * 1024 * 1024 }, // 7 GB hard cap
});

// In-memory progress store: uploadId → { loaded, total, done, error }
const progressStore = new Map();

// Clean up stale progress entries after 10 minutes
setInterval(() => {
  const cutoff = Date.now() - 10 * 60 * 1000;
  for (const [id, entry] of progressStore.entries()) {
    if (entry.startedAt < cutoff) progressStore.delete(id);
  }
}, 60_000);

//////////////////////////////////////////////////////
// GET /upload-video-progress/:uploadId
// Server-Sent Events endpoint — frontend polls this for
// real-time upload progress while the proxy streams to Bunny.
//////////////////////////////////////////////////////

app.get("/upload-video-progress/:uploadId", (req, res) => {
  const { uploadId } = req.params;

  res.setHeader("Content-Type",  "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection",    "keep-alive");
  res.flushHeaders();

  const send = (data) => {
    if (!res.writableEnded) res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  const interval = setInterval(() => {
    const entry = progressStore.get(uploadId);
    if (!entry) { send({ status: "waiting" }); return; }

    send({
      status:  entry.error ? "error"   :
               entry.done  ? "done"    : "uploading",
      loaded:  entry.loaded,
      total:   entry.total,
      error:   entry.error || null,
      cdnUrl:  entry.cdnUrl || null,
    });

    if (entry.done || entry.error) {
      clearInterval(interval);
      res.end();
    }
  }, 300); // send update every 300 ms

  req.on("close", () => clearInterval(interval));
});

//////////////////////////////////////////////////////
// POST /upload-video — main streaming proxy
//////////////////////////////////////////////////////

app.post(
  "/upload-video",
  videoUpload.single("file"),
  async (req, res) => {
    // multer has already written the file to disk by the time we get here
    const tempPath = req.file?.path;

    const cleanup = () => {
      if (tempPath && fs.existsSync(tempPath)) {
        try { fs.unlinkSync(tempPath); } catch (_) {}
      }
    };

    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file received." });
      }

      // ── validate MIME / extension ──────────────────────────
      const originalName = req.file.originalname || "";
      const isMP4 =
        req.file.mimetype === "video/mp4" ||
        originalName.toLowerCase().endsWith(".mp4");

      if (!isMP4) {
        cleanup();
        return res.status(400).json({ error: "Only MP4 files are accepted." });
      }

      if (
        !BUNNY_STORAGE_ZONE ||
        !BUNNY_STORAGE_HOST ||
        !BUNNY_STORAGE_PASSWORD ||
        !BUNNY_CDN_URL
      ) {
        cleanup();
        return res.status(500).json({ error: "Bunny Storage not configured." });
      }

      // ── build storage path ─────────────────────────────────
      const safeName = path.basename(originalName).replace(/[^a-zA-Z0-9._\-]/g, "_");
      const fileId   = uuidv4();
      const filePath = `videos/${fileId}-${safeName}`;
      const cdnUrl   = `${BUNNY_CDN_URL}/${filePath}`;

      // ── register progress entry ────────────────────────────
      const uploadId  = fileId; // reuse uuid as the progress key
      const fileSize  = req.file.size;

      progressStore.set(uploadId, {
        loaded:    0,
        total:     fileSize,
        done:      false,
        error:     null,
        cdnUrl:    null,
        startedAt: Date.now(),
      });

      // ── respond immediately with uploadId + cdnUrl ─────────
      // The frontend can start polling /upload-video-progress/:uploadId
      // while the actual Bunny transfer happens asynchronously below.
      res.json({ uploadId, cdnUrl, filePath });

      // ── stream file → Bunny Storage (async, after response) ─
      const bunnyPath = `/${BUNNY_STORAGE_ZONE}/${filePath}`;
      const fileStream = fs.createReadStream(tempPath, {
        highWaterMark: 512 * 1024, // 512 KB read chunks
      });

      const bunnyReq = https.request(
        {
          hostname: BUNNY_STORAGE_HOST,
          path:     bunnyPath,
          method:   "PUT",
          agent:    bunnyAgent,
          headers:  {
            AccessKey:       BUNNY_STORAGE_PASSWORD,
            "Content-Type":  "video/mp4",
            "Content-Length": fileSize,
          },
        },
        (bunnyRes) => {
          let body = "";
          bunnyRes.on("data", (d) => { body += d; });
          bunnyRes.on("end", async () => {
            const ok = bunnyRes.statusCode === 201 || bunnyRes.statusCode === 200;

            if (!ok) {
              console.error(`[Bunny] PUT failed — HTTP ${bunnyRes.statusCode}:`, body);
              progressStore.set(uploadId, {
                ...progressStore.get(uploadId),
                error: `Bunny rejected upload (HTTP ${bunnyRes.statusCode}).`,
              });
              cleanup();
              return;
            }

            console.log(`[Bunny] ✅ Upload complete: ${filePath}`);

            // ── save metadata to Supabase ──────────────────
            try {
              const {
                faculty_id, faculty_name, department,
                year, semester, subject, unit, title,
              } = req.body;

              const { error: dbErr } = await supabase.from("videos").insert([{
                faculty_id,
                faculty_name: faculty_name || (await getFacultyName(faculty_id)),
                department,
                year:       Number(year),
                semester:   semester ? Number(semester) : null,
                subject,
                unit,
                title,
                file_id:    filePath,
                embed_url:  cdnUrl,
                created_at: new Date().toISOString(),
              }]);

              if (dbErr) throw dbErr;

              progressStore.set(uploadId, {
                ...progressStore.get(uploadId),
                loaded:  fileSize,
                done:    true,
                cdnUrl,
              });

              console.log("✅ Metadata saved:", filePath);
            } catch (dbError) {
              console.error("METADATA SAVE ERROR:", dbError.message);
              progressStore.set(uploadId, {
                ...progressStore.get(uploadId),
                error: "Upload succeeded but metadata save failed: " + dbError.message,
              });
            }

            cleanup();
          });
        }
      );

      bunnyReq.on("error", (err) => {
        console.error("[Bunny] Stream error:", err.message);
        progressStore.set(uploadId, {
          ...progressStore.get(uploadId),
          error: "Network error while uploading to Bunny: " + err.message,
        });
        cleanup();
      });

      // Track bytes written to Bunny so progress SSE works
      let bytesWritten = 0;
      fileStream.on("data", (chunk) => {
        bytesWritten += chunk.length;
        const entry = progressStore.get(uploadId);
        if (entry && !entry.done && !entry.error) {
          progressStore.set(uploadId, { ...entry, loaded: bytesWritten });
        }
      });

      fileStream.on("error", (err) => {
        console.error("[FileStream] read error:", err.message);
        progressStore.set(uploadId, {
          ...progressStore.get(uploadId),
          error: "Failed to read temp file: " + err.message,
        });
        bunnyReq.destroy();
        cleanup();
      });

      // Pipe the local temp file straight into the Bunny PUT request
      fileStream.pipe(bunnyReq);

    } catch (err) {
      console.error("UPLOAD-VIDEO ERROR:", err.message);
      cleanup();
      // Response may already be sent (uploadId response) so guard carefully
      if (!res.headersSent) {
        res.status(500).json({ error: err.message });
      }
    }
  }
);

//////////////////////////////////////////////////////
// 💾 SAVE VIDEO METADATA (kept for backward compat)
// This is now called internally by /upload-video after
// the Bunny transfer completes. Exposed externally only
// if you need a manual retry path.
//////////////////////////////////////////////////////

app.post("/save-video-metadata", async (req, res) => {
  try {
    const {
      filePath, cdnUrl, faculty_id, faculty_name,
      department, year, semester, subject, unit, title,
    } = req.body;

    if (!filePath || !cdnUrl || !faculty_id || !title) {
      return res.status(400).json({
        error: "filePath, cdnUrl, faculty_id, and title are required",
      });
    }

    const { error } = await supabase.from("videos").insert([{
      faculty_id,
      faculty_name: faculty_name || (await getFacultyName(faculty_id)),
      department,
      year:       Number(year),
      semester:   semester ? Number(semester) : null,
      subject,
      unit,
      title,
      file_id:    filePath,
      embed_url:  cdnUrl,
      created_at: new Date().toISOString(),
    }]);

    if (error) throw error;

    console.log("✅ Video metadata saved:", filePath);
    return res.status(200).json({ success: true, cdnUrl });
  } catch (error) {
    console.error("SAVE METADATA ERROR:", error.message);
    return res.status(500).json({ error: error.message });
  }
});

//////////////////////////////////////////////////////
// 🎯 UPLOAD CONTENT — PDFs only (UNCHANGED)
//////////////////////////////////////////////////////

app.post("/upload-content", upload.single("file"), async (req, res) => {
  try {
    console.log("UPLOAD HIT");

    const { faculty_id, type, department, year, semester, subject, unit, title } =
      req.body;

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    if (type === "video") {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        error: "Video uploads are not handled here. Use /upload-video instead.",
      });
    }

    if (type === "pdf") {
      const faculty_name = await getFacultyName(faculty_id);
      const fileId = await uploadToDrive(req.file);

      fs.unlinkSync(req.file.path);

      const fileUrl = `https://drive.google.com/uc?id=${fileId}`;

      const { error } = await supabase.from("pdfs").insert([
        {
          faculty_id,
          faculty_name,
          department,
          year:     Number(year),
          semester: semester ? Number(semester) : null,
          subject,
          unit,
          title,
          file_id:  fileId,
          file_url: fileUrl,
        },
      ]);

      if (error) throw error;

      return res.json({ success: true, fileUrl });
    }

    fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: "Invalid type. Supported types: pdf" });
  } catch (error) {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error("UPLOAD ERROR:", error.message);
    return res.status(500).json({ error: error.message });
  }
});

//////////////////////////////////////////////////////
// 📊 ASSESSMENT UPLOAD (UNCHANGED)
//////////////////////////////////////////////////////

app.post("/upload-assessment", upload.single("file"), async (req, res) => {
  try {
    const { faculty_id, department, year, semester, subject, unit, title } =
      req.body;

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const faculty_name = await getFacultyName(faculty_id);
    const fileId = await uploadToDrive(req.file);

    fs.unlinkSync(req.file.path);

    const { error } = await supabase.from("assessments").insert([
      {
        faculty_id,
        faculty_name,
        department,
        year:     Number(year),
        semester: semester ? Number(semester) : null,
        subject,
        unit,
        title,
        file_id: fileId,
      },
    ]);

    if (error) throw error;

    return res.json({ success: true });
  } catch (error) {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error("ASSESSMENT ERROR:", error.message);
    return res.status(500).json({ error: error.message });
  }
});

//////////////////////////////////////////////////////
// 📈 Memory monitor
//////////////////////////////////////////////////////

setInterval(() => {
  const mb = process.memoryUsage().rss / 1024 / 1024;
  if (mb > 400) {
    console.warn(`⚠️  High RSS memory: ${mb.toFixed(0)} MB`);
  }
}, 10_000);

//////////////////////////////////////////////////////
// 🚀 START SERVER
//////////////////////////////////////////////////////

const PORT = process.env.PORT || 5000;

// Large body timeout — essential for 6 GB uploads.
// expressTimeout is set per-request via server.setTimeout below.
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Allow up to 2 hours for a single request (covers very large files
// on slow connections). Express's default is 2 minutes.
server.setTimeout(2 * 60 * 60 * 1000); // 2 hours in ms
server.keepAliveTimeout = 65_000;       // slightly above ALB/nginx defaults
server.headersTimeout   = 66_000;
