const ParentLeaveRequest = require("../models/parentLeaveRequest");
const ParentTeacherMessage = require("../models/parentTeacherMessage");
const Parent = require("../models/parent");
const Student = require("../models/studentregister");
const Notification = require("../models/Notification");
const { emitChatUpdate } = require("../socket/socketServer");

const normalize = (value) => String(value || "").trim();

exports.getMyParentLeaveRequests = async (req, res) => {
  try {
    const status = normalize(req.query.status);
    const query = { teacherId: req.user.id };
    if (status && ["Pending", "Approved", "Rejected"].includes(status)) {
      query.status = status;
    }

    const rows = await ParentLeaveRequest.find(query)
      .populate("parentId", "parentId name email phone mobile contactNumber")
      .populate("studentId", "studentId name studentClass section stream")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      requests: rows.map((row) => ({
        id: String(row._id),
        leaveType: row.leaveType,
        fromDate: row.fromDate,
        toDate: row.toDate,
        reason: row.reason,
        status: row.status,
        note: row.adminNote || "",
        createdAt: row.createdAt,
        parent: row.parentId
          ? {
              id: String(row.parentId._id),
              parentId: row.parentId.parentId || "",
              name: row.parentId.name || "",
              email: row.parentId.email || "",
              phone: row.parentId.phone || row.parentId.mobile || row.parentId.contactNumber || "",
            }
          : null,
        student: row.studentId
          ? {
              id: String(row.studentId._id),
              studentId: row.studentId.studentId || "",
              name: row.studentId.name || "",
              className: Number(row.studentId.studentClass || 0) || "",
              section: row.studentId.section || "",
              stream: row.studentId.stream || "",
            }
          : null,
      })),
    });
  } catch (err) {
    console.error("getMyParentLeaveRequests error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch leave requests" });
  }
};

exports.updateParentLeaveRequestStatus = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, note } = req.body;
    if (!["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "Valid status is required" });
    }

    const request = await ParentLeaveRequest.findOne({
      _id: requestId,
      teacherId: req.user.id,
    })
      .populate("parentId", "name")
      .populate("studentId", "name studentClass section stream")
      .lean();

    if (!request) {
      return res.status(404).json({ success: false, message: "Leave request not found" });
    }

    await ParentLeaveRequest.updateOne(
      { _id: requestId },
      {
        $set: {
          status,
          adminNote: normalize(note),
        },
      }
    );

    await Notification.create({
      type: "LEAVE_REQUEST",
      title: `Leave request ${status.toLowerCase()}`,
      message: `Your leave request for ${request.studentId?.name || "student"} was ${status.toLowerCase()}.`,
      recipientRole: "Parent",
      targetUserId: String(request.parentId?._id || ""),
      className: Number(request.studentId?.studentClass || 0) || null,
      section: request.studentId?.section || "",
      stream: request.studentId?.stream || "",
      data: {
        leaveRequestId: String(request._id),
        studentId: String(request.studentId?._id || ""),
        status,
      },
    });

    return res.json({ success: true, message: `Leave request ${status.toLowerCase()} successfully` });
  } catch (err) {
    console.error("updateParentLeaveRequestStatus error:", err);
    return res.status(500).json({ success: false, message: "Failed to update leave request" });
  }
};

