const express = require("express");
const router = express.Router();
const ctrl = require("../controller/teacherSalaryController");

// Teacher dropdown
router.get("/teachers", ctrl.getTeachers);

// Pay salary
router.post("/pay", ctrl.paySalary);
router.post("/monthly-sheet", ctrl.generateMonthlySheet);
router.post("/payout/:salaryId", ctrl.createPayout);
router.post("/razorpay/order/:salaryId", ctrl.createSalaryRazorpayOrder);
router.post("/razorpay/verify", ctrl.verifySalaryRazorpayPayment);
router.get("/slip/:salaryId", ctrl.downloadSalarySlip);

// Check month record
router.get("/check/:teacherId", ctrl.checkSalary);

// Get all records
router.get("/all", ctrl.getAllSalary);

// Update status (Approved / Rejected)
router.put("/status/:id", ctrl.updateStatus);

// Teacher salary history
router.get("/teacher/:teacherId/salary", ctrl.getSalaryByTeacher);

module.exports = router;
