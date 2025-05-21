import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { abstractService } from '../../services';
import { useAuth } from '../../contexts/AuthContext';
import { API_URL } from '../../config'; // Assuming API_URL is like http://localhost:5000/api
import toast from 'react-hot-toast'; // For notifications

// Helper to get base backend URL for file links
const getBackendBaseUrl = () => {
  if (API_URL.includes('/api')) {
    return API_URL.substring(0, API_URL.lastIndexOf('/api'));
  }
  return API_URL; // If API_URL is already the base or something else
};

function AbstractDetail({ eventId: propEventId, abstractId: propAbstractId }) {
  const params = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  
  // Use propAbstractId if available, otherwise fallback to params.id (for standalone route)
  // or params.abstractId if EventPortal route is /events/:id/abstracts/:abstractId
  const abstractIdToFetch = propAbstractId || params.abstractId || params.id;
  // Prioritize propEventId for constructing the download URL
  const eventIdForLink = propEventId || params.id; // params.id would be eventId if EventPortal is /events/:id/*
  // Use propEventId if available. If not, this component might need it from abstract data or another source
  // For now, assuming if propEventId is not passed, it might be fetched with the abstract or is not strictly needed for all operations.
  const eventIdForService = propEventId || (abstract && abstract.event); 

  const [abstract, setAbstract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comment, setComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [isProcessingDecision, setIsProcessingDecision] = useState(false);
  const [decisionError, setDecisionError] = useState(null);
  const [isDownloadingFile, setIsDownloadingFile] = useState(false); // New state for download button
  
  // Fetch abstract data
  useEffect(() => {
    const fetchAbstract = async () => {
      if (!abstractIdToFetch) {
        setError('Abstract ID is missing.');
        setLoading(false);
        return;
      }
      // Ensure eventIdForService is available or derived before this call if needed by getAbstractById
      // Assuming eventId is not strictly needed if abstractId is globally unique for fetching,
      // OR that the service can handle it. The service currently expects eventId.
      const eventIdForFetch = propEventId || (abstract && abstract.event) || params.id;

      if (!eventIdForFetch && propEventId !== null) { // If propEventId is explicitly null, it might mean a global abstract ID context
         // This case needs clarification if abstractId is not globally unique or service requires eventId
         // For now, we proceed if abstractIdToFetch is present.
         // If service strictly needs eventId, and it's not available, we should error out or handle differently.
      }

      // If eventId is strictly required by the service and not found, handle error:
      if (!eventIdForFetch && !params.id) { // params.id might be eventId if route is /events/:id/abstracts/... 
                                        // but we are trying to be more robust with props.
                                        // propEventId should be the primary source when available.
        // If abstract.event is also not available yet, and propEventId is not set.
        // This check might be too early if abstract is fetched first then provides eventId.
        // Let's assume for now that if propEventId is given, we use it. If not, the old behavior of just abstractId was flawed.
      }

      try {
        setLoading(true);
        // Use abstractIdToFetch for the service call AND eventIdForFetch
        const response = await abstractService.getAbstractById(eventIdForFetch, abstractIdToFetch, currentUser?.role || 'registrant');
        
        if (!response.success) {
          throw new Error(response.message);
        }
        
        setAbstract(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching abstract:', err);
        setError(err.message || 'Failed to load abstract details');
        setLoading(false);
      }
    };
    
    fetchAbstract();
  }, [abstractIdToFetch, propEventId, params.id, currentUser?.role]);
  
  // Handle comment input change
  const handleCommentChange = (e) => {
    setComment(e.target.value);
  };
  
  // Handle comment submission
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!comment.trim()) return;
    
    try {
      setSubmittingComment(true);
      
      const currentEventId = propEventId || (abstract && abstract.event);
      if (!currentEventId) {
        throw new Error('Event ID is missing for comment submission.');
      }
      
      const response = await abstractService.addReviewComment(currentEventId, abstractIdToFetch, comment);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to add comment via service');
      }
      
      // Update the local state with the updated abstract returned by the service
      // The service response *should* contain the full updated abstract
      // If not, we might need to re-fetch, but let's assume it does for now.
      // Check the structure of response.data
      if (response.data && response.data._id) { 
        setAbstract(response.data);
      } else {
        console.log("Re-fetching abstract after comment submission...");
        const updatedAbstractResponse = await abstractService.getAbstractById(currentEventId, abstractIdToFetch);
        if (updatedAbstractResponse.success) {
          setAbstract(updatedAbstractResponse.data);
        } else {
            throw new Error("Failed to re-fetch abstract after comment.");
        }
      }
      
      // Clear the comment input
      setComment('');
    } catch (err) {
      console.error('Error submitting comment:', err);
      setError(err.message || 'Failed to submit comment');
    } finally {
      setSubmittingComment(false);
    }
  };
  
  // Handle Final Decision
  const handleFinalDecision = async (decision) => {
    const currentEventId = propEventId || (abstract && abstract.event);
    if (!abstract || !currentEventId) {
        setDecisionError("Cannot process decision: Abstract or Event data missing.");
        return;
    }
    // TODO: Implement logic to prompt for reason if decision is reject/request-revision
    const reason = decision === 'rejected' ? prompt("Please enter the reason for rejection:") : 
                   decision === 'revision-requested' ? prompt("Please enter the reason for requesting revision:") : null;

    // Basic validation for prompt
    if ((decision === 'rejected' || decision === 'revision-requested') && reason === null) {
        // User cancelled the prompt
        return; 
    }

    setIsProcessingDecision(true);
    setDecisionError(null);
    let response;
    try {
      switch (decision) {
        case 'approved':
          response = await abstractService.approveAbstract(currentEventId, abstractIdToFetch);
          break;
        case 'rejected':
          response = await abstractService.rejectAbstract(currentEventId, abstractIdToFetch, { reason });
          break;
        case 'revision-requested':
          response = await abstractService.requestRevision(currentEventId, abstractIdToFetch, { reason });
          break;
        default:
          throw new Error("Invalid decision type");
      }

      if (!response || !response.success) {
        throw new Error(response?.message || `Failed to process decision: ${decision}`);
      }

      // Update local state
      if (response.data && response.data._id) {
        setAbstract(response.data);
      } else {
          const updatedAbstractResponse = await abstractService.getAbstractById(currentEventId, abstractIdToFetch);
          if (updatedAbstractResponse.success) {
              setAbstract(updatedAbstractResponse.data);
          } else {
              throw new Error("Failed to re-fetch abstract after decision.");
          }
      }

    } catch (err) {
      console.error(`Error processing decision (${decision}):`, err);
      setDecisionError(err.message || 'An error occurred while processing the decision.');
    } finally {
      setIsProcessingDecision(false);
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Format timestamp for display
  const formatTimestamp = (timestampString) => {
    if (!timestampString) return 'N/A';
    
    const timestamp = new Date(timestampString);
    return timestamp.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'under-review':
        return 'bg-blue-100 text-blue-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Format status text
  const formatStatus = (status) => {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'under-review':
        return 'Under Review';
      case 'rejected':
        return 'Rejected';
      default:
        return status || 'Unknown';
    }
  };

  // --- Check if current user can review --- 
  const canReview = currentUser && abstract && abstract.reviewDetails && 
                    abstract.reviewDetails.assignedTo?.some(reviewer => reviewer._id === currentUser._id) && 
                    !abstract.reviewDetails.reviews?.some(review => review.reviewer?._id === currentUser._id);
  // --- End Check --- 
  
  const handleDownloadFile = async () => {
    if (!abstract || !abstract.fileUrl || !eventIdForLink || !abstractIdToFetch) {
      toast.error('File information is missing or incomplete.');
      return;
    }
    setIsDownloadingFile(true);
    try {
      const result = await abstractService.downloadAbstractAttachment(eventIdForLink, abstractIdToFetch);
      if (result.success && result.blob) {
        const url = window.URL.createObjectURL(result.blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', result.filename || 'abstract-file'); // Use filename from service
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.success('File download started.');
      } else {
        throw new Error(result.message || 'Failed to download file.');
      }
    } catch (err) {
      console.error('Error downloading file:', err);
      toast.error(`Download failed: ${err.message}`);
    } finally {
      setIsDownloadingFile(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
        <div className="mt-4">
          <Link
            to="/abstracts"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <i className="ri-arrow-left-line mr-2"></i> Back to Abstracts
          </Link>
        </div>
      </div>
    );
  }
  
  if (!abstract) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative mb-6" role="alert">
          <strong className="font-bold">Note:</strong>
          <span className="block sm:inline"> Abstract not found or no longer available.</span>
        </div>
        <div className="mt-4">
          <Link
            to="/abstracts"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <i className="ri-arrow-left-line mr-2"></i> Back to Abstracts
          </Link>
        </div>
      </div>
    );
  }
  
  // Safely access the event data
  const eventName = abstract.event?.name || 'Unknown Event';
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-primary-700">Abstract Details</h1>
          <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getStatusBadgeClass(abstract.status)}`}>
            {formatStatus(abstract.status)}
          </span>
        </div>
        <p className="text-gray-500 mt-1">
          Submitted for {eventName}
        </p>
      </div>
      
      {/* Abstract Content Section */}
      <div className="bg-white rounded-lg shadow-soft p-6 mb-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{abstract.title}</h2>
          <div className="flex flex-col md:flex-row md:items-center text-sm text-gray-500 mb-4">
            <div className="mb-2 md:mb-0 md:mr-4">
              <span className="font-medium">Authors:</span> {abstract.authors}
            </div>
            {abstract.authorAffiliations && (
              <div className="mb-2 md:mb-0 md:mr-4">
                <span className="font-medium">Affiliations:</span> {abstract.authorAffiliations}
              </div>
            )}
          </div>
          <div className="flex flex-col md:flex-row md:items-center text-sm text-gray-500 mb-4">
            <div className="mb-2 md:mb-0 md:mr-4">
              <span className="font-medium">Topic:</span> {abstract.topic || 'Not specified'}
            </div>
            {abstract.subTopic && (
              <div className="mb-2 md:mb-0 md:mr-4">
                <span className="font-medium">Sub-Topic:</span> {abstract.subTopic}
              </div>
            )}
            <div className="mb-2 md:mb-0 md:mr-4">
              <span className="font-medium">Submission Date:</span> {formatDate(abstract.submissionDate)}
            </div>
            <div className="mb-2 md:mb-0 md:mr-4">
              <span className="font-medium">Registration ID:</span> {abstract.registrationId}
            </div>
          </div>
        </div>
        
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Abstract Content</h3>
          <div className="bg-gray-50 p-4 rounded-md whitespace-pre-line">
            {abstract.content}
          </div>
        </div>

        {abstract.fileUrl && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Submitted File</h3>
            <div className="bg-gray-50 p-4 rounded-md">
              <button 
                onClick={handleDownloadFile}
                disabled={isDownloadingFile}
                className="text-primary-600 hover:text-primary-800 hover:underline flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {isDownloadingFile ? 'Downloading...' : (abstract.fileName || 'Download Submitted File')}
                {abstract.fileSize && !isDownloadingFile && <span className="text-xs text-gray-500 ml-2">({(abstract.fileSize / 1024).toFixed(1)} KB)</span>}
              </button>
            </div>
          </div>
        )}
        
        {/* Admin Actions */}
        <div className="mt-6 border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Admin Actions</h3>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => handleFinalDecision('approved')}
              disabled={isProcessingDecision || abstract.reviewDetails.finalDecision === 'accepted'}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessingDecision ? 'Processing...' : 'Approve'}
            </button>
            
            <button
              onClick={() => handleFinalDecision('rejected')}
              disabled={isProcessingDecision || abstract.reviewDetails.finalDecision === 'rejected'}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessingDecision ? 'Processing...' : 'Reject'}
            </button>
            
            <button
              onClick={() => handleFinalDecision('revision-requested')}
              disabled={isProcessingDecision || abstract.reviewDetails.finalDecision === 'revision-requested'}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-500 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessingDecision ? 'Processing...' : 'Request Revision'}
            </button>
            
            <div className="ml-auto">
              {abstract.status === 'under-review' && (
                <Link
                  to={`/abstracts/${abstract._id}/edit`}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <i className="ri-edit-line mr-2"></i> Edit Abstract
                </Link>
              )}
              
              <button
                onClick={() => window.print()}
                className="ml-2 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <i className="ri-printer-line mr-2"></i> Print
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Review Details Section - ENHANCED */}
      {abstract.reviewDetails && (
        <div className="mt-6 pt-6 border-t">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Submitted Reviews</h3>
          {abstract.reviewDetails.reviews && abstract.reviewDetails.reviews.length > 0 ? (
            <ul className="space-y-6">
              {abstract.reviewDetails.reviews.map((review, index) => (
                <li key={review._id || index} className="p-4 border rounded-lg shadow-sm bg-white">
            <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold text-gray-700">
                      Reviewer: {review.reviewer?.name || review.reviewer?.username || review.reviewer || 'Anonymous Reviewer'}
                    </h4>
                    <span className="text-xs text-gray-500">{formatTimestamp(review.reviewedAt)}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="font-medium">Recommendation:</span> {review.decision || 'N/A'}
                  </p>
                  {review.score !== null && review.score !== undefined && (
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">Score:</span> {review.score}
                    </p>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Comments:</p>
                    <p className="text-sm text-gray-500 whitespace-pre-wrap bg-gray-50 p-2 border rounded">
                      {review.comments || 'No comments provided.'}
                    </p>
            </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No reviews submitted yet.</p>
          )}
          {/* Display assigned reviewers if available and relevant */}
          {abstract.reviewDetails.assignedReviewers && abstract.reviewDetails.assignedReviewers.length > 0 && (
            <div className="mt-4 pt-4 border-t border-dashed">
              <h4 className="text-md font-semibold text-gray-700 mb-2">Assigned Reviewers:</h4>
              <ul className="list-disc list-inside text-sm text-gray-600">
                {abstract.reviewDetails.assignedReviewers.map(reviewer => (
                  <li key={reviewer._id || reviewer}>
                    {reviewer.name || reviewer.username || reviewer}
                    {abstract.reviewDetails.reviews?.find(r => (r.reviewer?._id || r.reviewer) === (reviewer._id || reviewer)) 
                      ? <span className="ml-2 text-xs text-green-600">(Completed)</span>
                      : <span className="ml-2 text-xs text-yellow-600">(Pending)</span>
                    }
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      
      {/* Comments Section */}
      <div className="bg-white rounded-lg shadow-soft p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Review Comments</h3>
        <div className="mb-4 space-y-3 max-h-60 overflow-y-auto">
          {(abstract.reviewComments && abstract.reviewComments.length > 0) ? (
            abstract.reviewComments.map((reviewComment, index) => (
              <div key={index} className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm text-gray-700">{reviewComment.comment}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {/* Assuming comment object has userId (needs population) and timestamp */}
                  {/* By: {reviewComment.userId?.name || 'Unknown User'} at {formatTimestamp(reviewComment.timestamp)} */}
                  {/* Simplified for now until backend population is confirmed: */}
                  Commented at: {formatTimestamp(reviewComment.timestamp)}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 italic">No comments yet.</p>
          )}
        </div>
        <form onSubmit={handleSubmitComment} className="mt-4">
            <textarea
              value={comment}
              onChange={handleCommentChange}
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm"
            placeholder="Add a review comment..."
            ></textarea>
          <div className="mt-2 text-right">
            <button
              type="submit"
              disabled={submittingComment || !comment.trim()}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {submittingComment ? 'Submitting...' : 'Submit Comment'}
            </button>
          </div>
        </form>
      </div>
      
      {/* Navigation */}
      <div className="flex justify-between items-center mt-6">
        <Link
          to={(() => {
            // Prefer eventId from props, then params, then abstract.event
            const eventId = propEventId || params.id || (abstract && abstract.event && (abstract.event._id || abstract.event));
            return eventId ? `/events/${eventId}/abstracts` : '/abstracts';
          })()}
          className="inline-flex items-center text-primary-600 hover:text-primary-800"
        >
          <i className="ri-arrow-left-line mr-2"></i> Back to All Abstracts
        </Link>
      </div>
    </div>
  );
}

export default AbstractDetail; 