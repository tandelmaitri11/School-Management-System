const Assignment = require("../models/assignment");
const Submission = require("../models/submission");
const Class = require("../models/class");
const Student = require("../models/studentregister");
const TeacherRegister = require("../models/techerregister");
const TeacherInfo = require("../models/teacherinfo");
const path = require("path");
const fs = require("fs");
const eventBus = require("../events/eventBus");

const normalize = (v) => String(v || "").trim();

const detectSubjectChoiceAssignment = async ({ classAssigned, streamAssigned, subject }) => {
  const classNum = Number(classAssigned);
  const stream = normalize(streamAssigned);
  const sub = normalize(subject);
  if (!classNum || !stream || !sub) return "";

  const cls = await Class.findOne({ className: classNum }).lean();
  if (!cls) return "";

  const streamDoc = (cls.streams || []).find(
    (s) => normalize(s?.name).toLowerCase() === stream.toLowerCase()
  );
  if (!streamDoc) return "";

  const options = (streamDoc.subjectOptions || []).map((x) => normalize(x)).filter(Boolean);
  const isChoiceSubject = options.some((x) => x.toLowerCase() === sub.toLowerCase());
  return isChoiceSubject ? sub : "";
};

const getTeacherAssignedRows = async ({ teacherMongoId, classDocId }) => {
  const teacher = await TeacherRegister.findById(teacherMongoId).select("teacherId").lean();
  if (!teacher?.teacherId) return [];

  const info = await TeacherInfo.findOne({ regNumber: teacher.teacherId })
    .select("assignedSections")
    .lean();

  const rows = Array.isArray(info?.assignedSections) ? info.assignedSections : [];
  return rows
    .filter((r) => String(r?.classId || "") === String(classDocId))
    .map((r) => ({
      classId: String(r?.classId || ""),
      section: String(r?.section || "").trim().toUpperCase(),
      stream: String(r?.stream || "").trim(),
    }))
    .filter((r) => r.classId && r.section);
};

const hasTeacherScope = ({ rows, section, stream }) => {
  const sec = String(section || "").trim().toUpperCase();
  const st = String(stream || "").trim().toLowerCase();
  return rows.some((r) => {
    if (String(r.section || "").trim().toUpperCase() !== sec) return false;
    const rst = String(r.stream || "").trim().toLowerCase();
    if (!rst) return true;
    return rst === st;
  });
};


exports.createAssignment = async (req, res) => {
  try {
    const {
      title,
      description,
      subject,
      dueDate,
      teacherId,
      classAssigned,
      sectionAssigned = "",
      streamAssigned = "",
    } = req.body;
    const file = req.file ? req.file.path : null;

    if (!title || !subject || !teacherId || !classAssigned) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const cls = await Class.findOne({ className: Number(classAssigned) })
      .select("_id streams sections")
      .lean();
    if (!cls) return res.status(404).json({ message: "Class not found" });

    const safeSection = String(sectionAssigned || "").trim().toUpperCase();
    const safeStream = String(streamAssigned || "").trim();
    if (!safeSection) {
      return res.status(400).json({ message: "Section is required" });
    }

    const activeStreams = (cls.streams || []).filter((s) => s?.isActive !== false);
    if (activeStreams.length > 0 && !safeStream) {
      return res.status(400).json({ message: "Stream is required for this class" });
    }

    const sectionDoc = (cls.sections || []).find(
      (s) => s?.isActive !== false && String(s?.name || "").trim().toUpperCase() === safeSection
    );
    if (!sectionDoc) return res.status(400).json({ message: "Selected section is not available in this class" });

    const sectionStream = String(sectionDoc.stream || "").trim();
    if (sectionStream && sectionStream.toLowerCase() !== safeStream.toLowerCase()) {
      return res.status(400).json({ message: `Section ${safeSection} belongs to stream ${sectionStream}` });
    }

    const assignedRows = await getTeacherAssignedRows({ teacherMongoId: teacherId, classDocId: cls._id });
    if (!assignedRows.length || !hasTeacherScope({ rows: assignedRows, section: safeSection, stream: safeStream })) {
      return res.status(403).json({ message: "You can create assignment only for assigned class/section/stream" });
    }

    const subjectChoiceAssigned = await detectSubjectChoiceAssignment({
      classAssigned,
      streamAssigned: safeStream,
      subject,
    });

    const assignment = new Assignment({
      title,
      description,
      subject,
      dueDate,
      teacherId,
      classAssigned,
      sectionAssigned: safeSection,
      streamAssigned: safeStream,
      subjectChoiceAssigned,
      file,
    });

    await assignment.save();

    eventBus.emitAsync("assignment.uploaded", {
      assignment,
      assignmentId: assignment._id,
      classAssigned: assignment.classAssigned,
      sectionAssigned: assignment.sectionAssigned,
      streamAssigned: assignment.streamAssigned,
      uploadedBy: assignment.teacherId,
      uploadedAt: assignment.createdAt,
    });

    res.status(201).json({ message: "Assignment created successfully", assignment });
  } catch (error) {
    console.error("❌ Error creating assignment:", error);
    res.status(500).json({ message: "Error creating assignment", error });
  }
};

