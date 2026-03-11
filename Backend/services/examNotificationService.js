const cron = require("node-cron");
const Exam = require("../models/Exam");
const Student = require("../models/studentregister");
const { sendEmail } = require("../utils/mailer");

const MINUTE = 60 * 1000;

const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString("en-IN") : "-";

const buildExamEmailHtml = ({ studentName, exam, headline, message }) => `
  <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; border: 1px solid #e5e5e5; border-radius: 8px; overflow: hidden;">
    <div style="background: #0d6efd; color: #fff; padding: 16px 20px;">
      <h2 style="margin: 0; font-size: 18px;">${headline}</h2>
    </div>
    <div style="padding: 18px 20px; color: #333;">
      <p style="margin: 0 0 10px;">Hello ${studentName || "Student"},</p>
      <p style="margin: 0 0 14px;">${message}</p>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr><td style="padding: 6px 0;">Exam</td><td style="padding: 6px 0;"><strong>${exam.title}</strong></td></tr>
        <tr><td style="padding: 6px 0;">Subject</td><td style="padding: 6px 0;">${exam.subjectName || "-"}</td></tr>
        <tr><td style="padding: 6px 0;">Class</td><td style="padding: 6px 0;">${exam.className ?? "-"}</td></tr>
        <tr><td style="padding: 6px 0;">Section</td><td style="padding: 6px 0;">${exam.section || "-"}</td></tr>
        ${exam.stream ? `<tr><td style="padding: 6px 0;">Stream</td><td style="padding: 6px 0;">${exam.stream}</td></tr>` : ""}
        <tr><td style="padding: 6px 0;">Start Time</td><td style="padding: 6px 0;">${formatDateTime(exam.startTime)}</td></tr>
        <tr><td style="padding: 6px 0;">Duration</td><td style="padding: 6px 0;">${exam.duration || 0} min</td></tr>
        <tr><td style="padding: 6px 0;">Total Marks</td><td style="padding: 6px 0;">${exam.totalMarks || 0}</td></tr>
      </table>
      <p style="margin: 14px 0 0; font-size: 13px; color: #777;">
        Please log in to the student portal on time. Best of luck!
      </p>
    </div>
    <div style="background: #f8f9fa; padding: 10px 20px; font-size: 12px; color: #777; text-align: center;">
      This is an automated message.
    </div>
  </div>
`;

const loadStudentsForExam = async (exam) => {
  const query = { studentClass: Number(exam.className) };
  if (exam.section) query.section = String(exam.section).trim().toUpperCase();
  if (exam.stream) query.stream = String(exam.stream).trim();

  return Student.find(query).select("name email studentId").lean();
};

const sendExamEmailToStudents = async (exam, subject, headline, message) => {
  const students = await loadStudentsForExam(exam);
  let sent = 0;

  for (const student of students) {
    if (!student.email) continue;
    try {
      const html = buildExamEmailHtml({
        studentName: student.name,
        exam,
        headline,
        message,
      });
      await sendEmail({ to: student.email, subject, html });
      sent += 1;
    } catch (err) {
      console.error(
        `Exam email failed for ${student.email || student.studentId || "unknown"}:`,
        err?.message || err
      );
    }
  }

  return { total: students.length, sent };
};

const sendExamCreatedEmails = async (exam) =>
  sendExamEmailToStudents(
    exam,
    `New Exam: ${exam.title}`,
    "New Exam Scheduled",
    "Your teacher has scheduled a new exam. Please review the details below."
  );

const sendExamReminderEmails = async (exam, minutesLeft) =>
  sendExamEmailToStudents(
    exam,
    `Exam Reminder: ${exam.title}`,
    `Reminder: ${minutesLeft} Minutes Left`,
    `Your exam starts in about ${minutesLeft} minutes. Please be ready.`
  );

const processExamReminders = async () => {
  const now = new Date();
  const upcoming = await Exam.find({
    startTime: { $gt: now },
  }).lean();

  for (const exam of upcoming) {
    const startTime = new Date(exam.startTime);
    const msToStart = startTime.getTime() - now.getTime();
    const notification = exam.notification || {};

    const canSend15 =
      !notification.reminder15SentAt && msToStart <= 15 * MINUTE && msToStart > 0;

    if (!canSend15) continue;

    await sendExamReminderEmails(exam, 15);
    await Exam.updateOne(
      { _id: exam._id },
      { $set: { "notification.reminder15SentAt": new Date() } }
    );
  }
};

const startExamReminderJob = () => {
  cron.schedule("* * * * *", async () => {
    try {
      await processExamReminders();
    } catch (err) {
      console.error("Exam reminder job error:", err?.message || err);
    }
  });
};

module.exports = { startExamReminderJob, sendExamCreatedEmails };
