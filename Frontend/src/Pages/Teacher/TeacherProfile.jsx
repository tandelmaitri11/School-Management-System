import React, { useEffect, useState, useRef } from "react";
import api from "../../api/api"; // axios instance
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

export default function TeacherProfile() {
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [imagePreview, setImagePreview] = useState("");
  const [allClasses, setAllClasses] = useState([]);
  const fileInputRef = useRef(null);

  // Fetch teacher profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const teacherId = localStorage.getItem("teacherId");
        const res = await api.get(`/api/teachers/teacher/profile/${teacherId}`);
        const data = res.data;
        setProfile(data);

        // Prepare form data
        setFormData({
          teacherName: data.teacherName || "",
          mobile: data.mobile || "",
          email: data.email || "",
          education: data.education || "",
          address: data.address || "",
          experience: data.experience || "",
          salary: data.salary || "",
          fatherName: data.fatherName || "",
          gender: data.gender || "",
          bloodGroup: data.bloodGroup || "",
          dob: data.dob ? new Date(data.dob).toISOString().substr(0, 10) : "",
          joiningDate: data.joiningDate
            ? new Date(data.joiningDate).toISOString().substr(0, 10)
            : "",
          picture: data.picture || "",
          subjects: data.subjects?.join(", ") || "",
          classes: data.classes || [],
        });
        setImagePreview(data.picture || "");
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      }
    };
    fetchProfile();
  }, []);

  // Fetch all classes
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await api.get("/api/classes");
        setAllClasses(res.data);
      } catch (err) {
        console.error("Failed to fetch classes:", err);
      }
    };
    fetchClasses();
  }, []);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFormData({ ...formData, picture: file });
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    try {
      const data = new FormData();

      Object.keys(formData).forEach((key) => {
        if (key === "subjects") {
          data.append(key, formData[key]);
        } else if (key === "classes") {
          // Convert classes array to JSON string for backend
          data.append(key, JSON.stringify(formData[key]));
        } else {
          data.append(key, formData[key]);
        }
      });

      const res = await api.put(
        `/api/teachers/updateTeacherById/${profile.teacherInfoId}`, // TeacherInfo _id
        data,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      // Update profile and formData immediately
      setProfile((prev) => ({
        ...prev,
        ...res.data.teacher,
        classes: res.data.classesFull.map((cls) => cls._id), // update classes array with IDs
      }));

      setFormData((prev) => ({
        ...prev,
        subjects: res.data.teacher.subjects?.join(", ") || "",
        classes: res.data.classesFull.map((cls) => cls._id),
      }));

      setEditing(false);
      alert("Profile updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to update profile.");
    }
  };


  if (!profile) return <div className="text-center mt-5">Loading...</div>;

  return (
    <div className="container-fluid min-vh-100 bg-white">
      <main className="px-5 py-4">
        <h3 className="fw-bold mb-4">Teacher Profile</h3>

        <div className="card mb-4 shadow-sm border-0">
          <div className="card-body d-flex gap-4 align-items-center">
            {/* PROFILE ICON / IMAGE */}
            <div
              className="rounded-circle d-flex justify-content-center align-items-center bg-light border"
              style={{ width: "120px", height: "120px", overflow: "hidden", flexShrink: 0 }}
            >
              <img
                src={
                  imagePreview.startsWith("blob:")
                    ? imagePreview
                    : `http://localhost:3000/${imagePreview}`
                }
                alt="Teacher Profile"
                className="rounded-circle border shadow-sm"
                style={{ width: "120px", height: "120px", objectFit: "cover" }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src =
                    "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";
                }}
              />
            </div>

            {/* PROFILE DETAILS */}
            <div className="flex-grow-1">
              {editing ? (
                <>
                  <input
                    type="text"
                    name="teacherName"
                    className="form-control mb-2"
                    value={formData.teacherName}
                    onChange={handleChange}
                    placeholder="Full Name"
                  />
                  <input
                    type="text"
                    name="education"
                    className="form-control mb-2"
                    value={formData.education}
                    onChange={handleChange}
                    placeholder="Education"
                  />
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="form-control"
                    onChange={handleFileChange}
                  />
                </>
              ) : (
                <>
                  <h4 className="fw-bold mb-1">
                    {profile.teacherName || "Teacher Name"}
                  </h4>
                  <p className="mb-1 text-muted">{profile.education || "-"}</p>
                  <p className="mb-0 text-muted">
                    Joined{" "}
                    {profile.joiningDate
                      ? new Date(profile.joiningDate).toLocaleDateString()
                      : "-"}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* PERSONAL INFORMATION */}
        <section className="mb-4">
          <h5 className="fw-bold mb-3">Personal Information</h5>
          <div className="row border-top pt-3">
            {[
              "teacherName",
              "mobile",
              "email",
              "fatherName",
              "gender",
              "bloodGroup",
              "dob",
              "address",
            ].map((field) => (
              <div className="col-md-6 mb-3" key={field}>
                <p className="text-muted mb-1">{field}</p>
                {editing && field !== "email" ? (
                  <input
                    type={field === "dob" ? "date" : "text"}
                    name={field}
                    className="form-control"
                    value={formData[field]}
                    onChange={handleChange}
                  />
                ) : (
                  <p className="mb-0">{profile[field] || "-"}</p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* TEACHING DETAILS */}
        <section className="mb-4">
          <h5 className="fw-bold mb-3">Teaching Details</h5>
          <div className="row border-top pt-3">
            {/* Subjects */}
            <div className="col-md-6 mb-3">
              <p className="text-muted mb-1">Subjects</p>
              {editing ? (
                <input
                  type="text"
                  name="subjects"
                  className="form-control"
                  value={formData.subjects}
                  onChange={handleChange}
                  placeholder="Separate with commas"
                />
              ) : (
                <p className="mb-0">{profile.subjects?.join?.(", ") || "-"}</p>
              )}
            </div>

            {/* Classes */}
            <div className="col-md-6 mb-3">
              <p className="text-muted mb-1">Classes</p>
              {editing ? (
                <select
                  name="classes"
                  multiple
                  className="form-control"
                  value={formData.classes}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      classes: Array.from(e.target.selectedOptions, (option) => option.value),
                    })
                  }
                >
                  {allClasses.map((cls) => (
                    <option key={cls._id} value={cls._id}>
                      {cls.className}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="mb-0">
                  {profile.classes?.length
                    ? profile.classes
                      .map((id) => allClasses.find((cls) => cls._id === id)?.className)
                      .join(", ")
                    : "-"}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* PROFESSIONAL INFO */}
        <section className="mb-4">
          <h5 className="fw-bold mb-3">Professional Information</h5>
          <div className="row border-top pt-3">
            {["experience", "salary"].map((field) => (
              <div className="col-md-6 mb-3" key={field}>
                <p className="text-muted mb-1">{field}</p>
                {editing ? (
                  <input
                    type="number"
                    name={field}
                    className="form-control"
                    value={formData[field]}
                    onChange={handleChange}
                  />
                ) : (
                  <p className="mb-0">{profile[field] || "-"}</p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ACTION BUTTONS */}
        <div className="d-flex justify-content-end mb-5">
          {editing ? (
            <>
              <button className="btn btn-success me-2" onClick={handleSave}>
                Save
              </button>
              <button className="btn btn-secondary" onClick={() => setEditing(false)}>
                Cancel
              </button>
            </>
          ) : (
            <button className="btn btn-outline-secondary" onClick={() => setEditing(true)}>
              Edit Profile
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
