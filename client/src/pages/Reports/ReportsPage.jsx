import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Card,
  Button,
  Select,
  Alert,
  Spinner,
  Tabs
} from '../../components/common';
import { ArrowLeftIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import eventService from '../../services/eventService';
import registrationService from '../../services/registrationService';
import resourceService from '../../services/resourceService';
import abstractService from '../../services/abstractService';

// Chart component (placeholder for a real charting library like recharts)
const Chart = ({ type, data, options }) => {
  return (
    <div className="bg-gray-100 border rounded-md p-4 h-64 flex items-center justify-center">
      <p className="text-gray-500 text-center">
        {type} Chart Placeholder<br />
        <span className="text-sm">{data?.labels?.join(', ') || 'No data available'}</span>
      </p>
    </div>
  );
};

const ReportsPage = () => {
  const { eventId } = useParams();
  
  // State
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('all');
  const [exportFormat, setExportFormat] = useState('pdf');
  const [exportLoading, setExportLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [fetchErrors, setFetchErrors] = useState({});
  
  // Data state with default empty values
  const [statistics, setStatistics] = useState({
    registrations: {
      total: 0,
      checkedIn: 0,
      byCategory: {},
      byDay: []
    },
    resources: {
      food: {
        total: 0,
        byType: {},
        byDay: []
      },
      kitBag: {
        total: 0,
        byType: {},
      },
      certificates: {
        total: 0,
        byType: {},
      }
    },
    abstracts: {
      total: 0,
      byStatus: {},
      byCategory: {}
    }
  });
  
  // New state for resource usage
  const [resourceStats, setResourceStats] = useState({
    food: 0,
    kits: 0,
    certificates: 0,
    total: 0
  });
  
  useEffect(() => {
    const fetchReportData = async () => {
      if (!eventId) return;
      
      setLoading(true);
      setStatus(null); // Clear previous status
      setFetchErrors({}); // Clear previous errors
      
      try {
        // Use Promise.allSettled to fetch concurrently and handle individual errors
        const results = await Promise.allSettled([
          eventService.getEventById(eventId),
          registrationService.getRegistrationStatistics(eventId),
          resourceService.getResourceStatistics(eventId), // Fetch resource stats ONCE
          abstractService.getAbstractStatistics(eventId)
        ]);
        
        const [eventResult, regStatsResult, resourceStatsResult, abstractStatsResult] = results;
        const errors = {};

        // Process Event Details
        if (eventResult.status === 'fulfilled' && eventResult.value?._id) {
          setEvent(eventResult.value);
        } else {
          // Critical error if event details fail
          console.error("Failed to fetch event details:", eventResult.reason || 'No event data');
          setStatus({
            type: 'error',
            message: 'Failed to load essential event data. Cannot display reports.',
            details: eventResult.reason?.message || eventResult.value?.message || 'Could not fetch event'
          });
          setLoading(false);
          return; // Stop processing if event fails
        }
        
        // Initialize statistics object (moved inside try block)
        const statsData = {
          registrations: { total: 0, checkedIn: 0, byCategory: {}, byDay: [] },
          resources: { food: { total: 0, byType: {}, byDay: [] }, kitBag: { total: 0, byType: {} }, certificates: { total: 0, byType: {} } },
          abstracts: { total: 0, byStatus: {}, byCategory: {} }
        };

        // Process Registration Statistics
        if (regStatsResult.status === 'fulfilled' && regStatsResult.value?.success) {
          statsData.registrations = regStatsResult.value.data || statsData.registrations;
        } else {
          errors.registrations = regStatsResult.reason?.message || regStatsResult.value?.message || 'Failed to fetch registration statistics';
          console.warn('Registration Stats Error:', errors.registrations);
        }
        
        // Process Resource Statistics (Single call)
        let fetchedResourceData = null;
        if (resourceStatsResult.status === 'fulfilled' && resourceStatsResult.value?.success) {
          fetchedResourceData = resourceStatsResult.value.data;
          // --- Populate overall resource stats --- 
          statsData.resources = fetchedResourceData || statsData.resources;
          // --- Populate specific resource usage state --- 
          setResourceStats({
            food: fetchedResourceData?.byType?.food || 0,
            kits: fetchedResourceData?.byType?.kits || fetchedResourceData?.byType?.kitBag || 0, // Check for kitBag too
            certificates: fetchedResourceData?.byType?.certificates || 0,
            total: fetchedResourceData?.totalResources || 0
          });
          // --- Populate food-specific part if needed (might be redundant if structure is good)
          // statsData.resources.food = fetchedResourceData.byType?.food ? { total: fetchedResourceData.byType.food, /* other fields */ } : statsData.resources.food; 
        } else {
          errors.resources = resourceStatsResult.reason?.message || resourceStatsResult.value?.message || 'Failed to fetch resource statistics';
          console.warn('Resource Stats Error:', errors.resources);
          // Reset resource usage state on error
          setResourceStats({ food: 0, kits: 0, certificates: 0, total: 0 }); 
        }
        
        // Process Abstract Statistics
        if (abstractStatsResult.status === 'fulfilled' && abstractStatsResult.value?.success) {
          statsData.abstracts = abstractStatsResult.value.data || statsData.abstracts;
        } else {
          errors.abstracts = abstractStatsResult.reason?.message || abstractStatsResult.value?.message || 'Failed to fetch abstract statistics';
          console.warn('Abstract Stats Error:', errors.abstracts);
        }
        
        // Update the main statistics state
        setStatistics(statsData);
        
        // Update error state if any errors occurred
        if (Object.keys(errors).length > 0) {
          setFetchErrors(errors);
           setStatus({ // Optionally set a general warning status
             type: 'warning',
             message: 'Some report data could not be loaded.',
           });
        }
        
      } catch (err) {
        // Catch unexpected errors during the setup/processing phase
        console.error('Unexpected error fetching report data:', err);
        setStatus({
          type: 'error',
          message: 'An unexpected error occurred while loading report data.',
          details: err.message
        });
      } finally {
        // Ensure loading is set to false regardless of success or failure
        setLoading(false);
      }
    };
    
    fetchReportData();

  // }, [eventId, dateRange]); // Keep dateRange if reports need to refetch based on it
  }, [eventId]); // Temporarily remove dateRange dependency to simplify testing loading state

  const handleExport = async () => {
    setExportLoading(true);
    try {
      // Prepare export parameters based on active tab
      const params = {
        format: exportFormat,
        dateRange,
        reportType: activeTab === 'overview' ? 'all' : activeTab
      };
      
      // Call export API
      let response;
      switch (activeTab) {
        case 'registrations':
          response = await registrationService.exportRegistrations(eventId, params);
          break;
        case 'food':
        case 'kitBag':
        case 'certificates':
          response = await resourceService.exportResourceReport(eventId, activeTab, params);
          break;
        case 'abstracts':
          response = await abstractService.exportAbstracts(eventId, params.format);
          break;
        default:
          // Overview - export all reports
          response = await eventService.exportReport(eventId, params);
          break;
      }
      
      if (response && response.success) {
        // Create a download link for the exported file
        const downloadUrl = response.data.fileUrl;
        if (downloadUrl) {
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.setAttribute('download', `${event?.name || 'Event'}_Report.${exportFormat}`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
        
        setStatus({
          type: 'success',
          message: `Report exported successfully as ${exportFormat.toUpperCase()}`
        });
      } else {
        throw new Error(response?.message || 'Export failed');
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      setStatus({
        type: 'error',
        message: 'Failed to export report. Please try again.',
        details: error.message
      });
    } finally {
      setExportLoading(false);
    }
  };
  
  const formatNumber = (num) => {
    if (num === undefined || num === null) return '0';
    return new Intl.NumberFormat().format(num);
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
        <span className="ml-2 text-gray-500">Loading report data...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <Link to={`/events/${eventId}`} className="inline-flex items-center text-gray-600 hover:text-gray-900">
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Event
        </Link>
      </div>
      
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Reports & Analytics</h2>
        <div className="flex items-center space-x-2">
          <Select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            options={[
              { value: 'all', label: 'All Time' },
              { value: 'week', label: 'Past Week' },
              { value: 'month', label: 'Past Month' },
              { value: 'custom', label: 'Custom Range' }
            ]}
            className="w-40"
          />
          <Select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value)}
            options={[
              { value: 'pdf', label: 'PDF' },
              { value: 'excel', label: 'Excel' },
              { value: 'csv', label: 'CSV' }
            ]}
            className="w-32"
          />
          <Button 
            variant="primary"
            onClick={handleExport}
            disabled={exportLoading}
            leftIcon={<ArrowDownTrayIcon className="h-5 w-5" />}
          >
            {exportLoading ? <Spinner size="sm" className="mr-2" /> : null}
            Export
          </Button>
        </div>
      </div>

      {status && (
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
          message="Some data could not be loaded"
          details={`There were issues loading: ${Object.keys(fetchErrors).join(', ')}`}
          className="mb-6"
        />
      )}

      <Card className="mb-6">
        <div className="p-4 border-b">
          <h3 className="text-lg font-medium">Event Information</h3>
          <p className="text-gray-600">{event?.name} - {new Date(event?.startDate).toLocaleDateString()} to {new Date(event?.endDate).toLocaleDateString()}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-700 mb-1">Registrations</h4>
            <div className="flex items-baseline">
              <span className="text-2xl font-bold mr-2">{formatNumber(statistics.registrations.total)}</span>
              <span className="text-sm text-gray-500">({formatNumber(statistics.registrations.checkedIn)} checked in)</span>
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-green-700 mb-1">Food Served</h4>
            <div className="flex items-baseline">
              <span className="text-2xl font-bold mr-2">{formatNumber(resourceStats.food)}</span>
              <span className="text-sm text-gray-500">meals</span>
            </div>
          </div>
          
          <div className="bg-amber-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-amber-700 mb-1">Kit Bags</h4>
            <div className="flex items-baseline">
              <span className="text-2xl font-bold mr-2">{formatNumber(resourceStats.kits)}</span>
              <span className="text-sm text-gray-500">distributed</span>
            </div>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-purple-700 mb-1">Certificates</h4>
            <div className="flex items-baseline">
              <span className="text-2xl font-bold mr-2">{formatNumber(resourceStats.certificates)}</span>
              <span className="text-sm text-gray-500">issued</span>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <Tabs
          tabs={[
            { id: 'overview', label: 'Overview' },
            { id: 'registrations', label: 'Registrations' },
            { id: 'food', label: 'Food Tracking' },
            { id: 'kitBag', label: 'Kit Bags' },
            { id: 'certificates', label: 'Certificates' },
            { id: 'abstracts', label: 'Abstracts' }
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
        
        <div className="mt-6 p-4">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Only render if we have registration data */}
              {Object.keys(statistics.registrations.byCategory).length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-4">Registration Overview</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Registrations by Category</h4>
                      <Chart 
                        type="Pie"
                        data={{
                          labels: Object.keys(statistics.registrations.byCategory),
                          datasets: [{
                            data: Object.values(statistics.registrations.byCategory)
                          }]
                        }}
                      />
                    </div>
                    {statistics.registrations.byDay?.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Registration Trend</h4>
                        <Chart 
                          type="Line"
                          data={{
                            labels: statistics.registrations.byDay.map(d => d.date),
                            datasets: [{
                              data: statistics.registrations.byDay.map(d => d.count)
                            }]
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Show resource distributions if available */}
              {(Object.keys(statistics.resources.food.byType).length > 0 ||
                Object.keys(statistics.resources.kitBag.byType).length > 0 ||
                Object.keys(statistics.resources.certificates.byType).length > 0) && (
                <div>
                  <h3 className="text-lg font-medium mb-4">Resource Distribution</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {Object.keys(statistics.resources.food.byType).length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Food by Type</h4>
                        <Chart 
                          type="Bar"
                          data={{
                            labels: Object.keys(statistics.resources.food.byType),
                            datasets: [{
                              data: Object.values(statistics.resources.food.byType)
                            }]
                          }}
                        />
                      </div>
                    )}
                    
                    {Object.keys(statistics.resources.kitBag.byType).length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Kit Bags by Type</h4>
                        <Chart 
                          type="Doughnut"
                          data={{
                            labels: Object.keys(statistics.resources.kitBag.byType),
                            datasets: [{
                              data: Object.values(statistics.resources.kitBag.byType)
                            }]
                          }}
                        />
                      </div>
                    )}
                    
                    {Object.keys(statistics.resources.certificates.byType).length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Certificates by Type</h4>
                        <Chart 
                          type="Doughnut"
                          data={{
                            labels: Object.keys(statistics.resources.certificates.byType),
                            datasets: [{
                              data: Object.values(statistics.resources.certificates.byType)
                            }]
                          }}
                        />
                      </div>
                    )}
                    
                    {/* Fallback if no resource types data available */}
                    {Object.keys(statistics.resources.food.byType).length === 0 &&
                     Object.keys(statistics.resources.kitBag.byType).length === 0 &&
                     Object.keys(statistics.resources.certificates.byType).length === 0 && (
                      <div className="col-span-3 py-8 text-center text-gray-500">
                        No resource distribution data available
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Show abstract data if available */}
              {(Object.keys(statistics.abstracts.byStatus).length > 0 ||
                Object.keys(statistics.abstracts.byCategory).length > 0) && (
                <div>
                  <h3 className="text-lg font-medium mb-4">Abstract Overview</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.keys(statistics.abstracts.byStatus).length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Abstracts by Status</h4>
                        <Chart 
                          type="Pie"
                          data={{
                            labels: Object.keys(statistics.abstracts.byStatus),
                            datasets: [{
                              data: Object.values(statistics.abstracts.byStatus)
                            }]
                          }}
                        />
                      </div>
                    )}
                    
                    {Object.keys(statistics.abstracts.byCategory).length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Abstracts by Category</h4>
                        <Chart 
                          type="Bar"
                          data={{
                            labels: Object.keys(statistics.abstracts.byCategory),
                            datasets: [{
                              data: Object.values(statistics.abstracts.byCategory)
                            }]
                          }}
                        />
                      </div>
                    )}
                    
                    {/* Fallback if no abstract data available */}
                    {Object.keys(statistics.abstracts.byStatus).length === 0 &&
                     Object.keys(statistics.abstracts.byCategory).length === 0 && (
                      <div className="col-span-2 py-8 text-center text-gray-500">
                        No abstract data available
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Fallback if no data at all */}
              {Object.keys(statistics.registrations.byCategory).length === 0 &&
               Object.keys(statistics.resources.food.byType).length === 0 &&
               Object.keys(statistics.resources.kitBag.byType).length === 0 &&
               Object.keys(statistics.resources.certificates.byType).length === 0 &&
               Object.keys(statistics.abstracts.byStatus).length === 0 &&
               Object.keys(statistics.abstracts.byCategory).length === 0 && (
                <div className="py-16 text-center">
                  <p className="text-gray-500 mb-4">No statistics data available for this event</p>
                  <p className="text-sm text-gray-400">This could be due to API issues or because the event has no data yet</p>
                </div>
              )}
            </div>
          )}
          
          {/* Similar conditional rendering for other tabs */}
          {activeTab === 'registrations' && (
            <div className="space-y-6">
              {/* Registration contents with conditional rendering */}
              <div>
                <h3 className="text-lg font-medium mb-4">Registration Statistics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Total Registrations</h4>
                    <div className="text-2xl font-bold">{formatNumber(statistics.registrations.total)}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Checked In</h4>
                    <div className="text-2xl font-bold">{formatNumber(statistics.registrations.checkedIn)}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Check-in Rate</h4>
                    <div className="text-2xl font-bold">
                      {statistics.registrations.total > 0 
                        ? Math.round((statistics.registrations.checkedIn / statistics.registrations.total) * 100)
                        : 0}%
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Most Recent</h4>
                    <div className="text-2xl font-bold">
                      {statistics.registrations.mostRecent || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
              
              {statistics.registrations.byDay?.length > 0 ? (
                <div>
                  <h3 className="text-lg font-medium mb-4">Registration Timeline</h3>
                  <Chart 
                    type="Area"
                    data={{
                      labels: statistics.registrations.byDay.map(d => d.date),
                      datasets: [{
                        data: statistics.registrations.byDay.map(d => d.count)
                      }]
                    }}
                  />
                </div>
              ) : (
                <div className="py-8 text-center text-gray-500">
                  No registration timeline data available
                </div>
              )}
              
              {Object.keys(statistics.registrations.byCategory).length > 0 ? (
                <div>
                  <h3 className="text-lg font-medium mb-4">Registration by Category</h3>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Category
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Count
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Percentage
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {Object.entries(statistics.registrations.byCategory).map(([category, count]) => (
                          <tr key={category}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {category}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatNumber(count)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {statistics.registrations.total > 0 
                                ? Math.round((count / statistics.registrations.total) * 100)
                                : 0}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-gray-500">
                  No registration category data available
                </div>
              )}
            </div>
          )}
          
          {/* Remaining tabs would be implemented similarly with conditional rendering */}
          {activeTab === 'food' && (
            <div className="py-8 text-center text-gray-500">
              {Object.keys(statistics.resources.food.byType).length > 0 ? (
                <div className="space-y-6">
                  {/* Food tracking contents */}
                </div>
              ) : (
                <div>
                  <p className="mb-2">Food tracking data not available</p>
                  <p className="text-sm">This may be due to API issues or because no food has been tracked yet</p>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'kitBag' && (
            <div className="py-8 text-center text-gray-500">
              {Object.keys(statistics.resources.kitBag.byType).length > 0 ? (
                <div className="space-y-6">
                  {/* Kit bag contents */}
                </div>
              ) : (
                <div>
                  <p className="mb-2">Kit bag distribution data not available</p>
                  <p className="text-sm">This may be due to API issues or because no kit bags have been distributed yet</p>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'certificates' && (
            <div className="py-8 text-center text-gray-500">
              {Object.keys(statistics.resources.certificates.byType).length > 0 ? (
                <div className="space-y-6">
                  {/* Certificate contents */}
                </div>
              ) : (
                <div>
                  <p className="mb-2">Certificate data not available</p>
                  <p className="text-sm">This may be due to API issues or because no certificates have been issued yet</p>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'abstracts' && (
            <div className="py-8 text-center text-gray-500">
              {Object.keys(statistics.abstracts.byStatus).length > 0 || Object.keys(statistics.abstracts.byCategory).length > 0 ? (
                <div className="space-y-6">
                  {/* Abstract contents */}
                </div>
              ) : (
                <div>
                  <p className="mb-2">Abstract submission data not available</p>
                  <p className="text-sm">This may be due to API issues or because no abstracts have been submitted yet</p>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ReportsPage; 