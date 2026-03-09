import React, { useEffect, useMemo, useState } from "react";
import api from "../../../api/api";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const STREAM_PRESETS = [
  { name: "Science", subjectOptions: ["Maths", "Biology"] },
  { name: "Commerce", subjectOptions: ["Maths", "IP"] },
  { name: "Arts", subjectOptions: ["History", "Geography"] },
];

const isValidSectionLetter = (v) => /^[A-Z]{1}$/.test(String(v || "").trim().toUpperCase());
const buildLetters = (from = "A", to = "Z") => {
  const a = String(from).toUpperCase().charCodeAt(0);
  const z = String(to).toUpperCase().charCodeAt(0);
  const out = [];
  for (let c = a; c <= z; c++) out.push(String.fromCharCode(c));
  return out;
};

export default function AllClasses() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [teachers, setTeachers] = useState([]);
  const [classTotals, setClassTotals] = useState({});
  const [overallTotals, setOverallTotals] = useState({
    totalStudents: 0,
    totalBoys: 0,
    totalGirls: 0,
    totalOther: 0,
  });

  // teacher edit (inline)
  const [editingTeacherClassId, setEditingTeacherClassId] = useState(null);
  const [updatedTeacher, setUpdatedTeacher] = useState("");

  // ✅ Manage Modal
  const [manageOpen, setManageOpen] = useState(false);
  const [manageSaving, setManageSaving] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);

  // editable data in modal
  const [editAcademicYear, setEditAcademicYear] = useState("");
  const [editStreams, setEditStreams] = useState([]);
  const [editSections, setEditSections] = useState([]);

  // sections add form inside modal
  const [secName, setSecName] = useState("");
  const [secCap, setSecCap] = useState(40);
  const [secStream, setSecStream] = useState(""); // ✅ NEW

  // section range generator
  const [rangeFrom, setRangeFrom] = useState("A");
  const [rangeTo, setRangeTo] = useState("Z");
  const [rangeCap, setRangeCap] = useState(40);
  const [rangeStream, setRangeStream] = useState(""); // ✅ NEW

  const isSenior = (cls) => Number(cls?.className) >= 11;

  const fetchTeachers = async () => {
    try {
      const res = await api.get("/api/classes/teachers");
      setTeachers(res.data || []);
    } catch {
      toast.error("Failed to fetch teachers!");
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/classes");
      const sorted = (res.data || []).sort((a, b) => Number(a.className) - Number(b.className));
      setClasses(sorted);

      let totalsMap = {};
      let overall = { totalStudents: 0, totalBoys: 0, totalGirls: 0, totalOther: 0 };

      for (const cls of sorted) {
        try {
          const res2 = await api.get(`/api/classes/total/${cls._id}`);
          totalsMap[cls._id] = res2.data;
          overall.totalStudents += res2.data.totalStudents || 0;
          overall.totalBoys += res2.data.totalBoys || 0;
          overall.totalGirls += res2.data.totalGirls || 0;
          overall.totalOther += res2.data.totalOther || 0;
        } catch {
          totalsMap[cls._id] = { totalStudents: 0, totalBoys: 0, totalGirls: 0, totalOther: 0 };
        }
      }

      setClassTotals(totalsMap);
      setOverallTotals(overall);
    } catch {
      toast.error("Failed to fetch classes!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchTeachers();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this class?")) return;
    try {
      await api.delete(`/api/classes/${id}`);
      toast.success("Class deleted successfully!");
      await fetchData();
    } catch {
      toast.error("Failed to delete class!");
    }
  };

  const handleEditTeacher = (cls) => {
    setEditingTeacherClassId(cls._id);
    setUpdatedTeacher(cls.classTeacher?._id || "");
    toast.info(`Editing Teacher for Class ${cls.className}`);
  };

  const handleUpdateTeacher = async (id) => {
    if (!updatedTeacher) return toast.warning("Please select a teacher before updating!");
    try {
      await api.put(`/api/classes/${id}`, { classTeacher: updatedTeacher });
      toast.success("Class teacher updated successfully!");
      setEditingTeacherClassId(null);
      await fetchData();
    } catch {
      toast.error("Failed to update class teacher!");
    }
  };

  // ✅ Open Manage Modal
  const openManage = (cls) => {
    setSelectedClass(cls);
    setEditAcademicYear(cls.academicYear || "");
    setEditStreams(Array.isArray(cls.streams) ? cls.streams.map((s) => ({ ...s })) : []);
    setEditSections(Array.isArray(cls.sections) ? cls.sections.map((s) => ({ ...s })) : []);

    // reset inputs
    setSecName("");
    setSecCap(40);
    setSecStream("");
    setRangeFrom("A");
    setRangeTo("Z");
    setRangeCap(40);
    setRangeStream("");

    setManageOpen(true);
  };

  const closeManage = () => {
    setManageOpen(false);
    setSelectedClass(null);
  };

  // ---------- STREAMS ----------
  const addStreamPreset = (preset) => {
    const exists = editStreams.some((s) => String(s.name).toLowerCase() === preset.name.toLowerCase());
    if (exists) return;
    setEditStreams((p) => [...p, { name: preset.name, isActive: true, subjectOptions: preset.subjectOptions || [] }]);
  };

  const updateStreamField = (idx, patch) => {
    setEditStreams((p) => p.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  };

  const removeStream = (idx) => {
    setEditStreams((p) => p.filter((_, i) => i !== idx));
  };

  // ✅ list for dropdown in sections (from streams or presets)
  const streamDropdownOptions = useMemo(() => {
    const active = editStreams.filter((s) => s?.isActive !== false).map((s) => String(s.name));
    const presetNames = STREAM_PRESETS.map((x) => x.name);
    const merged = Array.from(new Set([...active, ...presetNames])).filter(Boolean);
    return merged.sort((a, b) => a.localeCompare(b));
  }, [editStreams]);

  // ---------- SECTIONS ----------
  const sortedEditSections = useMemo(() => {
    return [...editSections].sort((a, b) => String(a.name).localeCompare(String(b.name)));
  }, [editSections]);

  const addSectionLocal = (name, capacity, streamVal) => {
    const sec = String(name || "").trim().toUpperCase();
    const cap = Number(capacity);
    const st = String(streamVal || "").trim();

    if (!isValidSectionLetter(sec)) return toast.warning("Section must be a single letter (A-Z)");
    if (!cap || cap < 1) return toast.warning("Capacity must be valid");
    const exists = editSections.some((x) => String(x.name).toUpperCase() === sec);
    if (exists) return toast.info(`Section ${sec} already exists`);

    setEditSections((p) => [
      ...p,
      { name: sec, capacity: cap, isActive: true, isLocked: false, stream: st }, // ✅ stream saved
    ]);
  };

  const removeSectionLocal = (letter) => {
    setEditSections((p) => p.filter((x) => String(x.name).toUpperCase() !== String(letter).toUpperCase()));
  };

  const updateSectionField = (letter, patch) => {
    setEditSections((p) =>
      p.map((x) => (String(x.name).toUpperCase() === String(letter).toUpperCase() ? { ...x, ...patch } : x))
    );
  };

  const generateRangeLocal = (from, to, capacity, streamVal) => {
    const start = String(from || "").trim().toUpperCase();
    const end = String(to || "").trim().toUpperCase();
    const cap = Number(capacity);
    const st = String(streamVal || "").trim();

    if (!isValidSectionLetter(start) || !isValidSectionLetter(end)) return toast.warning("Range must be letters A-Z");
    if (start.charCodeAt(0) > end.charCodeAt(0)) return toast.warning("From must be <= To");
    if (!cap || cap < 1) return toast.warning("Capacity must be valid");

    const letters = buildLetters(start, end);
    letters.forEach((ltr) => addSectionLocal(ltr, cap, st));
  };

  // ✅ Save modal changes
  const saveManage = async () => {
    if (!selectedClass?._id) return;

    const clsNum = Number(selectedClass.className);
    const senior = clsNum >= 11;

    if (editSections.length === 0) return toast.warning("Add at least one section.");

    if (senior && editStreams.length === 0) return toast.warning("For class 11-12, add at least one stream.");

    // validate unique + section name
    const seen = new Set();
    for (const s of editSections) {
      const name = String(s.name || "").toUpperCase();
      if (!isValidSectionLetter(name)) return toast.warning("Invalid section name. Use A-Z only.");
      if (seen.has(name)) return toast.warning(`Duplicate section "${name}" not allowed`);
      seen.add(name);

      const cap = Number(s.capacity);
      if (!cap || cap < 1) return toast.warning(`Invalid capacity for section ${name}`);

      // ✅ if class 11-12 and section has stream => stream must exist in streams list
      if (senior && String(s.stream || "").trim()) {
        const ok = editStreams.some(
          (st) => st?.isActive !== false && String(st.name).toLowerCase() === String(s.stream).toLowerCase()
        );
        if (!ok) return toast.warning(`Section ${name} stream "${s.stream}" not found in Streams list`);
      }
    }

    try {
      setManageSaving(true);

      const payload = {
        academicYear: String(editAcademicYear || "").trim(),
        streams: senior ? editStreams : [],
        sections: editSections.map((s) => ({
          name: String(s.name).trim().toUpperCase(),
          capacity: Number(s.capacity),
          isActive: s.isActive !== false,
          isLocked: !!s.isLocked,
          stream: String(s.stream || "").trim(), // ✅ save stream
        })),
      };

      await api.put(`/api/classes/${selectedClass._id}`, payload);
      toast.success("Class updated successfully!");
      closeManage();
      await fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update class!");
    } finally {
      setManageSaving(false);
    }
  };

  if (loading)
    return (
      <div className="text-center mt-5">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-3">Loading Classes...</p>
      </div>
    );

  return (
    <div className="container py-4">
      <ToastContainer position="top-right" autoClose={3000} theme="colored" />

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-bold text-primary">
          <i className="bi bi-building me-2"></i>All Classes
        </h3>
        <a href="/classes/new" className="btn btn-primary rounded-pill shadow-sm">
          <i className="bi bi-plus-circle me-2"></i>Add New Class
        </a>
      </div>

      <div className="row g-4">
        {classes.map((cls) => {
          const sections = Array.isArray(cls.sections)
            ? [...cls.sections].sort((a, b) => String(a.name).localeCompare(String(b.name)))
            : [];
          const streams = Array.isArray(cls.streams) ? cls.streams.filter((s) => s?.isActive !== false) : [];
          const senior = isSenior(cls);

          return (
            <div key={cls._id} className="col-md-4">
              <div className="card h-100 border-0 shadow-lg rounded-4">
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h5 className="fw-bold mb-0 text-primary">
                      <i className="bi bi-mortarboard-fill me-2"></i>Class {cls.className}
                    </h5>
                    <span className="badge bg-primary-subtle text-primary px-3 py-2 rounded-pill">
                      {classTotals[cls._id]?.totalStudents || 0} Students
                    </span>
                  </div>

                  {/* Sections preview */}
                  <div className="mb-3">
                    <div className="fw-semibold text-secondary mb-2">
                      <i className="bi bi-grid-3x3-gap me-2"></i>Sections
                    </div>
                    {sections.length === 0 ? (
                      <div className="text-muted small">No sections</div>
                    ) : (
                      <div className="d-flex flex-wrap gap-2">
                        {sections.slice(0, 8).map((sec) => (
                          <span
                            key={sec._id || sec.name}
                            className="badge bg-light text-dark border rounded-pill px-3 py-2"
                            title={`Cap: ${sec.capacity || 40} • Stream: ${sec.stream || "General"}`}
                          >
                            {cls.className}
                            {sec.name} <span className="text-muted">({sec.capacity || 40})</span>{" "}
                            {sec.stream ? <span className="text-primary">• {sec.stream}</span> : null}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Streams preview */}
                  {senior && (
                    <div className="mb-3">
                      <div className="fw-semibold text-secondary mb-2">
                        <i className="bi bi-diagram-3 me-2"></i>Streams
                      </div>
                      {streams.length === 0 ? (
                        <div className="text-muted small">No streams</div>
                      ) : (
                        <div className="d-flex flex-wrap gap-2">
                          {streams.map((s, idx) => (
                            <span key={`${s.name}-${idx}`} className="badge bg-warning-subtle text-warning rounded-pill px-3 py-2">
                              {s.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Teacher Edit / buttons */}
                  {editingTeacherClassId === cls._id ? (
                    <>
                      <label className="fw-semibold mb-2 text-secondary">Edit Class Teacher</label>
                      <select
                        className="form-select rounded-pill mb-3 shadow-sm"
                        value={updatedTeacher}
                        onChange={(e) => setUpdatedTeacher(e.target.value)}
                      >
                        <option value="">-- Select Teacher --</option>
                        {teachers.map((t) => (
                          <option key={t._id} value={t._id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                      <div className="d-flex justify-content-end gap-2">
                        <button className="btn btn-success btn-sm rounded-pill" onClick={() => handleUpdateTeacher(cls._id)}>
                          <i className="bi bi-check-lg"></i>
                        </button>
                        <button className="btn btn-outline-secondary btn-sm rounded-pill" onClick={() => setEditingTeacherClassId(null)}>
                          <i className="bi bi-x-lg"></i>
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="mb-2">
                        <strong>Teacher:</strong> {cls.classTeacher?.name || "N/A"}
                      </p>

                      <div className="d-flex justify-content-end mt-3 gap-2">
                        <button className="btn btn-outline-secondary btn-sm rounded-pill" onClick={() => openManage(cls)} title="Manage Streams & Sections">
                          <i className="bi bi-sliders"></i>
                        </button>
                        <button className="btn btn-outline-primary btn-sm rounded-pill" onClick={() => handleEditTeacher(cls)} title="Edit Teacher">
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button className="btn btn-outline-danger btn-sm rounded-pill" onClick={() => handleDelete(cls._id)} title="Delete">
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ✅ Manage Modal */}
      {manageOpen && (
        <div className="modal fade show" style={{ display: "block", background: "rgba(0,0,0,.45)" }}>
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content rounded-4 border-0 shadow">
              <div className="modal-header">
                <h5 className="modal-title fw-bold text-primary">
                  <i className="bi bi-sliders me-2"></i>Manage Class {selectedClass?.className}
                </h5>
                <button className="btn-close" onClick={closeManage}></button>
              </div>

              <div className="modal-body">
                {/* Academic Year */}
                <div className="mb-3">
                  <label className="form-label fw-semibold">Academic Year</label>
                  <input
                    className="form-control rounded-pill"
                    value={editAcademicYear}
                    onChange={(e) => setEditAcademicYear(e.target.value)}
                    placeholder="2025-26"
                  />
                </div>

                {/* Streams (only for 11-12) */}
                {Number(selectedClass?.className) >= 11 && (
                  <div className="mb-4">
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                      <h6 className="fw-bold mb-0">Streams</h6>
                      <div className="d-flex gap-2 flex-wrap">
                        {STREAM_PRESETS.map((p) => (
                          <button
                            key={p.name}
                            type="button"
                            className="btn btn-outline-warning btn-sm rounded-pill"
                            onClick={() => addStreamPreset(p)}
                          >
                            + {p.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {editStreams.length === 0 ? (
                      <div className="text-muted small mt-2">No streams</div>
                    ) : (
                      <div className="table-responsive mt-2">
                        <table className="table table-sm align-middle">
                          <thead>
                            <tr>
                              <th>Stream</th>
                              <th>Active</th>
                              <th className="text-end"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {editStreams.map((s, idx) => (
                              <tr key={`${s.name}-${idx}`}>
                                <td className="fw-semibold">{s.name}</td>
                                <td>
                                  <input
                                    type="checkbox"
                                    checked={s.isActive !== false}
                                    onChange={(e) => updateStreamField(idx, { isActive: e.target.checked })}
                                  />
                                </td>
                                <td className="text-end">
                                  <button type="button" className="btn btn-outline-danger btn-sm rounded-pill" onClick={() => removeStream(idx)}>
                                    Remove
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* ✅ Sections */}
                <div className="mb-2">
                  <h6 className="fw-bold mb-2">Sections (Common) + Stream Mapping</h6>

                  {/* Add single section */}
                  <div className="row g-2 align-items-end">
                    <div className="col-md-2">
                      <label className="form-label small fw-semibold">Section</label>
                      <input
                        className="form-control form-control-sm rounded-pill"
                        value={secName}
                        onChange={(e) => setSecName(e.target.value)}
                        placeholder="A"
                      />
                    </div>

                    <div className="col-md-3">
                      <label className="form-label small fw-semibold">Capacity</label>
                      <input
                        type="number"
                        min="1"
                        className="form-control form-control-sm rounded-pill"
                        value={secCap}
                        onChange={(e) => setSecCap(e.target.value)}
                      />
                    </div>

                    {/* ✅ NEW: stream dropdown */}
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">
                        Stream (optional)
                        {Number(selectedClass?.className) < 11 ? <span className="text-muted"> (for 11-12 only)</span> : null}
                      </label>
                      <select
                        className="form-select form-select-sm rounded-pill"
                        value={secStream}
                        onChange={(e) => setSecStream(e.target.value)}
                        disabled={Number(selectedClass?.className) < 11}
                      >
                        <option value="">General (No stream)</option>
                        {streamDropdownOptions.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-3">
                      <button
                        type="button"
                        className="btn btn-warning btn-sm rounded-pill w-100"
                        onClick={() => {
                          addSectionLocal(secName, secCap, secStream);
                          setSecName("");
                        }}
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  {/* Range generate */}
                  <div className="mt-3">
                    <div className="small text-muted mb-2">Auto Generate (Range)</div>
                    <div className="row g-2 align-items-end">
                      <div className="col-md-2">
                        <label className="form-label small fw-semibold">From</label>
                        <input className="form-control form-control-sm rounded-pill" value={rangeFrom} onChange={(e) => setRangeFrom(e.target.value)} />
                      </div>

                      <div className="col-md-2">
                        <label className="form-label small fw-semibold">To</label>
                        <input className="form-control form-control-sm rounded-pill" value={rangeTo} onChange={(e) => setRangeTo(e.target.value)} />
                      </div>

                      <div className="col-md-2">
                        <label className="form-label small fw-semibold">Capacity</label>
                        <input
                          type="number"
                          min="1"
                          className="form-control form-control-sm rounded-pill"
                          value={rangeCap}
                          onChange={(e) => setRangeCap(e.target.value)}
                        />
                      </div>

                      {/* ✅ NEW: stream for range */}
                      <div className="col-md-3">
                        <label className="form-label small fw-semibold">Stream</label>
                        <select
                          className="form-select form-select-sm rounded-pill"
                          value={rangeStream}
                          onChange={(e) => setRangeStream(e.target.value)}
                          disabled={Number(selectedClass?.className) < 11}
                        >
                          <option value="">General</option>
                          {streamDropdownOptions.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-md-3">
                        <button
                          type="button"
                          className="btn btn-outline-primary btn-sm rounded-pill w-100"
                          onClick={() => generateRangeLocal(rangeFrom, rangeTo, rangeCap, rangeStream)}
                        >
                          Generate
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* list sections */}
                  <div className="mt-3">
                    {sortedEditSections.length === 0 ? (
                      <div className="text-muted small">No sections</div>
                    ) : (
                      <div className="table-responsive">
                        <table className="table table-sm align-middle">
                          <thead>
                            <tr>
                              <th>Section</th>
                              <th style={{ width: 120 }}>Capacity</th>
                              <th style={{ width: 180 }}>Stream</th>
                              <th>Active</th>
                              <th>Locked</th>
                              <th className="text-end"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {sortedEditSections.map((s) => (
                              <tr key={s._id || s.name}>
                                <td className="fw-semibold">
                                  {selectedClass?.className}
                                  {String(s.name).toUpperCase()}
                                </td>

                                <td>
                                  <input
                                    type="number"
                                    min="1"
                                    className="form-control form-control-sm rounded-pill"
                                    value={Number(s.capacity || 40)}
                                    onChange={(e) => updateSectionField(s.name, { capacity: e.target.value })}
                                  />
                                </td>

                                {/* ✅ NEW: per-section stream dropdown */}
                                <td>
                                  <select
                                    className="form-select form-select-sm rounded-pill"
                                    value={String(s.stream || "")}
                                    onChange={(e) => updateSectionField(s.name, { stream: e.target.value })}
                                    disabled={Number(selectedClass?.className) < 11}
                                  >
                                    <option value="">General</option>
                                    {streamDropdownOptions.map((st) => (
                                      <option key={st} value={st}>
                                        {st}
                                      </option>
                                    ))}
                                  </select>
                                </td>

                                <td>
                                  <input
                                    type="checkbox"
                                    checked={s.isActive !== false}
                                    onChange={(e) => updateSectionField(s.name, { isActive: e.target.checked })}
                                  />
                                </td>

                                <td>
                                  <input
                                    type="checkbox"
                                    checked={!!s.isLocked}
                                    onChange={(e) => updateSectionField(s.name, { isLocked: e.target.checked })}
                                  />
                                </td>

                                <td className="text-end">
                                  <button type="button" className="btn btn-outline-danger btn-sm rounded-pill" onClick={() => removeSectionLocal(s.name)}>
                                    Remove
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* hint */}
                  {Number(selectedClass?.className) >= 11 && (
                    <div className="alert alert-info mt-3 rounded-4 mb-0">
                      <b>Tip:</b> Map sections to streams like:
                      <div className="mt-1 small">
                        Science → A,B &nbsp;&nbsp; | &nbsp;&nbsp; Commerce → C &nbsp;&nbsp; | &nbsp;&nbsp; Arts → D
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn btn-outline-secondary rounded-pill" onClick={closeManage} disabled={manageSaving}>
                  Cancel
                </button>
                <button className="btn btn-primary rounded-pill" onClick={saveManage} disabled={manageSaving}>
                  {manageSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
