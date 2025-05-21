import React, { useEffect, useMemo, useCallback } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useRegistrantAuth } from '../contexts/RegistrantAuthContext';
import { ActiveEventProvider, useActiveEvent } from '../contexts/ActiveEventContext';
import Button from '../components/common/Button';
import { Spinner } from '../components/common'; // Assuming Spinner is in common components

// Helper to parse query params
function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const LayoutContent = () => {
  const { logout } = useRegistrantAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const {
    activeEventId, 
    updateActiveEventId, 
    activeEventDetails, 
    isLoadingEventDetails,
    eventDetailsError,
    isSyncingEventId
  } = useActiveEvent();

  // Navigation items, potentially dynamic based on event features later
  const navigation = useMemo(() => [
    { name: 'Dashboard', path: `/registrant-portal` },
    { name: 'Profile', path: `/registrant-portal/profile` },
    { name: 'Abstracts', path: `/registrant-portal/abstracts` },
    // Add other common navigation items here
  ], []);

  const getPathWithEvent = useCallback((basePath) => {
    if (!activeEventId) return basePath;
    try {
      const url = new URL(basePath, window.location.origin);
      if (!url.searchParams.has('event')) {
        url.searchParams.set('event', activeEventId);
      }
      return `${url.pathname}${url.search}`;
    } catch (e) {
      console.error('Error creating URL for navigation:', e);
      return basePath; // Fallback
    }
  }, [activeEventId]);

  const navigateWithEvent = useCallback((to, options) => {
    let path = '';
    if (typeof to === 'string') {
      path = getPathWithEvent(to);
    } else if (typeof to === 'number') {
      navigate(to); // For navigate(-1) etc.
      return;
    } else { // to is an object (e.g., { pathname, search, hash })
      const targetPath = to.pathname || location.pathname;
      const combinedSearch = new URLSearchParams(to.search);
      if (!combinedSearch.has('event') && activeEventId) {
        combinedSearch.set('event', activeEventId);
      }
      path = `${targetPath}?${combinedSearch.toString()}`;
      if (to.hash) {
        path += `#${to.hash}`;
      }
    }
    navigate(path, options);
  }, [navigate, getPathWithEvent, activeEventId, location.pathname]);

  const isActivePath = (path) => {
    const currentPathOnly = location.pathname;
    const linkPathOnly = path.split('?')[0];
    if (linkPathOnly === '/registrant-portal' && currentPathOnly === '/registrant-portal') {
      return true;
    }
    if (linkPathOnly !== '/registrant-portal' && currentPathOnly.startsWith(linkPathOnly) && 
        (currentPathOnly.length === linkPathOnly.length || currentPathOnly[linkPathOnly.length] === '/')) {
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    logout();
    updateActiveEventId(null); // This now also clears event details in context
    navigate('/registrant-portal/auth/login'); 
  };

  const eventDisplayName = useMemo(() => {
    if (isLoadingEventDetails) return 'Loading Event...';
    if (eventDetailsError) return 'Error Loading Event';
    return activeEventDetails?.name || activeEventDetails?.basicInfo?.eventName || 'Event Portal';
  }, [activeEventDetails, isLoadingEventDetails, eventDetailsError]);

  // Render function for the header, can be expanded
  const renderHeader = () => (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0">
            <Link to={getPathWithEvent('/registrant-portal')} className="text-xl font-bold text-indigo-600">
              {eventDisplayName}
            </Link>
          </div>
          <nav className="hidden sm:ml-6 sm:flex sm:space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={getPathWithEvent(item.path)}
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActivePath(item.path)
                    ? 'border-indigo-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <Button onClick={handleLogout} variant="outline" size="sm">
              Logout
            </Button>
          </div>
          {/* Mobile menu button can be added here if needed */}
        </div>
      </div>
    </header>
  );

  const renderMobileNav = () => (
    <nav className="sm:hidden bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-around space-x-3 py-3">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={getPathWithEvent(item.path)}
              className={`${
                isActivePath(item.path)
                  ? 'text-indigo-600'
                  : 'text-gray-600 hover:text-gray-900'
              } text-sm font-medium flex flex-col items-center`}
            >
              <span>{item.name}</span>
            </Link>
          ))}
          {/* Mobile Logout Button */}
          <button
            onClick={handleLogout}
            className="text-sm font-medium flex flex-col items-center text-red-600 hover:text-red-800 focus:outline-none"
            style={{ minWidth: 48 }}
          >
            <span>Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {renderHeader()}
      {renderMobileNav()}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-4 sm:px-0">
          {(isSyncingEventId || isLoadingEventDetails) && (
            <div className="flex justify-center items-center h-64">
              <Spinner size="xl" />
              <p className="ml-3 text-lg">Loading event data...</p>
            </div>
          )}
          {!isSyncingEventId && !isLoadingEventDetails && eventDetailsError && (
             <div className="text-center p-8 bg-red-50 border border-red-200 rounded-lg">
               <h2 className="text-xl font-semibold text-red-700">Error Loading Event</h2>
               <p className="text-red-600 mt-2 mb-4">
                 {eventDetailsError}
               </p>
               <Button onClick={() => navigate('/registrant-portal/auth/login')} variant="danger">
                 Go to Login
               </Button>
             </div>
          )}
          {!isSyncingEventId && !isLoadingEventDetails && !eventDetailsError && !activeEventId && (
            <div className="text-center p-8 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h2 className="text-xl font-semibold text-yellow-700">Event Context Missing</h2>
              <p className="text-yellow-600 mt-2 mb-4">
                No event is currently selected. Please ensure you have accessed the portal through a valid event link.
              </p>
              <Button onClick={() => navigate('/registrant-portal/auth/login')} variant="primary">
                Go to Login
              </Button>
            </div>
          )}
          {!isSyncingEventId && !isLoadingEventDetails && !eventDetailsError && activeEventId && (
            <Outlet /> // Render child routes only if eventId exists and no error
          )}
        </div>
      </main>
    </div>
  );
};

