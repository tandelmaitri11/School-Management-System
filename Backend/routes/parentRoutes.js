const express = require("express");
const { verifyToken } = require("../middleware/authMiddleware");
const requireAdmin = require("../middleware/requireAdmin");
const requireParent = require("../middleware/requireParent");
const {
  getAllParents,
  mapParentToStudent,
  updateParentStudentMapping,
  getMyProfile,
  getMyStudents,
  getStudentProfileForParent,
  getStudentExamsForParent,
  getStudentExamResultForParent,
  getStudentAttendanceForParent,
  getStudentReportForParent,
  getStudentFeesForParent,
  getMyNotifications,
  getAvailableTeachersForParent,
  getStudentLeaveRequestsForParent,
  createStudentLeaveRequestForParent,
  getStudentMessagesForParent,
  createStudentMessageForParent,
  deleteStudentMessageThreadForParent,
} = require("../controller/parentController");

const router = express.Router();

router.get("/admin/all", verifyToken, requireAdmin, getAllParents);
router.post("/admin/map-student", verifyToken, requireAdmin, mapParentToStudent);
router.patch("/admin/mapping/:mappingId", verifyToken, requireAdmin, updateParentStudentMapping);

router.get("/me", verifyToken, requireParent, getMyProfile);
router.get("/students", verifyToken, requireParent, getMyStudents);
router.get("/student/:studentId/profile", verifyToken, requireParent, getStudentProfileForParent);
router.get("/student/:studentId/exams", verifyToken, requireParent, getStudentExamsForParent);
router.get("/student/:studentId/exam-result/:examId", verifyToken, requireParent, getStudentExamResultForParent);
router.get("/student/:studentId/attendance", verifyToken, requireParent, getStudentAttendanceForParent);
router.get("/student/:studentId/report", verifyToken, requireParent, getStudentReportForParent);
router.get("/student/:studentId/fees", verifyToken, requireParent, getStudentFeesForParent);
router.get("/student/:studentId/teachers", verifyToken, requireParent, getAvailableTeachersForParent);
router.get("/student/:studentId/leave-requests", verifyToken, requireParent, getStudentLeaveRequestsForParent);
router.post("/student/:studentId/leave-requests", verifyToken, requireParent, createStudentLeaveRequestForParent);
router.get("/student/:studentId/messages", verifyToken, requireParent, getStudentMessagesForParent);
router.post("/student/:studentId/messages", verifyToken, requireParent, createStudentMessageForParent);
router.delete(
  "/student/:studentId/messages/:threadId",
  verifyToken,
  requireParent,
  deleteStudentMessageThreadForParent
);
router.get("/notifications", verifyToken, requireParent, getMyNotifications);

module.exports = router;
