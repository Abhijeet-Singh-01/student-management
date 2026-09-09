import React from "react";

export default function Navbar({ activeTab, setActiveTab, onAddClick }) {
  return (
    <header className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand" onClick={() => setActiveTab("dashboard")}>
          <div className="brand-icon">🎓</div>
          <div>
            <span className="brand-title">EduManage</span>
            <span className="brand-subtitle">Student Management System</span>
          </div>
        </div>

        <nav className="navbar-nav">
          <button
            className={`nav-link ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={() => setActiveTab("dashboard")}
          >
            📊 Dashboard
          </button>
          <button
            className={`nav-link ${activeTab === "students" ? "active" : ""}`}
            onClick={() => setActiveTab("students")}
          >
            👥 Students
          </button>
        </nav>

        <div className="navbar-actions">
          <button className="btn btn-primary" onClick={onAddClick}>
            <span className="btn-icon">+</span> Add Student
          </button>
        </div>
      </div>
    </header>
  );
}
