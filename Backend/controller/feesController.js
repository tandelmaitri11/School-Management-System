// controller/feesController.js
const ClassFees = require("../models/ClassFees");
const Fees = require("../models/fees");
const Student = require("../models/studentregister");
const razorpay = require("../config/razorpay");
const FeeOrder = require("../models/FeeOrder");
const crypto = require("crypto");
const PDFDocument = require("pdfkit");
const nodemailer = require("nodemailer");
const { enqueueBulkEmailJobs, enqueueBulkSmsJobs } = require("../services/messageQueueService");
const { processFeesAutoReminders } = require("../services/feesReminderService");
const { calculateLateFeeState, resolveDueDate, toMoney } = require("../utils/lateFee");

/* =========================
   HELPERS
========================= */

const buildReceiptNo = () =>
  `RCPT-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(
    1000 + Math.random() * 9000
  )}`;

const normalizeStream = (stream) => String(stream || "").trim();
const toDayStart = (d) => new Date(new Date(d).setHours(0, 0, 0, 0));
const toDayEnd = (d) => new Date(new Date(d).setHours(23, 59, 59, 999));

const parseDateInput = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const getClassFeeForStudent = async (student) => {
  const className = Number(student?.studentClass);
  const stream = normalizeStream(student?.stream);

  if (!className) return null;

  // Prefer stream-specific fee, then fallback to class-level general fee.
  if (stream) {
    const streamFee = await ClassFees.findOne({ className, stream }).sort({ updatedAt: -1 });
    if (streamFee) return streamFee;
  }

  return ClassFees.findOne({
    className,
    $or: [{ stream: "" }, { stream: { $exists: false } }, { stream: null }],
  }).sort({ updatedAt: -1 });
};

const syncFeesLateState = async ({ fees, classFee, shouldSave = true }) => {
  const state = calculateLateFeeState({ fees, classFee, now: new Date() });

  fees.remainingAmount = state.baseRemaining;
  fees.lateFeeAccrued = state.lateFeeAccrued;
  fees.feeStatus = state.feeStatus;
  fees.lastLateFeeCalcAt = new Date();
  if (!fees.dueDate && state.dueDate) fees.dueDate = state.dueDate;

  if (shouldSave && typeof fees.save === "function") {
    await fees.save();
  }

  return state;
};

const applyPaymentAgainstDue = ({ fees, requestedAmount, receiptNo, mode, student }) => {
  const pay = toMoney(requestedAmount);
  const lateBefore = toMoney(fees.lateFeeAccrued);
  const baseBefore = toMoney(fees.remainingAmount);
  const totalDueBefore = toMoney(lateBefore + baseBefore);
  const finalPay = Math.min(pay, totalDueBefore);

  const payLate = Math.min(finalPay, lateBefore);
  const payBase = Math.min(baseBefore, finalPay - payLate);

  fees.lateFeeAccrued = toMoney(lateBefore - payLate);
  fees.paidAmount = toMoney(Math.min(Number(fees.totalFees || 0), Number(fees.paidAmount || 0) + payBase));
  fees.remainingAmount = toMoney(Math.max(0, Number(fees.totalFees || 0) - Number(fees.paidAmount || 0)));
  fees.feeStatus = fees.remainingAmount + fees.lateFeeAccrued <= 0 ? "Paid" : "Pending";

  fees.paymentHistory.push({
    amount: finalPay,
    mode: mode || "Cash",
    date: new Date(),
    transactionId: mode === "Online" ? undefined : `CASH-${Date.now()}`,
    receiptNo,
    studentId: student?.studentId || "",
  });

  return { finalPay, payLate, payBase, totalDueBefore };
};

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

const sendReceiptEmailSafe = async ({ fees, payment, student }) => {
  if (!student?.email) {
    return { sent: false, reason: "Student email not found" };
  }

  if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASS) {
    return { sent: false, reason: "SMTP not configured" };
  }

  try {
    const html = buildReceiptEmailHtml({ fees, payment, student });
    const pdfBuffer = await buildReceiptPdfBuffer(fees, payment, student);
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

    return { sent: true };
  } catch (err) {
    return { sent: false, reason: err?.message || "Email send failed" };
  }
};

const isValidTenDigitPhone = (v) => /^\d{10}$/.test(String(v || "").trim());

