import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom'; // Removed useParams
import {
  Card,
  Button,
  Select,
  Alert,
  Spinner,
  Tabs
} from '../../../components/common'; // Adjusted import path
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline'; // Removed ArrowLeftIcon
import eventService from '../../../services/eventService'; // Adjusted import path
import registrationService from '../../../services/registrationService'; // Adjusted import path
import resourceService from '../../../services/resourceService'; // Adjusted import path
import abstractService from '../../../services/abstractService'; // Adjusted import path

// --- Import Chart.js components and register elements --- 
import {
  Chart as ChartJS, 
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale, 
  LinearScale, 
  PointElement,
  LineElement, 
  BarElement, 
  Title, 
  Filler 
} from 'chart.js';
import { Pie, Doughnut, Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale, 
  LinearScale, 
  PointElement,
  LineElement, 
  BarElement, 
  Title, 
  Filler
);

// --- Updated Chart Component --- 
const Chart = ({ type, data, options }) => {
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
      title: {
        display: false, // Keep title minimal, provided by section headers
      },
    },
    ...(options || {}), // Merge custom options
  };

  // Basic data validation
  if (!data || !data.labels || !data.datasets || data.labels.length === 0 || data.datasets.length === 0 || !data.datasets[0].data || data.datasets[0].data.length === 0) {
    return (
      <div className="bg-gray-50 border rounded-md p-4 h-64 flex items-center justify-center">
        <p className="text-gray-400 text-center text-sm">
          No data available for this chart.
        </p>
      </div>
    );
  }
  
  // Default colors for datasets if not provided
  const defaultColors = [
    'rgba(75, 192, 192, 0.6)', 'rgba(54, 162, 235, 0.6)', 'rgba(255, 206, 86, 0.6)', 
    'rgba(153, 102, 255, 0.6)', 'rgba(255, 159, 64, 0.6)', 'rgba(255, 99, 132, 0.6)', 
    'rgba(99, 255, 132, 0.6)', 'rgba(132, 99, 255, 0.6)'
  ];
  
  const formattedData = {
    ...data,
    datasets: data.datasets.map((dataset, index) => ({
      ...dataset,
      backgroundColor: dataset.backgroundColor || (type === 'Pie' || type === 'Doughnut' ? defaultColors : defaultColors[index % defaultColors.length]),
      borderColor: dataset.borderColor || (type === 'Pie' || type === 'Doughnut' ? 'rgba(255, 255, 255, 1)' : defaultColors[index % defaultColors.length].replace('0.6', '1')),
      borderWidth: dataset.borderWidth || 1,
      // Add fill for Line charts if desired
      fill: dataset.fill !== undefined ? dataset.fill : (type === 'Line'),
      tension: dataset.tension || (type === 'Line' ? 0.1 : undefined)
    }))
  };

  const renderChart = () => {
    switch (type?.toLowerCase()) {
      case 'pie':
        return <Pie data={formattedData} options={commonOptions} />;
      case 'doughnut':
        return <Doughnut data={formattedData} options={commonOptions} />;
      case 'line':
      case 'area': // Treat Area as Line for now, potentially adjust fill
        return <Line data={formattedData} options={commonOptions} />;
      case 'bar':
        return <Bar data={formattedData} options={commonOptions} />;
      default:
        // Handle potential null/undefined type gracefully
        return <p className="text-red-500">Unknown or invalid chart type</p>; 
    }
  };

  return (
    <div className="relative h-64 w-full"> 
      {renderChart()}
    </div>
  );
};

