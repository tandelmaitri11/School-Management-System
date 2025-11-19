const Assignment = require("../models/assignment");
const Attendance = require("../models/attendance");
const Submission = require("../models/submission");
const Student = require("../models/studentregister");


exports.getProfile = async (req, res) => {
try {
const student = await Student.findById(req.params.studentId);
if (!student) return res.status(404).json({ message: "Student not found" });
res.json(student);
} catch (error) {
res.status(500).json({ message: "Server error" });
}
};


exports.getAssignments = async (req, res) => {
try {
const assignments = await Assignment.find({ classAssigned: req.params.className }).sort({ createdAt: -1 });
res.json(assignments);
} catch (error) {
res.status(500).json({ message: "Server error" });
}
};


exports.getAttendance = async (req, res) => {
try {
const attendanceRecords = await Attendance.find({ "attendance.studentId": req.params.studentId });
let presentDays = 0;
let absentDays = 0;


attendanceRecords.forEach((record) => {
const entry = record.attendance.find((a) => a.studentId.toString() === req.params.studentId);
if (entry?.status === "Present") presentDays++;
else absentDays++;
});


res.json({ presentDays, absentDays });
} catch (error) {
res.status(500).json({ message: "Server error" });
}
};


exports.getSubmissions = async (req, res) => {
try {
const submissions = await Submission.find({ studentId: req.params.studentId })
.populate("assignmentId")
.sort({ createdAt: -1 });
res.json(submissions);
} catch (error) {
res.status(500).json({ message: "Server error" });
}
};