const buildReceiptEmailHtml = ({ fees, payment, student }) => {
  const amount = Number(payment.amount || 0);
  const remaining = Number(fees.remainingAmount || 0);
  const streamText = String(student?.stream || "").trim();
  const sectionText = String(student?.section || "").trim();
  const history = [...(fees.paymentHistory || [])].sort(
    (a, b) => new Date(a.date || 0) - new Date(b.date || 0)
  );

  const paymentRows = history.length
    ? history
        .map(
          (p, idx) => `
            <tr style="border-bottom: 1px solid #f0f0f0;">
              <td style="padding: 10px 5px; color: #666;">${idx + 1}</td>
              <td style="padding: 10px 5px;">${new Date(p.date).toLocaleDateString("en-IN")}</td>
              <td style="padding: 10px 5px;">${p.mode || "-"}</td>
              <td style="padding: 10px 5px; font-family: monospace;">${p.receiptNo || "-"}</td>
              <td style="padding: 10px 5px; text-align: right; font-weight: bold;">₹${Number(p.amount || 0).toLocaleString()}</td>
            </tr>
          `
        )
        .join("")
    : `<tr><td colspan="5" style="padding: 20px; text-align: center; color: #999;">No payment history found</td></tr>`;

  return `
    <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 20px auto; border: 1px solid #eee; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); overflow: hidden; background-color: #ffffff;">
      <div style="background: linear-gradient(135deg, #0d6efd 0%, #0046af 100%); color: #ffffff; padding: 30px 25px; text-align: center;">
        <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 2px; opacity: 0.8; margin-bottom: 8px;">Payment Confirmation</div>
        <h1 style="margin: 0; font-size: 24px; font-weight: 700;">Receipt #${payment.receiptNo}</h1>
      </div>
      
      <div style="padding: 30px 25px;">
        <p style="margin: 0 0 20px; font-size: 16px; color: #333;">Hello <strong>${fees.studentName || "Student"}</strong>,</p>
        <p style="margin: 0 0 25px; font-size: 15px; color: #555; line-height: 1.5;">Your payment has been successfully processed. Below are the transaction details and your updated fee balance.</p>
        
        <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 30px; border: 1px solid #edf2f7;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr><td style="padding: 5px 0; color: #718096;">Student ID</td><td style="padding: 5px 0; text-align: right; font-weight: 600;">${payment.studentId || student?.studentId || "-"}</td></tr>
            <tr><td style="padding: 5px 0; color: #718096;">Class</td><td style="padding: 5px 0; text-align: right; font-weight: 600;">${fees.studentClass ?? "-"}${sectionText ? ` (${sectionText})` : ""}</td></tr>
            ${streamText ? `<tr><td style="padding: 5px 0; color: #718096;">Stream</td><td style="padding: 5px 0; text-align: right; font-weight: 600;">${streamText}</td></tr>` : ""}
            <tr><td style="padding: 15px 0 5px 0; color: #718096;">Payment Mode</td><td style="padding: 15px 0 5px 0; text-align: right; font-weight: 600;">${payment.mode || "-"}</td></tr>
            <tr>
              <td style="padding: 5px 0; color: #0d6efd; font-size: 16px; font-weight: bold;">Amount Paid</td>
              <td style="padding: 5px 0; text-align: right; color: #0d6efd; font-size: 18px; font-weight: 800;">₹${amount.toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: #e53e3e;">Remaining Balance</td>
              <td style="padding: 5px 0; text-align: right; color: #e53e3e; font-weight: 700;">₹${remaining.toLocaleString()}</td>
            </tr>
          </table>
        </div>

        <h3 style="margin: 0 0 15px; font-size: 16px; color: #2d3748; border-bottom: 2px solid #edf2f7; padding-bottom: 8px;">Payment History</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <thead>
            <tr style="background-color: #fcfcfc;">
              <th style="text-align: left; padding: 10px 5px; color: #a0aec0; font-weight: 600;">#</th>
              <th style="text-align: left; padding: 10px 5px; color: #a0aec0; font-weight: 600;">Date</th>
              <th style="text-align: left; padding: 10px 5px; color: #a0aec0; font-weight: 600;">Mode</th>
              <th style="text-align: left; padding: 10px 5px; color: #a0aec0; font-weight: 600;">Receipt</th>
              <th style="text-align: right; padding: 10px 5px; color: #a0aec0; font-weight: 600;">Amount</th>
            </tr>
          </thead>
          <tbody>${paymentRows}</tbody>
        </table>

        <div style="margin-top: 30px; padding: 15px; background: #fffaf0; border-left: 4px solid #f6ad55; font-size: 13px; color: #744210;">
          <strong>Note:</strong> You can download the full PDF receipt and detailed statement anytime from the student portal.
        </div>
      </div>

      <div style="background: #f8f9fa; padding: 20px; font-size: 12px; color: #a0aec0; text-align: center; border-top: 1px solid #eee;">
        <p style="margin: 0;">This is a system-generated receipt. No signature required.</p>
        <p style="margin: 5px 0 0;">&copy; ${new Date().getFullYear()} Your Institution Name</p>
      </div>
    </div>
  `;
};

