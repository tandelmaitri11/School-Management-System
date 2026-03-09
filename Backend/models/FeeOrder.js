const mongoose = require("mongoose");

const feeOrderSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true },
    feesId: { type: mongoose.Schema.Types.ObjectId, ref: "Fees" },

    amount: { type: Number, required: true }, // in rupees
    currency: { type: String, default: "INR" },

    razorpayOrderId: { type: String, required: true },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },

    status: { type: String, enum: ["created", "paid", "failed"], default: "created" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("FeeOrder", feeOrderSchema);
