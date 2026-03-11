const mongoose = require("mongoose");
const Attendance = require("../models/attendance");
const StudentRegister = require("../models/studentregister");
const Class = require("../models/class");
const TeacherRegister = require("../models/techerregister");
const TeacherInfo = require("../models/teacherinfo");
const { validateStudentAttendanceDate } = require("../services/attendanceDatePolicyService");

const normalize = (v) => String(v || "").trim();
const normalizeUpper = (v) => normalize(v).toUpperCase();
const isYmd = (v) => /^\d{4}-\d{2}-\d{2}$/.test(String(v || ""));

const getTeacherAssignedRows = async (teacherMongoId, classId) => {
  const teacher = await TeacherRegister.findById(teacherMongoId).select("teacherId").lean();
  if (!teacher?.teacherId) return [];

  const info = await TeacherInfo.findOne({ regNumber: teacher.teacherId })
    .select("assignedSections")
    .lean();
  const rows = Array.isArray(info?.assignedSections) ? info.assignedSections : [];

  return rows
    .filter((r) => String(r?.classId || "") === String(classId))
    .map((r) => ({
      classId: String(r?.classId || ""),
      section: normalizeUpper(r?.section),
      stream: normalize(r?.stream),
    }))
    .filter((r) => r.classId && r.section);
};

const hasTeacherScope = ({ rows, section, stream }) => {
  const sec = normalizeUpper(section);
  const st = normalize(stream).toLowerCase();
  return rows.some((r) => {
    if (normalizeUpper(r.section) !== sec) return false;
    const rowStream = normalize(r.stream).toLowerCase();
    if (!rowStream) return true;
    return rowStream === st;
  });
};

const buildStreamOptionsForSection = (rows, section) => {
  const sec = normalizeUpper(section);
  return [...new Set(
    rows
      .filter((r) => normalizeUpper(r.section) === sec)
      .map((r) => normalize(r.stream))
      .filter(Boolean)
  )];
};

const buildStudentAttendanceHistory = async (studentId) => {
  const records = await Attendance.find({ "attendance.studentId": studentId })
    .populate("classId", "className")
    .sort({ date: -1 });

  return records.flatMap((record) => {
    const studentEntry = record.attendance.find((a) => a.studentId.toString() === String(studentId));
    if (!studentEntry) return [];

    let safeDate = isYmd(record.date) ? record.date : "N/A";
    if (safeDate === "N/A") {
      const parsed = new Date(record.date);
      if (!Number.isNaN(parsed.getTime())) {
        safeDate = parsed.toISOString().split("T")[0];
      }
    }

    return [
      {
        date: safeDate,
        className: record.classId?.className || "",
        section: record.section || "",
        stream: record.stream || "",
        status: studentEntry.status,
      },
    ];
  });
};

