const TeacherInfo = require("../models/teacherinfo");
const TeacherSalary = require("../models/tecahersalary");
const TeacherRegister = require("../models/techerregister");
const razorpay = require("../config/razorpay");
const nodemailer = require("nodemailer");
const PDFDocument = require("pdfkit");
const crypto = require("crypto");

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

const sendEmail = async ({ to, subject, html, attachments }) => {
    const transporter = getMailer();
    await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_EMAIL,
        to,
        subject,
        html,
        attachments,
    });
};

const buildSalarySlipPdfBuffer = (salary, teacher) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks = [];

    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // ---------- helpers ----------
    const line = (y) => {
      doc.moveTo(50, y).lineTo(545, y).strokeColor("#E5E7EB").lineWidth(1).stroke();
      doc.strokeColor("black").lineWidth(1);
    };

    const kv = (label, value) => {
      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .fillColor("#374151")
        .text(label, { continued: true });
      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor("#111827")
        .text(` ${value ?? "-"}`);
      doc.moveDown(0.35);
    };

    const money = (n) => {
      const num = Number(n || 0);
      return `₹ ${num.toLocaleString("en-IN")}`;
    };

    const safe = (v) => (v === undefined || v === null || v === "" ? "-" : String(v));

    const payoutStatus = salary.payoutStatus || "Pending";
    const paidDate = salary.createdAt
      ? new Date(salary.createdAt).toLocaleString("en-IN")
      : "-";

    // ---------- header ----------
    doc
      .font("Helvetica-Bold")
      .fontSize(20)
      .fillColor("#0B5ED7")
      .text("SALARY SLIP", { align: "left" });

    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor("#6B7280")
      .text("School Management System • Payroll Document", { align: "left" });

    doc.moveDown(0.6);
    line(doc.y);
    doc.moveDown(1.0);

    // ---------- top summary box ----------
    const boxX = 50;
    const boxY = doc.y;
    const boxW = 495;
    const boxH = 78;

    doc
      .roundedRect(boxX, boxY, boxW, boxH, 10)
      .fillOpacity(1)
      .fillAndStroke("#F8FAFC", "#E5E7EB");

    doc.fillColor("#111827");

    // Left summary
    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .text("Teacher Details", boxX + 16, boxY + 12);

    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor("#374151")
      .text(`Name: ${safe(teacher.teacherName)}`, boxX + 16, boxY + 30);

    doc
      .text(`Teacher ID: ${safe(teacher.regNumber)}`, boxX + 16, boxY + 46);

    // Right summary
    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor("#111827")
      .text("Salary Summary", boxX + 280, boxY + 12);

    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor("#374151")
      .text(`Month: ${safe(salary.month)}`, boxX + 280, boxY + 30);

    doc
      .font("Helvetica-Bold")
      .fontSize(14)
      .fillColor("#16A34A")
      .text(money(salary.paidAmount), boxX + 280, boxY + 47);

    doc.moveDown(0.5);
    doc.y = boxY + boxH + 18;

    // ---------- payment details section ----------
    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .fillColor("#111827")
      .text("Payment Details");

    doc.moveDown(0.4);
    line(doc.y);
    doc.moveDown(0.8);

    kv("Payout Status:", safe(payoutStatus));
    kv("Payout Mode:", safe(salary.payoutMode));
    kv("Payout ID:", safe(salary.payoutId));
    kv("Reference ID:", safe(salary.payoutReferenceId));
    kv("Paid Date:", safe(paidDate));

    doc.moveDown(0.8);

    // ---------- footer note ----------
    line(doc.y);
    doc.moveDown(0.8);

    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#6B7280")
      .text("This is a system-generated salary slip. No signature is required.", {
        align: "center",
      });

    doc.end();
  });


const resolvePayoutStatus = (status) => {
    const s = String(status || "").toLowerCase();
    if (s === "processed") return "Paid";
    if (s === "failed" || s === "cancelled") return "Failed";
    if (s === "processing" || s === "queued") return "Processing";
    return "Pending";
};

