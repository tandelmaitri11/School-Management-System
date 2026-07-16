import React, { useEffect, useMemo, useState } from "react";
import api from "../../../api/api";
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
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    background-color: ${colors.bg};
  }

  .fade-in { animation: fadeIn 0.4s ease-out forwards; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }

  /* SaaS Cards */
  .saas-card {
    background: ${colors.surface};
    border-radius: 16px;
    border: 1px solid ${colors.border};
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -2px rgba(0, 0, 0, 0.02);
    transition: all 0.2s ease;
  }
  .hover-lift:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01);
  }

  /* Date Divider */
  .date-divider {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 2.5rem 0 1.5rem 0;
  }
  .date-divider::before {
    content: "";
    position: absolute;
    width: 100%;
    height: 1px;
    background-color: ${colors.border};
    z-index: 0;
  }
  .date-badge {
    background-color: ${colors.bg};
    color: ${colors.textMuted};
    border: 1px solid ${colors.border};
    padding: 0.35rem 1.25rem;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    position: relative;
    z-index: 1;
  }

  /* Media Containers */
  .media-container {
    background-color: #0f172a;
    border-top: 1px solid ${colors.border};
    border-bottom-left-radius: 16px;
    border-bottom-right-radius: 16px;
    overflow: hidden;
    position: relative;
  }
  .video-container {
    padding: 1.5rem;
    display: flex;
    justify-content: center;
    background-color: ${colors.bg};
  }
  
  /* Utilities */
  .btn-saas {
    transition: all 0.2s ease;
  }
  .btn-saas:hover {
    background-color: ${colors.border};
    color: ${colors.textMain};
  }
`;

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
      <div className="d-flex flex-column justify-content-center align-items-center min-vh-100" style={{ backgroundColor: colors.bg }}>
        <div className="spinner-border mb-3" style={{ color: colors.primary, width: "2.5rem", height: "2.5rem", borderWidth: "0.2em" }}></div>
        <div className="fw-semibold text-uppercase tracking-wider small" style={{ color: colors.textMuted, letterSpacing: "1px" }}>Loading Feed...</div>
      </div>
    );
  }

  return (
    <div className="pb-5 pt-3 fade-in" style={{ backgroundColor: colors.bg, minHeight: "100vh" }}>
      <style>{styles}</style>
      
      {/* Full width container for the header */}
      <div className="container-fluid px-4 px-xl-5">
        
        {/* --- PAGE HEADER --- */}
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-end mb-4 pb-4 border-bottom" style={{ borderColor: colors.border }}>
          <div>
            <div className="badge mb-2 px-3 py-2 rounded-pill fw-semibold shadow-sm" style={{ backgroundColor: colors.primaryLight, color: colors.primary, border: `1px solid rgba(79,70,229,0.2)`, letterSpacing: "0.5px" }}>
              <i className="bi bi-broadcast me-2"></i> Notice Board
            </div>
            <h2 className="fw-bolder mb-1" style={{ color: colors.textMain, letterSpacing: "-1px" }}>Announcements</h2>
            <p className="mb-0 fw-medium small" style={{ color: colors.textMuted }}>Stay updated with the latest campus news and circulars.</p>
          </div>
          
          <div className="saas-card px-4 py-3 text-center d-inline-block mt-4 mt-sm-0 shadow-sm border-0">
             <span className="d-block fw-bold text-uppercase mb-1" style={{ color: colors.textMuted, fontSize: "0.65rem", letterSpacing: "1px" }}>Total Updates</span>
             <span className="fs-4 fw-bolder lh-1" style={{ color: colors.primary }}>{rows.length}</span>
          </div>
        </div>

      </div>

      {/* --- FEED CONTENT --- */}
      {/* Centered, max-width container for reading optimization */}
      <div className="container-fluid d-flex justify-content-center">
        <div className="w-100" style={{ maxWidth: "800px" }}>
          
          {grouped.length === 0 ? (
            <div className="text-center py-5 my-5 saas-card">
              <div className="rounded-circle d-inline-flex align-items-center justify-content-center p-4 mb-3" style={{ backgroundColor: colors.bg }}>
                <i className="bi bi-mailbox fs-1" style={{ color: colors.textMuted, opacity: 0.5 }}></i>
              </div>
              <h5 className="fw-bold mb-1" style={{ color: colors.textMain }}>You're all caught up!</h5>
              <p className="small fw-medium" style={{ color: colors.textMuted }}>There are currently no announcements published for you.</p>
            </div>
          ) : (
            <div className="pb-5">
              {grouped.map(([date, items]) => (
                <div key={date}>
                  
                  {/* Clean Date Divider */}
                  <div className="date-divider">
                     <span className="date-badge shadow-sm">
                       <i className="bi bi-calendar-event me-2" style={{ opacity: 0.7 }}></i>{date}
                     </span>
                  </div>
                  
                  {/* Announcement Cards */}
                  <div className="d-flex flex-column gap-4">
                    {items.map((item) => (
                      <div key={item._id} className="saas-card hover-lift">
                        <div className="d-flex flex-column">
                          
                          {/* Header & Content Area */}
                          <div className="p-4 p-md-5 pb-4">
                             <div className="d-flex justify-content-between align-items-start gap-3">
                               <div className="d-flex gap-3 align-items-start w-100">
                                 <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 mt-1" style={{ backgroundColor: colors.primaryLight, color: colors.primary, width: "42px", height: "42px" }}>
                                   <i className="bi bi-megaphone-fill fs-5"></i>
                                 </div>
                                 <div className="w-100">
                                   <h4 className="fw-bolder mb-1 lh-sm" style={{ color: colors.textMain, letterSpacing: "-0.5px" }}>
                                     {item.title}
                                   </h4>
                                   <div className="small fw-medium d-flex align-items-center gap-2 mt-2" style={{ color: colors.textMuted }}>
                                     <span>Posted at {new Date(item.publishedAt || item.createdAt).toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit'})}</span>
                                   </div>
                                 </div>
                               </div>
                             </div>
                             
                             {/* Message Body */}
                             <p className="mb-0 mt-4" style={{ color: '#334155', lineHeight: '1.7', fontSize: '1.05rem', whiteSpace: 'pre-line' }}>
                               {item.message}
                             </p>
                          </div>
                          
                          {/* Media Attachment Area */}
                          {item.mediaUrl && (
                            <div className="media-container">
                              {item.mediaType === "video" ? (
                                 <div className="video-container">
                                   <video 
                                     controls 
                                     className="w-100 rounded-3 shadow-sm" 
                                     style={{ maxHeight: "400px", backgroundColor: "#0f172a", border: `1px solid ${colors.border}` }}
                                   >
                                     <source src={`http://localhost:3000/${item.mediaUrl}`} />
                                     Your browser does not support the video tag.
                                   </video>
                                 </div>
                              ) : (
                                 <div className="d-flex justify-content-center align-items-center position-relative p-0" style={{ minHeight: "200px" }}>
                                   {/* Blurred background effect for images */}
                                   <div className="position-absolute w-100 h-100 opacity-50" style={{ backgroundImage: `url(http://localhost:3000/${item.mediaUrl})`, backgroundSize: 'cover', filter: 'blur(30px)' }}></div>
                                   <img
                                     src={`http://localhost:3000/${item.mediaUrl}`}
                                     alt="Announcement attachment"
                                     className="img-fluid position-relative z-1 w-100"
                                     style={{ maxHeight: "450px", objectFit: "contain", borderBottom: `1px solid rgba(0,0,0,0.1)` }}
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
      </div>
    </div>
  );
}