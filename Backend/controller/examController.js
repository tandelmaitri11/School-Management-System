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
const normalizeUpper = (v) => normalize(v).toUpperCase();
const isBothSection = (section) => normalizeUpper(section) === "BOTH";

const isChoiceSubjectForStream = ({ examSubject, classDoc, streamName }) => {
  if (!classDoc || !examSubject || !streamName) return false;
  const streamDoc = (classDoc.streams || []).find(
    (s) => normalizeLower(s?.name) === normalizeLower(streamName)
  );
  if (!streamDoc) return false;
  const options = (streamDoc.subjectOptions || []).map((x) => normalizeLower(x)).filter(Boolean);
  return options.includes(normalizeLower(examSubject));
};

const getEligibleExamStudents = async (exam) => {
  const classDoc = exam.classId ? await Class.findById(exam.classId).select("streams").lean() : null;
  const query = { studentClass: Number(exam.className) };
  if (exam.section && !isBothSection(exam.section)) query.section = normalizeUpper(exam.section);
  if (exam.stream) query.stream = String(exam.stream).trim();

  const students = await Student.find(query).select("_id name studentId subjectChoice stream").lean();
  const examSubject = normalize(exam.subjectName);

  return students.filter((student) => {
    const streamName = normalize(student.stream || exam.stream);
    const isChoice = isChoiceSubjectForStream({ examSubject, classDoc, streamName });
    if (!isChoice) return true;
    return normalizeLower(student.subjectChoice) === normalizeLower(examSubject);
  });
};

const autoFailAbsentStudents = async (exam) => {
  if (!exam) return false;

  const now = new Date();
  const startTime = new Date(exam.startTime);
  const endTime = new Date(startTime.getTime() + Number(exam.duration || 0) * 60000);
  if (now <= endTime) return false;

  const eligibleStudents = await getEligibleExamStudents(exam);
  const eligibleStudentIds = eligibleStudents.map((s) => String(s._id));

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

  const existing = new Set(
    exam.submissions.map((s) => String(s.studentId?._id || s.studentId || ""))
  );
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

  const normalizedSection = normalizeUpper(section);
  const normalizedStream = String(stream || "").trim().toLowerCase();

  const rows = Array.isArray(teacherInfo?.assignedSections) ? teacherInfo.assignedSections : [];
  const scoped = rows.filter(
    (s) =>
      String(s?.classId) === String(classId) &&
      (isBothSection(normalizedSection)
        ? true
        : String(s?.section || "").trim().toUpperCase() === normalizedSection)
  );

  if (scoped.length === 0) return false;

  // If assignment includes stream, it must match. Empty stream means general permission for that section.
  const matchingRows = scoped.filter((s) => {
    const st = String(s?.stream || "").trim().toLowerCase();
    return !st || st === normalizedStream;
  });

  if (isBothSection(normalizedSection)) {
    const distinctSections = new Set(
      matchingRows.map((s) => normalizeUpper(s?.section)).filter(Boolean)
    );
    return distinctSections.size > 1;
  }

  return matchingRows.length > 0;
};

const getValidSectionsForScope = ({ cls, stream }) => {
  const normalizedStream = normalizeLower(stream);
  return (cls?.sections || []).filter((s) => {
    if (s?.isActive === false) return false;
    const sectionStream = normalizeLower(s?.stream);
    if (!sectionStream) return true;
    return sectionStream === normalizedStream;
  });
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

    if (!isBothSection(normalizedSection)) {
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
    } else {
      const validSections = getValidSectionsForScope({ cls, stream: normalizedStream });
      if (validSections.length < 2) {
        return res.status(400).json({
          success: false,
          message: "Both section option requires at least two active sections in the selected scope",
        });
      }
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

    if (!isBothSection(normalizedSection)) {
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
    } else {
      const validSections = getValidSectionsForScope({ cls, stream: normalizedStream });
      if (validSections.length < 2) {
        return res.status(400).json({
          success: false,
          message: "Both section option requires at least two active sections in the selected scope",
        });
      }
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

    const exam = await Exam.findById(examId);

    if (!exam) {
      return res.status(404).json({ success: false, message: "Exam not found" });
    }

    // 🔒 Authorization: only exam creator
    if (exam.teacherId.toString() !== teacherId.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized access" });
    }

    await autoFailAbsentStudents(exam);
    await exam.populate("submissions.studentId", "name studentId");

    const eligibleStudents = await getEligibleExamStudents(exam);
    const submissionMap = new Map(
      exam.submissions.map((submission) => [
        String(submission.studentId?._id || submission.studentId || ""),
        submission,
      ])
    );

    const results = eligibleStudents
      .map((student) => {
        const submission = submissionMap.get(String(student._id));
        if (!submission) {
          return {
            studentId: student._id,
            studentName: student.name || "Unknown",
            studentCode: student.studentId || "",
            obtainedMarks: 0,
            percentage: 0,
            grade: "-",
            resultStatus: "NOT_SUBMITTED",
            submittedAt: null,
            attendanceStatus: "NOT_SUBMITTED",
          };
        }

        const isSubmitted = submission.status === "SUBMITTED";
        const isAbsent = submission.status === "ABSENT";
        return {
          studentId: submission.studentId?._id || student._id,
          studentName: submission.studentId?.name || student.name || "Unknown",
          studentCode: submission.studentId?.studentId || student.studentId || "",
          obtainedMarks: Number(submission.obtainedMarks || 0),
          percentage: Number(submission.percentage || 0),
          grade: isSubmitted || isAbsent
            ? submission.grade || getGradeByPercentage(Number(submission.percentage || 0))
            : "-",
          resultStatus:
            isSubmitted || isAbsent
              ? submission.resultStatus || (Number(submission.percentage || 0) >= 40 ? "PASS" : "FAIL")
              : "NOT_SUBMITTED",
          submittedAt: submission.submittedAt,
          attendanceStatus: submission.status || "NOT_SUBMITTED",
        };
      })
      .sort((a, b) => {
        const rankA = a.attendanceStatus === "SUBMITTED" ? 3 : a.attendanceStatus === "ABSENT" ? 2 : 1;
        const rankB = b.attendanceStatus === "SUBMITTED" ? 3 : b.attendanceStatus === "ABSENT" ? 2 : 1;
        if (rankB !== rankA) return rankB - rankA;
        if (rankA > 1 && Number(b.obtainedMarks || 0) !== Number(a.obtainedMarks || 0)) {
          return Number(b.obtainedMarks || 0) - Number(a.obtainedMarks || 0);
        }
        return String(a.studentName || "").localeCompare(String(b.studentName || ""));
      });

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
