import React, { useState, useEffect, useCallback } from 'react';
// import { Container, Row, Col, Card, Badge, Button, Alert, Spinner, Table, Form, InputGroup, Modal } from 'react-bootstrap';
import { useParams, Link } from 'react-router-dom';
// import { FaFileAlt, FaDownload, FaPlusCircle, FaSearch, FaFilter, FaSort, FaInfoCircle, FaSync, FaEdit, FaTrash, FaEye } from 'react-icons/fa';
import {
  DocumentTextIcon,
  ArrowDownTrayIcon,
  PlusCircleIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  ArrowsUpDownIcon,
  InformationCircleIcon,
  ArrowPathIcon,
  PencilSquareIcon,
  TrashIcon,
  EyeIcon,
  NoSymbolIcon, // For no abstracts found
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
// import { Typography } from '@mui/material'; // Assuming we'll use Tailwind for typography
import { abstractService, eventService } from '../../services';
import apiRegistrant from '../../services/apiRegistrant';
import { useRegistrantAuth } from '../../contexts/RegistrantAuthContext';
import { useActiveEvent } from '../../contexts/ActiveEventContext';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import { API_BASE_URL_STATIC } from '../../config'; // Import API_BASE_URL_STATIC

// Assuming you have these common components, adjust path if necessary
import { Button, Card, Badge, Alert, Spinner, Modal } from '../../components/common';


const AbstractsList = () => {
  const { abstractId: paramAbstractId } = useParams(); // If an abstractId is in path
  const { activeEventId } = useActiveEvent(); // Get eventId from context
  
  const { currentRegistrant } = useRegistrantAuth();
  const [abstracts, setAbstracts] = useState([]);
  const [eventDetails, setEventDetails] = useState(null); // State for event details
  const [eventCategories, setEventCategories] = useState([]); // State for event categories
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState('submissionDate');
  const [sortDirection, setSortDirection] = useState('desc');
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [abstractToDelete, setAbstractToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Determine the eventId to use from context
  const eventIdToUse = activeEventId;
  
  // Define loadData in the component scope
  // Use useCallback for functions that are dependencies of useEffect or passed to children
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    let fetchedAbstracts = [];
    let fetchedEventDetails = null;

    if (!eventIdToUse) {
      setError('Please select an event to view abstracts, or ensure an event context is active.');
      setLoading(false);
      setAbstracts([]);
      return;
    }

    try {
      const eventResponse = await eventService.getEventById(eventIdToUse);
      if (eventResponse.success && eventResponse.data) {
        fetchedEventDetails = eventResponse.data;
        setEventDetails(fetchedEventDetails);
        const categoriesFromEvent = fetchedEventDetails.abstractSettings?.categories?.map(cat => ({
          value: cat._id,
          label: cat.name,
          subTopics: cat.subTopics || [],
          ...cat
        })) || [];
        setEventCategories(categoriesFromEvent);
      } else {
        throw new Error(eventResponse.message || 'Failed to fetch event details for category mapping.');
      }

      if (paramAbstractId) {
        if (!currentRegistrant?._id) {
          setError('Registrant information not available. Cannot fetch specific abstract.');
          setAbstracts([]);
          setLoading(false);
          return;
        }
        const singleAbstractResponse = await abstractService.getAbstractById(eventIdToUse, paramAbstractId);
        if (singleAbstractResponse.success && singleAbstractResponse.data) {
          fetchedAbstracts = [singleAbstractResponse.data];
        } else {
          throw new Error(singleAbstractResponse.message || 'Failed to fetch single abstract details.');
        }
      } else if (currentRegistrant?._id) {
        const response = await abstractService.getAbstracts(eventIdToUse, { registration: currentRegistrant._id });
        if (response.success) {
          fetchedAbstracts = response.data || [];
        } else {
          throw new Error(response.message || 'Failed to fetch abstracts');
        }
      } else {
        setError('Registrant information not available. Cannot fetch abstracts.');
      }
      setAbstracts(fetchedAbstracts);
    } catch (err) {
      console.error('Failed to load data for AbstractsList:', err);
      setError(`Failed to load data: ${err.message}`);
      setAbstracts([]);
    } finally {
      setLoading(false);
    }
  }, [eventIdToUse, paramAbstractId, currentRegistrant]); // Added dependencies for useCallback

  useEffect(() => {
    loadData(); // Call loadData from useEffect
  }, [loadData]); // Use loadData directly as dependency

  const handleDownload = async (abstractId) => {
    try {
      console.log(`[AbstractsList] Attempting to download abstract ${abstractId}...`);
      const abstract = abstracts.find(a => a._id === abstractId);

      if (!abstract) {
        toast.error("Abstract details not found to initiate download.");
        return;
      }
      
      // Prefer direct fileUrl if available (mirroring AbstractPortal behavior)
      if (abstract.fileUrl) {
        console.log('[AbstractsList] Using direct file URL from abstract data:', abstract.fileUrl);
        const fullFileUrl = `${API_BASE_URL_STATIC}${abstract.fileUrl}`; // Construct full URL
        window.open(fullFileUrl, '_blank');
        toast.success('File download initiated via direct URL.');
        return;
      }
      
      // Fallback to API download if no direct fileUrl
      // This uses an endpoint that should be secured for the registrant
      console.log(`[AbstractsList] No direct fileUrl. Attempting API download for abstract ${abstractId} under event ${eventIdToUse}.`);
      if (!eventIdToUse) {
          toast.error("Cannot download file: Event ID is missing.");
          console.error("[AbstractsList] Event ID missing for API download call.");
          return;
      }

      // Using apiRegistrant directly for this specific endpoint pattern, similar to original working code for downloads.
      // The service layer doesn't have a specific function for this GET pattern with responseType blob.
      const response = await apiRegistrant.get(`/events/${eventIdToUse}/abstracts/${abstractId}/file`, { 
        responseType: 'blob' 
      });
      
      const suggestedFilename = response.headers['content-disposition']
        ?.split('filename=')[1]?.replace(/"/g, '') || `abstract-${abstractId}.pdf`; // Default or from header

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
      console.error('[AbstractsList] Failed to download abstract:', err);
      toast.error(err.response?.data?.message || err.message || 'Failed to download the abstract.');
    }
  };

  const handleDeleteClick = (abstract) => {
    setAbstractToDelete(abstract);
    setShowDeleteModal(true);
  };

  const confirmDeleteAbstract = async () => {
    if (!abstractToDelete) return;
    
    if (!eventIdToUse) {
        console.error("[AbstractsList] Event ID is missing, cannot delete abstract.");
        toast.error("Cannot delete abstract: Event ID is missing.");
        setIsDeleting(false);
        return;
    }

    setIsDeleting(true);
    try {
      // Make sure abstractToDelete._id is valid
      if (!abstractToDelete._id) {
        toast.error("Cannot delete abstract: Abstract ID is missing.");
        setIsDeleting(false);
        return;
      }
      console.log(`[AbstractsList] Deleting abstract ${abstractToDelete._id} for event ${eventIdToUse}`);
      const response = await abstractService.deleteAbstract(eventIdToUse, abstractToDelete._id);
      if (response.success) {
        setAbstracts(prevAbstracts => prevAbstracts.filter(abs => abs._id !== abstractToDelete._id));
        toast.success(response.message || 'Abstract deleted successfully.');
        setShowDeleteModal(false);
        setAbstractToDelete(null);
      } else {
        // Log the full response for debugging if needed
        console.error("[AbstractsList] Delete abstract failed with response:", response);
        throw new Error(response.message || 'Failed to delete abstract from service.');
      }
    } catch (err) {
      console.error('[AbstractsList] Error during abstract deletion process:', err);
      toast.error(err.message || 'An unexpected error occurred while deleting the abstract.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Sort abstracts based on current sort field and direction
  const sortedAbstracts = React.useMemo(() => {
    if (!Array.isArray(abstracts)) return [];
    return [...abstracts].sort((a, b) => {
      let valueA, valueB;
      
      if (sortField === 'submissionDate') {
        valueA = new Date(a.submissionDate);
        valueB = new Date(b.submissionDate);
      } else if (sortField === 'title') {
        valueA = a.title?.toLowerCase() || '';
        valueB = b.title?.toLowerCase() || '';
      } else if (sortField === 'status') {
        valueA = a.status ? a.status.toLowerCase() : '';
        valueB = b.status ? b.status.toLowerCase() : '';
      } else if (sortField === 'event') { // Though event might be constant here
        valueA = a.event?.name?.toLowerCase() || '';
        valueB = b.event?.name?.toLowerCase() || '';
      }
      
      if (valueA === undefined || valueB === undefined) return 0; // Handle undefined comparison

      if (sortDirection === 'asc') {
        return valueA > valueB ? 1 : (valueA < valueB ? -1 : 0);
      } else {
        return valueA < valueB ? 1 : (valueA > valueB ? -1 : 0);
      }
    });
  }, [abstracts, sortField, sortDirection]);


  // Filter abstracts based on search term and status filter
  const filteredAbstracts = React.useMemo(() => {
    return sortedAbstracts.filter(abstract => {
      if (!abstract) return false; // Guard against null/undefined abstracts in the array
      const searchTermLower = searchTerm.toLowerCase();
      const matchesSearch = 
        abstract.title?.toLowerCase().includes(searchTermLower) ||
        abstract.submissionId?.toLowerCase().includes(searchTermLower) ||
        (abstract.authors && Array.isArray(abstract.authors) ?
          abstract.authors.some(author => 
            `${author.firstName} ${author.lastName}`.toLowerCase().includes(searchTermLower) ||
            author.email?.toLowerCase().includes(searchTermLower)
          ) : 
          typeof abstract.authors === 'string' && abstract.authors.toLowerCase().includes(searchTermLower)) ||
        // Assuming category is an object with a name property after fetching event details
        (eventCategories.find(cat => cat.value === abstract.category)?.label?.toLowerCase().includes(searchTermLower)) ||
        (abstract.keywords && Array.isArray(abstract.keywords) && abstract.keywords.some(k => k.toLowerCase().includes(searchTermLower)));
      
      const matchesStatus = statusFilter === 'all' || abstract.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [sortedAbstracts, searchTerm, statusFilter, eventCategories]);


  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getStatusBadge = (status) => {
    const statusLower = status ? status.toLowerCase() : 'unknown';
    let variant = 'secondary';
    let text = status || 'Unknown';

    switch (statusLower) {
      case 'accepted':
      case 'approved':
        variant = 'success';
        break;
      case 'rejected':
        variant = 'danger';
        break;
      case 'pending':
      case 'under-review':
      case 'submitted':
      case 'revision-requested':
        variant = 'warning';
        break;
      default:
        variant = 'neutral'; // Or your default badge variant
    }
    return <Badge variant={variant} size="sm">{text}</Badge>;
  };

  const getCategoryNameById = (categoryId) => {
    if (!categoryId || !eventCategories || eventCategories.length === 0) {
      return 'N/A'; // Or categoryId if preferred for fallback
    }
    const category = eventCategories.find(cat => cat.value === categoryId || cat._id === categoryId);
    return category ? category.label : categoryId; // Return ID if name not found
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh] p-4">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-0 shadow-sm mb-4 bg-white">
          <div className="p-4 sm:p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
              <div className="mb-3 md:mb-0">
                <h1 className="text-2xl font-bold text-gray-800">
                  My Abstracts
                </h1>
                <p className="text-sm text-gray-500">
                  Manage submissions for: {eventDetails?.name || 'Current Event'}
                </p>
              </div>
              <Button
                variant="primary"
                as={Link}
                to={`/registrant-portal/abstracts/new`}
                className="w-full md:w-auto"
                icon={<PlusCircleIcon className="h-5 w-5 mr-2" />}
              >
                Submit New Abstract
              </Button>
            </div>
          </div>
        </Card>
        <Alert 
          variant={error.includes('no abstracts') ? 'info' : 'danger'} 
          title={error.includes('no abstracts') ? 'No Abstracts Found' : 'Error Loading Abstracts'}
          description={error}
        >
          {!error.includes('no abstracts') && (
            <Button onClick={loadData} variant="outline" color={error.includes('no abstracts') ? 'info' : 'danger'} className="mt-2">
              <ArrowPathIcon className="h-5 w-5 mr-2" />
              Try Again
            </Button>
          )}
        </Alert>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-2 sm:px-4 py-6 sm:py-8">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div className="mb-3 sm:mb-0">
          <h1 className="text-2xl font-bold text-gray-800">
            My Abstracts: {eventDetails?.name || 'Current Event'}
          </h1>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button 
            variant="primary" 
            as={Link} 
            to={`/registrant-portal/abstracts/new`}
            size="md"
            className="w-full sm:w-auto flex-grow sm:flex-grow-0"
            icon={<PlusCircleIcon className="h-5 w-5 mr-2" />}
          >
            Submit New
          </Button>
          <Button 
            variant="outline" 
            onClick={loadData} 
            size="md"
            className="w-full sm:w-auto flex-grow sm:flex-grow-0"
            icon={<ArrowPathIcon className="h-5 w-5 mr-2" />}
          >
            Refresh
          </Button>
        </div>
      </div>

      <Card className="mb-6 p-4 bg-white rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div className="md:col-span-1">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </span>
              <input
                type="text"
                placeholder="Search by title, ID, author..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>
          </div>
          <div className="md:col-span-1">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <AdjustmentsHorizontalIcon className="h-5 w-5 text-gray-400" />
              </span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter by status"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              >
                <option value="all">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="under-review">Under Review</option>
                <option value="revision-requested">Revision Requested</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
          <div className="md:col-span-1">
            <div className="flex items-center gap-2">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none hidden sm:flex">
                <ArrowsUpDownIcon className="h-5 w-5 text-gray-400" />
              </span>
              <select 
                value={sortField} 
                onChange={(e) => { setSortField(e.target.value); setSortDirection('asc');}} 
                aria-label="Sort by"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm flex-grow"
              >
                <option value="submissionDate">Date</option>
                <option value="title">Title</option>
                <option value="status">Status</option>
              </select>
              <Button 
                variant="outline" 
                onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                className="flex-shrink-0"
                aria-label={sortDirection === 'asc' ? 'Sort descending' : 'Sort ascending'}
              >
                {sortDirection === 'asc' ? 'Asc' : 'Desc'}
              </Button>
            </div>
          </div>
        </div>
      </Card>
      
      {loading && (
        <div className="flex flex-col items-center justify-center text-center my-10 py-10">
          <Spinner size="xl" />
          <p className="mt-3 text-lg text-gray-600">Loading abstracts...</p>
        </div>
      )}

      {error && !loading && (
        <Alert
          variant="danger"
          title="Error Loading Data"
          className="my-6"
          icon={<InformationCircleIcon className="h-6 w-6" />}
        >
          {error}
        </Alert>
      )}

      {!loading && !error && abstracts.length === 0 && (
        <Card className="text-center my-10 py-10 bg-white rounded-lg shadow">
          <div className="flex flex-col items-center justify-center">
            <NoSymbolIcon className="h-16 w-16 text-gray-400 mb-6" />
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">No Abstracts Found</h2>
            <p className="text-gray-500 mb-6">
              You haven't submitted any abstracts for this event yet.
            </p>
            <Button 
              variant="success"
              as={Link} 
              to={`/registrant-portal/abstracts/new`}
              size="lg"
              icon={<PlusCircleIcon className="h-5 w-5 mr-2" />}
            >
              Submit Your First Abstract
            </Button>
          </div>
        </Card>
      )}

      {!loading && !error && abstracts.length > 0 && (
        filteredAbstracts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredAbstracts.map(abstract => (
              <motion.div
                key={abstract._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="h-full flex flex-col bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                  <div className="p-5 flex flex-col flex-grow">
                    <div className="mb-3 flex justify-between items-start">
                      <Link to={`/registrant-portal/events/${eventIdToUse}/abstracts/${abstract._id}`} className="text-decoration-none block">
                        <h2 className="text-lg font-semibold text-primary-600 hover:text-primary-700 hover:underline truncate" title={abstract.title || 'Untitled Abstract'}>
                          {abstract.title || 'Untitled Abstract'}
                        </h2>
                      </Link>
                      {getStatusBadge(abstract.status)}
                    </div>
                    <p className="text-xs text-gray-500 mb-3">
                      ID: {abstract.submissionId || abstract.abstractNumber || 'N/A'}
                    </p>
                    
                    <div className="my-3 space-y-1 text-sm">
                      <p className="text-gray-700">
                        <strong>Category:</strong> {getCategoryNameById(abstract.category?.$oid || abstract.category) || 'N/A'}
                      </p>
                      <p className="text-gray-600">
                        <strong>Submitted:</strong> {dayjs(abstract.submissionDate || abstract.createdAt).format('MMM D, YYYY')}
                      </p>
                    </div>

                    <div className="mt-auto pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-2 gap-2">
                         <div>
                          <Button 
                            variant="icon"
                            size="sm" 
                            className="w-full flex items-center justify-center text-gray-600 hover:text-primary-600"
                            as={Link}
                            to={`/registrant-portal/events/${eventIdToUse}/abstracts/${abstract._id}`}
                            title="View Details"
                            icon={<EyeIcon className="h-5 w-5 mr-1 sm:mr-2" />}
                          >
                            <span className="hidden sm:inline">View</span>
                          </Button>
                        </div>
                        <div>
                          <Button 
                            variant="icon"
                            size="sm" 
                            className="w-full flex items-center justify-center text-gray-600 hover:text-yellow-600"
                            as={Link}
                            to={`/registrant-portal/events/${eventIdToUse}/abstracts/${abstract._id}/edit`}
                            title="Edit Abstract"
                            disabled={eventDetails?.abstractSettings?.submissionDeadline && dayjs().isAfter(dayjs(eventDetails.abstractSettings.submissionDeadline)) && abstract.status !== 'revision-requested'}
                            icon={<PencilSquareIcon className="h-5 w-5 mr-1 sm:mr-2" />}
                          >
                            <span className="hidden sm:inline">Edit</span>
                          </Button>
                        </div>
                        {abstract.fileUrl && (
                          <div className="col-span-1">
                            <Button 
                              variant="icon"
                              size="sm" 
                              className="w-full flex items-center justify-center text-gray-600 hover:text-green-600"
                              onClick={() => handleDownload(abstract._id)}
                              title="Download File"
                              icon={<ArrowDownTrayIcon className="h-5 w-5 mr-1 sm:mr-2" />}
                            >
                              <span className="hidden sm:inline">File</span>
                            </Button>
                          </div>
                        )}
                        <div className={abstract.fileUrl ? "col-span-1" : "col-span-2"}>
                          <Button 
                            variant="icon"
                            size="sm" 
                            className="w-full flex items-center justify-center text-gray-600 hover:text-red-600"
                            onClick={() => handleDeleteClick(abstract)}
                            title="Delete Abstract"
                            icon={<TrashIcon className="h-5 w-5 mr-1 sm:mr-2" />}
                          >
                            <span className="hidden sm:inline">Delete</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card className="text-center my-10 py-10 bg-white rounded-lg shadow">
            <div className="flex flex-col items-center justify-center">
              <MagnifyingGlassIcon className="h-16 w-16 text-gray-400 mb-6" />
              <h2 className="text-2xl font-semibold text-gray-700 mb-2">No Matching Abstracts</h2>
              <p className="text-gray-500">
                No abstracts match your current search/filter criteria. Try adjusting your search.
              </p>
            </div>
          </Card>
        )
      )}
      
      <AnimatePresence>
        {showDeleteModal && (
          <Modal
            title="Confirm Deletion"
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            footer={
              <>
                <Button variant="neutral" onClick={() => setShowDeleteModal(false)} disabled={isDeleting}>
                  Cancel
                </Button>
                <Button variant="danger" onClick={confirmDeleteAbstract} disabled={isDeleting} icon={isDeleting ? <Spinner size="sm" /> : <TrashIcon className="h-5 w-5"/>}>
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </Button>
              </>
            }
          >
            <p>Are you sure you want to delete the abstract titled "<strong>{abstractToDelete?.title}</strong>"? This action cannot be undone.</p>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AbstractsList; 
               