const Timetable = require("../models/timetable");
const Class = require("../models/class");
const Subject = require("../models/subject");
const Teacher = require("../models/techerregister");

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const PERIODS = [1, 2, 3, 4, 5];

const normalize = (v) => String(v || "").trim();
const normalizeUpper = (v) => normalize(v).toUpperCase();
const dayIndex = (day) => DAYS.findIndex((d) => d === day);

const DAY_ALIAS = {
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
  sun: "Sunday",
  sunday: "Sunday",
};

const normalizeDay = (d) => {
  const key = normalize(d).toLowerCase();
  return DAY_ALIAS[key] || normalize(d);
};

const normalizeChoiceList = (value) => {
  if (Array.isArray(value)) return value.map((x) => normalize(x)).filter(Boolean);
  return String(value || "")
    .split(",")
    .map((x) => normalize(x))
    .filter(Boolean);
};

const buildScope = (cls, streamRaw, sectionRaw) => {
  const stream = normalize(streamRaw);
  const section = normalizeUpper(sectionRaw);

  const activeStreams = (cls.streams || [])
    .filter((s) => s?.isActive !== false)
    .map((s) => normalize(s.name));

  const activeSections = (cls.sections || []).filter((s) => s?.isActive !== false);

  if (activeStreams.length > 0 && !stream) {
    return { error: "Please select stream" };
  }

  if (!section) {
    return { error: "Please select section" };
  }

  const sectionDoc = activeSections.find((s) => normalizeUpper(s.name) === section);
  if (!sectionDoc) {
    return { error: "Selected section is not available in this class" };
  }

  const sectionStream = normalize(sectionDoc.stream);
  if (sectionStream && stream && sectionStream.toLowerCase() !== stream.toLowerCase()) {
    return { error: `Section ${section} belongs to stream ${sectionStream}` };
  }

  return { stream, section };
};

const extractSubjectNames = (rows) => {
  const out = [];
  for (const row of rows || []) {
    if (!row) continue;
    if (typeof row === "string") {
      const t = row.trim();
      if (t) out.push(t);
      continue;
    }
    const name = normalize(row.subjectName || row.name);
    if (name) out.push(name);
  }
  return out;
};

const getSubjectsForScope = async (className, stream) => {
  const doc = await Subject.findOne({ className: Number(className) }).lean();
  if (!doc) return [];

  const common = extractSubjectNames(doc.common);

  if (!stream) return [...new Set(common)];

  const streamDoc = (doc.streams || []).find(
    (s) => normalize(s.name).toLowerCase() === normalize(stream).toLowerCase()
  );
  const streamSubjects = extractSubjectNames(streamDoc?.subjects || []);

  return [...new Set([...common, ...streamSubjects])];
};

const getStreamChoiceSubjects = (cls, stream) => {
  const streamDoc = (cls?.streams || []).find(
    (s) => normalize(s?.name).toLowerCase() === normalize(stream).toLowerCase()
  );
  if (!streamDoc) return [];
  return [...new Set((streamDoc.subjectOptions || []).map((x) => normalize(x)).filter(Boolean))];
};

const getSlotMapFromDoc = (doc) => {
  const map = new Map();
  for (const d of doc?.days || []) {
    const day = normalizeDay(d.day);
    for (const slot of d.slots || []) {
      const period = Number(slot.period);
      if (!day || !period) continue;
      map.set(`${day}__${period}`, slot);
    }
  }
  return map;
};

const buildDaysFromMap = (slotMap) => {
  return DAYS.map((day) => {
    const slots = PERIODS.map((period) => {
      const slot = slotMap.get(`${day}__${period}`) || {};
      return {
        period,
        subject: normalize(slot.subject),
        teacherId: slot.teacherId || null,
        isOptional: !!slot.isOptional,
        subjectChoice: normalize(slot.subjectChoice),
        groupKey: normalize(slot.groupKey),
        options: Array.isArray(slot.options)
          ? slot.options
              .map((o) => ({
                subjectChoice: normalize(o.subjectChoice),
                subject: normalize(o.subject),
                teacherId: o.teacherId || null,
                groupKey: normalize(o.groupKey),
              }))
              .filter((o) => o.subjectChoice || o.subject || o.teacherId)
          : [],
      };
    });
    return { day, slots };
  });
};

