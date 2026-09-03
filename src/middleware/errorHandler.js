// Centralized Express Error Handler
function errorHandler(err, req, res, next) {
    console.error(`[Error] ${req.method} ${req.url}:`, err.message);

    // PostgreSQL Unique Constraint Violation (e.g. duplicate email)
    if (err.code === "23505") {
        return res.status(409).json({
            success: false,
            message: "A record with this unique attribute already exists (e.g. email or course code)."
        });
    }

    // PostgreSQL Foreign Key Violation
    if (err.code === "23503") {
        return res.status(400).json({
            success: false,
            message: "Referenced foreign entity does not exist."
        });
    }

    // Custom HTTP error status
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || "Internal Server Error"
    });
}

module.exports = errorHandler;
