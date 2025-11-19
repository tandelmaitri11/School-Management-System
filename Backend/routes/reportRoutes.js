const express = require("express");
const router = express.Router();
const { getStudentReport } = require("../controller/reportController");

router.get("/student/:studentId", getStudentReport);

module.exports = router;
