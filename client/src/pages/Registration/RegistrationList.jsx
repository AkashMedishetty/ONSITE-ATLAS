import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowPathIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon,
  UserPlusIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { Card, Button, Badge, Spinner } from '../../components/common';
import registrationService from '../../services/registrationService';
import eventService from '../../services/eventService';

function RegistrationList() {
  const [registrations, setRegistrations] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [eventFilter, setEventFilter] = useState('all');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [refreshing, setRefreshing] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Initialize filters from URL params
  useEffect(() => {
    const page = searchParams.get('page') || 1;
    const status = searchParams.get('status') || 'all';
    const event = searchParams.get('event') || 'all';
    const search = searchParams.get('search') || '';
    
    setPagination(prev => ({ ...prev, page: Number(page) }));
    setStatusFilter(status);
    setEventFilter(event);
    setSearchTerm(search);
  }, [searchParams]);
  
  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (pagination.page > 1) params.set('page', pagination.page);
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (eventFilter !== 'all') params.set('event', eventFilter);
    if (searchTerm) params.set('search', searchTerm);
    
    setSearchParams(params);
  }, [pagination.page, statusFilter, eventFilter, searchTerm, setSearchParams]);
  
  // Fetch events for the filter
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const response = await eventService.getEvents();
        
        if (Array.isArray(response)) {
          setEvents(response);
        } else if (response && response.data) {
          setEvents(response.data);
        } else {
          setEvents([]);
        }
      } catch (error) {
        console.error('Error fetching events:', error);
        setError('Failed to load events');
      }
    };
    
    loadEvents();
  }, []);
  
  // Fetch registrations with filters
  useEffect(() => {
    const fetchRegistrations = async () => {
      try {
        setLoading(true);
        
        // Prepare filter params
        const params = {
          page: pagination.page,
          limit: pagination.limit
        };
        
        if (statusFilter !== 'all') params.status = statusFilter;
        if (eventFilter !== 'all') params.eventId = eventFilter;
        if (searchTerm) params.search = searchTerm;
        
        // Extract eventId from params, defaulting to 'all' if not present
        const eventId = params.eventId || 'all';
        
        // Remove eventId from params since it will be passed separately
        if (params.eventId) delete params.eventId;
        
        const response = await registrationService.getRegistrations(eventId, params);
        
        if (response.success) {
          setRegistrations(response.data || []);
          setPagination({
            page: response.pagination?.currentPage || 1,
            limit: response.pagination?.limit || 10,
            total: response.pagination?.total || 0,
            totalPages: response.pagination?.totalPages || 1
          });
        } else {
          setError(response.message || 'Failed to fetch registrations');
          // Provide empty data with error
          setRegistrations([]);
        }
      } catch (err) {
        console.error('Error fetching registrations:', err);
        setError('Failed to fetch registrations. Please try again.');
        setRegistrations([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };
    
    fetchRegistrations();
  }, [pagination.page, pagination.limit, statusFilter, eventFilter, searchTerm, refreshing]);
  
  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
  };
  
  // Handle pagination
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    setPagination(prev => ({ ...prev, page: newPage }));
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    try {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (err) {
      return 'Invalid date';
    }
  };
  
  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'registered':
        return 'bg-blue-100 text-blue-800';
      case 'checked-in':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Handle search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // Reset to first page on new search
    setPagination(prev => ({ ...prev, page: 1 }));
  };
  
  // Handle filter change
  const handleFilterChange = (filter, value) => {
    // Reset to first page on filter change
    setPagination(prev => ({ ...prev, page: 1 }));
    
    if (filter === 'status') {
      setStatusFilter(value);
    } else if (filter === 'event') {
      setEventFilter(value);
    }
  };
  
  if (loading && !refreshing) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
        <span className="ml-2 text-gray-500">Loading registrations...</span>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Registrations</h1>
          <p className="text-gray-500 mt-1">Manage event registrations and attendees</p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center">
          <Button 
            variant="outline" 
            leftIcon={<ArrowPathIcon className="h-5 w-5" />}
            onClick={handleRefresh}
            disabled={refreshing}
            className="mr-2"
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Link to="/registrations/new" className="inline-block">
            <Button variant="primary" leftIcon={<UserPlusIcon className="h-5 w-5" />}>
              New Registration
            </Button>
          </Link>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6" role="alert">
          <div className="font-medium">Error</div>
          <div className="text-sm">{error}</div>
        </div>
      )}
      
      {/* Filters and Search */}
      <Card className="p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search box */}
          <div>
            <form onSubmit={handleSearchSubmit}>
            <label htmlFor="search" className="sr-only">Search</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="search"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Search by ID, name, or email"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            </form>
          </div>
          
          {/* Status filter */}
          <div>
            <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              id="statusFilter"
              className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
              value={statusFilter}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="registered">Registered</option>
              <option value="checked-in">Checked In</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          
          {/* Event filter */}
          <div>
            <label htmlFor="eventFilter" className="block text-sm font-medium text-gray-700 mb-1">Event</label>
            <select
              id="eventFilter"
              className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
              value={eventFilter}
              onChange={(e) => handleFilterChange('event', e.target.value)}
            >
              <option value="all">All Events</option>
              {events.map(event => (
                <option key={event._id} value={event._id}>
                  {event.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>
      
      {/* Registrations Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Registration ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {refreshing && (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center">
                    <Spinner size="sm" className="inline" />
                    <span className="ml-2 text-gray-500">Refreshing...</span>
                  </td>
                </tr>
              )}
              
              {!refreshing && registrations.length > 0 ? (
                registrations.map((registration) => (
                  <motion.tr 
                    key={registration._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-600">
                      <Link to={`/registrations/${registration._id}`} className="hover:underline">
                        {registration.registrationId}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      {`${registration.personalInfo?.firstName || ''} ${registration.personalInfo?.lastName || ''}`}
                      <div className="text-xs text-gray-500">{registration.personalInfo?.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      {registration.category && (
                        <>
                      <span 
                        className="inline-block w-3 h-3 rounded-full mr-1" 
                            style={{ backgroundColor: registration.category.color || '#9CA3AF' }}
                      ></span>
                      {registration.category.name}
                        </>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      {registration.event?.name || 'Unknown Event'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Badge 
                        variant={registration.status === 'checked-in' ? 'success' : 
                               registration.status === 'cancelled' ? 'danger' : 'primary'}
                        size="sm"
                      >
                        {registration.status?.charAt(0).toUpperCase() + registration.status?.slice(1) || 'Unknown'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      {formatDate(registration.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Link 
                          to={`/registrations/${registration._id}`} 
                          className="text-primary-600 hover:text-primary-900"
                          title="View details"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </Link>
                        <Link 
                          to={`/registrations/${registration._id}/edit`} 
                          className="text-gray-600 hover:text-gray-900"
                          title="Edit"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>
                        <Link 
                          to={`/registrations/${registration._id}/badge`} 
                          className="text-green-600 hover:text-green-900"
                          title="Print badge"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                          </svg>
                        </Link>
                        <button 
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this registration?')) {
                              // Delete logic would go here
                              // registrationService.deleteRegistration(registration._id)
                              //   .then(() => handleRefresh())
                              //   .catch(err => setError('Failed to delete registration'));
                            }
                          }}
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              ) : !refreshing && (
                <tr>
                  <td colSpan="7" className="px-6 py-6 text-center text-gray-500">
                    {searchTerm || statusFilter !== 'all' || eventFilter !== 'all' ? (
                      <>
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        <p className="mt-2 text-sm font-medium">No registrations found</p>
                        <p className="mt-1 text-sm text-gray-500">Try adjusting your filters or search term</p>
                      </>
                    ) : (
                      <>
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                        <p className="mt-2 text-sm font-medium">No registrations yet</p>
                        <p className="mt-1 text-sm text-gray-500">Create a new registration to get started</p>
                      </>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {registrations.length > 0 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{registrations.length === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(pagination.page * pagination.limit, pagination.total)}
                  </span>{' '}
                  of <span className="font-medium">{pagination.total}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                      pagination.page === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <span className="sr-only">Previous</span>
                    <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                  
                  {[...Array(pagination.totalPages).keys()].map(i => {
                    const pageNumber = i + 1;
                    // Show limited page numbers
                    if (
                      pageNumber === 1 ||
                      pageNumber === pagination.totalPages ||
                      (pageNumber >= pagination.page - 1 && pageNumber <= pagination.page + 1)
                    ) {
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => handlePageChange(pageNumber)}
                          aria-current={pagination.page === pageNumber ? 'page' : undefined}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            pagination.page === pageNumber
                              ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    } else if (
                      (pageNumber === 2 && pagination.page > 3) ||
                      (pageNumber === pagination.totalPages - 1 && pagination.page < pagination.totalPages - 2)
                    ) {
                      // Add ellipsis for skipped pages
                      return (
                        <span
                          key={`ellipsis-${pageNumber}`}
                          className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                        >
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}
                  
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                      pagination.page === pagination.totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <span className="sr-only">Next</span>
                    <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                </nav>
              </div>
        </div>
      </div>
        )}
      </Card>
    </div>
  );
}

export default RegistrationList; 