const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    section: {
      type: String,
      default: "",
      trim: true,
      uppercase: true,
    },
    stream: {
      type: String,
      default: "",
      trim: true,
    },
    date: {
      type: String, // YYYY-MM-DD format
      required: true,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
    },
    attendance: [
      {
        studentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Student",
          required: true,
        },
        status: {
          type: String,
          enum: ["Present", "Absent"],
          required: true,
        },
      },
    ],
  },
  { timestamps: true }
);

attendanceSchema.index({ classId: 1, date: 1, section: 1, stream: 1 }, { unique: true });

module.exports = mongoose.model("Attendance", attendanceSchema);
