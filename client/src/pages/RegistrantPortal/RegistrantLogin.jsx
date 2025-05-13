import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useRegistrantAuth } from '../../contexts/RegistrantAuthContext.jsx';

const RegistrantLogin = () => {
  const [registrationId, setRegistrationId] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [eventId, setEventId] = useState(null);
  const [pageError, setPageError] = useState(null);
  
  const { login, error: authError } = useRegistrantAuth();
  const location = useLocation();

  // Extract eventId from URL query parameter
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const eventIdFromUrl = params.get('event');
    if (eventIdFromUrl) {
      setEventId(eventIdFromUrl);
      setPageError(null);
      console.log('[RegistrantLogin] Event ID from URL:', eventIdFromUrl);
    } else {
      console.error('[RegistrantLogin] Event ID missing from URL query parameter (?event=)');
      setPageError('Event context is missing. Please access this login page via a specific event link.');
      setEventId(null);
    }
  }, [location.search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (pageError || !eventId) {
       console.error('Login prevented: Event ID is missing.');
       return;
    }
    if (!registrationId || !mobileNumber) {
      return;
    }
    
    try {
      setLoading(true);
      console.log('Attempting login with:', { registrationId, mobileNumber, eventId });
      
      // Pass eventId to the login function
      const result = await login(registrationId, mobileNumber, eventId);
      console.log('Login result:', result);
      
      if (result && result.success) {
        console.log('Login successful.');
        
        // Get the event ID from the response data
        const eventId = result.data?.defaultEventId || result.data?.eventId;
        
        if (eventId) {
          // Store the event ID in localStorage for ActiveEventContext
          localStorage.setItem('activeEventId', eventId);
          console.log('Stored event ID in localStorage:', eventId);
        }
        
        // Construct the redirect URL with the event ID if available
        const redirectUrl = eventId 
          ? `/registrant-portal?event=${eventId}`
          : '/registrant-portal';
          
        console.log('Redirecting to:', redirectUrl);
        
        // Use window.location.replace for a hard redirect that forces a complete page reload
        // This is more forceful than window.location.href
        const fullUrl = window.location.origin + redirectUrl;
        console.log('Full redirect URL:', fullUrl);
        
        // Add a small delay to ensure all localStorage operations complete
        setTimeout(() => {
          window.location.replace(fullUrl);
        }, 100);
      } else {
        console.error('Login failed:', result?.error || 'Unknown error');
      }
    } catch (err) {
      console.error('Login error in component:', err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 px-4">
      <div className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg">
        <div className="text-center mb-2">
          <div className="flex justify-center mb-3">
            <div className="bg-blue-600 text-white p-3 rounded-full shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 sm:h-10 sm:w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Sign in to your account
          </h2>
          <p className="text-sm sm:text-base text-gray-600">
            Access your abstract submissions and registration information
          </p>
        </div>
        
        {authError && (
          <div className="bg-red-50 border-l-4 border-red-400 p-3 rounded-md shadow mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{authError}</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="bg-white p-4 rounded-md shadow border border-gray-200 mb-4">
          <div className="text-sm text-gray-600">
            <p className="font-medium text-blue-600 mb-2">Login Instructions:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Enter your <strong>Registration ID</strong> (format: REG-XXXX)</li>
              <li>Use your <strong>Mobile Number</strong> as your password</li>
              <li>Mobile number should match what you provided during registration</li>
            </ul>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-lg p-4 sm:p-6 mb-4">
          <div className="space-y-4">
            <div>
              <label htmlFor="registrationId" className="block text-sm font-medium text-gray-700 mb-1">
                Registration ID
              </label>
              <input
                id="registrationId"
                name="registrationId"
                type="text"
                autoComplete="off"
                required
                value={registrationId}
                onChange={(e) => setRegistrationId(e.target.value)}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 text-sm sm:text-base shadow-sm"
                placeholder="e.g. REG-1234"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="mobileNumber" className="block text-sm font-medium text-gray-700">
                  Mobile Number
                </label>
                <Link to="/registrant-portal/auth/forgot-password" className="text-xs sm:text-sm font-medium text-blue-600 hover:text-blue-500">
                  Can't login?
                </Link>
              </div>
              <input
                id="mobileNumber"
                name="mobileNumber"
                type="text"
                autoComplete="tel"
                required
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 text-sm sm:text-base shadow-sm"
                placeholder="Enter your mobile number"
              />
            </div>
          </div>

          <div className="mt-4 sm:mt-6">
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 sm:py-3 px-4 border border-transparent text-sm sm:text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {loading ? (
                <>
                  <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                    <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </span>
                  Signing in...
                </>
              ) : "Sign in"}
            </button>
          </div>
        </form>
        
        <div className="text-center mt-2">
          <p className="text-xs sm:text-sm text-gray-600">
            Need help? Contact the event organizer or support team.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegistrantLogin; 
                     