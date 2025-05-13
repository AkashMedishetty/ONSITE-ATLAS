import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Alert, Spinner, Table, Form, InputGroup, Modal } from 'react-bootstrap';
import { useParams, Link } from 'react-router-dom';
import { FaFileAlt, FaDownload, FaPlusCircle, FaSearch, FaFilter, FaSort, FaInfoCircle, FaSync, FaEdit, FaTrash, FaEye } from 'react-icons/fa';
import { abstractService } from '../../services';
import apiRegistrant from '../../services/apiRegistrant';
import { useRegistrantAuth } from '../../contexts/RegistrantAuthContext';
import { useActiveEvent } from '../../contexts/ActiveEventContext';
import { toast } from 'react-toastify';

const AbstractsList = () => {
  const { abstractId: paramAbstractId } = useParams(); // If an abstractId is in path
  const { activeEventId } = useActiveEvent(); // Get eventId from context
  
  const { currentRegistrant } = useRegistrantAuth();
  const [abstracts, setAbstracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState('submissionDate');
  const [sortDirection, setSortDirection] = useState('desc');
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [abstractToDelete, setAbstractToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Determine the eventId to use from context
  const eventIdToUse = activeEventId;
  
  useEffect(() => {
    console.log('AbstractsList component mounted, fetching abstracts...');
    console.log('Event ID for fetching abstracts (from ActiveEventContext):', eventIdToUse);
    console.log('Current Registrant (for ID):', currentRegistrant);
    
    if (!eventIdToUse && !paramAbstractId) { 
      setError('Please select an event to view abstracts, or ensure an event context is active.');
      setLoading(false);
      setAbstracts([]); 
      return; 
    }
    if (!currentRegistrant?._id && !paramAbstractId) { // Also need registrant ID if not fetching a specific abstract by its own ID
      setError('Registrant information not available. Cannot fetch abstracts.');
      setLoading(false);
      setAbstracts([]);
      return;
    }
    fetchAbstracts();
  }, [eventIdToUse, paramAbstractId, currentRegistrant]); // Add currentRegistrant to dependency array
  
  const fetchAbstracts = async () => {
    try {
      setLoading(true);
      setError(null);

      if (paramAbstractId) {
        console.log(`Fetching specific abstract ${paramAbstractId} using abstractService.getAbstractById...`);
        // Ensure eventIdToUse is available; if not, this call might be problematic or need adjustment
        if (!eventIdToUse) {
            console.warn("[AbstractsList] Event ID not available for fetching single abstract. This could lead to issues if the service requires it for all paths.");
            // Consider how to handle this: error out, or attempt call if service can work without it (unlikely for /events/... path)
        }
        const singleAbstractResponse = await abstractService.getAbstractById(eventIdToUse, paramAbstractId); 
        if (singleAbstractResponse.success && singleAbstractResponse.data) {
            setAbstracts([singleAbstractResponse.data]);
        } else {
            throw new Error(singleAbstractResponse.message || 'Failed to fetch single abstract details.');
        }
      } else if (eventIdToUse && currentRegistrant?._id) {
        console.log(`Fetching abstracts for event ${eventIdToUse} and registrant ${currentRegistrant._id} using abstractService.getAbstracts...`);
        const response = await abstractService.getAbstracts(eventIdToUse, { registration: currentRegistrant._id });
        if (response.success) {
          setAbstracts(response.data || []);
          if (response.data && response.data.length === 0) {
            setError(`You have no abstracts submitted for this event yet. Click "Submit New Abstract" to create one.`);
          }
        } else {
          throw new Error(response.message || 'Failed to fetch abstracts');
        }
      } else {
        console.warn('Attempting to fetch abstracts without eventId or registrantId.');
        setAbstracts([]); // Set to empty if conditions not met
      }
      
      console.log(`Successfully loaded abstracts`);
    } catch (err) {
      console.error('Failed to load abstracts:', err);
      setError(`Failed to load abstracts: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDownload = async (abstractId) => {
    try {
      console.log(`[AbstractsList] Attempting to download abstract ${abstractId}...`);
      const abstract = abstracts.find(a => a._id === abstractId);

      if (!abstract) {
        toast.error("Abstract details not found to initiate download.");
        return;
      }
      
      // Prefer direct fileUrl if available (mirroring AbstractPortal behavior)
      if (abstract.fileUrl) {
        console.log('[AbstractsList] Using direct file URL from abstract data:', abstract.fileUrl);
        window.open(abstract.fileUrl, '_blank');
        toast.success('File download initiated via direct URL.');
        return;
      }
      
      // Fallback to API download if no direct fileUrl
      // This uses an endpoint that should be secured for the registrant
      console.log(`[AbstractsList] No direct fileUrl. Attempting API download for abstract ${abstractId} under event ${eventIdToUse}.`);
      if (!eventIdToUse) {
          toast.error("Cannot download file: Event ID is missing.");
          console.error("[AbstractsList] Event ID missing for API download call.");
          return;
      }

      // Using apiRegistrant directly for this specific endpoint pattern, similar to original working code for downloads.
      // The service layer doesn't have a specific function for this GET pattern with responseType blob.
      const response = await apiRegistrant.get(`/events/${eventIdToUse}/abstracts/${abstractId}/file`, { 
        responseType: 'blob' 
      });
      
      const suggestedFilename = response.headers['content-disposition']
        ?.split('filename=')[1]?.replace(/"/g, '') || `abstract-${abstractId}.pdf`; // Default or from header

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', suggestedFilename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Abstract downloaded successfully via API.');

    } catch (err) {
      console.error('[AbstractsList] Failed to download abstract:', err);
      toast.error(err.response?.data?.message || err.message || 'Failed to download the abstract.');
    }
  };

  const handleDeleteClick = (abstract) => {
    setAbstractToDelete(abstract);
    setShowDeleteModal(true);
  };

  const confirmDeleteAbstract = async () => {
    if (!abstractToDelete) return;
    
    if (!eventIdToUse) {
        console.error("[AbstractsList] Event ID is missing, cannot delete abstract.");
        toast.error("Cannot delete abstract: Event ID is missing.");
        setIsDeleting(false);
        return;
    }

    setIsDeleting(true);
    try {
      // Make sure abstractToDelete._id is valid
      if (!abstractToDelete._id) {
        toast.error("Cannot delete abstract: Abstract ID is missing.");
        setIsDeleting(false);
        return;
      }
      console.log(`[AbstractsList] Deleting abstract ${abstractToDelete._id} for event ${eventIdToUse}`);
      const response = await abstractService.deleteAbstract(eventIdToUse, abstractToDelete._id);
      if (response.success) {
        setAbstracts(prevAbstracts => prevAbstracts.filter(abs => abs._id !== abstractToDelete._id));
        toast.success(response.message || 'Abstract deleted successfully.');
        setShowDeleteModal(false);
        setAbstractToDelete(null);
      } else {
        // Log the full response for debugging if needed
        console.error("[AbstractsList] Delete abstract failed with response:", response);
        throw new Error(response.message || 'Failed to delete abstract from service.');
      }
    } catch (err) {
      console.error('[AbstractsList] Error during abstract deletion process:', err);
      toast.error(err.message || 'An unexpected error occurred while deleting the abstract.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Sort abstracts based on current sort field and direction
  const sortedAbstracts = Array.isArray(abstracts) ? [...abstracts].sort((a, b) => {
    let valueA, valueB;
    
    if (sortField === 'submissionDate') {
      valueA = new Date(a.submissionDate);
      valueB = new Date(b.submissionDate);
    } else if (sortField === 'title') {
      valueA = a.title.toLowerCase();
      valueB = b.title.toLowerCase();
    } else if (sortField === 'status') {
      valueA = a.status ? a.status.toLowerCase() : '';
      valueB = b.status ? b.status.toLowerCase() : '';
    } else if (sortField === 'event') {
      valueA = a.event?.name?.toLowerCase() || '';
      valueB = b.event?.name?.toLowerCase() || '';
    }
    
    if (sortDirection === 'asc') {
      return valueA > valueB ? 1 : -1;
    } else {
      return valueA < valueB ? 1 : -1;
    }
  }) : [];

  // Filter abstracts based on search term and status filter
  const filteredAbstracts = sortedAbstracts.filter(abstract => {
    const searchTermLower = searchTerm.toLowerCase();
    const matchesSearch = 
      abstract.title?.toLowerCase().includes(searchTermLower) ||
      abstract.submissionId?.toLowerCase().includes(searchTermLower) ||
      (abstract.authors && Array.isArray(abstract.authors) ?
        abstract.authors.some(author => 
          `${author.firstName} ${author.lastName}`.toLowerCase().includes(searchTermLower) ||
          author.email?.toLowerCase().includes(searchTermLower)
        ) : 
        typeof abstract.authors === 'string' && abstract.authors.toLowerCase().includes(searchTermLower)) ||
      abstract.category?.name?.toLowerCase().includes(searchTermLower) ||
      (abstract.keywords && Array.isArray(abstract.keywords) && abstract.keywords.some(k => k.toLowerCase().includes(searchTermLower)));
    
    const matchesStatus = statusFilter === 'all' || abstract.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getStatusBadge = (status) => {
    const statusLower = status ? status.toLowerCase() : 'unknown';
    switch (statusLower) {
      case 'accepted':
      case 'approved':
        return <Badge bg="success">{status}</Badge>;
      case 'rejected':
        return <Badge bg="danger">{status}</Badge>;
      case 'pending':
      case 'under-review':
      case 'submitted':
      case 'revision-requested':
        return <Badge bg="warning" text={statusLower === 'pending' || statusLower === 'submitted' ? 'dark' : undefined}>{status}</Badge>;
      default:
        return <Badge bg="secondary">{status || 'Unknown'}</Badge>;
    }
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <Spinner animation="border" role="status" variant="primary">
          <span className="visually-hidden">Loading abstracts...</span>
        </Spinner>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-4">
        <Card className="border-0 shadow-sm mb-4">
          <Card.Body className="p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h1 className="h3 mb-2">My Abstracts</h1>
                <p className="text-muted mb-0">Manage your research submissions and track their status</p>
              </div>
              <Link to="/registrant-portal/abstracts/new">
                <Button variant="primary" className="d-flex align-items-center">
                  <FaPlusCircle className="me-2" />
                  Submit New Abstract
                </Button>
              </Link>
            </div>
            <Alert variant={error.includes('no abstracts') ? 'info' : 'danger'}>
              <Alert.Heading>{error.includes('no abstracts') ? 'No Abstracts Found' : 'Error Loading Abstracts'}</Alert.Heading>
              <p>{error}</p>
              {!error.includes('no abstracts') && (
                <Button onClick={fetchAbstracts} variant="outline-danger" className="mt-2">
                  <FaSync className="me-2" />
                  Try Again
                </Button>
              )}
            </Alert>
          </Card.Body>
        </Card>
      </Container>
    );
  }
  
  return (
    <Container className="py-4">
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body className="p-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h1 className="h3 mb-2">My Abstracts</h1>
              <p className="text-muted mb-0">Manage your research submissions and track their status</p>
            </div>
        <Link
              to={eventIdToUse ? `/registrant-portal/abstracts/new?event=${eventIdToUse}` : "/registrant-portal/abstracts/new"}
        >
              <Button variant="primary" className="d-flex align-items-center">
                <FaPlusCircle className="me-2" />
          Submit New Abstract
              </Button>
        </Link>
      </div>
      
          {/* Search and Filters */}
          <Row className="mb-4">
            <Col md={6} className="mb-3 mb-md-0">
              <InputGroup>
                <InputGroup.Text>
                  <FaSearch />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search by title, author, or keywords..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={3} className="mb-3 mb-md-0">
              <InputGroup>
                <InputGroup.Text>
                  <FaFilter />
                </InputGroup.Text>
                <Form.Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  aria-label="Filter by status"
                >
                  <option value="all">All Statuses</option>
                  <option value="submitted">Submitted</option>
                  <option value="under-review">Under Review</option>
                  <option value="revision-requested">Revision Requested</option>
                  <option value="accepted">Accepted</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="pending">Pending</option>
                </Form.Select>
              </InputGroup>
            </Col>
            <Col md={3}>
              <InputGroup>
                <InputGroup.Text>
                  <FaSort />
                </InputGroup.Text>
                <Form.Select
                  value={sortField}
                  onChange={(e) => handleSort(e.target.value)}
                  aria-label="Sort by field"
                >
                  <option value="submissionDate">Submission Date</option>
                  <option value="title">Title</option>
                  <option value="status">Status</option>
                </Form.Select>
              </InputGroup>
            </Col>
          </Row>

          {filteredAbstracts.length === 0 ? (
            <Alert variant="info">
              <div className="text-center p-4">
                <FaFileAlt size={40} className="text-muted mb-3" />
                <h5>No abstracts found</h5>
                <p className="mb-0">
                  {searchTerm || statusFilter !== 'all' 
                    ? "No abstracts match your search criteria. Try adjusting your filters."
                    : "You haven't submitted any abstracts yet. Click 'Submit New Abstract' to get started."}
                </p>
        </div>
            </Alert>
      ) : (
        <>
              {/* Desktop view - table */}
              <div className="d-none d-lg-block">
                <Table responsive hover className="abstracts-table">
                  <thead>
                    <tr>
                      <th className="clickable" onClick={() => handleSort('title')}>
                        Title {sortField === 'title' && (
                          <FaSort className={`ms-1 ${sortDirection === 'asc' ? 'ascending' : 'descending'}`} size={12} />
                        )}
                      </th>
                      <th className="clickable" onClick={() => handleSort('submissionDate')}>
                        Submitted {sortField === 'submissionDate' && (
                          <FaSort className={`ms-1 ${sortDirection === 'asc' ? 'ascending' : 'descending'}`} size={12} />
                        )}
                      </th>
                      <th className="clickable" onClick={() => handleSort('status')}>
                        Status {sortField === 'status' && (
                          <FaSort className={`ms-1 ${sortDirection === 'asc' ? 'ascending' : 'descending'}`} size={12} />
                        )}
                      </th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                    {filteredAbstracts.map(abstract => {
                      const isEditable = abstract.status?.toLowerCase() !== 'accepted' && abstract.status?.toLowerCase() !== 'approved' && abstract.status?.toLowerCase() !== 'rejected';
                      return (
                        <tr key={abstract._id}>
                          <td>
                            <div className="fw-bold">{abstract.title || 'N/A'}</div>
                            <div className="small text-muted">ID: {abstract.submissionId || abstract._id}</div>
                          </td>
                          <td>
                            {new Date(abstract.submissionDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </td>
                          <td>{getStatusBadge(abstract.status)}</td>
                          <td>
                            <div className="d-flex gap-2">
                              <Link to={`/registrant-portal/abstracts/${abstract._id}?event=${eventIdToUse}`} className="w-100">
                                <Button variant="outline-primary" size="sm" className="w-100">View Details</Button>
                              </Link>
                              {isEditable && (
                                <Button 
                                  variant="outline-secondary" 
                                  size="sm" 
                                  as={Link}
                                  to={`/registrant-portal/abstracts/${abstract._id}/edit?event=${eventIdToUse}`}
                                  className="w-100"
                                  title="Edit Abstract"
                                >
                                  <FaEdit className="me-1" /> Edit
                                </Button>
                              )}
                              {abstract.fileUrl && (
                                <Button 
                                  variant="outline-info" 
                                  size="sm" 
                                  onClick={() => handleDownload(abstract._id)}
                                  className="w-100"
                                  title="Download File"
                                >
                                  <FaDownload className="me-1" /> Download
                                </Button>
                              )}
                              {isEditable && (
                                <Button 
                                  variant="outline-danger" 
                                  size="sm" 
                                  onClick={() => handleDeleteClick(abstract)}
                                  className="w-100"
                                  title="Delete Abstract"
                                >
                                  <FaTrash className="me-1" /> Delete
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </Table>
              </div>

              {/* Mobile view - cards */}
              <div className="d-lg-none">
                {filteredAbstracts.map(abstract => {
                  const isEditable = abstract.status?.toLowerCase() !== 'accepted' && abstract.status?.toLowerCase() !== 'approved' && abstract.status?.toLowerCase() !== 'rejected';
                  return (
                    <Card key={abstract._id} className="mb-3 border-0 shadow-sm">
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <h5 className="mb-0">{abstract.title || 'N/A'}</h5>
                          {getStatusBadge(abstract.status)}
                        </div>
                        <p className="text-muted small mb-2">ID: {abstract.submissionId || abstract._id}</p>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <div className="small text-muted">
                            Submitted: {new Date(abstract.submissionDate).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="d-flex gap-2">
                          <Link to={`/registrant-portal/abstracts/${abstract._id}?event=${eventIdToUse}`} className="w-100">
                            <Button variant="outline-primary" size="sm" className="w-100">View Details</Button>
                          </Link>
                          {isEditable && (
                            <Button 
                              variant="outline-secondary" 
                              size="sm" 
                              as={Link}
                              to={`/registrant-portal/abstracts/${abstract._id}/edit?event=${eventIdToUse}`}
                              className="w-100"
                              title="Edit Abstract"
                            >
                              <FaEdit className="me-1" /> Edit
                            </Button>
                          )}
                          {abstract.fileUrl && (
                            <Button 
                              variant="outline-info" 
                              size="sm" 
                              onClick={() => handleDownload(abstract._id)}
                              className="w-100"
                              title="Download File"
                            >
                              <FaDownload className="me-1" /> Download
                            </Button>
                          )}
                          {isEditable && (
                            <Button 
                              variant="outline-danger" 
                              size="sm" 
                              onClick={() => handleDeleteClick(abstract)}
                              className="w-100"
                              title="Delete Abstract"
                            >
                              <FaTrash className="me-1" /> Delete
                            </Button>
                          )}
                        </div>
                      </Card.Body>
                    </Card>
                  );
                })}
            </div>
            </>
          )}
        </Card.Body>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete the abstract titled "<strong>{abstractToDelete?.title}</strong>"? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDeleteAbstract} disabled={isDeleting}>
            {isDeleting ? <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-1" /> Deleting...</> : 'Delete'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AbstractsList; 
               