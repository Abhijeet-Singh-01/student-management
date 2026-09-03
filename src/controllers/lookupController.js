const pool = require("../config/db");

class LookupController {
    // GET /departments
    async getDepartments(req, res, next) {
        try {
            const result = await pool.query(`
                SELECT d.*, COUNT(s.id) AS student_count
                FROM departments d
                LEFT JOIN students s ON d.id = s.department_id
                GROUP BY d.id
                ORDER BY d.id ASC
            `);
            res.json({ success: true, data: result.rows });
        } catch (error) {
            next(error);
        }
    }

    // GET /courses
    async getCourses(req, res, next) {
        try {
            const result = await pool.query(`
                SELECT c.*, d.name AS department_name
                FROM courses c
                LEFT JOIN departments d ON c.department_id = d.id
                ORDER BY c.id ASC
            `);
            res.json({ success: true, data: result.rows });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new LookupController();
