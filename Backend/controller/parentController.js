const bcrypt = require("bcryptjs");
const Parent = require("../models/parent");
const ParentStudentMap = require("../models/parentStudentMap");
const Student = require("../models/studentregister");
const StudentInfo = require("../models/studentinfo");
const Exam = require("../models/Exam");
const Class = require("../models/class");
const Teacher = require("../models/techerregister");
const TeacherInfo = require("../models/teacherinfo");
const Admin = require("../models/admin");
const Notification = require("../models/Notification");
const ParentLeaveRequest = require("../models/parentLeaveRequest");
const ParentTeacherMessage = require("../models/parentTeacherMessage");
const { emitChatUpdate } = require("../socket/socketServer");
const attendanceController = require("./attendanceController");
const reportController = require("./reportController");
const feesController = require("./feesController");

const normalize = (v) => String(v || "").trim();
const normalizeUpper = (v) => normalize(v).toUpperCase();
const normalizeLower = (v) => normalize(v).toLowerCase();
const isBothSection = (value) => normalizeUpper(value) === "BOTH";

const getGradeByPercentage = (percentage) => {
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B+";
  if (percentage >= 60) return "B";
  if (percentage >= 50) return "C";
  if (percentage >= 40) return "D";
  return "F";
};

const resolveStudentByAnyId = async (rawStudentId) => {
  const studentId = normalize(rawStudentId);
  if (!studentId) return null;

  let student = null;
  if (/^[0-9a-fA-F]{24}$/.test(studentId)) {
    student = await Student.findById(studentId).lean();
  }
  if (!student) {
    student = await Student.findOne({ studentId }).lean();
  }
  return student;
};

const getActiveMappingForParent = async ({ parentMongoId, rawStudentId }) => {
  const student = await resolveStudentByAnyId(rawStudentId);
  if (!student) return { student: null, mapping: null };

  const mapping = await ParentStudentMap.findOne({
    parentId: parentMongoId,
    studentId: student._id,
    isActive: true,
  }).lean();

  return { student, mapping };
};

const buildStudentSummary = (student, mapping = null) => ({
  id: String(student._id),
  studentId: student.studentId || "",
  name: student.name || "",
  email: student.email || "",
  className: Number(student.studentClass || 0) || "",
  section: student.section || "",
  stream: student.stream || "",
  subjectChoice: student.subjectChoice || "",
  relation: mapping?.relation || "",
  accessLevel: mapping?.accessLevel || "view_only",
  isPrimary: Boolean(mapping?.isPrimary),
});

const getMappedStudentsForParent = async (parentMongoId) => {
  const mappings = await ParentStudentMap.find({
    parentId: parentMongoId,
    isActive: true,
  })
    .populate("studentId", "studentId name email studentClass section stream subjectChoice")
    .sort({ isPrimary: -1, createdAt: 1 })
    .lean();

  return mappings
    .filter((row) => row.studentId)
    .map((row) => buildStudentSummary(row.studentId, row));
};

const buildParentStudentNotificationFilter = (students) => {
  const directStudentIds = students.map((student) => String(student.id));
  const scopedFilters = students.map((student) => {
    const className = Number(student.className || 0);
    const section = normalizeUpper(student.section);
    const stream = normalize(student.stream);
    const subjectChoice = normalize(student.subjectChoice);

    return {
      recipientRole: "Student",
      $and: [
        { $or: [{ className: null }, { className }] },
        { $or: [{ section: "" }, { section }] },
        { $or: [{ stream: "" }, { stream }] },
        { $or: [{ subjectChoice: "" }, { subjectChoice }] },
      ],
    };
  });

  return {
    $or: [
      { recipientRole: "Student", targetUserId: { $in: directStudentIds } },
      ...scopedFilters,
    ],
  };
};

const buildStudentScopeFromStudent = (student) => ({
  className: Number(student?.studentClass || 0),
  section: normalizeUpper(student?.section),
  stream: normalize(student?.stream),
  subjectChoice: normalize(student?.subjectChoice),
});

