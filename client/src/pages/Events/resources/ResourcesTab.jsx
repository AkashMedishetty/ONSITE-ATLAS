import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Card, Button, Spinner, Alert, Badge, Tabs } from '../../../components/common';
import { QrCodeIcon, Cog6ToothIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { resourceService, eventService } from '../../../services';

const ResourcesTab = ({ eventId }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [resources, setResources] = useState({
    food: [],
    kits: [],
    certificates: [],
    certificatePrinting: []
  });
  const [stats, setStats] = useState({
    food: 0,
    kits: 0,
    certificates: 0,
    certificatePrinting: 0
  });
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchData = async () => {
      if (!eventId) {
        setLoading(false);
        return;
      }
      setLoading(true); // Set loading true at the start of fetching
      setError(null);
      try {
        // Run both loaders concurrently and wait for them
        await Promise.all([loadResources(), loadStatistics()]);
      } catch (err) {
        // Catch potential errors from either function (though they have internal catches)
        console.error("Error during initial data fetch:", err);
        setError("Failed to load initial resource data.");
      } finally {
        setLoading(false); // Set loading false only after both are done
      }
    };

    fetchData();
  }, [eventId]); // Keep eventId dependency
  
  // Parse the resource type from URL if present
  useEffect(() => {
    const pathParts = location.pathname.split('/');
    if (pathParts.length >= 5) {
      const subPath = pathParts[4]; // After /events/{id}/resources/{subPath}
      
      if (subPath === 'food') {
        setActiveTab(0);
      } else if (subPath === 'kits') {
        setActiveTab(1);  
      } else if (subPath === 'certificates') {
        setActiveTab(2);
      } else if (subPath === 'certificatePrinting') {
        setActiveTab(3);
      }
    }
  }, [location.pathname]);
  
  const loadResources = async () => {
    if (!eventId) {
      setLoading(false);
      return;
    }
    
    try {
      // Fetch real data from the API
      const foodData = await resourceService.getRecentScans(eventId, 'food', 20);
      const kitsData = await resourceService.getRecentScans(eventId, 'kits', 20);
      const certificatesData = await resourceService.getRecentScans(eventId, 'certificate', 20);
      const certificatePrintingData = await resourceService.getRecentScans(eventId, 'certificatePrinting', 20);
      
      console.log('Food data loaded:', foodData);
      console.log('Kits data loaded:', kitsData);
      console.log('Certificates data loaded:', certificatesData);
      console.log('Certificate Printing data loaded:', certificatePrintingData);
      
      // Check if the data is in the expected format
      // The API returns {success: true, data: Array(n)} or {success: true, count: n, data: Array(n)}
      setResources({
        food: Array.isArray(foodData?.data) ? foodData.data : 
              (foodData?.success && Array.isArray(foodData?.data) ? foodData.data : []),
        kits: Array.isArray(kitsData?.data) ? kitsData.data : 
              (kitsData?.success && Array.isArray(kitsData?.data) ? kitsData.data : []),
        certificates: Array.isArray(certificatesData?.data) ? certificatesData.data : 
                    (certificatesData?.success && Array.isArray(certificatesData?.data) ? certificatesData.data : []),
        certificatePrinting: Array.isArray(certificatePrintingData?.data) ? certificatePrintingData.data : 
                    (certificatePrintingData?.success && Array.isArray(certificatePrintingData?.data) ? certificatePrintingData.data : [])
      });
    } catch (error) {
      console.error('Error loading resources:', error);
      setError('Failed to load resources data. Please try again.');
    }
  };
  
  const loadStatistics = async () => {
    if (!eventId) {
      return;
    }
    
    try {
      // Use our new type-specific endpoint for each resource type
      console.log('Loading resource statistics for event:', eventId);
      
      // Fetch stats for each resource type separately
      const [foodStats, kitStats, certificateStats, certificatePrintingStats] = await Promise.all([
        eventService.getResourceTypeStatistics(eventId, 'food'),
        eventService.getResourceTypeStatistics(eventId, 'kitBag'),
        eventService.getResourceTypeStatistics(eventId, 'certificate'),
        eventService.getResourceTypeStatistics(eventId, 'certificatePrinting')
      ]);
      
      // Log the raw responses from the API
      console.log('Raw Food Stats Response:', foodStats);
      console.log('Raw Kit Stats Response:', kitStats);
      console.log('Raw Certificate Stats Response:', certificateStats);
      console.log('Raw Certificate Printing Stats Response:', certificatePrintingStats);
      
      // Extract counts directly from the response object
      const foodCount = foodStats?.totalIssued || 0;
      const kitsCount = kitStats?.totalIssued || 0;
      const certificatesCount = certificateStats?.totalIssued || 0;
      const certificatePrintingCount = certificatePrintingStats?.totalIssued || 0;
      
      // Log the calculated counts before setting state
      console.log('Calculated Counts:', {
        food: foodCount,
        kits: kitsCount,
        certificates: certificatesCount,
        certificatePrinting: certificatePrintingCount
      });

      setStats({
        food: foodCount,
        kits: kitsCount,
        certificates: certificatesCount,
        certificatePrinting: certificatePrintingCount
      });
    } catch (error) {
      console.error('Error loading resource statistics:', error);
      // Provide default values in case of error
      setStats({
        food: 0,
        kits: 0,
        certificates: 0,
        certificatePrinting: 0
      });
    }
  };
  
  const handleOpenScanner = () => {
    // Make sure there's a valid event ID before navigating
    if (!eventId) {
      setError("Cannot open scanner: Event ID is missing");
      return;
    }
    // Navigate within the same tab
    navigate(`/events/${eventId}/resources/scanner`);
  };
  
  const handleConfigureResources = () => {
    // Make sure there's a valid event ID before navigating
    if (!eventId) {
      setError("Cannot configure resources: Event ID is missing");
      return;
    }
    // Navigate to the settings tab with state indicating that we want to show the resources tab
    navigate(`/events/${eventId}/settings`, { 
      state: { 
        activeTab: 'settings',
        settingsTab: 'resources'  // This will tell the SettingsTab which subtab to show
      } 
    });
  };
  
  const handleTabChange = (index) => {
    setActiveTab(index);
    const tabKey = ['food', 'kits', 'certificates', 'certificatePrinting'][index];
    // Update URL to reflect the selected tab
    navigate(`/events/${eventId}/resources/${tabKey}`, { replace: true });
  };
  
  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }
  
  if (error) {
    return (
      <Alert 
        type="error" 
        message="Error loading resources" 
        details={error}
        onClose={() => setError(null)}
      />
    );
  }
  
  // Show a message if no event is available
  if (!eventId) {
    return (
      <Alert 
        type="warning" 
        message="No event data available" 
        details="Please make sure you have selected a valid event."
      />
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Resources</h2>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            leftIcon={<Cog6ToothIcon className="h-5 w-5" />}
            onClick={handleConfigureResources}
          >
            Configure
          </Button>
          <Button 
            variant="outline" 
            leftIcon={<ArrowDownTrayIcon className="h-5 w-5" />}
          >
            Export
          </Button>
          <Button 
            variant="primary" 
            leftIcon={<QrCodeIcon className="h-5 w-5" />}
            onClick={handleOpenScanner}
          >
            Open Scanner
          </Button>
        </div>
      </div>

      {/* Resource statistics summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 border-l-4 border-blue-500">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-medium text-gray-900">Food</h3>
            <div className="p-2 bg-blue-100 text-blue-700 rounded-full">
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Total Meals Served</p>
              <p className="text-2xl font-bold">{stats.food}</p>
            </div>
            <div className="flex justify-between items-center text-sm">
              <p className="text-gray-500">Items distributed</p>
              <Badge color="primary">{stats.food}</Badge>
            </div>
          </div>
        </Card>
        
        <Card className="p-6 border-l-4 border-green-500">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-medium text-gray-900">Kit Bags</h3>
            <div className="p-2 bg-green-100 text-green-700 rounded-full">
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Total Kits Distributed</p>
              <p className="text-2xl font-bold">{stats.kits}</p>
            </div>
            <div className="flex justify-between items-center text-sm">
              <p className="text-gray-500">Items distributed</p>
              <Badge color="success">{stats.kits}</Badge>
            </div>
          </div>
        </Card>
        
        <Card className="p-6 border-l-4 border-amber-500">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-medium text-gray-900">Certificate Issuance</h3>
            <div className="p-2 bg-amber-100 text-amber-700 rounded-full">
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Total Certificates Issued</p>
              <p className="text-2xl font-bold">{stats.certificates}</p>
            </div>
            <div className="flex justify-between items-center text-sm">
              <p className="text-gray-500">Items distributed</p>
              <Badge color="warning">{stats.certificates}</Badge>
            </div>
          </div>
        </Card>
        
        <Card className="p-6 border-l-4 border-purple-500">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-medium text-gray-900">Certificate Printing</h3>
            <div className="p-2 bg-purple-100 text-purple-700 rounded-full">
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Total Certificates Printed</p>
              <p className="text-2xl font-bold">{stats.certificatePrinting}</p>
            </div>
            <div className="flex justify-between items-center text-sm">
              <p className="text-gray-500">Items distributed</p>
              <Badge color="purple">{stats.certificatePrinting}</Badge>
            </div>
          </div>
        </Card>
      </div>
      
      <Card>
        <Tabs
          tabs={[
            { id: "food", label: "Food" },
            { id: "kits", label: "Kit Bags" },
            { id: "certificates", label: "Certificate Issuance" },
            { id: "certificatePrinting", label: "Certificate Printing" }
          ]}
          activeTab={activeTab}
          onChange={handleTabChange}
        />
        
        <div className="mt-6">
          {activeTab === 0 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Food Distribution</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">Recent Items: {resources.food.length}</span>
                </div>
              </div>
              
              {resources.food.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No food resources found.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Registration ID
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Attendee
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Category
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Meal
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Issued At
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {resources.food.map((item) => (
                        <tr key={item._id || `food-${Math.random()}`} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.registration?.registrationId || item.registrationId || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {(item.registration?.firstName || item.firstName || '') + ' ' + 
                             (item.registration?.lastName || item.lastName || '')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.registration?.category?.name || item.category?.name || item.category || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.resourceOption?.name || item.resourceName || item.details?.option || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDateTime(item.timestamp || item.actionDate || item.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 1 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Kit Bag Distribution</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">Recent Items: {resources.kits.length}</span>
                </div>
              </div>
              
              {resources.kits.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No kit bag resources found.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Registration ID
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Attendee
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Category
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Kit Type
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Issued At
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {resources.kits.map((item) => (
                        <tr key={item._id || `kit-${Math.random()}`} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.registration?.registrationId || item.registrationId || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {(item.registration?.firstName || item.firstName || '') + ' ' + 
                             (item.registration?.lastName || item.lastName || '')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.registration?.category?.name || item.category?.name || item.category || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.resourceOption?.name || item.resourceName || item.details?.option || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDateTime(item.timestamp || item.actionDate || item.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 2 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Certificate Issuance</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">Recent Items: {resources.certificates.length}</span>
                </div>
              </div>
              
              {resources.certificates.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No certificate resources found.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Registration ID
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Attendee
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Category
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Certificate Type
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Issued At
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {resources.certificates.map((item) => (
                        <tr key={item._id || `cert-${Math.random()}`} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.registration?.registrationId || item.registrationId || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {(item.registration?.firstName || item.firstName || '') + ' ' + 
                             (item.registration?.lastName || item.lastName || '')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.registration?.category?.name || item.category?.name || item.category || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.resourceOption?.name || item.resourceName || item.details?.option || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDateTime(item.timestamp || item.actionDate || item.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 3 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Certificate Printing</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">Recent Items: {resources.certificatePrinting.length}</span>
                </div>
              </div>
              
              {resources.certificatePrinting.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No certificate printing resources found.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Registration ID
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Attendee
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Category
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Certificate Type
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Issued At
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {resources.certificatePrinting.map((item) => (
                        <tr key={item._id || `cert-print-${Math.random()}`} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.registration?.registrationId || item.registrationId || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {(item.registration?.firstName || item.firstName || '') + ' ' + 
                             (item.registration?.lastName || item.lastName || '')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.registration?.category?.name || item.category?.name || item.category || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.resourceOption?.name || item.resourceName || item.details?.option || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDateTime(item.timestamp || item.actionDate || item.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ResourcesTab; 