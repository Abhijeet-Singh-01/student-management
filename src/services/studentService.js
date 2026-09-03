const pool = require("../config/db");

class StudentService {
    // Get all students with search, filters, sorting, and pagination
    async getAllStudents(query = {}) {
        const {
            search,
            course,
            status,
            department_id,
            sort_by = "id",
            order = "ASC",
            page,
            limit
        } = query;

        const conditions = [];
        const params = [];
        let paramIndex = 1;

        // Search by name or email
        if (search && search.trim() !== "") {
            conditions.push(`(s.name ILIKE $${paramIndex} OR s.email ILIKE $${paramIndex})`);
            params.push(`%${search.trim()}%`);
            paramIndex++;
        }

        // Filter by course
        if (course && course.trim() !== "") {
            conditions.push(`s.course ILIKE $${paramIndex}`);
            params.push(course.trim());
            paramIndex++;
        }

        // Filter by status
        if (status && status.trim() !== "") {
            conditions.push(`s.status = $${paramIndex}`);
            params.push(status.trim());
            paramIndex++;
        }

        // Filter by department_id
        if (department_id && !isNaN(parseInt(department_id, 10))) {
            conditions.push(`s.department_id = $${paramIndex}`);
            params.push(parseInt(department_id, 10));
            paramIndex++;
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

        // Safe sorting whitelist
        const allowedSortCols = {
            id: "s.id",
            name: "s.name",
            age: "s.age",
            gpa: "s.gpa",
            course: "s.course",
            created_at: "s.created_at"
        };
        const sortCol = allowedSortCols[sort_by.toLowerCase()] || "s.id";
        const sortOrder = order.toUpperCase() === "DESC" ? "DESC" : "ASC";

        // Count total matching records for pagination
        const countQuery = `
            SELECT COUNT(*) AS total
            FROM students s
            LEFT JOIN departments d ON s.department_id = d.id
            ${whereClause}
        `;
        const countResult = await pool.query(countQuery, params);
        const total = parseInt(countResult.rows[0].total, 10);

        // Fetch students with joined department name
        let dataQuery = `
            SELECT 
                s.id,
                s.name,
                s.email,
                s.age,
                s.course,
                s.phone,
                s.status,
                s.gpa,
                s.department_id,
                d.name AS department_name,
                s.enrollment_date,
                s.created_at
            FROM students s
            LEFT JOIN departments d ON s.department_id = d.id
            ${whereClause}
            ORDER BY ${sortCol} ${sortOrder}
        `;

        // Apply pagination if requested
        if (page !== undefined || limit !== undefined) {
            const pageNum = Math.max(1, parseInt(page, 10) || 1);
            const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
            const offset = (pageNum - 1) * limitNum;

            dataQuery += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
            params.push(limitNum, offset);

            const result = await pool.query(dataQuery, params);
            return {
                data: result.rows,
                pagination: {
                    total,
                    page: pageNum,
                    limit: limitNum,
                    totalPages: Math.ceil(total / limitNum)
                }
            };
        }

        // Return plain rows for default unpaginated queries (100% backward compatible)
        const result = await pool.query(dataQuery, params);
        return result.rows;
    }

    // Get student by ID with joined department and enrolled courses
    async getStudentById(id) {
        const studentQuery = `
            SELECT 
                s.id,
                s.name,
                s.email,
                s.age,
                s.course,
                s.phone,
                s.status,
                s.gpa,
                s.department_id,
                d.name AS department_name,
                s.enrollment_date,
                s.created_at
            FROM students s
            LEFT JOIN departments d ON s.department_id = d.id
            WHERE s.id = $1
        `;
        const studentResult = await pool.query(studentQuery, [id]);

        if (studentResult.rows.length === 0) {
            return null;
        }

        const student = studentResult.rows[0];

        // Fetch enrolled courses
        const enrollQuery = `
            SELECT 
                e.id AS enrollment_id,
                c.id AS course_id,
                c.code AS course_code,
                c.title AS course_title,
                c.credits,
                e.semester,
                e.grade,
                e.status AS enrollment_status
            FROM enrollments e
            JOIN courses c ON e.course_id = c.id
            WHERE e.student_id = $1
            ORDER BY e.id ASC
        `;
        const enrollResult = await pool.query(enrollQuery, [id]);
        student.enrolled_courses = enrollResult.rows;

        return student;
    }

    // Create a new student
    async createStudent(data) {
        const {
            name,
            email,
            age,
            course,
            phone = null,
            status = "Active",
            department_id = null,
            gpa = 3.50
        } = data;

        const query = `
            INSERT INTO students (name, email, age, course, phone, status, department_id, gpa)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `;
        const result = await pool.query(query, [
            name.trim(),
            email.trim().toLowerCase(),
            parseInt(age, 10),
            course.trim(),
            phone ? phone.trim() : null,
            status,
            department_id ? parseInt(department_id, 10) : null,
            gpa ? parseFloat(gpa) : 3.50
        ]);

        return result.rows[0];
    }

    // Update an existing student
    async updateStudent(id, data) {
        const existing = await this.getStudentById(id);
        if (!existing) return null;

        const {
            name = existing.name,
            email = existing.email,
            age = existing.age,
            course = existing.course,
            phone = existing.phone,
            status = existing.status,
            department_id = existing.department_id,
            gpa = existing.gpa
        } = data;

        const query = `
            UPDATE students
            SET 
                name = $1,
                email = $2,
                age = $3,
                course = $4,
                phone = $5,
                status = $6,
                department_id = $7,
                gpa = $8,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $9
            RETURNING *
        `;
        const result = await pool.query(query, [
            name.trim(),
            email.trim().toLowerCase(),
            parseInt(age, 10),
            course.trim(),
            phone ? phone.trim() : null,
            status,
            department_id ? parseInt(department_id, 10) : null,
            gpa ? parseFloat(gpa) : 3.50,
            id
        ]);

        return result.rows[0];
    }

    // Delete student
    async deleteStudent(id) {
        const query = "DELETE FROM students WHERE id = $1 RETURNING *";
        const result = await pool.query(query, [id]);
        return result.rows.length > 0 ? result.rows[0] : null;
    }
}

module.exports = new StudentService();
