const router = require("express").Router();
const feesController = require("../controller/feesController");

// class fee
router.post("/class-fee", feesController.addOrUpdateClassFee);
router.get("/class-fee", feesController.getAllClassFees);
router.patch("/class-fee/auto-reminder", feesController.setClassAutoReminderToggle);
router.get("/students/:className", feesController.getStudentsByClass);
router.get("/reports/class-wise", feesController.getClassWiseFeeReport);
router.get("/reports/month-wise", feesController.getMonthWiseFeeReport);

// student fees
router.get("/student/:studentId", feesController.getStudentFees);
router.post("/payment/cash", feesController.addStudentPayment);

// razorpay
router.post("/razorpay/create-order", feesController.createRazorpayOrder);
router.post("/razorpay/verify", feesController.verifyRazorpayPayment);

// receipt
router.get("/receipt/:feesId/:paymentId", feesController.downloadReceipt);
router.post("/receipt-email/:feesId/:paymentId", feesController.emailReceiptToStudent);

// reminder
router.post("/reminder/:studentId", feesController.sendFeesReminder);
router.post("/reminder/queue-all", feesController.queueAllFeeReminders);

// Add this line with your other report routes
router.get("/reports/student-wise", feesController.getStudentWiseFeeReport);

module.exports = router;