const startOfDay = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const endOfDay = (value) => {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
};

const buildTeacherContact = (teacher, info, roleLabel = "Teacher") => ({
  id: String(teacher?._id || ""),
  teacherId: teacher?.teacherId || info?.regNumber || "",
  name: teacher?.name || info?.teacherName || "Teacher",
  email: teacher?.email || info?.email || "",
  phone: teacher?.phone || teacher?.mobile || teacher?.contactNumber || info?.mobile || "",
  roleLabel,
  subjects: Array.isArray(info?.subjects) ? info.subjects.filter(Boolean) : [],
});

const getAvailableTeachersForStudent = async (student) => {
  const className = Number(student?.studentClass || 0);
  if (!className) return [];

  const section = normalizeUpper(student?.section);
  const stream = normalize(student?.stream);
  const classDoc = await Class.findOne({ className })
    .populate("classTeacher", "teacherId name email phone mobile contactNumber")
    .lean();

  const contacts = [];
  const seen = new Set();

  const pushTeacher = (teacher, info, roleLabel) => {
    if (!teacher?._id) return;
    const key = String(teacher._id);
    if (seen.has(key)) return;
    seen.add(key);
    contacts.push(buildTeacherContact(teacher, info, roleLabel));
  };

  if (classDoc?.classTeacher) {
    pushTeacher(classDoc.classTeacher, null, "Class Teacher");
  }

  if (!classDoc?._id) return contacts;

  const infoRows = await TeacherInfo.find({ classes: classDoc._id })
    .select("regNumber teacherName email mobile subjects assignedSections")
    .lean();

  const teacherRegNumbers = [...new Set(infoRows.map((row) => normalize(row?.regNumber)).filter(Boolean))];
  const teachers = await Teacher.find({ teacherId: { $in: teacherRegNumbers } })
    .select("_id teacherId name email phone mobile contactNumber")
    .lean();
  const teacherMap = new Map(teachers.map((row) => [normalize(row.teacherId), row]));

  for (const info of infoRows) {
    const assignedRows = Array.isArray(info?.assignedSections) ? info.assignedSections : [];
    const matchesSection =
      assignedRows.length === 0 ||
      assignedRows.some((row) => {
        if (String(row?.classId || "") !== String(classDoc._id)) return false;
        if (normalizeUpper(row?.section) !== section) return false;
        const rowStream = normalize(row?.stream);
        return !rowStream || normalizeLower(rowStream) === normalizeLower(stream);
      });

    if (!matchesSection) continue;
    pushTeacher(teacherMap.get(normalize(info.regNumber)), info, "Subject Teacher");
  }

  return contacts.sort((a, b) => a.name.localeCompare(b.name));
};

const isChoiceSubjectForStudentStream = (examSubject, classDoc, studentStream) => {
  if (!classDoc || !examSubject || !studentStream) return false;

  const streamDoc = (classDoc.streams || []).find(
    (s) => normalizeLower(s?.name) === normalizeLower(studentStream)
  );
  if (!streamDoc) return false;

  const options = (streamDoc.subjectOptions || []).map((x) => normalizeLower(x)).filter(Boolean);
  return options.includes(normalizeLower(examSubject));
};

const canAccessExamForStudent = (exam, studentScope, classDoc) => {
  if (Number(exam.className) !== Number(studentScope.className)) return false;

  const examSection = normalizeUpper(exam.section);
  const studentSection = normalizeUpper(studentScope.section);
  if (examSection && !isBothSection(examSection) && examSection !== studentSection) return false;

  const examStream = normalize(exam.stream);
  const studentStream = normalize(studentScope.stream);
  if (examStream && normalizeLower(examStream) !== normalizeLower(studentStream)) return false;

  const examSubject = normalize(exam.subjectName);
  const studentChoice = normalize(studentScope.subjectChoice);
  const isChoice = isChoiceSubjectForStudentStream(examSubject, classDoc, studentStream);
  if (isChoice && (!studentChoice || normalizeLower(examSubject) !== normalizeLower(studentChoice))) {
    return false;
  }

  return true;
};

