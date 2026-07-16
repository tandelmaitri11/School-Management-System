import React, { useEffect, useMemo, useState } from "react";
import api from "../../../api/api";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

// --- SAAS COLOR PALETTE ---
const colors = {
  primary: "#4f46e5", // Indigo
  primaryLight: "#eef2ff",
  primaryGradient: "linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)",
  success: "#10b981", // Emerald
  successLight: "#ecfdf5",
  warning: "#f59e0b", // Amber
  warningLight: "#fffbeb",
  danger: "#ef4444", // Red
  dangerLight: "#fef2f2",
  info: "#3b82f6", // Blue
  infoLight: "#eff6ff",
  bg: "#f8fafc", // Slate 50
  surface: "#ffffff",
  textMain: "#0f172a", // Slate 900
  textMuted: "#64748b", // Slate 500
  border: "#e2e8f0" // Slate 200
};

// --- SAAS UI STYLES ---
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    background-color: ${colors.bg};
  }

  .fade-in { animation: fadeIn 0.4s ease-out forwards; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

  /* SaaS Cards */
  .saas-card {
    background: ${colors.surface};
    border-radius: 16px;
    border: 1px solid ${colors.border};
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -2px rgba(0, 0, 0, 0.02);
    transition: all 0.25s ease;
  }
  .hover-lift:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 20px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -4px rgba(0, 0, 0, 0.03);
    border-color: #cbd5e1;
  }

  /* Seamless Tables */
  .saas-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
  }
  .saas-table th {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: ${colors.textMuted};
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid ${colors.border};
    background-color: #fcfcfd;
  }
  .saas-table td {
    padding: 1.25rem 1.5rem;
    vertical-align: middle;
    border-bottom: 1px solid #f1f5f9;
    color: ${colors.textMain};
    font-size: 0.9rem;
    transition: background-color 0.2s ease;
  }
  .saas-table tr:last-child td { border-bottom: none; }
  .saas-table tbody tr:hover td { background-color: #f8fafc; }

  /* Form Inputs */
  .saas-input {
    border: 1px solid ${colors.border};
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
    font-size: 1.1rem;
    font-weight: 600;
    color: ${colors.textMain};
    transition: all 0.2s ease;
  }
  .saas-input:focus, .saas-input:focus-within {
    border-color: ${colors.primary};
    box-shadow: 0 0 0 3px ${colors.primaryLight};
    outline: none;
  }
  .saas-input-group-text {
    background-color: #f8fafc;
    border: 1px solid ${colors.border};
    color: ${colors.textMuted};
    font-weight: 600;
  }

  /* Custom Radio Selection Panels */
  .saas-radio-panel {
    display: flex;
    align-items: center;
    padding: 1.25rem;
    border-radius: 12px;
    border: 1px solid ${colors.border};
    background-color: ${colors.surface};
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .saas-radio-panel:hover:not(.disabled) {
    background-color: ${colors.bg};
    border-color: #cbd5e1;
  }
  .saas-radio-panel.selected {
    background-color: ${colors.primaryLight};
    border-color: ${colors.primary};
    box-shadow: 0 0 0 1px ${colors.primary};
  }
  .saas-radio-panel.disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .saas-radio-circle {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    border: 2px solid #cbd5e1;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 1rem;
    flex-shrink: 0;
    transition: all 0.2s ease;
  }
  .saas-radio-panel.selected .saas-radio-circle {
    border-color: ${colors.primary};
  }
  .saas-radio-panel.selected .saas-radio-circle::after {
    content: '';
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background-color: ${colors.primary};
  }
  .saas-radio-input {
    position: absolute;
    opacity: 0;
    cursor: pointer;
  }

  /* Buttons */
  .btn-saas {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    font-weight: 600;
  }
  .btn-saas:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(15, 23, 42, 0.15);
  }
  .btn-saas:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
  .btn-saas-outline {
    background-color: ${colors.surface};
    color: ${colors.textMain};
    border: 1px solid ${colors.border};
    font-weight: 600;
    transition: all 0.2s ease;
  }
  .btn-saas-outline:hover:not(:disabled) {
    background-color: ${colors.bg};
    border-color: #cbd5e1;
    transform: translateY(-1px);
  }
  .btn-saas-outline.active {
    background-color: ${colors.textMain};
    color: #ffffff;
    border-color: ${colors.textMain};
  }
`;

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
    if (!fees || totalDue <= 0 || paying) return;
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
        theme: { color: colors.textMain }, // Matches SaaS dark slate
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
      <div className="d-flex flex-column justify-content-center align-items-center min-vh-100" style={{ backgroundColor: colors.bg }}>
        <i className="bi bi-wallet2 mb-3" style={{ fontSize: "4rem", color: colors.textMuted, opacity: 0.5 }}></i>
        <h5 className="fw-semibold" style={{ color: colors.textMain }}>{message}</h5>
      </div>
    );
  }

  if (loading || !fees) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center min-vh-100" style={{ backgroundColor: colors.bg }}>
        <div className="spinner-border mb-3" style={{ color: colors.primary, width: "3rem", height: "3rem", borderWidth: '0.2em' }} role="status"></div>
        <p className="fw-medium text-uppercase" style={{ color: colors.textMuted, letterSpacing: '1px', fontSize: '0.85rem' }}>Fetching Financial Data...</p>
      </div>
    );
  }

  return (
    <div className="pb-5 pt-3 fade-in" style={{ backgroundColor: colors.bg, minHeight: '100vh' }}>
      <style>{styles}</style>
      
      {/* Full width container with responsive horizontal padding */}
      <div className="container-fluid px-4 px-xl-5">
        
        {/* ---------- PAGE HEADER ---------- */}
        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-end mb-5 gap-4">
          <div>
            <div className="badge mb-2 px-3 py-2 rounded-pill fw-semibold shadow-sm" style={{ backgroundColor: colors.primaryLight, color: colors.primary, border: `1px solid rgba(79,70,229,0.2)`, letterSpacing: "0.5px" }}>
              <i className="bi bi-bank me-2"></i>Financial Center
            </div>
            <h2 className="fw-bolder mb-1" style={{ color: colors.textMain, letterSpacing: '-0.5px' }}>
              Tuition & Fees
            </h2>
            <p className="mb-0 small fw-medium" style={{ color: colors.textMuted }}>
              Manage your academic payments, view transaction history, and download official receipts.
            </p>
          </div>
          
          <div>
            {isPaid ? (
               <div className="d-flex align-items-center gap-2 px-4 py-2 rounded-pill fw-bold shadow-sm" style={{ backgroundColor: colors.successLight, color: colors.success, border: '1px solid rgba(16,185,129,0.2)' }}>
                  <i className="bi bi-check-circle-fill fs-5"></i>
                  Account Up to Date
               </div>
            ) : (
               <div className="d-flex align-items-center gap-2 px-4 py-2 rounded-pill fw-bold shadow-sm" style={{ backgroundColor: colors.dangerLight, color: colors.danger, border: '1px solid rgba(239,68,68,0.2)' }}>
                  <i className="bi bi-exclamation-circle-fill fs-5"></i>
                  Payment Due
               </div>
            )}
          </div>
        </div>

        {/* Global Message Alert */}
        {message && (
          <div className="alert d-flex align-items-center justify-content-between mb-4 rounded-4 shadow-sm" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }} role="alert">
            <div className="d-flex align-items-center gap-3">
              <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px', backgroundColor: colors.bg, color: colors.textMain }}>
                 <i className="bi bi-info-circle-fill fs-5"></i>
              </div>
              <span className="fw-medium" style={{ color: colors.textMain }}>{message}</span>
            </div>
            <button type="button" className="btn-close" aria-label="Close" onClick={() => setMessage("")}></button>
          </div>
        )}

        <div className="row g-4">
          
          {/* ---------- LEFT COLUMN: STATS & HISTORY ---------- */}
          <div className="col-12 col-xl-8 d-flex flex-column gap-4">
            
            {/* High-Level Overview Grid */}
            <div className="row g-4">
               {/* Total Assessment */}
               <div className="col-md-4">
                  <div className="saas-card p-4 h-100 d-flex flex-column hover-lift">
                     <div className="fw-bold mb-3 text-uppercase" style={{ color: colors.textMuted, fontSize: "0.75rem", letterSpacing: '0.05em' }}>Annual Assessment</div>
                     <h3 className="fw-bolder mb-1" style={{ color: colors.textMain, letterSpacing: '-0.5px' }}>{formatMoney(total)}</h3>
                     <div className="mt-auto pt-3 mt-3" style={{ borderTop: `1px solid ${colors.bg}` }}>
                        <div className="d-flex align-items-center gap-2 mb-1" style={{ fontSize: '0.8rem', color: colors.textMuted, fontWeight: 500 }}>
                          <i className="bi bi-building"></i> Class {studentMeta?.studentClass ?? fees.studentClass} {studentMeta?.section ? `(Sec ${studentMeta.section})` : ""}
                        </div>
                        <div className="d-flex align-items-center gap-2" style={{ fontSize: '0.8rem', color: colors.textMuted, fontWeight: 500 }}>
                          <i className="bi bi-book"></i> {studentMeta?.stream || "General"} Plan
                        </div>
                     </div>
                  </div>
               </div>

               {/* Amount Paid */}
               <div className="col-md-4">
                  <div className="saas-card p-4 h-100 d-flex flex-column hover-lift">
                     <div className="fw-bold mb-3 text-uppercase" style={{ color: colors.textMuted, fontSize: "0.75rem", letterSpacing: '0.05em' }}>Total Remitted</div>
                     <h3 className="fw-bolder mb-1" style={{ color: colors.success, letterSpacing: '-0.5px' }}>{formatMoney(paid)}</h3>
                     <div className="mt-auto fw-semibold rounded-pill d-inline-flex align-items-center w-auto align-self-start px-3 py-1" style={{ backgroundColor: colors.successLight, color: colors.success, fontSize: '0.8rem', border: '1px solid rgba(16,185,129,0.2)' }}>
                        <i className="bi bi-arrow-up-right me-2"></i> Recorded to date
                     </div>
                  </div>
               </div>

               {/* Outstanding Balance */}
               <div className="col-md-4">
                  <div className="saas-card p-4 h-100 d-flex flex-column hover-lift" style={{ border: isPaid ? `1px solid ${colors.border}` : `1px solid ${colors.textMain}`, boxShadow: isPaid ? '' : '0 4px 12px rgba(15,23,42,0.08)' }}>
                     <div className="fw-bold mb-3 text-uppercase d-flex justify-content-between align-items-center" style={{ color: colors.textMuted, fontSize: "0.75rem", letterSpacing: '0.05em' }}>
                        Outstanding Balance
                        {!isPaid && <i className="bi bi-exclamation-triangle-fill fs-6" style={{ color: colors.danger }}></i>}
                     </div>
                     <h3 className="fw-bolder mb-1" style={{ color: isPaid ? colors.success : colors.textMain, letterSpacing: '-0.5px' }}>
                        {formatMoney(totalDue)}
                     </h3>
                     {/* Breakout pills */}
                     <div className="d-flex flex-wrap gap-2 mt-auto pt-3">
                        <span className="badge rounded-pill fw-medium px-3 py-1" style={{ backgroundColor: colors.bg, color: colors.textMain, border: `1px solid ${colors.border}` }} title="Base Pending">
                           Base: {formatMoney(baseRemaining)}
                        </span>
                        {lateFee > 0 && (
                           <span className="badge rounded-pill fw-medium px-3 py-1" style={{ backgroundColor: colors.dangerLight, color: colors.danger, border: '1px solid rgba(239,68,68,0.2)' }} title="Late Fee Penalty">
                              Late: {formatMoney(lateFee)}
                           </span>
                        )}
                     </div>
                  </div>
               </div>
            </div>

            {/* Payment History Table */}
            <div className="saas-card overflow-hidden flex-grow-1">
              <div className="p-4 d-flex justify-content-between align-items-center border-bottom" style={{ borderColor: colors.border }}>
                 <div>
                    <h5 className="fw-bolder mb-1" style={{ color: colors.textMain }}>Transaction Ledger</h5>
                    <span className="small fw-medium" style={{ color: colors.textMuted }}>{(fees.paymentHistory || []).length} recorded payments</span>
                 </div>
                 {lastPayment?._id && (
                    <button className="btn btn-saas-outline btn-sm rounded-pill px-3 fw-bold d-none d-sm-block" onClick={() => downloadReceipt(lastPayment._id)}>
                       <i className="bi bi-printer me-2"></i>Latest Receipt
                    </button>
                 )}
              </div>

              <div className="table-responsive">
                <table className="saas-table m-0">
                  <thead>
                    <tr>
                      <th className="ps-4">Ref #</th>
                      <th>Date & Time</th>
                      <th>Method</th>
                      <th>Amount</th>
                      <th className="text-end pe-4">Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fees.paymentHistory?.length ? (
                      fees.paymentHistory.map((p, idx) => {
                         const isOnline = String(p.mode).toLowerCase() === "online";
                         return (
                           <tr key={p._id || idx}>
                             <td className="ps-4">
                                <div className="fw-bold" style={{ color: colors.textMain, fontSize: "0.9rem" }}>{p.receiptNo || `TRX-${idx+1}`}</div>
                                <div className="text-truncate" style={{ color: colors.textMuted, maxWidth: "150px", fontSize: "0.75rem", fontWeight: 500 }}>
                                   {p.transactionId || p.orderId || "-"}
                                </div>
                             </td>
                             <td className="small fw-medium" style={{ color: colors.textMuted }}>
                                {formatDateTime(p.date)}
                             </td>
                             <td>
                               <div className="d-flex align-items-center gap-2">
                                  <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: "28px", height: "28px", backgroundColor: isOnline ? colors.primaryLight : colors.successLight, color: isOnline ? colors.primary : colors.success }}>
                                     <i className={`bi ${isOnline ? 'bi-globe' : 'bi-cash'}`} style={{ fontSize: '0.8rem' }}></i>
                                  </div>
                                  <span className="fw-semibold small" style={{ color: colors.textMain }}>{p.mode}</span>
                               </div>
                             </td>
                             <td className="fw-bolder" style={{ color: colors.textMain }}>
                                {formatMoney(p.amount)}
                             </td>
                             <td className="text-end pe-4">
                               <button 
                                 className="btn btn-saas-outline btn-sm rounded-circle d-inline-flex align-items-center justify-content-center" 
                                 style={{ width: "36px", height: "36px", padding: 0 }}
                                 onClick={() => downloadReceipt(p._id)}
                                 title="Download PDF Receipt"
                               >
                                 <i className="bi bi-download"></i>
                               </button>
                             </td>
                           </tr>
                         )
                      })
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-center py-5">
                           <i className="bi bi-journal-x fs-2 d-block mb-3" style={{ color: colors.textMuted, opacity: 0.5 }}></i>
                           <span style={{ color: colors.textMuted, fontWeight: 500 }}>No payment transactions recorded yet.</span>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="p-3 border-top text-center fw-medium" style={{ backgroundColor: '#fcfcfd', borderColor: colors.border, color: colors.textMuted, fontSize: "0.8rem" }}>
                 Online transactions are secured by Razorpay. Cash payments are verified by administration.
              </div>
            </div>
          </div>

          {/* ---------- RIGHT COLUMN: PAYMENT PORTAL ---------- */}
          <div className="col-12 col-xl-4">
            <div className="saas-card position-sticky overflow-hidden" style={{ top: '24px', border: `1px solid ${colors.textMain}`, boxShadow: '0 10px 25px rgba(15,23,42,0.1)' }}>
              
              {/* Portal Header */}
              <div className="p-4" style={{ backgroundColor: colors.textMain, color: '#ffffff' }}>
                 <div className="d-flex justify-content-between align-items-center mb-2">
                    <h5 className="fw-bolder m-0"><i className="bi bi-credit-card-2-front me-2" style={{ opacity: 0.7 }}></i>Payment Portal</h5>
                 </div>
                 <div className="small fw-medium" style={{ opacity: 0.8, lineHeight: '1.5' }}>
                    Secure online processing via UPI, Credit Card, or Netbanking.
                 </div>
              </div>

              <div className="p-4" style={{ backgroundColor: colors.surface }}>
                {isPaid ? (
                  <div className="text-center py-5">
                    <div className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-4" style={{ width: "72px", height: "72px", backgroundColor: colors.successLight, color: colors.success }}>
                       <i className="bi bi-check-lg" style={{ fontSize: '2.5rem' }}></i>
                    </div>
                    <h4 className="fw-bolder mb-2" style={{ color: colors.textMain }}>All Clear!</h4>
                    <p className="small mb-0" style={{ color: colors.textMuted }}>Your account balance is currently zero.</p>
                  </div>
                ) : (
                  <>
                    {/* Bill Breakdown Box */}
                    <div className="p-4 rounded-4 mb-4" style={{ backgroundColor: colors.bg, border: `1px solid ${colors.border}` }}>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <span className="fw-semibold" style={{ color: colors.textMuted, fontSize: '0.9rem' }}>Base Tuition Pending</span>
                        <span className="fw-bold" style={{ color: colors.textMain }}>{formatMoney(baseRemaining)}</span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <span className="fw-semibold" style={{ color: colors.textMuted, fontSize: '0.9rem' }}>Late Penalties</span>
                        <span className="fw-bold" style={{ color: colors.danger }}>{formatMoney(lateFee)}</span>
                      </div>
                      <hr className="my-3" style={{ borderColor: '#cbd5e1' }} />
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="fw-bold" style={{ color: colors.textMain, fontSize: '1.05rem' }}>Total Due</span>
                        <span className="fw-bolder fs-3" style={{ color: colors.textMain, letterSpacing: '-0.5px' }}>{formatMoney(totalDue)}</span>
                      </div>
                      {feeSummary?.dueDate && (
                         <div className="text-end mt-2 fw-bold" style={{ color: colors.danger, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                            Due By: {new Date(feeSummary.dueDate).toLocaleDateString("en-IN", { month: 'short', day: 'numeric', year: 'numeric'})}
                         </div>
                      )}
                    </div>

                    {/* Payment Form */}
                    <div className="mb-4">
                      <h6 className="fw-bold mb-3" style={{ color: colors.textMain }}>Select Remittance Amount</h6>

                      {/* Custom Radio Cards */}
                      <div className="d-flex flex-column gap-3 mb-3">
                         {/* Option 1: Full Payment */}
                         <label className={`saas-radio-panel ${payMode === 'full' ? 'selected' : ''} ${paying ? 'disabled' : ''}`}>
                            <input 
                              type="radio" 
                              className="saas-radio-input" 
                              checked={payMode === 'full'} 
                              onChange={() => { if(!paying) setPayMode('full') }}
                              disabled={paying}
                            />
                            <div className="saas-radio-circle"></div>
                            <div className="flex-grow-1">
                               <div className="fw-bold" style={{ color: payMode === 'full' ? colors.primary : colors.textMain }}>Settle Full Balance</div>
                            </div>
                            <div className="fw-bolder fs-6" style={{ color: payMode === 'full' ? colors.primary : colors.textMain }}>{formatMoney(totalDue)}</div>
                         </label>

                         {/* Option 2: Custom Amount */}
                         <label className={`saas-radio-panel ${payMode === 'custom' ? 'selected' : ''} ${paying ? 'disabled' : ''}`}>
                            <input 
                              type="radio" 
                              className="saas-radio-input" 
                              checked={payMode === 'custom'} 
                              onChange={() => { if(!paying) setPayMode('custom') }}
                              disabled={paying}
                            />
                            <div className="saas-radio-circle"></div>
                            <div className="flex-grow-1">
                               <div className="fw-bold" style={{ color: payMode === 'custom' ? colors.primary : colors.textMain }}>Custom Installment</div>
                            </div>
                         </label>
                      </div>

                      {/* Custom Input Field (Expands if selected) */}
                      {payMode === "custom" && (
                        <div className="p-4 rounded-4 mt-2 fade-in" style={{ backgroundColor: colors.bg, border: `1px solid ${colors.border}` }}>
                          <label className="fw-semibold small mb-2 d-block text-uppercase" style={{ color: colors.textMuted, letterSpacing: "0.5px" }}>Enter Amount (₹)</label>
                          <div className="input-group input-group-lg shadow-sm rounded-3 overflow-hidden">
                            <span className="input-group-text saas-input-group-text border-end-0 fs-5">₹</span>
                            <input
                              type="number"
                              min="1"
                              className="form-control saas-input border-start-0 py-2 shadow-none"
                              placeholder={`Max ${totalDue}`}
                              value={payAmount}
                              onChange={(e) => setPayAmount(e.target.value)}
                              disabled={paying}
                              style={{ fontSize: "1.25rem", fontWeight: 700 }}
                            />
                          </div>
                          
                          {/* Quick Select Pills */}
                          <div className="d-flex flex-wrap gap-2 mt-3">
                            <button type="button" className="btn btn-sm btn-saas-outline flex-fill rounded-pill" onClick={() => setQuickPay(0.25)} disabled={paying}>25%</button>
                            <button type="button" className="btn btn-sm btn-saas-outline flex-fill rounded-pill" onClick={() => setQuickPay(0.50)} disabled={paying}>50%</button>
                            <button type="button" className="btn btn-sm btn-saas-outline flex-fill rounded-pill" onClick={() => setQuickPay(0.75)} disabled={paying}>75%</button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Checkout Button Area */}
                    <div className="mt-4 pt-4 border-top" style={{ borderColor: colors.border }}>
                      <button 
                         className="btn btn-saas w-100 py-3 fw-bolder fs-6 rounded-pill d-flex justify-content-center align-items-center gap-2" 
                         style={{ backgroundColor: colors.textMain, color: '#ffffff', border: 'none' }}
                         onClick={payOnline} 
                         disabled={paying}
                      >
                        {paying ? (
                           <><div className="spinner-border spinner-border-sm text-light" style={{ borderWidth: '0.15em' }} /> Establishing secure link...</>
                        ) : (
                           <><i className="bi bi-shield-lock-fill fs-5"></i> Proceed to Pay {formatMoney(calculatedPayAmount || 0)}</>
                        )}
                      </button>

                      <div className="d-flex align-items-center justify-content-center gap-4 mt-4" style={{ color: colors.textMuted, opacity: 0.6 }}>
                         <i className="bi bi-credit-card-fill fs-4"></i>
                         <i className="bi bi-bank fs-4"></i>
                         <i className="bi bi-phone-fill fs-4"></i>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            {/* Developer Testing Note (Optional) */}
            <div className="mt-4 text-center">
               <div className="badge rounded-pill px-3 py-2 fw-medium" style={{ backgroundColor: colors.bg, color: colors.textMuted, border: `1px solid ${colors.border}` }}>
                  <i className="bi bi-tools me-1"></i> Testing Gateway
               </div>
               <div className="small mt-2 px-4" style={{ color: colors.textMuted, fontSize: "0.75rem", lineHeight: "1.6" }}>
                  For testing, use card <strong>5267 3181 8797 5449</strong>, any future date, CVV 123, and OTP 123456.
               </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}