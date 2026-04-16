const Student = require("../models/studentregister");
const Attendance = require("../models/attendance");
const Submission = require("../models/submission");
const Assignment = require("../models/assignment");
const TeacherRegister = require("../models/techerregister");
const TeacherInfo = require("../models/teacherinfo");
const Class = require("../models/class");
const PDFDocument = require("pdfkit");

const toCsvValue = (value) => {
  const v = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(v)) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
};

const buildCsv = (rows) => rows.map((r) => r.map(toCsvValue).join(",")).join("\n");

const sendCsv = (res, filename, rows) => {
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(buildCsv(rows));
};

const sendPdf = (res, filename, buildFn) => {
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  const doc = new PDFDocument({ size: "A4", margin: 50 });
  doc.pipe(res);
  buildFn(doc);
  doc.end();
};

const pdfTitle = (doc, title, subtitle) => {
  doc.fontSize(20).fillColor("#0f172a").text(title);
  doc.moveDown(0.2);
  doc.fontSize(10).fillColor("#64748b").text(subtitle || "");
  doc.moveDown(1);
  doc.fillColor("#000000");
};

const pdfKeyValue = (doc, label, value) => {
  doc.fontSize(10).fillColor("#64748b").text(label, { continued: true });
  doc.fillColor("#111827").text(` ${value}`);
};

const pdfSection = (doc, title) => {
  doc.moveDown(0.6);
  doc.fontSize(12).fillColor("#1e293b").text(title);
  doc.moveDown(0.2);
  doc.moveTo(50, doc.y).lineTo(562, doc.y).strokeColor("#e2e8f0").stroke();
  doc.moveDown(0.4);
  doc.fillColor("#000000");
};

const formatPct = (v) => `${Number(v || 0).toFixed(1)}%`;

const buildStudyPlan = ({ attendancePercentage, performanceScore, weakSubjects }) => {
  const plan = [];
  if (attendancePercentage < 75) {
    plan.push({
      title: "Fix attendance consistency",
      detail: "Aim for 85%+ attendance this month. Set a reminder and avoid missing first-period classes.",
    });
  }
  if (performanceScore < 60) {
    plan.push({
      title: "Weekly revision routine",
      detail: "Spend 45-60 minutes daily on recap notes and solve 10 practice questions.",
    });
  }
  if (Array.isArray(weakSubjects) && weakSubjects.length > 0) {
    weakSubjects.slice(0, 3).forEach((w) => {
      plan.push({
        title: "Improve " + w.subject,
        detail: "Target +15% by revising key chapters and completing 2 assignments or mock tests this week.",
      });
    });
  }
  if (plan.length === 0) {
    plan.push({
      title: "Maintain strong performance",
      detail: "Continue current study pace and take one mock test per week to stay sharp.",
    });
  }
  return plan;
};

