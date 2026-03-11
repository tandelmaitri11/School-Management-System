const Student = require("../models/studentregister");
const Teacher = require("../models/techerregister");
const Admin = require("../models/admin");
const {
  enqueueBulkEmailJobs,
  enqueueBulkSmsJobs,
  getQueueStats,
  processQueueBatch,
} = require("../services/messageQueueService");

const normalize = (v) => String(v || "").trim();
const normalizeUpper = (v) => String(v || "").trim().toUpperCase();
const isValidTenDigitPhone = (v) => /^\d{10}$/.test(String(v || "").trim());

const unique = (arr) => [...new Set(arr)];

const getStudentsByFilter = async ({ className, section, stream }) => {
  const query = {};
  if (className !== undefined && className !== null && className !== "") {
    query.studentClass = Number(className);
  }
  if (section) query.section = normalizeUpper(section);
  if (stream) query.stream = normalize(stream);

  return Student.find(query).select("name email phone mobile contactNumber").lean();
};

const resolveRecipientsByRoles = async ({ roles = [], className, section, stream }) => {
  const emailSet = new Set();
  const phoneSet = new Set();

  if (roles.includes("Student")) {
    const students = await getStudentsByFilter({ className, section, stream });
    students.forEach((s) => {
      const email = normalize(s.email).toLowerCase();
      const phone = normalize(s.phone || s.mobile || s.contactNumber);
      if (email) emailSet.add(email);
      if (isValidTenDigitPhone(phone)) phoneSet.add(phone);
    });
  }

  if (roles.includes("Teacher")) {
    const teachers = await Teacher.find({}).select("email phone mobile contactNumber").lean();
    teachers.forEach((t) => {
      const email = normalize(t.email).toLowerCase();
      const phone = normalize(t.phone || t.mobile || t.contactNumber);
      if (email) emailSet.add(email);
      if (isValidTenDigitPhone(phone)) phoneSet.add(phone);
    });
  }

  if (roles.includes("Admin")) {
    const admins = await Admin.find({}).select("email phone mobile contactNumber").lean();
    admins.forEach((a) => {
      const email = normalize(a.email).toLowerCase();
      const phone = normalize(a.phone || a.mobile || a.contactNumber);
      if (email) emailSet.add(email);
      if (isValidTenDigitPhone(phone)) phoneSet.add(phone);
    });
  }

  return {
    emails: [...emailSet],
    phones: [...phoneSet],
  };
};

exports.bulkEmailQueue = async (req, res) => {
  try {
    const {
      subject,
      message,
      html,
      recipients = [],
      roles = ["Student"],
      className,
      section,
      stream,
    } = req.body || {};

    if (!normalize(subject)) {
      return res.status(400).json({ message: "subject is required" });
    }

    const manualRecipients = unique(
      (Array.isArray(recipients) ? recipients : [])
        .map((x) => normalize(x).toLowerCase())
        .filter(Boolean)
    );

    const roleList = unique((Array.isArray(roles) ? roles : []).map(normalize).filter(Boolean));
    const scoped = await resolveRecipientsByRoles({ roles: roleList, className, section, stream });

    const emails = unique([...manualRecipients, ...scoped.emails]);
    if (!emails.length) {
      return res.status(400).json({ message: "No valid email recipients found" });
    }

    const bodyHtml = normalize(html) || `<div>${normalize(message)}</div>`;
    const bodyText = normalize(message);

    const result = await enqueueBulkEmailJobs(emails, {
      subject: normalize(subject),
      html: bodyHtml,
      text: bodyText,
      meta: {
        kind: "bulk-email",
        requestedBy: req.user?.id || "",
        roles: roleList,
        className: className ?? "",
        section: normalizeUpper(section),
        stream: normalize(stream),
      },
      maxAttempts: 4,
    });

    return res.json({
      message: "Bulk email queued successfully",
      queued: result.queued,
      recipientCount: emails.length,
    });
  } catch (err) {
    console.error("bulkEmailQueue error:", err);
    return res.status(500).json({ message: "Failed to queue bulk emails" });
  }
};

exports.bulkSmsQueue = async (req, res) => {
  try {
    const {
      message,
      recipients = [],
      roles = ["Student"],
      className,
      section,
      stream,
    } = req.body || {};

    const smsText = normalize(message);
    if (!smsText) return res.status(400).json({ message: "message is required" });

    const manualRecipients = unique(
      (Array.isArray(recipients) ? recipients : [])
        .map(normalize)
        .filter((p) => isValidTenDigitPhone(p))
    );

    const roleList = unique((Array.isArray(roles) ? roles : []).map(normalize).filter(Boolean));
    const scoped = await resolveRecipientsByRoles({ roles: roleList, className, section, stream });
    const phones = unique([...manualRecipients, ...scoped.phones]);

    if (!phones.length) return res.status(400).json({ message: "No valid phone recipients found" });

    const result = await enqueueBulkSmsJobs(phones, {
      message: smsText,
      meta: {
        kind: "bulk-sms",
        requestedBy: req.user?.id || "",
        roles: roleList,
        className: className ?? "",
        section: normalizeUpper(section),
        stream: normalize(stream),
      },
      maxAttempts: 4,
    });

    return res.json({
      message: "Bulk SMS queued successfully",
      queued: result.queued,
      recipientCount: phones.length,
    });
  } catch (err) {
    console.error("bulkSmsQueue error:", err);
    return res.status(500).json({ message: "Failed to queue bulk SMS" });
  }
};

exports.getQueueOverview = async (_req, res) => {
  try {
    const stats = await getQueueStats();
    return res.json({ success: true, stats });
  } catch (err) {
    console.error("getQueueOverview error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch queue stats" });
  }
};

exports.processQueueNow = async (_req, res) => {
  try {
    const summary = await processQueueBatch(100);
    return res.json({ success: true, summary });
  } catch (err) {
    console.error("processQueueNow error:", err);
    return res.status(500).json({ success: false, message: "Failed to process queue" });
  }
};
