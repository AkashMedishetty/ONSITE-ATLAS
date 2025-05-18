import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { REGISTRANT_TOKEN_KEY } from '../config';
import apiRegistrant from '../services/apiRegistrant';
import { login as registrantLogin, logout as registrantLogout } from '../services/registrantPortalService';
import registrantPortalService from '../services/registrantPortalService';

// Create the context
const RegistrantAuthContext = createContext(null);

// Custom hook for easier context consumption
export const useRegistrantAuth = () => {
  const context = useContext(RegistrantAuthContext);
  if (!context) {
    throw new Error('useRegistrantAuth must be used within a RegistrantAuthProvider');
  }
  return context;
};

// Provider component
export const RegistrantAuthProvider = ({ children }) => {
  const [currentRegistrant, setCurrentRegistrant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [registrantEventId, setRegistrantEventId] = useState(null);

  // Load registrant data from localStorage on mount
  useEffect(() => {
    const loadRegistrantData = () => {
      try {
        // Load registrant data
        const storedData = localStorage.getItem('registrantData');
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          setCurrentRegistrant(parsedData);
          
          // Set Authorization header for apiRegistrant if token exists
          if (parsedData.token) {
            apiRegistrant.defaults.headers.common['Authorization'] = `Bearer ${parsedData.token}`;
            // Ensure token is also set in REGISTRANT_TOKEN_KEY for interceptors
            if (!localStorage.getItem(REGISTRANT_TOKEN_KEY)) {
              localStorage.setItem(REGISTRANT_TOKEN_KEY, parsedData.token);
            }
            console.log('[RegistrantAuthContext] Set Authorization header in apiRegistrant from localStorage token');
          }
          
          // Try to get event ID from registrant data first
          let eventId = parsedData.defaultEventId || parsedData.eventId;
          
          // If not found in registrant data, try to get from localStorage directly
          if (!eventId) {
            eventId = localStorage.getItem('registrantEventId');
            if (eventId) {
              console.log(`[RegistrantAuthContext] Loaded registrantEventId from localStorage: ${eventId}`);
            }
          } else {
            console.log(`[RegistrantAuthContext] Using eventId from registrant data: ${eventId}`);
          }
          
          // Also check activeEventId as a fallback
          if (!eventId) {
            eventId = localStorage.getItem('activeEventId');
            if (eventId) {
              console.log(`[RegistrantAuthContext] Using activeEventId as fallback: ${eventId}`);
            }
          }
          
          // Set the event ID if we found one
          if (eventId) {
            setRegistrantEventId(eventId);
          } else {
            console.warn('[RegistrantAuthContext] No event ID found in localStorage');
          }
        }
      } catch (err) {
        console.error('Error loading registrant data:', err);
        localStorage.removeItem('registrantData');
        setCurrentRegistrant(null);
        setRegistrantEventId(null);
      }
    };

    loadRegistrantData();
  }, []);

  // New Effect: Finalize loading state only after registrant state is settled
  useEffect(() => {
    console.log("[RegistrantAuthContext] Registrant state settled, setting loading to false. Registrant:", currentRegistrant);
    setLoading(false);
  }, [currentRegistrant]);

  // Function to check if registrant has access to a specific event
  const hasEventAccess = (eventId) => {
    console.log(`[hasEventAccess] Checking access: eventId=${eventId}, registrantEventId=${registrantEventId}, currentRegistrant=`, currentRegistrant);
    
    // If there's no current registrant, they're not logged in
    if (!currentRegistrant) {
      console.error('[hasEventAccess] Access denied: No currentRegistrant - user not logged in');
      return false;
    }
    
    // For debugging, log all the available event IDs
    console.log('[hasEventAccess] Available event IDs:', {
      'from registrantEventId': registrantEventId,
      'from currentRegistrant.defaultEventId': currentRegistrant?.defaultEventId,
      'from localStorage.registrantEventId': localStorage.getItem('registrantEventId'),
      'from localStorage.activeEventId': localStorage.getItem('activeEventId')
    });
    
    // If we don't have an event ID to check against, deny access
    if (!eventId) {
      console.error('[hasEventAccess] Access denied: No eventId provided to check against');
      return false;
    }
    
    // For debugging purposes, be more permissive about which event IDs are valid
    const validEventIds = [
      registrantEventId,
      currentRegistrant?.defaultEventId,
      localStorage.getItem('registrantEventId'),
      localStorage.getItem('activeEventId')
    ].filter(Boolean); // Remove null/undefined values
    
    // If we don't have any valid event IDs to check against, deny access
    if (validEventIds.length === 0) {
      console.error('[hasEventAccess] Access denied: No valid event IDs to check against');
      return false;
    }
    
    // Check if the requested event ID matches any of our valid event IDs
    const hasAccess = validEventIds.includes(eventId);
    console.log(`[hasEventAccess] Access ${hasAccess ? 'granted' : 'denied'}: ${eventId} ${hasAccess ? 'matches' : 'does not match'} one of the valid event IDs`);
    
    return hasAccess;
  };

  const login = useCallback(async (registrationId, mobileNumber, eventId) => {
    try {
      setError(null);
      setLoading(true);
      
      console.log('Attempting login with:', { registrationId, mobileNumber, eventId });
      
      const response = await registrantLogin(registrationId, mobileNumber, eventId);
      console.log('Login response:', response);
      
      if (response.success && response.data) {
        const registrantData = {
          ...response.data,
          token: response.token
        };
        
        // Store in localStorage
        localStorage.setItem('registrantData', JSON.stringify(registrantData));
        // Also store token under REGISTRANT_TOKEN_KEY for API interceptors
        if (registrantData.token) {
          localStorage.setItem(REGISTRANT_TOKEN_KEY, registrantData.token);
        }
        
        // Update state
        setCurrentRegistrant(registrantData);
        
        // Get and set the event ID
        const eventId = registrantData.defaultEventId || registrantData.eventId;
        if (eventId) {
          console.log(`[RegistrantAuthContext] Setting registrantEventId to: ${eventId}`);
          setRegistrantEventId(eventId);
          // Also store in localStorage for persistence
          localStorage.setItem('registrantEventId', eventId);
        } else {
          console.warn('[RegistrantAuthContext] No eventId found in login response');
        }
        
        return { success: true, data: registrantData };
      } else {
        const errorMessage = response.error || 'Login failed. Please check your credentials.';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = err.message || 'An error occurred during login. Please try again.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    try {
      registrantLogout();
      setCurrentRegistrant(null);
      setRegistrantEventId(null);
      setError(null);
      // Preserve event context on logout
      let eventId = registrantEventId || (currentRegistrant && currentRegistrant.defaultEventId) || localStorage.getItem('registrantEventId') || localStorage.getItem('activeEventId');
      if (eventId) {
        window.location.replace(`/registrant-portal/auth/login?event=${eventId}`);
      } else {
        window.location.replace('/registrant-portal/auth/login');
      }
      return { success: true };
    } catch (err) {
      console.error('Logout error:', err);
      return { success: false, error: err.message };
    }
  }, [registrantEventId, currentRegistrant]);

  // Signup function
  const signup = async (name, email, password) => {
    setLoading(true);
    setError(null);
    try {
      // In a real app, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo purposes, always succeed
      // In a real app, you'd validate the data and handle existing users
      
      // Dummy token and user data
      const token = 'dummy-jwt-token-for-registrant';
      const userData = {
        id: '123456',
        name: name,
        email: email,
        phone: null,
        institution: null
      };
      
      // Save token to localStorage
      localStorage.setItem(REGISTRANT_TOKEN_KEY, token);
      
      // Update state
      setCurrentRegistrant(userData);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Update profile function
  const updateProfile = async (profileData) => {
    setLoading(true);
    setError(null);
    try {
      // In a real app, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update current registrant data
      setCurrentRegistrant(prev => ({
        ...prev,
        ...profileData
      }));
      
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Forgot password function
  const forgotPassword = async (email) => {
    setLoading(true);
    setError(null);
    try {
      // In a real app, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo purposes, always succeed
      return { success: true, message: 'Password reset email sent' };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Reset password function
  const resetPassword = async (token, newPassword) => {
    setLoading(true);
    setError(null);
    try {
      // In a real app, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo purposes, always succeed
      return { success: true, message: 'Password has been reset' };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Fetch latest registrant data from backend and update context/localStorage
  const fetchRegistrantData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await registrantPortalService.getCurrentRegistrant();
      if (response && response.status === 'success' && response.data && response.data.registration) {
        const updatedRegistrant = {
          ...response.data.registration,
          token: localStorage.getItem(REGISTRANT_TOKEN_KEY) // preserve token
        };
        setCurrentRegistrant(updatedRegistrant);
        localStorage.setItem('registrantData', JSON.stringify(updatedRegistrant));
        return updatedRegistrant;
      } else {
        setError('Failed to fetch registrant data.');
        return null;
      }
    } catch (err) {
      setError(err.message || 'Error fetching registrant data.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Memoize context value to prevent unnecessary renders
  const value = {
    currentRegistrant,
    loading,
    error,
    login,
    signup,
    logout,
    updateProfile,
    fetchRegistrantData,
    forgotPassword,
    resetPassword,
    hasEventAccess,
    registrantEventId,
    isAuthenticated: !!currentRegistrant
  };

  return (
    <RegistrantAuthContext.Provider value={value}>
      {children}
    </RegistrantAuthContext.Provider>
  );
};

export default RegistrantAuthContext; 
      