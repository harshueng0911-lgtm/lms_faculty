import { useEffect, useMemo, useState } from "react";
import Sidebar from "../../components/layout/Sidebar";
import Topbar from "../../components/layout/Topbar";
import { supabase } from "../../lib/supabaseClient";

export default function StudentPerformance() {
  const [filter, setFilter] = useState({
    yearSemester: "all",
    subject: "",
    unit: "",
    status: "all",
  });

  const [faculty, setFaculty] = useState(null);
  const [students, setStudents] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  const yearSemesterOptions = [
    { label: "All Years", value: "all", year: "", semester: "" },
    { label: "1st Year", value: "1-1", year: "1", semester: "1" },
    { label: "2nd Year - Semester 1", value: "2-1", year: "2", semester: "1" },
    { label: "2nd Year - Semester 2", value: "2-2", year: "2", semester: "2" },
    { label: "3rd Year - Semester 1", value: "3-1", year: "3", semester: "1" },
    { label: "3rd Year - Semester 2", value: "3-2", year: "3", semester: "2" },
    { label: "4th Year - Semester 1", value: "4-1", year: "4", semester: "1" },
    { label: "4th Year - Semester 2", value: "4-2", year: "4", semester: "2" },
  ];

  useEffect(() => {
    fetchPerformanceData();
  }, []);

  const selectedYearSemester = useMemo(() => {
    return (
      yearSemesterOptions.find((item) => item.value === filter.yearSemester) ||
      yearSemesterOptions[0]
    );
  }, [filter.yearSemester]);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);

      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError) throw authError;

      const authUserId = authData?.user?.id;

      if (!authUserId) return;

      const { data: facultyData, error: facultyError } = await supabase
        .from("faculty")
        .select("*")
        .eq("id", authUserId)
        .single();

      if (facultyError) throw facultyError;

      setFaculty(facultyData);

      const { data: studentData, error: studentError } = await supabase
        .from("students")
        .select("*")
        .eq("department", facultyData.department)
        .order("full_name", { ascending: true });

      if (studentError) throw studentError;

      setStudents(studentData || []);

      const { data: attemptData, error: attemptError } = await supabase
        .from("student_attempts")
        .select("*")
        .eq("department", facultyData.department)
        .order("submitted_at", { ascending: false });

      if (attemptError) throw attemptError;

      setAttempts(attemptData || []);
    } catch (err) {
      console.error("Student performance fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatus = (score, total) => {
    if (
      score === null ||
      score === undefined ||
      total === null ||
      total === undefined ||
      Number(total) === 0
    ) {
      return "Not Attempted";
    }

    const percentage = (Number(score) / Number(total)) * 100;
    return percentage >= 50 ? "Pass" : "Fail";
  };

  const getStatusClass = (status) => {
    if (status === "Pass") {
      return "bg-green-50 text-green-700 border-green-200";
    }

    if (status === "Fail") {
      return "bg-red-50 text-red-700 border-red-200";
    }

    return "bg-gray-100 text-gray-600 border-gray-200";
  };

  const normalizeText = (value) =>
    String(value || "").trim().toLowerCase();

  const performanceRows = useMemo(() => {
    let rows = [];

    students.forEach((student) => {
      const studentAttempts = attempts.filter(
        (attempt) => String(attempt.student_id) === String(student.id)
      );

      if (studentAttempts.length === 0) {
        rows.push({
          studentId: student.id,
          studentName: student.full_name || "Unknown",
          email: student.email || "-",
          hallTicket: student.hall_ticket || "-",
          year: student.year || "-",
          semester: student.semester || "-",
          subject: "-",
          unit: "-",
          score: null,
          total: null,
          submittedAt: null,
          status: "Not Attempted",
        });
      } else {
        studentAttempts.forEach((attempt) => {
          rows.push({
            studentId: student.id,
            studentName: student.full_name || "Unknown",
            email: student.email || "-",
            hallTicket: student.hall_ticket || "-",
            year: attempt.year || student.year || "-",
            semester: attempt.semester || student.semester || "-",
            subject: attempt.subject || "-",
            unit: attempt.unit || "-",
            score: attempt.score,
            total: attempt.total,
            submittedAt: attempt.submitted_at,
            status: getStatus(attempt.score, attempt.total),
          });
        });
      }
    });

    return rows.filter((row) => {
      const matchesYear =
        filter.yearSemester === "all" ||
        (String(row.year) === selectedYearSemester.year &&
          String(row.semester) === selectedYearSemester.semester);

      const matchesSubject =
        !filter.subject ||
        normalizeText(row.subject).includes(normalizeText(filter.subject));

      const matchesUnit =
        !filter.unit ||
        normalizeText(row.unit).includes(normalizeText(filter.unit));

      const matchesStatus =
        filter.status === "all" || row.status === filter.status;

      return (
        matchesYear &&
        matchesSubject &&
        matchesUnit &&
        matchesStatus
      );
    });
  }, [students, attempts, filter, selectedYearSemester]);

  const summary = useMemo(() => {
    return {
      total: performanceRows.length,
      pass: performanceRows.filter((r) => r.status === "Pass").length,
      fail: performanceRows.filter((r) => r.status === "Fail").length,
      notAttempted: performanceRows.filter(
        (r) => r.status === "Not Attempted"
      ).length,
    };
  }, [performanceRows]);

  const formatSubmittedDate = (dateValue) => {
    if (!dateValue) return "-";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const clearFilters = () => {
    setFilter({
      yearSemester: "all",
      subject: "",
      unit: "",
      status: "all",
    });
  };

  return (
    <div className="flex h-screen bg-[#f6f8fb] overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar />

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-5">
            <h1 className="text-2xl font-semibold text-gray-800">
              Student Performance
            </h1>

            <p className="text-sm text-gray-500 mt-1">
              Department-wise student assessment performance.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 mb-5 shadow-sm">
            <div className="flex flex-col xl:flex-row xl:items-center gap-3">
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">

                <select
                  value={filter.yearSemester}
                  onChange={(e) =>
                    setFilter({
                      ...filter,
                      yearSemester: e.target.value,
                    })
                  }
                  className="h-10 border border-gray-300 px-3 rounded-lg"
                >
                  {yearSemesterOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>

                <input
                  placeholder="Search subject"
                  value={filter.subject}
                  onChange={(e) =>
                    setFilter({ ...filter, subject: e.target.value })
                  }
                  className="h-10 border border-gray-300 px-3 rounded-lg"
                />

                <input
                  placeholder="Search unit"
                  value={filter.unit}
                  onChange={(e) =>
                    setFilter({ ...filter, unit: e.target.value })
                  }
                  className="h-10 border border-gray-300 px-3 rounded-lg"
                />

                <select
                  value={filter.status}
                  onChange={(e) =>
                    setFilter({ ...filter, status: e.target.value })
                  }
                  className="h-10 border border-gray-300 px-3 rounded-lg"
                >
                  <option value="all">All Status</option>
                  <option value="Pass">Pass</option>
                  <option value="Fail">Fail</option>
                  <option value="Not Attempted">Not Attempted</option>
                </select>
              </div>

              <button
                onClick={clearFilters}
                className="h-10 px-4 rounded-lg border border-gray-300"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-5">
            <SummaryCard label="Total Records" value={summary.total} className="border-blue-100 bg-blue-50 text-blue-700" />
            <SummaryCard label="Pass" value={summary.pass} className="border-green-100 bg-green-50 text-green-700" />
            <SummaryCard label="Fail" value={summary.fail} className="border-red-100 bg-red-50 text-red-700" />
            <SummaryCard label="Not Attempted" value={summary.notAttempted} className="border-gray-200 bg-gray-50 text-gray-700" />
          </div>

          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <div className="min-w-[1250px]">

                <div className="grid grid-cols-[1.5fr_1.1fr_0.6fr_0.8fr_1fr_0.8fr_0.8fr_1fr_1.2fr] bg-gray-50 px-5 py-3 text-xs font-semibold text-gray-600 uppercase">
                  <span>Student</span>
                  <span>Hall Ticket</span>
                  <span>Year</span>
                  <span>Semester</span>
                  <span>Subject</span>
                  <span>Unit</span>
                  <span>Score</span>
                  <span>Status</span>
                  <span>Submitted At</span>
                </div>

                {loading ? (
                  <div className="px-5 py-10 text-center">
                    Loading...
                  </div>
                ) : performanceRows.length === 0 ? (
                  <div className="px-5 py-10 text-center">
                    No records found.
                  </div>
                ) : (
                  performanceRows.map((item, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-[1.5fr_1.1fr_0.6fr_0.8fr_1fr_0.8fr_0.8fr_1fr_1.2fr] px-5 py-4 border-t"
                    >
                      <div>
                        <p className="font-medium">{item.studentName}</p>
                        <p className="text-xs text-gray-400">{item.email}</p>
                      </div>

                      <span>{item.hallTicket}</span>
                      <span>{item.year}</span>
                      <span>{item.semester}</span>
                      <span>{item.subject}</span>
                      <span>{item.unit}</span>
                      <span>
                        {item.score !== null ? `${item.score}/${item.total}` : "-"}
                      </span>

                      <span
                        className={`px-3 py-1 rounded-full border text-xs w-fit ${getStatusClass(item.status)}`}
                      >
                        {item.status}
                      </span>

                      <span>{formatSubmittedDate(item.submittedAt)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, className }) {
  return (
    <div className={`border rounded-xl px-4 py-3 shadow-sm ${className}`}>
      <p className="text-xl font-bold">{value}</p>
      <p className="text-xs mt-1">{label}</p>
    </div>
  );
}