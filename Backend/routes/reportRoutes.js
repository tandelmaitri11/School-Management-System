const express = require("express");
const router = express.Router();
const { getStudentReport, saveStudentReportRemark } = require("../controller/reportController");
const { verifyToken } = require("../middleware/authMiddleware");

router.get("/student/:studentId", getStudentReport);
router.put("/student/:studentId/remark", verifyToken, saveStudentReportRemark);

module.exports = router;
