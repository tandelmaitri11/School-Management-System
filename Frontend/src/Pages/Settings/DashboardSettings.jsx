import React from "react";
import { useDashboardSettings } from "../../context/dashboardSettingsContext";

export default function DashboardSettings() {
  const { settings, setTheme, setFontSize, resetSettings } = useDashboardSettings();

  return (
    <div className="container-fluid py-5 min-vh-100 bg-light">
      <div className="row justify-content-center">
        <div className="col-lg-8 col-xl-6">
          
          {/* Header Section */}
          <div className="mb-4">
            <h2 className="fw-bold text-dark">
              <i className="bi bi-sliders2-vertical me-2 text-primary"></i>
              Dashboard Settings
            </h2>
            <p className="text-muted">
              Personalize your workspace. These changes will be applied across all dashboard modules.
            </p>
          </div>

          {/* Theme Selection Section */}
          <div className="card border-0 shadow-sm rounded-4 mb-4">
            <div className="card-body p-4">
              <div className="d-flex align-items-center mb-3">
                <div className="bg-primary-subtle text-primary rounded-3 p-2 me-3">
                  <i className="bi bi-palette-fill fs-5"></i>
                </div>
                <h5 className="fw-bold mb-0">Appearance Mode</h5>
              </div>
              
              <div className="row g-3">
                {/* Light Theme Card */}
                <div className="col-6">
                  <div 
                    onClick={() => setTheme("light")}
                    className={`card h-100 border-2 cursor-pointer transition-all ${
                      settings.theme === "light" ? "border-primary bg-primary-subtle" : "border-light-subtle bg-white"
                    }`}
                    style={{ cursor: 'pointer', borderRadius: '12px' }}
                  >
                    <div className="card-body text-center py-4">
                      <i className={`bi bi-sun-fill fs-2 mb-2 ${settings.theme === "light" ? "text-primary" : "text-muted"}`}></i>
                      <h6 className={`fw-bold mb-0 ${settings.theme === "light" ? "text-primary" : ""}`}>Light Mode</h6>
                      <small className="text-muted">Clean & bright</small>
                    </div>
                  </div>
                </div>

                {/* Dark Theme Card */}
                <div className="col-6">
                  <div 
                    onClick={() => setTheme("dark")}
                    className={`card h-100 border-2 cursor-pointer transition-all ${
                      settings.theme === "dark" ? "border-dark bg-dark" : "border-light-subtle bg-white"
                    }`}
                    style={{ cursor: 'pointer', borderRadius: '12px' }}
                  >
                    <div className="card-body text-center py-4">
                      <i className={`bi bi-moon-stars-fill fs-2 mb-2 ${settings.theme === "dark" ? "text-white" : "text-muted"}`}></i>
                      <h6 className={`fw-bold mb-0 ${settings.theme === "dark" ? "text-white" : ""}`}>Dark Mode</h6>
                      <small className={settings.theme === "dark" ? "text-light opacity-75" : "text-muted"}>Eye-friendly</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Typography Section */}
          <div className="card border-0 shadow-sm rounded-4 mb-4">
            <div className="card-body p-4">
              <div className="d-flex align-items-center mb-4">
                <div className="bg-info-subtle text-info rounded-3 p-2 me-3">
                  <i className="bi bi-type fs-5"></i>
                </div>
                <h5 className="fw-bold mb-0">Typography & Sizing</h5>
              </div>

              <div className="row align-items-center">
                <div className="col-md-6">
                  <label className="fw-semibold text-dark mb-1">Scale Font Size</label>
                  <p className="text-muted small mb-0">Adjust the legibility of text content.</p>
                </div>
                <div className="col-md-6">
                  <div className="input-group">
                    <span className="input-group-text bg-light border-0"><i className="bi bi-text-paragraph"></i></span>
                    <select
                      className="form-select bg-light border-0 shadow-none py-2"
                      value={settings.fontSize}
                      onChange={(e) => setFontSize(e.target.value)}
                    >
                      <option value="small">Small (14px)</option>
                      <option value="medium">Medium (16px)</option>
                      <option value="large">Large (18px)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions Section */}
          <div className="d-flex align-items-center justify-content-between p-3 bg-white border rounded-4 shadow-sm">
            <div className="d-flex align-items-center">
              <i className="bi bi-arrow-counterclockwise text-muted me-2"></i>
              <span className="text-muted small">Mistakes happen. Return to the original look.</span>
            </div>
            <button 
              type="button" 
              className="btn btn-outline-danger btn-sm px-4 fw-bold rounded-pill" 
              onClick={resetSettings}
            >
              Reset All
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
