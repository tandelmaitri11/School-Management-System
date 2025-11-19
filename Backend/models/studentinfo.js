const mongoose = require("mongoose");

const studentInfoSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      unique: true,
    },

    address: String,

    // ✅ Gender field with fixed options
    gender: {
      type: String,
      enum: ["Girl", "Boy", "Other"],
      required: true,
    },

    dob: Date,

    // ✅ Blood group field with fixed valid options
    bloodGroup: {
      type: String,
      enum: [
        "A+",
        "A-",
        "B+",
        "B-",
        "AB+",
        "AB-",
        "O+",
        "O-"
      ],
      required: true,
    },

    cast: String,

    // ✅ Parent Info
    fatherName: String,
    fatherMobile: String,
    fatherOccupation: String,
    fatherIncome: String,

    motherName: String,
    motherMobile: String,
    motherOccupation: String,
    motherIncome: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("StudentInfo", studentInfoSchema);
