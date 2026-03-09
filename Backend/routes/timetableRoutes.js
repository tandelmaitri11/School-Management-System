const express = require("express");
const {
  addTimetable,
  checkConflict,
  getClassTimetable,
  getSubjectsByClass,
  autoGenerateClassTimetable,
  autoGenerateClassTimetablePreview,
  autoGenerateAllClassesTimetable
} = require("../controller/timetableController");

const router = express.Router();

router.post("/", addTimetable);
router.post("/check-conflict", checkConflict);
router.post("/auto-generate-class", autoGenerateClassTimetable);
router.post("/auto-generate-class/preview", autoGenerateClassTimetablePreview);
router.post("/auto-generate-all", autoGenerateAllClassesTimetable);
router.get("/class/:classId", getClassTimetable);

router.get("/subjects/:className", getSubjectsByClass);

module.exports = router;