const RegistrantPortalLayout = () => {
  const query = useQuery();
  const navigate = useNavigate();
  const eventIdFromQuery = query.get('event');
  const { currentRegistrant, hasEventAccess } = useRegistrantAuth(); // Added currentRegistrant
  
  useEffect(() => {
    const storedEventId = localStorage.getItem('activeEventId');
    const targetEventId = eventIdFromQuery || storedEventId;

    if (targetEventId) {
      console.log(`[RegistrantPortalLayout] Target Event ID for access check: ${targetEventId}`);
      // Wait for currentRegistrant to be loaded before checking access
      if (currentRegistrant === undefined) { // Still loading registrant context
        console.log("[RegistrantPortalLayout] Waiting for registrant data before event access check.");
        return;
      }
      if (!hasEventAccess(targetEventId)) {
        console.warn(`[RegistrantPortalLayout] Registrant does not have access to event ${targetEventId}. Redirecting to login.`);
        navigate('/registrant-portal/auth/login', { replace: true });
        return;
      }
      // If using storedEventId and eventIdFromQuery is missing, update URL
      if (!eventIdFromQuery && storedEventId) {
        console.log('[RegistrantPortalLayout] No event in query, using stored eventId and updating URL.');
        navigate(`${location.pathname}?event=${storedEventId}`, { replace: true });
      }
      // If eventIdFromQuery is present and different from stored, localStorage will be updated by ActiveEventProvider
    } else {
      console.warn('[RegistrantPortalLayout] No event ID found in URL query or localStorage. Redirecting to login.');
      navigate('/registrant-portal/auth/login', { replace: true });
    }
  }, [eventIdFromQuery, navigate, hasEventAccess, location.pathname, currentRegistrant]);

  // Render ActiveEventProvider only if we have a valid eventIdFromQuery or one from storage to pass to it.
  // The useEffect above handles redirection if access is denied or no ID is found.
  const initialEventIdForProvider = eventIdFromQuery || localStorage.getItem('activeEventId');

  if (!initialEventIdForProvider && !currentRegistrant) {
    // If no ID and registrant potentially not loaded, show minimal loading or redirect if appropriate
    // This case should ideally be handled by the useEffect redirecting to login quickly
    return <div className="flex justify-center items-center h-screen"><Spinner size="xl" /><p className="ml-3">Initializing...</p></div>;
  }

  return (
    <ActiveEventProvider eventIdFromQuery={initialEventIdForProvider}>
      <LayoutContent />
    </ActiveEventProvider>
  );
};

export default RegistrantPortalLayout; 