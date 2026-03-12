const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    audience: {
      type: String,
      enum: ["Students", "Teachers", "Parents", "All", "Both"],
      required: true,
      default: "All",
    },
    isPublished: { type: Boolean, default: false },
    publishedAt: { type: Date, default: null },
    createdBy: { type: String, default: "Admin" },
    mediaUrl: { type: String, default: "" },
    mediaType: { type: String, enum: ["", "image", "video"], default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Announcement", announcementSchema);
