const express = require("express");
const {
  getClassTimetable,
  previewTimetable,
  generateTimetable,
  manualUpsertTimetable,
  deleteTimetableSlot,
  deleteFullTimetable,
} = require("../controller/timetableController");

const router = express.Router();

router.get("/class/:classId", getClassTimetable);
router.post("/preview", previewTimetable);
router.post("/generate", generateTimetable);
router.post("/manual", manualUpsertTimetable);
router.post("/manual/delete", deleteTimetableSlot);
router.post("/manual/delete-full", deleteFullTimetable);

module.exports = router;
