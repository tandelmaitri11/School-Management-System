const TeacherRegister = require("../models/techerregister"); // main registration table
const TeacherInfo = require("../models/teacherinfo"); // detailed info


const multer = require("multer");
const path = require("path");
const teacherinfo = require("../models/teacherinfo");
const Class = require("../models/class");
const Timetable = require("../models/timetable");
const Exam = require("../models/Exam"); 



// ✅ Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/teachers");
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });
// ➕ Add Teacher Info

const addTeacher = async (req, res) => {
  try {
    const {
      regNumber,
      mobile,
      salary,
      fatherName,
      gender,
      experience,
      education,
      address,
      bloodGroup,
      dob,
      joiningDate,
    } = req.body;

    // 🧾 Validation
    if (!regNumber)
      return res.status(400).json({ message: "Please select a teacher." });

    // 🔍 Find teacher in registration table
    const mainTeacher = await TeacherRegister.findOne({ teacherId: regNumber });
    if (!mainTeacher)
      return res
        .status(404)
        .json({ message: "Teacher not found in registration." });

    if (!mainTeacher.teacherId)
      return res
        .status(400)
        .json({ message: "Teacher ID missing in registration record." });

    // 🚫 Prevent duplicates
    const exists = await TeacherInfo.findOne({
      teacherId: mainTeacher.teacherId,
    });
    if (exists)
      return res.status(400).json({ message: "Teacher info already exists." });

    // 🖼️ Handle uploaded picture
    const picture = req.file ? `uploads/teachers/${req.file.filename}` : "";


    // 📝 Create teacher info document
    const teacherInfo = new TeacherInfo({
      teacherId: mainTeacher.teacherId, // ✅ FIXED: This was missing
      regNumber: mainTeacher.teacherId,
      teacherName: mainTeacher.name,
      email: mainTeacher.email,
      role: mainTeacher.role || "Teacher",
      mobile,
      salary,
      fatherName,
      gender,
      experience,
      education,
      address,
      bloodGroup,
      dob,
      joiningDate,
      picture,
    });

    // 💾 Save to DB
    await teacherInfo.save();

    res.status(201).json({
      message: "Teacher info added successfully!",
      teacherInfo,
    });
  } catch (error) {
    console.error("Error adding teacher info:", error);
    res.status(500).json({
      message: "Failed to add teacher info.",
      error: error.message,
    });
  }
};

// 📋 Get all teacher info
const getAllTeachers = async (req, res) => {
  try {
    const teachers = await TeacherInfo.find();
    res.status(200).json(teachers);
  } catch (error) {
    console.error("Error fetching teachers:", error);
    res.status(500).json({ message: "Failed to fetch teachers.", error: error.message });
  }
};

// 🔍 Get teacher info by regNumber
const getTeacherById = async (req, res) => {
  try {
    const { regNumber } = req.params;
    const teacher = await TeacherInfo.findOne({ regNumber });
    if (!teacher) return res.status(404).json({ message: "Teacher not found." });
    res.status(200).json(teacher);
  } catch (error) {
    console.error("Error fetching teacher info:", error);
    res.status(500).json({ message: "Failed to fetch teacher info.", error: error.message });
  }
};


// 🔍 Get teacher info by MongoDB _id
const getTeacherByMongoId = async (req, res) => {
  try {
    const { id } = req.params; // Mongo _id
    const teacher = await TeacherInfo.findById(id);
    if (!teacher) return res.status(404).json({ message: "Teacher not found." });
    res.status(200).json(teacher);
  } catch (error) {
    console.error("Error fetching teacher info:", error);
    res.status(500).json({ message: "Failed to fetch teacher info.", error: error.message });
  }
};