exports.createParent = async (req, res) => {
  try {
    const { name, email, password, phone, mobile, contactNumber, status = "Active" } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "name, email and password are required" });
    }

    const safeEmail = normalize(email).toLowerCase();
    const [existingParent, existingStudent, existingTeacher, existingAdmin] = await Promise.all([
      Parent.findOne({ email: safeEmail }).lean(),
      Student.findOne({ email: safeEmail }).lean(),
      Teacher.findOne({ email: safeEmail }).lean(),
      Admin.findOne({ email: safeEmail }).lean(),
    ]);
    if (existingParent || existingStudent || existingTeacher || existingAdmin) {
      return res.status(409).json({ message: "Email already exists in the system" });
    }

    const hashedPassword = await bcrypt.hash(String(password), 10);
    const parent = await Parent.create({
      name: normalize(name),
      email: safeEmail,
      password: hashedPassword,
      phone: normalize(phone),
      mobile: normalize(mobile),
      contactNumber: normalize(contactNumber),
      status: normalize(status) === "Inactive" ? "Inactive" : "Active",
    });

    return res.status(201).json({
      message: "Parent created successfully",
      parent: {
        id: parent._id,
        parentId: parent.parentId,
        name: parent.name,
        email: parent.email,
        phone: parent.phone || parent.mobile || parent.contactNumber || "",
        status: parent.status,
      },
    });
  } catch (err) {
    console.error("createParent error:", err);
    return res.status(500).json({ message: "Failed to create parent" });
  }
};

exports.getAllParents = async (_req, res) => {
  try {
    const parents = await Parent.find({})
      .select("parentId name email phone mobile contactNumber status createdAt")
      .sort({ createdAt: -1 })
      .lean();

    const parentIds = parents.map((parent) => parent._id);
    const mappings = await ParentStudentMap.find({ parentId: { $in: parentIds } })
      .populate("studentId", "studentId name studentClass section stream")
      .lean();

    const grouped = new Map();
    for (const row of mappings) {
      const key = String(row.parentId);
      const bucket = grouped.get(key) || [];
      if (row.studentId) {
        bucket.push({
          id: String(row.studentId._id),
          studentId: row.studentId.studentId || "",
          name: row.studentId.name || "",
          className: Number(row.studentId.studentClass || 0) || "",
          section: row.studentId.section || "",
          stream: row.studentId.stream || "",
          relation: row.relation || "",
          isActive: Boolean(row.isActive),
          isPrimary: Boolean(row.isPrimary),
          mappingId: String(row._id),
        });
      }
      grouped.set(key, bucket);
    }

    return res.json({
      parents: parents.map((parent) => ({
        id: String(parent._id),
        parentId: parent.parentId,
        name: parent.name,
        email: parent.email,
        phone: parent.phone || parent.mobile || parent.contactNumber || "",
        status: parent.status,
        students: grouped.get(String(parent._id)) || [],
      })),
    });
  } catch (err) {
    console.error("getAllParents error:", err);
    return res.status(500).json({ message: "Failed to fetch parents" });
  }
};

