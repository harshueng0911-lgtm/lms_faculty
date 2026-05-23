import { BrowserRouter, Routes, Route } from "react-router-dom";

import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";

import HomePage from "./pages/HomePage/HomePage";
import AboutUs from "./pages/HomePage/AboutUs";

import FacultySignup from "./pages/auth/FacultySignup";
import FacultyLogin from "./pages/auth/FacultyLogin";

import FacultyDashboard from "./pages/FacultyDashboard/FacultyDashboard";
import MySubjects from "./pages/FacultyDashboard/MySubjects";
import SubjectDetail from "./pages/FacultyDashboard/SubjectDetail";
import ContentUpload from "./pages/FacultyDashboard/ContentUpload";
import StudentPerformance from "./pages/FacultyDashboard/StudentPerformance";
import FacultyProfile from "./pages/FacultyDashboard/FacultyProfile";
import FacultyNotifications from "./pages/FacultyDashboard/FacultyNotifications";

import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLIC HOME */}
        <Route
          path="/"
          element={
            <>
              <main className="main-content">
                <HomePage />
              </main>
              <Footer />
            </>
          }
        />

        {/* ABOUT US */}
        <Route
          path="/about"
          element={
            <>
              <Header />
              <main className="main-content">
                <AboutUs />
              </main>
              <Footer />
            </>
          }
        />

        {/* AUTH */}
        <Route path="/faculty/signup" element={<FacultySignup />} />
        <Route path="/faculty/login" element={<FacultyLogin />} />

        {/* FACULTY DASHBOARD */}
        <Route path="/faculty/dashboard" element={<FacultyDashboard />} />

        {/* SUBJECTS */}
        <Route path="/faculty/subjects" element={<MySubjects />} />

        {/* SUBJECT DETAILS */}
        <Route
          path="/faculty/my-subjects/:subjectName"
          element={<SubjectDetail />}
        />

        {/* CONTENT UPLOAD */}
        <Route path="/faculty/upload" element={<ContentUpload />} />

        {/* PERFORMANCE */}
        <Route path="/faculty/performance" element={<StudentPerformance />} />

        {/* PROFILE */}
        <Route path="/faculty/profile" element={<FacultyProfile />} />

        {/* NOTIFICATIONS */}
        <Route
          path="/faculty/notifications"
          element={<FacultyNotifications />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;