const findTeacherConflict = async ({ teacherId, day, period, excludeScope = null }) => {
  const docs = await Timetable.find({
    ...(excludeScope
      ? {
          $or: [
            { classId: { $ne: excludeScope.classId } },
            { section: { $ne: excludeScope.section } },
            { stream: { $ne: excludeScope.stream } },
          ],
        }
      : {}),
    $or: [
      { "days.slots.teacherId": teacherId },
      { "days.slots.options.teacherId": teacherId },
    ],
  })
    .populate("classId", "className")
    .lean();

  const targetDay = normalizeDay(day);
  const targetPeriod = Number(period);

  for (const doc of docs) {
    for (const d of doc.days || []) {
      if (normalizeDay(d.day) !== targetDay) continue;
      for (const s of d.slots || []) {
        if (Number(s.period) !== targetPeriod) continue;
        const directHit = String(s.teacherId || "") === String(teacherId);
        const optionHit = (s.options || []).some(
          (o) => String(o?.teacherId || "") === String(teacherId)
        );
        if (!(directHit || optionHit)) continue;

        return {
          timetableId: doc._id,
          classId: doc.classId?._id,
          className: doc.classId?.className,
          section: doc.section || "",
          stream: doc.stream || "",
          day: targetDay,
          period: targetPeriod,
        };
      }
    }
  }

  return null;
};

const getBusyTeacherIdsForSlot = async ({ day, period, excludeScope = null }) => {
  const docs = await Timetable.find({
    ...(excludeScope
      ? {
          $or: [
            { classId: { $ne: excludeScope.classId } },
            { section: { $ne: excludeScope.section } },
            { stream: { $ne: excludeScope.stream } },
          ],
        }
      : {}),
    $or: [
      { "days.slots.teacherId": { $ne: null } },
      { "days.slots.options.teacherId": { $ne: null } },
    ],
  }).lean();

  const targetDay = normalizeDay(day);
  const targetPeriod = Number(period);
  const out = new Set();

  for (const doc of docs) {
    for (const d of doc.days || []) {
      if (normalizeDay(d.day) !== targetDay) continue;
      for (const s of d.slots || []) {
        if (Number(s.period) !== targetPeriod) continue;
        if (s.teacherId) out.add(String(s.teacherId));
        for (const opt of s.options || []) {
          if (opt?.teacherId) out.add(String(opt.teacherId));
        }
      }
    }
  }

  return out;
};

const pickAvailableTeacher = ({ teachers, busySet, reservedSet = new Set(), preferredId = "" }) => {
  const preferredKey = String(preferredId || "");
  if (preferredKey) {
    const preferred = teachers.find((t) => String(t._id) === preferredKey);
    if (preferred && !busySet.has(preferredKey) && !reservedSet.has(preferredKey)) {
      return preferred;
    }
  }

  for (const t of teachers) {
    const key = String(t._id);
    if (busySet.has(key) || reservedSet.has(key)) continue;
    return t;
  }

  return null;
};

const getSiblingSectionSubjectsForSlot = async ({
  classId,
  stream,
  section,
  day,
  period,
}) => {
  const docs = await Timetable.find({
    classId,
    stream: normalize(stream),
    section: { $ne: normalizeUpper(section) },
  }).lean();

  const targetDay = normalizeDay(day);
  const targetPeriod = Number(period);
  const out = new Set();

  for (const doc of docs) {
    for (const d of doc.days || []) {
      if (normalizeDay(d.day) !== targetDay) continue;
      for (const s of d.slots || []) {
        if (Number(s.period) !== targetPeriod) continue;
        if (Array.isArray(s.options) && s.options.length > 0) continue;
        const subject = normalize(s.subject);
        if (subject) out.add(subject.toLowerCase());
      }
    }
  }

  return out;
};

