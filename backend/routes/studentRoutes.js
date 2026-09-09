const express = require("express");
const router = express.Router();
const {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  searchStudents,
  filterStudents,
  getStudentStats
} = require("../controllers/studentController");

// Specific routes before parameterized :id
router.get("/search", searchStudents);
router.get("/filter", filterStudents);
router.get("/stats", getStudentStats);

// Main collection routes
router.get("/", getAllStudents);
router.post("/", createStudent);

// Single resource routes
router.get("/:id", getStudentById);
router.put("/:id", updateStudent);
router.delete("/:id", deleteStudent);

module.exports = router;
