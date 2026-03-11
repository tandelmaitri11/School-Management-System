import React from "react";
import { Badge, Button, Card, Col, Form, InputGroup, Row, Stack, Table } from "react-bootstrap";

const normalize = (v) => String(v || "").trim();

export default function TeacherLmsRightPanel({
  courseQuery,
  setCourseQuery,
  selectedCourseId,
  setSelectedCourseId,
  filteredCourses,
  selectedCourse,
  handleDeleteCourse,
  contentQuery,
  setContentQuery,
  content,
  filteredContent,
  errors,
  setDragChapterId,
  handleChapterDrop,
  editingChapterId,
  setEditingChapterId,
  chapterEdits,
  setChapterEdits,
  startEditChapter,
  saveEditChapter,
  chapterTopicInputs,
  setChapterTopicInputs,
  handleSaveTopics,
  showMessage,
  setDragMaterial,
  handleMaterialDrop,
  editingMaterialId,
  setEditingMaterialId,
  materialEdits,
  setMaterialEdits,
  startEditMaterial,
  saveEditMaterial,
  handleDeleteMaterial,
}) {
  return (
    <div className="d-flex flex-column gap-4">
      {/* ---------------- YOUR COURSES CARD ---------------- */}
      <Card className="shadow-sm border-0 rounded-4 border-top border-4 border-info overflow-hidden">
        <Card.Header className="bg-white border-bottom-0 pt-4 pb-0 px-4">
          <div className="d-flex flex-column flex-md-row gap-3 align-items-md-center justify-content-between mb-2">
            <div className="d-flex align-items-center gap-3">
              <div className="bg-info bg-opacity-10 text-info rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                <i className="bi bi-collection-play-fill fs-5" />
              </div>
              <div>
                <h5 className="fw-bold mb-0 text-dark">Your Courses</h5>
                <div className="text-muted small">Select a course to manage content.</div>
              </div>
            </div>

            <div className="d-flex flex-column flex-sm-row gap-2 align-items-sm-center">
              <InputGroup className="shadow-sm rounded-3 overflow-hidden" style={{ maxWidth: 300 }}>
                <InputGroup.Text className="bg-light border-end-0 text-muted">
                  <i className="bi bi-search" />
                </InputGroup.Text>
                <Form.Control 
                  className="bg-light border-start-0 ps-0 shadow-none" 
                  value={courseQuery} 
                  onChange={(e) => setCourseQuery(e.target.value)} 
                  placeholder="Search courses..." 
                />
              </InputGroup>

              <Form.Select 
                className="shadow-sm border-secondary border-opacity-25" 
                value={selectedCourseId} 
                onChange={(e) => setSelectedCourseId(e.target.value)} 
                style={{ maxWidth: 260 }}
              >
                <option value="">Select course to manage</option>
                {filteredCourses.map((course) => (
                  <option key={course._id} value={course._id}>
                    {course.title} (Class {course.classAssigned} - {course.section || "N/A"}
                    {course.stream ? `/${course.stream}` : ""})
                  </option>
                ))}
              </Form.Select>
            </div>
          </div>
        </Card.Header>

        <Card.Body className="p-4 pt-3">
          {selectedCourseId && (
            <div className="bg-light p-3 rounded-4 mb-4 border border-secondary border-opacity-10 d-flex flex-column flex-md-row gap-3 align-items-md-center justify-content-between transition">
              <div className="d-flex flex-wrap gap-2 align-items-center">
                <span className="text-muted small fw-medium text-uppercase tracking-wide" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>Active Course:</span>
                <span className="fw-bold text-primary ms-1 me-2">{selectedCourse?.title}</span>
                <Badge bg="white" text="dark" className="border shadow-sm px-2 py-1 fw-medium">
                  Class {selectedCourse?.classAssigned}
                </Badge>
                <Badge bg="white" text="dark" className="border shadow-sm px-2 py-1 fw-medium">
                  Sec {selectedCourse?.section || "N/A"}
                </Badge>
                <Badge bg="white" text="dark" className="border shadow-sm px-2 py-1 fw-medium">
                  {selectedCourse?.stream || "General"}
                </Badge>
                <Badge bg="primary" className="bg-opacity-10 text-primary border border-primary border-opacity-25 shadow-sm px-2 py-1 fw-medium">
                  {selectedCourse?.subject || "Subject"}
                </Badge>
              </div>

              <Button
                variant="outline-danger"
                size="sm"
                className="d-flex align-items-center gap-2 rounded-pill px-3 shadow-sm fw-semibold"
                onClick={() => handleDeleteCourse(selectedCourseId)}
              >
                <i className="bi bi-trash3" />
                Delete
              </Button>
            </div>
          )}

          <div className="table-responsive rounded-3 border border-secondary border-opacity-10">
            <Table hover borderless className="align-middle mb-0">
              <thead className="table-light text-muted" style={{ fontSize: "0.85rem", textTransform: "uppercase" }}>
                <tr>
                  <th className="fw-semibold px-3 py-3" style={{ width: "30%" }}>Course Title</th>
                  <th className="fw-semibold py-3">Subject</th>
                  <th className="fw-semibold py-3" style={{ width: 90 }}>Class</th>
                  <th className="fw-semibold py-3" style={{ width: 90 }}>Section</th>
                  <th className="fw-semibold py-3" style={{ width: 140 }}>Stream</th>
                </tr>
              </thead>
              <tbody>
                {filteredCourses.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center text-muted py-5">
                      <div className="d-flex flex-column align-items-center">
                        <i className="bi bi-journal-x fs-2 mb-2 opacity-50"></i>
                        No courses found matching your search.
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredCourses.map((course) => (
                    <tr 
                      key={course._id} 
                      onClick={() => setSelectedCourseId(course._id)} 
                      style={{ cursor: "pointer", transition: "background-color 0.2s" }}
                      className={`border-bottom ${selectedCourseId === course._id ? 'bg-primary bg-opacity-10' : ''}`}
                    >
                      <td className="fw-bold text-dark px-3 py-3">{course.title}</td>
                      <td className="text-secondary">{course.subject}</td>
                      <td>
                        <div className="bg-light text-center rounded px-2 py-1 border d-inline-block fw-medium">
                          {course.classAssigned}
                        </div>
                      </td>
                      <td className="text-secondary">{course.section || "-"}</td>
                      <td>
                        <Badge bg="light" text="secondary" className="border fw-normal px-2 py-1">
                          {course.stream || "General"}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* ---------------- COURSE CONTENT CARD ---------------- */}
      <Card className="shadow-sm border-0 rounded-4 border-top border-4 border-secondary overflow-hidden mb-4">
        <Card.Header className="bg-white border-bottom-0 pt-4 pb-0 px-4">
          <div className="d-flex flex-column flex-md-row gap-3 align-items-md-center justify-content-between mb-2">
            <div className="d-flex align-items-center gap-3">
              <div className="bg-secondary bg-opacity-10 text-secondary rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                <i className="bi bi-list-check fs-5" />
              </div>
              <div>
                <h5 className="fw-bold mb-0 text-dark">Course Content</h5>
                <div className="text-muted small">Drag chapters and materials to reorder.</div>
              </div>
            </div>

            <InputGroup className="shadow-sm rounded-3 overflow-hidden" style={{ maxWidth: 320 }}>
              <InputGroup.Text className="bg-light border-end-0 text-muted">
                <i className="bi bi-search" />
              </InputGroup.Text>
              <Form.Control
                className="bg-light border-start-0 ps-0 shadow-none"
                value={contentQuery}
                onChange={(e) => setContentQuery(e.target.value)}
                placeholder="Search chapters/materials..."
                disabled={!selectedCourseId}
              />
            </InputGroup>
          </div>
        </Card.Header>

        <Card.Body className="p-4 pt-3 bg-light bg-opacity-50">
          {!selectedCourseId && (
            <div className="text-center py-5 text-muted bg-white rounded-4 border border-secondary border-opacity-10">
              <i className="bi bi-arrow-up-circle fs-1 d-block mb-3 opacity-50"></i>
              Please select a course from the list above to view and manage its chapters and materials.
            </div>
          )}
          {selectedCourseId && content.length === 0 && (
            <div className="text-center py-5 text-muted bg-white rounded-4 border border-secondary border-opacity-10">
              <i className="bi bi-journal-text fs-1 d-block mb-3 opacity-50"></i>
              No chapters added to this course yet. Use the left panel to create one.
            </div>
          )}

          {filteredContent.map((chapter) => {
            const chEditErr = (errors.chapterEdit || {})[chapter._id] || {};

            return (
              <Card
                key={chapter._id}
                className="mb-4 border-0 shadow-sm rounded-4 overflow-hidden"
                draggable
                onDragStart={() => setDragChapterId(chapter._id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleChapterDrop(chapter._id)}
                style={{ cursor: "grab" }}
              >
                <Card.Body className="p-0">
                  <div className="p-4 bg-white border-bottom border-secondary border-opacity-10">
                    <div className="d-flex flex-column flex-md-row gap-3 align-items-md-center justify-content-between">
                      <div className="d-flex align-items-start align-items-md-center gap-3">
                        <div className="text-muted opacity-50 fs-5 mt-1 mt-md-0" title="Drag to reorder" style={{ cursor: "grab" }}>
                          <i className="bi bi-grip-vertical" />
                        </div>
                        <div>
                          <div className="fw-bold fs-5 text-dark mb-1">
                            {chapter.title}{" "}
                            <Badge bg="light" text="secondary" className="fw-normal border ms-2 align-middle fs-6">
                              Ch. {chapter.order || 0}
                            </Badge>
                          </div>
                          {chapter.description ? (
                            <div className="text-secondary" style={{ fontSize: '0.95rem' }}>{chapter.description}</div>
                          ) : (
                            <div className="text-muted fst-italic small">No description provided</div>
                          )}
                        </div>
                      </div>

                      <div className="d-flex gap-2 ms-4 ms-md-0">
                        <Button size="sm" variant="outline-primary" className="rounded-pill px-3 fw-medium shadow-sm" onClick={() => startEditChapter(chapter)}>
                          <i className="bi bi-pencil-square me-2" />
                          Edit Chapter
                        </Button>
                      </div>
                    </div>

                    {/* Chapter Edit Form */}
                    {editingChapterId === chapter._id && (
                      <div className="border border-primary border-opacity-25 rounded-4 p-4 mt-4 bg-primary bg-opacity-10">
                        <h6 className="fw-bold text-primary mb-3"><i className="bi bi-pencil me-2"></i>Edit Chapter Details</h6>
                        <Row className="g-3">
                          <Col xs={12} md={5}>
                            <Form.Label className="fw-semibold text-dark small mb-1">Title</Form.Label>
                            <Form.Control
                              className="shadow-none"
                              value={chapterEdits[chapter._id]?.title || ""}
                              onChange={(e) =>
                                setChapterEdits({
                                  ...chapterEdits,
                                  [chapter._id]: {
                                    ...chapterEdits[chapter._id],
                                    title: e.target.value,
                                  },
                                })
                              }
                              isInvalid={!!chEditErr.title}
                            />
                            <Form.Control.Feedback type="invalid">{chEditErr.title}</Form.Control.Feedback>
                          </Col>

                          <Col xs={12} md={2}>
                            <Form.Label className="fw-semibold text-dark small mb-1">Order</Form.Label>
                            <Form.Control
                              type="number"
                              className="shadow-none text-center"
                              value={chapterEdits[chapter._id]?.order ?? 0}
                              onChange={(e) =>
                                setChapterEdits({
                                  ...chapterEdits,
                                  [chapter._id]: {
                                    ...chapterEdits[chapter._id],
                                    order: e.target.value,
                                  },
                                })
                              }
                              isInvalid={!!chEditErr.order}
                              min={1}
                            />
                            <Form.Control.Feedback type="invalid">{chEditErr.order}</Form.Control.Feedback>
                          </Col>

                          <Col xs={12} md={5}>
                            <Form.Label className="fw-semibold text-dark small mb-1">Description</Form.Label>
                            <Form.Control
                              className="shadow-none"
                              value={chapterEdits[chapter._id]?.description || ""}
                              onChange={(e) =>
                                setChapterEdits({
                                  ...chapterEdits,
                                  [chapter._id]: {
                                    ...chapterEdits[chapter._id],
                                    description: e.target.value,
                                  },
                                })
                              }
                              isInvalid={!!chEditErr.description}
                            />
                            <Form.Control.Feedback type="invalid">{chEditErr.description}</Form.Control.Feedback>
                          </Col>
                        </Row>

                        <div className="d-flex gap-2 mt-4 justify-content-end">
                          <Button size="sm" variant="outline-secondary" className="rounded-pill px-3 fw-medium" onClick={() => setEditingChapterId(null)}>
                            Cancel
                          </Button>
                          <Button size="sm" variant="primary" className="rounded-pill px-4 fw-medium shadow-sm" onClick={() => saveEditChapter(chapter._id)}>
                            <i className="bi bi-check2 me-1" /> Save Changes
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-4 bg-light">
                    {/* Topics Section */}
                    <div className="mb-4 bg-white p-3 rounded-4 border border-secondary border-opacity-10 shadow-sm">
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <div className="fw-bold text-dark"><i className="bi bi-tags text-success me-2"></i>Chapter Topics</div>
                        <Badge bg="success" className="bg-opacity-10 text-success border border-success border-opacity-25 rounded-pill px-2">
                          {(chapter.topics || []).length} topics
                        </Badge>
                      </div>

                      <div className="d-flex flex-wrap gap-2 mb-3">
                        {(chapter.topics || []).length === 0 && <span className="text-muted small fst-italic">No topics added yet.</span>}
                        {(chapter.topics || []).map((topic, idx) => (
                          <Badge key={idx} bg="white" text="dark" className="border shadow-sm px-3 py-2 rounded-pill fw-medium d-flex align-items-center">
                            {topic}
                            <button
                              type="button"
                              className="btn-close ms-2"
                              style={{ fontSize: '0.55rem' }}
                              onClick={() => {
                                const nextTopics = (chapter.topics || []).filter((t) => t !== topic);
                                handleSaveTopics(chapter._id, nextTopics);
                              }}
                            ></button>
                          </Badge>
                        ))}
                      </div>

                      <InputGroup className="shadow-sm rounded-pill overflow-hidden" style={{ maxWidth: '400px' }}>
                        <Form.Control
                          className="border-end-0 shadow-none ps-3"
                          placeholder="Type a new topic..."
                          value={chapterTopicInputs[chapter._id] || ""}
                          onChange={(e) =>
                            setChapterTopicInputs({
                              ...chapterTopicInputs,
                              [chapter._id]: e.target.value,
                            })
                          }
                          onKeyDown={(e) => {
                            if(e.key === 'Enter') {
                              e.preventDefault();
                              const btn = document.getElementById(`add-topic-${chapter._id}`);
                              if(btn) btn.click();
                            }
                          }}
                        />
                        <Button
                          id={`add-topic-${chapter._id}`}
                          type="button"
                          variant="success"
                          className="px-4 fw-medium"
                          onClick={() => {
                            const value = (chapterTopicInputs[chapter._id] || "").trim();
                            if (!value) return;
                            const currentTopics = (chapter.topics || []).map((t) => normalize(t));
                            const lower = new Set(currentTopics.map((t) => t.toLowerCase()));
                            if (lower.has(value.toLowerCase())) {
                              showMessage("warning", "Duplicate topic not allowed");
                              return;
                            }
                            handleSaveTopics(chapter._id, [...currentTopics, value]);
                            setChapterTopicInputs({ ...chapterTopicInputs, [chapter._id]: "" });
                          }}
                        >
                          <i className="bi bi-plus-lg"></i> Add
                        </Button>
                      </InputGroup>
                    </div>

                    {/* Materials Section */}
                    <div>
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <div className="fw-bold text-dark"><i className="bi bi-file-earmark-play text-warning me-2"></i>Learning Materials</div>
                        <Badge bg="warning" className="bg-opacity-10 text-warning border border-warning border-opacity-25 rounded-pill px-2">
                          {(chapter.materials || []).length} items
                        </Badge>
                      </div>

                      {(chapter.materials || []).length === 0 ? (
                        <div className="border rounded-4 p-4 text-muted text-center bg-white shadow-sm">
                          <i className="bi bi-cloud-upload fs-3 d-block mb-2 opacity-50"></i>
                          No materials uploaded in this chapter yet.
                        </div>
                      ) : (
                        <div className="table-responsive rounded-4 border border-secondary border-opacity-10 bg-white shadow-sm">
                          <Table hover borderless className="align-middle mb-0">
                            <thead className="bg-light text-muted border-bottom" style={{ fontSize: "0.8rem", textTransform: "uppercase" }}>
                              <tr>
                                <th className="fw-semibold px-4 py-3" style={{ width: "26%" }}>Material Title</th>
                                <th className="fw-semibold py-3" style={{ width: 90 }}>Type</th>
                                <th className="fw-semibold py-3" style={{ width: 120 }}>Duration</th>
                                <th className="fw-semibold py-3" style={{ width: 160 }}>Topic</th>
                                <th className="fw-semibold py-3">Resource</th>
                                <th className="fw-semibold py-3 text-end pe-4" style={{ width: 170 }}>Actions</th>
                              </tr>
                            </thead>

                            <tbody>
                              {chapter.materials.map((mat) => {
                                const mEditErr = (errors.materialEdit || {})[mat._id] || {};

                                return editingMaterialId === mat._id ? (
                                  <tr key={mat._id} className="bg-warning bg-opacity-10">
                                    <td className="px-3 py-3 border-bottom border-warning border-opacity-25">
                                      <Form.Control
                                        size="sm"
                                        className="shadow-none"
                                        value={materialEdits[mat._id]?.title || ""}
                                        onChange={(e) =>
                                          setMaterialEdits({
                                            ...materialEdits,
                                            [mat._id]: {
                                              ...materialEdits[mat._id],
                                              title: e.target.value,
                                            },
                                          })
                                        }
                                        isInvalid={!!mEditErr.title}
                                      />
                                      <Form.Control.Feedback type="invalid">{mEditErr.title}</Form.Control.Feedback>
                                    </td>

                                    <td className="py-3 border-bottom border-warning border-opacity-25">
                                      <Form.Select
                                        size="sm"
                                        className="shadow-none"
                                        value={materialEdits[mat._id]?.type || "video"}
                                        onChange={(e) =>
                                          setMaterialEdits({
                                            ...materialEdits,
                                            [mat._id]: {
                                              ...materialEdits[mat._id],
                                              type: e.target.value,
                                            },
                                          })
                                        }
                                        isInvalid={!!mEditErr.type}
                                      >
                                        <option value="video">Video</option>
                                        <option value="note">Notes</option>
                                      </Form.Select>
                                      <Form.Control.Feedback type="invalid">{mEditErr.type}</Form.Control.Feedback>
                                    </td>

                                    <td className="py-3 border-bottom border-warning border-opacity-25">
                                      <Form.Control
                                        type="number"
                                        size="sm"
                                        className="shadow-none"
                                        value={materialEdits[mat._id]?.duration ?? 0}
                                        onChange={(e) =>
                                          setMaterialEdits({
                                            ...materialEdits,
                                            [mat._id]: {
                                              ...materialEdits[mat._id],
                                              duration: e.target.value,
                                            },
                                          })
                                        }
                                        isInvalid={!!mEditErr.duration}
                                        min={0}
                                      />
                                      <Form.Control.Feedback type="invalid">{mEditErr.duration}</Form.Control.Feedback>
                                    </td>

                                    <td className="py-3 border-bottom border-warning border-opacity-25">
                                      <Form.Select
                                        size="sm"
                                        className="shadow-none"
                                        value={materialEdits[mat._id]?.topic || ""}
                                        onChange={(e) =>
                                          setMaterialEdits({
                                            ...materialEdits,
                                            [mat._id]: {
                                              ...materialEdits[mat._id],
                                              topic: e.target.value,
                                            },
                                          })
                                        }
                                        isInvalid={!!mEditErr.topic}
                                      >
                                        <option value="">No topic</option>
                                        {(chapter.topics || []).map((topic, idx) => (
                                          <option key={idx} value={topic}>
                                            {topic}
                                          </option>
                                        ))}
                                      </Form.Select>
                                      {mEditErr.topic ? <div className="invalid-feedback d-block text-xs">{mEditErr.topic}</div> : null}
                                    </td>

                                    <td className="py-3 border-bottom border-warning border-opacity-25">
                                      <Form.Control
                                        size="sm"
                                        className="shadow-none"
                                        value={materialEdits[mat._id]?.externalUrl || ""}
                                        onChange={(e) =>
                                          setMaterialEdits({
                                            ...materialEdits,
                                            [mat._id]: {
                                              ...materialEdits[mat._id],
                                              externalUrl: e.target.value,
                                            },
                                          })
                                        }
                                        isInvalid={!!mEditErr.externalUrl}
                                        placeholder="https://"
                                      />
                                      <Form.Control.Feedback type="invalid">{mEditErr.externalUrl}</Form.Control.Feedback>
                                    </td>

                                    <td className="py-3 pe-3 text-end border-bottom border-warning border-opacity-25">
                                      <Stack direction="horizontal" gap={2} className="justify-content-end">
                                        <Button size="sm" variant="outline-secondary" className="rounded-pill" onClick={() => setEditingMaterialId(null)}>
                                          Cancel
                                        </Button>
                                        <Button size="sm" variant="warning" className="rounded-pill fw-medium text-dark shadow-sm" onClick={() => saveEditMaterial(mat._id, chapter)}>
                                          Save
                                        </Button>
                                      </Stack>
                                    </td>
                                  </tr>
                                ) : (
                                  <tr
                                    key={mat._id}
                                    draggable
                                    onDragStart={() => setDragMaterial({ chapterId: chapter._id, materialId: mat._id })}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={() => handleMaterialDrop(chapter._id, mat._id)}
                                    title="Drag to reorder within chapter"
                                    style={{ cursor: "grab", transition: "background-color 0.2s" }}
                                    className="border-bottom"
                                  >
                                    <td className="px-4 py-3">
                                      <div className="d-flex align-items-center gap-2">
                                        <i className="bi bi-grip-vertical text-muted opacity-25"></i>
                                        <span className="fw-bold text-dark">{mat.title}</span>
                                      </div>
                                    </td>
                                    <td>
                                      <Badge bg={mat.type === "video" ? "danger" : "info"} className={`bg-opacity-10 text-${mat.type === "video" ? "danger" : "info"} border border-${mat.type === "video" ? "danger" : "info"} border-opacity-25 px-2 py-1 rounded-pill text-uppercase fw-medium`}>
                                        <i className={`bi ${mat.type === "video" ? "bi-play-circle" : "bi-file-text"} me-1`}></i>
                                        {mat.type}
                                      </Badge>
                                    </td>
                                    <td className="text-secondary">{mat.duration ? `${mat.duration} min` : "-"}</td>
                                    <td>
                                      {mat.topic ? <Badge bg="light" text="dark" className="border fw-normal px-2 py-1">{mat.topic}</Badge> : <span className="text-muted">-</span>}
                                    </td>
                                    <td>
                                      {mat.file ? (
                                        <a href={`http://localhost:3000/${mat.file}`} target="_blank" rel="noreferrer" className="text-decoration-none fw-medium text-primary">
                                          <i className="bi bi-download me-1"></i> File
                                        </a>
                                      ) : mat.externalUrl ? (
                                        <a href={mat.externalUrl} target="_blank" rel="noreferrer" className="text-decoration-none fw-medium text-primary">
                                          <i className="bi bi-box-arrow-up-right me-1"></i> Link
                                        </a>
                                      ) : (
                                        <span className="text-muted">-</span>
                                      )}
                                    </td>
                                    <td className="pe-4 text-end">
                                      <Stack direction="horizontal" gap={2} className="justify-content-end">
                                        <Button size="sm" variant="light" className="text-secondary border shadow-sm rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }} onClick={() => startEditMaterial(mat)} title="Edit Material">
                                          <i className="bi bi-pencil" />
                                        </Button>
                                        <Button size="sm" variant="light" className="text-danger border shadow-sm rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }} onClick={() => handleDeleteMaterial(mat._id)} title="Delete Material">
                                          <i className="bi bi-trash3" />
                                        </Button>
                                      </Stack>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </Table>
                        </div>
                      )}
                    </div>
                  </div>
                </Card.Body>
              </Card>
            );
          })}
        </Card.Body>
      </Card>
    </div>
  );
}
