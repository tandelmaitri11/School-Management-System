const cron = require("node-cron");
const Fees = require("../models/fees");
const Student = require("../models/studentregister");
const ClassFees = require("../models/ClassFees");
const { enqueueBulkEmailJobs } = require("./messageQueueService");
const { calculateLateFeeState, resolveDueDate } = require("../utils/lateFee");

const isSameDay = (a, b) =>
  a &&
  b &&
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const normalizeStream = (stream) => String(stream || "").trim();

const startOfDay = (date) => {
  if (!date) return null;
  const normalized = new Date(date);
  if (Number.isNaN(normalized.getTime())) return null;
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

const shouldSendReminderForDueDate = (currentDate, dueDate) => {
  const current = startOfDay(currentDate);
  const due = startOfDay(dueDate);
  if (!current || !due) return false;

  const reminderStart = new Date(due);
  reminderStart.setDate(reminderStart.getDate() - 1);
  return current.getTime() >= reminderStart.getTime();
};

const getClassFeeForStudent = async (student) => {
  const className = Number(student?.studentClass);
  const stream = normalizeStream(student?.stream);

  if (!className) return null;

  if (stream) {
    const streamFee = await ClassFees.findOne({ className, stream }).sort({ updatedAt: -1 }).lean();
    if (streamFee) return streamFee;
  }

  return ClassFees.findOne({
    className,
    $or: [{ stream: "" }, { stream: { $exists: false } }, { stream: null }],
  })
    .sort({ updatedAt: -1 })
    .lean();
};

const buildInitialFeesState = ({ student, classFee, now }) => {
  const totalFees = Number(classFee?.totalFees || 0);
  const dueDate = resolveDueDate({ fees: { createdAt: now }, classFee, now });

  return {
    studentId: String(student._id),
    studentName: student.name,
    studentClass: student.studentClass,
    totalFees,
    paidAmount: 0,
    remainingAmount: totalFees,
    dueDate,
    lateFeeAccrued: 0,
    lastLateFeeCalcAt: null,
    feeStatus: totalFees <= 0 ? "Paid" : "Pending",
    reminderStatus: {
      lastAutoReminderAt: null,
      lastManualReminderAt: null,
      autoReminderCount: 0,
      manualReminderCount: 0,
    },
    paymentHistory: [],
  };
};

const buildFeesReminderHtml = ({ student, fees, summary }) => `
  <div style="font-family: Arial, sans-serif; max-width: 520px; margin: auto; border: 1px solid #e5e5e5; border-radius: 8px; overflow: hidden;">
    <div style="background: #dc3545; color: #fff; padding: 16px 20px;">
      <h2 style="margin: 0; font-size: 18px;">Fee Payment Reminder</h2>
    </div>
    <div style="padding: 18px 20px; color: #333;">
      <p style="margin: 0 0 10px;">Hello ${student.name || "Student"},</p>
      <p style="margin: 0 0 12px;">This is an reminder that your fee payment is still pending.</p>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr><td style="padding: 6px 0;">Student ID</td><td style="padding: 6px 0;">${student.studentId || "-"}</td></tr>
        <tr><td style="padding: 6px 0;">Class</td><td style="padding: 6px 0;">${student.studentClass ?? "-"}</td></tr>
        ${student.stream ? `<tr><td style="padding: 6px 0;">Stream</td><td style="padding: 6px 0;">${student.stream}</td></tr>` : ""}
        ${summary?.dueDate ? `<tr><td style="padding: 6px 0;">Due Date</td><td style="padding: 6px 0;">${new Date(summary.dueDate).toLocaleDateString("en-IN")}</td></tr>` : ""}
        <tr><td style="padding: 6px 0;">Pending Amount</td><td style="padding: 6px 0;"><strong>Rs ${Number(summary?.baseRemaining || fees.remainingAmount || 0)}</strong></td></tr>
        ${Number(summary?.lateFeeAccrued || 0) > 0 ? `<tr><td style="padding: 6px 0;">Late Fee</td><td style="padding: 6px 0;"><strong>Rs ${Number(summary.lateFeeAccrued)}</strong></td></tr>` : ""}
        <tr><td style="padding: 6px 0;">Total Due</td><td style="padding: 6px 0;"><strong>Rs ${Number(summary?.totalDue || fees.remainingAmount || 0)}</strong></td></tr>
      </table>
      <p style="margin: 14px 0 0; font-size: 13px; color: #777;">Please complete payment at the earliest to avoid late fees.</p>
    </div>
    <div style="background: #f8f9fa; padding: 10px 20px; font-size: 12px; color: #777; text-align: center;">
      If you already paid, please ignore this message.
    </div>
  </div>
`;

const processFeesAutoReminders = async () => {
  const now = new Date();
  const students = await Student.find({})
    .select("name email studentId studentClass stream")
    .lean();
  const existingFees = await Fees.find({
    studentId: { $in: students.map((student) => String(student._id)) },
  }).lean();
  const feesByStudentId = new Map(existingFees.map((fees) => [String(fees.studentId), fees]));
  const classFeeCache = new Map();
  const emailJobs = [];
  let skipped = 0;
  let queued = 0;

  for (const student of students) {
    const classFeeKey = `${Number(student?.studentClass || 0)}::${normalizeStream(student?.stream)}`;
    let classFeeConfig = classFeeCache.get(classFeeKey);
    if (classFeeConfig === undefined) {
      classFeeConfig = await getClassFeeForStudent(student);
      classFeeCache.set(classFeeKey, classFeeConfig || null);
    }

    if (!classFeeConfig || Number(classFeeConfig.totalFees || 0) <= 0) continue;
    if (classFeeConfig.autoReminderEnabled === false) continue;

    const studentId = String(student._id);
    const fees = feesByStudentId.get(studentId) || buildInitialFeesState({ student, classFee: classFeeConfig, now });
    const lastAuto = fees?.reminderStatus?.lastAutoReminderAt
      ? new Date(fees.reminderStatus.lastAutoReminderAt)
      : null;
    if (lastAuto && isSameDay(lastAuto, now)) continue;
    const summary = calculateLateFeeState({ fees, classFee: classFeeConfig, now });
    if (Number(summary.totalDue || 0) <= 0) continue;
    if (!shouldSendReminderForDueDate(now, summary.dueDate || fees.dueDate)) continue;
    let queuedForStudent = false;

    if (student.email) {
      emailJobs.push({
        to: student.email,
        subject: "Fee Payment Reminder",
        html: buildFeesReminderHtml({ student, fees, summary }),
      });
      queuedForStudent = true;
    }

    if (!queuedForStudent) {
      skipped += 1;
      continue;
    }

    if (fees._id) {
      await Fees.updateOne(
        { _id: fees._id },
        {
          $set: {
            studentName: student.name,
            studentClass: student.studentClass,
            totalFees: Number(fees.totalFees || classFeeConfig.totalFees || 0),
            "reminderStatus.lastAutoReminderAt": now,
            remainingAmount: Number(summary.baseRemaining || 0),
            lateFeeAccrued: Number(summary.lateFeeAccrued || 0),
            feeStatus: summary.totalDue <= 0 ? "Paid" : "Pending",
            dueDate: summary.dueDate || fees.dueDate || null,
            lastLateFeeCalcAt: now,
          },
          $inc: {
            "reminderStatus.autoReminderCount": 1,
          },
        }
      );
    } else {
      const createdFees = await Fees.create({
        studentId,
        studentName: student.name,
        studentClass: student.studentClass,
        totalFees: Number(classFeeConfig.totalFees || 0),
        paidAmount: 0,
        remainingAmount: Number(summary.baseRemaining || 0),
        dueDate: summary.dueDate || fees.dueDate || null,
        lateFeeAccrued: Number(summary.lateFeeAccrued || 0),
        lastLateFeeCalcAt: now,
        feeStatus: summary.totalDue <= 0 ? "Paid" : "Pending",
        reminderStatus: {
          lastAutoReminderAt: now,
          lastManualReminderAt: null,
          autoReminderCount: 1,
          manualReminderCount: 0,
        },
        paymentHistory: [],
      });
      feesByStudentId.set(studentId, createdFees.toObject());
    }

    queued += 1;
  }

  if (emailJobs.length) {
    await Promise.all(
      emailJobs.map((j) =>
        enqueueBulkEmailJobs([j.to], {
          subject: j.subject,
          html: j.html,
          meta: { kind: "fees Reminder" },
        })
      )
    );
  }

  return {
    scanned: students.length,
    queuedStudents: queued,
    skipped,
    queuedEmails: emailJobs.length,
  };
};

const startFeesAutoReminderCron = () => {
  // Run daily at 11:00 server time.
  cron.schedule("00 11 * * *", async () => {
    try {
      const summary = await processFeesAutoReminders();
      console.log("[fees-reminder] queued:", summary);
    } catch (err) {
      console.error("fees auto reminder cron error:", err?.message || err);
    }
  });
};

module.exports = { startFeesAutoReminderCron, processFeesAutoReminders };
