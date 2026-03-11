import React, { useEffect, useMemo, useState } from "react";
import api from "../../../api/api";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

const formatDateKey = (dateValue) => {
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return "Unknown Date";
  return d.toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" });
};

export default function TeacherAnnouncements() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/api/announcements/published", { params: { audience: "Teachers" } });
        setRows(res.data?.announcements || []);
      } catch (err) {
        console.error("announcement load error:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const grouped = useMemo(() => {
    const map = new Map();
    rows.forEach((item) => {
      const key = formatDateKey(item.publishedAt || item.createdAt);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    });
    return Array.from(map.entries());
  }, [rows]);

  // UI Helper for hover effects
  const hoverStyle = { transition: "all 0.3s ease-in-out" };
  const handleMouseEnter = (e) => {
    e.currentTarget.style.transform = "translateY(-4px)";
    e.currentTarget.style.boxShadow = "0 10px 20px rgba(0,0,0,0.08)";
  };
  const handleMouseLeave = (e) => {
    e.currentTarget.style.transform = "translateY(0)";
    e.currentTarget.style.boxShadow = "0 4px 6px rgba(0,0,0,0.04)";
  };

  return (
    <div className="container-fluid py-4 bg-light min-vh-100">
      <div className="row justify-content-center">
        <div className="col-12 col-xl-10">
          
          {/* Header Section */}
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center border-bottom pb-3 mb-4 gap-3">
            <h3 className="fw-bold text-dark mb-0 d-flex align-items-center">
              <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '48px', height: '48px' }}>
                <i className="bi bi-megaphone-fill fs-4"></i>
              </div>
              Announcements & Notifications
            </h3>
            <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 rounded-pill px-4 py-2 fs-6 shadow-sm">
              <i className="bi bi-broadcast me-2"></i>
              {rows.length} Active
            </span>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="d-flex flex-column justify-content-center align-items-center py-5 mt-5">
              <div className="spinner-border text-primary mb-3" role="status" style={{ width: "3rem", height: "3rem" }}></div>
              <h5 className="text-muted fw-light">Fetching latest announcements...</h5>
            </div>
          ) : grouped.length === 0 ? (
            
            /* Empty State */
            <div className="alert bg-white border-0 shadow-sm rounded-4 text-center p-5 mt-4">
              <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-4" style={{ width: '80px', height: '80px' }}>
                <i className="bi bi-bell-slash text-muted fs-1"></i>
              </div>
              <h4 className="text-dark fw-bold mb-2">You're all caught up!</h4>
              <p className="text-muted mb-0">No new teacher announcements found at this time.</p>
            </div>
          ) : (
            
            /* Feed List */
            <div className="position-relative">
              {grouped.map(([date, items]) => (
                <div key={date} className="mb-5">
                  {/* Date Separator */}
                  <div className="d-flex align-items-center mb-4 position-relative">
                    <span className="bg-white text-primary border border-primary border-opacity-25 rounded-pill px-4 py-2 fw-bold shadow-sm d-inline-flex align-items-center z-1" style={{ fontSize: "0.85rem", letterSpacing: "0.5px" }}>
                      <i className="bi bi-calendar3 me-2"></i>
                      {date}
                    </span>
                    <hr className="position-absolute w-100 border-secondary opacity-25" style={{ top: "50%", transform: "translateY(-50%)", zIndex: 0 }} />
                  </div>
                  
                  {/* Announcement Cards */}
                  <div className="row g-4 ps-md-4 border-start border-2 border-primary border-opacity-10 ms-2 ms-md-3">
                    {items.map((item) => (
                      <div key={item._id} className="col-12 position-relative">
                        {/* Timeline dot */}
                        <div className="position-absolute rounded-circle bg-primary border border-white border-3 shadow-sm d-none d-md-block" style={{ width: '16px', height: '16px', left: '-33px', top: '24px' }}></div>
                        
                        <div 
                          className="card border-0 shadow-sm rounded-4 overflow-hidden"
                          style={hoverStyle}
                          onMouseEnter={handleMouseEnter}
                          onMouseLeave={handleMouseLeave}
                        >
                          <div className="card-body p-4 p-md-5">
                            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start gap-3 mb-3">
                              <h4 className="fw-bold text-dark mb-0" style={{ lineHeight: "1.3" }}>
                                {item.title}
                              </h4>
                              <span className="badge bg-light text-secondary border border-secondary border-opacity-25 rounded-pill px-3 py-2 d-flex align-items-center flex-shrink-0">
                                <i className="bi bi-people-fill me-2 text-primary opacity-75"></i>
                                {item.audience}
                              </span>
                            </div>
                            
                            <p className="text-secondary mb-4" style={{ fontSize: "1.05rem", lineHeight: "1.7", whiteSpace: "pre-wrap" }}>
                              {item.message}
                            </p>
                            
                            {/* Media Attachment section */}
                            {item.mediaUrl && (
                              <div className="mt-4 bg-light p-2 rounded-4 border border-secondary border-opacity-10 d-inline-block w-100">
                                {item.mediaType === "video" ? (
                                  <video 
                                    controls 
                                    className="w-100 rounded-3 shadow-sm" 
                                    style={{ maxHeight: "400px", backgroundColor: "#000", objectFit: 'contain' }}
                                  >
                                    <source src={`http://localhost:3000/${item.mediaUrl}`} />
                                    Your browser does not support the video tag.
                                  </video>
                                ) : (
                                  <div className="position-relative w-100 rounded-3 overflow-hidden shadow-sm bg-white text-center">
                                    <img
                                      src={`http://localhost:3000/${item.mediaUrl}`}
                                      alt="announcement media"
                                      className="img-fluid"
                                      style={{ maxHeight: "450px", width: "auto", objectFit: "contain" }}
                                    />
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}