import React, { useEffect, useState } from 'react';
import { Button, Spinner, Alert, Modal, Input, Badge } from '../../../components/common';
import axios from 'axios';

// Helper for API base URL (adjust if needed)
const API_BASE = import.meta.env.VITE_API_URL || '/api';
const ADMIN_CLIENTS_PATH = `${API_BASE}/client-portal/admin/event-clients`;

// Utility: Format client ID for display
const formatClientId = (clientId) => clientId || '';

const defaultForm = {
  name: '',
  email: '',
  phone: '',
  status: 'Active',
};

function EventClientTab({ eventId }) {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [form, setForm] = useState(defaultForm);
  const [selectedClient, setSelectedClient] = useState(null);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch clients on mount or eventId change
  useEffect(() => {
    fetchClients();
    // eslint-disable-next-line
  }, [eventId]);

  const fetchClients = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(ADMIN_CLIENTS_PATH, { params: { eventId } });
      if (res.data && res.data.success) {
        setClients(res.data.clients || []);
      } else {
        setError(res.data.message || 'Failed to load clients');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  // Open modal for add/edit
  const openModal = (mode, client = null) => {
    setModalMode(mode);
    setSelectedClient(client);
    setForm(client ? { name: client.name, email: client.email, phone: client.phone, status: client.status || 'Active' } : defaultForm);
    setShowModal(true);
  };

  // Handle form input
  const handleInput = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Add or update client
  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      if (modalMode === 'add') {
        const res = await axios.post(ADMIN_CLIENTS_PATH, { ...form, eventId });
        if (res.data && res.data.success) {
          setSuccessMsg('Client added successfully');
          setShowModal(false);
          fetchClients();
        } else {
          setError(res.data.message || 'Failed to add client');
        }
      } else if (modalMode === 'edit' && selectedClient) {
        const res = await axios.put(`${ADMIN_CLIENTS_PATH}/${selectedClient._id}`, { ...form });
        if (res.data && res.data.success) {
          setSuccessMsg('Client updated successfully');
          setShowModal(false);
          fetchClients();
        } else {
          setError(res.data.message || 'Failed to update client');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save client');
    } finally {
      setSaving(false);
    }
  };

  // Delete client
  const handleDelete = async (client) => {
    if (!window.confirm('Are you sure you want to delete this client?')) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await axios.delete(`${ADMIN_CLIENTS_PATH}/${client._id}`);
      if (res.data && res.data.success) {
        setSuccessMsg('Client deleted');
        fetchClients();
      } else {
        setError(res.data.message || 'Failed to delete client');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to delete client');
    } finally {
      setDeleting(false);
    }
  };

  // Reset password
  const handleResetPassword = async (client) => {
    if (!window.confirm('Reset password to mobile number for this client?')) return;
    setResetting(true);
    setError(null);
    try {
      const res = await axios.post(`${ADMIN_CLIENTS_PATH}/${client._id}/reset-password`);
      if (res.data && res.data.success) {
        setSuccessMsg('Password reset to mobile number');
      } else {
        setError(res.data.message || 'Failed to reset password');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to reset password');
    } finally {
      setResetting(false);
    }
  };

  // UI: Table columns
  const columns = [
    { label: 'Client ID', render: (c) => <span className="font-mono">{formatClientId(c.clientId)}</span> },
    { label: 'Name', render: (c) => c.name },
    { label: 'Email', render: (c) => c.email },
    { label: 'Phone', render: (c) => c.phone },
    { label: 'Created', render: (c) => new Date(c.createdAt).toLocaleString() },
    { label: 'Status', render: (c) => <Badge variant={c.active ? 'success' : 'secondary'}>{c.active ? 'Active' : 'Inactive'}</Badge> },
    {
      label: 'Actions',
      render: (c) => (
        <div className="flex gap-2">
          <Button size="xs" variant="outline" onClick={() => openModal('edit', c)}>Edit</Button>
          <Button size="xs" variant="outline" onClick={() => handleResetPassword(c)} disabled={resetting}>Reset Password</Button>
          <Button size="xs" variant="danger" onClick={() => handleDelete(c)} disabled={deleting}>Delete</Button>
        </div>
      )
    }
  ];

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Event Clients</h2>
        <Button variant="primary" onClick={() => openModal('add')}>Add Client</Button>
      </div>
      {successMsg && <Alert variant="success" description={successMsg} onClose={() => setSuccessMsg('')} />}
      {error && <Alert variant="danger" description={error} onClose={() => setError(null)} />}
      {loading ? (
        <div className="flex justify-center items-center h-32"><Spinner /></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 bg-white rounded shadow">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((col, idx) => (
                  <th key={idx} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {clients.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="text-center py-6 text-gray-400">No clients found.</td>
                </tr>
              ) : (
                clients.map((client, rowIdx) => (
                  <tr key={client._id || rowIdx} className="hover:bg-gray-50">
                    {columns.map((col, colIdx) => (
                      <td key={colIdx} className="px-4 py-2 whitespace-nowrap">
                        {col.render(client)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      {/* Modal for add/edit */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={modalMode === 'add' ? 'Add Client' : 'Edit Client'} centered={true} size="md">
        <div className="space-y-4">
          <Input label="Name" name="name" value={form.name} onChange={handleInput} required />
          <Input label="Email" name="email" value={form.email} onChange={handleInput} type="email" required />
          <Input label="Phone" name="phone" value={form.phone} onChange={handleInput} required />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              name="status"
              value={form.status}
              onChange={handleInput}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              required
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="light" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} loading={saving}>{modalMode === 'add' ? 'Add' : 'Save'}</Button>
        </div>
      </Modal>
    </div>
  );
}

export default EventClientTab; 