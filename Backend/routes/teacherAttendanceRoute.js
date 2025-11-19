const express = require("express");
const router = express.Router();

const {
  markTeacherAttendance,
  getAttendanceByDate,
  getAttendanceByTeacher,
  getAllTeacherAttendance,
  getalltecaher
} = require("../controller/teacherAttendanceController");

// ✅ Get all teachers (for attendance page)
router.get("/teachers", getalltecaher);

// ✅ Mark attendance
router.post("/mark", markTeacherAttendance);

// ✅ Get attendance by date
router.get("/date/:date", getAttendanceByDate);

// ✅ Get attendance by teacher
router.get("/teacher/:teacherId", getAttendanceByTeacher);

// ✅ Get all records
router.get("/", getAllTeacherAttendance);



module.exports = router;