const buildPreview = async ({ cls, stream, section, overwriteExisting = false }) => {
  const subjects = await getSubjectsForScope(cls.className, stream);
  if (subjects.length === 0) {
    return {
      error: "No subjects found for selected class/stream. Please configure subjects first.",
      slots: [],
      conflicts: [],
      createdCount: 0,
    };
  }

  const teachers = await Teacher.find({}, "name").lean();
  if (teachers.length === 0) {
    return {
      error: "No teachers found",
      slots: [],
      conflicts: [],
      createdCount: 0,
    };
  }

  const scopeDoc = await Timetable.findOne({ classId: cls._id, section, stream })
    .populate("days.slots.teacherId", "name")
    .populate("days.slots.options.teacherId", "name")
    .lean();

  const existingBySlot = getSlotMapFromDoc(scopeDoc);

  const allDocs = await Timetable.find({}).lean();
  const busyBySlot = new Map();
  const siblingSubjectsBySlot = new Map();
  const currentClassId = String(cls._id || "");
  const currentStream = normalize(stream).toLowerCase();
  const currentSection = normalizeUpper(section);
  for (const doc of allDocs) {
    const docClassId = String(doc.classId || "");
    const docStream = normalize(doc.stream).toLowerCase();
    const docSection = normalizeUpper(doc.section);
    const isSameScopeSibling =
      docClassId === currentClassId &&
      docStream === currentStream &&
      docSection &&
      docSection !== currentSection;

    for (const d of doc.days || []) {
      const day = normalizeDay(d.day);
      for (const s of d.slots || []) {
        const period = Number(s.period);
        if (!day || !period) continue;
        const key = `${day}__${period}`;
        if (!busyBySlot.has(key)) busyBySlot.set(key, new Set());
        const set = busyBySlot.get(key);
        if (s.teacherId) set.add(String(s.teacherId));
        for (const opt of s.options || []) {
          if (opt?.teacherId) set.add(String(opt.teacherId));
        }

        // For same class/stream sibling sections, keep non-optional subjects diversified per slot.
        if (isSameScopeSibling && (!Array.isArray(s.options) || s.options.length === 0)) {
          const siblingSubject = normalize(s.subject);
          if (siblingSubject) {
            if (!siblingSubjectsBySlot.has(key)) siblingSubjectsBySlot.set(key, new Set());
            siblingSubjectsBySlot.get(key).add(siblingSubject.toLowerCase());
          }
        }
      }
    }
  }

  const slots = [];
  const conflicts = [];

  const choiceSubjects = getStreamChoiceSubjects(cls, stream).filter((x) =>
    subjects.some((s) => s.toLowerCase() === x.toLowerCase())
  );
  const baseSubjects = subjects.filter(
    (s) => !choiceSubjects.some((c) => c.toLowerCase() === String(s).toLowerCase())
  );
  const optionalPeriod = PERIODS[Math.floor(PERIODS.length / 2)] || PERIODS[0];

  let subjectIdx = 0;
  let teacherIdx = 0;

  for (const day of DAYS) {
    for (const period of PERIODS) {
      const key = `${day}__${period}`;
      const existing = existingBySlot.get(key);

      const hasOptions = Array.isArray(existing?.options) && existing.options.length > 0;
      if (!overwriteExisting && ((existing?.subject && existing?.teacherId) || hasOptions)) {
        const firstOpt = hasOptions ? existing.options[0] : null;
        slots.push({
          day,
          period,
          status: "existing",
          subject: existing.subject || firstOpt?.subject || firstOpt?.subjectChoice || "Optional",
          teacherId:
            existing.teacherId?._id ||
            existing.teacherId ||
            firstOpt?.teacherId?._id ||
            firstOpt?.teacherId ||
            "",
          teacherName: existing.teacherId?.name || "",
          section,
          stream,
        });
        continue;
      }

      // For stream choice subjects, reserve one common period where all options run in parallel.
      if (choiceSubjects.length >= 2 && Number(period) === Number(optionalPeriod)) {
        const busySet = busyBySlot.get(key) || new Set();
        const usedInThisSlot = new Set();
        const options = [];
        let choiceAllocationFailed = false;

        for (const choice of choiceSubjects) {
          let picked = null;
          let attempts = 0;
          while (attempts < teachers.length) {
            const candidate = teachers[teacherIdx % teachers.length];
            teacherIdx += 1;
            attempts += 1;
            const tid = String(candidate._id);
            if (busySet.has(tid) || usedInThisSlot.has(tid)) continue;
            picked = candidate;
            break;
          }

          if (!picked) {
            const reason = `No free teacher for optional choice ${choice} on ${day} period ${period}`;
            conflicts.push({ day, period, reason });
            choiceAllocationFailed = true;
            break;
          }

          usedInThisSlot.add(String(picked._id));
          options.push({
            subjectChoice: choice,
            subject: choice,
            teacherId: picked._id,
            teacherName: picked.name || "",
            groupKey: `${normalize(stream)}-CHOICE`,
          });
        }

        if (choiceAllocationFailed) {
          slots.push({
            day,
            period,
            status: "conflict",
            reason: `No free teacher for optional choices on ${day} period ${period}`,
            section,
            stream,
          });
          continue;
        }

        if (options.length === choiceSubjects.length) {
          if (!busyBySlot.has(key)) busyBySlot.set(key, new Set());
          const set = busyBySlot.get(key);
          for (const opt of options) set.add(String(opt.teacherId));

          slots.push({
            day,
            period,
            status: "new",
            subject: "Optional",
            teacherId: "",
            teacherName: "",
            isOptional: true,
            subjectChoice: "",
            groupKey: `${normalize(stream)}-CHOICE`,
            options: options.map((o) => ({
              subjectChoice: o.subjectChoice,
              subject: o.subject,
              teacherId: o.teacherId,
              groupKey: o.groupKey,
            })),
            section,
            stream,
          });
        }

        continue;
      }

      const busySet = busyBySlot.get(key) || new Set();
      let pickedTeacher = null;
      let attempts = 0;
      while (attempts < teachers.length) {
        const candidate = teachers[teacherIdx % teachers.length];
        teacherIdx += 1;
        attempts += 1;
        if (!busySet.has(String(candidate._id))) {
          pickedTeacher = candidate;
          break;
        }
      }

      if (!pickedTeacher) {
        const reason = `No free teacher for ${day} period ${period}`;
        conflicts.push({ day, period, reason });
        slots.push({ day, period, status: "conflict", reason, section, stream });
        continue;
      }

      const subjectPool = baseSubjects.length > 0 ? baseSubjects : subjects;
      const blockedSubjects = siblingSubjectsBySlot.get(key) || new Set();
      const startIdx = subjectIdx % subjectPool.length;
      let pickedOffset = 0;
      let subject = subjectPool[startIdx];

      for (let offset = 0; offset < subjectPool.length; offset += 1) {
        const candidate = subjectPool[(startIdx + offset) % subjectPool.length];
        if (blockedSubjects.has(String(candidate).toLowerCase())) continue;
        subject = candidate;
        pickedOffset = offset;
        break;
      }

      subjectIdx += pickedOffset + 1;

      if (!busyBySlot.has(key)) busyBySlot.set(key, new Set());
      busyBySlot.get(key).add(String(pickedTeacher._id));

      slots.push({
        day,
        period,
        status: "new",
        subject,
        teacherId: pickedTeacher._id,
        teacherName: pickedTeacher.name || "",
        section,
        stream,
      });
    }
  }

  return {
    error: "",
    slots,
    conflicts,
    createdCount: slots.filter((s) => s.status === "new").length,
  };
};

