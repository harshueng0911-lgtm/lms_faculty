import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../Header/Header.css';
import oulogo from "../../assets/images/Eng_college_log.png";
const Header = () => {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState('home');
  const handleNavClick = (path, navItem) => {
    setActiveNav(navItem);
    navigate(path);
  };
  return (
    <header className="header">
      <div className="header-container">
        <div className="logo-section">
          <div className="logo-icon">
            <span className="logo-text">L</span>
          </div>
          <h1 className="site-title">Lerno</h1>
        </div>
        
        <nav className="nav-links">
          <span 
            className={`nav-link ${activeNav === 'home' ? 'active' : ''}`}
            onClick={() => handleNavClick("/", 'home')}
          >
            Home
          </span>
          <span 
            className={`nav-link ${activeNav === 'courses' ? 'active' : ''}`}
            onClick={() => handleNavClick("/courses", 'courses')}
          >
            Courses
          </span>
          <span 
            className={`nav-link ${activeNav === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleNavClick("/dashboard", 'dashboard')}
          >
            Dashboard
          </span>
        </nav>
        <div className="header-actions">
          <button className="btn-sign-in" onClick={() => navigate("/faculty/login")}>
            Sign in
          </button>
          {/* ✅ THIS IS YOUR MAIN FIX */}
          <button 
            className="btn-get-started"
            onClick={() => navigate("/faculty/signup")}
          >
            Get started
          </button>
        </div>
      </div>
    </header>
  );
};
export default Header;


