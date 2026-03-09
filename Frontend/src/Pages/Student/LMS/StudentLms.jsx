import React, { useEffect, useMemo, useState } from "react";
import api from "../../../api/api";
import { Alert, Button, Card, ProgressBar, Spinner } from "react-bootstrap";

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

  const isLessonUnlocked = (lessonIndex) => {
    if (lessonIndex === 0) return true;
    const prev = lessons[lessonIndex - 1];
    return prev ? completedSet.has(prev.id) : true;
  };

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
          onEnded={() => {
            updateProgress(lesson.id, 100, Math.round(e.currentTarget.duration || 0));
            handleAutoComplete(lesson.id);
          }}
          style={{ width: "100%", maxWidth: 900, borderRadius: 12 }}
        />
      );
    }

    if (isVideo && lesson.externalUrl) {
      return (
        <div className="ratio ratio-16x9" style={{ maxWidth: 900 }}>
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
        <div className="ratio ratio-16x9" style={{ maxWidth: 900 }}>
          <iframe src={fileUrl} title={lesson.title} />
        </div>
      );
    }

    return <span className="text-muted">No resource</span>;
  };

  return (
    <div className="container-fluid py-3">
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-3">
        <div>
          <h3 className="fw-semibold mb-1">Learning Hub</h3>
          <div className="text-muted">Learn step by step with your course plan.</div>
        </div>
        <div style={{ maxWidth: 360 }}>
          <select
            className="form-select"
            value={selectedCourseId}
            onChange={(e) => {
              setSelectedCourseId(e.target.value);
              setSelectedLessonId("");
            }}
          >
            <option value="">Choose course</option>
            {courses.map((course) => (
              <option key={course._id} value={course._id}>
                {course.title} (Class {course.classAssigned})
              </option>
            ))}
          </select>
        </div>
      </div>

      {message.text && <Alert variant={message.type}>{message.text}</Alert>}

      {loading && (
        <div className="text-center my-3">
          <Spinner animation="border" />
        </div>
      )}

      {selectedCourseId && (
        <Card className="p-3 shadow-sm border-0 mb-3">
          <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2">
            <div className="fw-semibold">Course Progress</div>
            <div className="text-muted">
              {displayCompletionPct}% completed
              {progress.totalTopics
                ? ` | ${progress.completedTopicsCount}/${progress.totalTopics} topics`
                : ` | ${completedCount}/${totalLessons} lessons`}
              {progress.totalNotes
                ? ` | Notes: ${progress.completedNotesCount}/${progress.totalNotes}`
                : ""}
            </div>
          </div>
          <div className="mt-2">
            <ProgressBar now={displayCompletionPct} label={`${displayCompletionPct}%`} />
          </div>
        </Card>
      )}

      {selectedCourseId && content.length === 0 && (
        <Alert variant="info">No chapters available yet.</Alert>
      )}

      {selectedCourseId && content.length > 0 && (
        <div className="row g-3">
          <div className="col-12 col-lg-4">
            <Card className="shadow-sm border-0 h-100">
              <Card.Header className="fw-semibold">Course Outline</Card.Header>
              <Card.Body style={{ maxHeight: "70vh", overflowY: "auto" }}>
                {content.map((chapter, chapterIndex) => (
                  <div key={chapter._id} className="mb-3">
                    <div className="fw-semibold text-primary mb-2">
                      {chapterIndex + 1}. {chapter.title}
                    </div>
                    {(chapter.topics || []).length > 0 && (
                      <div className="d-flex flex-wrap gap-2 mb-2">
                        {chapter.topics.map((topic, idx) => (
                          <button
                            key={idx}
                            type="button"
                            className="badge bg-light text-dark border"
                            onClick={() => handleSelectTopic(topic)}
                          >
                            {topic}
                          </button>
                        ))}
                      </div>
                    )}
                    {(chapter.materials || []).map((material) => {
                      const lessonIndex = lessons.findIndex((lesson) => lesson.id === material._id);
                      const unlocked = isLessonUnlocked(lessonIndex);
                      const isActive = selectedLessonId === material._id;
                      return (
                        <button
                          key={material._id}
                          type="button"
                          className={`w-100 text-start btn btn-sm mb-2 ${
                            isActive ? "btn-primary" : "btn-outline-secondary"
                          }`}
                          disabled={!unlocked}
                          onClick={() => handleSelectLesson(material)}
                        >
                          <div className="d-flex align-items-center justify-content-between">
                            <div>
                              <div className="fw-semibold">{material.title}</div>
                              <div className="small text-muted">
                                {material.type}{material.duration ? ` | ${material.duration} min` : ""}
                              </div>
                            </div>
                            <div>
                              {completedSet.has(material._id) ? (
                                <i className="bi bi-check-circle-fill text-success" />
                              ) : unlocked ? (
                                <i className="bi bi-play-circle" />
                              ) : (
                                <i className="bi bi-lock-fill text-muted" />
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </Card.Body>
            </Card>
          </div>

          <div className="col-12 col-lg-8">
            <Card className="shadow-sm border-0 mb-3">
              <Card.Body>
                {selectedLesson ? (
                  <>
                    <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2 mb-3">
                      <div>
                        <div className="text-muted small">{selectedLesson.chapterTitle}</div>
                        <h4 className="fw-semibold mb-1">{selectedLesson.title}</h4>
                        <div className="text-muted">
                          {selectedLesson.type}{selectedLesson.duration ? ` | ${selectedLesson.duration} min` : ""}
                        </div>
                        <div className="small text-muted">
                          Video progress: {videoProgress[selectedLesson.id] || (completedSet.has(selectedLesson.id) ? 100 : 0)}%
                        </div>
                      </div>
                      <div className="d-flex gap-2">
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

                    <div className="mb-3">{renderMaterialContent(selectedLesson)}</div>

                    {selectedLesson.topics?.length > 0 && (
                      <Card className="border-0 bg-light mb-3">
                        <Card.Body>
                          <div className="fw-semibold mb-2">Topics in this chapter</div>
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

                    <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2 mb-3">
                      {completedSet.has(selectedLesson.id) ? (
                        <span className="badge bg-success">Completed</span>
                      ) : (
                        <Button size="sm" onClick={() => handleComplete(selectedLesson.id)}>
                          Mark Complete
                        </Button>
                      )}
                      {nextLesson && !isLessonUnlocked(currentLessonIndex + 1) && (
                        <div className="text-muted small">Complete this lesson to unlock the next.</div>
                      )}
                    </div>

                    <Card className="border-0 bg-light">
                      <Card.Body>
                        <div className="fw-semibold mb-2">Lesson Notes</div>
                        <div className="text-muted small mb-2">
                          Use this section to summarize key concepts from this lesson.
                        </div>
                        <ul className="small mb-0">
                          <li>Focus topic: {selectedLesson.title}</li>
                          <li>Chapter: {selectedLesson.chapterTitle}</li>
                          <li>Format: {selectedLesson.type}</li>
                        </ul>
                      </Card.Body>
                    </Card>
                  </>
                ) : (
                  <div className="text-muted">Select a lesson to start learning.</div>
                )}
              </Card.Body>
            </Card>

            <div className="row g-3">
              <div className="col-12 col-lg-6">
                <Card className="shadow-sm border-0 h-100">
                  <Card.Body>
                    <div className="fw-semibold mb-2">Up Next</div>
                    {nextLesson ? (
                      <>
                        <div className="fw-semibold">{nextLesson.title}</div>
                        <div className="text-muted small mb-3">
                          {nextLesson.chapterTitle}{nextLesson.duration ? ` | ${nextLesson.duration} min` : ""}
                        </div>
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={!isLessonUnlocked(currentLessonIndex + 1)}
                          onClick={() => setSelectedLessonId(nextLesson.id)}
                        >
                          Start Next Lesson
                        </Button>
                      </>
                    ) : (
                      <div className="text-muted small">You are on the last lesson.</div>
                    )}
                  </Card.Body>
                </Card>
              </div>
              <div className="col-12 col-lg-6">
                <Card className="shadow-sm border-0 h-100">
                  <Card.Body>
                    <div className="fw-semibold mb-2">Progress Checklist</div>
                    <div className="text-muted small mb-2">Track your completed lessons.</div>
                    <div style={{ maxHeight: 180, overflowY: "auto" }}>
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
                                  ? "bi-circle"
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
              </div>
            </div>


            <Card className="shadow-sm border-0 mt-3">
              <Card.Body>
                <div className="fw-semibold mb-2">About this course</div>
                <div className="text-muted">
                  {selectedCourse
                    ? `${selectedCourse.title} is designed for Class ${selectedCourse.classAssigned} students.`
                    : "Select a course to see details."}
                </div>
              </Card.Body>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
