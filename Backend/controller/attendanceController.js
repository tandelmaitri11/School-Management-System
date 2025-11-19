const mongoose = require("mongoose");
const Attendance = require("../models/attendance");
const StudentRegister = require("../models/studentregister");
const Class = require("../models/class");

// ✅ Mark attendance
exports.markAttendance = async (req, res) => {
  try {
    const { classId, date, attendance } = req.body;
    const teacherId = req.user?.id || req.body.teacherId;

    if (!classId || !date || !attendance) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Normalize date (YYYY-MM-DD)
    const formattedDate = new Date(date);
    if (isNaN(formattedDate)) {
      return res.status(400).json({ message: "Invalid date format" });
    }
    const normalizedDate = formattedDate.toISOString().split("T")[0];

    // Prevent duplicate attendance for same date
    const existing = await Attendance.findOne({ classId, date: normalizedDate });
    if (existing) {
      return res
        .status(400)
        .json({ message: "Attendance already marked for this date" });
    }

    const newAttendance = new Attendance({
      classId,
      date: normalizedDate,
      teacherId,
      attendance,
    });

    await newAttendance.save();
    res.status(201).json({ message: "Attendance saved successfully" });
  } catch (err) {
    console.error("❌ Error marking attendance:", err);
    res.status(500).json({ message: "Server error" });
  }
};
// ✅ Get attendance by class
exports.getAttendanceByClass = async (req, res) => {
  try {
    const { classId } = req.params;

    const records = await Attendance.find({ classId })
      .populate("classId", "className")
      .populate("attendance.studentId", "name studentId email") // ✅ ADD THIS
      .sort({ date: -1 });

    res.status(200).json(records);
  } catch (err) {
    console.error("❌ Error fetching class attendance:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Get attendance by class & date
exports.getAttendanceByClassAndDate = async (req, res) => {
  try {
    const { classId, date } = req.params;
    const formattedDate = new Date(date).toISOString().split("T")[0];

    const record = await Attendance.findOne({ classId, date: formattedDate })
      .populate("attendance.studentId", "name studentId email") // ✅ ADD THIS
      .populate("classId", "className");

    if (!record) {
      return res.status(404).json({ message: "No attendance found" });
    }

    res.status(200).json(record);
  } catch (err) {
    console.error("❌ Error fetching attendance:", err);
    res.status(500).json({ message: "Server error" });
  }
};




// ✅ Get attendance by student
exports.getAttendanceByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;

    if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: "Invalid student ID" });
    }

    const records = await Attendance.find({ "attendance.studentId": studentId })
      .populate("classId", "className")
      .sort({ date: -1 });

    // Map and sanitize dates
    const studentAttendance = records.flatMap((record) => {
      const studentEntry = record.attendance.find(
        (a) => a.studentId.toString() === studentId
      );
      if (!studentEntry) return [];

      let safeDate = record.date;
      if (safeDate && !isNaN(new Date(safeDate))) {
        safeDate = new Date(safeDate).toISOString().split("T")[0];
      } else {
        safeDate = "N/A";
      }

      return [
        {
          date: safeDate,
          className: record.classId?.className || "",
          status: studentEntry.status,
        },
      ];
    });

    res.status(200).json(studentAttendance);
  } catch (err) {
    console.error("❌ Error fetching student attendance:", err);
    res.status(500).json({
      message: "Server error while fetching attendance",
      error: err.message,
    });
  }
};
// ✅ Get all students
exports.getAllStudents = async (req, res) => {
  try {
    const students = await StudentRegister.find()
      .populate("studentClass", "className") // If class reference exists
      .select("-password"); // Hide password for security

    if (!students || students.length === 0) {
      return res.status(404).json({ message: "No students found" });
    }

    res.status(200).json(students);
  } catch (err) {
    console.error("❌ Error fetching students:", err);
    res.status(500).json({ message: "Server error" });
  }
};
