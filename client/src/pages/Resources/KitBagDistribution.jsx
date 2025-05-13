import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  ArrowLeftIcon,
  QrCodeIcon,
  ArrowPathIcon,
  ShoppingBagIcon,
  ClockIcon,
  UserGroupIcon,
  UserIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import { Card, Button, Badge, Spinner } from '../../components/common';
import eventService from '../../services/eventService';
import resourceService from '../../services/resourceService';
import registrationService from '../../services/registrationService';

const KitBagDistribution = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [kitType, setKitType] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [recentDistributions, setRecentDistributions] = useState([]);
  const [eventDetails, setEventDetails] = useState(null);
  const [kitItems, setKitItems] = useState([]);
  const [statistics, setStatistics] = useState({
    totalDistributed: 0,
    today: 0,
    coverage: 0,
    byKit: {},
    byCategory: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [manualEntry, setManualEntry] = useState('');
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [event, setEvent] = useState(null);
  const [kits, setKits] = useState([]);
  const [scanMode, setScanMode] = useState(false);
  const [qrInput, setQrInput] = useState('');

  const qrInputRef = useRef(null);

  // Mock data for available kit types
  const kitTypes = [
    { id: 'welcome_kit', name: 'Welcome Kit', items: ['Name badge', 'Event schedule', 'Notepad', 'Pen'] },
    { id: 'attendee_bag', name: 'Attendee Bag', items: ['T-shirt', 'Water bottle', 'Notebook', 'Stickers'] },
    { id: 'speaker_kit', name: 'Speaker Kit', items: ['Speaker badge', 'Presenter remote', 'VIP lounge access'] },
    { id: 'vip_package', name: 'VIP Package', items: ['VIP badge', 'Premium gifts', 'Exclusive access pass'] }
  ];

  // Mock data for attendee categories
  const categories = [
    { id: 'general', name: 'General Attendee' },
    { id: 'speaker', name: 'Speaker' },
    { id: 'sponsor', name: 'Sponsor' },
    { id: 'vip', name: 'VIP' },
    { id: 'staff', name: 'Staff' }
  ];

  // Mock function to check if a kit is allowed for a category
  const isKitAllowedForCategory = (kitId, categoryId) => {
    const allowedMap = {
      'welcome_kit': ['general', 'speaker', 'sponsor', 'vip', 'staff'],
      'attendee_bag': ['general', 'speaker', 'sponsor', 'vip'],
      'speaker_kit': ['speaker'],
      'vip_package': ['vip', 'sponsor']
    };
    
    return allowedMap[kitId]?.includes(categoryId) || false;
  };

  // Fetch event details, kits, and distribution data
  useEffect(() => {
    const fetchEventData = async () => {
      try {
        setLoading(true);
        
        // Fetch event details
        const eventResponse = await eventService.getEventById(eventId);
        if (!eventResponse.success) {
          throw new Error(eventResponse.message || 'Failed to fetch event details');
        }
        setEvent(eventResponse.data);
        
        // Fetch kit settings
        const kitSettingsResponse = await resourceService.getKitSettings(eventId);
        console.log('Kit settings response:', kitSettingsResponse);
        if (kitSettingsResponse.success && kitSettingsResponse.data) {
          // Check different possible locations for kit items
          const kitItems = kitSettingsResponse.data.settings?.items || 
                          kitSettingsResponse.data.items || 
                          [];
          
          console.log('Kit items extracted:', kitItems);
          setKits(kitItems);
          if (kitItems.length > 0) {
            setKitType(kitItems[0]._id);
          }
        } else {
          console.warn('Could not load kit settings, using fallback data');
          // Fallback to minimal kit data if API fails
          const fallbackKits = [
            { _id: 'welcome_kit', name: 'Welcome Kit' },
            { _id: 'attendee_bag', name: 'Attendee Bag' }
          ];
          setKits(fallbackKits);
          setKitType('welcome_kit');
        }
        
        // Fetch recent kit distributions
        await fetchRecentDistributions();
        
        // Fetch kit statistics
        await fetchKitStats();
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching kit distribution data:', err);
        setError(err.message || 'Failed to load kit distribution data');
        setLoading(false);
      }
    };
    
    fetchEventData();
  }, [eventId]);
  
  // Fetch recent distributions
  const fetchRecentDistributions = async () => {
    try {
      console.log('🔍 Fetching recent kit bag distributions');
      // Use 'kitBag' to match the database enum value
      const response = await resourceService.getRecentScans(eventId, 'kitBag', 20);
      
      console.log('Recent distributions response:', response);
      
      if (response.success && Array.isArray(response.data)) {
        console.log('✅ Recent distributions loaded:', response.data.length);
        
        // No need for excessive transformation since the service now handles it
        setRecentDistributions(response.data);
      } else {
        console.warn('⚠️ Could not load recent distributions:', response.message || 'Unknown error');
        setRecentDistributions([]);
      }
    } catch (err) {
      console.error('⛔ Error fetching recent distributions:', err);
      setRecentDistributions([]);
    }
  };
  
  // Fetch kit statistics
  const fetchKitStats = async () => {
    try {
      console.log('🔍 Fetching kit statistics for event:', eventId);
      
      // First try specific kit stats endpoint - use 'kitBag' to match database enum value
      const kitResponse = await resourceService.getResourceTypeStatistics(eventId, 'kitBag');
      console.log('📊 Raw kit response:', kitResponse);
      
      if (kitResponse.success) {
        console.log('✅ Kit statistics loaded successfully:', kitResponse.data);
        
        // Calculate coverage percentage if we have attendee data
        const coveragePercentage = 0; // You can calculate this if you have total attendees
        
        // Debug:
        const newStats = {
          totalDistributed: kitResponse.data.count || 0,
          today: kitResponse.data.today || 0,
          uniqueAttendees: kitResponse.data.uniqueAttendees || 0,
          coverage: coveragePercentage,
          byKit: {},
          byCategory: {}
        };
        console.log('🔢 Setting new statistics:', newStats);
        
        // Update to match UI expected format
        setStatistics(newStats);
        return;
      }

      // Fallback to general stats endpoint
      console.log('⚠️ Falling back to general statistics endpoint');
      const response = await resourceService.getResourceStatistics(eventId);
      console.log('🔄 General stats response:', response);
      
      if (response.success) {
        console.log('📈 General resource statistics loaded:', response.data);
        // Extract kit stats from the byType object
        // Note: backend returns kitBag but our UI uses kits, so check both
        const kitsData = response.data.byType?.kits || 
                       response.data.byType?.kitBag || {};
        console.log('🧰 Extracted kits data:', kitsData);
        
        const kitStats = {
          totalDistributed: kitsData.count || 0,
          today: kitsData.today || 0,
          uniqueAttendees: kitsData.uniqueAttendees || 0,
          coverage: 0,
          byKit: {},
          byCategory: {}
        };
        console.log('📋 Setting kit statistics from general data:', kitStats);
        setStatistics(kitStats);
      } else {
        console.warn('❌ Could not load kit statistics, using empty data');
        setStatistics({
          totalDistributed: 0,
          today: 0,
          coverage: 0,
          byKit: {},
          byCategory: {}
        });
      }
    } catch (err) {
      console.error('⛔ Error fetching kit statistics:', err);
      setStatistics({
        totalDistributed: 0,
        today: 0,
        coverage: 0,
        byKit: {},
        byCategory: {}
      });
    }
  };

  const handleKitTypeChange = (kit) => {
    setKitType(kit);
    setScanResult(null);
  };

  const startScanning = () => {
    if (!kitType) {
      setScanResult({
        status: 'error',
        message: 'Please select a kit type before scanning'
      });
      return;
    }

    setScanning(true);
    
    // Mock successful scan after 2 seconds
    setTimeout(() => {
      // Simulate real scanning with random success/error
      const mockSuccess = Math.random() > 0.3;
      
      if (mockSuccess) {
        // Get a random category for the mock attendee
        const randomCategory = categories[Math.floor(Math.random() * categories.length)].id;
        const kitAllowed = isKitAllowedForCategory(kitType, randomCategory);
        
        if (kitAllowed) {
          const mockResult = {
            status: 'success',
            registrationId: 'REG' + Math.floor(Math.random() * 999).toString().padStart(3, '0'),
            attendeeName: ['John Doe', 'Jane Smith', 'Bob Johnson', 'Alice Williams'][Math.floor(Math.random() * 4)],
            category: randomCategory,
            message: 'Kit successfully distributed',
            timestamp: new Date()
          };
          
          setScanResult(mockResult);
          
          // Add to recent distributions
          setRecentDistributions(prev => [{
            id: Date.now(),
            registrationId: mockResult.registrationId,
            attendeeName: mockResult.attendeeName,
            category: randomCategory,
            kitType,
            timestamp: mockResult.timestamp,
            status: 'success'
          }, ...prev.slice(0, 9)]);
          
          // Update statistics
          setStatistics(prev => ({
            totalDistributed: prev.totalDistributed + 1,
            byKit: {
              ...prev.byKit,
              [kitType]: (prev.byKit[kitType] || 0) + 1
            },
            byCategory: {
              ...prev.byCategory,
              [randomCategory]: (prev.byCategory[randomCategory] || 0) + 1
            }
          }));
        } else {
          // Not allowed for this category
          setScanResult({
            status: 'error',
            message: `This attendee (${randomCategory}) is not eligible for this kit type`,
            timestamp: new Date()
          });
        }
      } else {
        // Error result
        const errorMessages = [
          'Already claimed this kit',
          'Invalid registration ID',
          'Registration not found',
          'Kit out of stock'
        ];
        
        const mockError = {
          status: 'error',
          message: errorMessages[Math.floor(Math.random() * errorMessages.length)],
          timestamp: new Date()
        };
        
        setScanResult(mockError);
      }
      
      setScanning(false);
    }, 2000);
  };

  const stopScanning = () => {
    setScanning(false);
  };

  const resetScanner = () => {
    setScanResult(null);
    setScanning(false);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualEntry || !kitType) return;
    
    // Simulate processing time
    setTimeout(() => {
      // Get a random category for the mock attendee
      const randomCategory = categories[Math.floor(Math.random() * categories.length)].id;
      const kitAllowed = isKitAllowedForCategory(kitType, randomCategory);
      
      if (kitAllowed && Math.random() > 0.3) {
        const mockResult = {
          status: 'success',
          registrationId: manualEntry,
          attendeeName: ['John Doe', 'Jane Smith', 'Bob Johnson', 'Alice Williams'][Math.floor(Math.random() * 4)],
          category: randomCategory,
          message: 'Kit successfully distributed',
          timestamp: new Date()
        };
        
        setScanResult(mockResult);
        
        // Add to recent distributions
        setRecentDistributions(prev => [{
          id: Date.now(),
          registrationId: mockResult.registrationId,
          attendeeName: mockResult.attendeeName,
          category: randomCategory,
          kitType,
          timestamp: mockResult.timestamp,
          status: 'success'
        }, ...prev.slice(0, 9)]);
        
        // Update statistics
        setStatistics(prev => ({
          totalDistributed: prev.totalDistributed + 1,
          byKit: {
            ...prev.byKit,
            [kitType]: (prev.byKit[kitType] || 0) + 1
          },
          byCategory: {
            ...prev.byCategory,
            [randomCategory]: (prev.byCategory[randomCategory] || 0) + 1
          }
        }));
      } else {
        // Error result
        const errorMessages = [
          'Already claimed this kit',
          'Not authorized for this kit type',
          'Registration ID not found',
          'Kit out of stock'
        ];
        
        const mockError = {
          status: 'error',
          message: errorMessages[Math.floor(Math.random() * errorMessages.length)],
          timestamp: new Date()
        };
        
        setScanResult(mockError);
      }
      
      setManualEntry('');
    }, 500);
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Validate kit scan
  const validateScan = async (qrData) => {
    if (!kitType) {
      setScanResult({
        success: false,
        message: 'Please select a kit type before scanning'
      });
      return;
    }
    
    try {
      console.log('🔍 Validating kit scan:', { eventId, qrData, kitType });
      
      // First validate the scan - use 'kitBag' to match database schema
      const validationResponse = await resourceService.validateScan(
        eventId,
        'kitBag',  // Changed from 'kits' to 'kitBag' to match what the backend permission check expects
        kitType,
        qrData
      );
      
      if (!validationResponse.success) {
        setScanResult({
          success: false,
          message: validationResponse.message || 'Invalid scan',
          details: validationResponse.details || 'Unable to process this scan'
        });
        return;
      }
      
      // Record the resource usage
      const usageResponse = await resourceService.recordResourceUsage(
        {
          eventId,
          type: 'kitBag',  // This must match the database enum value
          resourceOptionId: kitType,
          details: {
            option: kits.find(k => k._id === kitType)?.name || 'KIT BAG'
          }
        },
        qrData
      );
      
      if (!usageResponse.success) {
        setScanResult({
          success: false,
          message: usageResponse.message || 'Failed to record kit distribution',
          details: 'The scan was valid, but the kit distribution could not be recorded'
        });
        return;
      }
      
      // Fetch registration details
      const registrationResponse = await registrationService.getRegistrationByQR(
        eventId,
        qrData
      );
      
      if (registrationResponse.success) {
        setScanResult({
          success: true,
          message: 'Kit distributed successfully',
          registration: registrationResponse.data,
          kit: kits.find(k => k._id === kitType)?.name || 'Selected kit'
        });
        
        // Refresh data
        await fetchRecentDistributions();
        await fetchKitStats();
      } else {
        setScanResult({
          success: true,
          message: 'Kit distributed successfully',
          details: 'Unable to fetch registration details'
        });
      }
    } catch (err) {
      console.error('⛔ Error validating scan:', err);
      setScanResult({
        success: false,
        message: 'Error processing scan',
        details: err.message || 'An unexpected error occurred'
      });
    }
  };
  
  // Handle manual QR submission
  const handleManualSubmitQR = async (e) => {
    e.preventDefault();
    if (!qrInput.trim()) return;
    
    await validateScan(qrInput.trim());
    setQrInput('');
    qrInputRef.current?.focus();
  };
  
  // Generate test QR for testing
  const generateTestQR = async () => {
    try {
      // Get a random registration to test with
      const registrationsResponse = await registrationService.getRegistrations(eventId, { limit: 10 });
      if (registrationsResponse.success && registrationsResponse.data && registrationsResponse.data.registrations && registrationsResponse.data.registrations.length > 0) {
        const randomIndex = Math.floor(Math.random() * registrationsResponse.data.registrations.length);
        const registrationId = registrationsResponse.data.registrations[randomIndex].registrationId;
        setQrInput(registrationId);
      } else {
        // If no registrations, use a placeholder
        setQrInput('TEST-1001');
      }
    } catch (err) {
      console.error('Error generating test QR:', err);
      setQrInput('TEST-1001');
    }
  };
  
  // Add function to create a test distribution
  const createTestDistribution = async () => {
    try {
      if (!kitType || !kits.length) {
        alert('Please select a kit type first');
        return;
      }
      
      // Get a random registration
      const registrationsResponse = await registrationService.getRegistrations(eventId, { limit: 10 });
      let registrationId = 'TEST-1001';
      
      if (registrationsResponse.success && registrationsResponse.data?.registrations?.length > 0) {
        const randomIndex = Math.floor(Math.random() * registrationsResponse.data.registrations.length);
        registrationId = registrationsResponse.data.registrations[randomIndex].registrationId;
      }
      
      console.log(`📦 Creating test distribution for registration ${registrationId} with kit ${kitType}`);
      
      // Record the resource usage with kitBag type (must match the database enum)
      const usageResponse = await resourceService.recordResourceUsage(
        {
          eventId,
          type: 'kitBag', // This must match exactly what's in the database
          resourceOptionId: kitType,
          details: {
            option: kits.find(k => k._id === kitType)?.name || 'KIT BAG'
          }
        },
        registrationId
      );
      
      console.log('📋 Test distribution response:', usageResponse);
      
      if (usageResponse.success) {
        alert('Test distribution created successfully');
        // Refresh data
        await fetchRecentDistributions();
        await fetchKitStats();
      } else {
        alert(`Failed to create test distribution: ${usageResponse.message}`);
      }
    } catch (err) {
      console.error('⛔ Error creating test distribution:', err);
      alert(`Error: ${err.message}`);
    }
  };
  
  // Add this function near the top of the component
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };
  
  if (loading && !event) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center h-64">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-500">Loading kit distribution data...</p>
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
        <Link to={`/events/${eventId}/resources`}>
          <Button variant="outline" leftIcon={<ArrowLeftIcon className="h-5 w-5" />}>
            Back to Resources
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
          <Link to={`/events/${eventId}/resources`} className="mr-3">
            <Button variant="ghost" size="sm" leftIcon={<ArrowLeftIcon className="h-5 w-5" />}>
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Kit Bag Distribution</h1>
        </div>
        <p className="text-gray-500">
          Track kit bag distribution for {event?.name}
        </p>
      </div>
      
      {/* Distribution Controls */}
      <Card className="p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-2 md:mb-0">Kit Distribution</h2>
          <div className="flex space-x-2">
            <Button 
              variant="outline"
              size="sm"
              leftIcon={<ArrowPathIcon className="h-4 w-4" />}
              onClick={fetchKitStats}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              variant="outline" 
              size="sm"
              onClick={createTestDistribution}
            >
              Create Test Distribution
            </Button>
          </div>
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Kit Type</label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            value={kitType}
            onChange={handleKitTypeChange}
          >
            {kits.map((kit) => (
              <option key={kit._id} value={kit._id}>
                {kit.name}
              </option>
            ))}
          </select>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-start">
              <div className="p-2 bg-green-100 text-green-700 rounded-full mr-3">
                <ShoppingBagIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-green-700">Total Distributed</p>
                <p className="text-xl font-bold text-green-900">{statistics.totalDistributed}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-start">
              <div className="p-2 bg-blue-100 text-blue-700 rounded-full mr-3">
                <ClockIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-blue-700">Today's Count</p>
                <p className="text-xl font-bold text-blue-900">{statistics.today || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-start">
              <div className="p-2 bg-purple-100 text-purple-700 rounded-full mr-3">
                <UserGroupIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-purple-700">Coverage</p>
                <p className="text-xl font-bold text-purple-900">{statistics.coverage || 0}%</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Scan Toggle */}
        <div className="mb-4">
          <Button
            variant={scanMode ? "primary" : "outline"}
            leftIcon={<QrCodeIcon className="h-5 w-5" />}
            onClick={() => setScanMode(!scanMode)}
            className="w-full md:w-auto"
          >
            {scanMode ? "Hide Scanner" : "Show Scanner"}
          </Button>
        </div>
        
        {/* Scan interface */}
        {scanMode && (
          <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Scan Registration ID</h3>
            
            <form onSubmit={handleManualSubmitQR} className="mb-4">
              <div className="flex">
                <input
                  ref={qrInputRef}
                  type="text"
                  value={qrInput}
                  onChange={(e) => setQrInput(e.target.value)}
                  className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter registration ID or scan QR code"
                />
                <Button
                  type="submit"
                  variant="primary"
                  className="rounded-l-none"
                >
                  Submit
                </Button>
              </div>
            </form>
            
            <div className="flex justify-between items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={generateTestQR}
              >
                Generate Test ID
              </Button>
              
              <Link to={`/events/${eventId}/resources/scanner/kits`}>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<QrCodeIcon className="h-4 w-4" />}
                >
                  Open Scanner
                </Button>
              </Link>
            </div>
            
            {/* Scan result */}
            {scanResult && (
              <div className={`mt-4 p-4 rounded-md ${scanResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-start">
                  <div className={`flex-shrink-0 ${scanResult.success ? 'text-green-600' : 'text-red-600'}`}>
                    {scanResult.success ? (
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="ml-3">
                    <h3 className={`text-sm font-medium ${scanResult.success ? 'text-green-800' : 'text-red-800'}`}>
                      {scanResult.success ? 'Success' : 'Error'}
                    </h3>
                    <div className={`mt-2 text-sm ${scanResult.success ? 'text-green-700' : 'text-red-700'}`}>
                      <p>{scanResult.message}</p>
                      {scanResult.details && <p className="mt-1">{scanResult.details}</p>}
                      
                      {scanResult.success && scanResult.registration && (
                        <div className="mt-3 p-3 bg-white rounded border border-gray-200">
                          <p className="font-medium">{scanResult.registration.firstName} {scanResult.registration.lastName}</p>
                          <p className="text-sm text-gray-600">{scanResult.registration.registrationId}</p>
                          <p className="text-sm text-gray-600">{scanResult.registration.category?.name}</p>
                          <div className="mt-2 flex items-center">
                            <Badge variant="success" size="sm">{scanResult.kit}</Badge>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
      
      {/* Recent Distributions */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Kit Distributions</h2>
        
        {recentDistributions.length === 0 ? (
          <p className="text-center py-8 text-gray-500">No recent kit distributions found</p>
        ) : (
          <div className="divide-y divide-gray-200">
            {recentDistributions.map((distribution) => (
              <div key={distribution._id || `dist-${distribution.timestamp}-${Math.random()}`} className="py-4 first:pt-0 last:pb-0">
                <div className="flex items-start">
                  <div className="flex-shrink-0 p-2 bg-green-100 text-green-700 rounded-full mr-3">
                    <UserIcon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div>
                        {distribution.registration ? (
                          <p className="text-sm font-medium text-gray-900">
                            {distribution.registration.firstName} {distribution.registration.lastName}
                          </p>
                        ) : (
                          <p className="text-sm font-medium text-gray-900">Unknown Registrant</p>
                        )}
                        <p className="text-xs text-gray-500">
                          {distribution.registration?.registrationId || distribution.registrationId || 'No ID'} • 
                          {distribution.registration?.category?.name || 'No Category'}
                        </p>
                      </div>
                      <div className="flex items-center text-xs text-gray-500">
                        <ClockIcon className="h-3 w-3 mr-1" />
                        {formatTimestamp(distribution.timestamp || distribution.actionDate || distribution.createdAt)}
                      </div>
                    </div>
                    <div className="mt-1">
                      <Badge variant="success" size="xs">
                        {distribution.resourceOption?.name || distribution.details?.option || 'Kit Bag'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
      
      {/* Kit Type Breakdown */}
      {Object.keys(statistics.byKit || {}).length > 0 && (
        <Card className="p-6 mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Distribution by Kit Type</h2>
          <div className="space-y-4">
            {Object.entries(statistics.byKit || {}).map(([kitType, count]) => {
              const kitInfo = kits.find(k => k._id === kitType);
              const percentage = statistics.totalDistributed ? Math.round((count / statistics.totalDistributed) * 100) : 0;
              
              return (
                <div key={kitType} className="flex items-center">
                  <div className="p-2 bg-green-100 text-green-700 rounded-full mr-3">
                    <TagIcon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-sm font-medium text-gray-900">{kitInfo?.name || kitType}</p>
                      <p className="text-sm text-gray-600">{count} ({percentage}%)</p>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
};

export default KitBagDistribution; 