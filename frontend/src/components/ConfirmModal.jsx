import React from "react";

export default function ConfirmModal({ isOpen, onClose, onConfirm, student, deleting }) {
  if (!isOpen || !student) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog modal-sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header modal-header-danger">
          <h3 className="modal-title">⚠️ Confirm Deletion</h3>
          <button className="modal-close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          <p>Are you sure you want to permanently delete student:</p>
          <div className="delete-target-box">
            <strong>{student.name}</strong> ({student.email})
            <br />
            <small className="text-muted">Course: {student.course}</small>
          </div>
          <p className="text-danger-notice">This action cannot be undone.</p>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={deleting}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={onConfirm}
            disabled={deleting}
          >
            {deleting ? "Deleting..." : "Yes, Delete Student"}
          </button>
        </div>
      </div>
    </div>
  );
}
