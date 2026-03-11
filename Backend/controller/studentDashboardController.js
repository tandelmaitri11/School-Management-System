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
const { className } = req.params;
const { studentId } = req.query;

if (!studentId) {
  return res.status(400).json({ message: "studentId is required" });
}

const student = await Student.findById(studentId).lean();
if (!student) return res.status(404).json({ message: "Student not found" });

const section = String(student.section || "").trim().toUpperCase();
const stream = String(student.stream || "").trim();
const subjectChoice = String(student.subjectChoice || "").trim();

const filters = [{ classAssigned: className }];
if (section) {
  filters.push({
    $or: [
      { sectionAssigned: "" },
      { sectionAssigned: { $exists: false } },
      { sectionAssigned: section },
    ],
  });
}
if (stream) {
  filters.push({
    $or: [
      { streamAssigned: "" },
      { streamAssigned: { $exists: false } },
      { streamAssigned: stream },
    ],
  });
}
if (subjectChoice) {
  filters.push({
    $or: [
      { subjectChoiceAssigned: "" },
      { subjectChoiceAssigned: { $exists: false } },
      { subjectChoiceAssigned: subjectChoice },
    ],
  });
}

const assignments = await Assignment.find({ $and: filters }).sort({ createdAt: -1 });
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

