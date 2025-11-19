const express = require("express");
const router = express.Router();
const { 
  getCounts, 
  getMonthlyData, 
  getAttendanceSummary, 
  getFeesSummary 
} = require("../controller/adminDashboardController");

// Total counts for cards
router.get("/counts", getCounts);

// Monthly trend for line chart
router.get("/monthly", getMonthlyData);

// Teacher attendance summary
router.get("/attendance", getAttendanceSummary);

// Fee payment summary
router.get("/fees-status", getFeesSummary);

module.exports = router;
