import React, { useEffect, useMemo, useState } from "react";
import api from "../../../api/api";

export default function StudentFees() {
  const [fees, setFees] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  // Payment UI
  const [payMode, setPayMode] = useState("full"); // "full" | "custom"
  const [payAmount, setPayAmount] = useState("");
  const [paying, setPaying] = useState(false);

  const studentMongoId = localStorage.getItem("studentId");

  const isPaid = useMemo(() => Number(fees?.remainingAmount || 0) <= 0, [fees]);
  const remaining = useMemo(() => Number(fees?.remainingAmount || 0), [fees]);
  const total = useMemo(() => Number(fees?.totalFees || 0), [fees]);
  const paid = useMemo(() => Number(fees?.paidAmount || 0), [fees]);

  const loadFees = async () => {
    try {
      setLoading(true);
      setMessage("");
      // ✅ change endpoint if yours different
      const res = await api.get(`/api/fees/student/${studentMongoId}`);
      setFees(res.data.fees);
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

  // ---------- Razorpay script ----------
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

  // ---------- Receipt download ----------
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
      return new Date(d).toLocaleString("en-IN");
    } catch {
      return "-";
    }
  };

  // ---------- Calculate pay amount ----------
  const calculatedPayAmount = useMemo(() => {
    if (!fees) return 0;
    if (payMode === "full") return remaining;
    const num = Number(payAmount);
    return Number.isFinite(num) ? num : 0;
  }, [fees, payMode, payAmount, remaining]);

  const setQuickPay = (ratio) => {
    if (!fees || remaining <= 0) return;
    const amt = Math.max(1, Math.round(remaining * ratio));
    setPayMode("custom");
    setPayAmount(String(amt));
  };

  // ---------- Pay Online ----------
  const payOnline = async () => {
    if (!fees) return;

    if (remaining <= 0) {
      setMessage("Fees already paid.");
      return;
    }

    const entered = calculatedPayAmount;

    if (!entered || entered <= 0) {
      setMessage("Enter a valid amount.");
      return;
    }

    if (entered > remaining) {
      setMessage(`Amount cannot be more than remaining (${remaining}).`);
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

      // create order
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
        amount: order.amount, // paise
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
            // IMPORTANT: backend expects these 3 keys
            const verifyPayload = {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            };

            const verifyRes = await api.post("/api/fees/razorpay/verify", verifyPayload);

            if (verifyRes.data?.success) {
              setMessage("✅ Online payment successful!");
              if (verifyRes.data?.fees) setFees(verifyRes.data.fees);
              else await loadFees();

              setPayAmount("");
              setPayMode("full");

              // auto-download receipt (optional)
              const lastPaymentId = verifyRes.data?.receipt?.paymentId;
              if (lastPaymentId) setTimeout(() => downloadReceipt(lastPaymentId), 300);
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

        theme: { color: "#0d6efd" },
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

  // ---------- UI States ----------
  if (message && !fees && !loading)
    return (
      <div className="container-fluid container-lg mt-4">
        <div className="alert alert-info text-center">{message}</div>
      </div>
    );

  if (loading || !fees)
    return (
      <div className="text-center mt-5">
        <div className="spinner-border text-primary"></div>
        <p className="mt-2 text-muted">Loading fees...</p>
      </div>
    );

  return (
    <div className="container-xxl my-4">
      {/* Header */}
      <div className="card border-0 shadow-sm rounded-4 mb-4">
        <div className="card-body d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2">
          <div>
            <h3 className="fw-bold mb-1">Fees & Payments</h3>
            <div className="text-muted small">
              Check your fee status, pay online, and download receipts.
            </div>
          </div>
          <span className={`badge ${isPaid ? "bg-success" : "bg-warning text-dark"} px-3 py-2`}>
            {isPaid ? "Paid" : "Pending"}
          </span>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className="alert alert-info text-center" role="alert">
          {message}
        </div>
      )}

      <div className="row g-4">
        {/* LEFT: Summary + History */}
        <div className="col-12 col-lg-8">
          {/* Summary Cards */}
          <div className="row g-3 mb-4">
            <div className="col-12 col-sm-6">
              <div className="card border-0 shadow-sm rounded-4 h-100">
                <div className="card-body">
                  <div className="text-muted small">Total Fees</div>
                  <div className="fs-3 fw-bold">{total}</div>
                  <div className="text-muted small">Class: {fees.studentClass}</div>
                </div>
              </div>
            </div>
            <div className="col-12 col-sm-6">
              <div className="card border-0 shadow-sm rounded-4 h-100">
                <div className="card-body">
                  <div className="text-muted small">Paid</div>
                  <div className="fs-3 fw-bold text-success">{paid}</div>
                  <div className="text-muted small">Updated from payment history</div>
                </div>
              </div>
            </div>
            <div className="col-12 col-sm-6">
              <div className="card border-0 shadow-sm rounded-4 h-100">
                <div className="card-body">
                  <div className="text-muted small">Remaining</div>
                  <div className={`fs-3 fw-bold ${isPaid ? "text-success" : "text-danger"}`}>
                    {remaining}
                  </div>
                  <div className="text-muted small">{isPaid ? "Nothing due" : "Pay before due date"}</div>
                </div>
              </div>
            </div>
            <div className="col-12 col-sm-6">
              <div className="card border-0 shadow-sm rounded-4 h-100">
                <div className="card-body">
                  <div className="text-muted small">Latest Receipt</div>
                  <div className="fw-semibold">{lastPayment?.receiptNo || "—"}</div>
                  <div className="text-muted small">{lastPayment ? formatDateTime(lastPayment.date) : "No payment yet"}</div>
                  <button
                    className="btn btn-sm btn-outline-primary mt-2"
                    disabled={!lastPayment?._id}
                    onClick={() => downloadReceipt(lastPayment._id)}
                  >
                    Download Latest
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Payment History */}
          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <h5 className="mb-0">Payment History</h5>
                <span className="text-muted small">{(fees.paymentHistory || []).length} payments</span>
              </div>

              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>#</th>
                      <th>Amount</th>
                      <th>Mode</th>
                      <th>Date</th>
                      <th>Txn</th>
                      <th>Order</th>
                      <th>Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fees.paymentHistory?.length ? (
                      fees.paymentHistory.map((p, idx) => (
                        <tr key={p._id || idx}>
                          <td>{idx + 1}</td>
                          <td className="fw-semibold">{p.amount}</td>
                          <td>
                            <span className={`badge ${String(p.mode).toLowerCase() === "online" ? "bg-primary" : "bg-secondary"}`}>
                              {p.mode}
                            </span>
                          </td>
                          <td>{formatDateTime(p.date)}</td>
                          <td className="text-truncate" style={{ maxWidth: 160 }}>{p.transactionId || "-"}</td>
                          <td className="text-truncate" style={{ maxWidth: 160 }}>{p.orderId || "-"}</td>
                          <td>
                            <button className="btn btn-sm btn-outline-primary" onClick={() => downloadReceipt(p._id)}>
                              Download
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center text-muted py-4">
                          No payments yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="small text-muted mt-3">
                Online payments show Razorpay IDs. Cash payments show CASH reference.
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Pay Panel */}
        <div className="col-12 col-lg-4">
          <div className="card border-0 shadow-sm rounded-4 position-sticky" style={{ top: 18 }}>
            <div className="card-body">
              <h5 className="mb-1">Pay Fees Online</h5>
              <div className="text-muted small mb-3">
                Pay with UPI / Card / Netbanking via Razorpay.
              </div>

              {isPaid ? (
                <div className="alert alert-success mb-0">
                  ✅ Your fees are fully paid.
                </div>
              ) : (
                <>
                  <div className="p-3 rounded-4 bg-light border mb-3">
                    <div className="d-flex justify-content-between">
                      <div className="text-muted small">Remaining</div>
                      <div className="fw-bold text-danger">{remaining}</div>
                    </div>
                    <div className="d-flex justify-content-between mt-1">
                      <div className="text-muted small">Student</div>
                      <div className="fw-semibold text-truncate" style={{ maxWidth: 170 }}>
                        {fees.studentName}
                      </div>
                    </div>
                  </div>

                  {/* Choose option */}
                  <div className="mb-3">
                    <div className="fw-semibold mb-2">Choose payment option</div>

                    <div className="form-check mb-2">
                      <input
                        className="form-check-input"
                        type="radio"
                        id="payFull"
                        checked={payMode === "full"}
                        onChange={() => setPayMode("full")}
                        disabled={paying}
                      />
                      <label className="form-check-label" htmlFor="payFull">
                        Pay full remaining ({remaining})
                      </label>
                    </div>

                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        id="payCustom"
                        checked={payMode === "custom"}
                        onChange={() => setPayMode("custom")}
                        disabled={paying}
                      />
                      <label className="form-check-label" htmlFor="payCustom">
                        Pay custom amount
                      </label>
                    </div>

                    {payMode === "custom" && (
                      <div className="mt-2">
                        <input
                          type="number"
                          min="1"
                          className="form-control"
                          placeholder={`Max ${remaining}`}
                          value={payAmount}
                          onChange={(e) => setPayAmount(e.target.value)}
                          disabled={paying}
                        />
                        <div className="d-flex flex-wrap gap-2 mt-2">
                          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setQuickPay(0.25)} disabled={paying}>
                            25%
                          </button>
                          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setQuickPay(0.5)} disabled={paying}>
                            50%
                          </button>
                          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setQuickPay(0.75)} disabled={paying}>
                            75%
                          </button>
                          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => { setPayMode("full"); setPayAmount(""); }} disabled={paying}>
                            Full
                          </button>
                        </div>
                        <div className="form-text">
                          You can pay in installments.
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Pay button */}
                  <div className="d-grid gap-2">
                    <button className="btn btn-success btn-lg" onClick={payOnline} disabled={paying}>
                      {paying ? "Processing..." : `Pay Now (${calculatedPayAmount || 0})`}
                    </button>

                    <button
                      className="btn btn-outline-primary"
                      onClick={() => {
                        if (!lastPayment?._id) return setMessage("No payment found to download receipt.");
                        downloadReceipt(lastPayment._id);
                      }}
                      disabled={!lastPayment?._id || paying}
                    >
                      Download Latest Receipt
                    </button>
                  </div>

                  {/* Test card hint */}
                  <div className="mt-3 small text-muted">
                    <div className="fw-semibold">Test Mode Card:</div>
                    <div>5267 3181 8797 5449 • 12/30 • 123 • OTP 123456</div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
