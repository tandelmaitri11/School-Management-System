import React, { useEffect, useState, useMemo } from "react";
import api from "../../../api/api";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Spinner } from "react-bootstrap";

ChartJS.register(ArcElement, Tooltip, Legend);

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

  /* Calendar Grid Styling */
  .calendar-cell {
    transition: background-color 0.2s ease;
    border-bottom: 1px solid ${colors.border};
    border-right: 1px solid ${colors.border};
  }
  .calendar-cell:nth-child(7n) {
    border-right: none !important;
  }
  .calendar-row:last-child .calendar-cell {
    border-bottom: none !important;
  }
  .cell-hover:hover {
    background-color: #f1f5f9 !important;
  }

  /* Navigation Buttons */
  .nav-btn {
    transition: all 0.2s ease;
    background: #ffffff;
    color: ${colors.textMain};
    border: 1px solid ${colors.border};
    box-shadow: 0 1px 2px rgba(0,0,0,0.02);
  }
  .nav-btn:hover {
    background: ${colors.bg};
    border-color: #cbd5e1;
    transform: scale(1.05);
  }

  /* Status Badges */
  .status-badge {
    box-shadow: 0 2px 4px rgba(0,0,0,0.02);
  }
`;

export default function ViewAttendanceCalendar() {
  const [attendanceData, setAttendanceData] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  const parseAttendanceDate = (ymd) => {
    const [y, m, d] = String(ymd || "").split("-").map(Number);
    if (!y || !m || !d) return null;
    return { year: y, monthIndex: m - 1, day: d };
  };

  // --- FETCH DATA (UNCHANGED) ---
  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const res = await api.get("/api/attendance/my");
        setAttendanceData(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Failed to load attendance");
        setAttendanceData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, []);

  // --- LOGIC (UNCHANGED) ---
  const daysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const changeMonth = (offset) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
  };

  // --- DATA PROCESSING (UNCHANGED) ---
  const monthData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const records = attendanceData.filter(a => {
      const d = parseAttendanceDate(a?.date);
      return d && d.year === year && d.monthIndex === month;
    });

    const statusMap = {};
    records.forEach(r => {
      const d = parseAttendanceDate(r?.date);
      if (d) statusMap[d.day] = r.status;
    });

    const present = records.filter(r => r.status === "Present").length;
    const absent = records.filter(r => r.status === "Absent").length;
    
    const absentDates = records
      .filter(r => r.status === "Absent")
      .map(r => parseAttendanceDate(r?.date)?.day)
      .filter(Boolean)
      .sort((a,b) => a - b);

    return { statusMap, present, absent, total: records.length, absentDates };
  }, [attendanceData, currentDate]);

  // --- RENDER CALENDAR (RE-STYLED TO SAAS) ---
  const renderCalendarDays = () => {
    const totalDays = daysInMonth(currentDate);
    const startDay = firstDayOfMonth(currentDate); 
    const blanks = Array(startDay).fill(null);
    const days = Array.from({ length: totalDays }, (_, i) => i + 1);
    const allSlots = [...blanks, ...days];
    
    const rows = [];
    let cells = [];

    allSlots.forEach((day, i) => {
      if (i % 7 !== 0) {
        cells.push(day);
      } else {
        if (cells.length > 0) rows.push(cells);
        cells = [day];
      }
      if (i === allSlots.length - 1) rows.push(cells);
    });

    return rows.map((row, rowIndex) => (
      <div className="d-flex w-100 calendar-row" key={rowIndex}>
        {[...row, ...Array(7 - row.length).fill(null)].map((day, colIndex) => {
          const isWeekend = colIndex === 0 || colIndex === 6;
          const status = day ? monthData.statusMap[day] : null;
          
          let badgeStyles = {};
          let badgeText = "";
          let badgeIcon = "";

          if (status === "Present") {
             badgeStyles = { backgroundColor: colors.successLight, color: colors.success, border: '1px solid rgba(16,185,129,0.2)' };
             badgeText = "Present";
             badgeIcon = "bi-check-circle-fill";
          } else if (status === "Absent") {
             badgeStyles = { backgroundColor: colors.dangerLight, color: colors.danger, border: '1px solid rgba(239,68,68,0.2)' };
             badgeText = "Absent";
             badgeIcon = "bi-x-circle-fill";
          }

          return (
            <div 
              key={colIndex} 
              className={`calendar-cell d-flex flex-column align-items-center p-2 position-relative ${!day ? 'opacity-50' : isWeekend ? '' : 'cell-hover'}`}
              style={{ width: "14.28%", height: "115px", backgroundColor: !day || isWeekend ? colors.bg : colors.surface }}
            >
              {day && (
                <>
                  <span className="fw-semibold mb-1 mt-1" style={{ fontSize: "0.95rem", color: isWeekend ? colors.textMuted : colors.textMain }}>
                    {day}
                  </span>
                  
                  <div className="mt-auto w-100 px-1 pb-1">
                    {status ? (
                      <div className="status-badge w-100 rounded-3 py-1 text-center fw-semibold d-flex flex-column align-items-center justify-content-center" style={{ ...badgeStyles, fontSize: "0.7rem", transition: "all 0.2s" }}>
                        <i className={`bi ${badgeIcon} mb-1 d-none d-md-block`} style={{ fontSize: '12px' }}></i>
                        {badgeText}
                      </div>
                    ) : (
                      isWeekend && (
                        <div className="text-center w-100" style={{ color: colors.textMuted, opacity: 0.3 }}>
                          <i className="bi bi-cup-hot-fill fs-5"></i>
                        </div>
                      )
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    ));
  };

  const doughnutData = {
    labels: ["Present", "Absent"],
    datasets: [{
      data: [monthData.present, monthData.absent],
      backgroundColor: [colors.success, colors.danger], // SaaS Emerald and Red
      borderWidth: 0,
      cutout: "78%",
      hoverOffset: 4
    }]
  };

  if (loading) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center min-vh-100" style={{ backgroundColor: colors.bg }}>
        <Spinner animation="border" style={{ color: colors.primary, width: '3rem', height: '3rem', borderWidth: '0.2em' }} />
        <p className="mt-3 fw-medium text-uppercase" style={{ color: colors.textMuted, letterSpacing: '1px', fontSize: '0.85rem' }}>Loading Calendar...</p>
      </div>
    );
  }

  return (
    <div className="pb-5 pt-3 fade-in" style={{ backgroundColor: colors.bg, minHeight: '100vh' }}>
      <style>{styles}</style>
      
      {/* Full width container with responsive horizontal padding */}
      <div className="container-fluid px-4 px-xl-5">
        
        {/* ---------- PAGE HEADER ---------- */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end mb-5 gap-4">
          <div>
            <div className="badge mb-2 px-3 py-2 rounded-pill fw-semibold shadow-sm" style={{ backgroundColor: colors.primaryLight, color: colors.primary, border: `1px solid rgba(79,70,229,0.2)`, letterSpacing: "0.5px" }}>
              <i className="bi bi-calendar-check me-2"></i>Student Portal
            </div>
            <h2 className="fw-bolder mb-1" style={{ color: colors.textMain, letterSpacing: '-0.5px' }}>
              My Attendance
            </h2>
            <p className="mb-0 small fw-medium" style={{ color: colors.textMuted }}>
              Track your daily presence, absences, and overall monthly statistics.
            </p>
          </div>
        </div>

        <div className="row g-4">
          
          {/* ---------- LEFT COLUMN: CALENDAR ---------- */}
          <div className="col-12 col-xl-8 col-xxl-9">
            <div className="saas-card overflow-hidden h-100">
              
              {/* Calendar Header */}
              <div className="p-4 d-flex flex-column flex-md-row justify-content-between align-items-center gap-3 border-bottom" style={{ borderColor: colors.border }}>
                 <div>
                    <h4 className="fw-bolder mb-0 d-flex align-items-center gap-2" style={{ color: colors.textMain, letterSpacing: '-0.5px' }}>
                       <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px', backgroundColor: colors.primaryLight, color: colors.primary }}>
                         <i className="bi bi-calendar3"></i>
                       </div>
                       {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </h4>
                 </div>
                 
                 {/* Month Navigation Pill */}
                 <div className="d-flex align-items-center rounded-pill p-1 border shadow-sm" style={{ backgroundColor: colors.bg, borderColor: colors.border }}>
                    <button onClick={() => changeMonth(-1)} className="btn btn-sm rounded-circle nav-btn d-flex align-items-center justify-content-center" style={{ width: '34px', height: '34px' }}>
                       <i className="bi bi-chevron-left fw-bold"></i>
                    </button>
                    <span className="fw-bold mx-3 text-uppercase" style={{ minWidth: '70px', textAlign: 'center', fontSize: '0.85rem', color: colors.textMain, letterSpacing: '0.05em' }}>
                       {currentDate.toLocaleString('default', { month: 'short' })}
                    </span>
                    <button onClick={() => changeMonth(1)} className="btn btn-sm rounded-circle nav-btn d-flex align-items-center justify-content-center" style={{ width: '34px', height: '34px' }}>
                       <i className="bi bi-chevron-right fw-bold"></i>
                    </button>
                 </div>
              </div>

              {/* Day Name Headers */}
              <div className="d-flex w-100 border-bottom" style={{ backgroundColor: '#fcfcfd', borderColor: colors.border }}>
                 {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d, i) => (
                    <div key={d} className="text-center py-3" style={{ 
                        width: "14.28%", 
                        color: (i === 0 || i === 6) ? colors.danger : colors.textMuted,
                        fontWeight: '600',
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                    }}>
                      {d}
                    </div>
                 ))}
              </div>

              {/* Calendar Grid */}
              <div style={{ backgroundColor: colors.surface }}>
                 {renderCalendarDays()}
              </div>
            </div>
          </div>

          {/* ---------- RIGHT COLUMN: STATS & ALERTS ---------- */}
          <div className="col-12 col-xl-4 col-xxl-3 d-flex flex-column gap-4">
            
            {/* Monthly Overview Card */}
            <div className="saas-card p-4">
              <div className="fw-bolder mb-4 text-uppercase d-flex align-items-center gap-2 border-bottom pb-3" style={{ fontSize: '0.85rem', color: colors.textMuted, letterSpacing: '0.05em', borderColor: colors.border }}>
                <i className="bi bi-pie-chart-fill" style={{ color: colors.primary }}></i>
                Monthly Overview
              </div>
              
              <div className="d-flex align-items-center justify-content-between mb-4 mt-2">
                 <div className="position-relative" style={{ width: '130px', height: '130px' }}>
                    {monthData.total > 0 ? (
                      <>
                        <Doughnut data={doughnutData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { enabled: false } } }} />
                        <div className="position-absolute top-50 start-50 translate-middle text-center">
                          <span className="fs-4 fw-bolder d-block" style={{ color: colors.textMain, lineHeight: '1', letterSpacing: '-0.5px' }}>
                            {Math.round((monthData.present / monthData.total) * 100)}%
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="w-100 h-100 rounded-circle border d-flex align-items-center justify-content-center small fw-medium" style={{ backgroundColor: colors.bg, color: colors.textMuted, borderColor: colors.border }}>
                        No Data
                      </div>
                    )}
                 </div>
                 
                 <div className="text-end">
                    <h2 className="fw-bolder mb-0 fs-1" style={{ color: colors.textMain, letterSpacing: '-1px' }}>
                      {monthData.total ? Math.round((monthData.present / monthData.total) * 100) : 0}<span className="fs-4" style={{ color: colors.textMuted }}>%</span>
                    </h2>
                    <div className="badge border fw-medium rounded-pill px-3 py-2 mt-2" style={{ backgroundColor: colors.bg, color: colors.textMuted, borderColor: colors.border }}>
                      Attendance Rate
                    </div>
                 </div>
              </div>

              {/* Legend List */}
              <div className="d-flex flex-column gap-3 rounded-4 p-3 border" style={{ backgroundColor: colors.bg, borderColor: colors.border }}>
                 <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-2">
                       <div className="rounded-circle shadow-sm" style={{ width: '12px', height: '12px', backgroundColor: colors.success }}></div>
                       <span className="fw-semibold small" style={{ color: colors.textMuted }}>Present</span>
                    </div>
                    <span className="fw-bold px-2 py-1 rounded shadow-sm" style={{ color: colors.success, backgroundColor: colors.surface, border: `1px solid ${colors.border}`, fontSize: '0.85rem' }}>{monthData.present} Days</span>
                 </div>
                 <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-2">
                       <div className="rounded-circle shadow-sm" style={{ width: '12px', height: '12px', backgroundColor: colors.danger }}></div>
                       <span className="fw-semibold small" style={{ color: colors.textMuted }}>Absent</span>
                    </div>
                    <span className="fw-bold px-2 py-1 rounded shadow-sm" style={{ color: colors.danger, backgroundColor: colors.surface, border: `1px solid ${colors.border}`, fontSize: '0.85rem' }}>{monthData.absent} Days</span>
                 </div>
              </div>
            </div>

            {/* Attention Needed Card (Absent Dates) */}
            {monthData.absent > 0 && (
              <div className="saas-card overflow-hidden" style={{ borderLeft: `4px solid ${colors.danger}` }}>
                <div className="p-4" style={{ backgroundColor: colors.dangerLight }}>
                   <div className="d-flex align-items-center gap-2 mb-3" style={{ color: colors.danger }}>
                      <i className="bi bi-exclamation-triangle-fill fs-5"></i>
                      <h6 className="fw-bold mb-0">Attention Needed</h6>
                   </div>
                   <p className="small fw-medium mb-3 opacity-75" style={{ color: colors.danger, lineHeight: '1.5' }}>
                     You were marked absent on the following dates this month:
                   </p>
                   <div className="d-flex flex-wrap gap-2">
                      {monthData.absentDates.map(date => (
                         <span key={date} className="badge shadow-sm px-3 py-2 rounded-pill fw-bold d-flex align-items-center gap-1" style={{ backgroundColor: colors.surface, color: colors.danger, border: `1px solid rgba(239,68,68,0.2)` }}>
                            <i className="bi bi-calendar-x"></i>
                            {currentDate.toLocaleString('default', { month: 'short' })} {date}
                         </span>
                      ))}
                   </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}