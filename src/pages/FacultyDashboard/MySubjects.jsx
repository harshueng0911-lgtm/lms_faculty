import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2 } from "lucide-react";

import Sidebar from "../../components/layout/Sidebar";
import Topbar from "../../components/layout/Topbar";
import { supabase } from "../../lib/supabaseClient";

const normalizeSemester = (raw) => {
  if (
    raw === null ||
    raw === undefined ||
    String(raw).trim() === "" ||
    String(raw).trim().toLowerCase() === "null"
  ) {
    return null;
  }

  return String(raw).trim();
};

export default function MySubjects() {
  const navigate = useNavigate();

  const [faculty, setFaculty] = useState(null);
  const [allSubjects, setAllSubjects] = useState([]);
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingKey, setDeletingKey] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");

  useEffect(() => {
    loadSubjects();
  }, []);

  useEffect(() => {
    filterSubjects();
  }, [searchQuery, selectedFilter, allSubjects]);

  const fetchAndGroup = async (facultyId) => {
    const [
      { data: videos = [] },
      { data: pdfs = [] },
      { data: assessments = [] },
    ] = await Promise.all([
      supabase
        .from("videos")
        .select("*")
        .eq("faculty_id", facultyId)
        .order("created_at", { ascending: false }),

      supabase
        .from("pdfs")
        .select("*")
        .eq("faculty_id", facultyId)
        .order("created_at", { ascending: false }),

      supabase
        .from("assessments")
        .select("*")
        .eq("faculty_id", facultyId)
        .order("created_at", { ascending: false }),
    ]);

    const allContent = [
      ...videos.map((item) => ({ ...item, type: "video" })),
      ...pdfs.map((item) => ({ ...item, type: "pdf" })),
      ...assessments.map((item) => ({ ...item, type: "assessment" })),
    ];

    const grouped = {};

    allContent.forEach((item) => {
      const subject = (item.subject || "Unknown Subject").trim();
      const year = String(item.year || "");
      const semester = normalizeSemester(item.semester);

      const key =
        year === "1"
          ? `${subject}__1`
          : `${subject}__${year}__${semester}`;

      if (!grouped[key]) {
        grouped[key] = {
          subject,
          year,
          semester,
          videos: 0,
          notes: 0,
          assessments: 0,
        };
      }

      if (item.type === "video") grouped[key].videos += 1;
      if (item.type === "pdf") grouped[key].notes += 1;
      if (item.type === "assessment") grouped[key].assessments += 1;
    });

    return Object.values(grouped);
  };

  const loadSubjects = async () => {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data: facultyData, error } = await supabase
        .from("faculty")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      setFaculty(facultyData);

      const groupedSubjects = await fetchAndGroup(facultyData.id);
      setAllSubjects(groupedSubjects);
    } catch (err) {
      console.error("Load subjects error:", err);
    } finally {
      setLoading(false);
    }
  };

  const filterSubjects = () => {
    let result = [...allSubjects];

    if (searchQuery.trim()) {
      result = result.filter((item) =>
        item.subject.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedFilter !== "All") {
      if (selectedFilter === "1") {
        result = result.filter((item) => String(item.year) === "1");
      } else {
        const [year, semester] = selectedFilter.split("-");

        result = result.filter(
          (item) =>
            String(item.year) === year &&
            String(item.semester) === semester
        );
      }
    }

    setFilteredSubjects(result);
  };

  const getYearLabel = (item) => {
    if (String(item.year) === "1") return "1st Year";
    if (String(item.year) === "2") return `2nd Year — Semester ${item.semester}`;
    if (String(item.year) === "3") return `3rd Year — Semester ${item.semester}`;
    if (String(item.year) === "4") return `4th Year — Semester ${item.semester}`;
    return "Academic Content";
  };

  const getItemKey = (item) =>
    String(item.year) === "1"
      ? `${item.subject}__1`
      : `${item.subject}__${item.year}__${item.semester}`;

  const deleteSubject = async (item) => {
    const confirmed = window.confirm(
      `Delete all content for "${item.subject}" (${getYearLabel(item)})?`
    );

    if (!confirmed) return;

    const key = getItemKey(item);
    setDeletingKey(key);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const facultyId = user.id;
      const subject = item.subject;
      const year = Number(item.year);

      const deleteFromTable = async (table) => {
        let query = supabase
          .from(table)
          .delete()
          .eq("faculty_id", facultyId)
          .eq("subject", subject)
          .eq("year", year);

        if (year === 1) {
          const { error } = await query.is("semester", null);
          if (error) throw error;
        } else {
          const { error } = await query.eq("semester", Number(item.semester));
          if (error) throw error;
        }
      };

      await deleteFromTable("videos");
      await deleteFromTable("pdfs");
      await deleteFromTable("assessments");

      setAllSubjects((prev) =>
        prev.filter((subjectItem) => getItemKey(subjectItem) !== key)
      );
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Delete failed");
      loadSubjects();
    } finally {
      setDeletingKey(null);
    }
  };

  const getColorClass = (subject) => {
    const palette = [
      "from-indigo-500 to-indigo-600",
      "from-blue-500 to-blue-600",
      "from-cyan-500 to-cyan-600",
      "from-green-500 to-green-600",
      "from-pink-500 to-pink-600",
      "from-purple-500 to-purple-600",
      "from-orange-500 to-orange-600",
    ];

    let hash = 0;

    for (const c of subject) {
      hash = (hash * 31 + c.charCodeAt(0)) >>> 0;
    }

    return palette[hash % palette.length];
  };

  const openDetails = (item) => {
    navigate(
      `/faculty/my-subjects/${encodeURIComponent(item.subject)}?year=${item.year}&semester=${item.semester || ""}`
    );
  };

  return (
    <div className="flex h-screen bg-[#f6f8fb] overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar />

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">My Subjects</h1>
            <p className="text-gray-500 text-sm mt-2">
              Manage subject-wise academic content
            </p>
          </div>

          {faculty && (
            <div className="bg-white rounded-2xl border shadow-sm p-5 mb-8 flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold uppercase">
                {faculty.name?.charAt(0)}
              </div>

              <div>
                <h2 className="font-bold text-lg">{faculty.name}</h2>
                <p className="text-gray-500 text-sm">{faculty.department}</p>
              </div>
            </div>
          )}

          <div className="mb-8 flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Search subjects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-3 border rounded-xl bg-white outline-none focus:ring-2 focus:ring-blue-500"
            />

            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="px-4 py-3 border rounded-xl bg-white outline-none focus:ring-2 focus:ring-blue-500"
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

          {loading ? (
            <div className="bg-white rounded-2xl p-10 text-center border shadow-sm">
              Loading subjects...
            </div>
          ) : filteredSubjects.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border shadow-sm">
              No subjects found
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredSubjects.map((item) => {
                const key = getItemKey(item);

                return (
                  <div
                    key={key}
                    className="bg-white rounded-2xl overflow-hidden shadow-sm border relative"
                  >
                    <button
                      onClick={() => deleteSubject(item)}
                      disabled={deletingKey === key}
                      className="absolute top-3 right-3 z-50 w-9 h-9 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600"
                    >
                      <Trash2 size={16} />
                    </button>

                    <div
                      className={`bg-gradient-to-r ${getColorClass(
                        item.subject
                      )} h-40 flex items-center justify-center`}
                    >
                      <div className="text-center text-white px-4">
                        <div className="text-5xl mb-3">📚</div>
                        <h2 className="text-2xl font-bold capitalize">
                          {item.subject}
                        </h2>
                        <p className="text-sm mt-2">{getYearLabel(item)}</p>
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="space-y-2 mb-6 text-sm text-gray-700">
                        <div>🎥 {item.videos} Videos</div>
                        <div>📄 {item.notes} Lecture Notes</div>
                        <div>📝 {item.assessments} Assessments</div>
                      </div>

                      <button
                        onClick={() => openDetails(item)}
                        className="w-full px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold"
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
    </div>
  );
}