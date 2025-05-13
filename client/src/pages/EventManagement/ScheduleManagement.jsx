import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Spinner, Alert, Badge, Table, Modal, InputGroup, ListGroup, Accordion } from 'react-bootstrap';
import { FaCalendarAlt, FaClock, FaPlus, FaEdit, FaTrash, FaSave, FaTimes, FaUsers, FaChalkboardTeacher, FaUserTie } from 'react-icons/fa';
import api from '../../services/api';
import { toast } from 'react-toastify';

const ScheduleManagement = () => {
  const { id: eventId } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [scheduleData, setScheduleData] = useState({
    eventId,
    eventName: '',
    days: []
  });
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [editingDayIndex, setEditingDayIndex] = useState(null);
  const [editingSessionIndex, setEditingSessionIndex] = useState(null);
  const [eventName, setEventName] = useState('');
  console.log('[ScheduleManagement] Initializing component'); // Initial log

  // Session types with labels
  const sessionTypes = [
    { value: 'registration', label: 'Registration' },
    { value: 'plenary', label: 'Plenary Session' },
    { value: 'keynote', label: 'Keynote Address' },
    { value: 'session', label: 'Regular Session' },
    { value: 'break', label: 'Break' },
    { value: 'workshop', label: 'Workshop' },
    { value: 'poster', label: 'Poster Session' },
    { value: 'panel', label: 'Panel Discussion' },
    { value: 'social', label: 'Social Event' },
    { value: 'roundtable', label: 'Roundtable' },
    { value: 'ceremony', label: 'Ceremony' }
  ];

  useEffect(() => {
    console.log('[ScheduleManagement] useEffect triggered. eventId:', eventId);
    if (eventId) {
      const loadData = async () => {
        console.log('[ScheduleManagement] loadData started.');
        setLoading(true); // Set loading true only when we are actually fetching
        console.log('[ScheduleManagement] setLoading(true) called.');
        setError(null); // Reset error state on new load
        try {
          console.log('[ScheduleManagement] Awaiting Promise.allSettled...');
          const results = await Promise.allSettled([
            fetchEventDetails(),
            fetchSchedule()
          ]);
          console.log('[ScheduleManagement] Promise.allSettled completed. Results:', results);
        } catch (e) {
          // This catch is for errors in Promise.allSettled itself or if it's not an array, etc.
          // Individual promise rejections are handled by .status in results.
          console.error('[ScheduleManagement] Error in loadData try block (outer):', e);
          setError('An unexpected error occurred during data loading.');
        } finally {
          console.log('[ScheduleManagement] Entering finally block.');
          setLoading(false);
          console.log('[ScheduleManagement] setLoading(false) called.');
        }
      };
      loadData();
    } else {
      console.log('[ScheduleManagement] useEffect: eventId is still missing. Waiting for eventId to be populated by router.');
      // Do not set loading to false here. Let it stay true (initial state) until eventId is available.
    }
  }, [eventId]);

  const fetchEventDetails = async () => {
    console.log('[ScheduleManagement] fetchEventDetails started for eventId:', eventId);
    try {
      const response = await api.get(`/events/${eventId}`);
      console.log('[ScheduleManagement] fetchEventDetails response:', response.data);
      setEventName(response.data.data.name);
    } catch (err) {
      console.error('[ScheduleManagement] Error fetching event details:', err);
      setError(prevError => {
        const newError = 'Failed to load event details';
        console.log('[ScheduleManagement] setError in fetchEventDetails. New error:', newError, 'Prev error:', prevError);
        return prevError ? `${prevError}, ${newError}` : newError;
      });
    }
  };

  const fetchSchedule = async () => {
    console.log('[ScheduleManagement] fetchSchedule started for eventId:', eventId);
    try {
      const response = await api.get(`/events/${eventId}/schedule`);
      console.log('[ScheduleManagement] fetchSchedule response:', response.data);
      if (response.data && response.data.data) {
        // Ensure days and sessions have unique IDs if backend doesn't provide them
        const scheduleWithUIDs = {
          ...response.data.data,
          days: response.data.data.days.map((day, dIndex) => ({
            ...day,
            id: day.id || `day-${Date.now()}-${dIndex}`, // Ensure day has an ID
            sessions: day.sessions.map((session, sIndex) => ({
              ...session,
              id: session.id || `session-${Date.now()}-${dIndex}-${sIndex}` // Ensure session has an ID
            }))
          }))
        };
        setScheduleData(scheduleWithUIDs);
      } else {
        // Initialize with empty days if no schedule exists
        setScheduleData({
          eventId,
          eventName: eventName || 'Event Schedule',
          days: []
        });
      }
    } catch (err) {
      console.error('[ScheduleManagement] Error fetching schedule:', err);
      // If 404, it means no schedule exists yet, which is okay
      if (err.response && err.response.status === 404) {
        setScheduleData({
          eventId,
          eventName: eventName || 'Event Schedule', // Use fetched eventName
          days: []
        });
      } else {
        setError(prevError => {
          const newError = 'Failed to load schedule';
          console.log('[ScheduleManagement] setError in fetchSchedule (other error). New error:', newError, 'Prev error:', prevError);
          return prevError ? `${prevError}, ${newError}` : newError;
        });
      }
    }
  };

  const handleAddDay = () => {
    const newDay = {
      id: `day-${Date.now()}`, // Unique ID for keys
      date: new Date().toISOString().split('T')[0],
      name: `Day ${scheduleData.days.length + 1}`,
      sessions: []
    };
    
    setScheduleData({
      ...scheduleData,
      days: [...scheduleData.days, newDay]
    });
  };

  const handleUpdateDay = (dayIndex, field, value) => {
    const updatedDays = [...scheduleData.days];
    updatedDays[dayIndex] = { ...updatedDays[dayIndex], [field]: value };
    setScheduleData({ ...scheduleData, days: updatedDays });
  };

  const handleRemoveDay = (dayIndex) => {
    const updatedDays = scheduleData.days.filter((_, i) => i !== dayIndex);
    setScheduleData({ ...scheduleData, days: updatedDays });
  };

  const openAddSessionModal = (dayIndex) => {
    setEditingDayIndex(dayIndex);
    setEditingSessionIndex(null); // Indicates a new session
    setEditingSession({
      id: `session-${Date.now()}`, // Unique ID for keys
      title: '',
      time: '09:00 - 10:00',
      location: '',
      description: '',
      type: 'session', // Default type
      speakers: [], // Initialize as empty array
      chair: '',
      panelists: [], // Initialize as empty array
      facilitator: '',
      isHighlighted: false
    });
    setShowSessionModal(true);
  };

  const openEditSessionModal = (dayIndex, sessionIndex) => {
    const sessionToEdit = scheduleData.days[dayIndex].sessions[sessionIndex];
    setEditingDayIndex(dayIndex);
    setEditingSessionIndex(sessionIndex);
    setEditingSession({ 
        ...sessionToEdit,
        speakers: sessionToEdit.speakers || [], // Ensure speakers is an array
        panelists: sessionToEdit.panelists || [] // Ensure panelists is an array
    });
    setShowSessionModal(true);
  };

  const handleRemoveSession = (dayIndex, sessionIndex) => {
    const updatedDays = [...scheduleData.days];
    updatedDays[dayIndex].sessions = updatedDays[dayIndex].sessions.filter((_, i) => i !== sessionIndex);
    setScheduleData({ ...scheduleData, days: updatedDays });
  };

  const handleSessionChange = (field, value) => {
    setEditingSession(prev => ({ ...prev, [field]: value }));
  };
  
  const handleDynamicListChange = (listName, index, value) => {
    setEditingSession(prev => {
      const newList = [...(prev[listName] || [])];
      newList[index] = value;
      return { ...prev, [listName]: newList };
    });
  };

  const addToList = (listName) => {
    setEditingSession(prev => ({
      ...prev,
      [listName]: [...(prev[listName] || []), '']
    }));
  };

  const removeFromList = (listName, index) => {
    setEditingSession(prev => ({
      ...prev,
      [listName]: (prev[listName] || []).filter((_, i) => i !== index)
    }));
  };

  const handleSaveSession = () => {
    if (!editingSession.title || !editingSession.time) {
      toast.error('Title and time are required for a session.');
      return;
    }
    
    const updatedDays = [...scheduleData.days];
    const targetDaySessions = [...updatedDays[editingDayIndex].sessions];

    if (editingSessionIndex !== null) {
      // Editing existing session
      targetDaySessions[editingSessionIndex] = editingSession;
    } else {
      // Adding new session
      targetDaySessions.push(editingSession);
    }
    
    // Sort sessions by time
    targetDaySessions.sort((a, b) => {
      const getStartTime = (timeStr = "00:00") => { // Default time if undefined
        const match = String(timeStr).match(/^(\\d+):(\\d+)/);
        return match ? parseInt(match[1]) * 60 + parseInt(match[2]) : 0;
      };
      return getStartTime(a.time) - getStartTime(b.time);
    });

    updatedDays[editingDayIndex].sessions = targetDaySessions;
    setScheduleData({ ...scheduleData, days: updatedDays });
    setShowSessionModal(false);
    toast.success(editingSessionIndex !== null ? 'Session updated!' : 'Session added!');
  };

  const handleSaveSchedule = async () => {
    try {
      setSaving(true);
      // Ensure eventName is part of the scheduleData payload if not already
      const payload = {
        ...scheduleData,
        eventName: scheduleData.eventName || eventName, 
      };

      let exists = false;
      try {
        // Note: Using a more specific admin route or checking if it exists before PUT/POST
        await api.get(`/events/${eventId}/schedule`); // Check existence
        exists = true;
      } catch (err) {
        if (err.response && err.response.status === 404) {
          exists = false;
        } else {
          throw err; // Re-throw other errors
        }
      }
      
      if (exists) {
        await api.put(`/events/${eventId}/schedule`, payload);
      } else {
        await api.post(`/events/${eventId}/schedule`, payload);
      }
      
      toast.success('Schedule saved successfully!');
    } catch (err) {
      console.error('Error saving schedule:', err);
      toast.error(err.response?.data?.message || 'Failed to save schedule. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getSessionTypeStyle = (type) => {
    const styles = {
      registration: 'info',
      plenary: 'primary',
      keynote: 'danger',
      session: 'success',
      break: 'light',
      workshop: 'warning',
      poster: 'secondary',
      panel: 'dark',
      social: 'info',
      roundtable: 'secondary',
      ceremony: 'danger'
    };
    return styles[type] || 'secondary';
  };

  // Add a log to see when the component renders and what loading state is
  console.log(`[ScheduleManagement] Rendering component. Loading: ${loading}, Error: ${error}`);

  if (loading) {
    console.log('[ScheduleManagement] Render: loading is true, showing spinner.');
    return (
      <Container className="my-4 py-5 text-center">
        <Spinner animation="border" role="status" variant="primary">
          <span className="visually-hidden">Loading schedule data...</span>
        </Spinner>
        <p className="mt-3 text-muted">Loading schedule data...</p>
      </Container>
    );
  }
  
  if (error && !scheduleData.days.length) { // Show general error if loading failed completely
    return (
        <Container className="my-4">
            <Alert variant="danger">
                <Alert.Heading>Error Loading Schedule Data</Alert.Heading>
                <p>{error}</p>
                <Button onClick={() => { if (eventId) { fetchEventDetails(); fetchSchedule(); } }} variant="outline-danger">
                    Try Again
                </Button>
            </Alert>
        </Container>
    );
  }

  // Render dynamic list for modal (speakers, panelists)
  const renderDynamicList = (listName, itemLabel) => (
    <Form.Group className="mb-3">
      <Form.Label>{itemLabel}s</Form.Label>
      {(editingSession?.[listName] || []).map((item, index) => (
        <InputGroup className="mb-2" key={index}>
          <Form.Control
            type="text"
            value={item}
            onChange={(e) => handleDynamicListChange(listName, index, e.target.value)}
            placeholder={`${itemLabel} ${index + 1}`}
          />
          <Button variant="outline-danger" onClick={() => removeFromList(listName, index)}>
            <FaTimes />
          </Button>
        </InputGroup>
      ))}
      <Button variant="outline-secondary" size="sm" onClick={() => addToList(listName)}>
        <FaPlus className="me-1" /> Add {itemLabel}
      </Button>
    </Form.Group>
  );

  return (
    <Container fluid className="my-4 px-lg-4">
      <Row className="mb-4 align-items-center">
        <Col>
          <h2 className="mb-0">
            <FaCalendarAlt className="me-2" />
            Manage Schedule: <span className="text-primary">{eventName || scheduleData.eventName}</span>
          </h2>
        </Col>
        <Col xs="auto">
          <Button 
            variant="success" 
            onClick={handleSaveSchedule}
            disabled={saving}
            size="lg"
          >
            {saving ? (
              <><Spinner size="sm" className="me-2" />Saving...</>
            ) : (
              <><FaSave className="me-2" />Save Schedule</>
            )}
          </Button>
        </Col>
      </Row>

      {error && scheduleData.days.length > 0 && ( // Show non-critical errors if some data is loaded
        <Alert variant="warning" className="mb-4" dismissible onClose={() => setError(null)}>
          <Alert.Heading>Notice</Alert.Heading>
          <p>{error}</p>
        </Alert>
      )}
      
      <div className="mb-4">
        <Button 
          variant="primary" 
          onClick={handleAddDay}
          className="d-inline-flex align-items-center"
        >
          <FaPlus className="me-2" />
          Add New Day
        </Button>
      </div>
      
      {scheduleData.days.length === 0 && !loading && (
        <Card className="text-center shadow-sm">
            <Card.Body className="p-5">
                <FaCalendarAlt size={48} className="text-muted mb-3" />
                <Card.Title as="h4">No Schedule Days Created Yet</Card.Title>
                <Card.Text className="text-muted">
                    Click the "Add New Day" button to start building your event schedule.
                </Card.Text>
            </Card.Body>
        </Card>
      )}

      <Accordion activeKey={scheduleData.days.map(day => day.id)}>
        {scheduleData.days.map((day, dayIndex) => (
          <Accordion.Item eventKey={day.id} key={day.id} className="mb-3 shadow-sm">
            <Accordion.Header>
              <div className="d-flex justify-content-between align-items-center w-100">
                <span 
                  className="fw-bold fs-5 me-auto" 
                  onClick={(e) => e.stopPropagation()}
                >
                  {day.name || `Day ${dayIndex + 1}`} ({new Date(day.date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })})
                </span>
                <Button 
                    variant="outline-danger" 
                    size="sm"
                    onClick={(e) => { 
                        e.stopPropagation();
                        handleRemoveDay(dayIndex); 
                    }}
                    className="ms-3"
                    title="Delete Day"
                    aria-label={`Delete ${day.name || `Day ${dayIndex + 1}`}`}
                >
                    <FaTrash />
                </Button>
              </div>
            </Accordion.Header>
            <Accordion.Body>
              <Form>
                <Row className="mb-3 g-3">
                  <Col md={6}>
                    <Form.Group controlId={`dayName-${day.id}`}>
                      <Form.Label>Day Name</Form.Label>
                      <Form.Control 
                        type="text" 
                        value={day.name}
                        onChange={(e) => handleUpdateDay(dayIndex, 'name', e.target.value)}
                        placeholder="e.g., Conference Day 1"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId={`dayDate-${day.id}`}>
                      <Form.Label>Date</Form.Label>
                      <Form.Control 
                        type="date" 
                        value={day.date}
                        onChange={(e) => handleUpdateDay(dayIndex, 'date', e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Form>
              
              <div className="mt-4 mb-3 d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Sessions for {day.name || `Day ${dayIndex + 1}`}</h5>
                <Button 
                  variant="outline-primary" 
                  size="sm"
                  onClick={() => openAddSessionModal(dayIndex)}
                  className="d-inline-flex align-items-center"
                >
                  <FaPlus className="me-2" />
                  Add Session
                </Button>
              </div>
              
              {day.sessions.length === 0 ? (
                <Alert variant="secondary" className="text-center py-3">
                  No sessions scheduled for this day yet.
                </Alert>
              ) : (
                <ListGroup variant="flush">
                  {day.sessions.map((session, sessionIndex) => (
                    <ListGroup.Item key={session.id} className="px-0 py-3">
                      <Row className="align-items-center">
                        <Col md={2} className="text-muted">
                            <FaClock className="me-1"/> {session.time}
                        </Col>
                        <Col md={5}>
                          <h6 className="mb-1 fw-bold">{session.title}</h6>
                          {session.location && <small className="text-muted d-block">Location: {session.location}</small>}
                          {session.isHighlighted && (
                            <Badge bg="warning" text="dark" pill className="mt-1">Highlighted</Badge>
                          )}
                        </Col>
                        <Col md={3}>
                          <Badge pill bg={getSessionTypeStyle(session.type)} className="fs-0_9rem px-2 py-1">
                            {sessionTypes.find(st => st.value === session.type)?.label || session.type}
                          </Badge>
                        </Col>
                        <Col md={2} className="text-end">
                          <Button 
                            variant="link" 
                            size="sm" 
                            className="text-primary p-1 me-2"
                            title="Edit Session"
                            onClick={() => openEditSessionModal(dayIndex, sessionIndex)}
                          >
                            <FaEdit size={18} />
                          </Button>
                          <Button 
                            variant="link" 
                            size="sm"
                            className="text-danger p-1"
                            title="Delete Session"
                            onClick={() => handleRemoveSession(dayIndex, sessionIndex)}
                          >
                            <FaTrash size={18} />
                          </Button>
                        </Col>
                      </Row>
                      {session.description && <p className="mt-2 mb-0 text-muted small">{session.description}</p>}
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </Accordion.Body>
          </Accordion.Item>
        ))}
      </Accordion>
      
      {/* Session Add/Edit Modal */}
      {editingSession && (
      <Modal 
        show={showSessionModal} 
        onHide={() => setShowSessionModal(false)}
        backdrop="static"
        keyboard={false}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <FaClock className="me-2" /> 
            {editingSessionIndex !== null ? 'Edit Session Details' : 'Add New Session'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="py-4">
          <Form id="session-form" onSubmit={(e) => { e.preventDefault(); handleSaveSession(); }}>
            <Row className="mb-3">
              <Col md={8}>
                <Form.Group controlId="sessionTitle">
                  <Form.Label>Session Title <span className="text-danger">*</span></Form.Label>
                  <Form.Control 
                    type="text" 
                    value={editingSession.title}
                    onChange={(e) => handleSessionChange('title', e.target.value)}
                    placeholder="e.g., Keynote Address: The Future of AI"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group controlId="sessionTime">
                  <Form.Label>Time <span className="text-danger">*</span></Form.Label>
                  <Form.Control 
                    type="text" 
                    placeholder="e.g., 09:00 - 10:30"
                    value={editingSession.time}
                    onChange={(e) => handleSessionChange('time', e.target.value)}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group controlId="sessionLocation">
                  <Form.Label>Location</Form.Label>
                  <Form.Control 
                    type="text" 
                    value={editingSession.location}
                    onChange={(e) => handleSessionChange('location', e.target.value)}
                    placeholder="e.g., Main Hall, Room 101"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="sessionType">
                  <Form.Label>Session Type</Form.Label>
                  <Form.Select
                    value={editingSession.type}
                    onChange={(e) => handleSessionChange('type', e.target.value)}
                  >
                    {sessionTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3" controlId="sessionDescription">
              <Form.Label>Description</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={3}
                value={editingSession.description}
                onChange={(e) => handleSessionChange('description', e.target.value)}
                placeholder="Provide a brief overview of the session..."
              />
            </Form.Group>
            
            {renderDynamicList('speakers', 'Speaker')}
            
            <Form.Group className="mb-3" controlId="sessionChair">
              <Form.Label>Chair/Moderator</Form.Label>
              <InputGroup>
                <InputGroup.Text><FaUserTie /></InputGroup.Text>
                <Form.Control 
                  type="text" 
                  value={editingSession.chair}
                  onChange={(e) => handleSessionChange('chair', e.target.value)}
                  placeholder="Name of the chair or moderator"
                />
              </InputGroup>
            </Form.Group>
            
            {editingSession.type === 'panel' && renderDynamicList('panelists', 'Panelist')}
            
            {editingSession.type === 'workshop' && (
              <Form.Group className="mb-3" controlId="sessionFacilitator">
                <Form.Label>Facilitator</Form.Label>
                 <InputGroup>
                    <InputGroup.Text><FaChalkboardTeacher /></InputGroup.Text>
                    <Form.Control 
                    type="text" 
                    value={editingSession.facilitator}
                    onChange={(e) => handleSessionChange('facilitator', e.target.value)}
                    placeholder="Name of the workshop facilitator"
                    />
                </InputGroup>
              </Form.Group>
            )}
            
            <Form.Group className="mb-3" controlId="sessionHighlighted">
              <Form.Check 
                type="switch" 
                id="highlight-switch"
                label="Highlight this session (e.g., for special announcements or key events)" 
                checked={editingSession.isHighlighted}
                onChange={(e) => handleSessionChange('isHighlighted', e.target.checked)}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer className="bg-light">
          <Button variant="outline-secondary" onClick={() => setShowSessionModal(false)}>
            <FaTimes className="me-2" />Cancel
          </Button>
          <Button variant="primary" type="submit" form="session-form">
            <FaSave className="me-2" />Save Session
          </Button>
        </Modal.Footer>
      </Modal>
      )}
    </Container>
  );
};

export default ScheduleManagement; 
