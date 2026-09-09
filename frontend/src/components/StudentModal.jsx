import React, { useState, useEffect } from "react";

const COMMON_COURSES = [
  "Computer Science",
  "Information Technology",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Data Science",
  "Business Administration"
];

export default function StudentModal({ isOpen, onClose, onSubmit, initialData = null, isEdit = false }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    age: "",
    course: ""
  });
  const [customCourse, setCustomCourse] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      const isKnown = COMMON_COURSES.includes(initialData.course);
      setFormData({
        name: initialData.name || "",
        email: initialData.email || "",
        age: initialData.age || "",
        course: initialData.course || ""
      });
      setCustomCourse(!isKnown && Boolean(initialData.course));
    } else {
      setFormData({
        name: "",
        email: "",
        age: "",
        course: ""
      });
      setCustomCourse(false);
    }
    setErrors({});
    setServerError("");
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) {
      errs.name = "Student name is required";
    } else if (formData.name.trim().length < 2) {
      errs.name = "Name must be at least 2 characters";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      errs.email = "Email address is required";
    } else if (!emailRegex.test(formData.email.trim())) {
      errs.email = "Please enter a valid email address (e.g. user@example.com)";
    }

    const ageNum = Number(formData.age);
    if (!formData.age && formData.age !== 0) {
      errs.age = "Age is required";
    } else if (!Number.isInteger(ageNum) || ageNum <= 0 || ageNum > 120) {
      errs.age = "Age must be a valid number between 1 and 120";
    }

    if (!formData.course.trim()) {
      errs.course = "Course/Department is required";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleCourseSelect = (e) => {
    const val = e.target.value;
    if (val === "__custom__") {
      setCustomCourse(true);
      setFormData((prev) => ({ ...prev, course: "" }));
    } else {
      setCustomCourse(false);
      setFormData((prev) => ({ ...prev, course: val }));
      if (errors.course) setErrors((prev) => ({ ...prev, course: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setServerError("");

    try {
      await onSubmit({
        name: formData.name.trim(),
        email: formData.email.trim(),
        age: Number(formData.age),
        course: formData.course.trim()
      });
      onClose();
    } catch (err) {
      setServerError(err.message || "Failed to save student record");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{isEdit ? "✏️ Edit Student" : "➕ Add New Student"}</h3>
          <button className="modal-close-btn" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {serverError && (
              <div className="alert alert-danger">
                <strong>Error:</strong> {serverError}
              </div>
            )}

            {/* Name field */}
            <div className="form-group">
              <label htmlFor="student-name">Full Name <span className="text-danger">*</span></label>
              <input
                id="student-name"
                name="name"
                type="text"
                className={`form-control ${errors.name ? "is-invalid" : ""}`}
                placeholder="e.g. Rahul Sharma"
                value={formData.name}
                onChange={handleChange}
                autoFocus
              />
              {errors.name && <div className="invalid-feedback">{errors.name}</div>}
            </div>

            {/* Email field */}
            <div className="form-group">
              <label htmlFor="student-email">Email Address <span className="text-danger">*</span></label>
              <input
                id="student-email"
                name="email"
                type="email"
                className={`form-control ${errors.email ? "is-invalid" : ""}`}
                placeholder="e.g. rahul@example.com"
                value={formData.email}
                onChange={handleChange}
              />
              {errors.email && <div className="invalid-feedback">{errors.email}</div>}
            </div>

            {/* Age field */}
            <div className="form-group">
              <label htmlFor="student-age">Age <span className="text-danger">*</span></label>
              <input
                id="student-age"
                name="age"
                type="number"
                min="1"
                max="120"
                className={`form-control ${errors.age ? "is-invalid" : ""}`}
                placeholder="e.g. 21"
                value={formData.age}
                onChange={handleChange}
              />
              {errors.age && <div className="invalid-feedback">{errors.age}</div>}
            </div>

            {/* Course field */}
            <div className="form-group">
              <label htmlFor="student-course">Course / Department <span className="text-danger">*</span></label>
              {!customCourse ? (
                <div className="course-select-group">
                  <select
                    id="student-course"
                    className={`form-control ${errors.course ? "is-invalid" : ""}`}
                    value={formData.course}
                    onChange={handleCourseSelect}
                  >
                    <option value="">-- Select Course / Program --</option>
                    {COMMON_COURSES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                    <option value="__custom__">+ Other / Custom Program...</option>
                  </select>
                </div>
              ) : (
                <div className="custom-course-input-group">
                  <input
                    type="text"
                    name="course"
                    className={`form-control ${errors.course ? "is-invalid" : ""}`}
                    placeholder="Enter custom program name"
                    value={formData.course}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    className="btn btn-sm btn-link"
                    onClick={() => {
                      setCustomCourse(false);
                      setFormData((prev) => ({ ...prev, course: COMMON_COURSES[0] }));
                    }}
                  >
                    Select from list
                  </button>
                </div>
              )}
              {errors.course && <div className="invalid-feedback">{errors.course}</div>}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Saving..." : isEdit ? "Save Changes" : "Create Student"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
