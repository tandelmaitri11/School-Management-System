const mongoose = require("mongoose");
const Counter = require("./counter");

const studentSchema = new mongoose.Schema(
  {
    studentId: { type: String, unique: true, index: true },
    name: { type: String, required: true, trim: true },

    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },

    role: { type: String, default: "Student" },

    studentClass: { type: Number, required: true, min: 1, max: 12 },

    // ✅ common section A/B/C for all classes
    section: { type: String, default: "", trim: true, uppercase: true }, // "A"

    // ✅ only for 11-12
    stream: { type: String, default: "", trim: true }, // "Science"

    // ✅ optional (like Maths/Biology) from Class.streams.subjectOptions
    subjectChoice: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

// ✅ Counter based studentId generation
studentSchema.pre("save", async function (next) {
  try {
    if (!this.studentId) {
      const lastStudent = await this.constructor
        .findOne({ studentId: /^STU/ })
        .sort({ studentId: -1 })
        .select("studentId");

      const maxSeq = lastStudent ? parseInt(String(lastStudent.studentId).slice(3), 10) : 0;

      await Counter.findOneAndUpdate(
        { name: "student" },
        { $max: { seq: maxSeq } },
        { upsert: true }
      );

      const counter = await Counter.findOneAndUpdate(
        { name: "student" },
        { $inc: { seq: 1 } },
        { new: true }
      );

      this.studentId = "STU" + String(counter.seq).padStart(4, "0");
    }
    next();
  } catch (e) {
    next(e);
  }
});
// add after schema
studentSchema.index({ studentClass: 1, section: 1 });


module.exports = mongoose.model("Student", studentSchema);
