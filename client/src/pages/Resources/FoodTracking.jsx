import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ArrowLeftIcon,
  QrCodeIcon,
  ArrowPathIcon,
  UserGroupIcon,
  ClockIcon,
  CalendarIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { 
  Card, Button, Badge, Spinner, Select, Alert, Input, QrScanner 
} from '../../components/common';
import eventService from '../../services/eventService';
import resourceService from '../../services/resourceService';
import registrationService from '../../services/registrationService';
import { FiRefreshCw, FiBarChart2, FiCalendar, FiClock } from 'react-icons/fi';

const FoodTracking = () => {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [selectedMeal, setSelectedMeal] = useState('');
  const [selectedDay, setSelectedDay] = useState('');
  const [recentScans, setRecentScans] = useState([]);
  const [foodStats, setFoodStats] = useState({
    byDay: [],
    byMeal: {},
    byCategory: {},
    total: 0
  });
  const [loading, setLoading] = useState(true);
  const [meals, setMeals] = useState([]);
  const [days, setDays] = useState([]);
  const [scanMode, setScanMode] = useState(false);
  const [qrInput, setQrInput] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [loadingStats, setLoadingStats] = useState(true);
  
  const qrInputRef = useRef(null);
  const qrScannerRef = useRef(null);
  const daysOfEvent = useRef([]);
  const mealOptions = useRef([]);
  
  // Fetch event details, meals, and days
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
        
        // Generate days array from event start and end dates
        const startDate = new Date(eventResponse.data.startDate);
        const endDate = new Date(eventResponse.data.endDate);
        const daysArr = [];
        
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          daysArr.push({
            date: new Date(d),
            label: format(new Date(d), 'EEEE, MMMM d, yyyy')
          });
        }
        
        setDays(daysArr);
        if (daysArr.length > 0) {
          setSelectedDay(format(daysArr[0].date, 'yyyy-MM-dd'));
        }
        
        // Fetch food settings to get meals
        const foodSettingsResponse = await resourceService.getFoodSettings(eventId);
        if (foodSettingsResponse.success) {
          setMeals(foodSettingsResponse.data.meals || []);
          if (foodSettingsResponse.data.meals && foodSettingsResponse.data.meals.length > 0) {
            setSelectedMeal(foodSettingsResponse.data.meals[0]._id);
          }
        }
        
        // Fetch recent food scans
        await fetchRecentScans();
        
        // Fetch food statistics
        await fetchFoodStatistics();
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching food tracking data:', err);
        setError(err.message || 'Failed to load food tracking data');
        setLoading(false);
      }
    };
    
    fetchEventData();
  }, [eventId]);
  
  // Fetch recent scans
  const fetchRecentScans = async () => {
    try {
      const response = await resourceService.getRecentScans(eventId, 'food', 20);
      if (response.success) {
        setRecentScans(response.data || []);
      }
    } catch (err) {
      console.error('Error fetching recent scans:', err);
    }
  };
  
  // Fetch food statistics
  const fetchFoodStatistics = async () => {
    try {
      setLoadingStats(true);
      
      const response = await resourceService.getResourceStatistics(eventId);
      
      if (response && response.success) {
        // Transform the general resource statistics to food-specific format
        const foodStats = {
          byDay: [], // This data isn't available in the resource stats
          byMeal: {},
          byCategory: {},
          total: response.data.byType?.food || 0
        };
        
        setFoodStats(foodStats);
      } else {
        console.error("Failed to fetch food statistics:", response?.message);
        setFoodStats({
          byDay: [],
          byMeal: {},
          byCategory: {},
          total: 0
        });
      }
    } catch (error) {
      console.error("Error fetching food statistics:", error);
      // Set default empty stats
      setFoodStats({
        byDay: [],
        byMeal: {},
        byCategory: {},
        total: 0
      });
    } finally {
      setLoadingStats(false);
    }
  };
  
  // Handle day change
  const handleDayChange = (e) => {
    setSelectedDay(e.target.value);
    fetchFoodStatistics();
  };
  
  // Handle meal change
  const handleMealChange = (e) => {
    setSelectedMeal(e.target.value);
  };
  
  // Validate food scan
  const validateScan = async (qrData) => {
    if (!selectedMeal || !selectedDay) {
      setScanResult({
        success: false,
        message: 'Please select a meal and day before scanning'
      });
      return;
    }
    
    try {
      // First validate the scan
      const validationResponse = await resourceService.validateScan(
        eventId,
        'food',
        selectedMeal,
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
      
      // Record the resource usage with the selected date
      const usageResponse = await resourceService.recordResourceUsage(
        eventId,
        qrData,
        {
          type: 'food',
          mealId: selectedMeal,
          day: selectedDay
        }
      );
      
      if (!usageResponse.success) {
        setScanResult({
          success: false,
          message: usageResponse.message || 'Failed to record meal',
          details: 'The scan was valid, but the meal could not be recorded'
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
          message: 'Meal recorded successfully',
          registration: registrationResponse.data,
          meal: meals.find(m => m._id === selectedMeal)?.name || 'Selected meal',
          day: selectedDay
        });
        
        // Refresh data
        fetchRecentScans();
        fetchFoodStatistics();
      } else {
        setScanResult({
          success: true,
          message: 'Meal recorded successfully',
          details: 'Unable to fetch registration details'
        });
      }
    } catch (err) {
      console.error('Error validating scan:', err);
      setScanResult({
        success: false,
        message: 'Error processing scan',
        details: err.message || 'An unexpected error occurred'
      });
    }
  };
  
  // Handle manual QR submission
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!qrInput.trim()) return;
    
    await validateScan(qrInput.trim());
    setQrInput('');
    qrInputRef.current?.focus();
  };
  
  // Generate mock QR for testing
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
  
  // Format timestamp for display
  const formatTimestamp = (timestamp) => {
    try {
      return format(new Date(timestamp), 'h:mm a');
    } catch (err) {
      return 'Invalid time';
    }
  };
  
  // Format date for display
  const formatDay = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM d');
    } catch (err) {
      return dateString;
    }
  };
  
  // Refresh all data
  const refreshData = async () => {
    setLoading(true);
    await Promise.all([fetchRecentScans(), fetchFoodStatistics()]);
    setLoading(false);
  };
  
  // Handle QR scan completion from the QrScanner component
  const handleScanComplete = (result) => {
    setScanning(false);
    if (result) {
      validateScan(result);
    }
  };
  
  // Start the QR scanner
  const handleStartScanning = () => {
    setScanning(true);
    setScanResult(null);
    setError(null);
    setSuccess(null);
  };
  
  // Stop the QR scanner
  const handleStopScanning = () => {
    setScanning(false);
  };
  
  const getStatusBadge = (status) => {
    switch (status) {
      case 'success':
        return <Badge color="green">Success</Badge>;
      case 'error':
        return <Badge color="red">Error</Badge>;
      case 'warning':
        return <Badge color="yellow">Warning</Badge>;
      default:
        return <Badge color="gray">Unknown</Badge>;
    }
  };
  
  if (loading && !event) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center h-64">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-500">Loading food tracking data...</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Food Tracking</h1>
        </div>
        <p className="text-gray-500">
          Track meal distribution for {event?.name}
        </p>
      </div>
      
      {/* Filter Controls */}
      <Card className="p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-2 md:mb-0">Food Distribution</h2>
          <Button 
            variant="outline"
            size="sm"
            leftIcon={<ArrowPathIcon className="h-4 w-4" />}
            onClick={refreshData}
            disabled={loading}
          >
            Refresh
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Day</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              value={selectedDay}
              onChange={handleDayChange}
            >
              {days.map((day, index) => (
                <option key={index} value={format(day.date, 'yyyy-MM-dd')}>
                  {day.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Meal</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              value={selectedMeal}
              onChange={handleMealChange}
            >
              {meals.map((meal) => (
                <option key={meal._id} value={meal._id}>
                  {meal.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Scan Toggle */}
        <div className="mb-4">
          {scanning ? (
            <Button
              variant="danger"
              leftIcon={<QrCodeIcon className="h-5 w-5" />}
              onClick={handleStopScanning}
              className="w-full md:w-auto"
            >
              Stop Scanning
            </Button>
          ) : (
            <Button
              variant="primary"
              leftIcon={<QrCodeIcon className="h-5 w-5" />}
              onClick={handleStartScanning}
              className="w-full md:w-auto"
            >
              Start Scanning
            </Button>
          )}
        </div>
        
        {/* Scan interface */}
        {scanMode && (
          <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Scan Registration ID</h3>
            
            <form onSubmit={handleManualSubmit} className="mb-4">
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
              
              <Link to={`/events/${eventId}/resources/scanner/food`}>
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
                            <Badge variant="primary" size="sm">{scanResult.meal}</Badge>
                            <Badge variant="secondary" size="sm" className="ml-2">{scanResult.day}</Badge>
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
      
      {/* Recent Scans */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Meal Distributions</h2>
        
        {recentScans.length === 0 ? (
          <p className="text-center py-8 text-gray-500">No recent food distributions found</p>
        ) : (
          <div className="divide-y divide-gray-200">
            {recentScans.map((scan, index) => (
              <div key={scan._id || index} className="py-4 first:pt-0 last:pb-0">
                <div className="flex items-start">
                  <div className="flex-shrink-0 p-2 bg-blue-100 text-blue-700 rounded-full mr-3">
                    <UserGroupIcon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div>
                        {scan.registration ? (
                          <p className="text-sm font-medium text-gray-900">
                            {scan.registration.firstName} {scan.registration.lastName}
                          </p>
                        ) : (
                          <p className="text-sm font-medium text-gray-900">Unknown Registrant</p>
                        )}
                        <p className="text-xs text-gray-500">
                          {scan.registration?.registrationId || 'No ID'} • {scan.registration?.category?.name || 'No Category'}
                        </p>
                      </div>
                      <div className="flex items-center text-xs text-gray-500">
                        <ClockIcon className="h-3 w-3 mr-1" />
                        {formatTimestamp(scan.timestamp)}
                      </div>
                    </div>
                    <div className="mt-1 flex items-center">
                      <Badge variant="primary" size="xs">
                        {scan.resourceOption?.name || 'Meal'}
                      </Badge>
                      <Badge variant="secondary" size="xs" className="ml-2">
                        {scan.date ? formatDay(scan.date) : 'No date'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {scanning && (
        <Card>
          <h2 className="text-lg font-semibold mb-4">QR Scanner</h2>
          <div className="bg-gray-100 rounded-lg overflow-hidden">
            <QrScanner
              onScanComplete={handleScanComplete}
              width="100%"
              height="320px"
            />
          </div>
        </Card>
      )}
    </div>
  );
};

export default FoodTracking; 