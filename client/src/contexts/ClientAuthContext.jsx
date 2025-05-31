import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../services/apiClient';

const ClientAuthContext = createContext();

export const useClientAuth = () => useContext(ClientAuthContext);

const CLIENT_TOKEN_KEY = 'client_jwt_token';
const CLIENT_EVENT_ID_KEY = 'client_event_id';

export const ClientAuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem(CLIENT_TOKEN_KEY) || null);
  const [client, setClient] = useState(null);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, always restore event context if possible
  useEffect(() => {
    const storedToken = localStorage.getItem(CLIENT_TOKEN_KEY);
    const storedEventId = localStorage.getItem(CLIENT_EVENT_ID_KEY);
    if (storedToken && storedEventId) {
      setToken(storedToken);
      setClient({}); // Optionally fetch client info if needed
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      fetchEventDetails(storedEventId).finally(() => setLoading(false));
    } else {
      setToken(null);
      setClient(null);
      setEvent(null);
      delete apiClient.defaults.headers.common['Authorization'];
      setLoading(false);
    }
  }, []);

  // Fetch event details by ID
  const fetchEventDetails = async (eventId) => {
    try {
      const res = await fetch(`/api/events/${eventId}`);
      const data = await res.json();
      if (data && data.success && data.data) {
        setEvent(data.data);
      } else {
        setEvent(null);
      }
    } catch (err) {
      setEvent(null);
    }
  };

  // Updated login to fetch event details and persist eventId
  const login = async (jwt, clientInfo, eventId) => {
    setToken(jwt);
    localStorage.setItem(CLIENT_TOKEN_KEY, jwt);
    setClient(clientInfo);
    // Set the default Authorization header for all requests
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${jwt}`;
    if (eventId) {
      localStorage.setItem(CLIENT_EVENT_ID_KEY, eventId);
      await fetchEventDetails(eventId);
    } else if (clientInfo && clientInfo.event) {
      localStorage.setItem(CLIENT_EVENT_ID_KEY, clientInfo.event);
      await fetchEventDetails(clientInfo.event);
    } else {
      localStorage.removeItem(CLIENT_EVENT_ID_KEY);
      setEvent(null);
    }
  };

  const logout = () => {
    setToken(null);
    setClient(null);
    setEvent(null);
    localStorage.removeItem(CLIENT_TOKEN_KEY);
    localStorage.removeItem(CLIENT_EVENT_ID_KEY);
    // Remove the Authorization header on logout
    delete apiClient.defaults.headers.common['Authorization'];
  };

  const isAuthenticated = !!token;

  return (
    <ClientAuthContext.Provider value={{ token, client, event, login, logout, isAuthenticated: !!token, loading }}>
      {loading ? <div className="flex items-center justify-center h-screen text-lg text-gray-500">Loading client context...</div> : children}
    </ClientAuthContext.Provider>
  );
}; 