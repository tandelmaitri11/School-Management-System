const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { verifyToken } = require("../middleware/authMiddleware");
const requireTeacher = require("../middleware/requireTeacher");
const requireAdmin = require("../middleware/requireAdmin");
const {
  createCourse,
  getTeacherCourses,
  updateCourse,
  deleteCourse,
  createChapter,
  updateChapter,
  getChaptersByCourse,
  createMaterial,
  getMaterialsByChapter,
  updateMaterial,
  deleteMaterial,
  getStudentCourses,
  getCourseContent,
  markMaterialCompleted,
  updateMaterialProgress,
  getStudentProgress,
  getTeacherProgress,
  getAdminProgress,
} = require("../controller/lmsController");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/lms");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = /mp4|mov|avi|mkv|pdf|doc|docx|ppt|pptx|jpg|png|jpeg/;
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.test(ext)) cb(null, true);
    else cb(new Error("Only video and document files are allowed"));
  },
});

// Teacher course management
router.post("/courses", verifyToken, requireTeacher, createCourse);
router.get("/teacher/courses", verifyToken, requireTeacher, getTeacherCourses);
router.put("/courses/:id", verifyToken, requireTeacher, updateCourse);
router.delete("/courses/:id", verifyToken, requireTeacher, deleteCourse);

// Chapters and materials
router.post("/chapters", verifyToken, requireTeacher, createChapter);
router.put("/chapters/:id", verifyToken, requireTeacher, updateChapter);
router.get("/courses/:courseId/chapters", verifyToken, getChaptersByCourse);

router.post("/materials", verifyToken, requireTeacher, upload.single("file"), createMaterial);
router.get("/chapters/:chapterId/materials", verifyToken, getMaterialsByChapter);
router.put("/materials/:id", verifyToken, requireTeacher, updateMaterial);
router.delete("/materials/:id", verifyToken, requireTeacher, deleteMaterial);

// Student access
router.get("/student/courses", verifyToken, getStudentCourses);
router.get("/courses/:courseId/content", verifyToken, getCourseContent);
router.post("/progress/complete", verifyToken, markMaterialCompleted);
router.post("/progress/update", verifyToken, updateMaterialProgress);
router.get("/progress/student/:studentId/course/:courseId", verifyToken, getStudentProgress);

// Progress analytics
router.get("/teacher/progress", verifyToken, requireTeacher, getTeacherProgress);
router.get("/admin/progress", verifyToken, requireAdmin, getAdminProgress);

module.exports = router;
