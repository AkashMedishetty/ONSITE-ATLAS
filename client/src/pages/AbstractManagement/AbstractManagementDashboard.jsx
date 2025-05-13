import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Table,
  Form,
  Badge,
  Modal,
  Alert,
  Spinner,
  Tabs,
  Tab,
  InputGroup,
  DropdownButton,
  Dropdown
} from 'react-bootstrap';
import { FiSearch, FiFilter, FiDownload, FiUserPlus, FiCheckCircle, FiXCircle, FiClock } from 'react-icons/fi';
import Swal from 'sweetalert2';
import Select from 'react-select';
import abstractService from '../../services/abstractService';
import abstractSettingsService from '../../services/abstractSettingsService';

const AbstractManagementDashboard = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  
  // State for abstracts data
  const [abstracts, setAbstracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    reviewer: ''
  });
  
  // State for reviewer assignment
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedAbstractId, setSelectedAbstractId] = useState(null);
  const [reviewers, setReviewers] = useState([]);
  const [selectedReviewers, setSelectedReviewers] = useState([]);
  const [assigningReviewers, setAssigningReviewers] = useState(false);
  
  // State for decision modal
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [decisionType, setDecisionType] = useState('');
  const [decisionComments, setDecisionComments] = useState('');
  const [submittingDecision, setSubmittingDecision] = useState(false);
  
  // State for revision request modal
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionInstructions, setRevisionInstructions] = useState('');
  const [revisionDeadline, setRevisionDeadline] = useState('');
  const [submittingRevision, setSubmittingRevision] = useState(false);
  
  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inReview: 0,
    accepted: 0,
    rejected: 0,
    revisionRequested: 0
  });

  useEffect(() => {
    fetchAbstracts();
    fetchReviewers();
  }, [eventId]);

  const fetchAbstracts = async () => {
    try {
      setLoading(true);
      const response = await abstractService.getAbstractsByEvent(eventId);
      
      if (response.success) {
        setAbstracts(response.data || []);
        
        // Calculate statistics
        const statsData = {
          total: response.data?.length || 0,
          pending: response.data?.filter(a => a.status === 'pending').length || 0,
          inReview: response.data?.filter(a => a.status === 'in-review').length || 0,
          accepted: response.data?.filter(a => a.status === 'accepted').length || 0,
          rejected: response.data?.filter(a => a.status === 'rejected').length || 0,
          revisionRequested: response.data?.filter(a => a.status === 'revision-requested').length || 0
        };
        setStats(statsData);
      } else {
        throw new Error(response.message || 'Failed to load abstracts');
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching abstracts:', err);
      setError(err.message || 'Failed to load abstracts. Please try again later.');
      setLoading(false);
    }
  };

  const fetchReviewers = async () => {
    try {
      const response = await abstractSettingsService.getReviewers(eventId);
      if (response.success) {
        setReviewers(response.data || []);
      } else {
        console.error('Failed to fetch reviewers:', response.message);
        setReviewers([]);
      }
    } catch (err) {
      console.error('Error fetching reviewers:', err);
      setReviewers([]);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters({
      ...filters,
      [filterType]: value
    });
  };

  const filteredAbstracts = abstracts.filter(abstract => {
    const matchesSearch = searchTerm === '' || 
      abstract.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      abstract.author.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (abstract.abstractNumber && abstract.abstractNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = filters.status === '' || abstract.status === filters.status;
    const matchesCategory = filters.category === '' || abstract.category === filters.category;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const handleExportData = () => {
    // CSV export implementation
    const headers = ['Abstract ID', 'Title', 'Author', 'Category', 'Status', 'Submission Date'];
    
    const csvContent = [
      headers.join(','),
      ...filteredAbstracts.map(abstract => [
        abstract.abstractNumber || abstract._id,
        `"${abstract.title.replace(/"/g, '""')}"`,
        `"${abstract.author.name.replace(/"/g, '""')}"`,
        `"${abstract.category.replace(/"/g, '""')}"`,
        abstract.status,
        new Date(abstract.createdAt).toLocaleDateString()
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `abstracts-export-${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openAssignReviewersModal = (abstractId) => {
    setSelectedAbstractId(abstractId);
    setSelectedReviewers([]);
    setShowAssignModal(true);
  };

  const handleAssignReviewers = async () => {
    if (selectedReviewers.length === 0) {
      Swal.fire({ title: 'Error', text: 'Please select at least one reviewer.', icon: 'error' });
      return;
    }
    
    try {
      setAssigningReviewers(true);
      const reviewerIdsToAssign = selectedReviewers.map(r => r.value);
      const assignResponse = await abstractService.assignReviewers(eventId, selectedAbstractId, reviewerIdsToAssign);

      if (!assignResponse || !assignResponse.success) {
        throw new Error(assignResponse.message || 'Failed to assign reviewers');
      }

      const abstract = abstracts.find(a => a._id === selectedAbstractId);
      if (abstract && abstract.status === 'pending') {
        const statusUpdateResponse = await abstractService.updateAbstractStatus(eventId, selectedAbstractId, 'in-review');
        if (!statusUpdateResponse || !statusUpdateResponse.success) {
          console.warn('Failed to update abstract status to in-review:', statusUpdateResponse.message);
        }
      }
      
      setShowAssignModal(false);
      fetchAbstracts();
      
      Swal.fire({ title: 'Success', text: assignResponse.message || 'Reviewers assigned successfully.', icon: 'success' });
    } catch (err) {
      console.error('Error assigning reviewers:', err);
      Swal.fire({ title: 'Error', text: err.message || 'Failed to assign reviewers.', icon: 'error' });
    } finally {
      setAssigningReviewers(false);
    }
  };

  const openDecisionModal = (abstractId, type) => {
    setSelectedAbstractId(abstractId);
    setDecisionType(type);
    setDecisionComments('');
    setShowDecisionModal(true);
  };

  const handleSubmitDecision = async () => {
    try {
      setSubmittingDecision(true);
      let response;
      const decisionData = { reason: decisionComments };

      if (decisionType === 'accept') {
        response = await abstractService.approveAbstract(eventId, selectedAbstractId);
      } else if (decisionType === 'reject') {
        response = await abstractService.rejectAbstract(eventId, selectedAbstractId, decisionData);
      } else {
        throw new Error('Invalid decision type for submission.');
      }
      
      if (!response || !response.success) {
        throw new Error(response.message || 'Failed to submit decision.');
      }

      setShowDecisionModal(false);
      fetchAbstracts();
      Swal.fire({ title: 'Success', text: response.message || `Abstract ${decisionType}ed successfully.`, icon: 'success' });
    } catch (err) {
      console.error('Error submitting decision:', err);
      Swal.fire({ title: 'Error', text: err.message || 'Failed to submit decision.', icon: 'error' });
    } finally {
      setSubmittingDecision(false);
    }
  };

  const openRevisionModal = (abstractId) => {
    setSelectedAbstractId(abstractId);
    setRevisionInstructions('');
    setRevisionDeadline('');
    setShowRevisionModal(true);
  };

  const handleRequestRevision = async () => {
    if (!revisionInstructions.trim()) {
      Swal.fire({ title: 'Error', text: 'Please provide revision instructions.', icon: 'error' });
      return;
    }
    
    try {
      setSubmittingRevision(true);
      const revisionData = {
        instructions: revisionInstructions,
        deadline: revisionDeadline || null
      };
      const response = await abstractService.requestRevision(eventId, selectedAbstractId, revisionData);

      if (!response || !response.success) {
        throw new Error(response.message || 'Failed to request revision.');
      }
      
      setShowRevisionModal(false);
      fetchAbstracts();
      Swal.fire({ title: 'Success', text: response.message || 'Revision requested successfully.', icon: 'success' });
    } catch (err) {
      console.error('Error requesting revision:', err);
      Swal.fire({ title: 'Error', text: err.message || 'Failed to request revision.', icon: 'error' });
    } finally {
      setSubmittingRevision(false);
    }
  };

  const handleViewAbstract = (abstractId) => {
    navigate(`/events/${eventId}/abstracts/${abstractId}`);
  };

  const renderStatusBadge = (status) => {
    let variant;
    let icon;
    
    switch (status) {
      case 'pending':
        variant = 'warning';
        icon = <FiClock className="me-1" />;
        break;
      case 'in-review':
        variant = 'info';
        icon = <FiSearch className="me-1" />;
        break;
      case 'accepted':
        variant = 'success';
        icon = <FiCheckCircle className="me-1" />;
        break;
      case 'rejected':
        variant = 'danger';
        icon = <FiXCircle className="me-1" />;
        break;
      case 'revision-requested':
        variant = 'secondary';
        icon = <FiClock className="me-1" />;
        break;
      default:
        variant = 'light';
        icon = null;
    }
    
    return (
      <Badge bg={variant} className="text-uppercase">
        {icon} {status.replace('-', ' ')}
      </Badge>
    );
  };

  const getUniqueCategories = () => {
    const categories = abstracts.map(abstract => abstract.category).filter(Boolean);
    return [...new Set(categories)].sort();
  };

  if (loading) {
    return (
      <Container className="my-4 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-2">Loading abstracts...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="my-4">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="abstract-management-dashboard py-4">
      <h2 className="mb-4">Abstract Management</h2>
      
      {/* Stats Dashboard */}
      <Row className="mb-4">
        <Col md={2}>
          <Card className="text-center h-100">
            <Card.Body>
              <h6 className="text-muted">Total</h6>
              <h3>{stats.total}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="text-center h-100 border-warning">
            <Card.Body>
              <h6 className="text-warning">Pending</h6>
              <h3>{stats.pending}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="text-center h-100 border-info">
            <Card.Body>
              <h6 className="text-info">In Review</h6>
              <h3>{stats.inReview}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="text-center h-100 border-success">
            <Card.Body>
              <h6 className="text-success">Accepted</h6>
              <h3>{stats.accepted}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="text-center h-100 border-danger">
            <Card.Body>
              <h6 className="text-danger">Rejected</h6>
              <h3>{stats.rejected}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="text-center h-100 border-secondary">
            <Card.Body>
              <h6 className="text-secondary">Revision</h6>
              <h3>{stats.revisionRequested}</h3>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Toolbar */}
      <Card className="mb-4">
        <Card.Body>
          <Row className="align-items-center">
            <Col md={4}>
              <InputGroup>
                <InputGroup.Text>
                  <FiSearch />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search by title, author or abstract ID..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </InputGroup>
            </Col>
            <Col md={6}>
              <Row>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Status</Form.Label>
                    <Form.Select 
                      value={filters.status} 
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                    >
                      <option value="">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="in-review">In Review</option>
                      <option value="accepted">Accepted</option>
                      <option value="rejected">Rejected</option>
                      <option value="revision-requested">Revision Requested</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Category</Form.Label>
                    <Form.Select 
                      value={filters.category} 
                      onChange={(e) => handleFilterChange('category', e.target.value)}
                    >
                      <option value="">All Categories</option>
                      {getUniqueCategories().map((category, index) => (
                        <option key={index} value={category}>{category}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Reviewer</Form.Label>
                    <Form.Select 
                      value={filters.reviewer} 
                      onChange={(e) => handleFilterChange('reviewer', e.target.value)}
                    >
                      <option value="">All Reviewers</option>
                      {reviewers.map((reviewer) => (
                        <option key={reviewer._id} value={reviewer._id}>
                          {reviewer.name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
            </Col>
            <Col md={2} className="text-end">
              <Button variant="outline-primary" onClick={handleExportData}>
                <FiDownload className="me-1" /> Export
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      
      {/* Abstracts Table */}
      <Card>
        <Card.Body>
          <div className="table-responsive">
            <Table className="abstract-table">
              <thead>
                <tr>
                  <th>Abstract ID</th>
                  <th>Title</th>
                  <th>Author</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Reviewers</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAbstracts.length > 0 ? (
                  filteredAbstracts.map((abstract) => (
                    <tr key={abstract._id}>
                      <td>{abstract.abstractNumber || abstract._id.substr(0, 8)}</td>
                      <td>
                        <div className="abstract-title" onClick={() => handleViewAbstract(abstract._id)}>
                          {abstract.title}
                        </div>
                      </td>
                      <td>{abstract.author.name}</td>
                      <td>{abstract.category}</td>
                      <td>{renderStatusBadge(abstract.status)}</td>
                      <td>
                        {abstract.reviewers.length > 0 ? (
                          <Badge bg="secondary">{abstract.reviewers.length}</Badge>
                        ) : (
                          <span className="text-muted">None</span>
                        )}
                      </td>
                      <td>{new Date(abstract.createdAt).toLocaleDateString()}</td>
                      <td>
                        <DropdownButton
                          variant="outline-secondary"
                          size="sm"
                          title="Actions"
                        >
                          <Dropdown.Item onClick={() => handleViewAbstract(abstract._id)}>
                            View Details
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => openAssignReviewersModal(abstract._id)}>
                            <FiUserPlus className="me-1" /> Assign Reviewers
                          </Dropdown.Item>
                          <Dropdown.Divider />
                          <Dropdown.Item 
                            onClick={() => openDecisionModal(abstract._id, 'accept')}
                            className="text-success"
                          >
                            <FiCheckCircle className="me-1" /> Accept
                          </Dropdown.Item>
                          <Dropdown.Item 
                            onClick={() => openRevisionModal(abstract._id)}
                            className="text-warning"
                          >
                            <FiClock className="me-1" /> Request Revision
                          </Dropdown.Item>
                          <Dropdown.Item 
                            onClick={() => openDecisionModal(abstract._id, 'reject')}
                            className="text-danger"
                          >
                            <FiXCircle className="me-1" /> Reject
                          </Dropdown.Item>
                        </DropdownButton>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="text-center py-4">
                      No abstracts found matching the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>
      
      {/* Reviewers Assignment Modal */}
      <Modal show={showAssignModal} onHide={() => setShowAssignModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Assign Reviewers</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Select Reviewers</Form.Label>
            <Select
              isMulti
              options={reviewers.map(reviewer => ({
                value: reviewer._id,
                label: `${reviewer.name} (${reviewer.email})`
              }))}
              onChange={setSelectedReviewers}
              value={selectedReviewers}
              placeholder="Select reviewers..."
              className="reviewer-select"
            />
            <Form.Text className="text-muted">
              Assign at least one reviewer to evaluate this abstract.
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAssignModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleAssignReviewers} 
            disabled={assigningReviewers}
          >
            {assigningReviewers ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                Assigning...
              </>
            ) : 'Assign Reviewers'}
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Decision Modal */}
      <Modal show={showDecisionModal} onHide={() => setShowDecisionModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {decisionType === 'accept' ? 'Accept Abstract' : 'Reject Abstract'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Are you sure you want to <strong>{decisionType === 'accept' ? 'accept' : 'reject'}</strong> this abstract?
          </p>
          <Form.Group className="mb-3">
            <Form.Label>Comments (Optional)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={decisionComments}
              onChange={(e) => setDecisionComments(e.target.value)}
              placeholder="Add comments for the author..."
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDecisionModal(false)}>
            Cancel
          </Button>
          <Button 
            variant={decisionType === 'accept' ? 'success' : 'danger'} 
            onClick={handleSubmitDecision}
            disabled={submittingDecision}
          >
            {submittingDecision ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                Submitting...
              </>
            ) : (
              decisionType === 'accept' ? 'Accept Abstract' : 'Reject Abstract'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Revision Request Modal */}
      <Modal show={showRevisionModal} onHide={() => setShowRevisionModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Request Revision</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Revision Instructions</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              value={revisionInstructions}
              onChange={(e) => setRevisionInstructions(e.target.value)}
              placeholder="Provide detailed instructions for the author..."
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Revision Deadline (Optional)</Form.Label>
            <Form.Control
              type="date"
              value={revisionDeadline}
              onChange={(e) => setRevisionDeadline(e.target.value)}
            />
            <Form.Text className="text-muted">
              Leave blank for no specific deadline.
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRevisionModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="warning" 
            onClick={handleRequestRevision}
            disabled={submittingRevision}
          >
            {submittingRevision ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                Requesting...
              </>
            ) : 'Request Revision'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AbstractManagementDashboard; 