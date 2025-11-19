const express = require("express");
const router = express.Router();
const feesController = require("../controller/feesController");

// Class fees
router.post("/class-fee", feesController.addOrUpdateClassFee);
router.get("/all-class-fees", feesController.getAllClassFees);

// Students by class
router.get("/students/:className", feesController.getStudentsByClass);

// Student fees
router.get("/student-fees/:studentId", feesController.getStudentFees);
router.post("/student-payment", feesController.addStudentPayment);

module.exports = router;
