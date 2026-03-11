const MessageQueue = require("../models/MessageQueue");
const { sendEmail } = require("../utils/mailer");
const { sendSms } = require("../utils/smsSender");

let workerTimer = null;
let workerBusy = false;

const normalizeEmail = (v) => String(v || "").trim().toLowerCase();
const normalizePhone = (v) => String(v || "").trim();
const isValidTenDigitPhone = (v) => /^\d{10}$/.test(String(v || "").trim());

const unique = (arr) => [...new Set(arr)];

const enqueueBulkEmailJobs = async (
  recipients,
  { subject, html = "", text = "", meta = {}, maxAttempts = 3, scheduledAt = new Date() }
) => {
  const tos = unique(recipients.map(normalizeEmail).filter(Boolean));
  if (!tos.length) return { queued: 0 };

  const docs = tos.map((to) => ({
    channel: "EMAIL",
    status: "PENDING",
    to,
    subject: String(subject || "").trim(),
    html: String(html || ""),
    text: String(text || ""),
    meta,
    attempts: 0,
    maxAttempts: Number(maxAttempts) || 3,
    nextRunAt: scheduledAt,
  }));

  await MessageQueue.insertMany(docs, { ordered: false });
  return { queued: docs.length };
};

const enqueueBulkSmsJobs = async (
  recipients,
  { message, meta = {}, maxAttempts = 3, scheduledAt = new Date() }
) => {
  const tos = unique(recipients.map(normalizePhone).filter(Boolean));
  const validTos = tos.filter(isValidTenDigitPhone);
  if (!validTos.length) return { queued: 0 };

  const docs = validTos.map((to) => ({
    channel: "SMS",
    status: "PENDING",
    to,
    message: String(message || "").trim(),
    meta,
    attempts: 0,
    maxAttempts: Number(maxAttempts) || 3,
    nextRunAt: scheduledAt,
  }));

  await MessageQueue.insertMany(docs, { ordered: false });
  return { queued: docs.length };
};

const claimNextJob = async () => {
  const now = new Date();
  return MessageQueue.findOneAndUpdate(
    {
      status: { $in: ["PENDING", "FAILED"] },
      nextRunAt: { $lte: now },
      $expr: { $lt: ["$attempts", "$maxAttempts"] },
    },
    {
      $set: {
        status: "PROCESSING",
        lastAttemptAt: now,
      },
      $inc: { attempts: 1 },
    },
    {
      sort: { nextRunAt: 1, createdAt: 1 },
      new: true,
    }
  ).lean();
};

const computeRetryDelayMs = (attemptNo) => {
  const baseSeconds = 30;
  const maxSeconds = 3600;
  return Math.min(maxSeconds, baseSeconds * 2 ** Math.max(0, attemptNo - 1)) * 1000;
};

const processJob = async (job) => {
  if (job.channel === "EMAIL") {
    await sendEmail({
      to: job.to,
      subject: job.subject || "Notification",
      html: job.html || undefined,
      text: job.text || undefined,
    });
  } else if (job.channel === "SMS") {
    await sendSms({
      to: job.to,
      message: job.message,
    });
  } else {
    throw new Error(`Unsupported channel: ${job.channel}`);
  }
};

const processQueueBatch = async (limit = 25) => {
  let processed = 0;
  let sent = 0;
  let failed = 0;

  for (let i = 0; i < limit; i += 1) {
    const job = await claimNextJob();
    if (!job) break;

    processed += 1;
    try {
      await processJob(job);
      sent += 1;
      await MessageQueue.updateOne(
        { _id: job._id },
        {
          $set: {
            status: "SENT",
            sentAt: new Date(),
            errorMessage: "",
          },
        }
      );
    } catch (err) {
      failed += 1;
      const attemptNo = Number(job.attempts || 1);
      const maxAttempts = Number(job.maxAttempts || 3);
      const canRetry = attemptNo < maxAttempts;
      const nextRunAt = canRetry
        ? new Date(Date.now() + computeRetryDelayMs(attemptNo))
        : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

      await MessageQueue.updateOne(
        { _id: job._id },
        {
          $set: {
            status: "FAILED",
            errorMessage: err?.message || "Queue send failed",
            nextRunAt,
          },
        }
      );
    }
  }

  return { processed, sent, failed };
};

const getQueueStats = async () => {
  const [statusRows, channelRows] = await Promise.all([
    MessageQueue.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $project: { _id: 0, status: "$_id", count: 1 } },
    ]),
    MessageQueue.aggregate([
      { $group: { _id: "$channel", count: { $sum: 1 } } },
      { $project: { _id: 0, channel: "$_id", count: 1 } },
    ]),
  ]);

  return { byStatus: statusRows, byChannel: channelRows };
};

const startMessageQueueWorker = () => {
  if (workerTimer) return;

  const tick = async () => {
    if (workerBusy) return;
    workerBusy = true;
    try {
      const summary = await processQueueBatch(30);
      if (summary.processed > 0) {
        console.log(
          `[queue] processed=${summary.processed} sent=${summary.sent} failed=${summary.failed}`
        );
      }
    } catch (err) {
      console.error("[queue] worker error:", err?.message || err);
    } finally {
      workerBusy = false;
    }
  };

  workerTimer = setInterval(tick, 5000);
  setTimeout(tick, 1000);
};

module.exports = {
  enqueueBulkEmailJobs,
  enqueueBulkSmsJobs,
  processQueueBatch,
  getQueueStats,
  startMessageQueueWorker,
};
