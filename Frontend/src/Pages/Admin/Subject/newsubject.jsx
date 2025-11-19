import React, { useEffect, useState } from "react";
import api from "../../../api/api";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

function NewSubject() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [subjects, setSubjects] = useState([{ subjectName: "", marks: "" }]);
  const [loading, setLoading] = useState(false);

  // Fetch all classes
  const fetchClasses = async () => {
    try {
      const res = await api.get("/api/classes");
      setClasses(res.data || []);
    } catch (err) {
      console.error("Error fetching classes:", err);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  // Add / Remove subjects
  const addSubject = () => setSubjects([...subjects, { subjectName: "", marks: "" }]);
  const removeSubject = () => subjects.length > 1 && setSubjects(subjects.slice(0, -1));

  // Handle input change
  const handleChange = (index, field, value) => {
    const newSubjects = [...subjects];
    newSubjects[index][field] = value;
    setSubjects(newSubjects);
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedClass) {
      alert("Please select a class!");
      return;
    }

    const validSubjects = subjects.filter(
      (s) => s.subjectName.trim() && s.marks.trim()
    );
    if (validSubjects.length === 0) {
      alert("Please add at least one subject!");
      return;
    }

    try {
      setLoading(true);
      await api.post("/api/subjects/createSubject", {
        className: Number(selectedClass),
        subjects: validSubjects,
      });
      alert("Subjects created successfully!");
      setSelectedClass("");
      setSubjects([{ subjectName: "", marks: "" }]);
    } catch (err) {
      console.error(err);
      alert("Failed to create subjects!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid p-4" style={{ backgroundColor: "#f8f9ff", minHeight: "100vh" }}>
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "85vh" }}>
        <div className="card shadow border-0 p-4" style={{ borderRadius: "20px", maxWidth: "700px", width: "100%", backgroundColor: "white" }}>
          <h4 className="text-center fw-bold mb-2" style={{ color: "#202040" }}>
            Create Subjects
          </h4>
          <p className="text-center text-muted mb-4">
            <span style={{ color: "red" }}>*</span> Required &nbsp; | &nbsp;
            <span style={{ color: "#6c63ff" }}>Optional</span>
          </p>

          <form onSubmit={handleSubmit}>
            {/* Select Class */}
            <div className="mb-4">
              <label className="form-label fw-semibold" style={{ color: "#6c63ff" }}>
                Select Class*
              </label>
              <select
                className="form-select px-3 py-2"
                style={{ borderRadius: "50px", borderColor: "#b9b7ff" }}
                value={selectedClass}
                onChange={(e) => setSelectedClass(Number(e.target.value))}
              >
                <option value="">Select</option>
                {classes.map((cls) => (
                  <option key={cls._id} value={cls.className}>
                    {cls.className}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject Inputs */}
            {subjects.map((sub, index) => (
              <div className="row mb-3" key={index}>
                <div className="col-md-6 mb-3 mb-md-0">
                  <label className="form-label fw-semibold" style={{ color: "#6c63ff" }}>
                    Subject Name*
                  </label>
                  <input
                    type="text"
                    className="form-control px-3 py-2"
                    style={{ borderRadius: "50px", borderColor: "#b9b7ff" }}
                    placeholder="Name Of Subject"
                    value={sub.subjectName}
                    onChange={(e) => handleChange(index, "subjectName", e.target.value)}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold" style={{ color: "#6c63ff" }}>
                    Marks*
                  </label>
                  <input
                    type="number"
                    className="form-control px-3 py-2"
                    style={{ borderRadius: "50px", borderColor: "#b9b7ff" }}
                    placeholder="Total Exam Marks"
                    value={sub.marks}
                    onChange={(e) => handleChange(index, "marks", e.target.value)}
                    required
                  />
                </div>
              </div>
            ))}

            {/* Add / Remove Buttons */}
            <div className="d-flex justify-content-center gap-3 mb-4">
              <button
                type="button"
                className="btn px-4 fw-semibold"
                onClick={addSubject}
                style={{ borderRadius: "50px", backgroundColor: "#eff0ff", color: "#6c63ff", border: "1px solid #d7d5ff" }}
              >
                + Add More
              </button>
              <button
                type="button"
                className="btn px-4 fw-semibold"
                onClick={removeSubject}
                style={{ borderRadius: "50px", backgroundColor: "#3a3a3a", color: "white" }}
                disabled={subjects.length === 1}
              >
                − Remove
              </button>
            </div>

            {/* Submit Button */}
            <div className="text-center">
              <button
                type="submit"
                className="btn fw-bold px-5 py-2"
                style={{ borderRadius: "50px", backgroundColor: "#f9b54a", color: "#202040", fontSize: "1rem" }}
                disabled={loading}
              >
                {loading ? "Saving..." : "+ Assign Subjects"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default NewSubject;
