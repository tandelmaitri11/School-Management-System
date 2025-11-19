const mongoose = require("mongoose");
const Counter = require("./counter");

const teacherSchema = new mongoose.Schema({
  teacherId: { type: String, unique: true },
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, default: "Teacher" },
}, { timestamps: true });

// Pre-save hook to generate unique teacherId
teacherSchema.pre("save", async function (next) {
  if (!this.teacherId) {
    const counter = await Counter.findOneAndUpdate(
      { name: "teacher" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.teacherId = "TEA" + counter.seq.toString().padStart(4, "0");
  }
  next();
});

module.exports = mongoose.model("Teacher", teacherSchema);
