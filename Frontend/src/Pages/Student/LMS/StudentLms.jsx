import React, { useEffect, useMemo, useState } from "react";
import api from "../../../api/api";
import { Alert, Badge, Button, Card, Col, Form, InputGroup, ListGroup, ProgressBar, Row, Spinner,} from "react-bootstrap";

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
  const [lastProgressSentAt, setLastProgressSentAt] = useState({});

  // UI-only state (no data/logic change)
  const [outlineQuery, setOutlineQuery] = useState("");
  const [collapsedChapters, setCollapsedChapters] = useState({}); // { [chapterId]: boolean }

  const showMessage = (type, text) => setMessage({ type, text });

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/lms/student/courses");
      setCourses(res.data || []);
    } catch (err) {
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
    } catch (err) {
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
    } catch (err) {
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

  const completedSet = useMemo(
    () => new Set(progress.completedMaterialIds || []),
    [progress.completedMaterialIds]
  );

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
    } catch (err) {
      showMessage("danger", "Failed to update progress");
    }
  };

  const handleAutoComplete = async (materialId) => {
    if (completedSet.has(materialId)) return;
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

  const handleSelectTopic = (topic) => {
    const topicLessons = lessons.filter((lesson) => (lesson.topics || []).includes(topic));
    if (topicLessons.length === 0) return;

    const unlockedLesson = topicLessons.find((lesson) => {
      const idx = lessons.findIndex((l) => l.id === lesson.id);
      return isLessonUnlocked(idx);
    });

    if (!unlockedLesson) {
      showMessage("warning", "Complete previous lessons to unlock this topic.");
      return;
    }
    setSelectedLessonId(unlockedLesson.id);
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
    progress.completedTopicsCount,
    progress.totalTopics,
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
        const topics = (ch.topics || []).filter((t) => String(t || "").toLowerCase().includes(q));
        const mats = (ch.materials || []).filter((m) => String(m.title || "").toLowerCase().includes(q));
        if (chapterMatch) return ch;
        return { ...ch, topics, materials: mats };
      })
      .filter((ch) => {
        const chapterMatch = String(ch.title || "").toLowerCase().includes(q);
        return (
          chapterMatch ||
          (ch.topics || []).length > 0 ||
          (ch.materials || []).length > 0
        );
      });
  }, [content, outlineQuery]);

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
          onTimeUpdate={(e) => {
            const current = e.currentTarget.currentTime || 0;
            const duration = e.currentTarget.duration || 0;
            if (!duration) return;
            const pct = Math.min(100, Math.round((current / duration) * 100));
            setVideoProgress((prev) => ({ ...prev, [lesson.id]: pct }));

            if (pct >= 70 && !completedSet.has(lesson.id)) {
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
            updateProgress(lesson.id, 100, Math.round(e.currentTarget.duration || 0));
            handleAutoComplete(lesson.id);
          }}
          style={{ width: "100%", maxWidth: 980, borderRadius: 14 }}
        />
      );
    }

    if (isVideo && lesson.externalUrl) {
      return (
        <div className="ratio ratio-16x9" style={{ maxWidth: 980 }}>
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
        <a href={lesson.externalUrl} target="_blank" rel="noreferrer">
          Open resource
        </a>
      );
    }

    if (fileUrl) {
      return (
        <div className="ratio ratio-16x9" style={{ maxWidth: 980 }}>
          <iframe src={fileUrl} title={lesson.title} />
        </div>
      );
    }

    return <span className="text-muted">No resource</span>;
  };

  return (
    <div className="container-fluid py-3 py-lg-4">
      {/* Header */}
      <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3 mb-3">
        <div>
          <div className="d-flex align-items-center gap-2">
            <span className="badge text-bg-primary rounded-pill px-3 py-2">
              <i className="bi bi-lightning-charge-fill me-2" />
              Learning Hub
            </span>
            <h3 className="mb-0 fw-bold">Student LMS</h3>
          </div>
          <div className="text-muted small mt-1">
            Learn step-by-step with your course plan. Complete lessons to unlock the next.
          </div>
        </div>

        <div className="d-flex flex-column flex-md-row gap-2 align-items-md-center" style={{ minWidth: 320 }}>
          <InputGroup style={{ maxWidth: 360 }}>
            <InputGroup.Text>
              <i className="bi bi-journal-bookmark" />
            </InputGroup.Text>
            <Form.Select
              value={selectedCourseId}
              onChange={(e) => {
                setSelectedCourseId(e.target.value);
                setSelectedLessonId("");
                setMessage({ type: "", text: "" });
              }}
            >
              <option value="">Choose course</option>
              {courses.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.title} (Class {course.classAssigned})
                </option>
              ))}
            </Form.Select>
          </InputGroup>

          <Button
            variant="outline-secondary"
            className="d-flex align-items-center gap-2"
            onClick={() => {
              setMessage({ type: "", text: "" });
              fetchCourses();
              if (selectedCourseId) {
                fetchContent(selectedCourseId);
                fetchProgress(selectedCourseId);
              }
            }}
          >
            <i className="bi bi-arrow-clockwise" />
            Refresh
          </Button>
        </div>
      </div>

      {message.text && (
        <Alert variant={message.type} className="shadow-sm border-0">
          <div className="d-flex align-items-start justify-content-between gap-3">
            <div className="d-flex gap-2">
              <i className={`bi ${message.type === "danger" ? "bi-exclamation-triangle-fill" : "bi-info-circle-fill"} mt-1`} />
              <div>{message.text}</div>
            </div>
            <Button size="sm" variant="outline-secondary" onClick={() => setMessage({ type: "", text: "" })}>
              Dismiss
            </Button>
          </div>
        </Alert>
      )}

      {loading && (
        <div className="text-center my-3">
          <Spinner animation="border" />
        </div>
      )}

      {/* Progress banner */}
      {selectedCourseId && (
        <Card className="shadow-sm border-0 mb-3">
          <Card.Body>
            <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
              <div>
                <div className="fw-bold d-flex align-items-center gap-2">
                  <i className="bi bi-graph-up-arrow text-primary" />
                  Course Progress
                </div>
                <div className="text-muted small mt-1">
                  <span className="fw-semibold">{progressMeta.pctSafe}%</span> completed{" "}
                  <span className="text-muted">•</span>{" "}
                  {progress.totalTopics ? progressMeta.topicsText : progressMeta.lessonsText}
                  {progressMeta.notesText ? ` • ${progressMeta.notesText}` : ""}
                </div>
              </div>

              <div className="d-flex flex-wrap gap-2">
                <span className="badge text-bg-light border">
                  <i className="bi bi-check2-circle me-1 text-success" />
                  Completed: {completedCount}
                </span>
                <span className="badge text-bg-light border">
                  <i className="bi bi-collection-play me-1 text-primary" />
                  Total: {totalLessons}
                </span>
                {selectedCourse?.classAssigned ? (
                  <span className="badge text-bg-light border">
                    <i className="bi bi-mortarboard me-1" />
                    Class {selectedCourse.classAssigned}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="mt-3">
              <ProgressBar
                now={progressMeta.pctSafe}
                label={`${progressMeta.pctSafe}%`}
                style={{ height: 16, borderRadius: 999 }}
              />
            </div>
          </Card.Body>
        </Card>
      )}

      {selectedCourseId && content.length === 0 && (
        <Alert variant="info" className="shadow-sm border-0">
          No chapters available yet.
        </Alert>
      )}

      {selectedCourseId && content.length > 0 && (
        <Row className="g-3">
          {/* LEFT: Outline */}
          <Col xs={12} lg={4} xxl={3}>
            <Card className="shadow-sm border-0 h-100">
              <Card.Header className="bg-white border-0 pb-0">
                <div className="fw-bold d-flex align-items-center gap-2">
                  <i className="bi bi-list-nested text-secondary" />
                  Course Outline
                </div>
                <div className="text-muted small">Search topics/lessons and continue where you left.</div>
              </Card.Header>

              <Card.Body className="pt-3" style={{ maxHeight: "75vh", overflowY: "auto" }}>
                <InputGroup className="mb-3">
                  <InputGroup.Text>
                    <i className="bi bi-search" />
                  </InputGroup.Text>
                  <Form.Control
                    value={outlineQuery}
                    onChange={(e) => setOutlineQuery(e.target.value)}
                    placeholder="Search chapter, topic, lesson..."
                  />
                </InputGroup>

                {filteredContent.map((chapter, chapterIndex) => {
                  const isCollapsed = !!collapsedChapters[chapter._id];
                  const chapterLessons = (chapter.materials || []).map((m) => {
                    const lessonIndex = lessons.findIndex((lesson) => lesson.id === m._id);
                    const unlocked = isLessonUnlocked(lessonIndex);
                    const isActive = selectedLessonId === m._id;
                    const isDone = completedSet.has(m._id);
                    return { m, lessonIndex, unlocked, isActive, isDone };
                  });

                  // UI-only counts
                  const totalInChapter = chapterLessons.length;
                  const completedInChapter = chapterLessons.filter((x) => x.isDone).length;

                  return (
                    <div key={chapter._id} className="mb-3">
                      <button
                        type="button"
                        className="btn w-100 text-start p-0"
                        onClick={() =>
                          setCollapsedChapters((prev) => ({ ...prev, [chapter._id]: !prev[chapter._id] }))
                        }
                      >
                        <div className="d-flex align-items-start justify-content-between">
                          <div>
                            <div className="fw-bold">
                              {chapterIndex + 1}. {chapter.title}
                            </div>
                            <div className="text-muted small">
                              {completedInChapter}/{totalInChapter} lessons completed
                            </div>
                          </div>
                          <div className="text-muted">
                            <i className={`bi ${isCollapsed ? "bi-chevron-down" : "bi-chevron-up"}`} />
                          </div>
                        </div>
                      </button>

                      {!isCollapsed && (
                        <>
                          {(chapter.topics || []).length > 0 && (
                            <div className="d-flex flex-wrap gap-2 mt-2">
                              {chapter.topics.map((topic, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  className="badge bg-light text-dark border"
                                  onClick={() => handleSelectTopic(topic)}
                                >
                                  <i className="bi bi-tag me-1 text-muted" />
                                  {topic}
                                </button>
                              ))}
                            </div>
                          )}

                          <ListGroup className="mt-2" variant="flush">
                            {(chapterLessons || []).map(({ m, lessonIndex, unlocked, isActive, isDone }) => (
                              <ListGroup.Item
                                key={m._id}
                                className={`py-2 px-0 border-0 ${isActive ? "bg-light rounded-3 px-2" : ""}`}
                              >
                                <button
                                  type="button"
                                  className={`btn w-100 text-start d-flex align-items-start justify-content-between gap-2 ${
                                    isActive ? "btn-light" : "btn-outline-light"
                                  }`}
                                  style={{
                                    border: "1px solid rgba(0,0,0,.08)",
                                    borderRadius: 12,
                                    background: isActive ? "rgba(13,110,253,.08)" : "white",
                                  }}
                                  disabled={!unlocked}
                                  onClick={() => handleSelectLesson(m)}
                                >
                                  <div className="me-2">
                                    <div className="fw-semibold">{m.title}</div>
                                    <div className="small text-muted">
                                      {m.type}
                                      {m.duration ? ` • ${m.duration} min` : ""}
                                      {!unlocked ? " • Locked" : ""}
                                    </div>
                                  </div>

                                  <div className="d-flex align-items-center gap-2">
                                    {isDone ? (
                                      <i className="bi bi-check-circle-fill text-success fs-5" />
                                    ) : unlocked ? (
                                      <i className="bi bi-play-circle text-primary fs-5" />
                                    ) : (
                                      <i className="bi bi-lock-fill text-muted fs-5" />
                                    )}
                                  </div>
                                </button>
                              </ListGroup.Item>
                            ))}
                          </ListGroup>
                        </>
                      )}
                    </div>
                  );
                })}
              </Card.Body>
            </Card>
          </Col>

          {/* RIGHT: Player + details */}
          <Col xs={12} lg={8} xxl={9}>
            <Card className="shadow-sm border-0 mb-3">
              <Card.Body>
                {selectedLesson ? (
                  <>
                    {/* Lesson header */}
                    <div className="d-flex flex-column flex-xl-row align-items-xl-center justify-content-between gap-3 mb-3">
                      <div>
                        <div className="text-muted small">
                          <i className="bi bi-folder2-open me-1" />
                          {selectedLesson.chapterTitle}
                        </div>
                        <h4 className="fw-bold mb-1">{selectedLesson.title}</h4>

                        <div className="d-flex flex-wrap gap-2 align-items-center">
                          <Badge bg={selectedLesson.type === "video" ? "primary" : "info"} className="text-uppercase">
                            {selectedLesson.type}
                          </Badge>
                          {selectedLesson.duration ? (
                            <Badge bg="light" text="dark" className="border">
                              <i className="bi bi-clock me-1" />
                              {selectedLesson.duration} min
                            </Badge>
                          ) : null}
                          <Badge bg="light" text="dark" className="border">
                            <i className="bi bi-activity me-1 text-muted" />
                            Video progress:{" "}
                            {videoProgress[selectedLesson.id] ||
                              (completedSet.has(selectedLesson.id) ? 100 : 0)}
                            %
                          </Badge>
                          {completedSet.has(selectedLesson.id) ? (
                            <Badge bg="success">
                              <i className="bi bi-check2-circle me-1" />
                              Completed
                            </Badge>
                          ) : (
                            <Badge bg="warning" text="dark">
                              <i className="bi bi-hourglass-split me-1" />
                              In progress
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Controls */}
                      <div className="d-flex flex-wrap gap-2 justify-content-xl-end">
                        <Button
                          variant="outline-secondary"
                          disabled={!previousLesson}
                          onClick={() => previousLesson && setSelectedLessonId(previousLesson.id)}
                        >
                          <i className="bi bi-arrow-left me-1" /> Previous
                        </Button>
                        <Button
                          variant="primary"
                          disabled={!nextLesson || !isLessonUnlocked(currentLessonIndex + 1)}
                          onClick={() => nextLesson && setSelectedLessonId(nextLesson.id)}
                        >
                          Next <i className="bi bi-arrow-right ms-1" />
                        </Button>
                      </div>
                    </div>

                    {/* Player */}
                    <div
                      className="p-2 p-md-3 bg-light rounded-4 border"
                      style={{ borderColor: "rgba(0,0,0,.08)" }}
                    >
                      {renderMaterialContent(selectedLesson)}
                    </div>

                    {/* Quick actions */}
                    <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2 mt-3">
                      {completedSet.has(selectedLesson.id) ? (
                        <div className="text-success fw-semibold d-flex align-items-center gap-2">
                          <i className="bi bi-check-circle-fill" />
                          Completed
                        </div>
                      ) : (
                        <Button size="sm" onClick={() => handleComplete(selectedLesson.id)}>
                          <i className="bi bi-check2 me-1" />
                          Mark Complete
                        </Button>
                      )}

                      {nextLesson && !isLessonUnlocked(currentLessonIndex + 1) && (
                        <div className="text-muted small">
                          Complete this lesson to unlock the next.
                        </div>
                      )}
                    </div>

                    {/* Topics */}
                    {selectedLesson.topics?.length > 0 && (
                      <Card className="border-0 bg-light mt-3">
                        <Card.Body>
                          <div className="fw-bold mb-2">
                            <i className="bi bi-tags me-2 text-muted" />
                            Topics in this chapter
                          </div>
                          <div className="d-flex flex-wrap gap-2">
                            {selectedLesson.topics.map((topic, idx) => (
                              <button
                                key={idx}
                                type="button"
                                className="badge bg-white text-dark border"
                                onClick={() => handleSelectTopic(topic)}
                              >
                                {topic}
                              </button>
                            ))}
                          </div>
                        </Card.Body>
                      </Card>
                    )}
                  </>
                ) : (
                  <div className="text-muted">Select a lesson to start learning.</div>
                )}
              </Card.Body>
            </Card>

            {/* Bottom cards: Up next + checklist + about */}
            <Row className="g-3">
              <Col xs={12} lg={6}>
                <Card className="shadow-sm border-0 h-100">
                  <Card.Body>
                    <div className="fw-bold mb-2 d-flex align-items-center gap-2">
                      <i className="bi bi-forward-fill text-primary" />
                      Up Next
                    </div>
                    {nextLesson ? (
                      <>
                        <div className="fw-semibold">{nextLesson.title}</div>
                        <div className="text-muted small mb-3">
                          {nextLesson.chapterTitle}
                          {nextLesson.duration ? ` • ${nextLesson.duration} min` : ""}
                        </div>
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={!isLessonUnlocked(currentLessonIndex + 1)}
                          onClick={() => setSelectedLessonId(nextLesson.id)}
                        >
                          Start Next Lesson
                        </Button>
                        {!isLessonUnlocked(currentLessonIndex + 1) && (
                          <div className="text-muted small mt-2">
                            <i className="bi bi-lock-fill me-1" />
                            Locked until you complete current lesson.
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-muted small">You are on the last lesson.</div>
                    )}
                  </Card.Body>
                </Card>
              </Col>

              <Col xs={12} lg={6}>
                <Card className="shadow-sm border-0 h-100">
                  <Card.Body>
                    <div className="fw-bold mb-2 d-flex align-items-center gap-2">
                      <i className="bi bi-check2-square text-success" />
                      Progress Checklist
                    </div>
                    <div className="text-muted small mb-2">Track your completed lessons.</div>

                    <div style={{ maxHeight: 200, overflowY: "auto" }}>
                      {lessons.length === 0 ? (
                        <div className="text-muted small">No lessons yet.</div>
                      ) : (
                        lessons.map((lesson, idx) => (
                          <div key={lesson.id} className="d-flex align-items-center gap-2 mb-1">
                            <i
                              className={`bi ${
                                completedSet.has(lesson.id)
                                  ? "bi-check-circle-fill text-success"
                                  : isLessonUnlocked(idx)
                                  ? "bi-circle text-muted"
                                  : "bi-lock-fill text-muted"
                              }`}
                            />
                            <div className="small text-muted">{lesson.title}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              <Col xs={12}>
                <Card className="shadow-sm border-0">
                  <Card.Body>
                    <div className="fw-bold mb-2 d-flex align-items-center gap-2">
                      <i className="bi bi-info-circle text-secondary" />
                      About this course
                    </div>
                    <div className="text-muted">
                      {selectedCourse
                        ? `${selectedCourse.title} is designed for Class ${selectedCourse.classAssigned} students.`
                        : "Select a course to see details."}
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