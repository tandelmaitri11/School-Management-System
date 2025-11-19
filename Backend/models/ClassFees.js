const mongoose = require("mongoose");

const classFeesSchema = new mongoose.Schema({
  className: { type: Number, required: true }, // remove unique
  totalFees: { type: Number, required: true },
}, { timestamps: true });

module.exports = mongoose.model("ClassFees", classFeesSchema);
