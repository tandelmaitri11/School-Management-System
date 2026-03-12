const Announcement = require("../models/Announcement");
const eventBus = require("../events/eventBus");
const Notification = require("../models/Notification");

const normalizeAudience = (value) => String(value || "").trim();
const normalizeStoredAudience = (value) => {
  const audience = normalizeAudience(value);
  return audience === "Both" ? "All" : audience;
};

exports.createAnnouncement = async (req, res) => {
  try {
    const { title, message, audience, isPublished } = req.body || {};

    if (!title || !message || !audience) {
      return res.status(400).json({ message: "title, message and audience are required" });
    }

    let mediaUrl = "";
    let mediaType = "";
    if (req.file) {
      mediaUrl = `uploads/announcements/${req.file.filename}`;
      mediaType = String(req.file.mimetype || "").startsWith("video/") ? "video" : "image";
    }

    const doc = await Announcement.create({
      title: String(title).trim(),
      message: String(message).trim(),
      audience,
      isPublished: Boolean(isPublished),
      publishedAt: isPublished ? new Date() : null,
      createdBy: req.body?.createdBy || "Admin",
      mediaUrl,
      mediaType,
    });

    if (doc.isPublished) {
      eventBus.emitAsync("announcement.posted", {
        announcementId: doc._id,
        title: doc.title,
        message: doc.message,
        audience: doc.audience,
        createdBy: doc.createdBy,
        publishedAt: doc.publishedAt,
        mediaUrl: doc.mediaUrl,
        mediaType: doc.mediaType,
      });
    }

    return res.status(201).json({ message: "Announcement created", announcement: doc });
  } catch (err) {
    console.error("createAnnouncement error:", err);
    return res.status(500).json({ message: "Error creating announcement" });
  }
};

exports.listAnnouncements = async (_req, res) => {
  try {
    const rows = await Announcement.find().sort({ createdAt: -1 }).lean();
    const announcementIds = rows.map((r) => String(r._id));

    let statMap = new Map();
    if (announcementIds.length) {
      const stats = await Notification.aggregate([
        { $match: { type: "ANNOUNCEMENT" } },
        {
          $addFields: {
            announcementIdStr: { $toString: "$data.announcementId" },
            readBySafe: { $ifNull: ["$readBy", []] },
          },
        },
        { $match: { announcementIdStr: { $in: announcementIds } } },
        { $unwind: "$readBySafe" },
        {
          $group: {
            _id: {
              announcementId: "$announcementIdStr",
              role: "$recipientRole",
            },
            viewers: { $addToSet: "$readBySafe" },
          },
        },
        {
          $project: {
            _id: 0,
            announcementId: "$_id.announcementId",
            role: "$_id.role",
            viewCount: { $size: "$viewers" },
          },
        },
        {
          $group: {
            _id: "$announcementId",
            totalViews: { $sum: "$viewCount" },
            studentViews: {
              $sum: {
                $cond: [{ $eq: ["$role", "Student"] }, "$viewCount", 0],
              },
            },
            teacherViews: {
              $sum: {
                $cond: [{ $eq: ["$role", "Teacher"] }, "$viewCount", 0],
              },
            },
            parentViews: {
              $sum: {
                $cond: [{ $eq: ["$role", "Parent"] }, "$viewCount", 0],
              },
            },
          },
        },
      ]);

      statMap = new Map(
        stats.map((s) => [
          String(s._id),
          {
            totalViews: Number(s.totalViews || 0),
            studentViews: Number(s.studentViews || 0),
            teacherViews: Number(s.teacherViews || 0),
            parentViews: Number(s.parentViews || 0),
          },
        ])
      );
    }

    const announcements = rows.map((row) => ({
      ...row,
      audience: normalizeStoredAudience(row.audience),
      viewStats: statMap.get(String(row._id)) || {
        totalViews: 0,
        studentViews: 0,
        teacherViews: 0,
        parentViews: 0,
      },
    }));

    return res.json({ announcements });
  } catch (err) {
    console.error("listAnnouncements error:", err);
    return res.status(500).json({ message: "Error fetching announcements" });
  }
};

exports.updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, message, audience } = req.body || {};

    if (!title || !message || !audience) {
      return res.status(400).json({ message: "title, message and audience are required" });
    }

    const updateSet = {
      title: String(title).trim(),
      message: String(message).trim(),
      audience,
    };

    if (req.file) {
      updateSet.mediaUrl = `uploads/announcements/${req.file.filename}`;
      updateSet.mediaType = String(req.file.mimetype || "").startsWith("video/") ? "video" : "image";
    }

    const updated = await Announcement.findByIdAndUpdate(id, { $set: updateSet }, { new: true });

    if (!updated) return res.status(404).json({ message: "Announcement not found" });
    return res.json({ message: "Announcement updated", announcement: updated });
  } catch (err) {
    console.error("updateAnnouncement error:", err);
    return res.status(500).json({ message: "Error updating announcement" });
  }
};

exports.deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Announcement.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Announcement not found" });
    return res.json({ message: "Announcement deleted" });
  } catch (err) {
    console.error("deleteAnnouncement error:", err);
    return res.status(500).json({ message: "Error deleting announcement" });
  }
};

exports.togglePublishAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const { isPublished } = req.body || {};
    if (typeof isPublished !== "boolean") {
      return res.status(400).json({ message: "isPublished(boolean) is required" });
    }

    const current = await Announcement.findById(id).select("isPublished").lean();
    if (!current) return res.status(404).json({ message: "Announcement not found" });

    const updated = await Announcement.findByIdAndUpdate(
      id,
      {
        $set: {
          isPublished,
          publishedAt: isPublished ? new Date() : null,
        },
      },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Announcement not found" });

    if (!current.isPublished && updated.isPublished) {
      eventBus.emitAsync("announcement.posted", {
        announcementId: updated._id,
        title: updated.title,
        message: updated.message,
        audience: updated.audience,
        createdBy: updated.createdBy,
        publishedAt: updated.publishedAt,
        mediaUrl: updated.mediaUrl,
        mediaType: updated.mediaType,
      });
    }

    return res.json({
      message: `Announcement ${isPublished ? "published" : "unpublished"}`,
      announcement: updated,
    });
  } catch (err) {
    console.error("togglePublishAnnouncement error:", err);
    return res.status(500).json({ message: "Error updating publish status" });
  }
};

exports.getPublishedAnnouncements = async (req, res) => {
  try {
    const audience = normalizeAudience(req.query.audience);
    let audienceFilter = ["All", "Both"];

    if (audience === "Students") audienceFilter = ["Students", "All", "Both"];
    if (audience === "Teachers") audienceFilter = ["Teachers", "All", "Both"];
    if (audience === "Parents") audienceFilter = ["Parents", "All", "Both"];

    const rows = await Announcement.find({
      isPublished: true,
      audience: { $in: audienceFilter },
    }).sort({ publishedAt: -1, createdAt: -1 });

    return res.json({ announcements: rows });
  } catch (err) {
    console.error("getPublishedAnnouncements error:", err);
    return res.status(500).json({ message: "Error fetching published announcements" });
  }
};
