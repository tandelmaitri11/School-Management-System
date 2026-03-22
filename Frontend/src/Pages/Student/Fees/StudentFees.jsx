import React, { useEffect, useMemo, useState } from "react";
import api from "../../../api/api";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

export default function StudentFees() {
  const [fees, setFees] = useState(null);
  const [studentMeta, setStudentMeta] = useState(null);
  const [feeConfig, setFeeConfig] = useState(null);
  const [feeSummary, setFeeSummary] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  // Payment UI
  const [payMode, setPayMode] = useState("full"); // "full" | "custom"
  const [payAmount, setPayAmount] = useState("");
  const [paying, setPaying] = useState(false);

  const studentMongoId = localStorage.getItem("studentId");
  const formatMoney = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(amount || 0));

  const baseRemaining = useMemo(
    () => Number(feeSummary?.baseRemaining ?? fees?.remainingAmount ?? 0),
    [feeSummary, fees]
  );
  const lateFee = useMemo(
    () => Number(feeSummary?.lateFee ?? fees?.lateFeeAccrued ?? 0),
    [feeSummary, fees]
  );
  const totalDue = useMemo(
    () => Number(feeSummary?.totalDue ?? (baseRemaining + lateFee)),
    [feeSummary, baseRemaining, lateFee]
  );
  const isPaid = useMemo(() => totalDue <= 0, [totalDue]);
  const total = useMemo(() => Number(fees?.totalFees || 0), [fees]);
  const paid = useMemo(() => Number(fees?.paidAmount || 0), [fees]);

  // --- API LOGIC (UNCHANGED) ---
  const loadFees = async () => {
    try {
      setLoading(true);
      setMessage("");
      const res = await api.get(`/api/fees/student/${studentMongoId}`);
      setFees(res.data.fees);
      setStudentMeta(res.data.studentMeta || null);
      setFeeConfig(res.data.feeConfig || null);
      setFeeSummary(res.data.feeSummary || null);
    } catch (err) {
      setMessage(err?.response?.data?.message || "No fees found");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (studentMongoId) loadFees();
    else setMessage("Student not logged in");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentMongoId]);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);

      if (document.getElementById("razorpay-script")) {
        const check = setInterval(() => {
          if (window.Razorpay) {
            clearInterval(check);
            resolve(true);
          }
        }, 100);

        setTimeout(() => {
          clearInterval(check);
          resolve(!!window.Razorpay);
        }, 4000);
        return;
      }

      const script = document.createElement("script");
      script.id = "razorpay-script";
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const downloadReceipt = async (paymentId) => {
    try {
      if (!fees?._id) return setMessage("Fees record not found.");
      if (!paymentId) return setMessage("Select a payment to download receipt.");

      setMessage("");
      const res = await api.get(`/api/fees/receipt/${fees._id}/${paymentId}`, {
        responseType: "blob",
      });

      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `Receipt_${paymentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setMessage(err?.response?.data?.message || "Receipt download failed");
    }
  };

  const lastPayment = useMemo(() => {
    const list = fees?.paymentHistory || [];
    return list.length ? list[list.length - 1] : null;
  }, [fees]);

  const formatDateTime = (d) => {
    try {
      return new Date(d).toLocaleString("en-IN", {
         day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    } catch {
      return "-";
    }
  };

  const calculatedPayAmount = useMemo(() => {
    if (!fees) return 0;
    if (payMode === "full") return totalDue;
    const num = Number(payAmount);
    return Number.isFinite(num) ? num : 0;
  }, [fees, payMode, payAmount, totalDue]);

  const setQuickPay = (ratio) => {
    if (!fees || totalDue <= 0) return;
    const amt = Math.max(1, Math.round(totalDue * ratio));
    setPayMode("custom");
    setPayAmount(String(amt));
  };

  const payOnline = async () => {
    if (!fees) return;
    if (totalDue <= 0) {
      setMessage("Fees already paid.");
      return;
    }
    const entered = calculatedPayAmount;
    if (!entered || entered <= 0) {
      setMessage("Enter a valid amount.");
      return;
    }
    if (entered > totalDue) {
      setMessage(`Amount cannot be more than total due (${formatMoney(totalDue)}).`);
      return;
    }

    setPaying(true);
    setMessage("");

    try {
      const ok = await loadRazorpayScript();
      if (!ok) {
        setMessage("Razorpay SDK failed to load. Check internet.");
        setPaying(false);
        return;
      }

      const createRes = await api.post("/api/fees/razorpay/create-order", {
        studentId: studentMongoId,
        payAmount: entered,
      });

      if (!createRes.data?.success) {
        setMessage(createRes.data?.message || "Unable to create order");
        setPaying(false);
        return;
      }

      const { order, key, student } = createRes.data;

      const options = {
        key,
        amount: order.amount,
        currency: order.currency,
        name: "MySchoolY",
        description: "School Fees Payment",
        order_id: order.id,
        prefill: {
          name: fees.studentName || "",
          email: student?.email || "",
          contact: student?.phone || "",
        },
        handler: async (response) => {
          try {
            const verifyPayload = {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            };

            const verifyRes = await api.post("/api/fees/razorpay/verify", verifyPayload);

            if (verifyRes.data?.success) {
              const emailInfo = verifyRes.data?.emailStatus?.sent
                ? " Receipt email sent."
                : verifyRes.data?.emailStatus?.reason
                  ? ` Receipt email not sent: ${verifyRes.data.emailStatus.reason}.`
                  : "";
              setMessage(`Online payment successful!${emailInfo}`);
              await loadFees();

              setPayAmount("");
              setPayMode("full");
            } else {
              setMessage(verifyRes.data?.message || "Payment verification failed");
            }
          } catch (err) {
            console.error(err);
            setMessage(err?.response?.data?.message || "Verification failed");
          } finally {
            setPaying(false);
          }
        },
        modal: {
          ondismiss: () => {
            setMessage("Payment popup closed.");
            setPaying(false);
          },
        },
        theme: { color: "#000000" }, // Updated to sleek black
      };

      const rzp = new window.Razorpay(options);

      rzp.on("payment.failed", function (resp) {
        setMessage(resp?.error?.description || "Payment failed");
        setPaying(false);
      });

      rzp.open();
    } catch (err) {
      console.error(err);
      setMessage(err?.response?.data?.message || "Error starting online payment");
      setPaying(false);
    }
  };
  // --- END API LOGIC ---

  if (message && !fees && !loading) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center min-vh-100 bg-light">
        <i className="bi bi-wallet2 text-muted mb-3 opacity-50" style={{ fontSize: "4rem" }}></i>
        <h5 className="fw-semibold text-muted">{message}</h5>
      </div>
    );
  }

  if (loading || !fees) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center min-vh-100 bg-light">
        <div className="spinner-border text-dark mb-3" style={{ width: "2.5rem", height: "2.5rem", borderWidth: "3px" }}></div>
        <div className="text-muted fw-medium text-uppercase tracking-wider small">Fetching Financial Data...</div>
      </div>
    );
  }

  return (
    <div className="bg-light min-vh-100 py-4 py-md-5" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div className="container-fluid px-3 px-md-5">
        
        {/* ---------- PAGE HEADER ---------- */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end mb-4 pb-4 border-bottom border-light-subtle gap-3">
          <div>
            <span className="badge bg-dark bg-opacity-10 text-dark mb-2 px-3 py-2 rounded-pill fw-bold border border-dark border-opacity-25" style={{ letterSpacing: "0.5px" }}>
              <i className="bi bi-bank me-2"></i>Financial Center
            </span>
            <h2 className="fw-bolder text-dark mb-1" style={{ letterSpacing: "-0.5px" }}>
              Tuition & Fees
            </h2>
            <p className="text-secondary mb-0 small">
              Manage your academic payments, view transaction history, and download official receipts.
            </p>
          </div>
          
          <div>
            {isPaid ? (
               <div className="d-flex align-items-center gap-2 bg-success bg-opacity-10 text-success px-4 py-2 rounded-pill fw-bold border border-success border-opacity-25 shadow-sm">
                  <i className="bi bi-check-circle-fill fs-5"></i>
                  Account Up to Date
               </div>
            ) : (
               <div className="d-flex align-items-center gap-2 bg-danger bg-opacity-10 text-danger px-4 py-2 rounded-pill fw-bold border border-danger border-opacity-25 shadow-sm">
                  <i className="bi bi-exclamation-circle-fill fs-5"></i>
                  Payment Due
               </div>
            )}
          </div>
        </div>

        {/* Global Message Alert */}
        {message && (
          <div className="alert alert-dark bg-white border border-dark shadow-sm d-flex align-items-center mb-4 rounded-4" role="alert">
            <i className="bi bi-info-circle-fill fs-5 me-3 text-dark"></i>
            <span className="fw-medium">{message}</span>
            <button type="button" className="btn-close ms-auto" aria-label="Close" onClick={() => setMessage("")}></button>
          </div>
        )}

        <div className="row g-4">
          
          {/* ---------- LEFT COLUMN: STATS & HISTORY ---------- */}
          <div className="col-12 col-xl-8 d-flex flex-column gap-4">
            
            {/* High-Level Overview Grid */}
            <div className="row g-4">
               {/* Total Assessment */}
               <div className="col-md-4">
                  <div className="card h-100 border-0 shadow-sm rounded-4 bg-white transition-hover">
                     <div className="card-body p-4">
                        <div className="text-muted text-uppercase fw-bold mb-3 tracking-wider" style={{ fontSize: "0.7rem" }}>Annual Assessment</div>
                        <h3 className="fw-bolder text-dark mb-1">{formatMoney(total)}</h3>
                        <div className="text-muted small mt-2 d-flex flex-column gap-1 border-top pt-3">
                           <span className="d-flex align-items-center gap-2"><i className="bi bi-building"></i> Class {studentMeta?.studentClass ?? fees.studentClass} {studentMeta?.section ? `(Sec ${studentMeta.section})` : ""}</span>
                           <span className="d-flex align-items-center gap-2"><i className="bi bi-book"></i> {studentMeta?.stream || "General"} Plan</span>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Amount Paid */}
               <div className="col-md-4">
                  <div className="card h-100 border-0 shadow-sm rounded-4 bg-white transition-hover">
                     <div className="card-body p-4 d-flex flex-column">
                        <div className="text-muted text-uppercase fw-bold mb-3 tracking-wider" style={{ fontSize: "0.7rem" }}>Total Remitted</div>
                        <h3 className="fw-bolder text-success mb-1">{formatMoney(paid)}</h3>
                        <div className="text-success small fw-medium mt-auto bg-success bg-opacity-10 px-2 py-1 rounded d-inline-block w-auto align-self-start border border-success border-opacity-25">
                           <i className="bi bi-arrow-up-right me-1"></i> Recorded to date
                        </div>
                     </div>
                  </div>
               </div>

               {/* Outstanding Balance */}
               <div className="col-md-4">
                  <div className={`card h-100 shadow-sm rounded-4 transition-hover ${isPaid ? 'border-0 bg-white' : 'border border-dark bg-white'}`}>
                     <div className="card-body p-4 d-flex flex-column">
                        <div className="text-muted text-uppercase fw-bold mb-3 tracking-wider d-flex justify-content-between" style={{ fontSize: "0.7rem" }}>
                           Outstanding Balance
                           {!isPaid && <i className="bi bi-exclamation-triangle text-danger fs-6 lh-1"></i>}
                        </div>
                        <h3 className={`fw-bolder mb-1 ${isPaid ? "text-success" : "text-dark"}`}>
                           {formatMoney(totalDue)}
                        </h3>
                        {/* Breakout pills */}
                        <div className="d-flex gap-2 mt-auto">
                           <span className="badge bg-light text-dark border px-2 py-1 fw-medium" title="Base Pending">
                              Base: {formatMoney(baseRemaining)}
                           </span>
                           {lateFee > 0 && (
                              <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 px-2 py-1 fw-medium" title="Late Fee Penalty">
                                 Late: {formatMoney(lateFee)}
                              </span>
                           )}
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            {/* Payment History Table */}
            <div className="card border-0 shadow-sm rounded-4 bg-white overflow-hidden flex-grow-1">
              <div className="card-header bg-white border-bottom p-4 d-flex justify-content-between align-items-center">
                 <div>
                    <h5 className="fw-bold mb-1">Transaction Ledger</h5>
                    <span className="text-muted small fw-medium">{(fees.paymentHistory || []).length} recorded payments</span>
                 </div>
                 {lastPayment?._id && (
                    <button className="btn btn-outline-dark btn-sm rounded-pill px-3 fw-bold shadow-sm d-none d-sm-block" onClick={() => downloadReceipt(lastPayment._id)}>
                       <i className="bi bi-printer me-2"></i>Latest Receipt
                    </button>
                 )}
              </div>

              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0 custom-table">
                  <thead className="bg-light">
                    <tr>
                      <th className="py-3 ps-4 text-muted text-uppercase fw-bold tracking-wider border-bottom-0" style={{ fontSize: "0.7rem" }}>Ref #</th>
                      <th className="py-3 text-muted text-uppercase fw-bold tracking-wider border-bottom-0" style={{ fontSize: "0.7rem" }}>Date & Time</th>
                      <th className="py-3 text-muted text-uppercase fw-bold tracking-wider border-bottom-0" style={{ fontSize: "0.7rem" }}>Method</th>
                      <th className="py-3 text-muted text-uppercase fw-bold tracking-wider border-bottom-0" style={{ fontSize: "0.7rem" }}>Amount</th>
                      <th className="py-3 text-end pe-4 text-muted text-uppercase fw-bold tracking-wider border-bottom-0" style={{ fontSize: "0.7rem" }}>Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fees.paymentHistory?.length ? (
                      fees.paymentHistory.map((p, idx) => {
                         const isOnline = String(p.mode).toLowerCase() === "online";
                         return (
                           <tr key={p._id || idx} className="border-bottom border-light-subtle">
                             <td className="ps-4 py-3">
                                <div className="text-dark fw-bold" style={{ fontSize: "0.85rem" }}>{p.receiptNo || `TRX-${idx+1}`}</div>
                                <div className="text-muted small text-truncate" style={{ maxWidth: "120px", fontSize: "0.7rem" }}>
                                   {p.transactionId || p.orderId || "-"}
                                </div>
                             </td>
                             <td className="text-secondary small fw-medium">
                                {formatDateTime(p.date)}
                             </td>
                             <td>
                               <div className="d-flex align-items-center gap-2">
                                  <div className={`rounded-circle d-flex align-items-center justify-content-center ${isOnline ? 'bg-primary text-white' : 'bg-success text-white'}`} style={{ width: "24px", height: "24px", fontSize: "10px" }}>
                                     <i className={`bi ${isOnline ? 'bi-globe' : 'bi-cash'}`}></i>
                                  </div>
                                  <span className="fw-semibold text-dark small">{p.mode}</span>
                               </div>
                             </td>
                             <td className="fw-bolder text-dark">
                                {formatMoney(p.amount)}
                             </td>
                             <td className="text-end pe-4">
                               <button 
                                 className="btn btn-light border btn-sm rounded-circle d-flex align-items-center justify-content-center ms-auto shadow-sm btn-icon-hover" 
                                 style={{ width: "32px", height: "32px" }}
                                 onClick={() => downloadReceipt(p._id)}
                                 title="Download PDF Receipt"
                               >
                                 <i className="bi bi-download text-dark"></i>
                               </button>
                             </td>
                           </tr>
                         )
                      })
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-center text-muted py-5">
                           <i className="bi bi-journal-x fs-1 d-block mb-3 opacity-25"></i>
                           No payment transactions recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="card-footer bg-white p-3 border-top text-center text-muted" style={{ fontSize: "0.75rem" }}>
                 Online transactions are secured by Razorpay. Cash payments are verified by administration.
              </div>
            </div>
          </div>

          {/* ---------- RIGHT COLUMN: PAYMENT PORTAL ---------- */}
          <div className="col-12 col-xl-4">
            <div className="card border border-dark shadow-lg rounded-4 position-sticky bg-white overflow-hidden" style={{ top: 20 }}>
              
              {/* Portal Header */}
              <div className="bg-dark text-white p-4">
                 <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="fw-bold m-0"><i className="bi bi-credit-card-2-front me-2 opacity-75"></i>Payment Portal</h5>
                 </div>
                 <div className="opacity-75 small fw-medium lh-sm" style={{ maxWidth: "90%" }}>
                    Secure online processing via UPI, Credit Card, or Netbanking.
                 </div>
              </div>

              <div className="card-body p-4 bg-white">
                {isPaid ? (
                  <div className="text-center py-4">
                    <div className="bg-success text-white rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3 shadow" style={{ width: "64px", height: "64px" }}>
                       <i className="bi bi-check-lg fs-1"></i>
                    </div>
                    <h5 className="fw-bold text-dark mb-1">All Clear!</h5>
                    <p className="text-muted small mb-0">Your account balance is currently zero.</p>
                  </div>
                ) : (
                  <>
                    {/* Bill Breakdown Box */}
                    <div className="bg-light p-3 rounded-4 border border-light-subtle mb-4">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="text-muted small fw-semibold">Base Tuition Pending</span>
                        <span className="fw-bold text-dark">{formatMoney(baseRemaining)}</span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="text-muted small fw-semibold">Late Penalties</span>
                        <span className="fw-bold text-danger">{formatMoney(lateFee)}</span>
                      </div>
                      <hr className="my-2 border-secondary opacity-10" />
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="text-dark fw-bold">Total Assessment Due</span>
                        <span className="fs-4 fw-bolder text-dark">{formatMoney(totalDue)}</span>
                      </div>
                      {feeSummary?.dueDate && (
                         <div className="text-end mt-1 text-danger fw-bold" style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                            Due By: {new Date(feeSummary.dueDate).toLocaleDateString("en-IN", { month: 'short', day: 'numeric', year: 'numeric'})}
                         </div>
                      )}
                    </div>

                    {/* Payment Form */}
                    <div className="mb-4">
                      <h6 className="fw-bold text-dark mb-3 fs-6">Select Remittance Amount</h6>

                      {/* Custom Radio Cards */}
                      <div className="d-flex flex-column gap-2 mb-3">
                         {/* Option 1: Full Payment */}
                         <div 
                           className={`p-3 rounded-3 border cursor-pointer transition-hover d-flex align-items-center gap-3 ${payMode === 'full' ? 'border-dark bg-dark text-white shadow-sm' : 'bg-white text-dark'}`}
                           onClick={() => { if(!paying) setPayMode("full") }}
                           style={{ cursor: paying ? 'not-allowed' : 'pointer' }}
                         >
                            <div className={`rounded-circle border d-flex align-items-center justify-content-center ${payMode === 'full' ? 'border-white bg-white text-dark' : 'border-secondary bg-light'}`} style={{ width: '20px', height: '20px' }}>
                               {payMode === 'full' && <div className="bg-dark rounded-circle" style={{ width: '10px', height: '10px' }}></div>}
                            </div>
                            <div className="flex-grow-1">
                               <div className="fw-bold" style={{ fontSize: "0.9rem" }}>Settle Full Balance</div>
                            </div>
                            <div className="fw-bolder fs-6">{formatMoney(totalDue)}</div>
                         </div>

                         {/* Option 2: Custom Amount */}
                         <div 
                           className={`p-3 rounded-3 border cursor-pointer transition-hover d-flex align-items-center gap-3 ${payMode === 'custom' ? 'border-dark bg-dark text-white shadow-sm' : 'bg-white text-dark'}`}
                           onClick={() => { if(!paying) setPayMode("custom") }}
                           style={{ cursor: paying ? 'not-allowed' : 'pointer' }}
                         >
                            <div className={`rounded-circle border d-flex align-items-center justify-content-center ${payMode === 'custom' ? 'border-white bg-white text-dark' : 'border-secondary bg-light'}`} style={{ width: '20px', height: '20px' }}>
                               {payMode === 'custom' && <div className="bg-dark rounded-circle" style={{ width: '10px', height: '10px' }}></div>}
                            </div>
                            <div className="fw-bold" style={{ fontSize: "0.9rem" }}>Custom Installment</div>
                         </div>
                      </div>

                      {/* Custom Input Field (Expands if selected) */}
                      {payMode === "custom" && (
                        <div className="p-3 bg-light rounded-3 border border-dark border-opacity-25 mt-2 animate-fade-in">
                          <label className="text-muted fw-semibold small mb-2 d-block text-uppercase" style={{ letterSpacing: "0.5px" }}>Enter Amount (₹)</label>
                          <div className="input-group input-group-lg shadow-sm">
                            <span className="input-group-text bg-white border-end-0 fw-bold text-dark">₹</span>
                            <input
                              type="number"
                              min="1"
                              className="form-control border-start-0 fw-bold text-dark shadow-none"
                              placeholder={`Max ${totalDue}`}
                              value={payAmount}
                              onChange={(e) => setPayAmount(e.target.value)}
                              disabled={paying}
                              style={{ fontSize: "1.2rem" }}
                            />
                          </div>
                          
                          {/* Quick Select Pills */}
                          <div className="d-flex flex-wrap gap-2 mt-3">
                            <button type="button" className="btn btn-sm btn-white border fw-bold flex-fill rounded-pill text-dark shadow-sm btn-icon-hover" onClick={() => setQuickPay(0.25)} disabled={paying}>25%</button>
                            <button type="button" className="btn btn-sm btn-white border fw-bold flex-fill rounded-pill text-dark shadow-sm btn-icon-hover" onClick={() => setQuickPay(0.50)} disabled={paying}>50%</button>
                            <button type="button" className="btn btn-sm btn-white border fw-bold flex-fill rounded-pill text-dark shadow-sm btn-icon-hover" onClick={() => setQuickPay(0.75)} disabled={paying}>75%</button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Checkout Button Area */}
                    <div className="mt-4 pt-4 border-top">
                      <button 
                         className="btn btn-dark w-100 py-3 fw-bolder fs-6 rounded-pill shadow d-flex justify-content-center align-items-center gap-2 btn-checkout" 
                         onClick={payOnline} 
                         disabled={paying}
                      >
                        {paying ? (
                           <><div className="spinner-border spinner-border-sm text-light" /> Establishing secure link...</>
                        ) : (
                           <><i className="bi bi-shield-lock-fill"></i> Proceed to Pay {formatMoney(calculatedPayAmount || 0)}</>
                        )}
                      </button>

                      <div className="d-flex align-items-center justify-content-center gap-3 mt-3 opacity-50">
                         <i className="bi bi-credit-card-fill fs-5"></i>
                         <i className="bi bi-bank fs-5"></i>
                         <i className="bi bi-phone-fill fs-5"></i>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            {/* Developer Testing Note (Optional) */}
            <div className="mt-4 text-center">
               <div className="badge bg-secondary bg-opacity-10 text-secondary border rounded-pill px-3 py-2 fw-medium">
                  <i className="bi bi-tools me-1"></i> Testing Gateway
               </div>
               <div className="small text-muted mt-2 px-4" style={{ fontSize: "0.7rem", lineHeight: "1.5" }}>
                  For testing, use card <strong>5267 3181 8797 5449</strong>, any future date, CVV 123, and OTP 123456.
               </div>
            </div>

          </div>
        </div>
      </div>

      {/* --- CUSTOM CSS --- */}
      <style>{`
        .tracking-wider {
          letter-spacing: 0.5px;
        }
        .transition-hover {
          transition: all 0.2s ease;
        }
        .transition-hover:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.05) !important;
        }
        .btn-icon-hover:hover {
          background-color: #f8f9fa;
          border-color: #ced4da !important;
        }
        .custom-table tbody tr { transition: background-color 0.2s ease; }
        .custom-table tbody tr:hover { background-color: #f8f9fa; }
        .btn-checkout {
          transition: all 0.2s ease;
        }
        .btn-checkout:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 15px rgba(0,0,0,0.1) !important;
        }
        .btn-checkout:active:not(:disabled) {
          transform: translateY(0);
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-in-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}