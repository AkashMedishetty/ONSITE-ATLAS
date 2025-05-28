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
import Modal from '../../components/common/Modal';
import foodService from '../../services/foodService';
import kitService from '../../services/kitService';
import certificateService from '../../services/certificateService';

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
  const [showReprintModal, setShowReprintModal] = useState(false);
  const [reprintData, setReprintData] = useState(null);
  const [showAbstractModal, setShowAbstractModal] = useState(false);
  const [abstractOptions, setAbstractOptions] = useState([]);
  const [selectedAbstractIds, setSelectedAbstractIds] = useState([]);
  const [abstractModalMessage, setAbstractModalMessage] = useState('');
  const [abstractModalLoading, setAbstractModalLoading] = useState(false);
  
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

    let currentResourceOptions = [];

    try {
      if (!type) {
        console.warn("No resource type provided for fetchResourceOptions");
        return { success: false, message: "Resource type is required" };
      }
      console.log(`Fetching ${type} settings for event ${eventId}`);
      let settingsResponse;

      if (type === "food") {
        // Use resourceService for food
        settingsResponse = await resourceService.getFoodSettings(eventId);
        if (settingsResponse && settingsResponse.success) {
          const days = settingsResponse.data?.settings?.days || [];
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
          setResourceOptions(allMeals);
          currentResourceOptions = allMeals;
          if (allMeals.length > 0) setSelectedResource(allMeals[0]._id);
          else setSelectedResource("");
        }
      } else if (type === "kits") {
        // Use resourceService for kits
        settingsResponse = await resourceService.getKitSettings(eventId);
        if (settingsResponse && settingsResponse.success) {
          const rawKitItems = settingsResponse.data?.settings?.items || [];
          const formattedKitItems = rawKitItems.map((item, index) => ({ _id: item._id || item.id || `kit_item_${index}`, name: item.name || `Unnamed Kit Item ${index + 1}` }));
          setResourceOptions(formattedKitItems);
          currentResourceOptions = formattedKitItems;
          if (formattedKitItems.length > 0) setSelectedResource(formattedKitItems[0]._id);
          else setSelectedResource("");
        }
      } else if (type === "certificates") {
        // Use resourceService for certificates
        settingsResponse = await resourceService.getCertificateSettings(eventId);
        if (settingsResponse && settingsResponse.success) {
          const certificateTypes = settingsResponse.data?.settings?.types || [];
          setResourceOptions(certificateTypes);
          currentResourceOptions = certificateTypes;
          if (certificateTypes.length > 0) setSelectedResource(certificateTypes[0]._id);
          else setSelectedResource("");
        }
      } else if (type === "certificatePrinting") {
        // Keep using resourceService for certificatePrinting
        settingsResponse = await resourceService.getCertificatePrintingSettings(eventId);
        if (settingsResponse && settingsResponse.success && settingsResponse.data) {
          if (Array.isArray(settingsResponse.data.settings?.templates)) {
            const templateList = settingsResponse.data.settings.templates;
            setResourceOptions(templateList);
            currentResourceOptions = templateList;
            if (templateList.length > 0) setSelectedResource(templateList[0]._id);
            else setSelectedResource("");
          } else {
            setResourceOptions([]); currentResourceOptions = []; setSelectedResource("");
          }
        } else {
          setResourceOptions([]); currentResourceOptions = []; setSelectedResource("");
        }
      }

      if (!settingsResponse || !settingsResponse.success || (settingsResponse.success && currentResourceOptions.length === 0)) {
        const fallbackOptions = [
          { _id: `${type}_option_1`, name: `${getResourceTypeDisplay(type)} Option 1` },
          { _id: `${type}_option_2`, name: `${getResourceTypeDisplay(type)} Option 2` }
        ];
        setResourceOptions(fallbackOptions);
        if (fallbackOptions.length > 0) setSelectedResource(fallbackOptions[0]._id);
      }
      return settingsResponse;
    } catch (err) {
      setError(`Failed to fetch ${type} options: ${err.message}`);
      const fallbackOnError = [{ _id: `${type}_error_option_1`, name: `Error Loading ${getResourceTypeDisplay(type)}` }];
      setResourceOptions(fallbackOnError);
      if (fallbackOnError.length > 0) setSelectedResource(fallbackOnError[0]._id);
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
    console.log(`[ScannerStation] Processing QR Code: ${qrData} for resource ${selectedResource} in event ${eventId}`);
    setScanResult({ processing: true });
    try {
      const resourceDisplay = getResourceTypeDisplay();
      const resourceLower = resourceDisplay ? resourceDisplay.toLowerCase() : 'resource';
      let resourceOptionIdToSend = selectedResource;
      let selectedOptionObj = resourceOptions.find(opt => opt._id === selectedResource);
      // --- Mapping layer for meals: convert string key to ObjectId ---
      if (selectedResourceType === 'food') {
        // If selectedResource is a string like '0_Breakfast', map to ObjectId using resourceOptions
        if (selectedOptionObj && selectedOptionObj.originalMeal && selectedOptionObj.originalMeal._id) {
          resourceOptionIdToSend = selectedOptionObj.originalMeal._id;
          console.log(`[ScannerStation] Mapped meal string key '${selectedResource}' to ObjectId: ${resourceOptionIdToSend}`);
        } else {
          console.warn(`[ScannerStation] Could not map meal string key '${selectedResource}' to ObjectId. Using as is.`);
        }
      }
      const resourceInfo = { type: selectedResourceType, selectedOption: selectedOptionObj, eventId, resourceOptionId: resourceOptionIdToSend, selectedResource };
      const cleanQrCode = qrData.toString().trim();
      console.log('[ScannerStation] Sending scan validation request:', {
        eventId,
        resourceType: selectedResourceType,
        resourceOptionId: resourceOptionIdToSend,
        qrCode: cleanQrCode
      });
      const validationResponse = await resourceService.validateScan(eventId, selectedResourceType, resourceOptionIdToSend, cleanQrCode);
      if (!validationResponse || !validationResponse.success) {
        // If already used error for certificatePrinting, fetch abstracts and show abstract modal instead of reprint modal
        if (
          selectedResourceType === 'certificatePrinting' &&
          validationResponse?.message?.includes('already been used by this registration')
        ) {
          // Fetch approved abstracts and show modal
          let registrationIdForPdf = validationResponse.data?.registration?._id || cleanQrCode;
          const templateIdForPdf = selectedResource;
          const selectedOptionObj = resourceOptions.find(opt => opt._id === selectedResource);
          console.log('[ScannerStation] Attempting to fetch abstracts for registration:', registrationIdForPdf, 'event:', eventId);
          // Fallback: If registrationIdForPdf is not a valid ObjectId, fetch registration by QR code
          if (!registrationIdForPdf || typeof registrationIdForPdf !== 'string' || registrationIdForPdf.length !== 24) {
            console.warn('[ScannerStation] registrationIdForPdf is not a valid ObjectId. Attempting to fetch registration by QR code:', cleanQrCode);
            try {
              const regResponse = await registrationService.scanRegistration(eventId, { qrCode: cleanQrCode });
              if (regResponse && regResponse.data && regResponse.data.data && regResponse.data.data._id) {
                registrationIdForPdf = regResponse.data.data._id;
                console.log('[ScannerStation] Resolved registration ObjectId:', registrationIdForPdf);
              } else {
                console.error('[ScannerStation] Could not resolve registration ObjectId from QR code:', cleanQrCode, regResponse);
                setAbstractModalMessage('Could not resolve registration for this QR code.');
                setAbstractModalLoading(false);
                return;
              }
            } catch (err) {
              console.error('[ScannerStation] Error fetching registration by QR code:', err);
              setAbstractModalMessage('Error resolving registration for this QR code.');
              setAbstractModalLoading(false);
              return;
            }
          }
          setAbstractModalLoading(true);
          setShowAbstractModal(true);
          setAbstractOptions([]);
          setSelectedAbstractIds([]);
          setAbstractModalMessage('Loading approved abstracts...');
          try {
            console.log('[ScannerStation] Fetching abstracts for event:', eventId, 'registration:', registrationIdForPdf);
            const response = await resourceService.getAbstractsByRegistration(eventId, registrationIdForPdf, 'approved');
            const abstracts = response.data?.data || [];
            console.log('[ScannerStation] Abstracts API response:', abstracts);
            if (!Array.isArray(abstracts) || abstracts.length === 0) {
              setAbstractModalMessage('No approved abstracts found for this registration.');
              setAbstractOptions([]);
              setSelectedAbstractIds([]);
              setAbstractModalLoading(false);
              return;
            }
            setAbstractOptions(abstracts);
            setAbstractModalMessage('Select one or more approved abstracts to reprint certificates for.');
            setSelectedAbstractIds([]); // Clear previous selection
            setAbstractModalLoading(false);
            // Store reprint context for use after selection
            setReprintData({
              registrationId: registrationIdForPdf,
              registrationIdString: validationResponse?.data?.registration?.registrationId || cleanQrCode,
              templateId: templateIdForPdf,
              resourceInfo: { type: selectedResourceType, selectedOption: selectedOptionObj, eventId, resourceOptionId: selectedResource, selectedResource, force: true, registrationId: registrationIdForPdf },
              attendeeName: validationResponse?.data?.registration?.personalInfo?.firstName || ''
            });
          } catch (err) {
            console.error('[ScannerStation] Error loading abstracts:', err);
            setAbstractModalMessage('Error loading abstracts.');
            setAbstractOptions([]);
            setSelectedAbstractIds([]);
            setAbstractModalLoading(false);
          }
          setScanResult(null);
          return;
        }
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
          await handleCertificatePrint(registrationIdForPdf, templateIdForPdf, selectedOptionObj);
        }
      }
      await fetchRecentScans();
      await fetchStatistics();
    } catch (err) {
      console.error("Error processing QR code:", err);
      setScanResult({ success: false, message: "Error processing scan", details: err.message || "An unexpected error occurred" });
    }
  };
  
  // Helper to check if template references Abstract fields
  const templateReferencesAbstract = (template) => {
    if (!template || !Array.isArray(template.fields)) return false;
    return template.fields.some(f => f.dataSource && f.dataSource.startsWith('Abstract.'));
  };

  // Handler to trigger certificate printing with abstract selection logic
  const handleCertificatePrint = async (registrationIdForPdf, templateIdForPdf, templateObj) => {
    if (!templateReferencesAbstract(templateObj)) {
      // No abstract fields, proceed as usual
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
      return;
    }
    // Abstract fields present: fetch approved abstracts
    // Fallback: If registrationIdForPdf is not a valid ObjectId, fetch registration by QR code
    if (!registrationIdForPdf || typeof registrationIdForPdf !== 'string' || registrationIdForPdf.length !== 24) {
      console.warn('[ScannerStation] registrationIdForPdf is not a valid ObjectId. Attempting to fetch registration by QR code:', registrationIdForPdf);
      try {
        const regResponse = await registrationService.scanRegistration(eventId, { qrCode: registrationIdForPdf });
        if (regResponse && regResponse.data && regResponse.data.data && regResponse.data.data._id) {
          registrationIdForPdf = regResponse.data.data._id;
          console.log('[ScannerStation] Resolved registration ObjectId:', registrationIdForPdf);
        } else {
          console.error('[ScannerStation] Could not resolve registration ObjectId from QR code:', registrationIdForPdf, regResponse);
          setAbstractModalMessage('Could not resolve registration for this QR code.');
          setAbstractModalLoading(false);
          return;
        }
      } catch (err) {
        console.error('[ScannerStation] Error fetching registration by QR code:', err);
        setAbstractModalMessage('Error resolving registration for this QR code.');
        setAbstractModalLoading(false);
        return;
      }
    }
    setAbstractModalLoading(true);
    setShowAbstractModal(true);
    setAbstractOptions([]);
    setSelectedAbstractIds([]);
    setAbstractModalMessage('Loading approved abstracts...');
    try {
      console.log('[ScannerStation] Fetching abstracts for event:', eventId, 'registration:', registrationIdForPdf);
      const response = await resourceService.getAbstractsByRegistration(eventId, registrationIdForPdf, 'approved');
      const abstracts = response.data?.data || [];
      console.log('[ScannerStation] Abstracts API response:', abstracts);
      if (!Array.isArray(abstracts) || abstracts.length === 0) {
        setAbstractModalMessage('No approved abstracts found for this registration.');
        setAbstractOptions([]);
        setSelectedAbstractIds([]);
        setAbstractModalLoading(false);
        return;
      }
      setAbstractOptions(abstracts);
      setAbstractModalMessage('Select one or more approved abstracts to print certificates for.');
      setSelectedAbstractIds([]); // Clear previous selection
      setAbstractModalLoading(false);
    } catch (err) {
      console.error('[ScannerStation] Error loading abstracts:', err);
      setAbstractModalMessage('Error loading abstracts.');
      setAbstractOptions([]);
      setSelectedAbstractIds([]);
      setAbstractModalLoading(false);
    }
  };

  // Handler for modal selection
  const handleAbstractModalPrint = () => {
    if (!selectedAbstractIds.length) return;
    setShowAbstractModal(false);
    // If reprintData is set, this is a reprint flow
    if (reprintData) {
      selectedAbstractIds.forEach(async (abstractId) => {
        const usageResponse = await resourceService.recordResourceUsage({
          ...reprintData.resourceInfo,
          force: true,
          registrationId: reprintData.registrationId
        }, reprintData.registrationIdString);
        let registrationObjectId = reprintData.registrationId;
        if (usageResponse && usageResponse.success) {
          // Use ObjectId for PDF generation
          if (usageResponse.data && usageResponse.data.registration) {
            registrationObjectId = usageResponse.data.registration;
          }
          const pdfResponse = await resourceService.getCertificatePdfBlob(
            reprintData.resourceInfo.eventId,
            reprintData.templateId,
            registrationObjectId,
            !printFieldsOnly,
            { abstractId }
          );
          if (pdfResponse.success && pdfResponse.blob) {
            const fileURL = URL.createObjectURL(pdfResponse.blob);
            window.open(fileURL, '_blank');
            toast.success('Certificate PDF generated and opened.');
            toast('Please select "Landscape" in the print dialog for correct output.', { icon: '🖨️', duration: 8000 });
          } else {
            toast.error(`Failed to generate certificate: ${pdfResponse.message || 'Unknown error'}`);
          }
        } else {
          toast.error(usageResponse?.message || 'Failed to reprint certificate.');
        }
      });
      setReprintData(null); // Clear reprint context
      return;
    }
    // Normal print flow for each selected abstract
    selectedAbstractIds.forEach(abstractId => {
      resourceService.getCertificatePdfBlob(eventId, selectedResource, scanResult?.registration?._id, !printFieldsOnly, { abstractId })
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
    });
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
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Certificate Print Mode</label>
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="printMode"
                  value="fieldsOnly"
                  checked={printFieldsOnly}
                  onChange={() => setPrintFieldsOnly(true)}
                  className="mr-2"
                />
                Preprinted (Fields Only)
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="printMode"
                  value="withBackground"
                  checked={!printFieldsOnly}
                  onChange={() => setPrintFieldsOnly(false)}
                  className="mr-2"
                />
                With Background
              </label>
            </div>
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
      {showReprintModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
            <Alert type="error" message={`This certificate has already been printed for this registration.`} />
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="primary"
                onClick={async () => {
                  setShowReprintModal(false);
                  setScanResult({ success: null, message: 'Reprinting...' });
                  // Directly record resource usage (bypassing validation) with force flag
                  const usageResponse = await resourceService.recordResourceUsage({
                    ...reprintData.resourceInfo,
                    force: true // Allow forced reprint
                  }, reprintData.registrationIdString);
                  let registrationObjectId = null;
                  if (usageResponse && usageResponse.success) {
                    setScanResult({ success: true, message: `Certificate reprinted!` });
                    fetchRecentScans();
                    fetchStatistics();
                    // --- Use ObjectId from resource usage response if available ---
                    if (usageResponse.data && usageResponse.data.registration) {
                      registrationObjectId = usageResponse.data.registration;
                    } else {
                      // Fallback: Try to fetch registration ObjectId using scanRegistration
                      try {
                        const regResponse = await registrationService.scanRegistration(reprintData.resourceInfo.eventId, { qrCode: reprintData.registrationIdString });
                        if (regResponse && regResponse.data && regResponse.data.data && regResponse.data.data._id) {
                          registrationObjectId = regResponse.data.data._id;
                        } else {
                          toast.error('Could not find registration for PDF generation.');
                          return;
                        }
                      } catch (err) {
                        toast.error('Error fetching registration details for PDF.');
                        return;
                      }
                    }
                    // --- Use ObjectId for PDF generation ---
                    const pdfResponse = await resourceService.getCertificatePdfBlob(
                      reprintData.resourceInfo.eventId,
                      reprintData.templateId,
                      registrationObjectId, // Use ObjectId, not regId string
                      !printFieldsOnly // Use the current value of printFieldsOnly
                    );
                    if (pdfResponse.success && pdfResponse.blob) {
                      const fileURL = URL.createObjectURL(pdfResponse.blob);
                      window.open(fileURL, '_blank');
                      toast.success('Certificate PDF generated and opened.');
                      toast('Please select "Landscape" in the print dialog for correct output.', { icon: '🖨️', duration: 8000 });
                    } else {
                      toast.error(`Failed to generate certificate: ${pdfResponse.message || 'Unknown error'}`);
                    }
                  } else {
                    setScanResult({ success: false, message: usageResponse?.message || 'Failed to reprint certificate.' });
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
      <Modal
        isOpen={showAbstractModal}
        onClose={() => setShowAbstractModal(false)}
        title="Select Abstract(s) for Certificate Printing"
        size="lg"
        centered
      >
        {abstractModalLoading ? (
          <div className="py-8 text-center text-gray-500">Loading...</div>
        ) : abstractOptions.length === 0 ? (
          <div className="py-8 text-center text-gray-500">{abstractModalMessage}</div>
        ) : (
          <div>
            <div className="mb-4 text-gray-700">{abstractModalMessage}</div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {abstractOptions.map(abs => (
                <label key={abs._id} className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50 cursor-pointer border border-gray-200">
                  <input
                    type="checkbox"
                    checked={selectedAbstractIds.includes(abs._id)}
                    onChange={e => {
                      if (e.target.checked) setSelectedAbstractIds(ids => [...ids, abs._id]);
                      else setSelectedAbstractIds(ids => ids.filter(id => id !== abs._id));
                    }}
                    className="form-checkbox h-5 w-5 text-blue-600"
                  />
                  <div className="flex flex-col">
                    <span className="font-medium text-base text-gray-900">{abs.title}</span>
                    <span className="text-xs text-gray-500">{abs.authors}</span>
                    <span className="text-xs text-gray-400">Category: <span className="font-semibold text-gray-700">{abs.category?.name || 'No Category'}</span></span>
                  </div>
                </label>
              ))}
            </div>
            <div className="mt-6 flex justify-end space-x-2">
              <button
                className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
                onClick={() => setShowAbstractModal(false)}
              >Cancel</button>
              <button
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                disabled={!selectedAbstractIds.length}
                onClick={handleAbstractModalPrint}
              >Print Certificate{selectedAbstractIds.length > 1 ? 's' : ''}</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ScannerStation; 