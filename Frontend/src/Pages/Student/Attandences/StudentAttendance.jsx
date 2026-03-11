import React, { useEffect, useState, useMemo } from "react";
import api from "../../../api/api";
import "bootstrap/dist/css/bootstrap.min.css";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

// --- STYLES ---
const styles = {
  page: { backgroundColor: "#f8fafc", minHeight: "100vh", paddingBottom: "3rem" },
  calendarCard: { border: "none", borderRadius: "20px", boxShadow: "0 10px 30px rgba(0,0,0,0.03)", backgroundColor: "#fff", overflow: "hidden" },
  dayName: { color: "#64748b", fontWeight: "700", fontSize: "0.75rem", textTransform: "uppercase", padding: "18px 0", letterSpacing: '1px' },
  dateCell: { height: "110px", borderTop: "1px solid #f1f5f9", borderRight: "1px solid #f1f5f9", position: "relative", transition: "all 0.2s" },
  dateNumber: { position: "absolute", top: "10px", left: "12px", fontWeight: "600", fontSize: "0.95rem", color: "#334155" },
  statusBadge: { position: "absolute", bottom: "12px", left: "50%", transform: "translateX(-50%)", fontSize: "0.7rem", width: "85%", textAlign: "center", borderRadius: "6px", padding: "5px 0", fontWeight: "600", boxShadow: "0 2px 5px rgba(0,0,0,0.05)" },
  sidebarCard: { borderRadius: "20px", border: "none", backgroundColor: "#fff", boxShadow: "0 5px 20px rgba(0,0,0,0.03)" },
  navBtn: { width: "38px", height: "38px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "10px", transition: "0.2s" },
  weekendCell: { backgroundColor: "#fcfcfc" }, // Subtle difference for weekends
  weekendText: { color: "#ef4444" }
};

export default function ViewAttendanceCalendar() {
  const [attendanceData, setAttendanceData] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  const parseAttendanceDate = (ymd) => {
    const [y, m, d] = String(ymd || "").split("-").map(Number);
    if (!y || !m || !d) return null;
    return { year: y, monthIndex: m - 1, day: d };
  };

  // --- FETCH DATA ---
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

  // --- LOGIC ---
  const daysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const changeMonth = (offset) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
  };

  // --- DATA PROCESSING ---
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
    
    // Get list of specific absent dates for the "Attention" section
    const absentDates = records
      .filter(r => r.status === "Absent")
      .map(r => parseAttendanceDate(r?.date)?.day)
      .filter(Boolean)
      .sort((a,b) => a - b);

    return { statusMap, present, absent, total: records.length, absentDates };
  }, [attendanceData, currentDate]);

  // --- RENDER CALENDAR ---
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
          // Calculate if it's a weekend (colIndex 0 is Sun, 6 is Sat)
          const isWeekend = colIndex === 0 || colIndex === 6;
          
          const status = day ? monthData.statusMap[day] : null;
          let badgeClass = "";
          let badgeText = "";

          if (status === "Present") {
             badgeClass = "bg-success-subtle text-success border border-success-subtle";
             badgeText = "Present";
          } else if (status === "Absent") {
             badgeClass = "bg-danger-subtle text-danger border border-danger-subtle";
             badgeText = "Absent";
          }

          return (
            <div 
              key={colIndex} 
              style={{ 
                ...styles.dateCell, 
                width: "14.28%", 
                ...(isWeekend ? styles.weekendCell : { backgroundColor: "#fff" }),
                backgroundColor: !day ? "#f8fafc" : (isWeekend ? "#fafafa" : "#fff") 
              }}
            >
              {day && (
                <>
                  <span style={{...styles.dateNumber, color: isWeekend ? '#94a3b8' : '#334155'}}>{day}</span>
                  {status ? (
                    <div style={styles.statusBadge} className={badgeClass}>
                       {badgeText}
                    </div>
                  ) : (
                    // Optional: Show "Holiday" or "Weekend" label if no status
                    isWeekend && (
                      <div className="text-center w-100 text-muted small opacity-50" style={{position:'absolute', bottom: '40%'}}>
                        <i className="bi bi-cup-hot-fill"></i>
                      </div>
                    )
                  )}
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
      backgroundColor: ["#10b981", "#ef4444"],
      borderWidth: 0,
      cutout: "75%"
    }]
  };

  if (loading) return <div className="vh-100 d-flex justify-content-center align-items-center"><div className="spinner-border text-primary"/></div>;

  return (
    <div style={styles.page}>
      <div className="container-fluid container-xl pt-4">
        
        <div className="row g-4">
          
          {/* --- LEFT COLUMN: CALENDAR --- */}
          <div className="col-lg-8">
            <div style={styles.calendarCard}>
              
              {/* Header */}
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center p-4 border-bottom gap-3">
                 <div>
                    <h4 className="fw-bold text-dark mb-0">
                        {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </h4>
                    <p className="text-muted small mb-0">Academic Attendance Record</p>
                 </div>
                 
                 <div className="d-flex align-items-center bg-light rounded-pill p-1 border">
                    <button onClick={() => changeMonth(-1)} className="btn btn-sm btn-light rounded-circle shadow-sm text-secondary" style={styles.navBtn}>
                       <i className="bi bi-chevron-left"></i>
                    </button>
                    <span className="fw-bold text-muted mx-3" style={{minWidth: '60px', textAlign:'center'}}>
                       {currentDate.toLocaleString('default', { month: 'short' })}
                    </span>
                    <button onClick={() => changeMonth(1)} className="btn btn-sm btn-light rounded-circle shadow-sm text-secondary" style={styles.navBtn}>
                       <i className="bi bi-chevron-right"></i>
                    </button>
                 </div>
              </div>

              {/* Day Headers */}
              <div className="d-flex w-100 bg-white border-bottom">
                 {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d, i) => (
                    <div key={d} className="text-center" style={{ 
                        width: "14.28%", 
                        ...styles.dayName,
                        color: (i===0 || i===6) ? '#ef4444' : '#64748b' // Red color for Sat/Sun headers
                    }}>{d}</div>
                 ))}
              </div>

              {/* Grid */}
              <div className="bg-white">
                 {renderCalendarDays()}
              </div>
            </div>
          </div>

          {/* --- RIGHT COLUMN: STATS & ACTIONS --- */}
          <div className="col-lg-4">
            <div className="d-flex flex-column gap-4 h-100">
              
              {/* 1. Monthly Stats Card */}
              <div style={styles.sidebarCard} className="p-4">
                <h6 className="fw-bold text-uppercase text-muted small mb-4">Monthly Overview</h6>
                
                <div className="d-flex align-items-center justify-content-between mb-4">
                   <div style={{width: '100px', height: '100px'}}>
                      {monthData.total > 0 ? (
                        <Doughnut data={doughnutData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: {enabled: false} } }} />
                      ) : (
                        <div className="w-100 h-100 rounded-circle bg-light border d-flex align-items-center justify-content-center text-muted small">N/A</div>
                      )}
                   </div>
                   <div className="text-end">
                      <h2 className="fw-bold text-dark mb-0">
                        {monthData.total ? Math.round((monthData.present / monthData.total) * 100) : 0}%
                      </h2>
                      <small className="text-muted">Attendance Rate</small>
                   </div>
                </div>

                {/* Legend List */}
                <div className="d-flex flex-column gap-3">
                   <div className="d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center gap-2">
                         <span className="badge bg-success rounded-circle p-1"> </span>
                         <span className="text-dark fw-medium">Present</span>
                      </div>
                      <span className="fw-bold text-success">{monthData.present} Days</span>
                   </div>
                   <div className="d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center gap-2">
                         <span className="badge bg-danger rounded-circle p-1"> </span>
                         <span className="text-dark fw-medium">Absent</span>
                      </div>
                      <span className="fw-bold text-danger">{monthData.absent} Days</span>
                   </div>
                </div>
              </div>

              {/* 2. Attention Needed (Absent Dates) */}
              {monthData.absent > 0 && (
                <div style={styles.sidebarCard} className="p-4 border-start border-4 border-danger">
                   <div className="d-flex align-items-center gap-2 mb-3 text-danger">
                      <i className="bi bi-exclamation-circle-fill"></i>
                      <h6 className="fw-bold mb-0">Attention Needed</h6>
                   </div>
                   <p className="small text-muted mb-2">You were marked absent on these dates:</p>
                   <div className="d-flex flex-wrap gap-2">
                      {monthData.absentDates.map(date => (
                         <span key={date} className="badge bg-danger-subtle text-danger border border-danger-subtle">
                            {currentDate.toLocaleString('default', { month: 'short' })} {date}
                         </span>
                      ))}
                   </div>
                </div>
              )}

              {/* 3. Quick Actions */}
              <div style={styles.sidebarCard} className="p-4 mt-auto">
                 <h6 className="fw-bold text-uppercase text-muted small mb-3">Quick Actions</h6>
                 <div className="d-grid gap-2">
                    <button className="btn btn-primary fw-medium py-2 d-flex align-items-center justify-content-center gap-2">
                       <i className="bi bi-calendar-plus"></i> Apply for Leave
                    </button>
                 </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
