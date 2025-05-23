import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Html5QrcodeScanner } from "html5-qrcode";
import {
  ArrowLeftIcon,
  QrCodeIcon,
  ArrowPathIcon,
  PrinterIcon,
  UsersIcon,
  ClockIcon,
  ExclamationCircleIcon
} from "@heroicons/react/24/outline";
import { Card, Button, Spinner, Alert, Select } from "../../components/common";
import eventService from "../../services/eventService";
import resourceService from "../../services/resourceService";
import registrationService from "../../services/registrationService";

const CertificatePrintingScanner = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  
  // State declarations
  const [event, setEvent] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [templates, setTemplates] = useState([]);
  const [scanResult, setScanResult] = useState(null);
  const [recentScans, setRecentScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [statistics, setStatistics] = useState({
    total: 0,
    today: 0,
    unique: 0
  });
  const [isLoadingScans, setIsLoadingScans] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [scannerType, setScannerType] = useState("camera");
  const [manualInput, setManualInput] = useState("");
  const [attendeeDetails, setAttendeeDetails] = useState(null);
  const [showReprintModal, setShowReprintModal] = useState(false);
  const [reprintData, setReprintData] = useState(null);
  
  // Refs
  const scannerRef = useRef(null);
  const scannerDivRef = useRef(null);
  const manualInputRef = useRef(null);
  
  // Format timestamp for display
  const formatTimestamp = (timestamp) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch (err) {
      return "Invalid time";
    }
  };
  
  // Scanner management functions
  const stopScanner = () => {
    if (scannerRef.current) {
      try {
        console.log("Stopping and clearing scanner");
        scannerRef.current.clear();
        scannerRef.current = null;
        setScanning(false);
        setCameraError(null);
      } catch (error) {
        console.error("Error stopping scanner:", error);
      }
    }
  };
  
  const startScanner = () => {
    // Clear any previous error
    setCameraError(null);
    
    if (!selectedTemplate) {
      setScanResult({
        success: false,
        message: "Please select a certificate template before scanning"
      });
      return;
    }

    // If a scanner instance exists, clear it first
    if (scannerRef.current) {
      try {
        scannerRef.current.clear();
        scannerRef.current = null;
      } catch (error) {
        console.error("Error clearing previous scanner:", error);
      }
    }
    
    // First set scanning to true so the scanner div is rendered
    setScanning(true);
    
    // Delay scanner initialization slightly to ensure the DOM element is available
    setTimeout(() => {
      const scannerElement = document.getElementById("scanner");
      console.log("Starting scanner with container:", scannerElement);
      
      if (!scannerElement) {
        console.error("Scanner element not found in DOM");
        setCameraError("Scanner initialization failed: scanner element not found");
        setScanning(false);
        return;
      }
      
      try {
        const scanner = new Html5QrcodeScanner(
          "scanner",
          { 
            fps: 5, 
            qrbox: 250,
            aspectRatio: 1,
            showTorchButtonIfSupported: false,
            showZoomSliderIfSupported: false,
            disableFlip: false,
            rememberLastUsedCamera: false
          },
          /* verbose= */ false
        );
        
        scanner.render(onScanSuccess, onScanFailure);
        scannerRef.current = scanner;
      } catch (err) {
        console.error("Error initializing scanner:", err);
        setCameraError(`Failed to start scanner: ${err.message}`);
        setScanning(false);
      }
    }, 100); // Short delay to ensure the DOM has updated
  };
  
  // Data fetching functions
  const fetchEvent = async () => {
    try {
      setLoading(true);
      const response = await eventService.getEvent(eventId);
      if (response.success) {
        setEvent(response.data);
      } else {
        setError(`Failed to load event: ${response.message}`);
      }
    } catch (err) {
      console.error("Error fetching event:", err);
      setError("Failed to load event. Please try refreshing the page.");
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await resourceService.getCertificatePrintingSettings(eventId);
      
      // --- DETAILED LOGGING START ---
      console.log('[FetchTemplates] Full API Response:', JSON.stringify(response, null, 2));
      if (response && response.data) {
        console.log('[FetchTemplates] response.data:', JSON.stringify(response.data, null, 2));
        console.log('[FetchTemplates] typeof response.data.certificatePrintingTemplates:', typeof response.data.certificatePrintingTemplates);
        console.log('[FetchTemplates] Array.isArray(response.data.certificatePrintingTemplates):', Array.isArray(response.data.certificatePrintingTemplates));
        if (Array.isArray(response.data.certificatePrintingTemplates)) {
          console.log('[FetchTemplates] response.data.certificatePrintingTemplates CONTENT:', JSON.stringify(response.data.certificatePrintingTemplates, null, 2));
        }
      } else {
        console.log('[FetchTemplates] response or response.data is null/undefined.');
      }
      // --- DETAILED LOGGING END ---

      if (response.success && Array.isArray(response.data?.certificatePrintingTemplates)) {
        console.log('[FetchTemplates] Main condition met: Processing response.data.certificatePrintingTemplates');
        const templateList = response.data.certificatePrintingTemplates.map(template => ({
          _id: template._id,
          name: template.name || 'Unnamed Template',
          type: template.categoryType || template.type || 'general',
          fields: template.fields || []
        }));
        
        setTemplates(templateList);
        if (templateList.length > 0 && !selectedTemplate) {
          setSelectedTemplate(templateList[0]._id);
        }
      } else if (response.success && response.data.settings?.templates) {
        console.warn('[FetchTemplates] Fallback condition met: Using response.data.settings.templates');
        const templateList = response.data.settings.templates.map(template => ({
          _id: template._id,
          name: template.name || 'Certificate Template',
          type: template.categoryType || template.type || 'attendance',
          fields: template.fields || []
        }));
        setTemplates(templateList);
        if (templateList.length > 0 && !selectedTemplate) {
          setSelectedTemplate(templateList[0]._id);
        }
      } else {
        console.warn('[FetchTemplates] None of the conditions met. Using default certificate printing templates. API Response was:', JSON.stringify(response, null, 2));
        const defaultTemplates = [
          { 
            _id: 'attendance', 
            name: 'Attendance Certificate', 
            type: 'attendance',
            fields: [{ name: 'name', displayName: 'Full Name', required: true }] 
          },
          { 
            _id: 'speaker', 
            name: 'Speaker Certificate', 
            type: 'speaker',
            fields: [
              { name: 'name', displayName: 'Full Name', required: true },
              { name: 'presentationTitle', displayName: 'Presentation Title', required: false }
            ] 
          },
          { 
            _id: 'abstract', 
            name: 'Abstract Presenter Certificate', 
            type: 'abstract',
            fields: [
              { name: 'name', displayName: 'Presenter Name', required: true },
              { name: 'abstractTitle', displayName: 'Abstract Title', required: true }
            ] 
          },
          { 
            _id: 'workshop', 
            name: 'Workshop Certificate', 
            type: 'workshop',
            fields: [
              { name: 'name', displayName: 'Participant Name', required: true },
              { name: 'workshopTitle', displayName: 'Workshop Title', required: true }
            ] 
          }
        ];
        setTemplates(defaultTemplates);
        if (!selectedTemplate) {
          setSelectedTemplate('attendance');
        }
      }
    } catch (error) {
      console.error("Error fetching certificate templates:", error);
      setError("Failed to load certificate templates. Please try refreshing the page.");
    }
  };

  const fetchRecentScans = async () => {
    try {
      setIsLoadingScans(true);
      const response = await resourceService.getRecentScans(eventId, 'certificatePrinting', 10);
      
      if (response.success && response.data) {
        const formattedScans = response.data.map(scan => {
          let formattedDate = '';
          let formattedTime = '';
          
          try {
            if (scan.actionDate) {
              const date = new Date(scan.actionDate);
              if (!isNaN(date.getTime())) {
                formattedTime = date.toLocaleTimeString();
                formattedDate = date.toLocaleDateString();
              }
            }
          } catch (e) {
            console.error('Error formatting date:', e);
          }
          
          return {
            id: scan._id,
            timestamp: scan.actionDate || scan.createdAt,
            displayTime: formattedTime,
            displayDate: formattedDate,
            registrationId: scan.registration?.registrationId || 'Unknown',
            attendeeName: scan.registration 
              ? `${scan.registration.firstName || scan.registration.personalInfo?.firstName || ''} ${scan.registration.lastName || scan.registration.personalInfo?.lastName || ''}`.trim() 
              : 'Unknown Attendee',
            templateName: scan.details?.option || 'Certificate',
            certificateData: scan.details?.certificateData || {},
            printedBy: scan.actionBy?.name || 'System'
          };
        });
        
        setRecentScans(formattedScans);
      } else {
        setRecentScans([]);
      }
    } catch (error) {
      console.error("Error fetching recent scans:", error);
    } finally {
      setIsLoadingScans(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      setIsLoadingStats(true);
      const response = await resourceService.getResourceTypeStatistics(eventId, 'certificatePrinting');
      
      if (response.success && response.data) {
        setStatistics({
          total: response.data.totalCount || 0,
          today: response.data.todayCount || 0,
          unique: response.data.uniqueCount || 0
        });
      }
    } catch (error) {
      console.error("Error fetching statistics:", error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  // Handle scan success
  const onScanSuccess = async (decodedText) => {
    console.log("QR code scanned:", decodedText);
    await processQrCode(decodedText);
  };

  // Handle scan failure
  const onScanFailure = (error) => {
    // We don't need to show error messages for normal scan failures
    // Only log for debugging purposes
    console.debug("QR scan error:", error);
  };

  const processQrCode = async (qrCode) => {
    try {
      // Clear previous scan result
      setScanResult(null);
      setAttendeeDetails(null);
      
      // Validate the QR code format first
      if (!qrCode || qrCode.trim() === "") {
        setScanResult({
          success: false,
          message: "Invalid QR code. Please scan a valid registration QR code."
        });
        return;
      }
      
      // Get registration details from QR code
      const registrationResponse = await registrationService.getRegistrationByQR(eventId, qrCode);
      
      if (!registrationResponse.success) {
        setScanResult({
          success: false,
          message: registrationResponse.message || "Registration not found for this QR code."
        });
        return;
      }
      
      const registration = registrationResponse.data;
      
      // Check if this certificate template is allowed for this registration
      if (!selectedTemplate) {
        setScanResult({
          success: false,
          message: "Please select a certificate template first."
        });
        return;
      }
      
      // Extract eligibility for certificates from registration
      const eligibleCertificates = registration.category?.resourcePermissions?.certificates || [];
      const isEligible = eligibleCertificates.length === 0 || eligibleCertificates.includes(selectedTemplate);
      
      if (!isEligible) {
        setScanResult({
          success: false,
          message: `This registration is not eligible for the selected certificate template.`
        });
        return;
      }
      
      // Set attendee details
      const attendeeInfo = {
        registrationId: registration.registrationId,
        firstName: registration.personalInfo?.firstName || registration.firstName || '',
        lastName: registration.personalInfo?.lastName || registration.lastName || '',
        email: registration.personalInfo?.email || registration.email || '',
        category: registration.category?.name || 'Unknown',
        organization: registration.personalInfo?.organization || registration.organization || '',
      };
      
      setAttendeeDetails(attendeeInfo);
      
      // Prepare certificate data
      const certificateData = {
        name: `${attendeeInfo.firstName} ${attendeeInfo.lastName}`.trim()
      };
      
      // Process the certificate printing
      const printResponse = await resourceService.processCertificatePrinting(
        eventId,
        selectedTemplate,
        registration.registrationId,
        certificateData
      );
      
      if (!printResponse.success) {
        // If already used error, show reprint modal
        if (printResponse.message && printResponse.message.includes('already been used by this registration')) {
          setReprintData({
            registrationId: registration.registrationId,
            templateId: selectedTemplate,
            certificateData,
            attendeeName: `${attendeeInfo.firstName} ${attendeeInfo.lastName}`
          });
          setShowReprintModal(true);
          return;
        }
        setScanResult({
          success: false,
          message: printResponse.message || "Failed to process certificate printing."
        });
        return;
      }
      
      // Success - set the result and update UI
      setScanResult({
        success: true,
        message: `Certificate successfully printed for ${attendeeInfo.firstName} ${attendeeInfo.lastName}!`
      });
      
      // Create the new print record for the UI
      const selectedTemplateName = templates.find(t => t._id === selectedTemplate)?.name || 'Certificate';
      const newPrint = {
        id: printResponse.data?._id || Date.now().toString(),
        timestamp: new Date().toISOString(),
        displayTime: new Date().toLocaleTimeString(),
        displayDate: new Date().toLocaleDateString(),
        registrationId: registration.registrationId,
        attendeeName: `${attendeeInfo.firstName} ${attendeeInfo.lastName}`,
        templateName: selectedTemplateName,
        certificateData: certificateData,
        printedBy: 'Admin User'
      };
      
      // Update the UI with the new print and refresh data
      setRecentScans([newPrint, ...recentScans]);
      fetchStatistics();
      
      // Reset for next scan after 3 seconds
      setTimeout(() => {
        setScanResult(null);
        setAttendeeDetails(null);
      }, 3000);
      
    } catch (error) {
      console.error("Error processing QR code:", error);
      setScanResult({
        success: false,
        message: "An error occurred while processing the scan. Please try again."
      });
    }
  };
  
  const handleTemplateChange = (e) => {
    setSelectedTemplate(e.target.value);
    setScanResult(null);
  };

  const handleScannerTypeChange = (type) => {
    if (scanning && type !== scannerType) {
      stopScanner();
    }
    setScannerType(type);
    setScanResult(null);
    
    // If switching to manual, focus the input
    if (type === "manual" && manualInputRef.current) {
      setTimeout(() => {
        manualInputRef.current.focus();
      }, 100);
    } else if (type === "camera") {
      // Auto-start camera scanner if template is selected
      if (selectedTemplate) {
        // Wait longer for the DOM to update before initializing scanner
        setTimeout(() => {
          startScanner();
        }, 1000);
      }
    }
  };
  
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    
    await processQrCode(manualInput.trim());
    setManualInput("");
    
    // Focus back on input for continuous scanning
    if (manualInputRef.current) {
      setTimeout(() => {
        manualInputRef.current.focus();
      }, 500);
    }
  };
  
  // Effect to initialize the component
  useEffect(() => {
    fetchEvent();
    fetchTemplates();
    fetchRecentScans();
    fetchStatistics();
    
    // Cleanup scanner on unmount
    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.clear();
        } catch (error) {
          console.error("Error cleaning up scanner:", error);
        }
      }
    };
  }, [eventId]);
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center mb-2">
          <Link to={`/events/${eventId}/resources`} className="mr-3">
            <Button variant="ghost" size="sm" leftIcon={<ArrowLeftIcon className="h-5 w-5" />}>
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Resource Scanner</h1>
        </div>
        <p className="text-gray-500">
          Scan attendee QR codes to track certificate printing distribution for {event?.name}
        </p>
      </div>
      
      {/* Scanner Card */}
      <Card className="p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-2 md:mb-0">CertificatePrinting Distribution</h2>
          <Button 
            variant="outline"
            size="sm"
            leftIcon={<ArrowPathIcon className="h-4 w-4" />}
            onClick={() => {
              fetchRecentScans();
              fetchStatistics();
            }}
          >
            Refresh Data
          </Button>
        </div>
        
        {/* Certificate Template Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select CertificatePrinting Option
          </label>
          <Select
            className="w-full"
            value={selectedTemplate}
            onChange={handleTemplateChange}
            disabled={scanning && scannerType === "camera"}
          >
            <option value="">-- Select Certificate Template --</option>
            {templates.map((template) => (
              <option key={template._id} value={template._id}>
                {template.name}
              </option>
            ))}
          </Select>
        </div>
        
        {/* Scanner Type Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Scanner Type
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleScannerTypeChange("camera")}
              className={`flex items-center justify-center p-3 rounded-md border ${
                scannerType === "camera"
                  ? "border-primary-500 bg-primary-50 text-primary-700"
                  : "border-gray-300 hover:bg-gray-50"
              }`}
            >
              <QrCodeIcon className="h-5 w-5 mr-2" />
              <span>Camera Scanner</span>
            </button>
            <button
              onClick={() => handleScannerTypeChange("manual")}
              className={`flex items-center justify-center p-3 rounded-md border ${
                scannerType === "manual"
                  ? "border-primary-500 bg-primary-50 text-primary-700"
                  : "border-gray-300 hover:bg-gray-50"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span>Handheld Scanner</span>
            </button>
          </div>
        </div>
        
        {/* Camera Error Alert */}
        {cameraError && (
          <div className="mb-6">
            <Alert variant="error" icon={<ExclamationCircleIcon className="h-5 w-5" />}>
              <p className="font-semibold">Camera Error</p>
              <p className="text-sm mt-1">{cameraError}</p>
              <p className="text-sm mt-1">Please check your camera permissions and try again, or use the handheld scanner option.</p>
            </Alert>
          </div>
        )}
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-start">
              <div className="p-2 bg-blue-100 text-blue-700 rounded-full mr-3">
                <PrinterIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-blue-700">Total Distributed</p>
                <p className="text-xl font-bold text-blue-900">{statistics.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-start">
              <div className="p-2 bg-green-100 text-green-700 rounded-full mr-3">
                <ClockIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-green-700">Today's Count</p>
                <p className="text-xl font-bold text-green-900">{statistics.today}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-start">
              <div className="p-2 bg-purple-100 text-purple-700 rounded-full mr-3">
                <UsersIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-purple-700">Unique Attendees</p>
                <p className="text-xl font-bold text-purple-900">{statistics.unique}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Scan Result Alert */}
        {scanResult && (
          <div className="mb-6">
            <Alert 
              variant={scanResult.success ? "success" : "error"}
              icon={
                scanResult.success ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <ExclamationCircleIcon className="h-5 w-5" />
                )
              }
            >
              <p className="font-medium">{scanResult.success ? "Success" : "Error"}</p>
              <p className="text-sm mt-1">{scanResult.message}</p>
            </Alert>
          </div>
        )}
        
        {/* Attendee Details */}
        {attendeeDetails && (
          <div className="mb-6 bg-gray-50 p-4 rounded-md">
            <h3 className="font-medium mb-2">Attendee Details</h3>
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
        )}
        
        {/* Scanner Controls */}
        {scannerType === "camera" ? (
          <div className="mb-6">
            {!scanning ? (
              <Button
                variant="primary"
                leftIcon={<QrCodeIcon className="h-5 w-5" />}
                onClick={startScanner}
                fullWidth
                disabled={!selectedTemplate}
              >
                Start Camera Scanner
              </Button>
            ) : (
              <Button
                variant="danger"
                onClick={stopScanner}
                fullWidth
              >
                Stop Camera Scanner
              </Button>
            )}
          </div>
        ) : (
          <div className="mb-6">
            <form onSubmit={handleManualSubmit}>
              <div className="flex">
                <input
                  type="text"
                  ref={manualInputRef}
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="Enter Registration ID or QR code"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  disabled={!selectedTemplate}
                />
                <button
                  type="submit"
                  className="bg-primary-600 text-white px-4 py-2 rounded-r-md hover:bg-primary-700 disabled:bg-primary-300"
                  disabled={!manualInput.trim() || !selectedTemplate}
                >
                  Scan
                </button>
              </div>
            </form>
          </div>
        )}
        
        {/* Scanner Container */}
        {scanning && scannerType === "camera" && (
          <div className="mb-6">
            <div id="scanner" ref={scannerDivRef}></div>
          </div>
        )}
        
        {/* Recent Scans Section */}
        <div>
          <h3 className="text-lg font-medium mb-3">Recent Scans</h3>
          {isLoadingScans ? (
            <div className="flex justify-center py-4">
              <Spinner />
            </div>
          ) : recentScans.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No recent scans available</p>
          ) : (
            <div className="space-y-3">
              {recentScans.map((scan) => (
                <div key={scan.id} className="border-b pb-3 last:border-b-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{scan.attendeeName}</p>
                      <p className="text-sm text-gray-600">{scan.registrationId}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">{scan.displayTime || "Unknown time"}</p>
                      <p className="text-xs text-gray-500">{scan.displayDate || "Unknown date"}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{scan.templateName}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
      {showReprintModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
            <Alert type="error" message={`This certificate has already been printed for ${reprintData?.attendeeName}.`} />
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="primary"
                onClick={async () => {
                  setShowReprintModal(false);
                  setScanResult({ success: null, message: 'Reprinting...' });
                  const reprintResponse = await resourceService.processCertificatePrinting(
                    eventId,
                    reprintData.templateId,
                    reprintData.registrationId,
                    reprintData.certificateData
                  );
                  if (reprintResponse.success) {
                    setScanResult({ success: true, message: `Certificate reprinted for ${reprintData.attendeeName}!` });
                    fetchRecentScans();
                    fetchStatistics();
                  } else {
                    setScanResult({ success: false, message: reprintResponse.message || 'Failed to reprint certificate.' });
                  }
                }}
              >
                Reprint
              </Button>
              <Button variant="outline" onClick={() => setShowReprintModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CertificatePrintingScanner; 