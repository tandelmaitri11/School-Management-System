const express = require("express");
const router = express.Router();
const {
  markAttendance,
  getAttendanceByClassAndDate,
  getAttendanceByClass,
  getAttendanceByStudent,
  getAllStudents,
} = require("../controller/attendanceController");


// ✅ Place this at the TOP
router.get("/students/all", getAllStudents);

// ✅ Get attendance by student
router.get("/student/:studentId", getAttendanceByStudent);

// ✅ Get attendance by class
router.get("/class/:classId", getAttendanceByClass);

// ✅ Get attendance by class & date (KEEP AT BOTTOM)
router.get("/:classId/:date", getAttendanceByClassAndDate);

// ✅ Mark attendance
router.post("/mark", markAttendance);

module.exports = router;
