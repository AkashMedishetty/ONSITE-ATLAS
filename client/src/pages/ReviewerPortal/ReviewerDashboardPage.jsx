import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import reviewerService from '../../services/reviewerService';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

const ReviewerDashboardPage = () => {
  const [assignedAbstracts, setAssignedAbstracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAssignedAbstracts = async () => {
      setLoading(true);
      setError('');
      const response = await reviewerService.getAssignedAbstracts();
      if (response.success) {
        setAssignedAbstracts(response.data);
      } else {
        setError(response.message || 'Failed to load assigned abstracts.');
        toast.error(response.message || 'Failed to load assigned abstracts.');
        if (response.status === 401 || response.status === 403) {
          toast.error('Authentication error. Please log in again.');
          auth.logout();
          navigate('/reviewer/login');
        }
      }
      setLoading(false);
    };
    fetchAssignedAbstracts();
  }, [auth, navigate]);

  const handleLogout = async () => {
    try {
      await auth.logout();
      toast.success('Logged out successfully!');
      navigate('/reviewer/login');
    } catch (e) {
      toast.error('Logout failed. Please try again.');
      console.error('Logout error:', e);
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
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{error}</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Assigned Abstracts for Review</h1>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
        >
          Logout
        </button>
      </div>
      {assignedAbstracts.length === 0 ? (
        <div className="text-center py-10">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No abstracts assigned</h3>
          <p className="mt-1 text-sm text-gray-500">You currently have no abstracts assigned for review.</p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul role="list" className="divide-y divide-gray-200">
            {assignedAbstracts.map((abstract) => {
              const eventId = abstract.event?._id || abstract.event;
              return (
                <li key={abstract._id}>
                  <Link 
                    to={`/reviewer/abstract/${abstract._id}/review`} 
                    state={{ eventId: eventId }}
                    className="block hover:bg-gray-50"
                  >
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <p className="text-lg font-medium text-indigo-600 truncate">{abstract.title}</p>
                        {abstract.category && (
                          <div className="mt-1 text-sm text-gray-500">
                            <span className="font-semibold">Category:</span> {abstract.category.name || 'No category'}
                          </div>
                        )}
                        <div className="ml-2 flex-shrink-0 flex">
                          <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${abstract.myReviewStatus === 'accepted' || abstract.myReviewStatus === 'approved' ? 'bg-green-100 text-green-800' : abstract.myReviewStatus === 'rejected' ? 'bg-red-100 text-red-800' : abstract.myReviewStatus === 'pending' || abstract.myReviewStatus === 'not-reviewed' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                            {abstract.myReviewStatus ? abstract.myReviewStatus.replace('-', ' ').toUpperCase() : 'UNKNOWN'}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <p className="flex items-center text-sm text-gray-500">
                            <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                            {abstract.event?.name || 'Event details missing'}
                          </p>
                          <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                            <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                            </svg>
                            Submitted: {formatDate(abstract.submissionDate)}
                          </p>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                          <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                             <path d="M17.59 7.59L12 13.17 6.41 7.59 5 9l7 7 7-7-1.41-1.41z"/>
                          </svg>
                          View / Review
                        </div>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ReviewerDashboardPage; 