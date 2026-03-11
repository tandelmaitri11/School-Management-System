const mongoose = require("mongoose");

const slotOptionSchema = new mongoose.Schema(
  {
    subjectChoice: { type: String, default: "", trim: true }, // Maths/Biology...
    subject: { type: String, default: "", trim: true },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher", default: null },
    groupKey: { type: String, default: "" },
  },
  { _id: false }
);

const slotSchema = new mongoose.Schema(
  {
    period: { type: Number, required: true },           // 1..8
    subject: { type: String, default: "", trim: true }, // "English" / "Optional"
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher", default: null },

    // Optional subject handling
    isOptional: { type: Boolean, default: false },      
    subjectChoice: { type: String, default: "", trim: true }, 
    
    
    groupKey: { type: String, default: "" },

    // Same period can contain multiple optional choices
    options: { type: [slotOptionSchema], default: [] },
  },
  { _id: false }
);

const daySchema = new mongoose.Schema(
  {
    day: { type: String, required: true, trim: true },  // "Mon"
    slots: { type: [slotSchema], default: [] },         // periods array
  },
  { _id: false }
);

const timetableSchema = new mongoose.Schema(
  {
    classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true, index: true },
    section: { type: String, required: true, trim: true, uppercase: true, index: true }, // A/B
    stream: { type: String, default: "", trim: true, index: true }, // Science/Commerce/""

    days: { type: [daySchema], default: [] }, // full week in one doc

    meta: {
      periodsPerDay: { type: Number, default: 8 },
      workingDays: { type: [String], default: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] },
    },
  },
  { timestamps: true }
);

timetableSchema.index({ classId: 1, section: 1, stream: 1 }, { unique: true });

module.exports = mongoose.model("Timetable", timetableSchema);
