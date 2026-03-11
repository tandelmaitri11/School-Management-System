const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema({
  className: { type: Number, ref: "Class", required: true },

  common: [{ subjectName: { type: String, required: true, trim: true } }],

  streams: [
    {
      name: { type: String, required: true, trim: true },
      subjects: [{ subjectName: { type: String, required: true, trim: true } }],
    },
  ],
});

module.exports = mongoose.models.Subject || mongoose.model("Subject", subjectSchema);
