import React, { useEffect, useState, useMemo } from "react";
import api from "../../../api/api";
import { Spinner } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

// --- SAAS COLOR PALETTE ---
const colors = {
  primary: "#4f46e5", // Indigo
  primaryLight: "#eef2ff",
  success: "#10b981", // Emerald
  successLight: "#ecfdf5",
  warning: "#f59e0b", // Amber
  warningLight: "#fffbeb",
  danger: "#ef4444", // Red
  dangerLight: "#fef2f2",
  info: "#3b82f6", // Blue
  infoLight: "#eff6ff",
  bg: "#f8fafc", // Slate 50
  surface: "#ffffff",
  textMain: "#0f172a", // Slate 900
  textMuted: "#64748b", // Slate 500
  border: "#e2e8f0" // Slate 200
};

// --- SAAS UI STYLES ---
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    background-color: ${colors.bg};
  }

  .fade-in { animation: fadeIn 0.4s ease-out forwards; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

  /* SaaS Cards */
  .saas-card {
    background: ${colors.surface};
    border-radius: 16px;
    border: 1px solid ${colors.border};
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -2px rgba(0, 0, 0, 0.02);
  }

  /* Seamless Tables */
  .saas-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
  }
  .saas-table th {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: ${colors.textMuted};
    padding: 1.25rem 1rem;
    border-bottom: 1px solid ${colors.border};
    border-right: 1px solid ${colors.border};
    background-color: #fcfcfd;
    vertical-align: middle;
  }
  .saas-table td {
    padding: 0.75rem;
    vertical-align: middle;
    border-bottom: 1px solid ${colors.border};
    border-right: 1px solid ${colors.border};
    color: ${colors.textMain};
    font-size: 0.9rem;
    transition: background-color 0.2s ease;
  }
  .saas-table th:last-child, .saas-table td:last-child {
    border-right: none;
  }
  .saas-table tr:last-child td { 
    border-bottom: none; 
  }
  .saas-table tbody td:hover { 
    background-color: #f1f5f9; 
  }

  /* Class Card styling inside table */
  .class-card {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    border-radius: 10px;
    border: 1px solid ${colors.border};
    border-left: 4px solid ${colors.primary}; /* Accent line */
    background-color: ${colors.surface};
  }
  .class-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  }
  
  /* Highlighted Today Column */
  .col-today {
    background-color: ${colors.primaryLight} !important;
  }
  .class-card.today-card {
    border-color: rgba(79, 70, 229, 0.3);
    box-shadow: 0 2px 8px rgba(79, 70, 229, 0.05);
  }

  /* Break Row Styling */
  .break-row {
    background: repeating-linear-gradient(
      45deg,
      ${colors.warningLight},
      ${colors.warningLight} 10px,
      #fef3c7 10px,
      #fef3c7 20px
    );
    color: #b45309;
    border-top: 1px solid #fde68a !important;
    border-bottom: 1px solid #fde68a !important;
  }

  /* Custom Scrollbar for the table wrapper */
  .custom-scrollbar::-webkit-scrollbar {
    height: 8px;
    width: 8px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
`;

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
      <div className="d-flex flex-column justify-content-center align-items-center min-vh-100" style={{ backgroundColor: colors.bg }}>
        <Spinner animation="border" style={{ color: colors.primary, width: '3rem', height: '3rem', borderWidth: '0.2em' }} />
        <p className="mt-3 fw-medium text-uppercase" style={{ color: colors.textMuted, letterSpacing: '1px', fontSize: '0.85rem' }}>Loading Timetable...</p>
      </div>
    );
  }

  return (
    <div className="pb-5 pt-3 fade-in" style={{ backgroundColor: colors.bg, minHeight: '100vh' }}>
      <style>{styles}</style>
      
      {/* Full width container with responsive horizontal padding */}
      <div className="container-fluid px-4 px-xl-5">
        
        {/* ---------- HEADER SECTION ---------- */}
        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-end mb-5 gap-4">
          <div>
            <div className="badge mb-2 px-3 py-2 rounded-pill fw-semibold shadow-sm" style={{ backgroundColor: colors.primaryLight, color: colors.primary, border: `1px solid rgba(79,70,229,0.2)`, letterSpacing: "0.5px" }}>
              <i className="bi bi-calendar-week me-2"></i>Academic Schedule
            </div>
            <h2 className="fw-bolder mb-1" style={{ color: colors.textMain, letterSpacing: '-0.5px' }}>
              Weekly Timetable
            </h2>
            <p className="mb-0 small fw-medium" style={{ color: colors.textMuted }}>
              View your classes, teachers, and daily periods all in one place.
            </p>
          </div>

          <div className="saas-card px-4 py-3 text-center d-flex flex-column justify-content-center min-w-120">
            <span className="d-block small fw-bold text-uppercase" style={{ color: colors.textMuted, letterSpacing: '0.05em', fontSize: '0.7rem' }}>Today is</span>
            <span className="fs-4 fw-bolder mt-1" style={{ color: colors.primary, letterSpacing: '-0.5px' }}>{currentDay}</span>
          </div>
        </div>

        {/* ---------- TIMETABLE CARD ---------- */}
        <div className="saas-card overflow-hidden">
          <div className="table-responsive custom-scrollbar">
            <table className="saas-table m-0">
              <thead>
                <tr>
                  {/* Empty Corner Header */}
                  <th className="text-center" style={{ width: '100px', backgroundColor: '#f8fafc' }}>
                    <i className="bi bi-clock-history fs-5" style={{ color: colors.textMuted, opacity: 0.5 }}></i>
                  </th>
                  
                  {/* Days Headers */}
                  {days.map(day => {
                    const isToday = day === currentDay;
                    return (
                      <th 
                        key={day} 
                        className={`text-center ${isToday ? 'col-today' : ''}`}
                        style={{ 
                          minWidth: '180px', 
                          borderBottom: isToday ? `3px solid ${colors.primary}` : `1px solid ${colors.border}`,
                          color: isToday ? colors.primary : colors.textMuted
                        }}
                      >
                        {day}
                        {isToday && <span className="ms-2 badge rounded-pill" style={{ backgroundColor: colors.primary, color: '#fff', fontSize: "0.6rem", padding: "0.25em 0.6em" }}>TODAY</span>}
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
                        <td className="text-center" style={{ backgroundColor: '#fcfcfd' }}>
                          <div className="fw-bolder fs-5" style={{ color: colors.textMain }}>{period}</div>
                          <div className="badge mt-1 d-block mx-auto fw-medium" style={{ backgroundColor: colors.surface, color: colors.textMuted, border: `1px solid ${colors.border}`, fontSize: '0.65rem', maxWidth: '90px' }}>
                            {timeMap?.[period] || "N/A"}
                          </div>
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
                              className={isToday ? 'col-today' : ''}
                              style={{ height: '130px', backgroundColor: isToday ? 'rgba(79, 70, 229, 0.02)' : 'transparent' }}
                            >
                              {entries.length ? (
                                <div className="d-flex flex-column gap-2 h-100 justify-content-center">
                                  {entries.map((entry, idx) => (
                                    <div 
                                      key={`${day}-${period}-${idx}`} 
                                      className={`p-3 d-flex flex-column justify-content-center class-card ${isToday ? 'today-card' : ''}`}
                                    >
                                      <div className="fw-semibold text-truncate mb-1" style={{ color: colors.textMain, fontSize: '0.9rem' }} title={entry.subject}>
                                        <i className="bi bi-book-half me-2" style={{ color: isToday ? colors.primary : colors.textMuted, opacity: isToday ? 1 : 0.7 }}></i>
                                        {entry.subject}
                                      </div>
                                      <div className="d-flex align-items-center">
                                        <i className="bi bi-person-video3 me-2" style={{ color: colors.textMuted, fontSize: '0.8rem' }}></i>
                                        <span className="fw-medium text-truncate" style={{ color: colors.textMuted, fontSize: '0.8rem' }}>
                                          {entry.teacher || "TBD"}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="d-flex h-100 align-items-center justify-content-center opacity-25">
                                  <i className="bi bi-dash-lg fs-4" style={{ color: colors.textMuted }}></i>
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                      
                      {/* Lunch Break Row */}
                      {period === 3 && (
                        <tr>
                          <td colSpan={7} className="p-0 border-0">
                            <div className="break-row py-3 d-flex justify-content-center align-items-center gap-3">
                              <i className="bi bi-cup-hot-fill fs-5"></i>
                              <span className="fw-bold text-uppercase" style={{ fontSize: '0.85rem', letterSpacing: '0.1em' }}>
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
                    <td colSpan={7} className="text-center py-5">
                      <div className="d-flex flex-column align-items-center justify-content-center opacity-50 py-5">
                        <i className="bi bi-calendar-x fs-1 mb-3" style={{ color: colors.textMuted }}></i>
                        <h5 className="fw-semibold mb-1" style={{ color: colors.textMain }}>No Schedule Available</h5>
                        <p className="mb-0 small" style={{ color: colors.textMuted }}>Your timetable has not been generated yet.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherTimeTable;