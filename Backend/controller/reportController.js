const mongoose = require("mongoose");
const Attendance = require("../models/attendance");
const Submission = require("../models/submission");
const Student = require("../models/studentregister");

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
      student = await Student.findById(rawStudentId);
    }
    if (!student) {
      student = await Student.findOne({ studentId: rawStudentId });
    }

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const studentMongoId = String(student._id);

    // Filter month if provided
    const monthFilter = month ? { date: { $regex: `^${month}` } } : {};

    // Attendance report
    const attendanceRecords = await Attendance.find({
      "attendance.studentId": student._id,
      ...monthFilter,
    });

    let totalDays = 0;
    let presentDays = 0;
    let absentDays = 0;

    const attendanceChart = attendanceRecords.map((rec) => {
      const record = rec.attendance.find((a) => String(a.studentId) === studentMongoId);
      if (record) {
        totalDays += 1;
        if (record.status === "Present") presentDays += 1;
        else absentDays += 1;
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
      percentage: totalDays ? ((presentDays / totalDays) * 100).toFixed(2) : 0,
      chart: attendanceChart,
    };

    // Assignment report
    const submissions = await Submission.find({ studentId: student._id }).populate("assignmentId");

    const totalAssignments = submissions.length;
    const graded = submissions.filter((s) => s.grade).length;
    const totalSubmitted = submissions.length;

    const gradeMap = { A: 5, B: 4, C: 3, D: 2, E: 1, F: 0 };
    const avgGrade =
      graded > 0
        ? (
            submissions
              .filter((s) => gradeMap[s.grade])
              .reduce((sum, s) => sum + (gradeMap[s.grade] || 0), 0) / graded
          ).toFixed(2)
        : "N/A";

    const assignmentChart = submissions.map((s) => ({
      title: s.assignmentId?.title || "Untitled",
      grade: s.grade || "Not Graded",
      gradeValue: gradeMap[s.grade] || 0,
    }));

    const assignments = {
      totalAssignments,
      totalSubmitted,
      graded,
      avgGrade,
      chart: assignmentChart,
      details: submissions.map((s) => ({
        title: s.assignmentId?.title || "Untitled",
        dueDate: s.assignmentId?.dueDate || "",
        grade: s.grade || "Not Graded",
      })),
    };

    res.json({
      studentId: student.studentId,
      studentMongoId,
      studentName: student.name,
      className: student.studentClass,
      attendance,
      assignments,
    });
  } catch (error) {
    console.error("Error generating student report:", error);
    res.status(500).json({ message: "Server error" });
  }
};
