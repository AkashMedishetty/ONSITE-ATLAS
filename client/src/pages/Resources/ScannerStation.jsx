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
import resourceService, { normalizeResourceType } from "../../services/resourceService";
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
  const { resourceType: resourceTypeParam, id: eventIdFromUrl } = useParams();
  console.log(`[ScannerStation START] Component Mount/Re-render. eventIdProp: ${eventIdProp}, URL eventId: ${eventIdFromUrl}, URL resourceTypeParam: ${resourceTypeParam}`);
  
  const navigate = useNavigate();
  const eventId = eventIdProp;
  const [selectedResourceType, setSelectedResourceType] = useState(() => {
    const initialType = resourceTypeParam || "food";
    console.log(`[ScannerStation START] Initializing selectedResourceType state to: ${initialType} (from URL param: ${resourceTypeParam})`);
    return initialType;
  });
  
  const [event, setEvent] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [selectedResource, setSelectedResource] = useState("");
  const [resourceOptions, setResourceOptions] = useState([]);
  const [scanResult, setScanResult] = useState(null);
  const [recentScans, setRecentScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [statistics, setStatistics] = useState({ total: 0, today: 0, unique: 0 });
  const [isLoadingScans, setIsLoadingScans] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [scannerType, setScannerType] = useState("camera");
  const [manualInput, setManualInput] = useState("");
  const [printFieldsOnly, setPrintFieldsOnly] = useState(true);
  
  const scannerRef = useRef(null);
  const scannerDivRef = useRef(null);
  const manualInputRef = useRef(null);
  
  const getResourceTypeDisplay = (type = selectedResourceType) => {
    if (!type) return "Resource";
    switch (type) {
      case "food": return "Food";
      case "kits": return "Kit Bag";
      case "certificates": return "Certificate";
      case "certificatePrinting": return "Certificate Printing";
      default: return type.charAt(0).toUpperCase() + type.slice(1);
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
  
  const formatResourceName = (resourceName) => {
    // Try to find the resource option by _id in resourceOptions
    if (resourceName && resourceOptions && Array.isArray(resourceOptions)) {
      const found = resourceOptions.find(opt => opt._id === resourceName);
      if (found && found.name) return found.name;
    }
    // Fallback: if it's a food resource with a day index prefix
    if (resourceName && typeof resourceName === 'string' && resourceName.match(/^[0-9]+_/)) {
      const resourceOption = resourceOptions.find(opt => opt._id === resourceName);
      if (resourceOption && resourceOption.name) return resourceOption.name;
    }
    // Fallback to the raw value or a placeholder
    return resourceName || "—";
  };
  
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "—";
    if (timestamp instanceof Date && !isNaN(timestamp)) {
      return timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    const date = new Date(timestamp);
    if (!isNaN(date)) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return "—";
  };
  
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
    setCameraError(null);
    const resourceDisplay = getResourceTypeDisplay();
    if (!selectedResource) {
      setScanResult({
        success: false,
        message: `Please select a ${resourceDisplay ? resourceDisplay.toLowerCase() : 'resource'} option before scanning`
      });
      return;
    }
    if (scannerRef.current) {
      try {
        scannerRef.current.clear();
        scannerRef.current = null;
      } catch (error) {
        console.error("Error clearing previous scanner:", error);
      }
    }
    setScanning(true);
    setTimeout(() => {
      const scannerElement = document.getElementById("scanner");
      if (!scannerElement) {
        console.error("Scanner element not found in DOM");
        setCameraError("Scanner initialization failed: scanner element not found");
        setScanning(false);
        return;
      }
      try {
        const html5Scanner = new Html5QrcodeScanner("scanner", { fps: 5, qrbox: 250, aspectRatio: 1 }, false);
        html5Scanner.render(onScanSuccess, onScanFailure);
        scannerRef.current = html5Scanner;
      } catch (err) {
        console.error("Error initializing scanner:", err);
        setCameraError(`Failed to start scanner: ${err.message}`);
        setScanning(false);
      }
    }, 100);
  };
  
  const fetchResourceOptions = async (type = selectedResourceType) => {
    console.log(`[fetchResourceOptions] Called for type: ${type}, current selectedResourceType state: ${selectedResourceType}`);
    if (!eventId) {
      setError('Event ID is missing.');
      console.error('ScannerStation: Event ID prop is missing or undefined.');
      setLoading(false);
      return; 
    }

    let currentResourceOptions = []; // To check after API call if options were set

    try {
      if (!type) {
        console.warn("No resource type provided for fetchResourceOptions");
        return { success: false, message: "Resource type is required" };
      }
      console.log(`Fetching ${type} settings for event ${eventId}`);
      let settingsResponse;

      if (type === "food") {
        settingsResponse = await resourceService.getFoodSettings(eventId);
        if (settingsResponse && settingsResponse.success) {
          console.log("Food settings loaded successfully:", settingsResponse.data);
          const days = settingsResponse.data.settings?.days || [];
          const allMeals = [];
          days.forEach((day, dayIndex) => {
            const dayDate = new Date(day.date);
            const formattedDate = dayDate.toLocaleDateString();
            const meals = day.meals || [];
            meals.forEach((meal) => {
              const mealId = `${dayIndex}_${meal.name}`;
              allMeals.push({ _id: mealId, name: `${meal.name} (${formattedDate})`, dayIndex, originalMeal: meal });
            });
          });
          console.log("Extracted meals:", allMeals);
          setResourceOptions(allMeals);
          currentResourceOptions = allMeals; // Keep track
          if (allMeals.length > 0) setSelectedResource(allMeals[0]._id);
          else setSelectedResource("");
        }
      } else if (type === "kits") {
        settingsResponse = await resourceService.getKitSettings(eventId);
        if (settingsResponse && settingsResponse.success) {
          console.log("[fetchResourceOptions - Kits] Kit settings loaded successfully:", settingsResponse.data);
          const rawKitItems = settingsResponse.data.settings?.items || [];
          const formattedKitItems = rawKitItems.map((item, index) => ({ _id: item._id || item.id || `kit_item_${index}`, name: item.name || `Unnamed Kit Item ${index + 1}` }));
          console.log("[fetchResourceOptions - Kits] Formatted kit items:", formattedKitItems);
          setResourceOptions(formattedKitItems);
          currentResourceOptions = formattedKitItems; // Keep track
          if (formattedKitItems.length > 0) setSelectedResource(formattedKitItems[0]._id);
          else setSelectedResource("");
        }
      } else if (type === "certificates") {
        settingsResponse = await resourceService.getCertificateSettings(eventId);
        if (settingsResponse && settingsResponse.success) {
          console.log("Certificate settings loaded successfully:", settingsResponse.data);
          const certificateTypes = settingsResponse.data.settings?.types || [];
          setResourceOptions(certificateTypes);
          currentResourceOptions = certificateTypes; // Keep track
          if (certificateTypes.length > 0) setSelectedResource(certificateTypes[0]._id);
          else setSelectedResource("");
        }
      } else if (type === "certificatePrinting") {
        console.log('[FetchResourceOptions] Fetching for certificatePrinting');
        settingsResponse = await resourceService.getCertificatePrintingSettings(eventId);
        console.log('[FetchResourceOptions - CertPrint] Full API Response:', JSON.stringify(settingsResponse, null, 2));
        if (settingsResponse && settingsResponse.success && settingsResponse.data) {
          console.log('[FetchResourceOptions - CertPrint] response.data:', JSON.stringify(settingsResponse.data, null, 2));
          if (Array.isArray(settingsResponse.data.settings?.templates)) {
            const templateList = settingsResponse.data.settings.templates.map(template => ({ _id: template._id, name: template.name || 'Unnamed Template' }));
            setResourceOptions(templateList);
            currentResourceOptions = templateList; // Keep track
            if (templateList.length > 0) setSelectedResource(templateList[0]._id);
            else setSelectedResource("");
            console.log('[FetchResourceOptions - CertPrint] Templates set:', templateList);
          } else {
            console.warn('[FetchResourceOptions - CertPrint] settings.templates is not an array or is missing.');
            setResourceOptions([]); currentResourceOptions = []; setSelectedResource("");
          }
        } else {
          console.log('[FetchResourceOptions - CertPrint] response was not successful or response.data is null/undefined.');
          setResourceOptions([]); currentResourceOptions = []; setSelectedResource("");
        }
      }

      if (!settingsResponse || !settingsResponse.success || (settingsResponse.success && currentResourceOptions.length === 0)) {
        console.warn(`Could not load options for ${type} or options array was empty after API call, using fallback data.`);
        const fallbackOptions = [
          { _id: `${type}_option_1`, name: `${getResourceTypeDisplay(type)} Option 1` },
          { _id: `${type}_option_2`, name: `${getResourceTypeDisplay(type)} Option 2` }
        ];
        setResourceOptions(fallbackOptions);
        if (fallbackOptions.length > 0) setSelectedResource(fallbackOptions[0]._id);
      }
      return settingsResponse;
    } catch (err) {
      console.error(`Error fetching ${type} options:`, err);
      setError(`Failed to fetch ${type} options: ${err.message}`);
      const fallbackOnError = [{ _id: `${type}_error_option_1`, name: `Error Loading ${getResourceTypeDisplay(type)}` }];
      setResourceOptions(fallbackOnError);
      if (fallbackOnError.length > 0) setSelectedResource(fallbackOnError[0]._id); // Ensure selectedResource is also set on error
      return { success: false, message: err.message };
    }
  };
  
  const fetchRecentScans = useCallback(async () => {
    console.log(`[fetchRecentScans] Called. eventId: ${eventId}, selectedResourceType: ${selectedResourceType}, selectedResource: ${selectedResource}`);
    if (!eventId || !selectedResource) {
        console.log("[fetchRecentScans] Aborted: Missing eventId or selectedResource.");
        return;
    }
    setIsLoadingScans(true);
    try {
      const normalizedType = normalizeResourceType(selectedResourceType);
      const response = await resourceService.getRecentScans(eventId, normalizedType, 20, selectedResource);
      console.log(`[fetchRecentScans] API response for ${normalizedType} - ${selectedResource}:`, response);
      if (response.success) setRecentScans(response.data || []);
      else { console.error('Failed to fetch recent scans:', response.message); setRecentScans([]); }
    } catch (error) {
      console.error('Error fetching recent scans:', error); setRecentScans([]);
    } finally { setIsLoadingScans(false); }
  }, [eventId, selectedResourceType, selectedResource]);
  
  const fetchStatistics = useCallback(async () => {
    if (!eventId || !selectedResource) return;
    setIsLoadingStats(true);
    try {
      const normalizedType = normalizeResourceType(selectedResourceType);
      const response = await resourceService.getResourceStatistics(eventId, normalizedType, selectedResource);
      if (response.success) {
        console.log(`Statistics for ${normalizedType} loaded:`, response.data);
        setStatistics({ total: response.data.count || 0, today: response.data.today || 0, unique: response.data.uniqueAttendees || 0 });
      } else {
        console.warn(`Could not load ${normalizedType} statistics, using default values`);
        setStatistics({ total: 0, today: 0, unique: 0 });
      }
    } catch (err) {
      console.error(`Error fetching ${selectedResourceType} statistics:`, err);
      setStatistics({ total: 0, today: 0, unique: 0 });
    } finally { setIsLoadingStats(false); }
  }, [eventId, selectedResourceType, selectedResource]);
  
  const fetchEventDetails = useCallback(async () => {
    if (!eventId) return;
    try {
      const response = await eventService.getEventById(eventId);
      if (response.success) { setEvent(response.data); console.log("[ScannerStation] Event data loaded:", response.data); }
      else throw new Error(response?.message || "Failed to fetch event details.");
    } catch (err) { console.error("[ScannerStation] Error fetching event details:", err); setError(err.message || "An error occurred while loading event details."); }
  }, [eventId]);
  
  const handleResourceTypeChange = async (newType) => {
    console.log(`[handleResourceTypeChange] Called with newType: ${newType}. Current selectedResourceType: ${selectedResourceType}`);
    if (selectedResourceType === newType) return;
    setSelectedResourceType(newType);
    if (scanning) stopScanner();
    setSelectedResource(""); 
    setResourceOptions([]);
    setScanResult(null);
    setRecentScans([]); 
    setStatistics({ total: 0, today: 0, unique: 0 }); 
    await fetchResourceOptions(newType); 
    navigate(`/events/${eventId}/resources/scanner/${newType}`, { replace: true });
  };
  
  const handleResourceChange = (e) => {
    setSelectedResource(e.target.value);
    setScanResult(null);
  };

  const handleScannerTypeChange = (type) => {
    if (scanning && type !== scannerType) stopScanner();
    setScannerType(type);
    setScanResult(null);
    if (type === "manual" && manualInputRef.current) setTimeout(() => { manualInputRef.current.focus(); }, 100);
    else if (type === "camera" && selectedResource) setTimeout(() => { startScanner(); }, 1000);
  };
  
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    await processQrCode(manualInput.trim());
    setManualInput("");
    if (manualInputRef.current) setTimeout(() => { manualInputRef.current.focus(); }, 500);
  };
  
  const onScanSuccess = async (decodedText) => {
    console.log(`QR Code scanned: ${decodedText}`);
    if (scannerRef.current) try { scannerRef.current.pause(true); } catch (error) { console.error("Error pausing scanner:", error); }
    await processQrCode(decodedText);
    if (scannerRef.current) try { setTimeout(() => { scannerRef.current?.resume(); }, 2000); } catch (error) { console.error("Error resuming scanner:", error); }
  };
  
  const onScanFailure = (error) => {
    if (error && !error.toString().includes("MultiFormat Readers")) console.error("QR Code scan error:", error);
  };
  
  const processQrCode = async (qrData) => {
    if (!eventId || !selectedResource) {
      setScanResult({ success: false, message: "Event ID or resource is missing", details: "Please check your configuration" });
      return;
    }
    console.log(`Processing QR Code: ${qrData} for resource ${selectedResource} in event ${eventId}`);
    setScanResult({ processing: true });
    try {
      const resourceDisplay = getResourceTypeDisplay();
      const resourceLower = resourceDisplay ? resourceDisplay.toLowerCase() : 'resource';
      const selectedOptionObj = resourceOptions.find(opt => opt._id === selectedResource);
      const resourceInfo = { type: selectedResourceType, selectedOption: selectedOptionObj, eventId, resourceOptionId: selectedResource, selectedResource };
      const cleanQrCode = qrData.toString().trim();
      const validationResponse = await resourceService.validateScan(eventId, selectedResourceType, selectedResource, cleanQrCode);
      if (!validationResponse || !validationResponse.success) {
        setScanResult({ success: false, message: validationResponse?.message || "Invalid scan", details: validationResponse?.details || `Unable to validate this ${resourceLower} scan` });
        return;
      }
      const usageResponse = await resourceService.recordResourceUsage(resourceInfo, cleanQrCode);
      if (!usageResponse || !usageResponse.success) {
        setScanResult({ success: false, message: usageResponse?.message || `Failed to record ${resourceLower} usage`, details: usageResponse?.details || `Recording failed after successful validation.` });
        return;
      }
      let registrationDetails = null;
      try {
        const registrationResponse = await registrationService.scanRegistration(eventId, { qrCode: cleanQrCode });
        if (registrationResponse && registrationResponse.success) registrationDetails = registrationResponse.data;
      } catch (regError) { console.warn("Error fetching registration details:", regError); }
      let resourceOptionDisplay = selectedOptionObj?.name || "Selected option";
      setScanResult({ success: true, message: `${resourceDisplay} recorded successfully`, registration: registrationDetails, resourceOption: resourceOptionDisplay });

      if (selectedResourceType === 'certificatePrinting') {
        const registrationIdForPdf = validationResponse.data?.registration?._id;
        const templateIdForPdf = selectedResource;
        if (registrationIdForPdf && templateIdForPdf && eventId) {
          resourceService.getCertificatePdfBlob(eventId, templateIdForPdf, registrationIdForPdf, !printFieldsOnly)
            .then(pdfResponse => {
              if (pdfResponse.success && pdfResponse.blob) {
                const fileURL = URL.createObjectURL(pdfResponse.blob);
                window.open(fileURL, '_blank');
                toast.success('Certificate PDF generated and opened.');
                toast('Please select "Landscape" in the print dialog for correct output.', { icon: '🖨️', duration: 8000 });
              } else {
                toast.error(`Failed to generate certificate: ${pdfResponse.message || 'Unknown error'}`);
              }
            })
            .catch(err => { console.error("Error in getCertificatePdfBlob call:", err); toast.error('Error generating certificate PDF.'); });
        }
      }
      await fetchRecentScans();
      await fetchStatistics();
    } catch (err) {
      console.error("Error processing QR code:", err);
      setScanResult({ success: false, message: "Error processing scan", details: err.message || "An unexpected error occurred" });
    }
  };
  
  useEffect(() => {
    console.log(`[useEffect for Initial Load] Triggered. eventId: ${eventId}, URL resourceTypeParam: ${resourceTypeParam}`);
    if (eventId) fetchInitialData();
    else { setError('Event ID is missing. Cannot load initial data.'); setLoading(false); }
    return () => { console.log('--- ScannerStation Component Unmounted --- Stopping Scanner ---'); stopScanner(); };
  }, [eventId]);

  useEffect(() => {
    if (resourceTypeParam && resourceTypeParam !== selectedResourceType) {
      console.log(`[ScannerStation useEffect resourceTypeParam] URL param '${resourceTypeParam}' differs from state '${selectedResourceType}'. Syncing state.`);
      handleResourceTypeChange(resourceTypeParam);
    }
  }, [resourceTypeParam]);

  useEffect(() => {
    console.log(`[useEffect for selectedResource] Triggered. eventId: ${eventId}, selectedResource: ${selectedResource}`);
    if (eventId && selectedResource) { 
      fetchStatistics();
      fetchRecentScans();
    } else if (eventId && !selectedResource) {
      console.log("[useEffect for selectedResource] Clearing scans and stats because selectedResource is empty.");
      setRecentScans([]);
      setStatistics({ total: 0, today: 0, unique: 0 });
    }
  }, [eventId, selectedResource, fetchStatistics, fetchRecentScans]);

  const fetchInitialData = useCallback(async () => {
    console.log(`[fetchInitialData] Called. eventId: ${eventId}, current selectedResourceType state (before fetchOptions): ${selectedResourceType}`);
    if (!eventId) { setError("Event ID is missing."); setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      console.log(`Fetching initial data for event ${eventId}`);
      await Promise.all([
        fetchEventDetails(),
        fetchResourceOptions(selectedResourceType)
      ]);
      console.log("Initial data fetch complete.");
    } catch (err) { console.error('Error fetching initial data:', err); setError(`Failed to load initial data: ${err.message}`);
    } finally { setLoading(false); }
  }, [eventId, selectedResourceType, fetchEventDetails]); // Added fetchEventDetails to deps
  
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center mb-2">
          <Button 
            variant="ghost" 
            size="sm" 
            leftIcon={<ArrowLeftIcon className="h-5 w-5" />}
            onClick={() => navigate(`/events/${eventId}/resources`, { state: { refresh: true } })}
            className="mr-3"
          >
            Back
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Resource Scanner</h1>
        </div>
        <p className="text-gray-500">
          Scan attendee QR codes to track {getResourceTypeDisplay().toLowerCase()} distribution for {event?.name}
        </p>
      </div>
      
      <Card className="p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-2 md:mb-0">{getResourceTypeDisplay()} Distribution</h2>
          <Button 
            variant="outline"
            size="sm"
            leftIcon={<ArrowPathIcon className="h-4 w-4" />}
            onClick={() => { fetchRecentScans(); fetchStatistics(); }}
          >
            Refresh Data
          </Button>
        </div>
        
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
        
        {selectedResourceType === 'certificatePrinting' && (
          <div className="mb-6 flex items-center">
            <input
              type="checkbox"
              id="printFieldsOnly"
              className="mr-2"
              checked={printFieldsOnly}
              onChange={e => setPrintFieldsOnly(e.target.checked)}
            />
            <label htmlFor="printFieldsOnly" className="text-sm text-gray-700">
              Print fields only (for pre-printed certificates)
            </label>
          </div>
        )}
        
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
        
        {cameraError && (
          <div className="mb-6">
            <Alert variant="error" icon={<ExclamationCircleIcon className="h-5 w-5" />}>
              <p className="font-semibold">Camera Error</p>
              <p className="text-sm mt-1">{cameraError}</p>
              <p className="text-sm mt-1">Please check your camera permissions and try again, or use the handheld scanner option.</p>
            </Alert>
          </div>
        )}
        
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