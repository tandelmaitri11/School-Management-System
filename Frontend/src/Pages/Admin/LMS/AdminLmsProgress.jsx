import React, { useEffect, useMemo, useState } from "react";
import api from "../../../api/api";
import { Alert, Badge, Button, Card, Form, Spinner, Table, Offcanvas, ProgressBar, Row, Col } from "react-bootstrap";
import "bootstrap-icons/font/bootstrap-icons.css";

// Helper functions for UI
const getInitials = (name) => {
  if (!name || typeof name !== 'string') return "?";
  return name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();
};

const getProgressVariant = (completionPct) => {
  if (completionPct >= 100) return "success";
  if (completionPct >= 75) return "info";
  if (completionPct >= 40) return "warning";
  return "danger";
};

// Generate a consistent pastel color based on a string (for avatars)
const stringToColor = (string) => {
  if (!string) return "hsl(0, 0%, 85%)";
  let hash = 0;
  for (let i = 0; i < string.length; i++) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 70%, 85%)`; 
};

const getNormalizedCompletion = (row) => {
  const rawAvg = Number(row.avgProgressPct ?? row.completionPct ?? 0);
  const materialPct = row.totalMaterials > 0 ? (row.completedMaterials / row.totalMaterials) * 100 : null;
  const topicPct = row.totalTopics > 0 ? (row.completedTopicsCount / row.totalTopics) * 100 : null;
  const candidates = [rawAvg, materialPct, topicPct].filter((val) => val !== null && val !== undefined && !Number.isNaN(val));
  const best = candidates.length > 0 ? Math.max(...candidates) : 0;
  return Number.isFinite(best) ? Math.min(Math.max(Math.round(best), 0), 100) : 0;
};

export default function AdminLmsProgress() {
  const [rows, setRows] = useState([]);
  const [classFilter, setClassFilter] = useState("");
  const [appliedFilter, setAppliedFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Slide-out panel state
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showDetailPanel, setShowDetailPanel] = useState(false);

  const showMessage = (type, text) => setMessage({ type, text });

  const fetchProgress = async (filterValue = appliedFilter) => {
    setLoading(true);
    try {
      const res = await api.get("/api/lms/admin/progress", {
        params: filterValue ? { classAssigned: filterValue } : {},
      });
      setRows(res.data || []);
    } catch (err) {
      showMessage("danger", "Failed to load progress data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgress(appliedFilter);
    const interval = setInterval(() => fetchProgress(appliedFilter), 15000);
    return () => clearInterval(interval);
  }, [appliedFilter]);

  // Data Pipeline: Group by Class -> Then group by unique Student
  const groupedData = useMemo(() => {
    const classesMap = {};

    rows.forEach((row) => {
      const classKey = row.studentClass || "Unknown Class";
      
      // Initialize class if it doesn't exist
      if (!classesMap[classKey]) {
        classesMap[classKey] = {
          className: classKey,
          students: {},
        };
      }

      const sId = String(row.studentId || "UnknownID");

      // Initialize student within the class if they don't exist
      if (!classesMap[classKey].students[sId]) {
        classesMap[classKey].students[sId] = {
          studentId: sId,
          studentName: row.studentName || "Unknown Student",
          studentEmail: row.studentEmail || "No Email",
          studentClass: classKey,
          courses: [], // Will hold all individual course rows for this student
          totalCourses: 0,
          completedCourses: 0,
          totalPct: 0,
          lastActivity: null,
        };
      }

      const student = classesMap[classKey].students[sId];
      const completionPct = getNormalizedCompletion(row);

      // Add course to student's record
      student.courses.push({ ...row, normalizedPct: completionPct });
      
      // Aggregate stats for the student overview
      student.totalCourses += 1;
      if (completionPct >= 100) student.completedCourses += 1;
      student.totalPct += completionPct;

      if (!student.lastActivity || new Date(row.lastCompletedAt) > new Date(student.lastActivity)) {
        student.lastActivity = row.lastCompletedAt;
      }
    });

    // Finalize: Calculate averages and convert student objects back to arrays for rendering
    Object.keys(classesMap).forEach((classKey) => {
      const studentsArray = Object.values(classesMap[classKey].students).map((stu) => ({
        ...stu,
        averageCompletion: stu.totalCourses ? Math.round(stu.totalPct / stu.totalCourses) : 0,
      }));
      // Sort students alphabetically
      classesMap[classKey].studentsArray = studentsArray.sort((a, b) => String(a.studentName).localeCompare(String(b.studentName)));
    });

    // Sort classes alphanumerically
    return Object.values(classesMap).sort((a, b) => String(a.className).localeCompare(String(b.className), undefined, { numeric: true }));
  }, [rows]);

  // Handle clicking a student row
  const handleStudentClick = (student) => {
    setSelectedStudent(student);
    setShowDetailPanel(true);
  };

  const handleClosePanel = () => {
    setShowDetailPanel(false);
    setTimeout(() => setSelectedStudent(null), 300);
  };

  return (
    <div className="container-fluid py-4 min-vh-100" style={{ backgroundColor: "#f8fafc", fontFamily: "'Inter', sans-serif" }}>
      
      {/* Premium Custom CSS */}
      <style>{`
        .premium-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); transition: all 0.2s; }
        .premium-card:hover { transform: translateY(-2px); box-shadow: 0 12px 24px -8px rgba(79, 70, 229, 0.15); border-color: rgba(79, 70, 229, 0.3); }
        
        .input-premium { background: #ffffff; border: 1px solid transparent; border-radius: 10px; padding: 10px 16px; font-weight: 500; color: #0f172a; transition: all 0.2s; }
        .input-premium:focus { box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.2); outline: none; }
        
        .btn-brand { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); border: none; color: white; transition: all 0.2s; font-weight: 600; }
        .btn-brand:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(79, 70, 229, 0.3); color: white; }
        .btn-brand:disabled { opacity: 0.7; transform: none; box-shadow: none; cursor: not-allowed; }
        
        .table-premium th { text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.5px; color: #64748b; font-weight: 700; border-bottom: 2px solid #e2e8f0; padding: 16px; background: #f8fafc; }
        .table-premium td { padding: 16px; vertical-align: middle; border-bottom: 1px solid #f1f5f9; transition: background-color 0.2s; cursor: pointer; }
        .table-premium tr:hover td { background-color: #f8fafc; }

        .custom-accordion .accordion-item { border: 1px solid #e2e8f0; border-radius: 16px !important; margin-bottom: 1.5rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); overflow: hidden; background: #fff; }
        .custom-accordion .accordion-button { padding: 1.25rem 1.5rem; font-weight: 700; box-shadow: none !important; border-radius: 16px !important; }
        .custom-accordion .accordion-button:not(.collapsed) { background-color: #f8fafc; color: #0f172a; border-bottom: 1px solid #e2e8f0; border-bottom-left-radius: 0 !important; border-bottom-right-radius: 0 !important; }

        .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

        .custom-scroll::-webkit-scrollbar { width: 6px; }
        .custom-scroll::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }
      `}</style>

      <div className="container" style={{ maxWidth: "1400px" }}>
        
        {message.text && (
          <Alert variant={message.type} dismissible onClose={() => showMessage("", "")} className="shadow-sm border-0 rounded-4 animate-fade-in">
            {message.text}
          </Alert>
        )}

        {/* Premium Header Card */}
        <div 
          className="rounded-4 overflow-hidden mb-4 shadow-sm border-0 position-relative p-4 p-md-5"
          style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)" }}
        >
          <div style={{ position: 'absolute', top: '-50%', right: '-5%', width: '300px', height: '300px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}></div>
          
          <div className="position-relative z-1 mb-4">
            <span className="badge px-3 py-2 rounded-pill fw-semibold mb-3" style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.3)', color: 'white' }}>
              <i className="bi bi-graph-up-arrow me-1"></i> LMS Analytics
            </span>
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
              <div>
                <h2 className="display-6 fw-bolder text-white mb-1" style={{ letterSpacing: '-1px' }}>Platform Progress</h2>
                <p className="text-white opacity-75 fw-medium mb-0">Monitor student course completion metrics across all assigned classes.</p>
              </div>
              <button className="btn bg-white text-primary rounded-pill px-4 py-2 fw-bold shadow-sm transition-all" onClick={() => fetchProgress(appliedFilter)} disabled={loading}>
                <i className={`bi bi-arrow-clockwise me-2 ${loading ? 'spin' : ''}`}></i> 
                {loading ? "Syncing Data..." : "Refresh Dashboard"}
              </button>
            </div>
          </div>
          
          {/* Glassmorphism Control Panel */}
          <div className="position-relative z-1 d-flex flex-column flex-lg-row gap-3 p-3 rounded-4 shadow-sm align-items-center" style={{ background: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.3)' }}>
            
            <div className="d-flex align-items-center bg-white bg-opacity-25 rounded-3 px-3 py-1 flex-grow-1" style={{ minWidth: '200px' }}>
              <span className="small fw-bold text-white me-2 text-uppercase" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>Filter:</span>
              <input
                type="text"
                className="form-control input-premium py-2 bg-transparent text-white border-0 shadow-none fw-semibold placeholder-white"
                placeholder="Enter Class (e.g., 10A)..."
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && setAppliedFilter(classFilter)}
              />
            </div>

            <button 
              className="btn btn-brand rounded-pill px-4 py-2 fw-bold shadow-sm" 
              onClick={() => setAppliedFilter(classFilter)}
              style={{ minWidth: '150px' }}
            >
              Apply Filter
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="animate-fade-in">
          {loading ? (
            <div className="text-center py-5 my-5">
              <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} role="status" />
              <h5 className="mt-3 text-muted fw-bold">Compiling Institutional Data...</h5>
            </div>
          ) : groupedData.length === 0 ? (
            <div className="text-center py-5 my-5 bg-white rounded-4 shadow-sm border border-dashed">
              <div className="rounded-circle bg-light d-inline-flex align-items-center justify-content-center mb-4" style={{ width: 80, height: 80 }}>
                <i className="bi bi-inbox text-muted opacity-50 display-6"></i>
              </div>
              <h4 className="fw-bolder text-dark mb-2">No Progress Data Found</h4>
              <p className="text-muted fw-medium">Try adjusting your class filter or wait for students to engage with materials.</p>
              <button 
                className="btn btn-outline-primary rounded-pill mt-2 fw-bold"
                onClick={() => { setClassFilter(""); setAppliedFilter(""); }}
              >
                Clear Filter
              </button>
            </div>
          ) : (
            <div className="accordion custom-accordion" id="classAccordion">
              {groupedData.map((classGroup, idx) => {
                const collapseId = `collapse-class-${idx}`;
                return (
                  <div className="accordion-item" key={classGroup.className}>
                    <h2 className="accordion-header">
                      <button
                        className={`accordion-button ${idx === 0 ? "" : "collapsed"}`}
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target={`#${collapseId}`}
                        aria-expanded={idx === 0}
                      >
                        <div className="d-flex align-items-center gap-3 w-100 me-3">
                          <div className="bg-primary bg-opacity-10 p-3 rounded-circle text-primary d-flex align-items-center justify-content-center" style={{ width: 48, height: 48 }}>
                            <i className="bi bi-people-fill fs-5"></i>
                          </div>
                          <div className="flex-grow-1">
                            <h5 className="mb-0 fw-bolder text-dark fs-4">Class: {classGroup.className}</h5>
                            <div className="text-muted small fw-medium mt-1">Overall cohort performance breakdown</div>
                          </div>
                          <Badge bg="light" text="dark" className="px-3 py-2 rounded-pill border fw-bold fs-6">
                            {classGroup.studentsArray.length} Students
                          </Badge>
                        </div>
                      </button>
                    </h2>
                    <div id={collapseId} className={`accordion-collapse collapse ${idx === 0 ? "show" : ""}`} data-bs-parent="#classAccordion">
                      <div className="accordion-body p-0">
                        <div className="table-responsive">
                          <table className="table table-premium align-middle mb-0 w-100">
                            <thead>
                              <tr>
                                <th className="ps-4">Student Info</th>
                                <th>Student ID</th>
                                <th className="text-center">Enrolled</th>
                                <th style={{ width: '30%' }}>Overall Completion</th>
                                <th>Last Active</th>
                                <th className="pe-4 text-end">Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {classGroup.studentsArray.map((student) => {
                                const initial = getInitials(student.studentName);
                                const avatarColor = stringToColor(student.studentName);

                                return (
                                  <tr 
                                    key={student.studentId} 
                                    onClick={() => handleStudentClick(student)}
                                  >
                                    <td className="ps-4">
                                      <div className="d-flex align-items-center gap-3">
                                        <div 
                                          className="d-flex align-items-center justify-content-center rounded-circle shadow-sm fw-bold text-dark"
                                          style={{ width: '44px', height: '44px', fontSize: '1rem', backgroundColor: avatarColor }}
                                        >
                                          {initial}
                                        </div>
                                        <div>
                                          <div className="fw-bolder text-dark mb-1 lh-sm">{student.studentName}</div>
                                          <div className="text-muted fw-medium" style={{ fontSize: '0.75rem' }}>{student.studentEmail}</div>
                                        </div>
                                      </div>
                                    </td>
                                    <td>
                                      <span className="text-muted bg-light px-2 py-1 rounded border fw-medium font-monospace small">
                                        {student.studentId}
                                      </span>
                                    </td>
                                    <td className="text-center">
                                      <span className="fw-bolder text-dark fs-6">{student.totalCourses}</span>
                                    </td>
                                    <td>
                                      <div className="d-flex align-items-center gap-3 pe-3">
                                        <ProgressBar
                                          now={student.averageCompletion}
                                          variant={getProgressVariant(student.averageCompletion)}
                                          className="flex-grow-1 border bg-light rounded-pill"
                                          style={{ height: '8px' }}
                                        />
                                        <span className={`fw-bolder text-${getProgressVariant(student.averageCompletion)}`} style={{ minWidth: '45px', fontSize: '0.9rem' }}>
                                          {student.averageCompletion}%
                                        </span>
                                      </div>
                                    </td>
                                    <td>
                                      <div className="text-muted small fw-medium">
                                        {student.lastActivity 
                                          ? new Date(student.lastActivity).toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' }) 
                                          : <span className="fst-italic">—</span>}
                                      </div>
                                    </td>
                                    <td className="pe-4 text-end">
                                      <button className="btn btn-light rounded-pill px-3 shadow-sm border text-secondary fw-bold text-nowrap" style={{ fontSize: '0.85rem' }} onClick={(e) => { e.stopPropagation(); handleStudentClick(student); }}>
                                        View Report <i className="bi bi-chevron-right ms-1"></i>
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Slide-out Detailed Report Panel */}
        <Offcanvas 
          show={showDetailPanel} 
          onHide={handleClosePanel} 
          placement="end"
          style={{ width: '450px' }}
          className="border-start-0 shadow-lg custom-scroll"
        >
          <Offcanvas.Header closeButton className="border-bottom bg-white py-4 px-4">
            <Offcanvas.Title className="fw-bolder d-flex align-items-center gap-2 text-dark fs-5">
              <i className="bi bi-journal-bookmark text-primary"></i> 
              Student Report Card
            </Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body className="p-0 bg-light custom-scroll">
            {selectedStudent && (
              <div className="p-4">
                
                {/* Profile Header */}
                <div className="premium-card p-4 text-center mb-4">
                  <div 
                    className="d-flex align-items-center justify-content-center rounded-circle mx-auto mb-3 shadow-sm text-dark fw-bolder border"
                    style={{ width: '72px', height: '72px', fontSize: '1.5rem', backgroundColor: stringToColor(selectedStudent.studentName) }}
                  >
                    {getInitials(selectedStudent.studentName)}
                  </div>
                  <h4 className="fw-bolder mb-1 text-dark">{selectedStudent.studentName}</h4>
                  <p className="text-muted small fw-medium mb-3">{selectedStudent.studentEmail}</p>
                  <div className="d-flex justify-content-center gap-2">
                    <span className="badge bg-light text-secondary border px-3 py-2 rounded-pill fw-medium">ID: {selectedStudent.studentId}</span>
                    <span className="badge bg-light text-secondary border px-3 py-2 rounded-pill fw-medium">Class: {selectedStudent.studentClass}</span>
                  </div>
                </div>

                {/* Course Overview Title */}
                <div className="d-flex justify-content-between align-items-center mb-3 px-1">
                  <h6 className="fw-bold text-uppercase text-muted mb-0" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>
                    Enrolled Courses
                  </h6>
                  <Badge bg="primary" className="bg-opacity-10 text-primary border border-primary border-opacity-25 px-2 py-1 rounded-pill">
                    {selectedStudent.courses.length} Total
                  </Badge>
                </div>
                
                {/* Individual Course Cards */}
                <div className="d-flex flex-column gap-3">
                  {selectedStudent.courses.map((course, idx) => {
                    return (
                      <div key={idx} className="premium-card overflow-hidden">
                        <div className="p-4">
                          <div className="d-flex justify-content-between align-items-start mb-3">
                            <div>
                              <h6 className="fw-bolder mb-1 text-dark lh-sm">{course.courseTitle}</h6>
                              <Badge bg="light" text="secondary" className="border fw-medium">{course.subject}</Badge>
                            </div>
                            <span className={`badge bg-${getProgressVariant(course.normalizedPct)} bg-opacity-10 text-${getProgressVariant(course.normalizedPct)} border border-${getProgressVariant(course.normalizedPct)} border-opacity-25 px-2 py-1 fs-6 rounded-pill shadow-sm`}>
                              {course.normalizedPct}%
                            </span>
                          </div>

                          <ProgressBar
                            now={course.normalizedPct}
                            variant={getProgressVariant(course.normalizedPct)}
                            className="mb-4 bg-light rounded-pill"
                            style={{ height: '6px' }}
                          />

                          {/* Granular Stats */}
                          <div className="row g-2 text-center text-muted">
                            <div className="col-4">
                              <div className="bg-light rounded-3 p-2 border border-secondary border-opacity-10">
                                <div className="fw-bolder text-dark fs-6">{course.completedMaterials}/{course.totalMaterials}</div>
                                <div className="fw-bold" style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Mats</div>
                              </div>
                            </div>
                            <div className="col-4">
                              <div className="bg-light rounded-3 p-2 border border-secondary border-opacity-10">
                                <div className="fw-bolder text-dark fs-6">
                                  {course.totalTopics ? `${course.completedTopicsCount}/${course.totalTopics}` : "0/0"}
                                </div>
                                <div className="fw-bold" style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Topics</div>
                              </div>
                            </div>
                            <div className="col-4">
                              <div className="bg-light rounded-3 p-2 border border-secondary border-opacity-10">
                                <div className="fw-bolder text-dark fs-6">
                                  {course.totalNotes ? `${course.completedNotesCount}/${course.totalNotes}` : "0/0"}
                                </div>
                                <div className="fw-bold" style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Notes</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Offcanvas.Body>
        </Offcanvas>

      </div>
    </div>
  );
}