const writeReceiptPdfStyled = (doc, fees, payment, student = null) => {
  // Brand Configuration
  const brandColor = "#1a365d"; // Deep Navy
  const secondaryColor = "#4a5568";
  const successColor = "#2f855a";
  const dangerColor = "#c53030";
  const mutedColor = "#a0aec0";
  const lightBg = "#f8fafc";
  
  const streamText = String(student?.stream || "").trim();
  const sectionText = String(student?.section || "").trim();
  const history = [...(fees.paymentHistory || [])].sort(
    (a, b) => new Date(a.date || 0) - new Date(b.date || 0)
  );

  // 1. --- TOP HEADER (Professional Branding) ---
  doc.rect(0, 0, 612, 120).fill(brandColor);
  
  doc
    .fillColor("#ffffff")
    .font("Helvetica-Bold")
    .fontSize(24)
    .text("FEE RECEIPT", 50, 45)
    .fontSize(10)
    .font("Helvetica")
    .text("OFFICIAL ACCOUNT STATEMENT", 50, 75, { characterSpacing: 1 });

  doc
    .fillColor("#ffffff")
    .fontSize(12)
    .font("Helvetica-Bold")
    .text("SchoolY ", 350, 45, { align: "right", width: 212 })
    .font("Helvetica")
    .fontSize(8)
    .text("123 Education Boulevard, Suite 500", 350, 60, { align: "right", width: 212 })
    .text("City, State, Zip - 000000", 350, 70, { align: "right", width: 212 })
    .text("Support: +91 999 999 9999", 350, 80, { align: "right", width: 212 });

  // 2. --- INFO BAR (Student & Receipt Summary) ---
  const infoY = 140;
  doc.rect(50, infoY, 512, 70).fill(lightBg);
  doc.rect(50, infoY, 512, 70).lineWidth(0.5).stroke("#e2e8f0");

  // Student Info Column
  doc.fillColor(secondaryColor).font("Helvetica-Bold").fontSize(8).text("STUDENT TO:", 65, infoY + 12);
  doc.fillColor("#000000").fontSize(11).text(fees.studentName?.toUpperCase() || "-", 65, infoY + 25);
  doc.fillColor(secondaryColor).font("Helvetica").fontSize(9).text(`ID: ${payment.studentId || "-"}`, 65, infoY + 40);
  doc.text(`Class: ${fees.studentClass || "-"}${sectionText ? ` | Sec: ${sectionText}` : ""}`, 65, infoY + 52);

  // Receipt Details Column
  doc.fillColor(secondaryColor).font("Helvetica-Bold").fontSize(8).text("RECEIPT DETAILS:", 300, infoY + 12);
  doc.fillColor("#000000").font("Helvetica").fontSize(9).text(`Receipt No: ${payment.receiptNo || "-"}`, 300, infoY + 25);
  doc.text(`Date: ${new Date(payment.date).toLocaleString("en-IN")}`, 300, infoY + 37);
  doc.text(`Status: PAID`, 300, infoY + 49);

  // 3. --- TRANSACTION TABLE ---
  const tableTop = 230;
  
  // Table Header
  doc.rect(50, tableTop, 512, 25).fill(brandColor);
  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(9);
  doc.text("DESCRIPTION", 65, tableTop + 9);
  doc.text("MODE", 220, tableTop + 9);
  doc.text("REFERENCE NO", 320, tableTop + 9);
  doc.text("AMOUNT", 450, tableTop + 9, { align: "right", width: 100 });

  // Current Payment Row
  const rowY = tableTop + 35;
  const isOnline = (payment.mode || "").toLowerCase() === "online";
  const refText = isOnline ? (payment.orderId || "-") : (payment.transactionId || "CASH");

  doc.fillColor("#000000").font("Helvetica").fontSize(10);
  doc.text("Tuition & Academic Fees", 65, rowY);
  doc.text(payment.mode || "N/A", 220, rowY);
  doc.text(refText, 320, rowY, { width: 120 });
  doc.font("Helvetica-Bold").text(`Rs. ${Number(payment.amount).toLocaleString()}`, 450, rowY, { align: "right", width: 100 });

  doc.moveTo(50, rowY + 20).lineTo(562, rowY + 20).strokeColor("#edf2f7").stroke();

  // 4. --- FINANCIAL SUMMARY BOX ---
  const summaryY = rowY + 40;
  const boxWidth = 200;
  const boxX = 362;

  doc.rect(boxX, summaryY, boxWidth, 90).fill(lightBg);
  
  const drawRow = (label, value, y, color = "#000000", isBold = false) => {
    doc.fillColor(secondaryColor).font("Helvetica").fontSize(9).text(label, boxX + 10, y);
    doc.fillColor(color).font(isBold ? "Helvetica-Bold" : "Helvetica").text(`Rs. ${value.toLocaleString()}`, boxX + 10, y, { align: "right", width: boxWidth - 20 });
  };

  drawRow("Total Annual Fees", fees.totalFees, summaryY + 12);
  drawRow("Paid Previously", fees.paidAmount - payment.amount, summaryY + 28);
  drawRow("Current Paid", payment.amount, summaryY + 44, successColor, true);
  
  doc.moveTo(boxX + 10, summaryY + 60).lineTo(boxX + boxWidth - 10, summaryY + 60).strokeColor("#cbd5e0").stroke();
  drawRow("BALANCE DUE", fees.remainingAmount, summaryY + 68, dangerColor, true);

  // 5. --- ACCOUNT HISTORY SECTION (Professionalized) ---
  const historyTop = summaryY + 110;
  
  doc.fillColor(brandColor).font("Helvetica-Bold").fontSize(12).text("COMPLETE PAYMENT HISTORY", 50, historyTop);
  doc.rect(50, historyTop + 15, 512, 2).fill(brandColor);

  doc.fillColor(secondaryColor).font("Helvetica-Bold").fontSize(8);
  doc.text("#", 60, historyTop + 25);
  doc.text("DATE", 85, historyTop + 25);
  doc.text("MODE", 220, historyTop + 25);
  doc.text("RECEIPT NO", 320, historyTop + 25);
  doc.text("AMOUNT", 450, historyTop + 25, { align: "right", width: 100 });

  let hRowY = historyTop + 45;
  history.forEach((p, idx) => {
    // Zebra Striping for rows
    if (idx % 2 === 0) {
      doc.rect(50, hRowY - 5, 512, 18).fill("#fdfdfd");
    }

    doc.fillColor("#444").font("Helvetica").fontSize(9);
    doc.text(String(idx + 1), 60, hRowY);
    doc.text(p.date ? new Date(p.date).toLocaleDateString("en-IN") : "-", 85, hRowY);
    doc.text(p.mode || "-", 220, hRowY);
    doc.text(p.receiptNo || "-", 320, hRowY);
    doc.font("Helvetica-Bold").text(`Rs. ${Number(p.amount).toLocaleString()}`, 450, hRowY, { align: "right", width: 100 });
    
    hRowY += 18;
  });

  // 6. --- FOOTER ---
  const footerY = 740;
  doc.rect(50, footerY, 512, 1).fill("#e2e8f0");
  
  doc
    .fillColor(mutedColor)
    .fontSize(8)
    .text("NOTE: This is a system-generated document. Digital confirmation of payment via our online portal.", 50, footerY + 15, { align: "center", width: 512 })
    .font("Helvetica-Bold")
    .text("Thank you for your timely payment.", 50, footerY + 30, { align: "center", width: 512 });

  // Watermark (Optional for Professionalism)
  doc.fillColor("#000000")
     .fillOpacity(0.03)
     .fontSize(60)
     .font("Helvetica-Bold")
     .text("OFFICIAL RECEIPT", 50, 400, { rotate: 45, align: "center" })
     .fillOpacity(1); // Reset opacity
};