const sendSalarySlipEmail = async (salary, teacherDoc) => {
  if (!teacherDoc?.email) return;

  const pdfBuffer = await buildSalarySlipPdfBuffer(salary, teacherDoc);

  const safe = (v) => (v === undefined || v === null || v === "" ? "-" : String(v));
  const money = (n) => `₹ ${Number(n || 0).toLocaleString("en-IN")}`;

  const teacherName = safe(teacherDoc.teacherName || "Teacher");
  const month = safe(salary.month);
  const amount = money(salary.paidAmount);
  const payoutStatus = safe(salary.payoutStatus || "Pending");
  const payoutMode = safe(salary.payoutMode || "-");
  const reference = safe(salary.payoutReferenceId || "-");
  const paidDate = salary.createdAt
    ? new Date(salary.createdAt).toLocaleString("en-IN")
    : "-";

  const html = `
  <div style="font-family: Arial, sans-serif; background:#f6f8fb; padding: 24px;">
    <div style="max-width: 640px; margin: 0 auto; background:#ffffff; border:1px solid #e5e7eb; border-radius: 14px; overflow:hidden;">
      
      <div style="background:#0B5ED7; padding: 18px 22px;">
        <div style="color:#ffffff; font-size:18px; font-weight:700; letter-spacing:0.2px;">
          Salary Slip
        </div>
        <div style="color:#dbeafe; font-size:13px; margin-top:4px;">
          ${month} • School Management System
        </div>
      </div>

      <div style="padding: 18px 22px; color:#111827;">
        <p style="margin:0 0 10px 0; font-size:14px;">
          Dear <b>${teacherName}</b>,
        </p>

        <p style="margin:0 0 14px 0; font-size:14px; color:#374151;">
          Your salary has been processed. Please find your salary slip attached.
        </p>

        <div style="border:1px solid #e5e7eb; border-radius:12px; padding: 14px; background:#f9fafb;">
          <table style="width:100%; border-collapse:collapse; font-size:14px;">
            <tr>
              <td style="padding:6px 0; color:#6b7280;">Month</td>
              <td style="padding:6px 0; text-align:right; font-weight:600;">${month}</td>
            </tr>
            <tr>
              <td style="padding:6px 0; color:#6b7280;">Amount</td>
              <td style="padding:6px 0; text-align:right; font-weight:700; color:#16a34a;">${amount}</td>
            </tr>
            <tr>
              <td style="padding:6px 0; color:#6b7280;">Payout Status</td>
              <td style="padding:6px 0; text-align:right; font-weight:600;">${payoutStatus}</td>
            </tr>
            <tr>
              <td style="padding:6px 0; color:#6b7280;">Mode</td>
              <td style="padding:6px 0; text-align:right; font-weight:600;">${payoutMode}</td>
            </tr>
            <tr>
              <td style="padding:6px 0; color:#6b7280;">Reference</td>
              <td style="padding:6px 0; text-align:right; font-weight:600;">${reference}</td>
            </tr>
            <tr>
              <td style="padding:6px 0; color:#6b7280;">Processed On</td>
              <td style="padding:6px 0; text-align:right; font-weight:600;">${paidDate}</td>
            </tr>
          </table>
        </div>

        <p style="margin:14px 0 0 0; font-size:12px; color:#6b7280;">
          This is an automated message. If you have questions, please contact the school administration.
        </p>
      </div>

      <div style="padding: 14px 22px; border-top:1px solid #e5e7eb; background:#ffffff; color:#6b7280; font-size:12px;">
        © ${new Date().getFullYear()} School Management System
      </div>
    </div>
  </div>
  `;

  await sendEmail({
    to: teacherDoc.email,
    subject: `Salary Slip - ${month}`,
    html,
    attachments: [
      {
        filename: `SalarySlip_${teacherName.replace(/\s+/g, "_")}_${month.replace(/\s+/g, "_")}.pdf`,
        content: pdfBuffer,
      },
    ],
  });
};


