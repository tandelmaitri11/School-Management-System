import React, { useEffect, useState, useMemo } from "react";
import api from "../../../api/api";
import { Spinner, Table, Badge, Container, Card } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

// --- PROFESSIONAL STYLES ---
const styles = {
  container: {
    backgroundColor: "#f8fafc",
    minHeight: "100vh",
    paddingTop: "2rem",
    paddingBottom: "4rem"
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    border: "none",
    boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
    overflow: "hidden" // Ensures rounded corners on table
  },
  header: {
    padding: "25px 30px",
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff"
  },
  title: {
    fontWeight: "800",
    color: "#1e293b",
    fontSize: "1.5rem",
    marginBottom: "0.2rem"
  },
  subtitle: {
    color: "#64748b",
    fontSize: "0.9rem"
  },
  tableResponsive: {
    margin: 0
  },
  table: {
    marginBottom: 0,
    borderCollapse: "separate",
    borderSpacing: 0
  },
  th: {
    backgroundColor: "#f8fafc",
    color: "#475569",
    fontWeight: "700",
    textTransform: "uppercase",
    fontSize: "0.75rem",
    letterSpacing: "1px",
    padding: "20px 15px",
    borderBottom: "2px solid #e2e8f0",
    textAlign: "center",
    minWidth: "140px"
  },
  periodCol: {
    backgroundColor: "#f8fafc",
    fontWeight: "700",
    color: "#334155",
    width: "100px",
    textAlign: "center",
    borderRight: "2px solid #e2e8f0",
    verticalAlign: "middle"
  },
  td: {
    verticalAlign: "middle",
    padding: "15px",
    height: "110px", // Uniform cell height
    borderRight: "1px solid #f1f5f9",
    borderBottom: "1px solid #f1f5f9",
    transition: "background 0.2s ease"
  },
  classCard: {
    backgroundColor: "#e0f2fe", // Light Blue
    color: "#0369a1", // Dark Blue Text
    borderLeft: "4px solid #0ea5e9", // Accent Border
    padding: "10px 12px",
    borderRadius: "8px",
    fontSize: "0.85rem",
    fontWeight: "600",
    display: "flex",
    flexDirection: "column",
    gap: "5px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.03)"
  },
  emptyCell: {
    color: "#cbd5e1",
    fontSize: "1.2rem",
    textAlign: "center",
    fontWeight: "300"
  },
  activeColumn: {
    backgroundColor: "#f0f9ff" // Highlight for Today
  },
  breakRow: {
    backgroundColor: "#fef3c7",
    color: "#92400e",
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: "1px"
  }
};

const TeacherTimeTable = () => {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  
  const studentId = localStorage.getItem("studentId");
  const token = localStorage.getItem("token");

  // --- 1. FETCH DATA ---
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

  // --- 2. DATA PROCESSING ---
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
      <div style={{ ...styles.container, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Container fluid="xl">
        
        <Card style={styles.card}>
          
          {/* --- Header Section --- */}
          <div style={styles.header}>
            <div>
              <div style={styles.title}>Academic Schedule</div>
              <div style={styles.subtitle}>View your weekly classes and teaching periods</div>
            </div>
            <div>
              <Badge bg="dark" className="px-3 py-2 rounded-pill fw-normal text-uppercase" style={{letterSpacing: '1px'}}>
                Today: {currentDay}
              </Badge>
            </div>
          </div>

          {/* --- Grid Section --- */}
          <div className="table-responsive" style={styles.tableResponsive}>
            <Table style={styles.table} hover borderless>
              <thead>
                <tr>
                  {/* Empty Corner Header */}
                  <th style={{ ...styles.th, width: '100px', backgroundColor: '#f1f5f9' }}>#</th>
                  
                  {/* Days Headers */}
                  {days.map(day => (
                    <th key={day} style={{
                        ...styles.th, 
                        color: day === currentDay ? '#0ea5e9' : '#64748b',
                        backgroundColor: day === currentDay ? '#e0f2fe' : '#f8fafc'
                    }}>
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {periods.length > 0 ? (
                  periods.map((period) => (
                    <React.Fragment key={period}>
                    <tr>
                      
                      {/* Period Row Header */}
                      <td style={styles.periodCol}>
                        <div style={{ fontSize: '1.2rem' }}>{period}</div>
                        <small className="text-muted" style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Period</small>
                        <div className="text-muted" style={{ fontSize: '0.7rem', marginTop: '4px' }}>
                          {timeMap?.[period] || "N/A"}
                        </div>
                      </td>

                      {/* Day Cells */}
                      {days.map((day) => {
                        const classInfo = gridData[period][day];
                        const isToday = day === currentDay;

                        return (
                          <td 
                            key={day} 
                            style={{
                                ...styles.td,
                                backgroundColor: isToday ? '#fafafa' : '#fff'
                            }}
                          >
                            {classInfo ? (
                              <div style={styles.classCard}>
                                <div className="text-truncate" title={classInfo.subject}>
                                  <i className="bi bi-book-fill me-2 opacity-50"></i>
                                  {classInfo.subject}
                                </div>
                                <div className="d-flex justify-content-between align-items-center mt-1">
                                   <Badge bg="white" text="primary" className="border border-primary-subtle text-dark fw-bold">
                                     {classInfo.teacher || "N/A"}
                                   </Badge>
                                </div>
                              </div>
                            ) : (
                              <div style={styles.emptyCell}>&middot;</div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                    {period === 3 && (
                      <tr>
                        <td colSpan={7} style={styles.breakRow}>
                          BREAK • 12:15 - 14:00
                        </td>
                      </tr>
                    )}
                    </React.Fragment>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-5 text-muted">
                      <div className="mb-3"><i className="bi bi-calendar-x" style={{ fontSize: '2rem' }}></i></div>
                      <h6 className="fw-bold">No Schedule Available</h6>
                      <p className="small">Your timetable has not been generated yet.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Card>

      </Container>
    </div>
  );
};

export default TeacherTimeTable;