const buildReceiptPdfBuffer = async (fees, payment, student = null) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    writeReceiptPdfStyled(doc, fees, payment, student);
    doc.end();
  });

/* =========================
   CLASS FEES
========================= */

exports.addOrUpdateClassFee = async (req, res) => {
  try {
    const { className, totalFees } = req.body;
    const stream = normalizeStream(req.body.stream);
    const hasAutoToggle = typeof req.body.autoReminderEnabled === "boolean";
    const hasDueDay = req.body.dueDay !== undefined && req.body.dueDay !== null && req.body.dueDay !== "";
    const hasGraceDays =
      req.body.graceDays !== undefined && req.body.graceDays !== null && req.body.graceDays !== "";
    const hasLateFeeType = typeof req.body.lateFeeType === "string" && req.body.lateFeeType.trim() !== "";
    const hasLateFeeValue =
      req.body.lateFeeValue !== undefined && req.body.lateFeeValue !== null && req.body.lateFeeValue !== "";
    const hasLateFeeCap =
      req.body.lateFeeCap !== undefined && req.body.lateFeeCap !== null && req.body.lateFeeCap !== "";
    if (!className || totalFees === undefined || totalFees === null) {
      return res.status(400).json({ message: "Class and total fees required" });
    }
    if (hasLateFeeType) {
      const t = String(req.body.lateFeeType).trim().toLowerCase();
      if (!["flat", "daily", "percent"].includes(t)) {
        return res.status(400).json({ message: "lateFeeType must be flat, daily, or percent" });
      }
    }

    let fee = await ClassFees.findOne(
      stream
        ? { className: Number(className), stream }
        : {
            className: Number(className),
            $or: [{ stream: "" }, { stream: { $exists: false } }, { stream: null }],
          }
    ).sort({ updatedAt: -1 });
    if (fee) {
      fee.totalFees = Number(totalFees);
      fee.stream = stream;
      if (hasAutoToggle) fee.autoReminderEnabled = req.body.autoReminderEnabled;
      if (hasDueDay) fee.dueDay = Math.max(1, Math.min(31, Math.floor(Number(req.body.dueDay) || 1)));
      if (hasGraceDays) fee.graceDays = Math.max(0, Math.floor(Number(req.body.graceDays) || 0));
      if (hasLateFeeType) fee.lateFeeType = String(req.body.lateFeeType).trim().toLowerCase();
      if (hasLateFeeValue) fee.lateFeeValue = Math.max(0, Number(req.body.lateFeeValue) || 0);
      if (hasLateFeeCap) fee.lateFeeCap = Math.max(0, Number(req.body.lateFeeCap) || 0);
      await fee.save();
      return res.json({ message: "Class fee updated", fee, stream });
    }

    fee = new ClassFees({
      className: Number(className),
      stream,
      totalFees: Number(totalFees),
      autoReminderEnabled: hasAutoToggle ? req.body.autoReminderEnabled : true,
      dueDay: hasDueDay ? Math.max(1, Math.min(31, Math.floor(Number(req.body.dueDay) || 1))) : null,
      graceDays: hasGraceDays ? Math.max(0, Math.floor(Number(req.body.graceDays) || 0)) : 0,
      lateFeeType: hasLateFeeType ? String(req.body.lateFeeType).trim().toLowerCase() : "flat",
      lateFeeValue: hasLateFeeValue ? Math.max(0, Number(req.body.lateFeeValue) || 0) : 0,
      lateFeeCap: hasLateFeeCap ? Math.max(0, Number(req.body.lateFeeCap) || 0) : 0,
    });
    await fee.save();
    return res.json({ message: "Class fee saved", fee, stream });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error saving class fee" });
  }
};

