import React from 'react';
import { Card, Button, Container, Row, Col } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { FaCalendarAlt } from 'react-icons/fa';

const ScheduleTab = () => {
  const { id: eventId } = useParams(); // Assuming the route parameter is 'id' for eventId
  const navigate = useNavigate(); // Initialize useNavigate

  const handleOpenScheduleManager = () => {
    navigate(`/events/${eventId}/schedule-management`);
  };

  return (
    <Container fluid className="mt-4">
      <Row className="justify-content-center">
        <Col md={10} lg={8}>
          <Card className="shadow-sm">
            <Card.Header as="h5" className="bg-primary text-white">
              <FaCalendarAlt className="me-2" /> Event Schedule Management
            </Card.Header>
            <Card.Body className="p-4">
              <Card.Text style={{ fontSize: '1.1rem' }}>
                This section allows you to configure and manage the detailed schedule for your event.
                You can add, edit, or remove days and individual sessions, including details like time,
                location, speakers, and session types.
              </Card.Text>
              <hr className="my-4" />
              <p className="text-muted">
                Click the button below to open the full Schedule Manager page where you can make detailed adjustments.
              </p>
              <div className="mt-4 d-grid">
                <Button variant="primary" size="lg" onClick={handleOpenScheduleManager}>
                  <FaCalendarAlt className="me-2" /> Open Schedule Manager
                </Button>
              </div>
            </Card.Body>
            <Card.Footer className="text-muted text-center">
              Ensure your event schedule is up-to-date to provide the best experience for attendees.
            </Card.Footer>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ScheduleTab; 