const computeStudentAnalytics = async (studentId) => {
  const student = await Student.findById(studentId);

  if (!student) {
    return null;
  }

  const attendanceRecords = await Attendance.find({
    "attendance.studentId": studentId
  });

  let totalDays = 0;
  let presentDays = 0;

  attendanceRecords.forEach(record => {
    const entry = record.attendance.find(
      a => a.studentId.toString() === studentId
    );

    if (entry) {
      totalDays++;
      if (entry.status === "Present") presentDays++;
    }
  });

  const attendancePercentage =
    totalDays === 0 ? 0 : (presentDays / totalDays) * 100;

  const submissions = await Submission.find({ studentId });

  const totalAssignments = submissions.length;
  const graded = submissions.filter(s => s.grade !== null);

  const performanceScore =
    totalAssignments === 0
      ? 0
      : (graded.length / totalAssignments) * 100;

  let performance = "Average";
  let risk = "Low";
  let suggestion = "Keep improving.";

  if (performanceScore >= 80 && attendancePercentage >= 85) {
    performance = "Excellent";
    suggestion = "Outstanding work!";
  } 
  else if (performanceScore < 40 || attendancePercentage < 60) {
    performance = "Poor";
    risk = "High";
    suggestion = "Immediate improvement required.";
  } 
  else if (performanceScore < 60) {
    performance = "Below Average";
    risk = "Medium";
    suggestion = "Focus more on assignments.";
  }

  let prediction = "Pass";
  if (performanceScore < 40 || attendancePercentage < 50) {
    prediction = "Fail";
  }

  const assignmentIds = submissions.map(s => s.assignmentId);

  const assignments = await Assignment.find({
    _id: { $in: assignmentIds }
  }).select("subject");

  const assignmentMap = {};
  assignments.forEach(a => {
    assignmentMap[a._id.toString()] = a.subject || "Unknown";
  });

  const subjectMap = {};

  submissions.forEach(s => {
    const subject = assignmentMap[s.assignmentId.toString()] || "Unknown";

    if (!subjectMap[subject]) subjectMap[subject] = [];

    subjectMap[subject].push(s.grade ? parseInt(s.grade) || 0 : 0);
  });

  const weakSubjects = [];

  Object.keys(subjectMap).forEach(sub => {
    const avg =
      subjectMap[sub].reduce((a, b) => a + b, 0) /
      subjectMap[sub].length;

    if (avg < 40) {
      weakSubjects.push({
        subject: sub,
        avg
      });
    }
  });

  const subjectPerformance = [];

  Object.keys(subjectMap).forEach(sub => {
    const avg =
      subjectMap[sub].reduce((a, b) => a + b, 0) /
      subjectMap[sub].length;

    subjectPerformance.push({
      subject: sub,
      avg
    });
  });

  let alerts = [];

  if (attendancePercentage < 60) {
    alerts.push("Low Attendance");
  }

  if (performanceScore < 40) {
    alerts.push("Low Performance");
  }

  const trend = submissions.map((s, i) => ({
    assignment: `A${i + 1}`,
    grade: s.grade ? parseInt(s.grade) || 0 : 0
  }));

  const aiStudyPlan = buildStudyPlan({
    attendancePercentage,
    performanceScore,
    weakSubjects,
  });

  return {
    student,
    attendancePercentage,
    performanceScore,
    performance,
    prediction,
    weakSubjects,
    subjectPerformance,
    alerts,
    risk,
    suggestion,
    aiStudyPlan,
    trend
  };
};

const computeTeacherAnalytics = async (teacherId) => {
  const teacher = await TeacherRegister.findById(teacherId);
  if (!teacher) return null;

  const teacherInfo = await TeacherInfo.findOne({ regNumber: teacher.teacherId });
  if (!teacherInfo) return [];

  const assignedSections = Array.isArray(teacherInfo.assignedSections)
    ? teacherInfo.assignedSections
    : [];

  if (assignedSections.length === 0) return [];

  const classIds = [...new Set(assignedSections.map((s) => String(s.classId || "")).filter(Boolean))];
  const classes = await Class.find({ _id: { $in: classIds } }).select("className");
  const classIdToName = new Map(classes.map((c) => [String(c._id), Number(c.className)]));

  const allowed = assignedSections
    .map((s) => {
      const className = classIdToName.get(String(s.classId || ""));
      if (!className) return null;
      const section = String(s.section || "").trim().toUpperCase();
      const stream = String(s.stream || "").trim().toLowerCase();
      return { className, section, stream };
    })
    .filter(Boolean);

  if (allowed.length === 0) return [];

  const classNames = [...new Set(allowed.map((a) => a.className))];
  const students = await Student.find({ studentClass: { $in: classNames } });

  const filteredStudents = students.filter((s) => {
    const section = String(s.section || "").trim().toUpperCase();
    const stream = String(s.stream || "").trim().toLowerCase();
    return allowed.some((a) => {
      if (a.className !== s.studentClass) return false;
      if (a.section && a.section !== section) return false;
      if (a.stream && a.stream !== stream) return false;
      return true;
    });
  });

  const studentIds = filteredStudents.map((s) => s._id);
  const submissions = await Submission.find({ studentId: { $in: studentIds } });

  const perfMap = new Map();
  for (const sub of submissions) {
    const key = String(sub.studentId);
    if (!perfMap.has(key)) {
      perfMap.set(key, { total: 0, graded: 0 });
    }
    const entry = perfMap.get(key);
    entry.total += 1;
    if (sub.grade !== null) entry.graded += 1;
  }

  return filteredStudents.map((s) => {
    const perf = perfMap.get(String(s._id)) || { total: 0, graded: 0 };
    const score = perf.total === 0 ? 0 : (perf.graded / perf.total) * 100;
    return { name: s.name, performance: score };
  });
};

