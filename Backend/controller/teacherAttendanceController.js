const mongoose = require("mongoose");
const TeacherAttendance = require("../models/teacherAttendance");
const Teachers = require("../models/techerregister");

// Mark teacher attendance for a date
exports.markTeacherAttendance = async (req, res) => {
  try {
    const { date, attendance } = req.body;
    const markedBy = req.user?.id || req.body.markedBy || null;

    if (!date || !attendance || !Array.isArray(attendance)) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // normalize date to YYYY-MM-DD
    const formatted = new Date(date);
    if (isNaN(formatted)) {
      return res.status(400).json({ message: "Invalid date format" });
    }
    const normalizedDate = formatted.toISOString().split("T")[0];

    // Prevent duplicate per date
    const existing = await TeacherAttendance.findOne({ date: normalizedDate });
    if (existing) {
      return res.status(400).json({ message: "Attendance already marked for this date" });
    }

    // Basic validation of attendance entries
    const cleanedAttendance = attendance.map((a) => ({
      teacherId: a.teacherId,
      status: a.status === "Present" ? "Present" : "Absent",
    }));

    const newRecord = new TeacherAttendance({
      date: normalizedDate,
      markedBy,
      attendance: cleanedAttendance,
    });

    await newRecord.save();

    res.status(201).json({ message: "Teacher attendance saved", record: newRecord });
  } catch (err) {
    console.error("❌ Error marking teacher attendance:", err);
    // handle unique index duplicate error in case of race
    if (err.code === 11000) {
      return res.status(400).json({ message: "Attendance already marked for this date" });
    }
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Get attendance record for a given date
exports.getAttendanceByDate = async (req, res) => {
  try {
    const { date } = req.params;
    const formatted = new Date(date);
    if (isNaN(formatted)) {
      return res.status(400).json({ message: "Invalid date format" });
    }
    const normalizedDate = formatted.toISOString().split("T")[0];

    const record = await TeacherAttendance.findOne({ date: normalizedDate })
      .populate("attendance.teacherId", "name teacherId email")
      .populate("markedBy", "name email");

    if (!record) {
      return res.status(404).json({ message: "No attendance found for this date" });
    }

    res.status(200).json(record);
  } catch (err) {
    console.error("❌ Error fetching teacher attendance by date:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Get attendance entries for a particular teacher
exports.getAttendanceByTeacher = async (req, res) => {
  try {
    const { teacherId } = req.params;
    if (!teacherId || !mongoose.Types.ObjectId.isValid(teacherId)) {
      return res.status(400).json({ message: "Invalid teacher id" });
    }

    const records = await TeacherAttendance.find({ "attendance.teacherId": teacherId })
      .sort({ date: -1 });

    // Map to per-day entry showing status for that teacher
    const teacherRecords = records.flatMap((rec) => {
      const entry = rec.attendance.find((a) => a.teacherId.toString() === teacherId);
      if (!entry) return [];
      return [{ date: rec.date, status: entry.status }];
    });

    res.status(200).json(teacherRecords);
  } catch (err) {
    console.error("❌ Error fetching teacher attendance:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Get all teacher attendance documents (list)
exports.getAllTeacherAttendance = async (req, res) => {
  try {
    const records = await TeacherAttendance.find()
      .sort({ date: -1 })
      .populate("attendance.teacherId", "name teacherId email");
    res.status(200).json(records);
  } catch (err) {
    console.error("❌ Error fetching all teacher attendance:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getalltecaher = async (req, res) => {
  try {
    const teachers = await Teachers.find().select("name email teacherId");
    res.json(teachers);
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
};