// ✅ Get assignments by student class
exports.getAssignmentsByClass = async (req, res) => {
  try {
    const { studentClass } = req.params;
    const section = String(req.query.section || "").trim().toUpperCase();
    const stream = String(req.query.stream || "").trim();
    const subjectChoice = String(req.query.subjectChoice || "").trim();
    const filters = [{ classAssigned: studentClass }];
    if (section) {
      filters.push({
        $or: [
          { sectionAssigned: "" },
          { sectionAssigned: { $exists: false } },
          { sectionAssigned: section },
        ],
      });
    }
    if (stream) {
      filters.push({
        $or: [
          { streamAssigned: "" },
          { streamAssigned: { $exists: false } },
          { streamAssigned: stream },
        ],
      });
    }
    if (subjectChoice) {
      filters.push({
        $or: [
          { subjectChoiceAssigned: "" },
          { subjectChoiceAssigned: { $exists: false } },
          { subjectChoiceAssigned: subjectChoice },
        ],
      });
    }

    const assignments = await Assignment.find({ $and: filters });

    res.status(200).json(assignments || []);
  } catch (error) {
    res.status(500).json({ message: "Error fetching assignments", error });
  }
};

// ✅ Get assignments by multiple classes (for dashboard)
exports.getAssignmentsByClasses = async (req, res) => {
  try {
    const { classes } = req.query;
    if (!classes) {
      return res.status(400).json({ message: "No classes provided" });
    }

    const classList = classes
      .split(",")
      .map((c) => Number(String(c).trim()))
      .filter(Boolean);

    const studentId = String(req.query.studentId || "").trim();
    if (studentId) {
      const student = await Student.findById(studentId).lean();
      if (!student) return res.status(404).json({ message: "Student not found" });

      const section = String(student.section || "").trim().toUpperCase();
      const stream = String(student.stream || "").trim();
      const subjectChoice = String(student.subjectChoice || "").trim();

      const filters = [{ classAssigned: { $in: classList } }];
      if (section) {
        filters.push({
          $or: [
            { sectionAssigned: "" },
            { sectionAssigned: { $exists: false } },
            { sectionAssigned: section },
          ],
        });
      }
      if (stream) {
        filters.push({
          $or: [
            { streamAssigned: "" },
            { streamAssigned: { $exists: false } },
            { streamAssigned: stream },
          ],
        });
      }
      if (subjectChoice) {
        filters.push({
          $or: [
            { subjectChoiceAssigned: "" },
            { subjectChoiceAssigned: { $exists: false } },
            { subjectChoiceAssigned: subjectChoice },
          ],
        });
      }

      const assignments = await Assignment.find({ $and: filters });

      return res.status(200).json(assignments || []);
    }

    const assignments = await Assignment.find({ classAssigned: { $in: classList } });

    res.status(200).json(assignments || []);
  } catch (error) {
    console.error("❌ Error fetching assignments by classes:", error);
    res.status(500).json({ message: "Error fetching assignments by classes", error });
  }
};

