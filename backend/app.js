require("dotenv").config();
const express = require("express");
const cors = require("cors");
const studentRoutes = require("./routes/studentRoutes");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");

const app = express();

// Enable CORS for frontend communication
app.use(cors());

// Parse incoming JSON requests
app.use(express.json());

// Base API health check route
app.get("/", (req, res) => {
  res.json({
    message: "Student Management API is running",
    status: "ok"
  });
});

// Student Management Routes
app.use("/students", studentRoutes);

// 404 Handler for undefined routes
app.use(notFoundHandler);

// Global Error Handler
app.use(errorHandler);

module.exports = app;
