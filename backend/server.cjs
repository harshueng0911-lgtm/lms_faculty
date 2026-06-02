const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
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
// 📁 LOCAL STORAGE (for PDFs + Assessments only)
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

    return res.json({
      ok: true,
      accessTokenWorking: !!token?.token,
    });
  } catch (err) {
    console.error("TEST DRIVE FULL ERROR:");
    console.error(err);

    return res.status(500).json({
      ok: false,
      message: err.message,
      response: err.response?.data || null,
    });
  }
});

//////////////////////////////////////////////////////
// 🎬 NEW DIRECT UPLOAD ARCHITECTURE
//////////////////////////////////////////////////////

/**
 * POST /create-video-upload
 * 
 * Returns upload configuration for direct browser → Bunny upload.
 * 
 * Body: { fileName, fileSize }
 * 
 * Returns:
 * {
 *   uploadUrl: "https://sg.storage.bunnycdn.com/...",
 *   accessKey: "...",
 *   cdnUrl: "https://osmania-lms-cdn.b-cdn.net/videos/...",
 *   filePath: "videos/uuid-filename.mp4",
 *   uploadId: "uuid"
 * }
 */
app.post("/create-video-upload", async (req, res) => {
  try {
    const { fileName, fileSize } = req.body;

    if (!fileName) {
      return res.status(400).json({ error: "fileName is required" });
    }

    if (!fileSize || fileSize <= 0) {
      return res.status(400).json({ error: "fileSize must be a positive number" });
    }

    // Validate Bunny config
    if (
      !BUNNY_STORAGE_ZONE ||
      !BUNNY_STORAGE_HOST ||
      !BUNNY_STORAGE_PASSWORD ||
      !BUNNY_CDN_URL
    ) {
      return res.status(500).json({ error: "Bunny Storage not configured" });
    }

    // Validate MP4 extension
    if (!fileName.toLowerCase().endsWith(".mp4")) {
      return res.status(400).json({ error: "Only MP4 files are accepted" });
    }

    // Build safe file path
    const safeName = path.basename(fileName).replace(/[^a-zA-Z0-9._\-]/g, "_");
    const fileId   = uuidv4();
    const filePath = `videos/${fileId}-${safeName}`;

    // Build upload URL
    const uploadUrl = `https://${BUNNY_STORAGE_HOST}/${BUNNY_STORAGE_ZONE}/${filePath}`;
    const cdnUrl    = `${BUNNY_CDN_URL}/${filePath}`;

    console.log(`[create-video-upload] Generated upload config for: ${fileName} (${fileSize} bytes)`);

    return res.status(200).json({
      uploadUrl,
      accessKey: BUNNY_STORAGE_PASSWORD,
      cdnUrl,
      filePath,
      uploadId: fileId,
    });
  } catch (error) {
    console.error("CREATE VIDEO UPLOAD ERROR:", error.message);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /save-video-metadata
 * 
 * Called by frontend after successful direct upload to Bunny.
 * Saves video metadata to Supabase.
 * 
 * Body:
 * {
 *   filePath, cdnUrl, faculty_id, faculty_name,
 *   department, year, semester, subject, unit, title
 * }
 */
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

    const resolvedFacultyName = faculty_name || (await getFacultyName(faculty_id));

    const { error } = await supabase.from("videos").insert([{
      faculty_id,
      faculty_name: resolvedFacultyName,
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
    console.error("SAVE VIDEO METADATA ERROR:", error.message);
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
        error: "Video uploads are not handled here. Use the video upload endpoint instead.",
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
// 🔐 FACULTY PASSWORD RESET (UNCHANGED)
//////////////////////////////////////////////////////

app.post("/reset-password", async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({
        error: "Email and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        error: "Password must be at least 6 characters",
      });
    }

    // Find auth user by email
    const { data: usersData, error: usersError } =
      await supabase.auth.admin.listUsers();

    if (usersError) {
      console.error("List users error:", usersError.message);
      return res.status(500).json({
        error: usersError.message,
      });
    }

    const user = usersData.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (!user) {
      return res.status(404).json({
        error: "Faculty account not found",
      });
    }

    // Update password
    const { error: updateError } =
      await supabase.auth.admin.updateUserById(user.id, {
        password: newPassword,
      });

    if (updateError) {
      console.error("Password update error:", updateError.message);
      return res.status(500).json({
        error: updateError.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (err) {
    console.error("RESET PASSWORD ERROR:", err.message);

    return res.status(500).json({
      error: "Internal server error",
    });
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

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Standard timeout (no longer need 2 hours for video uploads)
server.setTimeout(5 * 60 * 1000); // 5 minutes
server.keepAliveTimeout = 65_000;
server.headersTimeout   = 66_000;