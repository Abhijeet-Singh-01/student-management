const studentService = require("../services/studentService");
const analyticsService = require("../services/analyticsService");
const exportService = require("../services/exportService");

class StudentController {
    // GET /students or GET /api/v1/students
    async getAll(req, res, next) {
        try {
            const result = await studentService.getAllStudents(req.query);

            // If caller requested pagination, return metadata structure
            if (req.query.page !== undefined || req.query.limit !== undefined) {
                return res.json({
                    success: true,
                    data: result.data,
                    pagination: result.pagination
                });
            }

            // Direct array response preserves 100% backward compatibility with original GET /students
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    // GET /students/:id
    async getById(req, res, next) {
        try {
            const { id } = req.params;
            const student = await studentService.getStudentById(id);

            if (!student) {
                // Exact backward-compatible contract
                return res.status(404).json({
                    message: "Student not found"
                });
            }

            res.json(student);
        } catch (error) {
            next(error);
        }
    }

    // POST /students
    async create(req, res, next) {
        try {
            const newStudent = await studentService.createStudent(req.body);
            res.status(201).json({
                success: true,
                message: "Student registered successfully.",
                data: newStudent
            });
        } catch (error) {
            next(error);
        }
    }

    // PUT /students/:id
    async update(req, res, next) {
        try {
            const { id } = req.params;
            const updated = await studentService.updateStudent(id, req.body);

            if (!updated) {
                return res.status(404).json({
                    message: "Student not found"
                });
            }

            res.json({
                success: true,
                message: "Student updated successfully.",
                data: updated
            });
        } catch (error) {
            next(error);
        }
    }

    // DELETE /students/:id
    async delete(req, res, next) {
        try {
            const { id } = req.params;
            const deleted = await studentService.deleteStudent(id);

            if (!deleted) {
                return res.status(404).json({
                    message: "Student not found"
                });
            }

            res.json({
                success: true,
                message: `Student #${id} (${deleted.name}) deleted successfully.`
            });
        } catch (error) {
            next(error);
        }
    }

    // GET /students/insights
    async getInsights(req, res, next) {
        try {
            const insights = await analyticsService.getInsights();
            res.json({
                success: true,
                data: insights
            });
        } catch (error) {
            next(error);
        }
    }

    // GET /students/export/csv
    async exportCSV(req, res, next) {
        try {
            const filters = { ...req.query };
            delete filters.page;
            delete filters.limit;

            const students = await studentService.getAllStudents(filters);
            const dataList = Array.isArray(students) ? students : (students.data || []);
            const csvData = exportService.generateCSV(dataList);

            res.setHeader("Content-Type", "text/csv; charset=utf-8");
            res.setHeader("Content-Disposition", 'attachment; filename="students_report.csv"');
            res.status(200).send(csvData);
        } catch (error) {
            next(error);
        }
    }

    // GET /students/export/pdf
    async exportPDF(req, res, next) {
        try {
            const filters = { ...req.query };
            delete filters.page;
            delete filters.limit;

            const [students, insights] = await Promise.all([
                studentService.getAllStudents(filters),
                analyticsService.getInsights()
            ]);

            const dataList = Array.isArray(students) ? students : (students.data || []);

            res.setHeader("Content-Type", "application/pdf");
            res.setHeader("Content-Disposition", 'inline; filename="students_academic_report.pdf"');

            exportService.generatePDF(dataList, insights, res);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new StudentController();
