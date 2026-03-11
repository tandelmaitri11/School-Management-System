const mongoose = require("mongoose");
const Counter = require("./counter");

const isValidPhoneOrEmpty = (v) => !String(v || "").trim() || /^\d{10}$/.test(String(v || "").trim());

const teacherSchema = new mongoose.Schema(
  {
    teacherId: { type: String, unique: true, index: true },
    name: String,
    email: { type: String, unique: true },
    phone: {
      type: String,
      default: "",
      trim: true,
      validate: {
        validator: isValidPhoneOrEmpty,
        message: "phone must be exactly 10 digits",
      },
    },
    mobile: {
      type: String,
      default: "",
      trim: true,
      validate: {
        validator: isValidPhoneOrEmpty,
        message: "mobile must be exactly 10 digits",
      },
    },
    contactNumber: {
      type: String,
      default: "",
      trim: true,
      validate: {
        validator: isValidPhoneOrEmpty,
        message: "contactNumber must be exactly 10 digits",
      },
    },
    password: String,
    role: { type: String, default: "Teacher" },
  },
  { timestamps: true }
);

// Pre-save hook to generate unique teacherId with counter sync.
teacherSchema.pre("save", async function (next) {
  try {
    if (!this.teacherId) {
      const lastTeacher = await this.constructor
        .findOne({ teacherId: /^TEA/ })
        .sort({ teacherId: -1 })
        .select("teacherId");

      const maxSeq = lastTeacher ? parseInt(String(lastTeacher.teacherId).slice(3), 10) : 0;

      await Counter.findOneAndUpdate(
        { name: "teacher" },
        { $max: { seq: maxSeq } },
        { upsert: true }
      );

      const counter = await Counter.findOneAndUpdate(
        { name: "teacher" },
        { $inc: { seq: 1 } },
        { new: true }
      );

      this.teacherId = "TEA" + String(counter.seq).padStart(4, "0");
    }

    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model("Teacher", teacherSchema);
