import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, ListGroup, Alert, Spinner, Modal } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { 
  FaBullhorn, // Icon for Announcements
  FaFileAlt, FaCalendarAlt, FaUser, FaMapMarkerAlt, FaCheckCircle, FaClock, FaInfoCircle, FaCreditCard, 
  FaTicketAlt, FaUtensils, FaEnvelope, FaEdit, FaDownload, FaIdBadge, FaListUl, FaMoneyBillWave, FaExclamationTriangle, FaBoxOpen,
  FaPhone, FaBuilding, FaBriefcase, FaGlobe, FaCalendarCheck, FaHistory, FaSignInAlt, FaUserSlash, FaRegFileAlt,
  FaFileInvoice, FaPrint, FaQrcode, FaBars, FaChevronRight
} from 'react-icons/fa';
import { useRegistrantAuth } from '../../contexts/RegistrantAuthContext';
import { useActiveEvent } from '../../contexts/ActiveEventContext';
import apiRegistrant from '../../services/apiRegistrant';
import { abstractService } from '../../services';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'react-hot-toast';
import './RegistrantDashboard.css';

// Updated Styles Object
const styles = {
  container: {
    backgroundColor: '#f8f9fa',
    minHeight: 'calc(100vh - 56px)',
    padding: '1.5rem' // Reduced padding
  },
  card: {
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)', // More subtle shadow
    border: '1px solid #e9ecef', // Added a light border for definition
    borderRadius: '0.5rem', // Crisper radius
    marginBottom: '1.5rem', // Slightly reduced margin
    overflow: 'hidden',
    backgroundColor: '#ffffff' // Ensure card background is white
  },
  cardHeader: {
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e9ecef',
    padding: '1rem 1.25rem', // Adjusted padding
    display: 'flex',
    alignItems: 'center'
  },
  cardTitle: {
    color: '#2A4365', // Primary dark blue for titles
    fontWeight: 600,
    fontSize: '1.1rem', // Adjusted font size
    marginBottom: 0
  },
  welcomeSection: {
    background: 'linear-gradient(135deg, #556AC3 0%, #7B4FB6 100%)', // Adjusted gradient to be a bit deeper/less vibrant if #6366f1 was too light
    color: '#ffffff',
    padding: '1.5rem 2rem',
    borderRadius: '0.5rem',
    marginBottom: '2rem',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
  },
  welcomeFlexContainer: { 
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap' 
  },
  welcomeTextContent: { 
    flex: '1 1 60%', 
    marginRight: '1rem' 
  },
  welcomeTitle: {
    color: '#ffffff',
    fontWeight: 700,
    fontSize: '1.65rem', // Slightly adjusted
    marginBottom: '0.25rem'
  },
  welcomeSubtitle: {
    color: '#e0e7ff',
    fontSize: '1rem', // Slightly adjusted
    marginBottom: 0
  },
  welcomeEventVenue: {
    color: '#e0e7ff',
    fontSize: '0.95rem',
    marginBottom: 0
  },
  badgePreview: { 
    backgroundColor: 'rgba(255, 255, 255, 0.95)', // Slightly more opaque
    color: '#343a40',
    padding: '1rem 1.25rem', // Adjusted padding
    borderRadius: '0.375rem', // 6px radius
    boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
    minWidth: '260px',
    textAlign: 'left',
    border: '1px solid rgba(0,0,0,0.05)',
    flex: '0 0 auto'
  },
  badgeFieldName: {
    fontWeight: 500, // Normal weight for label
    fontSize: '0.8rem',
    color: '#4A5568', // Grayer
    display: 'block',
    marginBottom: '0.1rem'
  },
  badgeFieldValue: {
    fontSize: '0.9rem',
    fontWeight: 600, // Bolder value
    color: '#1A202C',
    display: 'block',
    marginBottom: '0.5rem',
    wordBreak: 'break-word'
  },
  badgeStatusValue: { 
    fontSize: '1rem',
    display: 'block',
    marginBottom: '0.6rem'
  },
  badge: { // For general badge styling if used via styles object
    padding: '0.3em 0.6em',
    borderRadius: '0.25rem',
    fontWeight: 500,
    fontSize: '0.75rem'
  },
  button: { // For buttons styled via this object (e.g., in Quick Actions)
    borderRadius: '0.375rem', 
    padding: '0.6rem 1rem', // Adjusted padding for default button size
    fontWeight: 500,
    margin: '0.25rem', // Reduced margin if they are in a d-grid
    transition: 'all 0.2s ease-in-out',
    letterSpacing: '0.025em',
    textTransform: 'capitalize' // Softer look than uppercase
  },
  buttonPrimary: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  buttonSecondary: {
    backgroundColor: '#6c757d',
    borderColor: '#6c757d',
  },
  buttonLink: {
     color: '#4263EB', // A slightly different blue for links if primary is too dark
     textDecoration: 'none',
     fontWeight: 500,
     fontSize: '0.9rem'
  },
  listItem: {
    padding: '0.85rem 0.25rem', // Adjusted padding, assumes ListGroup adds some its own
    borderBottom: '1px solid #e9ecef',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent' // Ensure ListGroup items are transparent
  },
  listItemLabel: {
    color: '#4A5568',
    fontWeight: 400,
    fontSize: '0.9rem'
  },
  listItemValue: {
    color: '#1A202C',
    fontWeight: 500,
    fontSize: '0.9rem',
    textAlign: 'right'
  },
  emptyState: {
    textAlign: 'center',
    backgroundColor: '#f0f2f5',
    padding: '2rem',
    borderRadius: '0.5rem',
    margin: '1rem 0',
    border: '1px solid #e0e0e0'
  },
  emptyStateIcon: {
    color: '#adb5bd',
    fontSize: '1.8rem',
    marginBottom: '0.75rem'
  },
  primaryText: { // Used for icons in headers etc.
    color: '#2A4365' // Primary dark blue
  },
  tableHeader: {
    backgroundColor: '#f8f9fa',
    fontWeight: 600,
    color: '#495057'
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 'calc(100vh - 56px)',
    backgroundColor: '#f8f9fa'
  },
  spinner: {
    width: '3rem',
    height: '3rem'
  },
  announcementCard: {
    marginTop: '1.5rem',
  },
  announcementItem: {
    padding: '1rem',
    borderBottom: '1px solid #e9ecef',
    backgroundColor: '#fff',
    borderRadius: '0.375rem',
    marginBottom: '0.75rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
  },
  announcementTitle: {
    fontWeight: 'bold',
    color: '#333',
    fontSize: '1.05rem',
    marginBottom: '0.3rem'
  },
  announcementContent: {
    fontSize: '0.9rem',
    color: '#555',
    lineHeight: 1.6,
    whiteSpace: 'pre-wrap' // To respect newlines from textarea input
  },
  announcementMeta: {
    fontSize: '0.8rem',
    color: '#777',
    marginTop: '0.75rem'
  },
  announcementDeadline: {
    fontWeight: '500',
    color: '#D9534F' // A reddish color for deadlines
  }
};

