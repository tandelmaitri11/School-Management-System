const mongoose = require("mongoose");

const holidaySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    date: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    description: { type: String, default: "", trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

holidaySchema.index({ date: 1 }, { unique: true });

module.exports = mongoose.model("Holiday", holidaySchema);
