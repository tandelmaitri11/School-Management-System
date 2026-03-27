import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../api/api";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

// Reusable Detail Item with Icon
function DetailItem({ icon, title, value }) {
  return (
    <div className="d-flex align-items-start mb-4">
      <div className="bg-light text-muted rounded-circle d-flex align-items-center justify-content-center me-3 mt-1" style={{ width: "36px", height: "36px" }}>
        <i className={`bi ${icon}`}></i>
      </div>
      <div>
        <p className="text-muted mb-1 small fw-bold text-uppercase" style={{ letterSpacing: "0.5px", fontSize: '0.65rem' }}>{title}</p>
        <p className="mb-0 fw-semibold text-dark fs-6 lh-sm">{value || "Not Provided"}</p>
      </div>
    </div>
  );
}

// Reusable Stat Card with soft colors
function StatCard({ label, value, icon, colorClass, hexColor }) {
  return (
    <div className="col-6 col-md-3">
      <div className="premium-card h-100 p-3 text-center d-flex flex-column align-items-center justify-content-center" style={{ borderTop: `4px solid ${hexColor}` }}>
        <div className={`mx-auto mb-2 bg-${colorClass} bg-opacity-10 text-${colorClass} rounded-circle d-flex align-items-center justify-content-center`} style={{ width: "48px", height: "48px" }}>
          <i className={`bi ${icon} fs-4`}></i>
        </div>
        <h3 className="fw-bolder mb-0 text-dark lh-1 mt-2">{value ?? 0}</h3>
        <small className="text-muted fw-bold text-uppercase mt-1" style={{ fontSize: '0.65rem', letterSpacing: '0.5px' }}>{label}</small>
      </div>
    </div>
  );
}

function TeacherDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState(null);
  const [classMap, setClassMap] = useState({});
  const [attendanceStats, setAttendanceStats] = useState({
    presents: 0,
    absents: 0,
    leaves: 0,
    attendancePercent: 0,
  });
  const [salaryInfo, setSalaryInfo] = useState({
    status: "Pending",
    month: "",
    paidAmount: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTeacher = async () => {
      try {
        const res = await api.get(`/api/teachers/getTeacherById/${id}`);
        setTeacher(res.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch teacher details.");
      } finally {
        setLoading(false);
      }
    };
    fetchTeacher();
  }, [id]);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await api.get("/api/classes");
        const rows = res.data || [];
        const map = {};
        rows.forEach((c) => {
          map[String(c._id)] = c;
        });
        setClassMap(map);
      } catch {
        setClassMap({});
      }
    };
    fetchClasses();
  }, []);

  useEffect(() => {
    if (!teacher) return;

    const fetchSalary = async () => {
      try {
        const res = await api.get(`/api/teacher-salary/teacher/${teacher._id}/salary`);
        const history = res.data || [];
        const latest = history[0];
        if (latest) {
          setSalaryInfo({
            status: latest.payoutStatus || latest.status || "Pending",
            month: latest.month || "",
            paidAmount: latest.paidAmount ?? null,
          });
        } else {
          setSalaryInfo({ status: "Pending", month: "", paidAmount: null });
        }
      } catch (err) {
        setSalaryInfo({ status: "Pending", month: "", paidAmount: null });
      }
    };

    const fetchAttendance = async () => {
      try {
        const regRes = await api.get("/api/teachers/register");
        const regList = regRes.data || [];
        const regTeacher = regList.find((t) => t.teacherId === teacher.regNumber);
        if (!regTeacher?._id) {
          setAttendanceStats({ presents: 0, absents: 0, leaves: 0, attendancePercent: 0 });
          return;
        }

        const attRes = await api.get(`/api/teacher-attendance/teacher/${regTeacher._id}`);
        const records = attRes.data || [];
        let presents = 0;
        let absents = 0;

        records.forEach((r) => {
          if (r.status === "Present") presents += 1;
          if (r.status === "Absent") absents += 1;
        });

        const total = presents + absents;
        const attendancePercent = total ? Math.round((presents / total) * 100) : 0;

        setAttendanceStats({
          presents,
          absents,
          leaves: 0,
          attendancePercent,
        });
      } catch (err) {
        setAttendanceStats({ presents: 0, absents: 0, leaves: 0, attendancePercent: 0 });
      }
    };

    fetchSalary();
    fetchAttendance();
  }, [teacher]);

  const isSalaryPaid = salaryInfo.status === "Paid";
  const salaryStatusText =
    salaryInfo.status === "Paid"
      ? "Latest month's salary has been fully processed."
      : salaryInfo.status === "Processing"
      ? "Salary payout is currently processing."
      : salaryInfo.status === "Failed"
      ? "Salary payout failed. Please recheck the payout."
      : salaryInfo.status === "Rejected"
      ? "Salary was rejected and needs attention."
      : "The latest salary is currently pending or not received.";

  if (loading) return (
    <div className="d-flex flex-column justify-content-center align-items-center min-vh-100" style={{ backgroundColor: "#f8fafc" }}>
      <div className="spinner-border" style={{ color: '#4f46e5', width: '3rem', height: '3rem' }} role="status"></div>
      <div className="mt-3 text-muted fw-medium">Loading profile data...</div>
    </div>
  );
  
  if (error) return (
    <div className="container-fluid min-vh-100 py-5" style={{ backgroundColor: "#f8fafc" }}>
      <div className="container" style={{ maxWidth: "800px" }}>
        <div className="alert bg-danger bg-opacity-10 border border-danger border-opacity-25 text-danger rounded-4 shadow-sm p-4 d-flex align-items-center">
          <i className="bi bi-exclamation-triangle-fill fs-2 me-4"></i>
          <div>
            <h5 className="fw-bolder mb-1">Error Loading Profile</h5>
            <div className="fw-medium">{error}</div>
          </div>
        </div>
      </div>
    </div>
  );

  if (!teacher) return (
    <div className="container-fluid min-vh-100 py-5" style={{ backgroundColor: "#f8fafc" }}>
      <div className="container text-center py-5" style={{ maxWidth: "800px" }}>
        <i className="bi bi-person-x text-muted opacity-50 display-1 mb-3 d-block"></i>
        <h4 className="fw-bolder text-dark mb-2">Teacher Not Found</h4>
        <p className="text-muted fw-medium">The requested faculty profile could not be located.</p>
        <button className="btn btn-outline-secondary rounded-pill px-4 mt-3 fw-bold" onClick={() => navigate(-1)}>Go Back</button>
      </div>
    </div>
  );

  const assignedClassIds = Array.isArray(teacher.classes) ? teacher.classes.map((c) => String(c)) : [];
  const assignedClasses = assignedClassIds
    .map((id) => classMap[id])
    .filter(Boolean);
  const assignedSections = Array.isArray(teacher.assignedSections) ? teacher.assignedSections : [];

  return (
    <div className="container-fluid py-4 min-vh-100" style={{ backgroundColor: "#f8fafc", fontFamily: "'Inter', sans-serif" }}>
      
      {/* Premium Custom CSS */}
      <style>{`
        .premium-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); transition: all 0.2s; }
        .premium-card:hover { transform: translateY(-2px); box-shadow: 0 12px 24px -8px rgba(79, 70, 229, 0.15); border-color: rgba(79, 70, 229, 0.3); }
        
        .profile-avatar { width: 160px; height: 160px; object-fit: cover; border-radius: 50%; border: 6px solid #ffffff; box-shadow: 0 10px 25px rgba(0,0,0,0.1); background-color: #f1f5f9; display: flex; align-items: center; justify-content: center; font-size: 4rem; font-weight: 800; color: #4f46e5; margin: -80px auto 20px auto; position: relative; z-index: 2; }
        
        .pill-badge { padding: 8px 16px; border-radius: 50rem; font-weight: 600; font-size: 0.85rem; }
        
        .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div className="container" style={{ maxWidth: "1200px" }}>
        
        {/* Premium Header Card */}
        <div 
          className="rounded-4 overflow-hidden mb-4 shadow-sm border-0 position-relative p-4 p-md-5"
          style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)" }}
        >
          <div style={{ position: 'absolute', top: '-50%', right: '-5%', width: '300px', height: '300px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}></div>
          <div className="position-relative z-1 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-4">
            <div>
              <span className="badge px-3 py-2 rounded-pill fw-semibold mb-3" style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.3)', color: 'white' }}>
                <i className="bi bi-person-vcard me-1"></i> Faculty Profile
              </span>
              <h2 className="display-6 fw-bolder text-white mb-1" style={{ letterSpacing: '-1px' }}>Teacher Details</h2>
              <p className="text-white opacity-75 fw-medium mb-0">Viewing comprehensive records for {teacher.teacherName}</p>
            </div>
            
            <div className="d-flex gap-3">
              <button onClick={() => navigate(-1)} className="btn bg-white bg-opacity-20 text-black border-white border-opacity-50 rounded-pill px-4 fw-bold transition-all">
                <i className="bi bi-arrow-left me-2"></i> Back
              </button>
              <button onClick={() => navigate(`/teachers/editteacher/${teacher._id}`)} className="btn bg-white text-primary rounded-pill px-4 fw-bold shadow-sm transition-all">
                <i className="bi bi-pencil-square me-2"></i> Edit Profile
              </button>
            </div>
          </div>
        </div>

        <div className="row g-4 animate-fade-in">
          
          {/* Left Column: Profile Identity Card */}
          <div className="col-12 col-lg-4">
            <div className="premium-card overflow-hidden h-100 d-flex flex-column">
              <div className="bg-primary bg-opacity-10 position-relative" style={{ height: "120px" }}></div>
              
              <div className="px-4 pb-4 flex-grow-1 d-flex flex-column">
                <div className="text-center position-relative">
                  {teacher.picture ? (
                    <img
                      src={teacher.picture.startsWith("http") ? teacher.picture : `http://localhost:3000/${teacher.picture}`}
                      alt={teacher.teacherName}
                      className="profile-avatar"
                    />
                  ) : (
                    <div className="profile-avatar">
                      {teacher.teacherName?.charAt(0).toUpperCase() || "T"}
                    </div>
                  )}
                  <span className="position-absolute badge bg-success border border-2 border-white rounded-circle p-2" style={{ bottom: '25px', right: '50%', transform: 'translateX(60px)', zIndex: 3 }} title="Active Account"></span>
                </div>
                
                <div className="text-center border-bottom pb-4 mb-4">
                  <h4 className="fw-bolder text-dark mb-1">{teacher.teacherName}</h4>
                  <div className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-10 rounded-pill px-3 py-1 fw-semibold mb-2">
                    {teacher.role || "Teacher"}
                  </div>
                  <div className="text-muted small fw-bold font-monospace">ID: {teacher.regNumber}</div>
                </div>
                
                <div className="d-flex flex-column gap-2 mt-auto">
                  <DetailItem icon="bi-envelope-fill" title="Email Address" value={teacher.email} />
                  <DetailItem icon="bi-telephone-fill" title="Contact Number" value={teacher.mobile} />
                  <DetailItem icon="bi-geo-alt-fill" title="Residential Address" value={teacher.address} />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Detailed Stats & Info */}
          <div className="col-12 col-lg-8">
            
            {/* Quick Stats Grid */}
            <div className="row g-3 mb-4">
              <StatCard label="Presents" value={attendanceStats.presents} icon="bi-check-circle-fill" colorClass="success" hexColor="#10b981" />
              <StatCard label="Absents" value={attendanceStats.absents} icon="bi-x-circle-fill" colorClass="danger" hexColor="#ef4444" />
              <StatCard label="Leaves" value={attendanceStats.leaves} icon="bi-clock-history" colorClass="warning" hexColor="#f59e0b" />
              <StatCard label="Attendance" value={`${attendanceStats.attendancePercent}%`} icon="bi-graph-up-arrow" colorClass="primary" hexColor="#4f46e5" />
            </div>

            {/* Professional & Personal Data */}
            <div className="premium-card p-4 p-md-5 mb-4">
              <h5 className="fw-bolder text-dark mb-4 pb-3 border-bottom d-flex align-items-center" style={{ borderColor: '#f1f5f9' }}>
                <div className="rounded-circle d-flex align-items-center justify-content-center me-3 bg-primary bg-opacity-10 text-primary" style={{ width: 36, height: 36 }}>
                  <i className="bi bi-info-circle-fill"></i>
                </div>
                Professional & Personal Information
              </h5>
              
              <div className="row g-4">
                <div className="col-12 col-md-6 border-end-md" style={{ borderColor: '#f1f5f9' }}>
                  <DetailItem icon="bi-currency-rupee" title="Monthly Salary" value={`₹${teacher.salary?.toLocaleString() || "0"}`} />
                  <DetailItem icon="bi-calendar-check-fill" title="Joining Date" value={teacher.joiningDate ? new Date(teacher.joiningDate).toLocaleDateString() : "N/A"} />
                  <DetailItem icon="bi-stars" title="Total Experience" value={teacher.experience ? `${teacher.experience} Years` : "N/A"} />
                </div>
                <div className="col-12 col-md-6 ps-md-4">
                  <DetailItem icon="bi-droplet-fill text-danger" title="Blood Group" value={teacher.bloodGroup} />
                  <DetailItem icon="bi-calendar-heart-fill" title="Date of Birth" value={teacher.dob ? new Date(teacher.dob).toLocaleDateString() : "N/A"} />
                  <DetailItem icon="bi-gender-ambiguous" title="Gender" value={teacher.gender} />
                </div>
              </div>
            </div>

            {/* Academic Responsibilities */}
            <div className="premium-card p-4 p-md-5 mb-4">
              <h5 className="fw-bolder text-dark mb-4 pb-3 border-bottom d-flex align-items-center" style={{ borderColor: '#f1f5f9' }}>
                <div className="rounded-circle d-flex align-items-center justify-content-center me-3 bg-primary bg-opacity-10 text-primary" style={{ width: 36, height: 36 }}>
                  <i className="bi bi-diagram-3-fill"></i>
                </div>
                Class & Section Assignments
              </h5>

              <div className="mb-4">
                <div className="small text-muted fw-bold mb-3 text-uppercase" style={{ letterSpacing: '0.5px' }}>Assigned Classes</div>
                <div className="d-flex flex-wrap gap-2">
                  {assignedClasses.length === 0 ? (
                    <span className="text-muted small fst-italic bg-light p-2 rounded border">No classes currently assigned.</span>
                  ) : (
                    assignedClasses.map((c) => (
                      <span key={String(c._id)} className="pill-badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25">
                        Class {c.className}
                      </span>
                    ))
                  )}
                </div>
              </div>

              <div>
                <div className="small text-muted fw-bold mb-3 text-uppercase" style={{ letterSpacing: '0.5px' }}>Assigned Sections</div>
                <div className="d-flex flex-wrap gap-2">
                  {assignedSections.length === 0 ? (
                    <span className="text-muted small fst-italic bg-light p-2 rounded border">No sections currently assigned.</span>
                  ) : (
                    assignedSections.map((s, idx) => {
                      const cls = classMap[String(s.classId)];
                      return (
                        <span key={`${String(s.classId)}-${String(s.section)}-${String(s.stream)}-${idx}`} className="pill-badge bg-success bg-opacity-10 text-success border border-success border-opacity-25">
                          <i className="bi bi-check2-circle me-1"></i> Class {cls?.className || "?"} - {String(s.section || "").toUpperCase()}
                          {s.stream ? ` (${s.stream})` : ""}
                        </span>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Salary Status Banner */}
            <div className={`premium-card overflow-hidden ${isSalaryPaid ? 'border-success' : 'border-danger'}`}>
              <div className={`p-4 d-flex align-items-center justify-content-between ${isSalaryPaid ? 'bg-success bg-opacity-10' : 'bg-danger bg-opacity-10'}`}>
                <div className="d-flex align-items-center">
                  <div className={`rounded-circle d-flex align-items-center justify-content-center me-4 ${isSalaryPaid ? 'bg-success text-white' : 'bg-danger text-white'} shadow-sm`} style={{ width: 56, height: 56, fontSize: '1.5rem' }}>
                    <i className={`bi ${isSalaryPaid ? 'bi-shield-check' : 'bi-shield-exclamation'}`}></i>
                  </div>
                  <div>
                    <h6 className="fw-bolder text-dark mb-1 text-uppercase" style={{ letterSpacing: '0.5px' }}>Salary Status</h6>
                    <p className={`mb-0 fw-semibold ${isSalaryPaid ? 'text-success' : 'text-danger'}`}>
                      {salaryStatusText}
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default TeacherDetails;