const formatDate = (dateString, includeTime = true) => {
  if (!dateString) return 'N/A';
  try {
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
    }
    return new Date(dateString).toLocaleDateString(undefined, options);
  } catch (e) {
    return dateString;
  }
};

const EmptyState = ({ message, icon }) => (
  <div className="empty-state">
    <div className="empty-state-icon">{icon || <FaInfoCircle />}</div>
    <p className="mb-0 text-muted">{message}</p>
  </div>
);

// Badge Preview Modal Component
const BadgePreviewModal = ({ show, handleClose, registrationData, eventInfo, handleDownloadBadgeClick }) => {
  if (!registrationData) return null;

  const { personalInfo, category, status, registrationId } = registrationData;
  const eventName = eventInfo?.name || "Event";

  return (
    <Modal show={show} onHide={handleClose} size="md" centered>
      <Modal.Header closeButton>
        <Modal.Title className="fs-5">Badge Preview</Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-4 bg-light">
        <div className="badge-preview-container">
          <div className="badge-preview-name">{personalInfo.firstName} {personalInfo.lastName}</div>
          <div className="badge-preview-event">{eventName}</div>
            
          <div className="badge-preview-detail">
            <span className="badge-preview-label">ID:</span>
                <span>{registrationId || 'N/A'}</span>
            </div>
          <div className="badge-preview-detail">
            <span className="badge-preview-label">Category:</span>
                <span>{category?.name || 'N/A'}</span>
            </div>
          <div className="badge-preview-detail">
            <span className="badge-preview-label">Status:</span>
                <span><Badge bg={status === 'active' ? 'success' : 'secondary'}>{status || 'N/A'}</Badge></span>
            </div>
            
          <div className="badge-preview-qr">
                {registrationData.registrationId ? (
                    <QRCodeSVG 
                        value={registrationData.registrationId} 
                size={128}
                level={"H"}
                        includeMargin={true}
                    />
                ) : (
                    <p>No Registration ID available for QR Code.</p>
                )}
            </div>
        </div>
      </Modal.Body>
      <Modal.Footer className="d-flex justify-content-between">
        <Button variant="outline-secondary" onClick={handleClose}>
          Close
        </Button>
        <Button 
          variant="primary" 
          onClick={handleDownloadBadgeClick}
        >
          <FaPrint className="me-2" />Print Badge
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

// Helper for status badges
const StatusBadge = ({ status }) => {
  const getStatusBadgeVariant = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'approved':
      case 'completed':
        return 'success';
      case 'pending':
      case 'in progress':
        return 'warning';
      case 'cancelled':
      case 'rejected':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  return (
    <Badge bg={getStatusBadgeVariant(status)} className="status-badge">
      {status || 'N/A'}
    </Badge>
  );
};

const RegistrantDashboard = () => {
  const { currentRegistrant, fetchRegistrantData: fetchAuthData } = useRegistrantAuth();
  const { activeEventId } = useActiveEvent();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    registration: null,
    abstracts: [],
    payments: [],
    resourceUsage: [],
    registeredEvents: [], 
    eventDetails: null,
    upcomingDeadlines: [],
    schedule: [],
    eventCountdown: null,
    announcements: []
  });
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [isDownloadingBadge, setIsDownloadingBadge] = useState(false);

  // Helper function for abstract status badge variant
  const getAbstractStatusBadgeVariant = (status) => {
    const statusLower = status?.toLowerCase();
    if (statusLower === 'approved' || statusLower === 'accepted') {
      return 'success';
    } else if (statusLower === 'submitted' || statusLower === 'under-review' || statusLower === 'pending') {
      return 'warning';
    } else if (statusLower === 'rejected') {
      return 'danger';
    } else if (statusLower === 'draft' || statusLower === 'revision-requested') {
      return 'info';
    }
    return 'secondary';
  };

  const fetchDashboardData = useCallback(async (eventId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiRegistrant.get(`/registrant-portal/dashboard?event=${eventId}`);
      if (response.data && response.data.data) {
        const apiData = response.data.data;
        setDashboardData({
          registration: apiData.registration || null,
          abstracts: apiData.abstracts || [],
          payments: apiData.payments || [],
          resourceUsage: apiData.resourceUsage || [],
          registeredEvents: apiData.registeredEvents || [], 
          eventDetails: apiData.registration?.event || apiData.eventDetails || null,
          upcomingDeadlines: apiData.upcomingDeadlines || [],
          schedule: apiData.schedule || [],
          eventCountdown: apiData.eventCountdown || null,
          announcements: apiData.announcements || []
        });

        if (currentRegistrant && currentRegistrant._id && eventId) {
          try {
            console.log(`[RegistrantDashboard] Fetching abstracts for event ${eventId} and registrant ${currentRegistrant._id}`);
            const abstractsResponse = await abstractService.getAbstracts(eventId, { registration: currentRegistrant._id });
            if (abstractsResponse.success) {
              setDashboardData(prevData => ({
                ...prevData,
                abstracts: abstractsResponse.data || []
              }));
              console.log('[RegistrantDashboard] Abstracts fetched and updated:', abstractsResponse.data);
            } else {
              console.warn('[RegistrantDashboard] Failed to fetch abstracts separately:', abstractsResponse.message);
            }
          } catch (abstractsError) {
            console.error('[RegistrantDashboard] Error fetching abstracts separately:', abstractsError);
          }
        }
      } else {
        setError('No data structure returned from API for dashboard.');
        setDashboardData(prev => ({ 
          ...prev, 
          registration: null, 
          abstracts: [], 
          payments: [], 
          resourceUsage: [], 
          eventDetails: null,
          upcomingDeadlines: []
        }));
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(`Failed to load dashboard data: ${err.response?.data?.message || err.message}`);
      setDashboardData(prev => ({ 
        ...prev, 
        registration: null, 
        abstracts: [], 
        payments: [], 
        resourceUsage: [], 
        eventDetails: null,
        upcomingDeadlines: []
      }));
    } finally {
      setLoading(false);
    }
  }, [currentRegistrant]);

  useEffect(() => {
    if (activeEventId) {
      console.log("[RegistrantDashboard] ActiveEventId available:", activeEventId);
      fetchDashboardData(activeEventId);
    } else {
      console.warn("[RegistrantDashboard] ActiveEventId not available on mount/update. Dashboard might not load correctly.");
    }
  }, [activeEventId, fetchDashboardData]);

  // --- Handle Badge Download ---
  const handleDownloadBadge = async () => {
    const registrantId = dashboardData.registration?._id;
    const eventId = activeEventId;

    if (!registrantId || !eventId) {
      toast.error("Missing information required to download badge.");
      console.error("Missing registrantId or eventId for badge download");
      return;
    }

    setIsDownloadingBadge(true);
    const loadingToastId = toast.loading("Generating badge...");

    try {
      const response = await apiRegistrant.get(`/registrant-portal/events/${eventId}/registrants/${registrantId}/badge`, {
        responseType: 'blob',
      });

      const contentDisposition = response.headers['content-disposition'];
      let filename = `badge-${registrantId}.pdf`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+?)"?$/);
        if (filenameMatch && filenameMatch.length === 2) {
          filename = filenameMatch[1];
        }
      }

      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Badge download started.");

    } catch (err) {
      console.error('Error downloading badge:', err);
      const errorMsg = err.response?.data?.message || err.response?.statusText || err.message || 'Failed to download badge. Please try again later.';
      let detailMsg = errorMsg;
      if (err.response?.data instanceof Blob) {
        try {
          const errorJson = JSON.parse(await err.response.data.text());
          detailMsg = errorJson.message || errorMsg;
        } catch (parseErr) {
          // Ignore if blob is not JSON
        }
      }
      toast.error(`Badge Download Failed: ${detailMsg}`);
    } finally {
      toast.dismiss(loadingToastId);
      setIsDownloadingBadge(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <Spinner animation="border" variant="primary" className="large-spinner" />
        <span className="ms-3 fs-5 text-primary">Loading Dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Container className="py-4">
        <Alert variant="danger" className="dashboard-error">
          <Alert.Heading className="d-flex align-items-center mb-3">
            <FaExclamationTriangle className="me-2 text-danger" />Error Loading Dashboard
          </Alert.Heading>
          <p>{error}</p>
          {activeEventId && 
            <Button 
              onClick={() => fetchDashboardData(activeEventId)} 
              variant="danger" 
              className="mt-2 dashboard-btn"
            >
              Try Again
            </Button>
          }
        </Alert>
      </Container>
    );
  }

  if (!dashboardData || !dashboardData.registration) {
    return (
      <Container style={styles.container}>
        <Alert variant="warning">No dashboard data available. The event might not be configured for your registration yet or there was an issue fetching data.</Alert>
      </Container>
    );
  }

  const { registration, abstracts, eventDetails, payments, upcomingDeadlines: deadlines, announcements } = dashboardData;

  return (
    <Container fluid style={styles.container} className="registrant-dashboard-container p-lg-4 p-md-3 p-2">
      {/* Welcome Banner & Quick Badge */}
      <Row className="mb-4 welcome-banner-row">
        <Col>
          <Card style={styles.welcomeSection} className="welcome-banner-card">
            <Card.Body style={styles.welcomeFlexContainer}>
              <div style={styles.welcomeTextContent} className="welcome-text-content">
                <h1 style={styles.welcomeTitle} className="welcome-event-name">
                  {eventDetails?.basicInfo?.eventName || eventDetails?.name || 'Your Event Dashboard'}
                </h1>
                {/* Event Location (Venue) */}
                {eventDetails?.venue && (
                  <p style={styles.welcomeEventVenue} className="welcome-event-venue">
                    <FaMapMarkerAlt className="me-1" />
                    {eventDetails.venue.name}
                    {eventDetails.venue.address && `, ${eventDetails.venue.address}`}
                    {eventDetails.venue.city && `, ${eventDetails.venue.city}`}
                    {eventDetails.venue.state && `, ${eventDetails.venue.state}`}
                    {eventDetails.venue.country && `, ${eventDetails.venue.country}`}
                    {eventDetails.venue.zipCode && `, ${eventDetails.venue.zipCode}`}
                  </p>
                )}
                <p style={styles.welcomeSubtitle} className="welcome-registrant-name">
                  Welcome, {registration?.personalInfo?.firstName || 'Registrant'}!
                </p>
              </div>
              {registration && (
                <div style={styles.badgePreview} className="quick-badge-preview">
                  <span style={styles.badgeFieldName}>Name:</span>
                  <span style={styles.badgeFieldValue}>
                    {registration.personalInfo?.firstName} {registration.personalInfo?.lastName}
                  </span>
                  <span style={styles.badgeFieldName}>Reg ID:</span>
                  <span style={styles.badgeFieldValue}>{registration.registrationId}</span>
                  <span style={styles.badgeFieldName}>Category:</span>
                  <span style={styles.badgeFieldValue}>{registration.category?.name || 'N/A'}</span>
                  <Button 
                    variant="outline-primary" 
                    size="sm" 
                    className="mt-2 w-100 view-badge-btn"
                    onClick={() => setShowBadgeModal(true)}
                  >
                    <FaIdBadge className="me-1" /> View Full Badge
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Announcements Section - NEW */}
      {announcements && announcements.length > 0 && (
        <Row className="mb-4">
          <Col>
            <Card style={{...styles.card, ...styles.announcementCard}} className="dashboard-card">
              <Card.Header style={styles.cardHeader}>
                <FaBullhorn size={20} className="me-2" style={{ color: styles.primaryText.color }} />
                <Card.Title style={styles.cardTitle}>Latest Announcements</Card.Title>
              </Card.Header>
              <Card.Body className="p-0">
                {announcements.map((ann, index) => (
                  <div key={ann._id || index} style={styles.announcementItem} className={`announcement-item ${index === 0 ? 'first-announcement' : ''}`}>
                    <h5 style={styles.announcementTitle}>{ann.title}</h5>
                    <p style={styles.announcementContent}>{ann.content}</p>
                    <div style={styles.announcementMeta}>
                      Posted by: {ann.postedBy?.name || 'Event Staff'} on {formatDate(ann.createdAt, true)}
                      {ann.deadline && (
                        <span className="ms-2"> | <FaClock className="me-1" /> Deadline: <span style={styles.announcementDeadline}>{formatDate(ann.deadline, false)}</span></span>
                      )}
                    </div>
                  </div>
                ))}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      <Row className="gy-4 gx-lg-4 gx-md-3 gx-2 dashboard-cards-row">
        {/* Registration Status Card */}
        <Col lg={4} md={6} xs={12}>
          <Card style={styles.card} className="dashboard-card h-100">
            <Card.Header style={styles.cardHeader}>
              <FaIdBadge size={22} className="me-2" style={{ color: styles.primaryText.color }} />
              <Card.Title style={styles.cardTitle}>Registration Status</Card.Title>
            </Card.Header>
            <ListGroup variant="flush" className="p-3">
              <ListGroup.Item style={styles.listItem}>
                <span style={styles.listItemLabel}>Status:</span>
                <span style={styles.listItemValue}><StatusBadge status={registration?.status} /></span>
              </ListGroup.Item>
              <ListGroup.Item style={styles.listItem}>
                <span style={styles.listItemLabel}>Reg. ID:</span>
                <span style={styles.listItemValue}>{registration?.registrationId || 'N/A'}</span>
              </ListGroup.Item>
              <ListGroup.Item style={styles.listItem}>
                <span style={styles.listItemLabel}>Category:</span>
                <span style={styles.listItemValue}>{registration?.category?.name || 'N/A'}</span>
              </ListGroup.Item>
              <ListGroup.Item style={styles.listItem}>
                <span style={styles.listItemLabel}>Registered On:</span>
                <span style={styles.listItemValue}>{formatDate(registration?.createdAt, false)}</span>
              </ListGroup.Item>
            </ListGroup>
          </Card>
        </Col>

        {/* Quick Actions Card */}
        <Col lg={4} md={6} xs={12}>
          <Card style={styles.card} className="dashboard-card h-100">
            <Card.Header style={styles.cardHeader}>
              <FaBars size={20} className="me-2" style={{ color: styles.primaryText.color }} />
              <Card.Title style={styles.cardTitle}>Quick Actions</Card.Title>
            </Card.Header>
            <Card.Body className="d-grid gap-2 p-3">
              {/* Corrected "Submit Abstract" button routing */}
              {activeEventId && (
                <Button 
                  as={Link} 
                  to={`/registrant-portal/abstracts/new`} 
                  variant="primary" 
                  style={styles.button} 
                  className="action-btn submit-abstract-btn"
                >
                  <FaFileAlt className="me-2" /> Submit New Abstract
                </Button>
              )}
              {/* Corrected "Edit Profile" button routing */}
              <Button 
                as={Link} 
                to="/registrant-portal/profile" 
                variant="outline-secondary" 
                style={styles.button} 
                className="action-btn edit-profile-btn"
              >
                <FaUser className="me-2" /> Edit Profile
              </Button>
              <Button 
                variant="outline-info" 
                style={styles.button} 
                className="action-btn view-badge-modal-btn" 
                onClick={() => setShowBadgeModal(true)}
              >
                <FaQrcode className="me-2" /> View/Download Badge
              </Button>
              {/* "View Schedule" button REMOVED */}
            </Card.Body>
          </Card>
        </Col>

        {/* My Profile Snippet Card */}
        <Col lg={4} md={6} xs={12}>
          <Card style={styles.card} className="dashboard-card h-100">
            <Card.Header style={styles.cardHeader}>
              <FaUser size={20} className="me-2" style={{ color: styles.primaryText.color }} />
              <Card.Title style={styles.cardTitle}>My Profile</Card.Title>
            </Card.Header>
            <ListGroup variant="flush" className="p-3">
              <ListGroup.Item style={styles.listItem}>
                <span style={styles.listItemLabel}>Name:</span>
                <span style={styles.listItemValue}>{registration?.personalInfo?.firstName} {registration?.personalInfo?.lastName}</span>
              </ListGroup.Item>
              <ListGroup.Item style={styles.listItem}>
                <span style={styles.listItemLabel}>Email:</span>
                <span style={styles.listItemValue}>{registration?.personalInfo?.email}</span>
              </ListGroup.Item>
              <ListGroup.Item style={styles.listItem}>
                <span style={styles.listItemLabel}>Phone:</span>
                <span style={styles.listItemValue}>{registration?.personalInfo?.phone || registration?.personalInfo?.mobileNumber || 'N/A'}</span>
              </ListGroup.Item>
              <ListGroup.Item style={styles.listItem}>
                <span style={styles.listItemLabel}>Institution:</span>
                <span style={styles.listItemValue}>{registration?.professionalInfo?.institution || 'N/A'}</span>
              </ListGroup.Item>
            </ListGroup>
            <Card.Body className="p-3 pt-0">
              {/* "View Complete Profile" button REMOVED */}
               <Button 
                as={Link} 
                to="/registrant-portal/profile" 
                variant="link" 
                style={styles.buttonLink}
                className="mt-2 p-0 profile-link-btn"
              >
                Go to Profile Page <FaChevronRight size={12} />
              </Button>
            </Card.Body>
          </Card>
        </Col>

        {/* My Abstracts Card */}
        <Col lg={4} md={6} xs={12}>
          <Card style={styles.card} className="dashboard-card h-100">
            <Card.Header style={styles.cardHeader}>
              <FaFileAlt size={20} className="me-2" style={{ color: styles.primaryText.color }} />
              <Card.Title style={styles.cardTitle}>My Abstracts</Card.Title>
            </Card.Header>
            <Card.Body className="p-3">
              {abstracts && abstracts.length > 0 ? (
                <div className="abstracts-list">
                  {abstracts.map((abstract, index) => (
                    <div key={index} className="abstract-item">
                      <div className="abstract-details">
                        <div className="abstract-title">{abstract.title || 'N/A'}</div>
                        <div className="abstract-meta">
                          ID: {abstract.submissionId || abstract._id || 'N/A'}
                        </div>
                        <div className="abstract-date">
                          Submitted: {formatDate(abstract.submissionDate)}
                        </div>
                      </div>
                      <div className="abstract-status">
                        <Badge bg={getAbstractStatusBadgeVariant(abstract.status)} className="status-badge">
                          {abstract.status || 'N/A'}
                        </Badge>
                        {/* Corrected individual abstract view link */}
                        {activeEventId && abstract._id && (
                          <Link 
                            to={`/registrant-portal/events/${activeEventId}/abstracts/${abstract._id}`} 
                            className="btn btn-sm btn-outline-primary mt-2 view-btn"
                          >
                            View
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {/* Corrected "View All Abstracts" link */}
                  {activeEventId && (
                    <Link 
                      to={`/registrant-portal/abstracts`} 
                      className="view-all-link d-inline-flex align-items-center mt-3"
                    >
                      View All Abstracts <FaChevronRight className="ms-1" size={12}/>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="empty-abstracts text-center">
                  <EmptyState message="No abstract submissions found." icon={<FaRegFileAlt />} />
                  {/* Ensure "Submit New Abstract" in empty state also uses correct path */}
                  {activeEventId && (
                    <Button
                      variant="primary"
                      className="action-btn mt-3"
                      as={Link}
                      to={`/registrant-portal/abstracts/new`}
                    >
                      <FaFileAlt className="me-2" />
                      Submit New Abstract
                    </Button>
                  )}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Payment History Card */}
        <Col lg={4} md={6} xs={12}>
          <Card style={styles.card} className="dashboard-card h-100">
            <Card.Header style={styles.cardHeader}>
              <FaMoneyBillWave size={20} className="me-2" style={{ color: styles.primaryText.color }} />
              <Card.Title style={styles.cardTitle}>Payment History</Card.Title>
            </Card.Header>
            <Card.Body className="p-3">
              {payments && payments.length > 0 ? (
                <div className="table-responsive">
                  <table className="payment-table">
                    <thead>
                      <tr>
                        <th>Invoice ID</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((payment, index) => (
                        <tr key={index}>
                          <td data-label="Invoice ID">{payment.invoiceId || 'N/A'}</td>
                          <td data-label="Amount">{payment.currency || '$'}{payment.amount?.toFixed(2) || '0.00'}</td>
                          <td data-label="Status">
                            <Badge bg={payment.status === 'Paid' ? 'success' : 'warning'} className="status-badge">
                              {payment.status || 'N/A'}
                            </Badge>
                          </td>
                          <td data-label="Date">{formatDate(payment.date)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState message="No payment history available." icon={<FaCreditCard />} />
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Event Details Card */}
        <Col lg={4} md={6} xs={12}>
          <Card style={styles.card} className="dashboard-card h-100">
            <Card.Header style={styles.cardHeader}>
              <FaCalendarAlt size={20} className="me-2" style={{ color: styles.primaryText.color }} />
              <Card.Title style={styles.cardTitle}>Event Details</Card.Title>
            </Card.Header>
            <Card.Body className="p-3">
              {eventDetails ? (
                <div className="event-details">
                  <div className="detail-item">
                    <div className="detail-label">
                      <FaCalendarCheck className="detail-icon" />
                      <span>Start Date</span>
                    </div>
                    <div className="detail-value">{formatDate(eventDetails.startDate, false)}</div>
                  </div>
                  
                  <div className="detail-item">
                    <div className="detail-label">
                      <FaCalendarCheck className="detail-icon" />
                      <span>End Date</span>
                    </div>
                    <div className="detail-value">{formatDate(eventDetails.endDate, false)}</div>
                  </div>
                  
                  <div className="detail-item">
                    <div className="detail-label">
                      <FaMapMarkerAlt className="detail-icon" />
                      <span>Location</span>
                    </div>
                    <div className="detail-value">
                      {eventDetails.venue
                        ? [
                            eventDetails.venue.name,
                            eventDetails.venue.address,
                            eventDetails.venue.city,
                            eventDetails.venue.state,
                            eventDetails.venue.country,
                            eventDetails.venue.zipCode
                          ].filter(Boolean).join(', ')
                        : 'N/A'}
                    </div>
                  </div>
                  
                  {deadlines && deadlines.length > 0 && (
                    <div className="deadlines-section mt-3">
                      <h3 className="deadlines-title">Upcoming Deadlines</h3>
                      {deadlines.map((deadline, i) => (
                        <div key={i} className="deadline-item">
                          <div className="deadline-name">{deadline.name}</div>
                          <div className="deadline-date">{formatDate(deadline.date, false)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <EmptyState message="Event details are currently unavailable." icon={<FaInfoCircle />} />
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Badge Preview Modal */}
      <BadgePreviewModal 
        show={showBadgeModal} 
        handleClose={() => setShowBadgeModal(false)}
        registrationData={registration}
        eventInfo={eventDetails}
        handleDownloadBadgeClick={handleDownloadBadge}
      />
    </Container>
  );
};

export default RegistrantDashboard;