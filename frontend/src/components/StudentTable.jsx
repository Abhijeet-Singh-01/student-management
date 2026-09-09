import React from "react";

export default function StudentTable({
  students,
  totalStudents,
  page,
  totalPages,
  limit,
  loading,
  error,
  search,
  setSearch,
  selectedCourse,
  setSelectedCourse,
  ageFilter,
  setAgeFilter,
  availableCourses = [],
  onSearchSubmit,
  onResetFilters,
  onPageChange,
  onLimitChange,
  onViewStudent,
  onEditStudent,
  onDeleteStudent,
  onAddStudent,
  onRetry
}) {
  const hasActiveFilters = Boolean(search || selectedCourse || ageFilter);

  return (
    <div className="students-view">
      <div className="page-header">
        <div>
          <h1 className="page-title">Student Directory</h1>
          <p className="page-subtitle">View, search, filter, and manage enrolled students</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={onAddStudent}>
            + Add New Student
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="card filter-card">
        <form onSubmit={onSearchSubmit} className="filter-form">
          <div className="filter-group search-input-wrapper">
            <label className="filter-label" htmlFor="search-input">Search Students</label>
            <div className="search-bar">
              <span className="search-icon">🔍</span>
              <input
                id="search-input"
                type="text"
                className="form-control search-input"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  type="button"
                  className="clear-search-btn"
                  onClick={() => {
                    setSearch("");
                  }}
                  title="Clear search"
                >
                  &times;
                </button>
              )}
            </div>
          </div>

          <div className="filter-group">
            <label className="filter-label" htmlFor="course-select">Filter by Course</label>
            <select
              id="course-select"
              className="form-control"
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
            >
              <option value="">All Courses</option>
              {availableCourses.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="filter-group age-filter-wrapper">
            <label className="filter-label" htmlFor="age-input">Filter by Age</label>
            <input
              id="age-input"
              type="number"
              min="1"
              max="120"
              className="form-control"
              placeholder="e.g. 21"
              value={ageFilter}
              onChange={(e) => setAgeFilter(e.target.value)}
            />
          </div>

          <div className="filter-actions">
            <button type="submit" className="btn btn-secondary">
              Search
            </button>
            {hasActiveFilters && (
              <button
                type="button"
                className="btn btn-outline"
                onClick={onResetFilters}
                title="Reset all filters"
              >
                Reset
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Main Table Card */}
      <div className="card table-card">
        {loading ? (
          <div className="table-loading-state">
            <div className="spinner"></div>
            <p>Loading students data...</p>
          </div>
        ) : error ? (
          <div className="table-error-state">
            <span className="error-icon">⚠️</span>
            <h3>Failed to load students</h3>
            <p className="text-muted">{error}</p>
            <button className="btn btn-primary btn-sm mt-2" onClick={onRetry}>
              Try Again
            </button>
          </div>
        ) : students.length === 0 ? (
          <div className="table-empty-state">
            <span className="empty-icon">📂</span>
            <h3>No students found</h3>
            <p className="text-muted">
              {hasActiveFilters
                ? "No students match your current search and filter criteria."
                : "The student database is currently empty."}
            </p>
            <div className="empty-actions">
              {hasActiveFilters ? (
                <button className="btn btn-outline" onClick={onResetFilters}>
                  Clear Search & Filters
                </button>
              ) : (
                <button className="btn btn-primary" onClick={onAddStudent}>
                  + Add First Student
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="student-table">
                <thead>
                  <tr>
                    <th style={{ width: "70px" }}>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th style={{ width: "90px" }}>Age</th>
                    <th>Course / Dept</th>
                    <th style={{ width: "160px" }} className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id}>
                      <td className="student-id-cell">#{student.id}</td>
                      <td className="student-name-cell">
                        <strong>{student.name}</strong>
                      </td>
                      <td className="student-email-cell">{student.email}</td>
                      <td>
                        <span className="badge-age">{student.age} yrs</span>
                      </td>
                      <td>
                        <span className="badge-course">{student.course}</span>
                      </td>
                      <td className="text-right actions-cell">
                        <button
                          className="btn-action btn-view"
                          onClick={() => onViewStudent(student)}
                          title="View student details"
                          aria-label={`View ${student.name}`}
                        >
                          👁️ View
                        </button>
                        <button
                          className="btn-action btn-edit"
                          onClick={() => onEditStudent(student)}
                          title="Edit student"
                          aria-label={`Edit ${student.name}`}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          className="btn-action btn-delete"
                          onClick={() => onDeleteStudent(student)}
                          title="Delete student"
                          aria-label={`Delete ${student.name}`}
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="pagination-bar">
              <div className="pagination-info">
                <span>
                  Showing page <strong>{page}</strong> of <strong>{totalPages}</strong> (
                  <strong>{totalStudents}</strong> total {totalStudents === 1 ? "student" : "students"})
                </span>
                <div className="limit-selector">
                  <label htmlFor="limit-select">Per page:</label>
                  <select
                    id="limit-select"
                    className="form-control form-control-sm"
                    value={limit}
                    onChange={(e) => onLimitChange(Number(e.target.value))}
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>

              <div className="pagination-nav">
                <button
                  className="btn btn-sm btn-outline"
                  onClick={() => onPageChange(page - 1)}
                  disabled={page <= 1}
                >
                  &larr; Previous
                </button>

                <div className="page-numbers">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                    .map((p, idx, arr) => {
                      const prev = arr[idx - 1];
                      return (
                        <React.Fragment key={p}>
                          {prev && p - prev > 1 && <span className="page-ellipsis">...</span>}
                          <button
                            className={`btn-page ${page === p ? "active" : ""}`}
                            onClick={() => onPageChange(p)}
                          >
                            {p}
                          </button>
                        </React.Fragment>
                      );
                    })}
                </div>

                <button
                  className="btn btn-sm btn-outline"
                  onClick={() => onPageChange(page + 1)}
                  disabled={page >= totalPages}
                >
                  Next &rarr;
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
