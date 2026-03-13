const express = require("express");
const multer = require("multer");
const { verifyToken } = require("../middleware/authMiddleware");
const requireTeacher = require("../middleware/requireTeacher");
const {
  addTeacher,
  getAllTeachers,
  getTeacherById,
  getTeacherByMongoId,
   getTeacherProfile,
  updateTeacher,
  updateTeacherByMongoId,
  deleteTeacher,
  getTeacherRegister,
  getTeacherTimetable,
  getMyExams,
  deleteExam
} = require("../controller/teacherController");
const {
  getMyParentLeaveRequests,
  updateParentLeaveRequestStatus,
  getMyParentMessageThreads,
  replyToParentMessageThread,
  deleteParentMessageThread,
} = require("../controller/teacherParentInteractionController");

const router = express.Router();

// Multer setup for pictures
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/teachers"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// Routes
router.post("/addTeacher", upload.single("picture"), addTeacher);
router.get("/getTeachers", getAllTeachers);
router.get("/getTeacher/:regNumber", getTeacherById);
router.get("/getTeacherById/:id", getTeacherByMongoId);
router.get("/teacher/profile/:teacherId", getTeacherProfile); 
router.put("/updateTeacher/:regNumber", upload.single("picture"), updateTeacher);
router.put("/updateTeacherById/:id", upload.single("picture"), updateTeacherByMongoId);
router.delete("/deleteTeacher/:regNumber", deleteTeacher);

router.get("/register", getTeacherRegister);
router.get("/timetable/:teacherId", getTeacherTimetable);

router.get("/my-exams/:teacherId", getMyExams);
router.delete("/delete-exam/:id", deleteExam);

router.get("/parent/leave-requests", verifyToken, requireTeacher, getMyParentLeaveRequests);
router.patch("/parent/leave-requests/:requestId", verifyToken, requireTeacher, updateParentLeaveRequestStatus);
router.get("/parent/messages", verifyToken, requireTeacher, getMyParentMessageThreads);
router.post("/parent/messages/:threadId/reply", verifyToken, requireTeacher, replyToParentMessageThread);
router.delete("/parent/messages/:threadId", verifyToken, requireTeacher, deleteParentMessageThread);

module.exports = router;
