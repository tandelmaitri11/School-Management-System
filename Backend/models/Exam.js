const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  type: { type: String, enum: ["MCQ"], required: true },
  options: {
    type: [String],
    required: true,
    validate: {
      validator: function (v) {
        return v.length === 4;
      },
      message: "MCQ must have exactly 4 options",
    },
  },
  correctAnswer: {
    type: String,
    required: true,
    validate: {
      validator: function (v) {
        return this.options.includes(v);
      },
      message: "Correct answer must be one of the options",
    },
  },
  marks: { type: Number, required: true },
});

const submissionAnswerSchema = new mongoose.Schema(
  {
    questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
    selectedAnswer: { type: String, default: "" },
    isCorrect: { type: Boolean, default: false },
    marksAwarded: { type: Number, default: 0 },
  },
  { _id: false }
);

const submissionSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    startedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date, default: null },
    status: { type: String, enum: ["STARTED", "SUBMITTED", "ABSENT"], default: "STARTED" },
    answers: [submissionAnswerSchema],
    obtainedMarks: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    grade: { type: String, default: "" },
    resultStatus: { type: String, enum: ["PASS", "FAIL"], default: "FAIL" },
  },
  { timestamps: true }
);

const examSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true },
    className: { type: Number, required: true },
    section: { type: String, default: "", trim: true, uppercase: true },
    stream: { type: String, default: "", trim: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
    subjectName: { type: String, required: true },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher", required: true },
    startTime: { type: Date, required: true },
    duration: { type: Number, required: true },
    totalMarks: Number,
    questions: [questionSchema],
    submissions: [submissionSchema],
    notification: {
      createdEmailSentAt: { type: Date, default: null },
      reminder60SentAt: { type: Date, default: null },
      reminder15SentAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Exam", examSchema);
