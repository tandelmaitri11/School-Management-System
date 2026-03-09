const Timetable = require("../models/timetable");
const Subject = require("../models/subject");

/* ================= SAVE TIMETABLE ================= */
exports.addTimetable = async (req, res) => {
  try {
    const { classId, subject, teacherId, day, period } = req.body;

    // 🔒 Prevent duplicate period
    const exists = await Timetable.findOne({ classId, day, period });
    if (exists) {
      return res.status(400).json({ message: "Period already assigned" });
    }

    const timetable = new Timetable({
      classId,
      subject, 
      teacherId,
      day,
      period,
    });

    await timetable.save();

    res.status(201).json({
      message: "Timetable saved successfully",
      timetable,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


/* ================= TEACHER CONFLICT CHECK ================= */
exports.checkConflict = async (req, res) => {
  const { teacherId, day, period } = req.body;

  const conflict = await Timetable.findOne({
    teacherId,
    day,
    period
  });

  res.json({ conflict: !!conflict });
};

/* ================= CLASS WISE VIEW ================= */
exports.getClassTimetable = async (req, res) => {
  try {
    const timetable = await Timetable.find({
      classId: req.params.classId,
    })
      .populate("teacherId", "name")
      .sort({ day: 1, period: 1 });

    res.json(timetable);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};



/* ================= GET SUBJECTS BY CLASS ================= */

exports.getSubjectsByClass = async (req, res) => {
  try {
    const className = Number(req.params.className);

    const subjectDoc = await Subject.findOne({ className });

    if (!subjectDoc || subjectDoc.subjects.length === 0) {
      return res.status(404).json({ message: "No subjects found for this class" });
    }

    res.json(subjectDoc.subjects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= AUTO GENERATE TIMETABLE (CLASSWISE) ================= */
exports.autoGenerateClassTimetable = async (req, res) => {
  try {
    const {
      classId,
      days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      periods = [1, 2, 3, 4, 5],
      overwrite = false,
    } = req.body || {};

    if (!classId) {
      return res.status(400).json({ message: "classId is required" });
    }

    const classDoc = await require("../models/class").findById(classId).lean();
    if (!classDoc) {
      return res.status(404).json({ message: "Class not found" });
    }

    if (overwrite) {
      await Timetable.deleteMany({ classId });
    }

    const subjectDoc = await Subject.findOne({ className: classDoc.className }).lean();
    const subjects = subjectDoc?.subjects || [];
    if (!subjects.length) {
      return res.status(404).json({ message: "No subjects found for this class" });
    }

    const teachers = await require("../models/techerregister").find({ role: "Teacher" }).select("_id name").lean();
    if (!teachers.length) {
      return res.status(404).json({ message: "No teachers found" });
    }

    const existing = await Timetable.find({})
      .select("classId teacherId day period")
      .lean();
    const classSlot = new Set(
      existing.map((e) => `${String(e.classId)}|${e.day}|${e.period}`)
    );
    const teacherSlot = new Set(
      existing.map((e) => `${String(e.teacherId)}|${e.day}|${e.period}`)
    );

    const created = [];
    const conflicts = [];
    const unfilledSlots = [];

    const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

    for (const day of days) {
      for (const period of periods) {
        const classKey = `${String(classId)}|${day}|${period}`;
        if (!overwrite && classSlot.has(classKey)) {
          continue;
        }

        let tries = 0;
        let scheduled = false;

        while (tries < subjects.length * teachers.length && !scheduled) {
          const subject = pickRandom(subjects);
          const teacher = pickRandom(teachers);
          const teacherKey = `${String(teacher._id)}|${day}|${period}`;

          if (teacherSlot.has(teacherKey)) {
            tries += 1;
            continue;
          }

          teacherSlot.add(teacherKey);
          classSlot.add(classKey);

          created.push({
            classId,
            subject: subject.subjectName,
            teacherId: teacher._id,
            day,
            period,
          });

          scheduled = true;
        }

        if (!scheduled) {
          conflicts.push({ classId, day, period });
          unfilledSlots.push({ classId, day, period });
        }
      }
    }

    if (created.length) {
      await Timetable.insertMany(created);
    }

    return res.json({
      message: "Auto timetable generation completed",
      createdCount: created.length,
      conflicts,
      unfilledSlots,
    });
  } catch (err) {
    console.error("Auto generate timetable error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ================= AUTO GENERATE PREVIEW (CLASSWISE) ================= */
exports.autoGenerateClassTimetablePreview = async (req, res) => {
  try {
    const {
      classId,
      days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      periods = [1, 2, 3, 4, 5],
    } = req.body || {};

    if (!classId) {
      return res.status(400).json({ message: "classId is required" });
    }

    const Class = require("../models/class");
    const Teacher = require("../models/techerregister");

    const classDoc = await Class.findById(classId).lean();
    if (!classDoc) return res.status(404).json({ message: "Class not found" });

    const subjectDoc = await Subject.findOne({ className: classDoc.className }).lean();
    const subjects = subjectDoc?.subjects || [];
    if (!subjects.length) {
      return res.status(404).json({ message: "No subjects found for this class" });
    }

    const teachers = await Teacher.find({ role: "Teacher" }).select("_id name").lean();
    if (!teachers.length) {
      return res.status(404).json({ message: "No teachers found" });
    }

    const existing = await Timetable.find({})
      .select("classId teacherId day period")
      .lean();
    const classSlot = new Set(
      existing.map((e) => `${String(e.classId)}|${e.day}|${e.period}`)
    );
    const teacherSlot = new Set(
      existing.map((e) => `${String(e.teacherId)}|${e.day}|${e.period}`)
    );

    const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const preview = [];
    const conflicts = [];
    const unfilledSlots = [];

    for (const day of days) {
      for (const period of periods) {
        const classKey = `${String(classId)}|${day}|${period}`;
        if (classSlot.has(classKey)) {
          conflicts.push({ classId, day, period, reason: "Class slot already used" });
          continue;
        }

        let tries = 0;
        let scheduled = false;

        while (tries < subjects.length * teachers.length && !scheduled) {
          const subject = pickRandom(subjects);
          const teacher = pickRandom(teachers);
          const teacherKey = `${String(teacher._id)}|${day}|${period}`;

          if (teacherSlot.has(teacherKey)) {
            tries += 1;
            continue;
          }

          teacherSlot.add(teacherKey);
          classSlot.add(classKey);

          preview.push({
            classId,
            day,
            period,
            subject: subject.subjectName,
            teacherId: teacher._id,
            teacherName: teacher.name,
          });
          scheduled = true;
        }

        if (!scheduled) {
          unfilledSlots.push({ classId, day, period });
        }
      }
    }

    return res.json({
      message: "Preview generated",
      preview,
      conflicts,
      unfilledSlots,
    });
  } catch (err) {
    console.error("Preview timetable error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ================= AUTO GENERATE (ALL CLASSES) ================= */
exports.autoGenerateAllClassesTimetable = async (req, res) => {
  try {
    const {
      days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      periods = [1, 2, 3, 4, 5],
      overwrite = false,
    } = req.body || {};

    const Class = require("../models/class");
    const Teacher = require("../models/techerregister");

    const classes = await Class.find({}).lean();
    if (!classes.length) {
      return res.status(404).json({ message: "No classes found" });
    }

    if (overwrite) {
      await Timetable.deleteMany({});
    }

    const teachers = await Teacher.find({ role: "Teacher" }).select("_id name").lean();
    if (!teachers.length) {
      return res.status(404).json({ message: "No teachers found" });
    }

    const existing = await Timetable.find({})
      .select("classId teacherId day period")
      .lean();
    const classSlot = new Set(
      existing.map((e) => `${String(e.classId)}|${e.day}|${e.period}`)
    );
    const teacherSlot = new Set(
      existing.map((e) => `${String(e.teacherId)}|${e.day}|${e.period}`)
    );

    const subjectDocs = await Subject.find({
      className: { $in: classes.map((c) => c.className) },
    }).lean();
    const subjectsByClass = new Map(
      subjectDocs.map((d) => [Number(d.className), d.subjects || []])
    );

    const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const created = [];
    const conflicts = [];
    const unfilledSlots = [];

    for (const cls of classes) {
      const subjects = subjectsByClass.get(Number(cls.className)) || [];
      if (!subjects.length) {
        conflicts.push({ classId: cls._id, reason: "No subjects" });
        continue;
      }

      for (const day of days) {
        for (const period of periods) {
          const classKey = `${String(cls._id)}|${day}|${period}`;
          if (classSlot.has(classKey)) {
            continue;
          }

          let tries = 0;
          let scheduled = false;

          while (tries < subjects.length * teachers.length && !scheduled) {
            const subject = pickRandom(subjects);
            const teacher = pickRandom(teachers);
            const teacherKey = `${String(teacher._id)}|${day}|${period}`;

            if (teacherSlot.has(teacherKey)) {
              tries += 1;
              continue;
            }

            teacherSlot.add(teacherKey);
            classSlot.add(classKey);

            created.push({
              classId: cls._id,
              subject: subject.subjectName,
              teacherId: teacher._id,
              day,
              period,
            });
            scheduled = true;
          }

          if (!scheduled) {
            unfilledSlots.push({ classId: cls._id, day, period });
          }
        }
      }
    }

    if (created.length) {
      await Timetable.insertMany(created);
    }

    return res.json({
      message: "Auto timetable (all classes) completed",
      createdCount: created.length,
      conflicts,
      unfilledSlots,
    });
  } catch (err) {
    console.error("Auto generate all classes error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
