// Request Validation Middleware for Student Input
function validateStudent(req, res, next) {
    const { name, email, age, course, gpa, status } = req.body;
    const errors = [];

    // Name validation
    if (!name || typeof name !== "string" || name.trim().length < 2) {
        errors.push("Name is required and must be at least 2 characters long.");
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || typeof email !== "string" || !emailRegex.test(email.trim())) {
        errors.push("A valid email address is required.");
    }

    // Age validation
    const parsedAge = parseInt(age, 10);
    if (isNaN(parsedAge) || parsedAge < 15 || parsedAge > 100) {
        errors.push("Age must be an integer between 15 and 100.");
    }

    // Course validation
    if (!course || typeof course !== "string" || course.trim().length < 2) {
        errors.push("Course is required (e.g., 'CSE', 'AI', 'IT').");
    }

    // Optional GPA validation
    if (gpa !== undefined && gpa !== null && gpa !== "") {
        const parsedGpa = parseFloat(gpa);
        if (isNaN(parsedGpa) || parsedGpa < 0.0 || parsedGpa > 4.0) {
            errors.push("GPA must be a decimal between 0.00 and 4.00.");
        }
    }

    // Optional Status validation
    const validStatuses = ["Active", "Graduated", "Inactive", "Suspended"];
    if (status && !validStatuses.includes(status)) {
        errors.push(`Status must be one of: ${validStatuses.join(", ")}`);
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: "Validation failed.",
            errors
        });
    }

    next();
}

module.exports = {
    validateStudent
};
