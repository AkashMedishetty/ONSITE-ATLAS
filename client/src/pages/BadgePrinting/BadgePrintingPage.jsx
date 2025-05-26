import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import QRCodeGenerator from '../../components/common/QRCodeGenerator';
import DesignerBadgeTemplate from '../../components/badges/BadgeTemplate';
import html2canvas from 'html2canvas';
import eventService from '../../services/eventService';
import registrationService from '../../services/registrationService';
import badgeTemplateService from '../../services/badgeTemplateService';
import jsPDF from 'jspdf';

const BadgePrintingPage = ({ eventId }) => {
  const [event, setEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedRegistrations, setSelectedRegistrations] = useState({});
  const [templatePreview, setTemplatePreview] = useState('standard');
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [batchPrintMode, setBatchPrintMode] = useState(false);
  const [designerTemplate, setDesignerTemplate] = useState(null);
  
  // Add pagination state, similar to RegistrationsTab
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 100, // Default to a large page size for this component
    totalCount: 0,
    totalPages: 1,
  });

  // Filter state
  const [categoryFilter, setCategoryFilter] = useState('');
  const [registrationTypeFilter, setRegistrationTypeFilter] = useState('');
  const [checkInStatusFilter, setCheckInStatusFilter] = useState('');
  const [badgePrintedFilter, setBadgePrintedFilter] = useState('');

  // Helper to get unique values for dropdowns
  const getUniqueValues = (arr, key) => Array.from(new Set(arr.map(item => item[key]).filter(Boolean)));

  // Add allCategories state
  const [allCategories, setAllCategories] = useState([]);

  // Pagination state
  const pageSizes = [25, 50, 100, 250, 500];
  const [isBatchPrinting, setIsBatchPrinting] = useState(false);
  const MAX_BATCH_PRINT = 100;

  // Add categories state
  const [categories, setCategories] = useState([]);

  // Add batchPrintProgress state
  const [batchPrintProgress, setBatchPrintProgress] = useState(0);

  // --- Adopt fetchRegistrations from RegistrationsTab --- 
  const fetchRegistrations = useCallback(async (page = 1, limit = 100, currentSearch = '') => {
    setLoading(true);
    setError(null);
    try {
      const filters = {
        page: page,
        limit: limit,
        ...(currentSearch && { search: currentSearch }),
        ...(categoryFilter && { category: categoryFilter }),
        ...(registrationTypeFilter && { registrationType: registrationTypeFilter }),
        ...(checkInStatusFilter && { status: checkInStatusFilter }),
        ...(badgePrintedFilter && { badgePrinted: badgePrintedFilter }),
      };
      const response = await registrationService.getRegistrations(eventId, filters);
      const backendData = response?.data;
      if (backendData && backendData.success) {
        const fetchedData = Array.isArray(backendData.data) ? backendData.data : [];
        setRegistrations(fetchedData);
        // Extract all unique categories from the full registration list
        const uniqueCategories = [];
        const seen = new Set();
        for (const reg of fetchedData) {
          const cat = reg.category;
          if (cat && cat._id && !seen.has(cat._id)) {
            uniqueCategories.push(cat);
            seen.add(cat._id);
          }
        }
        setAllCategories(uniqueCategories);
        // Warn if duplicate _id values are found
        const idCounts = {};
        for (const reg of fetchedData) {
          idCounts[reg._id] = (idCounts[reg._id] || 0) + 1;
        }
        const dups = Object.entries(idCounts).filter(([id, count]) => count > 1);
        if (dups.length > 0) {
          console.warn('[BadgePrintingPage] Duplicate registration _id values detected:', dups);
        }
        const apiPagination = backendData.pagination || {};
        setPagination({
          currentPage: Number(apiPagination.page) || 1,
          pageSize: Number(apiPagination.limit) || limit,
          totalCount: Number(apiPagination.total) || 0,
          totalPages: Number(apiPagination.totalPages) || 1
        });
      } else {
        throw new Error(backendData?.message || response?.statusText || 'Failed to fetch registrations');
      }
    } catch (err) {
      setError(`Failed to fetch registrations: ${err.message || err.toString()}`);
      setRegistrations([]);
      setAllCategories([]);
      setPagination(prev => ({ ...prev, totalCount: 0, totalPages: 1 }));
    } finally {
      setLoading(false);
    }
  }, [eventId, categoryFilter, registrationTypeFilter, checkInStatusFilter, badgePrintedFilter]);
  // --- End adopted fetchRegistrations ---

  // --- Define handler for when a badge is printed --- 
  const handleBadgePrinted = useCallback(async (registrationId) => {
    console.log(`[BadgePrintingPage] handleBadgePrinted called for ID: ${registrationId}`);
    try {
      const response = await registrationService.checkIn(eventId, registrationId);
      const responseData = response?.data || response;

      if (responseData?.success) {
        console.log(`[BadgePrintingPage] Successfully checked in/marked printed for ${registrationId}`);
        // Update local state using the correct nested structure
        const updatedCheckInData = { isCheckedIn: true, checkedInAt: new Date() }; // Prepare check-in data
        setRegistrations(prevRegistrations =>
          prevRegistrations.map(reg =>
            reg._id === registrationId
              ? { 
                  ...reg, 
                  checkIn: { ...reg.checkIn, ...updatedCheckInData }, // Update nested checkIn
                  badgePrinted: true // Also update badgePrinted status
                }
              : reg
          )
        );
        if (selectedRegistration?._id === registrationId) {
           // Update selected registration state as well
           setSelectedRegistration(prev => ({ 
             ...prev, 
             checkIn: { ...prev.checkIn, ...updatedCheckInData },
             badgePrinted: true
           }));
        }
      } else {
        console.error(`[BadgePrintingPage] Failed to check in ${registrationId}. Response:`, response);
        // Optionally show an error message to the user (e.g., using message.error)
      }
    } catch (error) {
      console.error(`[BadgePrintingPage] Error calling checkIn service:`, error);
      // Optionally show an error message to the user
    }
  }, [eventId, selectedRegistration]); // Include dependencies
  // --- End handleBadgePrinted ---

  // Fetch event data separately and initial registrations
  useEffect(() => {
    if (!eventId) {
      setError('Event ID not provided to BadgePrintingPage');
      setLoading(false);
      return;
    }

    const fetchEvent = async () => {
      try {
        const eventResponse = await eventService.getEventById(eventId);
        setEvent(eventResponse.data?.data || eventResponse.data);
      } catch (err) {
        console.error('[BadgePrintingPage] Error fetching event data:', err);
      }
    };

    const fetchCategories = async () => {
      try {
        const catResponse = await eventService.getEventCategories(eventId);
        if (catResponse.success && Array.isArray(catResponse.data) && catResponse.data.length > 0) {
          setCategories(catResponse.data);
        } else {
          // fallback: extract from registrations after fetch
          setCategories([]);
        }
      } catch (err) {
        setCategories([]);
      }
    };

    const fetchDesignerTemplate = async () => {
      try {
        const response = await badgeTemplateService.getTemplates(eventId);
        if (response.success && Array.isArray(response.data)) {
          const defaultTemplate = response.data.find(t => t.isDefault);
          if (defaultTemplate) {
            setDesignerTemplate(defaultTemplate);
            setTemplatePreview(defaultTemplate);
            console.log('[BadgePrintingPage] Using default designer template:', defaultTemplate);
          } else {
            setDesignerTemplate(null);
            setTemplatePreview('standard');
            console.warn('[BadgePrintingPage] No default designer template found, using standard.');
          }
        } else {
          setDesignerTemplate(null);
          setTemplatePreview('standard');
          console.warn('[BadgePrintingPage] Failed to fetch designer templates, using standard.');
        }
      } catch (err) {
        setDesignerTemplate(null);
        setTemplatePreview('standard');
        console.error('[BadgePrintingPage] Error fetching designer templates:', err);
      }
    };

    setLoading(true);
    fetchEvent();
    fetchCategories();
    fetchDesignerTemplate();
    fetchRegistrations(1, pagination.pageSize, debouncedSearchTerm);
  }, [eventId]);

  // After fetchRegistrations, if categories is empty, fallback to extracting from registrations
  useEffect(() => {
    if (categories.length === 0 && registrations.length > 0) {
      const uniqueCategories = [];
      const seen = new Set();
      for (const reg of registrations) {
        const cat = reg.category;
        if (cat && cat._id && !seen.has(cat._id)) {
          uniqueCategories.push(cat);
          seen.add(cat._id);
        }
      }
      setCategories(uniqueCategories);
    }
  }, [registrations]);

  // Debounce searchTerm -> debouncedSearchTerm
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // 300ms debounce
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Refetch registrations when debounced search term or filters change
  useEffect(() => {
    if (!eventId || loading) return;
    fetchRegistrations(1, pagination.pageSize, debouncedSearchTerm);
  }, [debouncedSearchTerm, eventId, pagination.pageSize, fetchRegistrations, categoryFilter, registrationTypeFilter, checkInStatusFilter, badgePrintedFilter]);

  // Filter registrations based on search term and filters
  const filteredRegistrations = registrations;
  
  // Toggle registration selection
  const toggleRegistrationSelection = (id) => {
    setSelectedRegistrations(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };
  
  // Select all registrations
  const selectAllRegistrations = () => {
    const newSelection = {};
    filteredRegistrations.forEach(reg => {
      newSelection[reg._id] = true;
    });
    setSelectedRegistrations(newSelection);
  };
  
  // Clear all selections
  const clearSelections = () => {
    setSelectedRegistrations({});
  };
  
  // Count selected registrations
  const selectedCount = Object.values(selectedRegistrations).filter(Boolean).length;
  
  // Helper to normalize registration data for badge rendering (copied from RegistrationsTab.jsx)
  function normalizeRegistrationData(reg) {
    if (!reg) return {};
    const personal = reg.personalInfo || {};
    return {
      ...reg,
      firstName: personal.firstName,
      lastName: personal.lastName,
      name: personal.name || `${personal.firstName || ''} ${personal.lastName || ''}`,
      organization: personal.organization,
      country: personal.country,
      designation: personal.designation,
      email: personal.email,
      phone: personal.phone,
      // Add more fields as needed
    };
  }
  
  // Print multiple badges using designer template
  const printMultipleBadges = async () => {
    const selectedRegs = filteredRegistrations.filter(reg => selectedRegistrations[reg._id]);
    if (selectedRegs.length === 0) return;
    if (selectedRegs.length > MAX_BATCH_PRINT) {
      alert(`You can only print up to ${MAX_BATCH_PRINT} badges at a time. Please select fewer registrations.`);
      return;
    }
    setIsBatchPrinting(true);
    setBatchPrintProgress(0);
    // Use the same DPI and logic as single badge print
    const DPIN = 100;
    const size = designerTemplate?.size || { width: 3.375, height: 5.375 };
    const unit = designerTemplate?.unit || 'in';
    let badgeWidthPx, badgeHeightPx;
    if (unit === 'in') {
      badgeWidthPx = (size.width || 0) * DPIN;
      badgeHeightPx = (size.height || 0) * DPIN;
    } else if (unit === 'cm') {
      badgeWidthPx = (size.width || 0) * (DPIN / 2.54);
      badgeHeightPx = (size.height || 0) * (DPIN / 2.54);
    } else if (unit === 'mm') {
      badgeWidthPx = (size.width || 0) * (DPIN / 25.4);
      badgeHeightPx = (size.height || 0) * (DPIN / 25.4);
    } else {
      badgeWidthPx = (size.width || 0);
      badgeHeightPx = (size.height || 0);
    }
    const widthPt = (badgeWidthPx / DPIN) * 72;
    const heightPt = (badgeHeightPx / DPIN) * 72;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: [widthPt, heightPt] });
    // Create a hidden container
    const hiddenDiv = document.createElement('div');
    hiddenDiv.style.position = 'fixed';
    hiddenDiv.style.left = '-9999px';
    hiddenDiv.style.top = '0';
    hiddenDiv.style.width = `${badgeWidthPx}px`;
    hiddenDiv.style.height = `${badgeHeightPx}px`;
    document.body.appendChild(hiddenDiv);
    for (let i = 0; i < selectedRegs.length; i++) {
      setBatchPrintProgress(i + 1);
      const reg = selectedRegs[i];
      const badgeNode = document.createElement('div');
      badgeNode.style.width = `${badgeWidthPx}px`;
      badgeNode.style.height = `${badgeHeightPx}px`;
      hiddenDiv.appendChild(badgeNode);
      const { createRoot } = await import('react-dom/client');
      const root = createRoot(badgeNode);
      root.render(
        <DesignerBadgeTemplate
          template={designerTemplate}
          registrationData={normalizeRegistrationData(reg)}
          previewMode={false}
          scale={1}
        />
      );
      await new Promise(resolve => setTimeout(resolve, 150)); // Give time for render
      const canvas = await html2canvas(badgeNode, { scale: 1, useCORS: true, logging: false, allowTaint: true, width: badgeWidthPx, height: badgeHeightPx });
      const imgData = canvas.toDataURL('image/png');
      if (i > 0) pdf.addPage([widthPt, heightPt], 'portrait');
      pdf.addImage(imgData, 'PNG', 0, 0, widthPt, heightPt);
      root.unmount();
      hiddenDiv.removeChild(badgeNode);
    }
    document.body.removeChild(hiddenDiv);
    setIsBatchPrinting(false);
    setBatchPrintProgress(0);
    pdf.save('badges.pdf');
  };
  
  // Print single badge (previewed)
  const handlePrintSingleBadge = async () => {
    if (!designerTemplate || !selectedRegistration) return;
    // Calculate badge pixel size
    const DPIN = 100;
    const size = designerTemplate.size || { width: 3.375, height: 5.375 };
    const unit = designerTemplate.unit || 'in';
    let badgeWidthPx, badgeHeightPx;
    if (unit === 'in') {
      badgeWidthPx = (size.width || 0) * DPIN;
      badgeHeightPx = (size.height || 0) * DPIN;
    } else if (unit === 'cm') {
      badgeWidthPx = (size.width || 0) * (DPIN / 2.54);
      badgeHeightPx = (size.height || 0) * (DPIN / 2.54);
    } else if (unit === 'mm') {
      badgeWidthPx = (size.width || 0) * (DPIN / 25.4);
      badgeHeightPx = (size.height || 0) * (DPIN / 25.4);
    } else {
      badgeWidthPx = (size.width || 0);
      badgeHeightPx = (size.height || 0);
    }
    // Create a hidden container
    const hiddenDiv = document.createElement('div');
    hiddenDiv.style.position = 'fixed';
    hiddenDiv.style.left = '-9999px';
    hiddenDiv.style.top = '0';
    hiddenDiv.style.width = `${badgeWidthPx}px`;
    hiddenDiv.style.height = `${badgeHeightPx}px`;
    document.body.appendChild(hiddenDiv);
    // Render the badge in the hidden container
    const { createRoot } = await import('react-dom/client');
    const root = createRoot(hiddenDiv);
    root.render(
      <DesignerBadgeTemplate
        template={designerTemplate}
        registrationData={normalizeRegistrationData(selectedRegistration)}
        previewMode={false}
        scale={1}
      />
    );
    await new Promise(resolve => setTimeout(resolve, 100));
    // Capture as image
    const canvas = await html2canvas(hiddenDiv, { scale: 1, useCORS: true, logging: false, allowTaint: true, width: badgeWidthPx, height: badgeHeightPx });
    const dataUrl = canvas.toDataURL('image/png');
    root.unmount();
    document.body.removeChild(hiddenDiv);
    // Print window
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Print Badge</title>
      <style>
        @page { size: ${size.width}${unit} ${size.height}${unit}; margin: 0; }
        body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #fff; }
        .badge-img { width: ${size.width}${unit}; height: ${size.height}${unit}; object-fit: contain; display: block; box-shadow: none; border: none; }
      </style>
      </head><body onload="window.print(); window.onafterprint = function(){ window.close(); }">
        <img src='${dataUrl}' class='badge-img' alt='Badge' />
      </body></html>
    `);
    printWindow.document.close();
  };
  
  // Pagination effect: fetch correct page/size
  useEffect(() => {
    fetchRegistrations(pagination.currentPage, pagination.pageSize, searchTerm);
  }, [pagination.currentPage, pagination.pageSize]);

  // Add this effect to reset pagination to page 1 when any filter changes
  useEffect(() => {
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, [categoryFilter, registrationTypeFilter, checkInStatusFilter, badgePrintedFilter]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Badge Printing</h1>
        <div className="flex gap-3">
          <button
            onClick={() => setBatchPrintMode(!batchPrintMode)}
            className={`btn ${batchPrintMode ? 'btn-primary' : 'btn-outline'}`}
          >
            <i className={`ri-checkbox-multiple-line mr-2`}></i>
            Batch Mode
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Registrations List */}
        <div className="lg:col-span-3 bg-white rounded-lg shadow-soft p-6">
          {/* Search Bar (always visible) */}
          <div className="mb-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i className="ri-search-line text-gray-400"></i>
              </div>
              <input
                type="text"
                className="input pl-10 w-full"
                placeholder="Search any field (name, email, reg ID, etc.)..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          {/* Filters Row (only in batch print mode) */}
          {batchPrintMode && (
            <div className="flex flex-wrap gap-3 mb-4">
              {/* Category Filter */}
              <select
                className="input"
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
              >
                <option value="">All Categories</option>
                {(categories.length > 0 ? categories : allCategories).map(cat =>
                  cat && cat.name ? (
                    <option key={cat._id || cat.name} value={cat._id}>{cat.name}</option>
                  ) : null
                )}
              </select>
              {/* Registration Type Filter */}
              <select
                className="input"
                value={registrationTypeFilter}
                onChange={e => setRegistrationTypeFilter(e.target.value)}
              >
                <option value="">All Types</option>
                {getUniqueValues(registrations, 'registrationType').map(type =>
                  type ? (
                    <option key={type} value={type}>{type}</option>
                  ) : null
                )}
              </select>
              {/* Check-in Status Filter */}
              <select
                className="input"
                value={checkInStatusFilter}
                onChange={e => setCheckInStatusFilter(e.target.value)}
              >
                <option value="">All Check-in Status</option>
                <option value="checkedIn">Checked In</option>
                <option value="notCheckedIn">Not Checked In</option>
              </select>
              {/* Badge Printed Filter */}
              <select
                className="input"
                value={badgePrintedFilter}
                onChange={e => setBadgePrintedFilter(e.target.value)}
              >
                <option value="">All Print Status</option>
                <option value="printed">Printed</option>
                <option value="notPrinted">Not Printed</option>
              </select>
            </div>
          )}
          
          {batchPrintMode && (
            <div className="flex justify-between items-center mb-4 p-3 bg-gray-50 rounded-md">
              <div>
                <span className="text-sm font-medium">{selectedCount} selected</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={selectAllRegistrations}
                  className="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded"
                  disabled={filteredRegistrations.length === 0}
                >
                  Select All
                </button>
                <button
                  onClick={clearSelections}
                  className="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded"
                  disabled={selectedCount === 0}
                >
                  Clear
                </button>
                {selectedCount > 0 && (
                  <button
                    onClick={printMultipleBadges}
                    className="text-xs px-2 py-1 bg-primary-600 hover:bg-primary-700 text-white rounded"
                  >
                    Print Selected
                  </button>
                )}
              </div>
            </div>
          )}
          
          {/* --- Card-based Layout --- */}
          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
            {filteredRegistrations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No registrations found
              </div>
            ) : (
              filteredRegistrations.map((registration, idx) => (
                <motion.div
                  key={registration._id + '-' + idx}
                  className={`p-3 rounded-md border cursor-pointer ${
                    (!batchPrintMode && selectedRegistration?._id === registration._id) || 
                    (batchPrintMode && selectedRegistrations[registration._id])
                      ? 'bg-primary-50 border-primary-200'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => {
                    if (batchPrintMode) {
                      toggleRegistrationSelection(registration._id);
                    } else {
                      // --- Log the registration object being selected --- 
                      console.log('[BadgePrintingPage] Setting selectedRegistration:', registration);
                      console.log('  >> Printed At:', registration?.printedAt);
                      console.log('  >> Printed By:', registration?.printedBy);
                      // --- End Log ---
                      setSelectedRegistration(registration);
                    }
                  }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-start">
                    {batchPrintMode && (
                      <div className="pt-1 pr-3">
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                          selectedRegistrations[registration._id]
                            ? 'bg-primary-500 border-primary-500 text-white'
                            : 'border-gray-300'
                        }`}>
                          {selectedRegistrations[registration._id] && (
                            <i className="ri-check-line text-xs"></i>
                          )}
                        </div>
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        {/* Display Name from personalInfo */}
                        <div className="font-medium text-gray-900">{`${registration.personalInfo?.firstName || ''} ${registration.personalInfo?.lastName || ''}`}</div> 
                        {/* Display Check-in Status */}
                        <div className={`px-2 py-0.5 text-xs rounded-full flex-shrink-0 ${ 
                          registration.checkIn?.isCheckedIn
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {registration.checkIn?.isCheckedIn ? 'Checked In' : 'Not Checked In'}
                        </div>
                      </div>
                      {/* Display Registration ID */}
                      <div className="text-sm text-gray-500 mt-1">{registration.registrationId}</div> 
                      {/* Display Email from personalInfo */}
                      <div className="text-sm text-gray-500 truncate mt-1">{registration.personalInfo?.email}</div> 
                      {/* Display Mobile and Category */}
                      <div className="flex items-center justify-between mt-1">
                        {/* Display Mobile from personalInfo */}
                        <div className="text-xs text-gray-500 truncate mr-2">{registration.personalInfo?.phone || 'N/A'}</div>
                        {/* Display Category */}
                        <div 
                          className="px-1.5 py-0.5 text-xs rounded-full text-white flex-shrink-0"
                          style={{ backgroundColor: registration.category?.color || '#718096' }} 
                        >
                          {registration.category?.name}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
          {/* --- End Card Layout --- */}
        </div>
        
        {/* Badge Preview */}
        <div className="lg:col-span-2">
          {!batchPrintMode && selectedRegistration ? (
            <div className="bg-white rounded-lg shadow-soft p-6">
              <h2 className="text-xl font-semibold mb-6 text-center">Badge Preview</h2>
              {console.log('[BadgePrintingPage] Rendering preview with template:', designerTemplate)}
              <DesignerBadgeTemplate
                registrationData={normalizeRegistrationData(selectedRegistration)}
                eventData={event}
                template={designerTemplate}
                showQR={true}
                showTools={false}
                onBadgePrinted={handleBadgePrinted}
              />
              <div className="flex justify-center mt-4">
                <button
                  onClick={handlePrintSingleBadge}
                  className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
                >
                  Print
                </button>
              </div>
            </div>
          ) : batchPrintMode ? (
            <div className="bg-white rounded-lg shadow-soft p-6">
              <h2 className="text-xl font-semibold mb-4">Batch Printing</h2>
              <p className="text-gray-600 mb-6">
                Select registrations from the list on the left to include them in batch printing.
                You can print up to 8 badges per page.
              </p>
              
              {selectedCount > 0 ? (
                <div>
                  <div className="mb-6">
                    <h3 className="text-lg font-medium mb-2">Selected Registrations</h3>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {registrations
                        .filter(reg => selectedRegistrations[reg._id])
                        .map((reg, idx) => (
                          <div 
                            key={reg._id + '-' + idx}
                            className="px-3 py-1.5 bg-primary-50 text-primary-800 rounded-full text-sm flex items-center"
                          >
                            <span>{reg.name}</span>
                            <button 
                              className="ml-2 text-primary-600 hover:text-primary-800"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleRegistrationSelection(reg._id);
                              }}
                            >
                              <i className="ri-close-line"></i>
                            </button>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                  
                  <div className="flex justify-center">
                    <button
                      onClick={printMultipleBadges}
                      className="btn btn-primary"
                    >
                      <i className="ri-printer-line mr-2"></i>
                      Print {selectedCount} Badge{selectedCount !== 1 ? 's' : ''}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <i className="ri-user-search-line text-5xl mb-4"></i>
                  <p>Select registrations to print badges</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-soft p-6 flex flex-col items-center justify-center h-full">
              <i className="ri-customer-service-line text-5xl text-gray-300 mb-4"></i>
              <h3 className="text-xl font-medium text-gray-700 mb-2">No Registration Selected</h3>
              <p className="text-center text-gray-500 mb-6">
                Select a registration from the list on the left to preview and print their badge.
              </p>
              <p className="text-center text-sm text-gray-400">
                Or switch to batch mode to print multiple badges at once.
              </p>
            </div>
          )}
        </div>
      </div>
      {/* Pagination Controls */}
      <div className="flex items-center justify-between mt-4">
        <div>
          <span>Page </span>
          <select value={pagination.currentPage} onChange={e => setPagination(p => ({ ...p, currentPage: Number(e.target.value) }))}>
            {Array.from({ length: pagination.totalPages }, (_, i) => (
              <option key={i + 1} value={i + 1}>{i + 1}</option>
            ))}
          </select>
          <span> of {pagination.totalPages}</span>
        </div>
        <div>
          <span>Show </span>
          <select value={pagination.pageSize} onChange={e => setPagination(p => ({ ...p, pageSize: Number(e.target.value), currentPage: 1 }))}>
            {pageSizes.map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
          <span> per page</span>
        </div>
        <div>
          <button disabled={pagination.currentPage === 1} onClick={() => setPagination(p => ({ ...p, currentPage: p.currentPage - 1 }))}>Prev</button>
          <button disabled={pagination.currentPage === pagination.totalPages} onClick={() => setPagination(p => ({ ...p, currentPage: p.currentPage + 1 }))}>Next</button>
        </div>
      </div>
      {isBatchPrinting && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded shadow-lg flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mb-4"></div>
            <div className="text-lg font-semibold mb-2">Generating badges for print...</div>
            <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
              <div
                className="bg-primary-500 h-4 rounded-full transition-all duration-200"
                style={{ width: `${batchPrintProgress / Math.max(1, Object.values(selectedRegistrations).filter(Boolean).length) * 100}%` }}
              ></div>
            </div>
            <div className="text-gray-700 mb-2">
              {`Badge ${batchPrintProgress} of ${Object.values(selectedRegistrations).filter(Boolean).length}`}
            </div>
            <div className="text-gray-500">Please wait, this may take a few seconds.</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BadgePrintingPage; 