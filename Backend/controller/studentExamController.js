const Exam = require("../models/Exam");

// ✅ deterministic shuffle based on (studentId + examId)
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
    const className = Number(req.user.className);
    const studentId = req.user.id;

    if (!className) {
      return res.status(400).json({ success: false, message: "className missing in token" });
    }

    const exams = await Exam.find({ className })
      .select("-questions.correctAnswer")
      .sort({ startTime: 1 });

    // ✅ add attempted/submitted flags
    const mapped = exams.map((e) => {
      const sub = (e.submissions || []).find((s) => s.studentId?.toString() === studentId.toString());
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
    const className = Number(req.user.className);

    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ success: false, message: "Exam not found" });

    // ✅ class check
    if (Number(exam.className) !== className) {
      return res.status(403).json({ success: false, message: "This exam is not for your class" });
    }

    // ✅ time check
    const now = new Date();
    const startTime = new Date(exam.startTime);
    const endTime = new Date(startTime.getTime() + exam.duration * 60000);

    if (now < startTime) {
      return res.status(400).json({ success: false, message: "Exam not started yet" });
    }
    if (now > endTime) {
      return res.status(400).json({ success: false, message: "Exam ended" });
    }

    // ✅ find submission
    let submission = exam.submissions.find((s) => s.studentId.toString() === studentId.toString());

    if (submission && submission.status === "SUBMITTED") {
      return res.json({ success: true, alreadySubmitted: true });
    }

    // ✅ create submission on first start
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
      submission = exam.submissions.find((s) => s.studentId.toString() === studentId.toString());
    }

    // ✅ remaining time (server truth)
    const elapsedMs = now.getTime() - startTime.getTime();
    const remainingTimeMs = Math.max(exam.duration * 60000 - elapsedMs, 0);

    // ✅ safe exam + deterministic random questions per student
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
    const className = Number(req.user.className);
    const { answers } = req.body; // [{questionId, selectedAnswer}]

    if (!Array.isArray(answers)) {
      return res.status(400).json({ success: false, message: "answers must be an array" });
    }

    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ success: false, message: "Exam not found" });

    // ✅ class check
    if (Number(exam.className) !== className) {
      return res.status(403).json({ success: false, message: "Not allowed" });
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

    // ✅ evaluate
    let obtained = 0;

    const evaluated = exam.questions.map((q) => {
      const incoming = answers.find((a) => a.questionId?.toString() === q._id.toString());
      const selectedAnswer = incoming?.selectedAnswer || "";

      const isCorrect = selectedAnswer && selectedAnswer === q.correctAnswer;
      const marksAwarded = isCorrect ? Number(q.marks) : 0;

      obtained += marksAwarded;

      return { questionId: q._id, selectedAnswer, isCorrect, marksAwarded };
    });

    submission.answers = evaluated;
    submission.obtainedMarks = obtained;
    submission.percentage =
      exam.totalMarks > 0 ? Number(((obtained / exam.totalMarks) * 100).toFixed(2)) : 0;

    submission.status = "SUBMITTED";
    submission.submittedAt = new Date();

    await exam.save();

    return res.json({
      success: true,
      message: "Submitted successfully",
      result: {
        obtainedMarks: submission.obtainedMarks,
        percentage: submission.percentage,
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

    const exam = await Exam.findById(examId).select("title subjectName totalMarks submissions");
    if (!exam) return res.status(404).json({ success: false, message: "Exam not found" });

    const submission = exam.submissions.find((s) => s.studentId.toString() === studentId.toString());
    if (!submission) return res.status(404).json({ success: false, message: "No attempt found" });

    if (submission.status !== "SUBMITTED") {
      return res.status(400).json({ success: false, message: "Exam not submitted yet" });
    }

    return res.json({
      success: true,
      exam: { title: exam.title, subjectName: exam.subjectName, totalMarks: exam.totalMarks },
      result: {
        obtainedMarks: submission.obtainedMarks,
        percentage: submission.percentage,
        submittedAt: submission.submittedAt,
      },
    });
  } catch (err) {
    console.error("getExamResult ERROR:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
