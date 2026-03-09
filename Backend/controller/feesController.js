// controller/feesController.js
const ClassFees = require("../models/ClassFees");
const Fees = require("../models/fees");
const Student = require("../models/studentregister");
const razorpay = require("../config/razorpay");
const FeeOrder = require("../models/FeeOrder");
const crypto = require("crypto");
const PDFDocument = require("pdfkit");
const nodemailer = require("nodemailer");

/* =========================
   HELPERS
========================= */

const buildReceiptNo = () =>
  `RCPT-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(
    1000 + Math.random() * 9000
  )}`;

const getMailer = () =>
  nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASS,
    },
  });

const sendEmail = async ({ to, subject, html, text, attachments }) => {
  const transporter = getMailer();
  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_EMAIL,
    to,
    subject,
    html,
    text,
    attachments,
  });
};

const buildReceiptEmailHtml = ({ fees, payment, student }) => {
  const amount = Number(payment.amount || 0);
  const remaining = Number(fees.remainingAmount || 0);

  return `
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: auto; border: 1px solid #e5e5e5; border-radius: 8px; overflow: hidden;">
      <div style="background: #0d6efd; color: #fff; padding: 16px 20px;">
        <h2 style="margin: 0; font-size: 18px;">School Fees Receipt</h2>
      </div>
      <div style="padding: 18px 20px; color: #333;">
        <p style="margin: 0 0 10px;">Hello ${fees.studentName || "Student"},</p>
        <p style="margin: 0 0 14px;">Your payment has been received successfully.</p>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr><td style="padding: 6px 0;">Receipt No</td><td style="padding: 6px 0;"><strong>${payment.receiptNo}</strong></td></tr>
          <tr><td style="padding: 6px 0;">Student ID</td><td style="padding: 6px 0;">${payment.studentId || student?.studentId || "-"}</td></tr>
          <tr><td style="padding: 6px 0;">Class</td><td style="padding: 6px 0;">${fees.studentClass ?? "-"}</td></tr>
          <tr><td style="padding: 6px 0;">Payment Mode</td><td style="padding: 6px 0;">${payment.mode || "-"}</td></tr>
          <tr><td style="padding: 6px 0;">Amount Paid</td><td style="padding: 6px 0;">Rs ${amount}</td></tr>
          <tr><td style="padding: 6px 0;">Paid Till Now</td><td style="padding: 6px 0;">Rs ${fees.paidAmount}</td></tr>
          <tr><td style="padding: 6px 0;">Remaining</td><td style="padding: 6px 0;">Rs ${remaining}</td></tr>
        </table>
        <p style="margin: 14px 0 0; font-size: 13px; color: #777;">
          You can also download the PDF receipt from the student portal.
        </p>
      </div>
      <div style="background: #f8f9fa; padding: 10px 20px; font-size: 12px; color: #777; text-align: center;">
        This is a system-generated receipt.
      </div>
    </div>
  `;
};