exports.getClassTimetable = async (req, res) => {
  try {
    const { classId } = req.params;
    const section = normalizeUpper(req.query.section);
    const stream = normalize(req.query.stream);
    const subjectChoice = normalize(req.query.subjectChoice);

    const query = { classId };
    if (section) query.section = section;
    if (stream) query.stream = stream;

    const docs = await Timetable.find(query)
      .populate("days.slots.teacherId", "name")
      .populate("days.slots.options.teacherId", "name")
      .lean();

    const rows = [];
    for (const doc of docs) {
      for (const d of doc.days || []) {
        const day = normalizeDay(d.day);
        for (const slot of d.slots || []) {
          const options = Array.isArray(slot.options) ? slot.options : [];
          if (options.length > 0) {
            for (const opt of options) {
              const choices = normalizeChoiceList(opt.subjectChoice);
              const choiceMatch =
                !subjectChoice || choices.some((c) => c.toLowerCase() === subjectChoice.toLowerCase());
              if (!choiceMatch) continue;
              if (!normalize(opt.subject || opt.subjectChoice)) continue;

              rows.push({
                day,
                period: Number(slot.period),
                subject: normalize(opt.subject) || normalize(opt.subjectChoice),
                teacherId: opt.teacherId,
                teacherName: opt.teacherId?.name || "",
                section: doc.section || "",
                stream: doc.stream || "",
                subjectChoice: opt.subjectChoice || "",
              });
            }
            continue;
          }

          const choice = normalize(slot.subjectChoice);
          if (subjectChoice && choice && choice.toLowerCase() !== subjectChoice.toLowerCase()) continue;
          if (subjectChoice && !choice) continue;
          if (!normalize(slot.subject)) continue;

          rows.push({
            day,
            period: Number(slot.period),
            subject: slot.subject,
            teacherId: slot.teacherId,
            teacherName: slot.teacherId?.name || "",
            section: doc.section || "",
            stream: doc.stream || "",
            subjectChoice: slot.subjectChoice || "",
          });
        }
      }
    }

    rows.sort((a, b) => {
      const di = dayIndex(a.day) - dayIndex(b.day);
      if (di !== 0) return di;
      return Number(a.period) - Number(b.period);
    });

    return res.status(200).json(rows);
  } catch (error) {
    console.error("getClassTimetable error:", error);
    return res.status(500).json({
      message: error?.message || "Server error",
      code: error?.code || "GET_CLASS_TIMETABLE_FAILED",
    });
  }
};

