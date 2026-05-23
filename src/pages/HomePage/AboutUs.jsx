import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import oulogo from "../../assets/images/Eng_college_log.png";

// Reusable Reveal Component (matching HomePage style)
const Reveal = ({ children, delay = 0, direction = "up", className = "" }) => {
  return (
    <div
      className={`transition-all duration-1000 opacity-100 translate-y-0 ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

const AboutUs = () => {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="bg-white text-gray-900 min-h-screen">
      {/* ══════════ NAVBAR (Matching HomePage) ══════════ */}
      <nav className="fixed top-0 left-0 right-0 z-[9999] bg-white">
        <div className="max-w-screen-xl mx-auto px-8 h-[80px] flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img src={oulogo} alt="OU Logo" className="w-11 h-11 rounded-lg" />
            <span className="text-3xl font-bold text-gray-900">LMS</span>
          </div>

          {/* Center Nav */}
          <div className="hidden md:flex items-center gap-10">
            <button
              onClick={() => { window.scrollTo(0,0); navigate("/"); }}
              className="text-gray-700 font-medium hover:text-blue-600 transition-colors"
            >
              Home
            </button>
            <button
              onClick={() => {
                navigate("/");
                setTimeout(() => {
                  const faqSection = document.getElementById("faq");
                  if (faqSection) faqSection.scrollIntoView({ behavior: "smooth" });
                }, 100);
              }}
              className="text-gray-700 font-medium hover:text-blue-600 transition-colors"
            >
              FAQ's
            </button>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="text-blue-600 font-medium transition-colors"
            >
              About us
            </button>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/faculty/login")}
              className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition"
            >
              Sign in
            </button>
            <button
              onClick={() => navigate("/faculty/signup")}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition"
            >
              Get started
            </button>
          </div>
        </div>
      </nav>

      {/* ══════════ ABOUT HERO ══════════ */}
      <section className="pt-[140px] pb-20 bg-white">
        <div className="max-w-screen-md mx-auto px-8 text-center">
          <Reveal direction="up">
            <p className="text-xs font-bold text-blue-600 tracking-widest uppercase mb-3">
              OUR VISION
            </p>
            <h1 className="text-5xl lg:text-[56px] font-black text-gray-900 leading-[1.1] tracking-tight mb-6">
              Empowering Education at <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
                Osmania University
              </span>
            </h1>
            <p className="text-lg text-gray-500 leading-relaxed mb-8">
              The Osmania University Learning Management System (LMS) is a dedicated digital platform designed to bridge the gap between faculty and students. We believe in providing 24/7 access to high-quality academic resources, creating a seamless and modern learning ecosystem.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ══════════ MISSION & FEATURES ══════════ */}
      <section className="bg-gray-50 py-24 px-8">
        <div className="max-w-screen-xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <Reveal direction="left">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
              <img
                src="/student_learning.png"
                alt="Students learning"
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/40 to-transparent"></div>
            </div>
          </Reveal>

          <Reveal direction="right">
            <h2 className="text-3xl font-black text-gray-900 mb-6">
              A Unified Digital Campus
            </h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Our LMS is specifically tailored for the academic structure of Osmania University, allowing faculty to organize content efficiently by Year, Semester, Subject, and Unit. This structured approach ensures that students can easily navigate their coursework and access materials anytime, anywhere.
            </p>
            
            <ul className="space-y-4">
              {[
                "Centralized repository for lecture videos, PDFs, and assessments.",
                "Organized academic structure matching the university curriculum.",
                "Built-in Google Drive and Docs integration for seamless previews.",
                "Secure, role-based access for both faculty and students.",
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                  </div>
                  <span className="text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* ══════════ UNIVERSITY LEGACY ══════════ */}
      <section className="py-24 px-8 bg-white text-center">
        <div className="max-w-screen-md mx-auto">
          <Reveal direction="up">
            <h2 className="text-3xl font-black text-gray-900 mb-6">
              Honoring Our Legacy, Embracing the Future
            </h2>
            <p className="text-gray-600 leading-relaxed mb-8">
              With a rich history of academic excellence, Osmania University continues to adapt to the changing educational landscape. This platform is a step forward in our commitment to providing students with the best possible tools to succeed in their academic journey.
            </p>
            <button
              onClick={() => navigate("/faculty/signup")}
              className="px-8 py-4 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-semibold transition"
            >
              Join the Platform Today
            </button>
          </Reveal>
        </div>
      </section>

    </div>
  );
};

export default AboutUs;
