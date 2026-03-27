import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../api/api";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

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
    
    // Smooth scroll to the action panel on mobile
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    <div className="container-fluid py-4 min-vh-100" style={{ backgroundColor: "#f8fafc", fontFamily: "'Inter', sans-serif" }}>
      
      {/* Premium Custom CSS */}
      <style>{`
        .premium-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); transition: all 0.2s; }
        .premium-card:hover { transform: translateY(-4px); box-shadow: 0 12px 24px -8px rgba(79, 70, 229, 0.15); border-color: rgba(79, 70, 229, 0.3); }
        
        .input-premium { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 16px; font-weight: 500; color: #0f172a; transition: all 0.2s; width: 100%; }
        .input-premium:focus { border-color: #4f46e5; box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1); background: #ffffff; outline: none; }
        .input-premium[readonly] { background-color: #eef2ff; opacity: 1; border-color: #c7d2fe; color: #4f46e5; font-weight: 600; }
        
        .btn-brand { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); border: none; color: white; transition: all 0.2s; font-weight: 600; }
        .btn-brand:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(79, 70, 229, 0.3); color: white; }
        
        .avatar-circle { width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.2rem; }
        
        .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        
        .animate-slide-in { animation: slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>

      <div className="container" style={{ maxWidth: "1400px" }}>
        
        {/* Premium Header Card */}
        <div 
          className="rounded-4 overflow-hidden mb-4 shadow-sm border-0 position-relative p-4 p-md-5"
          style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)" }}
        >
          <div style={{ position: 'absolute', top: '-50%', right: '-5%', width: '300px', height: '300px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}></div>
          
          <div className="position-relative z-1 mb-4">
            <span className="badge px-3 py-2 rounded-pill fw-semibold mb-3" style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.3)', color: 'white' }}>
              <i className="bi bi-wallet2 me-1"></i> Financial Administration
            </span>
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
              <div>
                <h2 className="display-6 fw-bolder text-white mb-1" style={{ letterSpacing: '-1px' }}>Salary Distribution</h2>
                <p className="text-white opacity-75 fw-medium mb-0">Select a faculty member to initiate or verify payroll for {getMonth()}.</p>
              </div>
              <div className="bg-white bg-opacity-25 rounded-4 p-2 d-flex align-items-center shadow-sm backdrop-blur" style={{ minWidth: '300px' }}>
                <i className="bi bi-search text-white ms-2 me-2"></i>
                <input
                  type="text"
                  className="form-control border-0 bg-transparent text-white shadow-none placeholder-white fw-medium"
                  placeholder="Search faculty directory..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ outline: 'none' }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="row g-4">
          
          {/* LEFT COLUMN: Faculty Roster */}
          <div className={`col-12 ${selected ? 'col-lg-7 col-xl-8' : 'col-12'} transition-all`}>
            
            {filtered.length === 0 ? (
              <div className="text-center py-5 my-5 bg-white rounded-4 shadow-sm border border-dashed animate-fade-in">
                <div className="rounded-circle bg-light d-inline-flex align-items-center justify-content-center mb-4" style={{ width: 80, height: 80 }}>
                  <i className="bi bi-search text-muted opacity-50 fs-1"></i>
                </div>
                <h4 className="fw-bolder text-dark mb-2">No Faculty Found</h4>
                <p className="text-muted fw-medium">No teachers match your search criteria.</p>
              </div>
            ) : (
              <div className="row g-4">
                {filtered.map((t) => (
                  <div className={`col-12 ${selected ? 'col-md-6' : 'col-md-6 col-xl-4'}`} key={t._id}>
                    <div 
                      className={`premium-card h-100 p-4 d-flex flex-column ${selected?._id === t._id ? 'border-primary shadow-sm bg-primary bg-opacity-10' : ''}`}
                      style={{ cursor: 'pointer' }}
                      onClick={() => selectTeacher(t)}
                    >
                      <div className="d-flex align-items-start justify-content-between mb-3">
                        <div className="d-flex align-items-center gap-3">
                          <div className={`avatar-circle shadow-sm border ${selected?._id === t._id ? 'bg-primary text-white' : 'bg-light text-primary border-primary border-opacity-25'}`}>
                            {t.teacherName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h6 className="fw-bolder text-dark mb-1 text-truncate" style={{ maxWidth: '150px' }}>{t.teacherName}</h6>
                            <div className="text-muted small fw-medium text-truncate" style={{ maxWidth: '150px' }}>{t.email}</div>
                          </div>
                        </div>
                      </div>

                      <div className="d-flex flex-wrap gap-2 mb-4">
                        <span className="badge bg-light text-muted border px-2 py-1 fw-medium d-flex align-items-center">
                          <i className="bi bi-telephone-fill me-1 opacity-50"></i> {t.mobile || "N/A"}
                        </span>
                        <span className="badge bg-light text-muted border px-2 py-1 fw-medium d-flex align-items-center">
                          <i className="bi bi-gender-ambiguous me-1 opacity-50"></i> {t.gender || "N/A"}
                        </span>
                      </div>

                      <div className="mt-auto pt-3 border-top d-flex justify-content-between align-items-center" style={{ borderColor: selected?._id === t._id ? 'rgba(79, 70, 229, 0.2)' : '#f1f5f9' }}>
                        <div className="fw-bolder text-dark fs-5">
                          ₹{t.salary?.toLocaleString() || 0}
                        </div>
                        <button className={`btn btn-sm rounded-pill px-3 fw-bold shadow-sm ${selected?._id === t._id ? 'btn-brand' : 'bg-white border text-primary'}`}>
                          {selected?._id === t._id ? "Selected" : "Manage"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Action Console */}
          {selected && (
            <div className="col-12 col-lg-5 col-xl-4 animate-slide-in">
              <div className="position-sticky" style={{ top: '20px' }}>
                
                {alreadyPaid && salaryRecord ? (
                  <div className="premium-card overflow-hidden">
                    <div className="bg-success p-4 text-center text-white">
                      <div className="rounded-circle bg-white bg-opacity-25 d-inline-flex align-items-center justify-content-center mb-3" style={{ width: 64, height: 64 }}>
                        <i className="bi bi-check-circle-fill display-5"></i>
                      </div>
                      <h4 className="fw-bolder m-0">Payment Cleared</h4>
                      <p className="opacity-75 small fw-medium m-0">Salary for {salaryRecord.month} has been processed.</p>
                    </div>
                    
                    <div className="p-4">
                      <div className="d-flex justify-content-between align-items-center mb-3 pb-3 border-bottom" style={{ borderColor: '#f1f5f9' }}>
                        <span className="text-muted small fw-bold text-uppercase">Faculty</span>
                        <span className="fw-bolder text-dark">{selected.teacherName}</span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mb-3 pb-3 border-bottom" style={{ borderColor: '#f1f5f9' }}>
                        <span className="text-muted small fw-bold text-uppercase">Period</span>
                        <span className="fw-bold text-dark">{salaryRecord.month}</span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mb-3 pb-3 border-bottom" style={{ borderColor: '#f1f5f9' }}>
                        <span className="text-muted small fw-bold text-uppercase">Amount Disbursed</span>
                        <span className="fw-bolder text-success fs-5">₹{salaryRecord.paidAmount?.toLocaleString()}</span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="text-muted small fw-bold text-uppercase">Current Status</span>
                        <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-3 py-2 rounded-pill fw-bold">
                          {salaryRecord.status}
                        </span>
                      </div>
                      
                      <button className="btn bg-light border w-100 mt-4 rounded-pill fw-bold text-muted shadow-sm" onClick={() => setSelected(null)}>
                        Dismiss Console
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="premium-card p-4 p-md-5">
                    <h5 className="fw-bolder text-dark mb-4 pb-3 border-bottom d-flex align-items-center" style={{ borderColor: '#f1f5f9' }}>
                      <div className="rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center me-3" style={{ width: 36, height: 36 }}>
                        <i className="bi bi-wallet2"></i>
                      </div>
                      Process Salary
                    </h5>
                    
                    <form onSubmit={submit}>
                      <div className="mb-4">
                        <label className="form-label small fw-bold text-muted text-uppercase mb-2">Selected Faculty</label>
                        <input className="form-control input-premium" value={selected.teacherName} readOnly />
                      </div>

                      <div className="mb-4">
                        <label className="form-label small fw-bold text-muted text-uppercase mb-2">Payroll Month</label>
                        <input className="form-control input-premium" value={form.month} readOnly />
                      </div>

                      <div className="mb-4">
                        <label className="form-label small fw-bold text-muted text-uppercase mb-2">Total Amount (₹)</label>
                        <input className="form-control input-premium fs-5" value={form.paidAmount} readOnly />
                      </div>

                      <div className="mb-4">
                        <label className="form-label small fw-bold text-muted text-uppercase mb-2">Transaction Status</label>
                        <select
                          className="form-select input-premium py-2 bg-white fw-bold"
                          style={{ borderColor: form.status === 'Paid' ? '#10b981' : '#f59e0b' }}
                          value={form.status}
                          onChange={(e) => setForm({ ...form, status: e.target.value })}
                        >
                          <option value="Paid">Mark as Paid</option>
                          <option value="Pending">Hold as Pending</option>
                        </select>
                      </div>

                      <div className="d-flex gap-2 mt-5">
                        <button type="button" className="btn bg-light border text-muted fw-bold rounded-pill px-4" onClick={() => setSelected(null)}>
                          Cancel
                        </button>
                        <button type="submit" className="btn btn-brand rounded-pill flex-grow-1 shadow-sm">
                          Confirm & Disburse
                        </button>
                      </div>
                    </form>
                  </div>
                )}
                
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}