const writeReceiptPdfStyled = (doc, fees, payment) => {
  const primaryColor = "#444444";
  const accentColor = "#003366";
  const lineColor = "#aaaaaa";

  const generateHr = (y) => {
    doc.strokeColor(lineColor).lineWidth(1).moveTo(50, y).lineTo(550, y).stroke();
  };

  doc
    .fillColor(accentColor)
    .fontSize(20)
    .text("PAYMENT RECEIPT", 50, 50, { align: "right" })
    .fontSize(10)
    .text("School Name / Institution", 50, 50, { align: "left" })
    .fillColor(primaryColor)
    .text("123 School Address Lane", 50, 65, { align: "left" })
    .text("City, State, Zip Code", 50, 80, { align: "left" })
    .moveDown();

  generateHr(100);

  const receiptTop = 115;

  doc
    .fontSize(10)
    .font("Helvetica-Bold")
    .text("Bill To:", 50, receiptTop)
    .font("Helvetica")
    .text(fees.studentName || "-", 50, receiptTop + 15)
    .text(`ID: ${payment.studentId || "-"}`, 50, receiptTop + 30)
    .text(`Class: ${fees.studentClass || "-"}`, 50, receiptTop + 45);

  doc
    .font("Helvetica-Bold")
    .text("Receipt No:", 400, receiptTop)
    .font("Helvetica")
    .text(payment.receiptNo || "-", 400, receiptTop + 15)
    .font("Helvetica-Bold")
    .text("Date & Time:", 400, receiptTop + 35)
    .font("Helvetica")
    .text(new Date(payment.date).toLocaleString("en-IN"), 400, receiptTop + 50);

  const tableTop = 200;
  const itemCodeX = 50;
  const descriptionX = 150;
  const refX = 300;
  const amountX = 450;

  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .text("Description", itemCodeX, tableTop)
    .text("Mode", descriptionX, tableTop)
    .text("Reference / Order ID", refX, tableTop)
    .text("Amount", amountX, tableTop, { align: "right" });

  generateHr(tableTop + 20);

  const rowY = tableTop + 35;
  const isOnline = (payment.mode || "").toLowerCase() === "online";
  const refText = isOnline ? payment.orderId || "-" : payment.transactionId || "Cash";

  doc
    .font("Helvetica")
    .fontSize(10)
    .text("Tuition / School Fees", itemCodeX, rowY)
    .text(payment.mode || "-", descriptionX, rowY)
    .text(refText, refX, rowY)
    .text(`Rs. ${payment.amount}`, amountX, rowY, { align: "right" });

  generateHr(rowY + 20);

  const summaryTop = rowY + 40;
  const labelX = 350;
  const valueX = 450;

  doc.font("Helvetica");

  doc.text("Total Fees:", labelX, summaryTop);
  doc.text(`Rs. ${fees.totalFees}`, valueX, summaryTop, { align: "right" });

  const paidBefore = fees.paidAmount - payment.amount;
  if (paidBefore > 0) {
    doc.text("Paid Previously:", labelX, summaryTop + 15);
    doc.text(`Rs. ${paidBefore}`, valueX, summaryTop + 15, { align: "right" });
  }

  doc.font("Helvetica-Bold");
  doc.text("Paid Now:", labelX, summaryTop + 30);
  doc.text(`Rs. ${payment.amount}`, valueX, summaryTop + 30, { align: "right" });

  doc.font("Helvetica");
  doc.fillColor("#cc0000");
  doc.text("Balance Due:", labelX, summaryTop + 45);
  doc.text(`Rs. ${fees.remainingAmount}`, valueX, summaryTop + 45, { align: "right" });

  doc.fillColor(primaryColor);

  const footerTop = 700;
  doc.fontSize(10).text("Thank you for your payment.", 50, footerTop, {
    align: "center",
    width: 500,
  });

  doc
    .fontSize(8)
    .fillColor(lineColor)
    .text(
      "This is a system generated receipt and does not require a physical signature.",
      50,
      footerTop + 15,
      { align: "center", width: 500 }
    );
};

const buildReceiptPdfBuffer = async (fees, payment) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    writeReceiptPdfStyled(doc, fees, payment);
    doc.end();
  });

/* =========================
   CLASS FEES
========================= */

exports.addOrUpdateClassFee = async (req, res) => {
  try {
    const { className, totalFees } = req.body;
    if (!className || totalFees === undefined || totalFees === null) {
      return res.status(400).json({ message: "Class and total fees required" });
    }

    let fee = await ClassFees.findOne({ className });
    if (fee) {
      fee.totalFees = Number(totalFees);
      await fee.save();
      return res.json({ message: "Class fee updated", fee });
    }

    fee = new ClassFees({ className, totalFees: Number(totalFees) });
    await fee.save();
    return res.json({ message: "Class fee saved", fee });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error saving class fee" });
  }
};

exports.getAllClassFees = async (req, res) => {
  try {
    const fees = await ClassFees.find().sort({ className: 1 });
    return res.json({ classFees: fees });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error fetching class fees" });
  }
};

exports.getStudentsByClass = async (req, res) => {
  try {
    const { className } = req.params;
    const students = await Student.find({ studentClass: Number(className) });
    return res.json({ students });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error fetching students" });
  }
};

/* =========================
   STUDENT FEES
========================= */

exports.getStudentFees = async (req, res) => {
  try {
    const { studentId } = req.params; // Student Mongo _id

    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: "Student not found" });

    let fees = await Fees.findOne({ studentId });

    if (!fees) {
      const classFee = await ClassFees.findOne({ className: student.studentClass });
      const total = classFee ? Number(classFee.totalFees) : 0;

      fees = {
        studentId,
        studentName: student.name,
        studentClass: student.studentClass,
        totalFees: total,
        paidAmount: 0,
        remainingAmount: total,
        feeStatus: total <= 0 ? "Paid" : "Pending",
        paymentHistory: [],
      };
    }

    return res.json({ fees });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error fetching student fees" });
  }
};

