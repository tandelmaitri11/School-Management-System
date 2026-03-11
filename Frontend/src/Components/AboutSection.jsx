import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import HomeNavbar from "../Pages/Home/HomeNavbar";

function AboutSection() {
  return (
    <div className="bg-light min-vh-100">
      <HomeNavbar />
      <div className="container py-5">
        <div className="row align-items-center mb-5">
          <div className="col-lg-6">
            <h6 className="text-uppercase fw-bold text-warning mb-3">Our Mission</h6>
            <h2 className="display-5 fw-bold mb-4">Digitizing the future of classrooms.</h2>
            <p className="text-muted fs-5">
              Founded in 2024, SchoolY was built to bridge the gap between administrative complexity and educational
              excellence.
            </p>
          </div>
          <div className="col-lg-6">
            <div className="row g-3">
              <div className="col-6">
                <div className="p-4 bg-light rounded-4 text-center">
                  <h2 className="fw-bold mb-0">500+</h2>
                  <p className="small text-muted mb-0">Schools</p>
                </div>
              </div>
              <div className="col-6">
                <div className="p-4 bg-light rounded-4 text-center">
                  <h2 className="fw-bold mb-0">12k</h2>
                  <p className="small text-muted mb-0">Students</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AboutSection;
