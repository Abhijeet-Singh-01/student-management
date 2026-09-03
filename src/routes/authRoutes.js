const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { authenticateToken } = require("../middleware/auth");

// Public Authentication Routes
router.post("/register", authController.register);
router.post("/login", authController.login);

// Protected User Profile Route
router.get("/me", authenticateToken, authController.getMe);

module.exports = router;
