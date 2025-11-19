import React, { useState, useEffect, useRef } from "react";
import api from "../../../api/api"; // Axios instance
import "bootstrap/dist/css/bootstrap.min.css";

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

  // Fetch teachers from TeacherRegister for dropdown
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

  // Handle teacher selection from dropdown
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

  // Validation for required fields
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

  // Handle form input changes
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

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
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

      setMessage(res.data.message);

      // Reset editable fields
      setFormData({
        ...formData,
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
      setPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

    } catch (error) {
      console.error("Error adding teacher info:", error);
      setMessage(error.response?.data?.message || "Failed to add teacher info.");
    }
  };

  // Reset form
  const handleReset = () => {
    setFormData({
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
    setErrors({});
    setMessage("");
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="container mt-4 mb-5">
      <div className="card shadow-lg border-0">
        <div className="card-header bg-primary text-white text-center">
          <h4 className="mb-0">Add Teacher Info</h4>
        </div>
        <div className="card-body bg-light">
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              {/* Select Teacher */}
              <div className="col-md-6">
                <label className="form-label">Select Teacher <span className="text-danger">*</span></label>
                <select
                  className={`form-select ${errors.regNumber ? "is-invalid" : ""}`}
                  value={formData.regNumber}
                  onChange={handleTeacherSelect}
                >
                  <option value="">-- Select Teacher --</option>
                  {teachers.map((t) => (
                    <option key={t.teacherId} value={t.teacherId}>
                      {t.name} ({t.email})
                    </option>
                  ))}
                </select>
                {errors.regNumber && <div className="invalid-feedback">{errors.regNumber}</div>}
              </div>

              {/* Auto-filled fields */}
              <div className="col-md-3"><label className="form-label">Reg Number</label><input type="text" className="form-control" value={formData.regNumber} readOnly /></div>
              <div className="col-md-3"><label className="form-label">Role</label><input type="text" className="form-control" value={formData.role} readOnly /></div>
              <div className="col-md-6"><label className="form-label">Name</label><input type="text" className="form-control" value={formData.teacherName} readOnly /></div>
              <div className="col-md-6"><label className="form-label">Email</label><input type="email" className="form-control" value={formData.email} readOnly /></div>

              {/* Editable fields */}
              <div className="col-md-4"><label className="form-label">Mobile *</label><input type="text" name="mobile" className={`form-control ${errors.mobile ? "is-invalid" : ""}`} value={formData.mobile} onChange={handleChange} />{errors.mobile && <div className="invalid-feedback">{errors.mobile}</div>}</div>
              <div className="col-md-4"><label className="form-label">Salary *</label><input type="number" name="salary" className={`form-control ${errors.salary ? "is-invalid" : ""}`} value={formData.salary} onChange={handleChange} />{errors.salary && <div className="invalid-feedback">{errors.salary}</div>}</div>
              <div className="col-md-4"><label className="form-label">Joining Date *</label><input type="date" name="joiningDate" className={`form-control ${errors.joiningDate ? "is-invalid" : ""}`} value={formData.joiningDate} onChange={handleChange} />{errors.joiningDate && <div className="invalid-feedback">{errors.joiningDate}</div>}</div>
              <div className="col-md-4"><label className="form-label">Father / Husband Name</label><input type="text" name="fatherName" className="form-control" value={formData.fatherName} onChange={handleChange} /></div>
              <div className="col-md-4"><label className="form-label">Gender *</label><select name="gender" className={`form-select ${errors.gender ? "is-invalid" : ""}`} value={formData.gender} onChange={handleChange}><option value="">Select Gender</option><option>Male</option><option>Female</option><option>Other</option></select>{errors.gender && <div className="invalid-feedback">{errors.gender}</div>}</div>
              <div className="col-md-4"><label className="form-label">Experience</label><input type="number" name="experience" className="form-control" value={formData.experience} onChange={handleChange} /></div>
              <div className="col-md-4"><label className="form-label">Education</label><input type="text" name="education" className="form-control" value={formData.education} onChange={handleChange} /></div>
              <div className="col-md-4"><label className="form-label">Blood Group</label><select name="bloodGroup" className="form-select" value={formData.bloodGroup} onChange={handleChange}><option value="">Select Blood Group</option><option>A+</option><option>A-</option><option>B+</option><option>B-</option><option>O+</option><option>O-</option><option>AB+</option><option>AB-</option></select></div>
              <div className="col-md-4"><label className="form-label">Date of Birth</label><input type="date" name="dob" className="form-control" value={formData.dob} onChange={handleChange} /></div>
              <div className="col-md-12"><label className="form-label">Address</label><textarea name="address" rows="2" className="form-control" value={formData.address} onChange={handleChange} /></div>
              <div className="col-md-4"><label className="form-label">Profile Picture</label><input type="file" name="picture" ref={fileInputRef} className="form-control" accept="image/*" onChange={handleChange} />{preview && <img src={preview} alt="Preview" className="mt-2" width={100} />}</div>
            </div>

            <div className="mt-4 text-center">
              <button type="submit" className="btn btn-success me-2">Add Teacher</button>
              <button type="button" className="btn btn-secondary" onClick={handleReset}>Reset</button>
            </div>
            {message && <div className="alert alert-info mt-3">{message}</div>}
          </form>
        </div>
      </div>
    </div>
  );
}

export default AddTeacher;
