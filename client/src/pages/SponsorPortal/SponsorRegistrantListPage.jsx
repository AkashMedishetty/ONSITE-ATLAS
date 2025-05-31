import React, { useState, useEffect, useMemo, useRef } from 'react';
import sponsorAuthService from '../../services/sponsorAuthService';
import eventService from '../../services/eventService';
import { Spinner, Alert, Input, Card, Button, Modal, Pagination } from '../../components/common';
import QRCode from 'react-qr-code';
import { toast } from 'react-toastify';
import SponsorBulkImportWizard from './SponsorBulkImportWizard';

const emptyRegistrant = { personalInfo: { firstName: '', lastName: '', email: '', phone: '', organization: '', designation: '', country: '' }, professionalInfo: { mciNumber: '', membership: '' }, category: '', status: 'active' };

const SponsorRegistrantListPage = () => {
  const [registrants, setRegistrants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editRegistrant, setEditRegistrant] = useState(null);
  const [showView, setShowView] = useState(false);
  const [viewRegistrant, setViewRegistrant] = useState(null);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteRegistrant, setDeleteRegistrant] = useState(null);
  const sponsor = sponsorAuthService.getCurrentSponsorData();
  const eventId = sponsor?.eventId;
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 });
  const [filters, setFilters] = useState({ category: '', status: '' });
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [showBulkImportWizard, setShowBulkImportWizard] = useState(false);
  const [allRegistrants, setAllRegistrants] = useState([]);
  const [backendFiltering, setBackendFiltering] = useState(true);
  const searchTimeout = useRef();

  // Fetch categories
  useEffect(() => {
    if (!eventId) return;
    eventService.getSponsorPortalCategories().then(res => {
      if (res.success && Array.isArray(res.data)) setCategories(res.data);
      else setCategories([]);
    });
  }, [eventId]);

  // Fetch all registrants for frontend filtering fallback
  const fetchAllRegistrants = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await sponsorAuthService.getSponsorPortalRegistrants({});
      if (res.success) {
        setAllRegistrants(res.data || []);
        setPagination(p => ({ ...p, total: res.pagination?.total || (res.data?.length || 0) }));
      } else {
        setAllRegistrants([]);
        setPagination(p => ({ ...p, total: 0 }));
      }
    } catch (err) {
      setError(err.message || 'Failed to load registrants.');
      setAllRegistrants([]);
      setPagination(p => ({ ...p, total: 0 }));
    } finally {
      setLoading(false);
    }
  };

  // Backend fetch with params (if supported)
  const fetchRegistrants = async (page = 1, pageSize = 10, search = '', category = '', status = '') => {
        setLoading(true);
        setError(null);
    try {
      const params = { page, limit: pageSize };
      if (search) params.search = search;
      if (category) params.category = category;
      if (status) params.status = status;
      const res = await sponsorAuthService.getSponsorPortalRegistrants(params);
      if (res.success) {
        setRegistrants(res.data || []);
        setPagination({ page, pageSize, total: res.pagination?.total || (res.data?.length || 0) });
        // Detect if backend is filtering
        if (search || category || status) {
          if (res.data && res.data.length < allRegistrants.length) setBackendFiltering(true);
          else setBackendFiltering(false);
        }
      } else {
        setRegistrants([]);
        setPagination({ page, pageSize, total: 0 });
        }
      } catch (err) {
      setError(err.message || 'Failed to load registrants.');
      setRegistrants([]);
      setPagination({ page, pageSize, total: 0 });
      } finally {
        setLoading(false);
      }
    };

  // Debounced search/filter effect
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      fetchRegistrants(pagination.page, pagination.pageSize, searchTerm, filters.category, filters.status);
    }, 300);
    return () => clearTimeout(searchTimeout.current);
    // eslint-disable-next-line
  }, [pagination.page, pagination.pageSize, searchTerm, filters.category, filters.status]);

  // Fallback: If backend ignores search/filter, filter on frontend
  useEffect(() => {
    fetchAllRegistrants();
  }, []);

  // Fallback filter logic
  const filteredRegistrants = useMemo(() => {
    let data = allRegistrants;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      data = data.filter(r =>
        (r.registrationId && r.registrationId.toLowerCase().includes(term)) ||
        (r.personalInfo?.firstName && r.personalInfo.firstName.toLowerCase().includes(term)) ||
        (r.personalInfo?.lastName && r.personalInfo.lastName.toLowerCase().includes(term)) ||
        (r.personalInfo?.email && r.personalInfo.email.toLowerCase().includes(term))
      );
    }
    if (filters.category) {
      data = data.filter(r => {
        if (typeof r.category === 'object' && r.category?._id) return r.category._id === filters.category;
        if (typeof r.category === 'string') return r.category === filters.category;
        return false;
      });
    }
    if (filters.status) {
      data = data.filter(r => r.status === filters.status);
    }
    return data;
  }, [allRegistrants, searchTerm, filters]);

  // Use filteredRegistrants for display if backend returns all or doesn't filter
  const displayRegistrants = backendFiltering
    ? registrants
    : filteredRegistrants.slice((pagination.page - 1) * pagination.pageSize, pagination.page * pagination.pageSize);

  // Table columns: Registration ID, Name, Email, Category, Mobile, Registration Date, Actions
  const renderTable = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registration ID</th>
            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mobile</th>
            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registration Date</th>
            <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {displayRegistrants.map(reg => (
            <tr key={reg._id || reg.registrationId} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{reg.registrationId || 'N/A'}</td>
              <td className="px-6 py-4 whitespace-nowrap">{reg.personalInfo?.firstName || ''} {reg.personalInfo?.lastName || ''}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{reg.personalInfo?.email || 'N/A'}</td>
              <td className="px-6 py-4 whitespace-nowrap">{reg.category?.name || ''}</td>
              <td className="px-6 py-4 whitespace-nowrap">{reg.personalInfo?.phone || ''}</td>
              <td className="px-6 py-4 whitespace-nowrap">{reg.createdAt ? new Date(reg.createdAt).toLocaleDateString() : ''}</td>
              <td className="px-6 py-4 whitespace-nowrap text-right">
                <Button variant="outline" size="sm" onClick={() => { setViewRegistrant(reg); setShowView(true); }}>View</Button>
                <Button variant="outline" size="sm" className="ml-2" onClick={() => { setEditRegistrant(reg); setShowEdit(true); }}>Edit</Button>
                <Button variant="danger" size="sm" className="ml-2" onClick={() => { setDeleteRegistrant(reg); setShowDelete(true); }}>Delete</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // View Modal
  const renderViewModal = (props) => {
    if (!viewRegistrant) return null;
    const reg = viewRegistrant;
    // Defensive: resolve category name from categories array using ID
    let categoryId = '';
    if (reg.category) {
      if (typeof reg.category === 'object' && reg.category.$oid) categoryId = reg.category.$oid;
      else if (typeof reg.category === 'string') categoryId = reg.category;
    }
    let categoryName = '';
    if (categoryId) {
      const catObj = categories.find(c => c._id === categoryId);
      categoryName = catObj ? catObj.name : categoryId;
    }
    // Helper to show value only if present
    const showIfPresent = (label, value) => (value !== undefined && value !== null && String(value).trim() !== '' ? (
      <div><span className="font-semibold">{label}:</span> {value}</div>
    ) : null);
    // Parse registration date
    let regDate = '';
    if (reg.createdAt) {
      if (typeof reg.createdAt === 'object' && reg.createdAt.$date) regDate = new Date(reg.createdAt.$date).toLocaleString();
      else regDate = new Date(reg.createdAt).toLocaleString();
    }
    return (
      <Modal isOpen={showView} onClose={() => setShowView(false)} title="Registration Details" size="2xl" centered={true} {...props}>
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-2">
              {showIfPresent('Name', `${reg.personalInfo?.firstName || ''} ${reg.personalInfo?.lastName || ''}`)}
              {showIfPresent('Email', reg.personalInfo?.email)}
              {showIfPresent('Mobile', reg.personalInfo?.phone)}
              {showIfPresent('Category', categoryName)}
              {showIfPresent('Status', reg.status)}
              {showIfPresent('Registration Date', regDate)}
              {/* Show all custom fields */}
              {reg.customFields && Object.entries(reg.customFields).map(([key, value]) => showIfPresent(key, value))}
            </div>
            <div className="flex flex-col items-center justify-center">
              <div className="mb-2 font-semibold">Badge Preview</div>
              <div className="p-4 border rounded bg-white">
                <QRCode value={reg.registrationId || 'no-id'} size={96} />
                <div className="mt-2 text-xs text-gray-500">{reg.registrationId}</div>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowView(false)}>Close</Button>
          </div>
      </div>
      </Modal>
    );
  };

  // Edit Modal
  const [editForm, setEditForm] = useState(emptyRegistrant);
  useEffect(() => {
    if (showEdit && editRegistrant) {
      setEditForm({
        personalInfo: {
          firstName: editRegistrant.personalInfo?.firstName || '',
          lastName: editRegistrant.personalInfo?.lastName || '',
          email: editRegistrant.personalInfo?.email || '',
          phone: editRegistrant.personalInfo?.phone || '',
        },
        customFields: { ...editRegistrant.customFields },
        category: (editRegistrant.category && typeof editRegistrant.category === 'object' && editRegistrant.category.$oid) ? editRegistrant.category.$oid : (editRegistrant.category || ''),
        status: editRegistrant.status || 'active',
      });
    }
  }, [showEdit, editRegistrant]);

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('personalInfo.')) {
      setEditForm(f => ({ ...f, personalInfo: { ...f.personalInfo, [name.replace('personalInfo.', '')]: value } }));
    } else if (name.startsWith('customFields.')) {
      setEditForm(f => ({ ...f, customFields: { ...f.customFields, [name.replace('customFields.', '')]: value } }));
    } else if (name === 'category') {
      setEditForm(f => ({ ...f, category: value }));
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        personalInfo: editForm.personalInfo,
        customFields: editForm.customFields,
        category: editForm.category,
        status: editForm.status,
      };
      await sponsorAuthService.editSponsorPortalRegistrant(editRegistrant._id, payload);
      toast.success('Registrant updated!');
      setShowEdit(false);
      setEditRegistrant(null);
      fetchRegistrants(pagination.page, pagination.pageSize, searchTerm, filters.category, filters.status);
    } catch (err) {
      toast.error(err.message || 'Failed to update registrant.');
    }
  };

  const renderEditModal = (props) => (
    <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit Registrant" size="2xl" centered={true} {...props}>
      <form onSubmit={handleEditSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
            <input type="text" name="personalInfo.firstName" value={editForm.personalInfo.firstName} onChange={handleEditChange} className="border rounded px-2 py-1 w-full" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
            <input type="text" name="personalInfo.lastName" value={editForm.personalInfo.lastName} onChange={handleEditChange} className="border rounded px-2 py-1 w-full" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" name="personalInfo.email" value={editForm.personalInfo.email} onChange={handleEditChange} className="border rounded px-2 py-1 w-full" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
            <input type="text" name="personalInfo.phone" value={editForm.personalInfo.phone} onChange={handleEditChange} className="border rounded px-2 py-1 w-full" />
          </div>
          {/* Render all custom fields */}
          {editForm.customFields && Object.entries(editForm.customFields).map(([key, value]) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{key}</label>
              <input type="text" name={`customFields.${key}`} value={value} onChange={handleEditChange} className="border rounded px-2 py-1 w-full" />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select name="category" value={editForm.category} onChange={handleEditChange} className="border rounded px-2 py-1 w-full" required>
              <option value="">Select Category</option>
              {categories.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" type="button" onClick={() => setShowEdit(false)}>Cancel</Button>
          <Button variant="primary" type="submit">Save</Button>
        </div>
      </form>
    </Modal>
  );

  // Delete Modal
  const handleDelete = async () => {
    try {
      await sponsorAuthService.deleteSponsorPortalRegistrant(deleteRegistrant._id);
      toast.success('Registrant deleted!');
      setShowDelete(false);
      setDeleteRegistrant(null);
      fetchRegistrants(pagination.page, pagination.pageSize, searchTerm, filters.category, filters.status);
    } catch (err) {
      toast.error(err.message || 'Failed to delete registrant.');
    }
  };
  const renderDeleteModal = (props) => (
    <Modal isOpen={showDelete} onClose={() => setShowDelete(false)} title="Delete Registrant" size="md" centered={true} {...props}>
      <div className="space-y-4">
        <div>Are you sure you want to delete this registrant?</div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => setShowDelete(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete}>Delete</Button>
        </div>
      </div>
    </Modal>
  );

  // Import handler
  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);
    setImportError(null);
    try {
      const text = await file.text();
      const rows = text.split('\n').filter(Boolean).map(row => row.split(','));
      const headers = rows[0].map(h => h.trim());
      const registrants = rows.slice(1).map(row => {
        const obj = {};
        headers.forEach((h, i) => { obj[h] = row[i]?.trim(); });
        // Map to sponsor API structure
        const personalInfo = {
          firstName: obj.firstName || '',
          lastName: obj.lastName || '',
          email: obj.email || '',
          phone: obj.phone || '',
        };
        const customFields = {};
        Object.keys(obj).forEach(k => {
          if (!['firstName','lastName','email','phone','category','status'].includes(k)) customFields[k] = obj[k];
        });
        return {
          personalInfo,
          customFields: Object.keys(customFields).length ? customFields : undefined,
          category: obj.category || '',
          status: obj.status || 'active',
        };
      });
      await sponsorAuthService.bulkImportSponsorPortalRegistrants(registrants);
      toast.success('Bulk import successful!');
      fetchRegistrants(pagination.page, pagination.pageSize, searchTerm, filters.category, filters.status);
    } catch (err) {
      setImportError(err.message || 'Bulk import failed.');
      toast.error(err.message || 'Bulk import failed.');
    } finally {
      setImporting(false);
    }
  };

  // Export handler
  const handleExport = async () => {
    setExporting(true);
    try {
      const token = localStorage.getItem('sponsorToken');
      const response = await fetch('/api/sponsor-portal-auth/me/registrants/export', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Export failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sponsored_registrants.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Export started!');
    } catch (err) {
      toast.error(err.message || 'Export failed.');
    } finally {
      setExporting(false);
    }
  };

  // Search, filter, pagination controls
  return (
    <>
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 max-w-7xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">My Sponsored Registrants</h1>
          <p className="text-gray-600">View and manage attendees associated with your sponsorship</p>
        </div>
        <div className="flex gap-2">
          <Button variant="primary" onClick={() => setShowAdd(true)}>Add Registrant</Button>
          <Button variant="outline" onClick={() => setShowBulkImportWizard(true)}>Bulk Import (Wizard)</Button>
          <Button variant="outline" onClick={handleExport} disabled={exporting}>Export</Button>
          {importing && <span className="text-blue-600 ml-4">Importing...</span>}
          {importError && <span className="text-red-600 ml-4">{importError}</span>}
        </div>
                  </div>
      <div className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 max-w-7xl mx-auto">
                  <Input
                    id="search"
                    type="text"
                    placeholder="Search by name, email, or ID..."
                    value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full md:w-80"
        />
        <div className="flex gap-2">
          <select value={filters.category} onChange={e => setFilters(f => ({ ...f, category: e.target.value }))} className="border rounded px-2 py-1">
            <option value="">All Categories</option>
            {categories.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
          </select>
          <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))} className="border rounded px-2 py-1">
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="cancelled">Cancelled</option>
            <option value="no-show">No Show</option>
          </select>
                </div>
              </div>
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="flex justify-center items-center h-40"><Spinner size="lg" /></div>
        ) : error ? (
          <Alert variant="danger" title="Error loading registrants">{error}</Alert>
        ) : displayRegistrants.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow text-center border border-gray-100">
            <h3 className="text-lg font-medium text-gray-900 mb-1">No Registrants Found</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              No registrants match your search criteria, or none are currently associated with your sponsorship.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden shadow-md border-0">
            {renderTable()}
          </div>
        )}
        <Pagination
          currentPage={pagination.page}
          totalPages={Math.ceil((backendFiltering ? pagination.total : filteredRegistrants.length) / pagination.pageSize) || 1}
          totalCount={backendFiltering ? pagination.total : filteredRegistrants.length}
          pageSize={pagination.pageSize}
          onPageChange={page => setPagination(p => ({ ...p, page }))}
          onPageSizeChange={pageSize => setPagination(p => ({ ...p, pageSize }))}
          showPageInfo={false}
        />
        {showView && renderViewModal({ scrollBehavior: 'outside' })}
        {showEdit && renderEditModal({ scrollBehavior: 'outside' })}
        {showDelete && renderDeleteModal({ scrollBehavior: 'outside' })}
        {showBulkImportWizard && (
          <Modal isOpen={showBulkImportWizard} onClose={() => setShowBulkImportWizard(false)} title="Bulk Import Registrants" size="5xl" centered={true} scrollBehavior="outside">
            <SponsorBulkImportWizard
              eventId={eventId}
              onClose={() => setShowBulkImportWizard(false)}
              onSuccess={() => { setShowBulkImportWizard(false); fetchRegistrants(pagination.page, pagination.pageSize, searchTerm, filters.category, filters.status); }}
            />
          </Modal>
        )}
      </div>
    </>
  );
};

export default SponsorRegistrantListPage; 