exports.getMyParentMessageThreads = async (req, res) => {
  try {
    const status = normalize(req.query.status);
    const query = { teacherId: req.user.id };
    if (status && ["Open", "Resolved"].includes(status)) {
      query.status = status;
    }

    const rows = await ParentTeacherMessage.find(query)
      .populate("parentId", "parentId name email phone mobile contactNumber")
      .populate("studentId", "studentId name studentClass section stream")
      .sort({ lastMessageAt: -1 })
      .lean();

    return res.json({
      success: true,
      threads: rows.map((row) => {
        const clearedAt = row.teacherClearedAt ? new Date(row.teacherClearedAt) : null;
        const filteredMessages = (row.messages || []).filter((message) => {
          if (!clearedAt) return true;
          const sentAt = new Date(message.sentAt);
          return sentAt > clearedAt;
        });

        return ({
          id: String(row._id),
          subject: row.subject || "",
          status: row.status,
          lastMessageAt: row.lastMessageAt,
          lastSeenByParentAt: row.lastSeenByParentAt || null,
          lastSeenByTeacherAt: row.lastSeenByTeacherAt || null,
          createdAt: row.createdAt,
          parent: row.parentId
          ? {
              id: String(row.parentId._id),
              parentId: row.parentId.parentId || "",
              name: row.parentId.name || "",
              email: row.parentId.email || "",
              phone: row.parentId.phone || row.parentId.mobile || row.parentId.contactNumber || "",
            }
          : null,
        student: row.studentId
          ? {
              id: String(row.studentId._id),
              studentId: row.studentId.studentId || "",
              name: row.studentId.name || "",
              className: Number(row.studentId.studentClass || 0) || "",
              section: row.studentId.section || "",
              stream: row.studentId.stream || "",
            }
          : null,
          messages: filteredMessages.map((message) => ({
            senderRole: message.senderRole,
            senderId: message.senderId,
            text: message.text,
            sentAt: message.sentAt,
          })),
        });
      }),
    });
  } catch (err) {
    console.error("getMyParentMessageThreads error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch parent messages" });
  }
};

exports.replyToParentMessageThread = async (req, res) => {
  try {
    const { threadId } = req.params;
    const { message, status } = req.body;
    if (!normalize(message)) {
      return res.status(400).json({ success: false, message: "Reply message is required" });
    }

    const thread = await ParentTeacherMessage.findOne({
      _id: threadId,
      teacherId: req.user.id,
    })
      .populate("parentId", "name")
      .populate("studentId", "name studentClass section stream")
      .lean();

    if (!thread) {
      return res.status(404).json({ success: false, message: "Message thread not found" });
    }

    const nextStatus = ["Open", "Resolved"].includes(status) ? status : thread.status || "Open";
    const sentAt = new Date();

    await ParentTeacherMessage.updateOne(
      { _id: threadId },
      {
        $push: {
          messages: {
            senderRole: "Teacher",
            senderId: String(req.user.id),
            text: normalize(message),
            sentAt,
          },
        },
        $set: {
          status: nextStatus,
          lastMessageAt: sentAt,
        },
      }
    );

    const messagePreview =
      normalize(message).length > 120 ? `${normalize(message).slice(0, 120)}...` : normalize(message);

    await Notification.create({
      type: "MESSAGE",
      title: `Teacher replied to ${thread.studentId?.name || "parent chat"}`,
      message: `Teacher: ${messagePreview}`,
      recipientRole: "Parent",
      targetUserId: String(thread.parentId?._id || ""),
      className: Number(thread.studentId?.studentClass || 0) || null,
      section: thread.studentId?.section || "",
      stream: thread.studentId?.stream || "",
      data: {
        threadId: String(thread._id),
        studentId: String(thread.studentId?._id || ""),
        status: nextStatus,
      },
    });

    emitChatUpdate({
      parentId: thread.parentId?._id,
      teacherId: req.user.id,
      studentId: thread.studentId?._id,
      threadId: thread._id,
      senderRole: "Teacher",
    });

    return res.json({ success: true, message: "Reply sent successfully" });
  } catch (err) {
    console.error("replyToParentMessageThread error:", err);
    return res.status(500).json({ success: false, message: "Failed to send reply" });
  }
};

exports.deleteParentMessageThread = async (req, res) => {
  try {
    const { threadId } = req.params;
    const thread = await ParentTeacherMessage.findOne({
      _id: threadId,
      teacherId: req.user.id,
    })
      .select("_id parentId studentId")
      .lean();

    if (!thread) {
      return res.status(404).json({ success: false, message: "Message thread not found" });
    }

    await ParentTeacherMessage.updateOne(
      { _id: threadId, teacherId: req.user.id },
      { $set: { teacherClearedAt: new Date() } }
    );

    return res.json({ success: true, message: "Chat deleted successfully" });
  } catch (err) {
    console.error("deleteParentMessageThread error:", err);
    return res.status(500).json({ success: false, message: "Failed to delete chat" });
  }
};
