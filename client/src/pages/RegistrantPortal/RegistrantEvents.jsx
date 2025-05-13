import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiRegistrant from '../../services/apiRegistrant'; // Import apiRegistrant
import { Spinner, Alert, Card as BootstrapCard, Button as BootstrapButton } from 'react-bootstrap'; // Import Bootstrap components
import { useActiveEvent } from '../../contexts/ActiveEventContext'; // Import useActiveEvent

const RegistrantEvents = () => {
  const { activeEventId } = useActiveEvent(); // Get eventId from context
  const [eventDetails, setEventDetails] = useState(null); // Store details for a single active event
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchActiveEventDetails = async () => {
      if (!activeEventId) {
        setError("No active event selected. Please ensure you have accessed the portal with an event context or select an event.");
        setLoading(false);
        setEventDetails(null);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        // API endpoint to fetch details for a specific event by its ID for the registrant
        // This might be something like /registrant-portal/events/:eventId
        const response = await apiRegistrant.get(`/registrant-portal/events/${activeEventId}`);
        if (response.data && response.data.data) {
          setEventDetails(response.data.data);
        } else {
          setError("Could not load details for the selected event.");
          setEventDetails(null);
        }
      } catch (err) {
        console.error(`Error fetching event details for ${activeEventId}:`, err);
        setError(err.response?.data?.message || err.message || "Failed to load event details.");
        setEventDetails(null);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveEventDetails();
  }, [activeEventId]); // Re-fetch if activeEventId changes
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading event details...</span>
        </Spinner>
        <p className="mt-2">Loading event details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="danger">
          <Alert.Heading>Could Not Load Event Information</Alert.Heading>
          <p>{error}</p>
          {/* Optionally, add a link to a page where they can select from their events if activeEventId was missing */}
        </Alert>
      </div>
    );
  }

  if (!eventDetails) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="info">No event details to display. This might happen if no event is currently active or selected.</Alert>
      </div>
    );
  }
  
  // Display details for the single active event
  const event = eventDetails;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Event: {event.name}</h1>
      
      <BootstrapCard className="shadow-sm">
        <BootstrapCard.Header as="h5">Event Details</BootstrapCard.Header>
        <BootstrapCard.Body>
          <BootstrapCard.Title>{event.name}</BootstrapCard.Title>
          <BootstrapCard.Text>
            <strong>Date:</strong> {event.dateRange || (event.startDate ? `${new Date(event.startDate).toLocaleDateString()} - ${new Date(event.endDate).toLocaleDateString()}` : 'Date TBD')}<br/>
            <strong>Location:</strong> {event.location || 'Location TBD'}<br/>
            <strong>Status:</strong> {event.status ? event.status.charAt(0).toUpperCase() + event.status.slice(1) : 'Status N/A'}
          </BootstrapCard.Text>
          
          <div className="mt-4 flex flex-wrap gap-2">
            {(event.status === 'upcoming' || event.status === 'active') && (
              <Link
                // Note: The resource pass link might need the activeEventId from context too if it navigates within the portal
                to={`/registrant-portal/events/${activeEventId}/resource-pass?event=${activeEventId}`}
                className="btn btn-outline-primary btn-sm"
              >
                Resource Pass
              </Link>
            )}
            {(event.status === 'upcoming' || event.status === 'active') && (
               <Link
                 to={`/registrant-portal/abstracts?event=${activeEventId}`} // Already uses context via layout
                 className="btn btn-outline-info btn-sm"
               >
                 My Abstracts for this Event
               </Link>
             )}
            {/* Add more event-specific actions/links here */}
             <Link
                to={`/registrant-portal/schedule?event=${activeEventId}`} // Example link to a schedule page
                className="btn btn-outline-success btn-sm"
             >
                View Schedule
             </Link>
          </div>
        </BootstrapCard.Body>
        {event.description && (
            <BootstrapCard.Footer className="text-muted">
                {event.description}
            </BootstrapCard.Footer>
        )}
      </BootstrapCard>
    </div>
  );
};

export default RegistrantEvents; 