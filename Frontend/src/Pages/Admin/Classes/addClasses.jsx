import React, { useEffect, useMemo, useState } from "react";
import api from "../../../api/api";
import "bootstrap/dist/css/bootstrap.min.css";

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

  // streams used only for 11-12
  const [streams, setStreams] = useState([]);

  // common sections for all classes
  const [sections, setSections] = useState([]);

  // add section form
  const [secName, setSecName] = useState("");
  const [secCap, setSecCap] = useState(40);

  // range generator
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

  // ✅ If class becomes 1-10, automatically clear streams (since not used)
  useEffect(() => {
    if (!isSenior && streams.length > 0) {
      setStreams([]);
    }
  }, [isSenior]); // eslint-disable-line react-hooks/exhaustive-deps

  const showSectionLabel = useMemo(() => {
    return Number.isInteger(classNum) ? (sec) => `${classNum}${sec}` : (sec) => sec;
  }, [classNum]);

  const setField = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  // ---------------- STREAMS (only 11-12) ----------------
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

  const removeStream = (idx) => setStreams((p) => p.filter((_, i) => i !== idx));

  const updateStreamSubjects = (idx, value) => {
    const options = String(value || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    setStreams((p) => p.map((s, i) => (i === idx ? { ...s, subjectOptions: options } : s)));
  };

  // ---------------- SECTIONS (COMMON) ----------------
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
    if (!cap || cap < 1) {
      setMessage({ type: "danger", text: "Capacity must be a valid number" });
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

  // ---------------- SUBMIT ----------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    if (!Number.isInteger(classNum) || classNum < 1 || classNum > 12) {
      return setMessage({ type: "danger", text: "Class must be between 1 and 12" });
    }
    if (!form.classTeacher) return setMessage({ type: "danger", text: "Please select class teacher" });

    // ✅ 1-10: streams not required
    // ✅ 11-12: streams required
    if (isSenior && streams.length === 0) {
      return setMessage({ type: "danger", text: "For class 11-12, please add at least 1 stream." });
    }
    if (isSenior) {
      const sci = streams.find((s) => String(s.name || "").toLowerCase() === "science");
      if (sci && (!sci.subjectOptions || sci.subjectOptions.length === 0)) {
        return setMessage({ type: "danger", text: "Science stream must have subject choices." });
      }
    }

    if (sections.length === 0) {
      return setMessage({ type: "danger", text: "Please add sections (A-Z) with capacity." });
    }

    // ensure no duplicates
    const dup = new Set();
    for (const s of sections) {
      if (dup.has(s.name)) return setMessage({ type: "danger", text: `Duplicate section "${s.name}"` });
      dup.add(s.name);
    }

    try {
      const payload = {
        className: classNum,
        academicYear: form.academicYear || "",
        classTeacher: form.classTeacher,
        streams: isSenior
          ? streams.map((s) => ({
              name: s.name,
              isActive: s.isActive,
              subjectOptions: s.subjectOptions || [],
            }))
          : [], // ✅ 1-10 = []
        sections,
      };

      const res = await api.post("/api/classes", payload);

      setMessage({ type: "success", text: res.data?.message || "Class created" });
      setForm({ className: "", academicYear: "", classTeacher: "" });
      setStreams([]);
      setSections([]);
      setSecName("");
      setSecCap(40);
      setRangeFrom("A");
      setRangeTo("Z");
      setRangeCap(40);
    } catch (err) {
      setMessage({ type: "danger", text: err?.response?.data?.message || "Error creating class" });
    }
  };

  return (
    <div className="container my-4">
      <div className="card shadow border-0 rounded-4 p-4 mx-auto" style={{ maxWidth: 980 }}>
        <h4 className="fw-bold text-center mb-3 text-warning">
          Create Class (1–10: Sections Only | 11–12: Streams + Sections)
        </h4>

        {message.text && <div className={`alert alert-${message.type} text-center`}>{message.text}</div>}

        <form onSubmit={handleSubmit}>
          {/* BASIC INFO */}
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label fw-semibold">Class (1–12) *</label>
              <input
                type="number"
                name="className"
                min="1"
                max="12"
                className="form-control rounded-pill"
                value={form.className}
                onChange={setField}
                required
              />
            </div>

            <div className="col-md-4">
              <label className="form-label fw-semibold">Academic Year</label>
              <input
                type="text"
                name="academicYear"
                className="form-control rounded-pill"
                placeholder="2025-26"
                value={form.academicYear}
                onChange={setField}
              />
            </div>

            <div className="col-md-4">
              <label className="form-label fw-semibold">Class Teacher *</label>
              <select
                name="classTeacher"
                className="form-select rounded-pill"
                value={form.classTeacher}
                onChange={setField}
                required
              >
                <option value="">-- Select Teacher --</option>
                {teachers.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* STREAMS: ONLY FOR 11-12 */}
          {isSenior && (
            <div className="mt-4">
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                <h6 className="fw-bold mb-0">Streams (Only for Class 11–12)</h6>
                <div className="d-flex gap-2 flex-wrap">
                  {STREAM_PRESETS.map((p) => (
                    <button
                      type="button"
                      key={p.name}
                      className="btn btn-outline-warning btn-sm rounded-pill"
                      onClick={() => addStream(p)}
                    >
                      + {p.name}
                    </button>
                  ))}
                </div>
              </div>

              {streams.length === 0 ? (
                <div className="text-muted small mt-2">No streams added.</div>
              ) : (
                <div className="table-responsive mt-2">
                  <table className="table table-sm align-middle">
                    <thead>
                      <tr>
                        <th>Stream</th>
                        <th>Subjects</th>
                        <th>Active</th>
                        <th className="text-end"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {streams.map((s, idx) => (
                        <tr key={`${s.name}-${idx}`}>
                          <td className="fw-semibold">{s.name}</td>
                          <td style={{ minWidth: 220 }}>
                            <input
                              className="form-control form-control-sm"
                              placeholder="Maths,Biology"
                              value={(s.subjectOptions || []).join(", ")}
                              onChange={(e) => updateStreamSubjects(idx, e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="checkbox"
                              checked={!!s.isActive}
                              onChange={(e) => toggleStreamActive(idx, e.target.checked)}
                            />
                          </td>
                          <td className="text-end">
                            <button
                              type="button"
                              className="btn btn-outline-danger btn-sm rounded-pill"
                              onClick={() => removeStream(idx)}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="text-muted small">
                    (Subjects are managed in Subject Module. Streams store only grouping/options.)
                  </div>
                </div>
              )}
            </div>
          )}

          {/* COMMON SECTIONS (FOR ALL CLASSES 1-12) */}
          <div className="mt-4">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
              <h6 className="fw-bold mb-0">Sections (Common)</h6>
              <div className="text-muted small">Display: <b>{Number.isInteger(classNum) ? `${classNum}A` : "11A"}</b></div>
            </div>

            <div className="border rounded-4 p-3 mt-2">
              {/* Add single section */}
              <div className="row g-2 align-items-end">
                <div className="col-md-3">
                  <label className="form-label small fw-semibold">Section (A–Z)</label>
                  <input
                    className="form-control form-control-sm rounded-pill"
                    placeholder="A"
                    value={secName}
                    onChange={(e) => setSecName(e.target.value)}
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

                <div className="col-md-2">
                  <button
                    type="button"
                    className="btn btn-warning btn-sm rounded-pill w-100"
                    onClick={() => {
                      addSection(secName, secCap);
                      setSecName("");
                    }}
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Range generator */}
              <div className="mt-3">
                <div className="small text-muted mb-2">Auto Generate (Range)</div>
                <div className="row g-2 align-items-end">
                  <div className="col-md-2">
                    <label className="form-label small fw-semibold">From</label>
                    <input
                      className="form-control form-control-sm rounded-pill"
                      value={rangeFrom}
                      onChange={(e) => setRangeFrom(e.target.value)}
                    />
                  </div>

                  <div className="col-md-2">
                    <label className="form-label small fw-semibold">To</label>
                    <input
                      className="form-control form-control-sm rounded-pill"
                      value={rangeTo}
                      onChange={(e) => setRangeTo(e.target.value)}
                    />
                  </div>

                  <div className="col-md-3">
                    <label className="form-label small fw-semibold">Capacity</label>
                    <input
                      type="number"
                      min="1"
                      className="form-control form-control-sm rounded-pill"
                      value={rangeCap}
                      onChange={(e) => setRangeCap(e.target.value)}
                    />
                  </div>

                  <div className="col-md-2">
                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm rounded-pill w-100"
                      onClick={() => generateRangeUI(rangeFrom, rangeTo, rangeCap)}
                    >
                      Generate
                    </button>
                  </div>

                  <div className="col-md-3 d-flex gap-2">
                    <button
                      type="button"
                      className="btn btn-outline-success btn-sm rounded-pill w-100"
                      onClick={() => generateRangeUI("A", "B", rangeCap)}
                    >
                      + A,B
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm rounded-pill w-100"
                      onClick={() => generateRangeUI("A", "Z", rangeCap)}
                    >
                      A–Z
                    </button>
                  </div>
                </div>
              </div>

              {/* List */}
              <div className="mt-3 small">
                {sortedSections.length === 0 ? (
                  <div className="text-muted">No sections yet.</div>
                ) : (
                  sortedSections.map((x) => (
                    <div
                      key={x.name}
                      className="d-flex align-items-center justify-content-between border rounded-pill px-3 py-1 mt-2"
                    >
                      <span>
                        <b>{showSectionLabel(x.name)}</b> <span className="text-muted">cap: {x.capacity}</span>
                      </span>
                      <button
                        type="button"
                        className="btn btn-link text-danger p-0"
                        onClick={() => removeSection(x.name)}
                      >
                        remove
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="text-center mt-4">
            <button className="btn btn-warning rounded-pill px-4 fw-semibold" type="submit">
              + Create Class
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
