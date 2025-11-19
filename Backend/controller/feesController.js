const ClassFees = require("../models/ClassFees");
const Fees = require("../models/fees");
const Student = require("../models/studentregister");

// Add or update class fee
exports.addOrUpdateClassFee = async (req, res) => {
  try {
    const { className, totalFees } = req.body;
    if (!className || !totalFees)
      return res.status(400).json({ message: "Class and total fees required" });

    let fee = await ClassFees.findOne({ className });
    if (fee) {
      fee.totalFees = Number(totalFees);
      await fee.save();
      return res.json({ message: "Class fee updated", fee });
    }

    fee = new ClassFees({ className, totalFees: Number(totalFees) });
    await fee.save();
    res.json({ message: "Class fee saved", fee });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error saving class fee" });
  }
};

// Get all class fees
exports.getAllClassFees = async (req, res) => {
  try {
    const fees = await ClassFees.find().sort({ className: 1 });
    res.json({ classFees: fees });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching class fees" });
  }
};

// Get all students of a class
exports.getStudentsByClass = async (req, res) => {
  try {
    const { className } = req.params;
    const students = await Student.find({ studentClass: className });
    res.json({ students });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching students" });
  }
};

// Get student fees by studentId (updated)
exports.getStudentFees = async (req, res) => {
  try {
    const { studentId } = req.params;
    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: "Student not found" });

    let fees = await Fees.findOne({ studentId });

    // If fees do not exist yet, create a default object using class fee
    if (!fees) {
      const classFee = await ClassFees.findOne({ className: student.studentClass });
      const total = classFee ? classFee.totalFees : 0;

      fees = {
        studentId,
        studentName: student.name,
        studentClass: student.studentClass,
        totalFees: total,
        paidAmount: 0,
        remainingAmount: total,
        feeStatus: "Pending",
        paymentHistory: [],
      };
    }

    res.json({ fees });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching student fees" });
  }
};

// Add payment for student
exports.addStudentPayment = async (req, res) => {
  try {
    const { studentId, amount, mode } = req.body;
    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: "Student not found" });

    let fees = await Fees.findOne({ studentId });
    if (!fees) {
      // Create fees from class fee
      const classFee = await ClassFees.findOne({ className: student.studentClass });
      const total = classFee ? classFee.totalFees : 0;
      fees = new Fees({
        studentId,
        studentName: student.name,
        studentClass: student.studentClass,
        totalFees: total,
        paidAmount: 0,
        remainingAmount: total,
        feeStatus: "Pending",
        paymentHistory: [],
      });
    }

    fees.paidAmount += Number(amount);
    fees.remainingAmount = fees.totalFees - fees.paidAmount;
    fees.feeStatus = fees.remainingAmount <= 0 ? "Paid" : "Pending";
    fees.paymentHistory.push({ amount: Number(amount), mode, date: new Date() });

    await fees.save();
    res.json({ message: "Payment added", fees });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error adding payment" });
  }
};
