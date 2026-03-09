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
    const exams = await Exam.find().select("totalMarks submissions");
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
        const entry = stats.get(key) || { totalPercent: 0, count: 0 };
        entry.totalPercent += Number.isFinite(percent) ? percent : 0;
        entry.count += 1;
        stats.set(key, entry);
      });
    });

    if (stats.size === 0) return res.json([]);

    const studentIds = Array.from(stats.keys());
    const students = await Student.find({ _id: { $in: studentIds } }).select(
      "name studentClass"
    );

    const data = students.map((s) => {
      const entry = stats.get(String(s._id)) || { totalPercent: 0, count: 0 };
      const avg = entry.count ? entry.totalPercent / entry.count : 0;

      return {
        studentName: s.name,
        className: s.studentClass ?? "-",
        averageMarks: Number(avg.toFixed(2)),
        grade: entry.count ? gradeFromAverage(avg) : "N/A",
      };
    });

    res.json(data);
  } catch (err) {
    console.error("getAllPerformance ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};
