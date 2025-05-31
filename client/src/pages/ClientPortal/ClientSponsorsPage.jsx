import React, { useEffect, useState } from 'react';
import apiClient from '../../services/apiClient';
import { useClientAuth } from '../../contexts/ClientAuthContext';
// TODO: Integrate with client portal sponsors API and context

const ClientSponsorsPage = () => {
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { event } = useClientAuth();

  useEffect(() => {
    const fetchSponsors = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = event?._id ? { eventId: event._id } : {};
        const res = await apiClient.get('/client-portal-auth/me/sponsors', { params });
        if (res.data && res.data.success) {
          setSponsors(res.data.data || res.data.sponsors || []);
        } else {
          setError(res.data?.message || 'Failed to load sponsors.');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load sponsors.');
      } finally {
        setLoading(false);
      }
    };
    fetchSponsors();
  }, [event]);

  if (loading) return <div className="text-center text-blue-700">Loading sponsors...</div>;
  if (error) return <div className="text-center text-red-600">{error}</div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-blue-900 mb-1">Sponsors</h1>
        <p className="text-gray-600">Read-only list of event sponsors.</p>
      </div>
      <div className="overflow-x-auto bg-white rounded shadow">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-100 text-gray-700">
              <th className="px-4 py-2 text-left">Company Name</th>
              <th className="px-4 py-2 text-left">Authorized Person</th>
              <th className="px-4 py-2 text-left">Email</th>
              <th className="px-4 py-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {sponsors.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-8 text-gray-400">No sponsors found.</td></tr>
            ) : sponsors.map((s, i) => (
              <tr key={s._id || i} className="border-b">
                <td className="px-4 py-2">{s.companyName}</td>
                <td className="px-4 py-2">{s.authorizedPerson}</td>
                <td className="px-4 py-2">{s.email}</td>
                <td className="px-4 py-2">{s.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ClientSponsorsPage; 