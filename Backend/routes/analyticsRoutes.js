const express = require("express");
const router = express.Router();

const {
  getStudentAnalysis,
  getTeacherAnalysis,
  getAdminAnalysis,
  downloadStudentAnalyticsReport,
  downloadTeacherAnalyticsReport,
  downloadAdminAnalyticsReport
} = require("../controller/analyticsController");

router.get("/student/:id", getStudentAnalysis);
router.get("/teacher", getTeacherAnalysis);
router.get("/admin", getAdminAnalysis);
router.get("/student/:id/report", downloadStudentAnalyticsReport);
router.get("/teacher/report", downloadTeacherAnalyticsReport);
router.get("/admin/report", downloadAdminAnalyticsReport);

module.exports = router;
