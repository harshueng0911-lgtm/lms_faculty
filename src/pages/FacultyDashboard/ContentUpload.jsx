import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/layout/Sidebar";
import Topbar from "../../components/layout/Topbar";
import { supabase } from "../../lib/supabaseClient";

export default function ContentUpload() {
  const [activeTab, setActiveTab] = useState("video");
  const [faculty, setFaculty] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadFaculty = async () => {
      let storedFaculty = null;
      try {
        const raw = localStorage.getItem("faculty");
        if (raw) storedFaculty = JSON.parse(raw);
      } catch (err) {
        console.error("Invalid faculty in localStorage", err);
      }

      if (storedFaculty?.id) {
        setFaculty(storedFaculty);
        setAuthChecking(false);
        return;
      }

      if (!supabase) { setAuthChecking(false); return; }

      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();
      if (sessionError) console.error("Supabase session error", sessionError);

      if (sessionData?.session?.user?.id) {
        const { data: facultyData, error: facultyError } = await supabase
          .from("faculty")
          .select("*")
          .eq("id", sessionData.session.user.id)
          .single();

        if (facultyError) console.error("Faculty fetch error", facultyError);
        else if (facultyData) {
          setFaculty(facultyData);
          localStorage.setItem("faculty", JSON.stringify(facultyData));
        }
      }
      setAuthChecking(false);
    };
    loadFaculty();
  }, []);

  if (authChecking) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f6f8fb]">
        <div className="rounded-xl bg-white p-8 shadow-lg text-center">
          <p className="text-lg font-medium">Verifying login...</p>
        </div>
      </div>
    );
  }

  if (!faculty) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f6f8fb]">
        <div className="rounded-xl bg-white p-8 shadow-lg text-center">
          <p className="text-lg font-semibold mb-4">
            Please log in to upload content.
          </p>
          <button
            type="button"
            onClick={() => navigate("/faculty/login")}
            className="btn-blue"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#f6f8fb]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar />
        <div className="p-6">
          <h1 className="text-2xl font-semibold text-gray-800 mb-6">
            Upload Content
          </h1>

          <div className="flex gap-4 mb-6">
            {[
              { key: "video",      label: "Video Uploadings"     },
              { key: "pdf",        label: "Lecture Uploadings"    },
              { key: "assessment", label: "Assessment Uploadings" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-lg border ${
                  activeTab === tab.key
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-600"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-6 h-[calc(100vh-190px)] overflow-hidden">
            <div className="bg-white rounded-2xl shadow-sm border p-6 overflow-y-auto">
              {activeTab === "video"      && <VideoForm      faculty={faculty} />}
              {activeTab === "pdf"        && <PDFForm        faculty={faculty} />}
              {activeTab === "assessment" && <AssessmentForm faculty={faculty} />}
            </div>

            <div className="hidden xl:block relative overflow-hidden rounded-2xl shadow-sm border h-full">
              <img
                src="https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=1200&auto=format&fit=crop"
                alt="Osmania University"
                className="absolute inset-0 w-full h-full object-cover object-top"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-[#06254D]/20 via-[#06254D]/45 to-[#06254D]/95" />
              <div className="absolute inset-0 flex flex-col justify-end p-8 text-white">
                <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-3xl mb-5">
                  🎓
                </div>
                <h2 className="text-3xl font-bold leading-tight mb-3">
                  Osmania University
                </h2>
                <p className="text-blue-100 text-sm leading-relaxed mb-6">
                  Upload lecture videos, academic PDFs and assessments for
                  students through the LMS faculty workspace.
                </p>
                <div className="space-y-3">
                  {[
                    { icon: "🎥", title: "Video Classes",  desc: "Upload engaging academic video content."   },
                    { icon: "📚", title: "Lecture Notes",  desc: "Organize unit-wise lecture materials."     },
                    { icon: "📝", title: "Assessments",    desc: "Share tests, assignments and evaluations." },
                  ].map((card) => (
                    <div
                      key={card.title}
                      className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10"
                    >
                      <h3 className="font-semibold mb-1">{card.icon} {card.title}</h3>
                      <p className="text-xs text-blue-100">{card.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DuplicateWarningModal
// Reusable — works for video, PDF, and assessment
// typeLabel: "Video" | "PDF" | "Assessment"
// ─────────────────────────────────────────────────────────────────────────────
function DuplicateWarningModal({ existingTitles, subject, typeLabel = "File", onProceed, onCancel }) {
  const typeEmoji = { Video: "🎥", PDF: "📄", Assessment: "📝" }[typeLabel] || "📁";

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-orange-100">
        {/* Icon + heading */}
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-2xl flex-shrink-0">
            ⚠️
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Duplicate {typeLabel} Detected
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              You already have a {typeLabel.toLowerCase()} on this topic in{" "}
              <span className="font-semibold text-gray-700">{subject}</span>.
            </p>
          </div>
        </div>

        {/* Existing file list */}
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 mb-5">
          <p className="text-xs font-bold text-orange-700 uppercase tracking-wider mb-2">
            Existing {typeLabel.toLowerCase()}(s) with this title:
          </p>
          <ul className="space-y-1">
            {existingTitles.map((t, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-orange-800">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" />
                {typeEmoji} {t}
              </li>
            ))}
          </ul>
        </div>

        {/* Suggestion */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-5">
          <p className="text-sm text-blue-800">
            💡 <span className="font-semibold">Suggestion:</span> Rename your upload to something like{" "}
            <span className="font-mono bg-blue-100 px-1 rounded">
              {existingTitles[0]} — Part {existingTitles.length + 1}
            </span>{" "}
            before proceeding.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors"
          >
            ← Go Back & Rename
          </button>
          <button
            type="button"
            onClick={onProceed}
            className="flex-1 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm transition-colors"
          >
            Upload Anyway
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared duplicate-check helper
// table: "videos" | "content" | "assessments"  (adjust to your actual table names)
// ─────────────────────────────────────────────────────────────────────────────
async function checkForDuplicate(table, facultyId, subject, title, year, semester) {
  let query = supabase
    .from(table)
    .select("title")
    .eq("faculty_id", facultyId)
    .eq("subject",    subject)
    .eq("title",      title)
    .eq("year",       year);

  if (year !== "1" && semester) {
    query = query.eq("semester", semester);
  }

  const { data, error } = await query;
  if (error) {
    console.error(`Duplicate check error on [${table}]:`, error);
    return [];
  }
  return data || [];
}

// ─────────────────────────────────────────────────────────────────────────────
// VIDEO FORM
// ─────────────────────────────────────────────────────────────────────────────

const MAX_VIDEO_BYTES = 6 * 1024 * 1024 * 1024; // 6 GB
const BASE_URL = () => (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

function VideoForm({ faculty }) {
  const [file, setFile]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState(false);
  const [cdnUrl, setCdnUrl]   = useState("");

  // Duplicate-check modal state
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateTitles, setDuplicateTitles]       = useState([]);
  const duplicateResolveRef = useRef(null);

  // Progress state
  const [uploadPhase, setUploadPhase]   = useState("");
  const [loadedBytes, setLoadedBytes]   = useState(0);
  const [totalBytes, setTotalBytes]     = useState(0);
  const [speedMBs, setSpeedMBs]         = useState("0.0");
  const [etaSeconds, setEtaSeconds]     = useState(null);

  const abortCtrlRef  = useRef(null);
  const sseRef        = useRef(null);
  const startTimeRef  = useRef(null);
  const lastLoadedRef = useRef(0);
  const speedTimerRef = useRef(null);

  const [form, setForm] = useState({
    subject: "", title: "", year: "", semester: "", unit: "",
  });

  useEffect(() => {
    return () => {
      sseRef.current?.close();
      abortCtrlRef.current?.abort();
      clearInterval(speedTimerRef.current);
    };
  }, []);

  function handleFileChange(e) {
    const selected = e.target.files[0] || null;
    setFile(selected);
    setSuccess(false);
    setError("");

    if (!selected) return;

    if (selected.type !== "video/mp4" && !selected.name.toLowerCase().endsWith(".mp4")) {
      setError("Only MP4 files are accepted.");
      setFile(null);
      e.target.value = "";
      return;
    }
    if (selected.size > MAX_VIDEO_BYTES) {
      setError(
        `File too large (${(selected.size / 1_073_741_824).toFixed(2)} GB). Maximum is 6 GB.`
      );
      setFile(null);
      e.target.value = "";
    }
  }

  function handleCancel() {
    abortCtrlRef.current?.abort();
    sseRef.current?.close();
    clearInterval(speedTimerRef.current);
    setLoading(false);
    setUploadPhase("");
    setError("Upload cancelled.");
    startTimeRef.current  = null;
    lastLoadedRef.current = 0;
  }

  function startSpeedTracker(getTotalBytes) {
    clearInterval(speedTimerRef.current);
    startTimeRef.current  = Date.now();
    lastLoadedRef.current = 0;

    speedTimerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000 || 0.001;
      const loaded  = lastLoadedRef.current;
      const total   = getTotalBytes();
      const mbps    = (loaded / 1_048_576) / elapsed;
      const eta     = mbps > 0 ? Math.round((total - loaded) / 1_048_576 / mbps) : null;
      setSpeedMBs(mbps.toFixed(1));
      setEtaSeconds(eta);
    }, 1000);
  }

  function askUserAboutDuplicate(existingRows) {
    return new Promise((resolve) => {
      setDuplicateTitles(existingRows.map((r) => r.title));
      setShowDuplicateModal(true);
      duplicateResolveRef.current = resolve;
    });
  }

  async function handleUpload(e) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setCdnUrl("");

    const currentFaculty =
      faculty || JSON.parse(localStorage.getItem("faculty") || "null");
    if (!currentFaculty?.id) { setError("Please login again"); return; }

    if (
      !form.subject || !form.title || !form.year || !form.unit ||
      (form.year !== "1" && !form.semester)
    ) {
      setError("Please fill all fields");
      return;
    }
    if (!file) { setError("Please select a video file"); return; }

    // ── Duplicate check (only this faculty's videos) ─────────────────────────
    const existing = await checkForDuplicate(
      "videos",
      currentFaculty.id,
      form.subject,
      form.title,
      form.year,
      form.semester
    );

    if (existing.length > 0) {
      const proceed = await askUserAboutDuplicate(existing);
      if (!proceed) return;
    }

    // ── Proceed with upload ─────────────────────────────────────────────────
    try {
      setLoading(true);
      setTotalBytes(file.size);
      setLoadedBytes(0);
      setSpeedMBs("0.0");
      setEtaSeconds(null);

      setUploadPhase("sending");

      const formData = new FormData();
      formData.append("file",         file);
      formData.append("faculty_id",   currentFaculty.id);
      formData.append("faculty_name", currentFaculty.name || "");
      formData.append("department",   currentFaculty.department || "");
      formData.append("year",         form.year);
      formData.append("semester",     form.year === "1" ? "" : form.semester);
      formData.append("subject",      form.subject);
      formData.append("unit",         form.unit);
      formData.append("title",        form.title);

      abortCtrlRef.current = new AbortController();

      const uploadRes = await fetch(`${BASE_URL()}/upload-video`, {
        method: "POST",
        body:   formData,
        signal: abortCtrlRef.current.signal,
      });

      if (!uploadRes.ok) {
        const errData = await uploadRes.json().catch(() => ({}));
        throw new Error(errData.error || `Server error ${uploadRes.status}`);
      }

      const { uploadId, cdnUrl: videoCdnUrl } = await uploadRes.json();

      setUploadPhase("uploading");
      startSpeedTracker(() => file.size);

      await new Promise((resolve, reject) => {
        const sse = new EventSource(`${BASE_URL()}/upload-video-progress/${uploadId}`);
        sseRef.current = sse;

        sse.onmessage = (ev) => {
          let data;
          try { data = JSON.parse(ev.data); } catch { return; }

          if (data.status === "uploading") {
            setLoadedBytes(data.loaded || 0);
            lastLoadedRef.current = data.loaded || 0;
          }

          if (data.status === "done") {
            setLoadedBytes(file.size);
            lastLoadedRef.current = file.size;
            sse.close();
            sseRef.current = null;
            resolve();
          }

          if (data.status === "error") {
            sse.close();
            sseRef.current = null;
            reject(new Error(data.error || "Upload failed on server."));
          }
        };

        sse.onerror = () => {
          if (sseRef.current) {
            sse.close();
            sseRef.current = null;
            reject(new Error("Lost connection to progress stream. Check server logs."));
          }
        };
      });

      clearInterval(speedTimerRef.current);
      setUploadPhase("done");
      setCdnUrl(videoCdnUrl);
      setSuccess(true);
      setFile(null);
      setForm({ subject: "", title: "", year: "", semester: "", unit: "" });

      const fi = document.getElementById("video-file-input");
      if (fi) fi.value = "";

    } catch (err) {
      if (err.name === "AbortError") return;
      console.error("[VideoForm] upload error:", err);
      setError(err.message || "Upload failed. Please try again.");
    } finally {
      clearInterval(speedTimerRef.current);
      setLoading(false);
      setUploadPhase("");
      abortCtrlRef.current  = null;
      startTimeRef.current  = null;
      lastLoadedRef.current = 0;
    }
  }

  const progressPct = totalBytes > 0
    ? Math.min(100, Math.round((loadedBytes / totalBytes) * 100))
    : 0;
  const loadedMB = (loadedBytes / 1_048_576).toFixed(0);
  const totalMB  = (totalBytes  / 1_048_576).toFixed(0);

  const formatEta = (sec) => {
    if (!sec || sec < 0) return "";
    if (sec < 60)   return `~${sec}s left`;
    if (sec < 3600) return `~${Math.round(sec / 60)}m left`;
    return `~${(sec / 3600).toFixed(1)}h left`;
  };

  const phaseLabel = {
    sending:   "⚡ Sending to server…",
    uploading: `📤 Uploading to Bunny CDN — ${progressPct}%`,
    saving:    "💾 Saving metadata…",
    done:      "✅ Done!",
  };

  return (
    <>
      {showDuplicateModal && (
        <DuplicateWarningModal
          existingTitles={duplicateTitles}
          subject={form.subject}
          typeLabel="Video"
          onProceed={() => {
            setShowDuplicateModal(false);
            duplicateResolveRef.current?.(true);
          }}
          onCancel={() => {
            setShowDuplicateModal(false);
            duplicateResolveRef.current?.(false);
          }}
        />
      )}

      <form className="space-y-4" onSubmit={handleUpload}>
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
            ✅ Video uploaded successfully
          </div>
        )}

        <input
          placeholder="Subject" className="input" value={form.subject}
          disabled={loading}
          onChange={(e) => setForm({ ...form, subject: e.target.value })}
        />
        <input
          placeholder="Title" className="input" value={form.title}
          disabled={loading}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <input
          placeholder="Unit (e.g. Unit 1)" className="input" value={form.unit}
          disabled={loading}
          onChange={(e) => setForm({ ...form, unit: e.target.value })}
        />

        <div className={`grid gap-4 ${form.year !== "1" ? "grid-cols-2" : "grid-cols-1"}`}>
          <select
            className="input" value={form.year} disabled={loading}
            onChange={(e) =>
              setForm({ ...form, year: e.target.value, semester: e.target.value === "1" ? "" : form.semester })
            }
          >
            <option value="">Year</option>
            {["1","2","3","4"].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          {form.year !== "1" && form.year !== "" && (
            <select
              className="input" value={form.semester} disabled={loading}
              onChange={(e) => setForm({ ...form, semester: e.target.value })}
            >
              <option value="">Semester</option>
              <option value="1">1</option>
              <option value="2">2</option>
            </select>
          )}
        </div>

        <div className="rounded-xl border-2 border-dashed border-gray-200 p-4">
          <input
            id="video-file-input"
            type="file"
            accept=".mp4,video/mp4"
            disabled={loading}
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0
              file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100 cursor-pointer"
          />
          <p className="text-xs text-gray-400 mt-2">
            MP4 only · max 6 GB · recommended H.264 + AAC · max 1080p
          </p>
          {file && (
            <p className="text-xs text-gray-500 mt-1">
              📹 {file.name} —{" "}
              {file.size >= 1_073_741_824
                ? (file.size / 1_073_741_824).toFixed(2) + " GB"
                : (file.size / 1_048_576).toFixed(1) + " MB"}
            </p>
          )}
        </div>

        {loading && (
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 space-y-3">
            <p className="text-sm font-semibold text-blue-800">
              {phaseLabel[uploadPhase] || "⚙️ Working…"}
            </p>

            {uploadPhase === "uploading" && (
              <>
                <div className="w-full bg-blue-200 rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-blue-700">
                  <span>{loadedMB} MB / {totalMB} MB</span>
                  <span>{speedMBs} MB/s</span>
                  <span>{formatEta(etaSeconds)}</span>
                </div>
              </>
            )}

            {uploadPhase !== "uploading" && (
              <div className="w-full bg-blue-200 rounded-full h-2 overflow-hidden">
                <div className="bg-blue-500 h-2 rounded-full animate-pulse w-1/3" />
              </div>
            )}

            <div className="flex items-center justify-between">
              <p className="text-xs text-blue-500">
                ⚠️ Keep this tab open during upload.
              </p>
              <button
                type="button"
                onClick={handleCancel}
                className="text-xs text-red-500 underline ml-4"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <button
          disabled={loading || (!!error && !success)}
          className="btn-blue w-full disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Uploading…" : "Upload Video"}
        </button>

        {cdnUrl && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-600 mb-2">Preview:</p>
            <div className="rounded-xl overflow-hidden border border-gray-200 bg-black">
              <video
                controls
                width="100%"
                preload="metadata"
                playsInline
                style={{ display: "block" }}
              >
                <source src={cdnUrl} type="video/mp4" />
                Your browser does not support the HTML5 video element.
              </video>
            </div>
          </div>
        )}
      </form>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PDF FORM — with duplicate check
// ─────────────────────────────────────────────────────────────────────────────
function PDFForm({ faculty }) {
  const [file, setFile]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState(false);
  const [form, setForm]       = useState({
    subject: "", title: "", year: "", semester: "", unit: "",
  });

  // Duplicate-check modal state
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateTitles, setDuplicateTitles]       = useState([]);
  const duplicateResolveRef = useRef(null);

  function askUserAboutDuplicate(existingRows) {
    return new Promise((resolve) => {
      setDuplicateTitles(existingRows.map((r) => r.title));
      setShowDuplicateModal(true);
      duplicateResolveRef.current = resolve;
    });
  }

  const handleUpload = async (e) => {
    e.preventDefault();
    setError(""); setSuccess(false);

    const currentFaculty =
      faculty || JSON.parse(localStorage.getItem("faculty") || "null");
    if (!currentFaculty?.id) { setError("Please login again"); return; }
    if (!file) { setError("Please select a PDF file"); return; }
    if (
      !form.subject || !form.title || !form.year || !form.unit ||
      (form.year !== "1" && !form.semester)
    ) { setError("Please fill all fields"); return; }

    // ── Duplicate check (only this faculty's PDFs) ───────────────────────────
    // NOTE: Change "content" below to your actual Supabase table name for PDFs
    const existing = await checkForDuplicate(
      "content",
      currentFaculty.id,
      form.subject,
      form.title,
      form.year,
      form.semester
    );

    if (existing.length > 0) {
      const proceed = await askUserAboutDuplicate(existing);
      if (!proceed) return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("file",         file);
      formData.append("type",         "pdf");
      formData.append("faculty_id",   currentFaculty.id);
      formData.append("faculty_name", currentFaculty.name || "");
      formData.append("department",   currentFaculty.department);
      formData.append("subject",      form.subject);
      formData.append("unit",         form.unit);
      formData.append("title",        form.title);
      formData.append("year",         form.year);
      formData.append("semester",     form.year === "1" ? "" : form.semester);

      const BASE_URL = import.meta.env.VITE_API_URL.replace(/\/$/, "");
      const res  = await fetch(`${BASE_URL}/upload-content`, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setSuccess(true);
      setFile(null);
      setForm({ subject: "", title: "", year: "", semester: "", unit: "" });

      const fi = document.getElementById("pdf-file-input");
      if (fi) fi.value = "";
    } catch (err) {
      setError(err.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {showDuplicateModal && (
        <DuplicateWarningModal
          existingTitles={duplicateTitles}
          subject={form.subject}
          typeLabel="PDF"
          onProceed={() => {
            setShowDuplicateModal(false);
            duplicateResolveRef.current?.(true);
          }}
          onCancel={() => {
            setShowDuplicateModal(false);
            duplicateResolveRef.current?.(false);
          }}
        />
      )}

      <form className="space-y-4" onSubmit={handleUpload}>
        {error   && <div className="p-4 bg-red-50   border border-red-200   text-red-700   rounded-lg text-sm">{error}</div>}
        {success && <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">✅ PDF uploaded successfully</div>}

        <input
          placeholder="Subject" className="input" value={form.subject}
          disabled={loading}
          onChange={(e) => setForm({ ...form, subject: e.target.value })}
        />
        <input
          placeholder="Title" className="input" value={form.title}
          disabled={loading}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <input
          placeholder="Unit (e.g. Unit 1)" className="input" value={form.unit}
          disabled={loading}
          onChange={(e) => setForm({ ...form, unit: e.target.value })}
        />

        <div className={`grid gap-4 ${form.year !== "1" ? "grid-cols-2" : "grid-cols-1"}`}>
          <select
            className="input" value={form.year} disabled={loading}
            onChange={(e) =>
              setForm({
                ...form,
                year: e.target.value,
                semester: e.target.value === "1" ? "" : form.semester,
              })
            }
          >
            <option value="">Year</option>
            {["1","2","3","4"].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>

          {form.year !== "1" && form.year !== "" && (
            <select
              className="input" value={form.semester} disabled={loading}
              onChange={(e) => setForm({ ...form, semester: e.target.value })}
            >
              <option value="">Semester</option>
              <option value="1">1</option>
              <option value="2">2</option>
            </select>
          )}
        </div>

        <div className="rounded-xl border-2 border-dashed border-gray-200 p-4">
          <input
            id="pdf-file-input"
            type="file"
            accept="application/pdf"
            disabled={loading}
            onChange={(e) => {
              setFile(e.target.files[0] || null);
              setSuccess(false);
              setError("");
            }}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0
              file:text-sm file:font-medium file:bg-orange-50 file:text-orange-700
              hover:file:bg-orange-100 cursor-pointer"
          />
          {file && (
            <p className="text-xs text-gray-500 mt-2">
              📄 {file.name} — {(file.size / 1024 / 1024).toFixed(1)} MB
            </p>
          )}
        </div>

        <button
          disabled={loading}
          className="btn-green w-full disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Uploading..." : "Upload PDF"}
        </button>
      </form>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ASSESSMENT FORM — with duplicate check
// ─────────────────────────────────────────────────────────────────────────────
function AssessmentForm({ faculty }) {
  const [file, setFile]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState(false);
  const [form, setForm]       = useState({
    title: "", subject: "", year: "", semester: "", unit: "",
  });

  // Duplicate-check modal state
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateTitles, setDuplicateTitles]       = useState([]);
  const duplicateResolveRef = useRef(null);

  function askUserAboutDuplicate(existingRows) {
    return new Promise((resolve) => {
      setDuplicateTitles(existingRows.map((r) => r.title));
      setShowDuplicateModal(true);
      duplicateResolveRef.current = resolve;
    });
  }

  const handleDownloadTemplate = () => {
    const link = document.createElement("a");
    link.href     = "/sample_mcq_template.xlsx";
    link.download = "sample_mcq_template.xlsx";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setError(""); setSuccess(false);

    const currentFaculty =
      faculty || JSON.parse(localStorage.getItem("faculty") || "null");
    if (!currentFaculty?.id) { setError("Please login again"); return; }
    if (!file) { setError("Please upload the filled Excel file"); return; }
    if (
      !form.title || !form.subject || !form.year || !form.unit ||
      (form.year !== "1" && !form.semester)
    ) { setError("Fill all fields"); return; }

    // ── Duplicate check (only this faculty's assessments) ───────────────────
    // NOTE: Change "assessments" below to your actual Supabase table name
    const existing = await checkForDuplicate(
      "assessments",
      currentFaculty.id,
      form.subject,
      form.title,
      form.year,
      form.semester
    );

    if (existing.length > 0) {
      const proceed = await askUserAboutDuplicate(existing);
      if (!proceed) return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("file",         file);
      formData.append("faculty_id",   currentFaculty.id);
      formData.append("faculty_name", currentFaculty.name || "");
      formData.append("department",   currentFaculty.department);
      formData.append("subject",      form.subject);
      formData.append("unit",         form.unit);
      formData.append("title",        form.title);
      formData.append("year",         form.year);
      formData.append("semester",     form.year === "1" ? "" : form.semester);

      const BASE_URL = (
        import.meta.env.VITE_API_URL || "http://localhost:5000"
      ).replace(/\/$/, "");
      const res  = await fetch(`${BASE_URL}/upload-assessment`, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setSuccess(true);
      setFile(null);
      setForm({ title: "", subject: "", year: "", semester: "", unit: "" });

      const fi = document.getElementById("assessment-file-input");
      if (fi) fi.value = "";
    } catch (err) {
      setError(err.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {showDuplicateModal && (
        <DuplicateWarningModal
          existingTitles={duplicateTitles}
          subject={form.subject}
          typeLabel="Assessment"
          onProceed={() => {
            setShowDuplicateModal(false);
            duplicateResolveRef.current?.(true);
          }}
          onCancel={() => {
            setShowDuplicateModal(false);
            duplicateResolveRef.current?.(false);
          }}
        />
      )}

      <form className="space-y-4" onSubmit={handleUpload}>
        {error   && <div className="p-4 bg-red-50   border border-red-200   text-red-700   rounded-lg text-sm">{error}</div>}
        {success && <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">✅ Assessment uploaded successfully</div>}

        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 flex items-start gap-3">
          <span className="text-2xl mt-0.5">📥</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-blue-800 mb-1">
              Step 1 — Download the MCQ Template
            </p>
            <p className="text-xs text-blue-600 mb-3 leading-relaxed">
              Fixed headers:{" "}
              <span className="font-mono bg-blue-100 px-1 rounded">
                Question | Option A | Option B | Option C | Option D | Answer
              </span>.
              Answer column accepts <strong>A, B, C or D</strong> only.
            </p>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              ⬇️ Download Template (.xlsx)
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-3">
          <p className="text-sm font-semibold text-gray-700">
            Step 2 — Fill Assessment Details
          </p>

          <input
            placeholder="Subject" className="input" value={form.subject}
            disabled={loading}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
          />
          <input
            placeholder="Title" className="input" value={form.title}
            disabled={loading}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <input
            placeholder="Unit (e.g. Unit 1)" className="input" value={form.unit}
            disabled={loading}
            onChange={(e) => setForm({ ...form, unit: e.target.value })}
          />

          <div className={`grid gap-4 ${form.year !== "1" ? "grid-cols-2" : "grid-cols-1"}`}>
            <select
              className="input" value={form.year} disabled={loading}
              onChange={(e) =>
                setForm({
                  ...form,
                  year: e.target.value,
                  semester: e.target.value === "1" ? "" : form.semester,
                })
              }
            >
              <option value="">Year</option>
              {["1","2","3","4"].map((y) => <option key={y} value={y}>{y}</option>)}
            </select>

            {form.year !== "1" && form.year !== "" && (
              <select
                className="input" value={form.semester} disabled={loading}
                onChange={(e) => setForm({ ...form, semester: e.target.value })}
              >
                <option value="">Semester</option>
                <option value="1">1</option>
                <option value="2">2</option>
              </select>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
          <p className="text-sm font-semibold text-gray-700 mb-1">
            Step 3 — Upload Filled Template
          </p>
          <p className="text-xs text-gray-400 mb-3">
            Only upload the template you downloaded above (.xlsx).
          </p>
          <input
            id="assessment-file-input"
            type="file"
            accept=".xlsx,.csv,.docx,.txt"
            disabled={loading}
            onChange={(e) => {
              setFile(e.target.files[0] || null);
              setSuccess(false);
              setError("");
            }}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0
              file:text-sm file:font-medium file:bg-purple-50 file:text-purple-700
              hover:file:bg-purple-100 cursor-pointer"
          />
          {file && (
            <p className="text-xs text-green-600 mt-2">
              ✓ Selected: <span className="font-medium">{file.name}</span>
            </p>
          )}
        </div>

        <button
          disabled={loading}
          className="btn-purple w-full disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Uploading..." : "Upload Assessment"}
        </button>
      </form>
    </>
  );
}