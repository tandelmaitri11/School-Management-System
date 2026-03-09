const mongoose = require("mongoose");

const lmsChapterSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LmsCourse",
      required: true,
    },
    title: { type: String, required: true, trim: true },
    order: { type: Number, default: 0 },
    description: { type: String, default: "" },
    topics: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("LmsChapter", lmsChapterSchema);
