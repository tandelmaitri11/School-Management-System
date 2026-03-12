const Exam = require("../models/Exam");
const Student = require("../models/studentregister");
const Class = require("../models/class");
const TeacherRegister = require("../models/techerregister");
const TeacherInfo = require("../models/teacherinfo");

const gradeFromAverage = (avg) => {
  if (avg >= 90) return "A";
  if (avg >= 80) return "B";
  if (avg >= 70) return "C";
  if (avg >= 60) return "D";
  if (avg >= 50) return "E";
  return "F";
};

const getTeacherAssignmentScope = async (teacherMongoId) => {
  const teacher = await TeacherRegister.findById(teacherMongoId)
    .select("teacherId name")
    .lean();
  if (!teacher?.teacherId) return { classes: [], assignedSections: [] };

  const info = await TeacherInfo.findOne({ regNumber: teacher.teacherId })
    .select("classes assignedSections")
    .lean();
  if (!info?.classes?.length) return { classes: [], assignedSections: [] };

  const classes = await Class.find({ _id: { $in: info.classes } })
    .select("_id className")
    .lean();

  const classMap = new Map(classes.map((cls) => [String(cls._id), cls]));
  const assignedSections = (Array.isArray(info.assignedSections) ? info.assignedSections : [])
    .filter((row) => classMap.has(String(row?.classId || "")))
    .map((row) => {
      const cls = classMap.get(String(row.classId));
      return {
        classId: String(row.classId),
        className: Number(cls?.className || 0),
        section: String(row?.section || "").trim().toUpperCase(),
        stream: String(row?.stream || "").trim(),
      };
    })
    .filter((row) => row.className && row.section);

  return { classes, assignedSections };
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

    const { classes, assignedSections } = await getTeacherAssignmentScope(teacherId);
    if (!classes.length || !assignedSections.length) {
      return res.json({
        summary: {
          totalStudents: 0,
          totalExams: 0,
          averagePercentage: 0,
          passRate: 0,
        },
        filters: {
          classes: classes
            .map((cls) => Number(cls.className || 0))
            .filter(Boolean)
            .sort((a, b) => a - b),
          sections: [],
          streams: [],
        },
        data: [],
      });
    }

    const scopedRows = assignedSections.filter((row) => {
      if (classQuery && Number(row.className) !== classQuery) return false;
      if (sectionQuery && String(row.section || "") !== sectionQuery) return false;
      if (streamQuery && String(row.stream || "").trim().toLowerCase() !== streamQuery.toLowerCase()) {
        return false;
      }
      return true;
    });

    const classValues = Array.from(
      new Set(classes.map((cls) => Number(cls.className || 0)).filter(Boolean))
    ).sort((a, b) => a - b);
    const sectionValues = Array.from(
      new Set(assignedSections.map((row) => String(row.section || "").trim().toUpperCase()).filter(Boolean))
    ).sort();
    const streamValues = Array.from(
      new Set(assignedSections.map((row) => String(row.stream || "").trim()).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));

    if ((classQuery || sectionQuery || streamQuery) && scopedRows.length === 0) {
      return res.json({
        summary: {
          totalStudents: 0,
          totalExams: 0,
          averagePercentage: 0,
          passRate: 0,
        },
        filters: {
          classes: classValues,
          sections: sectionValues,
          streams: streamValues,
        },
        data: [],
      });
    }

    const examFilter = {
      teacherId,
      className: { $in: Array.from(new Set(scopedRows.map((row) => Number(row.className)).filter(Boolean))) },
    };
    if (classQuery) examFilter.className = classQuery;
    if (sectionQuery) {
      examFilter.section = sectionQuery;
    } else {
      examFilter.section = { $in: Array.from(new Set(scopedRows.map((row) => row.section).filter(Boolean))) };
    }
    if (streamQuery) {
      examFilter.stream = streamQuery;
    }

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

    const visibleRows = scopedRows.length ? scopedRows : assignedSections;

    const rosterFilters = visibleRows.map((row) => {
      const filter = {
        studentClass: Number(row.className),
        section: String(row.section || "").trim().toUpperCase(),
      };
      if (row.stream) filter.stream = String(row.stream).trim();
      return filter;
    });

    const studentIdFilters = Array.from(stats.keys()).map((id) => ({ _id: id }));
    const studentQuery = [];

    if (rosterFilters.length) {
      studentQuery.push(...rosterFilters);
    }
    if (studentIdFilters.length) {
      studentQuery.push(...studentIdFilters);
    }

    const students = studentQuery.length
      ? await Student.find({ $or: studentQuery }).select(
          "studentId name studentClass section stream"
        )
      : [];

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
        classes: classValues,
        sections: sectionValues,
        streams: streamValues,
      },
      data,
    });
  } catch (err) {
    console.error("getAllPerformance ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};
