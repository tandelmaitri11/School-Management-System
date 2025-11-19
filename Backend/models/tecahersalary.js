const mongoose = require("mongoose");

const teacherSalarySchema = new mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TeacherInfo",
      required: true,
    },
    month: { type: String, required: true },
    paidAmount: { type: Number, required: true },

    status: { 
      type: String, 
      enum: ["Pending", "Paid", "Approved", "Rejected"], 
      default: "Pending" 
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TeacherSalary", teacherSalarySchema);
