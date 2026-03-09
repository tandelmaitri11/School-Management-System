const Exam = require("../models/Exam");

exports.getExamAnalytics = async (req, res) => {
  try {
    const { examId } = req.params;

    const exam = await Exam.findById(examId)
      .populate("submissions.studentId", "name studentId email")
      .select("title subjectName className totalMarks submissions");

    if (!exam) return res.status(404).json({ success: false, message: "Exam not found" });

    // ✅ only the exam creator teacher
    if (exam.teacherId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: "Not allowed" });
    }

    const submitted = exam.submissions.filter((s) => s.status === "SUBMITTED");
    const appeared = submitted.length;
    const totalStudents = exam.submissions.length;

    const marksArr = submitted.map((s) => Number(s.obtainedMarks || 0));
    const avg = appeared ? marksArr.reduce((a, b) => a + b, 0) / appeared : 0;
    const max = appeared ? Math.max(...marksArr) : 0;
    const min = appeared ? Math.min(...marksArr) : 0;

    const students = exam.submissions.map((s) => ({
      student: s.studentId,
      status: s.status,
      obtainedMarks: s.obtainedMarks,
      percentage: s.percentage,
      submittedAt: s.submittedAt,
    }));

    return res.json({
      success: true,
      exam: {
        title: exam.title,
        subjectName: exam.subjectName,
        className: exam.className,
        totalMarks: exam.totalMarks,
      },
      stats: {
        totalStudents,
        appeared,
        avg: Number(avg.toFixed(2)),
        max,
        min,
      },
      students,
    });
  } catch (err) {
    console.error("getExamAnalytics ERROR:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
