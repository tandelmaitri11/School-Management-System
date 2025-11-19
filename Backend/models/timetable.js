const mongoose = require("mongoose");

const timetableSchema = new mongoose.Schema(
  {
    className: String,
    day: String, // e.g., "Monday"
    schedule: [
      {
        time: String,
        subject: String,
        teacher: String,
        room: String,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Timetable", timetableSchema);