exports.addStudentPayment = async (req, res) => {
  try {
    const { studentId, amount, mode } = req.body;
    if (!studentId || !amount) {
      return res.status(400).json({ message: "studentId and amount required" });
    }

    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: "Student not found" });

    let fees = await Fees.findOne({ studentId });
    if (!fees) {
      const classFee = await ClassFees.findOne({ className: student.studentClass });
      const total = classFee ? Number(classFee.totalFees) : 0;

      fees = new Fees({
        studentId: String(studentId),
        studentName: student.name,
        studentClass: student.studentClass,
        totalFees: total,
        paidAmount: 0,
        remainingAmount: total,
        feeStatus: total <= 0 ? "Paid" : "Pending",
        paymentHistory: [],
      });
    }

    const pay = Number(amount);
    if (!pay || pay <= 0) return res.status(400).json({ message: "Invalid amount" });

    const remainingBefore = Number(fees.remainingAmount);
    const finalPay = Math.min(pay, remainingBefore);

    const receiptNo = buildReceiptNo();

    fees.paidAmount = Math.min(fees.totalFees, Number(fees.paidAmount) + finalPay);
    fees.remainingAmount = Math.max(0, Number(fees.totalFees) - Number(fees.paidAmount));
    fees.feeStatus = fees.remainingAmount <= 0 ? "Paid" : "Pending";

    fees.paymentHistory.push({
      amount: finalPay,
      mode: mode || "Cash",
      date: new Date(),
      transactionId: `CASH-${Date.now()}`,
      receiptNo,
      studentId: student.studentId, // STU0001
    });

    await fees.save();

    try {
      if (student.email) {
        const payment = fees.paymentHistory[fees.paymentHistory.length - 1];
        const html = buildReceiptEmailHtml({ fees, payment, student });
        const pdfBuffer = await buildReceiptPdfBuffer(fees, payment);
        await sendEmail({
          to: student.email,
          subject: `Fee Receipt ${payment.receiptNo}`,
          html,
          attachments: [
            {
              filename: `Receipt_${payment.receiptNo || payment._id}.pdf`,
              content: pdfBuffer,
              contentType: "application/pdf",
            },
          ],
        });
      }
    } catch (mailErr) {
      console.error("Receipt email failed (cash):", mailErr?.message || mailErr);
    }

    return res.json({ message: "Payment added", fees });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error adding payment" });
  }
};

/* =========================
   RAZORPAY - CREATE ORDER
========================= */

exports.createRazorpayOrder = async (req, res) => {
  try {
    const { studentId, payAmount } = req.body;
    if (!studentId) return res.status(400).json({ success: false, message: "studentId required" });

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ success: false, message: "Razorpay keys missing in .env" });
    }

    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    let fees = await Fees.findOne({ studentId });
    if (!fees) {
      const classFee = await ClassFees.findOne({ className: student.studentClass });
      const total = classFee ? Number(classFee.totalFees) : 0;

      fees = await Fees.create({
        studentId: String(studentId),
        studentName: student.name,
        studentClass: student.studentClass,
        totalFees: total,
        paidAmount: 0,
        remainingAmount: total,
        feeStatus: total <= 0 ? "Paid" : "Pending",
        paymentHistory: [],
      });
    }

    if (Number(fees.remainingAmount) <= 0) {
      return res.json({ success: false, message: "Fees already paid" });
    }

    const remaining = Number(fees.remainingAmount);
    const requested = payAmount ? Number(payAmount) : remaining;
    if (!requested || requested <= 0) {
      return res.status(400).json({ success: false, message: "Invalid payment amount" });
    }

    const amountToPay = Math.min(requested, remaining);

    const shortSid = String(studentId).slice(-6);
    const receipt = `fee_${shortSid}_${Date.now()}`; // <= 40 chars

    const order = await razorpay.orders.create({
      amount: Math.round(amountToPay * 100),
      currency: "INR",
      receipt,
      notes: {
        studentMongoId: String(studentId),
        feesId: String(fees._id),
        studentName: student.name,
        studentId: student.studentId,
      },
    });

    await FeeOrder.create({
      studentId: String(studentId),
      feesId: fees._id,
      amount: amountToPay,
      currency: "INR",
      razorpayOrderId: order.id,
      status: "created",
    });

    return res.json({
      success: true,
      order,
      key: process.env.RAZORPAY_KEY_ID,
      amount: amountToPay,
      student: {
        name: student.name,
        email: student.email,
        phone: student.phone,
        studentId: student.studentId,
      },
      feesId: fees._id,
    });
  } catch (err) {
    console.error("❌ create-order error:", err);
    return res.status(500).json({
      success: false,
      message: err?.message || "create order failed",
    });
  }
};

