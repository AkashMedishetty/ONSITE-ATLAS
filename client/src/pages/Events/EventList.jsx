import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  FunnelIcon,
  EllipsisVerticalIcon,
  CalendarDaysIcon,
  MapPinIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import {
  Badge,
  Button,
  Card,
  Pagination,
  Select,
  Spinner,
  Input,
  Modal
} from '../../components/common';
import eventService from '../../services/eventService';

const EventList = () => {
  // State
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('startDate');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalEvents, setTotalEvents] = useState(0);
  const [eventsPerPage] = useState(10);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);

  // Fetch events with pagination and filters
  const fetchEvents = async () => {
    try {
      setLoading(true);
      
      const params = {
        page: currentPage,
        limit: eventsPerPage,
        status: filterStatus !== 'all' ? filterStatus : undefined,
        sortBy,
        sortOrder
      };
      
      console.log('Fetching events with params:', params);
      const result = await eventService.getEvents(params);
      console.log('API Response:', result);
      
      if (Array.isArray(result)) {
        setEvents(result);
        setTotalEvents(result.length);
      } else if (result && result.data && Array.isArray(result.data)) {
        setEvents(result.data);
        setTotalEvents(result.total || result.data.length);
      } else {
        console.error('Unexpected API response format:', result);
        setError('Received invalid data format from API');
        setEvents([]);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      setError('Error fetching events. Please try again.');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchEvents();
  }, [currentPage, filterStatus, sortBy, sortOrder]);

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Filter events based on search query
  const filteredEvents = events.filter(event => {
    const matchesSearch = searchQuery.trim() === '' ||
      (event.name && event.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (event.venue?.city && event.venue.city.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (event.venue?.country && event.venue.country.toLowerCase().includes(searchQuery.toLowerCase()));
      
    return matchesSearch;
  });

  // Handle refresh
  const handleRefresh = () => {
    fetchEvents();
  };

  // Get status badge color
  const getStatusBadgeColor = (status) => {
    if (!status) return 'secondary';
    
    switch (status.toLowerCase()) {
      case 'draft': return 'info';
      case 'published': return 'success';
      case 'completed': return 'primary';
      case 'archived': return 'warning';
      default: return 'secondary';
    }
  };

  // Handle delete confirmation
  const handleDelete = async () => {
    if (!eventToDelete) return;
    
    try {
      await eventService.deleteEvent(eventToDelete._id);
      fetchEvents();
      setShowDeleteModal(false);
      setEventToDelete(null);
    } catch (error) {
      console.error('Error deleting event:', error);
      setError('Failed to delete event. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Events</h1>
          <p className="text-gray-500">Manage your events and conferences</p>
        </div>
        <Link to="/events/new">
          <Button
            variant="primary"
            leftIcon={<PlusIcon className="h-5 w-5" />}
          >
            Create Event
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />}
            className="w-full"
          />
        </div>
        <div className="flex gap-2">
          <Select
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'draft', label: 'Draft' },
              { value: 'published', label: 'Published' },
              { value: 'completed', label: 'Completed' },
              { value: 'archived', label: 'Archived' }
            ]}
            value={filterStatus}
            onChange={(value) => setFilterStatus(value)}
            className="w-40"
          />
          <Button
            variant="outline"
            onClick={handleRefresh}
            leftIcon={<ArrowPathIcon className="h-5 w-5" />}
            aria-label="Refresh"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Events List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <Card className="p-6 text-center">
          <p className="text-red-500">{error}</p>
          <Button variant="primary" className="mt-4" onClick={handleRefresh}>
            Try Again
          </Button>
        </Card>
      ) : filteredEvents.length === 0 ? (
        <Card className="p-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center"
          >
            <CalendarDaysIcon className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
            <p className="text-gray-500 mb-6">
              {searchQuery ? 'Try adjusting your search criteria' : 'Get started by creating your first event'}
            </p>
            <Link to="/events/new">
              <Button
                variant="primary"
                leftIcon={<PlusIcon className="h-5 w-5" />}
              >
                Create Event
              </Button>
            </Link>
          </motion.div>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event, index) => (
              <motion.div
                key={event._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link to={`/events/${event._id}`} className="block h-full">
                  <Card className="h-full hover:shadow-md transition-shadow duration-200 overflow-hidden">
                    {event.bannerImage ? (
                      <img 
                        src={event.bannerImage} 
                        alt={event.name} 
                        className="w-full h-40 object-cover"
                      />
                    ) : (
                      <div className="w-full h-40 bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                        <h3 className="text-xl font-semibold text-white">{event.name || 'Unnamed Event'}</h3>
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{event.name || 'Unnamed Event'}</h3>
                        <Badge 
                          variant={getStatusBadgeColor(event.status)}
                          size="sm"
                        >
                          {event.status || 'No Status'}
                        </Badge>
                      </div>
                      <p className="text-gray-500 text-sm mb-4 line-clamp-2">{event.description || 'No description'}</p>
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <CalendarDaysIcon className="h-4 w-4 mr-2" />
                          <span>
                            {event.startDate ? format(new Date(event.startDate), 'MMM d, yyyy') : 'TBD'} - 
                            {event.endDate ? format(new Date(event.endDate), 'MMM d, yyyy') : 'TBD'}
                          </span>
                        </div>
                        {event.venue?.city && event.venue?.country && (
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPinIcon className="h-4 w-4 mr-2" />
                            <span>{event.venue.city}, {event.venue.country}</span>
                          </div>
                        )}
                        <div className="flex items-center text-sm text-gray-600">
                          <UsersIcon className="h-4 w-4 mr-2" />
                          <span>{event.registrationCount || 0} Registrations</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Pagination */}
          {totalEvents > eventsPerPage && (
            <div className="flex justify-center mt-6">
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(totalEvents / eventsPerPage)}
                onPageChange={handlePageChange}
                showPageSizeOptions={false}
              />
            </div>
          )}
        </div>
      )}

      {/* Delete confirmation modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setEventToDelete(null);
        }}
        title="Delete Event"
      >
        <div className="p-6">
          <p className="mb-4">
            Are you sure you want to delete the event{' '}
            <span className="font-semibold">{eventToDelete?.name}</span>?
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false);
                setEventToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default EventList; 