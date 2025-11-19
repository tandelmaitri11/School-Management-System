const express = require("express");
const {
  getUser,
  registerUser,
  loginUser,
  addadmin,
  getAdminProfile,
  updateAdminProfile,
  getDashboardData,
  getTeacher,
  changeAdminPassword
} = require("../controller/userController");

const router = express.Router();

// User routes
router.get("/users", getUser);
router.post("/register", registerUser);
router.post("/login", loginUser);

// Admin routes
router.post("/admin", addadmin);
router.get("/admin/profile/:id", getAdminProfile);
router.put("/admin/profile/:id", updateAdminProfile);
router.put("/admin/change-password/:id", changeAdminPassword); // <-- FIXED

// Dashboard and teachers
router.get("/dashboard", getDashboardData);
router.get("/teachers", getTeacher);


module.exports = router;
