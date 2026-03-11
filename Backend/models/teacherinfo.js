const mongoose = require("mongoose");

const isValidPhone = (v) => /^\d{10}$/.test(String(v || "").trim());

const teacherInfoSchema = new mongoose.Schema({
  regNumber: {
    type: String,
    required: true,
    unique: true, // Each teacher info only once
  },
  teacherName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
  },
  role: {
    type: String,
    default: "Teacher",
  },
  mobile: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: isValidPhone,
      message: "mobile must be exactly 10 digits",
    },
  },
  salary: {
    type: Number,
    required: true,
  },
  fatherName: {
    type: String,
  },
  gender: {
    type: String,
    required: true,
  },
  experience: {
    type: Number,
    default: 0,
  },
  education: {
    type: String,
  },
  address: {
    type: String,
  },
  bloodGroup: {
    type: String,
  },
  dob: {
    type: Date,
  },
  joiningDate: {
    type: Date,
    required: true,
  },
  picture: {
    type: String,
  },
  subjects: [{ type: String, trim: true }],
  classes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Class" }],
  assignedSections: [
    {
      classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class" },
      section: { type: String, trim: true, default: "" },
      stream: { type: String, trim: true, default: "" },
    },
  ],
}, { timestamps: true });

module.exports = mongoose.model("TeacherInfo", teacherInfoSchema);
