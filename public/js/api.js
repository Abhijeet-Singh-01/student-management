// Client API Layer Wrapper for EduManage Pro
const API = {
    baseUrl: "/students",

    async request(url, options = {}) {
        const token = localStorage.getItem("edumanage_token");
        const headers = {
            "Content-Type": "application/json",
            ...(token ? { "Authorization": `Bearer ${token}` } : {}),
            ...(options.headers || {})
        };

        const config = {
            headers,
            ...options
        };

        const response = await fetch(url, config);
        const data = await response.json().catch(() => null);

        if (!response.ok) {
            const errorMsg = data && (data.errors ? data.errors.join(" ") : (data.message || data.error)) || "Request failed";
            const error = new Error(errorMsg);
            error.status = response.status;
            throw error;
        }

        return data;
    },

    // Auth methods
    async login(username, password) {
        const res = await this.request("/auth/login", {
            method: "POST",
            body: JSON.stringify({ username, password })
        });
        if (res.token) {
            localStorage.setItem("edumanage_token", res.token);
            localStorage.setItem("edumanage_user", JSON.stringify(res.user));
        }
        return res;
    },

    async register(userData) {
        return this.request("/auth/register", {
            method: "POST",
            body: JSON.stringify(userData)
        });
    },

    async getMe() {
        return this.request("/auth/me");
    },

    logout() {
        localStorage.removeItem("edumanage_token");
        localStorage.removeItem("edumanage_user");
    },

    getCurrentUser() {
        try {
            return JSON.parse(localStorage.getItem("edumanage_user") || "null");
        } catch {
            return null;
        }
    },

    // Fetch students with optional query params
    async getStudents(params = {}) {
        const queryStr = new URLSearchParams(params).toString();
        const url = queryStr ? `${this.baseUrl}?${queryStr}` : this.baseUrl;
        return this.request(url);
    },

    // Fetch single student by ID
    async getStudentById(id) {
        return this.request(`${this.baseUrl}/${id}`);
    },

    // Create student
    async createStudent(studentData) {
        return this.request(this.baseUrl, {
            method: "POST",
            body: JSON.stringify(studentData)
        });
    },

    // Update student
    async updateStudent(id, studentData) {
        return this.request(`${this.baseUrl}/${id}`, {
            method: "PUT",
            body: JSON.stringify(studentData)
        });
    },

    // Delete student
    async deleteStudent(id) {
        return this.request(`${this.baseUrl}/${id}`, {
            method: "DELETE"
        });
    },

    // Academic Insights
    async getInsights() {
        const res = await this.request(`${this.baseUrl}/insights`);
        return res.data;
    },

    // Health check
    async getHealth() {
        return this.request("/health");
    },

    // Lookups
    async getDepartments() {
        const res = await this.request("/api/v1/departments");
        return res.data;
    },

    async getCourses() {
        const res = await this.request("/api/v1/courses");
        return res.data;
    }
};
