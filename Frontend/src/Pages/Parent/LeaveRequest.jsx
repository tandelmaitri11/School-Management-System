import React, { useEffect, useMemo, useState } from "react";
import api from "../../api/api";

const EMPTY_FORM = {
  teacherId: "",
  leaveType: "Casual Leave",
  fromDate: "",
  toDate: "",
  reason: "",
};

export default function ParentLeaveRequest() {
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [teachers, setTeachers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  useEffect(() => {
    const loadStudents = async () => {
      try {
        setLoading(true);
        const res = await api.get("/api/parent/students");
        const rows = res.data?.students || [];
        setStudents(rows);
        setSelectedStudentId(rows[0]?.id || "");
      } catch (err) {
        setFeedback({ type: "danger", message: err.response?.data?.message || "Failed to load students" });
      } finally {
        setLoading(false);
      }
    };
    loadStudents();
  }, []);

  const loadDetails = async (studentId) => {
    if (!studentId) {
      setTeachers([]);
      setRequests([]);
      return;
    }

    try {
      setDetailLoading(true);
      const [teachersRes, requestsRes] = await Promise.all([
        api.get(`/api/parent/student/${studentId}/teachers`),
        api.get(`/api/parent/student/${studentId}/leave-requests`),
      ]);
      const teacherRows = teachersRes.data?.teachers || [];
      setTeachers(teacherRows);
      setRequests(requestsRes.data?.requests || []);
      setForm((prev) => ({ ...prev, teacherId: teacherRows[0]?.id || "" }));
    } catch (err) {
      setFeedback({ type: "danger", message: err.response?.data?.message || "Failed to load leave request data" });
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    loadDetails(selectedStudentId);
  }, [selectedStudentId]);

  const selectedStudent = useMemo(
    () => students.find((student) => student.id === selectedStudentId) || null,
    [students, selectedStudentId]
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setSubmitting(true);
      setFeedback({ type: "", message: "" });
      const res = await api.post(`/api/parent/student/${selectedStudentId}/leave-requests`, form);
      setFeedback({ type: "success", message: res.data?.message || "Leave request submitted successfully" });
      setForm((prev) => ({ ...EMPTY_FORM, teacherId: prev.teacherId || teachers[0]?.id || "" }));
      await loadDetails(selectedStudentId);
    } catch (err) {
      setFeedback({ type: "danger", message: err.response?.data?.message || "Failed to submit leave request" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center vh-100 bg-light">
        <div className="spinner-border text-primary" role="status" />
        <div className="mt-3 text-muted fw-medium">Loading leave request module...</div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4 px-md-4 bg-light min-vh-100">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-4 mb-4">
        <div>
          <h2 className="fw-bold mb-1 text-dark">Leave Request</h2>
          <div className="text-secondary fw-medium">Send leave information directly to the relevant teacher.</div>
        </div>
        <div className="bg-white p-2 rounded-3 shadow-sm border" style={{ minWidth: "300px" }}>
          <label className="form-label small text-muted mb-1 px-1 fw-semibold">Select Child</label>
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

      {feedback.message ? <div className={`alert alert-${feedback.type}`}>{feedback.message}</div> : null}

      {!students.length ? (
        <div className="alert alert-warning">No linked students found for this parent account.</div>
      ) : (
        <div className="row g-4">
          <div className="col-lg-5">
            <div className="card border-0 shadow-sm rounded-4">
              <div className="card-body p-4">
                <h5 className="fw-bold text-dark mb-3">New Request</h5>
                <div className="small text-muted mb-4">
                  Student: <span className="fw-semibold text-dark">{selectedStudent?.name || "-"}</span>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Teacher</label>
                    <select className="form-select" name="teacherId" value={form.teacherId} onChange={handleChange}>
                      <option value="">Select Teacher</option>
                      {teachers.map((teacher) => (
                        <option key={teacher.id} value={teacher.id}>
                          {teacher.name} ({teacher.roleLabel})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Leave Type</label>
                    <select className="form-select" name="leaveType" value={form.leaveType} onChange={handleChange}>
                      <option value="Casual Leave">Casual Leave</option>
                      <option value="Sick Leave">Sick Leave</option>
                      <option value="Emergency Leave">Emergency Leave</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">From Date</label>
                      <input className="form-control" type="date" name="fromDate" value={form.fromDate} onChange={handleChange} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">To Date</label>
                      <input className="form-control" type="date" name="toDate" value={form.toDate} onChange={handleChange} />
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="form-label fw-semibold">Reason</label>
                    <textarea
                      className="form-control"
                      rows="5"
                      name="reason"
                      value={form.reason}
                      onChange={handleChange}
                      placeholder="Write the leave reason clearly."
                    />
                  </div>
                  <button className="btn btn-primary mt-4 w-100" type="submit" disabled={submitting || detailLoading}>
                    {submitting ? "Submitting..." : "Submit Leave Request"}
                  </button>
                </form>
              </div>
            </div>
          </div>

          <div className="col-lg-7">
            <div className="card border-0 shadow-sm rounded-4">
              <div className="card-body p-4">
                <h5 className="fw-bold text-dark mb-4">Request History</h5>
                {detailLoading ? (
                  <div className="text-center py-5 text-muted">Loading request history...</div>
                ) : !requests.length ? (
                  <div className="text-center py-5 text-muted">No leave requests submitted yet.</div>
                ) : (
                  <div className="d-flex flex-column gap-3">
                    {requests.map((request) => (
                      <div key={request.id} className="border rounded-4 p-3 bg-white">
                        <div className="d-flex flex-column flex-md-row justify-content-between gap-2 mb-2">
                          <div>
                            <div className="fw-bold text-dark">{request.leaveType}</div>
                            <div className="small text-muted">
                              {new Date(request.fromDate).toLocaleDateString()} to {new Date(request.toDate).toLocaleDateString()}
                            </div>
                          </div>
                          <span
                            className={`badge align-self-start ${
                              request.status === "Approved"
                                ? "bg-success"
                                : request.status === "Rejected"
                                ? "bg-danger"
                                : "bg-warning text-dark"
                            }`}
                          >
                            {request.status}
                          </span>
                        </div>
                        <div className="small text-muted mb-2">
                          Teacher: <span className="fw-semibold text-dark">{request.teacher?.name || "Not assigned"}</span>
                        </div>
                        <div className="text-dark">{request.reason}</div>
                        {request.adminNote ? <div className="mt-2 small text-muted">Note: {request.adminNote}</div> : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
