const Class = require("../models/class");
const Teacher = require("../models/techerregister");
const Subject = require("../models/subject");
const Student = require("../models/studentregister"); 
const StudentInfo = require("../models/studentinfo");


// Add new class
const addClass = async (req, res) => {
  try {
    let { className, classTeacher } = req.body;
    className = parseInt(className, 10);

    if (!className || !classTeacher)
      return res.status(400).json({ message: "All fields are required" });

    if (className < 1 || className > 12)
      return res.status(400).json({ message: "Class must be a number between 1-12" });

    const existingClass = await Class.findOne({ className });
    if (existingClass)
      return res.status(400).json({ message: "Class already exists" });

    // Check teacher exists
    const teacherExists = await Teacher.findById(classTeacher);
    if (!teacherExists) return res.status(404).json({ message: "Teacher not found" });

    const newClass = new Class({ className, classTeacher });
    await newClass.save();

    res.status(201).json({ message: "Class added successfully", class: newClass });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all classes with teacher name populated
const getClass = async (req, res) => {
  try {
    const classes = await Class.find().populate("classTeacher", "name");
    res.status(200).json(classes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
const getClassesByTeacher = async (req, res) => {
  try {
    const { teacherId } = req.params;
    

    if (!teacherId) return res.status(400).json({ message: "Teacher ID required" });

    const classes = await Class.find({ classTeacher: teacherId });

    if (!classes || classes.length === 0) {
      return res.status(404).json({ message: "No classes found for this teacher" });
    }

    res.json(classes); // send array of classes
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

const getSubjectClasses = async (req, res) => {
  try {
    const { teacherId } = req.params;

    if (!teacherId) {
      return res.status(400).json({ message: "Teacher ID required" });
    }

    // ✅ Fetch classes of that teacher (sorted ascending)
    const classes = await Class.find({ classTeacher: teacherId })
      .sort({ className: 1 })
      .populate("classTeacher", "name email");

    if (!classes || classes.length === 0) {
      return res.status(404).json({ message: "No classes found for this teacher" });
    }

    // ✅ Get all class numbers (like 8, 9, 10)
    const classNumbers = classes.map((cls) => cls.className);

    // ✅ Fetch subjects belonging to those classes
    const subjects = await Subject.find({ className: { $in: classNumbers } });

    // ✅ Merge subjects into each class
    const mergedData = classes.map((cls) => {
      const classSubjects = subjects.find((s) => s.className === cls.className);
      return {
        ...cls.toObject(),
        subjects: classSubjects ? classSubjects.subjects : [],
      };
    });

    res.json(mergedData);
  } catch (err) {
    console.error("Error fetching classes:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Get total students, girls, boys, others for a specific class
const getClassTotals = async (req, res) => {
  try {
    const classId = req.params.id; // class ID from route

    // 1️⃣ Find the class
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({ message: "Class not found" });
    }

    // 2️⃣ Get all students in this class
    const students = await Student.find({ studentClass: classDoc.className });
    const studentIds = students.map((s) => s._id);

    // 3️⃣ Count gender from StudentInfo
    const genderCounts = await StudentInfo.aggregate([
      { $match: { student: { $in: studentIds } } },
      { $group: { _id: "$gender", count: { $sum: 1 } } },
    ]);

    // 4️⃣ Format totals
    const totals = {
      totalStudents: students.length,
      totalGirls: genderCounts.find((g) => g._id === "Girl")?.count || 0,
      totalBoys: genderCounts.find((g) => g._id === "Boy")?.count || 0,
      totalOther: genderCounts.find((g) => g._id === "Other")?.count || 0,
    };

    res.json(totals);
  } catch (err) {
    console.error("Error fetching class totals:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Update class
const updateClass = async (req, res) => {
  try {
    if (req.body.className) req.body.className = parseInt(req.body.className, 10);
    const updated = await Class.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate("classTeacher", "name");
    if (!updated) return res.status(404).json({ message: "Class not found" });

    res.status(200).json({ message: "Class updated successfully", class: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete class
const deleteClass = async (req, res) => {
  try {
    await Class.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Class deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all teachers
const getTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.find({}, "name"); // only fetch name
    res.status(200).json(teachers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch teachers" });
  }
};



module.exports = { addClass, getClass,getClassesByTeacher, getSubjectClasses,getClassTotals ,updateClass, deleteClass, getTeachers };
