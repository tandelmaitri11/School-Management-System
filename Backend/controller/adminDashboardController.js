const Student = require("../models/studentregister");
const Teacher = require("../models/techerregister");
const Class = require("../models/class");
const Fee = require("../models/fees");
const TeacherAttendance = require("../models/teacherAttendance");

// Helper: Get monthly counts
const getMonthlyCount = async (Model) => {
  const pipeline = [
    { $group: { _id: { $month: "$createdAt" }, count: { $sum: 1 } } },
    { $sort: { "_id": 1 } },
  ];
  const result = await Model.aggregate(pipeline);
  const monthly = Array(12).fill(0);
  result.forEach((r) => { monthly[r._id - 1] = r.count; });
  return monthly;
};

// Helper: Get monthly total fees
const getMonthlyFeesTotal = async () => {
  const pipeline = [
    { $group: { _id: { $month: "$createdAt" }, total: { $sum: "$amount" } } },
    { $sort: { "_id": 1 } },
  ];
  const result = await Fee.aggregate(pipeline);
  const monthlyTotals = Array(12).fill(0);
  result.forEach((r) => { monthlyTotals[r._id - 1] = r.total; });
  return monthlyTotals;
};

// Get total counts for dashboard cards
exports.getCounts = async (req, res) => {
  try {
    const [students, teachers, classes, fees] = await Promise.all([
      Student.countDocuments(),
      Teacher.countDocuments(),
      Class.countDocuments(),
      Fee.countDocuments(),
    ]);
    res.json({ students, teachers, classes, fees });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get monthly data for line chart
exports.getMonthlyData = async (req, res) => {
  try {
    const [students, teachers, classes, fees] = await Promise.all([
      getMonthlyCount(Student),
      getMonthlyCount(Teacher),
      getMonthlyCount(Class),
      getMonthlyFeesTotal(),
    ]);
    res.json({ students, teachers, classes, fees });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get teacher attendance summary
exports.getAttendanceSummary = async (req, res) => {
  try {
    const pipeline = [
      { $unwind: "$attendance" },
      { $group: { _id: "$attendance.status", count: { $sum: 1 } } },
    ];
    const result = await TeacherAttendance.aggregate(pipeline);
    const summary = { Present: 0, Absent: 0 };
    result.forEach((r) => { summary[r._id] = r.count; });
    res.json({ present: summary.Present || 0, absent: summary.Absent || 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching attendance summary" });
  }
};

// Get fee payment summary
exports.getFeesSummary = async (req, res) => {
  try {
    const pipeline = [
      { $group: { _id: "$feeStatus", count: { $sum: 1 } } }
    ];
    const result = await Fee.aggregate(pipeline);
    const summary = { Paid: 0, Pending: 0 };
    result.forEach((r) => { summary[r._id] = r.count; });
    res.json({ paid: summary.Paid || 0, pending: summary.Pending || 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching fee summary" });
  }
};
