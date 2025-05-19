import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, Button, Alert, Input, Spinner } from '../../components/common';

const SponsorRegistrantManagement = () => {
  const { eventId, sponsorId } = useParams();

  const [sponsorDetails, setSponsorDetails] = useState(null);
  const [registrants, setRegistrants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Form state for adding new registrant
  const [newRegistrantName, setNewRegistrantName] = useState('');
  const [newRegistrantEmail, setNewRegistrantEmail] = useState('');
  const [newRegistrantPhone, setNewRegistrantPhone] = useState('');
  const [formError, setFormError] = useState('');

  const sponsorRegistrantsKey = `sponsorRegistrants_${eventId}_${sponsorId}`;

  const loadSponsorData = useCallback(() => {
    setIsLoading(true);
    setError('');
    try {
      // Load sponsor details to get allotment
      const allSponsorsKey = `eventSponsors_${eventId}`;
      const storedAllSponsors = localStorage.getItem(allSponsorsKey);
      if (storedAllSponsors) {
        const allSponsors = JSON.parse(storedAllSponsors);
        const currentSponsor = allSponsors.find(s => s.sponsorId === sponsorId);
        if (currentSponsor) {
          setSponsorDetails(currentSponsor);
        } else {
          setError('Sponsor details not found.');
        }
      } else {
        setError('Sponsor data for event not found.');
      }

      // Load existing registrants for this sponsor
      const storedRegistrants = localStorage.getItem(sponsorRegistrantsKey);
      if (storedRegistrants) {
        setRegistrants(JSON.parse(storedRegistrants));
      } else {
        setRegistrants([]); // Initialize if none found
      }
    } catch (err) {
      console.error("Error loading sponsor or registrant data:", err);
      setError('Failed to load data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [eventId, sponsorId, sponsorRegistrantsKey]);

  useEffect(() => {
    loadSponsorData();
  }, [loadSponsorData]);

  const handleAddRegistrant = (e) => {
    e.preventDefault();
    setFormError('');

    if (!newRegistrantName.trim() || !newRegistrantEmail.trim() || !newRegistrantPhone.trim()) {
      setFormError('All fields (Name, Email, Phone) are required.');
      return;
    }
    // Basic email validation
    if (!/\S+@\S+\.\S+/.test(newRegistrantEmail)) {
      setFormError('Please enter a valid email address.');
      return;
    }
    // Basic phone validation (e.g., 10 digits)
    if (!/^(\d{10})$/.test(newRegistrantPhone.replace(/\D/g, ''))) {
      setFormError('Please enter a valid 10-digit phone number.');
      return;
    }

    if (sponsorDetails && registrants.length >= sponsorDetails.registrantAllotment) {
      setFormError(`Cannot add more registrants. Allotment of ${sponsorDetails.registrantAllotment} reached.`);
      return;
    }

    const newRegistrant = {
      id: `REG-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`, // Unique ID
      name: newRegistrantName.trim(),
      email: newRegistrantEmail.trim(),
      phone: newRegistrantPhone.trim().replace(/\D/g, ''), // Store only digits for phone
      status: 'Invited', // Default status
    };

    const updatedRegistrants = [...registrants, newRegistrant];
    localStorage.setItem(sponsorRegistrantsKey, JSON.stringify(updatedRegistrants));
    setRegistrants(updatedRegistrants);

    // Clear form
    setNewRegistrantName('');
    setNewRegistrantEmail('');
    setNewRegistrantPhone('');
  };

  const handleDeleteRegistrant = (registrantId) => {
    if (window.confirm("Are you sure you want to delete this registrant?")) {
      const updatedRegistrants = registrants.filter(r => r.id !== registrantId);
      localStorage.setItem(sponsorRegistrantsKey, JSON.stringify(updatedRegistrants));
      setRegistrants(updatedRegistrants);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <Spinner size="lg" />
        <span className="mt-4 text-gray-600 font-medium">Loading sponsor data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <Alert variant="danger" title="Error" className="mb-6 shadow-md">{error}</Alert>
          <Link to={`/portal/sponsor-login/${eventId}`}>
            <Button variant="outline" className="flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Sponsor Portal
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!sponsorDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <Alert variant="warning" title="Sponsor Not Found" className="mb-6 shadow-md">
            Could not retrieve details for the specified sponsor.
          </Alert>
          <Link to={`/portal/sponsor-login/${eventId}`}>
            <Button variant="outline" className="flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Sponsor Portal
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const allotmentReached = registrants.length >= sponsorDetails.registrantAllotment;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Manage Your Registrants
            </h1>
            <div className="text-sm text-gray-600">
              <p className="mb-1">
                <span className="font-medium">Sponsor:</span> {sponsorDetails.companyName}
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                  {sponsorId}
                </span>
              </p>
              <p>
                <span className="font-medium">Event:</span>
                <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded">
                  {eventId}
                </span>
              </p>
            </div>
          </div>
          
          <Link to={`/portal/sponsor-login/${eventId}`} className="mt-4 md:mt-0">
            <Button variant="outline" size="sm" className="flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Sponsor Portal
            </Button>
          </Link>
        </div>

        {/* Allotment Status Card */}
        <Card className="mb-8 shadow-md border-0">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Registrant Allotment</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex flex-col sm:flex-row justify-between items-center">
                <div className="flex items-center mb-4 sm:mb-0">
                  <div className="relative mr-4">
                    <svg className="w-16 h-16 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-14a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V4z" clipRule="evenodd" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-white font-bold">{sponsorDetails.registrantAllotment}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Maximum Allotment</p>
                    <p className="text-3xl font-bold text-gray-900">{sponsorDetails.registrantAllotment}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="relative mr-4">
                    <svg className="w-16 h-16 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12z" />
                      <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3.586l2.293-2.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414L9 9.586V6a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-white font-bold">{registrants.length}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Used Allotment</p>
                    <p className="text-3xl font-bold text-gray-900">{registrants.length}</p>
                  </div>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-6">
                <div className="relative pt-1">
                  <div className="flex mb-2 items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                        Allotment Usage
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold inline-block text-blue-600">
                        {Math.round((registrants.length / sponsorDetails.registrantAllotment) * 100)}%
                      </span>
                    </div>
                  </div>
                  <div className="overflow-hidden h-2 mb-2 text-xs flex rounded bg-blue-100">
                    <div 
                      style={{ width: `${(registrants.length / sponsorDetails.registrantAllotment) * 100}%` }} 
                      className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                        allotmentReached ? 'bg-red-500' : 'bg-blue-500'
                      }`}
                    ></div>
                  </div>
                  <p className={`text-xs ${allotmentReached ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                    {allotmentReached 
                      ? "You have reached your maximum registrant allotment." 
                      : `You can add ${sponsorDetails.registrantAllotment - registrants.length} more registrants.`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Add New Registrant Form */}
        <Card className="mb-8 shadow-md border-0">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Add New Registrant</h2>
            {formError && <Alert variant="danger" title="Form Error" className="mb-4 shadow-sm">{formError}</Alert>}
            
            {allotmentReached ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">Allotment Limit Reached</h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>Your registrant allotment has been reached. You cannot add more registrants.</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleAddRegistrant} className="space-y-6 bg-white rounded-lg">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-6">
                  <div className="sm:col-span-6">
                    <label htmlFor="registrantName" className="block text-sm font-medium text-gray-700">Full Name</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <Input 
                        type="text" 
                        id="registrantName" 
                        value={newRegistrantName} 
                        onChange={(e) => setNewRegistrantName(e.target.value)} 
                        className="pl-10 focus:ring-blue-500 focus:border-blue-500" 
                        placeholder="John Doe"
                        required 
                      />
                    </div>
                  </div>
                  
                  <div className="sm:col-span-3">
                    <label htmlFor="registrantEmail" className="block text-sm font-medium text-gray-700">Email Address</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <Input 
                        type="email" 
                        id="registrantEmail" 
                        value={newRegistrantEmail} 
                        onChange={(e) => setNewRegistrantEmail(e.target.value)} 
                        className="pl-10 focus:ring-blue-500 focus:border-blue-500" 
                        placeholder="john@example.com"
                        required 
                      />
                    </div>
                  </div>
                  
                  <div className="sm:col-span-3">
                    <label htmlFor="registrantPhone" className="block text-sm font-medium text-gray-700">Phone Number</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                      <Input 
                        type="tel" 
                        id="registrantPhone" 
                        value={newRegistrantPhone} 
                        onChange={(e) => setNewRegistrantPhone(e.target.value)} 
                        className="pl-10 focus:ring-blue-500 focus:border-blue-500" 
                        placeholder="1234567890" 
                        required 
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">10 digits, no spaces or special characters</p>
                  </div>
                </div>
                
                <div className="pt-2">
                  <Button 
                    type="submit" 
                    variant="primary"
                    className="w-full sm:w-auto flex items-center justify-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Registrant
                  </Button>
                </div>
              </form>
            )}
          </div>
        </Card>

        {/* Registrants List */}
        <Card className="shadow-md border-0">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Your Registrants ({registrants.length})</h2>
              {registrants.length > 0 && (
                <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {registrants.length} {registrants.length === 1 ? 'Person' : 'People'}
                </span>
              )}
            </div>
            
            {registrants.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No registrants yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by adding a new registrant using the form above.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {registrants.map((reg) => (
                      <tr key={reg.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-800 font-medium">
                                {reg.name.split(' ')[0]?.[0]}{reg.name.split(' ')[1]?.[0]}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{reg.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{reg.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {reg.phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 border border-green-200">
                            {reg.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteRegistrant(reg.id)}
                            className="inline-flex items-center"
                          >
                            <svg className="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SponsorRegistrantManagement; 