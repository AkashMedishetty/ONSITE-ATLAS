import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
// import axios from 'axios'; // Remove global axios import
import api from '../services/api'; // Import the configured api instance

const AuthContext = createContext();

// Token name constant for consistency
const TOKEN_NAME = 'token';

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        const token = localStorage.getItem(TOKEN_NAME);
        
        if (token) {
          // Set default header on the imported instance if token found
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          // const response = await axios.get('/api/v1/auth/me'); // Use api instance
          const response = await api.get('/auth/me'); // Use api instance (adjust path relative to base URL)
          setCurrentUser(response.data.data); // Assuming response has { success: true, data: user }
          console.log('[AuthContext] setCurrentUser called in checkLoggedIn with:', response.data.data); // Added log
        } else {
            delete api.defaults.headers.common['Authorization']; // Clear header if no token
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        localStorage.removeItem(TOKEN_NAME);
        // delete axios.defaults.headers.common['Authorization'];
        delete api.defaults.headers.common['Authorization']; // Use api instance
      } finally {
        setLoading(false);
      }
    };
    
    checkLoggedIn();
  }, []);
  
  const login = async (email, password) => {
    try {
      setError('');
      // Adjust path: baseURL is '/api', so endpoint is '/auth/login'
      const response = await api.post('/auth/login', { email, password }); 
      
      console.log('[AuthContext] Login response:', response.data);
      
      // Check if response contains user data directly
      if (response.data && response.data.token) { 
        const { token, user } = response.data;
        
        localStorage.setItem(TOKEN_NAME, token);
        console.log(`[AuthContext] Token stored in localStorage: ${token ? 'Yes' : 'No'}, Value: ${token?.substring(0, 10)}...`);
        
        // Set default header on the imported instance
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        console.log('[AuthContext] Default Axios header set.');
        
        // Store the user data
        setCurrentUser(user);
        console.log('[AuthContext] User data set in state:', user);
        
        return user; // Return the user object on success
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
    delete api.defaults.headers.common['Authorization']; // Use api instance
    setCurrentUser(null);
    console.log('[AuthContext] User logged out, currentUser set to null.'); // Added log
  };
  
  // Log the state variable currentUser directly before useMemo
  console.log('[AuthContext] State currentUser before useMemo:', currentUser);
  
  const value = useMemo(() => {
    // Log what goes into the memoized value
    console.log('[AuthContext] useMemo creating value. currentUser going in:', currentUser, 'isAuthenticated derived:', !!currentUser);
    return {
      user: currentUser, // Changed key name to 'user' for clarity
      login,
      logout,
      error,
      isAuthenticated: !!currentUser,
      loading
    };
  }, [currentUser, error, loading]); // Dependencies for useMemo
  
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 