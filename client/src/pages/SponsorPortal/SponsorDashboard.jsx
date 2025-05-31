import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spinner, Alert, Button, Card } from '../../components/common';
import sponsorAuthService from '../../services/sponsorAuthService';

const SponsorDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await sponsorAuthService.getSponsorDashboard();
        setDashboard(res.data);
      } catch (err) {
        setError(err.message || 'Failed to load dashboard.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-full"><Spinner size="lg" /> <span className="ml-2">Loading dashboard...</span></div>;
  }
  if (error) {
    return <Alert variant="danger" title="Error">{error}</Alert>;
  }
  if (!dashboard) {
    return <Alert variant="info">No dashboard data found.</Alert>;
  }

  const used = dashboard.registrantCount || 0;
  const total = dashboard.registrantAllotment || 0;
  const percent = total > 0 ? Math.round((used / total) * 100) : 0;
  const progressColor = percent < 80 ? 'bg-blue-600' : percent < 100 ? 'bg-yellow-500' : 'bg-red-600';

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Sponsor Dashboard</h1>
      <Card className="mb-8">
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">{dashboard.companyName}</h2>
              <div className="text-sm text-gray-500">Sponsor ID: <span className="font-mono text-gray-700">{dashboard.sponsorId}</span></div>
              <div className="text-sm text-gray-500">Authorized Person: {dashboard.authorizedPerson}</div>
              <div className="text-sm text-gray-500">Email: {dashboard.email}</div>
              <div className="text-sm text-gray-500">Phone: {dashboard.displayPhoneNumber || 'N/A'}</div>
              <div className="text-sm text-gray-500">Status: <span className={dashboard.status === 'Active' ? 'text-green-700' : 'text-red-700'}>{dashboard.status}</span></div>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-4xl font-bold text-blue-800">{used} / {total}</div>
              <div className="text-sm text-gray-600">Registrants Used / Allocated</div>
              <div className="w-40 h-3 bg-gray-200 rounded-full mt-2">
                <div className={`h-3 rounded-full transition-all duration-300 ${progressColor}`} style={{ width: `${percent}%` }}></div>
              </div>
              <div className="text-xs text-gray-500 mt-1">{percent}% used</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 mt-6">
            <Button variant="primary" onClick={() => navigate('/sponsor-portal/registrants')}>My Registrants</Button>
            <Button variant="outline" onClick={() => navigate('/sponsor-portal/registrants/import')}>Bulk Import</Button>
            <Button variant="outline" onClick={() => window.open('/api/sponsor-portal-auth/me/registrants/export', '_blank')}>Export</Button>
          </div>
        </div>
      </Card>
      {dashboard.description && (
        <Card className="mb-4">
          <div className="p-4 text-gray-700">
            <div className="font-semibold mb-1">Sponsor Notes</div>
            <div>{dashboard.description}</div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default SponsorDashboard; 