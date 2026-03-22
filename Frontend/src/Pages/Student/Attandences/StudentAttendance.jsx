import React, { useEffect, useState, useMemo } from "react";
import api from "../../../api/api";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Badge, Spinner, Card } from "react-bootstrap";

ChartJS.register(ArcElement, Tooltip, Legend);

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

  // --- RENDER CALENDAR (RE-STYLED) ---
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
      <div className="d-flex w-100" key={rowIndex}>
        {[...row, ...Array(7 - row.length).fill(null)].map((day, colIndex) => {
          const isWeekend = colIndex === 0 || colIndex === 6;
          const status = day ? monthData.statusMap[day] : null;
          
          let badgeClass = "";
          let badgeText = "";
          let badgeIcon = "";

          if (status === "Present") {
             badgeClass = "bg-success bg-opacity-10 text-success border border-success border-opacity-25";
             badgeText = "Present";
             badgeIcon = "bi-check-circle-fill";
          } else if (status === "Absent") {
             badgeClass = "bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25";
             badgeText = "Absent";
             badgeIcon = "bi-x-circle-fill";
          }

          return (
            <div 
              key={colIndex} 
              className={`calendar-cell d-flex flex-column align-items-center p-2 position-relative border-bottom border-end border-light-subtle ${!day ? 'bg-light opacity-50' : isWeekend ? 'bg-light' : 'bg-white hover-lift-subtle'}`}
              style={{ width: "14.28%", height: "110px" }}
            >
              {day && (
                <>
                  <span className={`fw-bold mb-1 mt-1 ${isWeekend ? 'text-secondary' : 'text-dark'}`} style={{ fontSize: "1rem" }}>
                    {day}
                  </span>
                  
                  <div className="mt-auto w-100 px-1 pb-1">
                    {status ? (
                      <div className={`status-badge w-100 rounded-2 py-1 text-center fw-bold d-flex flex-column align-items-center justify-content-center ${badgeClass}`} style={{ fontSize: "0.7rem", transition: "all 0.2s" }}>
                        <i className={`bi ${badgeIcon} mb-1 d-none d-md-block`} style={{ fontSize: '12px' }}></i>
                        {badgeText}
                      </div>
                    ) : (
                      isWeekend && (
                        <div className="text-center w-100 text-muted opacity-25">
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
      backgroundColor: ["#10b981", "#ef4444"], // Emerald and Red
      borderWidth: 0,
      cutout: "75%",
      hoverOffset: 4
    }]
  };

  if (loading) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center min-vh-100 bg-light">
        <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
        <p className="mt-3 fw-semibold text-muted tracking-wide">Loading Calendar...</p>
      </div>
    );
  }

  return (
    <div className="bg-light min-vh-100 py-4 py-md-5">
      <div className="container-fluid px-3 px-md-5">
        
        {/* ---------- PAGE HEADER ---------- */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end mb-4 pb-3 border-bottom border-light-subtle gap-3">
          <div>
            <Badge bg="primary" className="bg-opacity-10 text-primary mb-2 px-3 py-2 rounded-pill border border-primary border-opacity-25">
              <i className="bi bi-calendar-check me-2"></i>Student Portal
            </Badge>
            <h2 className="fw-bolder text-dark mb-1" style={{ letterSpacing: '-0.5px' }}>
              My Attendance
            </h2>
            <p className="text-secondary mb-0 small">
              Track your daily presence, absences, and overall monthly statistics.
            </p>
          </div>
        </div>

        <div className="row g-4">
          
          {/* ---------- LEFT COLUMN: CALENDAR ---------- */}
          <div className="col-12 col-xl-8">
            <Card className="border-0 shadow-sm rounded-4 overflow-hidden h-100">
              
              {/* Calendar Header */}
              <Card.Header className="bg-white border-bottom border-light-subtle p-4 d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
                 <div>
                    <h4 className="fw-bolder text-dark mb-0 d-flex align-items-center gap-2">
                       <i className="bi bi-calendar3 text-primary opacity-75"></i>
                       {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </h4>
                 </div>
                 
                 {/* Month Navigation Pill */}
                 <div className="d-flex align-items-center bg-light rounded-pill p-1 border shadow-sm">
                    <button onClick={() => changeMonth(-1)} className="btn btn-sm btn-white rounded-circle text-secondary nav-btn d-flex align-items-center justify-content-center" style={{ width: '34px', height: '34px' }}>
                       <i className="bi bi-chevron-left fw-bold"></i>
                    </button>
                    <span className="fw-bolder text-dark mx-3 text-uppercase tracking-wider" style={{ minWidth: '70px', textAlign: 'center', fontSize: '0.85rem' }}>
                       {currentDate.toLocaleString('default', { month: 'short' })}
                    </span>
                    <button onClick={() => changeMonth(1)} className="btn btn-sm btn-white rounded-circle text-secondary nav-btn d-flex align-items-center justify-content-center" style={{ width: '34px', height: '34px' }}>
                       <i className="bi bi-chevron-right fw-bold"></i>
                    </button>
                 </div>
              </Card.Header>

              {/* Day Name Headers */}
              <div className="d-flex w-100 bg-light border-bottom border-light-subtle">
                 {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d, i) => (
                    <div key={d} className="text-center py-3" style={{ 
                        width: "14.28%", 
                        color: (i === 0 || i === 6) ? '#dc3545' : '#6c757d',
                        fontWeight: '700',
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '1px'
                    }}>
                      {d}
                    </div>
                 ))}
              </div>

              {/* Calendar Grid */}
              <div className="bg-white">
                 {renderCalendarDays()}
              </div>
            </Card>
          </div>

          {/* ---------- RIGHT COLUMN: STATS & ALERTS ---------- */}
          <div className="col-12 col-xl-4 d-flex flex-column gap-4">
            
            {/* Monthly Overview Card */}
            <Card className="border-0 shadow-sm rounded-4">
              <Card.Body className="p-4">
                <h6 className="fw-bold text-uppercase text-secondary small tracking-wider mb-4 border-bottom pb-3">
                  <i className="bi bi-pie-chart-fill me-2 text-primary"></i>
                  Monthly Overview
                </h6>
                
                <div className="d-flex align-items-center justify-content-between mb-4 mt-2">
                   <div className="position-relative" style={{ width: '130px', height: '130px' }}>
                      {monthData.total > 0 ? (
                        <>
                          <Doughnut data={doughnutData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { enabled: false } } }} />
                          <div className="position-absolute top-50 start-50 translate-middle text-center">
                            <span className="fs-5 fw-bolder text-dark d-block" style={{ lineHeight: '1' }}>
                              {Math.round((monthData.present / monthData.total) * 100)}%
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="w-100 h-100 rounded-circle bg-light border d-flex align-items-center justify-content-center text-muted small fw-medium">
                          No Data
                        </div>
                      )}
                   </div>
                   
                   <div className="text-end">
                      <h2 className="fw-bolder text-dark mb-0 fs-1">
                        {monthData.total ? Math.round((monthData.present / monthData.total) * 100) : 0}<span className="fs-4 text-muted">%</span>
                      </h2>
                      <Badge bg="light" text="secondary" className="border fw-medium rounded-pill px-3 py-2 mt-1">
                        Attendance Rate
                      </Badge>
                   </div>
                </div>

                {/* Legend List */}
                <div className="d-flex flex-column gap-3 bg-light rounded-3 p-3 border">
                   <div className="d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center gap-2">
                         <div className="rounded-circle bg-success shadow-sm" style={{ width: '12px', height: '12px' }}></div>
                         <span className="text-secondary fw-semibold small">Present</span>
                      </div>
                      <span className="fw-bold text-success bg-white px-2 py-1 rounded border shadow-sm">{monthData.present} Days</span>
                   </div>
                   <div className="d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center gap-2">
                         <div className="rounded-circle bg-danger shadow-sm" style={{ width: '12px', height: '12px' }}></div>
                         <span className="text-secondary fw-semibold small">Absent</span>
                      </div>
                      <span className="fw-bold text-danger bg-white px-2 py-1 rounded border shadow-sm">{monthData.absent} Days</span>
                   </div>
                </div>
              </Card.Body>
            </Card>

            {/* Attention Needed Card (Absent Dates) */}
            {monthData.absent > 0 && (
              <Card className="border-0 shadow-sm rounded-4 overflow-hidden border-start border-danger border-5">
                <Card.Body className="p-4 bg-danger bg-opacity-10">
                   <div className="d-flex align-items-center gap-2 mb-3 text-danger">
                      <i className="bi bi-exclamation-triangle-fill fs-5"></i>
                      <h6 className="fw-bold mb-0">Attention Needed</h6>
                   </div>
                   <p className="small text-danger fw-medium mb-3 opacity-75">
                     You were marked absent on the following dates this month:
                   </p>
                   <div className="d-flex flex-wrap gap-2">
                      {monthData.absentDates.map(date => (
                         <span key={date} className="badge bg-white text-danger border border-danger border-opacity-25 shadow-sm px-3 py-2 rounded-pill fw-bold d-flex align-items-center gap-1">
                            <i className="bi bi-calendar-x"></i>
                            {currentDate.toLocaleString('default', { month: 'short' })} {date}
                         </span>
                      ))}
                   </div>
                </Card.Body>
              </Card>
            )}

          </div>
        </div>
      </div>

      {/* ---------- CUSTOM CSS ---------- */}
      <style>{`
        .tracking-wide {
          letter-spacing: 0.5px;
        }
        .tracking-wider {
          letter-spacing: 1px;
        }
        .hover-lift-subtle {
          transition: background-color 0.2s ease, transform 0.2s ease;
        }
        .hover-lift-subtle:hover {
          background-color: #f8f9fa !important;
        }
        .nav-btn {
          transition: all 0.2s ease;
          background: #ffffff;
        }
        .nav-btn:hover {
          background: #e9ecef;
          transform: scale(1.05);
        }
        .status-badge {
          box-shadow: 0 2px 4px rgba(0,0,0,0.04);
        }
        /* Remove outer borders from the calendar grid */
        .calendar-cell:nth-child(7n) {
          border-right: none !important;
        }
        .d-flex.w-100:last-child .calendar-cell {
          border-bottom: none !important;
        }
      `}</style>
    </div>
  );
}