const LmsCourse = require("../models/lmsCourse");
const LmsChapter = require("../models/lmsChapter");
const LmsMaterial = require("../models/lmsMaterial");
const LmsProgress = require("../models/lmsProgress");
const Student = require("../models/studentregister");
const Class = require("../models/class");
const TeacherRegister = require("../models/techerregister");
const TeacherInfo = require("../models/teacherinfo");

const normalizeClass = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};
const normalize = (value) => String(value || "").trim();
const normalizeUpper = (value) => normalize(value).toUpperCase();
const normalizeLower = (value) => normalize(value).toLowerCase();

const ensureTeacherOwnsCourse = async (courseId, teacherId) => {
  const course = await LmsCourse.findById(courseId);
  if (!course) return { error: "Course not found" };
  if (course.teacherId !== teacherId) return { error: "Not allowed" };
  return { course };
};

exports.createCourse = async (req, res) => {
  try {
    const { title, description, subject, classAssigned, section, stream = "" } = req.body;
    const teacherId = req.user?.teacherId || req.body.teacherId;

    if (!title || !subject || !classAssigned || !section || !teacherId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const classNum = normalizeClass(classAssigned);
    if (classNum === null) {
      return res.status(400).json({ message: "Invalid class value" });
    }
    const safeSection = normalizeUpper(section);
    if (!safeSection) {
      return res.status(400).json({ message: "Section is required" });
    }

    const course = await LmsCourse.create({
      title,
      description,
      subject,
      classAssigned: classNum,
      section: safeSection,
      stream: normalize(stream),
      teacherId,
    });

    res.status(201).json({ message: "Course created", course });
  } catch (error) {
    console.error("Error creating course:", error);
    res.status(500).json({ message: "Error creating course", error });
  }
};

exports.getTeacherCourses = async (req, res) => {
  try {
    const teacherId = req.user?.teacherId || req.params.teacherId;
    if (!teacherId) return res.status(400).json({ message: "Teacher ID required" });

    const courses = await LmsCourse.find({ teacherId }).sort({ createdAt: -1 });
    res.status(200).json(courses);
  } catch (error) {
    res.status(500).json({ message: "Error fetching courses", error });
  }
};

exports.updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const teacherId = req.user?.teacherId;
    const updates = req.body;

    const { course, error } = await ensureTeacherOwnsCourse(id, teacherId);
    if (error) return res.status(403).json({ message: error });

    if (updates.classAssigned) {
      const classNum = normalizeClass(updates.classAssigned);
      if (classNum === null) {
        return res.status(400).json({ message: "Invalid class value" });
      }
      updates.classAssigned = classNum;
    }
    if (updates.section !== undefined) {
      const safeSection = normalizeUpper(updates.section);
      if (!safeSection) {
        return res.status(400).json({ message: "Section is required" });
      }
      updates.section = safeSection;
    }
    if (updates.stream !== undefined) {
      updates.stream = normalize(updates.stream);
    }

    Object.assign(course, updates);
    await course.save();
    res.status(200).json({ message: "Course updated", course });
  } catch (error) {
    res.status(500).json({ message: "Error updating course", error });
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const teacherId = req.user?.teacherId;

    const { course, error } = await ensureTeacherOwnsCourse(id, teacherId);
    if (error) return res.status(403).json({ message: error });

    await LmsMaterial.deleteMany({ courseId: course._id });
    await LmsProgress.deleteMany({ courseId: course._id });
    await LmsChapter.deleteMany({ courseId: course._id });
    await course.deleteOne();

    res.status(200).json({ message: "Course deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting course", error });
  }
};

exports.createChapter = async (req, res) => {
  try {
    const { courseId, title, order, description, topics } = req.body;
    const teacherId = req.user?.teacherId;

    if (!courseId || !title) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const { error } = await ensureTeacherOwnsCourse(courseId, teacherId);
    if (error) return res.status(403).json({ message: error });

    const normalizedTopics = Array.isArray(topics)
      ? topics
      : typeof topics === "string" && topics.trim()
      ? topics.split(",").map((t) => t.trim()).filter(Boolean)
      : [];

    const chapter = await LmsChapter.create({
      courseId,
      title,
      order: Number(order) || 0,
      description,
      topics: normalizedTopics,
    });

    res.status(201).json({ message: "Chapter created", chapter });
  } catch (error) {
    res.status(500).json({ message: "Error creating chapter", error });
  }
};

