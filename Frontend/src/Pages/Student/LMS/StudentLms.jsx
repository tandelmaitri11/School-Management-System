import React, { useEffect, useMemo, useState } from "react";
import api from "../../../api/api";
import { Alert, Row, Col, Spinner, Form, InputGroup } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

// --- SAAS COLOR PALETTE ---
const colors = {
  primary: "#4f46e5", // Indigo
  primaryLight: "#eef2ff",
  primaryGradient: "linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)",
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
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    background-color: ${colors.bg};
  }

  .fade-in { animation: fadeIn 0.4s ease-out forwards; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

  /* SaaS Cards */
  .saas-card {
    background: ${colors.surface};
    border-radius: 16px;
    border: 1px solid ${colors.border};
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -2px rgba(0, 0, 0, 0.02);
    transition: all 0.25s ease;
  }
  .hover-lift:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 20px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -4px rgba(0, 0, 0, 0.03);
    border-color: #cbd5e1;
  }

  /* Form Controls */
  .saas-input {
    border: 1px solid ${colors.border};
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
    font-size: 0.9rem;
    color: ${colors.textMain};
    transition: all 0.2s ease;
  }
  .saas-input:focus, .saas-input:focus-within {
    border-color: #cbd5e1;
    box-shadow: 0 0 0 3px ${colors.infoLight};
  }

  /* Progress Bar */
  .saas-progress-bg {
    background-color: rgba(255, 255, 255, 0.2);
    border-radius: 999px;
    height: 8px;
    overflow: hidden;
  }
  .saas-progress-fill {
    height: 100%;
    border-radius: 999px;
    background-color: #ffffff;
    transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* Outline Items */
  .outline-item {
    transition: all 0.2s ease;
    border: 1px solid transparent;
  }
  .outline-item:hover:not(:disabled) {
    background-color: ${colors.bg};
    border-color: ${colors.border};
    transform: scale(1.01);
  }
  .outline-item.active {
    background-color: ${colors.primaryLight};
    border-color: ${colors.primary};
    box-shadow: 0 2px 4px rgba(79, 70, 229, 0.1);
  }

  /* Custom Scrollbar for Sidebar */
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: #cbd5e1;
    border-radius: 10px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background-color: #94a3b8;
  }

  /* Buttons */
  .btn-saas {
    transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
    font-weight: 600;
  }
  .btn-saas:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(79, 70, 229, 0.2);
  }
  .btn-saas-outline {
    background-color: ${colors.surface};
    color: ${colors.textMain};
    border: 1px solid ${colors.border};
  }
  .btn-saas-outline:hover:not(:disabled) {
    background-color: ${colors.bg};
    border-color: #cbd5e1;
    transform: translateY(-1px);
  }
