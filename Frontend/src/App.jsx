import React from "react";
import { Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";

// ==========================================
// 1. PUBLIC & AUTH IMPORTS
// ==========================================
import HomePage from "./Pages/Home/home";
import Register from "./Auth/Register/register";
import LoginPage from "./Auth/Login/login";
import ForgotPassword from "./Auth/ForgotPassword";
import Footer from "./Components/Footer";
import FeaturesPage from "./Components/FeaturesPage";
import ContactPage from "./Components/ContactPage";
import AboutSection from "./Components/AboutSection";
import PrivacyPolicyPage from "./Components/PrivacyPolicyPage";
import TermsPage from "./Components/TermsPage";

// ==========================================
// 2. ADMIN IMPORTS
// ==========================================
import Navbar from "./Pages/Admin/navbar";
import AdminDashboard from "./Pages/Admin/AdminDashboard";
import Dashboard from "./Pages/Admin/Dashboard";
import AdminProfile from './Pages/Admin/adminprofile';
import Fees from "./Pages/Admin/Settings/fees";
import SubjectAll from './Pages/Admin/Subject/allsubject';
import SubjectNew from './Pages/Admin/Subject/newsubject';
import NewClass from "./Pages/Admin/Classes/addClasses";
import AllClasses from "./Pages/Admin/Classes/allClasses";
import AddTeacher from "./Pages/Admin/Teacher/addteacher";
import AllTeachers from "./Pages/Admin/Teacher/allteacher";
import TeacherDetails from "./Pages/Admin/Teacher/viewTeacher";
import EditTeacher from "./Pages/Admin/Teacher/editTeacher";
import TeacherAssignmentList from "./Pages/Admin/Teacher/teacherAssignmentList";
import AllStudents from "./Pages/Admin/Student/allstudent";
import AdminStudentAttendance from "./Pages/Admin/attendance/student_attendance";
import TeacherAttendance from "./Pages/Admin/Teacher/TeacherAttendance";
import AdminTeacherAttendance from "./Pages/Admin/attendance/teacher_attendance";
import ClassFeesPage from "./Pages/Admin/fess/ClassFeesPage";
import StudentPaymentPage from "./Pages/Admin/fess/StudentPaymentPage";
import FeesReportsPage from "./Pages/Admin/fess/FeesReportsPage";
import ApproveSalary from "./Pages/Admin/salary/ApproveSalary";
import SalaryHistory from "./Pages/Admin/salary/SalaryHistory";
import TeacherSalaryRecord from "./Pages/Admin/salary/TeacherSalaryRecord";
import ManageTimetable from "./Pages/Admin/TimeTable/ManageTimetable";
import ViewClassTimetable from "./Pages/Admin/TimeTable/ViewClassTimetable";
import AdminLmsProgress from "./Pages/Admin/LMS/AdminLmsProgress";
import ContactMessages from "./Pages/Admin/Contact/ContactMessages";
import AnnouncementPage from "./Pages/Admin/Announcement/AnnouncementPage";

// ==========================================
// 3. TEACHER IMPORTS
// ==========================================
import TeacherNavbar from "./Pages/Teacher/teacher_navbar";
import TeacherDashboard from "./Pages/Teacher/Dashboard";
import TeacherProfile from "./Pages/Teacher/TeacherProfile";
import AddAssignment from "./Pages/Teacher/Assignment/AddAssignement";
import ViewAssignments from "./Pages/Teacher/Assignment/ViewAssignment";
import ViewStudentsByClass from "./Pages/Teacher/Student/ViewStudent";
import TeacherClasses from "./Pages/Teacher/Classes/classes";
import StudentAttendance from "./Pages/Teacher/Student/Attendance/studentattendance";
import StudentAttendanceHistory from "./Pages/Teacher/Student/Attendance/StudentAttendanceHistory";
import MyAttendance from "./Pages/Teacher/teacher/MyAttendance";
import TeacherSalaryHistory from "./Pages/Teacher/teacher/MySalary";
import AttendanceReport from "./Pages/Teacher/Report/AttendanceReport";
import PerformanceReport from "./Pages/Teacher/Report/PerformanceReport";
import SalaryReport from "./Pages/Teacher/Report/SalaryReport";
import TeacherTimeTable from "./Pages/Teacher/TimeTable/TeacherTimeTable";
import AddExam from "./Pages/Teacher/Exam/AddExam";
import ManageExams from "./Pages/Teacher/Exam/ManageExams";
import TeacherExamResults from "./Pages/Teacher/Exam/TeacherExamResults";
import TeacherLms from "./Pages/Teacher/LMS/TeacherLms";

// ==========================================
// 4. STUDENT IMPORTS
// ==========================================
import StudentNavbar from "./Pages/Student/student_navbar";
import SDashboard from "./Pages/Student/Dashboard";
import StudentProfile from "./Pages/Student/student_profile";
import AssignmentsList from "./Pages/Student/Assignment/AssignmentsList";
import SubmitAssignmentPage from "./Pages/Student/Assignment/SubmitAssignmentPage";
import ViewAttendance from "./Pages/Student/Attandences/StudentAttendance";
import StudentReport from "./Pages/Student/Report/StudentReport";
import StudentFees from "./Pages/Student/Fees/StudentFees";
import StudentTimeTable from "./Pages/Student/TimeTable/Timetable";
import StudentExams from "./Pages/Student/Exam/StudentExamList";
import StudentStartExam from "./Pages/Student/Exam/StudentStartExam";
import StudentExamResult from "./Pages/Student/Exam/StudentExamResult";
import StudentLms from "./Pages/Student/LMS/StudentLms";
import StudentAnnouncements from "./Pages/Student/Announcement/StudentAnnouncements";
import TeacherAnnouncements from "./Pages/Teacher/Announcement/TeacherAnnouncements";

// ==========================================
// 5. SHARED SETTINGS
// ==========================================
import DashboardSettings from "./Pages/Settings/DashboardSettings";

function App() {
  return (
    <>
      <Routes>
        {/* --- Public & Auth --- */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/about" element={<AboutSection />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsPage />} />

        {/* --- Admin Section --- */}
        <Route path="/dashboard" element={<Navbar><Dashboard /></Navbar>} />
        <Route path="/adminDashboard" element={<Navbar><AdminDashboard /></Navbar>} />
        <Route path="/profile" element={<Navbar><AdminProfile /></Navbar>} />
        
        <Route path="/Settings/fees" element={<Navbar><Fees /></Navbar>} />
        <Route path="/approve-salary" element={<Navbar><ApproveSalary /></Navbar>} />
        <Route path="/teacher-salary-record" element={<Navbar><TeacherSalaryRecord /></Navbar>} />
        <Route path="/salarylist" element={<Navbar><SalaryHistory /></Navbar>} />

        <Route path="/classes/new" element={<Navbar><NewClass /></Navbar>} />
        <Route path="/classes/all" element={<Navbar><AllClasses /></Navbar>} />
        <Route path="/subject/newsubject" element={<Navbar><SubjectNew /></Navbar>} />
        <Route path="/subject/allsubject" element={<Navbar><SubjectAll /></Navbar>} />

        <Route path="/Students/allstudents" element={<Navbar><AllStudents /></Navbar>} />
        <Route path="/attendance/student_attendance" element={<Navbar><AdminStudentAttendance /></Navbar>} />
        <Route path="/attendance/teacher_attendance" element={<Navbar><AdminTeacherAttendance /></Navbar>} />
        <Route path="/admin/lms" element={<Navbar><AdminLmsProgress /></Navbar>} />

        <Route path="/admin/fees" element={<Navbar><ClassFeesPage /></Navbar>} />
        <Route path="/studentfees" element={<Navbar><StudentPaymentPage /></Navbar>} />
        <Route path="/admin/fees-reports" element={<Navbar><FeesReportsPage /></Navbar>} />
        <Route path="/admin/timetable" element={<Navbar><ManageTimetable /></Navbar>} />
        <Route path="/admin/view/timetable" element={<Navbar><ViewClassTimetable /></Navbar>} />
        <Route path="/admin/contact/messages" element={<Navbar><ContactMessages /></Navbar>} />
        <Route path="/admin/announcements" element={<Navbar><AnnouncementPage /></Navbar>} />
        <Route path="/settings/preferences" element={<Navbar><DashboardSettings /></Navbar>} />
        <Route path="/Settings/account" element={<Navbar><DashboardSettings /></Navbar>} />

        <Route path="/teacher/addteacher" element={<Navbar><AddTeacher /></Navbar>} />
        <Route path="/teacher/allteacher" element={<Navbar><AllTeachers /></Navbar>} />
        <Route path="/teachers/viewteacher/:id" element={<Navbar><TeacherDetails /></Navbar>} />
        <Route path="/teachers/editteacher/:id" element={<Navbar><EditTeacher /></Navbar>} />
        <Route path="/teacher/attendance" element={<Navbar><TeacherAttendance /></Navbar>} />
        <Route path="/teacher/assignments" element={<Navbar><TeacherAssignmentList /></Navbar>} />

        {/* --- Teacher Section --- */}
        <Route path="/teacherDashboard" element={<TeacherNavbar><TeacherDashboard /></TeacherNavbar>} />
        <Route path="/teacher/dashboard" element={<TeacherNavbar><TeacherDashboard /></TeacherNavbar>} />
        <Route path="/teacher/profile" element={<TeacherNavbar><TeacherProfile /></TeacherNavbar>} />
        <Route path="/teacher/assignment" element={<TeacherNavbar><AddAssignment /></TeacherNavbar>} />
        <Route path="/teacher/viewassignment" element={<TeacherNavbar><ViewAssignments /></TeacherNavbar>} />
        <Route path="/teacher/viewmangestudents" element={<TeacherNavbar><ViewStudentsByClass /></TeacherNavbar>} />
        <Route path="/teacher/classes" element={<TeacherNavbar><TeacherClasses /></TeacherNavbar>} />
        <Route path="/teacher/timetable" element={<TeacherNavbar><TeacherTimeTable /></TeacherNavbar>} />
        <Route path="/teacher/student/attendance" element={<TeacherNavbar><StudentAttendance /></TeacherNavbar>} />
        <Route path="/teacher/attendance-history" element={<TeacherNavbar><StudentAttendanceHistory /></TeacherNavbar>} />
        <Route path="/teacher/my-attendance" element={<TeacherNavbar><MyAttendance /></TeacherNavbar>} />
        <Route path="/teacher/my-salary" element={<TeacherNavbar><TeacherSalaryHistory /></TeacherNavbar>} />
        <Route path="/teacher/reports/attendance" element={<TeacherNavbar><AttendanceReport /></TeacherNavbar>} />
        <Route path="/teacher/reports/performance" element={<TeacherNavbar><PerformanceReport /></TeacherNavbar>} />
        <Route path="/teacher/reports/salary" element={<TeacherNavbar><SalaryReport /></TeacherNavbar>} />
        <Route path="/teacher/addexam" element={<TeacherNavbar><AddExam /></TeacherNavbar>} />
        <Route path="/teacher/mangeexam" element={<TeacherNavbar><ManageExams /></TeacherNavbar>} />
        <Route path="/teacher/exam-results/:examId" element={<TeacherNavbar><TeacherExamResults /></TeacherNavbar>} />
        <Route path="/teacher/lms" element={<TeacherNavbar><TeacherLms /></TeacherNavbar>} />
        <Route path="/teacher/announcements" element={<TeacherNavbar><TeacherAnnouncements /></TeacherNavbar>} />
        <Route path="/teacher/settings" element={<TeacherNavbar><DashboardSettings /></TeacherNavbar>} />

        {/* --- Student Section --- */}
        <Route path="/student/dashboard" element={<StudentNavbar><SDashboard /></StudentNavbar>} />
        <Route path="/studentprofile" element={<StudentNavbar><StudentProfile /></StudentNavbar>} />
        <Route path="/student/assignments" element={<StudentNavbar><AssignmentsList /></StudentNavbar>} />
        <Route path="/student/submitassignments" element={<StudentNavbar><SubmitAssignmentPage /></StudentNavbar>} />
        <Route path="/student/attendance/view" element={<StudentNavbar><ViewAttendance /></StudentNavbar>} />
        <Route path="/student/report" element={<StudentNavbar><StudentReport /></StudentNavbar>} />
        <Route path="/student/fees" element={<StudentNavbar><StudentFees /></StudentNavbar>} />
        <Route path="/timetable" element={<StudentNavbar><StudentTimeTable /></StudentNavbar>} />
        <Route path="/student/exams" element={<StudentNavbar><StudentExams /></StudentNavbar>} />
        <Route path="/student/start-exam/:examId" element={<StudentNavbar><StudentStartExam /></StudentNavbar>} />
        <Route path="/student/exam-result/:examId" element={<StudentNavbar><StudentExamResult /></StudentNavbar>} />
        <Route path="/student/lms" element={<StudentNavbar><StudentLms /></StudentNavbar>} />
        <Route path="/student/announcements" element={<StudentNavbar><StudentAnnouncements /></StudentNavbar>} />
        <Route path="/student/settings" element={<StudentNavbar><DashboardSettings /></StudentNavbar>} />
      </Routes>

      <Footer />
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}

export default App;
