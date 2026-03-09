const mongoose = require("mongoose");

const lmsProgressSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LmsCourse",
      required: true,
    },
    materialId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LmsMaterial",
      required: true,
    },
    completedAt: { type: Date, default: Date.now },
    progressPct: { type: Number, default: 0 },
    watchedSeconds: { type: Number, default: 0 },
  },
  { timestamps: true }
);

lmsProgressSchema.index({ studentId: 1, materialId: 1 }, { unique: true });

module.exports = mongoose.model("LmsProgress", lmsProgressSchema);
