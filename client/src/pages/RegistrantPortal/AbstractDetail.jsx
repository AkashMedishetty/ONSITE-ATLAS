import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Row, Col, Badge, Button, Alert, Spinner, Modal } from 'react-bootstrap';
import { FiEdit, FiDownload, FiCheckSquare, FiXSquare, FiMessageSquare } from 'react-icons/fi';
import { toast } from 'react-toastify';
import DOMPurify from 'dompurify';

import abstractService from '../../services/abstractService';
import apiRegistrant from '../../services/apiRegistrant';
import { useRegistrantAuth } from '../../contexts/RegistrantAuthContext';
import { useActiveEvent } from '../../contexts/ActiveEventContext';
import AbstractSubmissionForm from './AbstractSubmissionForm';
import { API_BASE_URL_STATIC } from '../../config';

const AbstractDetail = () => {
  const { abstractId } = useParams();
  const navigate = useNavigate();
  
  const {
    activeEventId,
    activeEventDetails,
    isLoadingEventDetails,
    eventDetailsError
  } = useActiveEvent();
  
  const [abstract, setAbstract] = useState(null);
  const [loadingAbstract, setLoadingAbstract] = useState(true);
  const [abstractError, setAbstractError] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  
  useEffect(() => {
    const eventIdToUse = activeEventId;
    if (abstractId && eventIdToUse) {
      fetchAbstractDetails(eventIdToUse, abstractId);
    } else if (!eventIdToUse && !isLoadingEventDetails) { // Only error if event context is settled and no ID
      setAbstractError('Event context not available. Cannot load abstract.');
      setLoadingAbstract(false);
    } else if (!abstractId) {
      setAbstractError('Abstract ID missing from URL.');
      setLoadingAbstract(false);
    }
    // Dependencies include activeEventId to refetch if it changes, and isLoadingEventDetails to wait for context
  }, [abstractId, activeEventId, isLoadingEventDetails]);
  
  const fetchAbstractDetails = async (eventId, absId) => {
    setLoadingAbstract(true);
    setAbstractError(null);
    try {
      // console.log(`[AbstractDetail] Fetching details for abstract ${absId} and event ${eventId}.`);
      const response = await abstractService.getAbstractById(eventId, absId);
      if (response && response.success && response.data) {
        // console.log('[AbstractDetail fetchAbstractDetails] response.data.category value:', response.data.category);
        // console.log('[AbstractDetail fetchAbstractDetails] typeof response.data.category:', typeof response.data.category);
        if (response.data.category && typeof response.data.category === 'object') {
          // console.log('[AbstractDetail fetchAbstractDetails] response.data.category keys:', Object.keys(response.data.category));
          if (response.data.category.hasOwnProperty('$oid')) {
            // console.log('[AbstractDetail fetchAbstractDetails] response.data.category.$oid:', response.data.category.$oid);
          }
           if (response.data.category.hasOwnProperty('_id')) { // In case it's populated
            // console.log('[AbstractDetail fetchAbstractDetails] response.data.category._id:', response.data.category._id);
          }
        }
        setAbstract(response.data);
        // console.log('[AbstractDetail] Raw abstract data set (after logging category specificcally):', response.data);
      } else {
        const errorMessage = response?.message || 'Failed to load abstract details.';
        setAbstractError(errorMessage);
        // console.warn("[AbstractDetail] Failed to fetch abstract details:", response);
      }
    } catch (err) {
      // console.error('Error in fetchAbstractDetails:', err);
      setAbstractError(`An error occurred: ${err.message}`);
    } finally {
      setLoadingAbstract(false);
    }
  };

  const { categoryName, subTopicName } = useMemo(() => {
    if (!abstract || !activeEventDetails?.abstractSettings?.categories) {
      return { categoryName: 'Not specified', subTopicName: 'Not specified' };
    }

    // Use backend-provided names if available
    if (abstract.categoryName || abstract.subTopicName) {
      return {
        categoryName: abstract.categoryName || 'Not specified',
        subTopicName: abstract.subTopicName || 'Not specified',
      };
    }

    // Fallback: match category ObjectId to event settings
    const normalizeId = (id) => {
      if (!id) return null;
      if (typeof id === 'string') return id;
      if (typeof id === 'object') {
        if (id.$oid) return id.$oid;
        if (id._id) return id._id;
      }
      return null;
    };
    const categoryId = normalizeId(abstract.category);
    let catName = 'Not specified';
    let subName = 'Not specified';
    if (categoryId) {
      const category = activeEventDetails.abstractSettings.categories.find(
        cat => normalizeId(cat._id) === categoryId
      );
      if (category) {
        catName = category.name;
        if (abstract.subTopic && category.subTopics) {
          const subTopic = category.subTopics.find(
            sub => normalizeId(sub._id) === normalizeId(abstract.subTopic)
          );
          if (subTopic) {
            subName = subTopic.name;
          }
        }
      }
    }
    // console.log('[AbstractDetail] Category matching:', { categoryId, catName, subName });
    return { categoryName: catName, subTopicName: subName };
  }, [abstract, activeEventDetails]);
  
  const handleDownload = async () => {
    const eventIdToUse = activeEventId;
    if (!eventIdToUse || !abstract || !abstract._id) {
      toast.error("Cannot download: Missing event ID or abstract details.");
      return;
    }
    try {
      if (abstract.fileUrl) {
        const fullFileUrl = `${API_BASE_URL_STATIC}${abstract.fileUrl}`;
        window.open(fullFileUrl, '_blank');
        toast.success('File download initiated via direct URL.');
        return;
      }
      const response = await apiRegistrant.get(`/events/${eventIdToUse}/abstracts/${abstract._id}/file`, { 
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
      toast.error(err.response?.data?.message || err.message || 'Failed to download abstract');
    }
  };
  
  const handleEditSuccess = (updatedAbstract) => {
    setAbstract(updatedAbstract); // Optimistically update, or refetch if needed
    setShowEditModal(false);
    toast.success('Abstract updated successfully');
    fetchAbstractDetails(activeEventId, abstractId); // Refetch to get fresh data including populated names if backend changes
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };
  
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'approved': return <Badge bg="success">Approved</Badge>;
      case 'rejected': return <Badge bg="danger">Rejected</Badge>;
      case 'under-review': return <Badge bg="info">Under Review</Badge>;
      default: return <Badge bg="secondary">Pending</Badge>;
    }
  };
  
  if (isLoadingEventDetails || loadingAbstract) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" />
        <p className="mt-2">Loading abstract details...</p>
      </div>
    );
  }
  
  if (eventDetailsError) {
    return <Alert variant="danger">Error loading event data: {eventDetailsError}</Alert>;
  }
  if (abstractError) {
    return <Alert variant="danger">Error loading abstract: {abstractError}</Alert>;
  }
  if (!abstract) {
    return <Alert variant="warning">Abstract not found or not accessible.</Alert>;
  }

  // console.log('[AbstractDetail] Render. Abstract:', abstract, 'CatName:', categoryName, 'SubName:', subTopicName);

  return (
    <div className="abstract-detail-container p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="h4">Abstract Details</h2>
        <div>
          <Button variant="outline-secondary" className="me-2" onClick={() => navigate(`/registrant-portal/abstracts?event=${activeEventId}`)}>
            Back to Abstracts
          </Button>
          {abstract.status !== 'approved' && abstract.status !== 'rejected' && (
            <Button variant="primary" onClick={() => setShowEditModal(true)}>
              <FiEdit className="me-2" />Edit
            </Button>
          )}
        </div>
      </div>
      
      <Card className="mb-4 shadow-sm">
        <Card.Header as="h5" className="d-flex flex-column flex-md-row justify-content-between align-items-md-center bg-light">
          <div>
            {abstract.title || 'Untitled Abstract'}
            {abstract.abstractNumber && (
              <div className="text-muted small mt-1">
                <Badge bg="secondary" className="me-2">Abstract Number: {abstract.abstractNumber}</Badge>
              </div>
            )}
          </div>
          <div className="mt-2 mt-md-0">{renderStatusBadge(abstract.status)}</div>
        </Card.Header>
        <Card.Body>
          {/* Metadata summary row */}
          <Row className="mb-4">
            <Col md={3} sm={6} xs={12} className="mb-2">
              <div className="text-muted small">Submission Date</div>
              <div>{formatDate(abstract.submissionDate || abstract.createdAt)}</div>
            </Col>
            <Col md={3} sm={6} xs={12} className="mb-2">
              <div className="text-muted small">Category</div>
              <div><Badge bg="info">{categoryName || 'Not specified'}</Badge></div>
            </Col>
            <Col md={3} sm={6} xs={12} className="mb-2">
              <div className="text-muted small">Sub Topic</div>
              <div><Badge bg="light" text="dark">{subTopicName || 'Not specified'}</Badge></div>
            </Col>
            <Col md={3} sm={6} xs={12} className="mb-2">
              <div className="text-muted small">Status</div>
              <div>{renderStatusBadge(abstract.status)}</div>
            </Col>
          </Row>

          {/* Authors Section */}
          <h6 className="mt-4 mb-2 text-primary">Authors</h6>
          <div className="mb-3">{abstract.authors || 'N/A'}</div>

          {/* Abstract Content Section */}
          <h6 className="mt-4 mb-2 text-primary">Abstract Content</h6>
          <div 
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(abstract.content || '') }} 
            className="abstract-content p-3 border rounded bg-light mb-3" 
          />

          {/* Keywords Section */}
          {abstract.keywords && abstract.keywords.length > 0 && (
            <div className="mt-3">
              <h6 className="mb-1 text-primary">Keywords</h6>
              <div>{Array.isArray(abstract.keywords) ? abstract.keywords.join(', ') : abstract.keywords}</div>
            </div>
          )}

          {/* File Download Section */}
          {abstract.fileUrl && (
            <div className="mt-4">
              <Button variant="outline-info" onClick={handleDownload} size="sm">
                <FiDownload className="me-2" />Download Attached File
              </Button>
            </div>
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
      
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="xl" centered>
        <Modal.Header closeButton>
          <Modal.Title>Edit Abstract: {abstract.title || 'Untitled'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {activeEventDetails && abstract ? (
            <AbstractSubmissionForm 
              abstractData={abstract} // Pass abstractData instead of abstract
              eventDetails={activeEventDetails}
              isEditMode={true} // Pass isEditMode instead of isEdit
              onSuccess={handleEditSuccess}
              onCancel={() => setShowEditModal(false)}
            />
          ) : (
            <p>Loading form...</p>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default AbstractDetail; 