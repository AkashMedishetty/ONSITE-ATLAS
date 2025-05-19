import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button, Input, Select, Spinner, Alert } from '../../components/common';
import { Table, Tag } from 'antd'; // Import Table and Tag from antd
import { PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';
import sponsorService from '../../services/sponsorService'; // Import the actual service
import { toast } from 'react-toastify'; // For displaying success/error messages

const SponsorsList = ({ event }) => {
  const eventId = event?._id;
  const location = useLocation();
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

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
        console.log('[SponsorsList ActionsColumn] Rendering action for record:', record, 'record.id:', record?.id);
        return (
          <div className="flex space-x-2">
            {/* record.id is the database ID needed for edit/delete operations */}
            <Link to={`/events/${eventId}/sponsors/${record.id}/edit`} title="Edit">
              <Button variant="icon" size="sm"><PencilIcon className="h-4 w-4" /></Button>
            </Link>
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
          <Button 
            variant="outline"
            onClick={() => console.log('Export Sponsors - To be implemented')} 
            leftIcon={<EyeIcon className="h-4 w-4 mr-1" />}
          >
            Export
          </Button>
          <Link to={`/events/${eventId}/sponsors/new`}>
            <Button variant="primary" leftIcon={<PencilIcon className="h-4 w-4 mr-1" />}>
              Add Sponsor
            </Button>
          </Link>
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
    </div>
  );
};

export default SponsorsList; 