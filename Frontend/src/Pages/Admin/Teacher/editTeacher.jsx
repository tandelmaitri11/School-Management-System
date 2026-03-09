import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../api/api";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

function EditTeacher() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    regNumber: "", teacherName: "", mobile: "", role: "Teacher",
    salary: "", fatherName: "", gender: "", experience: "",
    email: "", education: "", address: "", bloodGroup: "",
    dob: "", joiningDate: "", picture: null,
  });

  const [preview, setPreview] = useState(null);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({});

  // Logic remains the same as provided
  useEffect(() => {
    const fetchTeacher = async () => {
      try {
        const res = await api.get(`/api/teachers/getTeacherById/${id}`);
        const teacher = res.data;
        setFormData({
          ...teacher,
          dob: teacher.dob ? teacher.dob.slice(0, 10) : "",
          joiningDate: teacher.joiningDate ? teacher.joiningDate.slice(0, 10) : "",
          picture: null,
        });
        if (teacher.picture) {
          setPreview(teacher.picture.startsWith("http") ? teacher.picture : `http://localhost:3000/${teacher.picture}`);
        }
      } catch (err) {
        setMessage("Failed to fetch teacher details.");
      }
    };
    fetchTeacher();
  }, [id]);

  const capitalizeWords = (text) => text.split(" ").filter((word) => word.trim() !== "").map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(" ");

  const validateField = (name, value) => {
    let error = "";
    if (["email", "mobile", "teacherName", "salary", "gender", "joiningDate"].includes(name) && !value) error = "Field is required.";
    if (name === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = "Invalid email.";
    if (name === "mobile" && value && !/^\d{10}$/.test(value)) error = "Must be 10 digits.";
    return error;
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "picture") {
      const file = files[0];
      setFormData({ ...formData, picture: file });
      setPreview(file ? URL.createObjectURL(file) : preview);
    } else if (name === "teacherName") {
      setFormData({ ...formData, teacherName: capitalizeWords(value) });
    } else {
      setFormData({ ...formData, [name]: value });
    }
    setErrors({ ...errors, [name]: validateField(name, value) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    ["teacherName", "mobile", "salary", "gender", "email", "joiningDate"].forEach((field) => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const data = new FormData();
      Object.keys(formData).forEach((key) => data.append(key, formData[key]));
      await api.put(`/api/teachers/updateTeacherById/${id}`, data);
      setMessage("✅ Success! Redirecting...");
      setTimeout(() => navigate(`/teachers/viewteacher/${id}`), 1500);
    } catch (error) {
      setMessage("❌ Update failed.");
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-10">
          <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
            {/* Elegant Header */}
            <div className="bg-primary p-4 text-white d-flex justify-content-between align-items-center">
              <div>
                <h3 className="mb-0 fw-bold">Edit Teacher Profile</h3>
                <small className="opacity-75">Update information for {formData.teacherName}</small>
              </div>
              <button className="btn btn-sm btn-light rounded-pill px-3" onClick={() => navigate(-1)}>
                <i className="bi bi-arrow-left me-1"></i> Back
              </button>
            </div>

            <div className="card-body p-4 p-md-5">
              <form onSubmit={handleSubmit}>
                {/* Profile Photo Section */}
                <div className="text-center mb-5">
                  <div className="position-relative d-inline-block">
                    <img
                      src={preview || "https://via.placeholder.com/150"}
                      className="rounded-circle border border-4 border-white shadow"
                      style={{ width: "130px", height: "130px", objectFit: "cover" }}
                      alt="Profile"
                    />
                    <button
                      type="button"
                      className="btn btn-primary btn-sm position-absolute bottom-0 end-0 rounded-circle shadow"
                      onClick={() => fileInputRef.current.click()}
                    >
                      <i className="bi bi-camera"></i>
                    </button>
                  </div>
                  <input type="file" ref={fileInputRef} hidden name="picture" onChange={handleChange} />
                </div>

                {/* Section: Professional Info */}
                <div className="row g-4 mb-5">
                  <div className="col-12 border-bottom pb-2 mb-2">
                    <h5 className="text-primary fw-bold"><i className="bi bi-briefcase me-2"></i>Professional Details</h5>
                  </div>
                  <FormInput label="Registration Number" value={formData.regNumber} readOnly icon="bi-hash" bg="bg-light" />
                  <FormInput label="Full Name *" name="teacherName" value={formData.teacherName} onChange={handleChange} error={errors.teacherName} icon="bi-person" />
                  <FormInput label="Email Address *" name="email" value={formData.email} onChange={handleChange} error={errors.email} icon="bi-envelope" />
                  <FormInput label="Phone Number *" name="mobile" value={formData.mobile} onChange={handleChange} error={errors.mobile} icon="bi-phone" />
                  <FormInput label="Role" value={formData.role} readOnly icon="bi-shield-check" bg="bg-light" />
                  <FormInput label="Monthly Salary *" name="salary" type="number" value={formData.salary} onChange={handleChange} error={errors.salary} icon="bi-currency-rupee" />
                  <FormInput label="Joining Date *" name="joiningDate" type="date" value={formData.joiningDate} onChange={handleChange} error={errors.joiningDate} icon="bi-calendar-check" />
                </div>

                {/* Section: Personal Info */}
                <div className="row g-4 mb-4">
                  <div className="col-12 border-bottom pb-2 mb-2">
                    <h5 className="text-primary fw-bold"><i className="bi bi-person-lines-fill me-2"></i>Personal Details</h5>
                  </div>
                  <FormInput label="Father/Husband Name" name="fatherName" value={formData.fatherName} onChange={handleChange} icon="bi-people" />
                  <div className="col-md-4">
                    <label className="form-label fw-bold small">Gender *</label>
                    <select name="gender" className={`form-select ${errors.gender ? "is-invalid" : ""}`} value={formData.gender} onChange={handleChange}>
                      <option value="">Select</option>
                      <option>Male</option><option>Female</option><option>Other</option>
                    </select>
                  </div>
                  <FormInput label="Experience (Years)" name="experience" type="number" value={formData.experience} onChange={handleChange} icon="bi-star" />
                  <FormInput label="Education" name="education" value={formData.education} onChange={handleChange} icon="bi-mortarboard" />
                  <div className="col-md-4">
                    <label className="form-label fw-bold small">Blood Group</label>
                    <select name="bloodGroup" className="form-select" value={formData.bloodGroup} onChange={handleChange}>
                      <option value="">Select</option>
                      <option>A+</option><option>B+</option><option>O+</option><option>AB+</option>
                      <option>A-</option><option>B-</option><option>O-</option><option>AB-</option>
                    </select>
                  </div>
                  <FormInput label="Date of Birth" name="dob" type="date" value={formData.dob} onChange={handleChange} icon="bi-calendar-heart" />
                  <div className="col-12">
                    <label className="form-label fw-bold small">Home Address</label>
                    <textarea name="address" className="form-control" rows="2" value={formData.address} onChange={handleChange} placeholder="Enter full address..."></textarea>
                  </div>
                </div>

                {/* Actions */}
                <div className="d-flex justify-content-end gap-2 mt-5">
                  <button type="button" className="btn btn-outline-secondary px-4 rounded-pill" onClick={() => navigate(-1)}>Cancel</button>
                  <button type="submit" className="btn btn-primary px-5 rounded-pill shadow-sm fw-bold">Update Profile</button>
                </div>

                {message && (
                  <div className={`alert mt-4 text-center rounded-3 border-0 shadow-sm ${message.includes('✅') ? 'alert-success' : 'alert-danger'}`}>
                    {message}
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-component for clean code
const FormInput = ({ label, icon, error, bg = "", ...props }) => (
  <div className="col-md-4">
    <label className="form-label fw-bold small">{label}</label>
    <div className="input-group">
      <span className={`input-group-text bg-white border-end-0 ${error ? 'border-danger' : ''}`}><i className={`bi ${icon} text-muted`}></i></span>
      <input {...props} className={`form-control border-start-0 ${bg} ${error ? 'is-invalid' : ''}`} />
      {error && <div className="invalid-feedback">{error}</div>}
    </div>
  </div>
);

export default EditTeacher;