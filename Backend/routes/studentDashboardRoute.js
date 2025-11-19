const express = require("express");
const router = express.Router();
const dashboard = require("../controller/studentDashboardController");


router.get("/profile/:studentId", dashboard.getProfile);
router.get("/assignments/:className", dashboard.getAssignments);
router.get("/attendance/:studentId", dashboard.getAttendance);
router.get("/submissions/:studentId", dashboard.getSubmissions);


module.exports = router;