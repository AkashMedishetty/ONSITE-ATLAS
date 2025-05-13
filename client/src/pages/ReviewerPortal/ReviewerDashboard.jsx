import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import abstractService from '../../services/abstractService'; // Assuming this path is correct
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';

// Assuming common components like Button, Spinner, Alert, Card are available
import { Button, Spinner, Alert, Card } from '../../components/common'; 

const ReviewerDashboard = () => {
  const { user: currentUser, eventId: currentEventId } = useAuth(); // Assuming eventId might come from AuthContext or needs other source
  const [abstractsToReview, setAbstractsToReview] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAssignedAbstracts = async () => {
      if (!currentUser || !currentUser._id) {
        setError('User not authenticated or user ID missing.');
        setLoading(false);
        return;
      }
      
      // If currentEventId is not available, it might be an issue.
      // For now, proceed if it's there, or backend might not need it if filtering globally by reviewer.
      if (!currentEventId) {
          console.warn("ReviewerDashboard: eventId not available from useAuth. Backend might need to handle this or abstracts might be fetched globally for the reviewer.");
          // Depending on backend, you might fetch all abstracts assigned to reviewer across all events
          // or show an error if event context is strictly required here.
          // For this example, we'll proceed, assuming backend can handle it or we adapt later.
      }

      setLoading(true);
      setError('');
      try {
        // Construct params for fetching abstracts assigned to this reviewer.
        // The backend for 'getAbstracts' must support filtering by 'assignedReviewer'.
        // And potentially by 'eventId' if currentEventId is provided and relevant.
        const params = { 
            assignedReviewer: currentUser._id,
            // reviewStatus: 'pending' // Optional: if you only want to show those not yet reviewed by them
        };
        if (currentEventId) {
            // Assuming getAbstracts takes eventId as first arg, then params
             const response = await abstractService.getAbstracts(currentEventId, params);
             if (response.success) {
                setAbstractsToReview(response.data || []);
             } else {
                setError(response.message || 'Failed to fetch assigned abstracts.');
                toast.error(response.message || 'Failed to fetch assigned abstracts.');
             }
        } else {
            // If no eventId, maybe a different service call or an error
            // For now, let's assume getAbstracts can work without eventId if filtering by reviewer globally
            // This part might need adjustment based on actual service capabilities
            const response = await abstractService.getAbstracts(null, params); // Or a dedicated service call
             if (response.success) {
                setAbstractsToReview(response.data || []);
             } else {
                setError(response.message || 'Failed to fetch assigned abstracts globally.');
                toast.error(response.message || 'Failed to fetch assigned abstracts globally.');
             }
        }
      } catch (err) {
        setError('Error fetching abstracts: ' + err.message);
        toast.error('Error fetching abstracts: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser && currentUser._id) {
      fetchAssignedAbstracts();
    } else if (!currentUser) {
        setLoading(false);
        setError("Waiting for user authentication...");
    }
  }, [currentUser, currentEventId]);

  const getReviewStatusForCurrentUser = (abstract) => {
    if (!currentUser || !abstract.reviewDetails || !abstract.reviewDetails.reviews) {
        return { text: 'Status Unknown', color: 'gray' };
    }
    const myReview = abstract.reviewDetails.reviews.find(
        review => (review.reviewer?._id || review.reviewer) === currentUser._id
    );
    if (myReview) {
        return { text: `Reviewed (${myReview.decision})`, color: 'green' };
    }
    return { text: 'Pending Your Review', color: 'yellow' };
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric'
      });
    } catch (e) { return 'Invalid Date'; }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Spinner size="lg" /><span className="ml-3">Loading Assigned Abstracts...</span></div>;
  }

  if (error) {
    return <Alert type="error" message={error} />;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Your Assigned Abstracts</h1>

      {abstractsToReview.length === 0 ? (
        <Card>
            <Card.Body>
                <p className="text-center text-gray-500 py-8">You have no abstracts assigned for review at this time.</p>
            </Card.Body>
        </Card>
      ) : (
        <div className="space-y-4">
          {abstractsToReview.map((abstract) => {
            const reviewStatus = getReviewStatusForCurrentUser(abstract);
            return (
              <Card key={abstract._id} className="shadow-sm hover:shadow-md transition-shadow">
                <Card.Body>
                  <div className="flex flex-col md:flex-row justify-between md:items-start">
                    <div className="flex-grow mb-3 md:mb-0">
                      <h2 className="text-lg font-semibold text-indigo-700 mb-1">{abstract.title}</h2>
                      <p className="text-xs text-gray-500 mb-1">
                        Abstract ID: {abstract.abstractNumber || abstract._id} | Event: {abstract.event?.name || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-600 mb-2">
                        Submitted: {formatDate(abstract.submissionDate || abstract.createdAt)}
                      </p>
                    </div>
                    <div className="flex-shrink-0 flex flex-col items-start md:items-end space-y-2">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full bg-${reviewStatus.color}-100 text-${reviewStatus.color}-800`}>
                            {reviewStatus.text}
                        </span>
                         <Link to={`/reviewer/abstract/${abstract._id}/review`}>
                            <Button variant="primary" size="sm">
                                {reviewStatus.text === 'Pending Your Review' ? 'Review Abstract' : 'View/Edit Review'}
                            </Button>
                        </Link>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ReviewerDashboard; 