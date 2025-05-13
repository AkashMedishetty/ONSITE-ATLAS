import React, { createContext, useContext, useState, useEffect } from 'react';

const ActiveEventContext = createContext();

export const useActiveEvent = () => {
  return useContext(ActiveEventContext);
};

const EVENT_ID_STORAGE_KEY = 'activeEventId';

export const ActiveEventProvider = ({ children, eventIdFromQuery }) => {
  const [activeEventId, setActiveEventId] = useState(() => {
    // 1. Prioritize eventIdFromQuery if present
    if (eventIdFromQuery) {
      localStorage.setItem(EVENT_ID_STORAGE_KEY, eventIdFromQuery);
      return eventIdFromQuery;
    }
    // 2. Fallback to localStorage if eventIdFromQuery is not present
    const storedEventId = localStorage.getItem(EVENT_ID_STORAGE_KEY);
    return storedEventId || null;
  });

  useEffect(() => {
    // This effect handles updates if eventIdFromQuery changes during the component's lifecycle
    // (e.g., navigating to the same portal page but with a different ?event= query)
    if (eventIdFromQuery) {
      if (activeEventId !== eventIdFromQuery) {
        setActiveEventId(eventIdFromQuery);
        localStorage.setItem(EVENT_ID_STORAGE_KEY, eventIdFromQuery);
        console.log(`[ActiveEventContext] Updated activeEventId to ${eventIdFromQuery} from query param and saved to localStorage.`);
      }
    } else if (!activeEventId) {
        // If there's no eventIdFromQuery and no activeEventId (e.g., on fresh load without query param and nothing in storage)
        // we can try to load from storage one last time, though the initial useState should handle this.
        const storedEventId = localStorage.getItem(EVENT_ID_STORAGE_KEY);
        if (storedEventId) {
            setActiveEventId(storedEventId);
            console.log(`[ActiveEventContext] Restored activeEventId ${storedEventId} from localStorage.`);
        }
    }
  }, [eventIdFromQuery, activeEventId]);

  // Function to explicitly set/update the active event ID
  const updateActiveEventId = (newEventId) => {
    if (newEventId) {
      localStorage.setItem(EVENT_ID_STORAGE_KEY, newEventId);
      setActiveEventId(newEventId);
      console.log(`[ActiveEventContext] Manually updated activeEventId to ${newEventId} and saved to localStorage.`);
    } else {
      localStorage.removeItem(EVENT_ID_STORAGE_KEY);
      setActiveEventId(null);
      console.log('[ActiveEventContext] Cleared activeEventId from localStorage.');
    }
  };

  return (
    <ActiveEventContext.Provider value={{ activeEventId, updateActiveEventId }}>
      {children}
    </ActiveEventContext.Provider>
  );
}; 