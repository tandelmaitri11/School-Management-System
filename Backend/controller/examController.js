const mongoose = require("mongoose");
const Exam = require("../models/Exam");
const Class = require("../models/class");
const Subject = require("../models/subject");
const Student = require("../models/studentregister");
const TeacherRegister = require("../models/techerregister");
const TeacherInfo = require("../models/teacherinfo");
const { sendExamCreatedEmails } = require("../services/examNotificationService");

const getGradeByPercentage = (percentage) => {
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B+";
  if (percentage >= 60) return "B";
  if (percentage >= 50) return "C";
  if (percentage >= 40) return "D";
  return "F";
};

const normalize = (v) => String(v || "").trim();
const normalizeLower = (v) => normalize(v).toLowerCase();

const isChoiceSubjectForStream = ({ examSubject, classDoc, streamName }) => {
  if (!classDoc || !examSubject || !streamName) return false;
  const streamDoc = (classDoc.streams || []).find(
    (s) => normalizeLower(s?.name) === normalizeLower(streamName)
  );
  if (!streamDoc) return false;
  const options = (streamDoc.subjectOptions || []).map((x) => normalizeLower(x)).filter(Boolean);
  return options.includes(normalizeLower(examSubject));
};

const autoFailAbsentStudents = async (exam) => {
  if (!exam) return false;

  const now = new Date();
  const startTime = new Date(exam.startTime);
  const endTime = new Date(startTime.getTime() + Number(exam.duration || 0) * 60000);
  if (now <= endTime) return false;

  const classDoc = exam.classId ? await Class.findById(exam.classId).select("streams").lean() : null;
  const query = { studentClass: Number(exam.className) };
  if (exam.section) query.section = String(exam.section).trim().toUpperCase();
  if (exam.stream) query.stream = String(exam.stream).trim();

  const students = await Student.find(query).select("_id subjectChoice stream").lean();
  const examSubject = normalize(exam.subjectName);

  const eligibleStudentIds = students
    .filter((s) => {
      const streamName = normalize(s.stream || exam.stream);
      const isChoice = isChoiceSubjectForStream({ examSubject, classDoc, streamName });
      if (!isChoice) return true;
      return normalizeLower(s.subjectChoice) === normalizeLower(examSubject);
    })
    .map((s) => String(s._id));

  let changed = false;

  // If exam is over, convert any non-submitted attempt into ABSENT+FAIL.
  for (const sub of exam.submissions) {
    if (sub.status !== "SUBMITTED") {
      sub.status = "ABSENT";
      sub.obtainedMarks = 0;
      sub.percentage = 0;
      sub.grade = "F";
      sub.resultStatus = "FAIL";
      sub.submittedAt = sub.submittedAt || endTime;
      changed = true;
    }
  }

  const existing = new Set(exam.submissions.map((s) => String(s.studentId)));
  for (const studentId of eligibleStudentIds) {
    if (existing.has(studentId)) continue;
    exam.submissions.push({
      studentId,
      startedAt: endTime,
      submittedAt: endTime,
      status: "ABSENT",
      answers: [],
      obtainedMarks: 0,
      percentage: 0,
      grade: "F",
      resultStatus: "FAIL",
    });
    changed = true;
  }

  if (changed) {
    await exam.save();
  }
  return changed;
};

const resolveSubjectId = async ({ subjectId, className }) => {
  if (subjectId && mongoose.Types.ObjectId.isValid(subjectId)) {
    return subjectId;
  }

  const doc = await Subject.findOne({ className: Number(className) }).select("_id").lean();
  return doc?._id || null;
};

const canTeacherUseScope = async ({ teacherMongoId, classId, section, stream }) => {
  const teacher = await TeacherRegister.findById(teacherMongoId).select("teacherId").lean();
  if (!teacher?.teacherId) return false;

  const teacherInfo = await TeacherInfo.findOne({ regNumber: teacher.teacherId })
    .select("assignedSections")
    .lean();

  const normalizedSection = String(section || "").trim().toUpperCase();
  const normalizedStream = String(stream || "").trim().toLowerCase();

  const rows = Array.isArray(teacherInfo?.assignedSections) ? teacherInfo.assignedSections : [];
  const scoped = rows.filter(
    (s) =>
      String(s?.classId) === String(classId) &&
      String(s?.section || "").trim().toUpperCase() === normalizedSection
  );

  if (scoped.length === 0) return false;

  // If assignment includes stream, it must match. Empty stream means general permission for that section.
  const hasMatch = scoped.some((s) => {
    const st = String(s?.stream || "").trim().toLowerCase();
    return !st || st === normalizedStream;
  });

  return hasMatch;
};