/* =========================
   RAZORPAY - VERIFY PAYMENT
========================= */

exports.verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: "Missing Razorpay verification data" });
    }

    // 1) signature verify
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Invalid payment signature" });
    }

    // 2) Atomic lock: mark order paid (prevents double credit)
    const feeOrder = await FeeOrder.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id, status: { $ne: "paid" } },
      {
        $set: {
          status: "paid",
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
        },
      },
      { new: true }
    );

    if (!feeOrder) {
      return res.json({ success: true, message: "Payment already verified" });
    }

    // 3) extra safety: fetch payment from Razorpay (recommended)
    const paymentInfo = await razorpay.payments.fetch(razorpay_payment_id);

    if (paymentInfo.order_id !== razorpay_order_id) {
      return res.status(400).json({ success: false, message: "Payment does not belong to this order" });
    }

    const expectedPaise = Math.round(Number(feeOrder.amount) * 100);
    if (Number(paymentInfo.amount) !== expectedPaise) {
      return res.status(400).json({ success: false, message: "Amount mismatch" });
    }

    if (paymentInfo.status !== "captured" && paymentInfo.status !== "authorized") {
      return res.status(400).json({ success: false, message: `Payment not completed: ${paymentInfo.status}` });
    }

    // 4) Update Fees
    const fees = await Fees.findById(feeOrder.feesId);
    if (!fees) return res.status(404).json({ success: false, message: "Fees record not found" });

    const student = await Student.findById(feeOrder.studentId);
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    fees.paidAmount = Math.min(Number(fees.totalFees), Number(fees.paidAmount) + Number(feeOrder.amount));
    fees.remainingAmount = Math.max(0, Number(fees.totalFees) - Number(fees.paidAmount));
    fees.feeStatus = fees.remainingAmount <= 0 ? "Paid" : "Pending";

    const receiptNo = buildReceiptNo();

    fees.paymentHistory.push({
      amount: Number(feeOrder.amount),
      mode: "Online",
      date: new Date(),
      transactionId: razorpay_payment_id,
      orderId: razorpay_order_id,
      receiptNo,
      studentId: student.studentId,
    });

    await fees.save();

    // 5) Email receipt (optional)
    try {
      if (student.email) {
        const payment = fees.paymentHistory[fees.paymentHistory.length - 1];
        const html = buildReceiptEmailHtml({ fees, payment, student });
        const pdfBuffer = await buildReceiptPdfBuffer(fees, payment);
        await sendEmail({
          to: student.email,
          subject: `Fee Receipt ${payment.receiptNo}`,
          html,
          attachments: [
            {
              filename: `Receipt_${payment.receiptNo || payment._id}.pdf`,
              content: pdfBuffer,
              contentType: "application/pdf",
            },
          ],
        });
      }
    } catch (mailErr) {
      console.error("Receipt email failed (online):", mailErr?.message || mailErr);
    }

    return res.json({
      success: true,
      message: "Payment verified & fees updated",
      fees,
      receipt: {
        feesId: fees._id,
        paymentId: fees.paymentHistory[fees.paymentHistory.length - 1]._id,
        receiptNo,
      },
    });
  } catch (err) {
    console.error("❌ verifyRazorpayPayment error:", err);
    return res.status(500).json({ success: false, message: err?.message || "Error verifying payment" });
  }
};

/* =========================
   RECEIPT DOWNLOAD
========================= */
exports.downloadReceipt = async (req, res) => {
  try {
    const { feesId, paymentId } = req.params;

    const fees = await Fees.findById(feesId);
    if (!fees) return res.status(404).json({ message: "Fees record not found" });

    const payment = fees.paymentHistory.id(paymentId);
    if (!payment) return res.status(404).json({ message: "Payment not found" });

    let needsSave = false;
    if (!payment.receiptNo) {
      payment.receiptNo = buildReceiptNo();
      needsSave = true;
    }
    if (!payment.studentId && fees.studentId) {
      const student = await Student.findById(fees.studentId);
      if (student?.studentId) {
        payment.studentId = student.studentId;
        needsSave = true;
      }
    }
    if (needsSave) await fees.save();

    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const fileName = `Receipt_${payment.receiptNo || payment._id}.pdf`;
    const isInline = String(req.query.view || "") === "1";

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `${isInline ? "inline" : "attachment"}; filename="${fileName}"`);

    doc.pipe(res);
    writeReceiptPdfStyled(doc, fees, payment);
    doc.end();
  } catch (err) {
    console.error("Receipt download error:", err);
    return res.status(500).json({ message: "Error generating receipt" });
  }
};

