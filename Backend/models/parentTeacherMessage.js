const mongoose = require("mongoose");

const threadMessageSchema = new mongoose.Schema(
  {
    senderRole: {
      type: String,
      enum: ["Parent", "Teacher"],
      required: true,
    },
    senderId: {
      type: String,
      required: true,
      trim: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const parentTeacherMessageSchema = new mongoose.Schema(
  {
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Parent",
      required: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
      index: true,
    },
    subject: {
      type: String,
      default: "",
      trim: true,
      maxlength: 200,
    },
    status: {
      type: String,
      enum: ["Open", "Resolved"],
      default: "Open",
    },
    messages: {
      type: [threadMessageSchema],
      default: [],
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
    lastSeenByParentAt: {
      type: Date,
      default: null,
    },
    lastSeenByTeacherAt: {
      type: Date,
      default: null,
    },
    parentClearedAt: {
      type: Date,
      default: null,
    },
    teacherClearedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

parentTeacherMessageSchema.index({ parentId: 1, studentId: 1, teacherId: 1 }, { unique: true });
parentTeacherMessageSchema.index({ parentId: 1, studentId: 1, lastMessageAt: -1 });

module.exports = mongoose.model("ParentTeacherMessage", parentTeacherMessageSchema);
