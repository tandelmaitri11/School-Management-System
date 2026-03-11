const express = require("express");
const {
  submitContactMessage,
  getContactMessages,
  respondContactMessage,
  updateContactStatus,
} = require("../controller/contactController");
const { verifyToken } = require("../middleware/authMiddleware");
const requireAdmin = require("../middleware/requireAdmin");

const router = express.Router();

router.post("/", submitContactMessage);

router.get("/admin/messages", verifyToken, requireAdmin, getContactMessages);
router.put("/admin/messages/:id/respond", verifyToken, requireAdmin, respondContactMessage);
router.put("/admin/messages/:id/status", verifyToken, requireAdmin, updateContactStatus);

module.exports = router;
