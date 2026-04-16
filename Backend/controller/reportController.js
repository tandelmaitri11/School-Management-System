const mongoose = require("mongoose");
const Attendance = require("../models/attendance");
const Submission = require("../models/submission");
const Student = require("../models/studentregister");
const Fees = require("../models/fees");
const Exam = require("../models/Exam");
const LmsProgress = require("../models/lmsProgress");
const LmsMaterial = require("../models/lmsMaterial");
const StudentReportRemark = require("../models/studentReportRemark");

const gradeMap = { A: 5, B: 4, C: 3, D: 2, E: 1, F: 0 };

const parseMonthRange = (month) => {
  const raw = String(month || "").trim();
  if (!/^\d{4}-\d{2}$/.test(raw)) return null;

  const start = new Date(`${raw}-01T00:00:00.000Z`);
  if (Number.isNaN(start.getTime())) return null;

  const end = new Date(start);
  end.setUTCMonth(end.getUTCMonth() + 1);
  return { start, end };
};

const round2 = (value) => Math.round(Number(value || 0) * 100) / 100;

const buildAiInsights = ({ attendance, assignments, academicPerformance, lms, feeStatus }) => {
  const strengths = [];
  const improvements = [];

  if (Number(attendance.percentage || 0) >= 85) strengths.push("Strong attendance consistency");
  else improvements.push("Attendance needs closer monitoring");

  if (Number(academicPerformance.averagePercentage || 0) >= 75) strengths.push("Good academic performance in exams");
  else improvements.push("Exam performance can improve with revision planning");

  if (Number(assignments.submissionRate || 0) >= 80) strengths.push("Assignments are being submitted regularly");
  else improvements.push("Assignment submission rate should be improved");

  if (Number(lms.completionRate || 0) >= 70) strengths.push("Healthy LMS learning progress");
  else improvements.push("LMS course completion is behind target");

  if (String(feeStatus.status || "") === "Paid") strengths.push("Fee status is clear and up to date");
  else improvements.push("Pending fee dues should be cleared");

  const summaryParts = [];
  summaryParts.push(
    Number(academicPerformance.averagePercentage || 0) >= 75
      ? "The student is performing well academically."
      : "The student needs more support in academic performance."
  );
  summaryParts.push(
    Number(attendance.percentage || 0) >= 85
      ? "Attendance is a positive contributor."
      : "Attendance is affecting consistency."
  );
  summaryParts.push(
    Number(assignments.submissionRate || 0) >= 80
      ? "Assignment discipline is satisfactory."
      : "Assignment completion should be improved."
  );

  const riskScore =
    (Number(attendance.percentage || 0) < 75 ? 1 : 0) +
    (Number(academicPerformance.averagePercentage || 0) < 50 ? 1 : 0) +
    (Number(assignments.submissionRate || 0) < 60 ? 1 : 0) +
    (String(feeStatus.status || "") !== "Paid" ? 1 : 0);

  const riskLevel = riskScore >= 3 ? "High" : riskScore === 2 ? "Medium" : "Low";

  return {
    summary: summaryParts.join(" "),
    strengths,
    improvements,
    riskLevel,
    teacherRemarksSuggestion:
      riskLevel === "High"
        ? "Student needs close monitoring with a weekly action plan."
        : riskLevel === "Medium"
        ? "Student is progressing but needs focused support in weaker areas."
        : "Student is progressing well. Continue the current learning discipline.",
  };
};

