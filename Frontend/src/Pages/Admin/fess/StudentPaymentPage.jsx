import React, { useEffect, useMemo, useState } from "react";
import api from "../../../api/api";
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

  // ✅ Set your UPI details (static QR)
  const UPI_VPA = "myschool@upi";
  const PAYEE_NAME = "MySchoolY";

  const showToast = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 4000);
  };

  const formatMoney = (amount) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount || 0);

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

  // ✅ Build UPI QR string (upi://pay?...), includes amount & note
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
      // ✅ correct route from your router: GET /class-fee
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
      // ✅ correct route: GET /students/:className
      const res = await api.get(`/api/fees/students/${cls}`, {
        params: stream ? { stream } : {},
      });
      const allStudents = res.data.students || [];

      // attach fees snapshot
      const studentsWithFees = await Promise.all(
        allStudents.map(async (student) => {
          try {
            // ✅ correct route: GET /student/:studentId
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
      // ✅ correct route: GET /student/:studentId
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

    // ✅ If QR: UTR required
    if (isQr) {
      if (!utr.trim() || utr.trim().length < 6) {
        return showToast("error", "Enter valid UTR / Transaction ID");
      }
    }

    try {
      // ✅ correct route from your router: POST /payment/cash
      const res = await api.post("/api/fees/payment/cash", {
        studentId: selectedStudent._id,
        amount: amt,
        mode: isQr ? "UPI (QR)" : "Cash",
        transactionId: isQr ? utr.trim() : undefined, // needs controller update
      });

      const emailInfo = res.data?.emailStatus?.sent
        ? " Receipt email sent."
        : res.data?.emailStatus?.reason
          ? ` Receipt email not sent: ${res.data.emailStatus.reason}.`
          : "";
      showToast("success", `${isQr ? "QR payment recorded." : "Cash payment recorded."}${emailInfo}`);
      handleSelectStudent(selectedStudent); // refresh
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

  // -------------------
  // UI
  // -------------------
  return (
    <div className="container-fluid bg-light min-vh-100 py-4 px-md-5">
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-5">
        <div>
          <h2 className="fw-bold text-dark mb-1">
            <i className="bi bi-wallet2 text-primary me-2"></i> Fees Management
          </h2>
          <p className="text-muted mb-0 small">Manage student fees, receipts, and reminders.</p>
        </div>

        <div className="bg-white p-2 rounded shadow-sm d-flex align-items-center" style={{ minWidth: "250px" }}>
          <i className="bi bi-funnel text-muted ms-2 me-2"></i>
          <select
            className="form-select border-0 fw-bold text-primary"
            style={{ boxShadow: "none", cursor: "pointer" }}
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
            <option value="">Select Class</option>
            {classes.map((c) => (
              <option key={c.className} value={c.className}>
                {c.className}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-white p-2 rounded shadow-sm d-flex align-items-center ms-2" style={{ minWidth: "220px" }}>
          <i className="bi bi-diagram-3 text-muted ms-2 me-2"></i>
          <select
            className="form-select border-0 fw-bold text-primary"
            style={{ boxShadow: "none", cursor: "pointer" }}
            value={selectedStream}
            disabled={!selectedClass || streamOptions.length === 0}
            onChange={(e) => {
              const stream = e.target.value;
              setSelectedStream(stream);
              if (selectedClass) loadStudents(selectedClass, stream);
            }}
          >
            <option value="">All Streams</option>
            {streamOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-white p-2 rounded shadow-sm d-flex align-items-center ms-2" style={{ minWidth: "300px" }}>
          <i className="bi bi-bell text-muted ms-2 me-2"></i>
          <div className="d-flex align-items-center justify-content-between w-100 pe-2">
            <div>
              <div className="small fw-bold text-dark">Auto Reminder</div>
              <div className="text-muted" style={{ fontSize: "12px" }}>
                {!selectedClass
                  ? "Select class"
                  : hasScopeConfig
                    ? `${selectedStream ? `Stream: ${selectedStream}` : "All Streams"}`
                    : "Config not found"}
              </div>
            </div>
            <div className="form-check form-switch m-0">
              <input
                className="form-check-input"
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

      {/* TOAST */}
      {message.text && (
        <div
          className={`position-fixed top-0 end-0 m-4 p-3 rounded shadow text-white fade show ${
            message.type === "error" ? "bg-danger" : "bg-success"
          }`}
          style={{ zIndex: 1050 }}
        >
          <div className="d-flex align-items-center">
            <i className={`bi ${message.type === "error" ? "bi-exclamation-circle" : "bi-check-circle"} me-2 fs-5`}></i>
            <div>{message.text}</div>
          </div>
        </div>
      )}

      {/* VIEW 1: STUDENT LIST */}
      {!selectedStudent && (
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status"></div>
              <p className="mt-2 text-muted">Fetching student records...</p>
            </div>
          ) : selectedClass && students.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="bg-light text-secondary text-uppercase small">
                  <tr>
                    <th className="py-3 ps-4">Student Name</th>
                    <th className="py-3">Roll / ID</th>
                    <th className="py-3">Stream</th>
                    <th className="py-3 text-end">Total</th>
                    <th className="py-3 text-end">Paid</th>
                    <th className="py-3 text-end">Total Due</th>
                    <th className="py-3 text-center">Status</th>
                    <th className="py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => {
                    const balance = Number(
                      s.feeSummary?.totalDue ??
                        ((s.fees?.remainingAmount || 0) + (s.fees?.lateFeeAccrued || 0))
                    );
                    const paidOk = balance <= 0;
                    return (
                      <tr key={s._id} style={{ cursor: "pointer" }} onClick={() => handleSelectStudent(s)}>
                        <td className="ps-4">
                          <div className="d-flex align-items-center">
                            <div
                              className={`bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-3 ${
                                paidOk ? "bg-success text-success" : "bg-primary text-primary"
                              }`}
                              style={{ width: "40px", height: "40px" }}
                            >
                              <span className="fw-bold">{(s.name || "S").charAt(0)}</span>
                            </div>
                            <span className="fw-semibold text-dark">{s.name}</span>
                          </div>
                        </td>
                        <td className="text-muted small">{s.studentId || "N/A"}</td>
                        <td className="text-muted small">{s.stream || "General"}</td>
                        <td className="text-end text-secondary">{formatMoney(s.fees?.totalFees)}</td>
                        <td className="text-end text-success">{formatMoney(s.fees?.paidAmount)}</td>
                        <td className="text-end fw-bold text-dark">{formatMoney(balance)}</td>
                        <td className="text-center">
                          <span
                            className={`badge rounded-pill px-3 py-2 ${
                              paidOk ? "bg-success bg-opacity-10 text-success" : "bg-danger bg-opacity-10 text-danger"
                            }`}
                          >
                            {paidOk ? "Fully Paid" : "Pending"}
                          </span>
                        </td>
                        <td className="text-center">
                          <button className={`btn btn-sm rounded-pill px-3 ${paidOk ? "btn-outline-success" : "btn-outline-primary"}`}>
                            {paidOk ? <i className="bi bi-eye"></i> : "Pay Now"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-inbox fs-1 d-block mb-3 opacity-25"></i>
              {selectedClass ? "No students found in this class." : "Please select a class from the top right corner."}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: SELECTED STUDENT DETAIL */}
      {selectedStudent && (
        <div className="row g-4">
          {/* LEFT COL: Student Summary Card */}
          <div className="col-lg-4">
            <button className="btn btn-link text-decoration-none text-muted mb-3 ps-0" onClick={() => setSelectedStudent(null)}>
              <i className="bi bi-arrow-left me-1"></i> Back to List
            </button>

            <div className="card border-0 shadow-sm rounded-4 p-4 text-center h-100">
              <div className="mx-auto bg-light rounded-circle d-flex align-items-center justify-content-center mb-3" style={{ width: "80px", height: "80px" }}>
                {isFullyPaid ? <i className="bi bi-patch-check-fill fs-1 text-success"></i> : <i className="bi bi-person fs-1 text-secondary"></i>}
              </div>
              <h4 className="fw-bold mb-1">{selectedStudent.name}</h4>
              <p className="text-muted small mb-4">
                {selectedStudent.studentClass}
                {selectedStudent.stream ? ` | ${selectedStudent.stream}` : ""}
                {" | "}
                Roll: {selectedStudent.studentId || "N/A"}
              </p>

              <div className={`card border-0 rounded-3 p-3 mb-3 ${isFullyPaid ? "bg-success text-white" : "bg-primary text-white"}`}>
                <span className="opacity-75 small">Total Due</span>
                <h2 className="fw-bold my-1">{formatMoney(totalDue)}</h2>
                {isFullyPaid && <small className="opacity-75">All fees cleared!</small>}
              </div>

              <div className="d-flex justify-content-between px-3 mt-2">
                <div className="text-start">
                  <div className="small text-muted">Total Fees</div>
                  <div className="fw-bold text-dark">{formatMoney(selectedStudent.fees.totalFees)}</div>
                </div>
                <div className="text-end">
                  <div className="small text-muted">Paid So Far</div>
                  <div className="fw-bold text-success">{formatMoney(selectedStudent.fees.paidAmount)}</div>
                </div>
              </div>
              {!isFullyPaid && (
                <div className="mt-3 border-top pt-3 text-start">
                  <div className="d-flex justify-content-between small mb-1">
                    <span className="text-muted">Base Pending</span>
                    <span className="fw-semibold">{formatMoney(baseRemaining)}</span>
                  </div>
                  <div className="d-flex justify-content-between small">
                    <span className="text-muted">Late Fee</span>
                    <span className="fw-semibold text-danger">{formatMoney(lateFeeAmount)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COL: Action Tabs */}
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm rounded-4 overflow-hidden h-100">
              <div className="card-header bg-white border-bottom p-0">
                <ul className="nav nav-tabs nav-justified border-0">
                  <li className="nav-item">
                    <button
                      className={`nav-link py-3 rounded-0 border-0 ${
                        activeTab === "pay" ? "active text-primary fw-bold border-bottom border-primary border-3" : "text-muted"
                      }`}
                      onClick={() => setActiveTab("pay")}
                    >
                      <i className="bi bi-cash-coin me-2"></i>New Payment
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      className={`nav-link py-3 rounded-0 border-0 ${
                        activeTab === "history" ? "active text-primary fw-bold border-bottom border-primary border-3" : "text-muted"
                      }`}
                      onClick={() => setActiveTab("history")}
                    >
                      <i className="bi bi-clock-history me-2"></i>History
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      className={`nav-link py-3 rounded-0 border-0 ${
                        activeTab === "reminder" ? "active text-primary fw-bold border-bottom border-primary border-3" : "text-muted"
                      }`}
                      onClick={() => setActiveTab("reminder")}
                    >
                      <i className="bi bi-bell me-2"></i>Reminders
                    </button>
                  </li>
                </ul>
              </div>

              <div className="card-body p-4">
                {/* TAB 1: MAKE PAYMENT */}
                {activeTab === "pay" && (
                  <>
                    {isFullyPaid ? (
                      <div className="text-center py-5">
                        <div className="mb-3">
                          <i className="bi bi-check-circle-fill text-success display-1"></i>
                        </div>
                        <h3 className="fw-bold text-dark">Payment Complete</h3>
                        <p className="text-muted col-md-8 mx-auto">This student has cleared all pending dues.</p>
                        <button className="btn btn-outline-secondary mt-3" onClick={() => setActiveTab("history")}>
                          View Receipt History
                        </button>
                      </div>
                    ) : (
                      <>
                        <h5 className="mb-4">Record New Transaction (Cash / QR)</h5>

                        <div className="row g-3">
                          <div className="col-md-6">
                            <label className="form-label text-muted small">Amount</label>
                            <div className="input-group input-group-lg">
                              <span className="input-group-text bg-light border-end-0">₹</span>
                              <input
                                type="number"
                                className="form-control border-start-0 ps-0"
                                placeholder="0.00"
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(e.target.value)}
                              />
                            </div>
                            <div className="form-text">
                              Total Due: <b>{formatMoney(totalDue)}</b>
                            </div>
                          </div>

                          <div className="col-md-6">
                            <label className="form-label text-muted small">Payment Mode</label>
                            <select
                              className="form-select form-select-lg"
                              value={paymentMode}
                              onChange={(e) => {
                                setPaymentMode(e.target.value);
                                setUtr("");
                              }}
                            >
                              <option value="Cash">Cash</option>
                              <option value="QR">Scan & Pay (UPI QR)</option>
                            </select>
                          </div>

                          {/* QR PANEL */}
                          {paymentMode === "QR" && (
                            <div className="col-12">
                              <div className="border rounded-4 p-3 bg-light">
                                <div className="row g-3 align-items-center">
                                  <div className="col-12 col-md-5 text-center">
                                    <div className="bg-white p-3 rounded-4 shadow-sm d-inline-block">
                                      <QRCode value={upiQrValue} size={160} />
                                    </div>
                                    <div className="small text-muted mt-2">Scan with any UPI app</div>
                                  </div>

                                  <div className="col-12 col-md-7">
                                    <div className="mb-2">
                                      <div className="small text-muted">UPI ID</div>
                                      <div className="fw-bold">{UPI_VPA}</div>
                                    </div>
                                    <div className="mb-2">
                                      <div className="small text-muted">Payee Name</div>
                                      <div className="fw-semibold">{PAYEE_NAME}</div>
                                    </div>

                                    <div className="mt-3">
                                      <label className="form-label text-muted small">
                                        UTR / Transaction ID <span className="text-danger">*</span>
                                      </label>
                                      <input
                                        className="form-control"
                                        placeholder="Example: 321654987123"
                                        value={utr}
                                        onChange={(e) => setUtr(e.target.value)}
                                      />
                                      <div className="form-text">After payment, enter UTR from UPI app.</div>
                                    </div>

                                    <div className="alert alert-warning mt-3 mb-0 small">
                                      QR payment is recorded manually (no auto bank verification).
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="col-12 mt-4">
                            <button className="btn btn-primary btn-lg w-100 rounded-3" onClick={handleSubmitPayment} disabled={!paymentAmount}>
                              {paymentMode === "QR" ? "Confirm QR Payment" : "Confirm Cash Payment"}
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </>
                )}

                {/* TAB 2: HISTORY */}
                {activeTab === "history" && (
                  <>
                    <h5 className="mb-3">Transaction History</h5>
                    {selectedStudent?.fees?.paymentHistory?.length > 0 ? (
                      <div className="table-responsive">
                        <table className="table table-striped table-hover align-middle">
                          <thead>
                            <tr>
                              <th className="text-muted small">Date & Time</th>
                              <th className="text-muted small">Mode</th>
                              <th className="text-muted small">Receipt No</th>
                              <th className="text-muted small">Txn/UTR</th>
                              <th className="text-end text-muted small">Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedStudent.fees.paymentHistory.map((p, idx) => (
                              <tr key={p._id || idx}>
                                <td>{new Date(p.date).toLocaleString("en-IN")}</td>
                                <td>
                                  <span className="badge bg-light text-dark border">{p.mode}</span>
                                </td>
                                <td>{p.receiptNo || "-"}</td>
                                <td className="text-truncate" style={{ maxWidth: 220 }}>
                                  {p.transactionId || "-"}
                                </td>
                                <td className="text-end fw-bold">{formatMoney(p.amount)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center text-muted py-4">No transactions found.</div>
                    )}
                  </>
                )}

                {/* TAB 3: REMINDERS */}
                {activeTab === "reminder" && (
                  <>
                    {isFullyPaid ? (
                      <div className="text-center py-5">
                        <i className="bi bi-emoji-smile text-warning display-4 mb-3"></i>
                        <p className="text-muted">No reminders needed. Fees are fully paid.</p>
                      </div>
                    ) : (
                      <>
                        <h5 className="mb-4">Send Payment Reminder</h5>

                        <div className="bg-light p-3 rounded-3 border mb-3">
                          <div className="d-flex justify-content-between small mb-1">
                            <span className="text-muted">Base Pending</span>
                            <span className="fw-semibold">{formatMoney(baseRemaining)}</span>
                          </div>
                          <div className="d-flex justify-content-between small mb-1">
                            <span className="text-muted">Late Fee</span>
                            <span className="fw-semibold text-danger">{formatMoney(lateFeeAmount)}</span>
                          </div>
                          <div className="d-flex justify-content-between fw-bold">
                            <span>Total Due</span>
                            <span>{formatMoney(totalDue)}</span>
                          </div>
                        </div>

                        <button className="btn btn-warning w-100 py-2 text-dark fw-bold" onClick={handleSendReminder} disabled={sendingReminder}>
                          {sendingReminder ? (
                            <span>
                              <span className="spinner-border spinner-border-sm me-2"></span>Sending...
                            </span>
                          ) : (
                            <span>
                              <i className="bi bi-envelope-paper me-2"></i> Send Reminder Email
                            </span>
                          )}
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

