import React, { useEffect, useState, useMemo } from "react";
import api from "../../../api/api";
import { Spinner, Table, Badge, Container, Card } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

const TeacherTimeTable = () => {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  
  const studentId = localStorage.getItem("studentId");
  const token = localStorage.getItem("token");

  // --- 1. FETCH DATA (UNCHANGED) ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get(`/api/students/timetable/${studentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setData(res.data || {});
      } catch (err) {
        console.error("Error fetching timetable:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [studentId, token]);

  // --- 2. DATA PROCESSING (UNCHANGED) ---
  const { periods, gridData, timeMap } = useMemo(() => {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    const fallbackPeriods = [1, 2, 3, 4, 5];
    const periodTimes = [
      { period: 1, start: "09:00", end: "10:00" },
      { period: 2, start: "10:00", end: "11:00" },
      { period: 3, start: "11:15", end: "12:15" },
      { type: "break", start: "12:15", end: "14:00" },
      { period: 4, start: "14:00", end: "15:00" },
      { period: 5, start: "15:00", end: "16:00" },
    ];
    const periodTimeMap = periodTimes.reduce((acc, p) => {
      if (p.period) acc[p.period] = `${p.start} - ${p.end}`;
      return acc;
    }, {});
    const firstDay = days.find((d) => Array.isArray(data?.[d]));
    const periodCount = firstDay ? data[firstDay].length : fallbackPeriods.length;
    const uniquePeriods = Array.from({ length: periodCount }, (_, i) => i + 1);

    // Create a 2D Map: gridData[period][day] = ClassInfo
    const map = {};
    
    // Initialize empty grid
    uniquePeriods.forEach(p => {
      map[p] = {};
      days.forEach(d => {
        map[p][d] = null;
      });
    });

    // Populate grid
    days.forEach((day) => {
      const entries = Array.isArray(data?.[day]) ? data[day] : [];
      uniquePeriods.forEach((p, idx) => {
        if (map[p]) {
          map[p][day] = entries[idx] || null;
        }
      });
    });

    return { periods: uniquePeriods, gridData: map, timeMap: periodTimeMap };
  }, [data]);

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  if (loading) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center min-vh-100 bg-light">
        <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
        <p className="mt-3 fw-semibold text-muted tracking-wide">Loading Timetable...</p>
      </div>
    );
  }

  return (
    <div className="bg-light min-vh-100 py-4 py-md-5">
      <Container fluid="xl">
        
        {/* ---------- HEADER SECTION ---------- */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end mb-4 gap-3">
          <div>
            <Badge bg="primary" className="bg-opacity-10 text-primary mb-2 px-3 py-2 rounded-pill border border-primary border-opacity-25">
              <i className="bi bi-calendar-week me-2"></i>Academic Schedule
            </Badge>
            <h2 className="fw-bolder text-dark mb-1" style={{ letterSpacing: '-0.5px' }}>
              Weekly Timetable
            </h2>
            <p className="text-secondary mb-0 small">
              View your classes, teachers, and daily periods all in one place.
            </p>
          </div>

          <div className="bg-white border shadow-sm px-4 py-2 rounded-4 text-center">
            <span className="d-block text-muted small fw-bold text-uppercase tracking-wider">Today is</span>
            <span className="fs-5 fw-bolder text-primary">{currentDay}</span>
          </div>
        </div>

        {/* ---------- TIMETABLE CARD ---------- */}
        <Card className="border-0 shadow-sm rounded-4 overflow-hidden bg-white">
          <div className="table-responsive timetable-scroll">
            <Table bordered hover className="align-middle mb-0 custom-timetable border-light">
              <thead className="bg-light">
                <tr>
                  {/* Empty Corner Header */}
                  <th className="py-3 text-center bg-light border-end-0" style={{ width: '100px' }}>
                    <i className="bi bi-clock-history fs-5 text-secondary opacity-50"></i>
                  </th>
                  
                  {/* Days Headers */}
                  {days.map(day => {
                    const isToday = day === currentDay;
                    return (
                      <th 
                        key={day} 
                        className={`py-3 text-center text-uppercase fw-bold tracking-wide border-light ${
                          isToday ? 'bg-primary bg-opacity-10 text-primary border-bottom border-primary border-2' : 'bg-light text-secondary'
                        }`}
                        style={{ minWidth: '160px', fontSize: '0.8rem' }}
                      >
                        {day}
                        {isToday && <span className="ms-2 badge bg-primary rounded-pill" style={{ fontSize: "0.6rem" }}>TODAY</span>}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              
              <tbody>
                {periods.length > 0 ? (
                  periods.map((period) => (
                    <React.Fragment key={period}>
                      <tr>
                        {/* Period Row Header (Left Column) */}
                        <td className="text-center bg-light border-light py-3">
                          <div className="fw-bolder fs-5 text-dark">{period}</div>
                          <Badge bg="white" text="secondary" className="border shadow-sm mt-1 d-block mx-auto fw-medium" style={{ fontSize: '0.65rem', maxWidth: '80px' }}>
                            {timeMap?.[period] || "N/A"}
                          </Badge>
                        </td>

                        {/* Day Cells */}
                        {days.map((day) => {
                          const classInfo = gridData[period][day];
                          const isToday = day === currentDay;
                          const entries = Array.isArray(classInfo)
                            ? classInfo
                            : classInfo
                            ? [classInfo]
                            : [];

                          return (
                            <td 
                              key={day} 
                              className={`p-2 border-light position-relative cell-hover transition-all ${
                                isToday ? 'bg-primary bg-opacity-10' : 'bg-white'
                              }`}
                              style={{ height: '120px' }}
                            >
                              {entries.length ? (
                                <div className="d-flex flex-column gap-2 h-100 justify-content-center">
                                  {entries.map((entry, idx) => (
                                    <div 
                                      key={`${day}-${period}-${idx}`} 
                                      className={`p-2 rounded-3 border shadow-sm d-flex flex-column justify-content-center class-card ${
                                        isToday ? 'bg-white border-primary border-opacity-25' : 'bg-light border-light-subtle'
                                      }`}
                                    >
                                      <div className="fw-bold text-dark text-truncate mb-1" style={{ fontSize: '0.85rem' }} title={entry.subject}>
                                        <i className={`bi bi-book-half me-2 ${isToday ? 'text-primary' : 'text-secondary'}`}></i>
                                        {entry.subject}
                                      </div>
                                      <div className="d-flex align-items-center">
                                        <i className="bi bi-person-video3 text-muted me-1" style={{ fontSize: '0.75rem' }}></i>
                                        <span className="text-muted fw-medium text-truncate" style={{ fontSize: '0.75rem' }}>
                                          {entry.teacher || "TBD"}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="d-flex h-100 align-items-center justify-content-center opacity-25">
                                  <i className="bi bi-dash-lg fs-4 text-secondary"></i>
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                      
                      {/* Lunch Break Row */}
                      {period === 3 && (
                        <tr>
                          <td colSpan={7} className="p-0 border-light">
                            <div className="break-row py-2 d-flex justify-content-center align-items-center gap-2">
                              <i className="bi bi-cup-hot-fill fs-5"></i>
                              <span className="fw-bolder tracking-wider text-uppercase" style={{ fontSize: '0.85rem' }}>
                                Lunch Break • 12:15 PM - 02:00 PM
                              </span>
                              <i className="bi bi-cup-hot-fill fs-5"></i>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-5 bg-white">
                      <div className="d-flex flex-column align-items-center justify-content-center opacity-50 py-4">
                        <i className="bi bi-calendar-x fs-1 text-secondary mb-3"></i>
                        <h5 className="fw-bold text-dark mb-1">No Schedule Available</h5>
                        <p className="text-muted mb-0 small">Your timetable has not been generated yet.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Card>
      </Container>

      {/* ---------- CUSTOM CSS ---------- */}
      <style>{`
        .tracking-wide {
          letter-spacing: 0.5px;
        }
        .tracking-wider {
          letter-spacing: 1.5px;
        }
        .transition-all {
          transition: all 0.2s ease;
        }
        
        /* Table Styling */
        .custom-timetable th, .custom-timetable td {
          vertical-align: middle;
        }
        .cell-hover:hover {
          background-color: #f8f9fa !important;
        }
        
        /* Class Card styling inside table */
        .class-card {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          border-left: 3px solid #0d6efd !important; /* Left accent line */
        }
        .class-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.05) !important;
        }
        
        /* Break Row Styling */
        .break-row {
          background: repeating-linear-gradient(
            45deg,
            #fffbeb,
            #fffbeb 10px,
            #fef3c7 10px,
            #fef3c7 20px
          );
          color: #b45309;
          border-top: 1px solid #fde68a;
          border-bottom: 1px solid #fde68a;
        }

        /* Custom Scrollbar for the table wrapper */
        .timetable-scroll::-webkit-scrollbar {
          height: 8px;
          width: 8px;
        }
        .timetable-scroll::-webkit-scrollbar-track {
          background: #f1f5f9;
        }
        .timetable-scroll::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        .timetable-scroll::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
};

export default TeacherTimeTable;