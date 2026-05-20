import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Sidebar from "../../components/layout/Sidebar";
import Topbar from "../../components/layout/Topbar";
import { supabase } from "../../lib/supabaseClient";
import oueng from "../../assets/images/ou-campus.png";

export default function ContentUpload() {
  const [faculty, setFaculty] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const prefill  = location.state?.prefill || null;

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

          <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-6 h-[calc(100vh-190px)] overflow-hidden">
            <div className="bg-white rounded-2xl shadow-sm border p-6 overflow-y-auto">
              <UnifiedUploadForm faculty={faculty} prefill={prefill} />
            </div>

            <div className="hidden xl:block relative overflow-hidden rounded-2xl shadow-sm border h-full">
              <img
                src={oueng}
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
// ─────────────────────────────────────────────────────────────────────────────
function DuplicateWarningModal({ existingTitles, subject, typeLabel = "File", onCancel }) {
  const typeEmoji = { Video: "🎥", PDF: "📄", Assessment: "📝" }[typeLabel] || "📁";

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-red-100">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center text-2xl flex-shrink-0">
            🚫
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Duplicate Title Not Allowed
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              A {typeLabel.toLowerCase()} with this title already exists in{" "}
              <span className="font-semibold text-gray-700">{subject}</span>.
              Please use a unique title before uploading.
            </p>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
          <p className="text-xs font-bold text-red-700 uppercase tracking-wider mb-2">
            Existing {typeLabel.toLowerCase()}(s) with this title:
          </p>
          <ul className="space-y-1">
            {existingTitles.map((t, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-red-800">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                {typeEmoji} {t}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-5">
          <p className="text-sm text-blue-800">
            💡 <span className="font-semibold">Action required:</span> Go back and rename the Title / Topic field to something unique, for example{" "}
            <span className="font-mono bg-blue-100 px-1 rounded text-xs">
              {existingTitles[0]} — Part {existingTitles.length + 1}
            </span>.
          </p>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="w-full px-4 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-700 text-white font-semibold text-sm transition-colors"
        >
          ← Go Back & Rename Title
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared duplicate-check helper
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
// UNIFIED UPLOAD FORM
// ─────────────────────────────────────────────────────────────────────────────
const MAX_VIDEO_BYTES = 6 * 1024 * 1024 * 1024; // 6 GB
const BASE_URL = () => (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

function UnifiedUploadForm({ faculty, prefill }) {
  const [form, setForm] = useState({
    subject:  prefill?.subject  || "",
    title:    prefill?.title    || "",
    year:     prefill?.year     || "",
    semester: prefill?.semester || "",
    unit:     prefill?.unit     || "",
  });

  const [videoFile, setVideoFile] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [assessmentFile, setAssessmentFile] = useState(null);

  // Auto-expand the right section when arriving from SubjectDetails shortcut
  const [showPdfUpload,        setShowPdfUpload]        = useState(prefill?.focusTab === "pdf");
  const [showAssessmentUpload, setShowAssessmentUpload] = useState(prefill?.focusTab === "assessment");

  const [videoLoading, setVideoLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [assessmentLoading, setAssessmentLoading] = useState(false);

  const [error, setError] = useState("");
  // Inline success states — shown inside their respective section
  const [videoSuccess, setVideoSuccess] = useState(false);
  const [pdfSuccess, setPdfSuccess] = useState(false);
  const [assessmentSuccess, setAssessmentSuccess] = useState(false);

  const [cdnUrl, setCdnUrl] = useState("");

  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateTitles, setDuplicateTitles] = useState([]);
  const [duplicateType, setDuplicateType] = useState("");
  const duplicateResolveRef = useRef(null);

  const [uploadPhase, setUploadPhase] = useState("");
  const [loadedBytes, setLoadedBytes] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
  const [speedMBs, setSpeedMBs] = useState("0.0");
  const [etaSeconds, setEtaSeconds] = useState(null);

  const abortCtrlRef = useRef(null);
  const sseRef = useRef(null);
  const startTimeRef = useRef(null);
  const lastLoadedRef = useRef(0);
  const speedTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      sseRef.current?.close();
      abortCtrlRef.current?.abort();
      clearInterval(speedTimerRef.current);
    };
  }, []);

  function validateCommonFields() {
    if (!form.subject || !form.title || !form.year || !form.unit) {
      return "Please fill all required fields (Subject, Title, Year, Unit)";
    }
    if (form.year !== "1" && !form.semester) {
      return "Please select a semester for years 2-4";
    }
    return null;
  }

  function handleVideoFileChange(e) {
    const selected = e.target.files[0] || null;
    setVideoFile(selected);
    setVideoSuccess(false);
    setError("");

    if (!selected) return;

    if (selected.type !== "video/mp4" && !selected.name.toLowerCase().endsWith(".mp4")) {
      setError("Only MP4 files are accepted for videos.");
      setVideoFile(null);
      e.target.value = "";
      return;
    }
    if (selected.size > MAX_VIDEO_BYTES) {
      setError(
        `Video file too large (${(selected.size / 1_073_741_824).toFixed(2)} GB). Maximum is 6 GB.`
      );
      setVideoFile(null);
      e.target.value = "";
    }
  }

  function handlePdfFileChange(e) {
    const selected = e.target.files[0] || null;
    setPdfFile(selected);
    setPdfSuccess(false);
    setError("");
  }

  function handleAssessmentFileChange(e) {
    const selected = e.target.files[0] || null;
    setAssessmentFile(selected);
    setAssessmentSuccess(false);
    setError("");
  }

  function handleVideoCancel() {
    abortCtrlRef.current?.abort();
    sseRef.current?.close();
    clearInterval(speedTimerRef.current);
    setVideoLoading(false);
    setUploadPhase("");
    setError("Video upload cancelled.");
    startTimeRef.current = null;
    lastLoadedRef.current = 0;
  }

  function startSpeedTracker(getTotalBytes) {
    clearInterval(speedTimerRef.current);
    startTimeRef.current = Date.now();
    lastLoadedRef.current = 0;

    speedTimerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000 || 0.001;
      const loaded = lastLoadedRef.current;
      const total = getTotalBytes();
      const mbps = (loaded / 1_048_576) / elapsed;
      const eta = mbps > 0 ? Math.round((total - loaded) / 1_048_576 / mbps) : null;
      setSpeedMBs(mbps.toFixed(1));
      setEtaSeconds(eta);
    }, 1000);
  }

  function askUserAboutDuplicate(existingRows, type) {
    return new Promise((resolve) => {
      setDuplicateTitles(existingRows.map((r) => r.title));
      setDuplicateType(type);
      setShowDuplicateModal(true);
      // Always resolves false — duplicate uploads are never allowed
      duplicateResolveRef.current = () => resolve(false);
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // VIDEO UPLOAD
  // ═══════════════════════════════════════════════════════════════
  async function handleVideoUpload() {
    setError("");
    setVideoSuccess(false);
    setCdnUrl("");

    const currentFaculty = faculty || JSON.parse(localStorage.getItem("faculty") || "null");
    if (!currentFaculty?.id) { setError("Please login again"); return; }

    const validationError = validateCommonFields();
    if (validationError) { setError(validationError); return; }

    if (!videoFile) { setError("Please select a video file"); return; }

    const existing = await checkForDuplicate(
      "videos", currentFaculty.id, form.subject, form.title, form.year, form.semester
    );
    if (existing.length > 0) {
      const proceed = await askUserAboutDuplicate(existing, "Video");
      if (!proceed) return;
    }

    try {
      setVideoLoading(true);
      setTotalBytes(videoFile.size);
      setLoadedBytes(0);
      setSpeedMBs("0.0");
      setEtaSeconds(null);
      setUploadPhase("sending");

      const formData = new FormData();
      formData.append("file", videoFile);
      formData.append("faculty_id", currentFaculty.id);
      formData.append("faculty_name", currentFaculty.name || "");
      formData.append("department", currentFaculty.department || "");
      formData.append("year", form.year);
      formData.append("semester", form.year === "1" ? "" : form.semester);
      formData.append("subject", form.subject);
      formData.append("unit", form.unit);
      formData.append("title", form.title);

      abortCtrlRef.current = new AbortController();

      const uploadRes = await fetch(`${BASE_URL()}/upload-video`, {
        method: "POST",
        body: formData,
        signal: abortCtrlRef.current.signal,
      });

      if (!uploadRes.ok) {
        const errData = await uploadRes.json().catch(() => ({}));
        throw new Error(errData.error || `Server error ${uploadRes.status}`);
      }

      const { uploadId, cdnUrl: videoCdnUrl } = await uploadRes.json();

      setUploadPhase("uploading");
      startSpeedTracker(() => videoFile.size);

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
            setLoadedBytes(videoFile.size);
            lastLoadedRef.current = videoFile.size;
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
      setVideoSuccess(true);
      // Clear file input after success
      setVideoFile(null);
      const fi = document.getElementById("video-file-input");
      if (fi) fi.value = "";

    } catch (err) {
      if (err.name === "AbortError") return;
      console.error("[VideoUpload] error:", err);
      setError(err.message || "Video upload failed. Please try again.");
    } finally {
      clearInterval(speedTimerRef.current);
      setVideoLoading(false);
      setUploadPhase("");
      abortCtrlRef.current = null;
      startTimeRef.current = null;
      lastLoadedRef.current = 0;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // PDF UPLOAD
  // ═══════════════════════════════════════════════════════════════
  async function handlePdfUpload() {
    setError("");
    setPdfSuccess(false);

    const currentFaculty = faculty || JSON.parse(localStorage.getItem("faculty") || "null");
    if (!currentFaculty?.id) { setError("Please login again"); return; }

    const validationError = validateCommonFields();
    if (validationError) { setError(validationError); return; }

    if (!pdfFile) { setError("Please select a PDF file"); return; }

    const existing = await checkForDuplicate(
      "content", currentFaculty.id, form.subject, form.title, form.year, form.semester
    );
    if (existing.length > 0) {
      const proceed = await askUserAboutDuplicate(existing, "PDF");
      if (!proceed) return;
    }

    try {
      setPdfLoading(true);
      const formData = new FormData();
      formData.append("file", pdfFile);
      formData.append("type", "pdf");
      formData.append("faculty_id", currentFaculty.id);
      formData.append("faculty_name", currentFaculty.name || "");
      formData.append("department", currentFaculty.department);
      formData.append("subject", form.subject);
      formData.append("unit", form.unit);
      formData.append("title", form.title);
      formData.append("year", form.year);
      formData.append("semester", form.year === "1" ? "" : form.semester);

      const res = await fetch(`${BASE_URL()}/upload-content`, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setPdfSuccess(true);
      // Clear file + input after success
      setPdfFile(null);
      const fi = document.getElementById("pdf-file-input");
      if (fi) fi.value = "";

      // Auto-collapse after 2.5s
      setTimeout(() => {
        setShowPdfUpload(false);
        setPdfSuccess(false);
      }, 2500);

    } catch (err) {
      setError(err.message || "PDF upload failed");
    } finally {
      setPdfLoading(false);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // ASSESSMENT UPLOAD
  // ═══════════════════════════════════════════════════════════════
  async function handleAssessmentUpload() {
    setError("");
    setAssessmentSuccess(false);

    const currentFaculty = faculty || JSON.parse(localStorage.getItem("faculty") || "null");
    if (!currentFaculty?.id) { setError("Please login again"); return; }

    if (!assessmentFile) { setError("Please upload the assessment file"); return; }

    if (form.subject && form.title && form.year && form.unit) {
      const existing = await checkForDuplicate(
        "assessments", currentFaculty.id, form.subject, form.title, form.year, form.semester
      );
      if (existing.length > 0) {
        const proceed = await askUserAboutDuplicate(existing, "Assessment");
        if (!proceed) return;
      }
    }

    try {
      setAssessmentLoading(true);
      const formData = new FormData();
      formData.append("file", assessmentFile);
      formData.append("faculty_id", currentFaculty.id);
      formData.append("faculty_name", currentFaculty.name || "");
      formData.append("department", currentFaculty.department);
      formData.append("subject", form.subject || "");
      formData.append("unit", form.unit || "");
      formData.append("title", form.title || "");
      formData.append("year", form.year || "");
      formData.append("semester", form.year === "1" ? "" : (form.semester || ""));

      const res = await fetch(`${BASE_URL()}/upload-assessment`, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setAssessmentSuccess(true);
      // Clear file + input after success
      setAssessmentFile(null);
      const fi = document.getElementById("assessment-file-input");
      if (fi) fi.value = "";

      // Auto-collapse after 2.5s
      setTimeout(() => {
        setShowAssessmentUpload(false);
        setAssessmentSuccess(false);
      }, 2500);

    } catch (err) {
      setError(err.message || "Assessment upload failed");
    } finally {
      setAssessmentLoading(false);
    }
  }

  const handleDownloadTemplate = () => {
    const link = document.createElement("a");
    link.href = "/sample_mcq_template.xlsx";
    link.download = "sample_mcq_template.xlsx";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const progressPct = totalBytes > 0
    ? Math.min(100, Math.round((loadedBytes / totalBytes) * 100))
    : 0;
  const loadedMB = (loadedBytes / 1_048_576).toFixed(0);
  const totalMB = (totalBytes / 1_048_576).toFixed(0);

  const formatEta = (sec) => {
    if (!sec || sec < 0) return "";
    if (sec < 60) return `~${sec}s left`;
    if (sec < 3600) return `~${Math.round(sec / 60)}m left`;
    return `~${(sec / 3600).toFixed(1)}h left`;
  };

  const phaseLabel = {
    sending: "⚡ Sending to server…",
    uploading: `📤 Uploading to Bunny CDN — ${progressPct}%`,
    saving: "💾 Saving metadata…",
    done: "✅ Done!",
  };

  const isAnyLoading = videoLoading || pdfLoading || assessmentLoading;

  return (
    <>
      {showDuplicateModal && (
        <DuplicateWarningModal
          existingTitles={duplicateTitles}
          subject={form.subject}
          typeLabel={duplicateType}
          onCancel={() => {
            setShowDuplicateModal(false);
            duplicateResolveRef.current?.();
          }}
        />
      )}

      <div className="space-y-5">
        {/* Header */}
        <div className="border-b border-gray-200 pb-4">
          <h2 className="text-xl font-bold text-gray-900">Upload Course Materials</h2>
          <p className="text-sm text-gray-500 mt-1">
            Fill in the common details below, then upload video, lecture notes, or assessments.
          </p>
        </div>

        {/* Global error (only for things not tied to a section) */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Prefill context banner — shown when arriving from SubjectDetails */}
        {prefill && (
          <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
            <span className="text-lg mt-0.5">🔗</span>
            <div>
              <p className="text-sm font-semibold text-blue-900">
                Adding missing content for <span className="font-black">"{prefill.title}"</span>
              </p>
              <p className="text-xs text-blue-600 mt-0.5">
                Details are pre-filled from your subject page. Review them before uploading.
              </p>
            </div>
          </div>
        )}

        {/* ── Common Fields ── */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">📋</span>
            <h3 className="text-sm font-bold text-gray-800">Common Details</h3>
            <span className="text-xs text-red-500 font-medium">* Required for Video &amp; Lecture Notes</span>
          </div>

          <div>
            <input
              placeholder="Subject *"
              className="input"
              value={form.subject}
              maxLength={30}
              disabled={isAnyLoading}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
            />
            <p className={`text-xs mt-1 text-right ${form.subject.length >= 30 ? "text-red-500 font-semibold" : "text-gray-400"}`}>
              {form.subject.length}/30
            </p>
          </div>
          <div>
            <input
              placeholder="Title / Topic *"
              className="input"
              value={form.title}
              maxLength={30}
              disabled={isAnyLoading}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <p className={`text-xs mt-1 text-right ${form.title.length >= 30 ? "text-red-500 font-semibold" : "text-gray-400"}`}>
              {form.title.length}/30
            </p>
          </div>
          <input
            placeholder="Unit (e.g. Unit 1) *"
            className="input"
            value={form.unit}
            disabled={isAnyLoading}
            onChange={(e) => setForm({ ...form, unit: e.target.value })}
          />

          <div className={`grid gap-4 ${form.year !== "1" && form.year !== "" ? "grid-cols-2" : "grid-cols-1"}`}>
            <select
              className="input"
              value={form.year}
              disabled={isAnyLoading}
              onChange={(e) =>
                setForm({ ...form, year: e.target.value, semester: e.target.value === "1" ? "" : form.semester })
              }
            >
              <option value="">Year *</option>
              {["1", "2", "3", "4"].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>

            {form.year !== "1" && form.year !== "" && (
              <select
                className="input"
                value={form.semester}
                disabled={isAnyLoading}
                onChange={(e) => setForm({ ...form, semester: e.target.value })}
              >
                <option value="">Semester *</option>
                <option value="1">1</option>
                <option value="2">2</option>
              </select>
            )}
          </div>
        </div>

        {/* ── Video Upload Section ── */}
        <div className="border border-blue-200 bg-blue-50 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎥</span>
            <h3 className="text-sm font-bold text-blue-900">Upload Video</h3>
          </div>

          {/* Show success state instead of file picker */}
          {videoSuccess ? (
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
              <span className="text-2xl">✅</span>
              <p className="text-sm font-semibold text-green-800">Video uploaded successfully!</p>
            </div>
          ) : (
            <>
              <div className="rounded-xl border-2 border-dashed border-blue-300 bg-white p-4">
                <input
                  id="video-file-input"
                  type="file"
                  accept=".mp4,video/mp4"
                  disabled={isAnyLoading}
                  onChange={handleVideoFileChange}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0
                    file:text-sm file:font-medium file:bg-blue-100 file:text-blue-700
                    hover:file:bg-blue-200 cursor-pointer"
                />
                <p className="text-xs text-gray-400 mt-2">
                  MP4 only · max 6 GB · recommended H.264 + AAC · max 1080p
                </p>
                {videoFile && (
                  <p className="text-xs text-gray-600 mt-1 font-medium">
                    📹 {videoFile.name} —{" "}
                    {videoFile.size >= 1_073_741_824
                      ? (videoFile.size / 1_073_741_824).toFixed(2) + " GB"
                      : (videoFile.size / 1_048_576).toFixed(1) + " MB"}
                  </p>
                )}
              </div>

              {videoLoading && (
                <div className="rounded-xl border border-blue-200 bg-white p-4 space-y-3">
                  <p className="text-sm font-semibold text-blue-800">
                    {phaseLabel[uploadPhase] || "⚙️ Working…"}
                  </p>

                  {uploadPhase === "uploading" ? (
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
                  ) : (
                    <div className="w-full bg-blue-200 rounded-full h-2 overflow-hidden">
                      <div className="bg-blue-500 h-2 rounded-full animate-pulse w-1/3" />
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-blue-600">⚠️ Keep this tab open during upload.</p>
                    <button
                      type="button"
                      onClick={handleVideoCancel}
                      className="text-xs text-red-500 underline ml-4 hover:text-red-700"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={handleVideoUpload}
                disabled={isAnyLoading || !videoFile}
                className="btn-blue w-full disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {videoLoading ? "Uploading Video..." : "Upload Video"}
              </button>
            </>
          )}

          {cdnUrl && videoSuccess && (
            <div className="mt-2">
              <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
              <div className="rounded-xl overflow-hidden border border-gray-300 bg-black">
                <video controls width="100%" preload="metadata" playsInline style={{ display: "block" }}>
                  <source src={cdnUrl} type="video/mp4" />
                  Your browser does not support the HTML5 video element.
                </video>
              </div>
            </div>
          )}
        </div>

        {/* ── PDF + Assessment row — compact buttons OR expanded panels ── */}
        <div className="flex flex-col gap-4">

          {/* PDF Section */}
          {!showPdfUpload ? (
            /* Compact trigger button */
            <button
              onClick={() => setShowPdfUpload(true)}
              disabled={isAnyLoading}
              className="flex items-center gap-2 self-start px-4 py-2 bg-orange-50 border border-orange-300 text-orange-800 text-sm font-semibold rounded-lg hover:bg-orange-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span>📚</span> + Add Lecture Notes
            </button>
          ) : (
            /* Expanded PDF panel */
            <div className="border border-orange-200 bg-orange-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📚</span>
                  <h3 className="text-sm font-bold text-orange-900">Add Lecture Notes</h3>
                </div>
                <button
                  onClick={() => {
                    setShowPdfUpload(false);
                    setPdfFile(null);
                    setPdfSuccess(false);
                    const fi = document.getElementById("pdf-file-input");
                    if (fi) fi.value = "";
                  }}
                  disabled={pdfLoading}
                  className="text-xs text-orange-600 hover:text-orange-800 underline disabled:opacity-60"
                >
                  Cancel
                </button>
              </div>

              {/* Success state — replaces file picker */}
              {pdfSuccess ? (
                <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
                  <span className="text-xl">✅</span>
                  <p className="text-sm font-semibold text-green-800">Lecture notes uploaded successfully!</p>
                </div>
              ) : (
                <>
                  <div className="rounded-xl border-2 border-dashed border-orange-300 bg-white p-3">
                    <input
                      id="pdf-file-input"
                      type="file"
                      accept="application/pdf"
                      disabled={isAnyLoading}
                      onChange={handlePdfFileChange}
                      className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0
                        file:text-sm file:font-medium file:bg-orange-100 file:text-orange-700
                        hover:file:bg-orange-200 cursor-pointer"
                    />
                    {pdfFile && (
                      <p className="text-xs text-gray-600 mt-1.5 font-medium">
                        📄 {pdfFile.name} — {(pdfFile.size / 1024 / 1024).toFixed(1)} MB
                      </p>
                    )}
                  </div>

                  <button
                    onClick={handlePdfUpload}
                    disabled={isAnyLoading || !pdfFile}
                    className="btn-green w-full disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {pdfLoading ? "Uploading Lecture Notes..." : "Upload Lecture Notes"}
                  </button>
                </>
              )}
            </div>
          )}

          {/* Assessment Section */}
          {!showAssessmentUpload ? (
            /* Compact trigger button */
            <button
              onClick={() => setShowAssessmentUpload(true)}
              disabled={isAnyLoading}
              className="flex items-center gap-2 self-start px-4 py-2 bg-purple-50 border border-purple-300 text-purple-800 text-sm font-semibold rounded-lg hover:bg-purple-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span>📝</span> + Add Assessment
            </button>
          ) : (
            /* Expanded Assessment panel */
            <div className="border border-purple-200 bg-purple-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📝</span>
                  <h3 className="text-sm font-bold text-purple-900">Add Assessment</h3>
                  <span className="text-xs text-gray-500">(Optional fields)</span>
                </div>
                <button
                  onClick={() => {
                    setShowAssessmentUpload(false);
                    setAssessmentFile(null);
                    setAssessmentSuccess(false);
                    const fi = document.getElementById("assessment-file-input");
                    if (fi) fi.value = "";
                  }}
                  disabled={assessmentLoading}
                  className="text-xs text-purple-600 hover:text-purple-800 underline disabled:opacity-60"
                >
                  Cancel
                </button>
              </div>

              {/* Success state — replaces file picker */}
              {assessmentSuccess ? (
                <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
                  <span className="text-xl">✅</span>
                  <p className="text-sm font-semibold text-green-800">Assessment uploaded successfully!</p>
                </div>
              ) : (
                <>
                  {/* Template download */}
                  <div className="rounded-xl border border-purple-200 bg-white p-3">
                    <div className="flex items-start gap-2">
                      <span className="text-lg mt-0.5">📥</span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-purple-800 mb-1">
                          Step 1 — Download the MCQ Template
                        </p>
                        <p className="text-xs text-purple-600 mb-2 leading-relaxed">
                          Fixed headers:{" "}
                          <span className="font-mono bg-purple-100 px-1 rounded">
                            Question | Option A | Option B | Option C | Option D | Answer
                          </span>.
                          Answer column accepts <strong>A, B, C or D</strong> only.
                        </p>
                        <button
                          type="button"
                          onClick={handleDownloadTemplate}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white text-xs font-medium rounded-lg hover:bg-purple-700 transition-colors"
                        >
                          ⬇️ Download Template (.xlsx)
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border-2 border-dashed border-purple-300 bg-white p-3">
                    <p className="text-xs text-gray-500 mb-1.5">
                      Step 2 — Upload the filled template (.xlsx, .csv, .docx, .txt)
                    </p>
                    <input
                      id="assessment-file-input"
                      type="file"
                      accept=".xlsx,.csv,.docx,.txt"
                      disabled={isAnyLoading}
                      onChange={handleAssessmentFileChange}
                      className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0
                        file:text-sm file:font-medium file:bg-purple-100 file:text-purple-700
                        hover:file:bg-purple-200 cursor-pointer"
                    />
                    {assessmentFile && (
                      <p className="text-xs text-green-600 mt-1.5 font-medium">
                        ✓ Selected: <span className="font-semibold">{assessmentFile.name}</span>
                      </p>
                    )}
                  </div>

                  <button
                    onClick={handleAssessmentUpload}
                    disabled={isAnyLoading || !assessmentFile}
                    className="btn-purple w-full disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {assessmentLoading ? "Uploading Assessment..." : "Upload Assessment"}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}