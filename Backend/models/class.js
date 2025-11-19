const mongoose = require("mongoose");

const classSchema = new mongoose.Schema({
  className: {
    type: Number,
    required: true,
    unique: true,
    min: 1,
    max: 12,
  },
  classTeacher: {
    type: mongoose.Schema.Types.ObjectId, // store teacher as ObjectId
    ref: "Teacher", // reference the Teacher collection
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model("Class", classSchema);
