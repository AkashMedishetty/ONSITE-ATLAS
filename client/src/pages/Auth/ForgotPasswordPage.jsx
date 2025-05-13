import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Input, Button, Alert } from '../../components/common';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [emailSent, setEmailSent] = useState(false);
  
  const handleChange = (e) => {
    setEmail(e.target.value);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setStatus({
        type: 'error',
        message: 'Please enter your email address'
      });
      return;
    }
    
    if (!/\S+@\S+\.\S+/.test(email)) {
      setStatus({
        type: 'error',
        message: 'Please enter a valid email address'
      });
      return;
    }
    
    setLoading(true);
    try {
      // Mock API call to request password reset
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate success response
      setEmailSent(true);
      setStatus({
        type: 'success',
        message: 'Password reset instructions have been sent to your email'
      });
    } catch (error) {
      console.error('Error requesting password reset:', error);
      setStatus({
        type: 'error',
        message: 'Failed to send reset email. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">
        Reset your password
      </h2>
      
      {status && (
        <Alert 
          type={status.type} 
          message={status.message} 
          className="mb-4"
          onClose={() => setStatus(null)}
        />
      )}
      
      {!emailSent ? (
        <>
          <p className="text-sm text-gray-600 mb-6">
            Enter your email address and we'll send you a link to reset your password.
          </p>
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <Input
                label="Email address"
                type="email"
                name="email"
                id="email"
                value={email}
                onChange={handleChange}
                required
                autoComplete="email"
              />
            </div>
            
            <div>
              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send reset link'}
              </Button>
            </div>
          </form>
        </>
      ) : (
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-gray-700 mb-4">
            We've sent the reset link to <strong>{email}</strong>
          </p>
          <p className="text-sm text-gray-600 mb-6">
            If you don't see the email, check other places it might be, like your junk, spam, social, or other folders.
          </p>
          <Button
            onClick={() => {
              setEmailSent(false);
              setEmail('');
              setStatus(null);
            }}
            variant="outline"
          >
            Try another email
          </Button>
        </div>
      )}
      
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Remember your password?{' '}
          <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage; 