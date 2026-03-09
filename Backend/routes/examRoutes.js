const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middleware/authMiddleware");
const checkClassTeacher = require("../middleware/checkClassTeacher");
const { addExam, addExamQuestions,getExamResultsForTeacher } = require("../controller/examController");

router.post("/teacher/add-exam",verifyToken,checkClassTeacher,addExam);

router.post("/teacher/add-exam-questions",verifyToken,addExamQuestions);
router.get("/teachers/exam-results/:examId",verifyToken,getExamResultsForTeacher);




const studentExam = require("../controller/studentExamController");

// ✅ Student routes
router.get("/student/exams", verifyToken, studentExam.getStudentExams);
router.get("/student/start-exam/:examId", verifyToken, studentExam.startExam);
router.post("/student/submit-exam/:examId", verifyToken, studentExam.submitExam);
router.get("/student/exam-result/:examId", verifyToken, studentExam.getExamResult);

module.exports = router;