exports.updateChapter = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, order, topics } = req.body;
    const teacherId = req.user?.teacherId;

    const chapter = await LmsChapter.findById(id);
    if (!chapter) return res.status(404).json({ message: "Chapter not found" });

    const { error } = await ensureTeacherOwnsCourse(chapter.courseId, teacherId);
    if (error) return res.status(403).json({ message: error });

    const normalizedTopics = Array.isArray(topics)
      ? topics
      : typeof topics === "string" && topics.trim()
      ? topics.split(",").map((t) => t.trim()).filter(Boolean)
      : [];

    if (title !== undefined) chapter.title = title;
    if (description !== undefined) chapter.description = description;
    if (order !== undefined) chapter.order = Number(order) || 0;
    if (topics !== undefined) chapter.topics = normalizedTopics;
    await chapter.save();

    res.status(200).json({ message: "Chapter updated", chapter });
  } catch (error) {
    res.status(500).json({ message: "Error updating chapter", error });
  }
};

exports.getChaptersByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const chapters = await LmsChapter.find({ courseId }).sort({ order: 1 });
    res.status(200).json(chapters);
  } catch (error) {
    res.status(500).json({ message: "Error fetching chapters", error });
  }
};

exports.createMaterial = async (req, res) => {
  try {
    const { courseId, chapterId, title, type, externalUrl, duration, assignmentId, topic, order } = req.body;
    const teacherId = req.user?.teacherId;
    const file = req.file ? req.file.path : "";

    if (!courseId || !chapterId || !title || !type) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (!file && !externalUrl) {
      return res.status(400).json({ message: "File or external URL required" });
    }

    const { error } = await ensureTeacherOwnsCourse(courseId, teacherId);
    if (error) return res.status(403).json({ message: error });

    const chapter = await LmsChapter.findById(chapterId);
    if (!chapter || String(chapter.courseId) !== String(courseId)) {
      return res.status(400).json({ message: "Invalid chapter" });
    }

    if (topic && Array.isArray(chapter.topics) && chapter.topics.length > 0) {
      if (!chapter.topics.includes(topic)) {
        return res.status(400).json({ message: "Topic not found in chapter" });
      }
    }

    let orderValue = Number(order);
    if (!Number.isFinite(orderValue)) {
      const last = await LmsMaterial.find({ chapterId })
        .sort({ order: -1 })
        .limit(1)
        .select("order");
      orderValue = last.length ? (last[0].order || 0) + 1 : 1;
    }

    const material = await LmsMaterial.create({
      courseId,
      chapterId,
      title,
      type,
      file,
      externalUrl,
      duration: Number(duration) || 0,
      topic: topic || "",
      order: orderValue,
      assignmentId: assignmentId || null,
    });

    res.status(201).json({ message: "Material added", material });
  } catch (error) {
    console.error("Error creating material:", error);
    res.status(500).json({ message: "Error creating material", error });
  }
};

exports.getMaterialsByChapter = async (req, res) => {
  try {
    const { chapterId } = req.params;
    const materials = await LmsMaterial.find({ chapterId }).sort({ order: 1, createdAt: 1 });
    res.status(200).json(materials);
  } catch (error) {
    res.status(500).json({ message: "Error fetching materials", error });
  }
};

exports.updateMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, type, externalUrl, duration, assignmentId, topic, order } = req.body;
    const teacherId = req.user?.teacherId;

    const material = await LmsMaterial.findById(id);
    if (!material) return res.status(404).json({ message: "Material not found" });

    const { error } = await ensureTeacherOwnsCourse(material.courseId, teacherId);
    if (error) return res.status(403).json({ message: error });

    if (title !== undefined) material.title = title;
    if (type !== undefined) material.type = type;
    if (externalUrl !== undefined) material.externalUrl = externalUrl;
    if (duration !== undefined) material.duration = Number(duration) || 0;
    if (assignmentId !== undefined) material.assignmentId = assignmentId || null;
    if (topic !== undefined) material.topic = topic || "";
    if (order !== undefined) material.order = Number(order) || 0;

    await material.save();
    res.status(200).json({ message: "Material updated", material });
  } catch (error) {
    res.status(500).json({ message: "Error updating material", error });
  }
};

