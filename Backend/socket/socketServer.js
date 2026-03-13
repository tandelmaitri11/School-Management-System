const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const ParentTeacherMessage = require("../models/parentTeacherMessage");

let io = null;

const makeUserRoom = (role, id) => `user:${String(role || "").trim()}:${String(id || "").trim()}`;

const initSocketServer = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: "http://localhost:5173",
      credentials: true,
    },                 
  });

  io.use((socket, next) => {
    try {
      const authToken = socket.handshake.auth?.token || "";
      const bearerToken = String(socket.handshake.headers?.authorization || "")
        .replace(/^Bearer\s+/i, "")
        .trim();
      const token = authToken || bearerToken;

      if (!token) {
        return next(new Error("Authentication required"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = {
        id: String(decoded.id || ""),
        role: String(decoded.role || ""),
      };

      return next();
    } catch (error) {
      return next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    if (socket.user?.role && socket.user?.id) {
      socket.join(makeUserRoom(socket.user.role, socket.user.id));
    }

    socket.on("chat:typing", (payload = {}) => {
      const { parentId, teacherId, studentId, isTyping } = payload || {};
      if (!parentId || !teacherId) return;

      const targetRole = socket.user?.role === "Parent" ? "Teacher" : "Parent";
      const targetId = socket.user?.role === "Parent" ? teacherId : parentId;

      emitToUser(targetRole, targetId, "chat:typing", {
        parentId: String(parentId || ""),
        teacherId: String(teacherId || ""),
        studentId: String(studentId || ""),
        isTyping: Boolean(isTyping),
        senderRole: String(socket.user?.role || ""),
        timestamp: new Date().toISOString(),
      });
    });

    socket.on("chat:seen", async (payload = {}) => {
      try {
        const { threadId, parentId, teacherId } = payload || {};
        if (!threadId || !parentId || !teacherId) return;

        const role = String(socket.user?.role || "");
        const now = new Date();
        const update =
          role === "Parent"
            ? { lastSeenByParentAt: now }
            : role === "Teacher"
            ? { lastSeenByTeacherAt: now }
            : null;
        if (!update) return;

        await ParentTeacherMessage.updateOne(
          { _id: threadId, parentId, teacherId },
          { $set: update }
        );

        emitToUser("Parent", parentId, "chat:seen", {
          threadId: String(threadId || ""),
          parentId: String(parentId || ""),
          teacherId: String(teacherId || ""),
          seenBy: role,
          timestamp: now.toISOString(),
        });
        emitToUser("Teacher", teacherId, "chat:seen", {
          threadId: String(threadId || ""),
          parentId: String(parentId || ""),
          teacherId: String(teacherId || ""),
          seenBy: role,
          timestamp: now.toISOString(),
        });
      } catch {
        // ignore socket errors
      }
    });
  });

  return io;
};

const getIO = () => io;

const emitToUser = (role, id, eventName, payload) => {
  if (!io || !role || !id) return;
  io.to(makeUserRoom(role, id)).emit(eventName, payload);
};

const emitChatUpdate = ({ parentId, teacherId, studentId, threadId, senderRole }) => {
  const payload = {
    parentId: String(parentId || ""),
    teacherId: String(teacherId || ""),
    studentId: String(studentId || ""),
    threadId: String(threadId || ""),
    senderRole: String(senderRole || ""),
    timestamp: new Date().toISOString(),
  };

  emitToUser("Parent", parentId, "chat:updated", payload);
  emitToUser("Teacher", teacherId, "chat:updated", payload);
};

module.exports = {
  initSocketServer,
  getIO,
  emitChatUpdate,
};
