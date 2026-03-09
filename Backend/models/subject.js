const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema({
  className: {
    type: Number, 
    ref: "Class",
    required: true,
  },
  subjects: [
    {
      subjectName: {
        type: String,
        required: true,
      },
    },
  ],
});

module.exports = mongoose.models.Subject || mongoose.model("Subject", subjectSchema);


