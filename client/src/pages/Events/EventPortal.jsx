import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { format, formatDistance } from 'date-fns';
import {
  ChartBarIcon,
  UserPlusIcon,
  TagIcon,
  CubeIcon,
  DocumentTextIcon,
  BookmarkIcon,
  ChartPieIcon,
  Cog6ToothIcon,
  ArrowPathIcon,
  CalendarIcon,
  MapPinIcon,
  LinkIcon,
  ClipboardIcon,
  UserGroupIcon,
  
  DocumentDuplicateIcon,
  CheckBadgeIcon,
  ShieldCheckIcon,
  EnvelopeIcon,
  QrCodeIcon
} from '@heroicons/react/24/outline';
import { Card, Tabs, Badge, Button, Spinner, Alert, SafeCard } from '../../components/common';
import eventService from '../../services/eventService';
import { FiUsers, FiTag, FiPackage, FiFileText, FiPrinter, FiBarChart2, FiSettings, FiMail } from 'react-icons/fi';
import { formatDate, formatDateTimeRelative } from '../../utils/dateUtils';
import RegistrationsTab from './registrations/RegistrationsTab';
import CategoriesTab from './categories/CategoriesTab';
import EmailsTab from './tabs/EmailsTab';
import { useAuth } from '../../contexts/AuthContext';
import AbstractsPage from '../Abstracts/AbstractsPage'; // Ensure this import exists or add it
import BadgePrintingPage from '../BadgePrinting/BadgePrintingPage'; // Import the correct page
import BadgeDesigner from '../BadgePrinting/BadgeDesigner'; // Add this import
import BadgesPage from '../Badges/BadgesPage'; // Add this import for the main /badges landing
import { ResourceList, ScannerStation, FoodTracking, KitBagDistribution, CertificateIssuance, CertificatePrinting, CertificatePrintingScanner } from '../Resources'; // Ensure ScannerStation is imported here

// Import the new ReportsTab component
import ReportsTab from './reports/ReportsTab';
import LandingPagesManager from '../LandingPages/LandingPagesManager'; // Import the component
import AbstractDetail from '../Abstracts/AbstractDetail'; // Added import

// Import tab components from settings folder - RESTORING THESE
import { 
  GeneralTab, 
  RegistrationTab, 
  BadgesTab, 
  EmailTab, 
  PaymentTab,
  SettingsTab, // This is the main wrapper for settings sub-tabs
  ResourcesTab as ResourcesSettingsTab, // Alias to avoid conflict
  AbstractsTab as AbstractsSettingsTab,  // Alias to avoid conflict
  ScheduleTab  // Add the new ScheduleTab import
} from './settings';

// Import dedicated tab components
import ResourcesTab from './resources/ResourcesTab';
import AbstractsTab from './abstracts/AbstractsTab';
import EventUserManagementTab from './settings/EventUserManagementTab'; // Import the component

// Simple error boundary component for tabs - RESTORING THIS
const TabErrorBoundary = ({ children, tabName }) => {
  try {
    // Attempt to render children, a common source of errors if props are missing
    // or if a child component throws an error during its render.
    return children;
  } catch (error) {
    console.error(`Error rendering ${tabName} tab:`, error);
    // Basic fallback UI, consider a more styled component
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-lg font-semibold text-red-700">Tab Error</h3>
        <p className="text-red-600 mb-2">There was an error rendering the {tabName} tab.</p>
        <p className="text-sm text-red-500">Details: {error.message}</p>
        {/* Optionally, log stack in dev mode or provide a refresh button */}
        {import.meta.env.MODE === 'development' && (
          <pre className="text-xs text-red-500 bg-red-50 p-2 rounded overflow-auto mt-2">
            {error.stack}
          </pre>
        )}
      </div>
    );
  }
};

// Check if we're in development mode
const isDevelopment = import.meta.env.MODE === 'development';

/**
 * EventPortal Component
 * 
 * Complete rebuild with:
 * - Robust data handling with default values
 * - Clear error states and loading states
 * - Consistent navigation between tabs and sections
 * - Proper data transformation and handling
 */

// Event navigation items
const eventNavItems = [
  { id: "dashboard", label: "Dashboard", icon: <FiBarChart2 /> },
  { id: "registrations", label: "Registrations", icon: <FiUsers /> },
  { id: "categories", label: "Categories", icon: <FiTag /> },
  { id: "resources", label: "Resources", icon: <FiPackage /> },
  { id: "abstracts", label: "Abstracts", icon: <FiFileText /> },
  { id: "badges", label: "Badges", icon: <FiPrinter /> },
  { id: "landing-pages", label: "Landing Pages", icon: <LinkIcon className="w-5 h-5" /> },
  { id: "emails", label: "Emails", icon: <FiMail /> },
  { id: "reports", label: "Reports", icon: <FiBarChart2 /> },
  { id: "user-management", label: "User Management", icon: <UserGroupIcon className="w-5 h-5" /> },
  { id: "settings", label: "Settings", icon: <FiSettings /> }
];

