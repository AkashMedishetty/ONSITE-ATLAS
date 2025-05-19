import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Html5QrcodeScanner } from "html5-qrcode";
import {
  ArrowLeftIcon,
  QrCodeIcon,
  ArrowPathIcon,
  ShoppingBagIcon,
  UsersIcon,
  ClockIcon,
  CakeIcon,
  ShoppingCartIcon,
  AcademicCapIcon,
  ExclamationCircleIcon,
  PrinterIcon
} from "@heroicons/react/24/outline";
import { Card, Button, Badge, Spinner, Alert } from "../../components/common";
import toast from 'react-hot-toast';
import eventService from "../../services/eventService";
import resourceService from "../../services/resourceService";
import registrationService from "../../services/registrationService";

// Helper function to get the API base URL (add this)
const getApiBaseUrl = () => {
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:5000'; // Your local backend URL
  } else {
    return process.env.REACT_APP_API_URL || window.location.origin;
  }
};

const ScannerStation = ({ eventId: eventIdProp }) => {
  console.log('--- ScannerStation Component Mounted ---');
  console.log('Received eventId prop:', eventIdProp);
  const { resourceType: resourceTypeParam } = useParams();
  const navigate = useNavigate();
  
  // Use the prop as the definitive eventId
  const eventId = eventIdProp;
  
  // State declarations
  const [event, setEvent] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [selectedResource, setSelectedResource] = useState("");
  const [resourceOptions, setResourceOptions] = useState([]);
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
  const [selectedResourceType, setSelectedResourceType] = useState(resourceTypeParam || "food");
  const [scannerType, setScannerType] = useState("camera");
  const [manualInput, setManualInput] = useState("");
  
  // Refs
  const scannerRef = useRef(null);
  const scannerDivRef = useRef(null);
  const manualInputRef = useRef(null);
  
  // Utility functions
  const getResourceTypeDisplay = (type = selectedResourceType) => {
    if (!type) return "Resource";
    
    switch (type) {
      case "food":
        return "Food";
      case "kits":
        return "Kit Bag";
      case "certificates":
        return "Certificate";
      case "certificatePrinting":
        return "Certificate Printing";
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };
  
  const getResourceTypeIcon = (type) => {
    switch(type) {
      case "food":
        return <CakeIcon className="h-5 w-5 text-blue-500" />;
      case "kits":
        return <ShoppingCartIcon className="h-5 w-5 text-green-500" />;
      case "certificates":
        return <AcademicCapIcon className="h-5 w-5 text-amber-500" />;
      case "certificatePrinting":
        return <PrinterIcon className="h-5 w-5 text-purple-500" />;
      default:
        return <ShoppingBagIcon className="h-5 w-5 text-gray-500" />;
    }
  };
  
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
    
    // Safely access resourceType with fallback
    const resourceDisplay = getResourceTypeDisplay();
    
    if (!selectedResource) {
      setScanResult({
        success: false,
        message: `Please select a ${resourceDisplay ? resourceDisplay.toLowerCase() : 'resource'} option before scanning`
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
  const fetchResourceOptions = async (type = selectedResourceType) => {
    // Ensure we use the eventId from the prop
    if (!eventId) {
      setError('Event ID is missing.');
      console.error('ScannerStation: Event ID prop is missing or undefined.');
      setLoading(false); // Stop loading if ID is missing
      return; // Return early
    }

    try {
      if (!type) {
        console.warn("No resource type provided for fetchResourceOptions");
        return { success: false, message: "Resource type is required" };
      }
      
      console.log(`Fetching ${type} settings for event ${eventId}`);
      
        let settingsResponse;
      if (type === "food") {
          settingsResponse = await resourceService.getFoodSettings(eventId);
          if (settingsResponse.success) {
          console.log("Food settings loaded successfully:", settingsResponse.data);
          
          // For food, we need to extract meals from days
          const days = settingsResponse.data.settings?.days || [];
          
          // Flatten the meals from all days and add unique ID by combining day index and meal name
          const allMeals = [];
          days.forEach((day, dayIndex) => {
            const dayDate = new Date(day.date);
            const formattedDate = dayDate.toLocaleDateString();
            
            const meals = day.meals || [];
            meals.forEach((meal) => {
              // Creating a unique ID by combining day and meal
              const mealId = `${dayIndex}_${meal.name}`;
              allMeals.push({
                _id: mealId,
                name: `${meal.name} (${formattedDate})`,
                dayIndex,
                originalMeal: meal
              });
            });
          });
          
          console.log("Extracted meals:", allMeals);
          
          setResourceOptions(allMeals);
          if (allMeals.length > 0) {
            setSelectedResource(allMeals[0]._id);
          }
        }
      } else if (type === "kits") {
          settingsResponse = await resourceService.getKitSettings(eventId);
          if (settingsResponse.success) {
          console.log("Kit settings loaded successfully:", settingsResponse.data);
          setResourceOptions(settingsResponse.data.settings?.items || []);
          if (settingsResponse.data.settings?.items && settingsResponse.data.settings.items.length > 0) {
            setSelectedResource(settingsResponse.data.settings.items[0]._id);
          }
        }
      } else if (type === "certificates") {
          settingsResponse = await resourceService.getCertificateSettings(eventId);
          if (settingsResponse.success) {
          console.log("Certificate settings loaded successfully:", settingsResponse.data);
          setResourceOptions(settingsResponse.data.settings?.templates || []);
          if (settingsResponse.data.settings?.templates && settingsResponse.data.settings.templates.length > 0) {
            setSelectedResource(settingsResponse.data.settings.templates[0]._id);
          }
          }
        } else if (type === "certificatePrinting") {
          console.log('[FetchResourceOptions] Fetching for certificatePrinting');
          settingsResponse = await resourceService.getCertificatePrintingSettings(eventId);

          // --- DETAILED LOGGING START ---
          console.log('[FetchResourceOptions - CertPrint] Full API Response:', JSON.stringify(settingsResponse, null, 2));
          if (settingsResponse && settingsResponse.data) {
            console.log('[FetchResourceOptions - CertPrint] response.data:', JSON.stringify(settingsResponse.data, null, 2));
            console.log('[FetchResourceOptions - CertPrint] typeof response.data.certificatePrintingTemplates:', typeof settingsResponse.data.certificatePrintingTemplates);
            console.log('[FetchResourceOptions - CertPrint] Array.isArray(response.data.certificatePrintingTemplates):', Array.isArray(settingsResponse.data.certificatePrintingTemplates));
            if (Array.isArray(settingsResponse.data.certificatePrintingTemplates)) {
              console.log('[FetchResourceOptions - CertPrint] response.data.certificatePrintingTemplates CONTENT:', JSON.stringify(settingsResponse.data.certificatePrintingTemplates, null, 2));
            }
          } else {
            console.log('[FetchResourceOptions - CertPrint] response or response.data is null/undefined.');
          }
          // --- DETAILED LOGGING END ---

          if (settingsResponse.success && Array.isArray(settingsResponse.data?.settings?.templates)) {
            console.log('[FetchResourceOptions - CertPrint] Main condition met: Processing response.data.settings.templates');
            const templateList = settingsResponse.data.settings.templates.map(template => ({
              _id: template._id, // This should be the unique ID of the template
              name: template.name || 'Unnamed Template',
              // Add other properties if needed by the component, e.g., type: template.categoryType
            }));
            setResourceOptions(templateList);
            if (templateList.length > 0) {
              setSelectedResource(templateList[0]._id);
            }
            console.log('[FetchResourceOptions - CertPrint] Templates set:', templateList);
          } else {
            // This else will be caught by the generic fallback below if not successful
            console.warn('[FetchResourceOptions - CertPrint] Failed to load templates or data in unexpected format.');
          }
        }
        
        if (!settingsResponse || !settingsResponse.success) {
        console.warn(`Could not load ${type} settings, using fallback data`);
          // Fallback to minimal resource data if API fails
          const fallbackOptions = [
          { _id: `${type}_option_1`, name: `${getResourceTypeDisplay(type)} Option 1` },
          { _id: `${type}_option_2`, name: `${getResourceTypeDisplay(type)} Option 2` }
          ];
          setResourceOptions(fallbackOptions);
          setSelectedResource(fallbackOptions[0]._id);
        }
        
      return settingsResponse;
      } catch (err) {
      console.error(`Error fetching ${type} options:`, err);
      return { success: false, message: err.message };
    }
  };
  
  const fetchRecentScans = useCallback(async () => {
    // Use the eventId from the prop here
    if (!eventId || !selectedResource) return;
    
    setIsLoadingScans(true);
    try {
      const response = await resourceService.getRecentScans(eventId, selectedResourceType, 20, selectedResource);
      if (response.success) {
        setRecentScans(response.data || []);
      } else {
        console.error('Failed to fetch recent scans:', response.message);
        setRecentScans([]);
      }
    } catch (error) {
      console.error('Error fetching recent scans:', error);
      setRecentScans([]);
    } finally {
      setIsLoadingScans(false);
    }
  }, [eventId, selectedResourceType, selectedResource]); // Add eventId dependency
  
  const fetchStatistics = useCallback(async () => {
    // Use the eventId from the prop here
    if (!eventId || !selectedResource) return;
    
    setIsLoadingStats(true);
    try {
      const response = await resourceService.getResourceStatistics(eventId, selectedResourceType, selectedResource);
      
      if (response.success) {
        console.log(`Statistics for ${selectedResourceType} loaded:`, response.data);
        console.log(`Count: ${response.data.count}, Today: ${response.data.today}, Unique: ${response.data.uniqueAttendees}`);
        
        // Set the statistics directly from the response
        setStatistics({
          total: response.data.count || 0,
          today: response.data.today || 0,
          unique: response.data.uniqueAttendees || 0
        });
      } else {
        console.warn(`Could not load ${selectedResourceType} statistics, using default values`);
        setStatistics({
          total: 0,
          today: 0,
          unique: 0
        });
      }
    } catch (err) {
      console.error(`Error fetching ${selectedResourceType} statistics:`, err);
      // Set default stats to prevent UI breaking
      setStatistics({
        total: 0,
        today: 0,
        unique: 0
      });
    } finally {
      setIsLoadingStats(false);
    }
  }, [eventId, selectedResourceType, selectedResource]); // Add eventId dependency
  
  const fetchEventDetails = useCallback(async () => {
    // Use the eventId from the prop here
    if (!eventId) return;
    try {
      const response = await eventService.getEventById(eventId);
      if (response.success) {
        setEvent(response.data);
        console.log("[ScannerStation] Event data loaded:", response.data);
      } else {
        throw new Error(response?.message || "Failed to fetch event details.");
      }
    } catch (err) {
      console.error("[ScannerStation] Error fetching event details:", err);
      setError(err.message || "An error occurred while loading event details.");
    }
  }, [eventId]); // Add eventId dependency
  
  // Handler functions
  const handleResourceTypeChange = async (newType) => {
    console.log(`Changing resource type from ${selectedResourceType} to ${newType}`);
    setSelectedResourceType(newType);
    
    // Stop scanner if it's running
    if (scanning) {
      stopScanner();
    }
    
    // Reset states
    setSelectedResource("");
    setResourceOptions([]);
    setScanResult(null);
    
    // Fetch new options for the selected resource type
    await fetchResourceOptions(newType);
    
    // Fetch recent scans
    await fetchRecentScans();
    
    // Fetch statistics
    await fetchStatistics();
    
    // Update URL without causing a page reload
    navigate(`/events/${eventId}/resources/scanner/${newType}`, { replace: true });
  };
  
  const handleResourceChange = (e) => {
    setSelectedResource(e.target.value);
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
      // Auto-start camera scanner if resource is selected
      if (selectedResource) {
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
  
  // Scanner event handlers
  const onScanSuccess = async (decodedText) => {
    console.log(`QR Code scanned: ${decodedText}`);
    
    // Pause the scanner while processing
    if (scannerRef.current) {
      try {
        scannerRef.current.pause(true);
      } catch (error) {
        console.error("Error pausing scanner:", error);
      }
    }
    
      await processQrCode(decodedText);
    
    // Resume the scanner after processing
      if (scannerRef.current) {
        try {
        setTimeout(() => {
          scannerRef.current?.resume();
        }, 2000); // Delay to allow user to see the result
        } catch (error) {
          console.error("Error resuming scanner:", error);
      }
    }
  };
  
  const onScanFailure = (error) => {
    // Only log specific errors, completely suppress "No MultiFormat Readers" errors
    // as these are normal when no QR code is in view
    if (error && !error.toString().includes("MultiFormat Readers")) {
      console.error("QR Code scan error:", error);
    }
    // Don't show UI errors for regular scan failures - only show for initialization failures
  };
  
  const processQrCode = async (qrData) => {
    // Use the eventId from the prop here
    if (!eventId || !selectedResource) {
      setScanResult({
        success: false,
        message: "Event ID or resource is missing",
        details: "Please check your configuration"
      });
      return;
    }
    
    console.log(`Processing QR Code: ${qrData} for resource ${selectedResource} in event ${eventId}`);
    setScanResult({ processing: true });
    
    try {
      // Safely get resource display name with fallback
      const resourceDisplay = getResourceTypeDisplay();
      const resourceLower = resourceDisplay ? resourceDisplay.toLowerCase() : 'resource';

      // Find the selected resource option
      const selectedOption = resourceOptions.find(opt => opt._id === selectedResource);
      
      // Create resource info object for API calls
      const resourceInfo = {
        type: selectedResourceType,
        selectedOption: selectedOption,
        eventId: eventId,
        // Add the selected resource ID directly to ensure it's available
        resourceOptionId: selectedResource,
        // Include as selectedResource too for redundancy
        selectedResource: selectedResource
      };
      
      // Validate the scan
      console.log(`Validating scan for ${selectedResourceType}, option: `, selectedOption);
      
      // Try to clean up the QR code by trimming whitespace
      const cleanQrCode = qrData.toString().trim();
      console.log("Clean QR code for validation:", cleanQrCode);
      
      // Fix: Pass the correct parameters in the correct order instead of the resourceInfo object
      const validationResponse = await resourceService.validateScan(
        eventId,
        selectedResourceType,
        selectedResource,
        cleanQrCode
      );
      
      console.log("Validation response:", validationResponse);
      
      if (!validationResponse || !validationResponse.success) {
        // If API returns null/undefined or success: false
        setScanResult({
          success: false,
          message: validationResponse?.message || "Invalid scan",
          details: validationResponse?.details || `Unable to validate this ${resourceLower} scan`
        });
        return;
      }
      
      // Record the resource usage
      console.log(`Recording ${selectedResourceType} usage for registration ${cleanQrCode}`);
      console.log("QR code value being passed:", cleanQrCode);
      console.log("Resource info being passed:", JSON.stringify(resourceInfo));
      
      // We now pass the clean QR code to make sure there are no whitespace issues
      const usageResponse = await resourceService.recordResourceUsage(
        resourceInfo,
        cleanQrCode
      );
      
      console.log("Usage response:", usageResponse);
      
      if (!usageResponse || !usageResponse.success) {
        // If API returns null/undefined or success: false
        setScanResult({
          success: false,
          message: usageResponse?.message || `Failed to record ${resourceLower} usage`,
          details: usageResponse?.details || `Error details: ${JSON.stringify(usageResponse)}. The validation was successful, but recording the usage failed.`
        });
        
        // Show a more detailed error alert if possible
        console.error(`Failed to record ${resourceLower} usage. Details:`, usageResponse);
        return;
      }
      
      // Fetch registration details
      let registrationDetails = null;
      try {
        const registrationResponse = await registrationService.scanRegistration(
          eventId,
          { qrCode: cleanQrCode }
        );
      
        if (registrationResponse && registrationResponse.success) {
          registrationDetails = registrationResponse.data;
        }
      } catch (regError) {
        console.warn("Error fetching registration details:", regError);
        // Continue even if registration details fail to load
      }
      
      // Get the display name for the resource option
      let resourceOptionDisplay = "";
      if (selectedResourceType === 'food' && selectedOption) {
        resourceOptionDisplay = selectedOption.name; // This includes date
      } else {
        // For other resource types
        resourceOptionDisplay = resourceOptions.find(r => r._id === selectedResource)?.name || "Selected option";
      }
      
      // Set successful scan result
      setScanResult({
        success: true,
        message: `${resourceDisplay} recorded successfully`,
        registration: registrationDetails,
        resourceOption: resourceOptionDisplay
      });

      // --- PDF PRINTING TRIGGER for 'certificatePrinting' ---
      if (selectedResourceType === 'certificatePrinting') {
        const registrationIdForPdf = validationResponse.data?.registration?._id;
        const templateIdForPdf = selectedResource; // This holds the selected template's _id

        if (registrationIdForPdf && templateIdForPdf && eventId) {
          console.log(`[ProcessQrCode] Attempting to generate PDF for reg: ${registrationIdForPdf}, template: ${templateIdForPdf}`);
          // const pdfUrl = `${getApiBaseUrl()}/api/resources/events/${eventId}/certificate-templates/${templateIdForPdf}/registrations/${registrationIdForPdf}/generate-pdf`;
          // console.log("[ProcessQrCode] Opening PDF URL:", pdfUrl);
          // window.open(pdfUrl, '_blank'); // Old direct open method

          resourceService.getCertificatePdfBlob(eventId, templateIdForPdf, registrationIdForPdf)
            .then(pdfResponse => {
              if (pdfResponse.success && pdfResponse.blob) {
                const fileURL = URL.createObjectURL(pdfResponse.blob);
                window.open(fileURL, '_blank');
                setScanResult(prevResult => {
                  console.log("[ScannerStation] Inside setScanResult (PDF blob success). prevResult:", prevResult);
                  console.log("[ScannerStation] registrationDetails from outer scope (PDF success):", registrationDetails);
                  return {
                    ...prevResult,
                    message: `${resourceDisplay} for ${prevResult?.registration?.name || registrationDetails?.name || 'attendee'} recorded. Certificate PDF generated.`,
                  };
                });
                toast.success('Certificate PDF generated and opened.');
              } else {
                console.error("[ProcessQrCode] Failed to get PDF blob:", pdfResponse.message);
                toast.error(`Failed to generate certificate: ${pdfResponse.message || 'Unknown error'}`);
                setScanResult(prevResult => {
                    console.log("[ScannerStation] Inside setScanResult (PDF blob fetch failed). prevResult:", prevResult);
                    console.log("[ScannerStation] registrationDetails from outer scope (PDF fetch failed):", registrationDetails);
                    return { 
                        ...prevResult,
                        message: `${resourceDisplay} for ${prevResult?.registration?.name || registrationDetails?.name || 'attendee'} recorded. Certificate PDF generation FAILED.`,
                    };
                });
              }
            })
            .catch(err => {
              console.error("[ProcessQrCode] Error in getCertificatePdfBlob call:", err);
              toast.error('Error generating certificate PDF.');
              setScanResult(prevResult => {
                console.log("[ScannerStation] Inside setScanResult (PDF blob promise .catch). prevResult:", prevResult);
                console.log("[ScannerStation] registrationDetails from outer scope (PDF .catch):", registrationDetails);
                return { 
                    ...prevResult,
                    message: `${resourceDisplay} for ${prevResult?.registration?.name || registrationDetails?.name || 'attendee'} recorded. Certificate PDF generation FAILED.`,
                };
              });
            });

        } else {
          console.warn("[ProcessQrCode] Missing IDs for PDF generation:", { registrationIdForPdf, templateIdForPdf, eventId });
          if (selectedResource && selectedResourceType === 'certificatePrinting') {
            toast.error('Could not generate PDF: missing registration or template ID.');
          }
        }
      }
      // --- END PDF PRINTING TRIGGER ---
      
      // Refresh data immediately after successful scan with a sequence of refreshes 
      // to ensure we get the latest data as it propagates through the system
      await fetchRecentScans();
      await fetchStatistics();
      
      // Add multiple refreshes with delays to catch updates as they propagate
      setTimeout(async () => {
        await fetchRecentScans();
        await fetchStatistics();
        
        // One final refresh after a longer delay
        setTimeout(async () => {
          await fetchRecentScans();
          await fetchStatistics();
        }, 5000);
      }, 2000);
    } catch (err) {
      console.error("Error processing QR code:", err);
      setScanResult({
        success: false,
        message: "Error processing scan",
        details: err.message || "An unexpected error occurred"
      });
    }
  };
  
  // Update the formatResourceName function to show original resource names
  const formatResourceName = (resourceName) => {
    // If it's a food resource with a day index prefix (like "0_Breakfast")
    if (resourceName && typeof resourceName === 'string' && resourceName.match(/^\d+_/)) {
      // Look up the full name including date in resourceOptions
      const resourceOption = resourceOptions.find(opt => opt._id === resourceName);
      if (resourceOption && resourceOption.name) {
        return resourceOption.name; // Return the full name with date: "Breakfast (MM/DD/YYYY)"
      }
      // If not found, just use the original name
      return resourceName;
    }
    return resourceName;
  };
  
  // --- useEffect for Initial Data Loading ---
  useEffect(() => {
    console.log('--- ScannerStation useEffect triggered ---');
    // Use the eventId from the prop here
    if (eventId) {
      fetchInitialData();
    } else {
      setError('Event ID is missing. Cannot load initial data.');
      setLoading(false);
    }

    // Cleanup function for scanner
    return () => {
      console.log('--- ScannerStation Component Unmounted --- Stopping Scanner ---');
      stopScanner();
    };
  }, [eventId]); // Add eventId as dependency
  
  // Effect hook to refetch stats and scans when selected resource changes
  useEffect(() => {
    // Use the eventId from the prop here
    if (eventId && selectedResource) {
      fetchStatistics();
      fetchRecentScans();
    }
  }, [eventId, selectedResource, fetchStatistics, fetchRecentScans]); // Add eventId dependency

  // The main data fetching function called on mount
  const fetchInitialData = async () => {
    // Use the eventId from the prop here
    if (!eventId) {
      setError("Event ID is missing.");
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      console.log(`Fetching initial data for event ${eventId}`);
      // Use the eventId from the prop here
      await Promise.all([
        fetchEventDetails(),
        fetchResourceOptions(selectedResourceType) // Fetch options based on initial/URL type
      ]);
      // Statistics and recent scans will be fetched by the other useEffect 
      // once fetchResourceOptions sets the selectedResource
      console.log("Initial data fetch complete.");
    } catch (err) {
      console.error('Error fetching initial data:', err);
      setError(`Failed to load initial data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Render loading state
  if (loading && !event) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center h-64">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-500">Loading scanner data...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <h3 className="text-red-800 font-medium">Error</h3>
          <p className="text-red-700 mt-1">{error}</p>
        </div>
        <Link to={`/events/${eventId}/resources`}>
          <Button variant="outline" leftIcon={<ArrowLeftIcon className="h-5 w-5" />}>
            Back to Resources
          </Button>
        </Link>
      </div>
    );
  }

  // Render main component
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
          Scan attendee QR codes to track {getResourceTypeDisplay().toLowerCase()} distribution for {event?.name}
        </p>
      </div>
      
      {/* Scanner Card */}
      <Card className="p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-2 md:mb-0">{getResourceTypeDisplay()} Distribution</h2>
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
        
        {/* Resource Type Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Resource Type
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
            {["food", "kits", "certificates", "certificatePrinting"].map((type) => (
              <button
                key={type}
                onClick={() => handleResourceTypeChange(type)}
                className={`flex items-center p-3 rounded-md border ${
                  selectedResourceType === type
                    ? "border-primary-500 bg-primary-50 text-primary-700"
                    : "border-gray-300 hover:bg-gray-50"
                }`}
              >
                <span className="mr-2">{getResourceTypeIcon(type)}</span>
                <span>{getResourceTypeDisplay(type)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Resource Option Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select {getResourceTypeDisplay()} Option
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            value={selectedResource}
            onChange={handleResourceChange}
            disabled={scanning && scannerType === "camera"}
          >
            <option value="">-- Select {getResourceTypeDisplay()} --</option>
            {resourceOptions.map((option) => (
              <option key={option._id} value={option._id}>
                {option.name}
              </option>
            ))}
          </select>
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
                <ShoppingBagIcon className="h-5 w-5" />
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
        
        {/* Scanner Controls */}
        {scannerType === "camera" ? (
        <div className="mb-6">
          {!scanning ? (
            <Button
              variant="primary"
              leftIcon={<QrCodeIcon className="h-5 w-5" />}
              onClick={startScanner}
              fullWidth
              disabled={!selectedResource}
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
              <div className="flex space-x-2">
                <input
                  type="text"
                  ref={manualInputRef}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Scan or type QR code value here"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  disabled={!selectedResource}
                />
                <Button
                  type="submit"
                  variant="primary"
                  disabled={!selectedResource || !manualInput.trim()}
                >
                  Scan
                </Button>
              </div>
            </form>
          </div>
        )}
        
        {/* Scanner */}
        {scannerType === "camera" && (
          <div className="mb-6">
            <div id="scanner" ref={scannerDivRef} className={`w-full ${!scanning ? 'hidden' : ''}`}></div>
            {scanning && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800">
                <p className="font-medium">Scanner Tips:</p>
                <ul className="mt-1 list-disc list-inside ml-1 text-blue-700">
                  <li>Hold the QR code steady and ensure good lighting</li>
                  <li>Center the QR code in the scanning area</li>
                  <li>Make sure the entire QR code is visible</li>
                  <li>If scanning fails, try using the manual input option</li>
                </ul>
              </div>
            )}
          </div>
        )}
        
        {/* Scan Result */}
        {scanResult && (
          <div className={`mb-6 p-4 rounded-lg ${
            scanResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-start">
              <div className={`p-2 rounded-full mr-3 ${
                scanResult.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {scanResult.success ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div>
                <h3 className={`font-medium ${
                  scanResult.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {scanResult.message}
                </h3>
                {scanResult.details && (
                  <p className={`text-sm mt-1 ${
                    scanResult.success ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {scanResult.details}
                  </p>
                )}
                {scanResult.registration && (
                  <div className="mt-2 bg-white p-3 rounded border border-gray-200">
                    <div className="flex justify-between">
                      <p className="font-medium">
                        {scanResult.registration.personalInfo?.firstName || scanResult.registration.firstName || ''} {scanResult.registration.personalInfo?.lastName || scanResult.registration.lastName || ''}
                      </p>
                      <Badge variant="primary" size="sm">
                        {scanResult.registration.categoryName || scanResult.registration.category?.name || 'Unknown Category'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      ID: {scanResult.registration.registrationId}
                    </p>
                    {scanResult.resourceOption && (
                      <p className="text-sm text-gray-600 mt-1">
                        Resource: {scanResult.resourceOption}
                      </p>
                  )}
                </div>
                )}
              </div>
            </div>
          </div>
        )}
      
      {/* Recent Scans */}
        <div>
          <h3 className="font-medium text-gray-900 mb-3">Recent Scans</h3>
        
        {recentScans.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-500">No recent scans available</p>
            </div>
        ) : (
            <div className="space-y-2">
            {recentScans.map((scan) => (
                <div key={scan._id || `scan-${scan.timestamp}-${scan.registration?.registrationId}`} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="flex items-start">
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div>
                        {scan.registration ? (
                          <p className="text-sm font-medium text-gray-900">
                            {scan.registration.firstName} {scan.registration.lastName}
                          </p>
                        ) : (
                          <p className="text-sm font-medium text-gray-900">Unknown Registrant</p>
                        )}
                        <p className="text-xs text-gray-500">
                          {scan.registration?.registrationId || 'No ID'} • {scan.registration?.category?.name || 'No Category'}
                        </p>
                    </div>
                      <div className="flex items-center text-xs text-gray-500">
                        <ClockIcon className="h-3 w-3 mr-1" />
                        {formatTimestamp(scan.timestamp)}
                      </div>
                    </div>
                    <div className="mt-1">
                      <Badge variant="primary" size="xs">
                        {formatResourceName(scan.resourceOption?.name) || getResourceTypeDisplay()}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </Card>
    </div>
  );
};

export default ScannerStation; 