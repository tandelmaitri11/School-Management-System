const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const {
  createAssignment,
  getAssignmentsByClass,
  getAssignmentsByClasses,
  getAssignmentsByTeacher,
  updateAssignment,
  deleteAssignment,
  submitAssignment,
  viewSubmissions,
  gradeSubmission,
  getSubmissionsByStudent,
} = require("../controller/assignmentController");

// ================== Multer File Upload Setup ==================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/assignments"); // folder to store uploaded files
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = /pdf|doc|docx|jpg|png|jpeg|zip|rar/;
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.test(ext)) cb(null, true);
    else cb(new Error("Only documents and images are allowed"));
  },
});

// ================== Assignment Routes ==================

// ✅ Create new assignment (Teacher)
router.post("/create", upload.single("file"), createAssignment);

// ✅ Get assignments by class (for student)
router.get("/class/:studentClass", getAssignmentsByClass);

// ✅ Get assignments by multiple classes (for dashboards)
router.get("/classes", getAssignmentsByClasses);

// ✅ Get assignments by teacher (for teacher dashboard)
router.get("/teacher/:teacherId", getAssignmentsByTeacher);

// ✅ Update assignment
router.put("/update/:id", upload.single("file"), updateAssignment);

// ✅ Delete assignment
router.delete("/delete/:id", deleteAssignment);

// ================== Submission Routes ==================

// ✅ Student submit assignment
router.post("/submit", upload.single("file"), submitAssignment);

// ✅ Teacher view all submissions for an assignment
router.get("/submissions/:assignmentId", viewSubmissions);

// ✅ Teacher grade a submission
router.put("/grade/:submissionId", gradeSubmission);

// ✅ Student view all their submissions
router.get("/student/:studentId", getSubmissionsByStudent);

router.get("/by-classes", async (req, res) => {
  try {
    const { classes } = req.query;
    if (!classes) return res.status(400).json({ message: "Class is required" });

    const assignments = await Assignment.find({
      classAssigned: Number(classes),
    }).sort({ createdAt: -1 });

    res.json(assignments);
  } catch (error) {
    console.error("Error fetching assignments by class:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
