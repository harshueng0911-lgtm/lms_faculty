import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2 } from "lucide-react";

import Sidebar from "../../components/layout/Sidebar";
import Topbar from "../../components/layout/Topbar";

import { supabase } from "../../lib/supabaseClient";

// ─── Normalize semester to a consistent internal value ───────────────────────
// DB may store: null, "", "1", "2", 1, 2  (mixed due to Year 1 having no semester)
// We always normalize to: null (Year 1) | "1" | "2" (Years 2-4)
const normalizeSemester = (raw) => {
  if (raw === null || raw === undefined || String(raw).trim() === "") return null;
  return String(raw).trim();
};

export default function MySubjects() {
  const navigate = useNavigate();

  const [faculty, setFaculty]               = useState(null);
  const [allSubjects, setAllSubjects]       = useState([]);
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [loading, setLoading]               = useState(true);
  const [deletingKey, setDeletingKey]       = useState(null);

  const [searchQuery, setSearchQuery]       = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");

  useEffect(() => { loadSubjects(); }, []);

  useEffect(() => { filterSubjects(); }, [searchQuery, selectedFilter, allSubjects]);

  // ── Fetch all three tables and group into subject cards ──────────────────────
  const fetchAndGroup = async (facultyId) => {
    const [
      { data: videos      = [] },
      { data: pdfs        = [] },
      { data: assessments = [] },
    ] = await Promise.all([
      supabase.from("videos")      .select("*").eq("faculty_id", facultyId).order("created_at", { ascending: false }),
      supabase.from("pdfs")        .select("*").eq("faculty_id", facultyId).order("created_at", { ascending: false }),
      supabase.from("assessments") .select("*").eq("faculty_id", facultyId).order("created_at", { ascending: false }),
    ]);

    const allContent = [
      ...videos     .map((i) => ({ ...i, type: "video"      })),
      ...pdfs       .map((i) => ({ ...i, type: "pdf"        })),
      ...assessments.map((i) => ({ ...i, type: "assessment" })),
    ];

    const grouped = {};

    allContent.forEach((i) => {
      const subject  = i.subject || "Unknown Subject";
      const year     = String(i.year);
      const semester = normalizeSemester(i.semester); // null | "1" | "2"
      const key      = `${year}__${semester ?? "null"}__${subject}`;

      if (!grouped[key]) {
        grouped[key] = { subject, year, semester, videos: 0, notes: 0, assessments: 0 };
      }

      if (i.type === "video")      grouped[key].videos      += 1;
      if (i.type === "pdf")        grouped[key].notes        += 1;
      if (i.type === "assessment") grouped[key].assessments += 1;
    });

    return Object.values(grouped);
  };

  const loadSubjects = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data: facultyData, error: fErr } = await supabase
        .from("faculty").select("*").eq("id", user.id).single();
      if (fErr) throw fErr;

      setFaculty(facultyData);
      const grouped = await fetchAndGroup(facultyData.id);
      setAllSubjects(grouped);
    } catch (err) {
      console.error("Load subjects error:", err);
    } finally {
      setLoading(false);
    }
  };

  // ── Filtering ────────────────────────────────────────────────────────────────
  const filterSubjects = () => {
    let result = [...allSubjects];

    // Text search
    if (searchQuery.trim() !== "") {
      result = result.filter((item) =>
        item.subject.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Year / Semester dropdown
    if (selectedFilter !== "All") {
      if (selectedFilter === "1") {
        // Year 1 — semester is always null after normalization
        result = result.filter(
          (item) => item.year === "1" && item.semester === null
        );
      } else {
        // e.g. "2-1" → year "2", semester "1"
        const [filterYear, filterSemester] = selectedFilter.split("-");
        result = result.filter(
          (item) => item.year === filterYear && item.semester === filterSemester
        );
      }
    }

    setFilteredSubjects(result);
  };

  // ── Delete all content rows for a subject card ───────────────────────────────
  const deleteSubject = async (item) => {
    const label = getYearLabel(item);
    const confirmed = window.confirm(
      `Delete ALL content for "${item.subject}" (${label})?\n\n` +
      `• ${item.videos} Video(s)\n` +
      `• ${item.notes} Lecture Note(s)\n` +
      `• ${item.assessments} Assessment(s)\n\n` +
      `This cannot be undone.`
    );
    if (!confirmed) return;

    const key = getItemKey(item);
    setDeletingKey(key);

    try {
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr || !user) throw new Error("Not authenticated");

      const { data: facultyData, error: facErr } = await supabase
        .from("faculty").select("id").eq("id", user.id).single();
      if (facErr) throw new Error("Could not verify faculty: " + facErr.message);

      const facultyId      = facultyData.id;
      const targetSubject  = item.subject;
      const targetYear     = Number(item.year);
      // item.semester is already normalized: null | "1" | "2"
      const isYear1        = item.semester === null;
      const targetSemester = isYear1 ? null : Number(item.semester);

      console.log("🗑️ Deleting:", { facultyId, subject: targetSubject, year: targetYear, semester: targetSemester });

      // Helper: delete from one table with correct semester matching
      const deleteFrom = async (table) => {
        const base = () =>
          supabase
            .from(table)
            .delete()
            .eq("faculty_id", facultyId)
            .eq("subject",    targetSubject)
            .eq("year",       targetYear);

        if (isYear1) {
          // Year 1: semester may be stored as NULL or "" (empty string) depending
          // on when the row was uploaded. Delete both variants to be safe.
          const { error: e1 } = await base().is("semester", null);
          if (e1) throw new Error(`${table} (null semester): ${e1.message}`);

          const { error: e2 } = await base().eq("semester", "");
          if (e2) throw new Error(`${table} (empty semester): ${e2.message}`);
        } else {
          // Years 2–4: match exact numeric semester
          const { error } = await base().eq("semester", targetSemester);
          if (error) throw new Error(`${table}: ${error.message}`);
        }

        console.log(`✅ Deleted from ${table}`);
      };

      await deleteFrom("videos");
      await deleteFrom("pdfs");
      await deleteFrom("assessments");

      // Immediately remove card from UI (optimistic update)
      setAllSubjects((prev) => prev.filter((s) => getItemKey(s) !== key));

      // Silently resync from DB in the background
      fetchAndGroup(facultyId).then((fresh) => setAllSubjects(fresh));

    } catch (err) {
      console.error("Delete error:", err);
      alert(`Error deleting subject:\n${err.message}`);
      await loadSubjects(); // restore correct state on error
    } finally {
      setDeletingKey(null);
    }
  };

  // ── Key / label / color helpers ──────────────────────────────────────────────
  const getItemKey = (item) =>
    `${item.year}__${item.semester ?? "null"}__${item.subject}`;

  const getYearLabel = (item) => {
    if (item.year === "1") return "1st Year";
    if (item.year === "2") return `2nd Year — Semester ${item.semester}`;
    if (item.year === "3") return `3rd Year — Semester ${item.semester}`;
    if (item.year === "4") return `4th Year — Semester ${item.semester}`;
    return `Year ${item.year}`;
  };

  // Deterministic color per subject name — same subject always gets same color
  const getColorClass = (subject) => {
    const palette = [
      "from-indigo-500 to-indigo-600",
      "from-blue-500   to-blue-600",
      "from-cyan-500   to-cyan-600",
      "from-teal-500   to-teal-600",
      "from-green-500  to-green-600",
      "from-pink-500   to-pink-600",
      "from-rose-500   to-rose-600",
      "from-orange-500 to-orange-600",
      "from-amber-500  to-amber-600",
      "from-purple-500 to-purple-600",
    ];
    let hash = 0;
    for (const c of subject) hash = (hash * 31 + c.charCodeAt(0)) >>> 0;
    return palette[hash % palette.length];
  };

  const openDetails = (item) => {
    navigate(
      `/faculty/my-subjects/${encodeURIComponent(item.subject)}` +
      `?year=${item.year}&semester=${item.semester ?? ""}`
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-[#f6f8fb] overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar />

        <div className="flex-1 overflow-y-auto p-6">

          {/* Page header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Subjects</h1>
            <p className="text-gray-500 text-sm">Manage subject-wise academic content</p>
          </div>

          {/* Faculty card */}
          {faculty && (
            <div className="bg-white rounded-2xl border shadow-sm p-5 mb-8 flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold uppercase">
                {faculty.name?.charAt(0)}
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-lg capitalize">{faculty.name}</h2>
                <p className="text-gray-500 text-sm">{faculty.department}</p>
              </div>
            </div>
          )}

          {/* Search + filter bar */}
          <div className="mb-8 flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Search subjects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-3 border rounded-xl bg-white outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="px-4 py-3 border rounded-xl bg-white outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="All">All Years</option>
              <option value="1">1st Year</option>
              <option value="2-1">2nd Year — Semester 1</option>
              <option value="2-2">2nd Year — Semester 2</option>
              <option value="3-1">3rd Year — Semester 1</option>
              <option value="3-2">3rd Year — Semester 2</option>
              <option value="4-1">4th Year — Semester 1</option>
              <option value="4-2">4th Year — Semester 2</option>
            </select>
          </div>

          {/* Subject grid */}
          {loading ? (
            <div className="bg-white rounded-2xl p-10 text-center border shadow-sm text-gray-500 text-sm">
              Loading subjects…
            </div>
          ) : filteredSubjects.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border shadow-sm">
              <div className="text-5xl mb-4">📚</div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">No Subjects Found</h2>
              <p className="text-gray-500 mb-6 text-sm">
                Upload videos, lecture notes and assessments to see them here.
              </p>
              <button
                onClick={() => navigate("/faculty/upload")}
                className="px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold text-sm"
              >
                Upload Content
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredSubjects.map((item) => {
                const key        = getItemKey(item);
                const isDeleting = deletingKey === key;

                return (
                  <div
                    key={key}
                    className="bg-white rounded-2xl overflow-hidden shadow-sm border relative"
                  >
                    {/* Delete button */}
                    <button
                      type="button"
                      title="Delete all content for this subject"
                      disabled={isDeleting}
                      onClick={(e) => { e.stopPropagation(); deleteSubject(item); }}
                      className="absolute top-3 right-3 z-50 w-9 h-9 rounded-full flex items-center justify-center shadow-lg transition-opacity"
                      style={{
                        backgroundColor: isDeleting ? "#fca5a5" : "#ef4444",
                        color: "#fff",
                        cursor: isDeleting ? "not-allowed" : "pointer",
                        border: "none",
                      }}
                    >
                      {isDeleting ? (
                        <div style={{
                          width: 16, height: 16,
                          border: "2px solid #fff",
                          borderTopColor: "transparent",
                          borderRadius: "50%",
                          animation: "spin 0.7s linear infinite",
                        }} />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>

                    {/* Gradient header */}
                    <div
                      className={`bg-gradient-to-r ${getColorClass(item.subject)} h-40 flex items-center justify-center`}
                      style={{ pointerEvents: "none" }}
                    >
                      <div className="text-center text-white px-4">
                        <div className="text-5xl mb-3">📚</div>
                        <h2 className="text-2xl font-bold capitalize leading-tight">
                          {item.subject}
                        </h2>
                        <p className="text-sm mt-2 opacity-90">{getYearLabel(item)}</p>
                      </div>
                    </div>

                    {/* Card body */}
                    <div className="p-6">
                      <div className="space-y-2 mb-6 text-gray-700 text-sm">
                        <div className="flex items-center gap-2">
                          <span>🎥</span>
                          <span>{item.videos} {item.videos === 1 ? "Video" : "Videos"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span>📄</span>
                          <span>{item.notes} {item.notes === 1 ? "Lecture Note" : "Lecture Notes"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span>📝</span>
                          <span>{item.assessments} {item.assessments === 1 ? "Assessment" : "Assessments"}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => openDetails(item)}
                        className="w-full px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold transition-colors text-sm"
                      >
                        Open Details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}