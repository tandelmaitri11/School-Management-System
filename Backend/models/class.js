const mongoose = require("mongoose");

const streamSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
    subjectOptions: [{ type: String, trim: true }], // optional (store stream-wise optional subjects)
  },
  { _id: false }
);

const sectionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true }, // A, B, C...
    capacity: { type: Number, default: 40, min: 1 },
    stream: { type: String, default: "", trim: true }, // optional: Science/Commerce/Arts or ""
    isActive: { type: Boolean, default: true },
    isLocked: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const classSchema = new mongoose.Schema(
  {
    className: { type: Number, required: true, min: 1, max: 12 },

    academicYear: { type: String, default: "", trim: true },

    streams: [streamSchema],

    classTeacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
    },
   
    sections: [sectionSchema],
  },
  { timestamps: true }
);

classSchema.index({ className: 1, academicYear: 1 }, { unique: true });

module.exports = mongoose.model("Class", classSchema);