import React, { useEffect, useMemo, useState } from "react";
import api from "../../../api/api";

const formatDateKey = (dateValue) => {
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return "Unknown Date";
  return d.toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" });
};

export default function StudentAnnouncements() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
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

  return (
    <div className="container-fluid py-4">
      <div className="d-flex align-items-center mb-4">
        <h4 className="fw-bold mb-0">Announcements & Notifications</h4>
        <span className="badge bg-primary ms-3 rounded-pill">{rows.length} Total</span>
      </div>

      {loading ? (
        <div className="text-muted text-center py-5">
          <div className="spinner-border spinner-border-sm me-2" role="status"></div>
          Loading updates...
        </div>
      ) : grouped.length === 0 ? (
        <div className="alert alert-light border-0 shadow-sm rounded-4 text-center p-5">
          <p className="text-muted mb-0">No announcements found for your profile at this time.</p>
        </div>
      ) : (
        grouped.map(([date, items]) => (
          <div key={date} className="mb-5">
            <h6 className="text-uppercase text-muted fw-bold mb-3 small tracking-wider">
              {date}
            </h6>
            
            {items.map((item) => (
              <div 
                key={item._id} 
                className="card border-0 shadow-sm mb-3 rounded-4 overflow-hidden border-start border-4 border-primary"
                style={{ transition: 'transform 0.2s' }}
              >
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-start gap-3 mb-2">
                    <h5 className="fw-bold mb-0 text-dark">{item.title}</h5>
                    <span className="badge bg-light text-secondary border rounded-pill">
                      {item.audience}
                    </span>
                  </div>
                  
                  <p className="text-secondary mb-3">{item.message}</p>
                  
                  {item.mediaUrl && (
                    <div className="mt-3">
                      {item.mediaType === "video" ? (
                        <video 
                          controls 
                          className="w-100 rounded-3" 
                          style={{ maxHeight: "300px", objectFit: 'cover' }}
                        >
                          <source src={`http://localhost:3000/${item.mediaUrl}`} />
                        </video>
                      ) : (
                        <img
                          src={`http://localhost:3000/${item.mediaUrl}`}
                          alt="announcement media"
                          className="img-fluid rounded-3 shadow-sm"
                          style={{ maxHeight: "400px" }}
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
}