exports.setClassAutoReminderToggle = async (req, res) => {
  try {
    const { className, enabled } = req.body || {};
    const stream = normalizeStream(req.body?.stream);

    if (!className || typeof enabled !== "boolean") {
      return res.status(400).json({ message: "className and enabled(boolean) are required" });
    }

    if (stream) {
      const fee = await ClassFees.findOne({ className: Number(className), stream }).sort({ updatedAt: -1 });
      if (!fee) {
        return res.status(404).json({ message: "Class fee config not found for selected class/stream" });
      }
      fee.autoReminderEnabled = enabled;
      await fee.save();

      return res.json({
        message: `Auto reminder ${enabled ? "enabled" : "disabled"} for Class ${className} (${stream})`,
        fee,
      });
    }

    const result = await ClassFees.updateMany(
      { className: Number(className) },
      { $set: { autoReminderEnabled: enabled } }
    );

    if (!result.matchedCount) {
      return res.status(404).json({ message: "Class fee config not found for selected class" });
    }

    return res.json({
      message: `Auto reminder ${enabled ? "enabled" : "disabled"} for Class ${className} (all streams)`,
      updatedCount: result.modifiedCount,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error updating auto reminder setting" });
  }
};

exports.getAllClassFees = async (req, res) => {
  try {
    const fees = await ClassFees.find().sort({ className: 1, stream: 1, updatedAt: -1 });
    return res.json({ classFees: fees });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error fetching class fees" });
  }
};

exports.getStudentsByClass = async (req, res) => {
  try {
    const { className } = req.params;
    const stream = normalizeStream(req.query.stream);
    const query = { studentClass: Number(className) };
    if (stream) query.stream = stream;

    const students = await Student.find(query);
    return res.json({ students });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error fetching students" });
  }
};

/* =========================
   REPORTS
========================= */

exports.getClassWiseFeeReport = async (req, res) => {
  try {
    const fromRaw = parseDateInput(req.query.from);
    const toRaw = parseDateInput(req.query.to);
    const classNameRaw = req.query.className;

    if ((req.query.from && !fromRaw) || (req.query.to && !toRaw)) {
      return res.status(400).json({ message: "Invalid date. Use YYYY-MM-DD" });
    }

    const filter = {};
    if (classNameRaw !== undefined && classNameRaw !== null && classNameRaw !== "") {
      filter.studentClass = Number(classNameRaw);
    }

    const paymentDateFilter = {};
    if (fromRaw) paymentDateFilter.$gte = toDayStart(fromRaw);
    if (toRaw) paymentDateFilter.$lte = toDayEnd(toRaw);

    const strictFilter = { ...filter };
    if (Object.keys(paymentDateFilter).length) {
      strictFilter.paymentHistory = { $elemMatch: { date: paymentDateFilter } };
    }

    const baseRows = await Fees.aggregate([
      { $match: strictFilter },
      {
        $group: {
          _id: "$studentClass",
          studentsCount: { $sum: 1 },
          totalFees: { $sum: { $ifNull: ["$totalFees", 0] } },
          paidAmount: { $sum: { $ifNull: ["$paidAmount", 0] } },
          basePendingAmount: { $sum: { $ifNull: ["$remainingAmount", 0] } },
          lateFeeOutstanding: { $sum: { $ifNull: ["$lateFeeAccrued", 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const paymentRows = await Fees.aggregate([
      { $match: strictFilter },
      { $unwind: "$paymentHistory" },
      ...(Object.keys(paymentDateFilter).length
        ? [{ $match: { "paymentHistory.date": paymentDateFilter } }]
        : []),
      {
        $group: {
          _id: "$studentClass",
          collectedInRange: { $sum: { $ifNull: ["$paymentHistory.amount", 0] } },
          transactionsCount: { $sum: 1 },
          cashCollected: {
            $sum: {
              $cond: [
                {
                  $regexMatch: {
                    input: { $toLower: { $ifNull: ["$paymentHistory.mode", ""] } },
                    regex: "cash",
                  },
                },
                { $ifNull: ["$paymentHistory.amount", 0] },
                0,
              ],
            },
          },
          onlineCollected: {
            $sum: {
              $cond: [
                {
                  $regexMatch: {
                    input: { $toLower: { $ifNull: ["$paymentHistory.mode", ""] } },
                    regex: "online|upi|qr|card|netbank",
                  },
                },
                { $ifNull: ["$paymentHistory.amount", 0] },
                0,
              ],
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const paymentByClass = new Map(paymentRows.map((r) => [Number(r._id), r]));
    const classWise = baseRows.map((r) => {
      const p = paymentByClass.get(Number(r._id)) || {};
      return {
        className: Number(r._id),
        studentsCount: Number(r.studentsCount || 0),
        totalFees: Number(r.totalFees || 0),
        paidAmount: Number(r.paidAmount || 0),
        basePendingAmount: Number(r.basePendingAmount || 0),
        lateFeeOutstanding: Number(r.lateFeeOutstanding || 0),
        totalDue: Number(r.basePendingAmount || 0) + Number(r.lateFeeOutstanding || 0),
        collectedInRange: Number(p.collectedInRange || 0),
        transactionsCount: Number(p.transactionsCount || 0),
        cashCollected: Number(p.cashCollected || 0),
        onlineCollected: Number(p.onlineCollected || 0),
      };
    });

    const summary = classWise.reduce(
      (acc, row) => ({
        studentsCount: acc.studentsCount + row.studentsCount,
        totalFees: acc.totalFees + row.totalFees,
        paidAmount: acc.paidAmount + row.paidAmount,
        basePendingAmount: acc.basePendingAmount + row.basePendingAmount,
        lateFeeOutstanding: acc.lateFeeOutstanding + row.lateFeeOutstanding,
        totalDue: acc.totalDue + row.totalDue,
        collectedInRange: acc.collectedInRange + row.collectedInRange,
        transactionsCount: acc.transactionsCount + row.transactionsCount,
        cashCollected: acc.cashCollected + row.cashCollected,
        onlineCollected: acc.onlineCollected + row.onlineCollected,
      }),
      {
        studentsCount: 0,
        totalFees: 0,
        paidAmount: 0,
        basePendingAmount: 0,
        lateFeeOutstanding: 0,
        totalDue: 0,
        collectedInRange: 0,
        transactionsCount: 0,
        cashCollected: 0,
        onlineCollected: 0,
      }
    );

    return res.json({
      filters: {
        from: fromRaw ? toDayStart(fromRaw) : null,
        to: toRaw ? toDayEnd(toRaw) : null,
        className:
          classNameRaw !== undefined && classNameRaw !== null && classNameRaw !== ""
            ? Number(classNameRaw)
            : null,
      },
      classWise,
      summary,
    });
  } catch (err) {
    console.error("getClassWiseFeeReport error:", err);
    return res.status(500).json({ message: "Error fetching class-wise fee report" });
  }
};

exports.getMonthWiseFeeReport = async (req, res) => {
  try {
    const year = Number(req.query.year || new Date().getFullYear());
    const classNameRaw = req.query.className;
    if (!Number.isFinite(year) || year < 2000 || year > 2100) {
      return res.status(400).json({ message: "Invalid year" });
    }

    const start = new Date(year, 0, 1, 0, 0, 0, 0);
    const end = new Date(year + 1, 0, 1, 0, 0, 0, 0);

    const filter = {};
    if (classNameRaw !== undefined && classNameRaw !== null && classNameRaw !== "") {
      filter.studentClass = Number(classNameRaw);
    }

    const rows = await Fees.aggregate([
      { $match: filter },
      { $unwind: "$paymentHistory" },
      { $match: { "paymentHistory.date": { $gte: start, $lt: end } } },
      {
        $group: {
          _id: {
            month: {
              $dateToString: {
                format: "%Y-%m",
                date: "$paymentHistory.date",
                timezone: "Asia/Kolkata",
              },
            },
          },
          collectedAmount: { $sum: { $ifNull: ["$paymentHistory.amount", 0] } },
          transactionsCount: { $sum: 1 },
          cashCollected: {
            $sum: {
              $cond: [
                {
                  $regexMatch: {
                    input: { $toLower: { $ifNull: ["$paymentHistory.mode", ""] } },
                    regex: "cash",
                  },
                },
                { $ifNull: ["$paymentHistory.amount", 0] },
                0,
              ],
            },
          },
          onlineCollected: {
            $sum: {
              $cond: [
                {
                  $regexMatch: {
                    input: { $toLower: { $ifNull: ["$paymentHistory.mode", ""] } },
                    regex: "online|upi|qr|card|netbank",
                  },
                },
                { $ifNull: ["$paymentHistory.amount", 0] },
                0,
              ],
            },
          },
        },
      },
      { $sort: { "_id.month": 1 } },
    ]);

    const monthWise = rows.map((r) => ({
      month: r._id.month,
      collectedAmount: Number(r.collectedAmount || 0),
      transactionsCount: Number(r.transactionsCount || 0),
      cashCollected: Number(r.cashCollected || 0),
      onlineCollected: Number(r.onlineCollected || 0),
    }));

    const summary = monthWise.reduce(
      (acc, row) => ({
        collectedAmount: acc.collectedAmount + row.collectedAmount,
        transactionsCount: acc.transactionsCount + row.transactionsCount,
        cashCollected: acc.cashCollected + row.cashCollected,
        onlineCollected: acc.onlineCollected + row.onlineCollected,
      }),
      { collectedAmount: 0, transactionsCount: 0, cashCollected: 0, onlineCollected: 0 }
    );

    return res.json({
      filters: {
        year,
        className:
          classNameRaw !== undefined && classNameRaw !== null && classNameRaw !== ""
            ? Number(classNameRaw)
            : null,
      },
      monthWise,
      summary,
    });
  } catch (err) {
    console.error("getMonthWiseFeeReport error:", err);
    return res.status(500).json({ message: "Error fetching month-wise fee report" });
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

    const currentClassFee = await getClassFeeForStudent(student);

    let fees = await Fees.findOne({ studentId });
    let lateFeeInfo = null;

    if (!fees) {
      const total = currentClassFee ? Number(currentClassFee.totalFees) : 0;
      const dueDate = resolveDueDate({ fees: { createdAt: new Date() }, classFee: currentClassFee, now: new Date() });

      fees = {
        studentId,
        studentName: student.name,
        studentClass: student.studentClass,
        totalFees: total,
        paidAmount: 0,
        remainingAmount: total,
        dueDate,
        lateFeeAccrued: 0,
        feeStatus: total <= 0 ? "Paid" : "Pending",
        paymentHistory: [],
      };
      lateFeeInfo = calculateLateFeeState({ fees, classFee: currentClassFee, now: new Date() });
      fees.remainingAmount = lateFeeInfo.baseRemaining;
      fees.lateFeeAccrued = lateFeeInfo.lateFeeAccrued;
      fees.feeStatus = lateFeeInfo.feeStatus;
    } else {
      lateFeeInfo = await syncFeesLateState({ fees, classFee: currentClassFee, shouldSave: true });
    }

    return res.json({
      fees,
      feeSummary: {
        baseRemaining: Number(fees.remainingAmount || 0),
        lateFee: Number(fees.lateFeeAccrued || 0),
        totalDue: Number((lateFeeInfo && lateFeeInfo.totalDue) || (Number(fees.remainingAmount || 0) + Number(fees.lateFeeAccrued || 0))),
        dueDate: fees.dueDate || (lateFeeInfo ? lateFeeInfo.dueDate : null),
        overdueDays: Number((lateFeeInfo && lateFeeInfo.overdueDays) || 0),
      },
      studentMeta: {
        studentClass: student.studentClass,
        stream: student.stream || "",
        section: student.section || "",
      },
      feeConfig: currentClassFee
        ? {
            className: currentClassFee.className,
            stream: currentClassFee.stream || "",
            totalFees: Number(currentClassFee.totalFees || 0),
            dueDay: currentClassFee.dueDay ?? null,
            graceDays: Number(currentClassFee.graceDays || 0),
            lateFeeType: currentClassFee.lateFeeType || "flat",
            lateFeeValue: Number(currentClassFee.lateFeeValue || 0),
            lateFeeCap: Number(currentClassFee.lateFeeCap || 0),
          }
        : null,
    });
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
    const classFee = await getClassFeeForStudent(student);
    if (!fees) {
      const total = classFee ? Number(classFee.totalFees) : 0;
      const dueDate = resolveDueDate({ fees: { createdAt: new Date() }, classFee, now: new Date() });

      fees = new Fees({
        studentId: String(studentId),
        studentName: student.name,
        studentClass: student.studentClass,
        totalFees: total,
        paidAmount: 0,
        remainingAmount: total,
        dueDate,
        lateFeeAccrued: 0,
        feeStatus: total <= 0 ? "Paid" : "Pending",
        paymentHistory: [],
      });
    }

    const pay = Number(amount);
    if (!pay || pay <= 0) return res.status(400).json({ message: "Invalid amount" });

    const lateState = await syncFeesLateState({ fees, classFee, shouldSave: false });
    const totalDue = Number(lateState.totalDue || 0);
    if (totalDue <= 0) {
      return res.json({ message: "No pending fees", fees });
    }

    const receiptNo = buildReceiptNo();
    const paidBreakup = applyPaymentAgainstDue({
      fees,
      requestedAmount: pay,
      receiptNo,
      mode: mode || "Cash",
      student,
    });

    await fees.save();

    const payment = fees.paymentHistory[fees.paymentHistory.length - 1];
    const emailStatus = await sendReceiptEmailSafe({ fees, payment, student });
    if (!emailStatus.sent) {
      console.error("Receipt email failed (cash):", emailStatus.reason);
    }

    return res.json({
      message: "Payment added",
      fees,
      paidBreakup: {
        totalPaid: paidBreakup.finalPay,
        towardsLateFee: paidBreakup.payLate,
        towardsBaseFee: paidBreakup.payBase,
      },
      emailStatus,
    });
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
    const classFee = await getClassFeeForStudent(student);
    if (!fees) {
      const total = classFee ? Number(classFee.totalFees) : 0;
      const dueDate = resolveDueDate({ fees: { createdAt: new Date() }, classFee, now: new Date() });

      fees = await Fees.create({
        studentId: String(studentId),
        studentName: student.name,
        studentClass: student.studentClass,
        totalFees: total,
        paidAmount: 0,
        remainingAmount: total,
        dueDate,
        lateFeeAccrued: 0,
        feeStatus: total <= 0 ? "Paid" : "Pending",
        paymentHistory: [],
      });
    }

    const lateState = await syncFeesLateState({ fees, classFee, shouldSave: true });
    if (Number(lateState.totalDue || 0) <= 0) {
      return res.json({ success: false, message: "Fees already paid" });
    }

    const totalDue = Number(lateState.totalDue || 0);
    const requested = payAmount ? Number(payAmount) : totalDue;
    if (!requested || requested <= 0) {
      return res.status(400).json({ success: false, message: "Invalid payment amount" });
    }

    const amountToPay = Math.min(requested, totalDue);

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
        lateFeeAccrued: String(fees.lateFeeAccrued || 0),
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
      feeSummary: {
        baseRemaining: Number(fees.remainingAmount || 0),
        lateFee: Number(fees.lateFeeAccrued || 0),
        totalDue: Number(totalDue || 0),
      },
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
    const classFee = await getClassFeeForStudent(student);
    await syncFeesLateState({ fees, classFee, shouldSave: false });

    const pay = toMoney(feeOrder.amount);
    const lateBefore = toMoney(fees.lateFeeAccrued);
    const baseBefore = toMoney(fees.remainingAmount);
    const payLate = Math.min(pay, lateBefore);
    const payBase = Math.min(baseBefore, pay - payLate);

    fees.lateFeeAccrued = toMoney(lateBefore - payLate);
    fees.paidAmount = toMoney(Math.min(Number(fees.totalFees || 0), Number(fees.paidAmount || 0) + payBase));
    fees.remainingAmount = toMoney(Math.max(0, Number(fees.totalFees || 0) - Number(fees.paidAmount || 0)));
    fees.feeStatus = fees.remainingAmount + fees.lateFeeAccrued <= 0 ? "Paid" : "Pending";

    const receiptNo = buildReceiptNo();

    fees.paymentHistory.push({
      amount: pay,
      mode: "Online",
      date: new Date(),
      transactionId: razorpay_payment_id,
      orderId: razorpay_order_id,
      receiptNo,
      studentId: student.studentId,
    });

    await fees.save();

    const payment = fees.paymentHistory[fees.paymentHistory.length - 1];
    const emailStatus = await sendReceiptEmailSafe({ fees, payment, student });
    if (!emailStatus.sent) {
      console.error("Receipt email failed (online):", emailStatus.reason);
    }

    return res.json({
      success: true,
      message: "Payment verified & fees updated",
      fees,
      receipt: {
        feesId: fees._id,
        paymentId: payment._id,
        receiptNo,
      },
      paidBreakup: {
        totalPaid: pay,
        towardsLateFee: payLate,
        towardsBaseFee: payBase,
      },
      emailStatus,
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
    const student = fees.studentId ? await Student.findById(fees.studentId) : null;
    writeReceiptPdfStyled(doc, fees, payment, student);
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
    const pdfBuffer = await buildReceiptPdfBuffer(fees, payment, student);

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

    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: "Student not found" });

    let fees = await Fees.findOne({ studentId });
    const classFee = await getClassFeeForStudent(student);
    let lateState = null;

    if (!fees) {
      const total = classFee ? Number(classFee.totalFees) : 0;
      const dueDate = resolveDueDate({ fees: { createdAt: new Date() }, classFee, now: new Date() });
      fees = {
        studentId,
        studentName: student.name,
        studentClass: student.studentClass,
        totalFees: total,
        paidAmount: 0,
        remainingAmount: total,
        dueDate,
        lateFeeAccrued: 0,
      };
      lateState = calculateLateFeeState({ fees, classFee, now: new Date() });
      fees.remainingAmount = lateState.baseRemaining;
      fees.lateFeeAccrued = lateState.lateFeeAccrued;
    } else {
      lateState = await syncFeesLateState({ fees, classFee, shouldSave: true });
    }

    const remaining = Number(fees.remainingAmount || 0);
    const feePenalty = Number(fees.lateFeeAccrued || 0);
    const totalDue = Number((lateState && lateState.totalDue) || (remaining + feePenalty));
    if (totalDue <= 0) return res.json({ message: "No pending fees. Reminder not sent." });

    const dueDateText =
      fees.dueDate || (lateState && lateState.dueDate)
        ? new Date(fees.dueDate || lateState.dueDate).toLocaleDateString("en-IN")
        : "";

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
            <tr><td style="padding: 6px 0;"><strong>Total Due</strong></td><td style="padding: 6px 0;"><strong>Rs ${totalDue}</strong></td></tr>
            ${dueDateText ? `<tr><td style="padding: 6px 0;">Due Date</td><td style="padding: 6px 0;">${dueDateText}</td></tr>` : ""}
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

    if (!student.email) {
      return res.status(400).json({ message: "Student email not found for reminder" });
    }

    await enqueueBulkEmailJobs([student.email], {
      subject: "Fee Payment Reminder",
      html,
      text: `Fee reminder for ${student.name || "Student"}: pending Rs ${totalDue}.`,
      meta: {
        kind: "fees-manual-reminder",
        studentId: String(student._id),
        feesId: String(fees?._id || ""),
      },
      maxAttempts: 4,
    });

    const smsPhone = String(student.phone || student.mobile || student.contactNumber || "").trim();
    let smsQueued = 0;
    if (process.env.FEES_REMINDER_SMS_ENABLED === "true" && isValidTenDigitPhone(smsPhone)) {
      const smsText = `Fee reminder: ${student.name || "Student"} (${student.studentId || "-"}) pending Rs ${totalDue}.`;
      const smsResult = await enqueueBulkSmsJobs([smsPhone], {
        message: smsText,
        meta: {
          kind: "fees-manual-reminder",
          studentId: String(student._id),
          feesId: String(fees?._id || ""),
        },
        maxAttempts: 4,
      });
      smsQueued = Number(smsResult.queued || 0);
    }

    if (fees?._id) {
      const currentManualCount = Number(fees?.reminderStatus?.manualReminderCount || 0);
      fees.reminderStatus = {
        ...((fees.reminderStatus && fees.reminderStatus.toObject?.()) || fees.reminderStatus || {}),
        lastManualReminderAt: new Date(),
        manualReminderCount: currentManualCount + 1,
      };
      await fees.save();
    }

    return res.json({
      message: "Reminder queued",
      queued: { email: 1, sms: smsQueued },
      to: { email: student.email, phone: smsPhone || "" },
    });
  } catch (err) {
    console.error("Reminder email error:", err);
    return res.status(500).json({ message: "Error sending reminder email" });
  }
};

exports.queueAllFeeReminders = async (_req, res) => {
  try {
    const summary = await processFeesAutoReminders();
    return res.json({ message: "Fee reminders queued", summary });
  } catch (err) {
    console.error("queueAllFeeReminders error:", err);
    return res.status(500).json({ message: "Error queueing fee reminders" });
  }
};
