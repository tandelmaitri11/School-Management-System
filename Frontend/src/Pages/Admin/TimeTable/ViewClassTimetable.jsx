import { useEffect, useMemo, useState } from "react";
import api from "../../../api/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "bootstrap/dist/css/bootstrap.min.css"; 

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const periods = [1, 2, 3, 4, 5];
const normalize = (v) => String(v || "").trim();
const normalizeUpper = (v) => normalize(v).toUpperCase();

export default function ViewClassTimetable() {
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState("");
  const [timetable, setTimetable] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [section, setSection] = useState("");
  const [stream, setStream] = useState("");
  const [subjectChoice, setSubjectChoice] = useState("");
  const [editingCell, setEditingCell] = useState(null);
  const [editSubject, setEditSubject] = useState("");
  const [editTeacherId, setEditTeacherId] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // NEW STATE FOR DELETE MODAL
  const [deleteTarget, setDeleteTarget] = useState(null); 

  useEffect(() => {
    api.get("/api/classes").then(res => setClasses(res.data));
    api.get("/api/classes/teachers").then(res => setTeachers(res.data || []));
  }, []);

  const selectedClass = useMemo(() => classes.find((c) => c._id === classId), [classes, classId]);
  const streamOptions = useMemo(
    () => (selectedClass?.streams || []).filter((s) => s?.isActive !== false),
    [selectedClass]
  );
  const hasStreams = streamOptions.length > 0;

  const sectionOptions = useMemo(() => {
    const all = (selectedClass?.sections || []).filter((s) => s?.isActive !== false);
    if (!hasStreams) return all;
    if (!stream) return [];

    const exact = all.filter(
      (s) => normalize(s.stream).toLowerCase() === normalize(stream).toLowerCase()
    );
    if (exact.length) return exact;
    return all.filter((s) => !normalize(s.stream));
  }, [selectedClass, hasStreams, stream]);

  const selectedStream = streamOptions.find((s) => String(s.name) === String(stream));
  const subjectOptions = selectedStream?.subjectOptions || [];
  const canViewTimetable = !!classId && (!hasStreams || !!stream) && !!section;
  const editSubjectOptions = subjects.length ? subjects : subjectOptions;

  const loadTimetable = async () => {
    if (!classId || (hasStreams && !stream) || !section) {
      setTimetable([]);
      return;
    }

    const params = new URLSearchParams();
    params.append("section", section);
    if (stream) params.append("stream", stream);
    if (subjectChoice) params.append("subjectChoice", subjectChoice);
    const qs = params.toString();
    const res = await api.get(`/api/timetable/class/${classId}${qs ? `?${qs}` : ""}`);
    setTimetable(res.data || []);
  };

  useEffect(() => {
    if (!selectedClass) {
      setSubjects([]);
      return;
    }
    const className = selectedClass.className;
    const qs = stream ? `?stream=${encodeURIComponent(stream)}` : "";
    api.get(`/api/subjects/getSubjects/${className}${qs}`)
      .then((res) => {
        const names = (res.data || [])
          .map((s) => (typeof s === "string" ? s : s.subjectName))
          .map((s) => normalize(s))
          .filter(Boolean);
        setSubjects(Array.from(new Set(names)));
      })
      .catch(() => setSubjects([]));
  }, [selectedClass, stream]);

  useEffect(() => {
    loadTimetable().catch(() => setTimetable([]));
  }, [classId, section, stream, subjectChoice, hasStreams]);

  const getCells = (day, period) =>
    timetable.filter(t => t.day === day && t.period === period);

  const openEdit = (cell) => {
    setEditingCell(cell);
    setEditSubject(normalize(cell.subject));
    setEditTeacherId(String(cell.teacherId?._id || cell.teacherId || ""));
  };

  const closeEdit = () => {
    setEditingCell(null);
    setEditSubject("");
    setEditTeacherId("");
  };

  const saveEdit = async () => {
    if (!editingCell) return;
    if (!editSubject || !editTeacherId) {
      alert("Please select subject and teacher");
      return;
    }

    try {
      setActionLoading(true);
      await api.post("/api/timetable/manual", {
        classId,
        stream,
        section,
        day: editingCell.day,
        period: Number(editingCell.period),
        subject: editSubject,
        teacherId: editTeacherId,
      });
      await loadTimetable();
      closeEdit();
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to update slot");
    } finally {
      setActionLoading(false);
    }
  };

  /* ================= UPDATED DELETE ACTIONS ================= */
  
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      setActionLoading(true);
      if (deleteTarget.type === 'slot') {
        const { cell } = deleteTarget;
        await api.post("/api/timetable/manual/delete", {
          classId,
          stream,
          section,
          day: cell.day,
          period: Number(cell.period),
        });
      } else if (deleteTarget.type === 'full') {
        await api.post("/api/timetable/manual/delete-full", {
          classId,
          stream,
          section,
        });
        setTimetable([]);
      }
      await loadTimetable();
      setDeleteTarget(null); // Close modal
    } catch (e) {
      alert(e?.response?.data?.message || "Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  /* ================= EXPORT PDF ================= */
  const exportPDF = async () => {
    if (!selectedClass) return alert("Please select a class");

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4"
    });

    let logoLoaded = false;
    const logo = new Image();
    logo.src = "/school-logo.png";

    await new Promise(resolve => {
      logo.onload = () => {
        logoLoaded = true;
        resolve();
      };
      logo.onerror = () => resolve(); 
    });

    if (logoLoaded) {
      doc.addImage(logo, "PNG", 130, 8, 30, 30);
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("SchoolY-INTERNATIONAL SCHOOL", 148, 45, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text("Academic Year : 2025 - 2026", 148, 52, { align: "center" });

    doc.setFontSize(12);
    
    const filters = [
      section ? `Section ${section}` : null,
      stream ? `Stream ${stream}` : null,
      subjectChoice ? `Choice ${subjectChoice}` : null,
    ].filter(Boolean).join(" | ");

    const title = filters
      ? `Class ${selectedClass.className} - Weekly Timetable (${filters})`
      : `Class ${selectedClass.className} - Weekly Timetable`;

    doc.text(title, 148, 60, { align: "center" });

    const tableHead = [["Period", ...days]];

    const tableBody = periods.map(period => [
      `Period ${period}`,
      ...days.map(day => {
        const cells = getCells(day, period);
        return cells.length
          ? cells
              .map((c) => `${c.subject}\n${c.teacherId?.name || c.teacherName || ""}`)
              .join("\n\n")
          : "-";
      })
    ]);

    autoTable(doc, {
      startY: 70,
      head: tableHead,
      body: tableBody,
      theme: "grid",
      styles: {
        halign: "center",
        valign: "middle",
        fontSize: 10
      },
      headStyles: {
        fillColor: [0, 0, 0],
        textColor: [255, 255, 255]
      }
    });

    const finalY = doc.lastAutoTable.finalY + 15;

    doc.setFontSize(11);
    doc.text("_________________________", 40, finalY);
    doc.text("Class Teacher", 55, finalY + 6);

    doc.text("_________________________", 200, finalY);
    doc.text("Principal", 225, finalY + 6);

    doc.save(`Class_${selectedClass.className}_Timetable_2025-26.pdf`);
  };

  return (
    <div className="bg-light min-vh-100 py-5">
      <div className="container-fluid px-5">
        
        <div className="row mb-4 align-items-center">
          <div className="col">
            <h2 className="fw-bold text-dark mb-1">
              <i className="bi bi-grid-3x3-gap-fill text-primary me-2"></i>
              Class Timetable
            </h2>
            <p className="text-muted mb-0">View and manage schedules per class</p>
          </div>
          <div className="col-auto">
              <div className="d-flex gap-2">
                <button
                  className="btn btn-outline-danger shadow-sm rounded-pill px-4 fw-semibold"
                  disabled={!canViewTimetable || actionLoading || timetable.length === 0}
                  onClick={() => setDeleteTarget({ type: 'full' })}
                >
                  Delete Full Table
                </button>
                <button
                  className="btn btn-primary shadow-sm rounded-pill px-4 fw-semibold"
                  disabled={!canViewTimetable}
                  onClick={exportPDF}
                >
                  <i className="bi bi-file-earmark-pdf-fill me-2"></i>
                  Download PDF
                </button>
              </div>
          </div>
        </div>

        <div className="row g-4">
          <div className="col-md-3 col-lg-2">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <label className="form-label fw-bold text-uppercase small text-muted mb-3">
                  Select Class
                </label>
                <div className="d-grid gap-2">
                  <select
                    className="form-select form-select-lg border-2"
                    value={classId}
                    onChange={e => {
                      setClassId(e.target.value);
                      setStream("");
                      setSection("");
                    }}
                  >
                    <option value="">Choose...</option>
                    {classes.map(c => (
                      <option key={c._id} value={c._id}>
                        Class {c.className}
                      </option>
                    ))}
                  </select>
                </div>
                 <div className="mt-3">
                  <label className="form-label fw-bold text-uppercase small text-muted mb-2">
                    Stream
                  </label>
                  <select
                    className="form-select"
                    value={stream}
                    onChange={e => {
                      setStream(e.target.value);
                      setSection("");
                      setSubjectChoice("");
                    }}
                    disabled={!classId || !hasStreams}
                  >
                    <option value="">{hasStreams ? "Select stream" : "No stream required"}</option>
                    {streamOptions.map((s) => (
                      <option key={s.name} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="mt-3">
                  <label className="form-label fw-bold text-uppercase small text-muted mb-2">
                    Section
                  </label>
                  <select
                    className="form-select"
                    value={section}
                    onChange={e => setSection(normalizeUpper(e.target.value))}
                    disabled={!classId || (hasStreams && !stream)}
                  >
                    <option value="">{hasStreams && !stream ? "Select stream first" : "Select section"}</option>
                    {sectionOptions.map((s) => (
                      <option key={s._id || s.name} value={normalizeUpper(s.name)}>
                        Section {normalizeUpper(s.name)}{s.stream ? ` (${s.stream})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {classId ? (
                   <div className="mt-4 p-3 bg-light rounded text-center border border-primary border-opacity-25">
                     <small className="text-muted d-block text-uppercase">Currently Viewing</small>
                     <h3 className="text-primary fw-bold mb-0">Class {selectedClass?.className}</h3>
                     {stream ? <div className="small text-muted">Stream: {stream}</div> : null}
                     {section ? <div className="small text-muted">Section: {section}</div> : null}
                   </div>
                ) : (
                  <div className="mt-4 text-center text-muted opacity-50">
                    <i className="bi bi-arrow-up-circle fs-1"></i>
                    <p className="small mt-2">Please select a class to view the timetable.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="col-md-9 col-lg-10">
            <div className="card border-0 shadow-sm rounded-3 overflow-hidden h-100">
              <div className="card-body p-0">
                {canViewTimetable ? (
                  <div className="table-responsive">
                    <table className="table table-bordered mb-0 align-middle text-center" style={{ minWidth: '1000px' }}>
                      <thead className="bg-dark text-white text-uppercase small">
                        <tr>
                          <th className="py-3 px-4" style={{ width: '100px' }}>Period</th>
                          {days.map(day => (
                            <th key={day} className="py-3 px-2">{day}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {periods.map(period => (
                          <tr key={period}>
                            <td className="bg-light fw-bold text-secondary border-end">
                              <span className="badge bg-secondary rounded-pill px-3 py-2">
                                {period}
                              </span>
                            </td>

                            {days.map(day => {
                              const cells = getCells(day, period);
                              return (
                                <td key={day} className="p-3">
                                  {cells.length ? (
                                    <div className="d-flex flex-column gap-2">
                                      {cells.map((cell, idx) => (
                                        <div key={`${day}-${period}-${idx}`} className="card border-primary border-opacity-25 shadow-sm">
                                          <div className="card-body p-2 d-flex flex-column justify-content-center">
                                            <div className="fw-bold text-dark text-truncate mb-1" title={cell.subject}>
                                              {cell.subject}
                                            </div>
                                            <div className="badge bg-primary bg-opacity-10 text-primary fw-normal text-truncate border border-primary border-opacity-10">
                                              <i className="bi bi-person-fill me-1"></i>
                                              {cell.teacherId?.name || cell.teacherName || "N/A"}
                                            </div>
                                            <div className="d-flex gap-2 mt-2">
                                              <button
                                                className="btn btn-sm btn-outline-primary w-50"
                                                onClick={() => openEdit(cell)}
                                                disabled={actionLoading}
                                              >
                                                Edit
                                              </button>
                                              <button
                                                className="btn btn-sm btn-outline-danger w-50"
                                                onClick={() => setDeleteTarget({ type: 'slot', cell })}
                                                disabled={actionLoading}
                                              >
                                                Delete
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="text-muted opacity-25 fw-light py-3">
                                      &mdash;
                                    </div>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="d-flex flex-column align-items-center justify-content-center py-5 h-100 text-muted">
                    <div className="bg-light rounded-circle p-4 mb-3">
                      <i className="bi bi-calendar-range fs-1"></i>
                    </div>
                    <h5 className="fw-normal">Complete Selection</h5>
                    <p className="mb-0 small">
                      {!classId
                        ? "Select class first."
                        : hasStreams && !stream
                        ? "Select stream first."
                        : !section
                        ? "Select section to view timetable."
                        : "No timetable data."}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingCell ? (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.35)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Edit Slot: {editingCell.day} / Period {editingCell.period}
                </h5>
                <button type="button" className="btn-close" onClick={closeEdit} disabled={actionLoading}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Subject</label>
                  <select
                    className="form-select"
                    value={editSubject}
                    onChange={(e) => setEditSubject(e.target.value)}
                    disabled={actionLoading}
                  >
                    <option value="">Select subject</option>
                    {editSubjectOptions.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Teacher</label>
                  <select
                    className="form-select"
                    value={editTeacherId}
                    onChange={(e) => setEditTeacherId(e.target.value)}
                    disabled={actionLoading}
                  >
                    <option value="">Select teacher</option>
                    {teachers.map((t) => (
                      <option key={t._id} value={t._id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-light" onClick={closeEdit} disabled={actionLoading}>Cancel</button>
                <button className="btn btn-primary" onClick={saveEdit} disabled={actionLoading}>
                  {actionLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* NEW: Delete Confirmation Modal */}
      {deleteTarget ? (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title">Confirm Deletion</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setDeleteTarget(null)} disabled={actionLoading}></button>
              </div>
              <div className="modal-body p-4 text-center">
                <i className="bi bi-exclamation-triangle-fill text-danger fs-1 mb-3"></i>
                {deleteTarget.type === 'slot' ? (
                  <p className="fs-5">
                    Are you sure you want to delete the <strong>{deleteTarget.cell.subject}</strong> slot on {deleteTarget.cell.day}?
                  </p>
                ) : (
                  <p className="fs-5">
                    <strong>WARNING:</strong> This will permanently delete the <strong>ENTIRE</strong> timetable for Class {selectedClass?.className}, Section {section}.
                  </p>
                )}
                <p className="text-muted small">This action cannot be undone.</p>
              </div>
              <div className="modal-footer bg-light">
                <button className="btn btn-secondary px-4" onClick={() => setDeleteTarget(null)} disabled={actionLoading}>Cancel</button>
                <button className="btn btn-danger px-4 fw-bold" onClick={handleConfirmDelete} disabled={actionLoading}>
                  {actionLoading ? "Deleting..." : "Yes, Delete It"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}