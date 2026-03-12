const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["ANNOUNCEMENT", "ASSIGNMENT", "RESULT", "ATTENDANCE"],
      required: true,
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    recipientRole: {
      type: String,
      enum: ["Student", "Teacher", "Admin", "Parent"],
      required: true,
    },
    targetUserId: { type: String, default: "" },
    className: { type: Number, default: null },
    section: { type: String, default: "", trim: true, uppercase: true },
    stream: { type: String, default: "", trim: true },
    subjectChoice: { type: String, default: "", trim: true },
    readBy: [{ type: String }],
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

notificationSchema.index({ recipientRole: 1, createdAt: -1 });
notificationSchema.index({ targetUserId: 1, createdAt: -1 });
notificationSchema.index({ className: 1, section: 1, stream: 1 });

module.exports = mongoose.model("Notification", notificationSchema);
