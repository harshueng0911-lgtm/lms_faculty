import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import Sidebar from "../../components/layout/Sidebar";
import Topbar from "../../components/layout/Topbar";

import {
  FileText,
  ClipboardList,
  PlayCircle,
  Trash2,
  X,
  ArrowLeft,
  ExternalLink,
  Download,
  ChevronDown,
  Plus,
} from "lucide-react";

import { supabase } from "../../lib/supabaseClient";
import AssessmentPreviewContent from "./AssessmentPreview"; // ← new import

const UNIT_PALETTE = [
  { badgeBg: "bg-[#EAF1FB]", badgeText: "text-[#12376B]", border: "border-[#D9E2F1]" },
  { badgeBg: "bg-[#EAF7F0]", badgeText: "text-[#166534]", border: "border-[#D7EBDD]" },
  { badgeBg: "bg-[#F3ECFB]", badgeText: "text-[#5B21B6]", border: "border-[#E7D8F7]" },
  { badgeBg: "bg-[#FFF3E2]", badgeText: "text-[#9A4B00]", border: "border-[#F3DEC4]" },
];

const isBunnyEmbed = (url) =>
  url && (url.includes("iframe.mediadelivery.net") || url.includes("bunnycdn.com"));

const cleanYouTubeEmbedUrl = (url) => {
  if (!url) return url;
  try {
    let videoId = null;
    if (url.includes("youtube.com/embed/")) {
      const match = url.match(/youtube\.com\/embed\/([^/?&]+)/);
      if (match) videoId = match[1];
    } else if (url.includes("youtu.be/")) {
      const match = url.match(/youtu\.be\/([^/?&]+)/);
      if (match) videoId = match[1];
    } else if (url.includes("youtube.com/watch")) {
      const u = new URL(url);
      videoId = u.searchParams.get("v");
    }
    if (!videoId) return url;
    const params = new URLSearchParams({
      rel: "0", modestbranding: "1", showinfo: "0",
      iv_load_policy: "3", cc_load_policy: "0", fs: "1",
      playsinline: "1", disablekb: "0", color: "white", autoplay: "0",
    });
    return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
  } catch { return url; }
};

const getVideoEmbedUrl = (item) => {
  const raw = item.embed_url || null;
  if (!raw) return null;
  if (isBunnyEmbed(raw)) return raw;
  return cleanYouTubeEmbedUrl(raw);
};

