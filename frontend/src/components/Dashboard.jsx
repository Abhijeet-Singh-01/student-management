import React from "react";

export default function Dashboard({ stats, loading, onRefresh, onViewStudents, onAddStudent }) {
  if (loading && !stats) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading dashboard metrics...</p>
      </div>
    );
  }

  const totalStudents = stats?.totalStudents || 0;
  const averageAge = stats?.averageAge || 0;
  const courses = stats?.courses || [];

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h1 className="page-title">System Dashboard</h1>
          <p className="page-subtitle">Real-time overview of student enrollment and department metrics</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={onRefresh} disabled={loading}>
            {loading ? "Refreshing..." : "🔄 Refresh"}
          </button>
          <button className="btn btn-primary" onClick={onAddStudent}>
            + Add New Student
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper bg-blue-light">
            <span className="stat-icon">👥</span>
          </div>
          <div className="stat-content">
            <span className="stat-label">Total Enrolled</span>
            <h2 className="stat-value">{totalStudents}</h2>
            <span className="stat-hint">Active students in database</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper bg-green-light">
            <span className="stat-icon">🎂</span>
          </div>
          <div className="stat-content">
            <span className="stat-label">Average Student Age</span>
            <h2 className="stat-value">{averageAge} <span className="stat-unit">yrs</span></h2>
            <span className="stat-hint">Across all departments</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper bg-purple-light">
            <span className="stat-icon">📚</span>
          </div>
          <div className="stat-content">
            <span className="stat-label">Active Courses</span>
            <h2 className="stat-value">{courses.length}</h2>
            <span className="stat-hint">Distinct academic programs</span>
          </div>
        </div>
      </div>

      {/* Course Breakdown Section */}
      <div className="dashboard-content-grid">
        <div className="card course-breakdown-card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Course & Department Distribution</h3>
              <p className="card-subtitle">Student enrollment numbers by study program</p>
            </div>
            <button className="btn btn-sm btn-outline" onClick={onViewStudents}>
              View All Students &rarr;
            </button>
          </div>

          <div className="card-body">
            {courses.length === 0 ? (
              <div className="empty-state-card">
                <p>No student enrollment data available yet.</p>
                <button className="btn btn-sm btn-primary mt-2" onClick={onAddStudent}>
                  Enroll First Student
                </button>
              </div>
            ) : (
              <div className="course-list">
                {courses.map((c) => {
                  const percentage = totalStudents > 0 ? Math.round((c.count / totalStudents) * 100) : 0;
                  return (
                    <div key={c.course} className="course-item">
                      <div className="course-meta">
                        <span className="course-name">{c.course}</span>
                        <span className="course-count">
                          <strong>{c.count}</strong> students ({percentage}%)
                        </span>
                      </div>
                      <div className="progress-bar-bg">
                        <div
                          className="progress-bar-fill"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions Card */}
        <div className="card quick-actions-card">
          <div className="card-header">
            <h3 className="card-title">Quick Actions</h3>
          </div>
          <div className="card-body action-buttons-list">
            <button className="action-btn" onClick={onAddStudent}>
              <span className="action-btn-icon">➕</span>
              <div className="action-btn-text">
                <strong>Register Student</strong>
                <small>Add new student record to PostgreSQL</small>
              </div>
            </button>

            <button className="action-btn" onClick={onViewStudents}>
              <span className="action-btn-icon">📋</span>
              <div className="action-btn-text">
                <strong>Manage Students</strong>
                <small>Search, filter, update or remove records</small>
              </div>
            </button>

            <div className="system-health-box">
              <div className="health-status">
                <span className="status-dot online"></span>
                <span>System Status: Online</span>
              </div>
              <small className="text-muted">PostgreSQL Database Connected</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
