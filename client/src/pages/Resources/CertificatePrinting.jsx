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

const CertificatePrinting = () => {
  const { eventId } = useParams();
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [registrationId, setRegistrationId] = useState('');
  const [attendeeDetails, setAttendeeDetails] = useState(null);
  const [templateId, setTemplateId] = useState('');
  const [templates, setTemplates] = useState([]);
  const [printStatus, setPrintStatus] = useState(null);
  const [recentPrints, setRecentPrints] = useState([]);
  const [certificateData, setCertificateData] = useState({
    name: '',
    abstractTitle: '',
    presentationTitle: ''
  });

  useEffect(() => {
    // Fetch certificate printing templates and recent prints
    const fetchPrintingData = async () => {
      try {
        setLoading(true);
        
        // Fetch certificate printing settings for this event
        const settingsResponse = await resourceService.getCertificatePrintingSettings(eventId);
        if (settingsResponse.success && settingsResponse.data.settings?.templates) {
          // Transform settings data to templates
          const templateList = settingsResponse.data.settings.templates || [];
          const templateOptions = templateList.map(template => ({
            id: template._id,
            name: template.name || 'Certificate Template',
            type: template.type || 'attendance',
            fields: template.fields || []
          }));
          
          console.log('Fetched certificate printing templates:', templateOptions);
          
          setTemplates(templateOptions);
          if (templateOptions.length > 0) {
            setTemplateId(templateOptions[0].id);
          }
        } else {
          // If API fails, provide some default options
          console.warn('Using default certificate printing templates as API failed:', settingsResponse);
          setTemplates([
            { 
              id: 'attendance', 
              name: 'Attendance Certificate', 
              type: 'attendance',
              fields: [{ name: 'name', displayName: 'Full Name', required: true }] 
            },
            { 
              id: 'speaker', 
              name: 'Speaker Certificate', 
              type: 'speaker',
              fields: [
                { name: 'name', displayName: 'Full Name', required: true },
                { name: 'presentationTitle', displayName: 'Presentation Title', required: false }
              ] 
            },
            { 
              id: 'abstract', 
              name: 'Abstract Presenter Certificate', 
              type: 'abstract',
              fields: [
                { name: 'name', displayName: 'Presenter Name', required: true },
                { name: 'abstractTitle', displayName: 'Abstract Title', required: true }
              ] 
            },
            { 
              id: 'workshop', 
              name: 'Workshop Certificate', 
              type: 'workshop',
              fields: [
                { name: 'name', displayName: 'Participant Name', required: true },
                { name: 'workshopTitle', displayName: 'Workshop Title', required: true }
              ] 
            }
          ]);
          setTemplateId('attendance');
        }

        // Fetch recent prints - specifically only certificate printing
        const recentResponse = await resourceService.getRecentScans(eventId, 'certificatePrinting', 10);
        console.log('Raw certificate printing response:', recentResponse);
        
        if (recentResponse.success && recentResponse.data && recentResponse.data.length > 0) {
          // Double-check that we're only showing certificate printing resources
          const certificatePrints = recentResponse.data.filter(
            resource => resource.type === 'certificatePrinting'
          );
          
          console.log('Filtered certificate printing resources:', certificatePrints);
          
          // If we have certificate printing resources after filtering, show them
          if (certificatePrints.length > 0) {
            // Transform API data to match our component's format
            const formattedPrints = certificatePrints.map(print => {
              // Safely handle date formatting
              let formattedDate = 'Unknown';
              let formattedTime = '';
              
              try {
                if (print.actionDate) {
                  const date = new Date(print.actionDate);
                  if (!isNaN(date.getTime())) {
                    formattedTime = date.toLocaleTimeString();
                    formattedDate = date.toLocaleDateString();
                  }
                }
              } catch (e) {
                console.error('Error formatting date:', e);
              }
              
              return {
                id: print._id || `print-${Date.now()}`,
                timestamp: print.actionDate || print.createdAt,
                displayTime: formattedTime,
                displayDate: formattedDate,
                registrationId: print.registration?.registrationId || 'Unknown',
                attendeeName: print.registration 
                  ? `${print.registration.firstName || print.registration.personalInfo?.firstName || ''} ${print.registration.lastName || print.registration.personalInfo?.lastName || ''}`.trim() 
                  : 'Unknown Attendee',
                templateName: print.details?.option || 'Certificate',
                certificateData: print.details?.certificateData || {},
                printedBy: print.actionBy?.name || 'System'
              };
            });
            
            console.log('Formatted certificate prints:', formattedPrints);
            setRecentPrints(formattedPrints);
          } else {
            console.log('No certificate printing resources found after filtering');
            setRecentPrints([]);
          }
        } else {
          // No certificates printed yet
          console.log('No certificates have been printed yet');
          setRecentPrints([]);
        }
      } catch (error) {
        console.error('Error fetching certificate printing data:', error);
        setRecentPrints([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPrintingData();
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
      const eligibleCertificates = registration.category?.resourcePermissions?.certificates || [];
      
      // Set attendee details
      setAttendeeDetails({
        registrationId: registration.registrationId,
        firstName: registration.personalInfo?.firstName || registration.firstName || '',
        lastName: registration.personalInfo?.lastName || registration.lastName || '',
        email: registration.personalInfo?.email || registration.email || '',
        category: registration.category?.name || 'Unknown',
        organization: registration.personalInfo?.organization || registration.organization || '',
        eligibleCertificates: eligibleCertificates.length ? eligibleCertificates : templates.map(t => t.id) // If no specific permissions, allow all
      });
      
      // Initialize certificate data with the attendee's name
      setCertificateData({
        ...certificateData,
        name: `${registration.personalInfo?.firstName || registration.firstName || ''} ${registration.personalInfo?.lastName || registration.lastName || ''}`.trim()
      });
      
      setPrintStatus(null);
    } catch (error) {
      console.error('Error scanning registration ID:', error);
      setPrintStatus({
        type: 'error',
        message: error.message || 'Failed to scan registration ID. Please try again.'
      });
      setAttendeeDetails(null);
    } finally {
      setScanning(false);
    }
  };

  const handlePrint = async () => {
    if (!attendeeDetails || !templateId) return;
    
    // Get the selected template
    const selectedTemplate = templates.find(t => t.id === templateId);
    if (!selectedTemplate) {
      setPrintStatus({
        type: 'error',
        message: 'Selected template not found.'
      });
      return;
    }
    
    // Check if all required fields are filled
    const requiredFields = selectedTemplate.fields.filter(f => f.required).map(f => f.name);
    const missingFields = requiredFields.filter(field => !certificateData[field]);
    
    if (missingFields.length > 0) {
      setPrintStatus({
        type: 'error',
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
      return;
    }
    
    setLoading(true);
    try {
      // Check if attendee is eligible for certificates
      if (attendeeDetails.eligibleCertificates.length > 0 && 
          !attendeeDetails.eligibleCertificates.includes(templateId)) {
        setPrintStatus({
          type: 'error',
          message: `${attendeeDetails.firstName} ${attendeeDetails.lastName} is not eligible for this certificate type.`
        });
        setLoading(false);
        return;
      }
      
      // Process the certificate printing
      const printResponse = await resourceService.processCertificatePrinting(
        eventId,
        templateId,
        attendeeDetails.registrationId,
        certificateData
      );
      
      if (!printResponse.success) {
        throw new Error(printResponse.message || 'Failed to process certificate printing');
      }
      
      console.log('Certificate printing processed:', printResponse);
      
      // Create the new print record for the UI
      const newPrint = {
        id: printResponse.data?._id || Date.now().toString(),
        timestamp: new Date().toISOString(),
        displayTime: new Date().toLocaleTimeString(),
        displayDate: new Date().toLocaleDateString(),
        registrationId: attendeeDetails.registrationId,
        attendeeName: `${attendeeDetails.firstName} ${attendeeDetails.lastName}`,
        templateName: selectedTemplate.name,
        certificateData: certificateData,
        printedBy: 'Admin User'
      };
      
      // Update the UI with the new print
      setRecentPrints([newPrint, ...recentPrints]);
      
      setPrintStatus({
        type: 'success',
        message: `Certificate successfully printed for ${attendeeDetails.firstName} ${attendeeDetails.lastName}!`
      });
      
      // Reset for next scan
      setRegistrationId('');
      setAttendeeDetails(null);
      setCertificateData({
        name: '',
        abstractTitle: '',
        presentationTitle: ''
      });
    } catch (error) {
      console.error('Error printing certificate:', error);
      setPrintStatus({
        type: 'error',
        message: error.message || 'Failed to print certificate. Please try again.'
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
  
  // Get the current selected template
  const selectedTemplate = templates.find(t => t.id === templateId) || null;
  
  // Add a handler for reprinting a certificate
  const handleReprint = async (print) => {
    setLoading(true);
    setPrintStatus(null);
    try {
      // Use the same data as the original print
      const printResponse = await resourceService.processCertificatePrinting(
        eventId,
        templates.find(t => t.name === print.templateName)?.id || print.templateName,
        print.registrationId,
        print.certificateData
      );
      if (!printResponse.success) {
        throw new Error(printResponse.message || 'Failed to reprint certificate');
      }
      setPrintStatus({
        type: 'success',
        message: `Certificate reprinted for ${print.attendeeName}!`
      });
    } catch (error) {
      setPrintStatus({
        type: 'error',
        message: error.message || 'Failed to reprint certificate.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h2 className="text-2xl font-bold mb-6">Certificate Printing</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <h3 className="text-xl font-medium mb-4">Print Certificate</h3>
            
            {printStatus && (
              <Alert 
                type={printStatus.type} 
                message={printStatus.message} 
                className="mb-4"
                onClose={() => setPrintStatus(null)}
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
                    <label className="block text-sm font-medium mb-1">Certificate Template</label>
                    <Select
                      options={templates.map(template => ({
                        value: template.id,
                        label: template.name
                      }))}
                      value={templateId}
                      onChange={(e) => setTemplateId(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  
                  {selectedTemplate && (
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h4 className="font-medium mb-2">Certificate Data</h4>
                      <div className="space-y-3">
                        {selectedTemplate.fields.map(field => (
                          <div key={field.name}>
                            <label className="block text-sm font-medium mb-1">
                              {field.displayName}
                              {field.required && <span className="text-red-500">*</span>}
                            </label>
                            {field.name === 'name' ? (
                              <Input
                                value={certificateData.name}
                                onChange={(e) => setCertificateData({...certificateData, name: e.target.value})}
                                placeholder="Enter full name"
                                disabled={loading}
                              />
                            ) : field.name === 'abstractTitle' ? (
                              <Input
                                value={certificateData.abstractTitle || ''}
                                onChange={(e) => setCertificateData({...certificateData, abstractTitle: e.target.value})}
                                placeholder="Enter abstract/paper title"
                                disabled={loading}
                              />
                            ) : field.name === 'presentationTitle' ? (
                              <Input
                                value={certificateData.presentationTitle || ''}
                                onChange={(e) => setCertificateData({...certificateData, presentationTitle: e.target.value})}
                                placeholder="Enter presentation title"
                                disabled={loading}
                              />
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <Button 
                    onClick={handlePrint}
                    disabled={!templateId || loading}
                    className="w-full"
                  >
                    {loading ? <Spinner size="sm" className="mr-2" /> : null}
                    Print Certificate
                  </Button>
                </>
              )}
            </div>
          </Card>
        </div>
        
        <div>
          <Card>
            <h3 className="text-xl font-medium mb-4">Recent Prints</h3>
            
            <div className="space-y-3">
              {recentPrints.length === 0 ? (
                <p className="text-gray-500">No recent certificate prints</p>
              ) : (
                recentPrints.map(print => (
                  <div key={print.id} className="border-b pb-3 last:border-b-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{print.attendeeName}</p>
                        <p className="text-sm text-gray-600">{print.registrationId}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">{print.displayTime || 'Unknown time'}</p>
                        <p className="text-xs text-gray-500">{print.displayDate || 'Unknown date'}</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{print.templateName}</p>
                    {print.certificateData && Object.keys(print.certificateData).length > 0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        {Object.entries(print.certificateData)
                          .filter(([_, value]) => value)
                          .map(([key, value]) => (
                            <span key={key} className="mr-2">
                              {key}: {value}
                            </span>
                          ))}
                      </div>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2"
                      onClick={() => handleReprint(print)}
                      disabled={loading}
                    >
                      Reprint
                    </Button>
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

export default CertificatePrinting; 