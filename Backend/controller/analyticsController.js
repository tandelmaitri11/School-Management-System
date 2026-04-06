const Student = require("../models/studentregister");
const Attendance = require("../models/attendance");
const Submission = require("../models/submission");

// 🎓 STUDENT AI ANALYSIS
exports.getStudentAnalysis = async (req, res) => {
  try {
    const studentId = req.params.id;

    const student = await Student.findById(studentId);

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // ✅ FIXED ATTENDANCE QUERY
    const attendanceRecords = await Attendance.find({
      "attendance.studentId": studentId
    });

    let totalDays = 0;
    let presentDays = 0;

    attendanceRecords.forEach(record => {
      const studentEntry = record.attendance.find(
        a => a.studentId.toString() === studentId
      );

      if (studentEntry) {
        totalDays++;
        if (studentEntry.status === "Present") presentDays++;
      }
    });

    const attendancePercentage =
      totalDays === 0 ? 0 : (presentDays / totalDays) * 100;

    // ✅ USING SUBMISSION AS PERFORMANCE (since no marks model)
    const submissions = await Submission.find({ studentId });

    const totalAssignments = submissions.length;
    const graded = submissions.filter(s => s.grade !== null);

    const performanceScore =
      totalAssignments === 0
        ? 0
        : (graded.length / totalAssignments) * 100;

    // 🤖 AI LOGIC
    let performance = "Average";
    let risk = "Low";
    let suggestion = "Keep improving.";

    if (performanceScore >= 80 && attendancePercentage >= 85) {
      performance = "Excellent";
      suggestion = "Outstanding work!";
    } 
    else if (performanceScore < 40 || attendancePercentage < 60) {
      performance = "Poor";
      risk = "High";
      suggestion = "Immediate improvement required.";
    } 
    else if (performanceScore < 60) {
      performance = "Below Average";
      risk = "Medium";
      suggestion = "Focus more on assignments.";
    }

    // ADD inside getStudentAnalysis

// 🤖 PASS / FAIL PREDICTION
let prediction = "Pass";
if (performanceScore < 40 || attendancePercentage < 50) {
  prediction = "Fail";
}

// 📊 SUBJECT WEAKNESS (using assignmentId as subject)
const subjectMap = {};

submissions.forEach(s => {
  const key = s.assignmentId.toString();

  if (!subjectMap[key]) subjectMap[key] = [];

  subjectMap[key].push(s.grade ? parseInt(s.grade) || 0 : 0);
});

const weakSubjects = [];

Object.keys(subjectMap).forEach(sub => {
  const avg =
    subjectMap[sub].reduce((a, b) => a + b, 0) /
    subjectMap[sub].length;

  if (avg < 40) {
    weakSubjects.push(sub);
  }
});

// 🔔 ALERTS
let alerts = [];

if (attendancePercentage < 60) {
  alerts.push("Low Attendance");
}

if (performanceScore < 40) {
  alerts.push("Low Performance");
}

    res.json({
      student,
      attendancePercentage,
      performanceScore,
      performance,
       prediction,         
  weakSubjects,        
  alerts,
      risk,
      suggestion,
      trend: submissions.map(s => ({
        assignment: s.assignmentId,
        grade: s.grade ? parseInt(s.grade) || 0 : 0
      }))
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};
exports.getTeacherAnalysis = async (req, res) => {
  try {
    const students = await Student.find();

    const data = await Promise.all(
      students.map(async (s) => {
        const submissions = await Submission.find({ studentId: s._id });

        const total = submissions.length;
        const graded = submissions.filter(s => s.grade !== null).length;

        const score = total === 0 ? 0 : (graded / total) * 100;

        return {
          name: s.name,
          performance: score
        };
      })
    );

    res.json(data);

  } catch (err) {
    res.status(500).json({ message: "Error" });
  }
};
exports.getAdminAnalysis = async (req, res) => {
  try {
    const { studentClass, section, search } = req.query;

    let filter = {};

    if (studentClass) filter.studentClass = Number(studentClass);
    if (section) filter.section = section.toUpperCase();
    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }

    const students = await Student.find(filter);

    const studentIds = students.map(s => s._id);

    const attendanceRecords = await Attendance.find({
      "attendance.studentId": { $in: studentIds }
    });

    const submissions = await Submission.find({
      studentId: { $in: studentIds }
    });

    // ⚠️ Risk students
    let riskStudents = 0;

    const performanceMap = {};
    const attendanceMap = {};

    for (let s of students) {
      const subs = submissions.filter(x => x.studentId.toString() === s._id.toString());
      const total = subs.length;
      const graded = subs.filter(x => x.grade !== null).length;

      const score = total ? (graded / total) * 100 : 0;

      if (score < 40) riskStudents++;

      // 📊 class performance
      if (!performanceMap[s.studentClass]) {
        performanceMap[s.studentClass] = [];
      }
      performanceMap[s.studentClass].push(score);
    }

    // 📊 Convert to chart data
    const classPerformance = Object.keys(performanceMap).map(cls => {
      const arr = performanceMap[cls];
      const avg = arr.reduce((a, b) => a + b, 0) / arr.length;

      return {
        class: `Class ${cls}`,
        performance: avg
      };
    });

    // 📈 Attendance graph (simple count per day)
    const attendanceTrend = attendanceRecords.map(a => ({
      date: a.date,
      count: a.attendance.length
    }));
    // ADD inside getAdminAnalysis

let failPredictionCount = 0;

for (let s of students) {
  const subs = submissions.filter(x => 
    x.studentId.toString() === s._id.toString()
  );

  const total = subs.length;
  const graded = subs.filter(x => x.grade !== null).length;

  const score = total ? (graded / total) * 100 : 0;

  if (score < 40) {
    failPredictionCount++;
  }
}


    res.json({
      totalStudents: students.length,
      totalAttendance: attendanceRecords.length,
      totalSubmissions: submissions.length,
      riskStudents,
      failPredictionCount,
      classPerformance,
      attendanceTrend
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error" });
  }
};