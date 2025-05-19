// Test change for Git
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import reviewerService from '../../services/reviewerService';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowDownTrayIcon, DocumentTextIcon, MagnifyingGlassIcon, FolderOpenIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

const ReviewerDashboardPage = () => {
  const [assignedAbstracts, setAssignedAbstracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const auth = useAuth();
  const { user, currentEventId } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'revisions', 'completed'
  const [activeRevisionSubTab, setActiveRevisionSubTab] = useState('awaitingAuthor'); // 'awaitingAuthor', 'needsRereview'
  const [searchTerm, setSearchTerm] = useState('');
  const [isDownloadingFiles, setIsDownloadingFiles] = useState(false);
  const [isExportingDetails, setIsExportingDetails] = useState(false);

  useEffect(() => {
    const fetchAssignedAbstracts = async () => {
      if (!currentEventId) {
        setError('No active event selected. Cannot load abstracts.');
        console.warn('[ReviewerDashboardPage] currentEventId is not set in AuthContext. Abstracts will not be loaded.');
        setLoading(false);
        setAssignedAbstracts([]);
        return;
      }
      setLoading(true);
      setError('');
      try {
        const response = await reviewerService.getAssignedAbstracts(currentEventId);
        if (response.success) {
          let abstractsData = response.data;
          if (location.state?.reviewedAbstractId && location.state?.newStatus) {
            console.log('[ReviewerDashboardPage] Location state from review page (for observation):', location.state);
            const abstractFromState = abstractsData.find(a => a._id === location.state.reviewedAbstractId);
            console.log(`[ReviewerDashboardPage] Abstract ${location.state.reviewedAbstractId} as received from API: ${JSON.stringify(abstractFromState)}`);
            
            navigate(location.pathname, { replace: true, state: {} });
          }
          setAssignedAbstracts(abstractsData);
        } else {
          setError(response.message || 'Failed to load assigned abstracts.');
          toast.error(response.message || 'Failed to load assigned abstracts.');
          if (response.status === 401 || response.status === 403) {
            toast.error('Authentication error. Please log in again.');
            auth.logout();
            navigate('/reviewer/login');
          }
        }
      } catch (fetchError) {
        console.error("Error in fetchAssignedAbstracts:", fetchError);
        setError('An unexpected error occurred while fetching abstracts.');
        toast.error('An unexpected error occurred while fetching abstracts.');
      }
      setLoading(false);
    };

    if (user && currentEventId) {
    fetchAssignedAbstracts();
    } else if (!user) {
      setLoading(false);
    } else if (user && !currentEventId) {
      setLoading(false);
      setAssignedAbstracts([]);
      setError('No event context. Please log in via an event-specific reviewer portal link.');
    }
  }, [user, currentEventId, auth, navigate, location]);

  const handleLogout = async () => {
    try {
      const eventIdForRedirect = currentEventId; // Capture eventId before logout
      await auth.logout();
      toast.success('Logged out successfully!');
      if (eventIdForRedirect) {
        navigate(`/portal/reviewer/${eventIdForRedirect}`);
      } else {
        // Fallback if eventId was somehow not available
        console.warn('[ReviewerDashboardPage] currentEventId was not available before logout. Falling back to generic login.');
      navigate('/reviewer/login');
      }
    } catch (e) {
      toast.error('Logout failed. Please try again.');
      console.error('Logout error:', e);
    }
  };

  const handleDownloadAbstractFiles = async () => {
    if (!currentEventId) {
      toast.error('No active event selected. Cannot download files.');
      return;
    }
    if (assignedAbstracts.length === 0) {
      toast.error('No abstracts assigned to download files for.');
      return;
    }

    setIsDownloadingFiles(true);
    try {
      const response = await reviewerService.downloadAssignedAbstractFiles(currentEventId);

      if (response.success && response.data?.fileUrl) {
        const link = document.createElement('a');
        link.href = response.data.fileUrl;
        link.setAttribute('download', response.data.filename || `reviewer_abstract_files_${currentEventId}.zip`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(response.data.fileUrl);
        toast.success('Abstract files are being downloaded!');
      } else {
        toast.error(response.message || 'Failed to download abstract files.');
      }
    } catch (err) {
      console.error('Error downloading abstract files:', err);
      toast.error('An unexpected error occurred while downloading files.');
    } finally {
      setIsDownloadingFiles(false);
    }
  };

  const handleExportAbstractDetails = async () => {
    if (!currentEventId) {
      toast.error('No active event selected. Cannot export details.');
      return;
    }
    if (assignedAbstracts.length === 0) {
      toast.error('No abstracts assigned to export details for.');
      return;
    }

    setIsExportingDetails(true);
    try {
      const response = await reviewerService.exportAssignedAbstractDetails(currentEventId);

      if (response.success && response.data?.fileUrl) {
        const link = document.createElement('a');
        link.href = response.data.fileUrl;
        link.setAttribute('download', response.data.filename || `reviewer_abstract_details_${currentEventId}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(response.data.fileUrl);
        toast.success('Abstract details are being exported!');
      } else {
        toast.error(response.message || 'Failed to export abstract details.');
      }
    } catch (err) {
      console.error('Error exporting abstract details:', err);
      toast.error('An unexpected error occurred while exporting details.');
    } finally {
      setIsExportingDetails(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (e) {
      return 'Invalid Date';
    }
  };

  // Categorize abstracts using useMemo
  const pendingAbstracts = useMemo(() => {
    console.log('[ReviewerDashboardPage] Recalculating pendingAbstracts');
    return assignedAbstracts.filter(abstract => {
      const status = abstract.myReviewStatus ? abstract.myReviewStatus.trim().toLowerCase() : '';
      return status === 'pending' || status === 'not-reviewed' || status === 'under-review' || status === '';
    });
  }, [assignedAbstracts]);

  const awaitingAuthorAbstracts = useMemo(() => {
    console.log('[ReviewerDashboardPage] Recalculating awaitingAuthorAbstracts');
    return assignedAbstracts.filter(abstract => {
      const status = abstract.myReviewStatus ? abstract.myReviewStatus.trim().toLowerCase() : '';
      return status === 'revision-requested' || status === 'revise';
    });
  }, [assignedAbstracts]);

  const revisedAwaitingRereviewAbstracts = useMemo(() => {
    console.log('[ReviewerDashboardPage] Recalculating revisedAwaitingRereviewAbstracts');
    return assignedAbstracts.filter(abstract => {
      const status = abstract.myReviewStatus ? abstract.myReviewStatus.trim().toLowerCase() : '';
      return status === 'revised_awaiting_rereview' || status === 'resubmitted_for_review';
    });
  }, [assignedAbstracts]);

  const completedAbstracts = useMemo(() => {
    console.log('[ReviewerDashboardPage] Recalculating completedAbstracts. Input assignedAbstracts length:', assignedAbstracts.length);
    let countMatching = 0;
    const result = assignedAbstracts.filter((abstract, index) => {
      const originalMyReviewStatus = abstract.myReviewStatus;
      const status = originalMyReviewStatus ? originalMyReviewStatus.trim().toLowerCase() : '';
      const isMatch = status === 'accept' || status === 'reject';
      
      // Log details for each abstract being filtered for 'completed'
      // To reduce log noise, only log if it's a potential match or if it's the abstract we are interested in from location.state
      if (isMatch || (location.state?.reviewedAbstractId && abstract._id === location.state.reviewedAbstractId) || index < 5) { // Log first 5 for general overview
        console.log(`[ReviewerDashboardPage] Filtering for completed: Abstract ID: ${abstract._id}, Original myReviewStatus: '${originalMyReviewStatus}', Processed status: '${status}', Is Match: ${isMatch}`);
      }

      if (isMatch) {
        countMatching++;
      }
      return isMatch;
    });
    console.log('[ReviewerDashboardPage] Recalculated completedAbstracts. Number of items that matched filter:', countMatching, 'Final result length:', result.length);
    if (result.length > 0) {
      console.log('[ReviewerDashboardPage] First item in newly calculated completedAbstracts:', JSON.stringify(result[0]));
    }
    return result;
  }, [assignedAbstracts, location.state?.reviewedAbstractId]); // Added location.state.reviewedAbstractId to deps to ensure re-calc if that ID is present for logging context, though filter only depends on assignedAbstracts

  // Log state before rendering
  console.log('[ReviewerDashboardPage] Values right before render:');
  console.log('  - activeTab:', activeTab);
  console.log('  - activeRevisionSubTab:', activeRevisionSubTab);
  console.log('  - searchTerm:', searchTerm);
  console.log('  - assignedAbstracts length:', assignedAbstracts.length);
  console.log('  - pendingAbstracts length:', pendingAbstracts.length);
  console.log('  - awaitingAuthorAbstracts length:', awaitingAuthorAbstracts.length);
  console.log('  - revisedAwaitingRereviewAbstracts length:', revisedAwaitingRereviewAbstracts.length);
  console.log('  - completedAbstracts length:', completedAbstracts.length);
  if (completedAbstracts.length > 0) {
    console.log('  - First item in completedAbstracts:', JSON.stringify(completedAbstracts[0]));
  }

  const renderAbstractList = (abstracts, categoryTitle) => {
    const filteredAbstracts = abstracts.filter(abstract =>
      abstract.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filteredAbstracts.length === 0) {
      if (searchTerm) {
        return (
          <div className="text-center py-10 bg-white rounded-lg shadow-md">
            <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">No Results</h3>
            <p className="mt-1 text-sm text-gray-500">No abstracts found matching "{searchTerm}" in the "{categoryTitle}" category.</p>
          </div>
        );
      }
      return (
        <div className="text-center py-10 bg-white rounded-lg shadow-md">
          <FolderOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">No Abstracts</h3>
          <p className="mt-1 text-sm text-gray-500">No abstracts in the "{categoryTitle}" category.</p>
        </div>
      );
    }

    return (
      <ul role="list" className="space-y-4">
        {filteredAbstracts.map((abstract) => {
          const eventId = abstract.event?._id || abstract.event;
          let statusText = abstract.myReviewStatus ? abstract.myReviewStatus.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'UNKNOWN';
          let statusColorClass = 'bg-gray-100 text-gray-800'; // Default
          if (abstract.myReviewStatus) {
            const lowerStatus = abstract.myReviewStatus.toLowerCase();
            if (lowerStatus === 'accepted' || lowerStatus === 'approved') {
              statusColorClass = 'bg-green-100 text-green-800';
            } else if (lowerStatus === 'rejected') {
              statusColorClass = 'bg-red-100 text-red-800';
            } else if (lowerStatus === 'pending' || lowerStatus === 'not-reviewed' || lowerStatus === 'under-review') {
              statusColorClass = 'bg-yellow-100 text-yellow-800';
            } else if (lowerStatus === 'revision-requested' || lowerStatus === 'revise') {
              statusColorClass = 'bg-blue-100 text-blue-800';
            }
          }

          return (
            <li key={abstract._id} className="bg-white shadow-lg rounded-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
              <Link 
                to={`/reviewer/abstract/${abstract._id}/review`} 
                state={{ eventId: eventId }}
                className="block group"
              >
                <div className="p-5 sm:p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-xl font-semibold text-indigo-700 group-hover:text-indigo-800 truncate pr-2">{abstract.title}</p>
                      {abstract.category?.name && (
                        <p className="mt-1 text-sm text-gray-600">
                          <span className="font-medium">Category:</span> {abstract.category.name}
                        </p>
                      )}
                    </div>
                    <div className="ml-2 flex-shrink-0">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColorClass}`}>
                        {statusText}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="sm:flex sm:justify-between items-center text-sm text-gray-500">
                      <div className="flex items-center">
                        <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        <span>{abstract.event?.name || 'Event details missing'}</span>
                      </div>
                      <div className="mt-2 sm:mt-0 sm:ml-6 flex items-center">
                        <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                        </svg>
                        <span>Submitted: {formatDate(abstract.submissionDate)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end items-center">
                    <span className="text-sm font-medium text-indigo-600 group-hover:text-indigo-700 flex items-center">
                      View / Review
                      <ArrowRightIcon className="ml-1.5 h-4 w-4" />
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-600"></div>
        <p className="ml-4 text-lg text-gray-700">Loading assigned abstracts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
        <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-md">
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">
            <div className="flex">
              <div className="py-1"><svg className="fill-current h-6 w-6 text-red-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zM11.414 10l2.829-2.828a1 1 0 1 0-1.414-1.414L10 8.586 7.172 5.757a1 1 0 0 0-1.414 1.414L8.586 10l-2.829 2.828a1 1 0 1 0 1.414 1.414L10 11.414l2.829 2.829a1 1 0 0 0 1.414-1.414L11.414 10z" clipPath="url(#clip0)" fillRule="evenodd"/></svg></div>
              <div>
                <p className="font-bold">Error Loading Abstracts</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const TabButton = ({ tabKey, title, badgeCount, currentActiveTabKey, onTabClick, isSubTab = false }) => (
    <button
      onClick={() => onTabClick(tabKey)}
      className={`relative group inline-flex items-center justify-center px-3 py-2.5 text-sm font-medium border-b-2 \
                  focus:outline-none transition-colors duration-150 ease-in-out \
                  ${currentActiveTabKey === tabKey
                    ? (isSubTab ? 'border-teal-500 text-teal-600 font-semibold' : 'border-indigo-600 text-indigo-700 font-semibold')
                    : (isSubTab ? 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300')}`
                }
    >
      {title}
      {badgeCount !== undefined && badgeCount > 0 && (
        <span className="ml-2 min-w-[20px] h-[20px] p-0.5 bg-red-600 text-white text-xs font-semibold rounded-full flex items-center justify-center">
          {badgeCount}
        </span>
      )}
    </button>
  );

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-50 min-h-screen">
      <header className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 tracking-tight mb-4 sm:mb-0">Reviewer Dashboard</h1>
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              onClick={handleExportAbstractDetails}
              disabled={isExportingDetails || loading || assignedAbstracts.length === 0}
              className="px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-50 flex items-center disabled:opacity-60 transition-colors duration-150"
            >
              <DocumentTextIcon className="h-5 w-5 mr-1.5" />
              {isExportingDetails ? 'Exporting...' : 'Export CSV'}
            </button>
            <button
              onClick={handleDownloadAbstractFiles}
              disabled={isDownloadingFiles || loading || assignedAbstracts.length === 0}
              className="px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-50 flex items-center disabled:opacity-60 transition-colors duration-150"
            >
              <ArrowDownTrayIcon className="h-5 w-5 mr-1.5" />
              {isDownloadingFiles ? 'Downloading...' : 'Download ZIP'}
            </button>
            <button
              onClick={handleLogout}
              className="px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-lg shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-50 transition-colors duration-150"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Tab Navigation and Search Bar */}
      <div className="mb-6">
        <div className="sm:flex sm:justify-between sm:items-center">
          <div className="mb-4 sm:mb-0">
            {/* Main Tabs */}
            <nav className="flex space-x-1 sm:space-x-2" aria-label="Main Tabs">
              <TabButton 
                tabKey="pending" 
                title="Pending Review" 
                badgeCount={pendingAbstracts.length} 
                currentActiveTabKey={activeTab}
                onTabClick={setActiveTab}
              />
              <TabButton 
                tabKey="revisions" 
                title="Revisions" 
                badgeCount={revisedAwaitingRereviewAbstracts.length > 0 ? (awaitingAuthorAbstracts.length + revisedAwaitingRereviewAbstracts.length) : 0} 
                currentActiveTabKey={activeTab}
                onTabClick={setActiveTab}
              />
              <TabButton 
                tabKey="completed" 
                title="Review Completed" 
                currentActiveTabKey={activeTab}
                onTabClick={setActiveTab}
              />
            </nav>
          </div>
          <div className="relative flex-grow sm:flex-grow-0 sm:w-auto">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="text"
              placeholder="Search abstracts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full sm:w-64 md:w-72 py-2 pl-10 pr-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white placeholder-gray-400"
            />
          </div>
        </div>
      </div>

      {/* Sub Tabs for Revisions */} 
      {activeTab === 'revisions' && (
        <div className="mb-4 pl-1 sm:pl-2 border-b border-gray-200">
          <nav className="flex space-x-1 sm:space-x-2" aria-label="Revision Sub-Tabs">
            <TabButton
              tabKey="awaitingAuthor"
              title="Awaiting Author"
              currentActiveTabKey={activeRevisionSubTab}
              onTabClick={setActiveRevisionSubTab}
              isSubTab={true}
            />
            <TabButton
              tabKey="needsRereview"
              title="Re-Review"
              badgeCount={revisedAwaitingRereviewAbstracts.length}
              currentActiveTabKey={activeRevisionSubTab}
              onTabClick={setActiveRevisionSubTab}
              isSubTab={true}
            />
          </nav>
        </div>
      )}

      {assignedAbstracts.length === 0 && !loading && !error ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <FolderOpenIcon className="mx-auto h-16 w-16 text-gray-400" />
          <h3 className="mt-3 text-lg font-medium text-gray-900">No Abstracts Assigned</h3>
          <p className="mt-1 text-sm text-gray-500">You currently have no abstracts assigned for review in this event.</p>
          { !currentEventId && <p className="mt-1 text-sm text-orange-600">Ensure you are logged into a specific event.</p>}
        </div>
      ) : (
        <div className="mt-4">
          {activeTab === 'pending' && renderAbstractList(pendingAbstracts, 'Pending Review')}
          {activeTab === 'revisions' && activeRevisionSubTab === 'awaitingAuthor' && renderAbstractList(awaitingAuthorAbstracts, 'Revisions: Awaiting Author')}
          {activeTab === 'revisions' && activeRevisionSubTab === 'needsRereview' && renderAbstractList(revisedAwaitingRereviewAbstracts, 'Revisions: Re-Review')}
          {activeTab === 'completed' && renderAbstractList(completedAbstracts, 'Review Completed')}
        </div>
      )}
    </div>
  );
};

export default ReviewerDashboardPage; 