import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card, Button, Input, Alert, Spinner } from '../../components/common';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import sponsorAuthService from '../../services/sponsorAuthService'; // Import the service

const SponsorLoginPortal = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [sponsorIdInput, setSponsorIdInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // No welcome card logic here
  }, [eventId]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    if (!sponsorIdInput.trim() || !passwordInput.trim()) {
      setError('Sponsor ID and Password are required.');
      setLoading(false);
      return;
    }
    const trimmedSponsorId = sponsorIdInput.trim();
    const processedPassword = passwordInput.trim(); 
    try {
      await sponsorAuthService.login(eventId, trimmedSponsorId, processedPassword);
      navigate('/sponsor-portal/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid Sponsor ID or Password. Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Only show login form
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <img 
            className="mx-auto h-12 w-auto" 
            src="/logo.png" // Replace with your actual logo path
            alt="Application Logo" 
        />
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sponsor Portal Login
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Event ID: {eventId}
        </p>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <div className="p-8 space-y-6">
            {error && (
              <Alert variant="danger" title="Login Failed">
                {error}
              </Alert>
            )}
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label htmlFor="sponsorId" className="block text-sm font-medium text-gray-700">
                  Sponsor ID
                </label>
                <div className="mt-1">
                  <Input
                    id="sponsorId"
                    name="sponsorId"
                    type="text"
                    autoComplete="username"
                    required
                    value={sponsorIdInput}
                    onChange={(e) => setSponsorIdInput(e.target.value)}
                    placeholder="e.g., SPN-EVENTCODE-001"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password (Your Contact Phone)
                </label>
                <div className="mt-1 relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="10-digit phone number"
                    className="pr-10" 
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 text-gray-500 hover:text-gray-700"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  {/* Optional: Add forgot password or help link here */}
                </div>
              </div>
              <div>
                <Button type="submit" variant="primary" className="w-full" disabled={loading}>
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <Spinner size="sm" className="mr-2" />
                      Logging in...
                    </div>
                  ) : (
                    'Login'
                  )}
                </Button>
              </div>
            </form>
            <div className="mt-6 text-center text-sm text-gray-500">
                Need help? <Link to="/contact-support" className="font-medium text-primary-600 hover:text-primary-500">Contact Support</Link>
            </div>
          </div>
        </Card>
        <div className="mt-4 text-center">
            <Link to="/"> 
                <Button variant="ghost" size="sm">
                    &larr; Back to Main Site
                </Button>
            </Link>
        </div>
      </div>
    </div>
  );
};

export default SponsorLoginPortal; 