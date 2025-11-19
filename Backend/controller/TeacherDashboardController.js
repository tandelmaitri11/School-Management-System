const mongoose = require("mongoose");
const Class = require("../models/class");
const Student = require("../models/studentregister");
const Assignment = require("../models/assignment");

exports.getTeacherDashboardData = async (req, res) => {
  try {
    const teacherId =
      req.params.teacherId || req.query.teacherId || req.body.teacherId;

    if (!teacherId) {
      return res.status(400).json({ message: "teacherId is required" });
    }

    const teacherObjectId = new mongoose.Types.ObjectId(teacherId);

    // ✅ Total Classes
    const totalClasses = await Class.countDocuments({ classTeacher: teacherObjectId });

    // ✅ Get class list taught by this teacher
    const classList = await Class.find({ classTeacher: teacherObjectId }).distinct("className");

    // ✅ Total Students
    const totalStudents = await Student.countDocuments({
      studentClass: { $in: classList },
    });

    // ✅ Total Assignments
    const totalAssignments = await Assignment.countDocuments({ teacherId: teacherObjectId });

    // ✅ Pending Assignments
    const pendingAssignments = await Assignment.countDocuments({
      teacherId: teacherObjectId,
      dueDate: { $gte: new Date() },
    });

    // ✅ Recent 5 Assignments
    const recentAssignments = await Assignment.find({ teacherId: teacherObjectId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("title classAssigned dueDate");

    // ✅ Students per Class (Pie Chart)
    const studentsPerClass = await Class.aggregate([
      { $match: { classTeacher: teacherObjectId } },
      {
        $lookup: {
          from: "students", 
          localField: "className",
          foreignField: "studentClass",
          as: "students",
        },
      },
      {
        $project: {
          _id: 0,
          className: { $concat: ["Class ", { $toString: "$className" }] },
          studentsCount: { $size: "$students" },
        },
      },
      { $sort: { className: 1 } },
    ]);

    // ✅ Assignments Over Time (Always 12 months)
    const assignmentsByMonthRaw = await Assignment.aggregate([
      { $match: { teacherId: teacherObjectId } },
      {
        $group: {
          _id: { $month: "$createdAt" },
          assignments: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // ✅ Create array of all 12 months (fill missing ones with 0)
    const allMonths = Array.from({ length: 12 }, (_, i) => {
      const monthName = new Date(0, i).toLocaleString("default", { month: "short" });
      const monthData = assignmentsByMonthRaw.find((m) => m._id === i + 1);
      return {
        month: monthName,
        assignments: monthData ? monthData.assignments : 0,
      };
    });

    // ✅ Final Response
    res.json({
      totalClasses,
      totalStudents,
      totalAssignments,
      pendingAssignments,
      recentAssignments,
      studentsPerClass,
      assignmentsByMonth: allMonths,
    });
  } catch (error) {
    console.error("❌ Error fetching teacher dashboard data:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
