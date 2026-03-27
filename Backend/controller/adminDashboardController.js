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
    {  $unwind: "$paymentHistory"},
    { $group: { 
      _id: { $month: "$paymentHistory.date" }, 
      total: { $sum: "$paymentHistory.amount" } 
    } },
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

// Get student/fee distribution data (class/section/stream)
exports.getDistributionStats = async (req, res) => {
  try {
    const [classWiseStudentsRaw, sectionWiseStudentsRaw, streamWiseStudentsRaw, classWiseFeesRaw, classMeta] =
      await Promise.all([
        Student.aggregate([
          { $group: { _id: "$studentClass", count: { $sum: 1 } } },
          { $sort: { _id: 1 } },
        ]),
        Student.aggregate([
          {
            $group: {
              _id: {
                $cond: [
                  {
                    $or: [
                      { $eq: [{ $ifNull: ["$section", ""] }, ""] },
                      { $eq: [{ $trim: { input: { $ifNull: ["$section", ""] } } }, ""] },
                    ],
                  },
                  "Unassigned",
                  { $toUpper: { $trim: { input: "$section" } } },
                ],
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { count: -1, _id: 1 } },
        ]),
        Student.aggregate([
          {
            $group: {
              _id: {
                $cond: [
                  {
                    $or: [
                      { $eq: [{ $ifNull: ["$stream", ""] }, ""] },
                      { $eq: [{ $trim: { input: { $ifNull: ["$stream", ""] } } }, ""] },
                    ],
                  },
                  "General",
                  { $trim: { input: "$stream" } },
                ],
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { count: -1, _id: 1 } },
        ]),
        Fee.aggregate([
          {
            $group: {
              _id: "$studentClass",
              records: { $sum: 1 },
              totalFees: { $sum: { $ifNull: ["$totalFees", 0] } },
              paidAmount: { $sum: { $ifNull: ["$paidAmount", 0] } },
              remainingAmount: { $sum: { $ifNull: ["$remainingAmount", 0] } },
            },
          },
          { $sort: { _id: 1 } },
        ]),
        Class.aggregate([
          {
            $project: {
              totalSections: { $size: { $ifNull: ["$sections", []] } },
              activeSections: {
                $size: {
                  $filter: {
                    input: { $ifNull: ["$sections", []] },
                    as: "sec",
                    cond: { $eq: ["$$sec.isActive", true] },
                  },
                },
              },
              totalStreams: { $size: { $ifNull: ["$streams", []] } },
              activeStreams: {
                $size: {
                  $filter: {
                    input: { $ifNull: ["$streams", []] },
                    as: "str",
                    cond: { $eq: ["$$str.isActive", true] },
                  },
                },
              },
            },
          },
          {
            $group: {
              _id: null,
              totalSections: { $sum: "$totalSections" },
              activeSections: { $sum: "$activeSections" },
              totalStreams: { $sum: "$totalStreams" },
              activeStreams: { $sum: "$activeStreams" },
            },
          },
        ]),
      ]);

    const classWiseStudents = classWiseStudentsRaw.map((row) => ({
      className: Number(row._id),
      label: `Class ${row._id}`,
      count: Number(row.count || 0),
    }));

    const sectionWiseStudents = sectionWiseStudentsRaw.map((row) => ({
      section: row._id,
      label: row._id,
      count: Number(row.count || 0),
    }));

    const streamWiseStudents = streamWiseStudentsRaw.map((row) => ({
      stream: row._id,
      label: row._id,
      count: Number(row.count || 0),
    }));

    const classWiseFees = classWiseFeesRaw.map((row) => ({
      className: Number(row._id),
      label: `Class ${row._id}`,
      records: Number(row.records || 0),
      totalFees: Number(row.totalFees || 0),
      paidAmount: Number(row.paidAmount || 0),
      remainingAmount: Number(row.remainingAmount || 0),
    }));

    const classSummary = classMeta[0] || {
      totalSections: 0,
      activeSections: 0,
      totalStreams: 0,
      activeStreams: 0,
    };

    res.json({
      classWiseStudents,
      sectionWiseStudents,
      streamWiseStudents,
      classWiseFees,
      classSummary: {
        totalSections: Number(classSummary.totalSections || 0),
        activeSections: Number(classSummary.activeSections || 0),
        totalStreams: Number(classSummary.totalStreams || 0),
        activeStreams: Number(classSummary.activeStreams || 0),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching dashboard distribution data" });
  }
};
