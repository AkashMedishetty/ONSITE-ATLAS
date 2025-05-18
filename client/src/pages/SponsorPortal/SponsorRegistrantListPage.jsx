import React, { useState, useEffect, useMemo } from 'react';
import sponsorAuthService from '../../services/sponsorAuthService';
import { Spinner, Alert, Input, Card } from '../../components/common';

const SponsorRegistrantListPage = () => {
  const [registrants, setRegistrants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchRegistrants = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await sponsorAuthService.getSponsorRegistrants();
        if (response.success) {
          setRegistrants(response.data || []);
        } else {
          setError(response.message || 'Failed to load registrants.');
        }
      } catch (err) {
        setError(err.message || 'An unexpected error occurred while fetching registrants.');
      } finally {
        setLoading(false);
      }
    };
    fetchRegistrants();
  }, []);

  const filteredRegistrants = useMemo(() => {
    if (!searchTerm) {
      return registrants;
    }
    return registrants.filter(reg => {
      const firstName = reg.personalInfo?.firstName?.toLowerCase() || '';
      const lastName = reg.personalInfo?.lastName?.toLowerCase() || '';
      const email = reg.personalInfo?.email?.toLowerCase() || '';
      const registrationId = reg.registrationId?.toLowerCase() || '';
      return firstName.includes(searchTerm.toLowerCase()) ||
             lastName.includes(searchTerm.toLowerCase()) ||
             email.includes(searchTerm.toLowerCase()) ||
             registrationId.includes(searchTerm.toLowerCase());
    });
  }, [registrants, searchTerm]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spinner size="lg" /> <span className="ml-2 text-gray-600 font-medium">Loading registrants...</span>
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger" title="Error loading registrants">{error}</Alert>;
  }

  // Status badge renderer
  const renderStatusBadge = (status) => {
    const statusClasses = {
      active: "bg-emerald-100 text-emerald-800 border-emerald-200",
      cancelled: "bg-red-100 text-red-800 border-red-200",
      "no-show": "bg-amber-100 text-amber-800 border-amber-200"
    };
    
    const defaultClass = "bg-gray-100 text-gray-800 border-gray-200";
    const baseClass = "px-3 py-1 text-xs font-medium rounded-full border";
    
    return (
      <span className={`${baseClass} ${statusClasses[status] || defaultClass}`}>
        {status === "no-show" ? "No Show" : status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="bg-gradient-to-b from-gray-50 to-white min-h-screen p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">My Sponsored Registrants</h1>
          <p className="text-gray-600">View and manage attendees associated with your sponsorship</p>
        </div>
        
        {/* Search and Stats Card */}
        <Card className="mb-8 shadow-md border-0">
          <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-grow max-w-md">
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                  Search Registrants
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <Input
                    id="search"
                    type="text"
                    placeholder="Search by name, email, or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border-gray-300 focus:ring-blue-500 focus:border-blue-500 block w-full rounded-md"
                  />
                </div>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-4 text-center md:text-left">
                <p className="text-sm text-blue-700 font-medium">Total Registrants</p>
                <p className="text-3xl font-bold text-blue-800">{registrants.length}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Results Section */}
        {filteredRegistrants.length === 0 && !loading && (
          <div className="bg-white p-8 rounded-lg shadow text-center border border-gray-100">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No Registrants Found</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              No registrants match your search criteria, or none are currently associated with your sponsorship.
            </p>
          </div>
        )}

        {filteredRegistrants.length > 0 && (
          <Card className="overflow-hidden shadow-md border-0">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registration ID</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registration Date</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRegistrants.map((reg, index) => (
                    <tr key={reg._id || reg.registrationId || index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{reg.registrationId || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-800 font-medium text-sm">
                              {reg.personalInfo?.firstName?.charAt(0) || ''}
                              {reg.personalInfo?.lastName?.charAt(0) || ''}
                            </span>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {reg.personalInfo?.firstName || ''} {reg.personalInfo?.lastName || ''}
                            </div>
                            {reg.personalInfo?.organization && (
                              <div className="text-xs text-gray-500">{reg.personalInfo.organization}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{reg.personalInfo?.email || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {reg.createdAt ? new Date(reg.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        }) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {renderStatusBadge(reg.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SponsorRegistrantListPage; 