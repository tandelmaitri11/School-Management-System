import React, { useEffect, useMemo, useState } from "react";
import api from "../../../api/api";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import QRCode from "react-qr-code";

export default function StudentPaymentPage() {
  const [classes, setClasses] = useState([]);
  const [classFeeRows, setClassFeeRows] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedStream, setSelectedStream] = useState("");
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Payment states
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("Cash"); // Cash | QR
  const [utr, setUtr] = useState(""); // for QR (UPI UTR)

  // Reminder states
  const [sendingReminder, setSendingReminder] = useState(false);

  // UI states
  const [activeTab, setActiveTab] = useState("pay");
  const [message, setMessage] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);
  const [autoToggleBusy, setAutoToggleBusy] = useState(false);

  // Set your UPI details (static QR)
  const UPI_VPA = "myschool@upi";
  const PAYEE_NAME = "MySchoolY";

  const showToast = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 4000);
  };

  const formatMoney = (amount) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount || 0);

  const feeSummary = useMemo(() => selectedStudent?.feeSummary || {}, [selectedStudent]);
  const baseRemaining = useMemo(
    () => Number(feeSummary?.baseRemaining ?? selectedStudent?.fees?.remainingAmount ?? 0),
    [feeSummary, selectedStudent]
  );
  const lateFeeAmount = useMemo(
    () => Number(feeSummary?.lateFee ?? selectedStudent?.fees?.lateFeeAccrued ?? 0),
    [feeSummary, selectedStudent]
  );
  const totalDue = useMemo(
    () => Number(feeSummary?.totalDue ?? (baseRemaining + lateFeeAmount)),
    [feeSummary, baseRemaining, lateFeeAmount]
  );
  const isFullyPaid = useMemo(() => totalDue <= 0, [totalDue]);

  const streamOptions = useMemo(() => {
    if (!selectedClass) return [];
    const rows = classFeeRows.filter(
      (r) => String(r.className) === String(selectedClass) && String(r.stream || "").trim()
    );
    return Array.from(new Set(rows.map((r) => String(r.stream).trim())));
  }, [classFeeRows, selectedClass]);

  const selectedScopeFeeRows = useMemo(() => {
    if (!selectedClass) return [];
    const classRows = classFeeRows.filter((r) => String(r.className) === String(selectedClass));
    const streamKey = String(selectedStream || "").trim();
    if (!streamKey) return classRows;
    return classRows.filter((r) => String(r.stream || "").trim() === streamKey);
  }, [classFeeRows, selectedClass, selectedStream]);

  const hasScopeConfig = selectedScopeFeeRows.length > 0;
  const autoReminderEnabled = hasScopeConfig
    ? selectedScopeFeeRows.every((r) => r.autoReminderEnabled !== false)
    : true;

  // Build UPI QR string (upi://pay?...), includes amount & note
  const upiQrValue = useMemo(() => {
    const amt = paymentAmount ? Number(paymentAmount) : 0;
    const safeAmt = amt > 0 ? amt.toFixed(2) : "";
    const note = selectedStudent?.name ? `Fees-${selectedStudent.name}` : "School Fees";

    const params = new URLSearchParams();
    params.set("pa", UPI_VPA);
    params.set("pn", PAYEE_NAME);
    if (safeAmt) params.set("am", safeAmt);
    params.set("cu", "INR");
    params.set("tn", note);

    return `upi://pay?${params.toString()}`;
  }, [paymentAmount, selectedStudent]);

  // -------------------
  // API Calls
  // -------------------
  const loadClasses = async () => {
    try {
      const res = await api.get("/api/fees/class-fee");
      const rows = res.data.classFees || [];
      setClassFeeRows(rows);
      const uniqByClass = Array.from(
        new Map(rows.map((r) => [String(r.className), { className: r.className }])).values()
      ).sort((a, b) => Number(a.className) - Number(b.className));
      setClasses(uniqByClass);
    } catch (err) {
      console.error(err);
      showToast("error", err?.response?.data?.message || "Error loading classes");
    }
  };

  useEffect(() => {
    loadClasses();
  }, []);

  const loadStudents = async (cls, stream = "") => {
    if (!cls) return;
    setLoading(true);
    setSelectedStudent(null);

    try {
      const res = await api.get(`/api/fees/students/${cls}`, {
        params: stream ? { stream } : {},
      });
      const allStudents = res.data.students || [];

      // attach fees snapshot
      const studentsWithFees = await Promise.all(
        allStudents.map(async (student) => {
          try {
            const feesRes = await api.get(`/api/fees/student/${student._id}`);
            return {
              ...student,
              fees: feesRes.data.fees || null,
              feeSummary: feesRes.data.feeSummary || null,
            };
          } catch {
            return { ...student, fees: null, feeSummary: null };
          }
        })
      );

      setStudents(studentsWithFees);
    } catch (err) {
      console.error(err);
      showToast("error", err?.response?.data?.message || "Error fetching students");
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectStudent = async (student) => {
    setSelectedStudent({ ...student, fees: student.fees || {}, feeSummary: student.feeSummary || {} });

    try {
      const res = await api.get(`/api/fees/student/${student._id}`);
      const feesData =
        res.data.fees || {
          totalFees: 0,
          paidAmount: 0,
          remainingAmount: 0,
          paymentHistory: [],
        };

      const summaryData = res.data.feeSummary || {
        baseRemaining: Number(feesData.remainingAmount || 0),
        lateFee: Number(feesData.lateFeeAccrued || 0),
        totalDue: Number(feesData.remainingAmount || 0) + Number(feesData.lateFeeAccrued || 0),
      };

      setSelectedStudent({ ...student, fees: feesData, feeSummary: summaryData });

      // reset forms
      setPaymentAmount("");
      setPaymentMode("Cash");
      setUtr("");
      // auto tab
      setActiveTab(Number(summaryData.totalDue || 0) <= 0 ? "history" : "pay");
    } catch (err) {
      console.error(err);
      showToast("error", err?.response?.data?.message || "Error fetching student fees");
    }
  };

  // -------------------
  // Cash / QR manual payment
  // -------------------
  const handleSubmitPayment = async () => {
    if (!selectedStudent?._id) return;

    const amt = Number(paymentAmount);
    if (!amt || amt <= 0) return showToast("error", "Enter a valid payment amount");

    if (amt > totalDue) {
      return showToast("error", `Amount exceeds total due of ${formatMoney(totalDue)}`);
    }

    const isQr = paymentMode === "QR";

    if (isQr) {
      if (!utr.trim() || utr.trim().length < 6) {
        return showToast("error", "Enter valid UTR / Transaction ID");
      }
    }

    try {
      const res = await api.post("/api/fees/payment/cash", {
        studentId: selectedStudent._id,
        amount: amt,
        mode: isQr ? "UPI (QR)" : "Cash",
        transactionId: isQr ? utr.trim() : undefined, 
      });

      const emailInfo = res.data?.emailStatus?.sent
        ? " Receipt email sent."
        : res.data?.emailStatus?.reason
          ? ` Receipt email not sent: ${res.data.emailStatus.reason}.`
          : "";
      showToast("success", `${isQr ? "QR payment recorded." : "Cash payment recorded."}${emailInfo}`);
      handleSelectStudent(selectedStudent); 
    } catch (err) {
      console.error(err);
      showToast("error", err?.response?.data?.message || "Error adding payment");
    }
  };

  // -------------------
  // Reminder
  // -------------------
  const handleSendReminder = async () => {
    if (!selectedStudent?._id) return;
    setSendingReminder(true);
    try {
      const res = await api.post(`/api/fees/reminder/${selectedStudent._id}`, {});
      showToast("success", res.data?.message || "Reminder email sent");
    } catch (err) {
      console.error(err);
      showToast("error", err?.response?.data?.message || "Error sending reminder");
    } finally {
      setSendingReminder(false);
    }
  };

  const handleToggleAutoReminder = async () => {
    if (!selectedClass) return;
    if (!hasScopeConfig) {
      showToast("error", "Class fee config not found for this class/stream");
      return;
    }

    const nextEnabled = !autoReminderEnabled;
    setAutoToggleBusy(true);
    try {
      const payload = {
        className: Number(selectedClass),
        enabled: nextEnabled,
      };
      const streamKey = String(selectedStream || "").trim();
      if (streamKey) payload.stream = streamKey;
      const res = await api.patch("/api/fees/class-fee/auto-reminder", payload);

      setClassFeeRows((prev) =>
        prev.map((row) =>
          String(row.className) === String(selectedClass) &&
          (!streamKey || String(row.stream || "").trim() === streamKey)
            ? { ...row, autoReminderEnabled: nextEnabled }
            : row
        )
      );
      showToast("success", res.data?.message || "Auto reminder setting updated");
    } catch (err) {
      console.error(err);
      showToast("error", err?.response?.data?.message || "Error updating auto reminder setting");
    } finally {
      setAutoToggleBusy(false);
    }
  };

  return (
    <div className="container-fluid py-4 min-vh-100" style={{ backgroundColor: "#f8fafc", fontFamily: "'Inter', sans-serif" }}>
      
      {/* Premium Custom CSS */}
      <style>{`
        .premium-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); transition: all 0.2s; }
        .premium-card:hover { transform: translateY(-2px); box-shadow: 0 12px 24px -8px rgba(79, 70, 229, 0.15); border-color: rgba(79, 70, 229, 0.3); }
        
        .input-premium { background: #ffffff; border: 1px solid transparent; border-radius: 10px; padding: 10px 16px; font-weight: 600; color: #0f172a; transition: all 0.2s; }
        .input-premium:focus { box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.2); outline: none; }
        
        .btn-brand { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); border: none; color: white; transition: all 0.2s; font-weight: 600; }
        .btn-brand:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(79, 70, 229, 0.3); color: white; }
        .btn-brand:disabled { opacity: 0.7; transform: none; box-shadow: none; cursor: not-allowed; }
        
        .table-premium th { text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.5px; color: #64748b; font-weight: 700; border-bottom: 2px solid #e2e8f0; padding: 16px; background: #f8fafc; }
        .table-premium td { padding: 16px; vertical-align: middle; border-bottom: 1px solid #f1f5f9; transition: background-color 0.2s; }
        .table-premium tr:hover td { background-color: #f8fafc; cursor: pointer; }
        
        .segmented-control { background: #f1f5f9; padding: 4px; border-radius: 12px; display: inline-flex; border: 1px solid #e2e8f0; width: 100%; }
        .segmented-btn { flex: 1; border: none; background: transparent; padding: 10px 0; border-radius: 8px; font-weight: 600; font-size: 0.85rem; transition: all 0.2s; color: #64748b; }
        .segmented-btn.active { background: #ffffff; color: #4f46e5; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        .segmented-btn:hover:not(.active) { color: #0f172a; }

        .premium-toast { background: rgba(15, 23, 42, 0.9); backdrop-filter: blur(10px); color: white; border-radius: 50rem; box-shadow: 0 10px 25px rgba(0,0,0,0.15); transition: opacity 0.3s, transform 0.3s; }
        .premium-toast.bg-danger { background: rgba(225, 29, 72, 0.9) !important; }
        
        .form-switch .form-check-input { width: 3em; height: 1.5em; cursor: pointer; transition: background-color 0.2s ease-in-out, border-color 0.2s ease-in-out; }
        .form-switch .form-check-input:checked { background-color: #4f46e5; border-color: #4f46e5; }
        .form-switch .form-check-input:focus { box-shadow: 0 0 0 0.25rem rgba(79, 70, 229, 0.25); }

        .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* Floating Toast Notification */}
      <div className="toast-container position-fixed top-0 end-0 p-4 mt-2" style={{ zIndex: 1200 }}>
        <div className={`toast premium-toast border-0 ${message.text ? 'show' : 'hide'} ${message.type === 'error' ? 'bg-danger' : ''}`} role="alert">
          <div className="d-flex align-items-center px-4 py-3">
            <i className={`bi ${message.type === 'success' ? 'bi-check-circle-fill text-success' : 'bi-exclamation-triangle-fill text-warning'} fs-5 me-3`}></i>
            <div className="fw-medium me-4">{message.text}</div>
            <button type="button" className="btn-close btn-close-white ms-auto" onClick={() => setMessage({ type: "", text: "" })}></button>
          </div>
        </div>
      </div>

      <div className="container" style={{ maxWidth: "1400px" }}>
        
        {/* Premium Header Card */}
        <div 
          className="rounded-4 overflow-hidden mb-4 shadow-sm border-0 position-relative p-4 p-md-5"
          style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)" }}
        >
          <div style={{ position: 'absolute', top: '-50%', right: '-5%', width: '300px', height: '300px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}></div>
          
          <div className="position-relative z-1 d-flex flex-column flex-xl-row justify-content-between align-items-xl-center gap-4">
            <div>
              <span className="badge px-3 py-2 rounded-pill fw-semibold mb-3" style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.3)', color: 'white' }}>
                <i className="bi bi-wallet2 me-1"></i> Financial Operations
              </span>
              <h2 className="display-6 fw-bolder text-white mb-1" style={{ letterSpacing: '-1px' }}>Fees Collection</h2>
              <p className="text-white opacity-75 fw-medium mb-0">Record payments, manage outstanding dues, and issue receipts.</p>
            </div>
            
            {/* Glassmorphism Control Panel */}
            <div className="d-flex flex-column flex-sm-row gap-3 p-3 rounded-4 shadow-sm" style={{ background: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.3)' }}>
              <div className="d-flex align-items-center gap-2 flex-grow-1">
                <select
                  className="form-select input-premium py-2 bg-transparent text-white border-0 shadow-none"
                  style={{ minWidth: "140px" }}
                  value={selectedClass}
                  onChange={(e) => {
                    const cls = e.target.value;
                    setSelectedClass(cls);
                    setSelectedStream("");
                    if (!cls) {
                      setStudents([]);
                      setSelectedStudent(null);
                      return;
                    }
                    loadStudents(cls, "");
                  }}
                >
                  <option value="" className="text-dark">Select Class...</option>
                  {classes.map((c) => (
                    <option key={c.className} value={c.className} className="text-dark">Class {c.className}</option>
                  ))}
                </select>

                <div className="vr text-white opacity-25 d-none d-sm-block"></div>

                <select
                  className="form-select input-premium py-2 bg-transparent text-white border-0 shadow-none"
                  style={{ minWidth: "140px" }}
                  value={selectedStream}
                  disabled={!selectedClass || streamOptions.length === 0}
                  onChange={(e) => {
                    const stream = e.target.value;
                    setSelectedStream(stream);
                    if (selectedClass) loadStudents(selectedClass, stream);
                  }}
                >
                  <option value="" className="text-dark">All Streams</option>
                  {streamOptions.map((s) => (
                    <option key={s} value={s} className="text-dark">{s}</option>
                  ))}
                </select>
              </div>

              <div className="d-flex align-items-center bg-white bg-opacity-25 rounded-3 px-3 py-2 ms-sm-2" style={{ minWidth: '220px' }}>
                <div className="d-flex flex-column flex-grow-1 pe-3 border-end border-white border-opacity-25">
                  <span className="small fw-bold text-white text-uppercase" style={{ fontSize: '0.65rem', letterSpacing: '0.5px' }}>Auto Reminders</span>
                  <span className="text-white fw-medium lh-1" style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                    {!selectedClass ? "Select class" : hasScopeConfig ? "Active Schedule" : "Not configured"}
                  </span>
                </div>
                <div className="form-check form-switch m-0 ms-3 d-flex align-items-center">
                  <input
                    className="form-check-input shadow-none m-0"
                    type="checkbox"
                    role="switch"
                    checked={autoReminderEnabled}
                    disabled={!selectedClass || !hasScopeConfig || autoToggleBusy}
                    onChange={handleToggleAutoReminder}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* VIEW 1: STUDENT LIST */}
        {!selectedStudent && (
          <div className="premium-card overflow-hidden animate-fade-in">
            {loading ? (
              <div className="d-flex flex-column align-items-center justify-content-center py-5 my-5">
                <div className="spinner-border" style={{ color: '#4f46e5', width: '3rem', height: '3rem' }} role="status"></div>
                <p className="mt-3 text-muted fw-medium">Loading Student Accounts...</p>
              </div>
            ) : selectedClass && students.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-premium align-middle mb-0 w-100">
                  <thead>
                    <tr>
                      <th className="ps-4">Student Profile</th>
                      <th>Identifier</th>
                      <th className="text-end">Total Due</th>
                      <th className="text-end">Paid Amount</th>
                      <th className="text-end">Pending Balance</th>
                      <th className="text-center">Status</th>
                      <th className="text-center pe-4">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s) => {
                      const balance = Number(s.feeSummary?.totalDue ?? ((s.fees?.remainingAmount || 0) + (s.fees?.lateFeeAccrued || 0)));
                      const paidOk = balance <= 0;
                      
                      return (
                        <tr key={s._id} onClick={() => handleSelectStudent(s)} style={{ cursor: 'pointer' }}>
                          <td className="ps-4">
                            <div className="d-flex align-items-center gap-3">
                              <div className={`rounded-circle d-flex align-items-center justify-content-center fw-bolder shadow-sm border ${paidOk ? "bg-success bg-opacity-10 text-success" : "bg-primary bg-opacity-10 text-primary"}`} style={{ width: 44, height: 44, fontSize: '1.2rem' }}>
                                {(s.name || "S").charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="fw-bolder text-dark lh-sm mb-1">{s.name}</div>
                                {s.stream && <div className="small text-muted fw-medium" style={{ fontSize: '0.75rem' }}>{s.stream} Stream</div>}
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="fw-bold text-secondary font-monospace bg-light px-2 py-1 rounded border">
                              {s.studentId || "---"}
                            </span>
                          </td>
                          <td className="text-end text-muted fw-bold">{formatMoney(s.fees?.totalFees)}</td>
                          <td className="text-end text-success fw-bolder">{formatMoney(s.fees?.paidAmount)}</td>
                          <td className="text-end text-danger fw-bolder">{formatMoney(balance)}</td>
                          <td className="text-center">
                            {paidOk ? (
                              <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-3 py-2 rounded-pill fw-bold">Fully Paid</span>
                            ) : (
                              <span className="badge bg-warning bg-opacity-10 text-warning-emphasis border border-warning border-opacity-50 px-3 py-2 rounded-pill fw-bold">Pending</span>
                            )}
                          </td>
                          <td className="text-center pe-4">
                            <button className={`btn btn-sm fw-bold rounded-pill px-3 shadow-sm ${paidOk ? "bg-light border text-muted" : "btn-brand"}`} onClick={(e) => { e.stopPropagation(); handleSelectStudent(s); }}>
                              {paidOk ? "View" : "Pay Now"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-5 my-5">
                <div className="rounded-circle bg-light shadow-sm d-inline-flex align-items-center justify-content-center mb-4" style={{ width: 80, height: 80 }}>
                  <i className="bi bi-inbox text-muted opacity-50 fs-1"></i>
                </div>
                <h4 className="fw-bolder text-dark mb-2">No Students Found</h4>
                <p className="text-muted fw-medium">
                  {selectedClass ? "There are no students registered in this class." : "Please select a class from the top menu to view accounts."}
                </p>
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: SELECTED STUDENT DETAIL */}
        {selectedStudent && (
          <div className="row g-4 animate-fade-in">
            
            {/* LEFT COL: Student Summary Card */}
            <div className="col-12 col-lg-5 col-xl-4">
              <button className="btn bg-light border text-muted fw-bold rounded-pill px-4 mb-4 shadow-sm transition-all" onClick={() => setSelectedStudent(null)}>
                <i className="bi bi-arrow-left me-2"></i> Back to Roster
              </button>

              <div className="premium-card p-4 p-md-5 text-center h-100 d-flex flex-column">
                <div className="position-relative d-inline-block mx-auto mb-4">
                  <div className={`rounded-circle d-flex align-items-center justify-content-center border border-4 border-white shadow ${isFullyPaid ? "bg-success" : "bg-primary"}`} style={{ width: 100, height: 100 }}>
                    {isFullyPaid ? <i className="bi bi-check-lg text-white display-4"></i> : <span className="text-white display-4 fw-bold">{selectedStudent.name.charAt(0).toUpperCase()}</span>}
                  </div>
                </div>
                
                <h4 className="fw-bolder text-dark mb-1">{selectedStudent.name}</h4>
                <p className="text-muted small fw-medium mb-4">
                  Class {selectedStudent.studentClass}{selectedStudent.stream ? ` (${selectedStudent.stream})` : ""} &bull; ID: {selectedStudent.studentId || "N/A"}
                </p>

                <div className={`rounded-4 p-4 mb-4 ${isFullyPaid ? "bg-success bg-opacity-10 border border-success border-opacity-25" : "bg-primary bg-opacity-10 border border-primary border-opacity-25"}`}>
                  <span className={`small fw-bold text-uppercase d-block mb-1 ${isFullyPaid ? "text-success" : "text-primary"}`} style={{ letterSpacing: '0.5px' }}>Current Balance</span>
                  <h2 className={`fw-bolder m-0 ${isFullyPaid ? "text-success" : "text-primary"}`}>{formatMoney(totalDue)}</h2>
                  {isFullyPaid && <div className="badge bg-success text-white mt-2 px-3 py-1 rounded-pill"><i className="bi bi-check-circle-fill me-1"></i> All Clear</div>}
                </div>

                <div className="mt-auto border-top pt-4 text-start" style={{ borderColor: '#f1f5f9' }}>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="text-muted small fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>Total Assessment</span>
                    <span className="fw-bolder text-dark">{formatMoney(selectedStudent.fees.totalFees)}</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="text-muted small fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>Paid So Far</span>
                    <span className="fw-bolder text-success">{formatMoney(selectedStudent.fees.paidAmount)}</span>
                  </div>
                  
                  {!isFullyPaid && (
                    <>
                      <hr className="border-secondary opacity-10 my-3" />
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="text-muted small fw-medium">Base Pending</span>
                        <span className="fw-bold text-dark">{formatMoney(baseRemaining)}</span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="text-muted small fw-medium">Accrued Late Fee</span>
                        <span className="fw-bold text-danger">{formatMoney(lateFeeAmount)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT COL: Action Console */}
            <div className="col-12 col-lg-7 col-xl-8">
              <div className="premium-card h-100 d-flex flex-column overflow-hidden">
                
                <div className="p-4 border-bottom bg-light bg-opacity-50" style={{ borderColor: '#e2e8f0' }}>
                  <div className="segmented-control">
                    <button className={`segmented-btn ${activeTab === "pay" ? "active" : ""}`} onClick={() => setActiveTab("pay")}>
                      <i className="bi bi-cash-coin me-2"></i> Payment Console
                    </button>
                    <button className={`segmented-btn ${activeTab === "history" ? "active" : ""}`} onClick={() => setActiveTab("history")}>
                      <i className="bi bi-clock-history me-2"></i> Ledger
                    </button>
                    <button className={`segmented-btn ${activeTab === "reminder" ? "active" : ""}`} onClick={() => setActiveTab("reminder")}>
                      <i className="bi bi-bell me-2"></i> Reminders
                    </button>
                  </div>
                </div>

                <div className="p-4 p-md-5 flex-grow-1 bg-white custom-scroll">
                  
                  {/* TAB 1: MAKE PAYMENT */}
                  {activeTab === "pay" && (
                    <div className="animate-fade-in">
                      {isFullyPaid ? (
                        <div className="text-center py-5">
                          <div className="rounded-circle bg-success bg-opacity-10 d-inline-flex align-items-center justify-content-center mb-4" style={{ width: 80, height: 80 }}>
                            <i className="bi bi-check-circle-fill text-success display-4"></i>
                          </div>
                          <h4 className="fw-bolder text-dark mb-2">Account Settled</h4>
                          <p className="text-muted fw-medium mb-4">There are no outstanding balances for this student.</p>
                          <button className="btn bg-light border text-muted fw-bold rounded-pill px-4 shadow-sm" onClick={() => setActiveTab("history")}>
                            View Transaction History
                          </button>
                        </div>
                      ) : (
                        <>
                          <h5 className="fw-bolder text-dark mb-4 border-bottom pb-3">Record New Transaction</h5>

                          <div className="row g-4 mb-4">
                            <div className="col-12 col-md-6">
                              <label className="form-label small fw-bold text-muted text-uppercase mb-2" style={{ letterSpacing: '0.5px' }}>Transaction Amount</label>
                              <div className="input-group">
                                <span className="input-group-text bg-light border border-end-0 text-muted fw-bold" style={{ borderRadius: '10px 0 0 10px' }}>₹</span>
                                <input
                                  type="number"
                                  className="form-control py-3 fw-bolder fs-5 text-primary border-start-0"
                                  style={{ borderRadius: '0 10px 10px 0', borderColor: '#dee2e6' }}
                                  placeholder="0.00"
                                  value={paymentAmount}
                                  onChange={(e) => setPaymentAmount(e.target.value)}
                                />
                              </div>
                            </div>

                            <div className="col-12 col-md-6">
                              <label className="form-label small fw-bold text-muted text-uppercase mb-2" style={{ letterSpacing: '0.5px' }}>Payment Method</label>
                              <select
                                className="form-select py-3 fw-semibold bg-light"
                                style={{ borderRadius: '10px', border: '1px solid #dee2e6' }}
                                value={paymentMode}
                                onChange={(e) => {
                                  setPaymentMode(e.target.value);
                                  setUtr("");
                                }}
                              >
                                <option value="Cash">Cash Deposit</option>
                                <option value="QR">UPI / QR Transfer</option>
                              </select>
                            </div>
                          </div>

                          {/* QR PANEL */}
                          {paymentMode === "QR" && (
                            <div className="bg-light p-4 rounded-4 border mb-4 animate-fade-in">
                              <div className="row g-4 align-items-center">
                                <div className="col-12 col-md-5 text-center border-end-md">
                                  <div className="bg-white p-3 rounded-4 shadow-sm d-inline-block border">
                                    <QRCode value={upiQrValue} size={160} />
                                  </div>
                                  <div className="small fw-bold text-muted mt-3 text-uppercase" style={{ letterSpacing: '0.5px' }}>Scan to Pay</div>
                                </div>

                                <div className="col-12 col-md-7 ps-md-4">
                                  <div className="mb-3">
                                    <div className="small text-muted fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>Payee Details</div>
                                    <div className="fw-bolder text-dark fs-5">{PAYEE_NAME}</div>
                                    <div className="text-secondary font-monospace small">{UPI_VPA}</div>
                                  </div>

                                  <div>
                                    <label className="form-label small fw-bold text-muted text-uppercase mb-2" style={{ letterSpacing: '0.5px' }}>
                                      Reference / UTR Number <span className="text-danger">*</span>
                                    </label>
                                    <input
                                      className="form-control py-2 fw-medium"
                                      style={{ borderRadius: '8px', border: '1px solid #cbd5e1' }}
                                      placeholder="e.g. 321654987123"
                                      value={utr}
                                      onChange={(e) => setUtr(e.target.value)}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          <button className="btn btn-brand btn-lg w-100 rounded-pill shadow-sm fw-bold mt-2" onClick={handleSubmitPayment} disabled={!paymentAmount}>
                            {paymentMode === "QR" ? "Verify & Record UPI Payment" : "Record Cash Transaction"}
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {/* TAB 2: HISTORY */}
                  {activeTab === "history" && (
                    <div className="animate-fade-in">
                      <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
                        <h5 className="fw-bolder text-dark mb-0">Financial Ledger</h5>
                        <span className="badge bg-light text-dark border rounded-pill px-3 py-1">
                          {selectedStudent?.fees?.paymentHistory?.length || 0} Transactions
                        </span>
                      </div>
                      
                      {selectedStudent?.fees?.paymentHistory?.length > 0 ? (
                        <div className="table-responsive border rounded-4">
                          <table className="table table-hover align-middle mb-0">
                            <thead className="bg-light">
                              <tr>
                                <th className="ps-4 py-3 text-muted small fw-bold text-uppercase" style={{ letterSpacing: '0.5px', borderBottom: 'none' }}>Timestamp</th>
                                <th className="text-muted small fw-bold text-uppercase" style={{ letterSpacing: '0.5px', borderBottom: 'none' }}>Method</th>
                                <th className="text-muted small fw-bold text-uppercase" style={{ letterSpacing: '0.5px', borderBottom: 'none' }}>Reference</th>
                                <th className="text-end pe-4 py-3 text-muted small fw-bold text-uppercase" style={{ letterSpacing: '0.5px', borderBottom: 'none' }}>Amount</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedStudent.fees.paymentHistory.map((p, idx) => (
                                <tr key={p._id || idx}>
                                  <td className="ps-4 py-3">
                                    <div className="fw-bold text-dark">{new Date(p.date).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                                    <div className="small text-muted">{new Date(p.date).toLocaleTimeString("en-IN", { hour: '2-digit', minute:'2-digit' })}</div>
                                  </td>
                                  <td>
                                    <span className="badge bg-light text-secondary border px-2 py-1 fw-semibold">{p.mode}</span>
                                  </td>
                                  <td>
                                    <div className="fw-medium text-dark">{p.receiptNo || "—"}</div>
                                    {p.transactionId && <div className="small text-muted font-monospace text-truncate" style={{ maxWidth: '120px' }}>{p.transactionId}</div>}
                                  </td>
                                  <td className="text-end pe-4 fw-bolder text-success fs-6">
                                    +{formatMoney(p.amount)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-5 bg-light rounded-4 border">
                          <i className="bi bi-clock-history text-muted opacity-50 display-4 d-block mb-3"></i>
                          <h6 className="fw-bolder text-dark mb-1">No Transactions Yet</h6>
                          <p className="text-muted small fw-medium mb-0">Payments recorded will appear in this ledger.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 3: REMINDERS */}
                  {activeTab === "reminder" && (
                    <div className="animate-fade-in">
                      {isFullyPaid ? (
                        <div className="text-center py-5">
                          <div className="rounded-circle bg-success bg-opacity-10 d-inline-flex align-items-center justify-content-center mb-4" style={{ width: 80, height: 80 }}>
                            <i className="bi bi-bell-slash text-success display-4"></i>
                          </div>
                          <h4 className="fw-bolder text-dark mb-2">No Action Required</h4>
                          <p className="text-muted fw-medium mb-0">Account is settled. No reminders need to be sent.</p>
                        </div>
                      ) : (
                        <>
                          <h5 className="fw-bolder text-dark mb-4 border-bottom pb-3">Automated Communications</h5>

                          <div className="bg-light p-4 rounded-4 border mb-4">
                            <div className="d-flex align-items-center mb-3">
                              <i className="bi bi-envelope-paper-fill text-warning fs-4 me-2"></i>
                              <h6 className="fw-bolder text-dark mb-0 text-uppercase" style={{ letterSpacing: '0.5px' }}>Reminder Dispatch</h6>
                            </div>
                            <p className="text-muted small fw-medium mb-4">
                              This action will instantly send an email to the registered guardians detailing the current outstanding balance and instructions for payment.
                            </p>

                            <div className="bg-white p-3 rounded-3 shadow-sm border mb-4">
                              <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
                                <span className="text-muted small fw-bold text-uppercase">Base Pending</span>
                                <span className="fw-bold text-dark">{formatMoney(baseRemaining)}</span>
                              </div>
                              <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
                                <span className="text-muted small fw-bold text-uppercase">Late Penalties</span>
                                <span className="fw-bold text-danger">{formatMoney(lateFeeAmount)}</span>
                              </div>
                              <div className="d-flex justify-content-between align-items-center pt-1">
                                <span className="fw-bolder text-dark">Total Statement</span>
                                <span className="fw-bolder text-primary fs-5">{formatMoney(totalDue)}</span>
                              </div>
                            </div>

                            <button className="btn btn-warning w-100 py-3 rounded-pill fw-bold shadow-sm d-flex justify-content-center align-items-center" onClick={handleSendReminder} disabled={sendingReminder}>
                              {sendingReminder ? (
                                <><span className="spinner-border spinner-border-sm me-2"></span>Dispatching...</>
                              ) : (
                                <><i className="bi bi-send-fill me-2"></i> Dispatch Reminder Notice</>
                              )}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}