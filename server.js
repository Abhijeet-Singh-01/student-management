require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const studentRoutes = require("./src/routes/studentRoutes");
const healthRoutes = require("./src/routes/healthRoutes");
const lookupRoutes = require("./src/routes/lookupRoutes");
const authRoutes = require("./src/routes/authRoutes");
const errorHandler = require("./src/middleware/errorHandler");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./src/docs/swaggerSpec");
const { helmetSecurity, apiLimiter } = require("./src/middleware/security");

const app = express();
const PORT = process.env.PORT || 3000;

// Security & Core Middleware
app.use(helmetSecurity);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root route: serves UI to browsers, or welcome text to API clients
app.get("/", (req, res) => {
    if (req.headers.accept && req.headers.accept.includes("text/html")) {
        return res.sendFile(path.join(__dirname, "public", "index.html"));
    }
    res.send("Student Management API is running");
});

// Serve static frontend assets
app.use(express.static(path.join(__dirname, "public")));

// Health check routes
app.use("/health", healthRoutes);
app.use("/api/health", healthRoutes);

// Student routes (mounted at /students for direct backward compatibility, and /api/v1/students)
app.use("/students", apiLimiter, studentRoutes);
app.use("/api/v1/students", apiLimiter, studentRoutes);

// Lookups for departments and courses
app.use("/api/v1", apiLimiter, lookupRoutes);

// Authentication routes
app.use("/auth", apiLimiter, authRoutes);
app.use("/api/v1/auth", apiLimiter, authRoutes);

// Interactive Swagger / OpenAPI Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: "EduManage Pro — API Documentation"
}));
app.get("/api-docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
});

// Centralized error handler
app.use(errorHandler);

// Start server
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`server running on port ${PORT}`);
    });
}

module.exports = app;
