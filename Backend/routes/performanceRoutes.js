const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const requireTeacher = require("../middleware/requireTeacher");
const { getAllPerformance } = require("../controller/performanceController");

router.get("/all", verifyToken, requireTeacher, getAllPerformance);

module.exports = router;
