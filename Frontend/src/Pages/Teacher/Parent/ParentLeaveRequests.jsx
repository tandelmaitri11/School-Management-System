import React, { useEffect, useMemo, useState } from "react";
import api from "../../../api/api";

export default function ParentLeaveRequests() {
  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [notes, setNotes] = useState({});

  const loadRequests = async (nextStatus = statusFilter) => {
    try {
      setLoading(true);
      const params = nextStatus === "All" ? {} : { status: nextStatus };
      const res = await api.get("/api/teachers/parent/leave-requests", { params });
      const rows = res.data?.requests || [];
      setRequests(rows);
      setNotes(Object.fromEntries(rows.map((row) => [row.id, row.note || ""])));
    } catch (err) {
      setFeedback({ type: "danger", message: err.response?.data?.message || "Failed to load leave requests" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests("All");
  }, []);

  const summary = useMemo(() => ({
    total: requests.length,
    pending: requests.filter((row) => row.status === "Pending").length,
    approved: requests.filter((row) => row.status === "Approved").length,
    rejected: requests.filter((row) => row.status === "Rejected").length,
  }), [requests]);

  const updateStatus = async (requestId, status) => {
    try {
      setSavingId(requestId);
      setFeedback({ type: "", message: "" });
      const res = await api.patch(`/api/teachers/parent/leave-requests/${requestId}`, {
        status,
        note: notes[requestId] || "",
      });
      setFeedback({ type: "success", message: res.data?.message || "Status updated successfully" });
      await loadRequests(statusFilter);
    } catch (err) {
      setFeedback({ type: "danger", message: err.response?.data?.message || "Failed to update request" });
    } finally {
      setSavingId("");
    }
  };

  return (
    <div className="container-fluid py-4">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1">Parent Leave Requests</h2>
          <div className="text-muted">Review requests sent by parents and respond with an approval decision.</div>
        </div>
        <select
          className="form-select"
          style={{ maxWidth: "220px" }}
          value={statusFilter}
          onChange={(e) => {
            const value = e.target.value;
            setStatusFilter(value);
            loadRequests(value);
          }}
        >
          <option value="All">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {feedback.message ? <div className={`alert alert-${feedback.type}`}>{feedback.message}</div> : null}

      <div className="row g-4 mb-4">
        <div className="col-md-3"><div className="card border-0 shadow-sm rounded-4"><div className="card-body"><div className="text-muted small">Total</div><div className="fs-3 fw-bold">{summary.total}</div></div></div></div>
        <div className="col-md-3"><div className="card border-0 shadow-sm rounded-4"><div className="card-body"><div className="text-muted small">Pending</div><div className="fs-3 fw-bold text-warning">{summary.pending}</div></div></div></div>
        <div className="col-md-3"><div className="card border-0 shadow-sm rounded-4"><div className="card-body"><div className="text-muted small">Approved</div><div className="fs-3 fw-bold text-success">{summary.approved}</div></div></div></div>
        <div className="col-md-3"><div className="card border-0 shadow-sm rounded-4"><div className="card-body"><div className="text-muted small">Rejected</div><div className="fs-3 fw-bold text-danger">{summary.rejected}</div></div></div></div>
      </div>

      <div className="card border-0 shadow-sm rounded-4">
        <div className="card-body p-4">
          {loading ? (
            <div className="text-center py-5 text-muted">Loading leave requests...</div>
          ) : !requests.length ? (
            <div className="text-center py-5 text-muted">No leave requests found.</div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {requests.map((request) => (
                <div key={request.id} className="border rounded-4 p-4 bg-white">
                  <div className="d-flex flex-column flex-lg-row justify-content-between gap-3 mb-3">
                    <div>
                      <div className="fw-bold fs-5">{request.student?.name || "-"}</div>
                      <div className="text-muted small">
                        {request.student?.studentId || "-"} | Class {request.student?.className || "-"} {request.student?.section ? `Sec ${request.student.section}` : ""}
                      </div>
                      <div className="text-muted small mt-1">
                        Parent: <span className="fw-semibold text-dark">{request.parent?.name || "-"}</span>
                      </div>
                    </div>
                    <span className={`badge align-self-start ${request.status === "Approved" ? "bg-success" : request.status === "Rejected" ? "bg-danger" : "bg-warning text-dark"}`}>
                      {request.status}
                    </span>
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-md-3"><div className="small text-muted">Leave Type</div><div className="fw-semibold">{request.leaveType}</div></div>
                    <div className="col-md-3"><div className="small text-muted">From</div><div className="fw-semibold">{new Date(request.fromDate).toLocaleDateString()}</div></div>
                    <div className="col-md-3"><div className="small text-muted">To</div><div className="fw-semibold">{new Date(request.toDate).toLocaleDateString()}</div></div>
                    <div className="col-md-3"><div className="small text-muted">Submitted</div><div className="fw-semibold">{new Date(request.createdAt).toLocaleString()}</div></div>
                  </div>

                  <div className="mb-3">
                    <div className="small text-muted mb-1">Reason</div>
                    <div>{request.reason}</div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small text-muted">Teacher Note</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={notes[request.id] || ""}
                      onChange={(e) => setNotes((prev) => ({ ...prev, [request.id]: e.target.value }))}
                      placeholder="Optional note for the parent"
                      disabled={request.status !== "Pending"}
                    />
                  </div>

                  <div className="d-flex flex-wrap gap-2">
                    <button
                      className="btn btn-success"
                      disabled={savingId === request.id || request.status !== "Pending"}
                      onClick={() => updateStatus(request.id, "Approved")}
                    >
                      {savingId === request.id ? "Saving..." : "Approve"}
                    </button>
                    <button
                      className="btn btn-outline-danger"
                      disabled={savingId === request.id || request.status !== "Pending"}
                      onClick={() => updateStatus(request.id, "Rejected")}
                    >
                      {savingId === request.id ? "Saving..." : "Reject"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
