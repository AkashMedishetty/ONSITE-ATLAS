import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Nav, Table, Badge, Button, Alert, Spinner } from 'react-bootstrap';
import { FaCalendarAlt, FaMapMarkerAlt, FaUserAlt, FaClock, FaStar, FaInfoCircle, FaSync } from 'react-icons/fa';
import apiRegistrant from '../../services/apiRegistrant';
import { useRegistrantAuth } from '../../contexts/RegistrantAuthContext';

const Schedule = () => {
  const { currentRegistrant } = useRegistrantAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('');
  const [scheduleData, setScheduleData] = useState({
    eventName: '',
    days: []
  });

  useEffect(() => {
    fetchScheduleData();
  }, []);

  const fetchScheduleData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiRegistrant.get('/events/current/schedule');
      
      if (response.data && response.data.data) {
        setScheduleData(response.data.data);
        
        // Set the active tab to the first day by default
        if (response.data.data.days && response.data.data.days.length > 0) {
          setActiveTab(response.data.data.days[0].id);
        } else {
          setError('No schedule days available for this event yet.');
        }
      } else {
        setError('No schedule data available for this event yet.');
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching schedule data:', err);
      setError(`Failed to load schedule: ${err.response?.data?.message || err.message}`);
      setLoading(false);
    }
  };

  const getSessionTypeStyle = (type) => {
    const typeStyles = {
      keynote: { bg: 'primary', icon: <FaStar /> },
      plenary: { bg: 'info', icon: <FaUserAlt /> },
      session: { bg: 'success', icon: <FaCalendarAlt /> },
      workshop: { bg: 'indigo', icon: <FaUserAlt /> },
      break: { bg: 'light', textColor: 'dark', icon: <FaClock /> },
      poster: { bg: 'warning', textColor: 'dark', icon: <FaCalendarAlt /> },
      panel: { bg: 'secondary', icon: <FaUserAlt /> },
      social: { bg: 'danger', icon: <FaUserAlt /> },
      registration: { bg: 'info', icon: <FaUserAlt /> },
      roundtable: { bg: 'teal', icon: <FaUserAlt /> },
      ceremony: { bg: 'purple', icon: <FaStar /> }
    };
    
    return typeStyles[type] || { bg: 'secondary', icon: <FaCalendarAlt /> };
  };

  const getCurrentDay = () => {
    if (!scheduleData.days || scheduleData.days.length === 0) {
      return '';
    }
    const today = new Date().toISOString().split('T')[0];
    const matchingDay = scheduleData.days.find(day => day.date === today);
    return matchingDay ? matchingDay.id : scheduleData.days[0].id;
  };

  useEffect(() => {
    // Set the active tab to the current day if we're during the conference
    if (scheduleData.days && scheduleData.days.length > 0) {
      const currentDay = getCurrentDay();
      setActiveTab(currentDay);
    }
  }, [scheduleData]);

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <Spinner animation="border" role="status" variant="primary">
          <span className="visually-hidden">Loading schedule...</span>
        </Spinner>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body className="p-4">
          <h1 className="h3 mb-2">Event Schedule</h1>
          <p className="text-muted mb-4">View the complete schedule for the event</p>

          {error && (
            <Alert variant="info" className="mb-4 d-flex align-items-start">
              <FaInfoCircle className="me-2 mt-1" />
              <div>
                <div className="fw-bold">{error.includes('No schedule') ? 'Schedule Not Available' : 'Error Loading Schedule'}</div>
                <p className="mb-2">{error}</p>
                {!error.includes('No schedule') && (
                  <Button variant="outline-primary" size="sm" onClick={fetchScheduleData} className="mt-2">
                    <FaSync className="me-2" />
                    Try Again
                  </Button>
                )}
              </div>
            </Alert>
          )}

          {!error && scheduleData.days && scheduleData.days.length > 0 && (
            <>
              {/* Days navigation */}
              <Nav variant="tabs" className="mb-4" activeKey={activeTab} onSelect={setActiveTab}>
                {scheduleData.days.map(day => (
                  <Nav.Item key={day.id}>
                    <Nav.Link eventKey={day.id} className="px-4">
                      <div className="d-flex flex-column align-items-center">
                        <span className="fw-bold">{day.name}</span>
                        <small>{new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</small>
                      </div>
                    </Nav.Link>
                  </Nav.Item>
                ))}
              </Nav>

              {/* Schedule for the active day */}
              {scheduleData.days.map(day => (
                <div key={day.id} className={activeTab === day.id ? 'd-block' : 'd-none'}>
                  <Table responsive className="schedule-table">
                    <thead>
                      <tr>
                        <th width="150">Time</th>
                        <th>Session</th>
                        <th width="150">Location</th>
                      </tr>
                    </thead>
                    <tbody>
                      {day.sessions.map(session => {
                        const { bg, textColor, icon } = getSessionTypeStyle(session.type);
                        return (
                          <tr key={session.id} className={session.isUserPresenting ? 'table-primary' : ''}>
                            <td className="align-middle text-nowrap fw-bold">{session.time}</td>
                            <td>
                              <div className="d-flex align-items-start">
                                <Badge 
                                  bg={bg} 
                                  text={textColor} 
                                  className="me-2 px-2 py-1 d-flex align-items-center mt-1"
                                >
                                  {icon}
                                </Badge>
                                <div>
                                  <h5 className="mb-1">{session.title}</h5>
                                  {session.description && (
                                    <p className="mb-1 text-muted">{session.description}</p>
                                  )}
                                  
                                  {session.speakers && session.speakers.length > 0 && (
                                    <div className="d-flex align-items-center mb-1">
                                      <FaUserAlt className="me-2 text-muted" size={12} />
                                      <small className="text-muted">
                                        Speaker{session.speakers.length > 1 ? 's' : ''}: {session.speakers.join(', ')}
                                      </small>
                                    </div>
                                  )}
                                  
                                  {session.chair && (
                                    <div className="d-flex align-items-center mb-1">
                                      <FaUserAlt className="me-2 text-muted" size={12} />
                                      <small className="text-muted">Chair: {session.chair}</small>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="align-middle">
                              <div className="d-flex align-items-center">
                                <FaMapMarkerAlt className="me-2 text-muted" size={14} />
                                <span>{session.location}</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </div>
              ))}
            </>
          )}

          <div className="text-center mt-4">
            <Button variant="outline-primary">
              Download Schedule (PDF)
            </Button>
          </div>
        </Card.Body>
      </Card>

      {/* Personalized schedule section */}
      <Card className="border-0 shadow-sm">
        <Card.Body className="p-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h3>Your Schedule</h3>
            <Badge bg="primary" pill className="px-3 py-2">
              3 Highlighted Sessions
            </Badge>
          </div>
          
          <Alert variant="light" className="border">
            <div className="d-flex">
              <FaInfoCircle className="me-3 text-primary" size={20} />
              <div>
                <h5 className="mb-2">Your Presentation Details</h5>
                <p className="mb-1"><strong>Title:</strong> Advancements in Machine Learning for Environmental Modeling</p>
                <p className="mb-1"><strong>Session:</strong> Parallel Session 2A: Machine Learning Applications</p>
                <p className="mb-1"><strong>Date & Time:</strong> October 16, 2023, 11:30 AM - 11:45 AM</p>
                <p className="mb-0"><strong>Location:</strong> Room A-102</p>
              </div>
            </div>
          </Alert>
          
          <p className="mt-3 text-muted">
            <FaInfoCircle className="me-2" />
            Sessions where you're presenting or that you've saved appear highlighted in your personal schedule.
          </p>
        </Card.Body>
      </Card>

      {/* Styling */}
      <style jsx>{`
        .schedule-table tr {
          transition: background-color 0.2s;
        }
        .schedule-table tr:hover {
          background-color: rgba(0,0,0,0.02);
        }
        .nav-tabs .nav-link.active {
          font-weight: bold;
          border-bottom-color: #4F46E5;
          color: #4F46E5;
        }
      `}</style>
    </Container>
  );
};

export default Schedule; 
