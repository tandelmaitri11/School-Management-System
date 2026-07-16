import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../api/api";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { Modal } from "react-bootstrap";
import { toast } from "react-toastify";

export default function AllStudents() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [classes, setClasses] = useState([]);
  const [completedBatches, setCompletedBatches] = useState([]);
  const [expandedClass, setExpandedClass] = useState(null);
  const [expandedBatch, setExpandedBatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [studentDetails, setStudentDetails] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchClass, setSearchClass] = useState("");
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [promoteForm, setPromoteForm] = useState({
    toClassId: "",
    toSectionId: "",
    stream: "",
    note: "",
  });

  const fetchAllStudents = async () => {
    try {
      const res = await api.get("/api/students/admin/all");
      setData(res.data);
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const res = await api.get("/api/classes");
      setClasses(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Error fetching classes:", error);
    }
  };

  const fetchCompletedBatches = async () => {
    try {
      const res = await api.get("/api/students/admin/completed-batches");
      setCompletedBatches(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Error fetching completed student batches:", error);
      setCompletedBatches([]);
    }
  };

  useEffect(() => {
    fetchAllStudents();
    fetchClasses();
    fetchCompletedBatches();
  }, []);

  const toggleClass = (className) => {
    setExpandedClass(expandedClass === className ? null : className);
  };

  const toggleBatch = (batch) => {
    setExpandedBatch(expandedBatch === batch ? null : batch);
  };

  const flatStudents = useMemo(() => {
    return data.flatMap((cls) =>
      (cls.students || []).map((student) => ({
        ...student,
        className: cls.className,
      }))
    );
  }, [data]);

  const filteredStudents = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return flatStudents.filter((s) => {
      const classOk = !searchClass || String(s.className) === String(searchClass);
      const textOk =
        !q ||
        String(s.name || "").toLowerCase().includes(q) ||
        String(s.email || "").toLowerCase().includes(q) ||
        String(s.studentId || "").toLowerCase().includes(q);
      return classOk && textOk;
    });
  }, [flatStudents, searchTerm, searchClass]);

  const isSearching = searchTerm.trim().length > 0 || searchClass !== "";
  const selectedStudentRows = useMemo(
    () => flatStudents.filter((student) => selectedStudents.includes(student.id)),
    [flatStudents, selectedStudents]
  );
  const selectedClassNames = [...new Set(selectedStudentRows.map((student) => Number(student.className || student.studentClass || 0)).filter(Boolean))];
  const selectedSingleClass = selectedClassNames.length === 1 ? selectedClassNames[0] : null;
  const isClassTwelveSelection = selectedSingleClass === 12;

  const nextClassOption = useMemo(() => {
    if (!selectedSingleClass || selectedSingleClass >= 12) return null;
    return classes.find((cls) => Number(cls.className) === Number(selectedSingleClass + 1)) || null;
  }, [classes, selectedSingleClass]);

  const targetClassDoc = useMemo(
    () => classes.find((cls) => String(cls._id) === String(promoteForm.toClassId)) || null,
    [classes, promoteForm.toClassId]
  );
  const targetSections = useMemo(() => {
    const allSections = Array.isArray(targetClassDoc?.sections) ? targetClassDoc.sections : [];
    const normalizedStream = String(promoteForm.stream || "").trim().toLowerCase();

    return allSections.filter((section) => {
      if (section?.isActive === false || section?.isLocked === true) return false;
      const sectionStream = String(section?.stream || "").trim().toLowerCase();
      if (!normalizedStream) return true;
      return !sectionStream || sectionStream === normalizedStream;
    });
  }, [targetClassDoc, promoteForm.stream]);

  const toggleStudentSelection = (studentId) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  };

  const toggleClassSelection = (classStudents) => {
    const ids = classStudents.map((student) => student.id);
    const allSelected = ids.every((id) => selectedStudents.includes(id));

    setSelectedStudents((prev) => {
      if (allSelected) {
        return prev.filter((id) => !ids.includes(id));
      }
      return [...new Set([...prev, ...ids])];
    });
  };

  const openPromoteModal = () => {
    if (!selectedStudentRows.length) return;
    if (selectedClassNames.length !== 1) {
      toast.warning("Select students from the same current class only.");
      return;
    }

    const initialClass = nextClassOption?._id || "";
    const initialStream = selectedStudentRows[0]?.stream || "";
    const initialSections = Array.isArray(nextClassOption?.sections) ? nextClassOption.sections : [];
    const initialSection =
      initialSections.find((section) => {
        if (section?.isActive === false || section?.isLocked === true) return false;
        const sectionStream = String(section?.stream || "").trim().toLowerCase();
        if (!initialStream) return true;
        return !sectionStream || sectionStream === String(initialStream).trim().toLowerCase();
      })?.name || "";

    setPromoteForm({
      toClassId: isClassTwelveSelection ? "" : initialClass,
      toSectionId: isClassTwelveSelection ? "" : initialSection,
      stream: initialStream,
      note: "",
    });
    setShowPromoteModal(true);
  };

  const handlePromote = async () => {
    if (!isClassTwelveSelection && (!promoteForm.toClassId || !promoteForm.toSectionId)) {
      toast.warning("Select target class and section.");
      return;
    }

    try {
      setPromoting(true);
      await api.post("/api/students/promote", {
        studentIds: selectedStudentRows.map((student) => student.id),
        fromAcademicYear: "",
        toAcademicYear: targetClassDoc?.academicYear || "",
        toClassId: isClassTwelveSelection ? "" : promoteForm.toClassId,
        toSectionId: isClassTwelveSelection ? "" : promoteForm.toSectionId,
        stream: promoteForm.stream || "",
        note: promoteForm.note || "",
        assignmentMode: "manual",
      });

      setShowPromoteModal(false);
      setSelectedStudents([]);
      await fetchAllStudents();
      await fetchCompletedBatches();
      toast.success(
        isClassTwelveSelection
          ? "Class 12 students completed successfully. They are hidden from the active list and available in the completed batch list."
          : "Students promoted successfully."
      );
    } catch (error) {
      console.error("Promotion failed:", error);
      toast.error(error?.response?.data?.message || "Promotion failed");
    } finally {
      setPromoting(false);
    }
  };

  const handleStudentClick = async (studentId) => {
    try {
      setShowModal(true);
      setStudentDetails(null); 
      const res = await api.get(`/api/students/details/${studentId}`);
      setStudentDetails(res.data);
    } catch (error) {
      console.error("Error fetching student details:", error);
    }
  };

  if (loading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: "80vh", backgroundColor: "#f8fafc" }}>
        <div className="spinner-border" style={{ color: '#4f46e5', width: '3rem', height: '3rem' }} role="status"></div>
        <span className="mt-3 fw-medium text-muted">Synchronizing Directory...</span>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4 min-vh-100" style={{ backgroundColor: "#f8fafc", fontFamily: "'Inter', sans-serif" }}>
      
      {/* Premium Custom CSS */}
      <style>{`
        .premium-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); transition: all 0.2s; }
        .input-premium { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 16px; transition: all 0.2s; font-weight: 500; color: #0f172a; }
        .input-premium:focus { border-color: #4f46e5; box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1); background: #ffffff; outline: none; }
        .btn-brand { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); border: none; color: white; transition: all 0.2s; }
        .btn-brand:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(79, 70, 229, 0.3); color: white; }
        
        .class-accordion { border: 1px solid #e2e8f0; border-radius: 16px; background: #ffffff; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer; }
        .class-accordion:hover { border-color: rgba(79, 70, 229, 0.3); transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05); }
        .class-accordion-active { border-color: #4f46e5 !important; box-shadow: 0 10px 25px -5px rgba(79, 70, 229, 0.15) !important; transform: scale(1.01); }
        
        .class-badge { width: 56px; height: 56px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; font-weight: 800; background: #e0e7ff; color: #4f46e5; transition: all 0.3s; }
        .class-accordion-active .class-badge { background: #4f46e5; color: white; }
        
        .chevron-circle { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all 0.3s; background: #f1f5f9; color: #64748b; }
        .rotate-180 { transform: rotate(180deg); background: #e0e7ff !important; color: #4f46e5 !important; }

        .student-card { border: 1px solid #e2e8f0; border-radius: 16px; background: #ffffff; transition: all 0.2s ease; cursor: pointer; overflow: hidden; }
        .student-card:hover { border-color: #4f46e5; transform: translateY(-4px); box-shadow: 0 12px 24px -8px rgba(79, 70, 229, 0.25); }
        
        .modern-modal .modal-content { border: none; border-radius: 24px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); }
        .avatar-lg { width: 100px; height: 100px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; font-weight: 800; background: #ffffff; color: #4f46e5; border: 4px solid rgba(255,255,255,0.2); box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
        
        .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        
        /* Expand/Collapse Animation for Class Lists */
        .expandable-content { display: grid; transition: grid-template-rows 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .expandable-content.collapsed { grid-template-rows: 0fr; }
        .expandable-content.expanded { grid-template-rows: 1fr; }
        .expandable-inner { overflow: hidden; }
      `}</style>

      {/* Premium Header Card */}
      <div className="container-fluid" style={{ maxWidth: "1400px" }}>
        <div 
          className="rounded-4 overflow-hidden mb-4 shadow-sm border-0 position-relative p-4 p-md-5"
          style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)" }}
        >
          <div style={{ position: 'absolute', top: '-50%', right: '-5%', width: '300px', height: '300px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}></div>
          <div className="position-relative z-1 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-4">
            <div>
              <span className="badge px-3 py-2 rounded-pill fw-semibold mb-3" style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.3)', color: 'white' }}>
                <i className="bi bi-people-fill me-1"></i> Directory Management
              </span>
              <h2 className="display-6 fw-bolder text-white mb-1" style={{ letterSpacing: '-1px' }}>Student Registry</h2>
              <p className="text-white opacity-75 fw-medium mb-0">Overview of institutional enrollment and academic profiles.</p>
            </div>
            
            <div className="bg-white p-3 rounded-4 shadow-sm d-flex align-items-center">
              <div className="rounded-circle d-flex align-items-center justify-content-center me-3 bg-primary bg-opacity-10 text-primary" style={{ width: 48, height: 48 }}>
                <i className="bi bi-mortarboard-fill fs-4"></i>
              </div>
              <div>
                <div className="small fw-bold text-muted text-uppercase" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>Total Enrolled</div>
                <div className="fw-bolder fs-3 text-dark lh-1">{flatStudents.length.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>

        {selectedStudents.length > 0 && (
          <div className="premium-card p-3 p-md-4 mb-4 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 animate-fade-in">
            <div>
              <div className="fw-bolder text-dark">{selectedStudents.length} student{selectedStudents.length > 1 ? "s" : ""} selected</div>
              <div className="text-muted small">
                {selectedSingleClass ? `Current class: ${selectedSingleClass}` : "Select students from one class to promote together."}
              </div>
            </div>
            <div className="d-flex gap-2">
              <button type="button" className="btn btn-brand rounded-pill px-4 fw-bold" onClick={openPromoteModal}>
                <i className="bi bi-arrow-up-circle me-2"></i>
                Promote
              </button>
              <button type="button" className="btn btn-light border rounded-pill px-4 fw-semibold" onClick={() => setSelectedStudents([])}>
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Modern Filter Bar */}
        <div className="premium-card p-4 mb-5">
          <div className="row g-3">
            <div className="col-12 col-lg-6">
              <label className="form-label small fw-bold text-muted text-uppercase d-none d-lg-block mb-2">Search Directory</label>
              <div className="position-relative">
                <i className="bi bi-search position-absolute text-muted" style={{ top: '50%', transform: 'translateY(-50%)', left: '16px' }}></i>
                <input
                  type="text"
                  className="form-control input-premium w-100"
                  style={{ paddingLeft: '44px' }}
                  placeholder="Find by name, email, or Student ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-12 col-md-8 col-lg-4">
              <label className="form-label small fw-bold text-muted text-uppercase d-none d-lg-block mb-2">Filter by Class</label>
              <select
                className="form-select input-premium w-100"
                value={searchClass}
                onChange={(e) => setSearchClass(e.target.value)}
              >
                <option value="">All Classes</option>
                {data.map((cls) => (
                  <option key={cls.className} value={cls.className}>
                    Class {cls.className}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-12 col-md-4 col-lg-2 d-flex align-items-end">
              <button
                type="button"
                className="btn bg-light border text-muted fw-semibold w-100 py-2 rounded-3"
                onClick={() => {
                  setSearchTerm("");
                  setSearchClass("");
                }}
                style={{ height: '46px' }}
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        {data.length === 0 ? (
          <div className="text-center py-5">
            <div className="rounded-circle bg-white shadow-sm d-inline-flex align-items-center justify-content-center mb-4" style={{ width: 100, height: 100 }}>
              <i className="bi bi-cloud-slash text-muted opacity-50 display-4"></i>
            </div>
            <h4 className="fw-bolder text-dark mb-2">No Directory Data</h4>
            <p className="text-muted fw-medium">There are currently no students registered in the system.</p>
          </div>
        ) : isSearching ? (
          <div className="animate-fade-in">
            <div className="d-flex align-items-center justify-content-between mb-4 pb-2 border-bottom">
              <h5 className="fw-bolder text-dark mb-0 d-flex align-items-center">
                <i className="bi bi-search text-primary me-2"></i> Search Results
              </h5>
              <span className="badge bg-primary rounded-pill px-3 py-2 fs-6">{filteredStudents.length} Found</span>
            </div>
            
            <div className="row g-4">
              {filteredStudents.length === 0 ? (
                <div className="col-12 text-center py-5">
                  <p className="text-muted fw-medium fs-5">No matches found for <span className="text-dark fw-bold">"{searchTerm}"</span></p>
                </div>
              ) : (
                filteredStudents.map((student) => (
                  <StudentCard
                    key={student.id}
                    student={student}
                    onClick={handleStudentClick}
                    onViewReport={(id) => navigate(`/admin/reports/student/${id}`)}
                    onViewPdf={(id) => navigate(`/admin/reports/student/${id}?pdf=1`)}
                    showClass={true}
                  />
                ))
              )}
            </div>
          </div>
        ) : (
          /* Grouped by Class View */
          data.map((cls, index) => {
            const isExpanded = expandedClass === cls.className;
            return (
              <div className="mb-4 animate-fade-in" key={index} style={{ animationDelay: `${index * 0.05}s` }}>
                <div
                  className={`class-accordion p-4 d-flex justify-content-between align-items-center ${isExpanded ? 'class-accordion-active' : ''}`}
                  onClick={() => toggleClass(cls.className)}
                >
                  <div className="d-flex align-items-center">
                    <div className="class-badge me-4 shadow-sm">
                      {cls.className}
                    </div>
                    <div>
                      <h4 className="fw-bolder text-dark mb-1">Class {cls.className}</h4>
                      <div className="d-flex align-items-center fw-medium text-muted small">
                        <i className="bi bi-person-badge-fill text-primary me-2 opacity-75"></i>
                        Teacher: <span className="text-dark ms-1">{cls.teacher}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="d-flex align-items-center gap-4">
                    <div className="text-end d-none d-sm-block">
                      <div className="fw-bolder text-dark fs-4 lh-1">{cls.totalStudents}</div>
                      <div className="small fw-bold text-muted text-uppercase" style={{ fontSize: '0.65rem', letterSpacing: '0.5px' }}>Enrolled</div>
                    </div>
                    <div className={`chevron-circle shadow-sm ${isExpanded ? 'rotate-180' : ''}`}>
                      <i className="bi bi-chevron-down fw-bold"></i>
                    </div>
                  </div>
                </div>

                {/* Smooth Expandable Content */}
                <div className={`expandable-content ${isExpanded ? 'expanded' : 'collapsed'}`}>
                  <div className="expandable-inner">
                    <div className="pt-4 pb-2 px-2">
                      <div className="row g-4">
                        {cls.students.length === 0 ? (
                          <div className="col-12 text-center py-4 text-muted fw-medium">No students enrolled in this class.</div>
                        ) : (
                          <>
                            <div className="col-12 d-flex justify-content-end">
                              <button
                                type="button"
                                className="btn btn-sm btn-light border rounded-pill px-3 fw-semibold"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleClassSelection(cls.students);
                                }}
                              >
                                {cls.students.every((student) => selectedStudents.includes(student.id)) ? "Unselect Class" : "Select Class"}
                              </button>
                            </div>
                            {cls.students.map((student) => (
                              <StudentCard
                                key={student.id}
                                student={student}
                                onClick={handleStudentClick}
                                onViewReport={(id) => navigate(`/admin/reports/student/${id}`)}
                                onViewPdf={(id) => navigate(`/admin/reports/student/${id}?pdf=1`)}
                                selected={selectedStudents.includes(student.id)}
                                onToggleSelect={toggleStudentSelection}
                              />
                            ))}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}

        <div className="premium-card p-4 mt-5">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
            <div>
              <h4 className="fw-bolder text-dark mb-1">Completed Batch Students</h4>
              <p className="text-muted mb-0">Class 12 students hidden from the active registry are listed here by batch year.</p>
            </div>
            <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 rounded-pill px-3 py-2 fw-semibold">
              {completedBatches.reduce((sum, batch) => sum + Number(batch.totalStudents || 0), 0)} Completed
            </span>
          </div>

          {completedBatches.length === 0 ? (
            <div className="text-center py-4 text-muted fw-medium">No completed student batches found.</div>
          ) : (
            completedBatches.map((batch, index) => {
              const isExpanded = expandedBatch === batch.batch;
              return (
                <div className="mb-3" key={batch.batch || index}>
                  <div
                    className={`class-accordion p-4 d-flex justify-content-between align-items-center ${isExpanded ? 'class-accordion-active' : ''}`}
                    onClick={() => toggleBatch(batch.batch)}
                  >
                    <div className="d-flex align-items-center">
                      <div className="class-badge me-4 shadow-sm" style={{ background: isExpanded ? '#198754' : '#dcfce7', color: isExpanded ? '#fff' : '#198754' }}>
                        <i className="bi bi-award-fill"></i>
                      </div>
                      <div>
                        <h4 className="fw-bolder text-dark mb-1">Batch {batch.batch}</h4>
                        <div className="small text-muted fw-medium">Completed Class 12 students</div>
                      </div>
                    </div>

                    <div className="d-flex align-items-center gap-4">
                      <div className="text-end d-none d-sm-block">
                        <div className="fw-bolder text-dark fs-4 lh-1">{batch.totalStudents}</div>
                        <div className="small fw-bold text-muted text-uppercase" style={{ fontSize: '0.65rem', letterSpacing: '0.5px' }}>Students</div>
                      </div>
                      <div className={`chevron-circle shadow-sm ${isExpanded ? 'rotate-180' : ''}`}>
                        <i className="bi bi-chevron-down fw-bold"></i>
                      </div>
                    </div>
                  </div>

                  <div className={`expandable-content ${isExpanded ? 'expanded' : 'collapsed'}`}>
                    <div className="expandable-inner">
                      <div className="table-responsive pt-3">
                        <table className="table align-middle">
                          <thead>
                            <tr>
                              <th>Student</th>
                              <th>ID</th>
                              <th>Stream</th>
                              <th>Section</th>
                              <th>Completed</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(batch.students || []).map((student) => (
                              <tr key={student.id}>
                                <td>
                                  <div className="fw-semibold text-dark">{student.name}</div>
                                  <div className="small text-muted">{student.email}</div>
                                </td>
                                <td className="fw-semibold">{student.studentId || "---"}</td>
                                <td>{student.stream || "General"}</td>
                                <td>{student.section || "-"}</td>
                                <td>{student.completedAt ? new Date(student.completedAt).toLocaleDateString() : "-"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Premium Profile Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered className="modern-modal" backdrop="static">
        <Modal.Body className="p-0 position-relative">
          {!studentDetails ? (
            <div className="text-center py-5 my-5">
              <div className="spinner-border" style={{ color: '#4f46e5' }} role="status"></div>
              <div className="mt-3 text-muted fw-medium">Loading Profile Data...</div>
            </div>
          ) : (
            <div className="row g-0">
              {/* Sidebar Profile Pane */}
              <div className="col-12 col-md-5 col-lg-4 p-5 text-center text-white d-flex flex-column position-relative overflow-hidden" style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)" }}>
                <div style={{ position: 'absolute', top: '-10%', left: '-20%', width: '150px', height: '150px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}></div>
                
                <div className="position-relative z-1 mt-3">
                  <div className="avatar-lg mx-auto mb-4">
                    {studentDetails.student.name.charAt(0).toUpperCase()}
                  </div>
                  <h4 className="fw-bolder mb-1 lh-sm">{studentDetails.student.name}</h4>
                  {studentDetails.student.isNewPromotion && (
                    <div className="mb-2">
                      <span className="badge bg-warning text-dark px-3 py-2 rounded-pill fw-bold">NEW</span>
                    </div>
                  )}
                  <div className="badge bg-white text-dark border shadow-sm px-3 py-2 rounded-pill mt-2 fw-bold">
                    ID: {studentDetails.student.studentId}
                  </div>
                </div>
                
                <div className="mt-auto pt-5 position-relative z-1 text-start">
                  <label className="text-white-50 small fw-bold text-uppercase d-block mb-2" style={{ letterSpacing: '1px', fontSize: '0.7rem' }}>Academic Placement</label>
                  <div className="bg-white bg-opacity-10 border border-white border-opacity-25 rounded-4 p-3 backdrop-blur shadow-sm">
                    <div className="fw-bolder fs-5">Class {studentDetails.student.studentClass}</div>
                    <div className="d-flex align-items-center mt-1 fw-medium" style={{ fontSize: '0.85rem' }}>
                      <i className="bi bi-diagram-2-fill me-2 opacity-75"></i> Section {studentDetails.student.section || "A"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Detail Pane */}
              <div className="col-12 col-md-7 col-lg-8 p-4 p-md-5 bg-white d-flex flex-column">
                <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom" style={{ borderColor: '#f1f5f9' }}>
                  <h5 className="fw-bolder text-dark mb-0 d-flex align-items-center">
                    <i className="bi bi-person-vcard-fill text-primary me-2"></i> Student Profile
                  </h5>
                  <button type="button" className="btn-close shadow-none" onClick={() => setShowModal(false)}></button>
                </div>
                
                <div className="row g-4 mb-4">
                  <InfoBox label="Email Address" value={studentDetails.student.email} icon="bi-envelope-at-fill" />
                  <InfoBox label="Academic Stream" value={studentDetails.student.stream} icon="bi-layers-fill" />
                  <InfoBox label="Gender" value={studentDetails.info?.gender} icon="bi-gender-ambiguous" />
                  <InfoBox label="Blood Group" value={studentDetails.info?.bloodGroup} icon="bi-droplet-fill" color="text-danger" />
                </div>

                <div className="mt-auto">
                  <h6 className="fw-bold text-dark mb-3 text-uppercase small" style={{ letterSpacing: '0.5px' }}>Guardian Contact Information</h6>
                  <div className="row g-3">
                    <div className="col-12 col-sm-6">
                      <div className="p-3 bg-light rounded-4 border">
                        <div className="d-flex align-items-center mb-1 text-muted" style={{ fontSize: '0.7rem' }}>
                          <i className="bi bi-person-fill text-primary me-1"></i> <span className="fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>Father</span>
                        </div>
                        <div className="fw-bolder text-dark">{studentDetails.info?.fatherName || "Not Provided"}</div>
                        <div className="fw-medium text-primary mt-1" style={{ fontSize: '0.85rem' }}>{studentDetails.info?.fatherMobile || "---"}</div>
                      </div>
                    </div>
                    <div className="col-12 col-sm-6">
                      <div className="p-3 bg-light rounded-4 border">
                        <div className="d-flex align-items-center mb-1 text-muted" style={{ fontSize: '0.7rem' }}>
                          <i className="bi bi-person-fill text-info me-1"></i> <span className="fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>Mother</span>
                        </div>
                        <div className="fw-bolder text-dark">{studentDetails.info?.motherName || "Not Provided"}</div>
                        <div className="fw-medium text-info mt-1" style={{ fontSize: '0.85rem' }}>{studentDetails.info?.motherMobile || "---"}</div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}
        </Modal.Body>
      </Modal>

      <Modal show={showPromoteModal} onHide={() => !promoting && setShowPromoteModal(false)} centered>
        <Modal.Header closeButton={!promoting}>
          <Modal.Title className="fw-bolder">Promote Students</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3">
            <label className="form-label fw-semibold">Selected Students</label>
            <div className="small text-muted">{selectedStudentRows.length} selected from Class {selectedSingleClass || "-"}</div>
          </div>

          {isClassTwelveSelection ? (
            <div className="alert alert-success border-0 rounded-4">
              Class 12 students will be marked as completed successfully and removed from the active student list.
            </div>
          ) : (
            <div className="mb-3">
              <label className="form-label fw-semibold">Target Class</label>
              <select
                className="form-select"
                value={promoteForm.toClassId}
                onChange={(e) => {
                  const nextTarget = classes.find((cls) => String(cls._id) === String(e.target.value));
                  const nextSections = Array.isArray(nextTarget?.sections) ? nextTarget.sections : [];
                  setPromoteForm((prev) => ({
                    ...prev,
                    toClassId: e.target.value,
                    toSectionId: nextSections.find((section) => section?.isActive !== false && section?.isLocked !== true)?.name || "",
                  }));
                }}
              >
                <option value="">Select Class</option>
                {classes
                  .sort((a, b) => Number(a.className) - Number(b.className))
                  .map((cls) => (
                    <option key={cls._id} value={cls._id}>
                      Class {cls.className}{cls.academicYear ? ` (${cls.academicYear})` : ""}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {!isClassTwelveSelection && !!(targetClassDoc?.streams || []).length && (
            <div className="mb-3">
              <label className="form-label fw-semibold">Stream</label>
              <select
                className="form-select"
                value={promoteForm.stream}
                onChange={(e) => setPromoteForm((prev) => ({ ...prev, stream: e.target.value, toSectionId: "" }))}
              >
                <option value="">General</option>
                {(targetClassDoc?.streams || [])
                  .filter((item) => item?.isActive !== false)
                  .map((item) => (
                    <option key={item.name} value={item.name}>
                      {item.name}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {!isClassTwelveSelection && (
            <div className="mb-3">
              <label className="form-label fw-semibold">Target Section</label>
              <select
                className="form-select"
                value={promoteForm.toSectionId}
                onChange={(e) => setPromoteForm((prev) => ({ ...prev, toSectionId: e.target.value }))}
              >
                <option value="">Select Section</option>
                {targetSections.map((section) => (
                  <option key={section._id || section.name} value={section.name}>
                    Section {section.name}{section.stream ? ` - ${section.stream}` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="mb-0">
            <label className="form-label fw-semibold">Note</label>
            <textarea
              rows="3"
              className="form-control"
              value={promoteForm.note}
              onChange={(e) => setPromoteForm((prev) => ({ ...prev, note: e.target.value }))}
              placeholder="Optional promotion note"
            />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button type="button" className="btn btn-light border" disabled={promoting} onClick={() => setShowPromoteModal(false)}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" disabled={promoting} onClick={handlePromote}>
            {promoting ? "Promoting..." : "Promote"}
          </button>
        </Modal.Footer>
      </Modal>

    </div>
  );
}

// Subcomponent: Extracted and styled
function StudentCard({ student, onClick, onViewReport, onViewPdf, showClass = false, selected = false, onToggleSelect }) {
  return (
    <div className="col-12 col-md-6 col-lg-4 col-xl-3">
      <div 
        className="student-card p-4 h-100 d-flex flex-column" 
        onClick={() => onClick(student.id)}
        style={selected ? { borderColor: "#4f46e5", boxShadow: "0 12px 24px -8px rgba(79, 70, 229, 0.25)" } : {}}
      >
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div className="form-check m-0">
            <input
              type="checkbox"
              className="form-check-input"
              checked={selected}
              onChange={(e) => {
                e.stopPropagation();
                onToggleSelect?.(student.id);
              }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>

        <div className="d-flex align-items-center mb-3">
          <div className="rounded-circle d-flex align-items-center justify-content-center me-3 shadow-sm fw-bolder fs-5" style={{ width: 48, height: 48, background: '#f1f5f9', color: '#4f46e5' }}>
            {student.name.charAt(0).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <h6 className="mb-0 text-truncate fw-bolder text-dark">{student.name}</h6>
            <div className="text-muted fw-bold" style={{ fontSize: "0.7rem", letterSpacing: "0.5px" }}>ID: {student.studentId || "---"}</div>
          </div>
        </div>

        <div className="mb-3 flex-grow-1">
          <div className="d-flex align-items-center text-muted fw-medium mb-2" style={{ fontSize: "0.8rem" }}>
            <i className="bi bi-envelope-fill me-2 opacity-50"></i>
            <span className="text-truncate">{student.email}</span>
          </div>
          
          <div className="d-flex flex-wrap gap-2 mt-2">
            {student.isNewPromotion && (
              <span className="badge bg-warning text-dark px-2 py-1 fw-bold">
                NEW
              </span>
            )}
            {showClass && (
              <span className="badge bg-light text-dark border px-2 py-1 fw-semibold">
                Class {student.className}
              </span>
            )}
            {student.stream && (
              <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-10 px-2 py-1 fw-semibold">
                {student.stream}
              </span>
            )}
            {student.section && (
              <span className="badge bg-light text-muted border px-2 py-1 fw-semibold">
                Sec {student.section}
              </span>
            )}
          </div>
        </div>

        <div className="d-flex gap-2 pt-3 border-top" style={{ borderColor: '#f1f5f9' }}>
          <button
            type="button"
            className="btn btn-sm btn-light text-primary flex-grow-1 fw-bold rounded-3"
            onClick={(e) => {
              e.stopPropagation();
              onViewReport?.(student.id);
            }}
          >
            Report
          </button>
          <button
            type="button"
            className="btn btn-sm bg-light border text-dark flex-grow-1 fw-bold rounded-3"
            onClick={(e) => {
              e.stopPropagation();
              onViewPdf?.(student.id);
            }}
          >
            <i className="bi bi-file-earmark-pdf-fill text-danger me-1"></i> PDF
          </button>
        </div>
      </div>
    </div>
  );
}

// Subcomponent: Extracted and styled
function InfoBox({ label, value, icon, color = "text-dark" }) {
  return (
    <div className="col-12 col-sm-6">
      <div className="d-flex align-items-start">
        <div className="rounded-circle bg-light d-flex align-items-center justify-content-center me-3 mt-1 text-muted" style={{ width: 36, height: 36 }}>
          <i className={`bi ${icon}`}></i>
        </div>
        <div>
          <label className="text-muted fw-bold d-block text-uppercase mb-1" style={{ fontSize: '0.65rem', letterSpacing: '0.5px' }}>{label}</label>
          <div className={`fw-bolder fs-6 ${color}`}>{value || "Not Set"}</div>
        </div>
      </div>
    </div>
  );
}
