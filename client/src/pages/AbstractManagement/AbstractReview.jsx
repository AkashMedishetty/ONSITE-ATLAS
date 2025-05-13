import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Container, Row, Col, Card, Button, Form, 
  Alert, Spinner, Badge, Tab, Tabs 
} from 'react-bootstrap';
import { FaStar, FaRegStar, FaCheck, FaTimes, FaQuestionCircle } from 'react-icons/fa';
import DOMPurify from 'dompurify';
import axios from 'axios';
import Swal from 'sweetalert2';

const AbstractReview = () => {
  const { abstractId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [abstract, setAbstract] = useState(null);
  const [isReviewer, setIsReviewer] = useState(false);
  const [hasSubmittedReview, setHasSubmittedReview] = useState(false);
  const [review, setReview] = useState({
    novelty: 0,
    methodology: 0,
    presentation: 0,
    relevance: 0,
    comments: '',
    recommendation: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState({
    assignedReviewers: 0,
    completedReviews: 0,
    averageScores: {
      novelty: 0,
      methodology: 0,
      presentation: 0,
      relevance: 0
    },
    recommendations: {
      accept: 0,
      revise: 0,
      reject: 0
    }
  });

  useEffect(() => {
    fetchData();
  }, [abstractId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch abstract details
      const abstractResponse = await axios.get(`/api/abstracts/${abstractId}`);
      setAbstract(abstractResponse.data);
      
      // Check if current user is a reviewer
      const reviewerStatusResponse = await axios.get(`/api/abstracts/${abstractId}/reviewer-status`);
      setIsReviewer(reviewerStatusResponse.data.isReviewer);
      setHasSubmittedReview(reviewerStatusResponse.data.hasSubmittedReview);
      
      if (reviewerStatusResponse.data.hasSubmittedReview) {
        // Load existing review if already submitted
        const reviewResponse = await axios.get(`/api/abstracts/${abstractId}/my-review`);
        setReview(reviewResponse.data);
      }
      
      // Get review statistics
      const statsResponse = await axios.get(`/api/abstracts/${abstractId}/review-stats`);
      setStats(statsResponse.data);
      
      setError(null);
    } catch (err) {
      console.error('Error fetching abstract data:', err);
      setError('Failed to load abstract information. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleRatingChange = (category, value) => {
    setReview(prev => ({
      ...prev,
      [category]: value
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setReview(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitReview = async () => {
    try {
      setSubmitting(true);
      
      await axios.post(`/api/abstracts/${abstractId}/reviews`, review);
      
      setHasSubmittedReview(true);
      setSubmitting(false);
      
      Swal.fire({
        title: 'Success!',
        text: 'Your review has been submitted successfully.',
        icon: 'success',
        confirmButtonText: 'OK'
      });
      
      // Refresh statistics
      const statsResponse = await axios.get(`/api/abstracts/${abstractId}/review-stats`);
      setStats(statsResponse.data);
    } catch (err) {
      console.error('Error submitting review:', err);
      setSubmitting(false);
      
      Swal.fire({
        title: 'Error',
        text: 'Failed to submit your review. Please try again.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  };

  if (loading) {
    return (
      <Container className="my-5 text-center">
        <Spinner animation="border" role="status" variant="primary">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-3">Loading abstract information...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="my-5">
        <Alert variant="danger">{error}</Alert>
        <Button variant="secondary" onClick={() => navigate(-1)}>Go Back</Button>
      </Container>
    );
  }

  if (!abstract) {
    return (
      <Container className="my-5">
        <Alert variant="warning">Abstract not found or you do not have permission to view it.</Alert>
        <Button variant="secondary" onClick={() => navigate(-1)}>Go Back</Button>
      </Container>
    );
  }

  const renderStarRating = (category, currentRating) => {
    return (
      <div className="d-flex mb-3">
        {[1, 2, 3, 4, 5].map((star) => (
          <div
            key={star}
            onClick={() => !hasSubmittedReview && handleRatingChange(category, star)}
            className={`star-rating ${hasSubmittedReview ? 'readonly' : ''}`}
          >
            {star <= currentRating ? (
              <FaStar className="text-warning" size={24} />
            ) : (
              <FaRegStar className="text-secondary" size={24} />
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <Container className="my-4">
      <Row className="mb-4">
        <Col xs={12}>
          <h2 className="border-bottom pb-2">Abstract Review</h2>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <Button variant="outline-secondary" onClick={() => navigate(-1)} className="me-2">
                Back
              </Button>
              {abstract.status && (
                <Badge bg={
                  abstract.status === 'pending' ? 'warning' :
                  abstract.status === 'approved' ? 'success' :
                  abstract.status === 'rejected' ? 'danger' : 'secondary'
                }>
                  {abstract.status.toUpperCase()}
                </Badge>
              )}
            </div>
          </div>
        </Col>
      </Row>

      <Row>
        <Col lg={7}>
          <Card className="mb-4">
            <Card.Header as="h5">Abstract Details</Card.Header>
            <Card.Body>
              <h3>{abstract.title}</h3>
              
              <div className="mb-3">
                <strong>Author:</strong> {abstract.author.name} ({abstract.author.email})
              </div>
              
              <div className="mb-3">
                <strong>Submitted:</strong> {new Date(abstract.submittedAt).toLocaleDateString()}
              </div>
              
              <div className="mb-3">
                <strong>Keywords:</strong>{' '}
                {abstract.keywords?.map((keyword, index) => (
                  <Badge key={index} bg="info" className="me-1">{keyword}</Badge>
                ))}
              </div>
              
              <div className="mb-3">
                <strong>Category:</strong>{' '}
                <Badge bg="secondary">{abstract.category}</Badge>
              </div>
              
              <div className="mb-4">
                <h5>Abstract</h5>
                <div 
                  className="abstract-content p-3 bg-light rounded" 
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(abstract.content) }}
                />
              </div>
              
              {abstract.additionalFiles?.length > 0 && (
                <div className="mb-3">
                  <h5>Additional Files</h5>
                  <ul className="list-group">
                    {abstract.additionalFiles.map((file, index) => (
                      <li key={index} className="list-group-item">
                        <a href={file.url} target="_blank" rel="noopener noreferrer">
                          {file.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card.Body>
          </Card>
          
          <Card>
            <Card.Header as="h5">Review Statistics</Card.Header>
            <Card.Body>
              <Row className="mb-3">
                <Col xs={6}>
                  <div className="mb-2">
                    <strong>Assigned Reviewers:</strong> {stats.assignedReviewers}
                  </div>
                  <div>
                    <strong>Completed Reviews:</strong> {stats.completedReviews}
                  </div>
                </Col>
                <Col xs={6}>
                  <div className="mb-2">
                    <strong>Recommendation:</strong>
                  </div>
                  <div className="mb-1">
                    <FaCheck className="text-success" /> Accept: {stats.recommendations.accept}
                  </div>
                  <div className="mb-1">
                    <FaQuestionCircle className="text-warning" /> Revise: {stats.recommendations.revise}
                  </div>
                  <div>
                    <FaTimes className="text-danger" /> Reject: {stats.recommendations.reject}
                  </div>
                </Col>
              </Row>
              
              <h6>Average Scores:</h6>
              <Row>
                <Col xs={6} md={3}>
                  <div className="text-center">
                    <div className="display-6">{stats.averageScores.novelty.toFixed(1)}</div>
                    <small className="text-muted">Novelty</small>
                  </div>
                </Col>
                <Col xs={6} md={3}>
                  <div className="text-center">
                    <div className="display-6">{stats.averageScores.methodology.toFixed(1)}</div>
                    <small className="text-muted">Methodology</small>
                  </div>
                </Col>
                <Col xs={6} md={3}>
                  <div className="text-center">
                    <div className="display-6">{stats.averageScores.presentation.toFixed(1)}</div>
                    <small className="text-muted">Presentation</small>
                  </div>
                </Col>
                <Col xs={6} md={3}>
                  <div className="text-center">
                    <div className="display-6">{stats.averageScores.relevance.toFixed(1)}</div>
                    <small className="text-muted">Relevance</small>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={5}>
          <Card>
            <Card.Header as="h5">
              {hasSubmittedReview ? 'Your Review' : 'Submit Your Review'}
              {!isReviewer && (
                <Alert variant="warning" className="mt-2 mb-0">
                  You are not assigned as a reviewer for this abstract.
                </Alert>
              )}
            </Card.Header>
            <Card.Body>
              {isReviewer && (
                <Form>
                  <fieldset disabled={hasSubmittedReview || submitting}>
                    <div className="mb-4">
                      <h6>Novelty</h6>
                      <small className="text-muted d-block mb-2">
                        Rate the originality and innovation of the research
                      </small>
                      {renderStarRating('novelty', review.novelty)}
                    </div>
                    
                    <div className="mb-4">
                      <h6>Methodology</h6>
                      <small className="text-muted d-block mb-2">
                        Rate the research methods and approach
                      </small>
                      {renderStarRating('methodology', review.methodology)}
                    </div>
                    
                    <div className="mb-4">
                      <h6>Presentation</h6>
                      <small className="text-muted d-block mb-2">
                        Rate the clarity and organization of the abstract
                      </small>
                      {renderStarRating('presentation', review.presentation)}
                    </div>
                    
                    <div className="mb-4">
                      <h6>Relevance</h6>
                      <small className="text-muted d-block mb-2">
                        Rate the relevance to the conference themes
                      </small>
                      {renderStarRating('relevance', review.relevance)}
                    </div>
                    
                    <Form.Group className="mb-4">
                      <Form.Label>Recommendation</Form.Label>
                      <Form.Select 
                        name="recommendation" 
                        value={review.recommendation} 
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select recommendation</option>
                        <option value="accept">Accept</option>
                        <option value="revise">Request Revisions</option>
                        <option value="reject">Reject</option>
                      </Form.Select>
                    </Form.Group>
                    
                    <Form.Group className="mb-4">
                      <Form.Label>Comments</Form.Label>
                      <Form.Control 
                        as="textarea" 
                        rows={5} 
                        name="comments"
                        value={review.comments}
                        onChange={handleInputChange}
                        placeholder="Provide detailed feedback for the author"
                      />
                    </Form.Group>
                    
                    {!hasSubmittedReview && (
                      <Button 
                        variant="primary" 
                        onClick={handleSubmitReview} 
                        disabled={submitting || !review.recommendation}
                      >
                        {submitting ? (
                          <>
                            <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                            Submitting...
                          </>
                        ) : 'Submit Review'}
                      </Button>
                    )}
                    
                    {hasSubmittedReview && (
                      <Alert variant="success">
                        You have successfully submitted your review.
                      </Alert>
                    )}
                  </fieldset>
                </Form>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AbstractReview; 