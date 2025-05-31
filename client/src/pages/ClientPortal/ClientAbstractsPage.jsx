import React, { useEffect, useState } from 'react';
import apiClient from '../../services/apiClient';
import { useClientAuth } from '../../contexts/ClientAuthContext';
// TODO: Integrate with client portal abstracts API and context

const ClientAbstractsPage = () => {
  const [abstracts, setAbstracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { event } = useClientAuth();

  useEffect(() => {
    const fetchAbstracts = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = event?._id ? { eventId: event._id } : {};
        const res = await apiClient.get('/client-portal-auth/me/abstracts', { params });
        if (res.data && res.data.success) {
          setAbstracts(res.data.data || res.data.abstracts || []);
        } else {
          setError(res.data?.message || 'Failed to load abstracts.');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load abstracts.');
      } finally {
        setLoading(false);
      }
    };
    fetchAbstracts();
  }, [event._id]);

  if (loading) return <div className="text-center text-blue-700">Loading abstracts...</div>;
  if (error) return <div className="text-center text-red-600">{error}</div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-blue-900 mb-1">Abstracts</h1>
        <p className="text-gray-600">Read-only list of submitted abstracts for this event.</p>
      </div>
      <div className="overflow-x-auto bg-white rounded shadow">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-100 text-gray-700">
              <th className="px-4 py-2 text-left">Title</th>
              <th className="px-4 py-2 text-left">Authors</th>
              <th className="px-4 py-2 text-left">Category</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Submission Date</th>
            </tr>
          </thead>
          <tbody>
            {abstracts.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-gray-400">No abstracts found.</td></tr>
            ) : abstracts.map((a, i) => (
              <tr key={a._id || i} className="border-b">
                <td className="px-4 py-2">{a.title}</td>
                <td className="px-4 py-2">{a.authors}</td>
                <td className="px-4 py-2">{a.category?.name || a.category || ''}</td>
                <td className="px-4 py-2">{a.status}</td>
                <td className="px-4 py-2">{a.submissionDate ? new Date(a.submissionDate).toLocaleDateString() : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ClientAbstractsPage; 