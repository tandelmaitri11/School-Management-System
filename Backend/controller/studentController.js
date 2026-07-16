const Student = require("../models/studentregister");
const Class = require("../models/class");
const StudentInfo = require("../models/studentinfo");
const Counter = require("../models/counter");
const Timetable = require("../models/timetable");
const TeacherRegister = require("../models/techerregister");
const TeacherInfo = require("../models/teacherinfo");
const PROMOTION_TAG_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const clearExpiredPromotionTags = async () => {
  const cutoff = new Date(Date.now() - PROMOTION_TAG_TTL_MS);
  await Student.updateMany(
    {
      isNewPromotion: true,
      promotedAt: { $lt: cutoff },
    },
    {
      $set: {
        isNewPromotion: false,
        promotedAt: null,
      },
    }
  );
};

const getTeacherAssignmentScope = async (teacherMongoId) => {
  const teacher = await TeacherRegister.findById(teacherMongoId).lean();
  if (!teacher) return { teacherName: "", classes: [], assignedSections: [] };

  const info = await TeacherInfo.findOne({ regNumber: teacher.teacherId }).lean();
  if (!info || !Array.isArray(info.classes) || info.classes.length === 0) {
    return { teacherName: teacher.name || "", classes: [], assignedSections: [] };
  }

  const classes = await Class.find({ _id: { $in: info.classes } })
    .sort({ className: 1 })
    .lean();

  const classSet = new Set(classes.map((c) => String(c._id)));
  const assignedSections = (Array.isArray(info.assignedSections) ? info.assignedSections : [])
    .filter((x) => classSet.has(String(x?.classId || "")))
    .map((x) => ({
      classId: String(x?.classId || ""),
      section: String(x?.section || "").trim().toUpperCase(),
      stream: String(x?.stream || "").trim(),
    }))
    .filter((x) => x.classId && x.section);

  return { teacherName: teacher.name || "", classes, assignedSections };
};
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
    const { teacherName, classes, assignedSections } = await getTeacherAssignmentScope(teacherId);
    if (!classes.length) return res.status(200).json([]);

    const result = [];

    for (const cls of classes) {
      const allowedRows = assignedSections.filter((x) => String(x.classId) === String(cls._id));
      if (!allowedRows.length) {
        result.push({
          className: cls.className,
          teacher: teacherName || "N/A",
          totalStudents: 0,
          students: [],
        });
        continue;
      }

      const studentsRaw = await Student.find({
        isActive: { $ne: false },
        $or: [{ classId: cls._id }, { studentClass: cls.className }],
      });

      const students = studentsRaw.filter((s) => {
        const sSection = String(s.section || "").trim().toUpperCase();
        const sStream = String(s.stream || "").trim().toLowerCase();

        return allowedRows.some((row) => {
          const rowSection = String(row.section || "").trim().toUpperCase();
          const rowStream = String(row.stream || "").trim().toLowerCase();
          if (sSection !== rowSection) return false;
          if (!rowStream) return true;
          return sStream === rowStream;
        });
      });

      result.push({
        className: cls.className,
        teacher: teacherName || "N/A",
        totalStudents: students.length,
        students: students.map((s) => ({
          id: s._id,
          studentId: s.studentId,
          name: s.name,
          email: s.email,
          studentClass: s.studentClass || String(cls.className || ""),
          stream: s.stream || "",
          subjectChoice: s.subjectChoice || "",
          section: s.section || "",
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
    const { classes, assignedSections } = await getTeacherAssignmentScope(teacherId);
    const cls = classes.find((c) => String(c.className) === String(className));
    if (!cls) {
      return res.status(403).json({ message: "You are not authorized for this class!" });
    }

    const allowedRows = assignedSections.filter((x) => String(x.classId) === String(cls._id));
    if (!allowedRows.length) return res.status(200).json([]);

    const studentsRaw = await Student.find({
      isActive: { $ne: false },
      $or: [{ classId: cls._id }, { studentClass: cls.className }],
    });

    const students = studentsRaw.filter((s) => {
      const sSection = String(s.section || "").trim().toUpperCase();
      const sStream = String(s.stream || "").trim().toLowerCase();

      return allowedRows.some((row) => {
        const rowSection = String(row.section || "").trim().toUpperCase();
        const rowStream = String(row.stream || "").trim().toLowerCase();
        if (sSection !== rowSection) return false;
        if (!rowStream) return true;
        return sStream === rowStream;
      });
    });

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
    await clearExpiredPromotionTags();
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

    // Update Student (basic + academic) fields
    const studentPayload = {};
    const studentFields = ["name", "email", "studentClass", "section", "stream", "subjectChoice"];
    studentFields.forEach((key) => {
      if (data[key] !== undefined) studentPayload[key] = data[key];
    });

    if (studentPayload.studentClass !== undefined) {
      const cls = Number(studentPayload.studentClass);
      if (!Number.isInteger(cls) || cls < 1 || cls > 12) {
        return res.status(400).json({ message: "Invalid class value!" });
      }
      studentPayload.studentClass = cls;
    }
    if (studentPayload.section !== undefined) {
      studentPayload.section = String(studentPayload.section || "").trim().toUpperCase();
    }
    if (studentPayload.stream !== undefined) {
      studentPayload.stream = String(studentPayload.stream || "").trim();
    }
    if (studentPayload.subjectChoice !== undefined) {
      studentPayload.subjectChoice = String(studentPayload.subjectChoice || "").trim();
    }
    if (Object.keys(studentPayload).length) {
      await Student.findByIdAndUpdate(id, { $set: studentPayload }, { new: true, runValidators: true });
    }

    // StudentInfo-only fields
    const infoPayload = {};
    const infoFields = [
      "address",
      "gender",
      "dob",
      "bloodGroup",
      "cast",
      "fatherName",
      "fatherMobile",
      "fatherOccupation",
      "fatherIncome",
      "motherName",
      "motherMobile",
      "motherOccupation",
      "motherIncome",
    ];
    infoFields.forEach((key) => {
      if (data[key] !== undefined) infoPayload[key] = data[key];
    });

    if (infoPayload.dob !== undefined && infoPayload.dob !== "") {
      infoPayload.dob = new Date(infoPayload.dob);
    }

    // Validate allowed gender & bloodGroup before saving
    const validGenders = ["Girl", "Boy", "Other"];
    const validBloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

    if (infoPayload.gender && !validGenders.includes(infoPayload.gender)) {
      return res.status(400).json({ message: "Invalid gender value!" });
    }

    if (infoPayload.bloodGroup && !validBloodGroups.includes(infoPayload.bloodGroup)) {
      return res.status(400).json({ message: "Invalid blood group value!" });
    }

    let updatedInfo = null;
    if (Object.keys(infoPayload).length) {
      updatedInfo = await StudentInfo.findOneAndUpdate(
        { student: id },
        { $set: infoPayload },
        { new: true, upsert: true, runValidators: true }
      );
    }

    res.status(200).json({
      message: "Student info saved successfully!",
      student: await Student.findById(id),
      info: updatedInfo,
    });
  } catch (error) {
    console.error("Error updating student info:", error);
    res.status(500).json({ message: "Server error" });
  }
};
exports.getStudentsByClassId = async (req, res) => {
  try {
    const { classId } = req.params;

    const cls = await Class.findById(classId);
    if (!cls) return res.status(404).json({ message: "Class not found!" });

    const students = await Student.find({
      isActive: { $ne: false },
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
const normalizeUpper = (value) => String(value || "").trim().toUpperCase();

const pushSectionLog = async (studentId, data) => {
  await Student.updateOne(
    { _id: studentId },
    {
      $push: {
        sectionChangeLog: {
          fromClassId: data.fromClassId || null,
          fromClassName: Number(data.fromClassName || 0) || null,
          fromSection: normalizeUpper(data.fromSection || ""),
          toClassId: data.toClassId || null,
          toClassName: Number(data.toClassName || 0) || null,
          toSection: normalizeUpper(data.toSection || ""),
          fromAcademicYear: String(data.fromAcademicYear || "").trim(),
          toAcademicYear: String(data.toAcademicYear || "").trim(),
          action: data.action || "Changed",
          changedBy: data.changedBy || null,
          note: data.note || "",
          changedAt: new Date(),
        },
      },
    }
  );
};

const findSectionInClass = (cls, sectionValue) => {
  const sectionKey = normalizeUpper(sectionValue);
  const rawKey = String(sectionValue || "").trim();
  const section = (cls.sections || []).find(
    (item) => normalizeUpper(item?.name) === sectionKey || String(item?._id || "") === rawKey
  );
  if (!section) return { ok: false, message: "Section not found" };
  if (!section.isActive) return { ok: false, message: "Section is inactive" };
  if (section.isLocked) return { ok: false, message: "Section is locked" };
  return { ok: true, section };
};

const countStudentsInSection = async ({ classDoc, sectionName }) => {
  const safeSection = normalizeUpper(sectionName);
  const filters = [{ classId: classDoc._id, section: safeSection }];

  if (classDoc.academicYear) {
    filters.push({
      studentClass: classDoc.className,
      section: safeSection,
      academicYear: classDoc.academicYear,
    });
  } else {
    filters.push({ studentClass: classDoc.className, section: safeSection });
  }

  return Student.countDocuments({ $or: filters });
};

const getPlacementUpdate = ({ classDoc, sectionName, stream }) => ({
  classId: classDoc._id,
  studentClass: Number(classDoc.className),
  section: normalizeUpper(sectionName),
  academicYear: String(classDoc.academicYear || "").trim(),
  stream: String(stream ?? "").trim(),
  isNewPromotion: true,
  promotedAt: new Date(),
  completionStatus: "",
  completedAt: null,
});

const buildStudentQueryForClass = ({ classDoc, academicYear, studentIds }) => {
  const filters = [{ classId: classDoc._id }];

  if (academicYear || classDoc.academicYear) {
    filters.push({
      studentClass: classDoc.className,
      academicYear: String(academicYear || classDoc.academicYear || "").trim(),
    });
  } else {
    filters.push({ studentClass: classDoc.className });
  }

  const query = { $or: filters };
  if (Array.isArray(studentIds) && studentIds.length) {
    query._id = { $in: studentIds };
  }
  return query;
};

const getStudentsForPlacement = async ({ classDoc, academicYear, studentIds }) => {
  return Student.find({
    isActive: { $ne: false },
    ...buildStudentQueryForClass({ classDoc, academicYear, studentIds }),
  }).lean();
};

const allocateStudentsAcrossSections = async ({
  students,
  classDoc,
  sectionNames,
  rule = "even",
  genderBalanced = false,
  stream = "",
}) => {
  const sections = sectionNames
    .map((name) => findSectionInClass(classDoc, name))
    .filter((row) => row.ok)
    .map((row) => row.section);

  if (!sections.length) {
    return { ok: false, message: "No valid sections found" };
  }

  if (sections.some((section) => !section.isActive || section.isLocked)) {
    return { ok: false, message: "One or more sections are inactive or locked" };
  }

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
  for (const section of sections) {
    sectionCounts[section.name] = await countStudentsInSection({ classDoc, sectionName: section.name });
  }

  const allocations = {};
  sections.forEach((section) => {
    allocations[section.name] = [];
  });

  let secIndex = 0;
  for (const student of list) {
    let tries = 0;
    let assigned = false;
    while (tries < sections.length && !assigned) {
      const target = sections[secIndex % sections.length];
      if (sectionCounts[target.name] < Number(target.capacity || 0)) {
        allocations[target.name].push(student._id);
        sectionCounts[target.name] += 1;
        assigned = true;
      }
      secIndex += 1;
      tries += 1;
    }
    if (!assigned) {
      return { ok: false, message: `No seat available for student ${student.name || student.studentId || student._id}` };
    }
  }

  return {
    ok: true,
    allocations,
    update: getPlacementUpdate({
      classDoc,
      sectionName: "",
      stream,
    }),
  };
};

exports.getStudentsForAssignment = async (req, res) => {
  try {
    await clearExpiredPromotionTags();
    const { classId, academicYear } = req.query;
    if (!classId) {
      return res.status(400).json({ message: "classId is required" });
    }
    const cls = await Class.findById(classId).lean();
    if (!cls) {
      return res.status(404).json({ message: "Class not found" });
    }

    const students = await Student.find({
      isActive: { $ne: false },
      ...buildStudentQueryForClass({ classDoc: cls, academicYear }),
    })
      .select("_id studentId name email section academicYear studentClass classId stream");
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.assignStudentsManual = async (req, res) => {
  try {
    const { studentIds, classId, sectionId, section: requestedSection, academicYear, stream, note } = req.body;
    const targetSection = requestedSection || sectionId;

    if (!Array.isArray(studentIds) || !studentIds.length || !classId || !targetSection) {
      return res.status(400).json({ message: "studentIds, classId and section are required" });
    }

    const cls = await Class.findById(classId);
    if (!cls) return res.status(404).json({ message: "Class not found" });

    const guard = findSectionInClass(cls, targetSection);
    if (!guard.ok) return res.status(400).json({ message: guard.message });

    const section = guard.section;
    const currentCount = await countStudentsInSection({ classDoc: cls, sectionName: section.name });
    if (currentCount + studentIds.length > section.capacity) {
      return res.status(400).json({ message: "Section capacity exceeded" });
    }

    const studentsBefore = await Student.find({ _id: { $in: studentIds } })
      .select("_id classId studentClass section academicYear");

    const placement = getPlacementUpdate({
      classDoc: { ...cls.toObject(), academicYear: academicYear ?? cls.academicYear },
      sectionName: section.name,
      stream,
    });

    await Student.updateMany(
      { _id: { $in: studentIds } },
      { $set: placement }
    );

    await Promise.all(
      studentsBefore.map((s) =>
        pushSectionLog(s._id, {
          fromClassId: s.classId,
          fromClassName: s.studentClass,
          fromSection: s.section,
          fromAcademicYear: s.academicYear,
          toClassId: cls._id,
          toClassName: cls.className,
          toSection: section.name,
          toAcademicYear: placement.academicYear,
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
    const { classId, academicYear, sectionIds, sectionNames, studentIds, rule = "even", genderBalanced = false, stream, note } = req.body;
    const requestedSections = Array.isArray(sectionNames) && sectionNames.length ? sectionNames : sectionIds;

    if (!classId || !Array.isArray(requestedSections) || !requestedSections.length) {
      return res.status(400).json({ message: "classId and sectionNames are required" });
    }

    const cls = await Class.findById(classId);
    if (!cls) return res.status(404).json({ message: "Class not found" });

    const students = await getStudentsForPlacement({ classDoc: cls, academicYear, studentIds });
    if (!students.length) return res.status(404).json({ message: "No students found for this class/year" });

    const allocation = await allocateStudentsAcrossSections({
      students,
      classDoc: { ...cls.toObject(), academicYear: academicYear ?? cls.academicYear },
      sectionNames: requestedSections,
      rule,
      genderBalanced,
      stream,
    });
    if (!allocation.ok) return res.status(400).json({ message: allocation.message });

    for (const [sectionName, ids] of Object.entries(allocation.allocations)) {
      if (!ids.length) continue;
      const placement = getPlacementUpdate({
        classDoc: { ...cls.toObject(), academicYear: academicYear ?? cls.academicYear },
        sectionName,
        stream,
      });

      await Student.updateMany(
        { _id: { $in: ids } },
        { $set: placement }
      );
      await Promise.all(
        ids.map((id) =>
          pushSectionLog(id, {
            toClassId: cls._id,
            toClassName: cls.className,
            toSection: sectionName,
            toAcademicYear: placement.academicYear,
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
    const studentsBefore = await Student.find({ _id: { $in: studentIds } })
      .select("_id classId studentClass section academicYear stream isActive");
    if (!studentsBefore.length) {
      return res.status(404).json({ message: "No students found" });
    }

    const allClassTwelve = studentsBefore.every((student) => Number(student.studentClass) === 12);
    if (allClassTwelve) {
      await Student.updateMany(
        { _id: { $in: studentIds } },
        {
          $set: {
            isActive: false,
            isNewPromotion: false,
            promotedAt: null,
            completionStatus: "Completed Class 12",
            completedAt: new Date(),
          },
        }
      );

      await Promise.all(
        studentsBefore.map((student) =>
          pushSectionLog(student._id, {
            fromClassId: student.classId,
            fromClassName: student.studentClass,
            fromSection: student.section,
            fromAcademicYear: student.academicYear || fromAcademicYear,
            toClassId: null,
            toClassName: null,
            toSection: "",
            toAcademicYear: "",
            action: "Completed",
            changedBy: getUserId(req),
            note: note || "Completed Class 12 successfully",
          })
        )
      );

      return res.json({
        message: "Class 12 students completed successfully and were removed from the active student list.",
        count: studentIds.length,
        completed: true,
      });
    }

    if (!toClassId) {
      return res.status(400).json({ message: "toClassId is required" });
    }

    const targetClass = await Class.findById(toClassId);
    if (!targetClass) return res.status(404).json({ message: "Class not found" });

    if (assignmentMode === "auto") {
      const promotedStudents = studentsBefore.map((student) => ({
        ...student.toObject(),
        studentClass: Number(targetClass.className),
        academicYear: String(toAcademicYear || targetClass.academicYear || "").trim(),
      }));

      const allocation = await allocateStudentsAcrossSections({
        students: promotedStudents,
        classDoc: { ...targetClass.toObject(), academicYear: toAcademicYear ?? targetClass.academicYear },
        sectionNames: toSectionIds,
        rule,
        genderBalanced,
        stream,
      });
      if (!allocation.ok) return res.status(400).json({ message: allocation.message });

      for (const [sectionName, ids] of Object.entries(allocation.allocations)) {
        if (!ids.length) continue;
        const placement = getPlacementUpdate({
          classDoc: { ...targetClass.toObject(), academicYear: toAcademicYear ?? targetClass.academicYear },
          sectionName,
          stream,
        });

        await Student.updateMany({ _id: { $in: ids } }, { $set: placement });
      }

      await Promise.all(
        studentsBefore.map((student) => {
          const targetSection = Object.entries(allocation.allocations).find(([, ids]) =>
            ids.some((id) => String(id) === String(student._id))
          )?.[0];

          return pushSectionLog(student._id, {
            fromClassId: student.classId,
            fromClassName: student.studentClass,
            fromSection: student.section,
            fromAcademicYear: student.academicYear || fromAcademicYear,
            toClassId: targetClass._id,
            toClassName: targetClass.className,
            toSection: targetSection,
            toAcademicYear: String(toAcademicYear || targetClass.academicYear || "").trim(),
            action: "Promoted",
            changedBy: getUserId(req),
            note,
          });
        })
      );

      return res.json({ message: "Promotion completed", count: studentIds.length, allocations: allocation.allocations });
    }

    if (!toSectionId) return res.status(400).json({ message: "toSectionId required" });

    const guard = findSectionInClass(targetClass, toSectionId);
    if (!guard.ok) return res.status(400).json({ message: guard.message });

    const section = guard.section;
    const currentCount = await countStudentsInSection({ classDoc: targetClass, sectionName: section.name });
    if (currentCount + studentIds.length > section.capacity) {
      return res.status(400).json({ message: "Section capacity exceeded" });
    }

    const placement = getPlacementUpdate({
      classDoc: { ...targetClass.toObject(), academicYear: toAcademicYear ?? targetClass.academicYear },
      sectionName: section.name,
      stream,
    });

    await Student.updateMany(
      { _id: { $in: studentIds } },
      { $set: placement }
    );

    await Promise.all(
      studentsBefore.map((s) =>
        pushSectionLog(s._id, {
          fromClassId: s.classId,
          fromClassName: s.studentClass,
          fromSection: s.section,
          fromAcademicYear: s.academicYear || fromAcademicYear,
          toClassId: targetClass._id,
          toClassName: targetClass.className,
          toSection: section.name,
          toAcademicYear: placement.academicYear,
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
    await clearExpiredPromotionTags();
    // Get all classes
    const classes = await Class.find({})
      .sort({ className: 1 })
      .populate("classTeacher", "name email");

    if (!classes.length) {
      return res.status(404).json({ message: "No classes found!" });
    }

    const result = [];

    for (const cls of classes) {
      // Keep legacy and current student records compatible:
      // some records may have numeric studentClass, others string.
      const classValue = String(cls.className);
      const students = await Student.find({
        isActive: { $ne: false },
        $or: [{ studentClass: cls.className }, { studentClass: classValue }],
      }).sort({ name: 1 });

      result.push({
        className: cls.className,
        teacher: cls.classTeacher ? cls.classTeacher.name : "N/A",
        totalStudents: students.length,
        students: students.map((s) => ({
          id: s._id,
          studentId: s.studentId,
          name: s.name,
          email: s.email,
          studentClass: s.studentClass,
          section: s.section || "",
          stream: s.stream || "",
          subjectChoice: s.subjectChoice || "",
          isNewPromotion: !!s.isNewPromotion,
        })),
      });
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching students for admin:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getCompletedStudentsByBatch = async (req, res) => {
  try {
    await clearExpiredPromotionTags();
    const students = await Student.find({
      isActive: false,
      completionStatus: "Completed Class 12",
    })
      .sort({ academicYear: -1, completedAt: -1, name: 1 })
      .lean();

    const grouped = students.reduce((acc, student) => {
      const batch = String(student.academicYear || "").trim() || (
        student.completedAt ? new Date(student.completedAt).getFullYear().toString() : "Unknown Batch"
      );

      if (!acc[batch]) {
        acc[batch] = {
          batch,
          totalStudents: 0,
          students: [],
        };
      }

      acc[batch].students.push({
        id: student._id,
        studentId: student.studentId,
        name: student.name,
        email: student.email,
        studentClass: student.studentClass,
        section: student.section || "",
        stream: student.stream || "",
        academicYear: student.academicYear || "",
        completionStatus: student.completionStatus || "",
        completedAt: student.completedAt || null,
        isNewPromotion: !!student.isNewPromotion,
      });
      acc[batch].totalStudents += 1;
      return acc;
    }, {});

    const result = Object.values(grouped).sort((a, b) => String(b.batch).localeCompare(String(a.batch)));
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching completed students by batch:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// controllers/studentController.js
exports.searchStudents = async (req, res) => {
  try {
    await clearExpiredPromotionTags();
    const { name } = req.query;
    const query = {};
    if (name) query.name = { $regex: name, $options: "i" };

    const students = await Student.find({ isActive: { $ne: false }, ...query });
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.getTimetableForStudent = async (req, res) => {
  try {
    const { studentId } = req.params;

    // 1?? Student
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // 2?? Class
    const cls = await Class.findOne({ className: student.studentClass });
    if (!cls) {
      return res.status(404).json({ message: "Class not found" });
    }

    const dayAlias = {
      mon: "Monday",
      monday: "Monday",
      tue: "Tuesday",
      tues: "Tuesday",
      tuesday: "Tuesday",
      wed: "Wednesday",
      wednesday: "Wednesday",
      thu: "Thursday",
      thur: "Thursday",
      thurs: "Thursday",
      thursday: "Thursday",
      fri: "Friday",
      friday: "Friday",
      sat: "Saturday",
      saturday: "Saturday",
    };
    const normalizeDay = (d) => {
      const key = String(d || "").trim().toLowerCase();
      return dayAlias[key] || String(d || "").trim();
    };

    // 3?? Timetable docs (new model: one doc per class+section+stream, with days[].slots[])
    const docs = await Timetable.find({ classId: cls._id })
      .populate("days.slots.teacherId", "name")
      .populate("days.slots.options.teacherId", "name")
      .lean();

    if (!docs.length) {
      return res.status(404).json({ message: "No timetable found" });
    }

    const studentSection = String(student.section || "").trim().toUpperCase();
    const studentStream = String(student.stream || "").trim();
    const studentChoice = String(student.subjectChoice || "").trim();

    const flattened = [];
    docs.forEach((doc) => {
      const tSection = String(doc.section || "").trim().toUpperCase();
      const tStream = String(doc.stream || "").trim();

      const sectionOk = !tSection || tSection === studentSection;
      const streamOk = !tStream || tStream === studentStream;
      if (!(sectionOk && streamOk)) return;

      (doc.days || []).forEach((dayRow) => {
        const day = normalizeDay(dayRow.day);
        (dayRow.slots || []).forEach((slot) => {
          const options = Array.isArray(slot.options) ? slot.options : [];

          if (options.length > 0) {
            let chosen = null;
            if (studentChoice) {
              chosen = options.find((o) =>
                String(o.subjectChoice || "")
                  .toLowerCase()
                  .split(",")
                  .map((x) => x.trim())
                  .includes(studentChoice.toLowerCase())
              );
            }
            if (!chosen) chosen = options[0];
            if (!chosen) return;

            flattened.push({
              day,
              period: Number(slot.period),
              subject: chosen.subject || chosen.subjectChoice || slot.subject || "Optional",
              teacher: chosen.teacherId?.name || "N/A",
            });
            return;
          }

          const tChoice = String(slot.subjectChoice || "").trim();
          const choiceOk = !tChoice || tChoice === studentChoice;
          if (!choiceOk) return;
          if (!String(slot.subject || "").trim()) return;

          flattened.push({
            day,
            period: Number(slot.period),
            subject: slot.subject,
            teacher: slot.teacherId?.name || "N/A",
          });
        });
      });
    });

    // 4?? Format
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const periods = [1, 2, 3, 4, 5];

    const formatted = {};
    days.forEach((day) => {
      formatted[day] = [];
      periods.forEach((period) => {
        const entry = flattened.find((t) => t.day === day && t.period === period);

        formatted[day].push(
          entry
            ? { subject: entry.subject, teacher: entry.teacher }
            : { subject: "Free", teacher: "-" }
        );
      });
    });

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

