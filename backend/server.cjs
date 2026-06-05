const express = require("express");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
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
// 🔐 SUPABASE
//////////////////////////////////////////////////////

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

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
      SUPABASE_URL:           !!process.env.SUPABASE_URL,
      SUPABASE_SERVICE_KEY:   !!process.env.SUPABASE_SERVICE_KEY,
      BUNNY_STORAGE_ZONE:     !!process.env.BUNNY_STORAGE_ZONE,
      BUNNY_STORAGE_HOST:     !!process.env.BUNNY_STORAGE_HOST,
      BUNNY_STORAGE_PASSWORD: !!process.env.BUNNY_STORAGE_PASSWORD,
      BUNNY_CDN_URL:          !!process.env.BUNNY_CDN_URL,
    },
  });
});

//////////////////////////////////////////////////////
// 🎬 DIRECT BUNNY UPLOAD ARCHITECTURE
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
    const safeName = fileName.replace(/[^a-zA-Z0-9._\-]/g, "_");
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
 * POST /create-pdf-upload
 * 
 * Returns upload configuration for direct browser → Bunny upload for PDFs.
 * 
 * Body: { fileName, fileSize }
 * 
 * Returns:
 * {
 *   uploadUrl: "https://sg.storage.bunnycdn.com/...",
 *   accessKey: "...",
 *   cdnUrl: "https://osmania-lms-cdn.b-cdn.net/pdfs/...",
 *   filePath: "pdfs/uuid-filename.pdf",
 *   uploadId: "uuid"
 * }
 */
app.post("/create-pdf-upload", async (req, res) => {
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

    // Validate PDF extension
    if (!fileName.toLowerCase().endsWith(".pdf")) {
      return res.status(400).json({ error: "Only PDF files are accepted" });
    }

    // Build safe file path
    const safeName = fileName.replace(/[^a-zA-Z0-9._\-]/g, "_");
    const fileId   = uuidv4();
    const filePath = `pdfs/${fileId}-${safeName}`;

    // Build upload URL
    const uploadUrl = `https://${BUNNY_STORAGE_HOST}/${BUNNY_STORAGE_ZONE}/${filePath}`;
    const cdnUrl    = `${BUNNY_CDN_URL}/${filePath}`;

    console.log(`[create-pdf-upload] Generated upload config for: ${fileName} (${fileSize} bytes)`);

    return res.status(200).json({
      uploadUrl,
      accessKey: BUNNY_STORAGE_PASSWORD,
      cdnUrl,
      filePath,
      uploadId: fileId,
    });
  } catch (error) {
    console.error("CREATE PDF UPLOAD ERROR:", error.message);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /create-assessment-upload
 * 
 * Returns upload configuration for direct browser → Bunny upload for Assessments.
 * 
 * Body: { fileName, fileSize }
 * Supports: .xlsx, .csv, .docx, .txt
 * 
 * Returns:
 * {
 *   uploadUrl: "https://sg.storage.bunnycdn.com/...",
 *   accessKey: "...",
 *   cdnUrl: "https://osmania-lms-cdn.b-cdn.net/assessments/...",
 *   filePath: "assessments/uuid-filename.xlsx",
 *   uploadId: "uuid"
 * }
 */
app.post("/create-assessment-upload", async (req, res) => {
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

    // Validate file extension
    const validExtensions = [".xlsx", ".csv", ".docx", ".txt"];
    const lowerFileName = fileName.toLowerCase();
    const isValidExt = validExtensions.some((ext) => lowerFileName.endsWith(ext));

    if (!isValidExt) {
      return res.status(400).json({
        error: "Only .xlsx, .csv, .docx, and .txt files are accepted for assessments",
      });
    }

    // Build safe file path
    const safeName = fileName.replace(/[^a-zA-Z0-9._\-]/g, "_");
    const fileId   = uuidv4();
    const filePath = `assessments/${fileId}-${safeName}`;

    // Build upload URL
    const uploadUrl = `https://${BUNNY_STORAGE_HOST}/${BUNNY_STORAGE_ZONE}/${filePath}`;
    const cdnUrl    = `${BUNNY_CDN_URL}/${filePath}`;

    console.log(`[create-assessment-upload] Generated upload config for: ${fileName} (${fileSize} bytes)`);

    return res.status(200).json({
      uploadUrl,
      accessKey: BUNNY_STORAGE_PASSWORD,
      cdnUrl,
      filePath,
      uploadId: fileId,
    });
  } catch (error) {
    console.error("CREATE ASSESSMENT UPLOAD ERROR:", error.message);
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

/**
 * POST /save-pdf-metadata
 * 
 * Called by frontend after successful direct upload to Bunny.
 * Saves PDF metadata to Supabase.
 * 
 * Body:
 * {
 *   filePath, cdnUrl, faculty_id, faculty_name,
 *   department, year, semester, subject, unit, title
 * }
 */
app.post("/save-pdf-metadata", async (req, res) => {
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

    const { error } = await supabase.from("pdfs").insert([{
      faculty_id,
      faculty_name: resolvedFacultyName,
      department,
      year:       Number(year),
      semester:   semester ? Number(semester) : null,
      subject,
      unit,
      title,
      file_id:    filePath,
      file_url:   cdnUrl,
      created_at: new Date().toISOString(),
    }]);

    if (error) throw error;

    console.log("✅ PDF metadata saved:", filePath);
    return res.status(200).json({ success: true, cdnUrl });
  } catch (error) {
    console.error("SAVE PDF METADATA ERROR:", error.message);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /save-assessment-metadata
 * 
 * Called by frontend after successful direct upload to Bunny.
 * Saves assessment metadata to Supabase.
 * 
 * Body:
 * {
 *   filePath, cdnUrl, faculty_id, faculty_name,
 *   department, year, semester, subject, unit, title
 * }
 */
app.post("/save-assessment-metadata", async (req, res) => {
  try {
    const {
      filePath, cdnUrl, faculty_id, faculty_name,
      department, year, semester, subject, unit, title,
    } = req.body;

    if (!filePath || !cdnUrl || !faculty_id) {
      return res.status(400).json({
        error: "filePath, cdnUrl, and faculty_id are required",
      });
    }

    const resolvedFacultyName = faculty_name || (await getFacultyName(faculty_id));

    const { error } = await supabase.from("assessments").insert([{
      faculty_id,
      faculty_name: resolvedFacultyName,
      department,
      year:       Number(year),
      semester:   semester ? Number(semester) : null,
      subject,
      unit,
      title,
      file_id:    filePath,
      file_url:   cdnUrl,
      created_at: new Date().toISOString(),
    }]);

    if (error) throw error;

    console.log("✅ Assessment metadata saved:", filePath);
    return res.status(200).json({ success: true, cdnUrl });
  } catch (error) {
    console.error("SAVE ASSESSMENT METADATA ERROR:", error.message);
    return res.status(500).json({ error: error.message });
  }
});

//////////////////////////////////////////////////////
// 🔐 FACULTY PASSWORD RESET
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

// Standard timeout (5 minutes max)
server.setTimeout(5 * 60 * 1000);
server.keepAliveTimeout = 65_000;
server.headersTimeout   = 66_000;