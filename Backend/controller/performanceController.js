const Exam = require("../models/Exam");
const Student = require("../models/studentregister");

const gradeFromAverage = (avg) => {
  if (avg >= 90) return "A";
  if (avg >= 80) return "B";
  if (avg >= 70) return "C";
  if (avg >= 60) return "D";
  if (avg >= 50) return "E";
  return "F";
};

exports.getAllPerformance = async (req, res) => {
  try {
    const teacherId = String(req.user?.id || "");
    if (!teacherId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const classQuery = Number(req.query.className || 0);
    const sectionQuery = String(req.query.section || "")
      .trim()
      .toUpperCase();
    const streamQuery = String(req.query.stream || "").trim();

    const examFilter = { teacherId };
    if (classQuery) examFilter.className = classQuery;
    if (sectionQuery) examFilter.section = sectionQuery;
    if (streamQuery) examFilter.stream = streamQuery;

    const exams = await Exam.find(examFilter).select(
      "title subjectName className section stream startTime totalMarks submissions"
    );
    const stats = new Map();

    exams.forEach((exam) => {
      const totalMarks = Number(exam.totalMarks || 0);
      const submissions = Array.isArray(exam.submissions) ? exam.submissions : [];

      submissions.forEach((sub) => {
        if (sub.status !== "SUBMITTED") return;
        if (!sub.studentId) return;

        const percent = Number(
          sub.percentage ??
            (totalMarks
              ? (Number(sub.obtainedMarks || 0) / totalMarks) * 100
              : 0)
        );

        const key = String(sub.studentId);
        const entry = stats.get(key) || {
          totalPercent: 0,
          count: 0,
          totalObtained: 0,
          totalPossible: 0,
          bestPercentage: 0,
          lastExamAt: null,
        };
        entry.totalPercent += Number.isFinite(percent) ? percent : 0;
        entry.count += 1;
        entry.totalObtained += Number(sub.obtainedMarks || 0);
        entry.totalPossible += totalMarks;
        entry.bestPercentage = Math.max(entry.bestPercentage, Number.isFinite(percent) ? percent : 0);
        if (exam.startTime) {
          const examTime = new Date(exam.startTime);
          if (!Number.isNaN(examTime.getTime())) {
            if (!entry.lastExamAt || examTime > entry.lastExamAt) entry.lastExamAt = examTime;
          }
        }
        stats.set(key, entry);
      });
    });

    if (stats.size === 0) {
      return res.json({
        summary: {
          totalStudents: 0,
          totalExams: exams.length,
          averagePercentage: 0,
          passRate: 0,
        },
        filters: {
          classes: Array.from(
            new Set(exams.map((e) => Number(e.className || 0)).filter(Boolean))
          ).sort((a, b) => a - b),
          sections: Array.from(
            new Set(exams.map((e) => String(e.section || "").trim().toUpperCase()).filter(Boolean))
          ).sort(),
          streams: Array.from(
            new Set(exams.map((e) => String(e.stream || "").trim()).filter(Boolean))
          ).sort((a, b) => a.localeCompare(b)),
        },
        data: [],
      });
    }

    const studentIds = Array.from(stats.keys());
    const students = await Student.find({ _id: { $in: studentIds } }).select(
      "studentId name studentClass section stream"
    );

    const searchQuery = String(req.query.search || "").trim().toLowerCase();
    const data = students
      .map((s) => {
      const entry = stats.get(String(s._id)) || { totalPercent: 0, count: 0 };
      const avg = entry.count ? entry.totalPercent / entry.count : 0;
      const grade = entry.count ? gradeFromAverage(avg) : "N/A";
      const pass = avg >= 40;

      return {
        studentMongoId: s._id,
        studentId: s.studentId || "",
        studentName: s.name,
        className: Number(s.studentClass || 0) || "-",
        section: String(s.section || "").trim().toUpperCase(),
        stream: String(s.stream || "").trim(),
        examsAttempted: entry.count,
        averagePercentage: Number(avg.toFixed(2)),
        totalObtained: Number((entry.totalObtained || 0).toFixed(2)),
        totalPossible: Number((entry.totalPossible || 0).toFixed(2)),
        bestPercentage: Number((entry.bestPercentage || 0).toFixed(2)),
        grade,
        status: pass ? "Pass" : "Needs Improvement",
        lastExamAt: entry.lastExamAt || null,
      };
      })
      .filter((row) => {
        if (!searchQuery) return true;
        return (
          String(row.studentName || "").toLowerCase().includes(searchQuery) ||
          String(row.studentId || "").toLowerCase().includes(searchQuery)
        );
      })
      .sort((a, b) => b.averagePercentage - a.averagePercentage);

    const avgOverall =
      data.length > 0
        ? data.reduce((sum, row) => sum + Number(row.averagePercentage || 0), 0) / data.length
        : 0;
    const passCount = data.filter((row) => row.status === "Pass").length;
    const passRate = data.length ? (passCount / data.length) * 100 : 0;

    res.json({
      summary: {
        totalStudents: data.length,
        totalExams: exams.length,
        averagePercentage: Number(avgOverall.toFixed(2)),
        passRate: Number(passRate.toFixed(2)),
      },
      filters: {
        classes: Array.from(
          new Set(exams.map((e) => Number(e.className || 0)).filter(Boolean))
        ).sort((a, b) => a - b),
        sections: Array.from(
          new Set(exams.map((e) => String(e.section || "").trim().toUpperCase()).filter(Boolean))
        ).sort(),
        streams: Array.from(
          new Set(exams.map((e) => String(e.stream || "").trim()).filter(Boolean))
        ).sort((a, b) => a.localeCompare(b)),
      },
      data,
    });
  } catch (err) {
    console.error("getAllPerformance ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};
