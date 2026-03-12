const mongoose = require("mongoose");

const parentStudentMapSchema = new mongoose.Schema(
  {
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Parent",
      required: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    relation: {
      type: String,
      enum: ["Father", "Mother", "Guardian", "Parent", "Other"],
      default: "Parent",
      trim: true,
    },
    accessLevel: {
      type: String,
      enum: ["full", "view_only"],
      default: "view_only",
    },
    isPrimary: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

parentStudentMapSchema.index({ parentId: 1, studentId: 1 }, { unique: true });

module.exports =
  mongoose.models.ParentStudentMap || mongoose.model("ParentStudentMap", parentStudentMapSchema);
