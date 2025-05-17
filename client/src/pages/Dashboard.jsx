import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { 
  ArrowUpIcon, 
  ArrowDownIcon, 
  UserGroupIcon, 
  CalendarIcon, 
  DocumentTextIcon, 
  ServerIcon,
  PlusIcon,
  ClockIcon, 
  MapPinIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/outline';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Card, Badge, Button, Spinner } from '../components/common';
import eventService from '../services/eventService';
import registrationService from '../services/registrationService';
import resourceService from '../services/resourceService';
import api from '../services/api';

// Stats container component
const StatsContainer = ({ title, value, icon, loading }) => {
  return (
    <Card className="p-6">
      {loading ? (
        <div className="flex justify-center py-6">
          <Spinner size="md" />
      </div>
      ) : (
        <>
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
              <p className="text-2xl font-bold mt-1">{value}</p>
      </div>
            <div className={`p-3 rounded-full bg-opacity-10 ${
              title.includes('Event') ? 'bg-blue-100 text-blue-600' :
              title.includes('Registration') ? 'bg-purple-100 text-purple-600' :
              title.includes('Resource') ? 'bg-green-100 text-green-600' :
              'bg-gray-100 text-gray-600'
            }`}>
              {icon}
    </div>
  </div>
        </>
      )}
    </Card>
  );
};

const Dashboard = () => {
  const [stats, setStats] = useState({
    events: 0,
    registrations: 0,
    resources: 0,
    abstracts: 0
  });
  const [recentEvents, setRecentEvents] = useState([]);
  const [recentRegistrations, setRecentRegistrations] = useState([]);
  const [resourceUsage, setResourceUsage] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch dashboard data from API
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch recent events
        const eventsData = await eventService.getEvents({ 
          limit: 5, 
          sortBy: 'startDate', 
          sortOrder: 'desc' 
        });
        
        let firstEventId = null; // Initialize event ID variable
        
        if (eventsData.success) {
          setRecentEvents(eventsData.data.slice(0, 3));
          setStats(prev => ({ ...prev, events: eventsData.total }));
          if (eventsData.data && eventsData.data.length > 0) {
            firstEventId = eventsData.data[0]._id; // Get the first event ID
          }
        }
        
        // Fetch registrations for the first event (if exists)
        if (firstEventId) {
          const registrationsData = await registrationService.getRegistrations(
            firstEventId, // Pass eventId as the first argument
            { limit: 5, sortBy: 'createdAt', sortOrder: 'desc' } // Pass filters as the second argument
          );
          // Check the response structure from registrationService
          // The actual API response data is nested in registrationsData.data
          if (registrationsData && registrationsData.data && registrationsData.data.success && Array.isArray(registrationsData.data.data)) {
            setRecentRegistrations(registrationsData.data.data.slice(0, 5));
            // Access total count from pagination object within registrationsData.data.meta
            const totalRegistrations = registrationsData.data.meta?.pagination?.total || 0;
            setStats(prev => ({ ...prev, registrations: totalRegistrations }));
          } else {
              console.error("Failed to fetch registrations or unexpected format:", registrationsData);
              setRecentRegistrations([]);
              setStats(prev => ({ ...prev, registrations: 0 }));
          }
        } else {
          // Handle case where there are no events
          setRecentRegistrations([]);
          setStats(prev => ({ ...prev, registrations: 0 }));
        }
        
        // Fetch resources for the first event (if exists)
        if (firstEventId) {
          // const resourcesData = await resourceService.getResourceStatistics(firstEventId); // Old incorrect call
          // Call the correct endpoint: /api/events/:id/stats
          const resourcesData = await api.get(`/events/${firstEventId}/stats`);
          
          // Check response structure - assuming { success: true, data: { totalResources: X, byType: {...} } }
          if (resourcesData.data && resourcesData.data.success) {
            const statsData = resourcesData.data.data; // Assuming data is nested under .data.data
            setStats(prev => ({ ...prev, resources: statsData.totalResources || 0 }));
            
            // Process resource usage data for chart
            const resourceTypes = statsData.byType || {};
            
            const chartData = Object.keys(resourceTypes).map(type => ({
              name: type,
              value: resourceTypes[type]
            }));
            
            setResourceUsage(chartData);
          } else {
             console.error("Failed to fetch resource statistics or unexpected format:", resourcesData.data);
             setStats(prev => ({ ...prev, resources: 0 }));
             setResourceUsage([]);
          }
        } else {
          // If no events, set resources to 0
          setStats(prev => ({ ...prev, resources: 0 }));
          setResourceUsage([]);
        }
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);
  
  // Chart colors
  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042'];

  // Get status badge color
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'draft': return 'warning';
      case 'published': return 'success';
      case 'archived': return 'danger';
      default: return 'info';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
            <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of your events and registrations</p>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsContainer 
          title="Total Events" 
          value={stats.events} 
          icon={<CalendarIcon className="h-6 w-6" />} 
          loading={loading} 
        />
        <StatsContainer 
          title="Total Registrations" 
          value={stats.registrations} 
          icon={<UserGroupIcon className="h-6 w-6" />} 
          loading={loading} 
        />
        <StatsContainer 
          title="Resources Distributed" 
          value={stats.resources} 
          icon={<ServerIcon className="h-6 w-6" />} 
          loading={loading} 
        />
        <StatsContainer 
          title="Abstracts Submitted" 
          value={stats.abstracts} 
          icon={<DocumentTextIcon className="h-6 w-6" />} 
          loading={loading} 
        />
      </div>
      
      {/* Charts and Recent Events */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Events */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold">Recent Events</h2>
              <Link to="/events">
                <Button variant="text" size="sm">View All</Button>
            </Link>
          </div>
          
            {loading ? (
              <div className="flex justify-center py-12">
                <Spinner size="lg" />
              </div>
            ) : error ? (
              <p className="text-red-500 text-center py-10">{error}</p>
            ) : recentEvents.length === 0 ? (
              <div className="text-center py-10">
                <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-gray-500 font-medium mb-2">No events yet</h3>
                <p className="text-gray-400 mb-4">Get started by creating your first event</p>
                <Link to="/events/new">
                  <Button
                    variant="primary"
                    leftIcon={<PlusIcon className="h-5 w-5" />}
                  >
                    Create Event
                  </Button>
                </Link>
              </div>
            ) : (
          <div className="space-y-4">
                {recentEvents.map((event, index) => (
                  <motion.div
                key={event._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
              >
                    <Link 
                      to={`/events/${event._id}`} 
                      className="block p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-900">{event.name}</h3>
                          <div className="flex items-center text-sm text-gray-500 mt-1">
                            <ClockIcon className="h-4 w-4 mr-1" />
                            <span>
                              {format(new Date(event.startDate), 'MMM d, yyyy')} - 
                              {format(new Date(event.endDate), 'MMM d, yyyy')}
                            </span>
                          </div>
                          {event.venue?.city && event.venue?.country && (
                            <div className="flex items-center text-sm text-gray-500 mt-1">
                              <MapPinIcon className="h-4 w-4 mr-1" />
                              <span>{event.venue.city}, {event.venue.country}</span>
                            </div>
                          )}
                        </div>
                        <Badge 
                          variant={getStatusBadgeColor(event.status)}
                          size="sm"
                        >
                          {event.status}
                        </Badge>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </Card>
        </div>
        
        {/* Resource Distribution Chart */}
        <div>
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-6">Resource Distribution</h2>
            
            {loading ? (
              <div className="flex justify-center py-12">
                <Spinner size="lg" />
                </div>
            ) : error ? (
              <p className="text-red-500 text-center py-10">{error}</p>
            ) : resourceUsage.length === 0 ? (
              <div className="text-center py-10">
                <ServerIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-gray-500 font-medium">No resources distributed</h3>
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={resourceUsage}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {resourceUsage.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
          </div>
            )}
          </Card>
        </div>
      </div>

      {/* Recent Registrations */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold">Recent Registrations</h2>
          <Link to="/registrations">
            <Button variant="text" size="sm">View All</Button>
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <p className="text-red-500 text-center py-10">{error}</p>
        ) : recentRegistrations.length === 0 ? (
          <div className="text-center py-10">
            <UserGroupIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-gray-500 font-medium">No registrations yet</h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registration ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Event
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registered On
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentRegistrations.map((registration, index) => (
                  <motion.tr 
                    key={registration._id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                      <Link to={`/registrations/${registration._id}`}>
                        {registration.registrationId}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {registration.firstName} {registration.lastName}
                      </div>
                      <div className="text-sm text-gray-500">{registration.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {registration.event?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge 
                        variant={registration.status === 'checked-in' ? 'success' : 'info'} 
                        size="sm"
                      >
                        {registration.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {registration.createdAt ? format(new Date(registration.createdAt), 'MMM d, yyyy') : 'N/A'}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Dashboard; 