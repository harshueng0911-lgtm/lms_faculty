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

/* ─── Reveal Wrapper with Enhanced Animation ─── */
function Reveal({ children, delay = 0, direction = "up", className = "" }) {
  const [ref, visible] = useReveal();

  const hiddenMap = {
    up: "opacity-0 translate-y-16",
    left: "opacity-0 -translate-x-12",
    right: "opacity-0 translate-x-12",
    fade: "opacity-0",
  };

  const visibleMap = {
    up: "opacity-100 translate-y-0",
    left: "opacity-100 translate-x-0",
    right: "opacity-100 translate-x-0",
    fade: "opacity-100",
  };

  const hidden = hiddenMap[direction] || hiddenMap.up;
  const show = visibleMap[direction] || visibleMap.up;

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ease-out ${visible ? show : hidden} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ─── Image Container with Enhanced Shadow ─── */
function ImageContainer({ src, alt, className = "", shadow = "heavy" }) {
  const shadowMap = {
    light: "shadow-2xl shadow-gray-300",
    medium: "shadow-3xl shadow-gray-400",
    heavy: "shadow-3xl shadow-blue-300",
    blue: "shadow-4xl shadow-blue-400",
    slate: "shadow-4xl shadow-slate-400",
  };

  return (
    <div
      className={`relative rounded-3xl overflow-hidden ${shadowMap[shadow]} bg-gradient-to-br from-gray-50 to-gray-100 ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent pointer-events-none" />
      <img src={src} alt={alt} className="w-full h-full object-cover" />
    </div>
  );
}

/* ─── Check Circle ─── */
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

/* ─── Chevron Down ─── */
function ChevronDown({ open }) {
  return (
    <svg
      className={`w-5 h-5 text-gray-400 transition-transform duration-300 flex-shrink-0 ${open ? "rotate-180" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

/* ─── Main HomePage Component ─── */
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
      {/* ══════════ FIXED NAVBAR ══════════ */}
      <nav className="fixed top-0 left-0 right-0 z-[9999] bg-white border-b border-gray-100 backdrop-blur-xl bg-white/95">
        <div className="max-w-screen-xl mx-auto px-6 md:px-8 h-[80px] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={oulogo}
              alt="Osmania University Engineering College Logo"
              className="w-11 h-11 rounded-lg object-contain shadow-md"
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
              className="text-gray-700 font-medium hover:text-blue-600 transition-colors duration-300"
            >
              Home
            </button>

            <a
              href="#faq"
              className="text-gray-700 font-medium hover:text-blue-600 transition-colors duration-300"
            >
              FAQ's
            </a>

            <button
              onClick={() => {
                window.scrollTo(0, 0);
                navigate("/about");
              }}
              className="text-gray-700 font-medium hover:text-blue-600 transition-colors duration-300"
            >
              About us
            </button>
          </div>

          <div className="flex items-center gap-3 md:gap-4">
            <button
              onClick={() => navigate("/faculty/login")}
              className="px-4 md:px-6 py-2.5 md:py-3 border-2 border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 hover:border-blue-400 transition duration-300 text-sm md:text-base shadow-lg shadow-gray-300 hover:shadow-blue-300 relative group overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              Sign in
            </button>

            <button
              onClick={() => navigate("/faculty/signup")}
              className="px-4 md:px-6 py-2.5 md:py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-semibold transition duration-300 text-sm md:text-base shadow-2xl shadow-blue-400 hover:shadow-blue-500 relative group overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse" />
              Get started
            </button>
          </div>
        </div>
      </nav>

      <div className="h-[80px]" />

      {/* ══════════ HERO SECTION ══════════ */}
      <section className="bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-transparent pointer-events-none" />
        
        <div className="max-w-screen-xl mx-auto px-6 md:px-8 py-16 md:py-28 flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          <Reveal direction="up" className="flex-1 max-w-[580px]">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-gray-900 leading-[1.08] tracking-tight mb-6">
              The Digital Hub
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                of Learning
              </span>
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
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-7 py-3.5 rounded-xl text-sm transition-all duration-300 shadow-2xl shadow-blue-400 hover:shadow-blue-500 transform hover:scale-105 relative group overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse" />
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
                className="px-7 py-3.5 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-50 hover:border-blue-400 transition-all duration-300 relative group overflow-hidden shadow-lg shadow-gray-300 hover:shadow-blue-300"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                Faculty Login
              </button>
            </div>

            <div className="flex items-center">
              <div className="pr-8 md:pr-10">
                <p className="text-4xl font-black bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                  24/7
                </p>
                <p className="text-sm text-gray-400 mt-1">Digital Access</p>
              </div>

              <div className="w-px h-12 bg-gradient-to-b from-gray-200 to-transparent" />

              <div className="pl-8 md:pl-10">
                <p className="text-4xl font-black bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                  1
                </p>
                <p className="text-sm text-gray-400 mt-1">Unified Portal</p>
              </div>
            </div>
          </Reveal>

          <Reveal direction="right" delay={200} className="flex-1 w-full max-w-[700px]">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 rounded-3xl blur-3xl opacity-40 group-hover:opacity-50 transition duration-1000" />
              
              <ImageContainer
                src={oueng}
                alt="Osmania University College of Engineering"
                className="w-full h-[320px] md:h-[430px]"
                shadow="blue"
              />

              <div className="absolute -bottom-6 left-6 md:left-8 bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl shadow-blue-400 px-5 py-3.5 flex items-center gap-3 border border-blue-200 hover:shadow-blue-500 transition-all duration-300 group/badge">
                <div className="w-9 h-9 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-300">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z" />
                  </svg>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
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
      <section className="bg-gradient-to-br from-blue-50 via-white to-gray-50 py-20 px-6 md:px-8 mt-12">
        <div className="max-w-3xl mx-auto text-center">
          <Reveal direction="fade">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-sm font-semibold text-blue-700">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
        </span>
        Government of Telangana Initiative
      </div>
          </Reveal>

          <Reveal direction="up" delay={80}>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 mb-5 leading-tight">
              Prajapala Palana Pragati Pranalika:
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                The 99-Day Action Plan
              </span>
            </h2>
          </Reveal>

          <Reveal direction="up" delay={160}>
            <p className="text-gray-600 text-base leading-relaxed">
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
              <p className="text-xs font-bold text-blue-600 tracking-widest uppercase mb-4">
                For Students
              </p>

              <h2 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight mb-4">
                Learn anywhere.{" "}
                <span className="bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                  Revise anytime.
                </span>
              </h2>

              <p className="text-gray-500 text-base mb-8">
                Students can access subject-wise videos, lecture notes, and
                assessments in a structured academic format.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 mb-10">
                {[
                  "Subject-wise learning materials",
                  "Unit-wise lecture videos",
                  "Downloadable lecture PDFs",
                  "Assessment access from one place",
                  "Year and semester-wise organization",
                  "Self-paced revision support",
                ].map((f, i) => (
                  <Reveal key={i} direction="up" delay={i * 40}>
                    <div className="flex items-start gap-3">
                      <CheckCircle color="text-blue-500" />
                      <span className="text-sm text-gray-700 leading-snug font-medium">
                        {f}
                      </span>
                    </div>
                  </Reveal>
                ))}
              </div>
            </Reveal>

            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {courseCards.map((card, i) => (
                <Reveal
                  key={i}
                  direction={i % 2 === 0 ? "up" : "up"}
                  delay={i * 100}
                  className="h-full"
                >
                  <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-2xl shadow-gray-300 hover:shadow-3xl hover:shadow-blue-300 transition-all duration-500 group hover:-translate-y-2 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-white/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    <div className="h-52 md:h-56 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent" />
                      <img
                        src={card.src}
                        alt={card.title}
                        className="w-full h-full object-contain object-center p-3 group-hover:scale-110 transition-transform duration-500"
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

             <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-sm font-semibold text-blue-700">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
        </span>
        osmania university initiative
      </div>
            

            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 mb-6">
              A Commitment to{" "}
              <span className="bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                Academic Excellence
              </span>
            </h2>
          </Reveal>

          {/* Vice-Chancellor Section */}
          <div className="flex flex-col lg:flex-row items-center gap-14 mb-20 md:mb-32">
            <Reveal direction="left" delay={100} className="lg:w-[55%]">
              <div className="relative group">
                <div className="absolute -inset-6 bg-gradient-to-br from-blue-400 to-blue-600 rounded-3xl blur-3xl opacity-40 group-hover:opacity-50 transition duration-1000" />
                
                <ImageContainer
                  src={viceChancellorImg}
                  alt="Vice-Chancellor"
                  className="min-h-[420px] md:min-h-[520px] relative"
                  shadow="blue"
                />

                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent backdrop-blur-sm px-6 py-6 rounded-b-3xl">
                  <span className="text-white text-sm font-semibold">
                    Message from the Vice-Chancellor
                  </span>
                </div>
              </div>
            </Reveal>

            <Reveal direction="right" delay={200} className="lg:w-[45%]">
              <div className="bg-white/40 backdrop-blur-2xl border border-white/60 rounded-3xl p-8 shadow-2xl shadow-blue-200">
                <p className="text-xs font-bold text-blue-600 tracking-widest uppercase mb-4">
                  Academic Vision
                </p>

                <h3 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight mb-6">
                  Message from the Vice-Chancellor
                </h3>

                <p className="text-gray-700 text-base leading-relaxed mb-6 font-medium">
                  At Osmania University, digital learning strengthens academic
                  access and supports students beyond classroom hours. This LMS
                  reflects the university's commitment to structured, accessible,
                  and technology-enabled education.
                </p>

                <p className="text-gray-600 text-sm leading-relaxed">
                  Our vision is to empower every student with the resources they need to excel, while enabling faculty to deliver engaging and impactful educational experiences in the digital age.
                </p>
              </div>
            </Reveal>
          </div>

          {/* Principal Section */}
          <div className="flex flex-col lg:flex-row-reverse items-center gap-14">
            <Reveal direction="right" delay={100} className="lg:w-[55%]">
              <div className="relative group">
                <div className="absolute -inset-6 bg-gradient-to-br from-blue-400 to-blue-600 rounded-3xl blur-3xl opacity-40 group-hover:opacity-50 transition duration-1000" />
                
                <ImageContainer
                  src={principalImg}
                  alt="Principal"
                  className="min-h-[420px] md:min-h-[520px] relative"
                  shadow="blue"
                />

                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent backdrop-blur-sm px-6 py-6 rounded-b-3xl">
                  <span className="text-white text-sm font-semibold">
                    Message from the Principal
                  </span>
                </div>
              </div>
            </Reveal>

            <Reveal direction="left" delay={200} className="lg:w-[45%]">
              <div className="bg-white/40 backdrop-blur-2xl border border-white/60 rounded-3xl p-8 shadow-2xl shadow-slate-300">
                <p className="text-xs font-bold text-blue-600 tracking-widest uppercase mb-4">
                  Engineering Education
                </p>

                <h3 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight mb-6">
                  Message from the Principal
                </h3>

                <p className="text-gray-700 text-base leading-relaxed mb-6 font-medium">
                  Engineering education requires continuous access to quality
                  academic resources. This LMS helps faculty organize learning
                  materials and helps students revise lessons, access notes, and
                  complete assessments with ease.
                </p>

                <p className="text-gray-600 text-sm leading-relaxed">
                  We are committed to leveraging technology to enhance learning outcomes and prepare our students for success in their careers.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ══════════ BUILT FOR FACULTY & STUDENTS — ENHANCED ══════════ */}
      <section className="bg-white py-20 md:py-24 px-6 md:px-8">
        <div className="max-w-screen-xl mx-auto">
          <Reveal direction="up" className="text-center mb-16">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-sm font-semibold text-blue-700">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
              </span>
              ONE PLATFORM · TWO WORLDS
            </div>

            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 mb-4">
              Built for{" "}
              <span className="bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                faculty & students
              </span>
            </h2>

            <p className="text-gray-600 text-base max-w-2xl mx-auto">
              A dedicated academic workspace for faculty to manage course content and a simple student portal to access learning resources.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">

            {/* ── Faculty Portal Card ── */}
            <Reveal direction="left" delay={120} className="h-full">
              <div className="flex flex-col h-full rounded-3xl overflow-hidden transition-all duration-500 group relative"
                   style={{ background: "linear-gradient(160deg, rgba(59,130,246,0.08) 0%, rgba(37,99,235,0.04) 100%)" }}>
                {/* Decorative Blur Blobs */}
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-400/10 rounded-full blur-3xl group-hover:bg-blue-400/15 transition-all duration-500" />
                <div className="absolute -bottom-20 -left-20 w-32 h-32 bg-blue-600/5 rounded-full blur-2xl" />
                
                {/* Main Border Gradient */}
                <div className="absolute inset-0 rounded-3xl pointer-events-none" style={{
                  background: "linear-gradient(135deg, rgba(147,197,253,0.2) 0%, transparent 50%, rgba(37,99,235,0.1) 100%)",
                }} />
                
                <div className="absolute inset-0 rounded-3xl shadow-2xl shadow-blue-400/20 group-hover:shadow-blue-500/30 transition-all duration-500 pointer-events-none" />
                
                {/* Inner Border */}
                <div className="absolute inset-[1px] rounded-3xl border border-gradient-to-br from-blue-300/30 via-blue-200/10 to-blue-300/20 pointer-events-none" />

                {/* IMAGE — fixed height, fully visible */}
                <div className="relative w-full h-[300px] overflow-hidden flex-shrink-0 z-10">
                  <img
                    src={facul}
                    alt="Faculty Portal"
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                  <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-xl shadow-md"
                       style={{ background: "rgba(37,99,235,0.5)", backdropFilter: "blur(12px)", border: "1px solid rgba(147,197,253,0.4)" }}>
                    <svg className="w-3.5 h-3.5 text-blue-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <span className="text-[11px] font-bold text-blue-50 tracking-wider uppercase">Faculty Portal</span>
                  </div>
                </div>

                {/* TRANSPARENT BLUE GLASS CARD — below image, grows to fill */}
             <div className="flex-1 p-6 bg-transparent z-20 relative">
                  <div
  className="h-full rounded-2xl p-7 flex flex-col"
  style={{
    background: "rgba(255,255,255,0.03)",
    border: "1px solid #2563eb",
    boxShadow: `
      0 0 0 2px rgba(37,99,235,0.25),
      0 15px 35px rgba(37,99,235,0.15)
    `,
  }}
>

                    <div className="absolute -top-3 left-8 w-24 h-1 bg-gradient-to-r from-blue-400/0 via-blue-400/40 to-blue-400/0 rounded-full blur(20px)" />

                    <p className="text-[11px] font-bold tracking-[0.2em] uppercase mb-4 text-blue-600 relative">
                      
                      For Faculty
                    </p>

                    <h3 className="text-2xl font-black leading-tight mb-2 bg-gradient-to-r from-gray-900 to-gray-800 bg-clip-text text-transparent">
                      Manage academic content
                    </h3>

                    <p className="text-sm leading-relaxed mb-6 text-gray-700 font-medium">
                      Upload, organize, and manage lecture videos, notes, and assessments in one structured platform.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-7 flex-1">
                      {[
                        "Upload lecture videos, notes & assessment files",
                        "Organize by year, semester, subject & unit",
                        "Preview PDFs and assessments before publishing",
                        "Update or delete outdated academic materials",
                        "One digital repository for subject resources",
                        "Track student performance and learning progress",
                      ].map((item, i) => (
                        <div key={i} className="flex items-start gap-2.5 group/item p-2 rounded-lg hover:bg-blue-50/30 transition-all duration-300">
                          <svg
                            className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-500 group-hover/item:text-blue-600 transition-colors"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.5}
                          >
                            <circle cx="12" cy="12" r="10" />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M8 12l3 3 5-5"
                            />
                          </svg>

                          <span className="text-xs font-medium leading-snug text-gray-800 group-hover/item:text-gray-900">
                            {item}
                          </span>
                        </div>
                      ))}
                    </div>

                    <button
                      className="
                        inline-flex items-center gap-2
                        px-6 py-3
                        rounded-xl
                        text-sm font-semibold
                        mt-auto w-fit
                        bg-gradient-to-r from-blue-600/25 to-blue-500/15
                        text-blue-700
                        border border-blue-400/40
                        backdrop-blur-md
                        hover:from-blue-600/35 hover:to-blue-500/25
                        hover:border-blue-400/60
                        hover:shadow-lg hover:shadow-blue-400/20
                        transition-all duration-300
                        relative group/btn overflow-hidden
                      "
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
                      Start managing

                      <svg
                        className="w-4 h-4 transition-transform group-hover/btn:translate-x-1"
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

                  </div>
                </div>
              </div>

            </Reveal>

            {/* ── Student Portal Card ── */}
            <Reveal direction="right" delay={120} className="h-full">
              <div className="flex flex-col h-full rounded-3xl overflow-hidden transition-all duration-500 group relative"
                   style={{ background: "linear-gradient(160deg, rgba(59,130,246,0.08) 0%, rgba(37,99,235,0.04) 100%)" }}>
                {/* Decorative Blur Blobs */}
                <div className="absolute -top-20 -left-20 w-40 h-40 bg-blue-400/10 rounded-full blur-3xl group-hover:bg-blue-400/15 transition-all duration-500" />
                <div className="absolute -bottom-20 -right-20 w-32 h-32 bg-blue-600/5 rounded-full blur-2xl" />
                
                {/* Main Border Gradient */}
                <div className="absolute inset-0 rounded-3xl pointer-events-none" style={{
                  background: "linear-gradient(135deg, rgba(147,197,253,0.2) 0%, transparent 50%, rgba(37,99,235,0.1) 100%)",
                }} />
                
                <div className="absolute inset-0 rounded-3xl shadow-2xl shadow-blue-400/20 group-hover:shadow-blue-500/30 transition-all duration-500 pointer-events-none" />
                
                {/* Inner Border */}
                <div className="absolute inset-[1px] rounded-3xl border border-gradient-to-br from-blue-300/30 via-blue-200/10 to-blue-300/20 pointer-events-none" />

                {/* IMAGE — fixed height, fully visible */}
                <div className="relative w-full h-[300px] overflow-hidden flex-shrink-0 z-10">
                  <img
                    src={student}
                    alt="Student Portal"
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                  <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-xl shadow-md"
                       style={{ background: "rgba(37,99,235,0.5)", backdropFilter: "blur(12px)", border: "1px solid rgba(147,197,253,0.4)" }}>
                    <svg className="w-3.5 h-3.5 text-blue-100" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z" />
                    </svg>
                    <span className="text-[11px] font-bold text-blue-50 tracking-wider uppercase">Student Portal</span>
                  </div>
                  <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-xl shadow-md"
                       style={{ background: "rgba(37,99,235,0.5)", backdropFilter: "blur(12px)", border: "1px solid rgba(147,197,253,0.4)" }}>
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-[11px] font-bold text-blue-50">24/7 Access</span>
                  </div>
                </div>

                {/* TRANSPARENT BLUE GLASS CARD — below image, grows to fill */}
                <div className="flex-1 p-6 bg-blue-100/30 z-20 relative">
                 <div
  className="h-full rounded-2xl p-7 flex flex-col"
  style={{
    background: "rgba(255,255,255,0.03)",
    border: "1px solid #2563eb",
    boxShadow: `
      0 0 0 2px rgba(37,99,235,0.25),
      0 15px 35px rgba(37,99,235,0.15)
    `,
  }}
>

                    <div className="absolute -top-3 right-8 w-24 h-1 bg-gradient-to-r from-blue-400/0 via-blue-400/40 to-blue-400/0 rounded-full blur" />

                    <p className="text-[11px] font-bold tracking-[0.2em] uppercase mb-4 text-blue-600 relative">
                   
                      For Students
                    </p>

                    <h3 className="text-2xl font-black leading-tight mb-2 bg-gradient-to-r from-gray-900 to-gray-800 bg-clip-text text-transparent">
                      Learn at your own pace
                    </h3>

                    <p className="text-sm leading-relaxed mb-6 text-gray-700 font-medium">
                      Access all lecture videos, notes, and assessments anytime. Download resources and track your progress effortlessly.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-7 flex-1">
                      {[
                        "Access subject-wise lecture videos and notes",
                        "Download PDFs for revision and exam prep",
                        "Open assessments and practice materials",
                        "Follow unit-wise learning flow easily",
                        "Revise missed classes through digital resources",
                        "Take assessments and view your performance",
                      ].map((item, i) => (
                        <div key={i} className="flex items-start gap-2.5 group/item p-2 rounded-lg hover:bg-blue-50/30 transition-all duration-300">
                          <svg
                            className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-500 group-hover/item:text-blue-600 transition-colors"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.5}
                          >
                            <circle cx="12" cy="12" r="10" />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M8 12l3 3 5-5"
                            />
                          </svg>

                          <span className="text-xs font-medium leading-snug text-gray-800 group-hover/item:text-gray-900">
                            {item}
                          </span>
                        </div>
                      ))}
                    </div>

                    <button
                      className="
                        inline-flex items-center gap-2
                        px-6 py-3
                        rounded-xl
                        text-sm font-semibold
                        mt-auto w-fit
                        bg-gradient-to-r from-blue-600/25 to-blue-500/15
                        text-blue-700
                        border border-blue-400/40
                        backdrop-blur-md
                        hover:from-blue-600/35 hover:to-blue-500/25
                        hover:border-blue-400/60
                        hover:shadow-lg hover:shadow-blue-400/20
                        transition-all duration-300
                        relative group/btn overflow-hidden
                      "
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
                      Start learning

                      <svg
                        className="w-4 h-4 transition-transform group-hover/btn:translate-x-1"
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

                  </div>
                </div>
              </div>
            </Reveal>

          </div>
        </div>
      </section>

      {/* ══════════ FAQ SECTION ══════════ */}
               {/* ══════════ FAQ SECTION ══════════ */}
<section id="faq" className="bg-white py-20 md:py-24 px-6 md:px-8">
  <div className="max-w-3xl mx-auto">
    <Reveal direction="up" className="text-center mb-12">
      <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
        Frequently asked{" "}
        <span className="bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
          questions
        </span>
      </h2>

      <p className="text-gray-600 text-base">
        Everything you need to know about the Osmania University LMS platform.
      </p>
    </Reveal>

    <Reveal direction="up" delay={100}>
      <div className="bg-white rounded-2xl shadow-xl shadow-gray-200 border border-gray-100 overflow-hidden divide-y divide-gray-100">
        {faqs.map((faq, i) => (
          <div
            key={i}
            className="hover:bg-gray-50/50 transition-colors duration-300"
          >
            <button
              onClick={() => toggleFaq(i)}
              className="w-full flex items-center justify-between px-6 md:px-8 py-6 text-left hover:bg-blue-50/30 transition-all duration-300"
            >
              <span className="text-base font-semibold text-gray-900 pr-4">
                {faq.question}
              </span>

              <ChevronDown open={faqOpen === i} />
            </button>

            {faqOpen === i && (
              <div className="px-6 md:px-8 pb-6 bg-gradient-to-b from-blue-50/30 to-transparent">
                <p className="text-gray-600 text-sm leading-relaxed">
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
      

      {/* ══════════ FOOTER ══════════ */}
      <footer className="bg-gradient-to-b from-gray-50 to-white border-t border-gray-100 py-12 px-6 md:px-8">
        <div className="max-w-screen-xl mx-auto text-center">
          <p className="text-gray-600 text-sm mb-2">
            © 2024 Osmania University Learning Management System
          </p>
          <p className="text-gray-400 text-xs">
            Dedicated to advancing digital learning and academic excellence
          </p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;