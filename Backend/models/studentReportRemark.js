const mongoose = require("mongoose");

const studentReportRemarkSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      unique: true,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      default: null,
    },
    remarks: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("StudentReportRemark", studentReportRemarkSchema);