exports.mapParentToStudent = async (req, res) => {
  try {
    const { parentId, studentId, relation, accessLevel, isPrimary } = req.body;
    if (!parentId || !studentId) {
      return res.status(400).json({ message: "parentId and studentId are required" });
    }

    const parent = await Parent.findById(parentId).select("_id").lean();
    if (!parent) return res.status(404).json({ message: "Parent not found" });

    const student = await resolveStudentByAnyId(studentId);
    if (!student) return res.status(404).json({ message: "Student not found" });

    if (isPrimary) {
      await ParentStudentMap.updateMany({ parentId: parent._id }, { $set: { isPrimary: false } });
    }

    const mapping = await ParentStudentMap.findOneAndUpdate(
      { parentId: parent._id, studentId: student._id },
      {
        $set: {
          relation: normalize(relation) || "Parent",
          accessLevel: normalize(accessLevel) === "full" ? "full" : "view_only",
          isPrimary: Boolean(isPrimary),
          isActive: true,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();

    return res.json({
      message: "Parent linked to student successfully",
      mapping,
      student: buildStudentSummary(student, mapping),
    });
  } catch (err) {
    console.error("mapParentToStudent error:", err);
    if (err?.code === 11000) {
      return res.status(409).json({ message: "This parent is already linked to the student" });
    }
    return res.status(500).json({ message: "Failed to link parent and student" });
  }
};

exports.updateParentStudentMapping = async (req, res) => {
  try {
    const { mappingId } = req.params;
    const { relation, accessLevel, isPrimary, isActive } = req.body;

    const mapping = await ParentStudentMap.findById(mappingId).lean();
    if (!mapping) return res.status(404).json({ message: "Mapping not found" });

    if (isPrimary) {
      await ParentStudentMap.updateMany({ parentId: mapping.parentId }, { $set: { isPrimary: false } });
    }

    const updated = await ParentStudentMap.findByIdAndUpdate(
      mappingId,
      {
        $set: {
          ...(relation !== undefined ? { relation: normalize(relation) || "Parent" } : {}),
          ...(accessLevel !== undefined
            ? { accessLevel: normalize(accessLevel) === "full" ? "full" : "view_only" }
            : {}),
          ...(isPrimary !== undefined ? { isPrimary: Boolean(isPrimary) } : {}),
          ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
        },
      },
      { new: true }
    )
      .populate("studentId", "studentId name email studentClass section stream subjectChoice")
      .lean();

    return res.json({
      message: "Parent-student mapping updated successfully",
      mapping: updated,
      student: updated?.studentId ? buildStudentSummary(updated.studentId, updated) : null,
    });
  } catch (err) {
    console.error("updateParentStudentMapping error:", err);
    return res.status(500).json({ message: "Failed to update mapping" });
  }
};

exports.getMyProfile = async (req, res) => {
  try {
    const parent = await Parent.findById(req.user.id)
      .select("parentId name email phone mobile contactNumber status createdAt")
      .lean();
    if (!parent) return res.status(404).json({ message: "Parent not found" });

    return res.json({
      parent: {
        id: String(parent._id),
        parentId: parent.parentId,
        name: parent.name,
        email: parent.email,
        phone: parent.phone || parent.mobile || parent.contactNumber || "",
        status: parent.status,
        createdAt: parent.createdAt,
      },
    });
  } catch (err) {
    console.error("getMyProfile error:", err);
    return res.status(500).json({ message: "Failed to fetch parent profile" });
  }
};

exports.getMyStudents = async (req, res) => {
  try {
    const students = await getMappedStudentsForParent(req.user.id);
    return res.json({ students });
  } catch (err) {
    console.error("getMyStudents error:", err);
    return res.status(500).json({ message: "Failed to fetch linked students" });
  }
};

exports.getStudentAttendanceForParent = async (req, res) => {
  try {
    const { student, mapping } = await getActiveMappingForParent({
      parentMongoId: req.user.id,
      rawStudentId: req.params.studentId,
    });
    if (!student || !mapping) {
      return res.status(403).json({ message: "Not allowed to access this student's attendance" });
    }

    req.params.studentId = String(student._id);
    return attendanceController.getAttendanceByStudent(req, res);
  } catch (err) {
    console.error("getStudentAttendanceForParent error:", err);
    return res.status(500).json({ message: "Failed to fetch attendance" });
  }
};

exports.getStudentReportForParent = async (req, res) => {
  try {
    const { student, mapping } = await getActiveMappingForParent({
      parentMongoId: req.user.id,
      rawStudentId: req.params.studentId,
    });
    if (!student || !mapping) {
      return res.status(403).json({ message: "Not allowed to access this student's report" });
    }

    req.params.studentId = String(student._id);
    return reportController.getStudentReport(req, res);
  } catch (err) {
    console.error("getStudentReportForParent error:", err);
    return res.status(500).json({ message: "Failed to fetch report" });
  }
};

exports.getStudentFeesForParent = async (req, res) => {
  try {
    const { student, mapping } = await getActiveMappingForParent({
      parentMongoId: req.user.id,
      rawStudentId: req.params.studentId,
    });
    if (!student || !mapping) {
      return res.status(403).json({ message: "Not allowed to access this student's fees" });
    }

    req.params.studentId = String(student._id);
    return feesController.getStudentFees(req, res);
  } catch (err) {
    console.error("getStudentFeesForParent error:", err);
    return res.status(500).json({ message: "Failed to fetch fees" });
  }
};

exports.getStudentProfileForParent = async (req, res) => {
  try {
    const { student, mapping } = await getActiveMappingForParent({
      parentMongoId: req.user.id,
      rawStudentId: req.params.studentId,
    });
    if (!student || !mapping) {
      return res.status(403).json({ message: "Not allowed to access this student's profile" });
    }

    const info = await StudentInfo.findOne({ student: student._id }).lean();

    return res.status(200).json({
      student,
      info: info || null,
    });
  } catch (err) {
    console.error("getStudentProfileForParent error:", err);
    return res.status(500).json({ message: "Failed to fetch student profile" });
  }
};

exports.getStudentExamsForParent = async (req, res) => {
  try {
    const { student, mapping } = await getActiveMappingForParent({
      parentMongoId: req.user.id,
      rawStudentId: req.params.studentId,
    });
    if (!student || !mapping) {
      return res.status(403).json({ message: "Not allowed to access this student's exams" });
    }

    const studentScope = buildStudentScopeFromStudent(student);
    const className = Number(studentScope.className);
    const section = normalizeUpper(studentScope.section);
    const stream = normalize(studentScope.stream);

    if (!className) {
      return res.status(400).json({ success: false, message: "Student class not found" });
    }

    const exams = await Exam.find({
      className,
      $or: [{ section: { $exists: false } }, { section: "" }, { section: "BOTH" }, { section }],
      $and: [{ $or: [{ stream: { $exists: false } }, { stream: "" }, { stream }] }],
    })
      .select("-questions.correctAnswer")
      .sort({ startTime: -1 });

    const classIds = [...new Set(exams.map((e) => String(e.classId || "")).filter(Boolean))];
    const classDocs = await Class.find({ _id: { $in: classIds } }).select("streams").lean();
    const classMap = new Map(classDocs.map((c) => [String(c._id), c]));

    const mapped = exams
      .filter((exam) => canAccessExamForStudent(exam, studentScope, classMap.get(String(exam.classId || ""))))
      .map((exam) => {
        const sub = (exam.submissions || []).find(
          (s) => String(s.studentId) === String(student._id)
        );
        return {
          _id: exam._id,
          title: exam.title,
          subjectName: exam.subjectName,
          className: exam.className,
          section: exam.section || "",
          stream: exam.stream || "",
          duration: exam.duration,
          totalMarks: exam.totalMarks,
          startTime: exam.startTime,
          attempted: !!sub,
          submitted: sub?.status === "SUBMITTED",
          attendanceStatus: sub?.status || "NOT_SUBMITTED",
          obtainedMarks: Number(sub?.obtainedMarks || 0),
          percentage: Number(sub?.percentage || 0),
          grade: sub?.grade || "",
          resultStatus: sub?.resultStatus || "",
          submittedAt: sub?.submittedAt || null,
        };
      });

    return res.json({ success: true, studentId: String(student._id), exams: mapped });
  } catch (err) {
    console.error("getStudentExamsForParent error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch exams" });
  }
};

exports.getStudentExamResultForParent = async (req, res) => {
  try {
    const { student, mapping } = await getActiveMappingForParent({
      parentMongoId: req.user.id,
      rawStudentId: req.params.studentId,
    });
    if (!student || !mapping) {
      return res.status(403).json({ message: "Not allowed to access this student's exam result" });
    }

    const exam = await Exam.findById(req.params.examId).lean();
    if (!exam) {
      return res.status(404).json({ success: false, message: "Exam not found" });
    }

    const studentScope = buildStudentScopeFromStudent(student);
    const classDoc = exam.classId ? await Class.findById(exam.classId).select("streams").lean() : null;
    if (!canAccessExamForStudent(exam, studentScope, classDoc)) {
      return res.status(403).json({ success: false, message: "Exam is not assigned to this student" });
    }

    const submission = (exam.submissions || []).find((s) => String(s.studentId) === String(student._id));
    if (!submission || (submission.status !== "SUBMITTED" && submission.status !== "ABSENT")) {
      return res.status(404).json({ success: false, message: "No result found for this student" });
    }

    return res.json({
      success: true,
      student: {
        id: String(student._id),
        name: student.name || "",
        studentId: student.studentId || "",
      },
      exam: {
        _id: exam._id,
        title: exam.title,
        subjectName: exam.subjectName,
        totalMarks: exam.totalMarks,
        startTime: exam.startTime,
      },
      result: {
        obtainedMarks: Number(submission.obtainedMarks || 0),
        percentage: Number(submission.percentage || 0),
        grade: submission.grade || getGradeByPercentage(Number(submission.percentage || 0)),
        resultStatus:
          submission.resultStatus || (Number(submission.percentage || 0) >= 40 ? "PASS" : "FAIL"),
        submittedAt: submission.submittedAt || null,
        attendanceStatus: submission.status || "NOT_SUBMITTED",
      },
    });
  } catch (err) {
    console.error("getStudentExamResultForParent error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch exam result" });
  }
};

exports.getAvailableTeachersForParent = async (req, res) => {
  try {
    const { student, mapping } = await getActiveMappingForParent({
      parentMongoId: req.user.id,
      rawStudentId: req.params.studentId,
    });
    if (!student || !mapping) {
      return res.status(403).json({ message: "Not allowed to access this student's teachers" });
    }

    const teachers = await getAvailableTeachersForStudent(student);
    return res.json({
      success: true,
      student: {
        id: String(student._id),
        name: student.name || "",
        studentId: student.studentId || "",
      },
      teachers,
    });
  } catch (err) {
    console.error("getAvailableTeachersForParent error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch teachers" });
  }
};

