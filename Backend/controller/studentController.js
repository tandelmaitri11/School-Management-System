const Student = require("../models/studentregister");
const Class = require("../models/class");
const StudentInfo = require("../models/studentinfo");
const Counter = require("../models/counter");

// ✅ Add Student (by teacher)
exports.addStudent = async (req, res) => {
  try {
    const { name, email, password, studentClass, teacherId } = req.body;

    // Check if teacher is assigned to the class
    const existingClass = await Class.findOne({
      className: studentClass,
      classTeacher: teacherId,
    });

    if (!existingClass) {
      return res.status(403).json({ message: "You are not assigned to this class!" });
    }

    // Check for duplicate email
    const existingStudent = await Student.findOne({ email });
    if (existingStudent) {
      return res.status(400).json({ message: "Email already registered!" });
    }

    // Create student
    const newStudent = new Student({
      name,
      email,
      password, // ⚠️ Hash before saving in production
      studentClass,
      teacherId,
    });

    await newStudent.save();

    res.status(201).json({
      message: "✅ Student added successfully!",
      student: newStudent,
    });
  } catch (error) {
    console.error("Error adding student:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Get all students grouped by class (for specific teacher)
exports.getStudentsByClass = async (req, res) => {
  try {
    const { teacherId } = req.params;

    const classes = await Class.find({ classTeacher: teacherId })
      .sort({ className: 1 })
      .populate("classTeacher", "name email");

    if (!classes.length) {
      return res.status(404).json({ message: "No classes found for this teacher" });
    }

    const result = [];

    for (const cls of classes) {
      const students = await Student.find({ studentClass: cls.className });

      result.push({
        className: cls.className,
        teacher: cls.classTeacher?.name || "N/A",
        totalStudents: students.length,
        students: students.map((s) => ({
          id: s._id,
          studentId: s.studentId,
          name: s.name,
          email: s.email,
        })),
      });
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Get students of a specific class (teacher’s class)
exports.getStudentsOfClass = async (req, res) => {
  try {
    const { teacherId, className } = req.params;

    const cls = await Class.findOne({ className, classTeacher: teacherId });
    if (!cls) {
      return res.status(403).json({ message: "You are not authorized for this class!" });
    }

    const students = await Student.find({ studentClass: className });
    res.status(200).json(students);
  } catch (error) {
    console.error("Error fetching class students:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Update student basic details
exports.updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedStudent = await Student.findByIdAndUpdate(id, updateData, { new: true });
    if (!updatedStudent) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.status(200).json({
      message: "Student updated successfully!",
      student: updatedStudent,
    });
  } catch (error) {
    console.error("Error updating student:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Get single student (basic + extra info)
exports.getStudentDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await Student.findById(id);
    if (!student) return res.status(404).json({ message: "Student not found!" });

    const info = await StudentInfo.findOne({ student: id });

    res.status(200).json({ student, info });
  } catch (error) {
    console.error("Error fetching student details:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Add or Update StudentInfo (extra details)
exports.updateStudentInfo = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const student = await Student.findById(id);
    if (!student) return res.status(404).json({ message: "Student not found!" });

    // ✅ Validate allowed gender & bloodGroup before saving
    const validGenders = ["Girl", "Boy", "Other"];
    const validBloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

    if (data.gender && !validGenders.includes(data.gender)) {
      return res.status(400).json({ message: "Invalid gender value!" });
    }

    if (data.bloodGroup && !validBloodGroups.includes(data.bloodGroup)) {
      return res.status(400).json({ message: "Invalid blood group value!" });
    }

    const updatedInfo = await StudentInfo.findOneAndUpdate(
      { student: id },
      { $set: data },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
      message: "Student info saved successfully!",
      info: updatedInfo,
    });
  } catch (error) {
    console.error("Error updating student info:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Get students by ClassId (for attendance)
exports.getStudentsByClassId = async (req, res) => {
  try {
    const { classId } = req.params;

    const cls = await Class.findById(classId);
    if (!cls) return res.status(404).json({ message: "Class not found!" });

    const students = await Student.find({ studentClass: cls.className });
    if (!students.length) return res.status(404).json({ message: "No students found for this class!" });

    res.status(200).json(students);
  } catch (error) {
    console.error("Error fetching students by classId:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Get all students grouped by class (for Admin only)
exports.getAllStudentsForAdmin = async (req, res) => {
  try {
    // Get all classes
    const classes = await Class.find({})
      .sort({ className: 1 })
      .populate("classTeacher", "name email");

    if (!classes.length) {
      return res.status(404).json({ message: "No classes found!" });
    }

    const result = [];

    for (const cls of classes) {
      // Find all students in that class
      const students = await Student.find({ studentClass: cls.className });

      result.push({
        className: cls.className,
        teacher: cls.classTeacher ? cls.classTeacher.name : "N/A",
        totalStudents: students.length,
        students: students.map((s) => ({
          id: s._id,
          studentId: s.studentId,
          name: s.name,
          email: s.email,
          class: s.studentClass,
        })),
      });
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching students for admin:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// controllers/studentController.js
exports.searchStudents = async (req, res) => {
  try {
    const { name } = req.query;
    const query = {};
    if (name) query.name = { $regex: name, $options: "i" };

    const students = await Student.find(query);
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};
