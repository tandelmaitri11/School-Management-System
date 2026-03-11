const Class = require("../models/class");
const TeacherRegister = require("../models/techerregister");
const TeacherInfo = require("../models/teacherinfo");

const checkClassTeacher = async (req, res, next) => {
  try {
    const role = String(req.user?.role || "").toLowerCase();

    // Admin can always manage timetable.
    if (role === "admin") {
      return next();
    }

    const teacherId = req.user?.id;
    const { classId } = req.body || {};

    if (!teacherId || !classId) {
      return res.status(400).json({ message: "classId is required" });
    }

    const cls = await Class.findById(classId).select("classTeacher").lean();
    if (!cls) return res.status(404).json({ message: "Class not found" });

    const isClassTeacher = String(cls.classTeacher) === String(teacherId);
    if (isClassTeacher) return next();

    // Fallback: allow if class is assigned in TeacherInfo (classes/assignedSections).
    const teacher = await TeacherRegister.findById(teacherId).select("teacherId").lean();
    if (!teacher?.teacherId) return res.status(403).json({ message: "Not allowed" });

    const teacherInfo = await TeacherInfo.findOne({ regNumber: teacher.teacherId })
      .select("classes assignedSections")
      .lean();

    const inClasses = Array.isArray(teacherInfo?.classes)
      ? teacherInfo.classes.some((id) => String(id) === String(classId))
      : false;

    const inAssignedSections = Array.isArray(teacherInfo?.assignedSections)
      ? teacherInfo.assignedSections.some((s) => String(s?.classId) === String(classId))
      : false;

    if (!inClasses && !inAssignedSections) {
      return res.status(403).json({ message: "Not allowed" });
    }

    return next();
  } catch (err) {
    return res.status(500).json({ message: "Authorization check failed" });
  }
};

module.exports = checkClassTeacher;
