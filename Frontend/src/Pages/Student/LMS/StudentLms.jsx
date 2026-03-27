import React, { useEffect, useMemo, useState } from "react";
import api from "../../../api/api";
import { Alert, Badge, Button, Card, Col, Form, InputGroup, ListGroup, ProgressBar, Row, Spinner } from "react-bootstrap";

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

  // UI-only state (no data/logic change)
  const [outlineQuery, setOutlineQuery] = useState("");
  const [collapsedChapters, setCollapsedChapters] = useState({}); // { [chapterId]: boolean }

  const showMessage = (type, text) => setMessage({ type, text });

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
      // silent to avoid spamming user
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

    // Optimistic local state update so UI reflects completion right away.
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

  // UI-only: progress text + quick numbers
  const progressMeta = useMemo(() => {
    const pct = Number(displayCompletionPct || 0);
    const pctSafe = Number.isFinite(pct) ? Math.max(0, Math.min(100, pct)) : 0;

    const lessonsText = `${completedCount}/${totalLessons} lessons`;
    const topicsText = progress.totalTopics
      ? `${progress.completedTopicsCount}/${progress.totalTopics} topics`
      : "";
    const notesText = progress.totalNotes
      ? `Notes: ${progress.completedNotesCount}/${progress.totalNotes}`
      : "";

    return { pctSafe, lessonsText, topicsText, notesText };
  }, [
    displayCompletionPct,
    completedCount,
    totalLessons,
    progress.totalTopics,
    progress.completedTopicsCount,
    progress.totalNotes,
    progress.completedNotesCount,
  ]);

  // UI-only: filter outline
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
        return (
          chapterMatch ||
          (ch.materials || []).length > 0
        );
      });
  }, [content, outlineQuery]);

  const renderOutlinePanel = () => (
    <Card className="shadow-sm border-0 h-100 rounded-4">
      <Card.Header className="bg-white border-0 pt-4 pb-0 px-4">
        <div className="fw-bolder fs-5 d-flex align-items-center gap-2 mb-1">
          <i className="bi bi-list-columns-reverse text-primary" />
          Course Outline
        </div>
        <div className="text-muted small">Search lessons and continue where you left off.</div>
      </Card.Header>

      <Card.Body className="pt-3 px-3 px-xl-4 pb-4" style={{ maxHeight: "75vh", overflowY: "auto" }}>
        <InputGroup className="mb-4 shadow-sm rounded-pill overflow-hidden">
          <InputGroup.Text className="bg-light border-0 ps-4">
            <i className="bi bi-search text-muted" />
          </InputGroup.Text>
          <Form.Control
            className="bg-light border-0 shadow-none py-2"
            value={outlineQuery}
            onChange={(e) => setOutlineQuery(e.target.value)}
            placeholder="Search chapter, lesson..."
          />
        </InputGroup>

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
                className="btn w-100 text-start p-0 border-0 bg-transparent"
                onClick={() => setCollapsedChapters((prev) => ({ ...prev, [chapter._id]: !prev[chapter._id] }))}
              >
                <div className="d-flex align-items-center justify-content-between px-2 pb-2 border-bottom">
                  <div>
                    <div className="fw-bolder text-dark">
                      Chapter {chapterIndex + 1}: {chapter.title}
                    </div>
                    <div className="text-muted" style={{ fontSize: "0.8rem", fontWeight: 500 }}>
                      {completedInChapter} of {totalInChapter} lessons completed
                    </div>
                  </div>
                  <div className="text-muted bg-light rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                    <i className={`bi ${isCollapsed ? "bi-chevron-down" : "bi-chevron-up"}`} />
                  </div>
                </div>
              </button>

              {!isCollapsed && (
                <div className="mt-3 d-flex flex-column gap-2 px-1">
                  {(chapterLessons || []).map(({ m, lessonIndex, unlocked, isActive, isDone }) => (
                    <button
                      key={m._id}
                      type="button"
                      className={`btn w-100 text-start d-flex align-items-center justify-content-between p-3 rounded-4 transition-all ${
                        isActive 
                          ? "bg-primary bg-opacity-10 border border-primary border-opacity-25 shadow-sm" 
                          : "bg-white border border-light shadow-sm"
                      }`}
                      style={{ 
                         transform: isActive ? "scale(1.01)" : "scale(1)",
                         opacity: unlocked ? 1 : 0.6 
                      }}
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
                          style={{ width: '36px', height: '36px' }}
                        >
                          {isDone ? (
                            <i className="bi bi-check" style={{ fontSize: '1.2rem' }} />
                          ) : unlocked ? (
                            <i className={m.type === 'video' ? "bi bi-play-fill" : "bi bi-file-earmark-text"} style={{ fontSize: '1rem' }} />
                          ) : (
                            <i className="bi bi-lock-fill" style={{ fontSize: '0.9rem' }} />
                          )}
                        </div>
                        <div className="text-truncate">
                          <div className={`fw-semibold text-truncate ${isActive ? "text-primary" : "text-dark"}`} style={{ fontSize: '0.95rem' }}>
                            {m.title}
                          </div>
                          <div className="text-muted d-flex align-items-center gap-2 mt-1" style={{ fontSize: '0.75rem', fontWeight: 500 }}>
                            <span className="text-uppercase tracking-wider">{m.type}</span>
                            {m.duration ? <span>• {m.duration} min</span> : null}
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
      </Card.Body>
    </Card>
  );

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
              if (resumeTime > 0) {
                e.currentTarget.currentTime = resumeTime;
              }
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
          style={{ maxWidth: 980, borderRadius: '12px' }}
        />
      );
    }

    if (isVideo && lesson.externalUrl) {
      return (
        <div className="ratio ratio-16x9 shadow-sm" style={{ maxWidth: 980, borderRadius: '12px', overflow: 'hidden' }}>
          <iframe
            src={lesson.externalUrl}
            title={lesson.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }

    if (lesson.externalUrl) {
      return (
        <a href={lesson.externalUrl} target="_blank" rel="noreferrer" className="btn btn-primary px-4 py-2 rounded-pill fw-semibold">
          <i className="bi bi-box-arrow-up-right me-2"/>
          Open Resource in New Tab
        </a>
      );
    }

    if (fileUrl) {
      return (
        <div className="ratio ratio-16x9 shadow-sm" style={{ maxWidth: 980, borderRadius: '12px', overflow: 'hidden' }}>
          <iframe src={fileUrl} title={lesson.title} />
        </div>
      );
    }

    return (
      <div className="text-center py-5">
        <i className="bi bi-file-earmark-x text-muted mb-3" style={{ fontSize: '3rem' }}/>
        <h5 className="text-muted">No resource material provided</h5>
      </div>
    );
  };

  return (
    <div className="container-fluid py-4 py-lg-5 bg-light min-vh-100">
      
      {/* Header Section */}
      <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-4 mb-4">
        <div className="d-flex align-items-center gap-3">
          <div className="bg-primary bg-opacity-10 rounded-4 d-flex align-items-center justify-content-center text-primary" style={{ width: '56px', height: '56px' }}>
            <i className="bi bi-mortarboard-fill fs-3" />
          </div>
          <div>
            <h2 className="mb-0 fw-bolder tracking-tight">Learning Workspace</h2>
            <div className="text-secondary small fw-medium mt-1">
              Master your curriculum step-by-step.
            </div>
          </div>
        </div>

        <div className="d-flex flex-column flex-sm-row gap-3 align-items-sm-center">
          <InputGroup className="shadow-sm rounded-pill overflow-hidden bg-white" style={{ minWidth: '280px' }}>
            <InputGroup.Text className="bg-white border-0 ps-4 text-primary">
              <i className="bi bi-journal-bookmark-fill" />
            </InputGroup.Text>
            <Form.Select
              className="bg-white border-0 shadow-none py-2 fw-medium text-dark"
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
            <Button
              variant="white"
              className="d-flex align-items-center gap-2 shadow-sm rounded-pill fw-semibold px-4 border"
              onClick={() => {
                setMessage({ type: "", text: "" });
                fetchCourses();
                if (selectedCourseId) {
                  fetchContent(selectedCourseId);
                  fetchProgress(selectedCourseId);
                }
              }}
            >
              <i className="bi bi-arrow-clockwise text-primary" />
              Refresh
            </Button>

            <Button
              variant="primary"
              className="d-flex align-items-center gap-2 shadow-sm rounded-pill fw-semibold px-4 d-lg-none"
              onClick={() => setIsSidebarOpen(true)}
            >
              <i className="bi bi-list-task" />
              Syllabus
            </Button>
          </div>
        </div>
      </div>

      {message.text && (
        <Alert variant={message.type} className="shadow-sm border-0 rounded-4 d-flex align-items-center justify-content-between p-3 mb-4">
          <div className="d-flex align-items-center gap-3">
            <i className={`fs-4 ${message.type === "danger" ? "bi-exclamation-octagon-fill text-danger" : "bi-info-circle-fill text-info"}`} />
            <div className="fw-medium">{message.text}</div>
          </div>
          <Button size="sm" variant="close" onClick={() => setMessage({ type: "", text: "" })} />
        </Alert>
      )}

      {loading && (
        <div className="text-center my-5 py-5">
          <Spinner animation="grow" variant="primary" />
          <div className="text-muted mt-3 fw-medium">Syncing course materials...</div>
        </div>
      )}

      {/* Main Progress Banner */}
      {selectedCourseId && !loading && (
        <Card className="shadow-sm border-0 rounded-4 mb-4 overflow-hidden">
          <div className="bg-primary text-white p-4">
            <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-4">
              <div>
                <div className="fw-bold d-flex align-items-center gap-2 text-white-50 text-uppercase tracking-wider small mb-2">
                  <i className="bi bi-graph-up-arrow" />
                  Course Progress
                </div>
                <h3 className="mb-0 fw-bolder">
                  {progressMeta.pctSafe}% <span className="fs-5 fw-medium text-white-50">Completed</span>
                </h3>
              </div>

              <div className="d-flex flex-wrap gap-3">
                <div className="bg-white bg-opacity-10 rounded-pill px-4 py-2 d-flex align-items-center gap-2 border border-white border-opacity-25">
                  <i className="bi bi-check-all fs-5" />
                  <span className="fw-semibold">{completedCount} / {totalLessons} Lessons</span>
                </div>
                {selectedCourse?.classAssigned && (
                  <div className="bg-white bg-opacity-10 rounded-pill px-4 py-2 d-flex align-items-center gap-2 border border-white border-opacity-25">
                    <i className="bi bi-mortarboard fs-5" />
                    <span className="fw-semibold">Class {selectedCourse.classAssigned}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <ProgressBar
            now={progressMeta.pctSafe}
            variant="success"
            className="rounded-0 border-0"
            style={{ height: 8, backgroundColor: "rgba(0,0,0,0.05)" }}
          />
        </Card>
      )}

      {selectedCourseId && content.length === 0 && !loading && (
        <div className="text-center py-5 bg-white rounded-4 shadow-sm border-0 mt-4">
          <i className="bi bi-inbox text-muted mb-3" style={{ fontSize: '3rem' }} />
          <h5 className="text-muted">The instructor hasn't uploaded any chapters yet.</h5>
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
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

      {selectedCourseId && content.length > 0 && !loading && (
        <Row className="g-4">
          {/* LEFT: Outline (Desktop) */}
          <Col xs={12} lg={4} xxl={3} className="d-none d-lg-block">
            {renderOutlinePanel()}
          </Col>

          {/* RIGHT: Player + Details */}
          <Col xs={12} lg={8} xxl={9}>
            
            {/* Player Card */}
            <Card className="shadow-sm border-0 rounded-4 mb-4 overflow-hidden">
              <Card.Body className="p-0">
                {selectedLesson ? (
                  <>
                    {/* Video Area */}
                    <div className="bg-dark p-3 p-md-4 p-lg-5 d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                      {renderMaterialContent(selectedLesson)}
                    </div>

                    {/* Lesson Header Info */}
                    <div className="p-4 p-xl-5 bg-white">
                      <div className="d-flex flex-column flex-xl-row align-items-xl-start justify-content-between gap-4">
                        
                        <div className="flex-grow-1">
                          <div className="d-flex align-items-center gap-2 text-primary fw-semibold small text-uppercase tracking-wider mb-2">
                            <i className="bi bi-bookmark-star-fill" />
                            {selectedLesson.chapterTitle}
                          </div>
                          <h3 className="fw-bolder text-dark mb-3">{selectedLesson.title}</h3>

                          <div className="d-flex flex-wrap gap-2 align-items-center">
                            <Badge bg="light" text="dark" className="border px-3 py-2 rounded-pill fw-medium">
                              <i className={`me-2 ${selectedLesson.type === 'video' ? 'bi-play-circle-fill text-danger' : 'bi-file-earmark-text-fill text-primary'}`} />
                              {selectedLesson.type.charAt(0).toUpperCase() + selectedLesson.type.slice(1)}
                            </Badge>
                            
                            {selectedLesson.duration ? (
                              <Badge bg="light" text="dark" className="border px-3 py-2 rounded-pill fw-medium">
                                <i className="bi bi-clock-fill text-warning me-2" />
                                {selectedLesson.duration} min read/watch
                              </Badge>
                            ) : null}

                            {completedSet.has(selectedLesson.id) ? (
                              <Badge bg="success" className="bg-opacity-10 text-success border border-success border-opacity-25 px-3 py-2 rounded-pill fw-semibold">
                                <i className="bi bi-check-circle-fill me-2" />
                                Completed
                              </Badge>
                            ) : (
                              <Badge bg="primary" className="bg-opacity-10 text-primary border border-primary border-opacity-25 px-3 py-2 rounded-pill fw-semibold">
                                <i className="bi bi-activity me-2" />
                                Progress: {selectedVideoProgress}%
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Prev / Next Controls */}
                        <div className="d-flex flex-wrap flex-xl-nowrap gap-2 shrink-0">
                          <Button
                            variant="light"
                            className="rounded-pill px-4 fw-semibold border shadow-sm"
                            disabled={!previousLesson}
                            onClick={() => previousLesson && setSelectedLessonId(previousLesson.id)}
                          >
                            <i className="bi bi-arrow-left me-2" /> Previous
                          </Button>
                          <Button
                            variant="primary"
                            className="rounded-pill px-4 fw-semibold shadow-sm"
                            disabled={!nextLesson || !isLessonUnlocked(currentLessonIndex + 1)}
                            onClick={() => nextLesson && setSelectedLessonId(nextLesson.id)}
                          >
                            Next <i className="bi bi-arrow-right ms-2" />
                          </Button>
                        </div>
                      </div>

                      <hr className="my-4 opacity-10" />

                      {/* Manual Complete Action */}
                      <div className="d-flex align-items-center justify-content-between bg-light rounded-4 p-3 border">
                        <div className="fw-medium text-dark d-flex align-items-center gap-2">
                          <i className="bi bi-info-circle text-primary" />
                          Finished learning this topic?
                        </div>
                        {completedSet.has(selectedLesson.id) ? (
                          <div className="text-success fw-bold d-flex align-items-center gap-2 bg-success bg-opacity-10 px-4 py-2 rounded-pill">
                            <i className="bi bi-check2-all fs-5" />
                            Marked as Done
                          </div>
                        ) : (
                          <Button variant="success" className="rounded-pill px-4 fw-semibold shadow-sm d-flex align-items-center gap-2" onClick={() => handleComplete(selectedLesson.id)}>
                            <i className="bi bi-check-circle" /> Mark Complete
                          </Button>
                        )}
                      </div>

                    </div>
                  </>
                ) : (
                  <div className="text-muted text-center py-5 my-5">
                    <i className="bi bi-play-btn text-light mb-3" style={{ fontSize: '4rem' }} />
                    <h4 className="fw-semibold text-secondary">Select a lesson from the syllabus to begin learning.</h4>
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* Bottom Row Information Cards */}
            <Row className="g-4">
              <Col xs={12} lg={6}>
                <Card className="shadow-sm border-0 rounded-4 h-100">
                  <Card.Body className="p-4">
                    <div className="fw-bolder mb-3 text-dark d-flex align-items-center gap-2 fs-5">
                      <i className="bi bi-fast-forward-btn-fill text-primary" />
                      Up Next
                    </div>
                    {nextLesson ? (
                      <div className="bg-light p-3 rounded-4 border">
                        <div className="fw-bold text-dark">{nextLesson.title}</div>
                        <div className="text-muted small mt-1 mb-3 d-flex align-items-center gap-2">
                          <i className="bi bi-journal" />
                          {nextLesson.chapterTitle}
                        </div>
                        <Button
                          variant="outline-primary"
                          className="w-100 rounded-pill fw-semibold"
                          disabled={!isLessonUnlocked(currentLessonIndex + 1)}
                          onClick={() => setSelectedLessonId(nextLesson.id)}
                        >
                          {isLessonUnlocked(currentLessonIndex + 1) ? "Start Lesson Now" : (
                            <><i className="bi bi-lock-fill me-2" /> Complete current to unlock</>
                          )}
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-success fw-semibold bg-success bg-opacity-10 rounded-4">
                        <i className="bi bi-trophy-fill fs-3 d-block mb-2" />
                        You're on the final lesson!
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>

              <Col xs={12} lg={6}>
                <Card className="shadow-sm border-0 rounded-4 h-100">
                  <Card.Body className="p-4">
                    <div className="fw-bolder mb-3 text-dark d-flex align-items-center gap-2 fs-5">
                      <i className="bi bi-check2-square text-success" />
                      Milestones
                    </div>
                    <div className="pe-2" style={{ maxHeight: 150, overflowY: "auto" }}>
                      {lessons.length === 0 ? (
                        <div className="text-muted small">Your syllabus is empty.</div>
                      ) : (
                        lessons.map((lesson, idx) => (
                          <div key={lesson.id} className="d-flex align-items-center gap-3 mb-3">
                            <div className="flex-shrink-0">
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
                            <div className={`small fw-medium ${completedSet.has(lesson.id) ? "text-dark text-decoration-line-through opacity-75" : "text-dark"}`}>
                              {lesson.title}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

          </Col>
        </Row>
      )}
    </div>
  );
}