const computeAdminAnalytics = async (query) => {
  const { studentClass, section, search } = query || {};

  let filter = {};

  if (studentClass) filter.studentClass = Number(studentClass);
  if (section) filter.section = section.toUpperCase();
  if (search) {
    filter.name = { $regex: search, $options: "i" };
  }

  const students = await Student.find(filter);

  const studentIds = students.map(s => s._id);

  const attendanceRecords = await Attendance.find({
    "attendance.studentId": { $in: studentIds }
  });

  const submissions = await Submission.find({
    studentId: { $in: studentIds }
  });

  let riskStudents = 0;

  const performanceMap = {};
  for (let s of students) {
    const subs = submissions.filter(x => x.studentId.toString() === s._id.toString());
    const total = subs.length;
    const graded = subs.filter(x => x.grade !== null).length;

    const score = total ? (graded / total) * 100 : 0;

    if (score < 40) riskStudents++;

    if (!performanceMap[s.studentClass]) {
      performanceMap[s.studentClass] = [];
    }
    performanceMap[s.studentClass].push(score);
  }

  const classPerformance = Object.keys(performanceMap).map(cls => {
    const arr = performanceMap[cls];
    const avg = arr.reduce((a, b) => a + b, 0) / arr.length;

    return {
      class: `Class ${cls}`,
      performance: avg
    };
  });

  const attendanceTrend = attendanceRecords.map(a => ({
    date: a.date,
    count: a.attendance.length
  }));

  let failPredictionCount = 0;

  for (let s of students) {
    const subs = submissions.filter(x => 
      x.studentId.toString() === s._id.toString()
    );

    const total = subs.length;
    const graded = subs.filter(x => x.grade !== null).length;

    const score = total ? (graded / total) * 100 : 0;

    if (score < 40) {
      failPredictionCount++;
    }
  }

  return {
    totalStudents: students.length,
    totalAttendance: attendanceRecords.length,
    totalSubmissions: submissions.length,
    riskStudents,
    failPredictionCount,
    classPerformance,
    attendanceTrend
  };
};

