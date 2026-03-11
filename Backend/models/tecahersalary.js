const mongoose = require("mongoose");

const teacherSalarySchema = new mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TeacherInfo",
      required: true,
    },

    month: {
      type: String,
      required: true, // e.g. "2026-01"
    },

    paidAmount: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: ["Pending", "Approved", "Paid", "Rejected"],
      default: "Pending",
    },

    payoutStatus: {
      type: String,
      enum: ["Pending", "Processing", "Paid", "Failed"],
      default: "Pending",
    },

    payoutMode: {
      type: String,
      default: "",
    },

    payoutId: {
      type: String,
      default: "",
    },

    payoutReferenceId: {
      type: String,
      default: "",
    },

    salarySlipSentAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true } // must be here
);

module.exports = mongoose.model("TeacherSalary", teacherSalarySchema);
