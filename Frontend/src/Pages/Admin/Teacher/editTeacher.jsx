import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../api/api";
import "bootstrap/dist/css/bootstrap.min.css";

function EditTeacher() {
  const { id } = useParams(); // MongoDB _id
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
  });

  const [preview, setPreview] = useState(null);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({});

  // Fetch teacher by Mongo _id
  useEffect(() => {
    const fetchTeacher = async () => {
      try {
        const res = await api.get(`/api/teachers/getTeacherById/${id}`);
        const teacher = res.data;

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
          dob: teacher.dob ? teacher.dob.slice(0, 10) : "",
          joiningDate: teacher.joiningDate ? teacher.joiningDate.slice(0, 10) : "",
          picture: null,
        });

        // Set image preview
        if (teacher.picture) {
          const imageUrl = teacher.picture.startsWith("http")
            ? teacher.picture
            : `http://localhost:3000/${teacher.picture}`;
          setPreview(imageUrl);
        }
      } catch (err) {
        console.error("Error fetching teacher:", err);
        setMessage("Failed to fetch teacher details.");
      }
    };
    fetchTeacher();
  }, [id]);

  const capitalizeWords = (text) =>
    text
      .split(" ")
      .filter((word) => word.trim() !== "")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");

  const validateField = (name, value) => {
    let error = "";
    if (["email", "mobile", "teacherName", "salary", "gender", "joiningDate"].includes(name) && !value)
      error = "This field is required.";
    if (name === "email" && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) error = "Invalid email format.";
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
      const file = files[0];
      setFormData({ ...formData, picture: file });
      setPreview(file ? URL.createObjectURL(file) : preview);
    } else if (name === "teacherName") {
      setFormData({ ...formData, teacherName: capitalizeWords(value) });
    } else {
      setFormData({ ...formData, [name]: value });
    }

    const error = validateField(name, value);
    setErrors({ ...errors, [name]: error });
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
      setMessage("Please fix the errors before submitting.");
      return;
    }

    try {
      const data = new FormData();
      Object.keys(formData).forEach((key) => data.append(key, formData[key]));

      await api.put(`/api/teachers/updateTeacherById/${id}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMessage("✅ Teacher details updated successfully!");
      setTimeout(() => navigate(`/teachers/viewteacher/${id}`), 1500);
    } catch (error) {
      console.error("Error updating teacher:", error);
      setMessage("❌ Failed to update teacher. Please try again.");
    }
  };

  const handleReset = () => navigate(-1);

  return (
    <div className="container mt-4 mb-5">
      <div className="card shadow-lg border-0 rounded-4">
        <div className="card-header bg-primary text-white text-center rounded-top-4 py-3">
          <h4 className="mb-0 fw-semibold">Edit Teacher Details</h4>
        </div>
        <div className="card-body bg-white p-4">
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              {/* Registration Number (read-only) */}
              <div className="col-md-4">
                <label className="form-label fw-semibold text-primary">Registration Number</label>
                <input
                  type="text"
                  name="regNumber"
                  className="form-control"
                  value={formData.regNumber}
                  readOnly
                  style={{ backgroundColor: "#e9ecef", cursor: "not-allowed" }}
                />
              </div>

              {/* Teacher Name */}
              <div className="col-md-4">
                <label className="form-label fw-semibold text-primary">Teacher Name *</label>
                <input
                  type="text"
                  name="teacherName"
                  className={`form-control ${errors.teacherName ? "is-invalid" : ""}`}
                  value={formData.teacherName}
                  onChange={handleChange}
                />
                {errors.teacherName && <div className="invalid-feedback">{errors.teacherName}</div>}
              </div>

              {/* Mobile */}
              <div className="col-md-4">
                <label className="form-label fw-semibold text-primary">Mobile *</label>
                <input
                  type="text"
                  name="mobile"
                  className={`form-control ${errors.mobile ? "is-invalid" : ""}`}
                  value={formData.mobile}
                  onChange={handleChange}
                />
                {errors.mobile && <div className="invalid-feedback">{errors.mobile}</div>}
              </div>

              {/* Role (read-only) */}
              <div className="col-md-4">
                <label className="form-label fw-semibold text-primary">Role</label>
                <input type="text" name="role" className="form-control bg-light" value={formData.role} readOnly />
              </div>

              {/* Salary */}
              <div className="col-md-4">
                <label className="form-label fw-semibold text-primary">Salary *</label>
                <input
                  type="number"
                  name="salary"
                  className={`form-control ${errors.salary ? "is-invalid" : ""}`}
                  value={formData.salary}
                  onChange={handleChange}
                />
                {errors.salary && <div className="invalid-feedback">{errors.salary}</div>}
              </div>

              {/* Joining Date */}
              <div className="col-md-4">
                <label className="form-label fw-semibold text-primary">Joining Date *</label>
                <input
                  type="date"
                  name="joiningDate"
                  className={`form-control ${errors.joiningDate ? "is-invalid" : ""}`}
                  value={formData.joiningDate}
                  onChange={handleChange}
                />
                {errors.joiningDate && <div className="invalid-feedback">{errors.joiningDate}</div>}
              </div>

              {/* Picture */}
              <div className="col-md-4">
                <label className="form-label fw-semibold text-primary">Profile Picture</label>
                <input
                  type="file"
                  name="picture"
                  ref={fileInputRef}
                  className="form-control"
                  accept="image/*"
                  onChange={handleChange}
                />
                {preview && (
                  <div className="mt-2 text-center">
                    <img
                      src={preview}
                      alt="Preview"
                      className="rounded shadow-sm border border-primary"
                      style={{ width: "100px", height: "100px", objectFit: "cover" }}
                    />
                  </div>
                )}
              </div>

              {/* Other Fields */}
              <div className="col-md-4">
                <label className="form-label fw-semibold text-primary">Father / Husband Name</label>
                <input type="text" name="fatherName" className="form-control" value={formData.fatherName} onChange={handleChange} />
              </div>

              <div className="col-md-4">
                <label className="form-label fw-semibold text-primary">Gender *</label>
                <select name="gender" className={`form-select ${errors.gender ? "is-invalid" : ""}`} value={formData.gender} onChange={handleChange}>
                  <option value="">Select</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
                {errors.gender && <div className="invalid-feedback">{errors.gender}</div>}
              </div>

              <div className="col-md-4">
                <label className="form-label fw-semibold text-primary">Experience (Years)</label>
                <input type="number" name="experience" className="form-control" value={formData.experience} onChange={handleChange} />
              </div>

              <div className="col-md-4">
                <label className="form-label fw-semibold text-primary">Email *</label>
                <input type="email" name="email" className={`form-control ${errors.email ? "is-invalid" : ""}`} value={formData.email} onChange={handleChange} />
                {errors.email && <div className="invalid-feedback">{errors.email}</div>}
              </div>

              <div className="col-md-4">
                <label className="form-label fw-semibold text-primary">Education</label>
                <input type="text" name="education" className="form-control" value={formData.education} onChange={handleChange} />
              </div>

              <div className="col-md-4">
                <label className="form-label fw-semibold text-primary">Blood Group</label>
                <select name="bloodGroup" className="form-select" value={formData.bloodGroup} onChange={handleChange}>
                  <option value="">Select</option>
                  <option>A+</option><option>A-</option><option>B+</option><option>B-</option>
                  <option>O+</option><option>O-</option><option>AB+</option><option>AB-</option>
                </select>
              </div>

              <div className="col-md-4">
                <label className="form-label fw-semibold text-primary">Date of Birth</label>
                <input type="date" name="dob" className="form-control" value={formData.dob} onChange={handleChange} />
              </div>

              <div className="col-md-12">
                <label className="form-label fw-semibold text-primary">Address</label>
                <textarea name="address" rows="2" className="form-control" value={formData.address} onChange={handleChange}></textarea>
              </div>
            </div>

            <div className="text-center mt-4">
              <button type="button" className="btn btn-outline-secondary me-3 px-4" onClick={handleReset}>Cancel</button>
              <button type="submit" className="btn btn-primary px-4">Save Changes</button>
            </div>

            {message && <div className="alert alert-info text-center mt-4 shadow-sm">{message}</div>}
          </form>
        </div>
      </div>
    </div>
  );
}

export default EditTeacher;