exports.deleteMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const teacherId = req.user?.teacherId;

    const material = await LmsMaterial.findById(id);
    if (!material) return res.status(404).json({ message: "Material not found" });

    const { error } = await ensureTeacherOwnsCourse(material.courseId, teacherId);
    if (error) return res.status(403).json({ message: error });

    await LmsProgress.deleteMany({ materialId: material._id });
    await material.deleteOne();
    res.status(200).json({ message: "Material deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting material", error });
  }
};

exports.getStudentCourses = async (req, res) => {
  try {
    const student = await Student.findById(req.user?.id)
      .select("studentClass section stream subjectChoice")
      .lean();

    const classAssigned = normalizeClass(
      student?.studentClass || req.user?.className || req.query.classAssigned
    );
    if (classAssigned === null) {
      return res.status(400).json({ message: "Class required" });
    }

    const section = normalizeUpper(student?.section || req.query.section);
    const stream = normalize(student?.stream || req.query.stream);
    const subjectChoice = normalize(student?.subjectChoice || req.query.subjectChoice);

    const query = { classAssigned };
    if (section) {
      query.$or = [{ section }, { section: "ALL" }, { section: { $in: ["", null] } }];
    }
    if (stream) {
      query.$and = [{ $or: [{ stream }, { stream: { $in: ["", null] } }] }];
    }

    let courses = await LmsCourse.find(query).sort({ createdAt: -1 }).lean();

    if (stream) {
      const classDoc = await Class.findOne({ className: classAssigned }).select("streams").lean();
      const streamDoc = (classDoc?.streams || []).find(
        (s) => normalizeLower(s?.name) === normalizeLower(stream)
      );

      const optionalSubjects = (streamDoc?.subjectOptions || [])
        .map((s) => normalizeLower(s))
        .filter(Boolean);

      if (optionalSubjects.length > 0) {
        const optionalSet = new Set(optionalSubjects);
        const chosen = normalizeLower(subjectChoice);

        courses = courses.filter((course) => {
          const courseSubject = normalizeLower(course?.subject);
          if (!courseSubject || !optionalSet.has(courseSubject)) return true;
          if (!chosen) return false;
          return courseSubject === chosen;
        });
      }
    }

    res.status(200).json(courses);
  } catch (error) {
    res.status(500).json({ message: "Error fetching courses", error });
  }
};

exports.getCourseContent = async (req, res) => {
  try {
    const { courseId } = req.params;
    const chapters = await LmsChapter.find({ courseId }).sort({ order: 1 });
    const chapterIds = chapters.map((c) => c._id);
    const materials = await LmsMaterial.find({ chapterId: { $in: chapterIds } }).sort({
      order: 1,
      createdAt: 1,
    });

    const materialsByChapter = materials.reduce((acc, item) => {
      const key = String(item.chapterId);
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});

    const content = chapters.map((chapter) => ({
      ...chapter.toObject(),
      materials: materialsByChapter[String(chapter._id)] || [],
    }));

    res.status(200).json({ chapters: content });
  } catch (error) {
    res.status(500).json({ message: "Error fetching content", error });
  }
};

