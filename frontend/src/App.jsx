import React, { useState, useEffect, useCallback } from "react";
import Navbar from "./components/Navbar";
import Dashboard from "./components/Dashboard";
import StudentTable from "./components/StudentTable";
import StudentModal from "./components/StudentModal";
import StudentDetailsModal from "./components/StudentDetailsModal";
import ConfirmModal from "./components/ConfirmModal";
import Toast from "./components/Toast";
import {
  fetchStudents,
  fetchStudentStats,
  createStudent,
  updateStudent,
  deleteStudent
} from "./services/api";
import "./App.css";

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState("dashboard");

  // Students list state
  const [students, setStudents] = useState([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [studentsError, setStudentsError] = useState("");

  // Search and filter state
  const [search, setSearch] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [ageFilter, setAgeFilter] = useState("");

  // Dashboard stats state
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Modals state
  const [studentModal, setStudentModal] = useState({ isOpen: false, isEdit: false, student: null });
  const [detailsModal, setDetailsModal] = useState({ isOpen: false, student: null });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, student: null, deleting: false });

  // Notification Toast state
  const [toast, setToast] = useState({ message: "", type: "success" });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  const hideToast = () => {
    setToast({ message: "", type: "success" });
  };

  // Load Dashboard Statistics
  const loadStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const data = await fetchStudentStats();
      setStats(data);
    } catch (err) {
      console.error("Failed to load statistics:", err);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  // Load Students with current filters and pagination
  const loadStudents = useCallback(async (customParams = {}) => {
    setLoadingStudents(true);
    setStudentsError("");

    const queryParams = {
      page: customParams.page ?? page,
      limit: customParams.limit ?? limit,
      search: customParams.search !== undefined ? customParams.search : search,
      course: customParams.course !== undefined ? customParams.course : selectedCourse,
      age: customParams.age !== undefined ? customParams.age : ageFilter
    };

    try {
      const data = await fetchStudents(queryParams);
      setStudents(data.students || []);
      setTotalStudents(data.totalStudents || 0);
      setPage(data.page || 1);
      setLimit(data.limit || 10);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      setStudentsError(err.message || "Failed to fetch student data");
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  }, [page, limit, search, selectedCourse, ageFilter]);

  // Initial data load
  useEffect(() => {
    loadStats();
    loadStudents();
  }, [loadStats, loadStudents]);

  // Course options derived from stats or loaded data
  const availableCourses = React.useMemo(() => {
    const list = new Set();
    if (stats?.courses) {
      stats.courses.forEach((c) => list.add(c.course));
    }
    students.forEach((s) => {
      if (s.course) list.add(s.course);
    });
    return Array.from(list).sort();
  }, [stats, students]);

  // Search submission handler
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadStudents({ page: 1 });
  };

  // Reset all filters handler
  const handleResetFilters = () => {
    setSearch("");
    setSelectedCourse("");
    setAgeFilter("");
    setPage(1);
    loadStudents({ search: "", course: "", age: "", page: 1 });
  };

  // Page change handler
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
    loadStudents({ page: newPage });
  };

  // Items per page change handler
  const handleLimitChange = (newLimit) => {
    setLimit(newLimit);
    setPage(1);
    loadStudents({ limit: newLimit, page: 1 });
  };

  // Add Student click
  const handleAddClick = () => {
    setStudentModal({ isOpen: true, isEdit: false, student: null });
  };

  // Edit Student click
  const handleEditClick = (student) => {
    setStudentModal({ isOpen: true, isEdit: true, student });
  };

  // View Student details click
  const handleViewClick = (student) => {
    setDetailsModal({ isOpen: true, student });
  };

  // Open Delete confirmation
  const handleDeleteClick = (student) => {
    setConfirmModal({ isOpen: true, student, deleting: false });
  };

  // Save (Create or Update) Student
  const handleSaveStudent = async (formData) => {
    if (studentModal.isEdit && studentModal.student?.id) {
      await updateStudent(studentModal.student.id, formData);
      showToast(`Student "${formData.name}" updated successfully!`, "success");
    } else {
      await createStudent(formData);
      showToast(`Student "${formData.name}" added successfully!`, "success");
    }
    loadStudents();
    loadStats();
  };

  // Confirm Delete Student
  const handleConfirmDelete = async () => {
    const student = confirmModal.student;
    if (!student) return;

    setConfirmModal((prev) => ({ ...prev, deleting: true }));
    try {
      await deleteStudent(student.id);
      showToast(`Student "${student.name}" deleted successfully`, "success");
      setConfirmModal({ isOpen: false, student: null, deleting: false });
      loadStudents();
      loadStats();
    } catch (err) {
      showToast(err.message || "Failed to delete student", "danger");
      setConfirmModal((prev) => ({ ...prev, deleting: false }));
    }
  };

  return (
    <div className="app-layout">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onAddClick={handleAddClick}
      />

      {/* Main View Area */}
      <main className="main-content">
        {activeTab === "dashboard" ? (
          <Dashboard
            stats={stats}
            loading={loadingStats}
            onRefresh={() => {
              loadStats();
              loadStudents();
            }}
            onViewStudents={() => setActiveTab("students")}
            onAddStudent={handleAddClick}
          />
        ) : (
          <StudentTable
            students={students}
            totalStudents={totalStudents}
            page={page}
            totalPages={totalPages}
            limit={limit}
            loading={loadingStudents}
            error={studentsError}
            search={search}
            setSearch={setSearch}
            selectedCourse={selectedCourse}
            setSelectedCourse={setSelectedCourse}
            ageFilter={ageFilter}
            setAgeFilter={setAgeFilter}
            availableCourses={availableCourses}
            onSearchSubmit={handleSearchSubmit}
            onResetFilters={handleResetFilters}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
            onViewStudent={handleViewClick}
            onEditStudent={handleEditClick}
            onDeleteStudent={handleDeleteClick}
            onAddStudent={handleAddClick}
            onRetry={() => loadStudents()}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <span>Student Management System &copy; 2026</span>
          <span className="footer-tech">React &bull; Express &bull; PostgreSQL</span>
        </div>
      </footer>

      {/* Modals */}
      <StudentModal
        isOpen={studentModal.isOpen}
        onClose={() => setStudentModal({ isOpen: false, isEdit: false, student: null })}
        onSubmit={handleSaveStudent}
        initialData={studentModal.student}
        isEdit={studentModal.isEdit}
      />

      <StudentDetailsModal
        isOpen={detailsModal.isOpen}
        onClose={() => setDetailsModal({ isOpen: false, student: null })}
        student={detailsModal.student}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, student: null, deleting: false })}
        onConfirm={handleConfirmDelete}
        student={confirmModal.student}
        deleting={confirmModal.deleting}
      />

      {/* Global Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={hideToast}
      />
    </div>
  );
}