exports.getStudentReport = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { month } = req.query;

    const rawStudentId = String(studentId || "").trim();
    if (!rawStudentId) {
      return res.status(400).json({ message: "studentId is required" });
    }

    let student = null;
    if (mongoose.Types.ObjectId.isValid(rawStudentId)) {
      student = await Student.findById(rawStudentId).lean();
    }
    if (!student) {
      student = await Student.findOne({ studentId: rawStudentId }).lean();
    }

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const studentMongoId = String(student._id);
    const monthRange = parseMonthRange(month);
    const attendanceFilter = month ? { date: { $regex: `^${month}` } } : {};
    const createdAtRange = monthRange ? { $gte: monthRange.start, $lt: monthRange.end } : null;

    const [attendanceRecords, allSubmissions, feeDoc, lmsProgress, examDocs, reportRemark] = await Promise.all([
      Attendance.find({
        "attendance.studentId": student._id,
        ...attendanceFilter,
      }).lean(),
      Submission.find({
        studentId: student._id,
        ...(createdAtRange ? { createdAt: createdAtRange } : {}),
      }).populate("assignmentId", "title subject dueDate").lean(),
      Fees.findOne({ studentId: studentMongoId }).lean(),
      LmsProgress.find({
        studentId: studentMongoId,
        ...(createdAtRange ? { createdAt: createdAtRange } : {}),
      }).lean(),
      Exam.find({
        "submissions.studentId": student._id,
        ...(createdAtRange ? { startTime: createdAtRange } : {}),
      })
        .select("title subjectName totalMarks startTime submissions")
        .lean(),
      StudentReportRemark.findOne({ studentId: student._id }).lean(),
    ]);

    let totalDays = 0;
    let presentDays = 0;
    let absentDays = 0;

    const attendanceDetails = [];
    const attendanceChart = attendanceRecords.map((rec) => {
      const record = (rec.attendance || []).find((a) => String(a.studentId) === studentMongoId);
      if (record) {
        totalDays += 1;
        if (record.status === "Present") presentDays += 1;
        else absentDays += 1;

        attendanceDetails.push({
          date: rec.date,
          status: record.status || "Absent",
        });
      }

      return {
        date: rec.date,
        Present: record?.status === "Present" ? 1 : 0,
        Absent: record?.status === "Absent" ? 1 : 0,
      };
    });

    const attendance = {
      totalDays,
      presentDays,
      absentDays,
      percentage: totalDays ? round2((presentDays / totalDays) * 100) : 0,
      chart: attendanceChart,
      details: attendanceDetails,
    };

    const gradedSubmissions = allSubmissions.filter((s) => s.grade);
    const totalAssignments = allSubmissions.length;
    const graded = gradedSubmissions.length;
    const totalSubmitted = allSubmissions.length;
    const avgGrade =
      graded > 0
        ? round2(
            gradedSubmissions.reduce((sum, s) => sum + (gradeMap[String(s.grade || "").toUpperCase()] || 0), 0) / graded
          )
        : 0;

    const assignments = {
      totalAssignments,
      totalSubmitted,
      graded,
      avgGrade,
      submissionRate: totalAssignments ? round2((totalSubmitted / totalAssignments) * 100) : 0,
      chart: allSubmissions.map((s) => ({
        title: s.assignmentId?.title || "Untitled",
        grade: s.grade || "Not Graded",
        gradeValue: gradeMap[String(s.grade || "").toUpperCase()] || 0,
      })),
      details: allSubmissions.map((s) => ({
        title: s.assignmentId?.title || "Untitled",
        subject: s.assignmentId?.subject || "",
        dueDate: s.assignmentId?.dueDate || "",
        grade: s.grade || "Not Graded",
        submittedAt: s.createdAt || "",
      })),
    };

    const examResults = examDocs
      .map((exam) => {
        const submission = (exam.submissions || []).find((s) => String(s.studentId) === studentMongoId);
        if (!submission) return null;
        return {
          title: exam.title,
          subject: exam.subjectName,
          totalMarks: Number(exam.totalMarks || 0),
          obtainedMarks: Number(submission.obtainedMarks || 0),
          percentage: round2(submission.percentage || 0),
          grade: submission.grade || "",
          resultStatus: submission.resultStatus || "FAIL",
          date: exam.startTime,
        };
      })
      .filter(Boolean);

    const academicAverage =
      examResults.length > 0
        ? round2(examResults.reduce((sum, exam) => sum + Number(exam.percentage || 0), 0) / examResults.length)
        : 0;

    const academicPerformance = {
      totalExams: examResults.length,
      averagePercentage: academicAverage,
      bestPercentage: examResults.length ? Math.max(...examResults.map((e) => Number(e.percentage || 0))) : 0,
      passCount: examResults.filter((e) => e.resultStatus === "PASS").length,
      failCount: examResults.filter((e) => e.resultStatus !== "PASS").length,
      chart: examResults.map((e) => ({
        title: e.title,
        percentage: e.percentage,
      })),
      details: examResults,
    };

    const totalMaterials = await LmsMaterial.countDocuments({});
    const completedMaterials = lmsProgress.length;
    const averageProgress =
      completedMaterials > 0
        ? round2(lmsProgress.reduce((sum, row) => sum + Number(row.progressPct || 0), 0) / completedMaterials)
        : 0;

    const lms = {
      totalMaterials,
      completedMaterials,
      completionRate: totalMaterials ? round2((completedMaterials / totalMaterials) * 100) : 0,
      averageProgress,
      totalWatchSeconds: lmsProgress.reduce((sum, row) => sum + Number(row.watchedSeconds || 0), 0),
    };

    const feeStatus = {
      totalFees: Number(feeDoc?.totalFees || 0),
      paidAmount: Number(feeDoc?.paidAmount || 0),
      pendingAmount: Number(feeDoc?.remainingAmount || 0),
      lateFeeAccrued: Number(feeDoc?.lateFeeAccrued || 0),
      totalDue: Number((feeDoc?.remainingAmount || 0) + (feeDoc?.lateFeeAccrued || 0)),
      dueDate: feeDoc?.dueDate || null,
      status: feeDoc?.feeStatus || (feeDoc ? "Pending" : "N/A"),
    };

    const overallResultScore = round2(
      academicPerformance.averagePercentage * 0.45 +
        attendance.percentage * 0.25 +
        assignments.submissionRate * 0.15 +
        lms.completionRate * 0.15
    );

    const overallResult = {
      score: overallResultScore,
      label:
        overallResultScore >= 85
          ? "Excellent"
          : overallResultScore >= 70
          ? "Good"
          : overallResultScore >= 50
          ? "Average"
          : "Needs Improvement",
    };

    const aiInsights = buildAiInsights({
      attendance,
      assignments,
      academicPerformance,
      lms,
      feeStatus,
    });

    res.json({
      studentId: student.studentId,
      studentMongoId,
      studentName: student.name,
      className: student.studentClass,
      studentDetails: {
        name: student.name,
        studentId: student.studentId,
        className: student.studentClass,
        section: student.section || "",
        stream: student.stream || "",
        subjectChoice: student.subjectChoice || "",
        email: student.email || "",
      },
      attendance,
      assignments,
      academicPerformance,
      lms,
      feeStatus,
      overallResult,
      teacherRemarks: String(reportRemark?.remarks || "").trim() || aiInsights.teacherRemarksSuggestion,
      teacherRemarksMeta: {
        hasCustomRemark: Boolean(String(reportRemark?.remarks || "").trim()),
        updatedAt: reportRemark?.updatedAt || null,
        teacherId: reportRemark?.teacherId || null,
      },
      strengthsAndImprovements: {
        strengths: aiInsights.strengths,
        improvements: aiInsights.improvements,
      },
      aiInsights,
    });
  } catch (error) {
    console.error("Error generating student report:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.saveStudentReportRemark = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { remarks } = req.body;

    const rawStudentId = String(studentId || "").trim();
    if (!rawStudentId) {
      return res.status(400).json({ message: "studentId is required" });
    }

    let student = null;
    if (mongoose.Types.ObjectId.isValid(rawStudentId)) {
      student = await Student.findById(rawStudentId).select("_id").lean();
    }
    if (!student) {
      student = await Student.findOne({ studentId: rawStudentId }).select("_id").lean();
    }
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const cleanedRemarks = String(remarks || "").trim();
    if (!cleanedRemarks) {
      return res.status(400).json({ message: "remarks is required" });
    }

    const saved = await StudentReportRemark.findOneAndUpdate(
      { studentId: student._id },
      {
        $set: {
          remarks: cleanedRemarks,
          teacherId: req.user?.id || null,
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    ).lean();

    return res.json({
      message: "Student report remark saved successfully",
      remark: saved,
    });
  } catch (error) {
    console.error("Error saving student report remark:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
