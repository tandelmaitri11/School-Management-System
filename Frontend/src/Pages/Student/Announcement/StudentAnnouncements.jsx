import React, { useEffect, useMemo, useState } from "react";
import api from "../../../api/api";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

const formatDateKey = (dateValue) => {
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return "Unknown Date";
  return d.toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" });
};

export default function StudentAnnouncements() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- API LOGIC (UNCHANGED) ---
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get("/api/announcements/published", { params: { audience: "Students" } });
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
  // --- END API LOGIC ---

  if (loading) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center min-vh-100" style={{ backgroundColor: "#f8fafc" }}>
        <div className="spinner-border text-primary mb-3" style={{ width: "2.5rem", height: "2.5rem", borderWidth: "0.2em" }}></div>
        <div className="text-muted fw-semibold tracking-wider text-uppercase small" style={{ letterSpacing: "1px" }}>Loading Feed...</div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#f8fafc", minHeight: "100vh", fontFamily: "'Inter', -apple-system, sans-serif" }} className="py-4 py-md-5">
      <div className="container" style={{ maxWidth: "760px" }}>
        
        {/* --- PAGE HEADER --- */}
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-end mb-5 gap-3">
          <div>
            <div className="badge bg-primary bg-opacity-10 text-primary mb-2 px-3 py-2 rounded-pill fw-bold border border-primary border-opacity-25 shadow-sm" style={{ letterSpacing: "0.5px" }}>
              <i className="bi bi-broadcast me-2"></i> Notice Board
            </div>
            <h2 className="fw-bolder text-dark mb-1 display-6" style={{ letterSpacing: "-1px" }}>Announcements</h2>
            <p className="text-secondary mb-0 fw-medium">Stay updated with the latest campus news and circulars.</p>
          </div>
          <div className="bg-white border shadow-sm px-4 py-2 rounded-4 text-center d-inline-block">
             <span className="d-block text-muted fw-bold text-uppercase mb-1" style={{ fontSize: "0.65rem", letterSpacing: "1px" }}>Total Updates</span>
             <span className="fs-4 fw-bolder text-primary lh-1">{rows.length}</span>
          </div>
        </div>

        {/* --- FEED CONTENT --- */}
        {grouped.length === 0 ? (
          <div className="text-center py-5 my-5 bg-white border shadow-sm rounded-4">
            <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center p-4 mb-3">
              <i className="bi bi-mailbox fs-1 text-secondary opacity-50"></i>
            </div>
            <h5 className="fw-bold text-dark mb-1">You're all caught up!</h5>
            <p className="text-muted small fw-medium">There are currently no announcements published for you.</p>
          </div>
        ) : (
          <div className="feed-container pb-5">
            {grouped.map(([date, items]) => (
              <div key={date} className="mb-5">
                
                {/* Clean Date Divider */}
                <div className="position-relative d-flex align-items-center justify-content-center mb-4 mt-2">
                   <div className="border-bottom border-secondary opacity-25 position-absolute w-100" style={{ zIndex: 0 }}></div>
                   <span className="bg-light border text-secondary fw-bold text-uppercase rounded-pill px-4 py-1 position-relative shadow-sm" style={{ fontSize: "0.75rem", letterSpacing: "1px", zIndex: 1 }}>
                     <i className="bi bi-calendar-event me-2 opacity-75"></i>{date}
                   </span>
                </div>
                
                {/* Announcement Cards */}
                <div className="d-flex flex-column gap-4">
                  {items.map((item) => (
                    <div 
                      key={item._id} 
                      className="card border border-light-subtle rounded-4 overflow-hidden announcement-card bg-white"
                    >
                      <div className="card-body p-0 d-flex flex-column">
                        
                        {/* Header & Content Area */}
                        <div className="p-4 p-md-5 pb-4">
                           <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
                             <div className="d-flex gap-3 align-items-start">
                               <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 mt-1" style={{ width: "42px", height: "42px" }}>
                                 <i className="bi bi-megaphone-fill fs-5"></i>
                               </div>
                               <div>
                                 <h4 className="fw-bolder mb-1 text-dark lh-sm" style={{ letterSpacing: "-0.5px" }}>
                                   {item.title}
                                 </h4>
                                 <div className="text-muted small fw-medium d-flex align-items-center gap-2">
                                   <span>Posted at {new Date(item.publishedAt || item.createdAt).toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit'})}</span>
                                   <span className="opacity-25">•</span>
                                   
                                 </div>
                               </div>
                             </div>
                           </div>
                           
                           {/* Message Body */}
                           <p className="text-dark mb-0 mt-4" style={{ lineHeight: '1.8', fontSize: '1.05rem', whiteSpace: 'pre-line', color: '#334155' }}>
                             {item.message}
                           </p>
                        </div>
                        
                        {/* Media Attachment Area */}
                        {item.mediaUrl && (
                          <div className="media-attachment-container bg-light border-top border-light-subtle position-relative overflow-hidden">
                            {item.mediaType === "video" ? (
                               <div className="p-3 p-md-4 d-flex justify-content-center">
                                 <video 
                                   controls 
                                   className="w-100 rounded-3 shadow-sm border border-dark border-opacity-10" 
                                   style={{ maxHeight: "400px", backgroundColor: "#0f172a" }}
                                 >
                                   <source src={`http://localhost:3000/${item.mediaUrl}`} />
                                   Your browser does not support the video tag.
                                 </video>
                               </div>
                            ) : (
                               <div className="d-flex justify-content-center align-items-center bg-dark p-0 position-relative" style={{ minHeight: "200px" }}>
                                 {/* Optional Blurred background effect for images */}
                                 <div className="position-absolute w-100 h-100 opacity-25" style={{ backgroundImage: `url(http://localhost:3000/${item.mediaUrl})`, backgroundSize: 'cover', filter: 'blur(20px)' }}></div>
                                 <img
                                   src={`http://localhost:3000/${item.mediaUrl}`}
                                   alt="Announcement attachment"
                                   className="img-fluid position-relative z-1"
                                   style={{ maxHeight: "450px", objectFit: "contain", borderBottom: "1px solid rgba(0,0,0,0.1)" }}
                                 />
                               </div>
                            )}
                          </div>
                        )}
                        
                        

                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- CUSTOM CSS STYLES --- */}
      <style>{`
        .announcement-card {
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .announcement-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
        }
        .btn-hover-lift {
          transition: all 0.2s ease;
        }
        .btn-hover-lift:hover {
          background-color: #e2e8f0;
          color: #0f172a !important;
        }
        
        /* Elegant minimalist scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #f1f5f9;
        }
        ::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
}