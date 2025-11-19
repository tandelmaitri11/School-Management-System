const express = require("express");
const multer = require("multer");
const {
  addTeacher,
  getAllTeachers,
  getTeacherById,
  getTeacherByMongoId,
   getTeacherProfile,
  updateTeacher,
  updateTeacherByMongoId,
  deleteTeacher,
  getTeacherRegister,
} = require("../controller/teacherController");

const router = express.Router();

// Multer setup for pictures
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/teachers"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// Routes
router.post("/addTeacher", upload.single("picture"), addTeacher);
router.get("/getTeachers", getAllTeachers);
router.get("/getTeacher/:regNumber", getTeacherById);
router.get("/getTeacherById/:id", getTeacherByMongoId);
router.get("/teacher/profile/:teacherId", getTeacherProfile); // ✅ new route
router.put("/updateTeacher/:regNumber", upload.single("picture"), updateTeacher);
router.put("/updateTeacherById/:id", upload.single("picture"), updateTeacherByMongoId);
router.delete("/deleteTeacher/:regNumber", deleteTeacher);

router.get("/register", getTeacherRegister);

module.exports = router;
