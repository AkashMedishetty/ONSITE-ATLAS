import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import abstractService from '../../services/abstractService';
import { useAuth } from '../../contexts/AuthContext'; // Need user context to identify reviewer
import { toast } from 'react-hot-toast';
import DOMPurify from 'dompurify'; // For safely rendering abstract content
import { API_URL } from '../../config'; // For file download links

// Import common UI components (adjust path as needed)
import { Button, Spinner, Alert, Card, Input, Textarea, Select } from '../../components/common'; 

const ReviewerAbstractReviewPage = () => {
  const { abstractId } = useParams();
  const navigate = useNavigate();
  const location = useLocation(); // Get location object
  const { user: authUser, isAuthenticated, loading: authLoading } = useAuth(); // Get all relevant values

  // Extract eventId from location state
  const eventId = location.state?.eventId;

  const [abstract, setAbstract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDownloadingFile, setIsDownloadingFile] = useState(false); // Add state for download button

  // State for the review form
  const [reviewScore, setReviewScore] = useState('');
  const [reviewComments, setReviewComments] = useState('');
  const [reviewDecision, setReviewDecision] = useState('undecided'); // 'accept', 'reject', 'revise', 'undecided'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState(null); // Specific error for review submission
  const [myPreviousReview, setMyPreviousReview] = useState(null); // To display existing review

  // Fetch Abstract Data
  useEffect(() => {
    console.log(
      "[ReviewerAbstractReviewPage] useEffect triggered. Abstract ID:", abstractId, 
      "Event ID from location.state:", eventId, // Log eventId
      "AuthUser from useAuth():", authUser, // Log the renamed variable
      "IsAuthenticated from useAuth():", isAuthenticated, 
      "AuthLoading from useAuth():", authLoading
    );

    const fetchAbstractToReview = async () => {
      // Check for eventId as well
      if (!authUser) { 
        setError("User not authenticated. Cannot fetch abstract details.");
        console.warn("[ReviewerAbstractReviewPage] Fetch blocked: authUser is not available.");
        setLoading(false);
        return;
      }
      if (!eventId) {
        setError("Event ID not found. Cannot fetch abstract details.");
        console.warn("[ReviewerAbstractReviewPage] Fetch blocked: eventId is not available from location state.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError('');
      try {
        // Pass both eventId and abstractId to the service call
        const response = await abstractService.getAbstractById(eventId, abstractId);
        if (response.success && response.data) {
          setAbstract(response.data);
          console.log(
            "[ReviewerAbstractReviewPage] Fetched abstract data. Full object:", response.data, 
            "Specifically, abstract.topic:", response.data.topic, 
            "And abstract.category:", response.data.category
          ); // Log the fetched abstract object and specific fields
          // Check for previous review by this user
          const previousReview = response.data.reviewDetails?.reviews?.find(
             r => r.reviewer?._id === authUser._id || r.reviewer === authUser._id
          );
          if (previousReview) {
             setMyPreviousReview(previousReview);
             // Pre-fill form if desired (optional)
             setReviewScore(previousReview.score ?? '');
             setReviewComments(previousReview.comments || '');
             setReviewDecision(previousReview.decision || 'undecided');
          }
        } else {
          setError(response.message || 'Failed to load abstract for review.');
          toast.error(response.message || 'Failed to load abstract for review.');
        }
      } catch (err) {
        setError('Error loading abstract: ' + err.message);
        toast.error('Error loading abstract: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    // Add eventId to the condition for fetching
    if (abstractId && eventId && authUser) {
      fetchAbstractToReview();
    }
  }, [abstractId, eventId, authUser, isAuthenticated, authLoading]); // Re-run if user context changes

  // Handle Review Submission
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!authUser || !abstract || !abstract.event) {
        setReviewError("Missing user or abstract data.");
        return;
    }
    
    if (reviewDecision === 'undecided') {
        setReviewError("Please select a review decision (Accept, Reject, Revise).");
        toast.error('Please select a review decision.');
        return;
    }

    setIsSubmitting(true);
    setReviewError(null);

    const reviewData = {
        score: reviewScore ? Number(reviewScore) : null,
        comments: reviewComments,
        decision: reviewDecision,
        // isComplete will be set to true by the backend controller
    };

    try {
        // abstract.event could be an object or just an ID, ensure we pass the ID
        const eventIdToUse = typeof abstract.event === 'object' ? abstract.event._id : abstract.event;
        if (!eventIdToUse) {
            throw new Error("Event ID is missing from abstract data.");
        }
        
        const response = await abstractService.submitReview(eventIdToUse, abstractId, reviewData);

        if (!response || !response.success) {
            throw new Error(response?.message || 'Failed to submit review.');
        }
        
        toast.success('Review submitted successfully!');
        // Update local abstract state with the new review details
        setAbstract(response.data); 
        // Update the displayed previous review
        const updatedReview = response.data.reviewDetails?.reviews?.find(
           r => r.reviewer?._id === authUser._id || r.reviewer === authUser._id
        );
        setMyPreviousReview(updatedReview);

    } catch (err) {
        console.error(`Error submitting review:`, err);
        setReviewError(err.message || 'An error occurred while submitting the review.');
        toast.error(err.message || 'An error occurred while submitting the review.');
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleDownloadAttachedFile = async () => {
    if (!abstract || !abstract.fileUrl || !abstract.event) {
      toast.error('File information or event context is missing.');
      return;
    }
    const eventIdToUse = typeof abstract.event === 'object' ? abstract.event._id : abstract.event;
    if (!eventIdToUse) {
        toast.error('Event ID is missing for file download.');
        return;
    }

    setIsDownloadingFile(true);
    try {
      const result = await abstractService.downloadAbstractAttachment(eventIdToUse, abstract._id);
      if (result.success && result.blob) {
        const url = window.URL.createObjectURL(result.blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', result.filename || 'abstract-attachment'); // Use filename from service
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.success('File download started.');
      } else {
        throw new Error(result.message || 'Failed to download file.');
      }
    } catch (err) {
      console.error('Error downloading attached file:', err);
      toast.error(`Download failed: ${err.message}`);
    } finally {
      setIsDownloadingFile(false);
    }
  };

  // Helper to format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric'
      });
    } catch (e) { return 'Invalid Date'; }
  };

  // --- Render Logic --- 

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Spinner size="lg" /> <span className="ml-3">Loading Abstract...</span></div>;
  }

  if (error) {
    return (
      <Alert type="error" message={error}>
        <Link to="/reviewer/dashboard" className="text-indigo-600 hover:underline mt-2 inline-block">Go back to Dashboard</Link>
      </Alert>
    );
  }

  if (!abstract) {
    return (
       <Alert type="warning" message="Abstract not found.">
         <Link to="/reviewer/dashboard" className="text-indigo-600 hover:underline mt-2 inline-block">Go back to Dashboard</Link>
       </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Link 
        to="/reviewer/dashboard" 
        state={{ reviewedAbstractId: abstractId, newStatus: reviewDecision, eventId: eventId }}
        className="text-indigo-600 hover:underline"
      >
        &larr; Back to Dashboard
      </Link>
      
      <Card 
        className="shadow-sm"
        title={abstract.title}
        headerClassName="pb-3 text-xl font-semibold"
        bodyClassName="space-y-4 pt-4"
      >
        <p className="text-sm text-gray-500">Abstract ID: {abstract.abstractNumber || abstract._id}</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div><strong className="font-medium text-gray-700">Authors:</strong> {abstract.authors}</div>
          <div><strong className="font-medium text-gray-700">Affiliations:</strong> {abstract.authorAffiliations || 'N/A'}</div>
          <div><strong className="font-medium text-gray-700">Topic/Category:</strong> {abstract.topic || 'N/A'}</div>
          <div><strong className="font-medium text-gray-700">Submission Type:</strong> {abstract.submissionType || 'N/A'}</div>
          <div><strong className="font-medium text-gray-700">Submission Date:</strong> {formatDate(abstract.submissionDate)}</div>
          <div><strong className="font-medium text-gray-700">Keywords:</strong> {abstract.keywords?.join(', ') || 'None'}</div>
        </div>

        <div className="border-t pt-4">
          <h2 className="text-lg font-semibold mb-2">Abstract Content</h2>
          <div className="prose prose-sm max-w-none bg-gray-50 p-3 border rounded" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(abstract.content) }} /> 
        </div>
        
        {abstract.fileUrl && (
          <div className="border-t pt-4">
            <h3 className="text-md font-semibold mb-2">Associated File</h3>
            <Button 
              onClick={handleDownloadAttachedFile}
              disabled={isDownloadingFile}
              variant="primary"
              size="sm"
            >
              {isDownloadingFile ? (
                <><Spinner size="sm" className="mr-2"/>Downloading...</>
              ) : (
                `Download File (${abstract.fileName || 'File'})`
              )}
            </Button>
          </div>
        )}
      </Card>

      {myPreviousReview && (
        <Card 
          className="shadow-sm border-blue-300"
          title={`Your Previous Review (${formatDate(myPreviousReview.reviewedAt)})`}
          headerClassName="bg-blue-50 pb-3 text-lg font-semibold text-blue-800"
          bodyClassName="space-y-2 text-sm pt-3"
        >
          <p><strong className="font-medium text-gray-700">Decision:</strong> {myPreviousReview.decision}</p>
          {myPreviousReview.score !== null && <p><strong className="font-medium text-gray-700">Score:</strong> {myPreviousReview.score}</p>}
          <div>
             <strong className="font-medium text-gray-700">Comments:</strong>
             <p className="whitespace-pre-wrap mt-1 p-2 border rounded bg-gray-50 text-xs">{myPreviousReview.comments || 'No comments provided.'}</p>
          </div>
          <p className="text-xs text-blue-700 pt-2">You can update your review below.</p>
        </Card>
      )}

      <Card 
        className="shadow-sm"
        title={myPreviousReview ? 'Update Your Review' : 'Submit Your Review'}
        headerClassName="pb-3 text-lg font-semibold"
        bodyClassName="pt-4"
      >
        <form onSubmit={handleReviewSubmit} className="space-y-4">
          <div>
            <label htmlFor="reviewDecision">Recommendation <span className="text-red-500">*</span></label>
            <Select 
              id="reviewDecision"
              value={reviewDecision}
              onChange={(val) => { console.log('[Select onChange] New value:', val); setReviewDecision(val); }}
              options={[
                  { value: 'undecided', label: 'Select decision...' },
                  { value: 'accept', label: 'Accept' },
                  { value: 'revise', label: 'Request Revision' },
                  { value: 'reject', label: 'Reject' }
              ]}
              className="mt-1"
              required
            />
          </div>
          <div>
            <label htmlFor="reviewScore">Score (Optional)</label>
            <Input 
              type="number" id="reviewScore" value={reviewScore}
              onChange={(e) => setReviewScore(e.target.value)}
              placeholder="e.g., 1-10"
              className="mt-1"
            />
          </div>
          <div>
            <label htmlFor="reviewComments">Comments</label>
            <Textarea 
              id="reviewComments" rows={6} value={reviewComments}
              onChange={(e) => setReviewComments(e.target.value)}
              placeholder="Provide detailed feedback for the author/committee..."
              className="mt-1"
            />
          </div>
          <div className="pt-2">
            {reviewError && <Alert type="error" message={reviewError} className="mb-3"/>}
            <Button 
              type="submit" 
              disabled={isSubmitting || reviewDecision === 'undecided'}
              className="w-full"
            >
              {isSubmitting ? <><Spinner size="sm" className="mr-2"/>Submitting...</> : (myPreviousReview ? 'Update Review' : 'Submit Review')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default ReviewerAbstractReviewPage; 