const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    dueDate: {
      type: Date,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TeacherInfo",
      required: true,
    },
    classAssigned: {
      type: Number, // e.g. 10, 11, 12
      required: true,
    },
    file: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Assignment", assignmentSchema);
