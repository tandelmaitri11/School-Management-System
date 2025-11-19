import React, { useEffect, useState } from "react";
import api from "../../../api/api";

export default function StudentPaymentPage() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Load all classes
  const loadClasses = async () => {
    try {
      const res = await api.get("/api/fees/all-class-fees");
      setClasses(res.data.classFees || []);
    } catch (err) {
      console.error(err);
      setMessage("Error loading classes");
    }
  };

  useEffect(() => {
    loadClasses();
  }, []);

  // Load students for selected class
  const loadStudents = async (cls) => {
    if (!cls) return;
    setSelectedClass(cls);
    setLoading(true);
    setSelectedStudent(null);

    try {
      const res = await api.get(`/api/fees/students/${cls}`);
      const allStudents = res.data.students || [];

      // Fetch fees for each student to determine status
      const studentsWithFees = await Promise.all(
        allStudents.map(async (student) => {
          try {
            const feesRes = await api.get(`/api/fees/student-fees/${student._id}`);
            return { ...student, fees: feesRes.data.fees || null };
          } catch {
            return { ...student, fees: null };
          }
        })
      );

      setStudents(studentsWithFees);
    } catch (err) {
      console.error(err);
      setMessage(err?.response?.data?.message || "Error fetching students");
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  // Select a student to pay
  const handleSelectStudent = async (student) => {
    setSelectedStudent(null);
    try {
      const res = await api.get(`/api/fees/student-fees/${student._id}`);
      setSelectedStudent({
        ...student,
        fees: res.data.fees || {
          totalFees: 0,
          paidAmount: 0,
          remainingAmount: 0,
          paymentHistory: [],
        },
      });
      setPaymentAmount("");
      setPaymentMode("Cash");
    } catch (err) {
      console.error(err);
      setMessage(err?.response?.data?.message || "Error fetching student fees");
    }
  };

  // Submit payment
  const handleSubmitPayment = async () => {
    if (!paymentAmount || paymentAmount <= 0) {
      return setMessage("Enter a valid payment amount");
    }

    try {
      await api.post("/api/fees/student-payment", {
        studentId: selectedStudent._id,
        amount: Number(paymentAmount),
        mode: paymentMode,
      });
      setMessage("Payment added successfully");
      handleSelectStudent(selectedStudent); // refresh student fees
    } catch (err) {
      console.error(err);
      setMessage(err?.response?.data?.message || "Error adding payment");
    }
  };

  return (
    <div className="container my-5">
      <h2 className="mb-4 text-primary">Student Payments</h2>

      {/* Message Alert */}
      {message && (
        <div className="alert alert-info alert-dismissible fade show" role="alert">
          {message}
          <button
            type="button"
            className="btn-close"
            onClick={() => setMessage("")}
          ></button>
        </div>
      )}

      {/* Step 1: Select Class */}
      <div className="card p-3 mb-4 shadow-sm border-0">
        <label className="form-label fw-semibold">Select Class</label>
        <select
          className="form-select form-select-lg"
          value={selectedClass}
          onChange={(e) => loadStudents(e.target.value)}
        >
          <option value="">-- Choose Class --</option>
          {classes.map((c) => (
            <option key={c._id} value={c.className}>
              {c.className}
            </option>
          ))}
        </select>
      </div>

      {/* Step 2: Students List */}
      {!selectedStudent && (
        <>
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : students.length > 0 ? (
            <div className="card shadow-sm mb-4 border-0">
              <div className="card-header bg-primary text-white fw-bold">
                Students in Class {selectedClass}
              </div>
              <div className="card-body p-0">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Name</th>
                      <th>Class</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s) => {
                      const status =
                        s.fees && s.fees.remainingAmount <= 0 ? "Paid" : "Pending";
                      const isPaid = status === "Paid";
                      return (
                        <tr key={s._id}>
                          <td>{s.name}</td>
                          <td>{s.studentClass}</td>
                          <td
                            className={
                              isPaid ? "text-success fw-bold" : "text-danger fw-bold"
                            }
                          >
                            {status}
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={() => handleSelectStudent(s)}
                              disabled={isPaid} // disable if fully paid
                            >
                              Pay Fees
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : selectedClass ? (
            <p className="text-center text-muted">No students found for this class</p>
          ) : null}
        </>
      )}

      {/* Step 3: Payment Form for Selected Student */}
      {selectedStudent && (
        <div className="card shadow-sm p-4 border-0">
          <h4 className="mb-3 text-success">Pay Fees for {selectedStudent.name}</h4>

          {/* Student Fees Info */}
          <div className="mb-3">
            <p className="mb-1">
              <strong>Class:</strong> {selectedStudent.studentClass}
            </p>
            <p className="mb-1">
              <strong>Total Fees:</strong> {selectedStudent.fees.totalFees}
            </p>
            <p className="mb-1">
              <strong>Paid Amount:</strong> {selectedStudent.fees.paidAmount}
            </p>
            <p className="mb-1">
              <strong>Remaining Amount:</strong> {selectedStudent.fees.remainingAmount}
            </p>
          </div>

          {/* Payment History */}
          <div className="mb-3">
            <h6>Payment History</h6>
            {selectedStudent.fees.paymentHistory.length > 0 ? (
              <table className="table table-bordered table-sm">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Amount</th>
                    <th>Mode</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedStudent.fees.paymentHistory.map((p, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{p.amount}</td>
                      <td>{p.mode}</td>
                      <td>{new Date(p.date).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-muted">No payments made yet.</p>
            )}
          </div>

          {/* Payment Form */}
          <div className="row g-3 align-items-end">
            <div className="col-md-3">
              <input
                type="number"
                className="form-control form-control-lg"
                placeholder="Payment Amount"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <select
                className="form-select form-select-lg"
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
              >
                <option value="Cash">Cash</option>
                <option value="Online">Online</option>
                <option value="Card">Card</option>
              </select>
            </div>
            <div className="col-md-3">
              <button className="btn btn-success btn-lg" onClick={handleSubmitPayment}>
                Submit Payment
              </button>
            </div>
            <div className="col-md-3">
              <button className="btn btn-secondary btn-lg" onClick={() => setSelectedStudent(null)}>
                Back to Students
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