const getTeacherProfile = async (req, res) => {
  try {
    const teacherId = req.params.teacherId; // MongoDB _id from Teacher table
    if (!teacherId)
      return res.status(400).json({ message: "Teacher ID is required" });

    // 1️⃣ Fetch from TeacherRegister collection
    const teacher = await TeacherRegister.findById(teacherId);
    if (!teacher)
      return res.status(404).json({ message: "Teacher not found" });

    // 2️⃣ Fetch TeacherInfo using regNumber
    const teacherInfo = await TeacherInfo.findOne({ regNumber: teacher.teacherId });
    if (!teacherInfo)
      return res.status(404).json({ message: "Teacher info not found" });

    // 3️⃣ Fetch classes assigned to this teacher
    const classes = await Class.find({ classTeacher: teacher._id });

    // 4️⃣ Merge documents and add classes & subjects
    const mergedProfile = {
      _id: teacher._id,           // TeacherRegister _id
      teacherInfoId: teacherInfo._id,  // <-- add this
      teacherId: teacher.teacherId,
      teacherName: teacher.name || teacherInfo.teacherName,
      email: teacher.email || teacherInfo.email,
      role: teacher.role,
      mobile: teacherInfo.mobile,
      salary: teacherInfo.salary,
      fatherName: teacherInfo.fatherName,
      gender: teacherInfo.gender,
      experience: teacherInfo.experience,
      education: teacherInfo.education,
      address: teacherInfo.address,
      bloodGroup: teacherInfo.bloodGroup,
      dob: teacherInfo.dob,
      joiningDate: teacherInfo.joiningDate,
      picture: teacherInfo.picture,
      subjects: teacherInfo.subjects || [],
      classes: classes.map((cls) => cls._id),
    };


    res.status(200).json(mergedProfile);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
}
// ✏️ Update teacher info
// Update by regNumber
const updateTeacher = async (req, res) => {
  try {
    const { regNumber } = req.params;
    const updateData = req.body;

    // Store full path like "uploads/teachers/filename.jpg"
    if (req.file) updateData.picture = `uploads/teachers/${req.file.filename}`;

    // Prevent changing regNumber and role
    delete updateData.regNumber;
    delete updateData.role;

    const updated = await TeacherInfo.findOneAndUpdate({ regNumber }, updateData, { new: true });
    if (!updated) return res.status(404).json({ message: "Teacher not found." });

    res.status(200).json({ message: "Teacher info updated successfully!", teacher: updated });
  } catch (error) {
    console.error("Error updating teacher info:", error);
    res.status(500).json({ message: "Failed to update teacher info.", error: error.message });
  }
};

const updateTeacherByMongoId = async (req, res) => {
  try {
    const { id } = req.params; // TeacherInfo _id
    const updateData = req.body;

    // Handle file upload
    if (req.file) updateData.picture = `uploads/teachers/${req.file.filename}`;

    // Prevent changing regNumber and role
    delete updateData.regNumber;
    delete updateData.role;

    // Convert subjects from string to array if needed
    if (typeof updateData.subjects === "string") {
      updateData.subjects = updateData.subjects.split(",").map((s) => s.trim());
    }

    // Convert classes to array if it's a string (from FormData)
    if (updateData.classes && typeof updateData.classes === "string") {
      updateData.classes = JSON.parse(updateData.classes);
    }

    const updated = await TeacherInfo.findByIdAndUpdate(id, updateData, { new: true });

    if (!updated) return res.status(404).json({ message: "Teacher not found." });

    // Fetch full class objects for the updated classes
    const Class = require("../models/class");
    const classesFull = await Class.find({ _id: { $in: updated.classes } });

    res.status(200).json({
      message: "Teacher info updated successfully!",
      teacher: updated,
      classesFull,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update teacher info.", error: error.message });
  }
};



// 🗑️ Delete teacher info
const deleteTeacher = async (req, res) => {
  try {
    const { regNumber } = req.params;
    await TeacherInfo.findOneAndDelete({ regNumber });
    res.status(200).json({ message: "Teacher info deleted successfully." });
  } catch (error) {
    console.error("Error deleting teacher info:", error);
    res.status(500).json({ message: "Failed to delete teacher info.", error: error.message });
  }
};

const getTeacherRegister = async (req, res) => {
  try {
    const teachers = await TeacherRegister.find({});
    res.status(200).json(teachers);
  } catch (err) {
    console.error("Error fetching teacher register:", err);
    res.status(500).json({ message: "Failed to fetch teacher register." });
  }
};

const getTeacherTimetable = async (req, res) => {
  try {
    const { teacherId } = req.params;

    const entries = await Timetable.find({ teacherId })
      .populate("classId", "className")
      .sort({ day: 1, period: 1 });

    const periodTimes = [
      { period: 1, start: "09:00", end: "10:00" },
      { period: 2, start: "10:00", end: "11:00" },
      { period: 3, start: "11:15", end: "12:15" },
      { type: "break", start: "12:15", end: "14:00" },
      { period: 4, start: "14:00", end: "15:00" },
      { period: 5, start: "15:00", end: "16:00" },
    ];

    const result = entries.map((e) => {
      const time = periodTimes.find((p) => p.period === e.period);

      return {
        day: e.day,
        period: e.period,
        time: time ? `${time.start} - ${time.end}` : "N/A",
        className: e.classId.className,
        subject: e.subject,
      };
    });

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

const getMyExams = async (req, res) => {
  try {
    const { teacherId } = req.params;

    const exams = await Exam.find({ teacherId })
      .populate({
        path: "classId",
        select: "className" 
      })
      .populate({
        path: "subjectId",
        select: "subjectName" 
      })
      .sort({ createdAt: -1 });

    console.log("Exams with populated data:", exams); 
    res.status(200).json(exams);
  } catch (error) {
    res.status(500).json({ message: "Error fetching exams", error: error.message });
  }
};

// 🗑️ Delete an exam
const deleteExam = async (req, res) => {
  try {
    const { id } = req.params; // Exam MongoDB _id
    const deleted = await Exam.findByIdAndDelete(id);
    
    if (!deleted) {
      return res.status(404).json({ message: "Exam not found." });
    }

    res.status(200).json({ message: "Exam deleted successfully." });
  } catch (error) {
    console.error("Error deleting exam:", error);
    res.status(500).json({ message: "Failed to delete exam.", error: error.message });
  }
};

module.exports = {
  addTeacher,
  getAllTeachers,
  getTeacherById,
  getTeacherByMongoId,
  getTeacherProfile,
  updateTeacher,
  updateTeacherByMongoId,
  deleteTeacher,
  getTeacherRegister,
  getTeacherTimetable,
  getMyExams,
  deleteExam
};
