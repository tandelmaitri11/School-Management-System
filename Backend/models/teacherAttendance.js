const mongoose = require("mongoose");

const TeacherAttendanceSchema = new mongoose.Schema(
  {
    date: {
      type: String, // normalized YYYY-MM-DD
      required: true,
      index: true
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin", 
    },
    attendance: [
      {
        teacherId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Teacher", 
          required: true,
        },
        status: {
          type: String,
          enum: ["Present", "Absent"],
          required: true,
          default: "Absent",
        }
      }
    ]
  },
  { timestamps: true }
);

// Prevent duplicate record for same date (one doc per date)
TeacherAttendanceSchema.index({ date: 1 }, { unique: true });

module.exports = mongoose.model("TeacherAttendance", TeacherAttendanceSchema);
