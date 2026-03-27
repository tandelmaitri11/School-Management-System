import { useEffect, useMemo, useState } from "react";
import api from "../../../api/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "bootstrap/dist/css/bootstrap.min.css"; 
import "bootstrap-icons/font/bootstrap-icons.css";

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

  // STATE FOR DELETE MODAL
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
    <div className="container-fluid py-4 min-vh-100" style={{ backgroundColor: "#f8fafc", fontFamily: "'Inter', sans-serif" }}>
      
      {/* Premium Custom CSS */}
      <style>{`
        .premium-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); transition: all 0.2s; }
        .input-premium { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 16px; transition: all 0.2s; font-weight: 500; color: #0f172a; }
        .input-premium:focus { border-color: #4f46e5; box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1); background: #ffffff; outline: none; }
        .btn-brand { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); border: none; color: white; transition: all 0.2s; }
        .btn-brand:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(79, 70, 229, 0.3); color: white; }
        
        .timetable-table { border-collapse: separate; border-spacing: 0; }
        .timetable-table th { text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.5px; font-weight: 700; color: #64748b; background: #f8fafc !important; border-bottom: 2px solid #e2e8f0 !important; padding: 16px; text-align: center; }
        .timetable-table td { padding: 12px; border: 1px solid #f1f5f9; background: #ffffff; vertical-align: top; min-width: 140px; }
        
        .slot-card { border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff; transition: all 0.2s ease; }
        .slot-card:hover { border-color: #4f46e5; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.1); transform: translateY(-2px); }
        
        .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* Premium Header Card */}
      <div 
        className="rounded-4 overflow-hidden mb-4 shadow-sm border-0 position-relative p-4 p-md-5"
        style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)" }}
      >
        <div style={{ position: 'absolute', top: '-50%', right: '-5%', width: '300px', height: '300px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}></div>
        <div className="position-relative z-1 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-4">
          <div>
            <span className="badge px-3 py-2 rounded-pill fw-semibold mb-3" style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.3)', color: 'white' }}>
              <i className="bi bi-grid-3x3-gap-fill me-1"></i> Timetable Viewer
            </span>
            <h2 className="display-6 fw-bolder text-white mb-1" style={{ letterSpacing: '-1px' }}>Class Timetable</h2>
            <p className="text-white opacity-75 fw-medium mb-0">View, edit, and export class schedules.</p>
          </div>
          
          <div className="d-flex flex-wrap gap-2">
            <button
              className="btn btn-light text-danger fw-bold rounded-pill px-4 py-2 shadow-sm d-flex align-items-center transition-all"
              disabled={!canViewTimetable || actionLoading || timetable.length === 0}
              onClick={() => setDeleteTarget({ type: 'full' })}
            >
              <i className="bi bi-trash3-fill me-2"></i> Delete Timetable
            </button>
            <button
              className="btn bg-white text-primary fw-bold rounded-pill px-4 py-2 shadow-sm d-flex align-items-center transition-all"
              disabled={!canViewTimetable}
              onClick={exportPDF}
            >
              <i className="bi bi-file-earmark-pdf-fill me-2"></i> Export to PDF
            </button>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* --- SIDEBAR: Filters --- */}
        <div className="col-12 col-xl-3">
          <div className="premium-card p-4 h-100 position-sticky" style={{ top: '20px' }}>
            <h6 className="fw-bolder text-dark mb-4 text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>
              <i className="bi bi-funnel-fill text-primary me-2"></i> View Filters
            </h6>
            
            <div className="mb-4">
              <label className="form-label small fw-bold text-muted mb-2">Select Class</label>
              <select
                className="form-select input-premium py-2"
                value={classId}
                onChange={e => {
                  setClassId(e.target.value);
                  setStream("");
                  setSection("");
                }}
              >
                <option value="">Choose Class...</option>
                {classes.map(c => (
                  <option key={c._id} value={c._id}>Class {c.className}</option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="form-label small fw-bold text-muted mb-2">Academic Stream</label>
              <select
                className="form-select input-premium py-2"
                value={stream}
                onChange={e => {
                  setStream(e.target.value);
                  setSection("");
                  setSubjectChoice("");
                }}
                disabled={!classId || !hasStreams}
              >
                <option value="">{hasStreams ? "Select stream..." : "Core (No Stream)"}</option>
                {streamOptions.map((s) => (
                  <option key={s.name} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="form-label small fw-bold text-muted mb-2">Section</label>
              <select
                className="form-select input-premium py-2"
                value={section}
                onChange={e => setSection(normalizeUpper(e.target.value))}
                disabled={!classId || (hasStreams && !stream)}
              >
                <option value="">{hasStreams && !stream ? "Select stream first" : "Select section..."}</option>
                {sectionOptions.map((s) => (
                  <option key={s._id || s.name} value={normalizeUpper(s.name)}>
                    Section {normalizeUpper(s.name)}{s.stream ? ` (${s.stream})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <hr className="border-secondary opacity-10 my-4" />

            {classId && section ? (
              <div className="p-4 bg-primary bg-opacity-10 rounded-4 text-center border border-primary border-opacity-25 animate-fade-in">
                <div className="small fw-bolder text-primary text-uppercase mb-2" style={{ letterSpacing: '1px' }}>Active View</div>
                <h2 className="text-dark fw-bolder mb-1">Class {selectedClass?.className}-{section}</h2>
                {stream && <div className="badge bg-white text-primary border border-primary border-opacity-25 mt-2 px-3 py-2 rounded-pill fw-semibold">{stream} Stream</div>}
              </div>
            ) : (
              <div className="text-center text-muted opacity-50 py-4">
                <i className="bi bi-calendar4-week fs-1 mb-2 d-block"></i>
                <p className="small fw-medium mb-0">Select criteria above to load schedule.</p>
              </div>
            )}
          </div>
        </div>

        {/* --- MAIN TIMETABLE VIEW --- */}
        <div className="col-12 col-xl-9">
          <div className="premium-card overflow-hidden h-100 d-flex flex-column">
            {canViewTimetable ? (
              <div className="table-responsive flex-grow-1">
                <table className="table timetable-table mb-0 w-100">
                  <thead>
                    <tr>
                      <th style={{ width: '80px', borderRight: '1px solid #e2e8f0' }}>Period</th>
                      {days.map(day => <th key={day}>{day}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {periods.map(period => (
                      <tr key={period}>
                        <td className="align-middle text-center bg-light" style={{ borderRight: '1px solid #e2e8f0' }}>
                          <span className="badge bg-white text-dark border shadow-sm rounded-pill px-3 py-2 fs-6 fw-bold">
                            {period}
                          </span>
                        </td>

                        {days.map(day => {
                          const cells = getCells(day, period);
                          return (
                            <td key={day} className="bg-light bg-opacity-50">
                              {cells.length ? (
                                <div className="d-flex flex-column gap-2 h-100">
                                  {cells.map((cell, idx) => (
                                    <div key={`${day}-${period}-${idx}`} className="slot-card p-3 shadow-sm d-flex flex-column h-100">
                                      <div className="fw-bolder text-dark text-truncate mb-2 lh-1" title={cell.subject}>
                                        {cell.subject}
                                      </div>
                                      <div className="badge bg-primary bg-opacity-10 text-primary fw-medium text-truncate border border-primary border-opacity-10 mb-3 align-self-start">
                                        <i className="bi bi-person-fill me-1"></i>
                                        {cell.teacherId?.name || cell.teacherName || "N/A"}
                                      </div>
                                      <div className="d-flex gap-2 mt-auto pt-2 border-top" style={{ borderColor: '#f1f5f9' }}>
                                        <button className="btn btn-sm bg-light text-primary flex-grow-1 fw-bold" onClick={() => openEdit(cell)} disabled={actionLoading}>
                                          Edit
                                        </button>
                                        <button className="btn btn-sm bg-light text-danger flex-grow-1 fw-bold" onClick={() => setDeleteTarget({ type: 'slot', cell })} disabled={actionLoading}>
                                          <i className="bi bi-trash3-fill"></i>
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="d-flex align-items-center justify-content-center h-100 w-100 opacity-25 text-muted py-4">
                                  <i className="bi bi-dash-lg fs-4"></i>
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
              <div className="d-flex flex-column align-items-center justify-content-center h-100 py-5 text-muted">
                <div className="rounded-circle bg-light d-flex align-items-center justify-content-center mb-3" style={{ width: 80, height: 80 }}>
                  <i className="bi bi-table fs-1 opacity-50"></i>
                </div>
                <h5 className="fw-bolder text-dark mb-1">No Timetable Selected</h5>
                <p className="mb-0 fw-medium">
                  {!classId
                    ? "Please select a class first."
                    : hasStreams && !stream
                    ? "Please select an academic stream."
                    : !section
                    ? "Please select a section to view the timetable."
                    : "No timetable data found."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- EDIT MODAL --- */}
      {editingCell && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(8px)", zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "24px", overflow: "hidden" }}>
              <div className="modal-header border-0 bg-light px-4 pt-4 pb-3">
                <div>
                  <h5 className="fw-bolder text-dark mb-1">Edit Timetable Slot</h5>
                  <p className="text-muted small fw-medium mb-0">{editingCell.day} &bull; Period {editingCell.period}</p>
                </div>
                <button type="button" className="btn-close" onClick={closeEdit} disabled={actionLoading}></button>
              </div>
              <div className="modal-body px-4 py-4">
                <div className="mb-4">
                  <label className="form-label small fw-bold text-muted text-uppercase mb-2">Subject Allocation</label>
                  <select className="form-select input-premium" value={editSubject} onChange={(e) => setEditSubject(e.target.value)} disabled={actionLoading}>
                    <option value="">Select subject...</option>
                    {editSubjectOptions.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label small fw-bold text-muted text-uppercase mb-2">Teacher Assignment</label>
                  <select className="form-select input-premium" value={editTeacherId} onChange={(e) => setEditTeacherId(e.target.value)} disabled={actionLoading}>
                    <option value="">Select teacher...</option>
                    {teachers.map((t) => (
                      <option key={t._id} value={t._id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer border-0 bg-light px-4 py-3 justify-content-between">
                <button className="btn bg-white border text-muted fw-bold rounded-pill px-4" onClick={closeEdit} disabled={actionLoading}>Cancel</button>
                <button className="btn btn-brand rounded-pill px-5 fw-bold shadow-sm" onClick={saveEdit} disabled={actionLoading}>
                  {actionLoading ? <><span className="spinner-border spinner-border-sm me-2"></span>Saving...</> : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- DELETE CONFIRMATION MODAL --- */}
      {deleteTarget && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(8px)", zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "24px", overflow: "hidden" }}>
              <div className="p-5 text-center">
                <div className="rounded-circle d-inline-flex align-items-center justify-content-center bg-danger bg-opacity-10 mb-4" style={{ width: 80, height: 80 }}>
                  <i className="bi bi-exclamation-triangle-fill text-danger" style={{ fontSize: '2.5rem' }}></i>
                </div>
                <h4 className="fw-bolder text-dark mb-3">Confirm Deletion</h4>
                
                {deleteTarget.type === 'slot' ? (
                  <p className="text-muted fw-medium mb-4 px-3 fs-6">
                    Are you sure you want to remove the <strong className="text-dark">{deleteTarget.cell.subject}</strong> slot on <strong className="text-dark">{deleteTarget.cell.day}</strong>?
                  </p>
                ) : (
                  <p className="text-muted fw-medium mb-4 px-3 fs-6">
                    <strong className="text-danger">WARNING:</strong> This will permanently delete the entire schedule for Class <strong className="text-dark">{selectedClass?.className}-{section}</strong>.
                  </p>
                )}

                <div className="d-flex gap-3 justify-content-center mt-2">
                  <button className="btn bg-light border text-dark fw-bold rounded-pill px-4 py-2" onClick={() => setDeleteTarget(null)} disabled={actionLoading}>Cancel Action</button>
                  <button className="btn btn-danger fw-bold rounded-pill px-4 py-2 shadow-sm" onClick={handleConfirmDelete} disabled={actionLoading}>
                    {actionLoading ? <span className="spinner-border spinner-border-sm"></span> : "Yes, Delete It"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}