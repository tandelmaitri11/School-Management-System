const mongoose = require("mongoose");

const messageQueueSchema = new mongoose.Schema(
  {
    channel: {
      type: String,
      enum: ["EMAIL", "SMS"],
      required: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "PROCESSING", "SENT", "FAILED"],
      default: "PENDING",
      index: true,
    },
    to: { type: String, required: true, trim: true },
    subject: { type: String, default: "", trim: true },
    html: { type: String, default: "" },
    text: { type: String, default: "" },
    message: { type: String, default: "", trim: true },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 3 },
    errorMessage: { type: String, default: "" },
    nextRunAt: { type: Date, default: Date.now, index: true },
    lastAttemptAt: { type: Date, default: null },
    sentAt: { type: Date, default: null },
  },
  { timestamps: true }
);

messageQueueSchema.index({ status: 1, nextRunAt: 1, createdAt: 1 });
messageQueueSchema.index({ channel: 1, createdAt: -1 });

module.exports = mongoose.model("MessageQueue", messageQueueSchema);
