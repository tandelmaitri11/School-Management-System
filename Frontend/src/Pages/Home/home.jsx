import React from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import HomeNavbar from "./HomeNavbar";

function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="bg-light">
      <HomeNavbar />

      {/* ===== HERO SECTION ===== */}
      <section className="container py-5">
        <div className="row align-items-center">

          {/* Left Text Side */}
          <div className="col-12 col-md-6 text-center text-md-start">
            <h1 className="fw-bold display-5 mb-3">
              Smart School Management Made Simple
            </h1>
            <p className="text-muted fs-5 mb-4">
              Manage students, staff, attendance, exams, fees and more — all in one modern digital platform.
            </p>

            <div className="d-flex flex-column flex-sm-row gap-2 justify-content-center justify-content-md-start">
              <button
                className="btn text-white fw-semibold px-4"
                style={{ backgroundColor: "#d17b27" }}
                onClick={() => navigate("/register")}
              >
                Get Started
              </button>

              <button
                className="btn btn-outline-dark fw-semibold px-4"
                onClick={() => navigate("/login")}
              >
                Login
              </button>
            </div>
          </div>

          {/* Right Side Illustration */}
          <div className="col-12 col-md-6 mt-4 mt-md-0 text-center">
            <img
              src="https://img.freepik.com/free-photo/book-stack-with-apple-education-concept_23-2148898685.jpg"
              alt="books illustration"
              className="img-fluid rounded shadow"
            />
          </div>

        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section className="container py-5">
        <h2 className="fw-bold text-center mb-4">What We Offer</h2>
        <p className="text-center text-muted mb-5">
          A complete digital solution for your school.
        </p>

        <div className="row g-4">
          {[
            { icon: "bi-people-fill", title: "Student Records", desc: "Easily manage student data, academics and progress." },
            { icon: "bi-book", title: "Digital Library", desc: "Provide e-books and digital study material." },
            { icon: "bi-cash-stack", title: "Fee Management", desc: "Handle fee payments, receipts and reminders effortlessly." },
            { icon: "bi-calendar-event", title: "Attendance & Scheduling", desc: "Track attendance, exams and classes." }
          ].map((card, idx) => (
            <div className="col-6 col-md-3" key={idx}>
              <div className="card border-0 shadow-sm p-4 text-center h-100 rounded-4">
                <i className={`${card.icon} fs-1 mb-3`} style={{ color: "#d17b27" }}></i>
                <h5 className="fw-bold">{card.title}</h5>
                <p className="text-muted small">{card.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== ABOUT SECTION ===== */}
      <section className="py-5 bg-light border-top border-warning border-opacity-25">
        <div className="container row align-items-center mx-auto">

          {/* Left Image */}
          <div className="col-12 col-md-6 text-center">
            <img
              src="https://img.freepik.com/free-photo/front-view-books-stack-education-day_23-2149241030.jpg"
              className="img-fluid rounded shadow-sm"
              alt="book concept"
            />
          </div>

          {/* Right Text */}
          <div className="col-12 col-md-6 ps-md-5 mt-4 mt-md-0 text-center text-md-start">
            <h2 className="fw-bold mb-3">A Better Experience for Schools</h2>
            <p className="text-muted fs-5">
              SchoolY helps simplify daily operations, improve communication, support teachers, and provide parents with better transparency — creating a smarter learning environment.
            </p>

            <button
              className="btn px-4 fw-semibold text-white"
              style={{ backgroundColor: "#d17b27" }}
              onClick={() => navigate("/register")}
            >
              Explore More
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}

export default HomePage;
