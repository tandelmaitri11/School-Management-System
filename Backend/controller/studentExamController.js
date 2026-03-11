const Exam = require("../models/Exam");
const Class = require("../models/class");
const Student = require("../models/studentregister");
const eventBus = require("../events/eventBus");

const normalizeUpper = (v) => String(v || "").trim().toUpperCase();
const normalize = (v) => String(v || "").trim();
const normalizeAnswer = (v) => String(v || "").trim().toLowerCase();

const getGradeByPercentage = (percentage) => {
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B+";
  if (percentage >= 60) return "B";
  if (percentage >= 50) return "C";
  if (percentage >= 40) return "D";
  return "F";
};

const markStudentAbsentIfExamEnded = async ({ exam, studentId }) => {
  const startTime = new Date(exam.startTime);
  const endTime = new Date(startTime.getTime() + Number(exam.duration || 0) * 60000);
  if (new Date() <= endTime) return null;

  let submission = exam.submissions.find((s) => s.studentId.toString() === studentId.toString());
  if (submission && submission.status === "SUBMITTED") return submission;

  if (!submission) {
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
    await exam.save();
    return exam.submissions.find((s) => s.studentId.toString() === studentId.toString());
  }

  submission.status = "ABSENT";
  submission.obtainedMarks = 0;
  submission.percentage = 0;
  submission.grade = "F";
  submission.resultStatus = "FAIL";
  submission.submittedAt = submission.submittedAt || endTime;
  await exam.save();
  return submission;
};

const buildStudentScope = async (reqUser) => {
  const fallback = {
    className: Number(reqUser?.className),
    section: normalizeUpper(reqUser?.section),
    stream: normalize(reqUser?.stream),
    subjectChoice: normalize(reqUser?.subjectChoice),
  };

  const student = await Student.findById(reqUser?.id)
    .select("studentClass section stream subjectChoice")
    .lean();

  if (!student) return fallback;

  return {
    className: Number(student.studentClass || fallback.className || 0),
    section: normalizeUpper(student.section || fallback.section),
    stream: normalize(student.stream || fallback.stream),
    subjectChoice: normalize(student.subjectChoice || fallback.subjectChoice),
  };
};

const isChoiceSubjectForStudentStream = (examSubject, classDoc, studentStream) => {
  if (!classDoc || !examSubject || !studentStream) return false;

  const streamDoc = (classDoc.streams || []).find(
    (s) => normalize(s?.name).toLowerCase() === normalize(studentStream).toLowerCase()
  );
  if (!streamDoc) return false;

  const options = (streamDoc.subjectOptions || [])
    .map((x) => normalize(x).toLowerCase())
    .filter(Boolean);

  return options.includes(normalize(examSubject).toLowerCase());
};

const canAccessExam = (exam, studentScope, classDoc) => {
  if (Number(exam.className) !== Number(studentScope.className)) return false;

  const examSection = normalizeUpper(exam.section);
  const studentSection = normalizeUpper(studentScope.section);
  if (examSection && examSection !== studentSection) return false;

  const examStream = normalize(exam.stream);
  const studentStream = normalize(studentScope.stream);
  if (examStream && examStream.toLowerCase() !== studentStream.toLowerCase()) return false;

  const examSubject = normalize(exam.subjectName);
  const studentChoice = normalize(studentScope.subjectChoice);
  const isChoiceSubject = isChoiceSubjectForStudentStream(examSubject, classDoc, studentStream);
  if (isChoiceSubject && (!studentChoice || examSubject.toLowerCase() !== studentChoice.toLowerCase())) {
    return false;
  }

  return true;
};

// deterministic shuffle based on (studentId + examId)
function seededShuffle(array, seedStr) {
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) seed = (seed * 31 + seedStr.charCodeAt(i)) >>> 0;

  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ================= STUDENT: VIEW EXAMS ================= */
