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
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({});
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
    if (!error) setMessage("");
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
    
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); setMessage("Fix highlighted errors."); return; }

    try {
      const data = new FormData();
      Object.keys(formData).forEach((key) => {
        if (key === "classes" || key === "assignedSections") data.append(key, JSON.stringify(formData[key] || []));
        else if (formData[key] !== null) data.append(key, formData[key]);
      });
      const res = await api.post("/api/teachers/addTeacher", data, { headers: { "Content-Type": "multipart/form-data" } });
      setMessage(`✅ ${res.data.message}`);
      handleReset();
    } catch (error) { setMessage(error.response?.data?.message || "❌ Failed to submit."); }
  };

  const handleReset = () => {
    setFormData({ regNumber: "", teacherName: "", email: "", role: "Teacher", mobile: "", salary: "", fatherName: "", gender: "", experience: "", education: "", address: "", bloodGroup: "", dob: "", joiningDate: "", picture: null, classes: [], assignedSections: [] });
    setErrors({}); setPreview(null); if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="container-fluid bg-light py-5">
      <div className="container">
        <div className="mb-4">
          <h3 className="fw-bold text-dark">Teacher Enrollment</h3>
          <p className="text-muted small">Update faculty records and define academic responsibilities.</p>
        </div>

        <form onSubmit={handleSubmit}>
          
          {/* Identity Card */}
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-body p-4">
              <h5 className="text-primary mb-3"><i className="bi bi-person-badge me-2"></i>Faculty Identity</h5>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="small fw-bold text-muted">Registry Selection *</label>
                  <div className="input-group">
                    <span className="input-group-text"><i className="bi bi-search"></i></span>
                    <select className={`form-select ${errors.regNumber ? "is-invalid" : ""}`} value={formData.regNumber} onChange={handleTeacherSelect}>
                      <option value="">Select from Registry...</option>
                      {teachers.map((t) => <option key={t.teacherId} value={t.teacherId}>{t.name} ({t.email})</option>)}
                    </select>
                  </div>
                </div>
                <div className="col-md-3"><label className="small fw-bold text-muted">ID Number</label><div className="input-group"><span className="input-group-text"><i className="bi bi-hash"></i></span><input type="text" className="form-control" value={formData.regNumber} readOnly /></div></div>
                <div className="col-md-3"><label className="small fw-bold text-muted">Designation</label><div className="input-group"><span className="input-group-text"><i className="bi bi-briefcase"></i></span><input type="text" className="form-control" value={formData.role} readOnly /></div></div>
              </div>
            </div>
          </div>

          {/* Professional Details */}
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-body p-4">
              <h5 className="text-primary mb-3"><i className="bi bi-person-workspace me-2"></i>Professional Info</h5>
              <div className="row">
                <FormInput icon="bi-telephone" label="Mobile" name="mobile" placeholder="9876543210" value={formData.mobile} onChange={handleChange} error={errors.mobile} />
                <FormInput icon="bi-currency-rupee" label="Salary" name="salary" type="number" placeholder="45000" value={formData.salary} onChange={handleChange} error={errors.salary} />
                <FormInput icon="bi-calendar-event" label="Joining Date" name="joiningDate" type="date" value={formData.joiningDate} onChange={handleChange} error={errors.joiningDate} />
                <FormInput icon="bi-stars" label="Experience (Years)" name="experience" type="number" placeholder="e.g. 5" value={formData.experience} onChange={handleChange} />
                <FormInput icon="bi-mortarboard" label="Education" name="education" placeholder="e.g. M.Sc" value={formData.education} onChange={handleChange} />
                <div className="col-md-4 mb-3">
                  <label className="small fw-bold text-muted">Gender *</label>
                  <div className="input-group">
                    <span className="input-group-text"><i className="bi bi-gender-ambiguous"></i></span>
                    <select name="gender" className={`form-select ${errors.gender ? "is-invalid" : ""}`} value={formData.gender} onChange={handleChange}>
                      <option value="">Select Gender</option><option>Male</option><option>Female</option><option>Other</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Academic Assignments */}
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-body p-4">
              <h5 className="text-primary mb-3"><i className="bi bi-diagram-3 me-2"></i>Academic Responsibilities</h5>
              <label className="small fw-bold text-muted mb-2">Assign Classes</label>
              <div className="d-flex flex-wrap gap-2 mb-4">
                {allClasses.map((cls) => {
                  const isAssigned = (formData.classes || []).includes(String(cls._id));
                  return (
                    <button key={cls._id} type="button" className={`btn btn-sm ${isAssigned ? "btn-primary" : "btn-outline-secondary"}`} onClick={() => toggleClassAssignment(cls._id)}>
                      {isAssigned && <i className="bi bi-check2 me-1"></i>} Class {cls.className}
                    </button>
                  );
                })}
              </div>
              <label className="small fw-bold text-muted mb-2">Assign Sections</label>
              {errors.assignedSections && <div className="alert alert-warning py-2 small">{errors.assignedSections}</div>}
              <div className="d-flex flex-wrap gap-2">
                {sectionOptions.map((item) => {
                  const key = sectionKey(item);
                  const selected = assignedSectionKeySet.has(key);
                  return (
                    <button key={key} type="button" className={`btn btn-sm ${selected ? "btn-success text-white" : "btn-outline-secondary"}`} onClick={() => toggleSectionAssignment(item)}>
                      {item.className} - {item.section} {item.stream ? `(${item.stream})` : ""}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Personal Info */}
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-body p-4">
              <h5 className="text-primary mb-3"><i className="bi bi-person-lines-fill me-2"></i>Personal Info</h5>
              <div className="row">
                <FormInput icon="bi-people" label="Father/Husband" name="fatherName" placeholder="Full Name" value={formData.fatherName} onChange={handleChange} />
                <div className="col-md-4 mb-3">
                  <label className="small fw-bold text-muted">Blood Group</label>
                  <div className="input-group">
                    <span className="input-group-text"><i className="bi bi-droplet"></i></span>
                    <select name="bloodGroup" className="form-select" value={formData.bloodGroup} onChange={handleChange}>
                      <option value="">Select Group</option><option>A+</option><option>A-</option><option>B+</option><option>B-</option><option>O+</option><option>O-</option><option>AB+</option><option>AB-</option>
                    </select>
                  </div>
                </div>
                <FormInput icon="bi-calendar-date" label="Date of Birth" name="dob" type="date" value={formData.dob} onChange={handleChange} />
                <div className="col-md-8 mb-3">
                  <label className="small fw-bold text-muted">Address</label>
                  <div className="input-group">
                    <span className="input-group-text"><i className="bi bi-house-door"></i></span>
                    <textarea name="address" className="form-control" rows="2" placeholder="Full street address..." value={formData.address} onChange={handleChange} />
                  </div>
                </div>
                <div className="col-md-4 mb-3">
                    <label className="small fw-bold text-muted">Profile Photo</label>
                    <input type="file" ref={fileInputRef} className="form-control" accept="image/*" name="picture" onChange={handleChange} />
                    {preview && <img src={preview} alt="preview" className="mt-2 rounded" style={{width: "60px", height: "60px", objectFit: "cover"}} />}
                </div>
              </div>
            </div>
          </div>

          <div className="d-flex justify-content-end gap-3 pb-5">
            {message && <span className={`text-decoration-none ${message.includes('✅') ? 'text-success' : 'text-danger'}`}>{message}</span>}
            <button type="button" className="btn btn-outline-secondary px-4" onClick={handleReset}>Reset</button>
            <button type="submit" className="btn btn-primary px-4 shadow-sm">Save Profile</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const FormInput = ({ label, icon, error, placeholder, ...props }) => (
  <div className="col-md-4 mb-3">
    <label className="small fw-bold text-muted mb-1">{label}</label>
    <div className="input-group">
      {icon && <span className="input-group-text"><i className={`bi ${icon}`}></i></span>}
      <input {...props} placeholder={placeholder} className={`form-control ${error ? "is-invalid" : ""}`} />
    </div>
    {error && <div className="invalid-feedback d-block small">{error}</div>}
  </div>
);

export default AddTeacher;