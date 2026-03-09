import { useEffect, useState } from "react";
import api from "../../../api/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "bootstrap/dist/css/bootstrap.min.css"; // Ensure Bootstrap is imported

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const periods = [1, 2, 3, 4, 5];

export default function ViewClassTimetable() {
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState("");
  const [timetable, setTimetable] = useState([]);

  useEffect(() => {
    api.get("/api/classes").then(res => setClasses(res.data));
  }, []);

  useEffect(() => {
    if (!classId) return;
    api.get(`/api/timetable/class/${classId}`)
      .then(res => setTimetable(res.data));
  }, [classId]);

  const selectedClass = classes.find(c => c._id === classId);

  const getCell = (day, period) =>
    timetable.find(t => t.day === day && t.period === period);

  /* ================= EXPORT PDF ================= */
  const exportPDF = async () => {
    if (!selectedClass) return alert("Please select a class");

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4"
    });

    /* ===== TRY LOAD LOGO (OPTIONAL) ===== */
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

    /* ===== HEADER ===== */
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
    
    doc.text(
      `Class ${selectedClass.className} - Weekly Timetable`,
      148,
      60,
      { align: "center" }
    );

    /* ===== TABLE DATA ===== */
    const tableHead = [["Period", ...days]];

    const tableBody = periods.map(period => [
      `Period ${period}`,
      ...days.map(day => {
        const cell = getCell(day, period);
        return cell
          ? `${cell.subject}\n${cell.teacherId?.name || cell.teacherName || ""}`
          : "-";
      })
    ]);

    /* ===== TABLE ===== */
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

    /* ===== SIGNATURE ===== */
    const finalY = doc.lastAutoTable.finalY + 15;

    doc.setFontSize(11);
    doc.text("_________________________", 40, finalY);
    doc.text("Class Teacher", 55, finalY + 6);

    doc.text("_________________________", 200, finalY);
    doc.text("Principal", 225, finalY + 6);

    /* ===== SAVE ===== */
    doc.save(`Class_${selectedClass.className}_Timetable_2025-26.pdf`);
  };

  return (
    <div className="bg-light min-vh-100 py-5">
      <div className="container-fluid px-5">
        
        {/* --- Header Section --- */}
        <div className="row mb-4 align-items-center">
          <div className="col">
            <h2 className="fw-bold text-dark mb-1">
              <i className="bi bi-grid-3x3-gap-fill text-primary me-2"></i>
              Class Timetable
            </h2>
            <p className="text-muted mb-0">View and manage schedules per class</p>
          </div>
          <div className="col-auto">
             <button
                className="btn btn-primary shadow-sm rounded-pill px-4 fw-semibold"
                disabled={!classId}
                onClick={exportPDF}
              >
                <i className="bi bi-file-earmark-pdf-fill me-2"></i>
                Download PDF
              </button>
          </div>
        </div>

        <div className="row g-4">
          
          {/* --- Sidebar: Class Selection --- */}
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
                    onChange={e => setClassId(e.target.value)}
                  >
                    <option value="">Choose...</option>
                    {classes.map(c => (
                      <option key={c._id} value={c._id}>
                        Class {c.className}
                      </option>
                    ))}
                  </select>
                </div>
                
                {classId ? (
                   <div className="mt-4 p-3 bg-light rounded text-center border border-primary border-opacity-25">
                     <small className="text-muted d-block text-uppercase">Currently Viewing</small>
                     <h3 className="text-primary fw-bold mb-0">Class {selectedClass?.className}</h3>
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

          {/* --- Main Content: Timetable Grid --- */}
          <div className="col-md-9 col-lg-10">
            <div className="card border-0 shadow-sm rounded-3 overflow-hidden h-100">
              <div className="card-body p-0">
                {classId ? (
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
                              const cell = getCell(day, period);
                              return (
                                <td key={day} className="p-3">
                                  {cell ? (
                                    <div className="card border-primary border-opacity-25 shadow-sm h-100">
                                      <div className="card-body p-2 d-flex flex-column justify-content-center">
                                        <div className="fw-bold text-dark text-truncate mb-1" title={cell.subject}>
                                          {cell.subject}
                                        </div>
                                        <div className="badge bg-primary bg-opacity-10 text-primary fw-normal text-truncate border border-primary border-opacity-10">
                                          <i className="bi bi-person-fill me-1"></i>
                                          {cell.teacherId?.name || cell.teacherName || "N/A"}
                                        </div>
                                      </div>
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
                    <h5 className="fw-normal">No Class Selected</h5>
                    <p className="mb-0 small">Select a class from the left menu to generate the timetable.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}