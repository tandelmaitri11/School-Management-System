const cron = require("node-cron");
const Assignment = require("../models/assignment");
const Student = require("../models/studentregister");
const { sendEmail } = require("../utils/mailer");
const path = require("path");
const fs = require("fs/promises");

const toUpper = (v) => String(v || "").trim().toUpperCase();
const toTrim = (v) => String(v || "").trim();

const getRecipientsForAssignment = async (assignment) => {
  const query = {
    studentClass: Number(assignment.classAssigned),
  };

  const section = toUpper(assignment.sectionAssigned);
  const stream = toTrim(assignment.streamAssigned);

  if (section) query.section = section;
  if (stream) query.stream = stream;
  const subjectChoice = toTrim(assignment.subjectChoiceAssigned);
  if (subjectChoice) query.subjectChoice = subjectChoice;

  const students = await Student.find(query).select("name email studentId");
  return students.filter((s) => String(s.email || "").trim());
};

const formatDue = (dueDate) => {
  if (!dueDate) return "N/A";
  const d = new Date(dueDate);
  if (Number.isNaN(d.getTime())) return "N/A";
  return d.toISOString().slice(0, 10);
};

const toIcsDateTime = (date) =>
  date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");

const toIcsDateOnly = (date) => date.toISOString().slice(0, 10).replace(/-/g, "");

const escapeIcsText = (value) =>
  String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");

const buildScopeText = (assignment) => {
  const classText = `Class ${assignment.classAssigned}`;
  const section = toUpper(assignment.sectionAssigned);
  const stream = toTrim(assignment.streamAssigned);
  const bits = [classText];
  if (section) bits.push(`Section ${section}`);
  if (stream) bits.push(`Stream ${stream}`);
  return bits.join(" | ");
};

const getAssignmentAttachments = async (assignment) => {
  const filePath = toTrim(assignment.file);
  if (!filePath) return [];

  const absolutePath = path.resolve(filePath);
  try {
    await fs.access(absolutePath);
    return [
      {
        filename: path.basename(absolutePath),
        path: absolutePath,
      },
    ];
  } catch {
    return [];
  }
};

