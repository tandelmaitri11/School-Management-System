const mongoose = require("mongoose");

const lmsCourseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    subject: { type: String, required: true, trim: true },
    classAssigned: { type: Number, required: true },
    section: { type: String, required: true, trim: true, uppercase: true },
    stream: { type: String, default: "", trim: true },
    teacherId: { type: String, required: true },
    coverImage: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("LmsCourse", lmsCourseSchema);
