import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiRegistrant from '../services/apiRegistrant'; // Assuming apiRegistrant is suitable

const ActiveEventContext = createContext();

export const useActiveEvent = () => {
  return useContext(ActiveEventContext);
};

const EVENT_ID_STORAGE_KEY = 'activeEventId';

// Helper to get eventId from query param
function getEventIdFromQuery() {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    return params.get('event');
  }
  return null;
}

export const ActiveEventProvider = ({ children }) => {
  const [activeEventId, setActiveEventId] = useState(() => {
    // 1. Prioritize eventId from query param if present
    const eventIdFromQuery = getEventIdFromQuery();
    if (eventIdFromQuery) {
      localStorage.setItem(EVENT_ID_STORAGE_KEY, eventIdFromQuery);
      return eventIdFromQuery;
    }
    // 2. Fallback to localStorage if eventIdFromQuery is not present
    const storedEventId = localStorage.getItem(EVENT_ID_STORAGE_KEY);
    return storedEventId || null;
  });

  const [activeEventDetails, setActiveEventDetails] = useState(null);
  const [isLoadingEventDetails, setIsLoadingEventDetails] = useState(false);
  const [eventDetailsError, setEventDetailsError] = useState(null);
  const [isSyncingEventId, setIsSyncingEventId] = useState(false);

  // Always sync eventId from query param if it changes
  useEffect(() => {
    const eventIdFromQuery = getEventIdFromQuery();
    if (eventIdFromQuery && eventIdFromQuery !== activeEventId) {
      setIsSyncingEventId(true);
      setActiveEventId(eventIdFromQuery);
      localStorage.setItem(EVENT_ID_STORAGE_KEY, eventIdFromQuery);
      setIsSyncingEventId(false);
      console.log(`[ActiveEventContext] Updated activeEventId to ${eventIdFromQuery} from query param and saved to localStorage.`);
    }
  }, [activeEventId]);

  useEffect(() => {
    const fetchEventDetails = async () => {
      if (!activeEventId) {
        setActiveEventDetails(null);
        setEventDetailsError(null);
        return;
      }
      setIsLoadingEventDetails(true);
      setEventDetailsError(null);
      try {
        console.log(`[ActiveEventContext] Fetching event details for ID: ${activeEventId}`);
        // Ensure this endpoint returns the full event object including abstractSettings.categories and subTopics
        const response = await apiRegistrant.get(`/events/${activeEventId}`);
        if (response.data && response.data.success && response.data.data) {
          setActiveEventDetails(response.data.data);
          console.log('[ActiveEventContext] Event details loaded:', response.data.data);
        } else {
          const errorMsg = response.data?.message || 'Failed to load event details from context';
          console.error('[ActiveEventContext] Error fetching event details:', errorMsg, response.data);
          setEventDetailsError(errorMsg);
          setActiveEventDetails(null);
        }
      } catch (error) {
        const errorMsg = error.response?.data?.message || error.message || 'An error occurred while loading event details from context.';
        console.error('[ActiveEventContext] Catch Error fetching event details:', error);
        setEventDetailsError(errorMsg);
        setActiveEventDetails(null);
      } finally {
        setIsLoadingEventDetails(false);
      }
    };

    fetchEventDetails();
  }, [activeEventId]);

  // Function to explicitly set/update the active event ID
  const updateActiveEventId = useCallback((newEventId) => {
    if (newEventId) {
      localStorage.setItem(EVENT_ID_STORAGE_KEY, newEventId);
      setActiveEventId(newEventId); // This will trigger the useEffect above to fetch details
      console.log(`[ActiveEventContext] Manually updated activeEventId to ${newEventId} and saved to localStorage.`);
    } else {
      localStorage.removeItem(EVENT_ID_STORAGE_KEY);
      setActiveEventId(null);
      setActiveEventDetails(null); // Clear details when ID is cleared
      setEventDetailsError(null);
      console.log('[ActiveEventContext] Cleared activeEventId and details from localStorage.');
    }
  }, []);

  return (
    <ActiveEventContext.Provider value={{ 
      activeEventId, 
      updateActiveEventId,
      activeEventDetails,
      isLoadingEventDetails,
      eventDetailsError,
      isSyncingEventId
    }}>
      {children}
    </ActiveEventContext.Provider>
  );
}; 