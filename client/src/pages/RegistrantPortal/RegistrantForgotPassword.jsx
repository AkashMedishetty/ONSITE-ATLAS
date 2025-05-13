import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useRegistrantAuth } from '../../contexts/RegistrantAuthContext.jsx';

const RegistrantForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  const { forgotPassword, error } = useRegistrantAuth();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    
    try {
      setLoading(true);
      setMessage('');
      await forgotPassword(email);
      setMessage('Password reset link sent to your email');
    } catch (err) {
      console.error('Password reset request failed:', err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">Forgot Password</h1>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md mb-4">
          {error}
        </div>
      )}
      
      {message && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md mb-4">
          {message}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
        <p className="text-gray-600 mb-4">
          Enter your email address and we'll send you a link to reset your password.
        </p>
        
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="email">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div className="flex items-center justify-between mb-4">
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
          
          <Link to="/registrant-portal/auth/login" className="text-sm text-blue-600 hover:text-blue-800">
            Back to Login
          </Link>
        </div>
      </form>
    </div>
  );
};

export default RegistrantForgotPassword; 