const express = require("express");
const { addClass, getClass, getClassesByTeacher,getSubjectClasses,updateClass, deleteClass,getClassTotals, getTeachers } = require("../controller/classController");
const router = express.Router();

// Class CRUD
router.post("/", addClass);
router.get("/", getClass);
router.get("/by-teacher/:teacherId", getClassesByTeacher);
router.get("/by-subject/:teacherId", getSubjectClasses);
router.put("/:id", updateClass);
router.delete("/:id", deleteClass);

router.get("/total/:id", getClassTotals);

// Teacher fetch
router.get("/teachers", getTeachers);

module.exports = router;
