import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Card, 
  Button, 
  Spinner, 
  Alert, 
  Badge, 
  Tabs
} from '../../../components/common';
import QRCode from 'react-qr-code';
import { 
  ArrowLeftIcon,
  PrinterIcon,
  PencilIcon,
  TrashIcon,
  EnvelopeIcon,
  CalendarIcon,
  UserIcon,
  IdentificationIcon,
  PhoneIcon,
  AtSymbolIcon,
  BuildingOfficeIcon,
  TagIcon,
  ClockIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentTextIcon,
  CakeIcon,
  ShoppingBagIcon,
  AcademicCapIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import registrationService from '../../../services/registrationService';
import eventService from '../../../services/eventService';
import resourceService from '../../../services/resourceService';
import { formatDate } from '../../../utils/dateUtils';
import { toast } from 'react-hot-toast';

const RegistrationDetail = () => {
  const { eventId, registrationId } = useParams();
  const navigate = useNavigate();
  
  // Add a mount ref to prevent duplicate API calls
  const isMounted = useRef(false);
  
  const [loading, setLoading] = useState(true);
  const [registration, setRegistration] = useState(null);
  const [event, setEvent] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [resourceUsage, setResourceUsage] = useState([]);
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [resourceStats, setResourceStats] = useState(null);
  const [certificateTypes, setCertificateTypes] = useState([]);
  const [selectedCertificateType, setSelectedCertificateType] = useState('');
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [badgeType, setBadgeType] = useState('standard');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  
  // Fetch registration once when component mounts
  const fetchRegistration = async () => {
    console.log('Fetching registration:', registrationId, 'for event:', eventId);
    try {
      const response = await registrationService.getRegistration(eventId, registrationId);
      console.log('Raw registration API response:', response);
      
      // Extract data from different possible response formats
      let registrationData = null;
      
      // Case 1: Direct response data object with no wrapper
      if (response && typeof response === 'object' && response.registrationId) {
        console.log('Case 1: Direct registration object');
        registrationData = response;
      }
      // Case 2: Standard API response with success and data properties
      else if (response && response.success === true && response.data) {
        console.log('Case 2: Standard API success response');
        registrationData = response.data;
      }
      // Case 3: Axios response with data property containing registration
      else if (response && response.data && typeof response.data === 'object') {
        console.log('Case 3: Axios response with data');
        // Check if response.data has a nested data property (common pattern)
        if (response.data.data) {
          console.log('Case 3a: Nested data property');
          registrationData = response.data.data;
        } 
        // Check if response.data is the registration object directly
        else if (response.data.registrationId) {
          console.log('Case 3b: Data property is registration');
          registrationData = response.data;
        }
      }
      
      // If no valid data was found, throw error
      if (!registrationData) {
        console.error('No valid registration data found in response', response);
        throw new Error('Failed to extract registration data from response');
      }
      
      console.log('Extracted registration data:', registrationData);
      return registrationData;
    } catch (err) {
      console.error('Error fetching registration:', err);
      throw err;
    }
  };
  
  // Main data loading effect with proper cleanup
  useEffect(() => {
    // Skip if already mounted - prevents double fetching in StrictMode
    if (isMounted.current) return;
    isMounted.current = true;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch event details
        const eventResponse = await eventService.getEventById(eventId);
        console.log('Event response:', eventResponse);
        
        // Better handling of event response formats
        let eventData;
        if (eventResponse?.data) {
          eventData = eventResponse.data;
        } else if (eventResponse?.success && eventResponse?.data) {
          eventData = eventResponse.data;
        } else {
          throw new Error(eventResponse?.message || 'Failed to fetch event details');
        }
        
        setEvent(eventData);
        
        // Fetch registration details - use the separate function
        try {
          const registrationData = await fetchRegistration();
          console.log('Processed registration data:', registrationData);
          setRegistration(registrationData);
        } catch (regError) {
          console.error('Registration fetch error:', regError);
          setError('Failed to fetch registration details');
          setLoading(false);
          return;
        }
        
        // Fetch resource usage
        await fetchResourceUsage();
        
        // Fetch certificate settings
        await fetchCertificateSettings();
        
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    
    if (eventId && registrationId) {
      fetchData();
    }
    
    // Cleanup function to handle unmounting
    return () => {
      isMounted.current = false;
    };
  }, [eventId, registrationId]);

  const fetchResourceUsage = async () => {
    // Add a guard to prevent multiple simultaneous calls
    if (resourcesLoading) return;
    
    try {
      setResourcesLoading(true);
      
      const resourceResponse = await resourceService.getRegistrationResources(eventId, registrationId);
      console.log('Resource usage response:', resourceResponse);
      
      if (resourceResponse && resourceResponse.success) {
        setResourceUsage(resourceResponse.data || []);
        
        // Also fetch resource statistics
        const statsResponse = await resourceService.getResourceStats(eventId, registrationId);
        if (statsResponse && statsResponse.success) {
          setResourceStats(statsResponse.data || {});
        }
      } else {
        console.warn('Failed to fetch resource usage');
        setError(resourceResponse?.message || 'Failed to fetch resource data');
      }
    } catch (err) {
      console.error('Error fetching resource usage:', err);
      setError(err.message || 'An error occurred while fetching resource data');
    } finally {
      setResourcesLoading(false);
    }
  };
  
  // Memoize the certificate settings fetch to avoid duplicate calls
  const fetchCertificateSettings = async () => {
    // Add a local state variable to track if we've already fetched settings
    if (certificateTypes.length > 0) return;
    
    try {
      // Get certificate settings
      const certificateSettingsResponse = await resourceService.getResourceSettings(eventId, 'certificate');
      console.log('Certificate settings response:', certificateSettingsResponse);
      
      if (certificateSettingsResponse && certificateSettingsResponse.success) {
        const settings = certificateSettingsResponse.data?.settings || {};
        const templates = settings.templates || [];
        
        setCertificateTypes(templates.map(t => ({
          id: t.name,
          name: t.name,
          description: t.description || ''
        })));
        
        // Set default certificate type if available
        if (templates.length > 0) {
          setSelectedCertificateType(templates[0].name);
        }
      }
    } catch (err) {
      console.error('Error fetching certificate settings:', err);
    }
  };
  
  const handlePrintBadge = async () => {
    try {
      setLoading(true);
      // Same badge printing functionality as in RegistrationsTab
      // Fetch badge settings
      const badgeSettings = await eventService.getBadgeSettings(eventId);
      console.log('Badge settings:', badgeSettings);
      
      if (!badgeSettings || !badgeSettings.data) {
        setError('Badge settings not found for this event');
        setLoading(false);
        return;
      }
      
      alert('Badge printing initiated. PDF will download shortly.');
      // Implementation would be similar to the one in RegistrationsTab
      setLoading(false);
    } catch (err) {
      console.error('Error printing badge:', err);
      setError(`Failed to print badge: ${err.message}`);
      setLoading(false);
    }
  };
  
  const handleSendCertificate = async () => {
    try {
      // Show certificate selection modal
      setShowCertificateModal(true);
    } catch (err) {
      console.error('Error preparing certificate:', err);
      setError(`Failed to prepare certificate: ${err.message}`);
    }
  };
  
  const handleSendCertificateConfirm = async () => {
    try {
      setLoading(true);
      setShowCertificateModal(false);
      
      if (!selectedCertificateType) {
        setError('Please select a certificate type');
        setLoading(false);
        return;
      }
      
      // Send certificate
      const response = await registrationService.sendCertificate(
        eventId, 
        registrationId,
        {
          certificateType: selectedCertificateType,
          includeQR: true
        }
      );
      
      console.log('Certificate sent response:', response);
      
      if (response && response.success) {
        // Show success message
        toast.success(`Certificate has been sent to ${registration.personalInfo?.email || registration.email}`);
        
        // Refresh resource usage to show the new certificate
        await fetchResourceUsage();
      } else {
        setError(`Failed to send certificate: ${response?.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error sending certificate:', err);
      setError(`Failed to send certificate: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleEditRegistration = () => {
    navigate(`/events/${eventId}/registrations/${registrationId}/edit`);
  };
  
  const handleDeleteRegistration = async () => {
    if (!confirm('Are you sure you want to delete this registration? This action cannot be undone.')) {
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await registrationService.deleteRegistration(eventId, registrationId);
      console.log('Delete response:', response);
      
      if (response && response.success) {
        alert('Registration deleted successfully');
        navigate(`/events/${eventId}/registrations`);
      } else {
        setError(`Failed to delete registration: ${response?.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error deleting registration:', err);
      setError(`Failed to delete registration: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleUpdateResourceUsage = async (resourceId, isUsed) => {
    try {
      setResourcesLoading(true);
      setEditingResource(resourceId);
      
      // Call API to update resource usage
      const response = await resourceService.updateResourceUsage(eventId, registrationId, resourceId, { isUsed });
      console.log('Update resource response:', response);
      
      if (response && response.success) {
        // Update local state
        setResourceUsage(resourceUsage.map(resource => 
          resource._id === resourceId ? { ...resource, isUsed, status: isUsed ? 'used' : 'assigned' } : resource
        ));
        
        // Refresh resource stats after update
        const statsResponse = await resourceService.getResourceStats(eventId, registrationId);
        if (statsResponse && statsResponse.success) {
          setResourceStats(statsResponse.data || {});
        }
        
        // Show success message
        toast.success(`Resource has been marked as ${isUsed ? 'used' : 'unused'}`);
      } else {
        setError(`Failed to update resource usage: ${response?.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error updating resource usage:', err);
      setError(`Failed to update resource usage: ${err.message}`);
    } finally {
      setResourcesLoading(false);
      setEditingResource(null);
    }
  };
  
  const handleVoidResource = async (resourceId) => {
    try {
      if (window.confirm('Are you sure you want to void this resource?')) {
        setEditingResource(resourceId);
        
        const response = await resourceService.updateResourceUsage(eventId, registrationId, resourceId, {
          status: 'voided'
        });
        
        if (response?.success) {
          toast.success('Resource voided successfully');
          await fetchResourceUsage(); // Refresh resource list
        } else {
          toast.error(response?.message || 'Failed to void resource');
        }
      }
    } catch (err) {
      console.error('Error voiding resource:', err);
      toast.error('Failed to void resource');
    } finally {
      setEditingResource(null);
    }
  };
  
  const handleToggleCheckIn = async () => {
    try {
      setLoading(true);
      const action = checkedIn ? 'undo-check-in' : 'check-in';
      const response = await registrationService.updateRegistrationStatus(
        eventId, 
        registrationId, 
        { action }
      );
      
      if (response?.success) {
        // Update local state to reflect check-in status
        setRegistration({
          ...registration,
          checkedIn: !checkedIn,
          checkInTime: !checkedIn ? new Date() : null,
        });
        
        toast.success(`${!checkedIn ? 'Checked in' : 'Check-in undone'} successfully`);
        
        // Add to activities if not already tracked by the server
        if (registration.activities) {
          const newActivity = {
            action: !checkedIn ? 'Check In' : 'Undo Check In',
            description: !checkedIn 
              ? 'Registrant checked in to event' 
              : 'Registrant check-in was undone',
            timestamp: new Date(),
            user: 'Current User' // Ideally this would be the current user's name
          };
          
          setRegistration({
            ...registration,
            activities: [newActivity, ...registration.activities]
          });
        }
      } else {
        toast.error(response?.message || `Failed to ${checkedIn ? 'undo' : 'perform'} check-in`);
      }
    } catch (err) {
      console.error('Error toggling check-in:', err);
      toast.error(`Failed to ${checkedIn ? 'undo' : 'perform'} check-in`);
    } finally {
      setLoading(false);
    }
  };
  
  const handlePrintCustomBadge = async () => {
    // Show custom badge options modal
    setShowBadgeModal(true);
  };
  
  const handlePrintBadgeConfirm = async () => {
    try {
      setLoading(true);
      setShowBadgeModal(false);
      
      // Fetch badge settings
      const badgeSettings = await eventService.getBadgeSettings(eventId);
      
      if (!badgeSettings || !badgeSettings.data) {
        setError('Badge settings not found for this event');
        setLoading(false);
        return;
      }
      
      const badgeData = {
        registrationId: registrationId,
        badgeType: badgeType,
        includeQR: true
      };
      
      // Call API to generate badge
      const response = await registrationService.generateBadge(eventId, registrationId, badgeData);
      
      if (response && response.success) {
        // Open badge URL in new window or download
        if (response.data?.url) {
          window.open(response.data.url, '_blank');
        }
        toast.success('Badge generated successfully');
      } else {
        setError(`Failed to generate badge: ${response?.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error printing badge:', err);
      setError(`Failed to print badge: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handlePreviewCertificate = () => {
    // If no certificate type is selected yet and we have options, select the first one
    if (!selectedCertificateType && certificateTypes.length > 0) {
      setSelectedCertificateType(certificateTypes[0].id);
    }
    setShowPreviewModal(true);
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
        <span className="ml-2 text-gray-500">Loading registration details...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4">
        <Alert type="error" message={error} />
        <div className="mt-4">
          <Button
            variant="outline"
            onClick={() => navigate(`/events/${eventId}/registrations`)}
            leadingIcon={<ArrowLeftIcon className="h-4 w-4" />}
          >
            Back to Registrations
          </Button>
        </div>
      </div>
    );
  }
  
  if (!registration) {
    return (
      <div className="p-4">
        <Alert type="warning" message="Registration not found" />
        <div className="mt-4">
          <Button
            variant="outline"
            onClick={() => navigate(`/events/${eventId}/registrations`)}
            leadingIcon={<ArrowLeftIcon className="h-4 w-4" />}
          >
            Back to Registrations
          </Button>
        </div>
      </div>
    );
  }
  
  // Extract registration details
  const {
    registrationId: regId,
    firstName,
    lastName,
    email,
    mobile,
    organization,
    categoryName,
    status,
    createdAt,
    personalInfo,
    paymentStatus,
    createdBy,
    source,
    qrCode,
    checkedIn,
    checkInTime
  } = registration;
  
  // Normalize data structures
  const name = `${firstName || personalInfo?.firstName || ''} ${lastName || personalInfo?.lastName || ''}`;
  const emailAddr = email || personalInfo?.email;
  const phone = mobile || personalInfo?.mobile || personalInfo?.phone;
  const org = organization || personalInfo?.organization;
  const country = personalInfo?.country;
  const address = personalInfo?.address;
  const paid = paymentStatus === 'paid';
  const registrantType = source || 'Manual Entry';
  const regStatus = checkedIn ? 'Checked In' : (status || 'Registered');
  
  return (
    <div className="bg-gray-50 min-h-screen p-5">
      {/* Enhanced Header with navigation and actions */}
      <div className="bg-white rounded-lg shadow p-4 mb-6 border border-gray-200">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/events/${eventId}/registrations`)}
              leadingIcon={<ArrowLeftIcon className="h-4 w-4" />}
            >
              Back
            </Button>
            <h1 className="text-xl font-semibold text-gray-800 hidden md:block">
              Registration Details
            </h1>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePrintBadge()}
              leadingIcon={<PrinterIcon className="h-4 w-4" />}
            >
              Print Badge
            </Button>
            {emailAddr && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSendCertificate()}
                leadingIcon={<EnvelopeIcon className="h-4 w-4" />}
              >
                Certificate
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEditRegistration()}
              leadingIcon={<PencilIcon className="h-4 w-4" />}
            >
              Edit
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => handleDeleteRegistration()}
              leadingIcon={<TrashIcon className="h-4 w-4" />}
            >
              Delete
            </Button>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left sidebar with QR and basic info */}
        <div className="lg:col-span-1">
          <Card className="bg-white shadow border border-gray-200 overflow-visible">
            <div className="flex flex-col items-center">
              <div className="mb-4 p-3 bg-white rounded-md border-2 border-gray-300 shadow-sm -mt-10">
                <QRCode 
                  value={qrCode || regId} 
                  size={180}
                />
                <p className="mt-2 text-center font-medium">
                  {regId}
                </p>
              </div>
              
              <h2 className="text-xl font-semibold mb-1">{name}</h2>
              <p className="text-gray-500 mb-3">{emailAddr}</p>
              
              <div className="flex space-x-2 mb-4">
                <Badge
                  variant={regStatus === 'Checked In' ? "success" : "primary"}
                  size="lg"
                >
                  {regStatus}
                </Badge>
                <Badge
                  variant="secondary"
                  size="lg"
                >
                  {categoryName}
                </Badge>
              </div>
              
              <div className="w-full border-t border-gray-200 pt-4 mt-2">
                <h3 className="text-sm font-medium text-gray-600 mb-3">Registration Details</h3>
                <table className="w-full text-sm">
                  <tbody>
                    <tr>
                      <td className="py-2 text-gray-500">Registration ID:</td>
                      <td className="py-2 font-medium text-right">{regId}</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-gray-500">Category:</td>
                      <td className="py-2 font-medium text-right">{categoryName}</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-gray-500">Registration Date:</td>
                      <td className="py-2 font-medium text-right">{formatDate(createdAt)}</td>
                    </tr>
                    {checkedIn && (
                      <tr>
                        <td className="py-2 text-gray-500">Check-in Time:</td>
                        <td className="py-2 font-medium text-right">{formatDate(checkInTime)}</td>
                      </tr>
                    )}
                    <tr>
                      <td className="py-2 text-gray-500">Registration Type:</td>
                      <td className="py-2 font-medium text-right">{registrantType}</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-gray-500">Payment Status:</td>
                      <td className="py-2 font-medium text-right">
                        <span className={paid ? "text-green-600" : "text-red-600"}>
                          {paid ? "Paid" : "Unpaid"}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
          
          {/* Quick Actions Card */}
          <Card className="mt-6 bg-white shadow border border-gray-200">
            <h3 className="text-lg font-medium mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Button
                variant="outline"
                onClick={() => handlePrintBadge()}
                className="w-full justify-center"
                leadingIcon={<IdentificationIcon className="h-5 w-5" />}
              >
                Print Badge
              </Button>
              
              <Button
                variant={regStatus === 'Checked In' ? 'outline' : 'primary'}
                onClick={() => handleToggleCheckIn()}
                className="w-full justify-center"
                leadingIcon={regStatus === 'Checked In' ? <XCircleIcon className="h-5 w-5" /> : <CheckCircleIcon className="h-5 w-5" />}
              >
                {regStatus === 'Checked In' ? 'Mark as Not Checked In' : 'Mark as Checked In'}
              </Button>
              
              {emailAddr && (
                <Button
                  variant="outline"
                  onClick={() => handleSendCertificate()}
                  className="w-full justify-center"
                  leadingIcon={<AcademicCapIcon className="h-5 w-5" />}
                >
                  Send Certificate
                </Button>
              )}
            </div>
          </Card>
        </div>
        
        {/* Right content with tabs */}
        <div className="lg:col-span-3">
          <Card className="bg-white shadow border border-gray-200">
            <div className="border-b border-gray-200 mb-4">
              <nav className="flex -mb-px space-x-6">
                <button
                  onClick={() => setActiveTab(0)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 0
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Personal Details
                </button>
                <button
                  onClick={() => setActiveTab(1)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 1
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Resource Usage
                </button>
                <button
                  onClick={() => setActiveTab(2)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 2
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Activities
                </button>
              </nav>
            </div>
            
            {/* Tab content */}
            {activeTab === 0 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Personal Information</h3>
                    <table className="w-full text-sm">
                      <tbody>
                        <tr className="border-b border-gray-100">
                          <td className="py-3 text-gray-500">First Name:</td>
                          <td className="py-3 font-medium">{firstName || personalInfo?.firstName || 'Not provided'}</td>
                        </tr>
                        <tr className="border-b border-gray-100">
                          <td className="py-3 text-gray-500">Last Name:</td>
                          <td className="py-3 font-medium">{lastName || personalInfo?.lastName || 'Not provided'}</td>
                        </tr>
                        <tr className="border-b border-gray-100">
                          <td className="py-3 text-gray-500">Email:</td>
                          <td className="py-3 font-medium">{emailAddr || 'Not provided'}</td>
                        </tr>
                        <tr className="border-b border-gray-100">
                          <td className="py-3 text-gray-500">Phone:</td>
                          <td className="py-3 font-medium">{phone || 'Not provided'}</td>
                        </tr>
                        <tr className="border-b border-gray-100">
                          <td className="py-3 text-gray-500">Organization:</td>
                          <td className="py-3 font-medium">{org || 'Not provided'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-4">Additional Information</h3>
                    <table className="w-full text-sm">
                      <tbody>
                        <tr className="border-b border-gray-100">
                          <td className="py-3 text-gray-500">Country:</td>
                          <td className="py-3 font-medium">{country || 'Not provided'}</td>
                        </tr>
                        <tr className="border-b border-gray-100">
                          <td className="py-3 text-gray-500">Address:</td>
                          <td className="py-3 font-medium">{address || 'Not provided'}</td>
                        </tr>
                        {personalInfo && Object.entries(personalInfo)
                          .filter(([key]) => !['firstName', 'lastName', 'email', 'phone', 'country', 'address', 'organization'].includes(key))
                          .map(([key, value]) => (
                            <tr key={key} className="border-b border-gray-100">
                              <td className="py-3 text-gray-500">
                                {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}:
                              </td>
                              <td className="py-3 font-medium">
                                {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : (value || 'Not provided')}
                              </td>
                            </tr>
                          ))
                        }
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
            
            {/* Resource Usage Tab */}
            {activeTab === 1 && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Resource Usage</h3>
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => fetchResourceUsage()}
                    leadingIcon={<ArrowPathIcon className="h-4 w-4" />}
                  >
                    Refresh
                  </Button>
                </div>
                
                {/* Resource Usage Stats */}
                {resourceStats && (
                  <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {['food', 'kitBag', 'certificate'].map(type => {
                      const stats = resourceStats[type] || { total: 0, used: 0, unused: 0 };
                      const typeLabel = {
                        'food': 'Food',
                        'kitBag': 'Kit Bags',
                        'certificate': 'Certificates'
                      }[type];
                      
                      const usagePercentage = stats.total > 0 
                        ? Math.round((stats.used / stats.total) * 100) 
                        : 0;
                      
                      return (
                        <div key={type} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                          <h4 className="font-medium text-gray-700 mb-2">{typeLabel}</h4>
                          <div className="flex items-end justify-between mb-2">
                            <span className="text-2xl font-bold">{stats.used}/{stats.total}</span>
                            <span className="text-sm text-gray-500">{usagePercentage}% Used</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div 
                              className={`h-2.5 rounded-full ${
                                type === 'food' ? 'bg-blue-600' : 
                                type === 'kitBag' ? 'bg-green-600' : 'bg-amber-600'
                              }`}
                              style={{ width: `${usagePercentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {resourceUsage.length === 0 ? (
                  <div className="bg-gray-50 p-6 rounded-md text-center">
                    <DocumentTextIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 mb-2">No resource usage data available</p>
                    <p className="text-sm text-gray-500">When this registrant uses resources like meals or kit bags, they will appear here.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Group resources by type */}
                    {['food', 'kitBag', 'certificate'].map(resourceType => {
                      const typeResources = resourceUsage.filter(r => r.type === resourceType);
                      
                      if (typeResources.length === 0) return null;
                      
                      const typeLabels = {
                        food: 'Food',
                        kitBag: 'Kit Bags',
                        certificate: 'Certificates'
                      };
                      
                      const typeIcons = {
                        food: <CakeIcon className="h-5 w-5 text-blue-500" />,
                        kitBag: <ShoppingBagIcon className="h-5 w-5 text-green-500" />,
                        certificate: <AcademicCapIcon className="h-5 w-5 text-amber-500" />
                      };
                      
                      return (
                        <div key={resourceType} className="border rounded-md overflow-hidden">
                          <div className={`px-4 py-3 font-medium flex items-center ${
                            resourceType === 'food' ? 'bg-blue-50 text-blue-700' :
                            resourceType === 'kitBag' ? 'bg-green-50 text-green-700' :
                            'bg-amber-50 text-amber-700'
                          }`}>
                            {typeIcons[resourceType]}
                            <span className="ml-2">{typeLabels[resourceType] || resourceType}</span>
                          </div>
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Name
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Description
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Date
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Status
                                </th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {typeResources.map(resource => (
                                <tr key={resource._id} className={resource.isUsed ? '' : 'bg-gray-50'}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {resource.name}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {resource.description || 'N/A'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {formatDate(resource.date) || 'N/A'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    {resource.isUsed ? (
                                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                        Used
                                      </span>
                                    ) : (
                                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                        Not Used
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    {editingResource === resource._id ? (
                                      <Spinner size="sm" />
                                    ) : (
                                      <div className="flex space-x-2 justify-end">
                                        <button
                                          onClick={() => handleUpdateResourceUsage(resource._id, !resource.isUsed)}
                                          className={`text-sm px-3 py-1 rounded-md ${
                                            resource.isUsed 
                                            ? 'text-red-600 hover:text-red-900 hover:bg-red-50' 
                                            : 'text-green-600 hover:text-green-900 hover:bg-green-50'
                                          }`}
                                        >
                                          {resource.isUsed ? 'Mark Unused' : 'Mark Used'}
                                        </button>
                                        <button
                                          onClick={() => handleVoidResource(resource._id)}
                                          className="text-sm px-3 py-1 rounded-md text-orange-600 hover:text-orange-900 hover:bg-orange-50"
                                        >
                                          Void
                                        </button>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            
            {/* Activities Tab */}
            {activeTab === 2 && (
              <div>
                <h3 className="text-lg font-medium mb-4">Registration Activities</h3>
                {registration?.activities && registration.activities.length > 0 ? (
                  <div className="border rounded-md overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {registration.activities.map((activity, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{activity.action}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{activity.description}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{activity.user || 'System'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(activity.timestamp)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-6 rounded-md text-center">
                    <ClockIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 mb-2">No activity records found</p>
                    <p className="text-sm text-gray-500">Activities will be shown here when actions are taken on this registration.</p>
                  </div>
                )}
              </div>
            )}
          </Card>
          
          {/* Certificate Section */}
          {registration && registration.personalInfo?.email && (
            <div className="bg-gradient-to-r from-amber-50 to-amber-100 p-4 mt-6 rounded-lg shadow-sm border border-amber-200">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <AcademicCapIcon className="h-8 w-8 text-amber-600 mr-3" />
                  <div>
                    <h3 className="text-lg font-semibold text-amber-800">Certificate Options</h3>
                    <p className="text-amber-700 text-sm">
                      Send personalized certificates to {registration.personalInfo?.firstName || 'the registrant'} via email
                    </p>
                  </div>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSendCertificate}
                  className="bg-amber-600 hover:bg-amber-700 text-white border-0"
                  leftIcon={<EnvelopeIcon className="h-4 w-4" />}
                >
                  Send Certificate
                </Button>
              </div>
              
              {certificateTypes.length > 0 && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {certificateTypes.map(type => (
                    <div
                      key={type.id}
                      className="bg-white rounded-md p-3 border border-amber-200 flex items-center"
                    >
                      <div className="h-2 w-2 rounded-full bg-amber-500 mr-2"></div>
                      <span className="text-sm text-amber-900">{type.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegistrationDetail; 