const Attendance = require("../models/attendance");
const Submission = require("../models/submission");
const Student = require("../models/studentregister");
const Assignment = require("../models/assignment");

exports.getStudentReport = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { month } = req.query;

    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: "Student not found" });

    // Filter month if provided
    const monthFilter = month
      ? { date: { $regex: `^${month}` } } // e.g., "2025-11"
      : {};

    // 📘 Attendance Report
    const attendanceRecords = await Attendance.find({
      "attendance.studentId": studentId,
      ...monthFilter,
    });

    let totalDays = 0,
      presentDays = 0,
      absentDays = 0;

    const attendanceChart = attendanceRecords.map((rec) => {
      const record = rec.attendance.find(
        (a) => a.studentId.toString() === studentId
      );
      if (record) {
        totalDays++;
        if (record.status === "Present") presentDays++;
        else absentDays++;
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
      percentage: totalDays
        ? ((presentDays / totalDays) * 100).toFixed(2)
        : 0,
      chart: attendanceChart,
    };

    // 📗 Assignment Report
    const submissions = await Submission.find({ studentId }).populate("assignmentId");

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

    // ✅ Include class info in response
    res.json({
      studentName: student.name,
      className: student.studentClass, // <-- here
      attendance,
      assignments,
    });
  } catch (error) {
    console.error("Error generating student report:", error);
    res.status(500).json({ message: "Server error" });
  }
};

