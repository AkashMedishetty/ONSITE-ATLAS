import React, { useState, useEffect } from 'react';
import sponsorAuthService from '../../services/sponsorAuthService';
import { Spinner, Alert, Button, Card } from '../../components/common';
import { useNavigate } from 'react-router-dom';

const SponsorProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const data = await sponsorAuthService.getProfile();
        setProfile(data);
      } catch (err) {
        setError(err.message || 'Failed to load profile. Please try logging out and back in.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) return <div className="flex justify-center items-center h-full"><Spinner size="lg" /> <span className="ml-2">Loading profile...</span></div>;
  if (error) return <Alert variant="danger" title="Error">{error}</Alert>;
  if (!profile) return <Alert variant="info">No profile data found.</Alert>;

  const renderDetail = (label, value) => (
    <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4">
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{value || 'N/A'}</dd>
    </div>
  );

  return (
    <div className="container mx-auto max-w-2xl p-4">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">My Sponsor Profile</h1>
      <Card>
        <div className="px-4 py-5 sm:px-6 bg-gray-50">
          <h3 className="text-lg leading-6 font-medium text-gray-900">{profile.companyName}</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Sponsorship Details</p>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-200">
            {renderDetail('Sponsor ID', profile.sponsorId)}
            {renderDetail('Authorized Person', profile.authorizedPerson)}
            {renderDetail('Email Address', profile.email)}
            {renderDetail('Display Phone Number', profile.displayPhoneNumber)}
            {renderDetail('Sponsoring Amount', profile.sponsoringAmount ? `$${profile.sponsoringAmount}` : 'N/A')}
            {renderDetail('Registrant Allotment', profile.registrantAllotment)}
            {renderDetail('Status', profile.status)}
            {renderDetail('Description / Notes', profile.description)}
          </dl>
        </div>
      </Card>
      <div className="mt-6 flex justify-end">
        <Button variant="outline" onClick={() => navigate('/sponsor-portal/dashboard')}>Back to Dashboard</Button>
      </div>
    </div>
  );
};

export default SponsorProfilePage; 