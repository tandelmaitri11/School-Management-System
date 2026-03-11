const mongoose = require("mongoose");

const contactMessageSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, default: "", trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    message: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["New", "Responded", "Closed"],
      default: "New",
    },
    adminResponse: { type: String, default: "", trim: true },
    respondedAt: { type: Date, default: null },
    respondedBy: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ContactMessage", contactMessageSchema);