exports.emailReceiptToStudent = async (req, res) => {
  try {
    const { feesId, paymentId } = req.params;

    const fees = await Fees.findById(feesId);
    if (!fees) return res.status(404).json({ message: "Fees record not found" });

    const payment = fees.paymentHistory.id(paymentId);
    if (!payment) return res.status(404).json({ message: "Payment not found" });

    const student = fees.studentId ? await Student.findById(fees.studentId) : null;
    const toEmail = req.body?.email || student?.email;
    if (!toEmail) return res.status(400).json({ message: "Student email not found" });

    let needsSave = false;
    if (!payment.receiptNo) {
      payment.receiptNo = buildReceiptNo();
      needsSave = true;
    }
    if (!payment.studentId && student?.studentId) {
      payment.studentId = student.studentId;
      needsSave = true;
    }
    if (needsSave) await fees.save();

    const subject = `Fee Receipt ${payment.receiptNo}`;
    const html = buildReceiptEmailHtml({ fees, payment, student });
    const pdfBuffer = await buildReceiptPdfBuffer(fees, payment);

    await sendEmail({
      to: toEmail,
      subject,
      html,
      attachments: [
        {
          filename: `Receipt_${payment.receiptNo || payment._id}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });

    return res.json({ message: "Receipt email sent", to: toEmail });
  } catch (err) {
    console.error("Receipt email error:", err);
    return res.status(500).json({ message: "Error sending receipt email" });
  }
};

exports.sendFeesReminder = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { dueDate, lateFee } = req.body || {};

    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: "Student not found" });

    let fees = await Fees.findOne({ studentId });
    if (!fees) {
      const classFee = await ClassFees.findOne({ className: student.studentClass });
      const total = classFee ? Number(classFee.totalFees) : 0;
      fees = {
        studentId,
        studentName: student.name,
        studentClass: student.studentClass,
        totalFees: total,
        paidAmount: 0,
        remainingAmount: total,
      };
    }

    const remaining = Number(fees.remainingAmount || 0);
    if (remaining <= 0) return res.json({ message: "No pending fees. Reminder not sent." });

    const feePenalty = lateFee ? Number(lateFee) : 0;
    const totalDue = remaining + (feePenalty > 0 ? feePenalty : 0);

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: auto; border: 1px solid #e5e5e5; border-radius: 8px; overflow: hidden;">
        <div style="background: #dc3545; color: #fff; padding: 16px 20px;">
          <h2 style="margin: 0; font-size: 18px;">Fee Payment Reminder</h2>
        </div>
        <div style="padding: 18px 20px; color: #333;">
          <p style="margin: 0 0 10px;">Hello ${student.name || "Student"},</p>
          <p style="margin: 0 0 12px;">This is a reminder that your fee payment is pending.</p>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr><td style="padding: 6px 0;">Student ID</td><td style="padding: 6px 0;">${student.studentId || "-"}</td></tr>
            <tr><td style="padding: 6px 0;">Class</td><td style="padding: 6px 0;">${student.studentClass ?? "-"}</td></tr>
            <tr><td style="padding: 6px 0;">Pending Amount</td><td style="padding: 6px 0;">Rs ${remaining}</td></tr>
            ${feePenalty > 0 ? `<tr><td style="padding: 6px 0;">Late Fee</td><td style="padding: 6px 0;">Rs ${feePenalty}</td></tr>` : ""}
            ${feePenalty > 0 ? `<tr><td style="padding: 6px 0;"><strong>Total Due</strong></td><td style="padding: 6px 0;"><strong>Rs ${totalDue}</strong></td></tr>` : ""}
            ${dueDate ? `<tr><td style="padding: 6px 0;">Due Date</td><td style="padding: 6px 0;">${dueDate}</td></tr>` : ""}
          </table>
          <p style="margin: 14px 0 0; font-size: 13px; color: #777;">
            Please pay at the earliest to avoid any penalties.
          </p>
        </div>
        <div style="background: #f8f9fa; padding: 10px 20px; font-size: 12px; color: #777; text-align: center;">
          If you already paid, please ignore this message.
        </div>
      </div>
    `;

    await sendEmail({ to: student.email, subject: "Fee Payment Reminder", html });
    return res.json({ message: "Reminder email sent", to: student.email });
  } catch (err) {
    console.error("Reminder email error:", err);
    return res.status(500).json({ message: "Error sending reminder email" });
  }
};
