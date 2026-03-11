const mongoose = require("mongoose");

const classFeesSchema = new mongoose.Schema({
  className: { type: Number, required: true }, // remove unique
  stream: { type: String, default: "", trim: true },
  totalFees: { type: Number, required: true },
  autoReminderEnabled: { type: Boolean, default: true },
  dueDay: { type: Number, default: null }, // 1-31
  graceDays: { type: Number, default: 0 },
  lateFeeType: {
    type: String,
    enum: ["flat", "daily", "percent"],
    default: "flat",
  },
  lateFeeValue: { type: Number, default: 0 },
  lateFeeCap: { type: Number, default: 0 }, // 0 => no cap
}, { timestamps: true });

module.exports = mongoose.model("ClassFees", classFeesSchema);
