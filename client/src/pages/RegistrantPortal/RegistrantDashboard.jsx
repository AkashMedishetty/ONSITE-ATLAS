import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, ListGroup, Alert, Spinner, Modal } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { 
  FaFileAlt, FaCalendarAlt, FaUser, FaMapMarkerAlt, FaCheckCircle, FaClock, FaInfoCircle, FaCreditCard, 
  FaTicketAlt, FaUtensils, FaEnvelope, FaEdit, FaDownload, FaIdBadge, FaListUl, FaMoneyBillWave, FaExclamationTriangle, FaBoxOpen,
  FaPhone, FaBuilding, FaBriefcase, FaGlobe, FaCalendarCheck, FaHistory, FaSignInAlt, FaUserSlash, FaRegFileAlt,
  FaFileInvoice
} from 'react-icons/fa';
import { useRegistrantAuth } from '../../contexts/RegistrantAuthContext';
import { useActiveEvent } from '../../contexts/ActiveEventContext';
import apiRegistrant from '../../services/apiRegistrant';
import { abstractService } from '../../services';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'react-hot-toast';

// Styles - More refined and aligned with project aesthetics
const styles = {
  container: {
    backgroundColor: '#f8f9fa', // Lighter background for a cleaner look
    minHeight: 'calc(100vh - 56px)',
    padding: '2rem' // Increased padding
  },
  card: {
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)', // Softer, more modern shadow
    border: 'none',
    borderRadius: '0.75rem', // Slightly more rounded corners
    marginBottom: '2rem', // Increased margin between cards
    overflow: 'hidden' // Ensures content respects border radius
  },
  cardHeader: {
    backgroundColor: '#ffffff', // White header for contrast
    borderBottom: '1px solid #e9ecef', // Lighter border
    padding: '1.25rem 1.5rem',
    display: 'flex',
    alignItems: 'center'
  },
  cardTitle: {
    color: '#343a40', // Darker title for better readability
    fontWeight: 600,
    fontSize: '1.15rem',
    marginBottom: 0
  },
  welcomeSection: {
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    color: '#ffffff',
    padding: '1.5rem 2rem',
    borderRadius: '0.75rem',
    marginBottom: '2rem',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
  },
  welcomeFlexContainer: { // New style for the main flex container in welcome section
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap' // Allow wrapping on smaller screens
  },
  welcomeTextContent: { // For the left side (Event Name, Welcome msg)
    flex: '1 1 60%', // Takes more space
    marginRight: '1rem' // Space to the badge preview
  },
  welcomeTitle: {
    color: '#ffffff',
    fontWeight: 700,
    fontSize: '1.75rem',
    marginBottom: '0.25rem'
  },
  welcomeSubtitle: {
    color: '#e0e7ff',
    fontSize: '1.1rem',
    marginBottom: 0
  },
  badgePreview: { // Styles for the new badge preview block
    backgroundColor: 'rgba(255, 255, 255, 0.9)', // Semi-transparent white
    color: '#343a40', // Dark text for contrast
    padding: '1rem 1.25rem',
    borderRadius: '0.5rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    minWidth: '280px', // Minimum width for the badge
    textAlign: 'left',
    border: '1px solid rgba(0,0,0,0.1)',
    flex: '0 0 auto' // Prevents it from shrinking too much
  },
  badgeFieldName: {
    fontWeight: 600,
    fontSize: '0.85rem',
    color: '#495057',
    display: 'block',
    marginBottom: '0.1rem'
  },
  badgeFieldValue: {
    fontSize: '1rem',
    color: '#212529',
    display: 'block',
    marginBottom: '0.6rem',
    wordBreak: 'break-word'
  },
  badgeStatusValue: { // Specific style for status to include the Bootstrap badge
    fontSize: '1rem',
    display: 'block',
    marginBottom: '0.6rem'
  },
  welcomeIcon: {
    color: '#ffffff',
    fontSize: '1.1em', // Slightly adjust icon size if needed
    // marginRight: '0.5rem', // Removed, using gap in welcomeInfoItem instead
  },
  badge: {
    padding: '0.4em 0.8em',
    borderRadius: '50rem',
    fontWeight: 500,
    fontSize: '0.8rem'
  },
  button: {
    borderRadius: '0.375rem', // Standard button radius
    padding: '0.6rem 1.25rem',
    fontWeight: 500,
    margin: '0.3rem',
    transition: 'all 0.2s ease-in-out'
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
     color: '#6366f1',
     textDecoration: 'none',
     fontWeight: 500,
  },
  listItem: {
    padding: '1rem 0',
    borderBottom: '1px solid #f1f3f5', // Very light separator
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  listItemLabel: {
    color: '#495057', // Slightly lighter label color
    fontWeight: 500
  },
  listItemValue: {
    color: '#212529',
    textAlign: 'right'
  },
  emptyState: {
    textAlign: 'center',
    backgroundColor: '#f8f9fa',
    padding: '2.5rem',
    borderRadius: '0.5rem',
    margin: '1rem 0',
    border: '1px dashed #dee2e6'
  },
  emptyStateIcon: {
    color: '#adb5bd',
    fontSize: '2rem',
    marginBottom: '1rem'
  },
  primaryText: {
    color: '#6366f1'
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
    width: '3.5rem',
    height: '3.5rem'
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
  <div style={styles.emptyState}>
    <div style={styles.emptyStateIcon}>{icon || <FaInfoCircle />}</div>
    <p className="mb-0 text-muted">{message}</p>
  </div>
);

// Badge Preview Modal Component
const BadgePreviewModal = ({ show, handleClose, registrationData, eventInfo, handleDownloadBadgeClick }) => {
  if (!registrationData) return null;

  const { personalInfo, category, status, registrationId } = registrationData;
  const eventName = eventInfo?.name || "Event";

  const modalStyles = {
    badgeContainer: {
      padding: '2rem',
      textAlign: 'center',
      backgroundColor: '#ffffff',
      border: '1px solid #dee2e6',
      borderRadius: '0.5rem',
      boxShadow: '0 0.5rem 1rem rgba(0,0,0,0.15)',
      maxWidth: '400px', // Typical badge width
      margin: 'auto'
    },
    registrantName: {
      fontSize: '1.75rem',
      fontWeight: 700,
      color: styles.primaryText.color, // Using existing primary color
      marginBottom: '0.5rem'
    },
    eventName: {
      fontSize: '1rem',
      color: '#495057',
      marginBottom: '1rem'
    },
    detailRow: {
      fontSize: '0.95rem',
      color: '#212529',
      marginBottom: '0.6rem',
      display: 'flex',
      justifyContent: 'space-between',
      padding: '0.25rem 0',
      borderBottom: '1px solid #f1f3f5'
    },
    detailLabel: { fontWeight: 600, color: '#495057' },
    qrDisplayBox: {
      margin: '1.5rem auto 1rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  };

  return (
    <Modal show={show} onHide={handleClose} size="md" centered>
      <Modal.Header closeButton>
        <Modal.Title style={{fontSize: '1.25rem'}}>Badge Preview</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{padding: '2rem', backgroundColor: '#f8f9fa'}}>
        <div style={modalStyles.badgeContainer}>
            <div style={modalStyles.registrantName}>{personalInfo.firstName} {personalInfo.lastName}</div>
            <div style={modalStyles.eventName}>{eventName}</div>
            
            <div style={modalStyles.detailRow}>
                <span style={modalStyles.detailLabel}>ID:</span>
                <span>{registrationId || 'N/A'}</span>
            </div>
            <div style={modalStyles.detailRow}>
                <span style={modalStyles.detailLabel}>Category:</span>
                <span>{category?.name || 'N/A'}</span>
            </div>
             <div style={modalStyles.detailRow}>
                <span style={modalStyles.detailLabel}>Status:</span>
                <span><Badge bg={status === 'active' ? 'success' : 'secondary'}>{status || 'N/A'}</Badge></span>
            </div>
            
            <div style={modalStyles.qrDisplayBox}>
                {registrationData.registrationId ? (
                    <QRCodeSVG 
                        value={registrationData.registrationId} 
                        size={128} // Standard QR size, can be adjusted
                        level={"H"} // Error correction level: L, M, Q, H
                        includeMargin={true}
                        // imageSettings={{ // Optional: to embed an image in the QR, e.g., a small logo
                        //   src: "logo_url_here",
                        //   height: 24,
                        //   width: 24,
                        //   excavate: true,
                        // }}
                    />
                ) : (
                    <p>No Registration ID available for QR Code.</p>
                )}
            </div>
        </div>
      </Modal.Body>
      <Modal.Footer style={{padding: '1rem 1.5rem', justifyContent: 'space-between'}}>
        <Button variant="outline-secondary" onClick={handleClose} style={styles.button}>
          Close
        </Button>
        <Button 
          variant="primary" 
          onClick={handleDownloadBadgeClick}
          style={{...styles.button, ...styles.buttonPrimary}}
        >
          <FaIdBadge className="me-2" />Print Badge
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

const RegistrantDashboard = () => {
  const { currentRegistrant: authContextRegistrant, currentRegistrant } = useRegistrantAuth();
  const { activeEventId } = useActiveEvent();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    registration: null,
    abstracts: [],
    payments: [],
    resourceUsage: [],
    registeredEvents: [], 
    upcomingDeadlines: [],
    schedule: [],
    eventCountdown: null
  });
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [isDownloadingBadge, setIsDownloadingBadge] = useState(false); // State for download loading

  const fetchDashboardData = async (eventId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiRegistrant.get(`/registrant-portal/dashboard?event=${eventId}`);
      if (response.data && response.data.data) {
        const apiData = response.data.data;
        setDashboardData({
          registration: apiData.registration || null,
          abstracts: [],
          payments: apiData.payments || [],
          resourceUsage: apiData.resourceUsage || [],
          registeredEvents: apiData.registeredEvents || [], 
          upcomingDeadlines: apiData.upcomingDeadlines || [],
          schedule: apiData.schedule || [],
          eventCountdown: apiData.eventCountdown || null
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
        setDashboardData(prev => ({ ...prev, registration: null, abstracts: [], payments: [], resourceUsage: [] }));
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(`Failed to load dashboard data: ${err.response?.data?.message || err.message}`);
      setDashboardData(prev => ({ ...prev, registration: null, abstracts: [], payments: [], resourceUsage: [] }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeEventId) {
      fetchDashboardData(activeEventId);
    } else {
      setError("No active event selected. Please access via an event link.");
      setLoading(false);
    }
  }, [activeEventId]);

  // --- New Function: Handle Badge Download ---
  const handleDownloadBadge = async () => {
    const registrantId = dashboardData.registration?._id;
    const eventId = activeEventId; // Use eventId from context

    if (!registrantId || !eventId) {
      toast.error("Missing information required to download badge.");
      console.error("Missing registrantId or eventId for badge download");
      return;
    }

    setIsDownloadingBadge(true);
    const loadingToastId = toast.loading("Generating badge..."); // Use toast.loading()

    try {
      // Use apiRegistrant which should have the base URL and auth configured
      const response = await apiRegistrant.get(`/registrant-portal/events/${eventId}/registrants/${registrantId}/badge`, {
        responseType: 'blob', // Important for file downloads
      });

      // Extract filename from content-disposition header if available
      const contentDisposition = response.headers['content-disposition'];
      let filename = `badge-${registrantId}.pdf`; // Default filename
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+?)"?$/);
        if (filenameMatch && filenameMatch.length === 2) {
          filename = filenameMatch[1];
        }
      }

      // Create a blob URL and trigger download
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
      // Since the response might be blob, try to parse it as text if it's an error
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
      toast.dismiss(loadingToastId); // Dismiss the loading toast
      setIsDownloadingBadge(false);
    }
  };

  if (loading) {
    return (
      <Container fluid style={styles.loadingContainer}>
        <Spinner animation="border" variant="primary" style={styles.spinner} />
        <span className="ms-3 fs-5 text-primary">Loading Dashboard...</span>
      </Container>
    );
  }

  if (error) {
    return (
      <Container style={{padding: '2rem'}}>
        <Alert variant="danger" style={styles.card}>
          <Alert.Heading style={{display: 'flex', alignItems: 'center'}}><FaExclamationTriangle style={{...styles.icon, color: '#dc3545'}} />Error Loading Dashboard</Alert.Heading>
          <hr/>
          <p>{error}</p>
          {activeEventId && <Button onClick={() => fetchDashboardData(activeEventId)} variant="danger" style={styles.button}>Try Again</Button>}
        </Alert>
      </Container>
    );
  }

  const { registration, abstracts, payments, resourceUsage } = dashboardData;
  const personalInfo = registration?.personalInfo || {};
  const eventInfo = registration?.event || {};

  const DetailItem = ({ label, value, icon, badgeBg, badgeText }) => (
    <div style={{...styles.listItem, paddingLeft: 0, paddingRight: 0}}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {icon && React.cloneElement(icon, { style: {...styles.icon, fontSize: '1rem', color: '#6c757d'} })}
        <span style={styles.listItemLabel}>{label}</span>
      </div>
      {badgeText ? 
        <Badge pill bg={badgeBg || 'primary'} style={styles.badge}>{value || 'N/A'}</Badge> : 
        <span style={styles.listItemValue}>{value || <span className="text-muted fst-italic">N/A</span>}</span>
      }
    </div>
  );
  
  return (
    <Container fluid style={styles.container}>
      {/* Welcome and Event Info with Badge Preview */}
      <div style={styles.welcomeSection}>
        <div style={styles.welcomeFlexContainer}> {/* Flex container for text and badge */}
          <div style={styles.welcomeTextContent}> {/* Left side: Event Name & Welcome */}
            <h1 style={styles.welcomeTitle}>{eventInfo.name || 'Event Dashboard'}</h1>
            <p style={styles.welcomeSubtitle}>Welcome, {personalInfo.firstName || authContextRegistrant?.name || 'Registrant'}!</p>
          </div>

          {registration && (
            <div style={styles.badgePreview}> {/* Right side: Badge Preview on dashboard */}
              <div style={{textAlign: 'center', marginBottom: '0.75rem'}}>
                 <h5 style={{fontWeight: 600, color: styles.primaryText.color, marginBottom: '0.2rem' }}>{personalInfo.firstName} {personalInfo.lastName || ''}</h5>
                 <span style={{fontSize: '0.8rem', color: '#6c757d'}}>{eventInfo.name || 'Current Event'}</span>
              </div>
              <div>
                <span style={styles.badgeFieldName}>Registration ID:</span>
                <span style={styles.badgeFieldValue}>{registration.registrationId || 'N/A'}</span>
              </div>
              <div>
                <span style={styles.badgeFieldName}>Category:</span>
                <span style={styles.badgeFieldValue}>{registration.category?.name || 'N/A'}</span>
              </div>
              <div>
                <span style={styles.badgeFieldName}>Status:</span>
                <span style={styles.badgeStatusValue}>
                  <Badge 
                    pill 
                    bg={registration.status === 'active' ? 'success' : 'secondary'} 
                    style={styles.badge}
                  >
                    {registration.status || 'N/A'}
                  </Badge>
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <Row>
        <Col lg={7} className="mb-4 mb-lg-0">
          <Card style={styles.card}>
            <Card.Header style={styles.cardHeader}>
              <FaUser style={styles.icon} /><h5 style={styles.cardTitle}>My Profile Overview</h5>
            </Card.Header>
            <Card.Body className="p-4">
              {registration ? (
                <ListGroup variant="flush">
                  <DetailItem icon={<FaUser />} label="Full Name" value={`${personalInfo.firstName} ${personalInfo.lastName}`} />
                  <DetailItem icon={<FaEnvelope />} label="Email" value={personalInfo.email} />
                  <DetailItem icon={<FaPhone />} label="Phone" value={personalInfo.phone} />
                  <DetailItem icon={<FaBuilding />} label="Organization" value={personalInfo.organization} />
                  <DetailItem icon={<FaBriefcase />} label="Designation" value={personalInfo.designation} />
                  <DetailItem icon={<FaGlobe />} label="Country" value={personalInfo.country} />
                  <DetailItem icon={<FaCalendarCheck />} label="Registered On" value={formatDate(registration.createdAt)} />
                  <DetailItem icon={<FaHistory />} label="Last Updated" value={formatDate(registration.updatedAt)} />
                  <DetailItem icon={<FaSignInAlt />} label="Checked-In" 
                    value={registration.checkIn?.isCheckedIn ? `Yes (${formatDate(registration.checkIn.checkedInAt)})` : 'No'} 
                    badgeText={true} 
                    badgeBg={registration.checkIn?.isCheckedIn ? 'success' : 'secondary'} />
                  <DetailItem icon={<FaIdBadge />} label="Badge Printed" 
                    value={registration.badgePrinted ? `Yes ${registration.printedAt ? formatDate(registration.printedAt) : ''}`.trim() : 'No'} 
                    badgeText={true} 
                    badgeBg={registration.badgePrinted ? 'success' : 'secondary'} />
                </ListGroup>
              ) : <EmptyState message="Profile details not available." icon={<FaUserSlash />} />}
            </Card.Body>
            {registration?.customFields && Object.keys(registration.customFields).length > 0 && (
              <Card.Footer style={{...styles.cardHeader, borderTop: '1px solid #e9ecef', backgroundColor: '#f8f9fa'}}>
                <h6 className="fw-semibold text-dark mb-3">Custom Fields:</h6>
                <ListGroup variant="flush">
                  {Object.entries(registration.customFields).map(([key, value]) => (
                    <ListGroup.Item key={key} style={{...styles.listItem, backgroundColor: 'transparent', paddingLeft:0, paddingRight:0}}>
                      <span style={styles.listItemLabel}>{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                      <span style={styles.listItemValue}>{String(value) || <span className="text-muted fst-italic">N/A</span>}</span>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </Card.Footer>
            )}
          </Card>

          <Card style={styles.card}>
            <Card.Header style={styles.cardHeader}>
              <FaTicketAlt style={styles.icon} /><h5 style={styles.cardTitle}>Actions & Downloads</h5>
            </Card.Header>
            <Card.Body className="p-4 d-flex flex-wrap justify-content-start align-items-center">
              <Button 
                variant="primary" 
                style={{...styles.button, ...styles.buttonPrimary}}
                onClick={() => setShowBadgeModal(true)}
                disabled={!registration}
              >
                <FaIdBadge className="me-2" /> View/Print Badge
              </Button>
              <Button 
                variant="secondary" 
                style={{...styles.button, ...styles.buttonSecondary}}
                onClick={() => alert('Download Certificate(s) functionality coming soon!')}
              >
                <FaDownload className="me-2" /> Download Certificate(s)
              </Button>
              <Button 
                variant="info" 
                style={styles.button}
                onClick={() => alert('Raise a Support Ticket functionality coming soon!')}
              >
                <FaEnvelope className="me-2" /> Raise a Support Ticket
              </Button>
              <Button 
                variant="success"
                style={{...styles.button, backgroundColor: '#198754', borderColor: '#198754'}}
                onClick={() => alert('Download Invoice functionality coming soon!')}
              >
                <FaFileInvoice className="me-2" /> Download Invoice
              </Button>
              <Link 
                to={`/registrant-portal/profile/edit?event=${activeEventId}`} 
                style={{...styles.button, ...styles.buttonLink, color: styles.buttonLink.color, marginLeft: '0.3rem', display: 'inline-flex', alignItems: 'center'}}
                className="btn btn-outline-primary"
              >
                <FaEdit className="me-2" /> Edit Profile
              </Link>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={5}>
          {/* Abstract Submissions */}
          <Card style={styles.card}>
            <Card.Header style={styles.cardHeader}>
              <FaFileAlt style={styles.icon}/><h5 style={styles.cardTitle}>My Abstract Submissions</h5>
            </Card.Header>
            <Card.Body className="p-4">
              {abstracts && abstracts.length > 0 ? (
                <ListGroup variant="flush">
                  {abstracts.map((abstract, index) => {
                    let badgeBg = 'secondary'; // Default
                    const statusLower = abstract.status?.toLowerCase();

                    if (statusLower === 'approved' || statusLower === 'accepted') {
                      badgeBg = 'success';
                    } else if (statusLower === 'submitted' || statusLower === 'under-review' || statusLower === 'pending' || statusLower === 'revised-pending-review') {
                      badgeBg = 'warning';
                    } else if (statusLower === 'rejected') {
                      badgeBg = 'danger';
                    } else if (statusLower === 'draft' || statusLower === 'revision-requested') {
                      badgeBg = 'info';
                    }

                    return (
                      <ListGroup.Item key={index} style={styles.listItem}>
                        <div>
                          <strong style={{color: styles.primaryText.color}}>{abstract.title || 'N/A'}</strong>
                          <br />
                          <small className="text-muted">
                            ID: {abstract.submissionId || abstract._id || 'N/A'} | Submitted: {formatDate(abstract.submissionDate)}
                          </small>
                        </div>
                        <Badge pill bg={badgeBg} style={styles.badge}>
                          {abstract.status || 'N/A'}
                        </Badge>
                      </ListGroup.Item>
                    );
                  })}
                </ListGroup>
              ) : (
                <EmptyState message="No abstract submissions found for this event." icon={<FaRegFileAlt />} />
              )}
            </Card.Body>
          </Card>

          {/* Payment History */}
          <Card style={styles.card}>
            <Card.Header style={styles.cardHeader}>
              <FaMoneyBillWave style={styles.icon}/><h5 style={styles.cardTitle}>Payment History</h5>
            </Card.Header>
            <Card.Body className="p-4">
              {payments && payments.length > 0 ? (
                <Table responsive hover style={{fontSize: '0.9rem'}}>
                  <thead style={styles.tableHeader}>
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
                        <td>{payment.invoiceId || 'N/A'}</td>
                        <td>{payment.currency || '$'}{payment.amount?.toFixed(2) || '0.00'}</td>
                        <td>
                          <Badge pill bg={payment.status === 'Paid' ? 'success' : 'warning'} style={styles.badge}>
                            {payment.status || 'N/A'}
                          </Badge>
                        </td>
                        <td>{formatDate(payment.date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <EmptyState message="No payment history available." icon={<FaCreditCard />} />
              )}
            </Card.Body>
          </Card>
           {/* Event Information */}
           <Card style={styles.card}>
            <Card.Header style={styles.cardHeader}>
              <FaInfoCircle style={styles.icon}/><h5 style={styles.cardTitle}>Event Information</h5>
            </Card.Header>
            <Card.Body className="p-4">
                <ListGroup variant="flush">
                  <ListGroup.Item style={{...styles.listItem, borderTop: 'none'}}> {/* No top border for the first item */}
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <FaCalendarAlt style={{...styles.icon, fontSize: '1rem', color: '#6c757d', marginRight: '0.5rem'}} />
                      <span style={styles.listItemLabel}>Upcoming Deadlines</span>
                    </div>
                    {dashboardData.upcomingDeadlines && dashboardData.upcomingDeadlines.length > 0 ?
                      dashboardData.upcomingDeadlines.map((deadline, i) => (
                        <span key={i} style={{...styles.listItemValue, display: 'block', textAlign: 'right', marginTop: i > 0 ? '0.3rem' : '0'}}>
                          {deadline.name}: {formatDate(deadline.date, false)}
                        </span>
                      )) :
                      <span style={styles.listItemValue}><em className="text-muted">No upcoming deadlines for this event. (Configured by Admin)</em></span>
                    }
                  </ListGroup.Item>
                  <ListGroup.Item style={styles.listItem}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <FaClock style={{...styles.icon, fontSize: '1rem', color: '#6c757d', marginRight: '0.5rem'}} />
                      <span style={styles.listItemLabel}>Event Schedule Details</span>
                    </div>
                    <span style={styles.listItemValue}>
                      {dashboardData.schedule && dashboardData.schedule.length > 0 ? 
                        "View Schedule" /* Placeholder for actual schedule link/modal */ : 
                        <em className="text-muted">Event schedule details will be available here soon.</em>
                      }
                    </span>
                  </ListGroup.Item>
                </ListGroup>
            </Card.Body>
          </Card>

        </Col>
      </Row>

      {/* Badge Preview Modal Render */}
      {registration && (
        <BadgePreviewModal 
          show={showBadgeModal} 
          handleClose={() => setShowBadgeModal(false)} 
          registrationData={registration} 
          eventInfo={eventInfo} 
          handleDownloadBadgeClick={handleDownloadBadge}
        />
      )}

    </Container>
  );
};

export default RegistrantDashboard;