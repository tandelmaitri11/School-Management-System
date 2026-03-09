const Subject = require("../models/subject");
const Class = require("../models/class");

// Create or update subjects for a class
exports.createSubject = async (req, res) => {
  try {
    let { className, subjects } = req.body;

    if (!className || !subjects || !subjects.length) {
      return res.status(400).json({ error: "Class and subjects are required" });
    }

    className = Number(className);

    // Check if class exists
    const classDoc = await Class.findOne({ className });
    if (!classDoc) return res.status(404).json({ error: "Class not found" });

    const normalizedSubjects = (subjects || [])
      .map((s) => ({
        subjectName: String(s.subjectName || "").trim(),
      }))
      .filter((s) => s.subjectName);

    if (normalizedSubjects.length === 0) {
      return res.status(400).json({ error: "At least one subject is required" });
    }

    // Check if Subject document already exists for this class
    let subjectDoc = await Subject.findOne({ className });
    if (subjectDoc) {
      subjectDoc.subjects = normalizedSubjects;
      await subjectDoc.save();
      return res.status(200).json({ message: "Subjects updated successfully" });
    }

    const newSubject = new Subject({ className, subjects: normalizedSubjects });
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

    // Find the Subject document for this class
    const subjectDoc = await Subject.findOne({ className });
    if (!subjectDoc || !subjectDoc.subjects || subjectDoc.subjects.length === 0) {
      return res.status(404).json({ message: "No subjects found for this class" });
    }

    // Return the array of subjects
    res.status(200).json(subjectDoc.subjects);
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
    const { subjects } = req.body;

    const subjectDoc = await Subject.findById(id);
    if (!subjectDoc) return res.status(404).json({ error: "Class subjects not found" });

    const normalizedSubjects = (subjects || [])
      .map((s) => ({
        subjectName: String(s.subjectName || "").trim(),
      }))
      .filter((s) => s.subjectName);

    if (normalizedSubjects.length === 0) {
      return res.status(400).json({ error: "At least one subject is required" });
    }

    subjectDoc.subjects = normalizedSubjects;
    await subjectDoc.save();

    res.status(200).json({ message: "Subjects updated successfully", updatedDoc: subjectDoc });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
