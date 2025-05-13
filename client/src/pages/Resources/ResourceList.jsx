import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeftIcon, 
  QrCodeIcon, 
  ShoppingBagIcon, 
  DocumentIcon,
  ChartBarIcon,
  AcademicCapIcon,
  PrinterIcon
} from '@heroicons/react/24/outline';
import { Card, Button, Spinner, Badge } from '../../components/common';
import eventService from '../../services/eventService';
import resourceService from '../../services/resourceService';

const ResourceList = () => {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch event details
        const eventResponse = await eventService.getEventById(eventId);
        if (!eventResponse.success) {
          throw new Error(eventResponse.message || 'Failed to fetch event details');
        }
        setEvent(eventResponse.data);
        
        // Fetch resource statistics
        const resourceStatsResponse = await resourceService.getResourceStatistics(eventId);
        if (!resourceStatsResponse.success) {
          throw new Error(resourceStatsResponse.message || 'Failed to fetch resource statistics');
        }
        setStatistics(resourceStatsResponse.data);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching resource data:', err);
        setError(err.message || 'Failed to load resource data');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [eventId]);
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center h-64">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-500">Loading resource data...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <h3 className="text-red-800 font-medium">Error</h3>
          <p className="text-red-700 mt-1">{error}</p>
        </div>
        <Link to={`/events/${eventId}`}>
          <Button variant="outline" leftIcon={<ArrowLeftIcon className="h-5 w-5" />}>
            Back to Event
          </Button>
        </Link>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center mb-2">
          <Link to={`/events/${eventId}`} className="mr-3">
            <Button variant="ghost" size="sm" leftIcon={<ArrowLeftIcon className="h-5 w-5" />}>
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Resource Management</h1>
        </div>
        <p className="text-gray-500">
          Manage and track resources for {event?.name} ({formatDate(event?.startDate)} - {formatDate(event?.endDate)})
        </p>
      </div>
      
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Food Statistics */}
        <Card className="p-6 border-l-4 border-blue-500">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Food</h2>
            <div className="p-2 bg-blue-100 text-blue-700 rounded-full">
              <ChartBarIcon className="h-5 w-5" />
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Total Meals Served</p>
              <p className="text-2xl font-bold">{statistics?.byType?.food?.count || 0}</p>
            </div>
            <div className="flex justify-between items-center text-sm">
              <p className="text-gray-500">Today</p>
              <Badge variant="primary">{statistics?.byType?.food?.today || 0}</Badge>
            </div>
            <div className="flex justify-between items-center text-sm">
              <p className="text-gray-500">Unique Attendees</p>
              <Badge variant="secondary">{statistics?.byType?.food?.uniqueAttendees || 0}</Badge>
            </div>
          </div>
          <div className="mt-6">
            <Link to={`/events/${eventId}/resources/food`}>
              <Button variant="outline" fullWidth>View Details</Button>
            </Link>
          </div>
        </Card>
        
        {/* Kit Bag Statistics */}
        <Card className="p-6 border-l-4 border-green-500">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Kit Bags</h2>
            <div className="p-2 bg-green-100 text-green-700 rounded-full">
              <ShoppingBagIcon className="h-5 w-5" />
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Total Kits Distributed</p>
              <p className="text-2xl font-bold">{statistics?.byType?.kits?.count || 0}</p>
            </div>
            <div className="flex justify-between items-center text-sm">
              <p className="text-gray-500">Today</p>
              <Badge variant="success">{statistics?.byType?.kits?.today || 0}</Badge>
            </div>
            <div className="flex justify-between items-center text-sm">
              <p className="text-gray-500">Unique Attendees</p>
              <Badge variant="secondary">{statistics?.byType?.kits?.uniqueAttendees || 0}</Badge>
            </div>
          </div>
          <div className="mt-6">
            <Link to={`/events/${eventId}/resources/kitbag`}>
              <Button variant="outline" fullWidth>View Details</Button>
            </Link>
          </div>
        </Card>
        
        {/* Certificate Issuance Statistics */}
        <Card className="p-6 border-l-4 border-amber-500">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Certificate Issuance</h2>
            <div className="p-2 bg-amber-100 text-amber-700 rounded-full">
              <AcademicCapIcon className="h-5 w-5" />
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Total Certificates Issued</p>
              <p className="text-2xl font-bold">{statistics?.byType?.certificates?.count || 0}</p>
            </div>
            <div className="flex justify-between items-center text-sm">
              <p className="text-gray-500">Today</p>
              <Badge variant="warning">{statistics?.byType?.certificates?.today || 0}</Badge>
            </div>
            <div className="flex justify-between items-center text-sm">
              <p className="text-gray-500">Unique Attendees</p>
              <Badge variant="secondary">{statistics?.byType?.certificates?.uniqueAttendees || 0}</Badge>
            </div>
          </div>
          <div className="mt-6">
            <Link to={`/events/${eventId}/resources/certificate`}>
              <Button variant="outline" fullWidth>View Details</Button>
            </Link>
          </div>
        </Card>
        
        {/* Certificate Printing Statistics */}
        <Card className="p-6 border-l-4 border-purple-500">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Certificate Printing</h2>
            <div className="p-2 bg-purple-100 text-purple-700 rounded-full">
              <PrinterIcon className="h-5 w-5" />
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Total Certificates Printed</p>
              <p className="text-2xl font-bold">{statistics?.certificatePrinting?.totalCount || 0}</p>
            </div>
            <div className="flex justify-between items-center text-sm">
              <p className="text-gray-500">Today</p>
              <Badge variant="purple">{statistics?.certificatePrinting?.todayCount || 0}</Badge>
            </div>
            <div className="flex justify-between items-center text-sm">
              <p className="text-gray-500">Unique Attendees</p>
              <Badge variant="secondary">{statistics?.certificatePrinting?.uniqueAttendees || 0}</Badge>
            </div>
          </div>
          <div className="mt-6">
            <Link to={`/events/${eventId}/resources/certificate-printing`}>
              <Button variant="outline" fullWidth>View Details</Button>
            </Link>
          </div>
        </Card>
      </div>
      
      {/* Scanner Stations Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Scanner Stations</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to={`/events/${eventId}/resources/scanner/food`}>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition">
              <div className="flex items-center justify-center">
                <QrCodeIcon className="h-5 w-5 mr-2 text-blue-600" />
                <span>Food Scanner</span>
              </div>
            </div>
          </Link>

          <Link to={`/events/${eventId}/resources/scanner/kits`}>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition">
              <div className="flex items-center justify-center">
                <QrCodeIcon className="h-5 w-5 mr-2 text-green-600" />
                <span>Kit Bag Scanner</span>
              </div>
            </div>
          </Link>

          <Link to={`/events/${eventId}/resources/scanner/certificates`}>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition">
              <div className="flex items-center justify-center">
                <QrCodeIcon className="h-5 w-5 mr-2 text-amber-600" />
                <span>Certificate Scanner</span>
              </div>
            </div>
          </Link>
          
          <Link to={`/events/${eventId}/resources/scanner/certificatePrinting`}>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition">
              <div className="flex items-center justify-center">
                <QrCodeIcon className="h-5 w-5 mr-2 text-purple-600" />
                <span>Certificate Printing Scanner</span>
              </div>
            </div>
          </Link>
        </div>
      </div>
      
      {/* Configuration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Food Settings</h2>
          <p className="text-gray-500 mb-4">Configure meal types and eligibility</p>
          <Link to={`/events/${eventId}/settings?tab=resources&section=food`}>
            <Button variant="outline" fullWidth>Manage Settings</Button>
          </Link>
        </Card>
        
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Kit Bag Settings</h2>
          <p className="text-gray-500 mb-4">Configure kit items and eligibility</p>
          <Link to={`/events/${eventId}/settings?tab=resources&section=kits`}>
            <Button variant="outline" fullWidth>Manage Settings</Button>
          </Link>
        </Card>
        
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Certificate Settings</h2>
          <p className="text-gray-500 mb-4">Configure certificate types and templates</p>
          <Link to={`/events/${eventId}/settings?tab=resources&section=certificates`}>
            <Button variant="outline" fullWidth>Manage Settings</Button>
          </Link>
        </Card>
        
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Certificate Printing Settings</h2>
          <p className="text-gray-500 mb-4">Configure certificate printing templates and options</p>
          <Link to={`/events/${eventId}/settings?tab=resources&section=certificatePrinting`}>
            <Button variant="outline" fullWidth>Manage Settings</Button>
          </Link>
        </Card>
      </div>
    </div>
  );
};

export default ResourceList; 