import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext'; // Assuming useAuth handles general user login
import { toast } from 'react-hot-toast';

const ReviewerLoginPage = () => {
  const navigate = useNavigate();
  const { eventId } = useParams(); // Get eventId from URL
  const { login } = useAuth(); // Use the login function from your AuthContext
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!eventId) {
      setError('Event information is missing from the URL. Please use the event-specific link provided to you.');
      // Optionally disable form or further actions
    }
  }, [eventId]); // Run this effect when eventId changes or on initial load

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!eventId) { // Prevent submission if eventId was initially missing
      setError('Cannot log in: Event information is missing from the URL.');
      return;
    }
    setError(''); // Clear previous errors before attempting login
    setLoading(true);
    try {
      // Attempt to log in using the existing login function
      // This function should ideally return user info including roles
      const userData = await login(email, password, eventId);
      
      // IMPORTANT: Add a check here to ensure the logged-in user has a 'reviewer' or 'admin' role
      // This is a client-side check; the backend will enforce API access.
      if (userData && (userData.role === 'reviewer' || userData.role === 'admin')) {
        toast.success('Login successful!');
        navigate('/reviewer/dashboard'); 
      } else {
        // If login is successful but user is not a reviewer/admin, prevent access to reviewer portal
        setError('Access denied. Reviewer or admin credentials required.');
        // Optionally, log them out or redirect to a general page
        // await logout(); // if you have a logout function in useAuth
      }
    } catch (err) {
      if (err.isEventMismatch) { // Check for the custom flag
        setError(err.message); // Display the specific event mismatch error
      } else {
      setError(err.message || 'Failed to log in. Please check your credentials.');
      }
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-xl">
        <h2 className="text-2xl font-bold text-center text-gray-700">Reviewer Portal Login</h2>
        
        {/* Display general error / eventId missing error here */} 
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {/* Conditionally render form or just show error if eventId was critical and missing */}
        {/* For now, form is always rendered but submit is blocked if eventId missing */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="text-sm font-medium text-gray-700 block">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="password" className="text-sm font-medium text-gray-700 block">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </div>
        </form>
        <p className="text-center text-sm text-gray-500">
          Forgot your password? 
          <Link to="/forgot-password" className="font-medium text-indigo-600 hover:text-indigo-500">
            Reset it here
          </Link>
          {/* Or a reviewer specific password reset if needed */}
        </p>
      </div>
    </div>
  );
};

export default ReviewerLoginPage; 