exports.getStudentLeaveRequestsForParent = async (req, res) => {
  try {
    const { student, mapping } = await getActiveMappingForParent({
      parentMongoId: req.user.id,
      rawStudentId: req.params.studentId,
    });
    if (!student || !mapping) {
      return res.status(403).json({ message: "Not allowed to access this student's leave requests" });
    }

    const rows = await ParentLeaveRequest.find({
      parentId: req.user.id,
      studentId: student._id,
    })
      .populate("teacherId", "teacherId name email phone mobile contactNumber")
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
        adminNote: row.adminNote || "",
        createdAt: row.createdAt,
        teacher: row.teacherId
          ? {
              id: String(row.teacherId._id),
              teacherId: row.teacherId.teacherId || "",
              name: row.teacherId.name || "",
              email: row.teacherId.email || "",
            }
          : null,
      })),
    });
  } catch (err) {
    console.error("getStudentLeaveRequestsForParent error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch leave requests" });
  }
};

exports.createStudentLeaveRequestForParent = async (req, res) => {
  try {
    const { student, mapping } = await getActiveMappingForParent({
      parentMongoId: req.user.id,
      rawStudentId: req.params.studentId,
    });
    if (!student || !mapping) {
      return res.status(403).json({ message: "Not allowed to create leave request for this student" });
    }

    const { teacherId, leaveType, fromDate, toDate, reason } = req.body;
    if (!fromDate || !toDate || !normalize(reason)) {
      return res.status(400).json({ message: "fromDate, toDate and reason are required" });
    }

    const start = startOfDay(fromDate);
    const end = endOfDay(toDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return res.status(400).json({ message: "Invalid leave dates" });
    }
    if (start > end) {
      return res.status(400).json({ message: "fromDate cannot be later than toDate" });
    }

    let targetTeacher = null;
    if (teacherId) {
      targetTeacher = await Teacher.findById(teacherId).select("_id teacherId name").lean();
      if (!targetTeacher) {
        return res.status(404).json({ message: "Teacher not found" });
      }
    }

    const leaveRequest = await ParentLeaveRequest.create({
      parentId: req.user.id,
      studentId: student._id,
      teacherId: targetTeacher?._id || null,
      leaveType: normalize(leaveType) || "Casual Leave",
      fromDate: start,
      toDate: end,
      reason: normalize(reason),
    });

    if (targetTeacher?._id) {
      await Notification.create({
        type: "LEAVE_REQUEST",
        title: `Leave request for ${student.name || "student"}`,
        message: `${req.user.name || "A parent"} submitted a leave request from ${start.toLocaleDateString("en-IN")} to ${end.toLocaleDateString("en-IN")}.`,
        recipientRole: "Teacher",
        targetUserId: String(targetTeacher._id),
        className: Number(student.studentClass || 0) || null,
        section: normalizeUpper(student.section),
        stream: normalize(student.stream),
        data: {
          studentId: String(student._id),
          leaveRequestId: String(leaveRequest._id),
          parentId: String(req.user.id),
        },
      });

    }

    return res.status(201).json({
      success: true,
      message: "Leave request submitted successfully",
      request: {
        id: String(leaveRequest._id),
        status: leaveRequest.status,
      },
    });
  } catch (err) {
    console.error("createStudentLeaveRequestForParent error:", err);
    return res.status(500).json({ success: false, message: "Failed to submit leave request" });
  }
};

