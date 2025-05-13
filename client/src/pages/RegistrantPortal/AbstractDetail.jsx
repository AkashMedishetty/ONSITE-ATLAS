import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, Row, Col, Badge, Button, Alert, Spinner, Modal } from 'react-bootstrap';
import { FiEdit, FiDownload, FiCheckSquare, FiXSquare, FiMessageSquare } from 'react-icons/fi';
import { toast } from 'react-toastify';
import DOMPurify from 'dompurify';

import abstractService from '../../services/abstractService';
import apiRegistrant from '../../services/apiRegistrant';
import { useRegistrantAuth } from '../../contexts/RegistrantAuthContext';
import AbstractSubmissionForm from './AbstractSubmissionForm';
import { eventService } from '../../services';

const AbstractDetail = () => {
  const { abstractId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentRegistrant } = useRegistrantAuth();
  
  const [abstract, setAbstract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [categories, setCategories] = useState([]);
  
  useEffect(() => {
    const eventId = searchParams.get('event');
    if (abstractId && eventId) {
      fetchAbstractDetails(eventId, abstractId);
      fetchCategories(eventId);
    } else {
      setError('Missing Abstract ID or Event ID in URL.');
      setLoading(false);
    }
  }, [abstractId, searchParams]);
  
  const fetchAbstractDetails = async (eventId, absId) => {
    try {
      setLoading(true);
      console.log(`[AbstractDetail] Fetching details for abstract ${absId} and event ${eventId} using getAbstractById.`);
      const response = await abstractService.getAbstractById(eventId, absId);
      
      if (response && response.success && response.data) {
        setAbstract(response.data);
      } else {
        const errorMessage = response?.message || 'Failed to load abstract details. Service call may have failed or returned unexpected data.';
        setError(errorMessage);
        console.warn("[AbstractDetail] Failed to fetch abstract details, response:", response);
      }
    } catch (err) {
      console.error('Error in fetchAbstractDetails:', err);
      setError(`An error occurred while fetching the abstract details: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchCategories = async (eventId) => {
    try {
      const response = await eventService.getEventById(eventId);
      if (response.success && response.data?.abstractSettings?.categories) {
        setCategories(response.data.abstractSettings.categories);
      } else {
        setCategories([]);
      }
    } catch (err) {
      setCategories([]);
    }
  };
  
  const handleDownload = async () => {
    const eventId = searchParams.get('event');
    if (!eventId || !abstract || !abstract._id) {
      toast.error("Cannot download: Missing event ID or abstract details.");
      return;
    }
    try {
      if (abstract.fileUrl) {
        console.log("[AbstractDetail] Attempting download via direct fileUrl:", abstract.fileUrl);
        window.open(abstract.fileUrl, '_blank');
        toast.success('File download initiated via direct URL.');
        return;
      }

      console.log(`[AbstractDetail] No direct fileUrl. Attempting API download for abstract ${abstract._id} under event ${eventId}.`);
      const response = await apiRegistrant.get(`/events/${eventId}/abstracts/${abstract._id}/file`, { 
        responseType: 'blob' 
      });
      
      const suggestedFilename = response.headers['content-disposition']
        ?.split('filename=')[1]?.replace(/"/g, '') || `abstract-${abstract._id}.pdf`;

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
      console.error('Error downloading abstract:', err);
      toast.error(err.response?.data?.message || err.message || 'Failed to download abstract');
    }
  };
  
  const handleEditSuccess = (updatedAbstract) => {
    setAbstract(updatedAbstract);
    setShowEditModal(false);
    toast.success('Abstract updated successfully');
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Render status badge
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <Badge bg="success">Approved</Badge>;
      case 'rejected':
        return <Badge bg="danger">Rejected</Badge>;
      case 'under-review':
        return <Badge bg="info">Under Review</Badge>;
      default:
        return <Badge bg="secondary">Pending</Badge>;
    }
  };
  
  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" />
        <p className="mt-2">Loading abstract details...</p>
      </div>
    );
  }
  
  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }
  
  if (!abstract) {
    return <Alert variant="warning">Abstract not found</Alert>;
  }
  
  return (
    <div className="abstract-detail">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Abstract Details</h2>
        <div>
          <Button 
            variant="outline-primary" 
            className="me-2"
            onClick={() => navigate('/registrant-portal/abstracts')}
          >
            Back to Abstracts
          </Button>
          
          {abstract.status !== 'approved' && abstract.status !== 'rejected' && (
            <Button 
              variant="primary" 
              onClick={() => setShowEditModal(true)}
            >
              <FiEdit className="me-2" />
              Edit Abstract
            </Button>
          )}
        </div>
      </div>
      
      <Card className="mb-4">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h4 className="mb-0">{abstract.title}</h4>
          {renderStatusBadge(abstract.status)}
        </Card.Header>
        <Card.Body>
          <Row className="mb-4">
            <Col md={6}>
              <p className="text-muted mb-2">Submission Date</p>
              <p>{formatDate(abstract.submissionDate || abstract.createdAt)}</p>
            </Col>
            <Col md={6}>
              <p className="text-muted mb-2">Category</p>
              <p>{
                (() => {
                  if (!abstract.category) return 'Not specified';
                  // Try to match by ID
                  const cat = categories.find(c => c._id === abstract.category || c.id === abstract.category);
                  return cat ? cat.name : abstract.category;
                })()
              }</p>
              {abstract.topic && (
                <>
                  <p className="text-muted mb-2">Sub Topic</p>
                  <p>{abstract.topic}</p>
                </>
              )}
            </Col>
          </Row>
          
          <Row className="mb-4">
            <Col md={12}>
              <p className="text-muted mb-2">Authors</p>
              <p>{abstract.authors || 'Not specified'}</p>
            </Col>
          </Row>
          
          <Row className="mb-4">
            <Col md={12}>
              <p className="text-muted mb-2">Abstract</p>
              <div 
                dangerouslySetInnerHTML={{ 
                  __html: DOMPurify.sanitize(abstract.content) 
                }} 
                className="abstract-content p-3 border rounded"
              />
            </Col>
          </Row>
          
          {abstract.keywords && (
            <Row className="mb-4">
              <Col md={12}>
                <p className="text-muted mb-2">Keywords</p>
                <p>{abstract.keywords}</p>
              </Col>
            </Row>
          )}
          
          {abstract.fileUrl && (
            <Row>
              <Col md={12}>
                <Button 
                  variant="outline-info" 
                  onClick={handleDownload}
                >
                  <FiDownload className="me-2" />
                  Download Abstract Document
                </Button>
              </Col>
            </Row>
          )}
        </Card.Body>
      </Card>
      
      {abstract.reviewComments && abstract.reviewComments.length > 0 && (
        <Card className="mb-4">
          <Card.Header>
            <h5 className="mb-0">
              <FiMessageSquare className="me-2" />
              Reviewer Comments
            </h5>
          </Card.Header>
          <Card.Body>
            {abstract.reviewComments.map((comment, index) => (
              <div key={index} className="review-comment mb-3 pb-3 border-bottom">
                <div className="d-flex justify-content-between">
                  <h6>{comment.reviewer || 'Reviewer'}</h6>
                  <small className="text-muted">{formatDate(comment.date)}</small>
                </div>
                <p>{comment.content}</p>
              </div>
            ))}
          </Card.Body>
        </Card>
      )}
      
      {abstract.decision && (
        <Card>
          <Card.Header className={`bg-${abstract.decision.approved ? 'success' : 'danger'} text-white`}>
            <h5 className="mb-0">
              {abstract.decision.approved ? (
                <><FiCheckSquare className="me-2" /> Approved</>
              ) : (
                <><FiXSquare className="me-2" /> Rejected</>
              )}
            </h5>
          </Card.Header>
          <Card.Body>
            <p className="mb-2 text-muted">Decision Date</p>
            <p className="mb-3">{formatDate(abstract.decision.date)}</p>
            
            {abstract.decision.comments && (
              <>
                <p className="mb-2 text-muted">Comments</p>
                <p>{abstract.decision.comments}</p>
              </>
            )}
          </Card.Body>
        </Card>
      )}
      
      {/* Edit Abstract Modal */}
      <Modal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Edit Abstract</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3">
            <h5 className="mb-3">Edit Your Abstract</h5>
            <AbstractSubmissionForm 
              abstract={abstract}
              isEdit={true}
              onSuccess={handleEditSuccess}
              onCancel={() => setShowEditModal(false)}
            />
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default AbstractDetail; 