const mongoose = require("mongoose");
const Class = require("../models/class");
const Student = require("../models/studentregister");
const Assignment = require("../models/assignment");
const TeacherRegister = require("../models/techerregister");
const TeacherInfo = require("../models/teacherinfo");

const normalize = (v) => String(v || "").trim();
const normalizeUpper = (v) => normalize(v).toUpperCase();

const getTeacherScope = async (teacherMongoId) => {
  const teacher = await TeacherRegister.findById(teacherMongoId).select("teacherId").lean();
  if (!teacher?.teacherId) return { classes: [], rows: [] };

  const info = await TeacherInfo.findOne({ regNumber: teacher.teacherId })
    .select("classes assignedSections")
    .lean();

  const classIds = Array.isArray(info?.classes) ? info.classes.map((x) => String(x)) : [];
  if (!classIds.length) return { classes: [], rows: [] };

  const classes = await Class.find({ _id: { $in: classIds } })
    .select("_id className")
    .sort({ className: 1 })
    .lean();
  const classSet = new Set(classes.map((c) => String(c._id)));

  const rows = (Array.isArray(info?.assignedSections) ? info.assignedSections : [])
    .filter((r) => classSet.has(String(r?.classId || "")))
    .map((r) => ({
      classId: String(r?.classId || ""),
      section: normalizeUpper(r?.section),
      stream: normalize(r?.stream),
    }))
    .filter((r) => r.classId && r.section);

  return { classes, rows };
};

exports.getTeacherDashboardData = async (req, res) => {
  try {
    const teacherId = req.params.teacherId || req.query.teacherId || req.body.teacherId;

    if (!teacherId || !mongoose.Types.ObjectId.isValid(teacherId)) {
      return res.status(400).json({ message: "teacherId is required" });
    }

    const teacherObjectId = new mongoose.Types.ObjectId(teacherId);
    const { classes, rows } = await getTeacherScope(teacherObjectId);
    const rowByClass = new Map();
    rows.forEach((r) => {
      const key = String(r.classId);
      if (!rowByClass.has(key)) rowByClass.set(key, []);
      rowByClass.get(key).push(r);
    });

    const scopedClasses = classes.filter((c) => (rowByClass.get(String(c._id)) || []).length > 0);
    const totalClasses = scopedClasses.length;

    let totalStudents = 0;
    const studentsPerClass = [];

    for (const cls of scopedClasses) {
      const allowedRows = rowByClass.get(String(cls._id)) || [];
      const raw = await Student.find({
        $or: [{ classId: cls._id }, { studentClass: cls.className }],
      })
        .select("_id section stream")
        .lean();

      const scopedStudents = raw.filter((s) => {
        const sSec = normalizeUpper(s.section);
        const sSt = normalize(s.stream).toLowerCase();
        return allowedRows.some((r) => {
          if (normalizeUpper(r.section) !== sSec) return false;
          const rSt = normalize(r.stream).toLowerCase();
          if (!rSt) return true;
          return rSt === sSt;
        });
      });

      totalStudents += scopedStudents.length;
      studentsPerClass.push({
        className: `Class ${cls.className}`,
        studentsCount: scopedStudents.length,
      });
    }

    const totalAssignments = await Assignment.countDocuments({ teacherId: teacherObjectId });
    const pendingAssignments = await Assignment.countDocuments({
      teacherId: teacherObjectId,
      dueDate: { $gte: new Date() },
    });

    const recentAssignments = await Assignment.find({ teacherId: teacherObjectId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("title classAssigned dueDate");

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

    const allMonths = Array.from({ length: 12 }, (_, i) => {
      const monthName = new Date(0, i).toLocaleString("default", { month: "short" });
      const monthData = assignmentsByMonthRaw.find((m) => m._id === i + 1);
      return {
        month: monthName,
        assignments: monthData ? monthData.assignments : 0,
      };
    });

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
    console.error("Error fetching teacher dashboard data:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
