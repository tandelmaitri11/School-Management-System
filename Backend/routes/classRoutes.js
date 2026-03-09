const express = require("express");
const {
  addClass,
  getClass,
  getClassesByTeacher,
  getSubjectClasses,
  updateClass,
  deleteClass,
  getClassTotals,
  getTeachers,
  addSection,
  updateSection,
  lockSection,
  getRegistrationOptionsByClass, // ✅ add
  getRegistrationPreviewByClass, // ✅ add
} = require("../controller/classController");

const router = express.Router();

router.post("/", addClass);
router.get("/", getClass);

router.get("/registration-options/:className", getRegistrationOptionsByClass); // ✅ NEW
router.get("/registration-preview/:className", getRegistrationPreviewByClass); // ✅ NEW

router.get("/by-teacher/:teacherId", getClassesByTeacher);
router.get("/by-subject/:teacherId", getSubjectClasses);
router.put("/:id", updateClass);
router.delete("/:id", deleteClass);

router.post("/:id/sections", addSection);
router.put("/:id/sections/:sectionId", updateSection);
router.put("/:id/sections/:sectionId/lock", lockSection);

router.get("/total/:id", getClassTotals);
router.get("/teachers", getTeachers);

module.exports = router;