// Fetch all teachers (full details for frontend card)
exports.getTeachers = async (req, res) => {
    try {
        const teachers = await TeacherInfo.find().select(
            "teacherName email mobile salary fatherName gender experience education address bloodGroup dob joiningDate picture"
        );

        res.json(teachers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Pay salary (manual)
exports.paySalary = async (req, res) => {
    try {
        const { teacher, month, paidAmount, status } = req.body;

        if (!teacher || !month || !paidAmount) {
            return res.status(400).json({ message: "teacher, month, and paidAmount are required" });
        }

        const existing = await TeacherSalary.findOne({ teacher, month });
        if (existing) {
            return res.status(409).json({ message: "Salary already recorded", record: existing });
        }

        const payload = {
            teacher,
            month,
            paidAmount,
            status: status || "Pending",
        };

        if (payload.status === "Paid") {
            payload.payoutStatus = "Paid";
            payload.payoutMode = "Manual";
            payload.payoutReferenceId = `MAN-${Date.now()}`;
        }

        const salary = new TeacherSalary(payload);
        await salary.save();

        try {
            if (payload.status === "Paid") {
                const teacherDoc = await TeacherInfo.findById(teacher);
                await sendSalarySlipEmail(salary, teacherDoc);
            }
        } catch (mailErr) {
            console.error("Salary email failed:", mailErr);
        }

        res.json({ message: "Salary Paid", salary });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Generate monthly salary sheet for all teachers (creates pending records if missing)
exports.generateMonthlySheet = async (req, res) => {
    try {
        const { month } = req.body;
        if (!month) return res.status(400).json({ message: "month is required" });

        const teachers = await TeacherInfo.find().select("_id salary");
        if (!teachers.length) return res.json({ message: "No teachers found", created: 0 });

        const teacherIds = teachers.map((t) => t._id);
        const existing = await TeacherSalary.find({ month, teacher: { $in: teacherIds } }).select(
            "teacher"
        );
        const existingIds = new Set(existing.map((s) => String(s.teacher)));

        const toCreate = teachers
            .filter((t) => !existingIds.has(String(t._id)))
            .map((t) => ({
                teacher: t._id,
                month,
                paidAmount: t.salary,
                status: "Pending",
            }));

        if (toCreate.length) {
            await TeacherSalary.insertMany(toCreate);
        }

        res.json({ message: "Monthly sheet generated", created: toCreate.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Create payout (manual fallback; updates payout fields)
exports.createPayout = async (req, res) => {
    try {
        const { salaryId } = req.params;
        const salary = await TeacherSalary.findById(salaryId).populate(
            "teacher",
            "teacherName email regNumber"
        );

        if (!salary) return res.status(404).json({ message: "Salary record not found" });

        if (salary.payoutStatus === "Paid") {
            return res.json({ message: "Payout already completed", salary });
        }

        if (salary.status === "Rejected") {
            return res.status(400).json({ message: "Cannot payout a rejected salary" });
        }

        salary.payoutStatus = "Paid";
        salary.payoutMode = "Manual";
        salary.payoutReferenceId = salary.payoutReferenceId || `MAN-${Date.now()}`;
        if (salary.status !== "Paid") salary.status = "Paid";

        await salary.save();

        try {
            if (salary.teacher?.email) {
                await sendSalarySlipEmail(salary, salary.teacher);
            }
        } catch (mailErr) {
            console.error("Salary email failed:", mailErr);
        }

        res.json({ message: "Payout completed", salary });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Create Razorpay order for salary payout (testing)
exports.createSalaryRazorpayOrder = async (req, res) => {
    try {
        const { salaryId } = req.params;
        const salary = await TeacherSalary.findById(salaryId).populate(
            "teacher",
            "teacherName email regNumber"
        );

        if (!salary) return res.status(404).json({ message: "Salary record not found" });
        if (salary.status === "Rejected") {
            return res.status(400).json({ message: "Cannot payout a rejected salary" });
        }
        if (salary.payoutStatus === "Paid") {
            return res.json({ message: "Payout already completed", salary });
        }

        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            return res.status(400).json({ message: "Razorpay keys missing in .env" });
        }

        const amount = Math.round(Number(salary.paidAmount || 0) * 100);
        if (!amount || amount <= 0) {
            return res.status(400).json({ message: "Invalid salary amount" });
        }

        const order = await razorpay.orders.create({
            amount,
            currency: "INR",
            receipt: `SAL-${salary._id}`.slice(0, 40),
            notes: {
                salaryId: String(salary._id),
                teacher: salary.teacher?.teacherName || "",
                month: salary.month || "",
            },
        });

        salary.payoutStatus = "Processing";
        salary.payoutMode = "Razorpay";
        salary.payoutReferenceId = order.id;
        await salary.save();

        res.json({
            keyId: process.env.RAZORPAY_KEY_ID,
            order,
            salaryId: salary._id,
            teacher: salary.teacher?.teacherName || "",
            amount: salary.paidAmount,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Verify Razorpay payment for salary payout
exports.verifySalaryRazorpayPayment = async (req, res) => {
    try {
        const { salaryId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        if (!salaryId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ message: "Missing Razorpay verification data" });
        }

        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ message: "Invalid Razorpay signature" });
        }

        const salary = await TeacherSalary.findById(salaryId).populate(
            "teacher",
            "teacherName email regNumber"
        );
        if (!salary) return res.status(404).json({ message: "Salary record not found" });

        salary.payoutStatus = "Paid";
        salary.payoutMode = "Razorpay";
        salary.payoutId = razorpay_payment_id;
        salary.payoutReferenceId = razorpay_order_id;
        salary.status = "Paid";

        await salary.save();

        try {
            await sendSalarySlipEmail(salary, salary.teacher);
        } catch (mailErr) {
            console.error("Salary email failed:", mailErr);
        }

        res.json({ message: "Payment verified", salary });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Download salary slip PDF
exports.downloadSalarySlip = async (req, res) => {
    try {
        const { salaryId } = req.params;
        const salary = await TeacherSalary.findById(salaryId).populate(
            "teacher",
            "teacherName regNumber email"
        );

        if (!salary) return res.status(404).json({ message: "Salary record not found" });

        const pdfBuffer = await buildSalarySlipPdfBuffer(salary, salary.teacher || {});
        const safeName = `${salary.teacher?.teacherName || "Teacher"}`
            .replace(/\s+/g, "_")
            .replace(/[^a-zA-Z0-9_\-]/g, "");
        const fileName = `${safeName || "SalarySlip"}.pdf`;
        const isInline = String(req.query.view || "") === "1";

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `${isInline ? "inline" : "attachment"}; filename=\"${fileName}\"`
        );
        res.send(pdfBuffer);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Check salary already paid for selected month
exports.checkSalary = async (req, res) => {
    try {
        const { teacherId } = req.params;
        const { month } = req.query;

        const record = await TeacherSalary.findOne({ teacher: teacherId, month });

        res.json({ paid: !!record });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get all salary records (Approve Salary Page data)
exports.getAllSalary = async (req, res) => {
    try {
        const data = await TeacherSalary.find()
            .populate("teacher", "teacherName email mobile salary picture")
            .sort({ createdAt: -1 });

        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update status (Approved / Rejected)
exports.updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const updated = await TeacherSalary.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        ).populate("teacher", "teacherName email mobile salary");

        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get salary history for one teacher
exports.getSalaryByTeacher = async (req, res) => {
    try {
        const { teacherId } = req.params;
        if (!teacherId) return res.status(400).json({ message: "teacherId is required" });

        let history = await TeacherSalary.find({ teacher: teacherId })
            .populate("teacher", "teacherName email mobile salary picture")
            .sort({ createdAt: -1 });

        if (!history.length) {
            const teacherReg = await TeacherRegister.findById(teacherId).select("teacherId");
            if (teacherReg?.teacherId) {
                const teacherInfo = await TeacherInfo.findOne({
                    regNumber: teacherReg.teacherId,
                }).select("_id");

                if (teacherInfo?._id) {
                    history = await TeacherSalary.find({ teacher: teacherInfo._id })
                        .populate("teacher", "teacherName email mobile salary picture")
                        .sort({ createdAt: -1 });
                }
            }
        }

        res.json(history);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
