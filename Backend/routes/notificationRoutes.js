const router = require("express").Router();
const { verifyToken } = require("../middleware/authMiddleware");
const requireAdmin = require("../middleware/requireAdmin");
const {
  getMyNotifications,
  getMyUnreadCount,
  markNotificationRead,
  markAllMyNotificationsRead,
} = require("../controller/notificationController");
const {
  bulkEmailQueue,
  bulkSmsQueue,
  getQueueOverview,
  processQueueNow,
} = require("../controller/bulkNotificationController");

router.get("/my", verifyToken, getMyNotifications);
router.get("/my/unread-count", verifyToken, getMyUnreadCount);
router.patch("/:id/read", verifyToken, markNotificationRead);
router.patch("/my/read-all", verifyToken, markAllMyNotificationsRead);
router.post("/bulk-email", verifyToken, requireAdmin, bulkEmailQueue);
router.post("/bulk-sms", verifyToken, requireAdmin, bulkSmsQueue);
router.get("/queue/stats", verifyToken, requireAdmin, getQueueOverview);
router.post("/queue/process-now", verifyToken, requireAdmin, processQueueNow);

module.exports = router;