`;

export default function StudentLms() {
  const studentId = localStorage.getItem("studentId");
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [content, setContent] = useState([]);
  const [progress, setProgress] = useState({
    completionPct: 0,
    completedMaterialIds: [],
    totalTopics: 0,
    completedTopicsCount: 0,
    topicCompletionPct: 0,
    totalNotes: 0,
    completedNotesCount: 0,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [selectedLessonId, setSelectedLessonId] = useState("");
  const [videoProgress, setVideoProgress] = useState({});
  const [progressByMaterial, setProgressByMaterial] = useState({});
  const [lastProgressSentAt, setLastProgressSentAt] = useState({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // UI-only state
  const [outlineQuery, setOutlineQuery] = useState("");
  const [collapsedChapters, setCollapsedChapters] = useState({});

  const showMessage = (type, text) => setMessage({ type, text });

  // --- LOGIC REMAINS UNCHANGED ---
  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/lms/student/courses");
      setCourses(res.data || []);
    } catch {
      showMessage("danger", "Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  const fetchContent = async (courseId) => {
    if (!courseId) return;
    setLoading(true);
    try {
      const res = await api.get(`/api/lms/courses/${courseId}/content`);
      setContent(res.data?.chapters || []);
    } catch {
      showMessage("danger", "Failed to load content");
    } finally {
      setLoading(false);
    }
  };

  const fetchProgress = async (courseId) => {
    if (!courseId || !studentId) return;
    try {
      const res = await api.get(`/api/lms/progress/student/${studentId}/course/${courseId}`);
      setProgress(res.data);
      setProgressByMaterial(res.data.materialProgress || {});
    } catch {
      showMessage("warning", "Unable to load progress");
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourseId) {
      fetchContent(selectedCourseId);
      fetchProgress(selectedCourseId);
    }
  }, [selectedCourseId]);

  const completedSet = useMemo(() => {
    const set = new Set(progress.completedMaterialIds || []);
    Object.entries(progressByMaterial || {}).forEach(([id, item]) => {
      if ((item?.progressPct || 0) >= 100) set.add(id);
    });
    return set;
  }, [progress.completedMaterialIds, progressByMaterial]);

  const lessons = useMemo(() => {
    const items = [];
    content.forEach((chapter, chapterIndex) => {
      (chapter.materials || []).forEach((material, materialIndex) => {
        items.push({
          id: material._id,
          title: material.title,
          type: material.type,
          duration: material.duration || 0,
          chapterId: chapter._id,
          chapterTitle: chapter.title,
          chapterIndex,
          materialIndex,
          file: material.file,
          externalUrl: material.externalUrl,
          topics: chapter.topics || [],
        });
      });
    });
    return items;
  }, [content]);

  useEffect(() => {
    if (!selectedLessonId && lessons.length > 0) {
      setSelectedLessonId(lessons[0].id);
    }
  }, [lessons, selectedLessonId]);

  const selectedCourse = courses.find((course) => course._id === selectedCourseId) || null;
  const selectedLesson = lessons.find((lesson) => lesson.id === selectedLessonId) || null;

  const selectedVideoProgress = selectedLesson
    ? videoProgress[selectedLesson.id] ?? progressByMaterial[selectedLesson.id]?.progressPct ?? 0
    : 0;

  const totalLessons = lessons.length;
  const completedCount = completedSet.size;

  const displayCompletionPct = progress.totalTopics
    ? progress.topicCompletionPct || 0
    : progress.completionPct || 0;

  const updateProgress = async (materialId, pct, seconds) => {
    if (!studentId) return;
    try {
      await api.post("/api/lms/progress/update", {
        materialId,
        studentId,
        progressPct: pct,
        watchedSeconds: seconds,
      });
    } catch (err) {
      // silent
    }
  };

  const handleComplete = async (materialId) => {
    if (!studentId) {
      showMessage("warning", "Student ID not found");
      return;
    }
    try {
      await api.post("/api/lms/progress/complete", { materialId, studentId });
      fetchProgress(selectedCourseId);
    } catch {
      showMessage("danger", "Failed to update progress");
    }
  };

  const handleAutoComplete = async (materialId) => {
    if (completedSet.has(materialId)) return;

    setVideoProgress((prev) => ({ ...prev, [materialId]: 100 }));
    setProgressByMaterial((prev) => ({
      ...prev,
      [materialId]: {
        ...prev[materialId],
        progressPct: 100,
        watchedSeconds: prev[materialId]?.watchedSeconds || 0,
      },
    }));
    setProgress((prev) => ({
      ...prev,
      completedMaterialIds: Array.from(new Set([...(prev.completedMaterialIds || []), materialId])),
    }));

    await handleComplete(materialId);
  };

  const handleSelectLesson = (lesson) => {
    setSelectedLessonId(lesson.id);
  };

  const isLessonUnlocked = (lessonIndex) => {
    if (lessonIndex === 0) return true;
    const prev = lessons[lessonIndex - 1];
    return prev ? completedSet.has(prev.id) : true;
  };

  const currentLessonIndex = lessons.findIndex((lesson) => lesson.id === selectedLessonId);
  const previousLesson = currentLessonIndex > 0 ? lessons[currentLessonIndex - 1] : null;
  const nextLesson =
    currentLessonIndex >= 0 && currentLessonIndex < lessons.length - 1
      ? lessons[currentLessonIndex + 1]
      : null;

  const progressMeta = useMemo(() => {
    const pct = Number(displayCompletionPct || 0);
    const pctSafe = Number.isFinite(pct) ? Math.max(0, Math.min(100, pct)) : 0;
    return { pctSafe };
  }, [displayCompletionPct]);

  const filteredContent = useMemo(() => {
    const q = String(outlineQuery || "").trim().toLowerCase();
    if (!q) return content;
    return content
      .map((ch) => {
        const chapterMatch = String(ch.title || "").toLowerCase().includes(q);
        const mats = (ch.materials || []).filter((m) => String(m.title || "").toLowerCase().includes(q));
        if (chapterMatch) return ch;
        return { ...ch, topics: [], materials: mats };
      })
      .filter((ch) => {
        const chapterMatch = String(ch.title || "").toLowerCase().includes(q);
        return chapterMatch || (ch.materials || []).length > 0;
      });
  }, [content, outlineQuery]);

  // --- SAAS SIDEBAR / OUTLINE RENDERER ---
  const renderOutlinePanel = () => (
    <div className="saas-card h-100 d-flex flex-column">
      
      <div className="p-4 border-bottom" style={{ borderColor: colors.border }}>
        <div className="fw-bolder fs-5 d-flex align-items-center gap-2 mb-1" style={{ color: colors.textMain }}>
          <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px', backgroundColor: colors.primaryLight, color: colors.primary }}>
            <i className="bi bi-list-columns-reverse" />
          </div>
          Course Outline
        </div>
        <div className="small" style={{ color: colors.textMuted }}>Search lessons and track progress.</div>
      </div>

      <div className="p-3 border-bottom" style={{ backgroundColor: colors.bg, borderColor: colors.border }}>
        <InputGroup className="saas-input rounded-pill overflow-hidden bg-white">
          <InputGroup.Text className="bg-transparent border-0 ps-3 pe-2 text-muted">
            <i className="bi bi-search" />
          </InputGroup.Text>
          <Form.Control
            className="border-0 shadow-none bg-transparent py-2"
            value={outlineQuery}
            onChange={(e) => setOutlineQuery(e.target.value)}
            placeholder="Search syllabus..."
            style={{ fontSize: '0.85rem' }}
          />
        </InputGroup>
      </div>

      <div className="flex-grow-1 overflow-auto custom-scrollbar p-3" style={{ maxHeight: "70vh" }}>
        {filteredContent.map((chapter, chapterIndex) => {
          const isCollapsed = !!collapsedChapters[chapter._id];
          const chapterLessons = (chapter.materials || []).map((m) => {
            const lessonIndex = lessons.findIndex((lesson) => lesson.id === m._id);
            const unlocked = isLessonUnlocked(lessonIndex);
            const isActive = selectedLessonId === m._id;
            const materialProg = progressByMaterial[m._id];
            const isDone = (materialProg?.progressPct || 0) >= 100 || completedSet.has(m._id);
            return { m, lessonIndex, unlocked, isActive, isDone };
          });

          const totalInChapter = chapterLessons.length;
          const completedInChapter = chapterLessons.filter((x) => x.isDone).length;

          return (
            <div key={chapter._id} className="mb-4">
              <button
                type="button"
                className="w-100 text-start p-0 border-0 bg-transparent"
                onClick={() => setCollapsedChapters((prev) => ({ ...prev, [chapter._id]: !prev[chapter._id] }))}
              >
                <div className="d-flex align-items-center justify-content-between px-2 pb-2 mb-2 border-bottom" style={{ borderColor: colors.border }}>
                  <div>
                    <div className="fw-semibold" style={{ color: colors.textMain, fontSize: '0.95rem' }}>
                      Chapter {chapterIndex + 1}: {chapter.title}
                    </div>
                    <div className="mt-1" style={{ fontSize: "0.75rem", fontWeight: 500, color: colors.textMuted }}>
                      {completedInChapter} of {totalInChapter} completed
                    </div>
                  </div>
                  <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '28px', height: '28px', backgroundColor: colors.bg, color: colors.textMuted }}>
                    <i className={`bi ${isCollapsed ? "bi-chevron-down" : "bi-chevron-up"}`} style={{ fontSize: '0.8rem' }} />
                  </div>
                </div>
              </button>

              {!isCollapsed && (
                <div className="d-flex flex-column gap-2 mt-2">
                  {(chapterLessons || []).map(({ m, lessonIndex, unlocked, isActive, isDone }) => (
                    <button
                      key={m._id}
                      type="button"
                      className={`w-100 text-start d-flex align-items-center justify-content-between p-3 rounded-4 outline-item ${isActive ? 'active' : ''}`}
                      style={{ opacity: unlocked ? 1 : 0.6 }}
                      disabled={!unlocked}
                      onClick={() => {
                        handleSelectLesson(m);
                        setIsSidebarOpen(false);
                      }}
                    >
                      <div className="d-flex align-items-center gap-3 w-100 overflow-hidden">
                        <div className={`rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 ${
                            isDone ? "bg-success text-white" : 
                            isActive ? "bg-primary text-white" : 
                            unlocked ? "bg-light text-primary" : "bg-light text-muted"
                          }`} 
                          style={{ width: '36px', height: '36px', boxShadow: isActive ? `0 2px 8px rgba(79,70,229,0.3)` : 'none' }}
                        >
                          {isDone ? (
                            <i className="bi bi-check" style={{ fontSize: '1.2rem' }} />
                          ) : unlocked ? (
                            <i className={m.type === 'video' ? "bi bi-play-fill" : "bi bi-file-earmark-text"} style={{ fontSize: '1rem' }} />
                          ) : (
                            <i className="bi bi-lock-fill" style={{ fontSize: '0.85rem' }} />
                          )}
                        </div>
                        <div className="text-truncate">
                          <div className="fw-medium text-truncate" style={{ fontSize: '0.9rem', color: isActive ? colors.primary : colors.textMain }}>
                            {m.title}
                          </div>
                          <div className="d-flex align-items-center gap-2 mt-1" style={{ fontSize: '0.7rem', fontWeight: 600, color: colors.textMuted, letterSpacing: '0.05em' }}>
                            <span className="text-uppercase">{m.type}</span>
                            {m.duration ? <span>• {m.duration} MIN</span> : null}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  // --- MATERIAL PLAYER RENDERER ---
  const renderMaterialContent = (lesson) => {
    const fileUrl = lesson.file ? `http://localhost:3000/${lesson.file}` : "";
    const isVideo = lesson.type === "video";

    if (isVideo && fileUrl) {
      return (
        <video
          src={fileUrl}
          controls
          controlsList="nodownload noremoteplayback"
          onContextMenu={(e) => e.preventDefault()}
          onLoadedMetadata={(e) => {
            const current = progressByMaterial[lesson.id]?.watchedSeconds || 0;
            if (current > 0 && e.currentTarget.duration > 0) {
              const resumeTime = Math.min(current, e.currentTarget.duration - 1);
              if (resumeTime > 0) e.currentTarget.currentTime = resumeTime;
            }
          }}
          onTimeUpdate={(e) => {
            const current = e.currentTarget.currentTime || 0;
            const duration = e.currentTarget.duration || 0;
            if (!duration) return;
            const pct = Math.min(100, Math.round((current / duration) * 100));
            
            setVideoProgress((prev) => ({ ...prev, [lesson.id]: pct }));
            setProgressByMaterial((prev) => ({
              ...prev,
              [lesson.id]: {
                ...prev[lesson.id],
                progressPct: pct,
                watchedSeconds: Math.round(current),
              },
            }));

            if (pct >= 100 && !completedSet.has(lesson.id)) {
              handleAutoComplete(lesson.id);
            }

            const now = Date.now();
            const last = lastProgressSentAt[lesson.id] || 0;
            if (now - last > 10000 && pct >= 5) {
              setLastProgressSentAt((prev) => ({ ...prev, [lesson.id]: now }));
              updateProgress(lesson.id, pct, Math.round(current));
            }
          }}
          onEnded={(e) => {
            const duration = e.currentTarget.duration || 0;
            updateProgress(lesson.id, 100, Math.round(duration));
            handleAutoComplete(lesson.id);
            if (nextLesson && isLessonUnlocked(currentLessonIndex + 1)) {
              setSelectedLessonId(nextLesson.id);
              setIsSidebarOpen(false);
            }
          }}
          className="w-100 shadow-sm"
          style={{ maxWidth: '100%', borderRadius: '12px', outline: 'none' }}
        />
      );
    }

    if (isVideo && lesson.externalUrl) {
      return (
        <div className="ratio ratio-16x9 shadow-sm" style={{ width: '100%', maxWidth: '900px', borderRadius: '12px', overflow: 'hidden' }}>
          <iframe
            src={lesson.externalUrl}
            title={lesson.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ border: 'none' }}
          />
        </div>
      );
    }

    if (lesson.externalUrl) {
      return (
        <a href={lesson.externalUrl} target="_blank" rel="noreferrer" className="btn btn-saas rounded-pill px-4 py-3 shadow-sm d-inline-flex align-items-center" style={{ backgroundColor: colors.primary, color: '#ffffff', border: 'none' }}>
          <i className="bi bi-box-arrow-up-right me-2" />
          Open Resource in New Tab
        </a>
      );
    }

    if (fileUrl) {
      return (
        <div className="ratio ratio-16x9 shadow-sm" style={{ width: '100%', maxWidth: '900px', borderRadius: '12px', overflow: 'hidden' }}>
          <iframe src={fileUrl} title={lesson.title} style={{ border: 'none' }} />
        </div>
      );
    }

    return (
      <div className="text-center py-5">
        <div className="rounded-circle d-inline-flex align-items-center justify-content-center p-4 mb-3" style={{ backgroundColor: '#1e293b' }}>
           <i className="bi bi-file-earmark-x" style={{ fontSize: '2.5rem', color: colors.textMuted }} />
        </div>
        <h5 className="fw-medium" style={{ color: '#94a3b8' }}>No resource material provided</h5>
      </div>
    );
  };

  return (
    <div className="pb-5 pt-3 fade-in" style={{ backgroundColor: colors.bg, minHeight: '100vh' }}>
      <style>{styles}</style>
      
      {/* Full width container with responsive horizontal padding */}
      <div className="container-fluid px-4 px-xl-5">
        
        {/* --- HEADER SECTION --- */}
        <div className="d-flex flex-column flex-lg-row align-items-lg-end justify-content-between gap-4 mb-5">
          <div className="d-flex align-items-center gap-3">
            <div className="rounded-4 d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '56px', height: '56px', backgroundColor: colors.primaryLight, color: colors.primary }}>
              <i className="bi bi-mortarboard-fill fs-3" />
            </div>
            <div>
              <h2 className="mb-0 fw-bolder" style={{ color: colors.textMain, letterSpacing: '-0.5px' }}>Learning Workspace</h2>
              <div className="small fw-medium mt-1" style={{ color: colors.textMuted }}>
                Master your curriculum step-by-step.
              </div>
            </div>
          </div>

          <div className="d-flex flex-column flex-sm-row gap-3 align-items-sm-center">
            <InputGroup className="saas-input rounded-pill overflow-hidden bg-white" style={{ minWidth: '280px' }}>
              <InputGroup.Text className="bg-transparent border-0 ps-4 text-primary">
                <i className="bi bi-journal-bookmark-fill" />
              </InputGroup.Text>
              <Form.Select
                className="border-0 shadow-none py-2 fw-medium bg-transparent"
                style={{ color: colors.textMain, fontSize: '0.9rem' }}
                value={selectedCourseId}
                onChange={(e) => {
                  setSelectedCourseId(e.target.value);
                  setSelectedLessonId("");
                  setMessage({ type: "", text: "" });
                  setIsSidebarOpen(false);
                }}
              >
                <option value="">Select a course to begin...</option>
                {courses.map((course) => (
                  <option key={course._id} value={course._id}>
                    {course.title} (Class {course.classAssigned})
                  </option>
                ))}
              </Form.Select>
            </InputGroup>

            <div className="d-flex gap-2">
              <button
                className="btn btn-saas-outline rounded-pill px-4 py-2 d-flex align-items-center shadow-sm"
                onClick={() => {
                  setMessage({ type: "", text: "" });
                  fetchCourses();
                  if (selectedCourseId) {
                    fetchContent(selectedCourseId);
                    fetchProgress(selectedCourseId);
                  }
                }}
              >
                <i className="bi bi-arrow-clockwise me-2" style={{ color: colors.primary }} /> Refresh
              </button>

              <button
                className="btn btn-saas rounded-pill px-4 py-2 d-flex align-items-center shadow-sm d-lg-none"
                style={{ backgroundColor: colors.primary, color: '#ffffff', border: 'none' }}
                onClick={() => setIsSidebarOpen(true)}
              >
                <i className="bi bi-list-task me-2" /> Syllabus
              </button>
            </div>
          </div>
        </div>

        {/* --- ALERTS --- */}
        {message.text && (
          <Alert variant={message.type} className="saas-alert d-flex align-items-center justify-content-between p-3 mb-4" style={{ borderLeftColor: colors[message.type] || colors.info }}>
            <div className="d-flex align-items-center gap-3">
              <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px', backgroundColor: colors[`${message.type}Light`] || colors.infoLight, color: colors[message.type] || colors.info }}>
                 <i className={`fs-5 ${message.type === "danger" ? "bi-exclamation-octagon-fill" : "bi-info-circle-fill"}`} />
              </div>
              <div className="fw-medium" style={{ color: colors.textMain }}>{message.text}</div>
            </div>
            <button type="button" className="btn-close" onClick={() => setMessage({ type: "", text: "" })} />
          </Alert>
        )}

        {loading && (
          <div className="text-center my-5 py-5">
            <Spinner animation="border" style={{ color: colors.primary, width: '2.5rem', height: '2.5rem', borderWidth: '0.2em' }} />
            <div className="mt-3 fw-medium text-uppercase" style={{ color: colors.textMuted, fontSize: '0.8rem', letterSpacing: '1px' }}>Syncing materials...</div>
          </div>
        )}

        {/* --- MAIN PROGRESS BANNER --- */}
        {selectedCourseId && !loading && (
          <div className="saas-card overflow-hidden mb-4 border-0 shadow-sm">
            <div className="p-4 p-md-5" style={{ background: colors.primaryGradient, color: '#ffffff' }}>
              <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-4">
                <div>
                  <div className="fw-bold d-flex align-items-center gap-2 text-uppercase mb-2" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', letterSpacing: '0.1em' }}>
                    <i className="bi bi-graph-up-arrow" /> Course Progress
                  </div>
                  <h2 className="mb-0 fw-bolder" style={{ letterSpacing: '-1px', fontSize: '2.5rem' }}>
                    {progressMeta.pctSafe}% <span className="fs-5 fw-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>Completed</span>
                  </h2>
                </div>

                <div className="d-flex flex-wrap gap-3">
                  <div className="rounded-pill px-4 py-2 d-flex align-items-center gap-2" style={{ backgroundColor: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' }}>
                    <i className="bi bi-check-all fs-5" />
                    <span className="fw-semibold">{completedCount} / {totalLessons} Lessons</span>
                  </div>
                  {selectedCourse?.classAssigned && (
                    <div className="rounded-pill px-4 py-2 d-flex align-items-center gap-2" style={{ backgroundColor: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' }}>
                      <i className="bi bi-mortarboard fs-5" />
                      <span className="fw-semibold">Class {selectedCourse.classAssigned}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-4">
                 <div className="saas-progress-bg">
                    <div className="saas-progress-fill" style={{ width: `${progressMeta.pctSafe}%` }}></div>
                 </div>
              </div>
            </div>
          </div>
        )}

        {/* --- EMPTY STATE --- */}
        {selectedCourseId && content.length === 0 && !loading && (
          <div className="text-center py-5 saas-card mt-4">
            <div className="rounded-circle d-inline-flex align-items-center justify-content-center p-4 mb-3" style={{ backgroundColor: colors.bg }}>
               <i className="bi bi-inbox" style={{ fontSize: '3rem', color: colors.textMuted, opacity: 0.5 }} />
            </div>
            <h5 className="fw-semibold" style={{ color: colors.textMain }}>No content available</h5>
            <p className="small" style={{ color: colors.textMuted }}>The instructor hasn't uploaded any chapters yet.</p>
          </div>
        )}

        {/* --- MOBILE SIDEBAR OVERLAY --- */}
        {selectedCourseId && (
          <>
            <div
              className={`position-fixed top-0 start-0 w-100 h-100 bg-dark ${isSidebarOpen ? "opacity-50" : "opacity-0"}`}
              style={{
                zIndex: 1040,
                transition: "opacity .25s ease",
                pointerEvents: isSidebarOpen ? "auto" : "none",
              }}
              onClick={() => setIsSidebarOpen(false)}
            />
            <div
              className={`position-fixed top-0 start-0 vh-100 shadow-lg d-lg-none`}
              style={{
                width: "85%",
                maxWidth: 380,
                zIndex: 1055,
                transform: isSidebarOpen ? "translateX(0)" : "translateX(-100%)",
                transition: "transform .3s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              {renderOutlinePanel()}
            </div>
          </>
        )}

        {/* --- MAIN SPLIT LAYOUT --- */}
        {selectedCourseId && content.length > 0 && !loading && (
          <Row className="g-4">
            
            {/* LEFT: Outline (Desktop) */}
            <Col xs={12} lg={4} xxl={3} className="d-none d-lg-block">
              {renderOutlinePanel()}
            </Col>

            {/* RIGHT: Player + Details */}
            <Col xs={12} lg={8} xxl={9}>
              
              {/* Player Card */}
              <div className="saas-card mb-4 overflow-hidden">
                {selectedLesson ? (
                  <>
                    {/* Video Area */}
                    <div className="d-flex justify-content-center align-items-center position-relative" style={{ backgroundColor: '#020617', minHeight: '400px' }}>
                      {/* Top border accent */}
                      <div className="position-absolute top-0 start-0 w-100" style={{ height: '3px', background: colors.primaryGradient, zIndex: 10 }}></div>
                      <div className="p-0 w-100 d-flex justify-content-center">
                        {renderMaterialContent(selectedLesson)}
                      </div>
                    </div>

                    {/* Lesson Header Info */}
                    <div className="p-4 p-xl-5">
                      <div className="d-flex flex-column flex-xl-row align-items-xl-start justify-content-between gap-4">
                        
                        <div className="flex-grow-1">
                          <div className="d-flex align-items-center gap-2 fw-bold small text-uppercase mb-2" style={{ color: colors.primary, letterSpacing: '0.05em' }}>
                            <i className="bi bi-bookmark-star" />
                            {selectedLesson.chapterTitle}
                          </div>
                          <h3 className="fw-bolder mb-3" style={{ color: colors.textMain, letterSpacing: '-0.5px' }}>{selectedLesson.title}</h3>

                          <div className="d-flex flex-wrap gap-2 align-items-center">
                            <span className="badge px-3 py-2 rounded-pill fw-medium" style={{ backgroundColor: colors.bg, color: colors.textMain, border: `1px solid ${colors.border}` }}>
                              <i className={`me-2 ${selectedLesson.type === 'video' ? 'bi-play-circle-fill text-danger' : 'bi-file-earmark-text-fill text-primary'}`} />
                              {selectedLesson.type.charAt(0).toUpperCase() + selectedLesson.type.slice(1)}
                            </span>
                            
                            {selectedLesson.duration ? (
                              <span className="badge px-3 py-2 rounded-pill fw-medium" style={{ backgroundColor: colors.bg, color: colors.textMain, border: `1px solid ${colors.border}` }}>
                                <i className="bi bi-clock-fill text-warning me-2" />
                                {selectedLesson.duration} min read/watch
                              </span>
                            ) : null}

                            {completedSet.has(selectedLesson.id) ? (
                              <span className="badge px-3 py-2 rounded-pill fw-semibold" style={{ backgroundColor: colors.successLight, color: colors.success, border: '1px solid rgba(16,185,129,0.2)' }}>
                                <i className="bi bi-check-circle-fill me-2" /> Completed
                              </span>
                            ) : (
                              <span className="badge px-3 py-2 rounded-pill fw-semibold" style={{ backgroundColor: colors.primaryLight, color: colors.primary, border: '1px solid rgba(79,70,229,0.2)' }}>
                                <i className="bi bi-activity me-2" /> Progress: {selectedVideoProgress}%
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Prev / Next Controls */}
                        <div className="d-flex flex-wrap flex-xl-nowrap gap-2 flex-shrink-0">
                          <button
                            className="btn btn-saas-outline rounded-pill px-4 py-2 d-flex align-items-center"
                            disabled={!previousLesson}
                            onClick={() => previousLesson && setSelectedLessonId(previousLesson.id)}
                          >
                            <i className="bi bi-arrow-left me-2" /> Prev
                          </button>
                          <button
                            className="btn btn-saas rounded-pill px-4 py-2 d-flex align-items-center shadow-sm"
                            style={{ backgroundColor: colors.primary, color: '#ffffff', border: 'none' }}
                            disabled={!nextLesson || !isLessonUnlocked(currentLessonIndex + 1)}
                            onClick={() => nextLesson && setSelectedLessonId(nextLesson.id)}
                          >
                            Next <i className="bi bi-arrow-right ms-2" />
                          </button>
                        </div>
                      </div>

                      <hr className="my-4" style={{ borderColor: colors.border }} />

                      {/* Manual Complete Action */}
                      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between rounded-4 p-3 border" style={{ backgroundColor: colors.bg, borderColor: colors.border }}>
                        <div className="fw-medium d-flex align-items-center gap-2 mb-3 mb-sm-0" style={{ color: colors.textMain }}>
                          <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px', backgroundColor: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                            <i className="bi bi-info-circle text-primary" />
                          </div>
                          Finished learning this topic?
                        </div>
                        {completedSet.has(selectedLesson.id) ? (
                          <div className="fw-bold d-flex align-items-center gap-2 px-4 py-2 rounded-pill" style={{ backgroundColor: colors.successLight, color: colors.success }}>
                            <i className="bi bi-check2-all fs-5" /> Marked as Done
                          </div>
                        ) : (
                          <button className="btn btn-saas rounded-pill px-4 shadow-sm d-flex align-items-center gap-2 py-2" style={{ backgroundColor: colors.success, color: '#ffffff', border: 'none' }} onClick={() => handleComplete(selectedLesson.id)}>
                            <i className="bi bi-check-circle" /> Mark Complete
                          </button>
                        )}
                      </div>

                    </div>
                  </>
                ) : (
                  <div className="text-center py-5 my-5">
                    <div className="rounded-circle d-inline-flex align-items-center justify-content-center p-4 mb-3" style={{ backgroundColor: colors.bg }}>
                       <i className="bi bi-play-btn" style={{ fontSize: '3rem', color: colors.textMuted, opacity: 0.5 }} />
                    </div>
                    <h5 className="fw-semibold" style={{ color: colors.textMain }}>Select a lesson from the syllabus to begin learning.</h5>
                  </div>
                )}
              </div>

              {/* Bottom Row Information Cards */}
              <Row className="g-4">
                
                {/* Up Next Card */}
                <Col xs={12} lg={6}>
                  <div className="saas-card h-100 p-4">
                    <div className="fw-bolder mb-4 d-flex align-items-center gap-2" style={{ color: colors.textMain, fontSize: '1.1rem' }}>
                      <div className="rounded-3 d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px', backgroundColor: colors.primaryLight, color: colors.primary }}>
                         <i className="bi bi-fast-forward-fill" />
                      </div>
                      Up Next
                    </div>
                    {nextLesson ? (
                      <div className="p-3 rounded-4" style={{ backgroundColor: colors.bg, border: `1px solid ${colors.border}` }}>
                        <div className="fw-semibold text-truncate" style={{ color: colors.textMain, fontSize: '0.95rem' }}>{nextLesson.title}</div>
                        <div className="small mt-1 mb-3 d-flex align-items-center gap-2" style={{ color: colors.textMuted, fontWeight: 500 }}>
                          <i className="bi bi-journal" /> {nextLesson.chapterTitle}
                        </div>
                        <button
                          className="btn btn-saas-outline w-100 rounded-pill fw-semibold py-2"
                          disabled={!isLessonUnlocked(currentLessonIndex + 1)}
                          onClick={() => setSelectedLessonId(nextLesson.id)}
                        >
                          {isLessonUnlocked(currentLessonIndex + 1) ? "Start Lesson Now" : (
                            <><i className="bi bi-lock-fill me-2 opacity-50" /> Complete current to unlock</>
                          )}
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-4 fw-semibold rounded-4" style={{ backgroundColor: colors.successLight, color: colors.success, border: '1px solid rgba(16,185,129,0.2)' }}>
                        <i className="bi bi-trophy-fill fs-2 d-block mb-2" />
                        You're on the final lesson!
                      </div>
                    )}
                  </div>
                </Col>

                {/* Milestones Card */}
                <Col xs={12} lg={6}>
                  <div className="saas-card h-100 p-4">
                    <div className="fw-bolder mb-4 d-flex align-items-center gap-2" style={{ color: colors.textMain, fontSize: '1.1rem' }}>
                      <div className="rounded-3 d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px', backgroundColor: colors.successLight, color: colors.success }}>
                         <i className="bi bi-check2-square" />
                      </div>
                      Milestones
                    </div>
                    <div className="pe-2 custom-scrollbar" style={{ maxHeight: 180, overflowY: "auto" }}>
                      {lessons.length === 0 ? (
                        <div className="small" style={{ color: colors.textMuted }}>Your syllabus is empty.</div>
                      ) : (
                        lessons.map((lesson, idx) => (
                          <div key={lesson.id} className="d-flex align-items-start gap-3 mb-3">
                            <div className="flex-shrink-0 mt-1">
                              <i
                                className={`fs-5 ${
                                  completedSet.has(lesson.id)
                                    ? "bi-check-circle-fill text-success"
                                    : isLessonUnlocked(idx)
                                    ? "bi-circle text-muted opacity-50"
                                    : "bi-lock-fill text-muted opacity-25"
                                }`}
                              />
                            </div>
                            <div className={`small fw-medium ${completedSet.has(lesson.id) ? "text-decoration-line-through opacity-50" : ""}`} style={{ color: colors.textMain, lineHeight: '1.4' }}>
                              {lesson.title}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </Col>

              </Row>
            </Col>
          </Row>
        )}
      </div>
    </div>
  );
}