/* ================= TEACHER: ADD EXAM HEADER ================= */
const addExam = async (req, res) => {
  try {
    const {
      title,
      classId,
      className,      // Added: Required by your Model
      section,
      stream,
      subjectId,
      subjectName,
      duration,
      totalMarks,
      startTime,
    } = req.body;

    // 1. Basic Field Validation (Including className)
    if (
      !title ||
      !classId ||
      !className ||
      !section ||
      !subjectId ||
      !subjectName ||
      !duration ||
      !totalMarks ||
      !startTime
    ) {
      return res.status(400).json({
        success: false,
        message: "All exam details including class, section, start time, and duration are required.",
      });
    }

    const cls = await Class.findById(classId).select("streams sections").lean();
    if (!cls) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    const normalizedSection = String(section || "").trim().toUpperCase();
    const normalizedStream = String(stream || "").trim();

    const activeStreams = (cls.streams || []).filter((s) => s?.isActive !== false);
    if (activeStreams.length > 0 && !normalizedStream) {
      return res.status(400).json({ success: false, message: "Stream is required for this class" });
    }

    const sectionDoc = (cls.sections || []).find(
      (s) => s?.isActive !== false && String(s?.name || "").trim().toUpperCase() === normalizedSection
    );
    if (!sectionDoc) {
      return res.status(400).json({ success: false, message: "Selected section is not available in this class" });
    }

    const sectionStream = String(sectionDoc.stream || "").trim();
    if (sectionStream && sectionStream.toLowerCase() !== normalizedStream.toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: `Section ${normalizedSection} belongs to stream ${sectionStream}`,
      });
    }

    const scopeAllowed = await canTeacherUseScope({
      teacherMongoId: req.user.id,
      classId,
      section: normalizedSection,
      stream: normalizedStream,
    });
    if (!scopeAllowed) {
      return res.status(403).json({
        success: false,
        message: "You can create exam only for assigned class and section",
      });
    }

    const safeSubjectId = await resolveSubjectId({ subjectId, className });
    if (!safeSubjectId) {
      return res.status(400).json({
        success: false,
        message: "Invalid subject selection for selected class",
      });
    }

    // 2. Create Exam Document
    const newExam = new Exam({
      title,
      classId, 
      className: Number(className),
      section: normalizedSection,
      stream: normalizedStream,
      subjectId: safeSubjectId,
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

/* ================= TEACHER: UPDATE EXAM HEADER ================= */
const updateExam = async (req, res) => {
  try {
    const { examId } = req.params;
    const {
      title,
      classId,
      className,
      section,
      stream,
      subjectId,
      subjectName,
      duration,
      totalMarks,
      startTime,
    } = req.body;

    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ success: false, message: "Exam not found" });

    if (String(exam.teacherId) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: "Unauthorized access" });
    }

    if (
      !title ||
      !classId ||
      !className ||
      !section ||
      !subjectId ||
      !subjectName ||
      !duration ||
      !totalMarks ||
      !startTime
    ) {
      return res.status(400).json({ success: false, message: "All required fields must be provided" });
    }

    const cls = await Class.findById(classId).select("classTeacher streams sections").lean();
    if (!cls) return res.status(404).json({ success: false, message: "Class not found" });
    if (String(cls.classTeacher) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: "Not allowed for selected class" });
    }

    const normalizedSection = String(section || "").trim().toUpperCase();
    const normalizedStream = String(stream || "").trim();
    const activeStreams = (cls.streams || []).filter((s) => s?.isActive !== false);

    if (activeStreams.length > 0 && !normalizedStream) {
      return res.status(400).json({ success: false, message: "Stream is required for this class" });
    }

    const sectionDoc = (cls.sections || []).find(
      (s) => s?.isActive !== false && String(s?.name || "").trim().toUpperCase() === normalizedSection
    );
    if (!sectionDoc) {
      return res.status(400).json({ success: false, message: "Selected section is not available in this class" });
    }

    const sectionStream = String(sectionDoc.stream || "").trim();
    if (sectionStream && sectionStream.toLowerCase() !== normalizedStream.toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: `Section ${normalizedSection} belongs to stream ${sectionStream}`,
      });
    }

    const scopeAllowed = await canTeacherUseScope({
      teacherMongoId: req.user.id,
      classId,
      section: normalizedSection,
      stream: normalizedStream,
    });
    if (!scopeAllowed) {
      return res.status(403).json({
        success: false,
        message: "You can update exam only for assigned class and section",
      });
    }

    const safeSubjectId = await resolveSubjectId({ subjectId, className });
    if (!safeSubjectId) {
      return res.status(400).json({
        success: false,
        message: "Invalid subject selection for selected class",
      });
    }

    exam.title = title;
    exam.classId = classId;
    exam.className = Number(className);
    exam.section = normalizedSection;
    exam.stream = normalizedStream;
    exam.subjectId = safeSubjectId;
    exam.subjectName = subjectName;
    exam.duration = Number(duration);
    exam.totalMarks = Number(totalMarks);
    exam.startTime = new Date(startTime);

    await exam.save();

    return res.status(200).json({ success: true, message: "Exam updated successfully", exam });
  } catch (err) {
    console.error("UPDATE EXAM ERROR:", err);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
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

    await autoFailAbsentStudents(exam);
    await exam.populate("submissions.studentId", "name studentId");

    const results = exam.submissions
      .filter((s) => s.status === "SUBMITTED" || s.status === "ABSENT")
      .map((s) => ({
        studentId: s.studentId?._id,
        studentName: s.studentId?.name || "Unknown",
        obtainedMarks: s.obtainedMarks,
        percentage: s.percentage,
        grade: s.grade || getGradeByPercentage(Number(s.percentage || 0)),
        resultStatus: s.resultStatus || (Number(s.percentage || 0) >= 40 ? "PASS" : "FAIL"),
        submittedAt: s.submittedAt,
        attendanceStatus: s.status,
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


module.exports = { addExam, updateExam, addExamQuestions, getExamResultsForTeacher };
