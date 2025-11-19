const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  mode: { type: String, default: "Cash" },
  date: { type: Date, default: Date.now },
});

const feesSchema = new mongoose.Schema({
  studentId: { type: String, required: true }, // store studentId
  studentName: { type: String, required: true },
  studentClass: { type: Number, required: true },
  totalFees: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  remainingAmount: { type: Number, default: 0 },
  feeStatus: { type: String, enum: ["Paid", "Pending"], default: "Pending" },
  paymentHistory: [paymentSchema],
}, { timestamps: true });

module.exports = mongoose.model("Fees", feesSchema);
