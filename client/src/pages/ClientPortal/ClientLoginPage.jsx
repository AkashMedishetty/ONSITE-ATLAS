import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { useClientAuth } from '../../contexts/ClientAuthContext';

const ClientLoginPage = () => {
  const [clientId, setClientId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useClientAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.post('/client-portal-auth/auth/login', { clientId, password });
      if (res.data && res.data.success && res.data.token) {
        const eventId = res.data.client?.event || res.data.eventId;
        if (!eventId) {
          setError('No event context found for this client.');
          setLoading(false);
          return;
        }
        login(res.data.token, res.data.client, eventId);
        navigate('/client/dashboard');
      } else {
        setError(res.data?.message || 'Login failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <div className="mb-6 text-center">
          <div className="text-2xl font-bold text-blue-900 mb-1">Client Portal Login</div>
          <div className="text-sm text-gray-500">Organizing Committee Access</div>
        </div>
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-gray-700 font-medium mb-1">Client ID</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={clientId}
              onChange={e => setClientId(e.target.value)}
              autoFocus
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">Password (Mobile Number)</label>
            <input
              type="password"
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 transition"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ClientLoginPage; 