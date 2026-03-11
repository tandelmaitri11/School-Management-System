const Notification = require("../models/Notification");
const Student = require("../models/studentregister");

const normalizeUpper = (v) => String(v || "").trim().toUpperCase();
const normalize = (v) => String(v || "").trim();

const buildAudienceFilterForUser = async (reqUser) => {
  const role = String(reqUser?.role || "").trim();
  const userId = String(reqUser?.id || "").trim();

  if (!role || !userId) return null;

  if (role === "Student") {
    const student = await Student.findById(userId)
      .select("studentClass section stream subjectChoice")
      .lean();

    const className = Number(student?.studentClass || reqUser?.className || 0);
    const section = normalizeUpper(student?.section);
    const stream = normalize(student?.stream);
    const subjectChoice = normalize(student?.subjectChoice);

    const studentScopeFilter = {
      recipientRole: "Student",
      $and: [
        {
          $or: [{ className: null }, { className: className }],
        },
        {
          $or: [{ section: "" }, { section }],
        },
        {
          $or: [{ stream: "" }, { stream }],
        },
        {
          $or: [{ subjectChoice: "" }, { subjectChoice }],
        },
      ],
    };

    return {
      $or: [{ targetUserId: userId }, studentScopeFilter],
    };
  }

  return {
    $or: [
      { targetUserId: userId },
      {
        recipientRole: role,
        targetUserId: "",
      },
    ],
  };
};

exports.getMyNotifications = async (req, res) => {
  try {
    const userId = String(req.user?.id || "").trim();
    const filter = await buildAudienceFilterForUser(req.user);
    if (!filter) return res.status(401).json({ success: false, message: "Unauthorized" });

    const limit = Math.min(Number(req.query.limit || 30), 100);
    const rows = await Notification.find(filter).sort({ createdAt: -1 }).limit(limit).lean();

    const notifications = rows.map((n) => ({
      ...n,
      isRead: Array.isArray(n.readBy) && n.readBy.includes(userId),
    }));

    return res.status(200).json({ success: true, notifications });
  } catch (err) {
    console.error("getMyNotifications error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch notifications" });
  }
};

exports.getMyUnreadCount = async (req, res) => {
  try {
    const userId = String(req.user?.id || "").trim();
    const filter = await buildAudienceFilterForUser(req.user);
    if (!filter) return res.status(401).json({ success: false, message: "Unauthorized" });

    const count = await Notification.countDocuments({
      ...filter,
      readBy: { $ne: userId },
    });

    return res.status(200).json({ success: true, unreadCount: count });
  } catch (err) {
    console.error("getMyUnreadCount error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch unread count" });
  }
};

exports.markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = String(req.user?.id || "").trim();
    const filter = await buildAudienceFilterForUser(req.user);
    if (!filter) return res.status(401).json({ success: false, message: "Unauthorized" });

    const updated = await Notification.findOneAndUpdate(
      { _id: id, ...filter },
      { $addToSet: { readBy: userId } },
      { new: true }
    ).lean();

    if (!updated) return res.status(404).json({ success: false, message: "Notification not found" });

    return res.status(200).json({ success: true, message: "Marked as read" });
  } catch (err) {
    console.error("markNotificationRead error:", err);
    return res.status(500).json({ success: false, message: "Failed to update notification" });
  }
};

exports.markAllMyNotificationsRead = async (req, res) => {
  try {
    const userId = String(req.user?.id || "").trim();
    const filter = await buildAudienceFilterForUser(req.user);
    if (!filter) return res.status(401).json({ success: false, message: "Unauthorized" });

    await Notification.updateMany(filter, {
      $addToSet: { readBy: userId },
    });

    return res.status(200).json({ success: true, message: "All notifications marked as read" });
  } catch (err) {
    console.error("markAllMyNotificationsRead error:", err);
    return res.status(500).json({ success: false, message: "Failed to update notifications" });
  }
};
