import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useRegistrantAuth } from '../../contexts/RegistrantAuthContext.jsx';
import { Card, Row, Col, Button, Spinner, Container, Badge, Alert } from 'react-bootstrap';
import { FaCalendarAlt, FaFileAlt, FaUser, FaBell, FaMapMarkerAlt, FaMicrophone, FaTicketAlt, FaInfoCircle } from 'react-icons/fa';
import apiRegistrant from '../../services/apiRegistrant';

const RegistrantHome = () => {
  const { currentRegistrant } = useRegistrantAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [eventDetails, setEventDetails] = useState({
    name: '',
    startDate: '',
    endDate: '',
    venue: '',
    location: '',
    bannerImage: '',
    logo: '',
    welcomeMessage: '',
    highlights: [],
    announcements: []
  });

  useEffect(() => {
    fetchEventDetails();
  }, []);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const response = await apiRegistrant.get('/events/current');
      
      if (response.data && response.data.data) {
        setEventDetails(response.data.data);
      } else {
        // Fallback to mock data if API returns empty data
        setEventDetails(getMockEventDetails());
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching event details:', err);
      // Use mock data if API endpoint doesn't exist or returns an error
      setEventDetails(getMockEventDetails());
      setLoading(false);
    }
  };

  // Provide mock data until API endpoints are ready
  const getMockEventDetails = () => {
    return {
      name: 'International Research Conference 2023',
      startDate: '2023-10-15',
      endDate: '2023-10-18',
      venue: 'Grand Convention Center',
      location: 'New York, NY',
      bannerImage: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
      logo: 'https://via.placeholder.com/150x50',
      welcomeMessage: 'Welcome to the International Research Conference 2023, where leading researchers from around the world gather to share groundbreaking discoveries and connect with peers.',
      highlights: [
        { time: '9:00 AM, Oct 15', title: 'Opening Ceremony', location: 'Main Hall' },
        { time: '10:30 AM, Oct 15', title: 'Keynote Address', location: 'Auditorium A' },
        { time: '9:00 AM, Oct 16', title: 'Research Presentations', location: 'Multiple Rooms' },
        { time: '7:00 PM, Oct 17', title: 'Gala Dinner', location: 'Grand Ballroom' }
      ],
      announcements: [
        { id: 1, title: 'Updated Schedule Available', date: 'Oct 5, 2023', content: 'The final conference schedule is now available. Please check the Schedule section for details.' },
        { id: 2, title: 'Abstract Submission Deadline Extended', date: 'Oct 2, 2023', content: 'The deadline for abstract submissions has been extended to October 10, 2023.' }
      ]
    };
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <Spinner animation="border" role="status" variant="primary">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-4">
        <Alert variant="danger">
          <Alert.Heading>Error</Alert.Heading>
          <p>{error}</p>
          <Button onClick={fetchEventDetails} variant="outline-danger">Try Again</Button>
        </Alert>
      </Container>
    );
  }
  
  return (
    <div className="p-4">
      <Card className="mb-4 border-0 shadow-sm bg-primary bg-gradient text-white">
        <Card.Body className="p-4">
          <h1 className="display-6 fw-bold mb-2">Welcome to Your Portal</h1>
          <p className="lead mb-0">
            Hello, {currentRegistrant?.name || 'Researcher'}! Manage your abstracts and event participation here.
          </p>
        </Card.Body>
      </Card>
      
      <Row className="g-4">
        <Col md={8}>
          <h5 className="text-muted mb-3">Quick Access</h5>
          <Row className="g-3">
            <Col md={6}>
              <Card className="h-100 border-0 shadow-sm hover-card">
                <Card.Body className="d-flex flex-column">
                  <div className="text-center mb-3">
                    <div className="icon-circle bg-primary bg-opacity-10 mb-3">
                      <i className="bi bi-file-earmark-text fs-3 text-primary"></i>
                    </div>
                    <h5 className="card-title">Abstract Submissions</h5>
                    <p className="card-text text-muted">Manage your submitted abstracts or submit a new one</p>
                  </div>
                  <div className="mt-auto">
                    <Link to="/registrant-portal/abstracts" className="btn btn-outline-primary w-100 mb-2">
                      View Abstracts
                    </Link>
                    <Link to="/registrant-portal/abstracts/new" className="btn btn-primary w-100">
                      Submit New Abstract
                    </Link>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={6}>
              <Card className="h-100 border-0 shadow-sm hover-card">
                <Card.Body className="d-flex flex-column">
                  <div className="text-center mb-3">
                    <div className="icon-circle bg-success bg-opacity-10 mb-3">
                      <i className="bi bi-calendar-event fs-3 text-success"></i>
                    </div>
                    <h5 className="card-title">Your Events</h5>
                    <p className="card-text text-muted">Access your registered events and event information</p>
                  </div>
                  <div className="mt-auto">
                    <Link to="/registrant-portal/events" className="btn btn-outline-success w-100">
                      View Events
                    </Link>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={6}>
              <Card className="h-100 border-0 shadow-sm hover-card">
                <Card.Body className="d-flex flex-column">
                  <div className="text-center mb-3">
                    <div className="icon-circle bg-info bg-opacity-10 mb-3">
                      <i className="bi bi-person-badge fs-3 text-info"></i>
                    </div>
                    <h5 className="card-title">Profile Management</h5>
                    <p className="card-text text-muted">Update your personal details and preferences</p>
                  </div>
                  <div className="mt-auto">
                    <Link to="/registrant-portal/profile" className="btn btn-outline-info w-100">
                      Edit Profile
                    </Link>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={6}>
              <Card className="h-100 border-0 shadow-sm hover-card">
                <Card.Body className="d-flex flex-column">
                  <div className="text-center mb-3">
                    <div className="icon-circle bg-warning bg-opacity-10 mb-3">
                      <i className="bi bi-chat-left-text fs-3 text-warning"></i>
                    </div>
                    <h5 className="card-title">Messages & Notifications</h5>
                    <p className="card-text text-muted">Check important updates about your submissions</p>
                  </div>
                  <div className="mt-auto">
                    <Link to="/registrant-portal/notifications" className="btn btn-outline-warning w-100">
                      View Messages
                    </Link>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Col>
        
        <Col md={4}>
          <h5 className="text-muted mb-3">Latest Updates</h5>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="list-group list-group-flush">
                <div className="list-group-item border-0 px-0 py-3">
                  <div className="d-flex align-items-center">
                    <div className="bg-success bg-opacity-10 p-2 rounded-circle me-3">
                      <i className="bi bi-check-circle text-success"></i>
                    </div>
                    <div>
                      <h6 className="mb-1">Abstract Submission Open</h6>
                      <p className="text-muted small mb-0">Submit your research abstracts for upcoming events</p>
                    </div>
                  </div>
                </div>
                
                <div className="list-group-item border-0 px-0 py-3">
                  <div className="d-flex align-items-center">
                    <div className="bg-primary bg-opacity-10 p-2 rounded-circle me-3">
                      <i className="bi bi-calendar text-primary"></i>
                    </div>
                    <div>
                      <h6 className="mb-1">Event Registration Available</h6>
                      <p className="text-muted small mb-0">Register for upcoming conferences and symposiums</p>
                    </div>
                  </div>
                </div>
                
                <div className="list-group-item border-0 px-0 py-3">
                  <div className="d-flex align-items-center">
                    <div className="bg-info bg-opacity-10 p-2 rounded-circle me-3">
                      <i className="bi bi-info-circle text-info"></i>
                    </div>
                    <div>
                      <h6 className="mb-1">Abstract Guidelines Updated</h6>
                      <p className="text-muted small mb-0">Review latest guidelines for abstract submissions</p>
                    </div>
                  </div>
                </div>
        </div>
            </Card.Body>
          </Card>
          
          <Card className="border-0 shadow-sm mt-4">
            <Card.Body>
              <h5 className="card-title">Need Help?</h5>
              <p className="text-muted">If you have questions about the abstract submission process or event registration, our support team is here to help.</p>
              <Button variant="outline-secondary" className="w-100">
                <i className="bi bi-question-circle me-2"></i>
                Contact Support
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <style jsx>{`
        .hover-card {
          transition: transform 0.3s ease;
        }
        .hover-card:hover {
          transform: translateY(-5px);
        }
        .icon-circle {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 64px;
          height: 64px;
          border-radius: 50%;
        }
      `}</style>
    </div>
  );
};

export default RegistrantHome; 