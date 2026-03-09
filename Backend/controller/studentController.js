const Student = require("../models/studentregister");
const Class = require("../models/class");
const StudentInfo = require("../models/studentinfo");
const Counter = require("../models/counter");
const Timetable = require("../models/timetable");
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

    const students = await Student.find({
      $or: [{ classId }, { studentClass: cls.className }],
    });
    if (!students.length) return res.status(404).json({ message: "No students found for this class!" });

    res.status(200).json(students);
  } catch (error) {
    console.error("Error fetching students by classId:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ==================== SECTION ASSIGNMENT & PROMOTION ==================== */
const getUserId = (req) => req.user?.id || null;

const pushSectionLog = async (studentId, data) => {
  await Student.updateOne(
    { _id: studentId },
    {
      $push: {
        sectionChangeLog: {
          fromClassId: data.fromClassId || null,
          fromSectionId: data.fromSectionId || null,
          toClassId: data.toClassId || null,
          toSectionId: data.toSectionId || null,
          action: data.action || "Changed",
          changedBy: data.changedBy || null,
          note: data.note || "",
          changedAt: new Date(),
        },
      },
    }
  );
};

const validateSection = (cls, sectionId) => {
  const section = cls.sections.id(sectionId);
  if (!section) return { ok: false, message: "Section not found" };
  if (!section.isActive) return { ok: false, message: "Section is inactive" };
  if (section.isLocked) return { ok: false, message: "Section is locked" };
  return { ok: true, section };
};

const countSectionStudents = async (classId, sectionId) => {
  return await Student.countDocuments({ classId, sectionId });
};

exports.getStudentsForAssignment = async (req, res) => {
  try {
    const { classId, academicYear } = req.query;
    if (!classId) {
      return res.status(400).json({ message: "classId is required" });
    }
    const query = { classId };
    if (academicYear) query.academicYear = academicYear;
    const students = await Student.find(query).select("_id studentId name email sectionId academicYear");
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.assignStudentsManual = async (req, res) => {
  try {
    const { studentIds, classId, sectionId, academicYear, stream, note } = req.body;
    if (!Array.isArray(studentIds) || !studentIds.length || !classId || !sectionId || !academicYear) {
      return res.status(400).json({ message: "studentIds, classId, sectionId, academicYear are required" });
    }

    const cls = await Class.findById(classId);
    if (!cls) return res.status(404).json({ message: "Class not found" });

    const guard = validateSection(cls, sectionId);
    if (!guard.ok) return res.status(400).json({ message: guard.message });

    const section = guard.section;
    const currentCount = await countSectionStudents(classId, sectionId);
    if (currentCount + studentIds.length > section.capacity) {
      return res.status(400).json({ message: "Section capacity exceeded" });
    }

    const studentsBefore = await Student.find({ _id: { $in: studentIds } }).select("_id classId sectionId");
    await Student.updateMany(
      { _id: { $in: studentIds } },
      { $set: { classId, sectionId, academicYear, stream: stream || "" } }
    );

    await Promise.all(
      studentsBefore.map((s) =>
        pushSectionLog(s._id, {
          fromClassId: s.classId,
          fromSectionId: s.sectionId,
          toClassId: classId,
          toSectionId: sectionId,
          action: "Assigned",
          changedBy: getUserId(req),
          note,
        })
      )
    );

    res.json({ message: "Students assigned" });
  } catch (err) {
    console.error("assignStudentsManual:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.assignStudentsBulk = async (req, res) => {
  try {
    return exports.assignStudentsManual(req, res);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

const sortStudents = (students, rule) => {
  const list = [...students];
  if (rule === "alphabetical") {
    return list.sort((a, b) => String(a.name).localeCompare(String(b.name)));
  }
  if (rule === "roll") {
    return list.sort((a, b) => String(a.rollNumber || a.studentId || "").localeCompare(String(b.rollNumber || b.studentId || "")));
  }
  return list;
};

exports.assignStudentsAuto = async (req, res) => {
  try {
    const { classId, academicYear, sectionIds, rule = "even", genderBalanced = false, stream, note } = req.body;
    if (!classId || !academicYear || !Array.isArray(sectionIds) || !sectionIds.length) {
      return res.status(400).json({ message: "classId, academicYear, sectionIds are required" });
    }

    const cls = await Class.findById(classId);
    if (!cls) return res.status(404).json({ message: "Class not found" });

    const sections = sectionIds.map((id) => cls.sections.id(id)).filter(Boolean);
    if (!sections.length) return res.status(404).json({ message: "No sections found" });
    if (sections.some((s) => !s.isActive || s.isLocked)) {
      return res.status(400).json({ message: "One or more sections are inactive or locked" });
    }

    const students = await Student.find({ classId, academicYear }).lean();
    if (!students.length) return res.status(404).json({ message: "No students found for this class/year" });

    const baseList = sortStudents(students, rule);

    let list = baseList;
    if (genderBalanced) {
      const infoDocs = await StudentInfo.find({ student: { $in: baseList.map((s) => s._id) } }).lean();
      const genderMap = new Map(infoDocs.map((i) => [String(i.student), i.gender]));
      const buckets = { Girl: [], Boy: [], Other: [], Unknown: [] };
      baseList.forEach((s) => {
        const g = genderMap.get(String(s._id)) || "Unknown";
        (buckets[g] || buckets.Unknown).push(s);
      });
      const order = ["Girl", "Boy", "Other", "Unknown"];
      const combined = [];
      let remaining = true;
      while (remaining) {
        remaining = false;
        for (const key of order) {
          if (buckets[key].length) {
            combined.push(buckets[key].shift());
            remaining = true;
          }
        }
      }
      list = combined;
    }

    const sectionCounts = {};
    for (const s of sections) {
      sectionCounts[s._id] = await countSectionStudents(classId, s._id);
    }

    const allocations = {};
    sections.forEach((s) => (allocations[s._id] = []));

    let secIndex = 0;
    for (const student of list) {
      let tries = 0;
      let assigned = false;
      while (tries < sections.length && !assigned) {
        const target = sections[secIndex % sections.length];
        if (sectionCounts[target._id] < target.capacity) {
          allocations[target._id].push(student._id);
          sectionCounts[target._id] += 1;
          assigned = true;
        }
        secIndex += 1;
        tries += 1;
      }
      if (!assigned) break;
    }

    for (const [sectionId, ids] of Object.entries(allocations)) {
      if (!ids.length) continue;
      await Student.updateMany(
        { _id: { $in: ids } },
        { $set: { classId, sectionId, academicYear, stream: stream || "" } }
      );
      await Promise.all(
        ids.map((id) =>
          pushSectionLog(id, {
            toClassId: classId,
            toSectionId: sectionId,
            action: "Assigned",
            changedBy: getUserId(req),
            note,
          })
        )
      );
    }

    res.json({ message: "Auto assignment completed", allocations });
  } catch (err) {
    console.error("assignStudentsAuto:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.promoteStudents = async (req, res) => {
  try {
    const {
      studentIds,
      fromAcademicYear,
      toAcademicYear,
      toClassId,
      toSectionId,
      toSectionIds,
      assignmentMode = "manual",
      rule = "even",
      genderBalanced = false,
      stream,
      note,
    } = req.body;

    if (!Array.isArray(studentIds) || !studentIds.length) {
      return res.status(400).json({ message: "studentIds are required" });
    }
    if (!fromAcademicYear || !toAcademicYear || !toClassId) {
      return res.status(400).json({ message: "fromAcademicYear, toAcademicYear, toClassId are required" });
    }

    if (assignmentMode === "auto") {
      req.body = {
        classId: toClassId,
        academicYear: toAcademicYear,
        sectionIds: toSectionIds,
        rule,
        genderBalanced,
        stream,
        note,
      };
      return exports.assignStudentsAuto(req, res);
    }

    if (!toSectionId) return res.status(400).json({ message: "toSectionId required" });

    const cls = await Class.findById(toClassId);
    if (!cls) return res.status(404).json({ message: "Class not found" });
    const guard = validateSection(cls, toSectionId);
    if (!guard.ok) return res.status(400).json({ message: guard.message });

    const section = guard.section;
    const currentCount = await countSectionStudents(toClassId, toSectionId);
    if (currentCount + studentIds.length > section.capacity) {
      return res.status(400).json({ message: "Section capacity exceeded" });
    }

    const studentsBefore = await Student.find({ _id: { $in: studentIds } }).select("_id classId sectionId");
    await Student.updateMany(
      { _id: { $in: studentIds } },
      { $set: { classId: toClassId, sectionId: toSectionId, academicYear: toAcademicYear, stream: stream || "" } }
    );

    await Promise.all(
      studentsBefore.map((s) =>
        pushSectionLog(s._id, {
          fromClassId: s.classId,
          fromSectionId: s.sectionId,
          toClassId,
          toSectionId,
          action: "Promoted",
          changedBy: getUserId(req),
          note,
        })
      )
    );

    res.json({ message: "Promotion completed", count: studentIds.length });
  } catch (err) {
    console.error("promoteStudents:", err);
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

exports.getTimetableForStudent = async (req, res) => {
  try {
    const { studentId } = req.params;

    // 1️⃣ Student
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // 2️⃣ Class
    const cls = await Class.findOne({ className: student.studentClass });
    if (!cls) {
      return res.status(404).json({ message: "Class not found" });
    }

    // 3️⃣ Timetable
    const timetable = await Timetable.find({ classId: cls._id })
      .populate("teacherId", "name")
      .sort({ day: 1, period: 1 });

    if (!timetable.length) {
      return res.status(404).json({ message: "No timetable found" });
    }

    // 4️⃣ Format
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const periods = [1, 2, 3, 4, 5];

    const formatted = {};
    days.forEach((day) => {
      formatted[day] = [];
      periods.forEach((period) => {
        const entry = timetable.find(
          (t) => t.day === day && t.period === period
        );

        formatted[day].push(
          entry
            ? {
                subject: entry.subject, // ✅ STRING
                teacher: entry.teacherId?.name || "N/A",
              }
            : {
                subject: "Free",
                teacher: "-",
              }
        );
      });
    });

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
