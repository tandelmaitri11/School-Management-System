const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const {
  markAttendance,
  validateAttendanceDate,
  getAttendanceByClassAndDate,
  getAttendanceByClass,
  getAttendanceByStudent,
  getMyAttendance,
  getAllStudents,
} = require("../controller/attendanceController");

router.get("/students/all", getAllStudents);
router.get("/validate-date", verifyToken, validateAttendanceDate);
router.get("/my", verifyToken, getMyAttendance);
router.get("/student/:studentId", verifyToken, getAttendanceByStudent);
router.get("/class/:classId", getAttendanceByClass);
router.get("/:classId/:date", getAttendanceByClassAndDate);
router.post("/mark", markAttendance);

module.exports = router;
