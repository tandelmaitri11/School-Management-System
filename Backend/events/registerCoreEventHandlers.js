const eventBus = require("./eventBus");
const { sendCreatedAssignmentEmails } = require("../services/assignmentEmailService");
const Notification = require("../models/Notification");

let initialized = false;

const logEventFailure = (eventName, err) => {
  console.error(`[event:${eventName}] handler error:`, err?.message || err);
};

const registerCoreEventHandlers = () => {
  if (initialized) return;
  initialized = true;

  eventBus.on("assignment.uploaded", async ({ assignment }) => {
    try {
      await Notification.create({
        type: "ASSIGNMENT",
        title: `New Assignment: ${assignment?.title || "Assignment"}`,
        message: `${assignment?.subject || "Subject"} assignment uploaded${
          assignment?.dueDate ? `, due on ${new Date(assignment.dueDate).toISOString().slice(0, 10)}` : ""
        }.`,
        recipientRole: "Student",
        className: Number(assignment?.classAssigned) || null,
        section: String(assignment?.sectionAssigned || "").trim().toUpperCase(),
        stream: String(assignment?.streamAssigned || "").trim(),
        subjectChoice: String(assignment?.subjectChoiceAssigned || "").trim(),
        data: {
          assignmentId: assignment?._id,
          subject: assignment?.subject || "",
          dueDate: assignment?.dueDate || null,
        },
      });

      await sendCreatedAssignmentEmails(assignment);
      console.log(`[event:assignment.uploaded] notifications sent for assignment ${assignment?._id}`);
    } catch (err) {
      logEventFailure("assignment.uploaded", err);
    }
  });

  eventBus.on("announcement.posted", async (payload) => {
    try {
      const docs = [];
      if (payload?.audience === "Students" || payload?.audience === "All" || payload?.audience === "Both") {
        docs.push({
          type: "ANNOUNCEMENT",
          title: payload?.title || "Announcement",
          message: payload?.message || "New announcement posted",
          recipientRole: "Student",
          data: {
            announcementId: payload?.announcementId,
            mediaUrl: payload?.mediaUrl || "",
            mediaType: payload?.mediaType || "",
            publishedAt: payload?.publishedAt || null,
          },
        });
      }
      if (payload?.audience === "Teachers" || payload?.audience === "All" || payload?.audience === "Both") {
        docs.push({
          type: "ANNOUNCEMENT",
          title: payload?.title || "Announcement",
          message: payload?.message || "New announcement posted",
          recipientRole: "Teacher",
          data: {
            announcementId: payload?.announcementId,
            mediaUrl: payload?.mediaUrl || "",
            mediaType: payload?.mediaType || "",
            publishedAt: payload?.publishedAt || null,
          },
        });
      }
      if (payload?.audience === "Parents" || payload?.audience === "All" || payload?.audience === "Both") {
        docs.push({
          type: "ANNOUNCEMENT",
          title: payload?.title || "Announcement",
          message: payload?.message || "New announcement posted",
          recipientRole: "Parent",
          targetUserId: "",
          data: {
            announcementId: payload?.announcementId,
            mediaUrl: payload?.mediaUrl || "",
            mediaType: payload?.mediaType || "",
            publishedAt: payload?.publishedAt || null,
          },
        });
      }
      if (docs.length) {
        await Notification.insertMany(docs, { ordered: false });
      }

      // Hook point for push/email/in-app notifications.
      console.log(
        `[event:announcement.posted] announcement ${payload?.announcementId} published for audience ${payload?.audience}`
      );
    } catch (err) {
      logEventFailure("announcement.posted", err);
    }
  });

  eventBus.on("result.published", async (payload) => {
    try {
      await Notification.create({
        type: "RESULT",
        title: `Result Published: ${payload?.examTitle || "Exam"}`,
        message: `You scored ${payload?.obtainedMarks ?? 0}/${payload?.totalMarks ?? 0} (${payload?.percentage ?? 0}%).`,
        recipientRole: "Student",
        targetUserId: String(payload?.studentId || ""),
        className: Number(payload?.className) || null,
        section: String(payload?.section || "").trim().toUpperCase(),
        stream: String(payload?.stream || "").trim(),
        data: {
          examId: payload?.examId,
          subjectName: payload?.subjectName || "",
          submittedAt: payload?.submittedAt || null,
        },
      });

      // Hook point for parent/student notifications and analytics updates.
      console.log(
        `[event:result.published] exam ${payload?.examId}, student ${payload?.studentId}, percentage ${payload?.percentage}`
      );
    } catch (err) {
      logEventFailure("result.published", err);
    }
  });
};

module.exports = { registerCoreEventHandlers };
