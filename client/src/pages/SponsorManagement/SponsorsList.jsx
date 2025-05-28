import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button, Input, Select, Spinner, Alert, Modal } from '../../components/common';
import { Table, Tag } from 'antd'; // Import Table and Tag from antd
import { PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';
import sponsorService from '../../services/sponsorService'; // Import the actual service
import { toast } from 'react-toastify'; // For displaying success/error messages
import SponsorForm from './SponsorForm';

const SponsorsList = ({ event }) => {
  const eventId = event?._id;
  const location = useLocation();
  const navigate = useNavigate();
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  // Modal state
  const [viewSponsorId, setViewSponsorId] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewSponsor, setViewSponsor] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewError, setViewError] = useState(null);
  // Edit modal state
  const [editSponsorId, setEditSponsorId] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  // Add modal state
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchSponsors = useCallback(async () => {
    if (!eventId) {
      setError('Event ID is missing. Cannot display sponsors.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await sponsorService.getSponsorsByEvent(eventId);
      if (response && response.results) {
        setSponsors(response.results);
      } else {
        setError(response?.message || 'Sponsors data not found in expected format.');
        setSponsors([]);
      }
    } catch (err) {
      console.error("Error fetching sponsors:", err);
      setError(err.message || 'An error occurred while fetching sponsors.');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchSponsors();
  }, [fetchSponsors, location.state?.refreshSponsors]); // Depend on the specific state property

  const filteredSponsors = useMemo(() => {
    return sponsors.filter(sponsor => {
      const searchLower = searchTerm.toLowerCase();
      const nameMatch = sponsor.companyName?.toLowerCase().includes(searchLower);
      const emailMatch = sponsor.email?.toLowerCase().includes(searchLower);
      const idMatch = sponsor.sponsorId?.toLowerCase().includes(searchLower); // Search by custom sponsorId
      const authPersonMatch = sponsor.authorizedPerson?.toLowerCase().includes(searchLower);
      const displayPhoneMatch = sponsor.displayPhoneNumber?.toLowerCase().includes(searchLower);
      
      const statusMatch = statusFilter ? sponsor.status === statusFilter : true;
      
      return (nameMatch || emailMatch || idMatch || authPersonMatch || displayPhoneMatch) && statusMatch;
    });
  }, [sponsors, searchTerm, statusFilter]);

  const handleDeleteSponsor = async (sponsorDbIdToDelete) => {
    if (window.confirm('Are you sure you want to delete this sponsor?')) {
      setLoading(true); // Indicate loading state during delete
      try {
        await sponsorService.deleteSponsor(eventId, sponsorDbIdToDelete);
        toast.success('Sponsor deleted successfully!');
        // Refetch sponsors to update the list
        fetchSponsors(); 
      } catch (err) {
        console.error("Error deleting sponsor:", err);
        toast.error(err.message || 'Failed to delete sponsor.');
        setError(err.message || 'Failed to delete sponsor.');
        setLoading(false); // Reset loading on error
      }
      // setLoading(false) will be called by fetchSponsors in its finally block
    }
  };

  // Fetch sponsor details for modal
  const handleViewSponsor = async (sponsorDbId) => {
    setViewSponsorId(sponsorDbId);
    setShowViewModal(true);
    setViewSponsor(null);
    setViewError(null);
    setViewLoading(true);
    try {
      // Try to find in the loaded list first
      const found = sponsors.find(s => s.id === sponsorDbId);
      if (found) {
        setViewSponsor(found);
        setViewLoading(false);
        return;
      }
      // Otherwise fetch from API
      const res = await sponsorService.getSponsorById(eventId, sponsorDbId);
      if (res && res.success && res.data) {
        setViewSponsor(res.data);
      } else {
        setViewError(res.message || 'Sponsor not found');
      }
    } catch (err) {
      setViewError(err.message || 'Error loading sponsor');
    } finally {
      setViewLoading(false);
    }
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setViewSponsorId(null);
    setViewSponsor(null);
    setViewError(null);
    setViewLoading(false);
  };

  // Add handler for modal edit
  const handleEditSponsorFromModal = () => {
    console.log('[SponsorsList] handleEditSponsorFromModal called. viewSponsor:', viewSponsor);
    if (viewSponsor && viewSponsor.id) {
      closeViewModal();
      console.log('[SponsorsList] Navigating to:', `/events/${eventId}/sponsors/${viewSponsor.id}/edit`);
      navigate(`/events/${eventId}/sponsors/${viewSponsor.id}/edit`);
    } else {
      alert('Edit failed: Sponsor data missing or invalid.');
    }
  };

  const openEditModal = (sponsorId) => {
    setEditSponsorId(sponsorId);
    setShowEditModal(true);
  };
  const closeEditModal = () => {
    setShowEditModal(false);
    setEditSponsorId(null);
    fetchSponsors();
  };
  const openAddModal = () => {
    setShowAddModal(true);
  };
  const closeAddModal = () => {
    setShowAddModal(false);
    fetchSponsors();
  };

  const columns = [
    {
      title: 'Sponsor ID',
      dataIndex: 'sponsorId', // Use the custom generated sponsorId (SPN-PREFIX-NNN)
      key: 'sponsorId',
    },
    {
      title: 'Company Name',
      dataIndex: 'companyName',
      key: 'companyName',
    },
    {
      title: 'Authorized Person',
      dataIndex: 'authorizedPerson',
      key: 'authorizedPerson',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Display Phone',
      dataIndex: 'displayPhoneNumber',
      key: 'displayPhoneNumber',
      render: (phone) => phone || 'N/A',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'geekblue';
        if (status === 'Active') color = 'green';
        else if (status === 'Inactive') color = 'volcano';
        return <Tag color={color}>{status?.toUpperCase() || 'N/A'}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (text, record) => {
        return (
          <div className="flex space-x-2">
            {/* View button opens modal */}
            <Button variant="icon" size="sm" onClick={() => handleViewSponsor(record.id)} title="View">
              <EyeIcon className="h-4 w-4" />
            </Button>
            {/* Edit button opens edit modal */}
            <Button variant="icon" size="sm" onClick={() => openEditModal(record.id)} title="Edit">
              <PencilIcon className="h-4 w-4" />
            </Button>
            {/* Delete button */}
            <Button variant="icon" size="sm" onClick={() => handleDeleteSponsor(record.id)} title="Delete" disabled={loading}>
              <TrashIcon className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        );
      },
    },
  ];

  if (!event) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="warning" title="Loading Context">
          Loading event context...
        </Alert>
      </div>
    );
  }

  if (!eventId && !loading && !error) { // Added !error condition
     return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="danger" title="Error">
          Event ID is missing. Cannot display sponsors.
        </Alert>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">Sponsors Management</h1>
        <div className="flex items-center gap-2">
          <Button variant="primary" leftIcon={<PencilIcon className="h-4 w-4 mr-1" />} onClick={openAddModal}>
            Add Sponsor
          </Button>
        </div>
      </div>

      <div className="mb-4 bg-white p-4 shadow rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            type="text"
            placeholder="Search by name, email, ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
          <Select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full"
          >
            <option value="">Filter by Status (All)</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </Select>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center items-center py-10">
          <Spinner size="lg" /> <span className="ml-2">Loading sponsors...</span>
        </div>
      )}
      {!loading && error && (
        <Alert variant="danger" title="Error Loading Sponsors">
          {error}
        </Alert>
      )}
      {!loading && !error && (
        <>
          {console.log('[SponsorsList] Rendering Table. Filtered Sponsors Data:', JSON.stringify(filteredSponsors.map(s => ({ id: s.id, companyName: s.companyName }))), 'Count:', filteredSponsors.length)}
          <Table 
            columns={columns} 
            dataSource={filteredSponsors} 
            rowKey="id"
            pagination={{ pageSize: 10 }}
            className="bg-white shadow rounded-lg"
          />
        </>
      )}
      {!loading && !error && sponsors.length > 0 && filteredSponsors.length === 0 && searchTerm && (
         <Alert variant="info" title="No Results">
            No sponsors found matching your search criteria.
        </Alert>
      )}
      {!loading && !error && sponsors.length === 0 && !searchTerm && (
         <Alert variant="info" title="No Sponsors Yet">
            No sponsors have been added to this event yet. Click "Add Sponsor" to get started.
        </Alert>
      )}
      {/* View Sponsor Modal */}
      <Modal isOpen={showViewModal} onClose={closeViewModal} size="xl" centered={true}>
        <div className="p-6 max-w-lg">
          <h2 className="text-lg font-semibold mb-4">Sponsor Details</h2>
          {viewLoading && <div className="flex justify-center items-center py-8"><Spinner /></div>}
          {viewError && <Alert variant="danger">{viewError}</Alert>}
          {viewSponsor && !viewLoading && !viewError && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><strong>Sponsor ID:</strong> {viewSponsor.sponsorId || 'N/A'}</div>
              <div><strong>Company Name:</strong> {viewSponsor.companyName || 'N/A'}</div>
              <div><strong>Authorized Person:</strong> {viewSponsor.authorizedPerson || 'N/A'}</div>
              <div><strong>Email:</strong> {viewSponsor.email || 'N/A'}</div>
              <div><strong>Display Phone:</strong> {viewSponsor.displayPhoneNumber || 'N/A'}</div>
              <div><strong>Sponsoring Amount:</strong> {viewSponsor.sponsoringAmount !== undefined && viewSponsor.sponsoringAmount !== null ? viewSponsor.sponsoringAmount : 'N/A'}</div>
              <div><strong>Registrant Allotment:</strong> {viewSponsor.registrantAllotment !== undefined && viewSponsor.registrantAllotment !== null ? viewSponsor.registrantAllotment : 'N/A'}</div>
              <div><strong>Status:</strong> {viewSponsor.status || 'N/A'}</div>
              <div className="md:col-span-2"><strong>Description / Notes:</strong> {viewSponsor.description || 'N/A'}</div>
            </div>
          )}
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="light" onClick={closeViewModal}>Close</Button>
          </div>
        </div>
      </Modal>
      {/* Edit Sponsor Modal */}
      <Modal isOpen={showEditModal} onClose={closeEditModal} title="Edit Sponsor" size="xl">
        {showEditModal && (
          <SponsorForm sponsorIdForEdit={editSponsorId} onClose={closeEditModal} />
        )}
      </Modal>
      {/* Add Sponsor Modal */}
      <Modal isOpen={showAddModal} onClose={closeAddModal} title="Add Sponsor" size="2xl" centered={true}>
        {showAddModal && (
          <SponsorForm onClose={closeAddModal} />
        )}
      </Modal>
    </div>
  );
};

export default SponsorsList; 