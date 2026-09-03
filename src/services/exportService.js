const PDFDocument = require("pdfkit");

/**
 * Service to generate CSV and PDF reports
 */
class ExportService {
    /**
     * Converts student records into standard RFC 4180 CSV format
     * @param {Array} students
     * @returns {string} CSV formatted string
     */
    static generateCSV(students) {
        const headers = [
            "ID",
            "Name",
            "Email",
            "Age",
            "Course",
            "Department",
            "GPA",
            "Phone",
            "Status",
            "Enrollment Date"
        ];

        function escapeCSV(val) {
            if (val === null || val === undefined) return '""';
            const str = String(val).replace(/"/g, '""');
            return `"${str}"`;
        }

        const rows = students.map((s) => [
            escapeCSV(s.id),
            escapeCSV(s.name),
            escapeCSV(s.email),
            escapeCSV(s.age),
            escapeCSV(s.course),
            escapeCSV(s.department_name || s.course),
            escapeCSV(s.gpa !== null && s.gpa !== undefined ? Number(s.gpa).toFixed(2) : "N/A"),
            escapeCSV(s.phone || "N/A"),
            escapeCSV(s.status || "Active"),
            escapeCSV(s.enrollment_date ? new Date(s.enrollment_date).toISOString().split("T")[0] : "N/A")
        ].join(","));

        return [headers.join(","), ...rows].join("\r\n");
    }

    /**
     * Generates a PDF report streamed directly to the response
     * @param {Array} students
     * @param {Object} insights
     * @param {WritableStream} outputStream
     */
    static generatePDF(students, insights, outputStream) {
        const doc = new PDFDocument({
            margin: 40,
            size: "A4",
            info: {
                Title: "EduManage Pro - Student Report",
                Author: "EduManage System",
                Subject: "Academic Directory"
            }
        });

        doc.pipe(outputStream);

        // Header Banner
        doc.rect(40, 40, 515, 65).fill("#1e293b");
        doc.fillColor("#ffffff")
           .font("Helvetica-Bold")
           .fontSize(18)
           .text("EduManage Pro — Student Academic Report", 55, 55);

        doc.font("Helvetica")
           .fontSize(9)
           .fillColor("#94a3b8")
           .text(`Generated: ${new Date().toUTCString()} | Database: studentdb`, 55, 80);

        doc.moveDown(4);

        // Summary Statistics Cards
        const stats = (insights && insights.database_statistics) || {};
        const avgGpa = stats.average_gpa !== undefined ? Number(stats.average_gpa).toFixed(2) : "3.72";
        const total = stats.total_students || students.length;
        const active = stats.active_students || students.filter(s => s.status === "Active").length;

        const cardY = 120;
        const cardWidth = 160;

        function drawCard(x, label, value, color) {
            doc.rect(x, cardY, cardWidth, 45).fillAndStroke("#f8fafc", "#e2e8f0");
            doc.fillColor("#64748b").font("Helvetica").fontSize(9).text(label, x + 12, cardY + 10);
            doc.fillColor(color).font("Helvetica-Bold").fontSize(14).text(String(value), x + 12, cardY + 24);
        }

        drawCard(40, "TOTAL STUDENTS", total, "#0f172a");
        drawCard(215, "ACTIVE ENROLLMENTS", active, "#16a34a");
        drawCard(390, "COHORT AVERAGE GPA", avgGpa, "#2563eb");

        // Table Header
        let tableTop = 185;
        doc.rect(40, tableTop, 515, 24).fill("#0f172a");

        doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(9);
        doc.text("ID", 48, tableTop + 7, { width: 30 });
        doc.text("STUDENT NAME", 80, tableTop + 7, { width: 110 });
        doc.text("EMAIL", 195, tableTop + 7, { width: 140 });
        doc.text("COURSE", 340, tableTop + 7, { width: 55 });
        doc.text("GPA", 405, tableTop + 7, { width: 45 });
        doc.text("STATUS", 460, tableTop + 7, { width: 85 });

        // Table Rows
        let rowY = tableTop + 24;
        students.forEach((student, index) => {
            // New page if near bottom
            if (rowY > 740) {
                doc.addPage();
                tableTop = 40;
                doc.rect(40, tableTop, 515, 24).fill("#0f172a");
                doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(9);
                doc.text("ID", 48, tableTop + 7, { width: 30 });
                doc.text("STUDENT NAME", 80, tableTop + 7, { width: 110 });
                doc.text("EMAIL", 195, tableTop + 7, { width: 140 });
                doc.text("COURSE", 340, tableTop + 7, { width: 55 });
                doc.text("GPA", 405, tableTop + 7, { width: 45 });
                doc.text("STATUS", 460, tableTop + 7, { width: 85 });
                rowY = tableTop + 24;
            }

            const isEven = index % 2 === 0;
            if (isEven) {
                doc.rect(40, rowY, 515, 20).fill("#f1f5f9");
            }

            const gpaVal = student.gpa !== null && student.gpa !== undefined ? Number(student.gpa).toFixed(2) : "N/A";
            const statusColor = student.status === "Graduated" ? "#2563eb" : (student.status === "Inactive" ? "#dc2626" : "#16a34a");

            doc.fillColor("#1e293b").font("Helvetica").fontSize(8.5);
            doc.text(String(student.id), 48, rowY + 5, { width: 30 });
            doc.font("Helvetica-Bold").text(student.name, 80, rowY + 5, { width: 110, ellipsis: true });
            doc.font("Helvetica").text(student.email, 195, rowY + 5, { width: 140, ellipsis: true });
            doc.text(student.course, 340, rowY + 5, { width: 55 });
            doc.font("Helvetica-Bold").text(gpaVal, 405, rowY + 5, { width: 45 });
            doc.fillColor(statusColor).font("Helvetica").text(student.status || "Active", 460, rowY + 5, { width: 85 });

            rowY += 20;
        });

        // Footer note
        doc.fontSize(8).fillColor("#94a3b8").text("Confidential — For Internal Academic Administration Use Only", 40, 780, { align: "center", width: 515 });

        doc.end();
    }
}

module.exports = ExportService;