exports.getStudentMessagesForParent = async (req, res) => {
  try {
    const { student, mapping } = await getActiveMappingForParent({
      parentMongoId: req.user.id,
      rawStudentId: req.params.studentId,
    });
    if (!student || !mapping) {
      return res.status(403).json({ message: "Not allowed to access this student's communication" });
    }

    const rows = await ParentTeacherMessage.find({
      parentId: req.user.id,
      studentId: student._id,
    })
      .populate("teacherId", "teacherId name email phone mobile contactNumber")
      .sort({ lastMessageAt: -1 })
      .lean();

    return res.json({
      success: true,
      threads: rows.map((row) => {
        const clearedAt = row.parentClearedAt ? new Date(row.parentClearedAt) : null;
        const filteredMessages = (row.messages || []).filter((message) => {
          if (!clearedAt) return true;
          const sentAt = new Date(message.sentAt);
          return sentAt > clearedAt;
        });

        return ({
          id: String(row._id),
          subject: row.subject,
          status: row.status,
          lastMessageAt: row.lastMessageAt,
          lastSeenByParentAt: row.lastSeenByParentAt || null,
          lastSeenByTeacherAt: row.lastSeenByTeacherAt || null,
          createdAt: row.createdAt,
          teacher: row.teacherId
          ? {
              id: String(row.teacherId._id),
              teacherId: row.teacherId.teacherId || "",
              name: row.teacherId.name || "",
              email: row.teacherId.email || "",
              phone: row.teacherId.phone || row.teacherId.mobile || row.teacherId.contactNumber || "",
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
    console.error("getStudentMessagesForParent error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch messages" });
  }
};

exports.createStudentMessageForParent = async (req, res) => {
  try {
    const { student, mapping } = await getActiveMappingForParent({
      parentMongoId: req.user.id,
      rawStudentId: req.params.studentId,
    });
    if (!student || !mapping) {
      return res.status(403).json({ message: "Not allowed to message for this student" });
    }

    const { teacherId, message } = req.body;
    if (!teacherId || !normalize(message)) {
      return res.status(400).json({ message: "teacherId and message are required" });
    }

    const targetTeacher = await Teacher.findById(teacherId).select("_id teacherId name").lean();
    if (!targetTeacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const sentAt = new Date();
    const thread = await ParentTeacherMessage.findOneAndUpdate(
      {
        parentId: req.user.id,
        studentId: student._id,
        teacherId: targetTeacher._id,
      },
      {
        $set: {
          status: "Open",
          lastMessageAt: sentAt,
        },
        $setOnInsert: {
          subject: "",
        },
        $push: {
          messages: {
            senderRole: "Parent",
            senderId: String(req.user.id),
            text: normalize(message),
            sentAt,
          },
        },
      },
      {
        new: true,
        upsert: true,
      }
    ).lean();

    const messagePreview =
      normalize(message).length > 120 ? `${normalize(message).slice(0, 120)}...` : normalize(message);

    await Notification.create({
      type: "MESSAGE",
      title: `New parent message from ${student.name || "parent chat"}`,
      message: `${req.user.name || "A parent"}: ${messagePreview}`,
      recipientRole: "Teacher",
      targetUserId: String(targetTeacher._id),
      className: Number(student.studentClass || 0) || null,
      section: normalizeUpper(student.section),
      stream: normalize(student.stream),
      data: {
        threadId: String(thread._id),
        studentId: String(student._id),
        parentId: String(req.user.id),
      },
    });

    emitChatUpdate({
      parentId: req.user.id,
      teacherId: targetTeacher._id,
      studentId: student._id,
      threadId: thread._id,
      senderRole: "Parent",
    });

    return res.status(201).json({
      success: true,
      message: "Message sent successfully",
      threadId: String(thread._id),
    });
  } catch (err) {
    console.error("createStudentMessageForParent error:", err);
    return res.status(500).json({ success: false, message: "Failed to send message" });
  }
};

exports.deleteStudentMessageThreadForParent = async (req, res) => {
  try {
    const { student, mapping } = await getActiveMappingForParent({
      parentMongoId: req.user.id,
      rawStudentId: req.params.studentId,
    });
    if (!student || !mapping) {
      return res.status(403).json({ message: "Not allowed to delete this student's communication" });
    }

    const { threadId } = req.params;
    const thread = await ParentTeacherMessage.findOne({
      _id: threadId,
      parentId: req.user.id,
      studentId: student._id,
    })
      .select("_id teacherId")
      .lean();

    if (!thread) {
      return res.status(404).json({ message: "Message thread not found" });
    }

    await ParentTeacherMessage.updateOne(
      { _id: threadId, parentId: req.user.id, studentId: student._id },
      { $set: { parentClearedAt: new Date() } }
    );

    return res.json({ success: true, message: "Chat deleted successfully" });
  } catch (err) {
    console.error("deleteStudentMessageThreadForParent error:", err);
    return res.status(500).json({ success: false, message: "Failed to delete chat" });
  }
};

exports.getMyNotifications = async (req, res) => {
  try {
    const students = await getMappedStudentsForParent(req.user.id);
    const limit = Math.min(Number(req.query.limit || 30), 100);
    const rows = await Notification.find(
      students.length
        ? {
            $or: [
              { recipientRole: "Parent", targetUserId: String(req.user.id) },
              buildParentStudentNotificationFilter(students),
            ],
          }
        : { recipientRole: "Parent", targetUserId: String(req.user.id) }
    )
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return res.json({
      success: true,
      notifications: rows.map((row) => {
        const linkedStudent =
          students.find((student) => String(student.id) === String(row.data?.studentId || "")) ||
          students.find((student) => String(student.id) === String(row.targetUserId || "")) ||
          students.find((student) => {
            const classMatch = row.className == null || Number(row.className) === Number(student.className || 0);
            const sectionMatch = !row.section || normalizeUpper(row.section) === normalizeUpper(student.section);
            const streamMatch = !row.stream || normalize(row.stream) === normalize(student.stream);
            return classMatch && sectionMatch && streamMatch;
          }) ||
          null;

        return {
          ...row,
          student: linkedStudent
            ? {
                id: linkedStudent.id,
                studentId: linkedStudent.studentId,
                name: linkedStudent.name,
              }
            : null,
        };
      }),
    });
  } catch (err) {
    console.error("parent getMyNotifications error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch notifications" });
  }
};
