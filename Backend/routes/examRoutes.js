const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middleware/authMiddleware");
const checkClassTeacher = require("../middleware/checkClassTeacher");
const { createMemoryRateLimiter } = require("../middleware/rateLimit");
const { addExam, updateExam, addExamQuestions, getExamResultsForTeacher } = require("../controller/examController");

router.post("/teacher/add-exam",verifyToken,checkClassTeacher,addExam);
router.put("/teacher/update-exam/:examId", verifyToken, checkClassTeacher, updateExam);

router.post("/teacher/add-exam-questions",verifyToken,addExamQuestions);
router.get("/teachers/exam-results/:examId",verifyToken,getExamResultsForTeacher);




const studentExam = require("../controller/studentExamController");
const submitExamLimiter = createMemoryRateLimiter({
  windowMs: 60 * 1000,
  max: 8,
  keyFn: (req) => `submit:${req.user?.id || "anon"}:${req.params?.examId || "na"}:${req.ip || "ip"}`,
  message: "Too many submit attempts. Please wait and try again.",
});

// ✅ Student routes
router.get("/student/exams", verifyToken, studentExam.getStudentExams);
router.get("/student/start-exam/:examId", verifyToken, studentExam.startExam);
router.post("/student/submit-exam/:examId", verifyToken, submitExamLimiter, studentExam.submitExam);
router.get("/student/exam-result/:examId", verifyToken, studentExam.getExamResult);

module.exports = router;