const buildCalendarInvite = (assignment, scopeText) => {
  const dueDate = new Date(assignment.dueDate);
  if (Number.isNaN(dueDate.getTime())) {
    return { calendarLink: "", calendarAttachment: null };
  }

  const start = new Date(dueDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const dueText = formatDue(assignment.dueDate);
  const details = [
    `Subject: ${assignment.subject || "N/A"}`,
    `Scope: ${scopeText || "N/A"}`,
    `Due Date: ${dueText}`,
    assignment.description ? `Description: ${assignment.description}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const googleDates = `${toIcsDateOnly(start)}/${toIcsDateOnly(end)}`;
  const calendarLink =
    "https://calendar.google.com/calendar/render?action=TEMPLATE" +
    `&text=${encodeURIComponent(`Assignment Due: ${assignment.title || "Assignment"}`)}` +
    `&dates=${googleDates}` +
    `&details=${encodeURIComponent(details)}`;

  const uid = `${assignment._id || Date.now()}@sms-assignment`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SMS//Assignment Reminder//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${toIcsDateTime(new Date())}`,
    `DTSTART;VALUE=DATE:${toIcsDateOnly(start)}`,
    `DTEND;VALUE=DATE:${toIcsDateOnly(end)}`,
    `SUMMARY:${escapeIcsText(`Assignment Due: ${assignment.title || "Assignment"}`)}`,
    `DESCRIPTION:${escapeIcsText(details)}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ];

  return {
    calendarLink,
    calendarAttachment: {
      filename: `assignment-${String(assignment.title || "due")
        .trim()
        .replace(/[^a-z0-9]+/gi, "-")
        .replace(/^-+|-+$/g, "")
        .toLowerCase() || "due"}.ics`,
      content: lines.join("\r\n"),
      contentType: "text/calendar; charset=utf-8; method=PUBLISH",
    },
  };
};

const sendCreatedAssignmentEmails = async (assignmentDoc) => {
  const assignment = assignmentDoc.toObject ? assignmentDoc.toObject() : assignmentDoc;
  const recipients = await getRecipientsForAssignment(assignment);
  if (!recipients.length) return { sent: 0 };

  const scopeText = buildScopeText(assignment);
  const due = formatDue(assignment.dueDate);
  const fileAttachments = await getAssignmentAttachments(assignment);
  const { calendarLink, calendarAttachment } = buildCalendarInvite(assignment, scopeText);
  const attachments = calendarAttachment
    ? [...fileAttachments, calendarAttachment]
    : fileAttachments;

  await Promise.all(
    recipients.map((stu) =>
      sendEmail({
        to: stu.email,
        subject: `New Assignment: ${assignment.title}`,
        html: `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; color: #333;">
            <div style="background-color: #007bff; padding: 20px; color: white; text-align: center;">
              <h2 style="margin: 0;">New Assignment Posted</h2>
            </div>
            <div style="padding: 25px;">
              <p>Hello <b>${stu.name || "Student"}</b>,</p>
              <p>A new assignment has been uploaded to your dashboard. Please review the details below:</p>
              <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; border-left: 4px solid #007bff; margin: 20px 0;">
                <p style="margin: 5px 0;"><b>Title:</b> ${assignment.title}</p>
                <p style="margin: 5px 0;"><b>Subject:</b> ${assignment.subject}</p>
                <p style="margin: 5px 0;"><b>Scope:</b> ${scopeText}</p>
                <p style="margin: 5px 0; color: #d9534f;"><b>Due Date:</b> ${due}</p>
              </div>
              ${attachments.length ? "<p style='font-size: 0.9em; color: #666;'>📎 Assignment resources are attached to this email.</p>" : ""}
              <p>Please complete this assignment before the deadline.</p>
              ${calendarLink ? `
                <div style="text-align: center; margin-top: 25px;">
                  <a href="${calendarLink}" style="background-color: #28a745; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Add to Calendar</a>
                </div>
              ` : ""}
            </div>
            <div style="background: #f1f1f1; padding: 10px; text-align: center; font-size: 12px; color: #888;">
              System Notification - Please do not reply to this email.
            </div>
          </div>
        `,
        attachments,
      })
    )
  );

  await Assignment.updateOne(
    { _id: assignment._id },
    { $set: { "notification.createdSentAt": new Date() } }
  );

  return { sent: recipients.length };
};

const sendDueTomorrowReminders = async () => {
  const now = new Date();
  const tomorrowStart = new Date(now);
  tomorrowStart.setDate(now.getDate() + 1);
  tomorrowStart.setHours(0, 0, 0, 0);

  const tomorrowEnd = new Date(tomorrowStart);
  tomorrowEnd.setDate(tomorrowStart.getDate() + 1);

  const assignments = await Assignment.find({
    dueDate: { $gte: tomorrowStart, $lt: tomorrowEnd },
    "notification.reminderSentAt": null,
  }).lean();

  for (const assignment of assignments) {
    const recipients = await getRecipientsForAssignment(assignment);
    if (recipients.length) {
      const scopeText = buildScopeText(assignment);
      const due = formatDue(assignment.dueDate);
      const fileAttachments = await getAssignmentAttachments(assignment);
      const { calendarLink, calendarAttachment } = buildCalendarInvite(assignment, scopeText);
      const attachments = calendarAttachment
        ? [...fileAttachments, calendarAttachment]
        : fileAttachments;

      await Promise.all(
        recipients.map((stu) =>
          sendEmail({
            to: stu.email,
            subject: `Reminder: Assignment due tomorrow (${assignment.title})`,
            html: `
              <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; color: #333;">
                <div style="background-color: #ffc107; padding: 20px; color: #333; text-align: center;">
                  <h2 style="margin: 0;">Assignment Due Tomorrow!</h2>
                </div>
                <div style="padding: 25px;">
                  <p>Hello <b>${stu.name || "Student"}</b>,</p>
                  <p>This is a gentle reminder that your assignment is due <b>tomorrow</b>.</p>
                  <div style="background: #fff3cd; padding: 15px; border-radius: 6px; border-left: 4px solid #ffc107; margin: 20px 0;">
                    <p style="margin: 5px 0;"><b>Title:</b> ${assignment.title}</p>
                    <p style="margin: 5px 0;"><b>Subject:</b> ${assignment.subject}</p>
                    <p style="margin: 5px 0;"><b>Scope:</b> ${scopeText}</p>
                    <p style="margin: 5px 0; font-weight: bold;"><b>Due Date:</b> ${due}</p>
                  </div>
                  ${attachments.length ? "<p style='font-size: 0.9em; color: #666;'>📎 The assignment file is attached for your reference.</p>" : ""}
                  <p>Please ensure you submit it on time.</p>
                  ${calendarLink ? `
                    <div style="text-align: center; margin-top: 25px;">
                      <a href="${calendarLink}" style="background-color: #007bff; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Check Calendar</a>
                    </div>
                  ` : ""}
                </div>
                <div style="background: #f1f1f1; padding: 10px; text-align: center; font-size: 12px; color: #888;">
                  System Reminder - Please do not reply to this email.
                </div>
              </div>
            `,
            attachments,
          })
        )
      );
    }

    await Assignment.updateOne(
      { _id: assignment._id },
      { $set: { "notification.reminderSentAt": new Date() } }
    );
  }
};

const startAssignmentReminderCron = () => {
  // Run daily at 08:00 server time.
  cron.schedule("0 8 * * *", async () => {
    try {
      await sendDueTomorrowReminders();
    } catch (err) {
      console.error("assignment reminder cron error:", err);
    }
  });
};

module.exports = {
  sendCreatedAssignmentEmails,
  sendDueTomorrowReminders,
  startAssignmentReminderCron,
};