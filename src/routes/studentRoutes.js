const express = require("express");
const router = express.Router();
const studentController = require("../controllers/studentController");
const { validateStudent } = require("../middleware/validate");
const { writeLimiter } = require("../middleware/security");
const { authenticateToken, requireRole } = require("../middleware/auth");

// Student Routes (Public Read-Only)
router.get("/", studentController.getAll);
router.get("/insights", studentController.getInsights);
router.get("/export/csv", studentController.exportCSV);
router.get("/export/pdf", studentController.exportPDF);
router.get("/:id", studentController.getById);

// Admin-Only Mutating Routes (Protected by JWT & RBAC)
router.post("/", authenticateToken, requireRole("Admin"), writeLimiter, validateStudent, studentController.create);
router.put("/:id", authenticateToken, requireRole("Admin"), writeLimiter, validateStudent, studentController.update);
router.delete("/:id", authenticateToken, requireRole("Admin"), writeLimiter, studentController.delete);

module.exports = router;
