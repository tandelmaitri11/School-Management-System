import React, { useEffect, useState, useRef } from "react";
import api from "../../api/api";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

export default function TeacherProfile() {
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [imagePreview, setImagePreview] = useState("");
  const [allClasses, setAllClasses] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const teacherId = localStorage.getItem("teacherId");
        const res = await api.get(`/api/teachers/teacher/profile/${teacherId}`);
        const data = res.data;
        setProfile(data);

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
        console.error(err);
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await api.get("/api/classes");
        setAllClasses(res.data);
      } catch (err) {
        console.error(err);
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
        if (key === "classes") data.append(key, JSON.stringify(formData[key]));
        else data.append(key, formData[key]);
      });

      await api.put(
        `/api/teachers/updateTeacherById/${profile.teacherInfoId}`,
        data,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      setEditing(false);
      alert("Profile updated successfully!");
    } catch (err) {
      alert("Failed to update profile");
    }
  };

  if (!profile) return <div className="text-center mt-5">Loading...</div>;

  return (
    <div className="container-fluid px-2 px-md-4 bg-white min-vh-100">
      <main className="py-3 py-md-4">
        <h3 className="fw-bold mb-4 text-center text-md-start">
          Teacher Profile
        </h3>

        {/* PROFILE CARD */}
        <div className="card mb-4 shadow-sm border-0">
          <div className="card-body d-flex flex-column flex-md-row gap-4 align-items-center">
            {/* IMAGE */}
            <div className="text-center">
              <img
                src={
                  imagePreview.startsWith("blob:")
                    ? imagePreview
                    : `http://localhost:3000/${imagePreview}`
                }
                alt="Teacher"
                className="rounded-circle border shadow-sm"
                style={{ width: "120px", height: "120px", objectFit: "cover" }}
                onError={(e) => {
                  e.target.src =
                    "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";
                }}
              />
            </div>

            {/* BASIC INFO */}
            <div className="flex-grow-1 w-100">
              {editing ? (
                <>
                  <input
                    type="text"
                    name="teacherName"
                    className="form-control mb-2"
                    value={formData.teacherName}
                    onChange={handleChange}
                  />
                  <input
                    type="text"
                    name="education"
                    className="form-control mb-2"
                    value={formData.education}
                    onChange={handleChange}
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
                  <h4 className="fw-bold">{profile.teacherName}</h4>
                  <p className="text-muted mb-1">{profile.education}</p>
                  <small className="text-muted">
                    Joined{" "}
                    {profile.joiningDate
                      ? new Date(profile.joiningDate).toLocaleDateString()
                      : "-"}
                  </small>
                </>
              )}
            </div>
          </div>
        </div>

        {/* PERSONAL INFO */}
        <section className="mb-4">
          <h5 className="fw-bold">Personal Information</h5>
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
              <div className="col-12 col-md-6 mb-3" key={field}>
                <small className="text-muted">{field}</small>
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

        {/* TEACHING */}
        <section className="mb-4">
          <h5 className="fw-bold">Teaching Details</h5>
          <div className="row border-top pt-3">
            <div className="col-12 col-md-6 mb-3">
              <small className="text-muted">Subjects</small>
              {editing ? (
                <input
                  className="form-control"
                  name="subjects"
                  value={formData.subjects}
                  onChange={handleChange}
                />
              ) : (
                <p>{profile.subjects?.join(", ") || "-"}</p>
              )}
            </div>

            <div className="col-12 col-md-6 mb-3">
              <small className="text-muted">Classes</small>
              {editing ? (
                <select
                  multiple
                  className="form-control"
                  value={formData.classes}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      classes: Array.from(
                        e.target.selectedOptions,
                        (o) => o.value
                      ),
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
                <p>
                  {profile.classes?.length
                    ? profile.classes
                        .map(
                          (id) =>
                            allClasses.find((c) => c._id === id)?.className
                        )
                        .join(", ")
                    : "-"}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* PROFESSIONAL */}
        <section className="mb-4">
          <h5 className="fw-bold">Professional Information</h5>
          <div className="row border-top pt-3">
            {["experience", "salary"].map((field) => (
              <div className="col-12 col-md-6 mb-3" key={field}>
                <small className="text-muted">{field}</small>
                {editing ? (
                  <input
                    type="number"
                    name={field}
                    className="form-control"
                    value={formData[field]}
                    onChange={handleChange}
                  />
                ) : (
                  <p>{profile[field] || "-"}</p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ACTIONS */}
        <div className="d-flex flex-column flex-sm-row justify-content-end gap-2">
          {editing ? (
            <>
              <button className="btn btn-success w-100 w-sm-auto" onClick={handleSave}>
                Save
              </button>
              <button
                className="btn btn-secondary w-100 w-sm-auto"
                onClick={() => setEditing(false)}
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              className="btn btn-outline-secondary w-100 w-sm-auto"
              onClick={() => setEditing(true)}
            >
              Edit Profile
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
