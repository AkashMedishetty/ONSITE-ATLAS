import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FiDownload, FiFilter, FiSearch } from 'react-icons/fi';
import { 
  Card, Button, Input, Select, Spinner, 
  Badge, Pagination, Alert
} from '../../components/common';
import abstractService from '../../services/abstractService';

const AbstractList = () => {
  const { eventId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [abstracts, setAbstracts] = useState([]);
  const [filteredAbstracts, setFilteredAbstracts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedAbstract, setSelectedAbstract] = useState(null);
  const [downloadLoading, setDownloadLoading] = useState(false);
  
  const itemsPerPage = 10;

  useEffect(() => {
    fetchAbstracts();
  }, [eventId]);

  useEffect(() => {
    filterAbstracts();
  }, [searchTerm, filterStatus, abstracts]);

  const fetchAbstracts = async () => {
    if (!eventId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await abstractService.getAbstracts(eventId);
      
      if (response.success) {
        setAbstracts(response.data || []);
      } else {
        setError(response.message || 'Failed to fetch abstracts');
        setAbstracts([]);
      }
    } catch (err) {
      setError('An unexpected error occurred while fetching abstracts');
      console.error('Error fetching abstracts:', err);
      setAbstracts([]);
    } finally {
      setLoading(false);
    }
  };

  const filterAbstracts = () => {
    let filtered = [...abstracts];
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        abstract => 
          abstract.title?.toLowerCase().includes(term) || 
          abstract.authorName?.toLowerCase().includes(term) ||
          abstract.registrationId?.toLowerCase().includes(term)
      );
    }
    
    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(abstract => abstract.status === filterStatus);
    }
    
    setFilteredAbstracts(filtered);
    
    // Update pagination
    setTotalPages(Math.max(1, Math.ceil(filtered.length / itemsPerPage)));
    if (currentPage > Math.ceil(filtered.length / itemsPerPage)) {
      setCurrentPage(1);
    }
  };
  
  const handleDownloadAll = async () => {
    if (!eventId) return;
    
    setDownloadLoading(true);
    
    try {
      const response = await abstractService.downloadAbstracts(eventId);
      
      if (response.success && response.data?.fileUrl) {
        // Create a temporary link and trigger download
        const link = document.createElement('a');
        link.href = response.data.fileUrl;
        link.setAttribute('download', `abstracts-${eventId}.zip`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        setError(response.message || 'Failed to download abstracts');
      }
    } catch (err) {
      setError('An unexpected error occurred while downloading abstracts');
      console.error('Error downloading abstracts:', err);
    } finally {
      setDownloadLoading(false);
    }
  };
  
  const handleStatusChange = async (abstractId, newStatus) => {
    if (!eventId || !abstractId) return;
    
    try {
      const response = await abstractService.updateAbstractStatus(eventId, abstractId, newStatus);
      
      if (response.success) {
        // Update the local state to reflect the change
        setAbstracts(prevAbstracts => 
          prevAbstracts.map(abstract => 
            abstract._id === abstractId ? { ...abstract, status: newStatus } : abstract
          )
        );
      } else {
        setError(response.message || 'Failed to update abstract status');
      }
    } catch (err) {
      setError('An unexpected error occurred while updating abstract status');
      console.error('Error updating abstract status:', err);
    }
  };
  
  const handleViewAbstract = (abstract) => {
    setSelectedAbstract(abstract);
  };
  
  // Calculate current page items
  const getCurrentPageItems = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAbstracts.slice(startIndex, endIndex);
  };
  
  // Render abstract status badge
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge color="yellow">Pending Review</Badge>;
      case 'approved':
        return <Badge color="green">Approved</Badge>;
      case 'rejected':
        return <Badge color="red">Rejected</Badge>;
      default:
        return <Badge color="gray">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold">Abstract Submissions</h1>
        <div className="flex items-center gap-2">
          <Button 
            variant="primary" 
            leftIcon={<FiDownload />} 
            isLoading={downloadLoading}
            onClick={handleDownloadAll}
            disabled={abstracts.length === 0}
          >
            Download All
          </Button>
          <Button 
            variant="outline" 
            leftIcon={<FiFilter />}
            onClick={fetchAbstracts}
          >
            Refresh
          </Button>
        </div>
      </div>
      
      {error && (
        <Alert type="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      <Card className="overflow-visible">
        <div className="flex flex-col md:flex-row md:items-center gap-4 p-4">
          <div className="flex-1">
            <Input
              leftIcon={<FiSearch />}
              placeholder="Search by title, author, or registration ID"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              fullWidth
            />
          </div>
          <div className="md:w-48">
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'pending', label: 'Pending Review' },
                { value: 'approved', label: 'Approved' },
                { value: 'rejected', label: 'Rejected' }
              ]}
              fullWidth
            />
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <Spinner size="lg" />
          </div>
        ) : abstracts.length === 0 ? (
          <div className="text-center p-8 text-gray-500">
            No abstracts found for this event.
          </div>
        ) : filteredAbstracts.length === 0 ? (
          <div className="text-center p-8 text-gray-500">
            No abstracts match your search criteria.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Author
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted On
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getCurrentPageItems().map((abstract) => (
                    <tr key={abstract._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {abstract.registrationId || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-md truncate">
                        {abstract.title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {abstract.authorName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(abstract.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {renderStatusBadge(abstract.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="text"
                            size="sm"
                            onClick={() => handleViewAbstract(abstract)}
                          >
                            View
                          </Button>
                          <Select
                            size="sm"
                            value={abstract.status}
                            onChange={(e) => handleStatusChange(abstract._id, e.target.value)}
                            options={[
                              { value: 'pending', label: 'Pending' },
                              { value: 'approved', label: 'Approve' },
                              { value: 'rejected', label: 'Reject' }
                            ]}
                            className="w-28"
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{Math.min(filteredAbstracts.length, 1 + (currentPage - 1) * itemsPerPage)}</span> to <span className="font-medium">{Math.min(filteredAbstracts.length, currentPage * itemsPerPage)}</span> of <span className="font-medium">{filteredAbstracts.length}</span> abstracts
              </div>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                size="sm"
              />
            </div>
          </>
        )}
      </Card>
      
      {selectedAbstract && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-full overflow-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">{selectedAbstract.title}</h3>
                <button
                  className="text-gray-400 hover:text-gray-500"
                  onClick={() => setSelectedAbstract(null)}
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="px-6 py-4">
              <div className="mb-4">
                <span className="text-gray-500">Author: </span>
                <span className="font-medium">{selectedAbstract.authorName}</span>
              </div>
              <div className="mb-4">
                <span className="text-gray-500">Registration ID: </span>
                <span className="font-medium">{selectedAbstract.registrationId || 'N/A'}</span>
              </div>
              <div className="mb-4">
                <span className="text-gray-500">Status: </span>
                {renderStatusBadge(selectedAbstract.status)}
              </div>
              <div className="mb-4">
                <span className="text-gray-500">Submitted On: </span>
                <span className="font-medium">{new Date(selectedAbstract.createdAt).toLocaleString()}</span>
              </div>
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Abstract Content</h4>
                <div className="bg-gray-50 p-4 rounded border border-gray-200 whitespace-pre-wrap">
                  {selectedAbstract.content}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setSelectedAbstract(null)}
              >
                Close
              </Button>
              <Select
                value={selectedAbstract.status}
                onChange={(e) => {
                  const newStatus = e.target.value;
                  handleStatusChange(selectedAbstract._id, newStatus);
                  setSelectedAbstract({...selectedAbstract, status: newStatus});
                }}
                options={[
                  { value: 'pending', label: 'Pending Review' },
                  { value: 'approved', label: 'Approve' },
                  { value: 'rejected', label: 'Reject' }
                ]}
                className="w-40"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AbstractList; 