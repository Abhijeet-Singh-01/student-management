const express = require("express");
const router = express.Router();
const lookupController = require("../controllers/lookupController");

router.get("/departments", lookupController.getDepartments);
router.get("/courses", lookupController.getCourses);

module.exports = router;
