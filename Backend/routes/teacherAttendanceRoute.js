const express = require("express");
const router = express.Router();

const {
  markTeacherAttendance,
  validateTeacherAttendanceDate,
  getAttendanceByDate,
  getAttendanceByTeacher,
  getAllTeacherAttendance,
  getalltecaher,
} = require("../controller/teacherAttendanceController");

router.get("/teachers", getalltecaher);
router.get("/validate-date", validateTeacherAttendanceDate);
router.post("/mark", markTeacherAttendance);
router.get("/date/:date", getAttendanceByDate);
router.get("/teacher/:teacherId", getAttendanceByTeacher);
router.get("/", getAllTeacherAttendance);

module.exports = router;
