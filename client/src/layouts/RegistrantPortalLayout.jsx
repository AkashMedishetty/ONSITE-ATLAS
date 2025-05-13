import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useRegistrantAuth } from '../contexts/RegistrantAuthContext';
import { ActiveEventProvider, useActiveEvent } from '../contexts/ActiveEventContext';
import apiRegistrant from '../services/apiRegistrant';
import Button from '../components/common/Button';

// Helper to parse query params
function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const LayoutContent = () => {
  const { logout, currentRegistrant } = useRegistrantAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { activeEventId, updateActiveEventId } = useActiveEvent();
  const [eventInfo, setEventInfo] = useState({ name: 'Loading...' });
  const [isLoadingEvent, setIsLoadingEvent] = useState(false);
  const [eventError, setEventError] = useState(null);

  useEffect(() => {
    const fetchEventInfo = async () => {
      if (!activeEventId) {
          console.log('[LayoutContent] No activeEventId, skipping event info fetch.');
          setEventInfo({ name: 'N/A' });
          return;
      }
      setIsLoadingEvent(true);
      setEventError(null);
      console.log(`[LayoutContent] Fetching event info for ID: ${activeEventId}`);
      try {
        const response = await apiRegistrant.get(`/events/${activeEventId}`);
        
        if (response.status >= 200 && response.status < 300 && response.data?.success && response.data.data) {
          setEventInfo({
              name: response.data.data.basicInfo?.eventName || response.data.data.name || 'Event Details',
          });
          console.log('[LayoutContent] Event info loaded:', response.data.data.basicInfo?.eventName || response.data.data.name);
        } else {
          const errorMessage = response.data?.message || 'Failed to load event details (check API response)';
          console.error('[LayoutContent] Failed to fetch event details:', errorMessage, 'Response Data:', response.data);
          setEventError(errorMessage);
          setEventInfo({ name: 'Error Loading Event' });
        }
      } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'An error occurred while loading event details.';
        console.error('[LayoutContent] Catch Error fetching event details:', error);
        setEventError(errorMessage);
        setEventInfo({ name: 'Error Loading Event' });
      } finally {
        setIsLoadingEvent(false);
      }
    };

    fetchEventInfo();
  }, [activeEventId]);

  const navigation = useMemo(() => [
    { name: 'Dashboard', path: `/registrant-portal` },
    { name: 'Profile', path: `/registrant-portal/profile` },
    { name: 'Abstracts', path: `/registrant-portal/abstracts` },
  ], []);

  const getPathWithEvent = useCallback((basePath) => {
    if (!activeEventId) return basePath;
    const url = new URL(basePath, window.location.origin);
    if (!url.searchParams.has('event')) {
        url.searchParams.set('event', activeEventId);
    }
    return `${url.pathname}${url.search}`; 
  }, [activeEventId]);

  const navigateWithEvent = useCallback((to, options) => {
    let path = '';
    if (typeof to === 'string') {
      path = getPathWithEvent(to);
    } else if (typeof to === 'number') {
      navigate(to);
      return;
    } else {
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
    updateActiveEventId(null);
    navigate('/registrant-portal/auth/login'); 
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link to={getPathWithEvent('/registrant-portal')} className="text-xl font-bold text-gray-800">
                  {isLoadingEvent ? 'Loading Event...' : eventInfo.name || 'ATLAS Portal'}
                </Link>
              </div>

              <nav className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={getPathWithEvent(item.path)}
                    className={`${
                      isActivePath(item.path)
                        ? 'border-indigo-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                  >
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="flex items-center">
              <span className="text-sm text-gray-600 mr-4">
                Welcome, {currentRegistrant?.name || currentRegistrant?.registrationId || 'Registrant'}
              </span>
              <button
                onClick={handleLogout}
                className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

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
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-4 sm:px-0">
          {!activeEventId ? (
            <div className="text-center p-8 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h2 className="text-xl font-semibold text-yellow-700">Event Context Missing</h2>
              <p className="text-yellow-600 mt-2 mb-4">
                No event is currently selected. Please ensure you have accessed the portal through a valid event link.
              </p>
              <Button onClick={() => navigate('/registrant-portal/auth/login')} variant="primary">
                Go to Login
              </Button>
            </div>
          ) : (
            <Outlet />
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
  const { hasEventAccess } = useRegistrantAuth();
  
  useEffect(() => {
    const storedEventId = localStorage.getItem('activeEventId');
    if (eventIdFromQuery) {
      console.log('[RegistrantPortalLayout] Event ID from URL query (?event=):', eventIdFromQuery);
      if (!hasEventAccess(eventIdFromQuery)) {
        console.warn(`[RegistrantPortalLayout] Registrant does not have access to event ${eventIdFromQuery}`);
        navigate('/registrant-portal/auth/login');
        return;
      }
      if (storedEventId !== eventIdFromQuery) {
        localStorage.setItem('activeEventId', eventIdFromQuery); 
        console.log('[RegistrantPortalLayout] Updated localStorage with eventId from query.');
      }
    } else if (storedEventId) {
      console.log('[RegistrantPortalLayout] No event in query, using stored eventId:', storedEventId, '. Will update URL.');
      if (!hasEventAccess(storedEventId)) {
        console.warn(`[RegistrantPortalLayout] Registrant does not have access to event ${storedEventId}`);
        navigate('/registrant-portal/auth/login');
        return;
      }
      const currentPath = window.location.pathname;
      navigate(`${currentPath}?event=${storedEventId}`, { replace: true });
    } else {
      console.warn('[RegistrantPortalLayout] No event ID found in URL query or localStorage. Portal may not function correctly.');
      navigate('/registrant-portal/auth/login');
    }
  }, [eventIdFromQuery, navigate, hasEventAccess]);

  return (
    <ActiveEventProvider eventIdFromQuery={eventIdFromQuery}>
      <LayoutContent />
    </ActiveEventProvider>
  );
};

export default RegistrantPortalLayout; 