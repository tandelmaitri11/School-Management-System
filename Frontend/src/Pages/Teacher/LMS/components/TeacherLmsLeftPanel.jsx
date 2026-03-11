import React from "react";
import { Alert, Badge, Button, Card, Col, Form, InputGroup, Row } from "react-bootstrap";

const normalize = (v) => String(v || "").trim();

export default function TeacherLmsLeftPanel({
  courseErr,
  chapterErr,
  materialErr,
  courseForm,
  setCourseForm,
  chapterForm,
  setChapterForm,
  materialForm,
  setMaterialForm,
  setFile,
  classes,
  classHasStreams,
  streamOptions,
  sectionOptions,
  subjectsLoading,
  subjectsError,
  subjects,
  selectedCourseId,
  setSelectedCourseId,
  courses,
  chapterOptions,
  content,
  setErrors,
  handleCreateCourse,
  handleCreateChapter,
  handleCreateMaterial,
  MAX_TITLE,
  MAX_DESC,
}) {
  return (
    <div className="d-flex flex-column gap-4">
      {/* ---------------- CREATE COURSE CARD ---------------- */}
      <Card className="shadow-sm border-0 rounded-4 border-top border-4 border-primary overflow-hidden">
        <Card.Header className="bg-white border-bottom-0 pt-4 pb-0 px-4">
          <div className="d-flex align-items-center gap-3 mb-1">
            <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
              <i className="bi bi-mortarboard-fill fs-5" />
            </div>
            <div>
              <h5 className="fw-bold mb-0 text-dark">Create Course</h5>
              <div className="text-muted small">Assign course to class/section/stream and choose subject.</div>
            </div>
          </div>
        </Card.Header>

        <Card.Body className="p-4 pt-3">
          <Form noValidate onSubmit={handleCreateCourse}>
            <Form.Group className="mb-4">
              <Form.Label className="fw-semibold text-dark small mb-1">Course Title</Form.Label>
              <InputGroup hasValidation className="shadow-sm rounded-3 overflow-hidden">
                <InputGroup.Text className="bg-light border-end-0 text-muted">
                  <i className="bi bi-book" />
                </InputGroup.Text>
                <Form.Control
                  className="bg-light border-start-0 ps-0"
                  value={courseForm.title}
                  onChange={(e) => {
                    const v = e.target.value;
                    setCourseForm({ ...courseForm, title: v });
                    if (courseErr.title) {
                      const next = { ...courseErr };
                      delete next.title;
                      setErrors((p) => ({ ...p, course: next }));
                    }
                  }}
                  placeholder="e.g., Algebra Mastery"
                  isInvalid={!!courseErr.title}
                  required
                  maxLength={MAX_TITLE}
                />
                <Form.Control.Feedback type="invalid">{courseErr.title}</Form.Control.Feedback>
              </InputGroup>
              <div className="d-flex justify-content-between mt-1 px-1">
                <span className="small text-muted" style={{ fontSize: '0.75rem' }}>Max {MAX_TITLE} chars</span>
                <span className={`small ${normalize(courseForm.title).length >= MAX_TITLE ? 'text-danger' : 'text-muted'}`} style={{ fontSize: '0.75rem' }}>
                  {normalize(courseForm.title).length}/{MAX_TITLE}
                </span>
              </div>
            </Form.Group>

            <div className="bg-light p-3 rounded-4 mb-4 border border-secondary border-opacity-10">
              <Row className="g-3">
                <Col xs={12} md={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold text-dark small mb-1">Class</Form.Label>
                    <Form.Select
                      className="form-select-sm py-2 shadow-none"
                      value={courseForm.classId}
                      onChange={(e) => {
                        const classId = e.target.value;
                        const cls = classes.find((c) => String(c._id) === String(classId));
                        setCourseForm({
                          ...courseForm,
                          classId,
                          classAssigned: cls?.className || "",
                          stream: "",
                          section: "ALL",
                          subject: "",
                        });
                        setErrors((p) => ({ ...p, course: { ...p.course, classId: "", classAssigned: "", section: "", stream: "", subject: "" } }));
                      }}
                      isInvalid={!!courseErr.classId}
                      required
                    >
                      <option value="">Select class</option>
                      {classes.map((cls) => (
                        <option key={cls._id} value={cls._id}>
                          Class {cls.className}
                        </option>
                      ))}
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">{courseErr.classId}</Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col xs={12} md={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold text-dark small mb-1">Stream</Form.Label>
                    <Form.Select
                      className="form-select-sm py-2 shadow-none"
                      value={courseForm.stream}
                      disabled={!courseForm.classId || !classHasStreams || streamOptions.length === 0}
                      onChange={(e) => {
                        setCourseForm({ ...courseForm, stream: e.target.value, section: "ALL", subject: "" });
                        setErrors((p) => ({ ...p, course: { ...p.course, stream: "", section: "", subject: "" } }));
                      }}
                      isInvalid={!!courseErr.stream}
                      required={classHasStreams}
                    >
                      <option value="">
                        {!classHasStreams ? "N/A" : streamOptions.length ? "Select stream" : "No assigned stream"}
                      </option>
                      {streamOptions.map((stream) => (
                        <option key={stream} value={stream}>{stream}</option>
                      ))}
                    </Form.Select>
                    {courseErr.stream ? <div className="invalid-feedback d-block">{courseErr.stream}</div> : null}
                  </Form.Group>
                </Col>

                <Col xs={12} md={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold text-dark small mb-1">Section</Form.Label>
                    <Form.Select
                      className="form-select-sm py-2 shadow-none"
                      value={courseForm.section}
                      disabled={!courseForm.classId || (classHasStreams && !courseForm.stream)}
                      onChange={(e) => {
                        setCourseForm({ ...courseForm, section: e.target.value });
                        setErrors((p) => ({ ...p, course: { ...p.course, section: "" } }));
                      }}
                      isInvalid={!!courseErr.section}
                      required
                    >
                      <option value="">Select section</option>
                      {sectionOptions.map((sec) => (
                        <option key={sec} value={sec}>{sec}</option>
                      ))}
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">{courseErr.section}</Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col xs={12} md={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold text-dark small mb-1">Subject</Form.Label>
                    {subjectsLoading ? (
                      <div className="small text-muted py-2 d-flex align-items-center">
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span> Loading...
                      </div>
                    ) : (
                      <>
                        <Form.Select
                          className="form-select-sm py-2 shadow-none"
                          value={courseForm.subject}
                          onChange={(e) => {
                            setCourseForm({ ...courseForm, subject: e.target.value });
                            setErrors((p) => ({ ...p, course: { ...p.course, subject: "" } }));
                          }}
                          disabled={!courseForm.classAssigned || (classHasStreams && !courseForm.stream)}
                          isInvalid={!!courseErr.subject}
                          required
                        >
                          <option value="">{subjectsError || "Select subject"}</option>
                          {subjects.map((sub, idx) => (
                            <option key={idx} value={sub.subjectName}>{sub.subjectName}</option>
                          ))}
                        </Form.Select>
                        <Form.Control.Feedback type="invalid">{courseErr.subject}</Form.Control.Feedback>
                      </>
                    )}
                  </Form.Group>
                </Col>
              </Row>
            </div>

            <Form.Group className="mb-4">
              <Form.Label className="fw-semibold text-dark small mb-1">Description</Form.Label>
              <Form.Control
                as="textarea"
                className="bg-light shadow-none"
                rows={3}
                value={courseForm.description}
                onChange={(e) => {
                  setCourseForm({ ...courseForm, description: e.target.value });
                  if (courseErr.description) setErrors((p) => ({ ...p, course: { ...p.course, description: "" } }));
                }}
                placeholder="Optional: brief overview, outcomes, syllabus..."
                isInvalid={!!courseErr.description}
                maxLength={MAX_DESC}
              />
              <Form.Control.Feedback type="invalid">{courseErr.description}</Form.Control.Feedback>
              <div className="d-flex justify-content-between mt-1 px-1">
                <span className="small text-muted" style={{ fontSize: '0.75rem' }}>Max {MAX_DESC} chars</span>
                <span className={`small ${normalize(courseForm.description).length >= MAX_DESC ? 'text-danger' : 'text-muted'}`} style={{ fontSize: '0.75rem' }}>
                  {normalize(courseForm.description).length}/{MAX_DESC}
                </span>
              </div>
            </Form.Group>

            <div className="d-grid mt-4">
              <Button type="submit" variant="primary" className="fw-bold py-2 rounded-pill shadow-sm transition">
                <i className="bi bi-plus-lg me-2" />
                Create Course
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>

      {/* ---------------- CREATE CHAPTER CARD ---------------- */}
      <Card className="shadow-sm border-0 rounded-4 border-top border-4 border-success overflow-hidden">
        <Card.Header className="bg-white border-bottom-0 pt-4 pb-0 px-4">
          <div className="d-flex align-items-center gap-3 mb-1">
            <div className="bg-success bg-opacity-10 text-success rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
              <i className="bi bi-journal-plus fs-5" />
            </div>
            <div>
              <h5 className="fw-bold mb-0 text-dark">Create Chapter</h5>
              <div className="text-muted small">Add chapter & topics for the selected course.</div>
            </div>
          </div>
        </Card.Header>

        <Card.Body className="p-4 pt-3">
          <Form noValidate onSubmit={handleCreateChapter}>
            {chapterErr.courseId && (
              <Alert variant="warning" className="py-2 rounded-3 border-start border-4 border-warning mb-4">
                <i className="bi bi-exclamation-triangle me-2"></i> {chapterErr.courseId}
              </Alert>
            )}

            <Row className="g-3 mb-3">
              <Col xs={12} md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold text-dark small mb-1">Chapter Title</Form.Label>
                  <Form.Control
                    className="bg-light shadow-none"
                    value={chapterForm.title}
                    onChange={(e) => {
                      setChapterForm({ ...chapterForm, title: e.target.value });
                      if (chapterErr.title) setErrors((p) => ({ ...p, chapter: { ...p.chapter, title: "" } }));
                    }}
                    placeholder="e.g., Quadratic Equations"
                    isInvalid={!!chapterErr.title}
                    required
                    maxLength={MAX_TITLE}
                  />
                  <Form.Control.Feedback type="invalid">{chapterErr.title}</Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col xs={6} md={2}>
                <Form.Group>
                  <Form.Label className="fw-semibold text-dark small mb-1">Order</Form.Label>
                  <Form.Control
                    type="number"
                    className="bg-light shadow-none text-center"
                    value={chapterForm.order}
                    onChange={(e) => {
                      setChapterForm({ ...chapterForm, order: e.target.value });
                      if (chapterErr.order) setErrors((p) => ({ ...p, chapter: { ...p.chapter, order: "" } }));
                    }}
                    isInvalid={!!chapterErr.order}
                    placeholder="1"
                    min={1}
                  />
                  <Form.Control.Feedback type="invalid">{chapterErr.order}</Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col xs={6} md={4}>
                <Form.Group>
                  <Form.Label className="fw-semibold text-dark small mb-1">Course</Form.Label>
                  <Form.Select
                    className="bg-light shadow-none"
                    value={selectedCourseId}
                    onChange={(e) => {
                      setSelectedCourseId(e.target.value);
                      if (chapterErr.courseId) setErrors((p) => ({ ...p, chapter: { ...p.chapter, courseId: "" } }));
                    }}
                    isInvalid={!!chapterErr.courseId}
                    required
                  >
                    <option value="">Select Course</option>
                    {courses.map((course) => (
                      <option key={course._id} value={course._id}>{course.title}</option>
                    ))}
                  </Form.Select>
                  {chapterErr.courseId ? <div className="invalid-feedback d-block">{chapterErr.courseId}</div> : null}
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-4">
              <Form.Label className="fw-semibold text-dark small mb-1">Topics</Form.Label>
              <InputGroup hasValidation className="shadow-sm rounded-3 overflow-hidden">
                <Form.Control
                  className="bg-light border-end-0"
                  placeholder="Type a topic and press Add"
                  value={chapterForm.topicInput}
                  onChange={(e) => setChapterForm({ ...chapterForm, topicInput: e.target.value })}
                  isInvalid={!!chapterErr.topics}
                  onKeyDown={(e) => {
                     // Quick add on Enter key
                     if(e.key === 'Enter') {
                        e.preventDefault();
                        const btn = document.getElementById('add-topic-btn');
                        if(btn) btn.click();
                     }
                  }}
                />
                <Button
                  id="add-topic-btn"
                  type="button"
                  variant="outline-success"
                  className="px-4 fw-semibold"
                  onClick={() => {
                    const next = chapterForm.topicInput.trim();
                    if (!next) return;

                    const existingLower = new Set((chapterForm.topics || []).map((t) => normalize(t).toLowerCase()));
                    if (existingLower.has(next.toLowerCase())) {
                      setErrors((p) => ({ ...p, chapter: { ...p.chapter, topics: "Duplicate topics found" } }));
                      return;
                    }

                    setChapterForm({
                      ...chapterForm,
                      topics: [...chapterForm.topics, next],
                      topicInput: "",
                    });
                    if (chapterErr.topics) setErrors((p) => ({ ...p, chapter: { ...p.chapter, topics: "" } }));
                  }}
                >
                  Add
                </Button>
              </InputGroup>
              {chapterErr.topics ? <div className="invalid-feedback d-block mt-1">{chapterErr.topics}</div> : null}

              {chapterForm.topics.length > 0 && (
                <div className="d-flex flex-wrap gap-2 mt-3 p-3 bg-light rounded-3 border border-secondary border-opacity-10">
                  {chapterForm.topics.map((topic, idx) => (
                    <Badge 
                      key={idx} 
                      bg="success" 
                      className="bg-opacity-10 text-success border border-success border-opacity-25 px-3 py-2 rounded-pill fw-medium d-flex align-items-center"
                    >
                      {topic}
                      <button
                        type="button"
                        className="btn-close btn-close-white ms-2"
                        style={{ fontSize: '0.65rem', filter: 'invert(1)' }}
                        onClick={() => {
                          setChapterForm({
                            ...chapterForm,
                            topics: chapterForm.topics.filter((t) => t !== topic),
                          });
                          if (chapterErr.topics) setErrors((p) => ({ ...p, chapter: { ...p.chapter, topics: "" } }));
                        }}
                      ></button>
                    </Badge>
                  ))}
                </div>
              )}
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label className="fw-semibold text-dark small mb-1">Description</Form.Label>
              <Form.Control
                as="textarea"
                className="bg-light shadow-none"
                rows={2}
                value={chapterForm.description}
                onChange={(e) => {
                  setChapterForm({ ...chapterForm, description: e.target.value });
                  if (chapterErr.description) setErrors((p) => ({ ...p, chapter: { ...p.chapter, description: "" } }));
                }}
                placeholder="Optional: what students will learn in this chapter..."
                isInvalid={!!chapterErr.description}
                maxLength={MAX_DESC}
              />
              <Form.Control.Feedback type="invalid">{chapterErr.description}</Form.Control.Feedback>
            </Form.Group>

            <div className="d-grid mt-4">
              <Button type="submit" variant="success" className="fw-bold py-2 rounded-pill shadow-sm transition">
                <i className="bi bi-save me-2" />
                Add Chapter
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>

      {/* ---------------- UPLOAD MATERIAL CARD ---------------- */}
      <Card className="shadow-sm border-0 rounded-4 border-top border-4 border-warning overflow-hidden mb-4">
        <Card.Header className="bg-white border-bottom-0 pt-4 pb-0 px-4">
          <div className="d-flex align-items-center gap-3 mb-1">
            <div className="bg-warning bg-opacity-10 text-warning rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
              <i className="bi bi-cloud-arrow-up-fill fs-5" />
            </div>
            <div>
              <h5 className="fw-bold mb-0 text-dark">Upload Material</h5>
              <div className="text-muted small">Upload file or attach external link under a chapter/topic.</div>
            </div>
          </div>
        </Card.Header>

        <Card.Body className="p-4 pt-3">
          <Form noValidate onSubmit={handleCreateMaterial}>
            {materialErr.courseId && (
              <Alert variant="warning" className="py-2 rounded-3 border-start border-4 border-warning mb-4">
                <i className="bi bi-exclamation-triangle me-2"></i> {materialErr.courseId}
              </Alert>
            )}

            <Row className="g-3 mb-3">
              <Col xs={12} md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold text-dark small mb-1">Chapter</Form.Label>
                  <Form.Select
                    className="bg-light shadow-none py-2"
                    value={materialForm.chapterId}
                    onChange={(e) => {
                      setMaterialForm({ ...materialForm, chapterId: e.target.value, topic: "" });
                      setErrors((p) => ({ ...p, material: { ...p.material, chapterId: "", topic: "" } }));
                    }}
                    isInvalid={!!materialErr.chapterId}
                    required
                  >
                    <option value="">Select chapter</option>
                    {chapterOptions.map((chapter) => (
                      <option key={chapter.id} value={chapter.id}>{chapter.title}</option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">{materialErr.chapterId}</Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col xs={12} md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold text-dark small mb-1">Material Title</Form.Label>
                  <Form.Control
                    className="bg-light shadow-none py-2"
                    value={materialForm.title}
                    onChange={(e) => {
                      setMaterialForm({ ...materialForm, title: e.target.value });
                      if (materialErr.title) setErrors((p) => ({ ...p, material: { ...p.material, title: "" } }));
                    }}
                    placeholder="e.g., Intro Video / PDF Notes"
                    isInvalid={!!materialErr.title}
                    required
                    maxLength={MAX_TITLE}
                  />
                  <Form.Control.Feedback type="invalid">{materialErr.title}</Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold text-dark small mb-1">Topic (Optional)</Form.Label>
              <Form.Select
                className="bg-light shadow-none py-2"
                value={materialForm.topic}
                onChange={(e) => {
                  setMaterialForm({ ...materialForm, topic: e.target.value });
                  if (materialErr.topic) setErrors((p) => ({ ...p, material: { ...p.material, topic: "" } }));
                }}
                disabled={!materialForm.chapterId}
                isInvalid={!!materialErr.topic}
              >
                <option value="">
                  {materialForm.chapterId ? "Select topic (optional)" : "Select chapter first"}
                </option>
                {(content.find((c) => c._id === materialForm.chapterId)?.topics || []).map((topic, idx) => (
                  <option key={idx} value={topic}>{topic}</option>
                ))}
              </Form.Select>
              {materialErr.topic ? <div className="invalid-feedback d-block">{materialErr.topic}</div> : null}
            </Form.Group>

            <div className="bg-light p-3 rounded-4 mb-4 border border-secondary border-opacity-10 mt-3">
              <Row className="g-3">
                <Col xs={12} md={4}>
                  <Form.Group>
                    <Form.Label className="fw-semibold text-dark small mb-1">Type</Form.Label>
                    <Form.Select
                      className="shadow-none"
                      value={materialForm.type}
                      onChange={(e) => {
                        setMaterialForm({ ...materialForm, type: e.target.value });
                        if (materialErr.type) setErrors((p) => ({ ...p, material: { ...p.material, type: "" } }));
                      }}
                      isInvalid={!!materialErr.type}
                    >
                      <option value="video">Video</option>
                      <option value="note">Notes</option>
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">{materialErr.type}</Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col xs={12} md={4}>
                  <Form.Group>
                    <Form.Label className="fw-semibold text-dark small mb-1">Duration (mins)</Form.Label>
                    <Form.Control
                      type="number"
                      className="shadow-none"
                      value={materialForm.duration}
                      onChange={(e) => {
                        setMaterialForm({ ...materialForm, duration: e.target.value });
                        if (materialErr.duration) setErrors((p) => ({ ...p, material: { ...p.material, duration: "" } }));
                      }}
                      isInvalid={!!materialErr.duration}
                      placeholder="e.g., 12"
                      min={0}
                    />
                    <Form.Control.Feedback type="invalid">{materialErr.duration}</Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col xs={12} md={4}>
                  <Form.Group>
                    <Form.Label className="fw-semibold text-dark small mb-1">External URL</Form.Label>
                    <Form.Control
                      className="shadow-none"
                      value={materialForm.externalUrl}
                      onChange={(e) => {
                        setMaterialForm({ ...materialForm, externalUrl: e.target.value });
                        if (materialErr.externalUrl || materialErr.resource)
                          setErrors((p) => ({ ...p, material: { ...p.material, externalUrl: "", resource: "" } }));
                      }}
                      placeholder="https://"
                      isInvalid={!!materialErr.externalUrl}
                    />
                    <Form.Control.Feedback type="invalid">{materialErr.externalUrl}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>
            </div>

            <Form.Group className="mb-4">
              <Form.Label className="fw-semibold text-dark small mb-1 d-flex justify-content-between">
                <span>Upload File</span>
                <span className="fw-normal text-muted"><i className="bi bi-info-circle me-1"></i>Provide file OR external URL</span>
              </Form.Label>
              <Form.Control
                type="file"
                className="bg-light shadow-none py-2"
                onChange={(e) => {
                  setFile(e.target.files?.[0] || null);
                  if (materialErr.resource) setErrors((p) => ({ ...p, material: { ...p.material, resource: "" } }));
                }}
              />
              {materialErr.resource ? <div className="invalid-feedback d-block mt-1">{materialErr.resource}</div> : null}
            </Form.Group>

            <div className="d-grid mt-4">
              <Button type="submit" variant="warning" className="fw-bold py-2 rounded-pill shadow-sm transition text-dark">
                <i className="bi bi-cloud-arrow-up me-2" />
                Upload Material
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
}
