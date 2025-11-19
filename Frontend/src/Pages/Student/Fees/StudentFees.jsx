import React, { useEffect, useState } from "react";
import api from "../../../api/api";
import { jsPDF } from "jspdf";

export default function StudentFees() {
  const [fees, setFees] = useState(null);
  const [message, setMessage] = useState("");

  const studentId = localStorage.getItem("studentId"); // logged-in student's ID

  useEffect(() => {
    const loadFees = async () => {
      try {
        const res = await api.get(`/api/fees/student-fees/${studentId}`);
        setFees(res.data.fees);
      } catch (err) {
        setMessage(err?.response?.data?.message || "No fees found");
      }
    };
    loadFees();
  }, [studentId]);

  if (message) return <div className="alert alert-info mt-4">{message}</div>;
  if (!fees) return <div className="text-center mt-5">Loading...</div>;

  const isPaid = fees.remainingAmount <= 0;

  // Function to download professional PDF receipt
  const downloadReceipt = () => {
    const doc = new jsPDF("p", "pt", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();

    // Optional: Add school logo (replace with actual URL or base64)
    const logoUrl = "https://dummyimage.com/100x50/000/fff.png&text=Logo"; // replace with your logo
    doc.addImage(logoUrl, "PNG", 40, 20, 60, 30);

    // School Name Header
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("MyAchoolY", pageWidth / 2, 40, { align: "center" });

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("Address: 123 School Road, City, State", pageWidth / 2, 55, { align: "center" });
    doc.text("Contact: myschooly0411@gmail.com | +123-456-7890", pageWidth / 2, 70, { align: "center" });

    doc.setLineWidth(0.5);
    doc.line(20, 80, pageWidth - 20, 80); // horizontal line

    // Student Info
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Student Details", 40, 100);

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    const studentInfoY = 115;
    doc.text(`Name: ${fees.studentName}`, 40, studentInfoY);
    doc.text(`Class: ${fees.studentClass}`, 40, studentInfoY + 15);
    doc.text(`Total Fees: ${fees.totalFees}`, 40, studentInfoY + 30);
    doc.text(`Paid Amount: ${fees.paidAmount}`, 40, studentInfoY + 45);
    doc.text(`Remaining Amount: ${fees.remainingAmount}`, 40, studentInfoY + 60);
    doc.text(`Status: ${isPaid ? "Paid" : "Pending"}`, 40, studentInfoY + 75);

    // Payment History Table
    doc.setFont("helvetica", "bold");
    doc.text("Payment History", 40, studentInfoY + 100);

    const startY = studentInfoY + 115;
    const colWidths = [30, 100, 80, 100]; // #, Amount, Mode, Date
    const rowHeight = 20;
    let currentY = startY;

    // Table Header
    doc.setFontSize(12);
    doc.setFillColor(230, 230, 230);
    doc.rect(40, currentY - 12, colWidths.reduce((a, b) => a + b, 0), rowHeight, "F");

    doc.setFont("helvetica", "bold");
    doc.text("#", 45, currentY);
    doc.text("Amount", 45 + colWidths[0], currentY);
    doc.text("Mode", 45 + colWidths[0] + colWidths[1], currentY);
    doc.text("Date", 45 + colWidths[0] + colWidths[1] + colWidths[2], currentY);

    currentY += rowHeight;

    // Table rows
    doc.setFont("helvetica", "normal");
    fees.paymentHistory.forEach((p, idx) => {
      doc.text(`${idx + 1}`, 45, currentY);
      doc.text(`${p.amount}`, 45 + colWidths[0], currentY);
      doc.text(`${p.mode}`, 45 + colWidths[0] + colWidths[1], currentY);
      doc.text(`${new Date(p.date).toLocaleDateString()}`, 45 + colWidths[0] + colWidths[1] + colWidths[2], currentY);
      currentY += rowHeight;
    });

    // PAID Stamp if cleared
    if (isPaid) {
      doc.setFontSize(50);
      doc.setTextColor(255, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.text("PAID", pageWidth / 2, currentY + 80, { align: "center", angle: 45 });
      doc.setTextColor(0);
    }

    // Footer
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(
      "This is a computer-generated receipt. Signature not required.",
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 40,
      { align: "center" }
    );
    doc.text(
      "Contact us: myschooly0411@gamil.com | +123-456-7890",
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 25,
      { align: "center" }
    );

    // Save PDF
    doc.save(`Fee_Receipt_${fees.studentName}.pdf`);
  };

  return (
    <div className="container mt-5">
      <h2 className="mb-4 text-primary">My Fees Details</h2>

      {!isPaid && (
        <div className="alert alert-warning">
          Your payment is incomplete! Remaining amount: <strong>{fees.remainingAmount}</strong>
        </div>
      )}

      {/* Fees Summary */}
      <div className="card shadow-sm mb-4 border-0 p-3">
        <div className="mb-3">
          <label className="form-label fw-semibold">Class</label>
          <input type="text" className="form-control" value={fees.studentClass} disabled />
        </div>
        <div className="row text-center">
          <div className="col-md-3 mb-3">
            <div className="card bg-light p-3 shadow-sm border-0">
              <h6>Total Fees</h6>
              <p className="fs-5 fw-bold">{fees.totalFees}</p>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="card bg-light p-3 shadow-sm border-0">
              <h6>Paid Amount</h6>
              <p className="fs-5 fw-bold text-success">{fees.paidAmount}</p>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="card bg-light p-3 shadow-sm border-0">
              <h6>Remaining Amount</h6>
              <p className={`fs-5 fw-bold ${isPaid ? "text-success" : "text-danger"}`}>
                {fees.remainingAmount}
              </p>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="card bg-light p-3 shadow-sm border-0">
              <h6>Status</h6>
              <p className={`fs-5 fw-bold ${isPaid ? "text-success" : "text-danger"}`}>
                {isPaid ? "Paid" : "Pending"}
              </p>
            </div>
          </div>
        </div>

        {/* Download Button */}
        <div className="text-end mt-3">
          <button className="btn btn-primary" onClick={downloadReceipt}>
            Download Fee Receipt
          </button>
        </div>
      </div>

      {/* Payment History */}
      <div className="card shadow-sm p-4 border-0">
        <h5 className="mb-3">Payment History</h5>
        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <thead className="table-light">
              <tr>
                <th>#</th>
                <th>Amount</th>
                <th>Mode</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {fees.paymentHistory.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center text-muted">
                    No payments yet
                  </td>
                </tr>
              ) : (
                fees.paymentHistory.map((p, idx) => (
                  <tr key={idx}>
                    <td>{idx + 1}</td>
                    <td>{p.amount}</td>
                    <td>{p.mode}</td>
                    <td>{new Date(p.date).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
