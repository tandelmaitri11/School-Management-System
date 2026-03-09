const Class = require("../models/class");
const Teacher = require("../models/techerregister");
const Subject = require("../models/subject");
const Student = require("../models/studentregister");
const StudentInfo = require("../models/studentinfo");

// ---------------- HELPERS ----------------
const toClassNumber = (val) => {
  const n = parseInt(val, 10);
  if (!Number.isInteger(n) || n < 1 || n > 12) return null;
  return n;
};

const isValidSectionName = (name) => /^[A-Z]{1}$/.test(String(name || "").trim().toUpperCase());

const normalizeStreams = (streams) => {
  if (!Array.isArray(streams)) return [];
  return streams
    .map((s) => (typeof s === "string" ? { name: s } : s))
    .filter((s) => s && s.name)
    .map((s) => ({
      name: String(s.name).trim(),
      isActive: typeof s.isActive === "boolean" ? s.isActive : true,
      subjectOptions: Array.isArray(s.subjectOptions)
        ? s.subjectOptions.map((x) => String(x).trim()).filter(Boolean)
        : [],
    }));
};

const normalizeSections = (sections) => {
  if (!Array.isArray(sections)) return [];

  const safe = [];
  for (const s of sections) {
    if (!s || !s.name) continue;

    const name = String(s.name).trim().toUpperCase();
    if (!isValidSectionName(name)) continue;

    const cap = Number(s.capacity || 40);
    if (!cap || cap < 1) continue;

    safe.push({
      name,
      capacity: cap,
      isActive: typeof s.isActive === "boolean" ? s.isActive : true,
      isLocked: typeof s.isLocked === "boolean" ? s.isLocked : false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
  return safe;
};

// ---------------- CONTROLLERS ----------------
// ✅ Get registration options by class
const getRegistrationOptionsByClass = async (req, res) => {
  try {
    const classNum = Number(req.params.className);
    if (!Number.isInteger(classNum) || classNum < 1 || classNum > 12) {
      return res.status(400).json({ message: "Invalid class number" });
    }

    const cls = await Class.findOne({ className: classNum }).sort({ createdAt: -1 });
    if (!cls) return res.status(404).json({ message: "Class not found" });

    // ✅ count students per section
    const counts = await Student.aggregate([
      { $match: { studentClass: classNum } },
      { $group: { _id: "$section", used: { $sum: 1 } } },
    ]);

    const usedMap = {};
    counts.forEach((c) => (usedMap[String(c._id || "").toUpperCase()] = c.used));

    const sections = (cls.sections || [])
      .filter((s) => s?.isActive !== false)
      .map((s) => {
        const secName = String(s.name || "").toUpperCase();
        const cap = Number(s.capacity || 40);
        const used = usedMap[secName] || 0;
        const remaining = Math.max(0, cap - used);

        return {
          name: secName,
          capacity: cap,
          used,
          remaining,
          isLocked: !!s.isLocked,
          isActive: s.isActive !== false,
          stream: String(s.stream || "").trim(), // "Science" or "" (general)
        };
      });

    const streams = (cls.streams || [])
      .filter((s) => s?.isActive !== false)
      .map((s) => ({
        name: s.name,
        subjectOptions: Array.isArray(s.subjectOptions) ? s.subjectOptions : [],
      }));

    res.json({
      className: cls.className,
      academicYear: cls.academicYear || "",
      isSenior: cls.className >= 11,
      streams,
      sections,
    });
  } catch (err) {
    console.error("getRegistrationOptionsByClass error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Preview auto-assigned section for registration
const getRegistrationPreviewByClass = async (req, res) => {
  try {
    const classNum = Number(req.params.className);
    if (!Number.isInteger(classNum) || classNum < 1 || classNum > 12) {
      return res.status(400).json({ message: "Invalid class number" });
    }

    const cls = await Class.findOne({ className: classNum }).sort({ createdAt: -1 });
    if (!cls) return res.status(404).json({ message: "Class not found" });

    const isSenior = classNum >= 11;
    const activeStreams = (cls.streams || []).filter((s) => s?.isActive !== false);
    const streamRequired = isSenior && activeStreams.length > 0;
    const streamName = String(req.query.stream || "").trim();

    if (streamRequired && !streamName) {
      return res.json({
        className: cls.className,
        isSenior,
        streamRequired,
        assignedSection: "",
        reason: "STREAM_REQUIRED",
      });
    }

    if (streamName && activeStreams.length > 0) {
      const streamDoc = activeStreams.find(
        (st) => String(st.name).toLowerCase() === streamName.toLowerCase()
      );
      if (!streamDoc) {
        return res.json({
          className: cls.className,
          isSenior,
          streamRequired,
          assignedSection: "",
          reason: "INVALID_STREAM",
        });
      }
    }

    const allSections = (cls.sections || [])
      .filter((s) => s?.isActive !== false && !s.isLocked)
      .map((s) => ({
        name: String(s.name || "").toUpperCase(),
        capacity: Number(s.capacity || 40),
        stream: String(s.stream || "").trim(),
      }))
      .filter((s) => s.name && s.capacity > 0);

    if (!allSections.length) {
      return res.json({
        className: cls.className,
        isSenior,
        streamRequired,
        assignedSection: "",
        reason: "NO_ACTIVE_SECTIONS",
      });
    }

    let candidates = allSections;
    if (isSenior && streamName) {
      const matched = allSections.filter(
        (s) => s.stream && s.stream.toLowerCase() === streamName.toLowerCase()
      );
      candidates = matched.length ? matched : allSections.filter((s) => !s.stream);
    } else {
      const general = allSections.filter((s) => !s.stream);
      candidates = general.length ? general : allSections;
    }

    candidates.sort((a, b) => a.name.localeCompare(b.name));

    let chosen = "";
    for (const sec of candidates) {
      const used = await Student.countDocuments({ studentClass: classNum, section: sec.name });
      if (used < sec.capacity) {
        chosen = sec.name;
        break;
      }
    }

    if (!chosen) {
      return res.json({
        className: cls.className,
        isSenior,
        streamRequired,
        assignedSection: "",
        reason: "SECTIONS_FULL",
      });
    }

    return res.json({
      className: cls.className,
      isSenior,
      streamRequired,
      assignedSection: chosen,
      reason: "OK",
    });
  } catch (err) {
    console.error("getRegistrationPreviewByClass error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


// ✅ Add new class
const addClass = async (req, res) => {
  try {
    let { className, classTeacher, academicYear, sections, streams } = req.body;

    const classNum = toClassNumber(className);
    if (!classNum || !classTeacher) {
      return res.status(400).json({ message: "Class name and class teacher are required" });
    }

    const teacherExists = await Teacher.findById(classTeacher);
    if (!teacherExists) return res.status(404).json({ message: "Teacher not found" });

    const safeAcademicYear = String(academicYear || "").trim();

    const existing = await Class.findOne({ className: classNum, academicYear: safeAcademicYear });
    if (existing) return res.status(400).json({ message: "Class already exists for this academic year" });

    const safeStreams = normalizeStreams(streams);
    const safeSections = normalizeSections(sections);

    // Recommended rule: for 11-12 must have streams
    if (classNum >= 11 && safeStreams.length === 0) {
      return res.status(400).json({ message: "For class 11-12, streams are required." });
    }

    // Sections common: must have at least one section
    if (safeSections.length === 0) {
      return res.status(400).json({ message: "Please add at least 1 section (A-Z) with capacity." });
    }

    // Ensure no duplicate section letters in payload
    const dupCheck = new Set();
    for (const s of safeSections) {
      if (dupCheck.has(s.name)) {
        return res.status(400).json({ message: `Duplicate section "${s.name}" not allowed.` });
      }
      dupCheck.add(s.name);
    }

    const newClass = await Class.create({
      className: classNum,
      classTeacher,
      academicYear: safeAcademicYear,
      streams: safeStreams,
      sections: safeSections,
    });

    res.status(201).json({ message: "Class added successfully", class: newClass });
  } catch (err) {
    console.error("addClass error:", err);
    if (err?.code === 11000) {
      return res.status(400).json({ message: "Class already exists for this academic year" });
    }
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Get all classes
const getClass = async (req, res) => {
  try {
    const classes = await Class.find().sort({ className: 1 }).populate("classTeacher", "name");
    res.status(200).json(classes);
  } catch (err) {
    console.error("getClass error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const getClassesByTeacher = async (req, res) => {
  try {
    const { teacherId } = req.params;
    if (!teacherId) return res.status(400).json({ message: "Teacher ID required" });

    const classes = await Class.find({ classTeacher: teacherId }).sort({ className: 1 });
    if (!classes || classes.length === 0) return res.status(404).json({ message: "No classes found for this teacher" });

    res.json(classes);
  } catch (err) {
    console.error("getClassesByTeacher error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const getSubjectClasses = async (req, res) => {
  try {
    const { teacherId } = req.params;
    if (!teacherId) return res.status(400).json({ message: "Teacher ID required" });

    const classes = await Class.find({ classTeacher: teacherId })
      .sort({ className: 1 })
      .populate("classTeacher", "name email");

    if (!classes || classes.length === 0) return res.status(404).json({ message: "No classes found for this teacher" });

    const classNumbers = classes.map((cls) => cls.className);
    const subjects = await Subject.find({ className: { $in: classNumbers } });

    const mergedData = classes.map((cls) => {
      const classSubjects = subjects.find((s) => s.className === cls.className);
      return { ...cls.toObject(), subjects: classSubjects ? classSubjects.subjects : [] };
    });

    res.json(mergedData);
  } catch (err) {
    console.error("getSubjectClasses error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Get totals
const getClassTotals = async (req, res) => {
  try {
    const classId = req.params.id;
    const classDoc = await Class.findById(classId);
    if (!classDoc) return res.status(404).json({ message: "Class not found" });

    const students = await Student.find({ studentClass: classDoc.className });
    const studentIds = students.map((s) => s._id);

    const genderCounts = await StudentInfo.aggregate([
      { $match: { student: { $in: studentIds } } },
      { $group: { _id: "$gender", count: { $sum: 1 } } },
    ]);

    res.json({
      totalStudents: students.length,
      totalGirls: genderCounts.find((g) => g._id === "Girl")?.count || 0,
      totalBoys: genderCounts.find((g) => g._id === "Boy")?.count || 0,
      totalOther: genderCounts.find((g) => g._id === "Other")?.count || 0,
    });
  } catch (err) {
    console.error("getClassTotals error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Update class
const updateClass = async (req, res) => {
  try {
    const existing = await Class.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: "Class not found" });

    if (req.body.className !== undefined) {
      const classNum = toClassNumber(req.body.className);
      if (!classNum) return res.status(400).json({ message: "Class must be 1-12" });
      req.body.className = classNum;
    }

    if (req.body.academicYear !== undefined) {
      req.body.academicYear = String(req.body.academicYear || "").trim();
    }

    if (req.body.streams !== undefined) req.body.streams = normalizeStreams(req.body.streams);
    if (req.body.sections !== undefined) req.body.sections = normalizeSections(req.body.sections);

    // If updating sections, ensure no duplicates
    const finalSections = req.body.sections ?? existing.sections;
    const dup = new Set();
    for (const s of finalSections || []) {
      const name = String(s.name || "").toUpperCase();
      if (dup.has(name)) return res.status(400).json({ message: `Duplicate section "${name}" not allowed.` });
      dup.add(name);
    }

    const updated = await Class.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("classTeacher", "name");

    res.status(200).json({ message: "Class updated successfully", class: updated });
  } catch (err) {
    console.error("updateClass error:", err);
    if (err?.code === 11000) {
      return res.status(400).json({ message: "Class already exists for this academic year" });
    }
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Add section (COMMON)
const addSection = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, capacity = 40, isActive = true, isLocked = false } = req.body;

    const cls = await Class.findById(id);
    if (!cls) return res.status(404).json({ message: "Class not found" });

    const secName = String(name || "").trim().toUpperCase();
    const cap = Number(capacity);

    if (!isValidSectionName(secName)) return res.status(400).json({ message: "Section must be a single letter (A-Z)" });
    if (!cap || cap < 1) return res.status(400).json({ message: "Capacity must be a valid number" });

    const exists = cls.sections?.some((s) => String(s.name).toUpperCase() === secName);
    if (exists) return res.status(400).json({ message: "Section already exists" });

    cls.sections.push({
      name: secName,
      capacity: cap,
      isActive: !!isActive,
      isLocked: !!isLocked,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await cls.save();
    res.status(201).json({ message: "Section added", class: cls });
  } catch (err) {
    console.error("addSection error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Update a section
const updateSection = async (req, res) => {
  try {
    const { id, sectionId } = req.params;

    const cls = await Class.findById(id);
    if (!cls) return res.status(404).json({ message: "Class not found" });

    const section = cls.sections.id(sectionId);
    if (!section) return res.status(404).json({ message: "Section not found" });

    if (req.body.name !== undefined) {
      const newName = String(req.body.name || "").trim().toUpperCase();
      if (!isValidSectionName(newName)) return res.status(400).json({ message: "Section must be A-Z (single letter)" });

      // prevent duplicate on rename
      const exists = cls.sections.some((s) => s._id.toString() !== sectionId && String(s.name).toUpperCase() === newName);
      if (exists) return res.status(400).json({ message: "Section already exists" });

      section.name = newName;
    }

    if (req.body.capacity !== undefined) {
      const cap = Number(req.body.capacity);
      if (!cap || cap < 1) return res.status(400).json({ message: "Capacity must be valid" });
      section.capacity = cap;
    }

    if (req.body.isActive !== undefined) section.isActive = !!req.body.isActive;
    if (req.body.isLocked !== undefined) section.isLocked = !!req.body.isLocked;

    section.updatedAt = new Date();
    await cls.save();

    res.json({ message: "Section updated", class: cls });
  } catch (err) {
    console.error("updateSection error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Lock/unlock section
const lockSection = async (req, res) => {
  try {
    const { id, sectionId } = req.params;
    const { lock = true } = req.body;

    const cls = await Class.findById(id);
    if (!cls) return res.status(404).json({ message: "Class not found" });

    const section = cls.sections.id(sectionId);
    if (!section) return res.status(404).json({ message: "Section not found" });

    section.isLocked = !!lock;
    section.updatedAt = new Date();
    await cls.save();

    res.json({ message: lock ? "Section locked" : "Section unlocked", class: cls });
  } catch (err) {
    console.error("lockSection error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ AUTO GENERATE sections (COMMON A–Z / range)
const autoGenerateSections = async (req, res) => {
  try {
    const { id } = req.params;
    let { from = "A", to = "Z", capacity = 40 } = req.body;

    const cls = await Class.findById(id);
    if (!cls) return res.status(404).json({ message: "Class not found" });

    const start = String(from || "").trim().toUpperCase();
    const end = String(to || "").trim().toUpperCase();
    const cap = Number(capacity);

    if (!isValidSectionName(start) || !isValidSectionName(end)) {
      return res.status(400).json({ message: "from/to must be single letters A-Z" });
    }
    if (start.charCodeAt(0) > end.charCodeAt(0)) {
      return res.status(400).json({ message: "from must be <= to" });
    }
    if (!cap || cap < 1) return res.status(400).json({ message: "Capacity must be valid" });

    const existing = new Set((cls.sections || []).map((s) => String(s.name).toUpperCase()));
    const toAdd = [];

    for (let code = start.charCodeAt(0); code <= end.charCodeAt(0); code++) {
      const letter = String.fromCharCode(code);
      if (!existing.has(letter)) {
        toAdd.push({
          name: letter,
          capacity: cap,
          isActive: true,
          isLocked: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    if (toAdd.length === 0) return res.status(200).json({ message: "No new sections to add", class: cls });

    cls.sections.push(...toAdd);
    await cls.save();

    res.status(201).json({ message: `Added ${toAdd.length} sections`, class: cls });
  } catch (err) {
    console.error("autoGenerateSections error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Delete class
const deleteClass = async (req, res) => {
  try {
    const deleted = await Class.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Class not found" });
    res.status(200).json({ message: "Class deleted successfully" });
  } catch (err) {
    console.error("deleteClass error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Get teachers
const getTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.find({}, "name");
    res.status(200).json(teachers);
  } catch (err) {
    console.error("getTeachers error:", err);
    res.status(500).json({ message: "Failed to fetch teachers" });
  }
};

module.exports = {
  getRegistrationOptionsByClass,
  getRegistrationPreviewByClass,
  addClass,
  getClass,
  getClassesByTeacher,
  getSubjectClasses,
  getClassTotals,
  updateClass,
  deleteClass,
  getTeachers,

  addSection,
  updateSection,
  lockSection,
  autoGenerateSections,
};