// Renamed component and accepting eventId as prop
const ReportsTab = ({ eventId }) => { 
  
  // Define tabs array outside for reference
  const reportTabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'registrations', label: 'Registrations' },
    { id: 'food', label: 'Food' },
    { id: 'kitbags', label: 'Kits' },
    { id: 'certificates', label: 'Certs' },
    { id: 'abstracts', label: 'Abstracts' }
  ];

  // State (remains mostly the same)
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState(null);
  const [activeTab, setActiveTab] = useState(reportTabs[0].id); // Initialize with the first tab's ID
  const [dateRange, setDateRange] = useState('all');
  const [exportFormat, setExportFormat] = useState('pdf');
  const [exportLoading, setExportLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [fetchErrors, setFetchErrors] = useState({});
  const [statistics, setStatistics] = useState({
    registrations: { total: 0, checkedIn: 0, byCategory: {}, byDay: [] },
    resources: { food: { total: 0, byType: {}, byDay: [] }, kitBags: { total: 0, byType: {} }, certificates: { total: 0, byType: {} } },
    abstracts: { total: 0, byStatus: {}, byCategory: {} }
  });
  const [resourceStats, setResourceStats] = useState({ food: 0, kits: 0, certificates: 0, total: 0 });
  // --- New state for recent food scans --- 
  const [recentFoodScans, setRecentFoodScans] = useState([]); 
  const [foodScansLoading, setFoodScansLoading] = useState(false); // Separate loading for scans
  // --- Add state for Kits and Certs --- 
  const [recentKitScans, setRecentKitScans] = useState([]);
  const [kitScansLoading, setKitScansLoading] = useState(false);
  const [recentCertScans, setRecentCertScans] = useState([]);
  const [certScansLoading, setCertScansLoading] = useState(false);
  
  // --- Calculate Hourly Scan Distribution for Food --- 
  const hourlyFoodScanData = useMemo(() => {
    if (!recentFoodScans || recentFoodScans.length === 0) {
      return { labels: [], datasets: [{ data: [] }] };
    }

    // Initialize counts for hours 0-23
    const hourlyCounts = Array(24).fill(0);
    
    recentFoodScans.forEach(scan => {
      if (scan.timestamp) {
        try {
          const scanDate = new Date(scan.timestamp);
          const hour = scanDate.getHours(); // Get hour (0-23)
          if (hour >= 0 && hour < 24) {
            hourlyCounts[hour]++;
          }
        } catch (e) {
          console.error("Error parsing scan timestamp:", scan.timestamp, e);
        }
      }
    });

    // Prepare data for Chart.js (e.g., only show hours with data or a specific range like 6am-10pm)
    const relevantHours = [];
    const relevantData = [];
    const hourLabels = []; // For display (e.g., '8 AM', '1 PM')

    // Example: Display hours from 6 AM to 10 PM (6 to 22)
    for (let hour = 6; hour <= 22; hour++) {
      relevantHours.push(hour);
      relevantData.push(hourlyCounts[hour]);
      // Format label
      const displayHour = hour % 12 === 0 ? 12 : hour % 12;
      const ampm = hour < 12 || hour === 24 ? 'AM' : 'PM';
      hourLabels.push(`${displayHour} ${ampm}`);
    }

    return {
      labels: hourLabels, // Use formatted labels
      datasets: [{
        label: 'Scans per Hour',
        data: relevantData,
        // Add specific styling for bar chart if needed
      }]
    };
  }, [recentFoodScans]); // Recalculate only when recentFoodScans changes

  // --- Calculate Hourly Scan Distribution for Kits --- 
  const hourlyKitScanData = useMemo(() => {
    if (!recentKitScans || recentKitScans.length === 0) {
      return { labels: [], datasets: [{ data: [] }] };
    }
    const hourlyCounts = Array(24).fill(0);
    recentKitScans.forEach(scan => {
      if (scan.timestamp) {
        try {
          const hour = new Date(scan.timestamp).getHours();
          if (hour >= 0 && hour < 24) hourlyCounts[hour]++;
        } catch (e) {}
      }
    });
    const relevantData = [];
    const hourLabels = []; 
    for (let hour = 6; hour <= 22; hour++) {
      relevantData.push(hourlyCounts[hour]);
      const displayHour = hour % 12 === 0 ? 12 : hour % 12;
      const ampm = hour < 12 || hour === 24 ? 'AM' : 'PM';
      hourLabels.push(`${displayHour} ${ampm}`);
    }
    return {
      labels: hourLabels,
      datasets: [{
        label: 'Scans per Hour',
        data: relevantData
      }]
    };
  }, [recentKitScans]);

  // --- Calculate Hourly Scan Distribution for Certificates --- 
  const hourlyCertScanData = useMemo(() => {
    if (!recentCertScans || recentCertScans.length === 0) {
      return { labels: [], datasets: [{ data: [] }] };
    }
    const hourlyCounts = Array(24).fill(0);
    recentCertScans.forEach(scan => {
      if (scan.timestamp) {
        try {
          const hour = new Date(scan.timestamp).getHours();
          if (hour >= 0 && hour < 24) hourlyCounts[hour]++;
        } catch (e) {}
      }
    });
    const relevantData = [];
    const hourLabels = []; 
    for (let hour = 6; hour <= 22; hour++) {
      relevantData.push(hourlyCounts[hour]);
      const displayHour = hour % 12 === 0 ? 12 : hour % 12;
      const ampm = hour < 12 || hour === 24 ? 'AM' : 'PM';
      hourLabels.push(`${displayHour} ${ampm}`);
    }
    return {
      labels: hourLabels,
      datasets: [{
        label: 'Scans per Hour',
        data: relevantData
      }]
    };
  }, [recentCertScans]);

  // useEffect for data fetching (using eventId prop)
  useEffect(() => {
    const fetchReportData = async () => {
      // Check eventId prop
      if (!eventId) {
          console.warn("ReportsTab: eventId prop is missing.");
          setLoading(false);
          setStatus({ type: 'error', message: 'Event ID not provided.' });
          return;
      }
      
      setLoading(true);
      setStatus(null); 
      setFetchErrors({}); 
      setFoodScansLoading(true); 
      // --- Start loading for kits and certs --- 
      setKitScansLoading(true);
      setCertScansLoading(true);
      
      try {
        const results = await Promise.allSettled([
          eventService.getEventById(eventId),
          registrationService.getRegistrationStatistics(eventId),
          resourceService.getResourceStatistics(eventId), 
          abstractService.getAbstractStatistics(eventId),
          resourceService.getRecentScans(eventId, 'food', 20),
          // --- Add calls for recent kit and cert scans --- 
          resourceService.getRecentScans(eventId, 'kitBag', 20), // Use 'kitBag' for API
          resourceService.getRecentScans(eventId, 'certificate', 20)
        ]);
        
        const [eventResult, regStatsResult, resourceStatsResult, abstractStatsResult, foodScansResult, kitScansResult, certScansResult] = results;
        const errors = {};

        // Process Event Details
        if (eventResult.status === 'fulfilled' && eventResult.value?.success && eventResult.value?.data?._id) {
            // Use eventResult.value.data as getEventById now returns { success, data }
            setEvent(eventResult.value.data); 
        } else {
          console.error("Failed to fetch event details:", eventResult.reason || eventResult.value?.message || 'No event data');
          setStatus({
            type: 'error',
            message: 'Failed to load essential event data. Cannot display reports.',
            details: eventResult.reason?.message || eventResult.value?.message || 'Could not fetch event'
          });
          setLoading(false);
          return; 
        }
        
        const statsData = {
          registrations: { total: 0, checkedIn: 0, byCategory: {}, byDay: [] },
          resources: { food: { total: 0, byType: {}, byDay: [] }, kitBags: { total: 0, byType: {} }, certificates: { total: 0, byType: {} } },
          abstracts: { total: 0, byStatus: {}, byCategory: {} }
        };

        // Process Registration Statistics
        if (regStatsResult.status === 'fulfilled' && regStatsResult.value?.success) {
          statsData.registrations = regStatsResult.value.data || statsData.registrations;
        } else {
          errors.registrations = regStatsResult.reason?.message || regStatsResult.value?.message || 'Failed to fetch registration statistics';
          console.warn('Registration Stats Error:', errors.registrations);
        }
        
        // Process Resource Statistics
        let fetchedResourceData = null;
        if (resourceStatsResult.status === 'fulfilled' && resourceStatsResult.value?.success) {
          fetchedResourceData = resourceStatsResult.value.data;
          
          // --- MODIFIED MERGE LOGIC --- 
          statsData.resources.food.byType = fetchedResourceData?.byDetail?.food || {};
          statsData.resources.kitBags.byType = fetchedResourceData?.byDetail?.kitBag || {};
          statsData.resources.certificates.byType = fetchedResourceData?.byDetail?.certificate || {};
          // --- Store byDay data for resources (specifically useful for food timeline) --- 
          statsData.resources.food.byDay = fetchedResourceData?.byDay || []; 
          // We could potentially store byDay for kits/certs too if needed later:
          // statsData.resources.kitBags.byDay = fetchedResourceData?.byDay?.filter(d => /* filter logic for kit scans if possible */) || []; 
          // statsData.resources.certificates.byDay = fetchedResourceData?.byDay?.filter(d => /* filter logic for cert scans if possible */) || [];
          
          // Update the separate simple stats state
          setResourceStats({
            food: fetchedResourceData?.byType?.food || 0,
            // Use kitBag key from API response for consistency
            kits: fetchedResourceData?.byType?.kitBag || 0, 
            // Use certificate key from API response
            certificates: fetchedResourceData?.byType?.certificate || 0,
            total: fetchedResourceData?.totalUsage || 0 // Use totalUsage from API response
          });
        } else {
          errors.resources = resourceStatsResult.reason?.message || resourceStatsResult.value?.message || 'Failed to fetch resource statistics';
          console.warn('Resource Stats Error:', errors.resources);
          setResourceStats({ food: 0, kits: 0, certificates: 0, total: 0 }); 
        }
        
        // Process Abstract Statistics
        if (abstractStatsResult.status === 'fulfilled' && abstractStatsResult.value?.success) {
          statsData.abstracts = abstractStatsResult.value.data || statsData.abstracts;
        } else {
          errors.abstracts = abstractStatsResult.reason?.message || abstractStatsResult.value?.message || 'Failed to fetch abstract statistics';
          console.warn('Abstract Stats Error:', errors.abstracts);
        }
        
        // Process Recent Food Scans 
        if (foodScansResult.status === 'fulfilled' && foodScansResult.value?.success) {
          setRecentFoodScans(foodScansResult.value.data || []);
        } else {
          console.warn('Failed to fetch recent food scans:', foodScansResult.reason || foodScansResult.value?.message);
          errors.recentFoodScans = foodScansResult.reason?.message || foodScansResult.value?.message || 'Failed to fetch recent food scans';
          setRecentFoodScans([]); 
        }

        // --- Process Recent Kit Scans --- 
        if (kitScansResult.status === 'fulfilled' && kitScansResult.value?.success) {
          setRecentKitScans(kitScansResult.value.data || []);
        } else {
          console.warn('Failed to fetch recent kit scans:', kitScansResult.reason || kitScansResult.value?.message);
          errors.recentKitScans = kitScansResult.reason?.message || kitScansResult.value?.message || 'Failed to fetch recent kit scans';
          setRecentKitScans([]);
        }

        // --- Process Recent Cert Scans --- 
        if (certScansResult.status === 'fulfilled' && certScansResult.value?.success) {
          setRecentCertScans(certScansResult.value.data || []);
        } else {
          console.warn('Failed to fetch recent cert scans:', certScansResult.reason || certScansResult.value?.message);
          errors.recentCertScans = certScansResult.reason?.message || certScansResult.value?.message || 'Failed to fetch recent cert scans';
          setRecentCertScans([]);
        }
        
        setStatistics(statsData);
        
        if (Object.keys(errors).length > 0) {
          setFetchErrors(errors);
           setStatus({ 
             type: 'warning',
             message: 'Some report data could not be loaded.',
           });
        }
        
      } catch (err) {
        console.error('Unexpected error fetching report data:', err);
        setStatus({
          type: 'error',
          message: 'An unexpected error occurred while loading report data.',
          details: err.message
        });
      } finally {
        setLoading(false);
        setFoodScansLoading(false); 
        // --- Finish loading for kits and certs --- 
        setKitScansLoading(false);
        setCertScansLoading(false);
      }
    };
    
    fetchReportData();

  }, [eventId]); // Dependency is now the eventId prop

  // handleExport function (remains mostly the same)
  const handleExport = async () => {
    setExportLoading(true);
    try {
      const params = {
        format: exportFormat,
        dateRange,
        // If overview is selected, default reportType to 'registrations' for export
        reportType: activeTab === 'overview' ? 'registrations' : activeTab 
      };
      
      let response;
      // Determine which service to call based on the *potentially modified* reportType
      switch (params.reportType) { 
        case 'registrations':
          response = await registrationService.exportRegistrations(eventId, params);
          break;
        case 'food':
        case 'kitbags': 
        case 'certificates':
          // Use the new exportResourceUsage function
          response = await resourceService.exportResourceUsage(eventId, params.reportType, params);
          break;
        case 'abstracts':
          response = await abstractService.exportAbstracts(eventId, params.format);
          break;
      }
      
      // --- File Download Handling ---
      // Check if response is a blob (Axios handles this)
      if (response instanceof Blob) {
        const url = window.URL.createObjectURL(response);
        const link = document.createElement('a');
        link.href = url;
        // Try to get filename from content-disposition header
        // const contentDisposition = response.headers['content-disposition'];
        // let filename = `${event?.name || 'Event'}_Report.${exportFormat}`;
        // if (contentDisposition) {
        //   const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        //   if (filenameMatch && filenameMatch.length === 2)
        //     filename = filenameMatch[1];
        // }
        // For simplicity, use generated filename
        let filename = `${event?.name || 'Event'}_Report`;
        if (activeTab !== 'overview') {
          filename += `_${activeTab}`;
        }
        filename += `.${exportFormat === 'excel' ? 'xlsx' : exportFormat}`; // Adjust extension for excel

        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url); // Clean up blob URL

        setStatus({
          type: 'success',
          message: `Report exported successfully as ${exportFormat.toUpperCase()}`
        });
      } else if (response && response.success && response.data?.fileUrl) {
         // Handle case where API returns a URL (less common for exports)
         window.open(response.data.fileUrl, '_blank');
         setStatus({
           type: 'success',
           message: `Report download initiated.`
         });
      } else {
        // Handle API failure or unexpected response format
        throw new Error(response?.message || 'Export failed or returned unexpected data.');
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      setStatus({
        type: 'error',
        message: 'Failed to export report. Please try again.',
        details: error.message || (error.response?.data ? JSON.stringify(error.response.data) : 'Unknown export error')
      });
    } finally {
      setExportLoading(false);
    }
  };
  
  // formatNumber function (remains the same)
  const formatNumber = (num) => {
    if (num === undefined || num === null) return '0';
    return new Intl.NumberFormat().format(num);
  };
  
  // --- New Tab Change Handler ---
  const handleTabChange = (index) => {
    if (reportTabs[index]) {
      setActiveTab(reportTabs[index].id); // Set state using the ID string
    }
  };

  // Loading state render (remains the same)
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
        <span className="ml-2 text-gray-500">Loading report data...</span>
      </div>
    );
  }
  
  // Error state render if critical data (event info) failed to load
  if (status?.type === 'error' && !event) {
      return (
           <div className="p-4">
                <Alert 
                    type="error" 
                    message={status.message} 
                    details={status.details}
                    onClose={() => setStatus(null)}
                />
           </div>
      );
  }

  // Main component render (removed container and back link)
  return (
    <div className="py-2"> 
      <div className="flex justify-end items-center mb-6 space-x-2"> 
         {/* Moved controls to the top right */}
          <Select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            options={[
              { value: 'all', label: 'All Time' },
              { value: 'week', label: 'Past Week' },
              { value: 'month', label: 'Past Month' },
              // { value: 'custom', label: 'Custom Range' } // Add later if needed
            ]}
            className="w-32" // Reduced width
            size="sm" // Smaller size
          />
          <Select
            value={exportFormat}
            onChange={(selectedValue) => setExportFormat(selectedValue)}
            options={[
              { value: 'pdf', label: 'PDF' },
              { value: 'excel', label: 'Excel' },
              { value: 'csv', label: 'CSV' }
            ]}
            className="w-24" // Reduced width
             size="sm" // Smaller size
          />
          <Button 
            variant="outline" // Changed variant
            size="sm" // Smaller size
            onClick={handleExport}
            disabled={exportLoading}
            leftIcon={<ArrowDownTrayIcon className="h-4 w-4" />} // Smaller icon
          >
            {exportLoading ? <Spinner size="xs" className="mr-1" /> : null} 
            Export
          </Button>
      </div>

      {/* Display general status/fetch errors */}
      {status && status.type !== 'error' && ( // Don't show non-critical errors if critical one already shown
        <Alert 
          type={status.type} 
          message={status.message} 
          details={status.details}
          className="mb-6"
          onClose={() => setStatus(null)}
        />
      )}
      
      {Object.keys(fetchErrors).length > 0 && (
        <Alert
          type="warning"
          message="Some data sections might be incomplete"
          details={`Issues loading: ${Object.keys(fetchErrors).join(', ')}`}
          className="mb-6"
           onClose={() => setFetchErrors({})} // Allow closing
        />
      )}

      {/* Main content Card */}
      <Card className="mb-6">
        {/* Event Info Summary */}
        <div className="p-4 border-b">
          <h3 className="text-lg font-medium">Event Summary</h3>
          {event ? (
             <p className="text-gray-600 text-sm">
                {event.name} - {new Date(event.startDate).toLocaleDateString()} to {new Date(event.endDate).toLocaleDateString()}
             </p>
          ) : (
             <p className="text-gray-500 text-sm">Loading event info...</p> 
          )}
        </div>
        
        {/* Key Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
          <div className="bg-blue-50 rounded-lg p-3"> 
            <h4 className="text-xs font-medium text-blue-700 mb-1 uppercase tracking-wider">Registrations</h4>
            <div className="flex items-baseline">
              <span className="text-xl font-bold mr-1">{formatNumber(statistics.registrations.total)}</span>
              <span className="text-xs text-gray-500">({formatNumber(statistics.registrations.checkedIn)} in)</span>
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <h4 className="text-xs font-medium text-green-700 mb-1 uppercase tracking-wider">Food</h4>
            <div className="flex items-baseline">
              <span className="text-xl font-bold mr-1">{formatNumber(resourceStats.food)}</span>
              <span className="text-xs text-gray-500">meals</span>
            </div>
          </div>
          <div className="bg-amber-50 rounded-lg p-3">
            <h4 className="text-xs font-medium text-amber-700 mb-1 uppercase tracking-wider">Kits</h4>
            <div className="flex items-baseline">
              <span className="text-xl font-bold mr-1">{formatNumber(resourceStats.kits)}</span>
              <span className="text-xs text-gray-500">distrib.</span>
            </div>
          </div>
           <div className="bg-purple-50 rounded-lg p-3">
            <h4 className="text-xs font-medium text-purple-700 mb-1 uppercase tracking-wider">Certs</h4>
            <div className="flex items-baseline">
              <span className="text-xl font-bold mr-1">{formatNumber(resourceStats.certificates)}</span>
              <span className="text-xs text-gray-500">issued</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs and Content Card */}
      <Card>
        <Tabs
          tabs={reportTabs} // Use the defined tabs array
          activeTab={activeTab}
          onChange={handleTabChange} // Use the new handler
          variant="underline" // Use underline style
        />
        
        <div className="mt-4 p-4"> 
          {/* Tab Content (uses activeTab string ID correctly) */} 
           {activeTab === 'overview' && (
            <div className="space-y-6">
              {Object.keys(statistics.registrations.byCategory).length > 0 && (
                 <div>
                  <h3 className="text-md font-semibold mb-3">Registrations</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">By Category</h4>
                       <Chart type="Pie" data={{ labels: Object.keys(statistics.registrations.byCategory), datasets: [{ data: Object.values(statistics.registrations.byCategory) }] }} />
                    </div>
                     {statistics.registrations.byDay?.length > 0 && (
                      <div>
                       <h4 className="text-sm font-medium text-gray-700 mb-1">Trend</h4>
                       <Chart type="Line" data={{ labels: statistics.registrations.byDay.map(d => new Date(d.date).toLocaleDateString()), datasets: [{ data: statistics.registrations.byDay.map(d => d.count) }] }} />
                      </div>
                     )}
                  </div>
                </div>
              )}
              {(statistics.resources?.food?.byType && Object.keys(statistics.resources.food.byType).length > 0 ||
               statistics.resources?.kitBags?.byType && Object.keys(statistics.resources.kitBags.byType).length > 0 ||
               statistics.resources?.certificates?.byType && Object.keys(statistics.resources.certificates.byType).length > 0) && (
                 <div>
                  <h3 className="text-md font-semibold mb-3">Resources</h3>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     {statistics.resources?.food?.byType && Object.keys(statistics.resources.food.byType).length > 0 && (
                       <div>
                         <h4 className="text-sm font-medium text-gray-700 mb-1">Food</h4>
                         <Chart type="Bar" data={{ labels: Object.keys(statistics.resources.food.byType), datasets: [{ data: Object.values(statistics.resources.food.byType) }] }} />
                       </div>
                     )}
                     {statistics.resources?.kitBags?.byType && Object.keys(statistics.resources.kitBags.byType).length > 0 && (
                       <div>
                         <h4 className="text-sm font-medium text-gray-700 mb-1">Kits</h4>
                         <Chart type="Doughnut" data={{ labels: Object.keys(statistics.resources.kitBags.byType), datasets: [{ data: Object.values(statistics.resources.kitBags.byType) }] }} />
                       </div>
                     )}
                      {statistics.resources?.certificates?.byType && Object.keys(statistics.resources.certificates.byType).length > 0 && (
                       <div>
                         <h4 className="text-sm font-medium text-gray-700 mb-1">Certs</h4>
                          <Chart type="Doughnut" data={{ labels: Object.keys(statistics.resources.certificates.byType), datasets: [{ data: Object.values(statistics.resources.certificates.byType) }] }} />
                       </div>
                     )}
                  </div>
                 </div>
              )}
              {(statistics.abstracts?.byStatus && Object.keys(statistics.abstracts.byStatus).length > 0 ||
               statistics.abstracts?.byCategory && Object.keys(statistics.abstracts.byCategory).length > 0) && (
                 <div>
                   <h3 className="text-md font-semibold mb-3">Abstracts</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {statistics.abstracts?.byStatus && Object.keys(statistics.abstracts.byStatus).length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-1">By Status</h4>
                          <Chart type="Pie" data={{ labels: Object.keys(statistics.abstracts.byStatus), datasets: [{ data: Object.values(statistics.abstracts.byStatus) }] }} />
                       </div>
                     )}
                     {statistics.abstracts?.byCategory && Object.keys(statistics.abstracts.byCategory).length > 0 && (
                       <div>
                         <h4 className="text-sm font-medium text-gray-700 mb-1">By Category</h4>
                         <Chart type="Bar" data={{ labels: Object.keys(statistics.abstracts.byCategory), datasets: [{ data: Object.values(statistics.abstracts.byCategory) }] }} />
                       </div>
                     )}
                   </div>
                 </div>
              )}
              {/* Fallback message if NO data sections rendered */}
              {(!statistics.registrations?.byCategory || Object.keys(statistics.registrations.byCategory).length === 0) &&
               !statistics.registrations?.byDay?.length &&
               (!statistics.resources?.food?.byType || Object.keys(statistics.resources.food.byType).length === 0) &&
               (!statistics.resources?.kitBags?.byType || Object.keys(statistics.resources.kitBags.byType).length === 0) &&
               (!statistics.resources?.certificates?.byType || Object.keys(statistics.resources.certificates.byType).length === 0) &&
               (!statistics.abstracts?.byStatus || Object.keys(statistics.abstracts.byStatus).length === 0) &&
               (!statistics.abstracts?.byCategory || Object.keys(statistics.abstracts.byCategory).length === 0) && (
                <div className="py-16 text-center">
                  <p className="text-gray-500 mb-2">No statistics data available for this event yet.</p>
                   {!Object.keys(fetchErrors).length && <p className="text-sm text-gray-400">Data fetching completed successfully.</p>}
                   {Object.keys(fetchErrors).length > 0 && <p className="text-sm text-orange-500">Some data sections failed to load.</p>}
                </div>
              )}
            </div>
          )}

          {activeTab === 'registrations' && (
             <div className="space-y-6">
               {statistics.registrations.byDay?.length > 0 ? (
                 <div>
                   <h3 className="text-md font-semibold mb-3">Registration Timeline</h3>
                   <Chart type="Area" data={{ labels: statistics.registrations.byDay.map(d => new Date(d.date).toLocaleDateString()), datasets: [{ data: statistics.registrations.byDay.map(d => d.count) }] }} />
                 </div>
               ) : <p className="text-center text-gray-500 py-4">No timeline data.</p>}
               
                {Object.keys(statistics.registrations.byCategory).length > 0 ? (
                 <div>
                   <h3 className="text-md font-semibold mb-3">Registrations by Category</h3>
                   <div className="overflow-x-auto">
                     <table className="min-w-full divide-y divide-gray-200">
                       <thead className="bg-gray-50">
                         <tr>
                           <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                           <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Count</th>
                           <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">% of Total</th>
                         </tr>
                       </thead>
                       <tbody className="bg-white divide-y divide-gray-200">
                         {Object.entries(statistics.registrations.byCategory).map(([category, count]) => (
                           <tr key={category}>
                             <td className="px-4 py-2 text-sm font-medium text-gray-900">{category}</td>
                             <td className="px-4 py-2 text-sm text-gray-500">{formatNumber(count)}</td>
                             <td className="px-4 py-2 text-sm text-gray-500">
                               {statistics.registrations.total > 0 ? Math.round((count / statistics.registrations.total) * 100) : 0}%
                             </td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                   </div>
                 </div>
               ) : <p className="text-center text-gray-500 py-4">No category data.</p>}
             </div>
           )}
           
           {/* --- Updated Food Tab Content --- */} 
           {activeTab === 'food' && (
             <div className="space-y-8"> { /* Increased spacing */}
                {/* Row 1: Meal Breakdown & Daily Trend */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {statistics.resources?.food?.byType && Object.keys(statistics.resources.food.byType).length > 0 ? (
                     <div>
                        <h3 className="text-md font-semibold mb-3">Meals Scanned (by Type)</h3>
                        <Chart type="Bar" data={{ labels: Object.keys(statistics.resources.food.byType), datasets: [{ label: 'Scans', data: Object.values(statistics.resources.food.byType) }] }} />
                     </div>
                    ) : (
                       !loading && <p className="text-center text-gray-500 py-4">No meal scan data available.</p>
                    )}
                    {/* --- Add Daily Food Scan Trend Chart --- */}
                     {statistics.resources?.food?.byDay?.length > 0 ? (
                       <div>
                         <h3 className="text-md font-semibold mb-3">Daily Food Scan Trend</h3>
                         <Chart type="Line" data={{ labels: statistics.resources.food.byDay.map(d => new Date(d.date).toLocaleDateString()), datasets: [{ label: 'Scans', data: statistics.resources.food.byDay.map(d => d.count), fill: true }] }} />
                       </div>
                     ) : (
                       !loading && <p className="text-center text-gray-500 py-4">No daily trend data available.</p>
                     )}
                </div> { /* End Grid Row 1 */}
                
                {/* --- Add Hourly Scan Distribution Chart --- */} 
                {hourlyFoodScanData.labels.length > 0 ? (
                   <div>
                     <h3 className="text-md font-semibold mb-3">Hourly Scan Distribution (Recent)</h3>
                     <Chart type="Bar" data={hourlyFoodScanData} />
                   </div>
                 ) : (
                    !loading && <p className="text-center text-gray-500 py-4">Not enough scan data for hourly breakdown.</p>
                 )}
                
                {/* Row 3 (was Row 2): Recent Scans Table */}
                <div>
                   <h3 className="text-md font-semibold mb-3">Recent Food Scans</h3>
                   {foodScansLoading ? (
                      <div className="flex justify-center items-center h-32">
                        <Spinner size="md" />
                      </div>
                   ) : recentFoodScans.length > 0 ? (
                     <div className="overflow-x-auto border rounded-md">
                       <table className="min-w-full divide-y divide-gray-200">
                         <thead className="bg-gray-50">
                           <tr>
                             <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                             <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Attendee</th>
                             <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Meal</th>
                             <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Scanned By</th>
                           </tr>
                         </thead>
                         <tbody className="bg-white divide-y divide-gray-200">
                           {recentFoodScans.map((scan) => (
                             <tr key={scan._id}>
                               <td className="px-4 py-2 text-sm text-gray-700 whitespace-nowrap">
                                 {new Date(scan.timestamp).toLocaleString()}
                               </td>
                               <td className="px-4 py-2 text-sm text-gray-700">
                                 {scan.registration?.firstName || ''} {scan.registration?.lastName || ''}
                                 <span className="text-xs text-gray-500 block">({scan.registration?.registrationId || 'N/A'})</span>
                               </td>
                               <td className="px-4 py-2 text-sm text-gray-700">{scan.resourceOption?.name || 'Unknown Meal'}</td>
                               <td className="px-4 py-2 text-sm text-gray-500">{scan.actionBy || 'Unknown'}</td>
                             </tr>
                           ))}
                         </tbody>
                       </table>
                     </div>
                   ) : (
                     <p className="text-center text-gray-500 py-4">No recent food scans found.</p>
                   )}
                </div> { /* End Row 3 */}
             </div>
           )}
           {/* --- End Food Tab Content --- */} 

           {/* --- Updated Kit Tab Content --- */} 
           {activeTab === 'kitbags' && (
             <div className="space-y-8">
                {/* Row 1: Breakdown & Hourly */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {statistics.resources?.kitBags?.byType && Object.keys(statistics.resources.kitBags.byType).length > 0 ? (
                     <div>
                        <h3 className="text-md font-semibold mb-3">Kits Distributed (by Type)</h3>
                        <Chart type="Doughnut" data={{ labels: Object.keys(statistics.resources.kitBags.byType), datasets: [{ data: Object.values(statistics.resources.kitBags.byType) }] }} />
                     </div>
                  ) : (
                    !loading && <p className="text-center text-gray-500 py-4">No kit distribution data available.</p>
                  )}
                  {hourlyKitScanData.labels.length > 0 ? (
                     <div>
                       <h3 className="text-md font-semibold mb-3">Hourly Distribution (Recent)</h3>
                       <Chart type="Bar" data={hourlyKitScanData} />
                     </div>
                   ) : (
                      !loading && <p className="text-center text-gray-500 py-4">Not enough scan data for hourly breakdown.</p>
                   )}
                </div> 

                {/* Row 2: Recent Scans Table */} 
                <div>
                   <h3 className="text-md font-semibold mb-3">Recent Kit Distributions</h3>
                   {kitScansLoading ? (
                      <div className="flex justify-center items-center h-32"><Spinner size="md" /></div>
                   ) : recentKitScans.length > 0 ? (
                     <div className="overflow-x-auto border rounded-md">
                       <table className="min-w-full divide-y divide-gray-200">
                         {/* Table Header */} 
                         <thead className="bg-gray-50"><tr>
                           <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                           <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Attendee</th>
                           <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Kit Item</th>
                           <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Scanned By</th>
                         </tr></thead>
                         {/* Table Body */} 
                         <tbody className="bg-white divide-y divide-gray-200">
                           {recentKitScans.map((scan) => (
                             <tr key={scan._id}>
                               <td className="px-4 py-2 text-sm text-gray-700 whitespace-nowrap">{new Date(scan.timestamp).toLocaleString()}</td>
                               <td className="px-4 py-2 text-sm text-gray-700">
                                 {scan.registration?.firstName || ''} {scan.registration?.lastName || ''}
                                 <span className="text-xs text-gray-500 block">({scan.registration?.registrationId || 'N/A'})</span>
                               </td>
                               <td className="px-4 py-2 text-sm text-gray-700">{scan.resourceOption?.name || 'Unknown Kit'}</td>
                               <td className="px-4 py-2 text-sm text-gray-500">{scan.actionBy || 'Unknown'}</td>
                             </tr>
                           ))}
                         </tbody>
                       </table>
                     </div>
                   ) : (
                     <p className="text-center text-gray-500 py-4">No recent kit distributions found.</p>
                   )}
                </div>
             </div>
           )}
           {/* --- End Kit Tab Content --- */} 

           {/* --- Updated Certificates Tab Content --- */} 
           {activeTab === 'certificates' && (
             <div className="space-y-8">
                 {/* Row 1: Breakdown & Hourly */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {statistics.resources?.certificates?.byType && Object.keys(statistics.resources.certificates.byType).length > 0 ? (
                     <div>
                        <h3 className="text-md font-semibold mb-3">Certificates Issued (by Type)</h3>
                        <Chart type="Pie" data={{ labels: Object.keys(statistics.resources.certificates.byType), datasets: [{ data: Object.values(statistics.resources.certificates.byType) }] }} />
                     </div>
                  ) : (
                     !loading && <p className="text-center text-gray-500 py-4">No certificate issuance data available.</p>
                  )}
                   {hourlyCertScanData.labels.length > 0 ? (
                     <div>
                       <h3 className="text-md font-semibold mb-3">Hourly Distribution (Recent)</h3>
                       <Chart type="Bar" data={hourlyCertScanData} />
                     </div>
                   ) : (
                      !loading && <p className="text-center text-gray-500 py-4">Not enough scan data for hourly breakdown.</p>
                   )}
                </div>
                
                 {/* Row 2: Recent Scans Table */} 
                <div>
                   <h3 className="text-md font-semibold mb-3">Recent Certificate Issuances</h3>
                   {certScansLoading ? (
                      <div className="flex justify-center items-center h-32"><Spinner size="md" /></div>
                   ) : recentCertScans.length > 0 ? (
                     <div className="overflow-x-auto border rounded-md">
                       <table className="min-w-full divide-y divide-gray-200">
                          {/* Table Header */} 
                         <thead className="bg-gray-50"><tr>
                           <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                           <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Attendee</th>
                           <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Certificate Type</th>
                           <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Issued By</th>
                         </tr></thead>
                         {/* Table Body */} 
                         <tbody className="bg-white divide-y divide-gray-200">
                           {recentCertScans.map((scan) => (
                             <tr key={scan._id}>
                               <td className="px-4 py-2 text-sm text-gray-700 whitespace-nowrap">{new Date(scan.timestamp).toLocaleString()}</td>
                               <td className="px-4 py-2 text-sm text-gray-700">
                                 {scan.registration?.firstName || ''} {scan.registration?.lastName || ''}
                                 <span className="text-xs text-gray-500 block">({scan.registration?.registrationId || 'N/A'})</span>
                               </td>
                               <td className="px-4 py-2 text-sm text-gray-700">{scan.resourceOption?.name || 'Unknown Type'}</td>
                               <td className="px-4 py-2 text-sm text-gray-500">{scan.actionBy || 'Unknown'}</td>
                             </tr>
                           ))}
                         </tbody>
                       </table>
                     </div>
                   ) : (
                     <p className="text-center text-gray-500 py-4">No recent certificate issuances found.</p>
                   )}
                 </div>
             </div>
           )}
           {/* --- End Certificates Tab Content --- */} 

           {/* --- Updated Abstracts Tab Content --- */} 
           {activeTab === 'abstracts' && (
              <div className="space-y-8">
                 {/* Row 1: Status & Category Breakdowns */} 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     {(statistics.abstracts?.byStatus && Object.keys(statistics.abstracts.byStatus).length > 0) ? (
                        <div>
                          <h3 className="text-md font-semibold mb-3">Abstracts by Status</h3>
                          <Chart type="Pie" data={{ labels: Object.keys(statistics.abstracts.byStatus), datasets: [{ data: Object.values(statistics.abstracts.byStatus) }] }} />
                       </div>
                     ) : (
                       !loading && <p className="text-center text-gray-500 py-4">No abstract status data available.</p>
                     )}
                     {(statistics.abstracts?.byCategory && Object.keys(statistics.abstracts.byCategory).length > 0) ? (
                       <div>
                         <h3 className="text-md font-semibold mb-3">Abstracts by Category</h3>
                         <Chart type="Bar" data={{ labels: Object.keys(statistics.abstracts.byCategory), datasets: [{ label: 'Count', data: Object.values(statistics.abstracts.byCategory) }] }} />
                       </div>
                     ) : (
                        !loading && <p className="text-center text-gray-500 py-4">No abstract category data available.</p>
                     )}
                   </div>
                 {/* Add more abstract-specific info here later if needed */} 
             </div>
           )}
           {/* --- End Abstracts Tab Content --- */} 
           
        </div>
      </Card>
    </div>
  );
};

export default ReportsTab; // Export the new component name 