exports.getStudentExams = async (req, res) => {
  try {
    const studentScope = await buildStudentScope(req.user);
    const className = Number(studentScope.className);
    const section = normalizeUpper(studentScope.section);
    const stream = normalize(studentScope.stream);
    const studentId = req.user.id;

    if (!className) {
      return res.status(400).json({ success: false, message: "Student class not found" });
    }

    const exams = await Exam.find({
      className,
      $or: [{ section: { $exists: false } }, { section: "" }, { section }],
      $and: [{ $or: [{ stream: { $exists: false } }, { stream: "" }, { stream }] }],
    })
      .select("-questions.correctAnswer")
      .sort({ startTime: 1 });

    const classIds = [...new Set(exams.map((e) => String(e.classId || "")).filter(Boolean))];
    const classDocs = await Class.find({ _id: { $in: classIds } }).select("streams").lean();
    const classMap = new Map(classDocs.map((c) => [String(c._id), c]));

    const mapped = exams
      .filter((e) => canAccessExam(e, studentScope, classMap.get(String(e.classId || ""))))
      .map((e) => {
        const sub = (e.submissions || []).find(
          (s) => s.studentId?.toString() === studentId.toString()
        );
        return {
          ...e.toObject(),
          attempted: !!sub,
          submitted: sub?.status === "SUBMITTED",
        };
      });

    return res.json({ success: true, exams: mapped });
  } catch (err) {
    console.error("getStudentExams ERROR:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= STUDENT: START EXAM ================= */
exports.startExam = async (req, res) => {
  try {
    const { examId } = req.params;
    const studentId = req.user.id;
    const studentScope = await buildStudentScope(req.user);

    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ success: false, message: "Exam not found" });

    const classDoc = exam.classId ? await Class.findById(exam.classId).select("streams").lean() : null;
    if (!canAccessExam(exam, studentScope, classDoc)) {
      return res.status(403).json({
        success: false,
        message: "This exam is not assigned to your class/section/stream/subject choice",
      });
    }

    const now = new Date();
    const startTime = new Date(exam.startTime);
    const endTime = new Date(startTime.getTime() + exam.duration * 60000);

    if (now < startTime) {
      return res.status(400).json({ success: false, message: "Exam not started yet" });
    }
    if (now > endTime) {
      return res.status(400).json({ success: false, message: "Exam ended" });
    }

    let submission = exam.submissions.find(
      (s) => s.studentId.toString() === studentId.toString()
    );

    if (submission && submission.status === "SUBMITTED") {
      return res.json({ success: true, alreadySubmitted: true });
    }

    if (!submission) {
      exam.submissions.push({
        studentId,
        startedAt: new Date(),
        status: "STARTED",
        answers: exam.questions.map((q) => ({
          questionId: q._id,
          selectedAnswer: "",
          isCorrect: false,
          marksAwarded: 0,
        })),
        obtainedMarks: 0,
        percentage: 0,
      });

      await exam.save();
      submission = exam.submissions.find(
        (s) => s.studentId.toString() === studentId.toString()
      );
    }

    const elapsedMs = now.getTime() - startTime.getTime();
    const remainingTimeMs = Math.max(exam.duration * 60000 - elapsedMs, 0);

    const safeExamDoc = await Exam.findById(examId).select("-questions.correctAnswer");
    const safeExam = safeExamDoc.toObject();
    safeExam.questions = seededShuffle(safeExam.questions, `${studentId}_${examId}`);

    return res.json({
      success: true,
      exam: safeExam,
      remainingTimeMs,
      submissionStatus: submission.status,
    });
  } catch (err) {
    console.error("startExam ERROR:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ================= STUDENT: SUBMIT EXAM (manual/auto) ================= */
exports.submitExam = async (req, res) => {
  try {
    const { examId } = req.params;
    const studentId = req.user.id;
    if (String(req.user?.role || "").toLowerCase() !== "student") {
      return res.status(403).json({ success: false, message: "Only students can submit exams" });
    }
    const studentScope = await buildStudentScope(req.user);
    const { answers } = req.body;

    if (!Array.isArray(answers)) {
      return res.status(400).json({ success: false, message: "answers must be an array" });
    }

    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ success: false, message: "Exam not found" });

    const classDoc = exam.classId ? await Class.findById(exam.classId).select("streams").lean() : null;
    if (!canAccessExam(exam, studentScope, classDoc)) {
      return res.status(403).json({ success: false, message: "Not allowed" });
    }

    const startTime = new Date(exam.startTime);
    const endTime = new Date(startTime.getTime() + Number(exam.duration || 0) * 60000);
    if (new Date() > endTime) {
      const absentSubmission = await markStudentAbsentIfExamEnded({ exam, studentId });
      return res.status(400).json({
        success: false,
        message: "Exam time is over. You are marked absent.",
        result: absentSubmission
          ? {
              obtainedMarks: absentSubmission.obtainedMarks || 0,
              percentage: absentSubmission.percentage || 0,
              grade: absentSubmission.grade || "F",
              resultStatus: absentSubmission.resultStatus || "FAIL",
              totalMarks: exam.totalMarks,
            }
          : undefined,
      });
    }

    const submission = exam.submissions.find((s) => s.studentId.toString() === studentId.toString());
    if (!submission) {
      return res.status(400).json({ success: false, message: "Start exam first" });
    }

    if (submission.status === "SUBMITTED") {
      return res.json({
        success: true,
        message: "Already submitted",
        result: {
          obtainedMarks: submission.obtainedMarks,
          percentage: submission.percentage,
          totalMarks: exam.totalMarks,
        },
      });
    }

    if (answers.length > exam.questions.length) {
      return res.status(400).json({ success: false, message: "Invalid answers payload size" });
    }

    const answerMap = new Map();
    for (const item of answers) {
      const qid = String(item?.questionId || "").trim();
      if (!qid || answerMap.has(qid)) continue;
      const selected = String(item?.selectedAnswer || "").trim();
      if (selected.length > 200) continue;
      answerMap.set(qid, selected);
    }

    let obtained = 0;
    const evaluated = exam.questions.map((q) => {
      const selectedAnswer = answerMap.get(String(q._id)) || "";

      const isCorrect =
        normalizeAnswer(selectedAnswer) !== "" &&
        normalizeAnswer(selectedAnswer) === normalizeAnswer(q.correctAnswer);
      const marksAwarded = isCorrect ? Number(q.marks) : 0;

      obtained += marksAwarded;

      return { questionId: q._id, selectedAnswer, isCorrect, marksAwarded };
    });

    const percentage = exam.totalMarks > 0 ? Number(((obtained / exam.totalMarks) * 100).toFixed(2)) : 0;
    const grade = getGradeByPercentage(percentage);
    const resultStatus = percentage >= 40 ? "PASS" : "FAIL";
    const submittedAt = new Date();

    // Atomic one-time submit: only status STARTED can move to SUBMITTED.
    const update = await Exam.updateOne(
      {
        _id: examId,
        submissions: { $elemMatch: { studentId, status: "STARTED" } },
      },
      {
        $set: {
          "submissions.$.answers": evaluated,
          "submissions.$.obtainedMarks": obtained,
          "submissions.$.percentage": percentage,
          "submissions.$.grade": grade,
          "submissions.$.resultStatus": resultStatus,
          "submissions.$.status": "SUBMITTED",
          "submissions.$.submittedAt": submittedAt,
        },
      }
    );

    if (!update.modifiedCount) {
      const freshExam = await Exam.findById(examId).select("submissions totalMarks");
      const freshSubmission = freshExam?.submissions?.find(
        (s) => s.studentId.toString() === studentId.toString()
      );

      if (!freshSubmission) {
        return res.status(400).json({ success: false, message: "Start exam first" });
      }

      if (freshSubmission.status === "SUBMITTED") {
        return res.json({
          success: true,
          message: "Already submitted",
          result: {
            obtainedMarks: freshSubmission.obtainedMarks,
            percentage: freshSubmission.percentage,
            grade: freshSubmission.grade,
            resultStatus: freshSubmission.resultStatus,
            totalMarks: freshExam.totalMarks,
          },
        });
      }

      if (freshSubmission.status === "ABSENT") {
        return res.status(400).json({
          success: false,
          message: "Submission blocked. You are marked absent.",
          result: {
            obtainedMarks: freshSubmission.obtainedMarks,
            percentage: freshSubmission.percentage,
            grade: freshSubmission.grade || "F",
            resultStatus: freshSubmission.resultStatus || "FAIL",
            totalMarks: freshExam.totalMarks,
          },
        });
      }

      return res.status(409).json({ success: false, message: "Submission conflict. Please retry once." });
    }

    eventBus.emitAsync("result.published", {
      examId: exam._id,
      examTitle: exam.title,
      subjectName: exam.subjectName,
      className: exam.className,
      section: exam.section,
      stream: exam.stream,
      studentId,
      obtainedMarks: obtained,
      percentage,
      totalMarks: exam.totalMarks,
      submittedAt,
    });

    return res.json({
      success: true,
      message: "Submitted successfully",
      result: {
        obtainedMarks: obtained,
        percentage,
        grade,
        resultStatus,
        totalMarks: exam.totalMarks,
      },
    });
  } catch (err) {
    console.error("submitExam ERROR:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ================= STUDENT: GET RESULT ================= */
exports.getExamResult = async (req, res) => {
  try {
    const { examId } = req.params;
    const studentId = req.user.id;

    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ success: false, message: "Exam not found" });

    let submission = exam.submissions.find((s) => s.studentId.toString() === studentId.toString());
    if (!submission) {
      submission = await markStudentAbsentIfExamEnded({ exam, studentId });
    }
    if (!submission) return res.status(404).json({ success: false, message: "No attempt found" });

    if (submission.status !== "SUBMITTED" && submission.status !== "ABSENT") {
      return res.status(400).json({ success: false, message: "Exam not submitted yet" });
    }

    return res.json({
      success: true,
      exam: { title: exam.title, subjectName: exam.subjectName, totalMarks: exam.totalMarks },
      result: {
        obtainedMarks: submission.obtainedMarks,
        percentage: submission.percentage,
        grade: submission.grade || getGradeByPercentage(Number(submission.percentage || 0)),
        resultStatus:
          submission.resultStatus ||
          (Number(submission.percentage || 0) >= 40 ? "PASS" : "FAIL"),
        submittedAt: submission.submittedAt,
      },
    });
  } catch (err) {
    console.error("getExamResult ERROR:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
