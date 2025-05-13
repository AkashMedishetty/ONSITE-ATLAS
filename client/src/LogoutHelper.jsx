import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const LogoutHelper = () => {
  const navigate = useNavigate();
  const [authStatus, setAuthStatus] = useState(null);

  // Function to clear all tokens and auth data
  const clearTokens = () => {
    // Clear localStorage items
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('currentEvent');
    localStorage.removeItem('permissions');
    localStorage.removeItem('lastActivity');
    
    // Clear axios default headers
    delete axios.defaults.headers.common['Authorization'];
    
    // Clear sessionStorage as well
    sessionStorage.clear();
    
    console.log('All authentication tokens and data have been cleared');
    
    setAuthStatus('Tokens cleared');
  };

  // Function to navigate to login page
  const goToLogin = () => {
    clearTokens();
    navigate('/login');
  };

  // Function to check authentication status
  const checkAuthStatus = () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    const axiosAuth = axios.defaults.headers.common['Authorization'];
    
    setAuthStatus(`
      Token exists: ${!!token}
      User data exists: ${!!user}
      Axios auth header: ${!!axiosAuth ? 'Yes' : 'No'}
    `);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
        <h1 className="mb-6 text-2xl font-bold text-center text-gray-800">Auth Troubleshooting</h1>
        
        <div className="flex flex-col gap-4">
          <button
            onClick={clearTokens}
            className="px-4 py-2 text-white bg-red-600 rounded hover:bg-red-700"
          >
            Clear Auth Tokens
          </button>
          
          <button
            onClick={goToLogin}
            className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
          >
            Clear Tokens & Go to Login
          </button>
          
          <button
            onClick={checkAuthStatus}
            className="px-4 py-2 text-white bg-green-600 rounded hover:bg-green-700"
          >
            Check Auth Status
          </button>
        </div>
        
        {authStatus && (
          <div className="p-4 mt-4 overflow-auto text-sm bg-gray-100 rounded whitespace-pre-wrap">
            {authStatus}
          </div>
        )}
        
        <div className="p-4 mt-6 text-sm text-gray-700 bg-yellow-100 rounded">
          <h2 className="mb-2 font-bold">Troubleshooting Tips:</h2>
          <ul className="ml-4 list-disc">
            <li>If you're experiencing 401 errors, clear tokens and try logging in again</li>
            <li>Check that your API is running on the correct port</li>
            <li>Verify that login endpoints are working correctly</li>
            <li>Ensure token storage is consistent across the application</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default LogoutHelper; 