export default function SubjectDetails() {
  const navigate = useNavigate();
  const { subjectName } = useParams();
  const [searchParams] = useSearchParams();

  const subject  = decodeURIComponent(subjectName || "");
  const year     = searchParams.get("year");
  const semester = searchParams.get("semester");

  const [faculty,    setFaculty]    = useState(null);
  const [unitData,   setUnitData]   = useState({});
  const [loading,    setLoading]    = useState(true);
  const [openUnit,   setOpenUnit]   = useState(null);

  const [selectedPdf,        setSelectedPdf]        = useState(null);
  const [selectedVideo,      setSelectedVideo]      = useState(null);
  const [selectedAssessment, setSelectedAssessment] = useState(null);

  const [assessmentError, setAssessmentError] = useState(false);
  const [pdfError,        setPdfError]        = useState(false);

  useEffect(() => { loadSubjectDetails(); }, [subject, year, semester]);
  useEffect(() => { setPdfError(false); },        [selectedPdf]);
  useEffect(() => { setAssessmentError(false); }, [selectedAssessment]);

  const getEmbedUrl = (item, type) => {
    if (type === "video") return getVideoEmbedUrl(item);
    if (item.file_url) return item.file_url;
    return null;
  };

  const getFileUrl     = (item) => item.file_url || null;
  const getDownloadUrl = (item) => item.file_url || null;

  const formatUnit = (unit) => {
    if (!unit) return "Unit 1";
    if (String(unit).toLowerCase().includes("unit")) return unit;
    return `Unit ${unit}`;
  };

  const normalize = (item, type) => ({
    ...item, type,
    embed_url:    getEmbedUrl(item, type),
    file_url:     getFileUrl(item),
    download_url: getDownloadUrl(item),
  });

  const loadSubjectDetails = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data: facultyData, error: fErr } = await supabase
        .from("faculty").select("*").eq("id", user.id).single();
      if (fErr) throw fErr;
      setFaculty(facultyData);

      const base = (table) =>
        supabase.from(table).select("*")
          .eq("faculty_id", facultyData.id)
          .eq("subject", subject)
          .eq("year", year);

      let videosQ = base("videos");
      let pdfsQ   = base("pdfs");
      let assessQ = base("assessments");

      if (year !== "1" && semester) {
        videosQ = videosQ.eq("semester", semester);
        pdfsQ   = pdfsQ.eq("semester", semester);
        assessQ = assessQ.eq("semester", semester);
      }

      const { data: videos      = [] } = await videosQ.order("created_at", { ascending: false });
      const { data: pdfs        = [] } = await pdfsQ.order("created_at",   { ascending: false });
      const { data: assessments = [] } = await assessQ.order("created_at", { ascending: false });

      const allContent = [
        ...videos.map((i) => normalize(i, "video")),
        ...pdfs.map((i)   => normalize(i, "pdf")),
        ...assessments.map((i) => normalize(i, "assessment")),
      ];

      const grouped = {};
      allContent.forEach((item) => {
        const unit  = formatUnit(item.unit);
        const title = item.title || "Untitled";
        if (!grouped[unit])        grouped[unit] = {};
        if (!grouped[unit][title]) grouped[unit][title] = { video: null, pdf: null, assessment: null, unit, title };
        if (item.type === "video")      grouped[unit][title].video      = item;
        if (item.type === "pdf")        grouped[unit][title].pdf        = item;
        if (item.type === "assessment") grouped[unit][title].assessment = item;
      });

      setUnitData(grouped);
      const sorted = Object.keys(grouped).sort((a, b) => {
        const n = (s) => parseInt(s.replace(/\D/g, "")) || 0;
        return n(a) - n(b);
      });
      setOpenUnit(sorted[0] || null);
    } catch (error) {
      console.error("Error loading subject details:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleUnit = (unit) => setOpenUnit((prev) => (prev === unit ? null : unit));

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete "${item.title}"?`)) return;
    const table =
      item.type === "video"      ? "videos" :
      item.type === "pdf"        ? "pdfs"   : "assessments";
    const { error } = await supabase.from(table).delete().eq("id", item.id);
    if (error) { alert("Delete failed. Please try again."); return; }
    setUnitData((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      Object.keys(next).forEach((unit) => {
        Object.keys(next[unit]).forEach((title) => {
          const topic = next[unit][title];
          if (item.type === "video"      && topic.video?.id      === item.id) topic.video      = null;
          if (item.type === "pdf"        && topic.pdf?.id        === item.id) topic.pdf        = null;
          if (item.type === "assessment" && topic.assessment?.id === item.id) topic.assessment = null;
        });
      });
      return next;
    });
  };

  const handleUploadMissing = (topicMeta, uploadType) => {
    navigate("/faculty/upload", {
      state: {
        prefill: {
          subject,
          title:    topicMeta.title,
          unit:     topicMeta.unit,
          year,
          semester: semester || "",
          focusTab: uploadType,
        },
      },
    });
  };

  const getPageTitle = () =>
    year === "1"
      ? `${subject} — 1st Year`
      : `${subject} — Year ${year}, Semester ${semester}`;

  const sortedUnits = Object.keys(unitData).sort((a, b) => {
    const n = (s) => parseInt(s.replace(/\D/g, "")) || 0;
    return n(a) - n(b);
  });

  const totalResources = sortedUnits.reduce((total, unit) => {
    return total + Object.values(unitData[unit]).reduce((sum, topic) => {
      return sum + (topic.video ? 1 : 0) + (topic.pdf ? 1 : 0) + (topic.assessment ? 1 : 0);
    }, 0);
  }, 0);

  return (
    <div className="flex h-screen bg-[#F8F5EF] overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar />

        <div className="flex-1 overflow-y-auto">
          {/* ── Header ── */}
          <div className="px-6 pt-6 pb-4 max-w-7xl mx-auto w-full">
            <button
              onClick={() => navigate("/faculty/subjects")}
              className="mb-4 inline-flex items-center gap-2 text-[#12376B] hover:text-[#0A2344] text-sm font-semibold transition-colors"
            >
              <ArrowLeft size={16} />
              Back to Subjects
            </button>

            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-[#101828] capitalize tracking-tight">
                  Module Curriculum
                </h1>
                <p className="mt-1 text-sm text-[#5F5548] font-medium">
                  {sortedUnits.length} units · {totalResources} resources
                </p>
                <p className="mt-1 text-sm text-[#6B7280]">{getPageTitle()}</p>
              </div>

              {faculty && (
                <div className="bg-white border border-[#E5DCCF] rounded-xl px-4 py-2.5 shadow-sm min-w-[210px]">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#12376B] text-white flex items-center justify-center font-bold uppercase">
                      {faculty.name?.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#101828] capitalize truncate">{faculty.name}</p>
                      <p className="text-xs text-[#6B7280] truncate">{faculty.department}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Content ── */}
          <div className="px-6 pb-8 max-w-7xl mx-auto w-full">
            {loading ? (
              <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-[#E5DCCF] text-[#6B7280] text-sm">
                Loading subject content…
              </div>
            ) : sortedUnits.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-[#E5DCCF]">
                <div className="text-4xl mb-3">📭</div>
                <p className="text-[#475467] font-semibold">No content uploaded yet for this subject.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-[#E5DCCF] shadow-sm overflow-hidden">
                {sortedUnits.map((unit, unitIdx) => {
                  const pal      = UNIT_PALETTE[unitIdx % UNIT_PALETTE.length];
                  const topics   = unitData[unit];
                  const topicList = Object.keys(topics);
                  const isOpen   = openUnit === unit;

                  const videoCount  = topicList.filter((t) => topics[t].video).length;
                  const pdfCount    = topicList.filter((t) => topics[t].pdf).length;
                  const assessCount = topicList.filter((t) => topics[t].assessment).length;
                  const itemCount   = videoCount + pdfCount + assessCount;

                  return (
                    <div key={unit} className="border-b border-[#E5DCCF] last:border-b-0">
                      <button
                        type="button"
                        onClick={() => toggleUnit(unit)}
                        className="w-full flex items-center justify-between gap-4 px-5 py-4 bg-white hover:bg-[#FBF8F3] transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-10 h-10 rounded-lg ${pal.badgeBg} ${pal.badgeText} flex items-center justify-center text-sm font-extrabold`}>
                            {String(unitIdx + 1).padStart(2, "0")}
                          </div>
                          <div className="text-left min-w-0">
                            <h2 className="text-base md:text-lg font-extrabold text-[#101828] truncate">{unit}</h2>
                            <p className="text-xs text-[#6B7280] mt-0.5">{topicList.length} topics · {itemCount} items</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="hidden sm:inline-flex text-xs font-bold text-[#5F5548]">{itemCount} items</span>
                          <ChevronDown
                            size={19}
                            className={`text-[#5F5548] transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                          />
                        </div>
                      </button>

                      {isOpen && (
                        <div className="border-t border-[#E5DCCF] bg-[#FFFEFB]">
                          {topicList.map((title, topicIdx) => {
                            const row = topics[title];
                            return (
                              <TopicBlock
                                key={title}
                                title={title}
                                topicNumber={topicIdx + 1}
                                row={row}
                                pal={pal}
                                onViewVideo={() => setSelectedVideo(row.video)}
                                onViewPdf={() => setSelectedPdf(row.pdf)}
                                onViewAssess={() => setSelectedAssessment(row.assessment)}
                                onDelete={handleDelete}
                                onUploadMissing={handleUploadMissing}
                              />
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── PDF Viewer Modal ── */}
      {selectedPdf && (
        <ViewerModal
          title={selectedPdf.title}
          subtitle="Lecture Note · PDF"
          onClose={() => { setSelectedPdf(null); setPdfError(false); }}
          fileUrl={selectedPdf.file_url}
          downloadUrl={selectedPdf.download_url}
          downloadLabel="Download PDF"
        >
          {pdfError ? (
            <PreviewError fileUrl={selectedPdf.file_url} downloadUrl={selectedPdf.download_url} downloadLabel="Download PDF" />
          ) : selectedPdf.embed_url ? (
            <iframe key={selectedPdf.id} src={selectedPdf.embed_url} title={selectedPdf.title}
              className="w-full h-full" allow="autoplay" onError={() => setPdfError(true)} style={{ border: "none" }} />
          ) : (
            <NoPreview fileUrl={selectedPdf.file_url} />
          )}
        </ViewerModal>
      )}

      {/* ── Video Viewer Modal ── */}
      {selectedVideo && (
        <ViewerModal
          title={selectedVideo.title}
          subtitle="Video Lecture"
          onClose={() => setSelectedVideo(null)}
        >
          <VideoPlayer
            embedUrl={selectedVideo.embed_url}
            title={selectedVideo.title}
            videoId={selectedVideo.id}
            isBunny={isBunnyEmbed(selectedVideo.embed_url)}
          />
        </ViewerModal>
      )}

      {/* ── Assessment Viewer Modal ── */}
      {selectedAssessment && (
        <ViewerModal
          title={selectedAssessment.title}
          subtitle="Assessment"
          onClose={() => { setSelectedAssessment(null); setAssessmentError(false); }}
          fileUrl={selectedAssessment.file_url}
          downloadUrl={selectedAssessment.download_url}
          downloadLabel="Download File"
        >
          {/*
            ↓ Replaces the old iframe + assessmentError block.
              AssessmentPreviewContent auto-detects .xlsx / .docx / .txt from
              the file_url and renders natively. PDFs and unknown types fall
              back to an iframe exactly as before.
          */}
          <AssessmentPreviewContent
            item={selectedAssessment}
            onIframeError={() => setAssessmentError(true)}
          />
        </ViewerModal>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VideoPlayer
// ─────────────────────────────────────────────────────────────────────────────
function VideoPlayer({ embedUrl, title, videoId, isBunny }) {
  if (!embedUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black text-gray-400 text-sm">
        No video URL available.
      </div>
    );
  }
  if (isBunny) {
    return (
      <div className="w-full h-full bg-black flex items-center justify-center">
        <iframe key={videoId} src={embedUrl} title={title} className="w-full h-full"
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          allowFullScreen style={{ border: "none", display: "block" }} />
      </div>
    );
  }
  return (
    <div className="w-full h-full bg-black flex items-center justify-center">
      <iframe key={videoId} src={embedUrl} title={title} className="w-full h-full"
        allow="fullscreen; encrypted-media" allowFullScreen
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
        referrerPolicy="strict-origin" style={{ border: "none", display: "block" }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TopicBlock
// ─────────────────────────────────────────────────────────────────────────────
function TopicBlock({ title, topicNumber, row, pal, onViewVideo, onViewPdf, onViewAssess, onDelete, onUploadMissing }) {
  const slots = [
    {
      type:      "video",
      item:      row.video,
      label:     "Video",
      icon:      <PlayCircle size={13} />,
      onView:    onViewVideo,
      canUpload: false,
      uploadTab: null,
      presentClass: "bg-[#EAF1FB] text-[#12376B] hover:bg-[#DCE8F8] border-[#D6E2F2]",
      missingClass: "bg-[#F5F8FF] text-[#94A3B8] border-[#CBD5E1] border-dashed cursor-default",
      dividerColor: "bg-[#B8D5E8]",
    },
    {
      type:      "pdf",
      item:      row.pdf,
      label:     "Lectures",
      icon:      <FileText size={13} />,
      onView:    onViewPdf,
      canUpload: true,
      uploadTab: "pdf",
      presentClass: "bg-[#FFF4DF] text-[#9A5B00] hover:bg-[#FFE8BD] border-[#F3D8A7]",
      missingClass: "bg-[#FFFBF0] text-[#B45309] border-[#FCD34D] border-dashed",
      dividerColor: "bg-[#E8CCA7]",
    },
    {
      type:      "assessment",
      item:      row.assessment,
      label:     "Assessment",
      icon:      <ClipboardList size={13} />,
      onView:    onViewAssess,
      canUpload: true,
      uploadTab: "assessment",
      presentClass: "bg-[#EAF7F0] text-[#166534] hover:bg-[#DDF0E5] border-[#CFE8D8]",
      missingClass: "bg-[#F0FDF4] text-[#16A34A] border-[#86EFAC] border-dashed",
      dividerColor: "bg-[#BFE8D7]",
    },
  ];

  return (
    <div className="px-5 py-2.5 border-b border-[#EEE5D8] last:border-b-0 hover:bg-[#FBF8F3] transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <span className={`w-7 h-7 rounded-md ${pal.badgeBg} ${pal.badgeText} flex items-center justify-center text-[11px] font-extrabold flex-shrink-0`}>
          {String(topicNumber).padStart(2, "0")}
        </span>

        <h3 className="text-sm md:text-[14px] font-black text-[#0F172A] uppercase tracking-wide truncate flex-1 min-w-0">
          {title}
        </h3>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {slots.map(({ type, item, label, icon, onView, canUpload, uploadTab, presentClass, missingClass, dividerColor }) => {
            if (item) {
              return (
                <div key={type} className={`flex items-center rounded-md border text-[11px] font-bold overflow-hidden w-[120px] ${presentClass}`}>
                  <button
                    onClick={onView}
                    className="flex-1 min-w-0 flex items-center justify-center gap-1 px-2 py-1.5 transition-colors hover:brightness-95"
                  >
                    <span className="flex-shrink-0">{icon}</span>
                    <span className="truncate">{label}</span>
                  </button>
                  <span className={`w-px self-stretch ${dividerColor}`} />
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(item); }}
                    className="px-1.5 py-1.5 text-[#B42318] hover:bg-[#FEE4E2] transition-colors flex items-center flex-shrink-0"
                    title={`Delete ${label}`}
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              );
            }

            return (
              <div key={type} className="w-[120px]">
                {canUpload ? (
                  <button
                    onClick={() => onUploadMissing({ unit: row.unit, title: row.title }, uploadTab)}
                    className={`w-full flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-[11px] font-semibold border transition-colors hover:opacity-80 ${missingClass}`}
                    title={`Upload ${label} for this topic`}
                  >
                    <Plus size={11} strokeWidth={2.5} />
                    <span className="truncate">{label}</span>
                  </button>
                ) : (
                  <span className={`w-full flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-[11px] font-semibold border select-none ${missingClass}`}>
                    <span className="flex-shrink-0">{icon}</span>
                    <span className="opacity-50 truncate">No {label}</span>
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ViewerModal
// ─────────────────────────────────────────────────────────────────────────────
function ViewerModal({ title, subtitle, onClose, fileUrl, downloadUrl, downloadLabel, children }) {
  return (
    <div className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-4">
      <div className="w-full h-full rounded-2xl overflow-hidden flex flex-col shadow-2xl bg-[#111827] border border-[#30363D]">
        <div className="flex items-center justify-between px-6 py-4 bg-[#0B2447] flex-shrink-0">
          <div className="min-w-0 mr-4">
            <h2 className="text-white text-lg font-bold truncate">{title}</h2>
            {subtitle && <p className="text-blue-200 text-xs mt-0.5 font-medium">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {fileUrl && (
              <a href={fileUrl} target="_blank" rel="noreferrer"
                className="hidden sm:flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg text-xs font-semibold transition-colors">
                <ExternalLink size={13} /> Open
              </a>
            )}
            {downloadUrl && (
              <a href={downloadUrl} target="_blank" rel="noreferrer"
                className="hidden sm:flex items-center gap-1.5 bg-[#F4C542] hover:bg-[#E8B923] text-black px-3 py-2 rounded-lg text-xs font-bold transition-colors">
                <Download size={13} /> {downloadLabel || "Download"}
              </a>
            )}
            <button onClick={onClose}
              className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden bg-black">{children}</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PreviewError / NoPreview
// ─────────────────────────────────────────────────────────────────────────────
function PreviewError({ fileUrl, downloadUrl, downloadLabel }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-5 text-white p-8 bg-[#202020]">
      <div className="text-5xl">📄</div>
      <p className="text-lg font-bold">Preview unavailable</p>
      <p className="text-gray-400 text-sm text-center max-w-sm">
        This file requires Google sign-in to preview inline. Open or download it directly.
      </p>
      <div className="flex gap-3 flex-wrap justify-center">
        {fileUrl && (
          <a href={fileUrl} target="_blank" rel="noreferrer"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors">
            <ExternalLink size={15} /> Open in Drive
          </a>
        )}
        {downloadUrl && (
          <a href={downloadUrl} target="_blank" rel="noreferrer"
            className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-black px-5 py-2.5 rounded-xl font-black text-sm transition-colors">
            <Download size={15} /> {downloadLabel || "Download"}
          </a>
        )}
      </div>
    </div>
  );
}

function NoPreview({ fileUrl }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-white bg-[#202020]">
      <p className="text-gray-400 text-sm">No preview URL available.</p>
      {fileUrl && (
        <a href={fileUrl} target="_blank" rel="noreferrer"
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors">
          Open in Drive
        </a>
      )}
    </div>
  );
}