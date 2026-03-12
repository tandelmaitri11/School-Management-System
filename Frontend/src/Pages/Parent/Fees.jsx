import React, { useEffect, useMemo, useState } from "react";
import api from "../../api/api";

export default function ParentFees() {
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadStudents = async () => {
      try {
        setLoading(true);
        const res = await api.get("/api/parent/students");
        const rows = res.data?.students || [];
        setStudents(rows);
        setSelectedStudentId(rows[0]?.id || "");
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load linked students");
      } finally {
        setLoading(false);
      }
    };
    loadStudents();
  }, []);

  useEffect(() => {
    const loadFees = async () => {
      if (!selectedStudentId) return;
      try {
        setDetailLoading(true);
        const res = await api.get(`/api/parent/student/${selectedStudentId}/fees`);
        setPayload(res.data || null);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load fees");
      } finally {
        setDetailLoading(false);
      }
    };
    loadFees();
  }, [selectedStudentId]);

  const formatMoney = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(amount || 0));

  const history = useMemo(() => payload?.fees?.paymentHistory || [], [payload]);

  if (loading) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center vh-100 bg-light">
        <div className="spinner-border text-primary" role="status" style={{ width: "3rem", height: "3rem" }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <div className="mt-3 text-muted fw-medium">Loading fees data...</div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4 px-md-4 bg-light min-vh-100">
      {/* Header Section */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-4 mb-5">
        <div>
          <h2 className="fw-bold mb-1 text-dark d-flex align-items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="currentColor" className="text-primary" viewBox="0 0 16 16">
              <path d="M1 3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1H1zm7 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/>
              <path d="M0 5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H1a1 1 0 0 1-1-1V5zm3 0a2 2 0 0 1-2 2v4a2 2 0 0 1 2 2h10a2 2 0 0 1 2-2V7a2 2 0 0 1-2-2H3z"/>
            </svg>
            Fees Overview
          </h2>
          <div className="text-secondary fw-medium">Track due amount, paid history, and class fee configuration.</div>
        </div>
        
        <div className="bg-white p-2 rounded-3 shadow-sm border" style={{ minWidth: "300px" }}>
          <label className="form-label small text-muted mb-1 px-1 fw-semibold">Select Child to View</label>
          <select
            className="form-select border-0 shadow-none fw-medium text-dark bg-light"
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
          >
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name} ({student.studentId})
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger shadow-sm border-0 border-start border-danger border-4 rounded-3 d-flex align-items-center gap-3 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-exclamation-circle-fill flex-shrink-0" viewBox="0 0 16 16">
            <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8 4a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4zm.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/>
          </svg>
          <div>{error}</div>
        </div>
      )}

      {!students.length ? (
        <div className="alert alert-warning shadow-sm border-0 border-start border-warning border-4 rounded-3 d-flex align-items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-info-circle-fill flex-shrink-0" viewBox="0 0 16 16">
            <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
          </svg>
          <div>Admin has not linked this parent account to any student yet. Please contact school admin.</div>
        </div>
      ) : detailLoading ? (
        <div className="d-flex justify-content-center align-items-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <span className="ms-3 text-muted fw-medium">Loading fee records...</span>
        </div>
      ) : !payload?.fees ? (
        <div className="alert alert-info shadow-sm border-0 border-start border-info border-4 rounded-3 d-flex align-items-center gap-3">
           <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-info-circle-fill flex-shrink-0" viewBox="0 0 16 16">
            <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
          </svg>
          <div>No fees data available for this student currently.</div>
        </div>
      ) : (
        <>
          {/* KPI Cards Grid */}
          <div className="row g-4 mb-4">
            {/* Total Fees */}
            <div className="col-12 col-md-6 col-xl-3">
              <div className="card border-0 shadow-sm rounded-4 h-100">
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className="text-secondary fw-semibold text-uppercase" style={{ fontSize: "0.75rem", letterSpacing: "0.5px" }}>Total Fees</div>
                    <div className="bg-primary bg-opacity-10 text-primary p-2 rounded-3">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M4 10.781c.148 1.667 1.513 2.85 3.591 3.003V15h1.043v-1.216c2.27-.179 3.678-1.438 3.678-3.3 0-1.59-.947-2.51-2.956-3.028l-.722-.187V3.467c1.122.11 1.879.714 2.07 1.616h1.47c-.166-1.6-1.54-2.748-3.54-2.875V1H7.591v1.233c-1.939.23-3.27 1.472-3.27 3.156 0 1.454.966 2.483 2.661 2.917l.61.162v4.031c-1.149-.17-1.94-.8-2.131-1.718H4zm3.391-3.836c-1.043-.265-1.608-.666-1.608-1.201 0-.596.586-1.039 1.608-1.119v2.32zM8.646 13.3c1.1-.12 1.76-.6 1.76-1.34 0-.61-.5-1.01-1.76-1.34v2.68z"/>
                      </svg>
                    </div>
                  </div>
                  <div className="fw-bold fs-3 text-dark">{formatMoney(payload.fees.totalFees)}</div>
                </div>
              </div>
            </div>

            {/* Paid Amount */}
            <div className="col-12 col-md-6 col-xl-3">
              <div className="card border-0 shadow-sm rounded-4 h-100">
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className="text-secondary fw-semibold text-uppercase" style={{ fontSize: "0.75rem", letterSpacing: "0.5px" }}>Paid Amount</div>
                    <div className="bg-success bg-opacity-10 text-success p-2 rounded-3">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
                      </svg>
                    </div>
                  </div>
                  <div className="fw-bold fs-3 text-success">{formatMoney(payload.fees.paidAmount)}</div>
                </div>
              </div>
            </div>

            {/* Total Due */}
            <div className="col-12 col-md-6 col-xl-3">
              <div className="card border-0 shadow-sm rounded-4 h-100">
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className="text-secondary fw-semibold text-uppercase" style={{ fontSize: "0.75rem", letterSpacing: "0.5px" }}>Total Due</div>
                    <div className="bg-danger bg-opacity-10 text-danger p-2 rounded-3">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                        <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/>
                      </svg>
                    </div>
                  </div>
                  <div className="fw-bold fs-3 text-danger">{formatMoney(payload.feeSummary?.totalDue)}</div>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="col-12 col-md-6 col-xl-3">
              <div className="card border-0 shadow-sm rounded-4 h-100">
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className="text-secondary fw-semibold text-uppercase" style={{ fontSize: "0.75rem", letterSpacing: "0.5px" }}>Fee Status</div>
                    <div className="bg-info bg-opacity-10 text-info p-2 rounded-3">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M8 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm0 1a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0zm0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13zm8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5zM3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8zm10.657-5.657a.5.5 0 0 1 0 .707l-1.414 1.415a.5.5 0 1 1-.707-.708l1.414-1.414a.5.5 0 0 1 .707 0zm-9.9 9.9a.5.5 0 0 1 0 .707l-1.414 1.414a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0zM13.657 13.657a.5.5 0 0 1-.707 0l-1.414-1.414a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707zM3.757 3.757a.5.5 0 0 1-.707 0L1.636 2.343a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707z"/>
                      </svg>
                    </div>
                  </div>
                  <div className={`fw-bold fs-3 ${payload.fees.feeStatus === 'Paid' ? 'text-success' : payload.fees.feeStatus === 'Overdue' ? 'text-danger' : 'text-dark'}`}>
                    {payload.fees.feeStatus || "-"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="row g-4">
            {/* Fee Summary */}
            <div className="col-lg-5">
              <div className="card border-0 shadow-sm rounded-4 h-100">
                <div className="card-body p-4">
                  <h5 className="fw-bold text-dark mb-4 border-bottom pb-3">Fee Summary</h5>
                  <ul className="list-unstyled mb-0">
                    <li className="d-flex justify-content-between align-items-center py-3 border-bottom">
                      <span className="text-secondary fw-medium">Base Remaining</span>
                      <span className="fw-bold text-dark">{formatMoney(payload.feeSummary?.baseRemaining)}</span>
                    </li>
                    <li className="d-flex justify-content-between align-items-center py-3 border-bottom">
                      <span className="text-secondary fw-medium">Late Fee</span>
                      <span className={`fw-bold ${payload.feeSummary?.lateFee > 0 ? 'text-danger' : 'text-dark'}`}>
                        {formatMoney(payload.feeSummary?.lateFee)}
                      </span>
                    </li>
                    <li className="d-flex justify-content-between align-items-center py-3 border-bottom">
                      <span className="text-secondary fw-medium">Due Date</span>
                      <span className="fw-semibold text-dark">
                        {payload.feeSummary?.dueDate ? new Date(payload.feeSummary.dueDate).toLocaleDateString() : "-"}
                      </span>
                    </li>
                    <li className="d-flex justify-content-between align-items-center py-3 border-bottom">
                      <span className="text-secondary fw-medium">Overdue Days</span>
                      <span className={`badge ${payload.feeSummary?.overdueDays > 0 ? 'bg-danger' : 'bg-light text-dark border'} rounded-pill px-3 py-2`}>
                        {payload.feeSummary?.overdueDays || 0} Days
                      </span>
                    </li>
                    <li className="d-flex justify-content-between align-items-center py-3">
                      <span className="text-secondary fw-medium">Configured Total</span>
                      <span className="fw-bold text-dark">{formatMoney(payload.feeConfig?.totalFees || 0)}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Payment History */}
            <div className="col-lg-7">
              <div className="card border-0 shadow-sm rounded-4 h-100">
                <div className="card-body p-4">
                  <h5 className="fw-bold text-dark mb-4 border-bottom pb-3">Payment History</h5>
                  {!history.length ? (
                    <div className="text-center py-5">
                      <div className="text-muted mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" className="opacity-50" viewBox="0 0 16 16">
                          <path d="M14 3a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h12zM2 2a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H2z"/>
                          <path d="M2 5.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-1zm0 3a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5zm3 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5zm3 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5zm3 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5z"/>
                        </svg>
                      </div>
                      <div className="text-muted fw-medium">No payments recorded yet.</div>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th className="text-secondary fw-semibold rounded-start py-3 px-3">Date</th>
                            <th className="text-secondary fw-semibold py-3 px-3">Mode</th>
                            <th className="text-secondary fw-semibold py-3 px-3">Receipt No.</th>
                            <th className="text-secondary fw-semibold rounded-end py-3 px-3">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="border-top-0">
                          {history.map((payment, index) => (
                            <tr key={`${payment.receiptNo || payment._id || index}`}>
                              <td className="px-3 py-3 fw-medium text-dark">
                                {payment.date ? new Date(payment.date).toLocaleDateString() : "-"}
                                <div className="small text-muted">{payment.date ? new Date(payment.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ""}</div>
                              </td>
                              <td className="px-3 py-3 text-muted">
                                <span className="badge bg-light text-dark border px-2 py-1">{payment.mode || "-"}</span>
                              </td>
                              <td className="px-3 py-3 text-muted font-monospace small">{payment.receiptNo || "-"}</td>
                              <td className="px-3 py-3 fw-bold text-success">{formatMoney(payment.amount || 0)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
          </div>
        </>
      )}
    </div>
  );
}