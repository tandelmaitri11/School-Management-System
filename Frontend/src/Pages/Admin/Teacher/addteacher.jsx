import React, { useState, useEffect, useRef, useMemo } from "react";
import api from "../../../api/api";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

function AddTeacher() {
  const [teachers, setTeachers] = useState([]);
  const [formData, setFormData] = useState({
    regNumber: "", teacherName: "", email: "", role: "Teacher",
    mobile: "", salary: "", fatherName: "", gender: "",
    experience: "", education: "", address: "", bloodGroup: "",
    dob: "", joiningDate: "", picture: null, classes: [], assignedSections: [],
  });
  const [allClasses, setAllClasses] = useState([]);
  const [preview, setPreview] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchTeachers = async () => {
      try { const res = await api.get("/api/teachers/register"); setTeachers(res.data); } catch (err) { console.error("Error:", err); }
    };
    const fetchClasses = async () => {
      try { const res = await api.get("/api/classes"); setAllClasses(res.data || []); } catch (err) { console.error("Error:", err); }
    };
    fetchTeachers();
    fetchClasses();
  }, []);

  const handleTeacherSelect = (e) => {
    const selectedId = e.target.value;
    const selected = teachers.find((t) => t.teacherId === selectedId);
    if (selected) {
      setFormData({ ...formData, regNumber: selected.teacherId, teacherName: selected.name, email: selected.email, role: selected.role || "Teacher" });
    } else {
      setFormData({ ...formData, regNumber: "", teacherName: "", email: "" });
    }
  };

  const validateField = (name, value) => {
    let error = "";
    if (["mobile", "salary", "gender", "joiningDate"].includes(name) && !value) error = "Required.";
    if (name === "mobile" && value && !/^\d{10}$/.test(value)) error = "Invalid format.";
    return error;
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "picture") {
      setFormData({ ...formData, picture: files[0] });
      setPreview(files[0] ? URL.createObjectURL(files[0]) : null);
    } else {
      setFormData({ ...formData, [name]: value });
    }
    const error = validateField(name, value);
    setErrors({ ...errors, [name]: error });
    if (!error) setMessage({ type: "", text: "" });
  };

  const toggleClassAssignment = (classId) => {
    setFormData((prev) => {
      const key = String(classId);
      const exists = (prev.classes || []).includes(key);
      return {
        ...prev,
        classes: exists ? prev.classes.filter((c) => c !== key) : [...(prev.classes || []), key],
        assignedSections: exists ? (prev.assignedSections || []).filter((s) => String(s.classId) !== key) : prev.assignedSections || [],
      };
    });
  };

  const assignedClassObjects = useMemo(() => allClasses.filter((c) => (formData.classes || []).includes(String(c._id))), [allClasses, formData.classes]);
  const sectionOptions = useMemo(() => {
    const out = [];
    for (const cls of assignedClassObjects) {
      for (const sec of cls.sections || []) {
        if (sec?.isActive === false) continue;
        out.push({ classId: String(cls._id), className: cls.className, section: String(sec.name || "").trim().toUpperCase(), stream: String(sec.stream || "").trim() });
      }
    }
    return out;
  }, [assignedClassObjects]);

  const sectionKey = (item) => `${item.classId}__${item.section}__${item.stream}`;
  const assignedSectionKeySet = useMemo(() => new Set((formData.assignedSections || []).map(sectionKey)), [formData.assignedSections]);

  const toggleSectionAssignment = (item) => {
    const key = sectionKey(item);
    setFormData((prev) => {
      const has = (prev.assignedSections || []).some((x) => sectionKey(x) === key);
      return {
        ...prev,
        assignedSections: has ? (prev.assignedSections || []).filter((x) => sectionKey(x) !== key) : [...(prev.assignedSections || []), item]
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    ["mobile", "salary", "gender", "joiningDate"].forEach((field) => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });
    if (!formData.regNumber) newErrors.regNumber = "Please select a teacher.";
    if ((formData.classes || []).length > 0 && (formData.assignedSections || []).length === 0) newErrors.assignedSections = "Please assign at least one section.";
    
    if (Object.keys(newErrors).length > 0) { 
      setErrors(newErrors); 
      setMessage({ type: "danger", text: "Please fix the highlighted errors before saving." }); 
      return; 
    }

    try {
      setSaving(true);
      const data = new FormData();
      Object.keys(formData).forEach((key) => {
        if (key === "classes" || key === "assignedSections") data.append(key, JSON.stringify(formData[key] || []));
        else if (formData[key] !== null) data.append(key, formData[key]);
      });
      const res = await api.post("/api/teachers/addTeacher", data, { headers: { "Content-Type": "multipart/form-data" } });
      setMessage({ type: "success", text: res.data.message || "Teacher enrolled successfully." });
      handleReset();
    } catch (error) { 
      setMessage({ type: "danger", text: error.response?.data?.message || "Failed to submit form." }); 
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setFormData({ regNumber: "", teacherName: "", email: "", role: "Teacher", mobile: "", salary: "", fatherName: "", gender: "", experience: "", education: "", address: "", bloodGroup: "", dob: "", joiningDate: "", picture: null, classes: [], assignedSections: [] });
    setErrors({}); setPreview(null); if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="container-fluid py-4 min-vh-100" style={{ backgroundColor: "#f8fafc", fontFamily: "'Inter', sans-serif" }}>
      
      {/* Premium Custom CSS */}
      <style>{`
        .premium-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); transition: all 0.2s; }
        .input-premium { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 16px; transition: all 0.2s; font-weight: 500; color: #0f172a; }
        .input-premium:focus { border-color: #4f46e5; box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1); background: #ffffff; outline: none; }
        
        .input-group-premium .input-group-text { background: #f8fafc; border: 1px solid #e2e8f0; border-right: none; border-radius: 10px 0 0 10px; color: #64748b; }
        .input-group-premium .form-control { border-left: none; border-radius: 0 10px 10px 0; }
        .input-group-premium .form-control:focus { border-left: none; }
        .input-group-premium:focus-within .input-group-text { border-color: #4f46e5; background: #ffffff; color: #4f46e5; }
        
        .btn-brand { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); border: none; color: white; transition: all 0.2s; }
        .btn-brand:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(79, 70, 229, 0.3); color: white; }
        .btn-brand:disabled { opacity: 0.7; transform: none; box-shadow: none; }
        
        .file-upload-box { border: 2px dashed #cbd5e1; border-radius: 12px; background: #f8fafc; text-align: center; transition: all 0.2s; cursor: pointer; position: relative; overflow: hidden; }
        .file-upload-box:hover { border-color: #4f46e5; background: #f5f7ff; }
        .file-upload-input { position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; }
        
        .pill-btn { border-radius: 50rem; padding: 8px 16px; font-weight: 600; transition: all 0.2s; font-size: 0.85rem; border: 1px solid transparent; }
        .pill-btn.active-primary { background: rgba(79, 70, 229, 0.1); color: #4f46e5; border-color: rgba(79, 70, 229, 0.2); }
        .pill-btn.active-success { background: rgba(16, 185, 129, 0.1); color: #059669; border-color: rgba(16, 185, 129, 0.2); }
        .pill-btn.inactive { background: #f8fafc; color: #64748b; border-color: #e2e8f0; }
        .pill-btn.inactive:hover { background: #f1f5f9; color: #0f172a; }
        
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
                <i className="bi bi-person-badge me-1"></i> Faculty Management
              </span>
              <h2 className="display-6 fw-bolder text-white mb-1" style={{ letterSpacing: '-1px' }}>Teacher Enrollment</h2>
              <p className="text-white opacity-75 fw-medium mb-0">Update faculty records and define academic responsibilities.</p>
            </div>
            <button onClick={() => window.history.back()} className="btn bg-white rounded-circle shadow-sm d-flex justify-content-center align-items-center transition-all hover-scale" style={{ width: 48, height: 48 }}>
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
          
          {/* Identity Card */}
          <div className="premium-card p-4 p-md-5 mb-4">
            <h5 className="fw-bolder mb-4 d-flex align-items-center pb-3 border-bottom" style={{ color: '#0f172a' }}>
              <div className="rounded-circle d-flex align-items-center justify-content-center me-3 shadow-sm" style={{ width: 36, height: 36, background: '#e0e7ff', color: '#4f46e5' }}>
                <i className="bi bi-person-vcard-fill"></i>
              </div>
              Identity & Role
            </h5>
            <div className="row g-4">
              <div className="col-12 col-md-6">
                <label className="form-label small fw-bold text-muted text-uppercase mb-2">Registry Selection *</label>
                <div className={`input-group input-group-premium ${errors.regNumber ? "is-invalid" : ""}`}>
                  <span className="input-group-text"><i className="bi bi-search"></i></span>
                  <select className="form-select input-premium py-2" value={formData.regNumber} onChange={handleTeacherSelect}>
                    <option value="">Select registered user...</option>
                    {teachers.map((t) => <option key={t.teacherId} value={t.teacherId}>{t.name} ({t.email})</option>)}
                  </select>
                </div>
                {errors.regNumber && <div className="text-danger small mt-1 fw-medium">{errors.regNumber}</div>}
              </div>
              <div className="col-12 col-md-3">
                <label className="form-label small fw-bold text-muted text-uppercase mb-2">ID Number</label>
                <div className="input-group input-group-premium opacity-75">
                  <span className="input-group-text"><i className="bi bi-hash"></i></span>
                  <input type="text" className="form-control input-premium py-2" value={formData.regNumber} readOnly placeholder="Auto-filled" />
                </div>
              </div>
              <div className="col-12 col-md-3">
                <label className="form-label small fw-bold text-muted text-uppercase mb-2">Designation</label>
                <div className="input-group input-group-premium opacity-75">
                  <span className="input-group-text"><i className="bi bi-briefcase-fill"></i></span>
                  <input type="text" className="form-control input-premium py-2" value={formData.role} readOnly placeholder="Auto-filled" />
                </div>
              </div>
            </div>
          </div>

          {/* Professional Details */}
          <div className="premium-card p-4 p-md-5 mb-4">
            <h5 className="fw-bolder mb-4 d-flex align-items-center pb-3 border-bottom" style={{ color: '#0f172a' }}>
              <div className="rounded-circle d-flex align-items-center justify-content-center me-3 shadow-sm" style={{ width: 36, height: 36, background: '#e0e7ff', color: '#4f46e5' }}>
                <i className="bi bi-briefcase-fill"></i>
              </div>
              Professional Information
            </h5>
            <div className="row g-4">
              <FormInput icon="bi-telephone-fill" label="Mobile Number *" name="mobile" placeholder="e.g. 9876543210" value={formData.mobile} onChange={handleChange} error={errors.mobile} />
              <FormInput icon="bi-currency-rupee" label="Monthly Salary *" name="salary" type="number" placeholder="e.g. 45000" value={formData.salary} onChange={handleChange} error={errors.salary} />
              <FormInput icon="bi-calendar-event-fill" label="Joining Date *" name="joiningDate" type="date" value={formData.joiningDate} onChange={handleChange} error={errors.joiningDate} />
              <FormInput icon="bi-stars" label="Experience (Years)" name="experience" type="number" placeholder="e.g. 5" value={formData.experience} onChange={handleChange} />
              <FormInput icon="bi-mortarboard-fill" label="Highest Education" name="education" placeholder="e.g. M.Sc, B.Ed" value={formData.education} onChange={handleChange} />
              
              <div className="col-12 col-md-4">
                <label className="form-label small fw-bold text-muted text-uppercase mb-2">Gender *</label>
                <div className={`input-group input-group-premium ${errors.gender ? "is-invalid" : ""}`}>
                  <span className="input-group-text"><i className="bi bi-gender-ambiguous"></i></span>
                  <select name="gender" className="form-select input-premium py-2" value={formData.gender} onChange={handleChange}>
                    <option value="">Select Gender...</option>
                    <option>Male</option><option>Female</option><option>Other</option>
                  </select>
                </div>
                {errors.gender && <div className="text-danger small mt-1 fw-medium">{errors.gender}</div>}
              </div>
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
              <label className="small fw-bold text-muted text-uppercase mb-3 d-block">Assign Grades / Classes</label>
              <div className="d-flex flex-wrap gap-2">
                {allClasses.map((cls) => {
                  const isAssigned = (formData.classes || []).includes(String(cls._id));
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
              {(formData.classes || []).length === 0 && <div className="text-muted small mt-2 fst-italic">Select at least one class to view section options.</div>}
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
                <label className="form-label small fw-bold text-muted text-uppercase mb-2">Blood Group</label>
                <div className="input-group input-group-premium">
                  <span className="input-group-text"><i className="bi bi-droplet-fill text-danger"></i></span>
                  <select name="bloodGroup" className="form-select input-premium py-2" value={formData.bloodGroup} onChange={handleChange}>
                    <option value="">Select Group...</option>
                    <option>A+</option><option>A-</option><option>B+</option><option>B-</option><option>O+</option><option>O-</option><option>AB+</option><option>AB-</option>
                  </select>
                </div>
              </div>
              
              <FormInput icon="bi-calendar-heart-fill" label="Date of Birth" name="dob" type="date" value={formData.dob} onChange={handleChange} />
              
              <div className="col-12 col-md-8">
                <label className="form-label small fw-bold text-muted text-uppercase mb-2">Residential Address</label>
                <div className="input-group input-group-premium">
                  <span className="input-group-text align-items-start pt-3"><i className="bi bi-house-door-fill"></i></span>
                  <textarea name="address" className="form-control input-premium" rows="3" placeholder="Full street address..." value={formData.address} onChange={handleChange} />
                </div>
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label small fw-bold text-muted text-uppercase mb-2">Profile Photo</label>
                <div className="d-flex gap-3 h-100 pb-4">
                  <div className="file-upload-box flex-grow-1 d-flex flex-column align-items-center justify-content-center p-2">
                    <input type="file" ref={fileInputRef} className="file-upload-input" accept="image/*" name="picture" onChange={handleChange} />
                    <i className="bi bi-cloud-arrow-up-fill fs-3 text-primary mb-1"></i>
                    <span className="small fw-semibold text-muted">Upload Image</span>
                  </div>
                  {preview && (
                    <div className="border p-1 rounded-3 shadow-sm bg-white" style={{ width: '85px', height: '85px' }}>
                      <img src={preview} alt="preview" className="w-100 h-100 rounded-2" style={{ objectFit: "cover" }} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Floating Bottom Action Bar */}
          <div className="premium-card p-4 d-flex flex-column flex-md-row justify-content-between align-items-center gap-3 mt-4 mb-5" style={{ position: 'sticky', bottom: '20px', zIndex: 100 }}>
            <div className="d-flex align-items-center text-muted">
              <i className="bi bi-shield-check fs-4 text-success me-3"></i>
              <div>
                <div className="fw-bold text-dark">Ready to submit?</div>
                <div className="small fw-medium">Ensure all required fields marked with (*) are filled.</div>
              </div>
            </div>
            <div className="d-flex gap-3 w-100 w-md-auto">
              <button type="button" className="btn bg-light border text-dark fw-bold rounded-pill px-4 flex-grow-1 flex-md-grow-0" onClick={handleReset} disabled={saving}>
                Reset Form
              </button>
              <button type="submit" className="btn btn-brand btn-lg rounded-pill px-5 fw-bold shadow-sm flex-grow-1 flex-md-grow-0" disabled={saving}>
                {saving ? <><span className="spinner-border spinner-border-sm me-2"></span>Enrolling...</> : "Enroll Teacher"}
              </button>
            </div>
          </div>
          
        </form>
      </div>
    </div>
  );
}

// Upgraded Subcomponent
const FormInput = ({ label, icon, error, placeholder, type = "text", ...props }) => (
  <div className="col-12 col-md-4">
    <label className="form-label small fw-bold text-muted text-uppercase mb-2">{label}</label>
    <div className={`input-group input-group-premium ${error ? "is-invalid" : ""}`}>
      {icon && <span className="input-group-text"><i className={`bi ${icon}`}></i></span>}
      <input type={type} {...props} placeholder={placeholder} className={`form-control input-premium py-2 ${error ? "is-invalid" : ""}`} />
    </div>
    {error && <div className="text-danger small mt-1 fw-medium">{error}</div>}
  </div>
);

export default AddTeacher;