// Mark attendance
exports.markAttendance = async (req, res) => {
  try {
    const { classId, date, attendance, section, stream = "" } = req.body;
    const teacherId = req.user?.id || req.body.teacherId;

    if (!classId || !date || !attendance || !section) {
      return res.status(400).json({ message: "classId, section, date and attendance are required" });
    }
    if (!teacherId) {
      return res.status(400).json({ message: "teacherId is required" });
    }

    const cls = await Class.findById(classId).select("className").lean();
    if (!cls) return res.status(404).json({ message: "Class not found" });

    const assignedRows = await getTeacherAssignedRows(teacherId, classId);
    if (!assignedRows.length) {
      return res.status(403).json({ message: "You are not assigned to this class" });
    }

    const safeSection = normalizeUpper(section);
    const safeStream = normalize(stream);

    if (!hasTeacherScope({ rows: assignedRows, section: safeSection, stream: safeStream })) {
      return res.status(403).json({ message: "You are not assigned to this class/section/stream" });
    }

    const requiredStreams = buildStreamOptionsForSection(assignedRows, safeSection);
    if (requiredStreams.length > 0 && !safeStream) {
      return res.status(400).json({ message: "Stream is required for selected section" });
    }

    const formattedDate = new Date(date);
    if (Number.isNaN(formattedDate.getTime())) {
      return res.status(400).json({ message: "Invalid date format" });
    }
    const normalizedDate = formattedDate.toISOString().split("T")[0];
    const datePolicy = await validateStudentAttendanceDate({
      classId,
      section: safeSection,
      stream: safeStream,
      date: normalizedDate,
    });
    if (!datePolicy.allowed) {
      return res.status(400).json({ message: datePolicy.reason, code: datePolicy.code });
    }

    const existing = await Attendance.findOne({
      classId,
      date: normalizedDate,
      section: safeSection,
      stream: safeStream,
    });
    if (existing) {
      return res.status(400).json({ message: "Attendance already marked for this class/section/stream/date" });
    }

    const studentIds = (Array.isArray(attendance) ? attendance : [])
      .map((a) => String(a?.studentId || ""))
      .filter((x) => mongoose.Types.ObjectId.isValid(x));

    if (!studentIds.length) {
      return res.status(400).json({ message: "No valid students in attendance payload" });
    }

    const query = {
      _id: { $in: studentIds },
      $or: [{ classId }, { studentClass: cls.className }],
      section: safeSection,
    };
    if (safeStream) query.stream = safeStream;

    const allowedStudents = await StudentRegister.find(query).select("_id").lean();
    const allowedSet = new Set(allowedStudents.map((s) => String(s._id)));

    const cleanedAttendance = attendance
      .map((a) => ({
        studentId: String(a?.studentId || ""),
        status: a?.status === "Absent" ? "Absent" : "Present",
      }))
      .filter((a) => allowedSet.has(a.studentId))
      .map((a) => ({ studentId: a.studentId, status: a.status }));

    if (!cleanedAttendance.length) {
      return res.status(400).json({ message: "No students match your assigned scope for attendance" });
    }

    const newAttendance = new Attendance({
      classId,
      section: safeSection,
      stream: safeStream,
      date: normalizedDate,
      teacherId,
      attendance: cleanedAttendance,
    });

    await newAttendance.save();
    return res.status(201).json({ message: "Attendance saved successfully" });
  } catch (err) {
    console.error("Error marking attendance:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.validateAttendanceDate = async (req, res) => {
  try {
    const { classId, date } = req.query;
    const section = normalizeUpper(req.query.section);
    const stream = normalize(req.query.stream);

    if (!classId || !section || !date) {
      return res.status(400).json({ message: "classId, section and date are required" });
    }

    const policy = await validateStudentAttendanceDate({
      classId,
      section,
      stream,
      date: String(date),
    });

    return res.status(200).json(policy);
  } catch (err) {
    return res.status(500).json({ message: "Failed to validate attendance date" });
  }
};

// Get attendance by class
exports.getAttendanceByClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const section = normalizeUpper(req.query.section);
    const stream = normalize(req.query.stream);
    const query = { classId };
    if (section) query.section = section;
    if (stream) query.stream = stream;

    const records = await Attendance.find(query)
      .populate("classId", "className")
      .populate("attendance.studentId", "name studentId email")
      .sort({ date: -1 });

    res.status(200).json(records);
  } catch (err) {
    console.error("Error fetching class attendance:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get attendance by class & date
exports.getAttendanceByClassAndDate = async (req, res) => {
  try {
    const { classId, date } = req.params;
    const teacherId = req.user?.id || req.query.teacherId;
    const section = normalizeUpper(req.query.section);
    const stream = normalize(req.query.stream);
    const formattedDate = new Date(date).toISOString().split("T")[0];

    if (!section) return res.status(400).json({ message: "section is required" });
    if (!teacherId) return res.status(400).json({ message: "teacherId is required" });

    const assignedRows = await getTeacherAssignedRows(teacherId, classId);
    if (!assignedRows.length) return res.status(403).json({ message: "You are not assigned to this class" });

    if (!hasTeacherScope({ rows: assignedRows, section, stream })) {
      return res.status(403).json({ message: "You are not assigned to this class/section/stream" });
    }

    const record = await Attendance.findOne({
      classId,
      date: formattedDate,
      section,
      stream,
    })
      .populate("attendance.studentId", "name studentId email")
      .populate("classId", "className");

    if (!record) {
      return res.status(404).json({ message: "No attendance found" });
    }

    res.status(200).json(record);
  } catch (err) {
    console.error("Error fetching attendance:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get attendance by student
exports.getAttendanceByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;

    if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: "Invalid student ID" });
    }

    if (String(req.user?.role || "") === "Student" && String(req.user?.id || "") !== String(studentId)) {
      return res.status(403).json({ message: "Not allowed to view another student's attendance" });
    }

    const studentAttendance = await buildStudentAttendanceHistory(studentId);

    res.status(200).json(studentAttendance);
  } catch (err) {
    console.error("Error fetching student attendance:", err);
    res.status(500).json({
      message: "Server error while fetching attendance",
      error: err.message,
    });
  }
};

// Get attendance of logged-in student
exports.getMyAttendance = async (req, res) => {
  try {
    if (String(req.user?.role || "") !== "Student") {
      return res.status(403).json({ message: "Only students can access this endpoint" });
    }

    const studentAttendance = await buildStudentAttendanceHistory(req.user.id);
    return res.status(200).json(studentAttendance);
  } catch (err) {
    console.error("Error fetching my attendance:", err);
    return res.status(500).json({
      message: "Server error while fetching attendance",
      error: err.message,
    });
  }
};

// Get all students
exports.getAllStudents = async (req, res) => {
  try {
    const students = await StudentRegister.find().select("-password");
    if (!students || students.length === 0) {
      return res.status(404).json({ message: "No students found" });
    }
    res.status(200).json(students);
  } catch (err) {
    console.error("Error fetching students:", err);
    res.status(500).json({ message: "Server error" });
  }
};