exports.markMaterialCompleted = async (req, res) => {
  try {
    const { materialId, studentId } = req.body;
    if (!materialId || !studentId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const material = await LmsMaterial.findById(materialId);
    if (!material) return res.status(404).json({ message: "Material not found" });

    const existing = await LmsProgress.findOne({ studentId, materialId });
    if (existing) {
      existing.progressPct = Math.max(existing.progressPct || 0, 100);
      existing.watchedSeconds = existing.watchedSeconds || 0;
      if (!existing.completedAt) existing.completedAt = new Date();
      await existing.save();
      return res.status(200).json({ message: "Already completed", progress: existing });
    }

    const progress = await LmsProgress.create({
      studentId,
      courseId: material.courseId,
      materialId,
      progressPct: 100,
    });

    res.status(201).json({ message: "Progress saved", progress });
  } catch (error) {
    res.status(500).json({ message: "Error saving progress", error });
  }
};

exports.updateMaterialProgress = async (req, res) => {
  try {
    const { materialId, studentId, progressPct, watchedSeconds } = req.body;
    if (!materialId || !studentId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const material = await LmsMaterial.findById(materialId);
    if (!material) return res.status(404).json({ message: "Material not found" });

    const pct = Math.max(0, Math.min(100, Number(progressPct) || 0));
    const watched = Math.max(0, Number(watchedSeconds) || 0);

    const progress = await LmsProgress.findOneAndUpdate(
      { studentId, materialId },
      {
        $set: {
          courseId: material.courseId,
          materialId,
          progressPct: pct,
          watchedSeconds: watched,
        },
        $setOnInsert: { studentId },
      },
      { new: true, upsert: true }
    );

    if (pct >= 100) {
      progress.progressPct = 100;
      if (!progress.completedAt) progress.completedAt = new Date();
      await progress.save();
    }

    res.status(200).json({ message: "Progress updated", progress });
  } catch (error) {
    res.status(500).json({ message: "Error updating progress", error });
  }
};

exports.getStudentProgress = async (req, res) => {
  try {
    const { studentId, courseId } = req.params;
    if (!studentId || !courseId) {
      return res.status(400).json({ message: "Student and course required" });
    }

    const materials = await LmsMaterial.find({ courseId }).select("_id topic type");
    const materialIds = materials.map((m) => m._id);
    const completed = await LmsProgress.find({
      studentId,
      courseId,
      materialId: { $in: materialIds },
      progressPct: { $gte: 100 },
    });

    const total = materialIds.length;
    const completedCount = completed.length;
    const completionPct = total ? Math.round((completedCount / total) * 100) : 0;

    const topicsMap = materials.reduce((acc, m) => {
      if (!m.topic) return acc;
      const key = m.topic.trim();
      if (!key) return acc;
      if (!acc[key]) acc[key] = [];
      acc[key].push(String(m._id));
      return acc;
    }, {});

    const completedSet = new Set(completed.map((c) => String(c.materialId)));
    const topicNames = Object.keys(topicsMap);
    const completedTopics = topicNames.filter((topic) =>
      topicsMap[topic].every((id) => completedSet.has(id))
    );
    const totalTopics = topicNames.length;
    const topicCompletionPct = totalTopics
      ? Math.round((completedTopics.length / totalTopics) * 100)
      : completionPct;

    const noteIds = materials.filter((m) => m.type === "note").map((m) => String(m._id));
    const totalNotes = noteIds.length;
    const completedNotesCount = noteIds.filter((id) => completedSet.has(id)).length;

    const allProgress = await LmsProgress.find({ studentId, courseId }).select("materialId progressPct watchedSeconds").lean();
    const materialProgress = allProgress.reduce((acc, item) => {
      acc[String(item.materialId)] = {
        progressPct: item.progressPct || 0,
        watchedSeconds: item.watchedSeconds || 0,
      };
      return acc;
    }, {});

    res.status(200).json({
      totalMaterials: total,
      completedMaterials: completedCount,
      completionPct,
      totalTopics,
      completedTopicsCount: completedTopics.length,
      completedTopics,
      topicCompletionPct,
      totalNotes,
      completedNotesCount,
      completedMaterialIds: completed.map((c) => String(c.materialId)),
      materialProgress,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching progress", error });
  }
};

const buildProgressRows = async (courses, students) => {
  const courseIds = courses.map((c) => c._id);
  const materials = await LmsMaterial.find({ courseId: { $in: courseIds } }).select("_id courseId topic type");
  const progress = await LmsProgress.find({ courseId: { $in: courseIds } }).lean();

  const totalByCourse = materials.reduce((acc, m) => {
    const key = String(m.courseId);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const notesByCourse = materials.reduce((acc, m) => {
    if (m.type !== "note") return acc;
    const key = String(m.courseId);
    if (!acc[key]) acc[key] = [];
    acc[key].push(String(m._id));
    return acc;
  }, {});

  const topicsByCourse = materials.reduce((acc, m) => {
    if (!m.topic) return acc;
    const topic = String(m.topic).trim();
    if (!topic) return acc;
    const courseKey = String(m.courseId);
    if (!acc[courseKey]) acc[courseKey] = {};
    if (!acc[courseKey][topic]) acc[courseKey][topic] = [];
    acc[courseKey][topic].push(String(m._id));
    return acc;
  }, {});

  const completedByStudentCourse = {};
  const progressPctByStudentCourse = {};
  const lastCompletedAt = {};

  progress.forEach((p) => {
    const progressKey = `${String(p.studentId)}:${String(p.courseId)}`;
    if (!progressPctByStudentCourse[progressKey]) progressPctByStudentCourse[progressKey] = {};
    progressPctByStudentCourse[progressKey][String(p.materialId)] = Math.max(
      progressPctByStudentCourse[progressKey][String(p.materialId)] || 0,
      p.progressPct || 0
    );

    const isCompleted = (p.progressPct ?? 0) >= 70 || p.completedAt;
    if (!isCompleted) return;
    
    const key = `${String(p.studentId)}:${String(p.courseId)}`;
    if (!completedByStudentCourse[key]) completedByStudentCourse[key] = new Set();
    completedByStudentCourse[key].add(String(p.materialId));
    const prev = lastCompletedAt[key];
    if (!prev || new Date(p.completedAt) > new Date(prev)) {
      lastCompletedAt[key] = p.completedAt;
    }
  });

  const studentById = students.reduce((acc, s) => {
    acc[String(s._id)] = s;
    return acc;
  }, {});

  const courseById = courses.reduce((acc, c) => {
    acc[String(c._id)] = c;
    return acc;
  }, {});

  const rows = [];
  courses.forEach((course) => {
    const total = totalByCourse[String(course._id)] || 0;
    students.forEach((student) => {
      const key = `${String(student._id)}:${String(course._id)}`;
      const completedSet = completedByStudentCourse[key] || new Set();
      const completedCount = completedSet.size;
      const completionPct = total ? Math.round((completedCount / total) * 100) : 0;
      const progressMap = progressPctByStudentCourse[key] || {};
      const avgProgressPct = total
        ? Math.round(
            Object.values(progressMap).reduce((sum, pct) => sum + (pct || 0), 0) / total
          )
        : 0;

      const courseTopics = topicsByCourse[String(course._id)] || {};
      const topicNames = Object.keys(courseTopics);
      const totalTopics = topicNames.length;
      const completedTopicsCount = totalTopics
        ? topicNames.filter((topic) =>
            courseTopics[topic].every((id) => completedSet.has(id))
          ).length
        : 0;
      const topicCompletionPct = totalTopics
        ? Math.round((completedTopicsCount / totalTopics) * 100)
        : 0;

      const noteIds = notesByCourse[String(course._id)] || [];
      const totalNotes = noteIds.length;
      const completedNotesCount = noteIds.filter((id) => completedSet.has(id)).length;

      if (total === 0 && completedCount === 0) return;

      rows.push({
        studentId: student.studentId || String(student._id),
        studentName: student.name,
        studentEmail: student.email,
        studentClass: student.studentClass,
        courseId: String(course._id),
        courseTitle: course.title,
        subject: course.subject,
        completionPct: totalTopics ? topicCompletionPct : completionPct,
        avgProgressPct,
        completedMaterials: completedCount,
        totalMaterials: total,
        totalTopics,
        completedTopicsCount,
        topicCompletionPct,
        totalNotes,
        completedNotesCount,
        lastCompletedAt: lastCompletedAt[key] || null,
      });
    });
  });

  return rows;
};

exports.getTeacherProgressSanity = async (req, res) => {
  try {
    const teacherId = req.user?.teacherId;
    if (!teacherId) {
      return res.status(400).json({ message: "Teacher ID is required" });
    }

    let teacherInfo = await TeacherInfo.findOne({ regNumber: teacherId })
      .select("classes assignedSections")
      .lean();

    if (!teacherInfo) {
      teacherInfo = await TeacherInfo.findOne({ _id: teacherId })
        .select("classes assignedSections")
        .lean();
    }

    if (!teacherInfo) {
      return res.status(404).json({ message: "Teacher info not found" });
    }

    const assignedClasses = Array.isArray(teacherInfo.classes)
      ? teacherInfo.classes.map((c) => String(c))
      : [];

    const assignedSections = Array.isArray(teacherInfo.assignedSections)
      ? teacherInfo.assignedSections.filter((s) => assignedClasses.includes(String(s.classId)))
      : [];

    if (assignedClasses.length === 0 || assignedSections.length === 0) {
      return res.status(200).json([]);
    }

    const courses = await LmsCourse.find({ teacherId }).lean();
    if (courses.length === 0) {
      return res.status(200).json([]);
    }

    const courseIds = courses.map((course) => course._id);
    const progressRows = await LmsProgress.find({ courseId: { $in: courseIds } })
      .populate({ path: "courseId", select: "title subject classAssigned section stream" })
      .lean();

    const studentIds = [...new Set(progressRows.map((row) => String(row.studentId)))];
    const students = await Student.find({ _id: { $in: studentIds } })
      .select("_id studentId name email studentClass section stream")
      .lean();
      
    const studentMap = students.reduce((acc, student) => {
      acc[String(student._id)] = student;
      return acc;
    }, {});

    const sanityData = progressRows.map((row) => ({
      studentId: studentMap[String(row.studentId)]?.studentId || String(row.studentId),
      studentName: studentMap[String(row.studentId)]?.name || "-",
      studentEmail: studentMap[String(row.studentId)]?.email || "-",
      courseId: row.courseId?._id || "-",
      courseTitle: row.courseId?.title || "-",
      subject: row.courseId?.subject || "-",
      classAssigned: row.courseId?.classAssigned || "-",
      section: row.courseId?.section || "-",
      stream: row.courseId?.stream || "-",
      materialId: row.materialId,
      progressPct: row.progressPct,
      watchedSeconds: row.watchedSeconds,
      completedAt: row.completedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));

    res.status(200).json(sanityData);
  } catch (error) {
    console.error("Error fetching teacher progress sanity:", error);
    res.status(500).json({ message: "Error fetching sanity data", error });
  }
};

exports.getTeacherProgress = async (req, res) => {
  try {
    const teacherId = req.user?.teacherId;
    if (!teacherId) {
      return res.status(400).json({ message: "Teacher ID is required" });
    }

    let teacherInfo = await TeacherInfo.findOne({ regNumber: teacherId })
      .select("classes assignedSections")
      .lean();

    if (!teacherInfo) {
      teacherInfo = await TeacherInfo.findOne({ _id: teacherId })
        .select("classes assignedSections")
        .lean();
    }

    if (!teacherInfo) {
      return res.status(404).json({ message: "Teacher info not found" });
    }

    const assignedClasses = Array.isArray(teacherInfo?.classes)
      ? teacherInfo.classes.map((c) => String(c))
      : [];

    const assignedSections = Array.isArray(teacherInfo?.assignedSections)
      ? teacherInfo.assignedSections.filter((s) => assignedClasses.includes(String(s.classId)))
      : [];

    const courses = await LmsCourse.find({ teacherId }).lean();
    if (courses.length === 0) {
      return res.status(200).json([]);
    }

    let students = [];
    if (assignedClasses.length === 0 || assignedSections.length === 0) {
      const courseIds = courses.map((course) => course._id);
      const progressRows = await LmsProgress.find({ courseId: { $in: courseIds } }).lean();

      const studentIds = [...new Set(progressRows.map((r) => String(r.studentId)))];
      if (studentIds.length === 0) {
        return res.status(200).json([]);
      }

      students = await Student.find({ _id: { $in: studentIds } })
        .select("_id studentId name email studentClass section stream")
        .lean();
    } else {
      const classMap = {};
      const classIds = assignedSections.map((s) => s.classId);
      const classes = await Class.find({ _id: { $in: classIds } })
        .select("_id className")
        .lean();

      classes.forEach((c) => {
        classMap[String(c._id)] = c.className;
      });

      for (const section of assignedSections) {
        const classId = section.classId;
        const className = classMap[String(classId)];

        const sectionStr = normalizeUpper(section.section || "");
        const streamStr = normalize(section.stream || "");

        const query = {
          $or: [{ classId }, { studentClass: className }],
          section: new RegExp(`^${sectionStr}$`, "i"),
        };

        if (streamStr) {
          query.stream = new RegExp(`^${streamStr}$`, "i");
        }

        const sectionStudents = await Student.find(query)
          .select("_id studentId name email studentClass section stream")
          .lean();

        students.push(...sectionStudents);
      }
    }

    const uniqueStudents = Array.from(
      new Map(students.map((s) => [String(s._id), s])).values()
    );

    const rows = await buildProgressRows(courses, uniqueStudents);
    return res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching teacher progress:", error);
    res.status(500).json({ message: "Error fetching progress", error });
  }
};

exports.getTeacherProgressAnalysis = async (req, res) => {
  try {
    const teacherId = req.user?.teacherId;
    if (!teacherId) {
      return res.status(400).json({ message: "Teacher ID is required" });
    }

    const courses = await LmsCourse.find({ teacherId }).lean();
    if (courses.length === 0) {
      return res.status(200).json({ students: [], summary: {} });
    }

    const courseIds = courses.map((course) => course._id);
    const progressRows = await LmsProgress.find({ courseId: { $in: courseIds } }).lean();
    const studentIds = [...new Set(progressRows.map((row) => String(row.studentId)))];
    const students = await Student.find({ _id: { $in: studentIds } })
      .select("_id studentId name email studentClass section stream")
      .lean();

    const rows = await buildProgressRows(courses, students);

    const studentGroups = rows.reduce((acc, row) => {
      if (!acc[row.studentId]) {
        acc[row.studentId] = {
          studentId: row.studentId,
          studentName: row.studentName,
          studentEmail: row.studentEmail,
          class: row.studentClass,
          section: row.section,
          stream: row.stream,
          courseProgress: [],
          averageCompletion: 0,
          averageMaterialProgress: 0,
          averageTopicCompletion: 0,
        };
      }
      acc[row.studentId].courseProgress.push({
        courseId: row.courseId,
        courseTitle: row.courseTitle,
        subject: row.subject,
        completionPct: row.completionPct,
        avgProgressPct: row.avgProgressPct,
        topicCompletionPct: row.topicCompletionPct,
        completedMaterials: row.completedMaterials,
        totalMaterials: row.totalMaterials,
      });
      return acc;
    }, {});

    const studentsAnalysis = Object.values(studentGroups).map((stu) => {
      const count = stu.courseProgress.length;
      stu.averageCompletion = count
        ? Math.round(
            stu.courseProgress.reduce((sum, c) => sum + (c.completionPct || 0), 0) / count
          )
        : 0;
      stu.averageMaterialProgress = count
        ? Math.round(
            stu.courseProgress.reduce((sum, c) => sum + (c.avgProgressPct || 0), 0) / count
          )
        : 0;
      stu.averageTopicCompletion = count
        ? Math.round(
            stu.courseProgress.reduce((sum, c) => sum + (c.topicCompletionPct || 0), 0) / count
          )
        : 0;
      stu.bestCourse = stu.courseProgress.slice().sort((a, b) => b.completionPct - a.completionPct)[0] || null;
      stu.lowestCourse = stu.courseProgress.slice().sort((a, b) => a.completionPct - b.completionPct)[0] || null;
      return stu;
    });

    const summary = {
      totalStudents: studentsAnalysis.length,
      totalCourses: courses.length,
      classAverageCompletion: studentsAnalysis.length
        ? Math.round(
            studentsAnalysis.reduce((sum, s) => sum + (s.averageCompletion || 0), 0) /
              studentsAnalysis.length
          )
        : 0,
      classAverageMaterialProgress: studentsAnalysis.length
        ? Math.round(
            studentsAnalysis.reduce((sum, s) => sum + (s.averageMaterialProgress || 0), 0) /
              studentsAnalysis.length
          )
        : 0,
      classAverageTopicCompletion: studentsAnalysis.length
        ? Math.round(
            studentsAnalysis.reduce((sum, s) => sum + (s.averageTopicCompletion || 0), 0) /
              studentsAnalysis.length
          )
        : 0,
    };

    return res.status(200).json({ students: studentsAnalysis, summary });
  } catch (error) {
    console.error("Error fetching teacher progress analysis:", error);
    res.status(500).json({ message: "Error fetching teacher progress analysis", error });
  }
};

exports.getAdminProgress = async (req, res) => {
  try {
    const classAssigned = normalizeClass(req.query.classAssigned);
    const courseFilter = classAssigned ? { classAssigned } : {};
    const studentFilter = classAssigned ? { studentClass: classAssigned } : {};

    const courses = await LmsCourse.find(courseFilter).lean();
    // Added _id to the select statement to ensure buildProgressRows handles mapping correctly
    const students = await Student.find(studentFilter).select("_id studentId name email studentClass").lean();

    const rows = await buildProgressRows(courses, students);
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ message: "Error fetching progress", error });
  }
};