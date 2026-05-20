import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import viceChancellorImg from "../../assets/images/vice-chancellor.png";
import principalImg from "../../assets/images/principal_1.png";
import oueng from "../../assets/images/ou-campus.png";
import oulogo from "../../assets/images/Eng_college_log.png";
import student from "../../assets/images/students.png";
import facul from "../../assets/images/faculty.png";

/* ─── Scroll-Reveal Hook ─── */
function useReveal(threshold = 0.12) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return [ref, visible];
}

/* ─── Reveal Wrapper ─── */
function Reveal({ children, delay = 0, direction = "up", className = "" }) {
  const [ref, visible] = useReveal();

  const hiddenMap = {
    up: "opacity-0 translate-y-10",
    left: "opacity-0 -translate-x-10",
    right: "opacity-0 translate-x-10",
    fade: "opacity-0",
  };

  const hidden = hiddenMap[direction] || hiddenMap.up;

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${visible ? "opacity-100 translate-x-0 translate-y-0" : hidden
        } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function CheckCircle({ color = "text-blue-500" }) {
  return (
    <svg
      className={`w-5 h-5 ${color} flex-shrink-0 mt-0.5`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <circle cx="12" cy="12" r="10" strokeWidth="2" fill="none" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12l3 3 5-5" />
    </svg>
  );
}

function ChevronDown({ open }) {
  return (
    <svg
      className={`w-5 h-5 text-gray-400 transition-transform duration-300 flex-shrink-0 ${open ? "rotate-180" : ""
        }`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

const HomePage = () => {
  const [faqOpen, setFaqOpen] = useState(null);
  const navigate = useNavigate();

  const toggleFaq = (i) => setFaqOpen(faqOpen === i ? null : i);

  const faqs = [
    {
      question: "What is the purpose of the Osmania University LMS?",
      answer:
        "The LMS is designed to provide one digital platform where faculty can upload lecture videos, assessments, and academic materials, while students can access learning resources anytime from one place.",
    },
    {
      question: "Who can use this LMS platform?",
      answer:
        "The platform is mainly built for Osmania University faculty and students. Faculty can manage academic content, and students can view subject-wise materials, videos, lecture notes, and assessments.",
    },
    {
      question: "How can faculty upload course content?",
      answer:
        "Faculty members can log in to the faculty dashboard and upload videos, lecture notes, and assessment files by selecting year, semester, subject, unit, and title.",
    },
    {
      question: "Is semester selection required for all years?",
      answer:
        "No. For 1st year, subjects are shown directly without semester selection. From 2nd year to 4th year, content is organized semester-wise.",
    },
    {
      question: "How is content organized in the LMS?",
      answer:
        "Content is organized in a structured format: Year, Semester, Subject, Unit, and then Videos, Lecture Notes, and Assessments. This helps students find materials easily.",
    },
    {
      question: "Can faculty preview uploaded PDFs and assessments?",
      answer:
        "Yes. Faculty can preview PDF lecture notes directly inside the LMS. Assessment files such as Excel sheets can also be previewed in a table format.",
    },
    {
      question: "Can faculty delete uploaded content?",
      answer:
        "Yes. Faculty can delete uploaded videos, PDFs, and assessments from the subject details page. Once deleted, the content is removed from the LMS records.",
    },
    {
      question: "Can students access materials anytime?",
      answer:
        "Yes. The LMS is planned to provide 24/7 access to lecture videos, PDFs, and assessments so students can revise and learn at their own pace.",
    },
  ];

  const courseCards = [
    {
      src: oueng,
      title: "Hardware Acceleration for Machine Learning",
      meta: "Engineering curriculum · Lecture resources",
    },
    {
      src: oulogo,
      title: "Geographic Information System",
      meta: "Subject-wise digital learning material",
    },
    {
      src: viceChancellorImg,
      title: "Academic Leadership & Digital Vision",
      meta: "Osmania University academic ecosystem",
    },
    {
      src: principalImg,
      title: "Engineering Education Support",
      meta: "Faculty-guided learning resources",
    },
  ];

  return (
    <div className="bg-white text-gray-900 overflow-x-hidden">
      {/* ══════════ SINGLE MAIN NAVBAR ══════════ */}
      <nav className="fixed top-0 left-0 right-0 z-[9999] bg-white">
        <div className="max-w-screen-xl mx-auto px-6 md:px-8 h-[80px] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={oulogo}
              alt="Osmania University Engineering College Logo"
              className="w-11 h-11 rounded-lg object-contain"
            />

            <div>
              <span className="block text-2xl md:text-3xl font-black text-gray-900 leading-none">
                LMS
              </span>
              <span className="hidden sm:block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mt-1">
                Osmania University
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-10">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="text-gray-700 font-medium hover:text-blue-600 transition-colors"
            >
              Home
            </button>

            <a
              href="#faq"
              className="text-gray-700 font-medium hover:text-blue-600 transition-colors"
            >
              FAQ's
            </a>

            <button
              onClick={() => {
                window.scrollTo(0, 0);
                navigate("/about");
              }}
              className="text-gray-700 font-medium hover:text-blue-600 transition-colors"
            >
              About us
            </button>
          </div>

          <div className="flex items-center gap-3 md:gap-4">
            <button
              onClick={() => navigate("/faculty/login")}
              className="px-4 md:px-6 py-2.5 md:py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition text-sm md:text-base"
            >
              Sign in
            </button>

            <button
              onClick={() => navigate("/faculty/signup")}
              className="px-4 md:px-6 py-2.5 md:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition text-sm md:text-base"
            >
              Get started
            </button>
          </div>
        </div>
      </nav>

      <div className="h-[80px]" />

      {/* ══════════ HERO ══════════ */}
      <section className="bg-white">
        <div className="max-w-screen-xl mx-auto px-6 md:px-8 py-16 md:py-20 flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          <div className="flex-1 max-w-[580px]">
            <Reveal direction="up">
              <h1 className="text-4xl md:text-5xl lg:text-[64px] font-black text-gray-900 leading-[1.08] tracking-tight mb-5">
                The Digital Hub
                <br />
                <span className="text-blue-600">of Learning</span>
              </h1>

              <p className="text-gray-500 text-lg leading-relaxed mb-8 max-w-[480px]">
                Your official gateway to the Osmania University learning
                ecosystem. Faculty can manage academic content, and students can
                access lecture videos, notes, and assessments from one digital
                platform.
              </p>

              <div className="flex items-center gap-3 mb-12 flex-wrap">
                <button
                  onClick={() => navigate("/faculty/signup")}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-all shadow-lg shadow-blue-200"
                >
                  Faculty Registration
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>

                <button
                  onClick={() => navigate("/faculty/login")}
                  className="px-6 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors"
                >
                  Faculty Login
                </button>
              </div>

              <div className="flex items-center">
                <div className="pr-8 md:pr-10">
                  <p className="text-3xl font-black text-gray-900">24/7</p>
                  <p className="text-sm text-gray-400 mt-1">Digital Access</p>
                </div>

                <div className="w-px h-12 bg-gray-200" />

                <div className="pl-8 md:pl-10">
                  <p className="text-3xl font-black text-gray-900">1</p>
                  <p className="text-sm text-gray-400 mt-1">Unified Portal</p>
                </div>
              </div>
            </Reveal>
          </div>

          <Reveal
            direction="right"
            delay={150}
            className="flex-1 w-full max-w-[700px]"
          >
            <div className="relative">
              <div className="rounded-3xl overflow-hidden shadow-2xl shadow-gray-200 bg-gray-50">
                <img
                  src={oueng}
                  alt="Osmania University College of Engineering"
                  className="w-full h-[320px] md:h-[430px] object-cover"
                />
              </div>

              <div className="absolute -bottom-6 left-6 md:left-8 bg-white rounded-2xl shadow-xl shadow-gray-200 px-5 py-3.5 flex items-center gap-3 border border-gray-100">
                <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z" />
                  </svg>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Official LMS
                  </p>
                  <p className="text-sm font-bold text-gray-900">
                    Osmania University
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════════ FEATURED PROGRAM ══════════ */}
      <section className="bg-gray-50 py-20 px-6 md:px-8 mt-8">
        <div className="max-w-3xl mx-auto text-center">
          <Reveal direction="fade">
            <div className="inline-flex items-center gap-2 mb-5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-sm font-semibold text-blue-600">
                Government of Telangana Initiative
              </span>
            </div>
          </Reveal>

          <Reveal direction="up" delay={80}>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-5 leading-tight">
              Prajapala Palana Pragati Pranalika:
              <br />
              <span className="text-blue-600">The 99-Day Action Plan</span>
            </h2>
          </Reveal>

          <Reveal direction="up" delay={160}>
            <p className="text-gray-500 text-base leading-relaxed">
              Guided by a visionary mandate for the digitization of student
              services, Osmania University is proud to support a Learning
              Management System that strengthens academic access, faculty
              productivity, and student learning continuity.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ══════════ STUDENT LEARNING OVERVIEW ══════════ */}
      <section className="bg-white py-20 md:py-24 px-6 md:px-8">
        <div className="max-w-screen-xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-14 lg:gap-16 items-start">
            <Reveal direction="up" className="lg:w-[400px] flex-shrink-0">
              <p className="text-xs font-bold text-green-500 tracking-widest uppercase mb-4">
                For Students
              </p>

              <h2 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight mb-4">
                Learn anywhere. Revise anytime.
              </h2>

              <p className="text-gray-500 text-base mb-8">
                Students can access subject-wise videos, lecture notes, and
                assessments in a structured academic format.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3.5 mb-10">
                {[
                  "Subject-wise learning materials",
                  "Unit-wise lecture videos",
                  "Downloadable lecture PDFs",
                  "Assessment access from one place",
                  "Year and semester-wise organization",
                  "Self-paced revision support",
                ].map((f, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle color="text-blue-500" />
                    <span className="text-sm text-gray-600 leading-snug">
                      {f}
                    </span>
                  </div>
                ))}
              </div>
            </Reveal>

            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {courseCards.map((card, i) => (
                <Reveal key={i} direction="up" delay={i * 80}>
                  <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                    <div className="h-52 md:h-56 overflow-hidden bg-gray-50 flex items-center justify-center">
                      <img
                        src={card.src}
                        alt={card.title}
                        className="w-full h-full object-contain object-center p-3"
                      />
                    </div>

                    <div className="p-4">
                      <p className="text-sm font-semibold text-gray-900 leading-snug mb-1.5">
                        {card.title}
                      </p>
                      <p className="text-xs text-gray-400">{card.meta}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ ACADEMIC EXCELLENCE ══════════ */}
      <section className="bg-white py-20 md:py-24 px-6 md:px-8">
        <div className="max-w-screen-xl mx-auto">
          <Reveal direction="fade" className="text-center mb-16">
            <div className="inline-flex items-center gap-2 border border-gray-200 rounded-full px-4 py-1.5 mb-5 shadow-sm">
              <svg
                className="w-3.5 h-3.5 text-blue-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                  clipRule="evenodd"
                />
              </svg>

              <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                Osmania University LMS
              </span>
            </div>

            <h2 className="text-3xl md:text-4xl font-black text-gray-900">
              A Commitment to{" "}
              <span className="text-blue-600">Academic Excellence</span>
            </h2>
          </Reveal>

          <div className="flex flex-col lg:flex-row items-center gap-14 mb-20 md:mb-24">
            <Reveal direction="left" delay={80} className="lg:w-[55%]">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-blue-100/50 bg-gray-50 flex items-center justify-center min-h-[420px] md:min-h-[520px]">
                <img
                  src={viceChancellorImg}
                  alt="Vice-Chancellor"
                  className="w-full h-auto max-h-[520px] object-contain"
                />

                <div className="absolute bottom-0 left-0 right-0 bg-black/30 backdrop-blur-sm px-5 py-4 flex items-center justify-between">
                  <span className="text-white text-sm font-medium">
                    Message from the Vice-Chancellor
                  </span>
                </div>
              </div>
            </Reveal>

            <Reveal direction="right" delay={160} className="lg:w-[45%]">
              <p className="text-xs font-bold text-blue-600 tracking-widest uppercase mb-3">
                Academic Vision
              </p>

              <h3 className="text-3xl font-black text-gray-900 leading-tight mb-5">
                Message from the Vice-Chancellor
              </h3>

              <p className="text-gray-500 text-base leading-relaxed mb-8">
                At Osmania University, digital learning strengthens academic
                access and supports students beyond classroom hours. This LMS
                reflects the university’s commitment to structured, accessible,
                and technology-enabled education.
              </p>
            </Reveal>
          </div>

          <div className="flex flex-col lg:flex-row-reverse items-center gap-14">
            <Reveal direction="right" delay={80} className="lg:w-[55%]">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-gray-200/60 bg-gray-50 flex items-center justify-center min-h-[420px] md:min-h-[520px]">
                <img
                  src={principalImg}
                  alt="Principal"
                  className="w-full h-auto max-h-[520px] object-contain"
                />

                <div className="absolute bottom-0 left-0 right-0 bg-black/30 backdrop-blur-sm px-5 py-4 flex items-center justify-between">
                  <span className="text-white text-sm font-medium">
                    Message from the Principal
                  </span>
                </div>
              </div>
            </Reveal>

            <Reveal direction="left" delay={160} className="lg:w-[45%]">
              <p className="text-xs font-bold text-blue-600 tracking-widest uppercase mb-3">
                Engineering Education
              </p>

              <h3 className="text-3xl font-black text-gray-900 leading-tight mb-5">
                Message from the Principal
              </h3>

              <p className="text-gray-500 text-base leading-relaxed mb-8">
                Engineering education requires continuous access to quality
                academic resources. This LMS helps faculty organize learning
                materials and helps students revise lessons, access notes, and
                complete assessments with ease.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ══════════ BUILT FOR FACULTY & STUDENTS ══════════ */}
      <section className="bg-white py-24 px-6 md:px-8">
        <div className="max-w-screen-xl mx-auto">
          <Reveal direction="up" className="text-center mb-14">
            <p className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-3">
              ONE PLATFORM · TWO WORLDS
            </p>

            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
              Built for faculty{" "}
              <span className="text-gray-400">&amp;</span> students
            </h2>

            <p className="text-gray-500 text-base max-w-2xl mx-auto">
              A dedicated academic workspace for faculty to manage course
              content and a simple student portal to access learning resources.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
            {/* Faculty Portal Card */}
            <Reveal direction="left" delay={80}>
              <div className="rounded-3xl overflow-hidden bg-[#0B2F66] shadow-xl shadow-blue-100 border border-blue-100">
                <div className="relative h-[300px] md:h-[340px] bg-blue-50 overflow-hidden">
                  <img
                    src={facul}
                    alt="Osmania University Faculty Portal"
                    className="w-full h-full object-cover object-center"
                  />

                  <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0B2F66] to-transparent" />

                  <div className="absolute top-5 left-5 bg-white/95 backdrop-blur rounded-xl px-3 py-1.5 flex items-center gap-2 shadow-sm">
                    <svg
                      className="w-3.5 h-3.5 text-blue-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                      />
                    </svg>
                    <span className="text-xs font-bold text-gray-700 tracking-wider uppercase">
                      Faculty Portal
                    </span>
                  </div>
                </div>

                <div className="p-8 pt-7">
                  <h3 className="text-3xl font-black text-white mb-3">
                    Manage academic content
                  </h3>

                  <p className="text-blue-100 text-sm leading-relaxed mb-5">
                    The faculty portal helps teachers upload, organize, preview,
                    and manage learning resources in a structured academic
                    format.
                  </p>

                  <ul className="space-y-2.5">
                    {[
                      "Upload lecture videos, notes, and assessment files",
                      "Organize content by year, semester, subject, and unit",
                      "Preview PDFs and assessments before students access them",
                      "Update or delete outdated academic materials",
                      "Maintain one digital repository for subject resources",
                      "Track student performance and learning progress",
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-2.5">
                        <CheckCircle color="text-green-400" />
                        <span className="text-white text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Reveal>

            {/* Student Portal Card */}
            <Reveal direction="right" delay={80}>
              <div className="rounded-3xl overflow-hidden bg-[#111827] shadow-xl shadow-slate-200 border border-slate-100">
                <div className="relative h-[300px] md:h-[340px] bg-gradient-to-br from-slate-100 to-blue-50 overflow-hidden">
                  <img
                    src={student}
                    alt="Osmania University Student Portal"
                    className="w-full h-full object-cover object-center"
                  />

                  <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#111827] to-transparent" />

                  <div className="absolute top-5 left-5 bg-white/95 backdrop-blur rounded-xl px-3 py-1.5 flex items-center gap-2 shadow-sm">
                    <svg
                      className="w-3.5 h-3.5 text-blue-600"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z" />
                    </svg>
                    <span className="text-xs font-bold text-gray-700 tracking-wider uppercase">
                      Student Portal
                    </span>
                  </div>

                  <div className="absolute top-5 right-5 bg-white/95 backdrop-blur rounded-xl px-3 py-1.5 flex items-center gap-1.5 shadow-sm">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-xs font-bold text-gray-700">
                      24/7 access
                    </span>
                  </div>
                </div>

                <div className="p-8 pt-7">
                  <h3 className="text-3xl font-black text-white mb-3">
                    Learn at your own pace
                  </h3>

                  <p className="text-slate-300 text-sm leading-relaxed mb-5">
                    The student portal helps learners access lecture videos,
                    notes, and assessments anytime in a simple unit-wise format.
                  </p>

                  <ul className="space-y-2.5">
                    {[
                      "Access subject-wise lecture videos and notes",
                      "Download PDFs for revision and exam preparation",
                      "Open assessments and practice materials in one place",
                      "Follow unit-wise learning flow without confusion",
                      "Revise missed classes anytime through digital resources",
                      "students can able to take the assessments and view their performance.",
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-2.5">
                        <CheckCircle color="text-green-400" />
                        <span className="text-white text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ══════════ FAQ ══════════ */}
      <section id="faq" className="bg-gray-50 py-20 md:py-24 px-6 md:px-8">
        <div className="max-w-3xl mx-auto">
          <Reveal direction="up" className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
              Frequently asked questions
            </h2>

            <p className="text-gray-500 text-base">
              Everything you need to know about the Osmania University LMS
              platform.
            </p>
          </Reveal>

          <Reveal direction="up" delay={100}>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-100">
              {faqs.map((faq, i) => (
                <div key={i}>
                  <button
                    onClick={() => toggleFaq(i)}
                    className="w-full flex items-center justify-between px-6 md:px-7 py-5 text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-base font-semibold text-gray-800 pr-4">
                      {faq.question}
                    </span>

                    <ChevronDown open={faqOpen === i} />
                  </button>

                  {faqOpen === i && (
                    <div className="px-6 md:px-7 pb-6 bg-white">
                      <p className="text-gray-500 text-sm leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
};

export default HomePage;