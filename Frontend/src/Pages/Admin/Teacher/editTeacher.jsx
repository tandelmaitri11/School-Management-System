import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../../api/api";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

function EditTeacher() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    regNumber: "",
    teacherName: "",
    mobile: "",
    role: "Teacher",
    salary: "",
    fatherName: "",
    gender: "",
    experience: "",
    email: "",
    education: "",
    address: "",
    bloodGroup: "",
    dob: "",
    joiningDate: "",
    picture: null,
    classes: [],
    assignedSections: [],
  });

  const [allClasses, setAllClasses] = useState([]);
  const [preview, setPreview] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchTeacher = async () => {
      try {
        const res = await api.get(`/api/teachers/getTeacherById/${id}`);
        const teacher = res.data || {};
        setFormData({
          regNumber: teacher.regNumber || "",
          teacherName: teacher.teacherName || "",
          mobile: teacher.mobile || "",
          role: teacher.role || "Teacher",
          salary: teacher.salary || "",
          fatherName: teacher.fatherName || "",
          gender: teacher.gender || "",
          experience: teacher.experience || "",
          email: teacher.email || "",
          education: teacher.education || "",
          address: teacher.address || "",
          bloodGroup: teacher.bloodGroup || "",
          dob: teacher.dob ? String(teacher.dob).slice(0, 10) : "",
          joiningDate: teacher.joiningDate ? String(teacher.joiningDate).slice(0, 10) : "",
          picture: null,
          classes: Array.isArray(teacher.classes) ? teacher.classes.map((c) => String(c)) : [],
          assignedSections: Array.isArray(teacher.assignedSections)
            ? teacher.assignedSections.map((x) => ({
                classId: String(x?.classId || ""),
                section: String(x?.section || "").trim(),
                stream: String(x?.stream || "").trim(),
              }))
            : [],
        });

        if (teacher.picture) {
          setPreview(
            teacher.picture.startsWith("http")
              ? teacher.picture
              : `http://localhost:3000/${teacher.picture}`
          );
        }
      } catch {
        setMessage({ type: "danger", text: "Failed to fetch teacher details." });
      }
    };

    const fetchClasses = async () => {
      try {
        const res = await api.get("/api/classes");
        setAllClasses(res.data || []);
      } catch {
        setAllClasses([]);
      }
    };

    fetchTeacher();
    fetchClasses();
  }, [id]);

  const capitalizeWords = (text) =>
    String(text || "")
      .split(" ")
      .filter((word) => word.trim() !== "")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");

  const validateField = (name, value) => {
    let error = "";
    if (["email", "mobile", "teacherName", "salary", "gender", "joiningDate"].includes(name) && !value) {
      error = "Field is required.";
    }
    if (name === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      error = "Invalid email.";
    }
    if (name === "mobile" && value && !/^\d{10}$/.test(value)) {
      error = "Must be 10 digits.";
    }
    return error;
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "picture") {
      const file = files?.[0] || null;
      setFormData((prev) => ({ ...prev, picture: file }));
      if (file) setPreview(URL.createObjectURL(file));
      return;
    }

    if (name === "teacherName") {
      const next = capitalizeWords(value);
      setFormData((prev) => ({ ...prev, teacherName: next }));
      setErrors((prev) => ({ ...prev, [name]: validateField(name, next) }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
    if (!validateField(name, value)) setMessage({ type: "", text: "" });
  };

  const toggleClassAssignment = (classId) => {
    setFormData((prev) => {
      const key = String(classId);
      const exists = prev.classes.includes(key);
      return {
        ...prev,
        classes: exists ? prev.classes.filter((c) => c !== key) : [...prev.classes, key],
        assignedSections: exists
          ? (prev.assignedSections || []).filter((s) => String(s.classId) !== key)
          : prev.assignedSections || [],
      };
    });
  };

  const assignedClassObjects = useMemo(
    () => allClasses.filter((c) => formData.classes.includes(String(c._id))),
    [allClasses, formData.classes]
  );

  const sectionOptions = useMemo(() => {
    const out = [];
    for (const cls of assignedClassObjects) {
      const classId = String(cls._id);
      for (const sec of cls.sections || []) {
        if (sec?.isActive === false) continue;
        out.push({
          classId,
          className: cls.className,
          section: String(sec.name || "").trim().toUpperCase(),
          stream: String(sec.stream || "").trim(),
        });
      }
    }
    return out;
  }, [assignedClassObjects]);

  const sectionKey = (item) =>
    `${String(item.classId || "")}__${String(item.section || "").trim().toUpperCase()}__${String(item.stream || "").trim().toLowerCase()}`;

  const assignedSectionKeySet = useMemo(() => {
    const set = new Set();
    for (const item of formData.assignedSections || []) {
      set.add(sectionKey(item));
    }
    return set;
  }, [formData.assignedSections]);

  const toggleSectionAssignment = (item) => {
    const key = sectionKey(item);
    setFormData((prev) => {
      const has = (prev.assignedSections || []).some((x) => sectionKey(x) === key);
      if (has) {
        return {
          ...prev,
          assignedSections: (prev.assignedSections || []).filter((x) => sectionKey(x) !== key),
        };
      }
      return {
        ...prev,
        assignedSections: [
          ...(prev.assignedSections || []),
          {
            classId: String(item.classId || ""),
            section: String(item.section || "").trim().toUpperCase(),
            stream: String(item.stream || "").trim(),
          },
        ],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    ["teacherName", "mobile", "salary", "gender", "email", "joiningDate"].forEach((field) => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });
    if ((formData.classes || []).length > 0 && (formData.assignedSections || []).length === 0) {
      newErrors.assignedSections = "Please assign at least one section for selected class.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setMessage({ type: "danger", text: newErrors.assignedSections || "Please fix the highlighted errors before saving." });
      return;
    }

    try {
      setSaving(true);
      const data = new FormData();
      Object.keys(formData).forEach((key) => {
        if (key === "classes") {
          data.append("classes", JSON.stringify(formData.classes || []));
          return;
        }
        if (key === "assignedSections") {
          data.append("assignedSections", JSON.stringify(formData.assignedSections || []));
          return;
        }
        if (key === "picture" && !formData.picture) return;
        data.append(key, formData[key] ?? "");
      });

      await api.put(`/api/teachers/updateTeacherById/${id}`, data);
      setMessage({ type: "success", text: "Profile updated successfully! Redirecting..." });
      setTimeout(() => navigate(`/teachers/viewteacher/${id}`), 1200);
    } catch (error) {
      setMessage({ type: "danger", text: error?.response?.data?.message || "Update failed." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container-fluid py-4 min-vh-100" style={{ backgroundColor: "#f8fafc", fontFamily: "'Inter', sans-serif" }}>
      
      {/* Premium Custom CSS */}
      <style>{`
        .premium-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); transition: all 0.2s; }
        .input-premium { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 16px; transition: all 0.2s; font-weight: 500; color: #0f172a; }
        .input-premium:focus { border-color: #4f46e5; box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1); background: #ffffff; outline: none; }
        .input-premium[readonly] { background-color: #e2e8f0; opacity: 0.8; }
        
        .input-group-premium .input-group-text { background: #f8fafc; border: 1px solid #e2e8f0; border-right: none; border-radius: 10px 0 0 10px; color: #64748b; }
        .input-group-premium .form-control { border-left: none; border-radius: 0 10px 10px 0; }
        .input-group-premium .form-control:focus { border-left: none; }
        .input-group-premium:focus-within .input-group-text { border-color: #4f46e5; background: #ffffff; color: #4f46e5; }
        
        .btn-brand { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); border: none; color: white; transition: all 0.2s; }
        .btn-brand:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(79, 70, 229, 0.3); color: white; }
        .btn-brand:disabled { opacity: 0.7; transform: none; box-shadow: none; }
        
        .pill-btn { border-radius: 50rem; padding: 8px 16px; font-weight: 600; transition: all 0.2s; font-size: 0.85rem; border: 1px solid transparent; }
        .pill-btn.active-primary { background: rgba(79, 70, 229, 0.1); color: #4f46e5; border-color: rgba(79, 70, 229, 0.2); }
        .pill-btn.active-success { background: rgba(16, 185, 129, 0.1); color: #059669; border-color: rgba(16, 185, 129, 0.2); }
        .pill-btn.inactive { background: #f8fafc; color: #64748b; border-color: #e2e8f0; }
        .pill-btn.inactive:hover { background: #f1f5f9; color: #0f172a; }

        .avatar-edit-box { position: relative; display: inline-block; }
        .avatar-edit-box img { width: 140px; height: 140px; object-fit: cover; border: 4px solid #ffffff; box-shadow: 0 10px 25px rgba(0,0,0,0.1); border-radius: 50%; }
        .avatar-edit-btn { position: absolute; bottom: 5px; right: 5px; background: #4f46e5; color: white; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .avatar-edit-btn:hover { transform: scale(1.1); background: #3730a3; }
        
        .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div className="container" style={{ maxWidth: "1100px" }}>
        
        {/* Premium Header Card */}
        <div 
          className="rounded-4 overflow-hidden mb-4 shadow-sm border-0 position-relative p-4 p-md-5"
          style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)" }}
        >
          <div style={{ position: 'absolute', top: '-50%', right: '-5%', width: '300px', height: '300px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}></div>
          <div className="position-relative z-1 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
            <div>
              <span className="badge px-3 py-2 rounded-pill fw-semibold mb-3" style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.3)', color: 'white' }}>
                <i className="bi bi-pencil-square me-1"></i> Profile Editor
              </span>
              <h2 className="display-6 fw-bolder text-white mb-1" style={{ letterSpacing: '-1px' }}>Edit Teacher Profile</h2>
              <p className="text-white opacity-75 fw-medium mb-0">Updating records for <span className="fw-bold">{formData.teacherName || "Faculty Member"}</span></p>
            </div>
            <button onClick={() => navigate(-1)} className="btn bg-white rounded-circle shadow-sm d-flex justify-content-center align-items-center transition-all hover-scale" style={{ width: 48, height: 48 }}>
              <i className="bi bi-arrow-left fs-5" style={{ color: '#4f46e5' }}></i>
            </button>
          </div>
        </div>

        {message.text && (
          <div className={`alert ${message.type === 'danger' ? 'alert-danger border-danger' : 'alert-success border-success'} bg-white py-3 px-4 rounded-4 shadow-sm border-start border-4 mb-4 d-flex align-items-center animate-fade-in`}>
            <i className={`bi ${message.type === 'danger' ? 'bi-exclamation-triangle-fill text-danger' : 'bi-check-circle-fill text-success'} fs-4 me-3`}></i>
            <span className="fw-medium">{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          
          {/* Avatar Upload Section */}
          <div className="d-flex justify-content-center mb-4">
            <div className="avatar-edit-box">
              <img src={preview || "https://via.placeholder.com/150"} alt="Profile Preview" />
              <div className="avatar-edit-btn" onClick={() => fileInputRef.current?.click()} title="Change Photo">
                <i className="bi bi-camera-fill"></i>
              </div>
              <input type="file" ref={fileInputRef} hidden name="picture" onChange={handleChange} accept="image/*" />
            </div>
          </div>

          {/* Identity & Professional Details */}
          <div className="premium-card p-4 p-md-5 mb-4">
            <h5 className="fw-bolder mb-4 d-flex align-items-center pb-3 border-bottom" style={{ color: '#0f172a' }}>
              <div className="rounded-circle d-flex align-items-center justify-content-center me-3 shadow-sm" style={{ width: 36, height: 36, background: '#e0e7ff', color: '#4f46e5' }}>
                <i className="bi bi-briefcase-fill"></i>
              </div>
              Professional Details
            </h5>
            <div className="row g-4">
              <FormInput label="Registration Number" value={formData.regNumber} readOnly icon="bi-hash" />
              <FormInput label="Full Name *" name="teacherName" value={formData.teacherName} onChange={handleChange} error={errors.teacherName} icon="bi-person-fill" />
              <FormInput label="Email Address *" name="email" value={formData.email} onChange={handleChange} error={errors.email} icon="bi-envelope-fill" />
              <FormInput label="Phone Number *" name="mobile" value={formData.mobile} onChange={handleChange} error={errors.mobile} icon="bi-telephone-fill" />
              <FormInput label="Designation" value={formData.role} readOnly icon="bi-shield-check" />
              <FormInput label="Monthly Salary *" name="salary" type="number" value={formData.salary} onChange={handleChange} error={errors.salary} icon="bi-currency-rupee" />
              <FormInput label="Joining Date *" name="joiningDate" type="date" value={formData.joiningDate} onChange={handleChange} error={errors.joiningDate} icon="bi-calendar-check-fill" />
            </div>
          </div>

          {/* Academic Assignments */}
          <div className="premium-card p-4 p-md-5 mb-4">
            <h5 className="fw-bolder mb-4 d-flex align-items-center pb-3 border-bottom" style={{ color: '#0f172a' }}>
              <div className="rounded-circle d-flex align-items-center justify-content-center me-3 shadow-sm" style={{ width: 36, height: 36, background: '#e0e7ff', color: '#4f46e5' }}>
                <i className="bi bi-diagram-3-fill"></i>
              </div>
              Academic Responsibilities
            </h5>
            
            <div className="mb-4">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <label className="small fw-bold text-muted text-uppercase m-0">Assign Grades / Classes</label>
                <span className="badge bg-light text-muted border px-2 py-1">Selected: {formData.classes.length}</span>
              </div>
              <div className="d-flex flex-wrap gap-2">
                {allClasses.map((cls) => {
                  const isAssigned = formData.classes.includes(String(cls._id));
                  return (
                    <button 
                      key={cls._id} 
                      type="button" 
                      className={`pill-btn d-flex align-items-center ${isAssigned ? "active-primary" : "inactive"}`} 
                      onClick={() => toggleClassAssignment(cls._id)}
                    >
                      <i className={`bi ${isAssigned ? 'bi-check-circle-fill' : 'bi-circle'} me-2`}></i> Class {cls.className}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mb-2">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <label className="small fw-bold text-muted text-uppercase m-0">Assign Specific Sections</label>
                {errors.assignedSections && <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 px-2 py-1"><i className="bi bi-exclamation-triangle-fill me-1"></i> {errors.assignedSections}</span>}
              </div>
              
              <div className="d-flex flex-wrap gap-2 p-3 bg-light rounded-4 border min-vh-25">
                {sectionOptions.length === 0 ? (
                   <span className="text-muted small">No sections available for selected classes.</span>
                ) : (
                  sectionOptions.map((item) => {
                    const key = sectionKey(item);
                    const selected = assignedSectionKeySet.has(key);
                    return (
                      <button 
                        key={key} 
                        type="button" 
                        className={`pill-btn d-flex align-items-center ${selected ? "active-success" : "bg-white border"}`} 
                        onClick={() => toggleSectionAssignment(item)}
                      >
                        <i className={`bi ${selected ? 'bi-check-circle-fill' : 'bi-circle'} me-2`}></i> 
                        {item.className} - {item.section} {item.stream ? `(${item.stream})` : ""}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Personal Info */}
          <div className="premium-card p-4 p-md-5 mb-4">
            <h5 className="fw-bolder mb-4 d-flex align-items-center pb-3 border-bottom" style={{ color: '#0f172a' }}>
              <div className="rounded-circle d-flex align-items-center justify-content-center me-3 shadow-sm" style={{ width: 36, height: 36, background: '#e0e7ff', color: '#4f46e5' }}>
                <i className="bi bi-person-heart"></i>
              </div>
              Personal Details
            </h5>
            <div className="row g-4">
              <FormInput icon="bi-person-fill" label="Father/Spouse Name" name="fatherName" placeholder="Full Name" value={formData.fatherName} onChange={handleChange} />
              
              <div className="col-12 col-md-4">
                <label className="form-label small fw-bold text-muted text-uppercase mb-2">Gender *</label>
                <div className={`input-group input-group-premium ${errors.gender ? "is-invalid" : ""}`}>
                  <span className="input-group-text"><i className="bi bi-gender-ambiguous text-muted"></i></span>
                  <select name="gender" className="form-select input-premium py-2 border-start-0" value={formData.gender} onChange={handleChange}>
                    <option value="">Select Gender...</option>
                    <option>Male</option><option>Female</option><option>Other</option>
                  </select>
                </div>
                {errors.gender && <div className="text-danger small mt-1 fw-medium">{errors.gender}</div>}
              </div>

              <FormInput icon="bi-star-fill" label="Experience (Years)" name="experience" type="number" value={formData.experience} onChange={handleChange} />
              <FormInput icon="bi-mortarboard-fill" label="Highest Education" name="education" value={formData.education} onChange={handleChange} />
              
              <div className="col-12 col-md-4">
                <label className="form-label small fw-bold text-muted text-uppercase mb-2">Blood Group</label>
                <div className="input-group input-group-premium">
                  <span className="input-group-text"><i className="bi bi-droplet-fill text-danger"></i></span>
                  <select name="bloodGroup" className="form-select input-premium py-2 border-start-0" value={formData.bloodGroup} onChange={handleChange}>
                    <option value="">Select Group...</option>
                    <option>A+</option><option>A-</option><option>B+</option><option>B-</option><option>O+</option><option>O-</option><option>AB+</option><option>AB-</option>
                  </select>
                </div>
              </div>
              
              <FormInput icon="bi-calendar-heart-fill" label="Date of Birth" name="dob" type="date" value={formData.dob} onChange={handleChange} />
              
              <div className="col-12">
                <label className="form-label small fw-bold text-muted text-uppercase mb-2">Residential Address</label>
                <div className="input-group input-group-premium">
                  <span className="input-group-text align-items-start pt-3"><i className="bi bi-house-door-fill text-muted"></i></span>
                  <textarea name="address" className="form-control input-premium border-start-0" rows="3" placeholder="Full street address..." value={formData.address} onChange={handleChange} />
                </div>
              </div>
            </div>
          </div>

          {/* Floating Bottom Action Bar */}
          <div className="premium-card p-4 d-flex flex-column flex-md-row justify-content-between align-items-center gap-3 mt-4 mb-5" style={{ position: 'sticky', bottom: '20px', zIndex: 100 }}>
            <div className="d-flex align-items-center text-muted">
              <i className="bi bi-info-circle-fill fs-4 text-primary me-3"></i>
              <div>
                <div className="fw-bold text-dark">Ready to save?</div>
                <div className="small fw-medium">Review the details above. Required fields are marked with (*).</div>
              </div>
            </div>
            <div className="d-flex gap-3 w-100 w-md-auto">
              <button type="button" className="btn bg-light border text-dark fw-bold rounded-pill px-4 flex-grow-1 flex-md-grow-0" onClick={() => navigate(-1)} disabled={saving}>
                Cancel
              </button>
              <button type="submit" className="btn btn-brand btn-lg rounded-pill px-5 fw-bold shadow-sm flex-grow-1 flex-md-grow-0" disabled={saving}>
                {saving ? <><span className="spinner-border spinner-border-sm me-2"></span>Saving...</> : "Update Profile"}
              </button>
            </div>
          </div>
          
        </form>
      </div>
    </div>
  );
}

// Upgraded Subcomponent
const FormInput = ({ label, icon, error, placeholder, type = "text", readOnly, ...props }) => (
  <div className="col-12 col-md-4">
    <label className="form-label small fw-bold text-muted text-uppercase mb-2">{label}</label>
    <div className={`input-group input-group-premium ${error ? "is-invalid" : ""}`}>
      {icon && <span className="input-group-text"><i className={`bi ${icon}`}></i></span>}
      <input 
        type={type} 
        {...props} 
        placeholder={placeholder} 
        readOnly={readOnly}
        className={`form-control input-premium py-2 border-start-0 ${error ? "is-invalid" : ""}`} 
      />
    </div>
    {error && <div className="text-danger small mt-1 fw-medium">{error}</div>}
  </div>
);

export default EditTeacher;