exports.previewTimetable = async (req, res) => {
  try {
    const {
      classId,
      stream: streamRaw,
      section: sectionRaw,
      overwriteExisting = false,
    } = req.body || {};

    if (!classId) {
      return res.status(400).json({ message: "classId is required" });
    }

    const cls = await Class.findById(classId).lean();
    if (!cls) {
      return res.status(404).json({ message: "Class not found" });
    }

    const scope = buildScope(cls, streamRaw, sectionRaw);
    if (scope.error) {
      return res.status(400).json({ message: scope.error });
    }

    const preview = await buildPreview({
      cls,
      stream: scope.stream,
      section: scope.section,
      overwriteExisting: !!overwriteExisting,
    });
    if (preview.error) {
      return res.status(400).json({ message: preview.error, ...preview });
    }

    return res.status(200).json({
      classId,
      className: cls.className,
      stream: scope.stream,
      section: scope.section,
      overwriteExisting: !!overwriteExisting,
      slots: preview.slots,
      conflicts: preview.conflicts,
      createdCount: preview.createdCount,
    });
  } catch (error) {
    console.error("previewTimetable error:", error);
    return res.status(500).json({
      message: error?.message || "Server error",
      code: error?.code || "PREVIEW_TIMETABLE_FAILED",
    });
  }
};

exports.generateTimetable = async (req, res) => {
  try {
    const {
      classId,
      stream: streamRaw,
      section: sectionRaw,
      overwriteExisting = false,
    } = req.body || {};

    if (!classId) {
      return res.status(400).json({ message: "classId is required" });
    }

    const cls = await Class.findById(classId).lean();
    if (!cls) {
      return res.status(404).json({ message: "Class not found" });
    }

    const scope = buildScope(cls, streamRaw, sectionRaw);
    if (scope.error) {
      return res.status(400).json({ message: scope.error });
    }

    const preview = await buildPreview({
      cls,
      stream: scope.stream,
      section: scope.section,
      overwriteExisting: !!overwriteExisting,
    });
    if (preview.error) {
      return res.status(400).json({ message: preview.error, ...preview });
    }

    const toInsert = preview.slots.filter((s) => s.status === "new");

    if (toInsert.length === 0) {
      return res.status(200).json({
        message: "No new slots to generate",
        createdCount: 0,
        conflictCount: preview.conflicts.length,
        conflicts: preview.conflicts,
      });
    }

    let doc = await Timetable.findOne({
      classId,
      section: scope.section,
      stream: scope.stream,
    });

    if (!doc) {
      doc = new Timetable({
        classId,
        section: scope.section,
        stream: scope.stream,
        days: [],
        meta: {
          periodsPerDay: PERIODS.length,
          workingDays: DAYS,
        },
      });
    }

      const slotMap = overwriteExisting ? new Map() : getSlotMapFromDoc(doc.toObject());
      for (const slot of toInsert) {
        slotMap.set(`${slot.day}__${slot.period}`, {
          period: Number(slot.period),
          subject: slot.subject || "",
          teacherId: slot.teacherId || null,
          isOptional: !!slot.isOptional,
          subjectChoice: slot.subjectChoice || "",
          groupKey: slot.groupKey || "",
          options: Array.isArray(slot.options)
            ? slot.options
                .map((o) => ({
                  subjectChoice: normalize(o.subjectChoice),
                  subject: normalize(o.subject),
                  teacherId: o.teacherId || null,
                  groupKey: normalize(o.groupKey),
                }))
                .filter((o) => o.subjectChoice || o.subject || o.teacherId)
            : [],
        });
      }

    doc.days = buildDaysFromMap(slotMap);
    if (!doc.meta) doc.meta = {};
    doc.meta.periodsPerDay = PERIODS.length;
    doc.meta.workingDays = DAYS;

    await doc.save();

    return res.status(200).json({
      message: overwriteExisting ? "Timetable generated (overwrite mode)" : "Timetable generated",
      createdCount: toInsert.length,
      conflictCount: preview.conflicts.length,
      conflicts: preview.conflicts,
    });
  } catch (error) {
    console.error("generateTimetable error:", error);
    return res.status(500).json({
      message: error?.message || "Server error",
      code: error?.code || "GENERATE_FAILED",
    });
  }
};