exports.getStudentAnalysis = async (req, res) => {
  try {
    const studentId = req.params.id;

    const data = await computeStudentAnalytics(studentId);

    if (!data) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json(data);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.getTeacherAnalysis = async (req, res) => {
  try {
    const teacherId = req.query.teacherId || req.params.teacherId;

    if (!teacherId) {
      return res.status(400).json({ message: "Teacher ID is required" });
    }

    const data = await computeTeacherAnalytics(teacherId);
    if (data === null) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Error" });
  }
};

exports.getAdminAnalysis = async (req, res) => {
  try {
    const data = await computeAdminAnalytics(req.query);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error" });
  }
};

exports.downloadStudentAnalyticsReport = async (req, res) => {
  try {
    const studentId = req.params.id;
    const format = String(req.query.format || "pdf").trim().toLowerCase();
    const data = await computeStudentAnalytics(studentId);

    if (!data) {
      return res.status(404).json({ message: "Student not found" });
    }

    if (format === "csv") {
      const rows = [
        ["Section", "Metric", "Value"],
        ["Summary", "Student Name", data.student?.name || ""],
        ["Summary", "Student ID", data.student?.studentId || ""],
        ["Summary", "Class", data.student?.studentClass || ""],
        ["Summary", "Section", data.student?.section || ""],
        ["Summary", "Stream", data.student?.stream || ""],
        ["Summary", "Attendance %", formatPct(data.attendancePercentage)],
        ["Summary", "Performance %", formatPct(data.performanceScore)],
        ["Summary", "Performance", data.performance],
        ["Summary", "Prediction", data.prediction],
        ["Summary", "Risk", data.risk],
        ["Summary", "Suggestion", data.suggestion],
      ];

      if (data.weakSubjects?.length) {
        data.weakSubjects.forEach((w) => {
          rows.push(["Weak Subjects", w.subject, formatPct(w.avg)]);
        });
      } else {
        rows.push(["Weak Subjects", "None", ""]);
      }

      if (data.subjectPerformance?.length) {
        data.subjectPerformance.forEach((s) => {
          rows.push(["Subject Performance", s.subject, formatPct(s.avg)]);
        });
      }

      if (data.alerts?.length) {
        data.alerts.forEach((a) => {
          rows.push(["Alerts", a, ""]);
        });
      } else {
        rows.push(["Alerts", "None", ""]);

      if (data.aiStudyPlan?.length) {
        data.aiStudyPlan.forEach((p) => {
          rows.push(["Study Plan", p.title, p.detail]);
        });
      } else {
        rows.push(["Study Plan", "None", ""]);
      }

      }

      if (data.trend?.length) {
        data.trend.forEach((t) => {
          rows.push(["Trend", t.assignment, t.grade]);
        });
      }

      return sendCsv(res, `student_analytics_${studentId}.csv`, rows);
    }

    if (format !== "pdf") {
      return res.status(400).json({ message: "Invalid format" });
    }

    return sendPdf(res, `student_analytics_${studentId}.pdf`, (doc) => {
      pdfTitle(doc, "Student Analytics Report", `Generated: ${new Date().toLocaleString("en-IN")}`);

      pdfSection(doc, "Summary");
      pdfKeyValue(doc, "Student Name:", data.student?.name || "-");
      pdfKeyValue(doc, "Student ID:", data.student?.studentId || "-");
      pdfKeyValue(doc, "Class:", data.student?.studentClass || "-");
      pdfKeyValue(doc, "Section:", data.student?.section || "-");
      if (data.student?.stream) pdfKeyValue(doc, "Stream:", data.student?.stream || "-");
      doc.moveDown(0.4);
      pdfKeyValue(doc, "Attendance:", formatPct(data.attendancePercentage));
      pdfKeyValue(doc, "Performance:", formatPct(data.performanceScore));
      pdfKeyValue(doc, "Prediction:", data.prediction);
      pdfKeyValue(doc, "Risk:", data.risk);
      pdfKeyValue(doc, "Suggestion:", data.suggestion);

      pdfSection(doc, "Weak Subjects");
      if (data.weakSubjects?.length) {
        data.weakSubjects.forEach((w) => {
          pdfKeyValue(doc, w.subject, formatPct(w.avg));
        });
      } else {
        doc.fontSize(10).text("None");
      }

      pdfSection(doc, "Subject Performance");
      if (data.subjectPerformance?.length) {
        data.subjectPerformance.forEach((s) => {
          pdfKeyValue(doc, s.subject, formatPct(s.avg));
        });
      } else {
        doc.fontSize(10).text("No subject performance data");
      }

      pdfSection(doc, "Alerts");
      if (data.alerts?.length) {
        data.alerts.forEach((a) => doc.fontSize(10).text(`• ${a}`));
      } else {
        doc.fontSize(10).text("No alerts");

      pdfSection(doc, "Study Plan");
      if (data.aiStudyPlan?.length) {
        data.aiStudyPlan.forEach((p) => {
          doc.fontSize(10).text(p.title + ": " + p.detail);
        });
      } else {
        doc.fontSize(10).text("No study plan available");
      }

      }

      pdfSection(doc, "Trend");
      if (data.trend?.length) {
        data.trend.forEach((t) => doc.fontSize(10).text(`${t.assignment}: ${t.grade}`));
      } else {
        doc.fontSize(10).text("No trend data");
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error" });
  }
};

exports.downloadTeacherAnalyticsReport = async (req, res) => {
  try {
    const teacherId = req.query.teacherId || req.params.teacherId;
    const format = String(req.query.format || "pdf").trim().toLowerCase();

    if (!teacherId) {
      return res.status(400).json({ message: "Teacher ID is required" });
    }

    const data = await computeTeacherAnalytics(teacherId);
    if (data === null) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const avg = data.length
      ? data.reduce((acc, curr) => acc + curr.performance, 0) / data.length
      : 0;
    const atRisk = data.filter(s => s.performance < 40).length;

    if (format === "csv") {
      const rows = [
        ["Metric", "Value"],
        ["Total Students", data.length],
        ["Class Average", formatPct(avg)],
        ["At Risk (Below 40%)", atRisk],
        [],
        ["Student Name", "Performance %"],
        ...data.map((s) => [s.name, formatPct(s.performance)]),
      ];
      return sendCsv(res, `teacher_analytics_${teacherId}.csv`, rows);
    }

    if (format !== "pdf") {
      return res.status(400).json({ message: "Invalid format" });
    }

    return sendPdf(res, `teacher_analytics_${teacherId}.pdf`, (doc) => {
      pdfTitle(doc, "Teacher Analytics Report", `Generated: ${new Date().toLocaleString("en-IN")}`);

      pdfSection(doc, "Summary");
      pdfKeyValue(doc, "Total Students:", data.length);
      pdfKeyValue(doc, "Class Average:", formatPct(avg));
      pdfKeyValue(doc, "At Risk (Below 40%):", atRisk);

      pdfSection(doc, "Student Performance");
      if (data.length) {
        data.forEach((s) => {
          pdfKeyValue(doc, s.name, formatPct(s.performance));
        });
      } else {
        doc.fontSize(10).text("No students found for assigned classes.");
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error" });
  }
};

exports.downloadAdminAnalyticsReport = async (req, res) => {
  try {
    const format = String(req.query.format || "pdf").trim().toLowerCase();
    const data = await computeAdminAnalytics(req.query);

    if (format === "csv") {
      const rows = [
        ["Metric", "Value"],
        ["Total Students", data.totalStudents],
        ["Total Attendance", data.totalAttendance],
        ["Total Submissions", data.totalSubmissions],
        ["At-Risk Students", data.riskStudents],
        ["Fail Prediction Count", data.failPredictionCount],
        [],
        ["Class Performance", "Average %"],
        ...(data.classPerformance || []).map((c) => [c.class, formatPct(c.performance)]),
        [],
        ["Attendance Trend", "Count"],
        ...(data.attendanceTrend || []).map((t) => [t.date, t.count]),
      ];
      return sendCsv(res, "admin_analytics.csv", rows);
    }

    if (format !== "pdf") {
      return res.status(400).json({ message: "Invalid format" });
    }

    return sendPdf(res, "admin_analytics.pdf", (doc) => {
      pdfTitle(doc, "Admin Analytics Report", `Generated: ${new Date().toLocaleString("en-IN")}`);

      pdfSection(doc, "Summary");
      pdfKeyValue(doc, "Total Students:", data.totalStudents);
      pdfKeyValue(doc, "Total Attendance:", data.totalAttendance);
      pdfKeyValue(doc, "Total Submissions:", data.totalSubmissions);
      pdfKeyValue(doc, "At-Risk Students:", data.riskStudents);
      pdfKeyValue(doc, "Fail Prediction Count:", data.failPredictionCount);

      pdfSection(doc, "Class Performance");
      if (data.classPerformance?.length) {
        data.classPerformance.forEach((c) => {
          pdfKeyValue(doc, c.class, formatPct(c.performance));
        });
      } else {
        doc.fontSize(10).text("No class performance data");
      }

      pdfSection(doc, "Attendance Trend");
      if (data.attendanceTrend?.length) {
        data.attendanceTrend.forEach((t) => {
          pdfKeyValue(doc, t.date, t.count);
        });
      } else {
        doc.fontSize(10).text("No attendance trend data");
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error" });
  }
};






