require("dotenv").config();
const express=require('express');
const connDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");

const adminRoutes = require("./routes/adminRoutes");
const adminDashboardRoutes = require("./routes/adminDashboardRoutes");


const studentDashboardRoutes = require("./routes/studentDashboardRoute");

const ClassRoutes = require("./routes/classRoutes");
const SubjectRoutes = require("./routes/subjectRoutes");
const teacherRoutes = require("./routes/teacherRoutes");
const studentRoutes = require("./routes/studentRoutes");
const timetableRoutes = require("./routes/timetableRoutes");

const TeacherDashboardRoutes = require("./routes/teacherDashboardRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");

const assignmentRoutes = require("./routes/assignmentRoutes");
const examRoutes = require("./routes/examRoutes");

const reportRoutes = require("./routes/reportRoutes");
const performanceRoutes = require("./routes/performanceRoutes");

const teacherAttendanceRoutes = require("./routes/teacherAttendanceRoute");

const feesRoutes = require("./routes/feesRoutes");

const TeacherSalary = require("./routes/teacherSalaryRoutes")
const lmsRoutes = require("./routes/lmsRoutes");
const contactRoutes = require("./routes/contactRoutes");
const holidayRoutes = require("./routes/holidayRoutes");
const announcementRoutes = require("./routes/announcementRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const { startAssignmentReminderCron } = require("./services/assignmentEmailService");
const { startExamReminderJob } = require("./services/examNotificationService");
const { startFeesAutoReminderCron } = require("./services/feesReminderService");
const { startMessageQueueWorker } = require("./services/messageQueueService");
const { registerCoreEventHandlers } = require("./events/registerCoreEventHandlers");

const path = require("path");
const cors = require("cors");
const teacherAttendance = require("./models/teacherAttendance");

const app = express();
app.use(express.json());

app.use(cors({
    origin:"http://localhost:5173",
    credentials: true
}));

connDB();
registerCoreEventHandlers();
app.use("/uploads",express.static(path.join(__dirname,"uploads")));
app.use(express.urlencoded({ extended:true }));

app.use("/api",authRoutes);

app.use("/api/admin",adminRoutes);
app.use("/api/dashboard",adminDashboardRoutes)

app.use("/api/classes",ClassRoutes);
app.use("/api/subjects", SubjectRoutes);
app.use("/api/teachers",teacherRoutes);

app.use("/api/students",studentRoutes);
app.use("/api/studentDashboard", studentDashboardRoutes);
app.use("/api/timetable", timetableRoutes);

app.use("/api/assignments",assignmentRoutes);
app.use("/api", examRoutes);

app.use("/api/teacher",TeacherDashboardRoutes);
app.use("/api/attendance", attendanceRoutes);

app.use("/api/reports", reportRoutes);
app.use("/api/performance", performanceRoutes);

app.use("/api/teacher-attendance", teacherAttendanceRoutes);

app.use("/api/fees", feesRoutes);

app.use("/api/teacher-salary",TeacherSalary)
app.use("/api/lms", lmsRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/holidays", holidayRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/notifications", notificationRoutes);

startAssignmentReminderCron();
startExamReminderJob();
startFeesAutoReminderCron();
startMessageQueueWorker();

app.listen(3000, () => {
    console.log("Server is running on port 3000");
}); 
