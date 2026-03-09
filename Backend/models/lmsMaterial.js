const mongoose = require("mongoose");

const lmsMaterialSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LmsCourse",
      required: true,
    },
    chapterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LmsChapter",
      required: true,
    },
    title: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["video", "note"],
      required: true,
    },
    file: { type: String, default: "" },
    externalUrl: { type: String, default: "" },
    duration: { type: Number, default: 0 },
    topic: { type: String, default: "" },
    order: { type: Number, default: 0 },
    assignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assignment",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("LmsMaterial", lmsMaterialSchema);
