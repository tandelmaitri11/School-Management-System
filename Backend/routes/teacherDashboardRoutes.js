const express = require("express");
const router = express.Router();
const { getTeacherDashboardData } = require("../controller/TeacherDashboardController");

// ✅ GET /api/teacher/dashboard/:teacherId
router.get("/dashboard/:teacherId", getTeacherDashboardData);

module.exports = router;
