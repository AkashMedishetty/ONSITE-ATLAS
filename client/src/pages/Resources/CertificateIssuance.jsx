import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Input, 
  Button, 
  Alert,
  Spinner,
  Select 
} from '../../components/common';
import { useParams } from 'react-router-dom';
import resourceService from '../../services/resourceService';
import registrationService from '../../services/registrationService';

const CertificateIssuance = () => {
  const { eventId } = useParams();
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [registrationId, setRegistrationId] = useState('');
  const [attendeeDetails, setAttendeeDetails] = useState(null);
  const [certificateType, setCertificateType] = useState('');
  const [certificateTypes, setCertificateTypes] = useState([]);
  const [issuanceStatus, setIssuanceStatus] = useState(null);
  const [recentIssuances, setRecentIssuances] = useState([]);

  useEffect(() => {
    // Fetch certificate types and recent issuances
    const fetchCertificateData = async () => {
      try {
        setLoading(true);
        
        // Fetch certificate settings for this event
        const settingsResponse = await resourceService.getCertificateSettings(eventId);
        if (settingsResponse.success && settingsResponse.data.settings?.templates) {
          // Transform settings data to certificate types
          const templates = settingsResponse.data.settings.templates || [];
          const certificateOptions = templates.map(template => ({
            id: template._id,
            name: template.name || 'Certificate'
          }));
          
          console.log('Fetched certificate templates:', certificateOptions);
          
          setCertificateTypes(certificateOptions);
          if (certificateOptions.length > 0) {
            setCertificateType(certificateOptions[0].id);
          }
        } else {
          // If API fails, provide some default options
          console.warn('Using default certificate types as API failed:', settingsResponse);
          setCertificateTypes([
            { id: 'participation', name: 'Certificate of Participation' },
            { id: 'speaking', name: 'Certificate of Speaking' },
            { id: 'attendance', name: 'Certificate of Attendance' },
          ]);
          setCertificateType('participation');
        }

        // Fetch recent issuances - specifically only certificates
        const recentResponse = await resourceService.getRecentScans(eventId, 'certificate', 10);
        console.log('Raw certificate data response:', recentResponse);
        
        if (recentResponse.success && recentResponse.data && recentResponse.data.length > 0) {
          // Double-check that we're only showing certificate resources
          const certificateResources = recentResponse.data.filter(
            resource => resource.type === 'certificate'
          );
          
          console.log('Filtered certificate resources:', certificateResources);
          
          // If we have certificate resources after filtering, show them
          if (certificateResources.length > 0) {
            // Transform API data to match our component's format
            const formattedIssuances = certificateResources.map(cert => {
              // Safely handle date formatting
              let formattedDate = 'Unknown';
              let formattedTime = '';
              
              try {
                if (cert.actionDate) {
                  const date = new Date(cert.actionDate);
                  if (!isNaN(date.getTime())) {
                    formattedTime = date.toLocaleTimeString();
                    formattedDate = date.toLocaleDateString();
                  }
                }
              } catch (e) {
                console.error('Error formatting date:', e);
              }
              
              return {
                id: cert._id || `cert-${Date.now()}`,
                timestamp: cert.actionDate || cert.createdAt,
                displayTime: formattedTime,
                displayDate: formattedDate,
                registrationId: cert.registration?.registrationId || 'Unknown',
                attendeeName: cert.registration 
                  ? `${cert.registration.firstName || cert.registration.personalInfo?.firstName || ''} ${cert.registration.lastName || cert.registration.personalInfo?.lastName || ''}`.trim() 
                  : 'Unknown Attendee',
                certificateType: cert.details?.option || 'Certificate',
                issuedBy: cert.actionBy?.name || 'System'
              };
            });
            
            console.log('Formatted certificate issuances:', formattedIssuances);
            setRecentIssuances(formattedIssuances);
          } else {
            console.log('No certificate resources found after filtering');
            setRecentIssuances([]);
          }
        } else {
          // No certificates issued yet
          console.log('No certificates have been issued yet');
          setRecentIssuances([]);
        }
      } catch (error) {
        console.error('Error fetching certificate data:', error);
        setRecentIssuances([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCertificateData();
  }, [eventId]);
  
  const handleScan = async () => {
    if (!registrationId.trim()) return;
    
    setScanning(true);
    try {
      // Fetch registration details
      const response = await registrationService.getRegistrationByQR(eventId, registrationId);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to find registration');
      }
      
      // Format attendee details from API response
      const registration = response.data;
      
      // Extract eligibility for certificates from registration
      // This might need to be adjusted based on your actual data structure
      const eligibleCertificates = registration.category?.resourcePermissions?.certificates || [];
      
      // Set attendee details
      setAttendeeDetails({
        registrationId: registration.registrationId,
        firstName: registration.personalInfo?.firstName || registration.firstName || '',
        lastName: registration.personalInfo?.lastName || registration.lastName || '',
        email: registration.personalInfo?.email || registration.email || '',
        category: registration.category?.name || 'Unknown',
        organization: registration.personalInfo?.organization || registration.organization || '',
        eligibleCertificates: eligibleCertificates.length ? eligibleCertificates : certificateTypes.map(c => c.id) // If no specific permissions, allow all
      });
      
      setIssuanceStatus(null);
    } catch (error) {
      console.error('Error scanning registration ID:', error);
      setIssuanceStatus({
        type: 'error',
        message: error.message || 'Failed to scan registration ID. Please try again.'
      });
      setAttendeeDetails(null);
    } finally {
      setScanning(false);
    }
  };

  const handleIssue = async () => {
    if (!attendeeDetails || !certificateType) return;
    
    setLoading(true);
    try {
      // Check if attendee is eligible for the selected certificate
      if (attendeeDetails.eligibleCertificates.length > 0 && 
          !attendeeDetails.eligibleCertificates.includes(certificateType)) {
        setIssuanceStatus({
          type: 'error',
          message: `${attendeeDetails.firstName} ${attendeeDetails.lastName} is not eligible for this certificate type.`
        });
        setLoading(false);
        return;
      }
      
      // Get the selected certificate type name
      const certificateName = certificateTypes.find(c => c.id === certificateType)?.name || 'Certificate';
      
      // Record the certificate usage through the API
      const usageResponse = await resourceService.recordResourceUsage(
        {
          eventId,
          type: 'certificate',  // Must match exactly what's in the database
          resourceOptionId: certificateType,
          details: {
            option: certificateName
          }
        },
        attendeeDetails.registrationId
      );
      
      if (!usageResponse.success) {
        throw new Error(usageResponse.message || 'Failed to record certificate issuance');
      }
      
      console.log('Certificate issuance recorded:', usageResponse);
      
      // Create the new issuance object for the UI
      const newIssuance = {
        id: usageResponse.data?._id || Date.now().toString(),
        timestamp: new Date().toISOString(),
        registrationId: attendeeDetails.registrationId,
        attendeeName: `${attendeeDetails.firstName} ${attendeeDetails.lastName}`,
        certificateType: certificateName,
        issuedBy: 'Admin User'
      };
      
      // Update the UI with the new issuance
      setRecentIssuances([newIssuance, ...recentIssuances]);
      
      setIssuanceStatus({
        type: 'success',
        message: `Certificate successfully issued to ${attendeeDetails.firstName} ${attendeeDetails.lastName}!`
      });
      
      // Reset for next scan
      setRegistrationId('');
      setAttendeeDetails(null);
    } catch (error) {
      console.error('Error issuing certificate:', error);
      setIssuanceStatus({
        type: 'error',
        message: error.message || 'Failed to issue certificate. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleScan();
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-6">
      <h2 className="text-2xl font-bold mb-6">Certificate Issuance</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <h3 className="text-xl font-medium mb-4">Issue Certificate</h3>
            
            {issuanceStatus && (
              <Alert 
                type={issuanceStatus.type} 
                message={issuanceStatus.message} 
                className="mb-4"
                onClose={() => setIssuanceStatus(null)}
              />
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Registration ID</label>
                <div className="flex">
                  <Input
                    value={registrationId}
                    onChange={(e) => setRegistrationId(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter or scan registration ID"
                    className="flex-1"
                    disabled={scanning || loading}
                  />
                  <Button 
                    onClick={handleScan}
                    disabled={!registrationId.trim() || scanning || loading}
                    className="ml-2"
                  >
                    {scanning ? <Spinner size="sm" className="mr-2" /> : null}
                    Scan
                  </Button>
                </div>
              </div>
              
              {attendeeDetails && (
                <>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h4 className="font-medium mb-2">Attendee Details</h4>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                      <div>
                        <span className="text-sm text-gray-500">Name:</span>
                        <p>{attendeeDetails.firstName} {attendeeDetails.lastName}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Registration ID:</span>
                        <p>{attendeeDetails.registrationId}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Category:</span>
                        <p>{attendeeDetails.category}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Organization:</span>
                        <p>{attendeeDetails.organization}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Certificate Type</label>
                    <Select
                      options={certificateTypes.map(type => ({
                        value: type.id,
                        label: type.name
                      }))}
                      value={certificateType}
                      onChange={(e) => setCertificateType(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  
                  <Button 
                    onClick={handleIssue}
                    disabled={!certificateType || loading}
                    className="w-full"
                  >
                    {loading ? <Spinner size="sm" className="mr-2" /> : null}
                    Issue Certificate
                  </Button>
                </>
              )}
            </div>
          </Card>
        </div>
        
        <div>
          <Card>
            <h3 className="text-xl font-medium mb-4">Recent Issuances</h3>
            
            <div className="space-y-3">
              {recentIssuances.length === 0 ? (
                <p className="text-gray-500">No recent certificate issuances</p>
              ) : (
                recentIssuances.map(issuance => (
                  <div key={issuance.id} className="border-b pb-3 last:border-b-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{issuance.attendeeName}</p>
                        <p className="text-sm text-gray-600">{issuance.registrationId}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">{issuance.displayTime || 'Unknown time'}</p>
                        <p className="text-xs text-gray-500">{issuance.displayDate || 'Unknown date'}</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{issuance.certificateType}</p>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CertificateIssuance; 