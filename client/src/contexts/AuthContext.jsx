import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
// import axios from 'axios'; // Remove global axios import
import api from '../services/api'; // Import the configured api instance

const AuthContext = createContext();

// Token name constant for consistency
const TOKEN_NAME = 'token';
const EVENT_ID_KEY = 'currentEventId'; // Key for localStorage

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentEventId, setCurrentEventId] = useState(null); // New state for eventId
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        const token = localStorage.getItem(TOKEN_NAME);
        const storedEventId = localStorage.getItem(EVENT_ID_KEY); // Load eventId
        
        if (token) {
          // Set default header on the imported instance if token found
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          // const response = await axios.get('/api/v1/auth/me'); // Use api instance
          const response = await api.get('/auth/me'); // Use api instance (adjust path relative to base URL)
          setCurrentUser(response.data.data); // Assuming response has { success: true, data: user }
          if (storedEventId) { // Set eventId if found in storage
            setCurrentEventId(storedEventId);
            console.log('[AuthContext] EventId loaded from localStorage:', storedEventId);
          }
          console.log('[AuthContext] setCurrentUser called in checkLoggedIn with:', response.data.data); // Added log
        } else {
            delete api.defaults.headers.common['Authorization']; // Clear header if no token
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        localStorage.removeItem(TOKEN_NAME);
        localStorage.removeItem(EVENT_ID_KEY); // Clear eventId on auth check fail
        // delete axios.defaults.headers.common['Authorization'];
        delete api.defaults.headers.common['Authorization']; // Use api instance
        setCurrentEventId(null); // Clear eventId state
      } finally {
        setLoading(false);
      }
    };
    
    checkLoggedIn();
  }, []);
  
  const login = async (email, password, eventIdFromUrl) => {
    try {
      setError('');
      const response = await api.post('/auth/login', { email, password }); 
      
      console.log('[AuthContext] Login response:', response.data);
      
      if (response.data && response.data.token) { 
        const { token, user } = response.data;

        // Event Mismatch Check
        if (eventIdFromUrl && user && user.assignedEventIds && Array.isArray(user.assignedEventIds) && user.assignedEventIds.length > 0) {
          if (!user.assignedEventIds.includes(eventIdFromUrl)) {
            const mismatchError = new Error(
              `Your account is not assigned to this event portal (Event ID: ${eventIdFromUrl}). Please use the correct event-specific link.`
            );
            mismatchError.isEventMismatch = true;
            setError(mismatchError.message);
            // Do NOT set currentUser or currentEventId here, let the error propagate
            throw mismatchError; 
          }
        }
        // If no eventIdFromUrl, or no user.assignedEventIds to check against, or if it's a match, proceed.
        
        localStorage.setItem(TOKEN_NAME, token);
        console.log(`[AuthContext] Token stored in localStorage: ${token ? 'Yes' : 'No'}, Value: ${token?.substring(0, 10)}...`);
        
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        console.log('[AuthContext] Default Axios header set.');
        
        setCurrentUser(user);
        console.log('[AuthContext] User data set in state:', user);
        
        // Set currentEventId only if it passes the mismatch check or if no check was performed
        if (eventIdFromUrl) { 
          localStorage.setItem(EVENT_ID_KEY, eventIdFromUrl);
          setCurrentEventId(eventIdFromUrl);
          console.log('[AuthContext] EventId set during login:', eventIdFromUrl);
        } else {
          // If no eventId from URL, clear any existing one, as context is now ambiguous
          localStorage.removeItem(EVENT_ID_KEY);
          setCurrentEventId(null);
          console.log('[AuthContext] No eventId from login URL, cleared currentEventId.');
        }
        
        // --- REDIRECT LOGIC ---
        const redirect = localStorage.getItem('redirectAfterLogin');
        if (redirect) {
          localStorage.removeItem('redirectAfterLogin');
          window.location.href = redirect;
        } else if (user && (user.role === 'reviewer' || user.role === 'admin')) {
          window.location.href = '/reviewer/dashboard';
        } else {
          window.location.href = '/dashboard'; // fallback for other roles
        }
        
        return user;
      } else {
        // Handle cases where API returns unexpected format
        const message = response.data?.message || 'Login failed: Invalid response from server';
        setError(message);
        throw new Error(message);
      }

    } catch (err) {
        // Log the actual error received from Axios
        console.error("Login API call error:", err);

        // Extract error message from backend response if available
        const message = err.response?.data?.message || err.message || 'Failed to login';
        setError(message);
        throw err; // Re-throw the error so the component can catch it
    }
  };
  
  const logout = () => {
    localStorage.removeItem(TOKEN_NAME);
    localStorage.removeItem(EVENT_ID_KEY); // Clear eventId from storage
    delete api.defaults.headers.common['Authorization']; // Use api instance
    setCurrentUser(null);
    setCurrentEventId(null); // Clear eventId from state
    console.log('[AuthContext] User logged out, currentUser and currentEventId set to null.'); // Added log
  };
  
  // Log the state variable currentUser directly before useMemo
  console.log('[AuthContext] State currentUser before useMemo:', currentUser);
  console.log('[AuthContext] State currentEventId before useMemo:', currentEventId); // Log eventId state
  
  const value = useMemo(() => {
    // Log what goes into the memoized value
    console.log('[AuthContext] useMemo creating value. currentUser going in:', currentUser, 'currentEventId:', currentEventId, 'isAuthenticated derived:', !!currentUser);
    return {
      user: currentUser, // Changed key name to 'user' for clarity
      currentEventId, // Provide currentEventId in context
      setCurrentEventId,
      login,
      logout,
      error,
      isAuthenticated: !!currentUser,
      loading
    };
  }, [currentUser, currentEventId, setCurrentEventId, error, loading]); // Dependencies for useMemo
  
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 