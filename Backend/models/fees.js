const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true }, // rupees
    mode: { type: String, default: "Cash" },  // Cash / Online
    date: { type: Date, default: Date.now },

    transactionId: { type: String }, // Razorpay payment id OR CASH-...
    orderId: { type: String },       // Razorpay order id

    receiptNo: { type: String },     // RCPT-...
    studentId: { type: String },     // STU0001 (human friendly)
  },
  { _id: true }
);

const feesSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true }, // Student Mongo _id stored as string
    studentName: { type: String, required: true },
    studentClass: { type: Number, required: true },

    totalFees: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    remainingAmount: { type: Number, default: 0 },
    feeStatus: { type: String, enum: ["Paid", "Pending"], default: "Pending" },

    paymentHistory: [paymentSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Fees", feesSchema);
