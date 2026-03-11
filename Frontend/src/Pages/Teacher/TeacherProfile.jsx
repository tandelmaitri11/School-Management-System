import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "../../api/api";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

export default function TeacherProfile() {
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [allClasses, setAllClasses] = useState([]);
  const [salarySummary, setSalarySummary] = useState({
    status: "Pending",
    month: "",
    paidAmount: null,
  });
  const [imagePreview, setImagePreview] = useState("");
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  
  const teacherId = localStorage.getItem("teacherId");
  const fileInputRef = useRef(null);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  const fetchProfile = async () => {
    if (!teacherId) return;
    try {
      const res = await api.get(`/api/teachers/teacher/profile/${teacherId}`);
      const data = res.data;
      setProfile(data);
      setFormData({
        fatherName: data.fatherName || "",
        gender: data.gender || "",
        bloodGroup: data.bloodGroup || "",
        dob: data.dob ? new Date(data.dob).toISOString().slice(0, 10) : "",
        address: data.address || "",
        picture: null,
      });
      setImagePreview(data.picture || "");
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchProfile(); }, [teacherId]);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await api.get("/api/classes");
        setAllClasses(res.data || []);
      } catch (err) { console.error(err); }
    };
    fetchClasses();
  }, []);

  useEffect(() => {
    const fetchLatestSalary = async () => {
      if (!profile?.teacherInfoId) return;
      try {
        const res = await api.get(`/api/teacher-salary/teacher/${profile.teacherInfoId}/salary`);
        const rows = res.data || [];
        const latest = rows[0];
        setSalarySummary({
          status: latest?.payoutStatus || latest?.status || "Pending",
          month: latest?.month || "",
          paidAmount: latest?.paidAmount ?? null,
        });
      } catch {
        setSalarySummary({ status: "Pending", month: "", paidAmount: null });
      }
    };
    fetchLatestSalary();
  }, [profile?.teacherInfoId]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setFormData((prev) => ({ ...prev, picture: file }));
    if (file) { setImagePreview(URL.createObjectURL(file)); }
  };

  const handleSave = async () => {
    try {
      const data = new FormData();
      ["fatherName", "gender", "bloodGroup", "dob", "address"].forEach((key) => {
        data.append(key, formData[key] ?? "");
      });
      if (formData.picture) data.append("picture", formData.picture);

      await api.put(`/api/teachers/updateTeacherById/${profile.teacherInfoId}`, data, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      await fetchProfile();
      setEditing(false);
      showToast("Profile updated successfully!");
    } catch (err) {
      showToast(err?.response?.data?.message || "Error updating profile", "danger");
    }
  };

  const derivedExperience = useMemo(() => {
    const raw = Number(profile?.experience || 0);
    if (raw > 0) return raw;
    if (!profile?.joiningDate) return 0;
    const start = new Date(profile.joiningDate);
    if (isNaN(start.getTime())) return 0;
    const now = new Date();
    let years = now.getFullYear() - start.getFullYear();
    if (now.getMonth() < start.getMonth() || (now.getMonth() === start.getMonth() && now.getDate() < start.getDate())) years--;
    return Math.max(0, years);
  }, [profile?.experience, profile?.joiningDate]);

  if (!profile) return (
    <div className="d-flex justify-content-center align-items-center min-vh-100 bg-body">
      <div className="spinner-border text-primary" role="status"></div>
    </div>
  );

  const classText = profile.classes
    ?.map((id) => allClasses.find((c) => String(c._id) === String(id))?.className)
    .filter(Boolean).join(", ") || "No classes assigned";

  return (
    <div className="bg-body-tertiary min-vh-100 py-4 py-md-5 transition-all">
      {/* Toast */}
      {toast.show && (
        <div className={`toast show position-fixed top-0 end-0 m-4 bg-${toast.type} text-white shadow-lg`} style={{ zIndex: 1050 }}>
          <div className="d-flex p-2">
            <div className="toast-body fw-medium">{toast.message}</div>
            <button type="button" className="btn-close btn-close-white me-2 m-auto" onClick={() => setToast({ ...toast, show: false })}></button>
          </div>
        </div>
      )}

      <div className="container">
        {/* Top Header */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
          <div>
            <h2 className="fw-bold text-body m-0">Teacher Dashboard</h2>
            <p className="text-secondary small m-0">View and manage profile information</p>
          </div>
          <div>
            {editing ? (
              <div className="btn-group">
                <button className="btn btn-outline-secondary px-4" onClick={() => setEditing(false)}>Cancel</button>
                <button className="btn btn-primary px-4 shadow-sm" onClick={handleSave}>Save Changes</button>
              </div>
            ) : (
              <button className="btn btn-primary px-4 shadow-sm" onClick={() => setEditing(true)}>
                <i className="bi bi-pencil-fill me-2"></i>Edit Profile
              </button>
            )}
          </div>
        </div>

        <div className="row g-4">
          {/* Sidebar */}
          <div className="col-lg-4">
            <div className="card border-0 shadow-sm bg-body rounded-4 text-center p-4">
              <div className="position-relative d-inline-block mx-auto mb-4">
                <img
                  src={imagePreview ? (imagePreview.startsWith("blob:") ? imagePreview : `http://localhost:3000/${imagePreview}`) : "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"}
                  className="rounded-circle border border-4 border-body-secondary shadow-sm"
                  style={{ width: "140px", height: "140px", objectFit: "cover" }}
                  alt="Avatar"
                />
                {editing && (
                  <button className="btn btn-sm btn-primary position-absolute bottom-0 end-0 rounded-circle p-2" onClick={() => fileInputRef.current?.click()}>
                    <i className="bi bi-camera"></i>
                  </button>
                )}
                <input ref={fileInputRef} type="file" className="d-none" accept="image/*" onChange={handleFileChange} />
              </div>
              <h4 className="fw-bold text-body mb-1">{profile.teacherName}</h4>
              <p className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-3">{profile.education || "Staff"}</p>
              
              <div className="mt-4 border-top pt-4 text-start">
                <div className="mb-3">
                  <small className="text-secondary d-block">Email Address</small>
                  <span className="text-body fw-medium text-break">{profile.email || "-"}</span>
                </div>
                <div>
                  <small className="text-secondary d-block">Phone Number</small>
                  <span className="text-body fw-medium">{profile.mobile || "-"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="col-lg-8">
            {/* Personal Details Card */}
            <div className="card border-0 shadow-sm bg-body rounded-4 mb-4">
              <div className="card-header bg-transparent border-bottom border-light-subtle py-3 px-4">
                <h5 className="fw-bold m-0 text-body">Personal Information</h5>
              </div>
              <div className="card-body p-4">
                <div className="row g-4">
                  {[
                    { label: "Father's Name", key: "fatherName" },
                    { label: "Gender", key: "gender" },
                    { label: "Blood Group", key: "bloodGroup" },
                    { label: "Date of Birth", key: "dob", type: "date" },
                    { label: "Residential Address", key: "address", col: 12 },
                  ].map((f) => (
                    <div className={f.col ? `col-${f.col}` : "col-md-6"} key={f.key}>
                      <label className="small text-secondary fw-bold mb-1">{f.label}</label>
                      {editing ? (
                        <input
                          type={f.type || "text"}
                          name={f.key}
                          className="form-control bg-body-tertiary border-0 p-2 shadow-none"
                          value={formData[f.key] || ""}
                          onChange={handleChange}
                        />
                      ) : (
                        <div className="text-body-emphasis fw-medium py-1 border-bottom border-light-subtle text-wrap">
                          {profile[f.key] || "—"}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Teaching Info Card */}
            <div className="card border-0 shadow-sm bg-body rounded-4 mb-4 overflow-hidden">
              <div className="row g-0">
                <div className="col-md-6 p-4 border-end border-light-subtle">
                  <h6 className="fw-bold text-primary mb-3">Academic Scope</h6>
                  <div className="mb-3">
                    <small className="text-secondary d-block">Subjects</small>
                    <div className="d-flex flex-wrap gap-1 mt-1">
                      {profile.subjects?.map((s, i) => (
                        <span key={i} className="badge bg-secondary-subtle text-secondary border px-2 py-1">{s}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <small className="text-secondary d-block">Classes</small>
                    <span className="text-body-emphasis fw-bold">{classText}</span>
                  </div>
                </div>
                <div className="col-md-6 p-4 bg-body-secondary bg-opacity-25">
                  <h6 className="fw-bold text-primary mb-3">Assigned Load</h6>
                  <div className="d-flex flex-wrap gap-2">
                    {profile.assignedSections?.map((s, i) => {
                      const cls = allClasses.find((c) => String(c._id) === String(s.classId));
                      return (
                        <div key={i} className="bg-body border rounded p-2 px-3 shadow-xs">
                          <span className="small fw-bold">{cls?.className || "?"} - {s.section}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Info Card */}
            <div className="card border-0 bg-dark-subtle text-dark rounded-4 shadow-sm overflow-hidden border-start border-primary border-4">
              <div className="card-body p-4">
                <div className="row align-items-center text-center text-md-start g-3">
                  <div className="col-md-6">
                    <small className="text-uppercase text-secondary fw-bold">Tenure in Institution</small>
                    <h2 className="fw-black m-0">{derivedExperience} <small className="fs-6 fw-normal">Years</small></h2>
                  </div>
                  <div className="col-md-6 text-md-end">
                    <small className="text-uppercase text-secondary fw-bold">Last Payout</small>
                    <h2 className="fw-black m-0 text-primary">₹{(salarySummary.paidAmount ?? profile.salary ?? 0).toLocaleString()}</h2>
                    <span className="badge bg-success bg-opacity-10 text-success">{salarySummary.status} {salarySummary.month}</span>
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