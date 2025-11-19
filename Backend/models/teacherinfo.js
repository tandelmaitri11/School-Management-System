const mongoose = require("mongoose");

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
}, { timestamps: true });

module.exports = mongoose.model("TeacherInfo", teacherInfoSchema);
