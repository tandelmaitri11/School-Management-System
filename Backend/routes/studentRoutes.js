const express = require("express");
const router = express.Router();
const {
  addStudent,
  getStudentsByClass,
  getStudentsOfClass,
  updateStudent,
  getStudentDetails,
  updateStudentInfo,
  getStudentsByClassId,
  getAllStudentsForAdmin,
  getCompletedStudentsByBatch,
  searchStudents,
  getTimetableForStudent,
  getStudentsForAssignment,
  assignStudentsManual,
  assignStudentsBulk,
  assignStudentsAuto,
  promoteStudents
} = require("../controller/studentController");

// ✅ Get all students grouped by class (Admin)
router.get("/admin/all", getAllStudentsForAdmin);
router.get("/admin/completed-batches", getCompletedStudentsByBatch);

// Add new student (by teacher)
router.post("/", addStudent);

// Get all students grouped by teacher's classes
router.get("/by-teacher/:teacherId", getStudentsByClass);

// Get all students of a specific class (belonging to teacher)
router.get("/by-teacher/:teacherId/class/:className", getStudentsOfClass);

// ✅ Get single student (basic + extra info)
router.get("/details/:id", getStudentDetails);
router.get("/profile/:id", getStudentDetails);

// ✅ Add or update student info
router.put("/details/:id", updateStudentInfo);

// Basic student update (if needed)
router.put("/:id", updateStudent);

// Get students by classId (for attendance)
router.get("/by-class/:classId", getStudentsByClassId);

router.get("/search", searchStudents);
router.get("/timetable/:studentId", getTimetableForStudent);

// Section assignment & promotion
router.get("/assignment", getStudentsForAssignment);
router.post("/assign/manual", assignStudentsManual);
router.post("/assign/bulk", assignStudentsBulk);
router.post("/assign/auto", assignStudentsAuto);
router.post("/promote", promoteStudents);


module.exports = router;
