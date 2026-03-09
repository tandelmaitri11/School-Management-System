const mongoose = require("mongoose");
const Exam = require("../models/Exam");
const { sendExamCreatedEmails } = require("../services/examNotificationService");

/* ================= TEACHER: ADD EXAM HEADER ================= */
const addExam = async (req, res) => {
  try {
    const {
      title,
      classId,
      className,      // Added: Required by your Model
      subjectId,
      subjectName,
      duration,
      totalMarks,
      startTime,
    } = req.body;

    // 1. Basic Field Validation (Including className)
    if (!title || !classId || !className || !subjectId || !subjectName || !duration || !totalMarks || !startTime) {
      return res.status(400).json({
        success: false,
        message: "All exam details including Class Name, Start Time, and Duration are required.",
      });
    }

    // 2. Create Exam Document
    const newExam = new Exam({
      title,
      classId, 
      className: Number(className),
      subjectId,
      subjectName,
      teacherId: req.user.id, 
      duration: Number(duration),
      totalMarks: Number(totalMarks),
      startTime: new Date(startTime),
      questions: [], 
    });

    await newExam.save();

    let emailSummary = { total: 0, sent: 0 };
    try {
      emailSummary = await sendExamCreatedEmails(newExam);
      await Exam.updateOne(
        { _id: newExam._id },
        { $set: { "notification.createdEmailSentAt": new Date() } }
      );
    } catch (mailErr) {
      console.error("Exam created email failed:", mailErr?.message || mailErr);
    }

    res.status(201).json({
      success: true,
      message: "Exam created successfully! Email notifications are scheduled.",
      exam: newExam,
      emails: emailSummary,
    });
  } catch (err) {
    console.error("ADD EXAM ERROR:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

/* ================= TEACHER: ADD QUESTIONS ================= */
const addExamQuestions = async (req, res) => {
  try {
    const { examId, questions } = req.body;

    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ success: false, message: "Exam not found" });

    // Authorization Check
    if (exam.teacherId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Unauthorized access" });
    }

    let batchMarks = 0;
    
    // Validate each question against the sub-schema rules
    for (const q of questions) {
      if (!q.questionText || !q.type || q.type !== "MCQ") {
        return res.status(400).json({ success: false, message: "Invalid question format or type" });
      }
      if (!q.options || q.options.length !== 4) {
        return res.status(400).json({ success: false, message: "Each MCQ must have exactly 4 options" });
      }
      if (!q.options.includes(q.correctAnswer)) {
        return res.status(400).json({ success: false, message: "Correct answer must match one of the options" });
      }
      batchMarks += Number(q.marks);
    }

    // Check Total Marks Constraint
    const existingMarks = exam.questions.reduce((sum, q) => sum + q.marks, 0);
    if (existingMarks + batchMarks > exam.totalMarks) {
      return res.status(400).json({
        success: false, 
        message: `Marks limit exceeded. Remaining capacity: ${exam.totalMarks - existingMarks}`
      });
    }

    // Push and Save
    exam.questions.push(...questions);
    await exam.save();

    res.status(200).json({ 
      success: true, 
      message: "Questions added successfully", 
      currentTotalMarks: existingMarks + batchMarks,
      questions: exam.questions 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= TEACHER: VIEW STUDENT RESULTS ================= */
const getExamResultsForTeacher = async (req, res) => {
  try {
    const { examId } = req.params;
    const teacherId = req.user.id;

    const exam = await Exam.findById(examId)
      .populate("submissions.studentId", "name studentId");

    if (!exam) {
      return res.status(404).json({ success: false, message: "Exam not found" });
    }

    // 🔒 Authorization: only exam creator
    if (exam.teacherId.toString() !== teacherId.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized access" });
    }

    const results = exam.submissions
      .filter((s) => s.status === "SUBMITTED")
      .map((s) => ({
        studentId: s.studentId?._id,
        studentName: s.studentId?.name || "Unknown",
        obtainedMarks: s.obtainedMarks,
        percentage: s.percentage,
        submittedAt: s.submittedAt,
      }))
      .sort((a, b) => b.obtainedMarks - a.obtainedMarks); // rank wise

    res.status(200).json({
      success: true,
      exam: {
        title: exam.title,
        subjectName: exam.subjectName,
        totalMarks: exam.totalMarks,
      },
      results,
    });
  } catch (err) {
    console.error("getExamResultsForTeacher ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


module.exports = { addExam, addExamQuestions ,getExamResultsForTeacher};
