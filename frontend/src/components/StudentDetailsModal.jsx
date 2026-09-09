import React from "react";

export default function StudentDetailsModal({ isOpen, onClose, student, onEdit, onDelete }) {
  if (!isOpen || !student) return null;

  const initials = student.name
    ? student.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "ST";

  const formattedDate = student.created_at
    ? new Date(student.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
      })
    : "N/A";

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog modal-sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Student Profile</h3>
          <button className="modal-close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body profile-body">
          <div className="profile-avatar">
            <span>{initials}</span>
          </div>

          <h2 className="profile-name">{student.name}</h2>
          <span className="profile-badge">{student.course}</span>

          <div className="profile-details-list">
            <div className="profile-row">
              <span className="profile-label">Student ID</span>
              <span className="profile-value">#{student.id}</span>
            </div>

            <div className="profile-row">
              <span className="profile-label">Email Address</span>
              <span className="profile-value">{student.email}</span>
            </div>

            <div className="profile-row">
              <span className="profile-label">Age</span>
              <span className="profile-value">{student.age} years old</span>
            </div>

            <div className="profile-row">
              <span className="profile-label">Department / Course</span>
              <span className="profile-value">{student.course}</span>
            </div>

            <div className="profile-row">
              <span className="profile-label">Enrolled Date</span>
              <span className="profile-value">{formattedDate}</span>
            </div>
          </div>
        </div>

        <div className="modal-footer profile-footer">
          <button
            type="button"
            className="btn btn-outline-danger"
            onClick={() => {
              onClose();
              onDelete(student);
            }}
          >
            🗑️ Delete
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              onClose();
              onEdit(student);
            }}
          >
            ✏️ Edit Student
          </button>
        </div>
      </div>
    </div>
  );
}