// ✅ Get assignments by teacher
exports.getAssignmentsByTeacher = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const assignments = await Assignment.find({ teacherId });
    res.status(200).json(assignments);
  } catch (error) {
    res.status(500).json({ message: "Error fetching teacher assignments", error });
  }
};

// ✅ Update assignment
exports.updateAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const existing = await Assignment.findById(id).lean();
    if (!existing) return res.status(404).json({ message: "Assignment not found" });

    if (req.file) updates.file = req.file.path;
    if (updates.sectionAssigned !== undefined) {
      updates.sectionAssigned = String(updates.sectionAssigned || "").trim().toUpperCase();
    }
    if (updates.streamAssigned !== undefined) {
      updates.streamAssigned = String(updates.streamAssigned || "").trim();
    }

    const finalClassAssigned = Number(updates.classAssigned ?? existing.classAssigned);
    const finalSection = String(updates.sectionAssigned ?? existing.sectionAssigned).trim().toUpperCase();
    const finalStream = String(updates.streamAssigned ?? existing.streamAssigned).trim();

    const cls = await Class.findOne({ className: finalClassAssigned })
      .select("_id streams sections")
      .lean();
    if (!cls) return res.status(404).json({ message: "Class not found" });

    if (!finalSection) return res.status(400).json({ message: "Section is required" });

    const activeStreams = (cls.streams || []).filter((s) => s?.isActive !== false);
    if (activeStreams.length > 0 && !finalStream) {
      return res.status(400).json({ message: "Stream is required for this class" });
    }

    const sectionDoc = (cls.sections || []).find(
      (s) => s?.isActive !== false && String(s?.name || "").trim().toUpperCase() === finalSection
    );
    if (!sectionDoc) return res.status(400).json({ message: "Selected section is not available in this class" });

    const sectionStream = String(sectionDoc.stream || "").trim();
    if (sectionStream && sectionStream.toLowerCase() !== finalStream.toLowerCase()) {
      return res.status(400).json({ message: `Section ${finalSection} belongs to stream ${sectionStream}` });
    }

    const assignedRows = await getTeacherAssignedRows({
      teacherMongoId: existing.teacherId,
      classDocId: cls._id,
    });
    if (!assignedRows.length || !hasTeacherScope({ rows: assignedRows, section: finalSection, stream: finalStream })) {
      return res.status(403).json({ message: "You can update assignment only for assigned class/section/stream" });
    }

    updates.classAssigned = finalClassAssigned;
    updates.sectionAssigned = finalSection;
    updates.streamAssigned = finalStream;

    if (
      updates.subject !== undefined ||
      updates.classAssigned !== undefined ||
      updates.streamAssigned !== undefined
    ) {
      updates.subjectChoiceAssigned = await detectSubjectChoiceAssignment({
        classAssigned: updates.classAssigned ?? existing.classAssigned,
        streamAssigned: updates.streamAssigned ?? existing.streamAssigned,
        subject: updates.subject ?? existing.subject,
      });
    }

    const assignment = await Assignment.findByIdAndUpdate(id, updates, { new: true });

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    res.status(200).json({ message: "Assignment updated successfully", assignment });
  } catch (error) {
    res.status(500).json({ message: "Error updating assignment", error });
  }
};

// ✅ Delete assignment
exports.deleteAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const assignment = await Assignment.findByIdAndDelete(id);
    if (!assignment) return res.status(404).json({ message: "Assignment not found" });
    res.status(200).json({ message: "Assignment deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting assignment", error });
  }
};