function EventPortal() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, loading: authLoading } = useAuth();
  
  // State variables
  const [event, setEvent] = useState(null);
  const [statistics, setStatistics] = useState({
    totalRegistrations: { total: 0, checkedIn: 0 },
    registrationsToday: 0,
    checkedIn: 0,
    categories: [],
    resourcesDistributed: { food: 0, kits: 0, certificates: 0 },
    abstractsSubmitted: 0,
    abstractsApproved: 0
  });
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [activeSettingsTab, setActiveSettingsTab] = useState(0);
  const [renderKey, setRenderKey] = useState(0); // Add a key to force re-render when needed
  const [formChanged, setFormChanged] = useState(false);
  const [categoriesKey, setCategoriesKey] = useState(Date.now());
  
  // Memoize the setEvent function to prevent unnecessary re-renders
  const updateEvent = useMemo(() => {
    return (newEventData) => {
      if (typeof newEventData === 'function') {
        setEvent(newEventData);
      } else {
        setEvent(prev => ({
          ...prev,
          ...newEventData
        }));
      }
    };
  }, []);
  
  // Create a specialized function for updating abstract settings
  const updateAbstractSettings = useMemo(() => {
    return (settings) => {
      setEvent(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          abstractSettings: {
            ...prev.abstractSettings,
            ...settings
          }
        };
      });
    };
  }, []);
  
  // Create a mapping between tab index and tab ID
  const tabIndexToId = useMemo(() => {
    const mapping = {};
    eventNavItems.forEach((item, index) => {
      mapping[index] = item.id;
    });
    return mapping;
  }, []);
  
  // And the reverse mapping (ID to index)
  const tabIdToIndex = useMemo(() => {
    const mapping = {};
    eventNavItems.forEach((item, index) => {
      mapping[item.id] = index;
    });
    return mapping;
  }, []);
  
  // Define a refresh handler function for the entire portal
  const handleRefresh = useCallback(async () => {
    console.log(`Refreshing portal data for event ${id}...`);
    
    try {
      setLoading(true);
      setError(null);
      
      // Fetch fresh event data
      const eventData = await eventService.getEventById(id, { forceRefresh: true });
      
      if (eventData && eventData.success) {
        console.log('Refresh: Got updated event data:', eventData.data);
        setEvent(eventData.data);
        
        // Force a re-render by updating the render key
        setRenderKey(prevKey => prevKey + 1);
        
        // Reset any form changed flags
        setFormChanged(false);
      } else {
        throw new Error(eventData?.message || 'Failed to refresh event data');
      }
      
      // Also refresh statistics if needed
      try {
        const statsResponse = await eventService.getEventStatistics(id);
        if (statsResponse && statsResponse.success) {
          setStatistics({
            totalRegistrations: statsResponse.data.totalRegistrations || { total: 0, checkedIn: 0 },
            registrationsToday: statsResponse.data.registrationsToday || 0,
            checkedIn: statsResponse.data.checkedIn || 0,
            categories: statsResponse.data.categories || [],
            resourcesDistributed: statsResponse.data.resourcesDistributed || { food: 0, kits: 0, certificates: 0 },
            abstractsSubmitted: statsResponse.data.abstractsSubmitted || 0,
            abstractsApproved: statsResponse.data.abstractsApproved || 0
          });
        }
      } catch (statsError) {
        console.warn('Error refreshing statistics:', statsError);
        // Continue regardless of statistics refresh error
      }
      
      console.log('Portal data refresh completed successfully');
    } catch (error) {
      console.error('Error refreshing portal data:', error);
      setError(`Failed to refresh: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Use this effect to refresh when triggered by location state
  useEffect(() => {
    if (location.state?.refresh) {
      console.log('Refresh signal detected from navigation state. Refreshing portal data...');
      handleRefresh(); // Call the existing refresh handler
      // Clear the state so it doesn't refresh again on subsequent renders/navigation
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, handleRefresh]);
  
  // Get the current tab index for the Tabs component
  const currentTabIndex = tabIdToIndex[activeTab] || 0;
  
  // Handle navigation back from the location state more robustly
  useEffect(() => {
    // Check if the location state has an activeTab or subSection
    const locationState = location.state || {};
    
    if (locationState.activeTab && eventNavItems.some(item => item.id === locationState.activeTab)) {
      setActiveTab(locationState.activeTab);
      // Clear location state to prevent re-application on refresh
      navigate(location.pathname, { replace: true, state: {} });
      return;
    }
    
    // If we have a subSection in state, don't change the active tab - it's a sub-navigation
    if (locationState.subSection) {
      // Ensure the main tab associated with the subSection is active
      const mainTab = location.pathname.split('/')[3]; // e.g., 'settings' from /events/123/settings
      if (mainTab && activeTab !== mainTab && eventNavItems.some(item => item.id === mainTab)) {
         setActiveTab(mainTab);
      }
      return;
    }
    
    // Try to extract the tab from the URL path
    const pathSegments = location.pathname.split('/');
    let determinedTab = 'dashboard'; // Default to dashboard

    if (pathSegments.length >= 4) { // Check for /events/:id/:tabId or longer
      const possibleTab = pathSegments[3];
      if (eventNavItems.some(item => item.id === possibleTab)) {
        determinedTab = possibleTab;
        // Check for sub-path like /resources/scanner
        if (possibleTab === 'resources' && pathSegments.length >= 5 && pathSegments[4] === 'scanner') {
          determinedTab = 'scanner'; // Treat scanner as its own tab for rendering logic
        }
      } else if (possibleTab === 'scanner' && pathSegments.length === 4) {
         // Allow direct navigation to /events/:id/scanner if needed, though less likely
         determinedTab = 'scanner';
      }
    } // If path is just /events/:id (length 3), it defaults to 'dashboard' anyway

    // Check localStorage only if URL didn't provide a valid tab
    if (determinedTab === 'dashboard' && pathSegments.length <= 3) {
      const savedTab = localStorage.getItem(`event_${id}_active_tab`);
      if (savedTab && eventNavItems.some(item => item.id === savedTab)) {
        determinedTab = savedTab;
        // Update URL to match the saved tab if we are on the base path
        if (location.pathname === `/events/${id}`) {
             navigate(`/events/${id}/${determinedTab}`, { replace: true });
        }
      }
    }
    
    // Set the active tab state
    if (activeTab !== determinedTab) {
        setActiveTab(determinedTab);
      }
    
    // Ensure localStorage is consistent with the final determined tab
    localStorage.setItem(`event_${id}_active_tab`, determinedTab);

  }, [id, location.pathname, location.state, navigate, eventNavItems, activeTab]); // Added activeTab to dependencies
  
  // Load event data
  useEffect(() => {
    const loadEventData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const eventData = await eventService.getEventById(id);
        
        if (!eventData) {
          throw new Error('Event data is empty');
        }
        
        if (eventData && eventData.success) {
          setEvent(eventData.data); // Store only the event data object, not the entire response
        } else {
          throw new Error(eventData.message || 'Failed to load event data');
        }
        
        // Load statistics and dashboard data
        try {
          const statsResponse = await eventService.getEventStatistics(id);
          
          if (statsResponse && statsResponse.success) {
            // Ensure we have a properly structured statistics object
            setStatistics({
              totalRegistrations: statsResponse.data.totalRegistrations || { total: 0, checkedIn: 0 },
              registrationsToday: statsResponse.data.registrationsToday || 0,
              checkedIn: statsResponse.data.checkedIn || 0,
              categories: statsResponse.data.categories || [],
              resourcesDistributed: statsResponse.data.resourcesDistributed || { food: 0, kits: 0, certificates: 0 },
              abstractsSubmitted: statsResponse.data.abstractsSubmitted || 0,
              abstractsApproved: statsResponse.data.abstractsApproved || 0
            });
          } else {
            console.warn('Statistics data not in expected format:', statsResponse);
            setStatistics({
              totalRegistrations: { total: 0, checkedIn: 0 },
              registrationsToday: 0,
              checkedIn: 0,
              categories: [],
              resourcesDistributed: { food: 0, kits: 0, certificates: 0 },
              abstractsSubmitted: 0,
              abstractsApproved: 0
            });
          }
        } catch (statsError) {
          console.error('Error loading statistics:', statsError);
          // Use default values if statistics fail to load
          setStatistics({
            totalRegistrations: { total: 0, checkedIn: 0 },
            registrationsToday: 0,
            checkedIn: 0,
            categories: [],
            resourcesDistributed: { food: 0, kits: 0, certificates: 0 },
            abstractsSubmitted: 0,
            abstractsApproved: 0
          });
        }
        
        try {
          const dashboardResponse = await eventService.getEventDashboard(id);
          
          if (dashboardResponse && dashboardResponse.success) {
            setActivities(dashboardResponse.data.recentActivities || []);
          } else {
            console.warn('Dashboard data not in expected format:', dashboardResponse);
            setActivities([]);
          }
        } catch (dashboardError) {
          console.error('Error loading dashboard:', dashboardError);
          setActivities([]);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error in loadEventData:', err);
        setError(err.message || 'Failed to load event data');
        setLoading(false);
      }
    };
    
    // Only load data if auth check is done and user is authenticated
    if (id && !authLoading && isAuthenticated) {
      loadEventData();
    } else if (!authLoading && !isAuthenticated) {
      // Handle case where user is not authenticated (e.g., redirect or show error)
      setError('Authentication required to view event data.');
      setLoading(false);
      // Optionally navigate to login: navigate('/login');
    }
    // If auth is still loading, do nothing yet

  }, [id, authLoading, isAuthenticated]);
  
  // Log formChanged state changes
  useEffect(() => {
    console.log('Form changed state updated:', formChanged);
  }, [formChanged]);
  
  // Get status badge variant
  const getStatusBadgeVariant = (status) => {
    if (!status) return 'secondary';
    
    switch (status.toLowerCase()) {
      case 'draft':
        return 'info';
      case 'published':
        return 'success';
      case 'active':
        return 'success';
      case 'completed':
        return 'primary';
      case 'archived':
        return 'warning';
      default:
        return 'secondary';
    }
  };
  
  // Get activity icon
  const getActivityIcon = (type) => {
    if (!type) return <div className="h-5 w-5" />;
    
    switch (type.toLowerCase()) {
      case 'registration':
        return <UserPlusIcon className="h-5 w-5" />;
      case 'abstract':
        return <DocumentTextIcon className="h-5 w-5" />;
      case 'category':
        return <TagIcon className="h-5 w-5" />;
      case 'resource':
        return <CubeIcon className="h-5 w-5" />;
      default:
        return <div className="h-5 w-5" />;
    }
  };

  // Navigate to event section
  const navigateToSection = (sectionPath) => {
    // Only reset categories key if we're explicitly requesting a categories refresh
    // For example, after a category has been added or edited
    if (sectionPath === 'categories/refresh') {
      setCategoriesKey(Date.now());
      sectionPath = 'categories'; // Set to the normal tab path after handling special action
    }
    
    // Define sections that should be handled as external routes
    const externalRoutes = [
      'registrations/new',
      'registrations/bulk-import',
      'resources/scanner'
    ];
    
    // If this is an external route that needs full navigation
    if (externalRoutes.includes(sectionPath)) {
      navigate(`/events/${id}/${sectionPath}`);
      return;
    }
    
    // If the path indicates a resource sub-tab, 
    // ensure the main 'resources' tab is active, but DO NOT navigate.
    // The ResourcesTab component itself handles the sub-path internally.
    if (sectionPath.startsWith('resources/')) {
      if (activeTab !== 'resources') {
      setActiveTab('resources');
      }
      // We don't navigate here because ResourcesTab handles its own URL updates.
      // The URL change will trigger the useEffect in ResourcesTab to set its internal active state.
      return;
    }
    
    // For other paths with slashes (e.g., settings sub-tabs), update the tab and pass state
    if (sectionPath.includes('/')) {
      const [mainSection, action] = sectionPath.split('/');
      
      // Update the active tab to the main section
      if (eventNavItems.some(item => item.id === mainSection)) {
        setActiveTab(mainSection);
      }
      
      // Update URL without forcing navigation - usually for sub-sections within a main tab
      navigate(`/events/${id}/${mainSection}`, { 
        replace: true,
        state: { subSection: action }
      });
      return;
    }
    
    // For regular tabs, update the active tab
    const tabId = typeof sectionPath === 'number' 
      ? (tabIndexToId[sectionPath] || 'dashboard')
      : sectionPath;
    
    if (activeTab !== tabId) { 
    setActiveTab(tabId);
    }

    // Update the URL to reflect the main tab, but stay within the event portal
    // Use the sectionPath (which is the tabId here) in the URL
    navigate(`/events/${id}/${tabId}`, { 
      replace: true
    });
    
    // Store the selected tab in local storage
    localStorage.setItem(`event_${id}_active_tab`, tabId);
  };
  
  // Handle sections that require navigation to another page
  const handleSectionNavigation = (section) => {
    setActiveTab(section);
    localStorage.setItem(`event_${id}_active_tab`, section);
    
    // Handle navigation to different sections based on the section ID
    if (section === 'registrations') {
      navigate(`/events/${id}/registrations`);
    } else if (section === 'categories') {
      navigate(`/events/${id}/categories`);  
    } else if (section === 'resources') {
      navigate(`/events/${id}/resources`);
    } else if (section === 'abstracts') {
      navigate(`/events/${id}/abstracts`);
    } else if (section === 'badges') {
      navigate(`/events/${id}/badges`);
    } else if (section === 'landing-pages') {
      navigate(`/events/${id}/landing-pages`);
    } else if (section === 'emails') {
      // For emails, we'll stay on the portal page but show the emails tab
      setActiveTab('emails');
    } else if (section === 'reports') {
      navigate(`/events/${id}/reports`);
    } else if (section === 'settings') {
      setActiveTab('settings');
    } else {
      // For other sections, just stay on the portal and show the appropriate tab
      setActiveTab(section);
    }
  };

  // Handle external portal link copying
  const copyToClipboard = (link) => {
    if (!link) return;
    
    try {
    navigator.clipboard.writeText(link);
    // Here you would typically show a toast notification
    alert(`Link copied to clipboard: ${link}`);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      alert('Failed to copy link to clipboard');
    }
  };
  
  // The tab content - render all tabs but only show the active one
  const renderAllTabContents = () => {
    // First check if we have any error or loading state
    if (error) {
      return (
        <div className="p-8">
          <Alert variant="danger" title="Error Loading Event" description={error} />
        </div>
      );
    }
    
    if (loading || !event) {
      return (
        <div className="flex justify-center items-center p-12">
          <Spinner size="lg" />
        </div>
      );
    }
    
    // Check for abstract detail view
    const abstractDetailPathRegex = /^\/events\/[^\/]+\/abstracts\/([^\/]+)$/;
    const pathMatch = location.pathname.match(abstractDetailPathRegex);

    if (activeTab === "abstracts" && pathMatch && pathMatch[1]) {
      const abstractIdFromUrl = pathMatch[1];
      return (
        <TabErrorBoundary tabName="Abstract Detail">
          <AbstractDetail eventId={id} abstractId={abstractIdFromUrl} />
        </TabErrorBoundary>
      );
    }
    
    let activeTabContent = null;

    // Determine the content based on the activeTab state
    // Note: The TabErrorBoundary wraps the content for each case
    switch (activeTab) {
      case "dashboard":
        activeTabContent = <TabErrorBoundary tabName="Dashboard">{renderDashboard()}</TabErrorBoundary>;
        break;
      case "registrations":
        activeTabContent = <TabErrorBoundary tabName="Registrations"><RegistrationsTab eventId={id} /></TabErrorBoundary>;
        break;
      case "categories":
        activeTabContent = <TabErrorBoundary tabName="Categories"><CategoriesTab eventId={id} key={categoriesKey} /></TabErrorBoundary>;
        break;
      case "resources":
        activeTabContent = <TabErrorBoundary tabName="Resources"><ResourcesTab eventId={id} onUpdated={() => setRenderKey(prev => prev + 1)} /></TabErrorBoundary>;
        break;
      case "abstracts":
        activeTabContent = <TabErrorBoundary tabName="Abstracts"><AbstractsTab event={event} /></TabErrorBoundary>;
        break;
      case "badges":
        const pathSegments = location.pathname.split('/');
        if (pathSegments.length > 4 && pathSegments[3] === 'badges') {
          if (pathSegments[4] === 'designer') {
            activeTabContent = <TabErrorBoundary tabName="Badge Designer"><BadgeDesigner eventId={id} /></TabErrorBoundary>;
          } else if (pathSegments[4] === 'print') {
            activeTabContent = <TabErrorBoundary tabName="Badge Printing"><BadgePrintingPage eventId={id} /></TabErrorBoundary>;
          } else {
            activeTabContent = <TabErrorBoundary tabName="Badges"><BadgePrintingPage eventId={id} /></TabErrorBoundary>;
          }
        } else {
          activeTabContent = <TabErrorBoundary tabName="Badges"><BadgePrintingPage eventId={id} /></TabErrorBoundary>;
        }
        break;
      case "scanner":
        activeTabContent = <TabErrorBoundary tabName="Scanner"><ScannerStation eventId={id} /></TabErrorBoundary>;
        break;
      case "landing-pages":
        activeTabContent = (
          <TabErrorBoundary tabName="Landing Pages">
            <LandingPagesManager eventId={id} />
          </TabErrorBoundary>
        );
        break;
      case "emails":
         activeTabContent = <TabErrorBoundary tabName="Emails"><EmailsTabWrapper event={event} /></TabErrorBoundary>;
         break;
      case "reports":
        activeTabContent = <TabErrorBoundary tabName="Reports"><ReportsTab eventId={id} /></TabErrorBoundary>;
        break;
      case "user-management":
        activeTabContent = (
          <TabErrorBoundary tabName="User Management">
            <EventUserManagementTab eventId={id} />
          </TabErrorBoundary>
        );
        break;
      case "settings":
        activeTabContent = (
          <TabErrorBoundary tabName="Settings">
            <div className="p-2">
              {/* Remove the buttons from here */}
              <Tabs
                tabs={[
                  { label: "General" }, 
                  { label: "Registration" }, 
                  { label: "Badges" }, 
                  { label: "Resources" }, 
                  { label: "Abstracts" }, 
                  { label: "Schedule" },
                  { label: "Email" }, 
                  { label: "Payment" }, 
                  { label: "Advanced" }
                ]}
                activeTab={activeSettingsTab}
                onChange={setActiveSettingsTab}
              />
              <div className="mt-4">
                {(() => {
                  switch (activeSettingsTab) {
                    case 0:
                      return <GeneralTab event={event} setEvent={setEvent} setFormChanged={setFormChanged} id={id} />;
                    case 1:
                      return <RegistrationTab event={event} setEvent={setEvent} setFormChanged={setFormChanged} id={id} />;
                    case 2:
                      return <BadgesTab event={event} setEvent={setEvent} setFormChanged={setFormChanged} id={id} />;
                    case 3:
                      return <ResourcesSettingsTab event={event} setEvent={setEvent} setFormChanged={setFormChanged} id={id} />;
                    case 4:
                      return <AbstractsSettingsTab event={event} setEvent={setEvent} setFormChanged={setFormChanged} />;
                    case 5:
                      return <ScheduleTab event={event} setEvent={setEvent} setFormChanged={setFormChanged} id={id} />;
                    case 6:
                      return <EmailTab event={event} setEvent={setEvent} setFormChanged={setFormChanged} id={id} />;
                    case 7:
                      return <PaymentTab event={event} setEvent={setEvent} setFormChanged={setFormChanged} id={id} />;
                    case 8:
                      return <SettingsTab event={event} setEvent={setEvent} setFormChanged={setFormChanged} id={id} />;
                    default:
                      return <div>Select a settings category.</div>;
                  }
                })()}
              </div>
              
              {/* Add this at the bottom */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                {/* Test button to debug formChanged state */}
                <div className="mb-4 flex justify-center">
                  <Button
                    variant="outline"
                    onClick={() => {
                      console.log("Setting formChanged to true for testing");
                      setFormChanged(true);
                    }}
                  >
                    Test Change (Debug)
                  </Button>
                </div>
                
                {/* Save/Cancel buttons */}
                <div className="flex justify-end space-x-3">
                  <Button
                    variant="light"
                    onClick={() => {
                      // Reset by fetching the event data again
                      loadEventData();
                      setFormChanged(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    disabled={!formChanged}
                    onClick={async () => {
                      try {
                        console.log("Saving event changes");
                        setLoading(true);
                        await eventService.updateEvent(id, event);
                        setFormChanged(false);
                        setLoading(false);
                        // Show success message (you could add a toast notification here)
                        console.log("Event settings saved successfully");
                      } catch (err) {
                        console.error("Error saving event settings:", err);
                        setLoading(false);
                        // Show error message (you could add a toast notification here)
                      }
                    }}
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            </div>
          </TabErrorBoundary>
        );
        break;
      default:
        activeTabContent = <div>Tab content not found for '{activeTab}'</div>;
    }

    // Render AnimatePresence with only ONE direct child: the motion.div
    // keyed by the activeTab state AND the full path to ensure re-renders on sub-path changes
    return (
                <AnimatePresence mode="wait">
                    <motion.div
          key={`${activeTab}-${location.pathname}`} // Change key to include pathname
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
                    >
          {activeTabContent} 
                    </motion.div>
      </AnimatePresence>
    );
  };
  
  // Dashboard tab content
  const renderDashboard = () => {
    try {
      return (
        <div className="space-y-6">
          {/* Quick Actions Section */}
          <div className="mb-6">
            <h2 className="text-lg font-medium mb-4">Quick Actions</h2>
            <div className="grid grid-cols-4 gap-4">
              <div className="flex items-center justify-center">
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center"
                  leftIcon={<UserPlusIcon className="h-5 w-5" />}
                  onClick={() => navigateToSection('registrations/new')}
                >
                  New Registration
                </Button>
              </div>
              <div className="flex items-center justify-center">
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center"
                  leftIcon={<DocumentDuplicateIcon className="h-5 w-5" />}
                  onClick={() => navigateToSection('registrations/bulk-import')}
                >
                  Import Registrations
                </Button>
              </div>
              <div className="flex items-center justify-center">
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center"
                  leftIcon={<CheckBadgeIcon className="h-5 w-5" />}
                  onClick={() => navigate(`/events/${id}/resources/scanner/food`)}
                >
                  Scanner Station
                </Button>
              </div>
              <div className="flex items-center justify-center">
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center"
                  leftIcon={<ChartPieIcon className="h-5 w-5" />}
                  onClick={() => navigateToSection('reports')}
                >
                  Reports
                </Button>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            {/* Registrations Card */}
            <Card className="h-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Registrations</h3>
                <a href="#" onClick={(e) => { e.preventDefault(); navigateToSection('registrations'); }} className="text-sm text-primary-600 hover:underline">View All</a>
              </div>
              <div className="flex flex-col items-center justify-center py-6">
                <h2 className="text-4xl font-bold">
                  {typeof statistics?.totalRegistrations === 'object' 
                    ? (statistics?.totalRegistrations?.total || 0) 
                    : (statistics?.totalRegistrations || 0)}
                </h2>
                <p className="text-sm text-gray-500">Total Registrations</p>
                
                {statistics?.registrationsToday > 0 && (
                  <div className="mt-2 bg-green-50 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                    +{statistics.registrationsToday} Today
                  </div>
                )}
              </div>
              <div className="mt-4 flex justify-center">
                <Button 
                  variant="primary"
                  size="sm"
                  onClick={() => navigateToSection('registrations/new')}
                >
                  New Registration
                </Button>
              </div>
            </Card>
            
            {/* Abstracts Card */}
            <Card className="h-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Abstracts</h3>
                <a href="#" onClick={(e) => { e.preventDefault(); navigateToSection('abstracts'); }} className="text-sm text-primary-600 hover:underline">View All</a>
              </div>
              <div className="flex flex-col items-center justify-center py-6">
                <h2 className="text-4xl font-bold">
                  {typeof statistics?.abstractsSubmitted === 'object' 
                    ? (statistics?.abstractsSubmitted?.total || 0) 
                    : (statistics?.abstractsSubmitted || 0)}
                </h2>
                <p className="text-sm text-gray-500">Total Submissions</p>
              </div>
              <div className="mt-2 flex justify-center gap-4">
                <div className="flex items-center">
                  <span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-2"></span>
                  <span className="text-xs">Approved: {
                    typeof statistics?.abstractsApproved === 'object'
                      ? (statistics?.abstractsApproved?.total || 0)
                      : (statistics?.abstractsApproved || 0)
                  }</span>
                </div>
                <div className="flex items-center">
                  <span className="inline-block w-3 h-3 rounded-full bg-yellow-500 mr-2"></span>
                  <span className="text-xs">Under Review: {
                    typeof statistics?.abstractsSubmitted === 'object' && typeof statistics?.abstractsApproved === 'object'
                      ? ((statistics?.abstractsSubmitted?.total || 0) - (statistics?.abstractsApproved?.total || 0))
                      : (typeof statistics?.abstractsSubmitted === 'object' 
                          ? (statistics?.abstractsSubmitted?.total || 0) - (statistics?.abstractsApproved || 0)
                          : (statistics?.abstractsSubmitted || 0) - (typeof statistics?.abstractsApproved === 'object' 
                              ? (statistics?.abstractsApproved?.total || 0) 
                              : (statistics?.abstractsApproved || 0)))
                  }</span>
                </div>
              </div>
            </Card>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            {/* Resources Card */}
            <Card className="h-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Resources</h3>
                <a href="#" onClick={(e) => { e.preventDefault(); navigateToSection('resources'); }} className="text-sm text-primary-600 hover:underline">View All</a>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center py-4">
                <div>
                  <h3 className="text-xl font-bold">
                    {typeof statistics?.resourcesDistributed?.food === 'object'
                      ? (statistics?.resourcesDistributed?.food?.total || 0)
                      : (statistics?.resourcesDistributed?.food || 0)}
                  </h3>
                  <p className="text-xs text-gray-500">Food</p>
                </div>
                <div>
                  <h3 className="text-xl font-bold">
                    {typeof statistics?.resourcesDistributed?.kits === 'object'
                      ? (statistics?.resourcesDistributed?.kits?.total || 0)
                      : (statistics?.resourcesDistributed?.kits || 0)}
                  </h3>
                  <p className="text-xs text-gray-500">Kit Bags</p>
                </div>
                <div>
                  <h3 className="text-xl font-bold">
                    {typeof statistics?.resourcesDistributed?.certificates === 'object'
                      ? (statistics?.resourcesDistributed?.certificates?.total || 0)
                      : (statistics?.resourcesDistributed?.certificates || 0)}
                  </h3>
                  <p className="text-xs text-gray-500">Certificates</p>
                </div>
              </div>
              <div className="mt-4 flex justify-center">
                <Button 
                  variant="outline" 
                  size="sm"
                  leftIcon={<QrCodeIcon className="h-4 w-4" />}
                  onClick={() => navigate(`/events/${id}/resources/scanner/food`)}
                >
                  Scan
                </Button>
              </div>
            </Card>
            
            {/* Categories Card */}
            <Card className="h-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Categories</h3>
                <a href="#" onClick={(e) => { e.preventDefault(); navigateToSection('categories'); }} className="text-sm text-primary-600 hover:underline">View All</a>
              </div>
              {statistics?.categories && statistics.categories.length > 0 ? (
                <div className="space-y-2 py-2">
                  {statistics.categories.map((category, index) => (
                    <div key={category.id || index} className="flex justify-between items-center">
                      <span>{category.name}</span>
                      <span className="font-medium">{category.count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <p>No categories found</p>
                </div>
              )}
              <div className="mt-4 flex justify-center">
                <Button 
                  variant="primary"
                  size="lg"
                  onClick={() => navigateToSection('categories')}
                >
                  Manage Categories
                </Button>
              </div>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            {/* Event Details Card */}
            <Card>
              <h3 className="text-lg font-medium mb-4">Event Details</h3>
              <p>{event.description || 'Join us for the biggest tech conference of the year featuring leading experts and cutting-edge innovations.'}</p>
              
              <div className="grid grid-cols-2 gap-6 mt-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Registration ID Format</h4>
                  <p>{event.registrationSettings?.idPrefix || 'TEC2023'}-XXXX</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Current Sequence</h4>
                  <p>{typeof statistics?.totalRegistrations === 'object' 
                      ? (statistics?.totalRegistrations?.total || 0) 
                      : (statistics?.totalRegistrations || 0)}</p>
                </div>
              </div>
            </Card>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            {/* External Portals Card */}
            <Card>
              <h3 className="text-lg font-medium mb-4">External Portals</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Registration Portal</label>
                  <div className="flex rounded-md shadow-sm">
                    <input
                      type="text"
                      readOnly
                      value={`${window.location.origin}/portal/register/${id}`}
                      className="flex-1 min-w-0 block w-full px-3 py-2 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => copyToClipboard(`${window.location.origin}/portal/register/${id}`)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-r-md bg-gray-50 text-gray-700 sm:text-sm"
                    >
                      <ClipboardIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Registrant Portal</label>
                  <div className="flex rounded-md shadow-sm">
                    <input
                      type="text"
                      readOnly
                      value={`${window.location.origin}/registrant-portal?event=${id}`}
                      className="flex-1 min-w-0 block w-full px-3 py-2 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => copyToClipboard(`${window.location.origin}/registrant-portal?event=${id}`)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-r-md bg-gray-50 text-gray-700 sm:text-sm"
                    >
                      <ClipboardIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Abstract Portal</label>
                  <div className="flex rounded-md shadow-sm">
                    <input
                      type="text"
                      readOnly
                      value={`${window.location.origin}/portal/abstract/${id}?event=${id}`}
                      className="flex-1 min-w-0 block w-full px-3 py-2 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => copyToClipboard(`${window.location.origin}/portal/abstract/${id}?event=${id}`)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-r-md bg-gray-50 text-gray-700 sm:text-sm"
                    >
                      <ClipboardIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Reviewer Portal</label>
                  <div className="flex rounded-md shadow-sm">
                    <input
                      type="text"
                      readOnly
                      value={`${window.location.origin}/portal/reviewer/${id}?event=${id}`}
                      className="flex-1 min-w-0 block w-full px-3 py-2 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => copyToClipboard(`${window.location.origin}/portal/reviewer/${id}?event=${id}`)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-r-md bg-gray-50 text-gray-700 sm:text-sm"
                    >
                      <ClipboardIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <h4 className="text-sm font-medium mb-2">Quick Actions</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    leftIcon={<DocumentDuplicateIcon className="h-4 w-4" />}
                    onClick={() => navigateToSection('registrations/bulk-import')}
                  >
                    Import
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    leftIcon={<CheckBadgeIcon className="h-4 w-4" />}
                    onClick={() => navigate(`/events/${id}/resources/scanner/food`)}
                  >
                    Scan
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    leftIcon={<TagIcon className="h-4 w-4" />}
                    onClick={() => navigateToSection('badges')}
                  >
                    Badges
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    leftIcon={<ChartBarIcon className="h-4 w-4" />}
                    onClick={() => navigateToSection('reports')}
                  >
                    Reports
                  </Button>
                </div>
              </div>
            </Card>
            
            {/* Recent Activity Card */}
            <Card>
              <h3 className="text-lg font-medium mb-4">Recent Activity</h3>
              
              {activities && activities.length > 0 ? (
                <div className="space-y-3">
                  {activities.map((activity, index) => (
                    <div 
                      key={activity?._id || index}
                      className="flex items-start space-x-3 py-2 border-b border-gray-100 last:border-0"
                    >
                      <div className="h-6 w-6 flex-shrink-0 flex items-center justify-center">
                        {getActivityIcon(activity?.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm">{activity?.details || activity?.description || 'Activity logged'}</p>
                        <p className="text-xs text-gray-500 mt-1">{formatDateTimeRelative(activity?.timestamp)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <p>No recent activities</p>
                </div>
              )}
            </Card>
          </div>
        </div>
      );
    } catch (error) {
      console.error('Error rendering dashboard:', error);
      return (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-lg font-semibold text-red-700 mb-2">Error Rendering Dashboard</h3>
          <p className="text-red-600 mb-4">{error.message}</p>
          <pre className="text-xs text-red-500 bg-red-50 p-2 rounded overflow-auto mt-2">
            {error.stack}
          </pre>
          <Button variant="primary" onClick={handleRefresh} className="mt-4">
            Try Again
          </Button>
        </div>
      );
    }
  };
  
  // Simple EmailsTab wrapper component
  const EmailsTabWrapper = ({ event }) => {
    return <EmailsTab />;
  };
  
  // Render loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold mb-2 text-red-700">Error Loading Event</h2>
          <p className="text-red-600 mb-4">{error}</p>
          {isDevelopment && (
            <div className="mt-4 text-left bg-gray-800 text-white p-4 rounded overflow-auto max-h-64">
              <h3 className="text-sm font-mono mb-2">Debug Information:</h3>
              <p className="text-xs font-mono whitespace-pre-wrap">
                Event ID: {id}
                <br />
                Request URL: {`${import.meta.env.VITE_API_URL || '/api'}/events/${id}`}
              </p>
            </div>
          )}
          <Button
            variant="primary"
            className="mt-4"
            onClick={() => navigate('/events')}
          >
            Back to Events List
          </Button>
        </div>
      </div>
    );
  }
  
  // If event data is missing, show error
  if (!event) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert 
          variant="error" 
          title="Event Not Found" 
          description="The requested event could not be found or loaded." 
        />
        <div className="mt-4">
          <Link to="/events">
            <Button variant="primary">
              Back to Events
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Main component render
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Event header */}
      <div className="mb-6 flex flex-row justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-xl font-bold text-gray-900 mr-3">{event?.name || 'Event Details'}</h1>
          <Badge variant={getStatusBadgeVariant(event?.status)} className="ml-2">
            {event?.status || 'Status Unknown'}
          </Badge>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate(`/events/${id}/edit`)}
          >
            Edit Event
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/events')}
          >
            Back to Events
          </Button>
        </div>
      </div>
      
      <p className="text-sm text-gray-500 mb-6">
        {formatDate(event?.startDate)} - {formatDate(event?.endDate)} | {event?.venue?.name || event?.location || 'No location specified'}
      </p>
      
      {/* Event navigation tabs - simplified horizontal style */}
      <div className="mb-8 border-b border-gray-200">
        <div className="flex space-x-1 overflow-x-auto">
          {eventNavItems.map(item => (
            <button
              key={item.id}
              className={`py-3 px-4 flex items-center text-sm font-medium ${
                activeTab === item.id
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={(e) => {
                e.preventDefault(); // Prevent default navigation behavior
                navigateToSection(item.id);
              }}
            >
              <span className="mr-2">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* The tab content */}
      <div>
        {renderAllTabContents()}
      </div>
    </div>
  );
}

export default EventPortal; 