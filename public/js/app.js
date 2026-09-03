// EduManage Pro — Frontend Reactive UI Controller
document.addEventListener("DOMContentLoaded", () => {
    // App State
    const state = {
        activeTab: "dashboard",
        students: [],
        pagination: {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 1
        },
        filters: {
            search: "",
            course: "",
            status: "",
            sort_by: "id",
            order: "ASC"
        },
        departments: [],
        courses: [],
        currentEditId: null,
        currentDeleteId: null,
        charts: {
            course: null,
            department: null
        }
    };

    // Cached Elements
    const el = {
        navItems: document.querySelectorAll(".nav-item"),
        views: document.querySelectorAll(".view-section"),
        themeToggle: document.getElementById("themeToggle"),
        dbStatusText: document.getElementById("dbStatusText"),
        
        // Stats
        totalStudents: document.getElementById("totalStudents"),
        activeStudents: document.getElementById("activeStudents"),
        graduatedStudents: document.getElementById("graduatedStudents"),
        averageGpa: document.getElementById("averageGpa"),
        averageAge: document.getElementById("averageAge"),
        recentStudentsBody: document.getElementById("recentStudentsBody"),

        // Student Table & Controls
        studentsTableBody: document.getElementById("studentsTableBody"),
        searchInput: document.getElementById("searchInput"),
        filterCourse: document.getElementById("filterCourse"),
        filterStatus: document.getElementById("filterStatus"),
        sortSelect: document.getElementById("sortSelect"),
        btnClearFilters: document.getElementById("btnClearFilters"),
        btnOpenAddModal: document.getElementById("btnOpenAddModal"),
        pageIndicator: document.getElementById("pageIndicator"),
        btnPrevPage: document.getElementById("btnPrevPage"),
        btnNextPage: document.getElementById("btnNextPage"),

        // Modals
        studentModal: document.getElementById("studentModal"),
        studentModalTitle: document.getElementById("studentModalTitle"),
        studentForm: document.getElementById("studentForm"),
        closeStudentModal: document.getElementById("closeStudentModal"),
        btnCancelStudent: document.getElementById("btnCancelStudent"),

        detailsModal: document.getElementById("detailsModal"),
        detailsContent: document.getElementById("detailsContent"),
        closeDetailsModal: document.getElementById("closeDetailsModal"),

        deleteModal: document.getElementById("deleteModal"),
        deleteStudentName: document.getElementById("deleteStudentName"),
        closeDeleteModal: document.getElementById("closeDeleteModal"),
        btnCancelDelete: document.getElementById("btnCancelDelete"),
        btnConfirmDelete: document.getElementById("btnConfirmDelete"),

        // Auth
        btnAuthAction: document.getElementById("btnAuthAction"),
        authUserBadge: document.getElementById("authUserBadge"),
        authModal: document.getElementById("authModal"),
        authForm: document.getElementById("authForm"),
        authUsername: document.getElementById("authUsername"),
        authPassword: document.getElementById("authPassword"),
        closeAuthModal: document.getElementById("closeAuthModal"),
        btnCancelAuth: document.getElementById("btnCancelAuth"),

        // Insights View
        insightsContainer: document.getElementById("insightsContainer"),
        departmentsGrid: document.getElementById("departmentsGrid"),

        toastContainer: document.getElementById("toastContainer")
    };

    // Initialize
    init();

    async function init() {
        setupTheme();
        updateAuthBadge();
        setupEvents();
        await checkHealth();
        await loadMetadata();
        await loadDashboard();
    }

    // ==========================================
    // Theme Management
    // ==========================================
    function setupTheme() {
        const savedTheme = localStorage.getItem("sms_theme") || "light";
        document.documentElement.setAttribute("data-theme", savedTheme);

        el.themeToggle.addEventListener("click", () => {
            const currentTheme = document.documentElement.getAttribute("data-theme");
            const newTheme = currentTheme === "dark" ? "light" : "dark";
            document.documentElement.setAttribute("data-theme", newTheme);
            localStorage.setItem("sms_theme", newTheme);
            if (state.activeTab === "dashboard") loadDashboard();
        });
    }

    // ==========================================
    // Health Check
    // ==========================================
    async function checkHealth() {
        try {
            const health = await API.getHealth();
            if (health.status === "UP") {
                el.dbStatusText.textContent = `PostgreSQL: Connected (${health.database.latency_ms}ms)`;
            }
        } catch {
            el.dbStatusText.textContent = "PostgreSQL: Offline";
            el.dbStatusText.style.color = "#ef4444";
        }
    }

    // ==========================================
    // Load Departments & Courses Metadata
    // ==========================================
    async function loadMetadata() {
        try {
            state.departments = await API.getDepartments();
            state.courses = await API.getCourses();

            // Populate course dropdown in filter
            const filterCourse = document.getElementById("filterCourse");
            const studentCourse = document.getElementById("studentCourse");
            const studentDept = document.getElementById("studentDepartment");

            if (filterCourse) {
                const existingCourses = [...new Set(state.courses.map(c => c.code))];
                filterCourse.innerHTML = `<option value="">All Courses</option>` +
                    existingCourses.map(c => `<option value="${c}">${c}</option>`).join("");
            }

            if (studentDept) {
                studentDept.innerHTML = `<option value="">Select Department</option>` +
                    state.departments.map(d => `<option value="${d.id}">${d.name} (${d.code})</option>`).join("");
            }
        } catch (err) {
            console.error("Failed to load metadata:", err);
        }
    }

    // ==========================================
    // Event Setup
    // ==========================================
    function setupEvents() {
        // Navigation Tabs
        el.navItems.forEach(item => {
            item.addEventListener("click", () => {
                const tab = item.dataset.tab;
                switchTab(tab);
            });
        });

        // Search & Filters (debounced search)
        let debounceTimer;
        el.searchInput.addEventListener("input", (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                state.filters.search = e.target.value.trim();
                state.pagination.page = 1;
                loadStudentsTable();
            }, 300);
        });

        el.filterCourse.addEventListener("change", (e) => {
            state.filters.course = e.target.value;
            state.pagination.page = 1;
            loadStudentsTable();
        });

        el.filterStatus.addEventListener("change", (e) => {
            state.filters.status = e.target.value;
            state.pagination.page = 1;
            loadStudentsTable();
        });

        el.sortSelect.addEventListener("change", (e) => {
            const [sort_by, order] = e.target.value.split(":");
            state.filters.sort_by = sort_by;
            state.filters.order = order;
            loadStudentsTable();
        });

        el.btnClearFilters.addEventListener("click", () => {
            el.searchInput.value = "";
            el.filterCourse.value = "";
            el.filterStatus.value = "";
            el.sortSelect.value = "id:ASC";
            state.filters = { search: "", course: "", status: "", sort_by: "id", order: "ASC" };
            state.pagination.page = 1;
            loadStudentsTable();
        });

        // Pagination
        el.btnPrevPage.addEventListener("click", () => {
            if (state.pagination.page > 1) {
                state.pagination.page--;
                loadStudentsTable();
            }
        });

        el.btnNextPage.addEventListener("click", () => {
            if (state.pagination.page < state.pagination.totalPages) {
                state.pagination.page++;
                loadStudentsTable();
            }
        });

        // Modal Triggers
        el.btnOpenAddModal.addEventListener("click", () => openStudentModal("add"));
        el.closeStudentModal.addEventListener("click", closeStudentModal);
        el.btnCancelStudent.addEventListener("click", closeStudentModal);
        el.closeDetailsModal.addEventListener("click", closeDetailsModal);
        el.closeDeleteModal.addEventListener("click", closeDeleteModal);
        el.btnCancelDelete.addEventListener("click", closeDeleteModal);

        el.studentForm.addEventListener("submit", handleStudentSubmit);
        el.btnConfirmDelete.addEventListener("click", handleConfirmDelete);

        // Auth Listeners
        if (el.btnAuthAction) el.btnAuthAction.addEventListener("click", handleAuthAction);
        if (el.closeAuthModal) el.closeAuthModal.addEventListener("click", closeAuthModal);
        if (el.btnCancelAuth) el.btnCancelAuth.addEventListener("click", closeAuthModal);
        if (el.authForm) el.authForm.addEventListener("submit", handleAuthSubmit);
    }

    function closeAuthModal() {
        if (el.authModal) el.authModal.classList.remove("open");
    }

    function updateAuthBadge() {
        const user = API.getCurrentUser();
        if (user && el.authUserBadge) {
            el.authUserBadge.innerHTML = `👤 <strong>${escapeHtml(user.username)}</strong> (${user.role}) &bull; Logout`;
        } else if (el.authUserBadge) {
            el.authUserBadge.innerHTML = "🔑 Login";
        }
    }

    function handleAuthAction() {
        const user = API.getCurrentUser();
        if (user) {
            API.logout();
            showToast("Logged out successfully", "info");
            updateAuthBadge();
        } else {
            el.authForm.reset();
            el.authModal.classList.add("open");
        }
    }

    async function handleAuthSubmit(e) {
        e.preventDefault();
        try {
            const username = el.authUsername.value.trim();
            const password = el.authPassword.value;
            const res = await API.login(username, password);
            showToast(`Welcome back, ${res.user.username} (${res.user.role})!`, "success");
            closeAuthModal();
            updateAuthBadge();
        } catch (err) {
            showToast(err.message || "Invalid credentials", "error");
        }
    }

    // ==========================================
    // Tab Switching
    // ==========================================
    function switchTab(tab) {
        state.activeTab = tab;
        el.navItems.forEach(i => i.classList.toggle("active", i.dataset.tab === tab));
        el.views.forEach(v => v.style.display = v.id === `${tab}-view` ? "block" : "none");

        if (tab === "dashboard") loadDashboard();
        if (tab === "students") loadStudentsTable();
        if (tab === "insights") loadInsights();
        if (tab === "departments") loadDepartmentsView();
    }

    // ==========================================
    // Dashboard Loader & Charts
    // ==========================================
    async function loadDashboard() {
        try {
            const insights = await API.getInsights();
            const stats = insights.database_statistics;

            el.totalStudents.textContent = stats.total_students;
            el.activeStudents.textContent = stats.active_students;
            el.graduatedStudents.textContent = stats.graduated_students;
            el.averageGpa.textContent = stats.average_gpa.toFixed(2);
            el.averageAge.textContent = `${stats.average_age} yrs`;

            // Render Recent Students
            const res = await API.getStudents({ limit: 5, sort_by: "id", order: "DESC" });
            const recent = Array.isArray(res) ? res : res.data;
            renderRecentTable(recent);

            // Render Charts
            renderCharts(insights);
        } catch (err) {
            showToast("Failed to load dashboard statistics", "error");
        }
    }

    function renderRecentTable(students) {
        if (!students || students.length === 0) {
            el.recentStudentsBody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text-muted);">No students registered yet.</td></tr>`;
            return;
        }

        el.recentStudentsBody.innerHTML = students.map(s => `
            <tr>
                <td><strong>#${s.id}</strong></td>
                <td><strong>${escapeHtml(s.name)}</strong></td>
                <td>${escapeHtml(s.course)}</td>
                <td><span class="badge badge-gpa">${parseFloat(s.gpa).toFixed(2)}</span></td>
                <td><span class="badge badge-${(s.status || 'Active').toLowerCase()}">${s.status || 'Active'}</span></td>
            </tr>
        `).join("");
    }

    function renderCharts(insights) {
        const isDark = document.documentElement.getAttribute("data-theme") === "dark";
        const textColor = isDark ? "#94a3b8" : "#64748b";

        // 1. Course Doughnut Chart
        const courseCtx = document.getElementById("courseChart")?.getContext("2d");
        if (courseCtx && insights.course_distribution) {
            if (state.charts.course) state.charts.course.destroy();
            state.charts.course = new Chart(courseCtx, {
                type: "doughnut",
                data: {
                    labels: insights.course_distribution.map(c => c.course),
                    datasets: [{
                        data: insights.course_distribution.map(c => c.count),
                        backgroundColor: ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: "bottom", labels: { color: textColor, font: { size: 12 } } }
                    }
                }
            });
        }

        // 2. Department Bar Chart
        const deptCtx = document.getElementById("deptChart")?.getContext("2d");
        if (deptCtx && insights.department_distribution) {
            if (state.charts.department) state.charts.department.destroy();
            state.charts.department = new Chart(deptCtx, {
                type: "bar",
                data: {
                    labels: insights.department_distribution.map(d => d.code),
                    datasets: [{
                        label: "Students",
                        data: insights.department_distribution.map(d => d.count),
                        backgroundColor: "#3b82f6",
                        borderRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { ticks: { color: textColor }, grid: { display: false } },
                        y: { ticks: { color: textColor, stepSize: 1 }, grid: { color: isDark ? "#334155" : "#f1f5f9" } }
                    },
                    plugins: {
                        legend: { display: false }
                    }
                }
            });
        }
    }

    // ==========================================
    // Students Directory Table
    // ==========================================
    async function loadStudentsTable() {
        try {
            const params = {
                page: state.pagination.page,
                limit: state.pagination.limit,
                ...state.filters
            };
            const res = await API.getStudents(params);
            
            if (res.data) {
                state.students = res.data;
                state.pagination = res.pagination;
            } else {
                state.students = res;
            }

            renderStudentsTable(state.students);
            renderPagination();
            updateExportLinks();
        } catch (err) {
            showToast("Failed to fetch students directory", "error");
        }
    }

    function updateExportLinks() {
        const queryParams = new URLSearchParams();
        if (state.filters.search) queryParams.append("search", state.filters.search);
        if (state.filters.course) queryParams.append("course", state.filters.course);
        if (state.filters.status) queryParams.append("status", state.filters.status);
        if (state.filters.sort_by) queryParams.append("sort_by", state.filters.sort_by);
        if (state.filters.order) queryParams.append("order", state.filters.order);

        const qs = queryParams.toString() ? `?${queryParams.toString()}` : "";
        const csvBtn = document.getElementById("btnExportCSV");
        const pdfBtn = document.getElementById("btnExportPDF");
        if (csvBtn) csvBtn.href = `/students/export/csv${qs}`;
        if (pdfBtn) pdfBtn.href = `/students/export/pdf${qs}`;
    }

    function renderStudentsTable(students) {
        if (!students || students.length === 0) {
            el.studentsTableBody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:32px;color:var(--text-muted);">No matching student records found.</td></tr>`;
            return;
        }

        el.studentsTableBody.innerHTML = students.map(s => `
            <tr>
                <td><strong>#${s.id}</strong></td>
                <td>
                    <div style="font-weight:600;">${escapeHtml(s.name)}</div>
                    <div style="font-size:12px;color:var(--text-muted);">${escapeHtml(s.email)}</div>
                </td>
                <td>${s.age}</td>
                <td><span class="badge" style="background-color:var(--border-subtle);">${escapeHtml(s.course)}</span></td>
                <td>${escapeHtml(s.department_name || "Unassigned")}</td>
                <td><span class="badge badge-gpa">${parseFloat(s.gpa).toFixed(2)}</span></td>
                <td><span class="badge badge-${(s.status || 'Active').toLowerCase()}">${s.status || 'Active'}</span></td>
                <td>
                    <div class="actions-cell">
                        <button class="btn-icon" title="View Profile" onclick="window.viewStudentDetails(${s.id})">
                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="16" height="16">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                        </button>
                        <button class="btn-icon" title="Edit Student" onclick="window.openEditStudent(${s.id})">
                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="16" height="16">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </button>
                        <button class="btn-icon delete" title="Delete Student" onclick="window.openDeleteModal(${s.id}, '${escapeHtml(s.name)}')">
                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="16" height="16">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>
        `).join("");
    }

    function renderPagination() {
        const { page, totalPages, total } = state.pagination;
        el.pageIndicator.textContent = `Page ${page} of ${totalPages || 1} (${total} total records)`;
        el.btnPrevPage.disabled = page <= 1;
        el.btnNextPage.disabled = page >= totalPages;
    }

    // ==========================================
    // Modal Handlers (Add / Edit)
    // ==========================================
    function openStudentModal(mode, student = null) {
        state.currentEditId = mode === "edit" ? student.id : null;
        el.studentModalTitle.textContent = mode === "edit" ? `Edit Student #${student.id}` : "Register New Student";

        document.getElementById("studentName").value = student ? student.name : "";
        document.getElementById("studentEmail").value = student ? student.email : "";
        document.getElementById("studentAge").value = student ? student.age : "";
        document.getElementById("studentCourse").value = student ? student.course : "";
        document.getElementById("studentPhone").value = student && student.phone ? student.phone : "";
        document.getElementById("studentGpa").value = student && student.gpa ? student.gpa : "3.50";
        document.getElementById("studentStatus").value = student && student.status ? student.status : "Active";
        document.getElementById("studentDepartment").value = student && student.department_id ? student.department_id : "";

        el.studentModal.classList.add("open");
    }

    function closeStudentModal() {
        el.studentModal.classList.remove("open");
        el.studentForm.reset();
        state.currentEditId = null;
    }

    async function handleStudentSubmit(e) {
        e.preventDefault();

        const payload = {
            name: document.getElementById("studentName").value.trim(),
            email: document.getElementById("studentEmail").value.trim(),
            age: parseInt(document.getElementById("studentAge").value, 10),
            course: document.getElementById("studentCourse").value.trim(),
            phone: document.getElementById("studentPhone").value.trim(),
            gpa: parseFloat(document.getElementById("studentGpa").value),
            status: document.getElementById("studentStatus").value,
            department_id: document.getElementById("studentDepartment").value ? parseInt(document.getElementById("studentDepartment").value, 10) : null
        };

        try {
            if (state.currentEditId) {
                await API.updateStudent(state.currentEditId, payload);
                showToast("Student updated successfully!", "success");
            } else {
                await API.createStudent(payload);
                showToast("New student registered successfully!", "success");
            }
            closeStudentModal();
            loadStudentsTable();
            loadDashboard();
        } catch (err) {
            showToast(err.message, "error");
        }
    }

    // ==========================================
    // Student Details Modal
    // ==========================================
    window.viewStudentDetails = async function(id) {
        try {
            const student = await API.getStudentById(id);
            const enrolledHtml = student.enrolled_courses && student.enrolled_courses.length > 0
                ? `<table class="data-table" style="margin-top:10px;">
                    <thead>
                        <tr><th>Code</th><th>Course</th><th>Credits</th><th>Grade</th></tr>
                    </thead>
                    <tbody>
                        ${student.enrolled_courses.map(c => `
                            <tr>
                                <td><strong>${c.course_code}</strong></td>
                                <td>${c.course_title}</td>
                                <td>${c.credits}</td>
                                <td><span class="badge badge-gpa">${c.grade}</span></td>
                            </tr>
                        `).join("")}
                    </tbody>
                   </table>`
                : `<p style="color:var(--text-muted);font-size:13px;margin-top:8px;">No courses currently enrolled.</p>`;

            el.detailsContent.innerHTML = `
                <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px;">
                    <div style="width:60px;height:60px;border-radius:var(--radius-full);background:var(--primary);color:#fff;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:700;">
                        ${student.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <h3 style="font-size:20px;">${escapeHtml(student.name)}</h3>
                        <p style="color:var(--text-muted);font-size:13px;">${escapeHtml(student.email)} • Phone: ${student.phone || "N/A"}</p>
                    </div>
                </div>

                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px;font-size:13px;">
                    <div style="background:var(--border-subtle);padding:12px;border-radius:var(--radius-sm);">
                        <span style="color:var(--text-muted);">Major / Course:</span>
                        <div style="font-weight:600;font-size:15px;margin-top:2px;">${escapeHtml(student.course)}</div>
                    </div>
                    <div style="background:var(--border-subtle);padding:12px;border-radius:var(--radius-sm);">
                        <span style="color:var(--text-muted);">Department:</span>
                        <div style="font-weight:600;font-size:15px;margin-top:2px;">${escapeHtml(student.department_name || "Unassigned")}</div>
                    </div>
                    <div style="background:var(--border-subtle);padding:12px;border-radius:var(--radius-sm);">
                        <span style="color:var(--text-muted);">Cumulative GPA:</span>
                        <div style="font-weight:700;font-size:16px;color:var(--primary);margin-top:2px;">${parseFloat(student.gpa).toFixed(2)} / 4.00</div>
                    </div>
                    <div style="background:var(--border-subtle);padding:12px;border-radius:var(--radius-sm);">
                        <span style="color:var(--text-muted);">Academic Status:</span>
                        <div style="margin-top:4px;"><span class="badge badge-${(student.status || 'Active').toLowerCase()}">${student.status || 'Active'}</span></div>
                    </div>
                </div>

                <h4 style="font-size:14px;font-weight:700;border-bottom:1px solid var(--border-color);padding-bottom:6px;">Enrolled Courses</h4>
                ${enrolledHtml}
            `;
            el.detailsModal.classList.add("open");
        } catch (err) {
            showToast("Failed to load student details", "error");
        }
    };

    function closeDetailsModal() {
        el.detailsModal.classList.remove("open");
    }

    // Edit Shortcut
    window.openEditStudent = async function(id) {
        try {
            const student = await API.getStudentById(id);
            openStudentModal("edit", student);
        } catch (err) {
            showToast("Failed to load student data for editing", "error");
        }
    };

    // ==========================================
    // Delete Confirmation Modal
    // ==========================================
    window.openDeleteModal = function(id, name) {
        state.currentDeleteId = id;
        el.deleteStudentName.textContent = `#${id} (${name})`;
        el.deleteModal.classList.add("open");
    };

    function closeDeleteModal() {
        el.deleteModal.classList.remove("open");
        state.currentDeleteId = null;
    }

    async function handleConfirmDelete() {
        if (!state.currentDeleteId) return;

        try {
            await API.deleteStudent(state.currentDeleteId);
            showToast("Student deleted successfully!", "success");
            closeDeleteModal();
            loadStudentsTable();
            loadDashboard();
        } catch (err) {
            showToast(err.message, "error");
        }
    }

    // ==========================================
    // Academic Insights View
    // ==========================================
    async function loadInsights() {
        try {
            const data = await API.getInsights();
            const { database_statistics, analytical_insights, data_driven_recommendations } = data;

            el.insightsContainer.innerHTML = `
                <div class="card" style="margin-bottom:24px;">
                    <div class="card-header">
                        <h3>💡 Statistical vs Analytical vs Recommendation Overview</h3>
                    </div>
                    <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:16px;">
                        <div style="background:var(--border-subtle);padding:16px;border-radius:var(--radius-md);">
                            <span style="font-size:12px;color:var(--text-muted);font-weight:600;">MOST POPULAR COURSE</span>
                            <h3 style="font-size:20px;color:var(--primary);margin-top:4px;">${analytical_insights.most_popular_course || "N/A"}</h3>
                            <p style="font-size:12px;color:var(--text-muted);margin-top:4px;">Highest student enrollment volume</p>
                        </div>
                        <div style="background:var(--border-subtle);padding:16px;border-radius:var(--radius-md);">
                            <span style="font-size:12px;color:var(--text-muted);font-weight:600;">TOP PERFORMING COHORT</span>
                            <h3 style="font-size:20px;color:var(--success);margin-top:4px;">${analytical_insights.highest_performing_cohort || "N/A"}</h3>
                            <p style="font-size:12px;color:var(--text-muted);margin-top:4px;">Highest cohort grade point average</p>
                        </div>
                        <div style="background:var(--border-subtle);padding:16px;border-radius:var(--radius-md);">
                            <span style="font-size:12px;color:var(--text-muted);font-weight:600;">STUDENT AGE SPAN</span>
                            <h3 style="font-size:20px;margin-top:4px;">${database_statistics.age_range.min} - ${database_statistics.age_range.max} years</h3>
                            <p style="font-size:12px;color:var(--text-muted);margin-top:4px;">Mean age: ${database_statistics.average_age} yrs</p>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3>🎯 Actionable Academic Recommendations</h3>
                    </div>
                    <div style="display:flex;flex-direction:column;gap:12px;">
                        ${data_driven_recommendations.map(r => `
                            <div style="padding:14px;border-left:4px solid var(--primary);background:var(--border-subtle);border-radius:var(--radius-sm);">
                                <span class="badge" style="background:var(--primary-light);color:var(--primary);margin-bottom:6px;">${r.type}</span>
                                <p style="font-size:13px;line-height:1.5;">${r.message}</p>
                            </div>
                        `).join("")}
                    </div>
                </div>
            `;
        } catch (err) {
            showToast("Failed to load academic insights", "error");
        }
    }

    // ==========================================
    // Departments & Courses View
    // ==========================================
    function loadDepartmentsView() {
        el.departmentsGrid.innerHTML = state.departments.map(d => {
            const deptCourses = state.courses.filter(c => c.department_id === d.id);
            return `
                <div class="card">
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
                        <h3 style="font-size:18px;">${escapeHtml(d.name)}</h3>
                        <span class="badge" style="background:var(--primary-light);color:var(--primary);font-size:12px;">${d.code}</span>
                    </div>
                    <p style="font-size:13px;color:var(--text-muted);margin-bottom:16px;line-height:1.5;">${escapeHtml(d.description || "No description provided.")}</p>
                    <div style="font-size:12px;font-weight:600;color:var(--text-main);margin-bottom:8px;">Offered Courses:</div>
                    <ul style="list-style:none;font-size:13px;display:flex;flex-direction:column;gap:6px;">
                        ${deptCourses.map(c => `
                            <li style="display:flex;justify-content:space-between;padding:6px 10px;background:var(--border-subtle);border-radius:var(--radius-sm);">
                                <span><strong>${c.code}</strong>: ${escapeHtml(c.title)}</span>
                                <span style="color:var(--text-muted);">${c.credits} credits</span>
                            </li>
                        `).join("")}
                    </ul>
                </div>
            `;
        }).join("");
    }

    // ==========================================
    // Helpers & Toasts
    // ==========================================
    function showToast(message, type = "info") {
        const toast = document.createElement("div");
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        el.toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = "0";
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    }

    function escapeHtml(str) {
        if (!str) return "";
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
});