// ✅ Student submits assignment
exports.submitAssignment = async (req, res) => {
  try {
    const { assignmentId, studentId } = req.body;
    const file = req.file ? req.file.path : null;

    if (!assignmentId || !studentId || !file) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // ✅ Find the assignment to check its due date
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    // ✅ Check if due date has passed
    const now = new Date();
    if (assignment.dueDate && new Date(assignment.dueDate) < now) {
      const dueDateStr = new Date(assignment.dueDate).toLocaleDateString();
      return res.status(400).json({
        message: `❌ Submission closed! Due date was ${dueDateStr}.`,
      });
    }

    // ✅ Prevent resubmission
    const existing = await Submission.findOne({ assignmentId, studentId });
    if (existing) {
      return res.status(400).json({ message: "You have already submitted this assignment." });
    }

    // ✅ Save submission
    const submission = new Submission({ assignmentId, studentId, file });
    await submission.save();

    res.status(201).json({ message: "Submission successful", submission });
  } catch (error) {
    console.error("❌ Error submitting assignment:", error);
    res.status(500).json({ message: "Error submitting assignment", error });
  }
};

// ✅ Teacher views submissions for an assignment
exports.viewSubmissions = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const submissions = await Submission.find({ assignmentId })
      .populate("studentId", "name email studentId studentClass") // ✅ fixed populate
      .lean();

    const formatted = submissions.map((s) => ({
      _id: s._id,
      name: s.studentId?.name || "Unknown",
      email: s.studentId?.email || "N/A",
      studentUniqueId: s.studentId?.studentId || "N/A",
      studentClass: s.studentId?.studentClass || "N/A",
      submittedAt: s.createdAt,
      file: s.file,
      grade: s.grade,
      feedback: s.feedback,
    }));

    res.status(200).json(formatted);
  } catch (error) {
    console.error("❌ Error fetching submissions:", error);
    res.status(500).json({ message: "Error fetching submissions", error });
  }
};

// ✅ Teacher grades a submission
exports.gradeSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { grade, feedback } = req.body;

    const submission = await Submission.findByIdAndUpdate(
      submissionId,
      { grade, feedback },
      { new: true }
    );

    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    res.status(200).json({ message: "Graded successfully", submission });
  } catch (error) {
    res.status(500).json({ message: "Error grading submission", error });
  }
};

// ✅ Fetch all submissions by student
exports.getSubmissionsByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const submissions = await Submission.find({ studentId }).populate("assignmentId", "title subject dueDate");
    res.status(200).json(submissions);
  } catch (error) {
    res.status(500).json({ message: "Error fetching student submissions", error });
  }
};

exports.viewSubmissions = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const assignment = await Assignment.findById(assignmentId).lean();
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    const studentFilter = {
      studentClass: Number(assignment.classAssigned),
    };

    const sectionAssigned = normalize(assignment.sectionAssigned).toUpperCase();
    const streamAssigned = normalize(assignment.streamAssigned);
    const subjectChoiceAssigned = normalize(assignment.subjectChoiceAssigned);

    if (sectionAssigned) studentFilter.section = sectionAssigned;
    if (streamAssigned) studentFilter.stream = streamAssigned;
    if (subjectChoiceAssigned) studentFilter.subjectChoice = subjectChoiceAssigned;

    const [students, submissions] = await Promise.all([
      Student.find(studentFilter)
        .select("name email studentId studentClass section stream subjectChoice")
        .lean(),
      Submission.find({ assignmentId })
        .populate("studentId", "name email studentId studentClass section stream subjectChoice")
        .lean(),
    ]);

    const submissionsByStudentId = new Map(
      submissions.map((s) => [String(s.studentId?._id || s.studentId), s])
    );

    const formatted = students.map((student) => {
      const submission = submissionsByStudentId.get(String(student._id));
      return {
        _id: submission?._id || null,
        studentMongoId: String(student._id),
        name: student.name || "Unknown",
        email: student.email || "N/A",
        studentUniqueId: student.studentId || "N/A",
        studentClass: student.studentClass || "N/A",
        section: student.section || "",
        stream: student.stream || "",
        subjectChoice: student.subjectChoice || "",
        submitted: Boolean(submission),
        submissionStatus: submission ? "Submitted" : "Not Submitted",
        submittedAt: submission?.createdAt || null,
        file: submission?.file || "",
        grade: submission?.grade || "",
        feedback: submission?.feedback || "",
      };
    });

    res.status(200).json(formatted);
  } catch (error) {
    console.error("Error fetching submissions:", error);
    res.status(500).json({ message: "Error fetching submissions", error });
  }
};
