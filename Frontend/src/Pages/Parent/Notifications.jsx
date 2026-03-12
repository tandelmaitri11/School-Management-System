import React, { useEffect, useState } from "react";
import api from "../../api/api";

export default function ParentNotifications() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get("/api/parent/notifications");
        setRows(res.data?.notifications || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load notifications");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center vh-100 bg-light">
        <div className="spinner-border text-primary" role="status" style={{ width: "3rem", height: "3rem" }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <div className="mt-3 text-muted fw-medium">Loading notifications...</div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4 px-md-4 bg-light min-vh-100">
      {/* Header Section */}
      <div className="mb-5">
        <h2 className="fw-bold mb-1 text-dark d-flex align-items-center gap-2">
          <div className="bg-primary bg-opacity-10 text-primary p-2 rounded-3 d-inline-flex align-items-center justify-content-center shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zM8 1.918l-.797.161A4.002 4.002 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4.002 4.002 0 0 0-3.203-3.92L8 1.917zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0A5.002 5.002 0 0 1 13 6c0 .88.32 4.2 1.22 6z"/>
            </svg>
          </div>
          Notifications
        </h2>
        <div className="text-secondary fw-medium mt-2">School notices, results, and student-linked alerts.</div>
      </div>

      {error && (
        <div className="alert alert-danger shadow-sm border-0 border-start border-danger border-4 rounded-3 d-flex align-items-center gap-3 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-exclamation-circle-fill flex-shrink-0" viewBox="0 0 16 16">
            <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8 4a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4zm.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/>
          </svg>
          <div>{error}</div>
        </div>
      )}

      {!rows.length ? (
        <div className="card border-0 shadow-sm rounded-4 py-5 text-center">
          <div className="card-body">
            <div className="text-muted mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" className="opacity-50" viewBox="0 0 16 16">
                <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zM8 1.918l-.797.161A4.002 4.002 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4.002 4.002 0 0 0-3.203-3.92L8 1.917zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0A5.002 5.002 0 0 1 13 6c0 .88.32 4.2 1.22 6z"/>
                <path d="M11.536 12.81L8 9.274l-3.536 3.536-1.06-1.06L6.939 8 3.403 4.464l1.06-1.06L8 6.939l3.536-3.535 1.06 1.06L9.061 8l3.535 3.536-1.06 1.06z"/>
              </svg>
            </div>
            <h5 className="text-secondary fw-semibold">No notifications yet</h5>
            <p className="text-muted mb-0">You're all caught up! New alerts will appear here.</p>
          </div>
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {rows.map((row) => (
            <div 
              className="card border-0 shadow-sm rounded-4 overflow-hidden" 
              key={row._id}
            >
              <div className="card-body p-4">
                <div className="d-flex gap-3 align-items-start">
                  
                  {/* Notification Icon */}
                  <div className="bg-primary bg-opacity-10 text-primary p-3 rounded-circle d-none d-sm-flex align-items-center justify-content-center flex-shrink-0" style={{ width: "48px", height: "48px" }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
                    </svg>
                  </div>

                  {/* Content Body */}
                  <div className="flex-grow-1">
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-start mb-2 gap-2">
                      <h5 className="fw-bold text-dark mb-0">{row.title}</h5>
                      
                      {/* Timestamp */}
                      <div className="text-muted small d-flex align-items-center gap-1 flex-shrink-0 bg-light px-2 py-1 rounded-2 border">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/>
                          <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/>
                        </svg>
                        {row.createdAt ? new Date(row.createdAt).toLocaleString() : "-"}
                      </div>
                    </div>
                    
                    <p className="text-secondary mb-3" style={{ fontSize: "0.95rem" }}>
                      {row.message}
                    </p>
                    
                    {/* Optional Linked Student Tag */}
                    {row.student ? (
                      <div className="d-inline-flex align-items-center gap-2 bg-secondary bg-opacity-10 px-3 py-1 rounded-pill border">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" className="text-secondary" viewBox="0 0 16 16">
                          <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
                        </svg>
                        <span className="small text-dark fw-medium">
                          {row.student.name} <span className="text-muted ms-1">({row.student.studentId})</span>
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}