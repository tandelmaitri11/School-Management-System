const express = require("express");
const router = express.Router();

const {
  getStudentAnalysis,
  getTeacherAnalysis,
  getAdminAnalysis
} = require("../controller/analyticsController");

router.get("/student/:id", getStudentAnalysis);
router.get("/teacher", getTeacherAnalysis);
router.get("/admin", getAdminAnalysis);

module.exports = router;