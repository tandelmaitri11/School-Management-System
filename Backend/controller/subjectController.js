const Subject = require("../models/subject");
const Class = require("../models/class");

const normalizeList = (list) =>
  (Array.isArray(list) ? list : [])
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (item && typeof item === "object") {
        if (item.subjectName) return String(item.subjectName).trim();
        if (item.name) return String(item.name).trim();
      }
      return "";
    })
    .filter(Boolean)
    .map((subjectName) => ({ subjectName }));

// Create or update subjects for a class
exports.createSubject = async (req, res) => {
  try {
    let { className, subjects, common, streams, streamName, streamSubjects } = req.body;

    if (!className) return res.status(400).json({ error: "Class is required" });

    className = Number(className);

    // Check if class exists
    const classDoc = await Class.findOne({ className });
    if (!classDoc) return res.status(404).json({ error: "Class not found" });

    const normalizedCommon = normalizeList(common || subjects);
    const normalizedStreams = Array.isArray(streams)
      ? streams
          .map((st) => ({
            name: String(st.name || "").trim(),
            subjects: normalizeList(st.subjects || st.subjectOptions || []),
          }))
          .filter((st) => st.name)
      : [];
    const normalizedStreamName = String(streamName || "").trim();
    const normalizedStreamSubjects = normalizeList(streamSubjects);

    // Check if Subject document already exists for this class
    let subjectDoc = await Subject.findOne({ className });
    if (subjectDoc) {
      if (normalizedCommon.length) {
        subjectDoc.common = normalizedCommon;
      }
      if (normalizedStreams.length) {
        subjectDoc.streams = normalizedStreams;
      }
      if (normalizedStreamName && normalizedStreamSubjects.length) {
        const idx = (subjectDoc.streams || []).findIndex(
          (s) => String(s.name).toLowerCase() === normalizedStreamName.toLowerCase()
        );
        if (idx >= 0) {
          subjectDoc.streams[idx].subjects = normalizedStreamSubjects;
        } else {
          subjectDoc.streams.push({ name: normalizedStreamName, subjects: normalizedStreamSubjects });
        }
      }
      await subjectDoc.save();
      return res.status(200).json({ message: "Subjects updated successfully" });
    }

    const newSubject = new Subject({
      className,
      common: normalizedCommon,
      streams: normalizedStreams.length
        ? normalizedStreams
        : normalizedStreamName && normalizedStreamSubjects.length
        ? [{ name: normalizedStreamName, subjects: normalizedStreamSubjects }]
        : [],
    });
    await newSubject.save();
    res.status(201).json({ message: "Subjects created successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// Get all subjects with class info
exports.getAllSubjects = async (req, res) => {
  try {
    const allSubjects = await Subject.find({});
    res.status(200).json(allSubjects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// Get subjects by class number
exports.getSubjectsByClass = async (req, res) => {
  try {
    let className = req.params.className;
    console.log("Fetching subjects for class:", className); // debug

    // Convert to number if stored as number in DB
    if (!isNaN(className)) className = Number(className);
    const stream = String(req.query.stream || "").trim();
    const mode = String(req.query.mode || "").trim().toLowerCase();

    // Find the Subject document for this class
    const subjectDoc = await Subject.findOne({ className });
    if (!subjectDoc) return res.status(200).json([]);

    const common = normalizeList(
      subjectDoc.common && subjectDoc.common.length ? subjectDoc.common : subjectDoc.subjects || []
    );
    if (!stream) {
      return res.status(200).json(common);
    }

    const streamDoc = (subjectDoc.streams || []).find(
      (s) => String(s.name || "").toLowerCase() === stream.toLowerCase()
    );
    const streamSubjects = normalizeList(streamDoc?.subjects || []);
    if (mode === "streamonly") {
      return res.status(200).json(streamSubjects);
    }
    const merged = [...common, ...streamSubjects];
    const seen = new Set();
    const deduped = merged.filter((s) => {
      const key = String(s.subjectName || "").toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    return res.status(200).json(deduped);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete a subject document
exports.deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Subject.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Subject document not found" });

    res.status(200).json({ message: "Subjects deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// Update subjects of a class by subject document ID
exports.updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const { subjects, common, streams } = req.body;

    const subjectDoc = await Subject.findById(id);
    if (!subjectDoc) return res.status(404).json({ error: "Class subjects not found" });

    const normalizedCommon = normalizeList(common || subjects);
    const normalizedStreams = Array.isArray(streams)
      ? streams
        .map((st) => ({
          name: String(st.name || "").trim(),
          subjects: normalizeList(st.subjects || st.subjectOptions || []),
        }))
        .filter((st) => st.name)
      : null;

    if ((common || subjects) !== undefined) {
      subjectDoc.common = normalizedCommon;
    }

    if (normalizedStreams !== null) {
      subjectDoc.streams = normalizedStreams;
    }

    const hasCommon = Array.isArray(subjectDoc.common) && subjectDoc.common.length > 0;
    const hasStreamSubjects = Array.isArray(subjectDoc.streams)
      && subjectDoc.streams.some((st) => Array.isArray(st.subjects) && st.subjects.length > 0);

    if (!hasCommon && !hasStreamSubjects) {
      return res.status(400).json({ error: "At least one subject is required" });
    }

    await subjectDoc.save();

    res.status(200).json({ message: "Subjects updated successfully", updatedDoc: subjectDoc });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
