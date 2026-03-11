import React, { useEffect, useMemo, useState } from "react";
import api from "../../../api/api";
import "bootstrap/dist/css/bootstrap.min.css";

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
  }, [isSenior]);

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
    <div className="container py-4" style={{ maxWidth: "900px" }}>
      {/* Page Header */}
      <div className="d-flex align-items-center justify-content-between mb-4 pb-3 border-bottom">
        <div>
          <h2 className="fw-bold mb-1">New Class Setup</h2>
          <p className="text-muted mb-0">Define basic info, streams, and section capacity</p>
        </div>
        <button onClick={() => window.history.back()} className="btn btn-link text-decoration-none text-muted p-0">
          &larr; Back
        </button>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type} py-2 small shadow-sm`}>
          {message.text}
        </div>
      )}

      <form id="class-form" onSubmit={handleSubmit}>
        {/* Section 1: Basic Info */}
        <div className="mb-5">
          <h5 className="fw-bold mb-3">1. Basic Information</h5>
          <div className="row g-3">
            <div className="col-md-3">
              <label className="form-label small fw-semibold text-muted">Grade (1-12)</label>
              <input
                type="number"
                name="className"
                className="form-control"
                value={form.className}
                onChange={setField}
                required
              />
            </div>
            <div className="col-md-4">
              <label className="form-label small fw-semibold text-muted">Academic Year</label>
              <input
                type="text"
                name="academicYear"
                className="form-control"
                placeholder="2025-26"
                value={form.academicYear}
                onChange={setField}
              />
            </div>
            <div className="col-md-5">
              <label className="form-label small fw-semibold text-muted">Class Teacher</label>
              <select
                name="classTeacher"
                className="form-select"
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
          <div className="mb-5 border-top pt-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold mb-0">2. Senior Streams</h5>
              <div className="btn-group btn-group-sm">
                {STREAM_PRESETS.map((p) => (
                  <button key={p.name} type="button" className="btn btn-outline-secondary" onClick={() => addStream(p)}>
                    + {p.name}
                  </button>
                ))}
              </div>
            </div>

            {streams.length > 0 ? (
              <ul className="list-group border-0 shadow-sm">
                {streams.map((s, idx) => (
                  <li key={idx} className="list-group-item py-3 border">
                    <div className="d-flex align-items-center justify-content-between gap-3 mb-2">
                      <div className="fw-bold text-primary" style={{ minWidth: "100px" }}>{s.name}</div>
                      <div className="d-flex align-items-center gap-2">
                        <div className="form-check form-switch ms-2">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={!!s.isActive}
                            onChange={(e) => toggleStreamActive(idx, e.target.checked)}
                          />
                        </div>
                        <button type="button" className="btn btn-link text-danger p-0" onClick={() => removeStream(idx)}>
                          &times;
                        </button>
                      </div>
                    </div>

                    <div className="d-flex flex-wrap gap-2 mb-2">
                      {Array.from(new Set([...SUBJECT_CHOICE_LIBRARY, ...(s.subjectOptions || [])])).map((opt) => {
                        const selected = (s.subjectOptions || []).some(
                          (x) => String(x).toLowerCase() === String(opt).toLowerCase()
                        );
                        return (
                          <button
                            key={`${s.name}-${opt}`}
                            type="button"
                            className={`btn btn-sm rounded-pill ${selected ? "btn-primary" : "btn-outline-secondary"}`}
                            onClick={() => toggleStreamSubjectOption(idx, opt)}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>

                    <div className="input-group input-group-sm">
                      <input
                        className="form-control"
                        placeholder="Add custom choice (e.g. Computer Science)"
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
                      <button type="button" className="btn btn-outline-dark" onClick={() => addCustomStreamChoice(idx, s.name)}>
                        Add
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-4 border border-dashed rounded text-center text-muted">
                Add Science, Commerce, or Arts streams for Class 11-12
              </div>
            )}
          </div>
        )}

        {/* Section 3: Sections */}
        <div className="mb-5 border-top pt-4">
          <h5 className="fw-bold mb-3">{isSenior ? "3. Sections" : "2. Sections"}</h5>
          
          <div className="row g-4">
            {/* Left: Input Tools */}
            <div className="col-md-5">
              <div className="bg-light p-3 rounded">
                <p className="small fw-bold text-uppercase text-muted mb-2">Manual Add</p>
                <div className="input-group input-group-sm mb-3">
                  <input className="form-control" placeholder="Sec (A)" value={secName} onChange={(e) => setSecName(e.target.value)} />
                  <input type="number" className="form-control" placeholder="Cap" value={secCap} onChange={(e) => setSecCap(e.target.value)} />
                  <button className="btn btn-dark" type="button" onClick={() => { addSection(secName, secCap); setSecName(""); }}>Add</button>
                </div>

                <p className="small fw-bold text-uppercase text-muted mb-2">Generate Range</p>
                <div className="input-group input-group-sm mb-2">
                  <span className="input-group-text bg-white">From</span>
                  <input className="form-control" value={rangeFrom} onChange={(e) => setRangeFrom(e.target.value)} />
                  <span className="input-group-text bg-white">To</span>
                  <input className="form-control" value={rangeTo} onChange={(e) => setRangeTo(e.target.value)} />
                </div>
                <div className="input-group input-group-sm mb-3">
                  <span className="input-group-text bg-white">Capacity</span>
                  <input type="number" className="form-control" value={rangeCap} onChange={(e) => setRangeCap(e.target.value)} />
                  <button className="btn btn-outline-dark" type="button" onClick={() => generateRangeUI(rangeFrom, rangeTo, rangeCap)}>Go</button>
                </div>
                <div className="d-flex gap-2">
                    <button type="button" className="btn btn-link btn-sm text-decoration-none p-0" onClick={() => generateRangeUI("A", "B", rangeCap)}>+ A-B</button>
                    <button type="button" className="btn btn-link btn-sm text-decoration-none p-0" onClick={() => generateRangeUI("A", "D", rangeCap)}>+ A-D</button>
                </div>
              </div>
            </div>

            {/* Right: Active Sections List */}
            <div className="col-md-7">
              <div className="border rounded h-100 p-3 bg-white overflow-auto" style={{ maxHeight: "250px" }}>
                <p className="small fw-bold text-uppercase text-muted mb-3">Added Sections ({sortedSections.length})</p>
                <div className="d-flex flex-wrap gap-2">
                  {sortedSections.length === 0 ? (
                    <span className="text-muted small italic">No sections defined...</span>
                  ) : (
                    sortedSections.map((x) => (
                      <span key={x.name} className="badge bg-white border text-dark px-2 py-2 d-flex align-items-center">
                        <span className="fw-bold me-2">{showSectionLabel(x.name)}</span>
                        <span className="text-muted me-2" style={{ fontSize: '0.7rem' }}>Cap: {x.capacity}</span>
                        <button type="button" className="btn-close ms-1" style={{ width: '0.5em', height: '0.5em' }} onClick={() => removeSection(x.name)}></button>
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky-ish Bottom Submit (Mobile friendly) */}
        <div className="pt-3 border-top d-flex gap-3 align-items-center">
          <button type="submit" className="btn btn-primary px-5 btn-lg shadow-sm">
            Finalize and Create Class
          </button>
          <span className="text-muted small">Proceed to assign subjects after creation.</span>
        </div>
      </form>
    </div>
  );
}
