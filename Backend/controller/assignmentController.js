const Assignment = require("../models/assignment");
const Submission = require("../models/submission");
const path = require("path");
const fs = require("fs");


exports.createAssignment = async (req, res) => {
  try {
    const { title, description, subject, dueDate, teacherId, classAssigned } = req.body;
    const file = req.file ? req.file.path : null;

    if (!title || !subject || !teacherId || !classAssigned) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const assignment = new Assignment({
      title,
      description,
      subject,
      dueDate,
      teacherId,
      classAssigned,
      file,
    });

    await assignment.save();
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
    const assignments = await Assignment.find({ classAssigned: studentClass });

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

    const classList = classes.split(",").map((c) => c.trim());
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

    if (req.file) updates.file = req.file.path;

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
