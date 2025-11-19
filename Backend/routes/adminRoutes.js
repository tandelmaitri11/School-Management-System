const express = require("express");
const router = express.Router();
const {
  createAdmin,
  getAllAdmins,
  updateAdmin,
  deleteAdmin,
  changePassword,
} = require("../controller/adminController");

// Routes
router.post("/create", createAdmin);
router.get("/", getAllAdmins);
router.put("/:id", updateAdmin);
router.put("/change-password/:id", changePassword); // 🔹 New route
router.delete("/:id", deleteAdmin);

module.exports = router;
