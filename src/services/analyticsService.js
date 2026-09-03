const pool = require("../config/db");

class AnalyticsService {
    // Generate transparent data analytics & academic insights
    async getInsights() {
        // 1. Overall stats & averages
        const overviewQuery = `
            SELECT 
                COUNT(*) AS total_students,
                COUNT(CASE WHEN status = 'Active' THEN 1 END) AS active_students,
                COUNT(CASE WHEN status = 'Graduated' THEN 1 END) AS graduated_students,
                COUNT(CASE WHEN status = 'Inactive' THEN 1 END) AS inactive_students,
                ROUND(AVG(age)::numeric, 1) AS average_age,
                ROUND(AVG(gpa)::numeric, 2) AS average_gpa,
                MIN(age) AS min_age,
                MAX(age) AS max_age
            FROM students;
        `;
        const overviewRes = await pool.query(overviewQuery);
        const overview = overviewRes.rows[0];
        const total = parseInt(overview.total_students, 10) || 0;

        // 2. Course distribution with percentages
        const courseQuery = `
            SELECT 
                course, 
                COUNT(*) AS student_count,
                ROUND(AVG(gpa)::numeric, 2) AS average_gpa
            FROM students
            GROUP BY course
            ORDER BY student_count DESC;
        `;
        const courseRes = await pool.query(courseQuery);
        const courseDistribution = courseRes.rows.map(row => ({
            course: row.course,
            count: parseInt(row.student_count, 10),
            percentage: total > 0 ? parseFloat(((row.student_count / total) * 100).toFixed(1)) : 0,
            average_gpa: parseFloat(row.average_gpa) || 0.00
        }));

        // 3. Department distribution
        const deptQuery = `
            SELECT 
                COALESCE(d.name, 'Unassigned') AS department_name,
                COALESCE(d.code, 'N/A') AS department_code,
                COUNT(s.id) AS student_count
            FROM students s
            LEFT JOIN departments d ON s.department_id = d.id
            GROUP BY d.name, d.code
            ORDER BY student_count DESC;
        `;
        const deptRes = await pool.query(deptQuery);
        const departmentDistribution = deptRes.rows.map(row => ({
            department: row.department_name,
            code: row.department_code,
            count: parseInt(row.student_count, 10)
        }));

        // 4. Most popular course & highest performing cohort
        const mostPopularCourse = courseDistribution.length > 0 ? courseDistribution[0] : null;
        const highestGpaCohort = [...courseDistribution].sort((a, b) => b.average_gpa - a.average_gpa)[0] || null;

        // 5. Actionable Data-Driven Recommendations
        const recommendations = [];
        if (mostPopularCourse) {
            recommendations.push({
                type: "CAPACITY_PLANNING",
                message: `Course '${mostPopularCourse.course}' is currently in highest demand with ${mostPopularCourse.count} students (${mostPopularCourse.percentage}%). Recommend scheduling additional tutorial labs.`
            });
        }
        if (highestGpaCohort) {
            recommendations.push({
                type: "ACADEMIC_EXCELLENCE",
                message: `Students in course '${highestGpaCohort.course}' achieve the top average GPA of ${highestGpaCohort.average_gpa}. Consider expanding honors coursework in this domain.`
            });
        }
        const gradCount = parseInt(overview.graduated_students, 10);
        if (gradCount > 0) {
            recommendations.push({
                type: "ALUMNI_RELATIONS",
                message: `${gradCount} students are marked as 'Graduated'. Ready for career placement pipeline and alumni database archival.`
            });
        }

        // Return clear, transparent insights payload
        return {
            database_statistics: {
                total_students: total,
                active_students: parseInt(overview.active_students, 10),
                graduated_students: gradCount,
                inactive_students: parseInt(overview.inactive_students, 10),
                average_age: parseFloat(overview.average_age) || 0,
                average_gpa: parseFloat(overview.average_gpa) || 0,
                age_range: {
                    min: parseInt(overview.min_age, 10) || 0,
                    max: parseInt(overview.max_age, 10) || 0
                }
            },
            course_distribution: courseDistribution,
            department_distribution: departmentDistribution,
            analytical_insights: {
                most_popular_course: mostPopularCourse ? mostPopularCourse.course : null,
                highest_performing_cohort: highestGpaCohort ? highestGpaCohort.course : null
            },
            data_driven_recommendations: recommendations
        };
    }
}

module.exports = new AnalyticsService();
