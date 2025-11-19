const mongoose = require("mongoose");
const Counter = require("./counter");

const studentSchema = new mongoose.Schema({
  studentId: { type: String, unique: true },
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, default: "Student" },
  studentClass: Number,
}, { timestamps: true });

// Pre-save hook to generate unique studentId
studentSchema.pre("save", async function (next) {
  if (!this.studentId) {
    const counter = await Counter.findOneAndUpdate(
      { name: "student" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.studentId = "STU" + counter.seq.toString().padStart(4, "0");
  }
  next();
});

module.exports = mongoose.model("Student", studentSchema);
