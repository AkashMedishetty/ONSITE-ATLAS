import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { BadgeTemplate, QRCodeGenerator } from '../../components/common';
import eventService from '../../services/eventService';
import registrationService from '../../services/registrationService';

const BadgePrintingPage = ({ eventId }) => {
  const [event, setEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegistrations, setSelectedRegistrations] = useState({});
  const [templatePreview, setTemplatePreview] = useState('standard');
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [batchPrintMode, setBatchPrintMode] = useState(false);
  
  // Add pagination state, similar to RegistrationsTab
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 100, // Default to a large page size for this component
    totalCount: 0,
    totalPages: 1,
  });

  // --- Adopt fetchRegistrations from RegistrationsTab.jsx --- 
  const fetchRegistrations = useCallback(async (page = 1, limit = 100, currentSearch = searchTerm, isSearchUpdate = false) => {
    // Only show full loader on initial load, not during search updates
    if (!isSearchUpdate) {
      setLoading(true);
    }
    // We might want a subtle search-specific loading indicator later
    // else { setIsSearching(true); } 
    
    setError(null);
    console.log(`[BadgePrintingPage] Fetching: Page ${page}, Limit ${limit}, Search: '${currentSearch}', isSearchUpdate: ${isSearchUpdate}`);
    try {
      const filters = {
        page: page,
        limit: limit,
        ...(currentSearch && { search: currentSearch }),
        // We don't have category/status filters on this page, so omit them
      };
      const response = await registrationService.getRegistrations(eventId, filters);
      const backendData = response?.data;

      if (backendData && backendData.success) {
        const fetchedData = Array.isArray(backendData.data) ? backendData.data : [];
        setRegistrations(fetchedData); // Directly use backendData.data

        const apiPagination = backendData.pagination || {};
        const newPaginationState = {
          currentPage: Number(apiPagination.page) || 1,
          pageSize: Number(apiPagination.limit) || limit,
          totalCount: Number(apiPagination.total) || 0,
          totalPages: Number(apiPagination.totalPages) || 1
        };
        setPagination(newPaginationState);
      } else {
        throw new Error(backendData?.message || response?.statusText || 'Failed to fetch registrations');
      }
    } catch (err) {
      console.error('[BadgePrintingPage] Error fetching registrations:', err);
      setError(`Failed to fetch registrations: ${err.message || err.toString()}`);
      setRegistrations([]);
      setPagination(prev => ({ ...prev, totalCount: 0, totalPages: 1 }));
    } finally {
      // Always turn off loading states
      setLoading(false);
      // if (isSearchUpdate) { setIsSearching(false); }
    }
  }, [eventId]); // Remove searchTerm from dependency array here, handle in separate useEffect
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
        // Don't set the main error state here, maybe just log or have separate event error state
      }
    };

    setLoading(true); // Set loading before fetches start
    fetchEvent();
    fetchRegistrations(1, pagination.pageSize, searchTerm); // Initial fetch with default page size/search

  }, [eventId]); // Only refetch event and initial regs when eventId changes

  // Refetch registrations when search term changes (go back to page 1)
  useEffect(() => {
    // Don't run on initial mount or if eventId is missing
    // Check if loading is false before triggering search fetch to avoid conflicts with initial load
    if (!eventId || loading) return; 
    
    console.log('[BadgePrintingPage] Search term changed, fetching page 1');
    
    const timer = setTimeout(() => { 
      // Call fetchRegistrations with isSearchUpdate = true
      fetchRegistrations(1, pagination.pageSize, searchTerm, true); 
    }, 300); // Keep debounce
    
    return () => clearTimeout(timer);

  // Depend only on searchTerm for triggering the search fetch
  // eventId is checked inside, pagination.pageSize is passed directly
  // fetchRegistrations itself is stable due to useCallback (unless eventId changes)
  }, [searchTerm, eventId, pagination.pageSize, fetchRegistrations]); 

  // Filter registrations based on search term - THIS IS NOW HANDLED BY BACKEND
  // We can keep a frontend filter for instant feedback if desired, but the source is `registrations` state
  // For simplicity, let's use the state directly, assuming backend search is sufficient
  const filteredRegistrations = registrations; // Use the fetched registrations directly
  
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
  
  // Print multiple badges
  const printMultipleBadges = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const selectedRegs = registrations.filter(reg => selectedRegistrations[reg._id]);
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Badges</title>
          <style>
            @page {
              size: A4;
              margin: 10mm;
            }
            body {
              margin: 0;
              padding: 0;
              font-family: Arial, sans-serif;
            }
            .badge-container {
              display: flex;
              flex-wrap: wrap;
              justify-content: center;
              gap: 10mm;
            }
            .badge-wrapper {
              width: 88.9mm;
              height: 54mm;
              border: 1px solid #ccc;
              border-radius: 4px;
              overflow: hidden;
              break-inside: avoid;
              margin-bottom: 10mm;
            }
            .badge {
              width: 100%;
              height: 100%;
              background-color: white;
              padding: 4mm;
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
            }
            .badge-header {
              display: flex;
              justify-content: space-between;
              margin-bottom: 3mm;
            }
            .badge-content {
              display: flex;
              flex-grow: 1;
            }
            .badge-info {
              flex-grow: 1;
            }
            .badge-name {
              font-size: 16pt;
              font-weight: bold;
              margin-bottom: 2mm;
            }
            .badge-org {
              font-size: 10pt;
              color: #666;
              margin-bottom: 2mm;
            }
            .badge-category {
              display: inline-block;
              padding: 1mm 3mm;
              border-radius: 10mm;
              font-size: 8pt;
              background-color: #f0f0f0;
            }
            .badge-qr {
              width: 20mm;
              height: 20mm;
            }
            .badge-footer {
              font-size: 8pt;
              color: #666;
              border-top: 1px solid #eee;
              padding-top: 2mm;
              display: flex;
              justify-content: space-between;
            }
            .no-print {
              position: fixed;
              top: 20px;
              right: 20px;
              display: flex;
              gap: 10px;
            }
            @media print {
              .no-print {
                display: none;
              }
            }
          </style>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js"></script>
          <script>
            function generateQRCode(data, size) {
              // Generate QR code using qrcode-generator library
              const qr = qrcode(0, 'L');
              qr.addData(data);
              qr.make();
              return qr.createSvgTag({ cellSize: size, margin: 0 });
            }
            
            function renderQRCodes() {
              document.querySelectorAll('.qr-placeholder').forEach(placeholder => {
                const data = placeholder.getAttribute('data-qr');
                const size = 3; // Cell size in pixels
                placeholder.innerHTML = generateQRCode(data, size);
              });
            }
            
            // Render QR codes once the document is loaded
            window.onload = renderQRCodes;
          </script>
        </head>
        <body>
          <div class="badge-container">
            ${selectedRegs.map(reg => {
              const name = reg.personalInfo ? 
                `${reg.personalInfo.firstName} ${reg.personalInfo.lastName}` : 
                reg.name;
              const regId = reg.registrationId || reg.regId;
              const organization = reg.personalInfo?.organization || reg.organization;
              const categoryName = reg.category?.name || reg.categoryName;
              const categoryColor = reg.category?.color || reg.categoryColor;
              
              const qrData = JSON.stringify({
                id: reg._id,
                regId: regId,
                name: name,
                category: categoryName,
                eventId: event._id
              });
              
              return `
                <div class="badge-wrapper">
                  <div class="badge">
                    <div class="badge-header">
                      <div>
                        <div style="font-weight: bold; font-size: 10pt;">${event.name}</div>
                        <div style="font-size: 8pt; color: #666;">
                          ${new Date(event.startDate).toLocaleDateString()} - ${new Date(event.endDate).toLocaleDateString()}
                        </div>
                      </div>
                      ${event.logo ? `<img src="${event.logo}" alt="Event Logo" style="height: 8mm;">` : ''}
                    </div>
                    <div class="badge-content">
                      <div class="badge-info">
                        <div class="badge-name">${name}</div>
                        <div class="badge-org">${organization}</div>
                        <div class="badge-category" style="background-color: ${categoryColor}; color: white;">${categoryName}</div>
                      </div>
                      <div class="badge-qr">
                        <div class="qr-placeholder" data-qr='${qrData}'></div>
                      </div>
                    </div>
                    <div class="badge-footer">
                      <div>${regId}</div>
                      <div>Printed: ${new Date().toLocaleDateString()}</div>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
          <div class="no-print">
            <button onclick="window.print();" style="padding: 8px 16px; background-color: #4a5568; color: white; border: none; border-radius: 4px; cursor: pointer;">
              Print
            </button>
            <button onclick="window.close();" style="padding: 8px 16px; background-color: #e2e8f0; border: none; border-radius: 4px; cursor: pointer;">
              Close
            </button>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  };
  
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
          <div className="mb-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i className="ri-search-line text-gray-400"></i>
              </div>
              <input
                type="text"
                className="input pl-10 w-full"
                placeholder="Search registrations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
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
              filteredRegistrations.map((registration) => (
                <motion.div
                  key={registration._id}
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
              <BadgeTemplate 
                registrationData={selectedRegistration}
                eventData={event}
                template={templatePreview}
                showQR={true}
                showTools={true}
                onBadgePrinted={handleBadgePrinted}
              />
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
                        .map(reg => (
                          <div 
                            key={reg._id}
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
    </div>
  );
};

export default BadgePrintingPage; 