exports.manualUpsertTimetable = async (req, res) => {
  try {
    const {
      classId,
      day,
      period,
      subject,
      teacherId,
      stream: streamRaw,
      section: sectionRaw,
      subjectChoice,
      isOptional,
      groupKey,
      parallelOptions,
    } = req.body || {};

    const optionList = Array.isArray(parallelOptions) ? parallelOptions : [];
    const hasParallel = optionList.length > 0;

    if (!classId || !day || !period || (!hasParallel && (!subject || !teacherId))) {
      return res.status(400).json({
        message: "classId, day, period are required, and for normal slot subject + teacherId are required",
      });
    }

    const dayNorm = normalizeDay(day);
    if (!DAYS.includes(dayNorm)) {
      return res.status(400).json({ message: "Invalid day" });
    }

    const periodNum = Number(period);
    if (!PERIODS.includes(periodNum)) {
      return res.status(400).json({ message: "Invalid period" });
    }

    const cls = await Class.findById(classId).lean();
    if (!cls) {
      return res.status(404).json({ message: "Class not found" });
    }

    const scope = buildScope(cls, streamRaw, sectionRaw);
    if (scope.error) {
      return res.status(400).json({ message: scope.error });
    }

    const allTeachers = await Teacher.find({}, "name").lean();
    if (!allTeachers.length) {
      return res.status(404).json({ message: "No teachers found" });
    }

    let doc = await Timetable.findOne({
      classId,
      section: scope.section,
      stream: scope.stream,
    });

    if (!doc) {
      doc = new Timetable({
        classId,
        section: scope.section,
        stream: scope.stream,
        days: [],
        meta: {
          periodsPerDay: PERIODS.length,
          workingDays: DAYS,
        },
      });
    }

    const busySet = await getBusyTeacherIdsForSlot({
      day: dayNorm,
      period: periodNum,
      excludeScope: { classId, section: scope.section, stream: scope.stream },
    });
    const teacherReassignments = [];

    const slotMap = getSlotMapFromDoc(doc.toObject());
    if (hasParallel) {
      const safeOptions = [];
      const reservedSet = new Set();
      for (const opt of optionList) {
        const choice = normalize(opt?.subjectChoice);
        const optSubject = normalize(opt?.subject) || choice;
        const optTeacherId = String(opt?.teacherId || "");
        if (!choice || !optTeacherId) continue;

        const picked = pickAvailableTeacher({
          teachers: allTeachers,
          busySet,
          reservedSet,
          preferredId: optTeacherId,
        });
        if (!picked) {
          return res.status(409).json({
            message: `No available teacher for optional subject ${choice} at selected day/period`,
          });
        }

        if (String(picked._id) !== optTeacherId) {
          teacherReassignments.push({
            subjectChoice: choice,
            requestedTeacherId: optTeacherId,
            assignedTeacherId: String(picked._id),
            assignedTeacherName: picked.name || "",
          });
        }

        reservedSet.add(String(picked._id));
        busySet.add(String(picked._id));
        safeOptions.push({
          subjectChoice: choice,
          subject: optSubject,
          teacherId: picked._id,
          groupKey: normalize(opt?.groupKey || groupKey),
        });
      }

      if (safeOptions.length === 0) {
        return res.status(400).json({ message: "parallelOptions must include valid choice + teacherId" });
      }

      slotMap.set(`${dayNorm}__${periodNum}`, {
        period: periodNum,
        subject: normalize(subject) || "Optional",
        teacherId: null,
        isOptional: true,
        subjectChoice: "",
        groupKey: normalize(groupKey),
        options: safeOptions,
      });
    } else {
      const requestedSubject = normalize(subject);
      const siblingSubjects = await getSiblingSectionSubjectsForSlot({
        classId,
        stream: scope.stream,
        section: scope.section,
        day: dayNorm,
        period: periodNum,
      });
      if (requestedSubject && siblingSubjects.has(requestedSubject.toLowerCase())) {
        return res.status(409).json({
          message:
            "This subject is already used in another section at the same time. Keep subjects different across sections, or use parallel subject choices.",
        });
      }

      const requestedTeacherId = String(teacherId || "");
      const picked = pickAvailableTeacher({
        teachers: allTeachers,
        busySet,
        preferredId: requestedTeacherId,
      });
      if (!picked) {
        return res.status(409).json({
          message: "No available teacher at selected day/period. Please try another period.",
        });
      }

      if (String(picked._id) !== requestedTeacherId) {
        teacherReassignments.push({
          subjectChoice: normalize(subject),
          requestedTeacherId,
          assignedTeacherId: String(picked._id),
          assignedTeacherName: picked.name || "",
        });
      }

      slotMap.set(`${dayNorm}__${periodNum}`, {
        period: periodNum,
        subject: requestedSubject,
        teacherId: picked._id,
        isOptional: !!isOptional,
        subjectChoice: normalize(subjectChoice),
        groupKey: normalize(groupKey),
        options: [],
      });
    }

    doc.days = buildDaysFromMap(slotMap);
    if (!doc.meta) doc.meta = {};
    doc.meta.periodsPerDay = PERIODS.length;
    doc.meta.workingDays = DAYS;

    await doc.save();
    await doc.populate("days.slots.teacherId", "name");
    await doc.populate("days.slots.options.teacherId", "name");

    return res.status(200).json({
      message:
        teacherReassignments.length > 0
          ? "Manual timetable saved with alternative teacher assignment"
          : "Manual timetable saved",
      teacherReassignments,
      timetable: doc,
    });
  } catch (error) {
    console.error("manualUpsertTimetable error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.deleteTimetableSlot = async (req, res) => {
  try {
    const {
      classId,
      day,
      period,
      stream: streamRaw,
      section: sectionRaw,
    } = req.body || {};

    if (!classId || !day || !period) {
      return res.status(400).json({ message: "classId, day and period are required" });
    }

    const dayNorm = normalizeDay(day);
    if (!DAYS.includes(dayNorm)) {
      return res.status(400).json({ message: "Invalid day" });
    }

    const periodNum = Number(period);
    if (!PERIODS.includes(periodNum)) {
      return res.status(400).json({ message: "Invalid period" });
    }

    const cls = await Class.findById(classId).lean();
    if (!cls) {
      return res.status(404).json({ message: "Class not found" });
    }

    const scope = buildScope(cls, streamRaw, sectionRaw);
    if (scope.error) {
      return res.status(400).json({ message: scope.error });
    }

    const doc = await Timetable.findOne({
      classId,
      section: scope.section,
      stream: scope.stream,
    });
    if (!doc) {
      return res.status(404).json({ message: "Timetable not found for selected class/stream/section" });
    }

    const slotMap = getSlotMapFromDoc(doc.toObject());
    const slotKey = `${dayNorm}__${periodNum}`;
    if (!slotMap.has(slotKey)) {
      return res.status(404).json({ message: "No slot found for selected day/period" });
    }

    slotMap.delete(slotKey);
    doc.days = buildDaysFromMap(slotMap);
    if (!doc.meta) doc.meta = {};
    doc.meta.periodsPerDay = PERIODS.length;
    doc.meta.workingDays = DAYS;

    await doc.save();
    return res.status(200).json({ message: "Timetable slot deleted" });
  } catch (error) {
    console.error("deleteTimetableSlot error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.deleteFullTimetable = async (req, res) => {
  try {
    const {
      classId,
      stream: streamRaw,
      section: sectionRaw,
    } = req.body || {};

    if (!classId) {
      return res.status(400).json({ message: "classId is required" });
    }

    const cls = await Class.findById(classId).lean();
    if (!cls) {
      return res.status(404).json({ message: "Class not found" });
    }

    const scope = buildScope(cls, streamRaw, sectionRaw);
    if (scope.error) {
      return res.status(400).json({ message: scope.error });
    }

    const deleted = await Timetable.findOneAndDelete({
      classId,
      stream: scope.stream,
      section: scope.section,
    });

    if (!deleted) {
      return res.status(404).json({ message: "No timetable found for selected class/stream/section" });
    }

    return res.status(200).json({ message: "Full timetable deleted" });
  } catch (error) {
    console.error("deleteFullTimetable error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
