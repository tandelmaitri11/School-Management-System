import React, { useEffect, useMemo, useState } from "react";
import api from "../../../api/api";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

const STREAM_PRESETS = [
  { name: "Science", subjectOptions: ["Maths", "Biology"] },
  { name: "Commerce", subjectOptions: ["Maths", "IP"] },
  { name: "Arts", subjectOptions: ["History", "Geography"] },
];
const SUBJECT_CHOICE_LIBRARY = Array.from(
  new Set(STREAM_PRESETS.flatMap((s) => s.subjectOptions || []))
);

const isValidSectionLetter = (v) => /^[A-Z]{1}$/.test(String(v || "").trim().toUpperCase());

const buildLetters = (from = "A", to = "Z") => {
  const a = String(from).toUpperCase().charCodeAt(0);
  const z = String(to).toUpperCase().charCodeAt(0);
  const out = [];
  for (let c = a; c <= z; c++) out.push(String.fromCharCode(c));
  return out;
};

export default function NewClass() {
  const [teachers, setTeachers] = useState([]);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [form, setForm] = useState({
    className: "",
    academicYear: "",
    classTeacher: "",
  });

  const classNum = Number(form.className);
  const isSenior = Number.isInteger(classNum) && classNum >= 11;

  const [streams, setStreams] = useState([]);
  const [customChoiceByStream, setCustomChoiceByStream] = useState({});
  const [sections, setSections] = useState([]);
  const [secName, setSecName] = useState("");
  const [secCap, setSecCap] = useState(40);
  const [rangeFrom, setRangeFrom] = useState("A");
  const [rangeTo, setRangeTo] = useState("Z");
  const [rangeCap, setRangeCap] = useState(40);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/api/classes/teachers");
        setTeachers(res.data || []);
      } catch {
        setMessage({ type: "danger", text: "Failed to load teachers" });
      }
    })();
  }, []);

  useEffect(() => {
    if (!isSenior && streams.length > 0) {
      setStreams([]);
    }
  }, [isSenior, streams.length]);

  const showSectionLabel = useMemo(() => {
    return Number.isInteger(classNum) ? (sec) => `${classNum}${sec}` : (sec) => sec;
  }, [classNum]);

  const setField = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const addStream = (preset) => {
    const exists = streams.some((s) => s.name.toLowerCase() === preset.name.toLowerCase());
    if (exists) return;
    setStreams((p) => [
      ...p,
      { name: preset.name, isActive: true, subjectOptions: preset.subjectOptions || [] },
    ]);
  };

  const toggleStreamActive = (idx, isActive) => {
    setStreams((p) => p.map((s, i) => (i === idx ? { ...s, isActive } : s)));
  };

  const removeStream = (idx) => {
    const key = String(streams[idx]?.name || "").toLowerCase();
    setStreams((p) => p.filter((_, i) => i !== idx));
    if (key) {
      setCustomChoiceByStream((p) => {
        const next = { ...p };
        delete next[key];
        return next;
      });
    }
  };

  const toggleStreamSubjectOption = (idx, choice) => {
    const option = String(choice || "").trim();
    if (!option) return;
    setStreams((prev) =>
      prev.map((s, i) => {
        if (i !== idx) return s;
        const current = Array.isArray(s.subjectOptions) ? s.subjectOptions : [];
        const exists = current.some((x) => String(x).toLowerCase() === option.toLowerCase());
        return {
          ...s,
          subjectOptions: exists
            ? current.filter((x) => String(x).toLowerCase() !== option.toLowerCase())
            : [...current, option],
        };
      })
    );
  };

  const addCustomStreamChoice = (idx, streamName) => {
    const key = String(streamName || "").toLowerCase();
    const raw = String(customChoiceByStream[key] || "").trim();
    if (!raw) return;
    toggleStreamSubjectOption(idx, raw);
    setCustomChoiceByStream((p) => ({ ...p, [key]: "" }));
  };

  const addSection = (name, capacity) => {
    const sec = String(name || "").trim().toUpperCase();
    const cap = Number(capacity);
    if (!isValidSectionLetter(sec)) {
      setMessage({ type: "danger", text: "Section must be a single letter (A-Z)" });
      return;
    }
    if (!cap || cap < 1) {
      setMessage({ type: "danger", text: "Capacity must be a valid number" });
      return;
    }
    const exists = sections.some((x) => String(x.name).toUpperCase() === sec);
    if (exists) return;
    setSections((p) => [...p, { name: sec, capacity: cap }]);
  };

  const generateRangeUI = (from, to, capacity) => {
    const start = String(from || "").trim().toUpperCase();
    const end = String(to || "").trim().toUpperCase();
    const cap = Number(capacity);
    if (!isValidSectionLetter(start) || !isValidSectionLetter(end)) {
      setMessage({ type: "danger", text: "Range must be single letters like A to Z" });
      return;
    }
    if (start.charCodeAt(0) > end.charCodeAt(0)) {
      setMessage({ type: "danger", text: "From must be <= To" });
      return;
    }
    buildLetters(start, end).forEach((ltr) => addSection(ltr, cap));
  };

  const removeSection = (secLetter) => {
    setSections((p) => p.filter((x) => String(x.name).toUpperCase() !== String(secLetter).toUpperCase()));
  };

  const sortedSections = useMemo(() => {
    return [...sections].sort((a, b) => a.name.localeCompare(b.name));
  }, [sections]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    if (!Number.isInteger(classNum) || classNum < 1 || classNum > 12) {
      return setMessage({ type: "danger", text: "Class must be between 1 and 12" });
    }
    if (!form.classTeacher) return setMessage({ type: "danger", text: "Please select class teacher" });

    if (isSenior && streams.length === 0) {
      return setMessage({ type: "danger", text: "For class 11-12, please add at least 1 stream." });
    }

    if (sections.length === 0) {
      return setMessage({ type: "danger", text: "Please add sections (A-Z) with capacity." });
    }

    try {
      const payload = {
        className: classNum,
        academicYear: form.academicYear || "",
        classTeacher: form.classTeacher,
        streams: isSenior ? streams : [],
        sections,
      };

      const res = await api.post("/api/classes", payload);
      setMessage({ type: "success", text: res.data?.message || "Class created successfully" });
      setForm({ className: "", academicYear: "", classTeacher: "" });
      setStreams([]);
      setCustomChoiceByStream({});
      setSections([]);
    } catch (err) {
      setMessage({ type: "danger", text: err?.response?.data?.message || "Error creating class" });
    }
  };

  return (
    <div className="container-fluid py-4" style={{ maxWidth: "1100px", fontFamily: "'Inter', sans-serif" }}>
      
      {/* Premium Custom CSS */}
      <style>{`
        .premium-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); }
        .input-premium { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 16px; transition: all 0.2s; font-weight: 500; color: #0f172a; }
        .input-premium:focus { border-color: #4f46e5; box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1); background: #ffffff; outline: none; }
        .btn-brand { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); border: none; color: white; transition: all 0.2s; }
        .btn-brand:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(79, 70, 229, 0.3); color: white; }
        .stream-box { border: 1px solid #e2e8f0; border-radius: 12px; transition: all 0.2s; background: #ffffff; }
        .stream-box:hover { border-color: rgba(79, 70, 229, 0.3); box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
        .form-label { font-size: 0.8rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.5rem; }
        .form-switch .form-check-input { width: 2.5em; height: 1.25em; cursor: pointer; }
        .form-switch .form-check-input:checked { background-color: #10b981; border-color: #10b981; }
        .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* Header Card */}
      <div 
        className="rounded-4 overflow-hidden mb-4 shadow-sm border-0 position-relative p-4 p-md-5"
        style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)" }}
      >
        <div style={{ position: 'absolute', top: '-50%', right: '-5%', width: '300px', height: '300px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}></div>
        <div className="position-relative z-1 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div>
            <span className="badge px-3 py-2 rounded-pill fw-semibold mb-3" style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.3)', color: 'white' }}>
              <i className="bi bi-building-add me-1"></i> Directory Management
            </span>
            <h2 className="display-6 fw-bolder text-white mb-1" style={{ letterSpacing: '-1px' }}>New Class Setup</h2>
            <p className="text-white opacity-75 fw-medium mb-0">Define basic information, streams, and section capacities.</p>
          </div>
          <button onClick={() => window.history.back()} className="btn bg-white rounded-circle shadow-sm d-flex justify-content-center align-items-center transition-all hover-scale" style={{ width: 48, height: 48 }}>
            <i className="bi bi-arrow-left fs-5" style={{ color: '#4f46e5' }}></i>
          </button>
        </div>
      </div>

      {message.text && (
        <div className={`alert ${message.type === 'danger' ? 'alert-danger border-danger' : 'alert-success border-success'} bg-white py-3 px-4 rounded-4 shadow-sm border-start border-4 mb-4 d-flex align-items-center`}>
          <i className={`bi ${message.type === 'danger' ? 'bi-exclamation-triangle-fill text-danger' : 'bi-check-circle-fill text-success'} fs-4 me-3`}></i>
          <span className="fw-medium">{message.text}</span>
        </div>
      )}

      <form id="class-form" onSubmit={handleSubmit}>
        
        {/* Section 1: Basic Info */}
        <div className="premium-card p-4 p-md-5 mb-4">
          <h5 className="fw-bolder mb-4 d-flex align-items-center" style={{ color: '#0f172a' }}>
            <div className="rounded-circle d-flex align-items-center justify-content-center me-3 shadow-sm" style={{ width: 36, height: 36, background: '#e0e7ff', color: '#4f46e5' }}>1</div>
            Basic Information
          </h5>
          <div className="row g-4">
            <div className="col-12 col-md-4 col-lg-3">
              <label className="form-label">Grade Level (1-12)</label>
              <input
                type="number"
                name="className"
                className="form-control input-premium fs-5"
                placeholder="e.g. 10"
                value={form.className}
                onChange={setField}
                required
              />
            </div>
            <div className="col-12 col-md-4 col-lg-4">
              <label className="form-label">Academic Year Label</label>
              <input
                type="text"
                name="academicYear"
                className="form-control input-premium fs-5"
                placeholder="e.g. 2025-26"
                value={form.academicYear}
                onChange={setField}
              />
            </div>
            <div className="col-12 col-md-4 col-lg-5">
              <label className="form-label">Assigned Class Teacher</label>
              <select
                name="classTeacher"
                className="form-select input-premium fs-5"
                value={form.classTeacher}
                onChange={setField}
                required
              >
                <option value="">Select a teacher...</option>
                {teachers.map((t) => (
                  <option key={t._id} value={t._id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Streams (Conditionally Rendered) */}
        {isSenior && (
          <div className="premium-card p-4 p-md-5 mb-4 animate-fade-in">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
              <h5 className="fw-bolder mb-0 d-flex align-items-center" style={{ color: '#0f172a' }}>
                <div className="rounded-circle d-flex align-items-center justify-content-center me-3 shadow-sm" style={{ width: 36, height: 36, background: '#e0e7ff', color: '#4f46e5' }}>2</div>
                Senior Streams
              </h5>
              <div className="d-flex flex-wrap gap-2">
                {STREAM_PRESETS.map((p) => (
                  <button key={p.name} type="button" className="btn btn-sm border bg-light text-dark fw-semibold rounded-pill px-3" onClick={() => addStream(p)}>
                    <i className="bi bi-plus me-1"></i> {p.name}
                  </button>
                ))}
              </div>
            </div>

            {streams.length > 0 ? (
              <div className="d-flex flex-column gap-3">
                {streams.map((s, idx) => (
                  <div key={idx} className="stream-box p-4">
                    <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-3 border-bottom pb-3">
                      <div className="fw-bolder fs-5 text-dark d-flex align-items-center">
                        <i className="bi bi-diagram-3-fill text-primary me-2"></i> {s.name}
                      </div>
                      <div className="d-flex align-items-center gap-3">
                        <div className="form-check form-switch d-flex align-items-center gap-2 m-0 p-0">
                          <label className="form-check-label small fw-bold text-muted mb-0 me-2">ACTIVE</label>
                          <input
                            className="form-check-input m-0"
                            type="checkbox"
                            checked={!!s.isActive}
                            onChange={(e) => toggleStreamActive(idx, e.target.checked)}
                          />
                        </div>
                        <div className="vr d-none d-md-block" style={{ backgroundColor: '#cbd5e1' }}></div>
                        <button type="button" className="btn btn-sm btn-light text-danger rounded-circle p-2" onClick={() => removeStream(idx)}>
                          <i className="bi bi-trash3-fill"></i>
                        </button>
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="small fw-bold text-muted text-uppercase mb-2 d-block" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Allowed Subject Combinations</label>
                      <div className="d-flex flex-wrap gap-2">
                        {Array.from(new Set([...SUBJECT_CHOICE_LIBRARY, ...(s.subjectOptions || [])])).map((opt) => {
                          const selected = (s.subjectOptions || []).some(
                            (x) => String(x).toLowerCase() === String(opt).toLowerCase()
                          );
                          return (
                            <button
                              key={`${s.name}-${opt}`}
                              type="button"
                              className={`badge border-0 px-3 py-2 fw-medium fs-6 ${selected ? "bg-primary text-white" : "bg-light text-muted border border-secondary"}`}
                              onClick={() => toggleStreamSubjectOption(idx, opt)}
                              style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="input-group" style={{ maxWidth: '400px' }}>
                      <input
                        className="form-control input-premium py-2"
                        placeholder="Add custom subject (e.g. Comp Sci)"
                        value={customChoiceByStream[String(s.name || "").toLowerCase()] || ""}
                        onChange={(e) =>
                          setCustomChoiceByStream((p) => ({
                            ...p,
                            [String(s.name || "").toLowerCase()]: e.target.value,
                          }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addCustomStreamChoice(idx, s.name);
                          }
                        }}
                      />
                      <button type="button" className="btn bg-light border fw-semibold text-dark px-4" onClick={() => addCustomStreamChoice(idx, s.name)}>
                        Add
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-5 border border-dashed rounded-4 text-center bg-light">
                <i className="bi bi-diagram-2 text-muted fs-1 mb-2 d-block opacity-50"></i>
                <h6 className="fw-bold text-dark">No Streams Configured</h6>
                <p className="text-muted small mb-0">Select Science, Commerce, or Arts from the presets above to configure stream combinations for Class 11 & 12.</p>
              </div>
            )}
          </div>
        )}

        {/* Section 3: Sections */}
        <div className="premium-card p-4 p-md-5 mb-4">
          <h5 className="fw-bolder mb-4 d-flex align-items-center" style={{ color: '#0f172a' }}>
            <div className="rounded-circle d-flex align-items-center justify-content-center me-3 shadow-sm" style={{ width: 36, height: 36, background: '#e0e7ff', color: '#4f46e5' }}>
              {isSenior ? "3" : "2"}
            </div>
            Class Sections & Capacities
          </h5>
          
          <div className="row g-4 h-100">
            {/* Left: Input Tools */}
            <div className="col-12 col-lg-5">
              <div className="bg-light p-4 rounded-4 border h-100">
                
                {/* Auto Gen */}
                <div className="mb-4">
                  <h6 className="fw-bolder text-dark mb-3 small text-uppercase d-flex align-items-center" style={{ letterSpacing: '0.5px' }}>
                    <i className="bi bi-lightning-charge-fill text-warning me-2 fs-5"></i> Quick Generate
                  </h6>
                  <div className="row g-2 mb-2">
                    <div className="col-6">
                      <label className="form-label">From Section</label>
                      <input className="form-control input-premium py-2 text-center text-uppercase fw-bold" placeholder="A" value={rangeFrom} onChange={(e) => setRangeFrom(e.target.value)} maxLength={1} />
                    </div>
                    <div className="col-6">
                      <label className="form-label">To Section</label>
                      <input className="form-control input-premium py-2 text-center text-uppercase fw-bold" placeholder="Z" value={rangeTo} onChange={(e) => setRangeTo(e.target.value)} maxLength={1} />
                    </div>
                  </div>
                  <div className="row g-2">
                    <div className="col-8">
                      <label className="form-label">Default Capacity</label>
                      <input type="number" className="form-control input-premium py-2" value={rangeCap} onChange={(e) => setRangeCap(e.target.value)} />
                    </div>
                    <div className="col-4 d-flex align-items-end">
                      <button className="btn btn-dark w-100 py-2 fw-semibold rounded-3" type="button" onClick={() => generateRangeUI(rangeFrom, rangeTo, rangeCap)}>Go</button>
                    </div>
                  </div>
                  <div className="d-flex gap-2 mt-3">
                    <button type="button" className="badge bg-white text-dark border px-3 py-2 text-decoration-none fw-semibold shadow-sm" onClick={() => generateRangeUI("A", "B", rangeCap)}>+ Gen A-B</button>
                    <button type="button" className="badge bg-white text-dark border px-3 py-2 text-decoration-none fw-semibold shadow-sm" onClick={() => generateRangeUI("A", "D", rangeCap)}>+ Gen A-D</button>
                  </div>
                </div>

                <hr className="border-secondary opacity-10 my-4"/>

                {/* Manual Add */}
                <div>
                  <h6 className="fw-bolder text-dark mb-3 small text-uppercase d-flex align-items-center" style={{ letterSpacing: '0.5px' }}>
                    <i className="bi bi-plus-circle-fill text-primary me-2 fs-5"></i> Manual Add
                  </h6>
                  <div className="row g-2">
                    <div className="col-5">
                      <label className="form-label">Section ID</label>
                      <input className="form-control input-premium py-2 text-center text-uppercase fw-bold" placeholder="E" value={secName} onChange={(e) => setSecName(e.target.value)} maxLength={1} />
                    </div>
                    <div className="col-4">
                      <label className="form-label">Capacity</label>
                      <input type="number" className="form-control input-premium py-2" placeholder="40" value={secCap} onChange={(e) => setSecCap(e.target.value)} />
                    </div>
                    <div className="col-3 d-flex align-items-end">
                      <button className="btn bg-white border w-100 py-2 fw-semibold rounded-3 text-dark shadow-sm" type="button" onClick={() => { addSection(secName, secCap); setSecName(""); }}>Add</button>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Right: Active Sections List */}
            <div className="col-12 col-lg-7">
              <div className="border rounded-4 h-100 p-4 bg-white d-flex flex-column">
                <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                  <h6 className="fw-bolder text-dark mb-0 small text-uppercase" style={{ letterSpacing: '0.5px' }}>Added Sections</h6>
                  <span className="badge bg-primary rounded-pill px-3 py-1">{sortedSections.length} Total</span>
                </div>
                
                <div className="d-flex flex-wrap gap-3 overflow-auto custom-scroll flex-grow-1" style={{ maxHeight: "300px", alignContent: "flex-start" }}>
                  {sortedSections.length === 0 ? (
                    <div className="w-100 h-100 d-flex flex-column align-items-center justify-content-center text-muted opacity-50 py-5">
                      <i className="bi bi-grid fs-1 mb-2"></i>
                      <span className="fw-medium small">No sections defined yet.</span>
                    </div>
                  ) : (
                    sortedSections.map((x) => (
                      <div key={x.name} className="d-flex align-items-center bg-light border rounded-3 p-2 shadow-sm" style={{ minWidth: '130px' }}>
                        <div className="d-flex align-items-center justify-content-center rounded bg-white text-primary fw-bolder border shadow-sm me-2" style={{ width: 40, height: 40, fontSize: '1.2rem' }}>
                          {showSectionLabel(x.name)}
                        </div>
                        <div className="flex-grow-1">
                          <div className="text-muted fw-bold" style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Capacity</div>
                          <div className="fw-bolder text-dark lh-1">{x.capacity}</div>
                        </div>
                        <button type="button" className="btn btn-sm btn-link text-danger p-1 ms-1 text-decoration-none" onClick={() => removeSection(x.name)}>
                          <i className="bi bi-x-circle-fill fs-5"></i>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Bottom Action Bar */}
        <div className="premium-card p-4 d-flex flex-column flex-md-row justify-content-between align-items-center gap-3 mt-4 mb-5" style={{ position: 'sticky', bottom: '20px', zIndex: 100 }}>
          <div className="d-flex align-items-center text-muted">
            <i className="bi bi-shield-check fs-4 text-success me-3"></i>
            <div>
              <div className="fw-bold text-dark">Ready to finalize?</div>
              <div className="small fw-medium">You can proceed to assign subjects and students after creation.</div>
            </div>
          </div>
          <button type="submit" className="btn btn-brand btn-lg rounded-pill px-5 py-3 fw-bold shadow-sm w-100 w-md-auto">
            Create Class Directory <i className="bi bi-arrow-right ms-2"></i>
          </button>
        </div>

      </form>
    </div>
  );
}