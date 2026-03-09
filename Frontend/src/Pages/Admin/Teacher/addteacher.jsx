import React, { useState, useEffect, useRef } from "react";
import api from "../../../api/api";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

function AddTeacher() {
  const [teachers, setTeachers] = useState([]);
  const [formData, setFormData] = useState({
    regNumber: "",
    teacherName: "",
    email: "",
    role: "Teacher",
    mobile: "",
    salary: "",
    fatherName: "",
    gender: "",
    experience: "",
    education: "",
    address: "",
    bloodGroup: "",
    dob: "",
    joiningDate: "",
    picture: null,
  });
  const [preview, setPreview] = useState(null);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);

  // ... (Logic remains exactly as you provided) ...
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const res = await api.get("/api/teachers/register");
        setTeachers(res.data);
      } catch (err) {
        console.error("Error fetching teacher register:", err);
      }
    };
    fetchTeachers();
  }, []);

  const handleTeacherSelect = (e) => {
    const selectedId = e.target.value;
    const selected = teachers.find((t) => t.teacherId === selectedId);
    if (selected) {
      setFormData({
        ...formData,
        regNumber: selected.teacherId,
        teacherName: selected.name,
        email: selected.email,
        role: selected.role || "Teacher",
      });
    } else {
      setFormData({ ...formData, regNumber: "", teacherName: "", email: "" });
    }
  };

  const validateField = (name, value) => {
    let error = "";
    if (["mobile", "salary", "gender", "joiningDate"].includes(name) && !value) {
      error = "This field is required.";
    }
    if (name === "mobile" && value) {
      const mobileRegex = /^\d{10}$/;
      if (!mobileRegex.test(value)) error = "Mobile number must be exactly 10 digits.";
    }
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    ["mobile", "salary", "gender", "joiningDate"].forEach((field) => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });
    if (!formData.regNumber) newErrors.regNumber = "Please select a teacher.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setMessage("Please fix the errors before submitting.");
      return;
    }

    try {
      const data = new FormData();
      Object.keys(formData).forEach((key) => {
        if (formData[key] !== null) data.append(key, formData[key]);
      });
      const res = await api.post("/api/teachers/addTeacher", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMessage(`✅ ${res.data.message}`);
      handleReset();
    } catch (error) {
      setMessage(error.response?.data?.message || "❌ Failed to add teacher info.");
    }
  };

  const handleReset = () => {
    setFormData({
      regNumber: "", teacherName: "", email: "", role: "Teacher",
      mobile: "", salary: "", fatherName: "", gender: "",
      experience: "", education: "", address: "", bloodGroup: "",
      dob: "", joiningDate: "", picture: null,
    });
    setErrors({});
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-xl-10">
          <div className="card border-0 shadow-lg rounded-4 overflow-hidden">
            {/* Header */}
            <div className="card-header bg-success py-4 px-4 border-0 d-flex align-items-center">
              <div className="bg-white bg-opacity-25 rounded-circle p-2 me-3">
                <i className="bi bi-person-plus-fill text-white fs-4"></i>
              </div>
              <div>
                <h4 className="text-white mb-0 fw-bold">Teacher Enrollment</h4>
                <p className="text-white-50 small mb-0">Onboard a registered faculty member to the database</p>
              </div>
            </div>

            <div className="card-body p-4 p-md-5 bg-white">
              <form onSubmit={handleSubmit}>
                
                {/* Section 1: Identity Selection */}
                <div className="row mb-5 g-4 bg-light p-4 rounded-4 border-start border-4 border-success">
                  <div className="col-12 mb-2">
                    <h6 className="text-success fw-bold text-uppercase small"><i className="bi bi-search me-2"></i>Step 1: Select Registered Faculty</h6>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-bold text-muted">Registered Teacher List</label>
                    <select
                      className={`form-select border-0 shadow-sm py-2 ${errors.regNumber ? "is-invalid" : ""}`}
                      value={formData.regNumber}
                      onChange={handleTeacherSelect}
                    >
                      <option value="">-- Choose from Registry --</option>
                      {teachers.map((t) => (
                        <option key={t.teacherId} value={t.teacherId}>{t.name} ({t.email})</option>
                      ))}
                    </select>
                    {errors.regNumber && <div className="invalid-feedback">{errors.regNumber}</div>}
                  </div>
                  <div className="col-md-3">
                    <label className="form-label small fw-bold text-muted">ID Number</label>
                    <input type="text" className="form-control border-0 bg-white" value={formData.regNumber} readOnly placeholder="Auto-filled" />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label small fw-bold text-muted">Designation</label>
                    <input type="text" className="form-control border-0 bg-white" value={formData.role} readOnly />
                  </div>
                </div>

                {/* Section 2: Contact & Professional */}
                <div className="row g-4 mb-5">
                   <div className="col-12 mb-2">
                    <h6 className="text-secondary fw-bold text-uppercase small"><i className="bi bi-briefcase me-2"></i>Step 2: Professional Details</h6>
                  </div>
                  <FormInput label="Mobile Number *" name="mobile" value={formData.mobile} error={errors.mobile} onChange={handleChange} icon="bi-telephone" placeholder="10-digit number" />
                  <FormInput label="Monthly Salary *" name="salary" type="number" value={formData.salary} error={errors.salary} onChange={handleChange} icon="bi-currency-rupee" />
                  <FormInput label="Joining Date *" name="joiningDate" type="date" value={formData.joiningDate} error={errors.joiningDate} onChange={handleChange} icon="bi-calendar-event" />
                  <FormInput label="Experience (Years)" name="experience" type="number" value={formData.experience} onChange={handleChange} icon="bi-stars" />
                  <FormInput label="Education / Degree" name="education" value={formData.education} onChange={handleChange} icon="bi-mortarboard" />
                  <div className="col-md-4">
                    <label className="form-label small fw-bold text-muted">Gender *</label>
                    <select name="gender" className={`form-select border-0 bg-light py-2 ${errors.gender ? "is-invalid" : ""}`} value={formData.gender} onChange={handleChange}>
                      <option value="">Select</option>
                      <option>Male</option><option>Female</option><option>Other</option>
                    </select>
                  </div>
                </div>

                {/* Section 3: Personal & Media */}
                <div className="row g-4 mb-4">
                  <div className="col-12 mb-2">
                    <h6 className="text-secondary fw-bold text-uppercase small"><i className="bi bi-person-lines-fill me-2"></i>Step 3: Personal Information</h6>
                  </div>
                  <FormInput label="Father / Husband Name" name="fatherName" value={formData.fatherName} onChange={handleChange} icon="bi-people" />
                  <div className="col-md-4">
                    <label className="form-label small fw-bold text-muted">Blood Group</label>
                    <select name="bloodGroup" className="form-select border-0 bg-light py-2" value={formData.bloodGroup} onChange={handleChange}>
                      <option value="">Select</option>
                      <option>A+</option><option>A-</option><option>B+</option><option>B-</option>
                      <option>O+</option><option>O-</option><option>AB+</option><option>AB-</option>
                    </select>
                  </div>
                  <FormInput label="Date of Birth" name="dob" type="date" value={formData.dob} onChange={handleChange} icon="bi-cake2" />
                  <div className="col-md-8">
                    <label className="form-label small fw-bold text-muted">Residential Address</label>
                    <textarea name="address" rows="2" className="form-control border-0 bg-light" value={formData.address} onChange={handleChange} placeholder="Full street address..." />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small fw-bold text-muted">Profile Photo</label>
                    <div className="d-flex align-items-center gap-3">
                      <div 
                        className="bg-light rounded-3 d-flex align-items-center justify-content-center border-dashed" 
                        style={{ width: "80px", height: "80px", border: "2px dashed #ccc", overflow: "hidden" }}
                      >
                        {preview ? <img src={preview} alt="Avatar" className="w-100 h-100 object-fit-cover" /> : <i className="bi bi-camera text-muted fs-4"></i>}
                      </div>
                      <input type="file" ref={fileInputRef} className="form-control form-control-sm border-0 bg-light" accept="image/*" name="picture" onChange={handleChange} />
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-4 border-top d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
                  {message && (
                    <div className={`alert mb-0 py-2 px-4 rounded-pill small ${message.includes('✅') ? 'alert-success border-0' : 'alert-info border-0'}`}>
                      {message}
                    </div>
                  )}
                  <div className="ms-auto d-flex gap-2">
                    <button type="button" className="btn btn-light rounded-pill px-4 fw-medium text-muted" onClick={handleReset}>Reset Form</button>
                    <button type="submit" className="btn btn-success rounded-pill px-5 fw-bold shadow-sm">Save Teacher Profile</button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper Component for inputs
const FormInput = ({ label, icon, error, ...props }) => (
  <div className="col-md-4">
    <label className="form-label small fw-bold text-muted">{label}</label>
    <div className="input-group shadow-sm rounded-3 overflow-hidden">
      <span className="input-group-text border-0 bg-white ps-3"><i className={`bi ${icon} text-muted`}></i></span>
      <input {...props} className={`form-control border-0 bg-white py-2 ${error ? "is-invalid" : ""}`} />
    </div>
    {error && <small className="text-danger mt-1 d-block" style={{fontSize: '0.7rem'}}>{error}</small>}
  </div>
);

export default AddTeacher;