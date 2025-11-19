import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../api/api";

export default function PaySalary() {
  const navigate = useNavigate();

  const [teachers, setTeachers] = useState([]);
  const [search, setSearch] = useState("");

  const [selected, setSelected] = useState(null);
  const [salaryRecord, setSalaryRecord] = useState(null);
  const [alreadyPaid, setAlreadyPaid] = useState(false);

  const getMonth = () => {
    const d = new Date();
    return d.toLocaleString("en-US", { month: "long" }) + " " + d.getFullYear();
  };

  const [form, setForm] = useState({
    teacher: "",
    month: getMonth(),
    paidAmount: "",
    status: "Paid",
  });

  // Fetch teachers
  useEffect(() => {
    api.get("/api/teacher-salary/teachers").then((res) => setTeachers(res.data));
  }, []);

  // When clicking Pay Salary button
  const selectTeacher = async (teacher) => {
    setSelected(teacher);

    setForm({
      ...form,
      teacher: teacher._id,
      paidAmount: teacher.salary,
    });

    const check = await api.get(
      `/api/teacher-salary/check/${teacher._id}?month=${form.month}`
    );

    if (check.data.paid) {
      setAlreadyPaid(true);

      const rec = await api.get("/api/teacher-salary/all");
      const found = rec.data.find(
        (r) =>
          r.teacher?._id === teacher._id && r.month === form.month
      );

      setSalaryRecord(found);
    } else {
      setAlreadyPaid(false);
      setSalaryRecord(null);
    }
  };

  // Submit salary
  const submit = async (e) => {
    e.preventDefault();
    if (alreadyPaid) return alert("Salary already paid!");

    await api.post("/api/teacher-salary/pay", form);
    alert("Salary Paid Successfully!");

    navigate("/approve-salary");
  };

  // Filter teachers
  const filtered = teachers.filter((t) =>
    t.teacherName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container mt-3">
      <h2 className="mb-4">Teacher Salary Payment</h2>

      {/* Search */}
      <input
        type="text"
        placeholder="Search teacher..."
        className="form-control mb-4"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* ⭐ UPDATED TEACHER CARDS */}
      <div className="row">
        {filtered.map((t) => (
          <div className="col-md-4 mb-3" key={t._id}>
            <div className="card shadow-lg border-0 rounded-3 p-3 teacher-card">

              <div className="d-flex justify-content-between align-items-center">
                <h5 className="fw-bold">{t.teacherName}</h5>

                <span className="badge bg-primary px-3 py-2">
                  ₹{t.salary}
                </span>
              </div>

              <hr />

              <p className="mb-1">
                <b>Email:</b> {t.email}
              </p>
              <p className="mb-1">
                <b>Phone:</b> {t.mobile}
              </p>
              <p className="mb-1">
                <b>Gender:</b> {t.gender}
              </p>

              <button
                className="btn btn-success w-100 mt-3 fw-bold"
                onClick={() => selectTeacher(t)}
              >
                Check Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Already Paid Card */}
      {alreadyPaid && salaryRecord && (
        <div className="card shadow p-3 mt-4">
          <h4 className="mb-3">Salary Already Paid</h4>
          <p><b>Teacher:</b> {selected.teacherName}</p>
          <p><b>Month:</b> {salaryRecord.month}</p>
          <p><b>Paid Amount:</b> ₹{salaryRecord.paidAmount}</p>
          <p><b>Status:</b> {salaryRecord.status}</p>

          <div className="alert alert-info">
            Salary already paid for this month.
          </div>
        </div>
      )}

      {/* Payment Form */}
      {!alreadyPaid && selected && (
        <form onSubmit={submit} className="card shadow p-3 mt-4">
          <h4 className="mb-3">Salary Payment Form</h4>

          <div className="mb-2">
            <label><b>Teacher:</b></label>
            <input className="form-control" value={selected.teacherName} readOnly />
          </div>

          <div className="mb-2">
            <label><b>Month:</b></label>
            <input className="form-control" value={form.month} readOnly />
          </div>

          <div className="mb-2">
            <label><b>Paid Amount:</b></label>
            <input className="form-control" value={form.paidAmount} readOnly />
          </div>

          <div className="mb-2">
            <label><b>Status:</b></label>
            <select
              className="form-control"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
            </select>
          </div>

          <button className="btn btn-primary w-100">
            Submit Salary
          </button>
        </form>
      )}
    </div>
  );
}
