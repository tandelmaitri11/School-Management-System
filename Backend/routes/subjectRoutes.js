const express = require("express");
const {
  createSubject,
  getAllSubjects,
  getSubjectsByClass,
  deleteSubject,
  updateSubject,
} = require("../controller/subjectController");

const router = express.Router();

router.post("/createSubject", createSubject);
router.get("/getSubjects", getAllSubjects);
router.get("/getSubjects/:className", getSubjectsByClass);
router.delete("/deleteSubject/:id", deleteSubject);
router.put("/updateSubject/:id", updateSubject);

module.exports = router;
