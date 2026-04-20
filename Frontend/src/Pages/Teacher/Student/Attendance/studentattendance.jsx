import React, { useEffect, useMemo, useState } from "react";
import api from "../../../../api/api";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { Toast, ToastContainer } from "react-bootstrap";

const normalize = (v) => String(v || "").trim();
const normalizeUpper = (v) => normalize(v).toUpperCase();
export default function StudentAttendance() {
  const [classes, setClasses] = useState([]);
  const [assignedSections, setAssignedSections] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedStream, setSelectedStream] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [checkingSubmitted, setCheckingSubmitted] = useState(false);
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", variant: "primary" });
  const [datePolicy, setDatePolicy] = useState({ allowed: true, reason: "" });
  const teacherId = localStorage.getItem("teacherId");

  const showToast = (message, variant = "primary") => {
    setToast({ show: true, message, variant });
  };

  const selectedClassDoc = useMemo(
    () => classes.find((c) => String(c._id) === String(selectedClass)) || null,
    [classes, selectedClass]
  );

  const assignedForClass = useMemo(
    () => assignedSections.filter((s) => String(s?.classId) === String(selectedClassDoc?._id || "")),
    [assignedSections, selectedClassDoc]
  );

  const classStreams = useMemo(
    () =>
      (selectedClassDoc?.streams || [])
        .filter((s) => s?.isActive !== false)
        .map((s) => normalize(s.name))
        .filter(Boolean),
    [selectedClassDoc]
  );

  const streamOptions = useMemo(() => {
    if (classStreams.length === 0) return [];
    const assignedStreamSet = new Set(
      assignedForClass
        .map((s) => normalize(s?.stream))
        .filter(Boolean)
        .map((s) => s.toLowerCase())
    );
    return classStreams.filter((st) => assignedStreamSet.has(st.toLowerCase()));
  }, [classStreams, assignedForClass]);

  const classHasStreams = classStreams.length > 0;
  const hasAssignedStreams = streamOptions.length > 0;
  const isDateBlocked = !datePolicy.allowed;
  const presentCount = students.filter((stu) => attendance[stu._id] === "Present").length;
  const absentCount = students.filter((stu) => attendance[stu._id] === "Absent").length;

  const sectionOptions = useMemo(() => {
    if (!selectedClassDoc?._id) return [];

    const rows = assignedForClass
      .map((s) => ({ section: normalizeUpper(s.section), stream: normalize(s.stream) }))
      .filter((s) => s.section);

    if (classHasStreams) {
      if (!selectedStream) return [];
      const scoped = rows.filter(
        (r) => normalize(r.stream).toLowerCase() === normalize(selectedStream).toLowerCase()
      );
      return [...new Set(scoped.map((r) => r.section))];
    }

    return [...new Set(rows.map((r) => r.section))];
  }, [selectedClassDoc, assignedForClass, classHasStreams, selectedStream]);

  useEffect(() => {
    if (teacherId) fetchClasses();
  }, [teacherId]);

  useEffect(() => {
    let cancelled = false;

    const validateDateForScope = async () => {
      if (!selectedClass || !selectedSection || !date || (classHasStreams && !selectedStream)) {
        if (!cancelled) setDatePolicy({ allowed: true, reason: "" });
        return;
      }
      try {
        const res = await api.get("/api/attendance/validate-date", {
          params: {
            classId: selectedClass,
            section: selectedSection,
            stream: selectedStream,
            date,
          },
        });
        if (!cancelled) {
          setDatePolicy({
            allowed: !!res.data?.allowed,
            reason: String(res.data?.reason || ""),
          });
        }
      } catch (err) {
        if (!cancelled) {
          const message = err?.response?.data?.message || "Could not validate attendance date";
          setDatePolicy({ allowed: false, reason: message });
        }
      }
    };

    validateDateForScope();
    return () => {
      cancelled = true;
    };
  }, [selectedClass, selectedSection, selectedStream, date, classHasStreams]);

  const fetchClasses = async () => {
    try {
      const res = await api.get(`/api/teachers/teacher/profile/${teacherId}`);
      const profile = res.data || {};
      setClasses(profile.classesFull || []);
      setAssignedSections(profile.assignedSections || []);
    } catch (err) {
      console.error(err);
      showToast("Failed to fetch classes", "danger");
    }
  };

  const fetchStudents = async () => {
    if (!selectedClassDoc) return;
    if (classHasStreams && !selectedStream) return;
    if (!selectedSection) return;

    try {
      setLoading(true);
      const res = await api.get(`/api/students/by-teacher/${teacherId}/class/${selectedClassDoc.className}`);
      const rows = Array.isArray(res.data) ? res.data : [];
      const filtered = rows.filter((s) => {
        const sSection = normalizeUpper(s.section);
        const sStream = normalize(s.stream).toLowerCase();
        if (sSection !== normalizeUpper(selectedSection)) return false;
        if (!classHasStreams) return true;
        return sStream === normalize(selectedStream).toLowerCase();
      });

      setStudents(filtered);
      const initialAttendance = {};
      filtered.forEach((s) => {
        initialAttendance[s._id] = attendance[s._id] || "Present";
      });
      setAttendance(initialAttendance);

      if (!filtered.length) {
        showToast("No students found for selected scope", "warning");
      } else {
        showToast("Students loaded successfully", "success");
      }
    } catch (err) {
      console.error(err);
      setStudents([]);
      showToast("Failed to load students", "danger");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [selectedClass, selectedStream, selectedSection]);

  useEffect(() => {
    let cancelled = false;

    const checkSubmitted = async () => {
      if (!selectedClass || !selectedSection || !date || (classHasStreams && !selectedStream)) {
        if (!cancelled) setAlreadySubmitted(false);
        return;
      }

      try {
        if (!cancelled) setCheckingSubmitted(true);
        const params = {
          section: selectedSection,
          teacherId,
        };
        if (selectedStream) params.stream = selectedStream;

        const res = await api.get(`/api/attendance/${selectedClass}/${date}`, { params });
        const existingRows = Array.isArray(res.data?.attendance) ? res.data.attendance : [];
        const existingMap = {};
        existingRows.forEach((row) => {
          const sid = String(row?.studentId?._id || row?.studentId || "");
          if (sid) existingMap[sid] = row?.status === "Absent" ? "Absent" : "Present";
        });

        if (!cancelled) {
          setAttendance((prev) => ({ ...prev, ...existingMap }));
          setAlreadySubmitted(true);
        }
      } catch (err) {
        if (!cancelled) {
          if (err?.response?.status === 404) {
            setAlreadySubmitted(false);
          } else {
            setAlreadySubmitted(false);
          }
        }
      } finally {
        if (!cancelled) setCheckingSubmitted(false);
      }
    };

    checkSubmitted();

    return () => {
      cancelled = true;
    };
  }, [selectedClass, selectedSection, selectedStream, date, classHasStreams, teacherId]);

  const handleAttendanceChange = (studentId, status) => {
    setAttendance((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleBulkAttendance = (status) => {
    setAttendance((prev) => {
      const next = { ...prev };
      students.forEach((stu) => {
        next[stu._id] = status;
      });
      return next;
    });
  };

  const handleSubmit = async () => {
    if (isDateBlocked) {
      showToast(datePolicy.reason || "Attendance cannot be submitted for selected date", "warning");
      return;
    }

    if (!selectedClass || !selectedSection || !date || (classHasStreams && !selectedStream)) {
      showToast("Please select class/section/date (and stream if required)", "warning");
      return;
    }

    const formattedAttendance = Object.keys(attendance).map((studentId) => ({
      studentId,
      status: attendance[studentId],
    }));

    try {
      await api.post("/api/attendance/mark", {
        classId: selectedClass,
        section: selectedSection,
        stream: selectedStream,
        date,
        teacherId,
        attendance: formattedAttendance,
      });
      setAlreadySubmitted(true);
      showToast("Attendance saved successfully", "success");
    } catch (err) {
      console.error(err);
      showToast(err?.response?.data?.message || "Failed to save attendance", "danger");
    }
  };

  return (
    <div className="container-fluid px-2 px-md-4 mt-3 mb-5">
      <div className="card shadow-lg border-0 rounded-4">
        <div className="card-body p-3 p-md-4">
          <h3 className="text-center text-primary mb-4 fs-5 fs-md-3">
            <i className="bi bi-check2-square me-2"></i>Mark Attendance
          </h3>

          <div className="row g-3 mb-4">
            <div className="col-12 col-md-3">
              <label className="form-label fw-semibold">Class</label>
              <select
                className="form-select"
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  setSelectedStream("");
                  setSelectedSection("");
                  setStudents([]);
                }}
              >
                <option value="">-- Select --</option>
                {classes.map((cls) => (
                  <option key={cls._id} value={cls._id}>
                    Class {cls.className}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12 col-md-3">
              <label className="form-label fw-semibold">Stream</label>
              <select
                className="form-select"
                value={selectedStream}
                disabled={!selectedClass || !classHasStreams || !hasAssignedStreams}
                onChange={(e) => {
                  setSelectedStream(e.target.value);
                  setSelectedSection("");
                }}
              >
                <option value="">
                  {!classHasStreams ? "N/A" : hasAssignedStreams ? "-- Select --" : "No assigned stream"}
                </option>
                {streamOptions.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12 col-md-3">
              <label className="form-label fw-semibold">Section</label>
              <select
                className="form-select"
                value={selectedSection}
                disabled={!selectedClass || (classHasStreams && !selectedStream)}
                onChange={(e) => setSelectedSection(e.target.value)}
              >
                <option value="">-- Select --</option>
                {sectionOptions.map((sec) => (
                  <option key={sec} value={sec}>
                    {sec}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12 col-md-3">
              <label className="form-label fw-semibold">Date</label>
              <input
                type="date"
                className="form-control"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
              />
              {isDateBlocked && (
                <small className="text-danger fw-semibold d-block mt-1">
                  {datePolicy.reason || "Attendance is blocked for selected date."}
                </small>
              )}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary"></div>
            </div>
          ) : students.length === 0 ? (
            <div className="alert alert-warning text-center">No students found for selected scope.</div>
          ) : (
            <>
              <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-3">
                <div className="d-flex flex-wrap gap-2">
                  <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-2">
                    Present: {presentCount}
                  </span>
                  <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-3 py-2">
                    Absent: {absentCount}
                  </span>
                  <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-2">
                    Total: {students.length}
                  </span>
                </div>

                <div className="d-flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-success fw-semibold"
                    onClick={() => handleBulkAttendance("Present")}
                    disabled={alreadySubmitted || checkingSubmitted}
                  >
                    <i className="bi bi-check2-all me-1"></i>
                    All Present
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger fw-semibold"
                    onClick={() => handleBulkAttendance("Absent")}
                    disabled={alreadySubmitted || checkingSubmitted}
                  >
                    <i className="bi bi-x-circle me-1"></i>
                    All Absent
                  </button>
                </div>
              </div>

              <div className="table-responsive">
                <table className="table table-bordered align-middle text-nowrap">
                  <thead className="table-primary text-center">
                    <tr>
                      <th>#</th>
                      <th>Student Name</th>
                      <th>Email</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((stu, index) => (
                      <tr key={stu._id}>
                        <td className="text-center">{index + 1}</td>
                        <td className="fw-medium">{stu.name}</td>
                        <td className="small">{stu.email}</td>
                        <td className="text-center">
                          <div className="btn-group btn-group-sm flex-wrap">
                            <button
                              className={`btn ${
                                attendance[stu._id] === "Present" ? "btn-success" : "btn-outline-success"
                              }`}
                              onClick={() => handleAttendanceChange(stu._id, "Present")}
                              disabled={alreadySubmitted}
                            >
                              Present
                            </button>
                            <button
                              className={`btn ${
                                attendance[stu._id] === "Absent" ? "btn-danger" : "btn-outline-danger"
                              }`}
                              onClick={() => handleAttendanceChange(stu._id, "Absent")}
                              disabled={alreadySubmitted}
                            >
                              Absent
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          <div className="text-center mt-4">
            <button
              className="btn btn-primary px-4 px-md-5 py-2 fw-semibold"
              onClick={handleSubmit}
              disabled={
                !selectedClass ||
                !selectedSection ||
                !date ||
                students.length === 0 ||
                (classHasStreams && !selectedStream) ||
                isDateBlocked ||
                alreadySubmitted ||
                checkingSubmitted
              }
            >
              <i className="bi bi-save2 me-2"></i>
              {checkingSubmitted ? "Checking..." : alreadySubmitted ? "Attendance Submitted" : "Submit Attendance"}
            </button>
          </div>
        </div>
      </div>

      <ToastContainer position="bottom-end" className="p-3">
        <Toast
          onClose={() => setToast((prev) => ({ ...prev, show: false }))}
          show={toast.show}
          bg={toast.variant}
          delay={3000}
          autohide
        >
          <Toast.Body className="text-white fw-semibold">{toast.message}</Toast.Body>
        </Toast>
      </ToastContainer>
    </div>
  );
}
