import React, { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import QRCode from 'react-qr-code';
import html2canvas from 'html2canvas';

const BadgeTemplate = ({
  registrationData,
  eventData,
  template = 'standard',
  showQR = true,
  badgeSettings = null,
  showTools = false,
  className = '',
  onBadgePrinted,
}) => {
  // --- Log received props --- 
  console.log('[BadgeTemplate] Received registrationData:', registrationData);
  console.log('  >> Props Printed At:', registrationData?.printedAt);
  console.log('  >> Props Printed By:', registrationData?.printedBy);
  // --- End Log ---
  
  const [isLoading, setIsLoading] = useState(false);
  const badgeRef = useRef(null);
  
  // Process registration data to create QR code value
  const qrValue = registrationData.registrationId || registrationData.regId || 'UNKNOWN_ID';

  // Badge dimensions based on template
  const getDimensions = () => {
    // If we have badge settings with custom dimensions, use those
    if (badgeSettings && badgeSettings.size) {
      return { 
        width: `${badgeSettings.size.width}${badgeSettings.unit || 'in'}`, 
        height: `${badgeSettings.size.height}${badgeSettings.unit || 'in'}`
      };
    }

    // Otherwise use template presets
    switch (template) {
      case 'large':
        return { width: '54mm', height: '85.6mm' }; // CR80 in portrait
      case 'small':
        return { width: '40mm', height: '60mm' };  // Small badge
      case 'landscape':
        return { width: '85.6mm', height: '54mm' }; // CR80 in landscape
      case 'standard':
      default:
        return { width: '54mm', height: '85.6mm' }; // Default to CR80 in portrait
    }
  };

  const dimensions = getDimensions();

  // Get background color from badgeSettings or default to white
  const getBackgroundColor = () => {
    if (badgeSettings && badgeSettings.background) {
      return badgeSettings.background;
    }
    return '#ffffff';
  };

  // Get text color from badgeSettings or default to black
  const getTextColor = () => {
    if (badgeSettings && badgeSettings.textColor) {
      return badgeSettings.textColor;
    }
    return '#000000';
  };

  // Check if a field should be displayed based on badgeSettings
  const shouldShowField = (fieldName) => {
    if (!badgeSettings || !badgeSettings.fields) {
      return true;
    }
    return badgeSettings.fields[fieldName]?.enabled !== false;
  };

  // PATCH: If badgeSettings.elements exists and is empty, show a blank message and STOP rendering anything else
  if (badgeSettings && Array.isArray(badgeSettings.elements) && badgeSettings.elements.length === 0) {
    return (
      <div className="empty-badge-placeholder" style={{width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', fontSize: '1.1em', textAlign: 'center'}}>
        <span>Badge is blank.<br/>Add elements from the left panel.</span>
      </div>
    );
  }

  // Print badge functionality
  const printBadge = async () => {
    if (!badgeRef.current) return;
    
    if (registrationData?.badgePrinted) {
      const printedByName = registrationData.printedBy?.name || registrationData.printedBy?.email || 'an unknown user';
      const printedAtTime = registrationData.printedAt 
        ? new Date(registrationData.printedAt).toLocaleString() 
        : 'an unknown time';
        
      const confirmReprint = window.confirm(
        `This badge was already printed by ${printedByName} at ${printedAtTime}.\n\nPrint again?`
      );
      if (!confirmReprint) {
        console.log('User cancelled reprint.');
        return;
      }
      console.log('User confirmed reprint.');
    }
    
    try {
      setIsLoading(true);
      
      const canvas = await html2canvas(badgeRef.current, {
        scale: 2, // Higher scale for better quality
        logging: false,
        useCORS: true,
        allowTaint: true,
      });
      
      const dataUrl = canvas.toDataURL('image/png');
      
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        setIsLoading(false);
        alert("Could not open print window. Please check your browser's popup blocker settings.");
        return;
      }
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Print Badge</title>
            <style>
              body {
                margin: 0;
                padding: 20px;
                display: flex;
                justify-content: center;
                align-items: center;
                font-family: Arial, sans-serif;
              }
              .badge-container {
                width: ${dimensions.width};
                height: ${dimensions.height};
                page-break-inside: avoid;
              }
              .badge-img {
                max-width: 100%;
                height: auto;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              }
              /* Print-specific styles */
              @media print {
                body {
                  margin: 0;
                  padding: 0;
                }
                .no-print {
                  display: none;
                }
              }
            </style>
          </head>
          <body>
            <div class="badge-container">
              <img src="${dataUrl}" class="badge-img" alt="Badge" />
            </div>
            <div class="no-print" style="margin-top: 20px; text-align: center;">
              <button onclick="window.print();" style="padding: 8px 16px; background-color: #4a5568; color: white; border: none; border-radius: 4px; cursor: pointer;">
                Print
              </button>
              <button onclick="window.close();" style="padding: 8px 16px; margin-left: 8px; background-color: #e2e8f0; border: none; border-radius: 4px; cursor: pointer;">
                Close
              </button>
            </div>
          </body>
        </html>
      `);
      
      printWindow.document.close();
      
      if (onBadgePrinted && typeof onBadgePrinted === 'function') {
        onBadgePrinted(registrationData._id);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error printing badge:', error);
      setIsLoading(false);
      alert('There was an error preparing the badge for printing. Please try again.');
    }
  };

  // Download badge as image
  const downloadBadge = async () => {
    if (!badgeRef.current) return;
    
    try {
      setIsLoading(true);
      
      const canvas = await html2canvas(badgeRef.current, {
        scale: 2, // Higher scale for better quality
        logging: false,
        useCORS: true,
        allowTaint: true,
      });
      
      const dataUrl = canvas.toDataURL('image/png');
      
      // Create a temporary link element
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `badge-${registrationData.registrationId || registrationData.regId || 'download'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error downloading badge:', error);
      setIsLoading(false);
      alert('There was an error preparing the badge for download. Please try again.');
    }
  };

  return (
    <div className={`badge-template ${className}`}>
      <div
        ref={badgeRef}
        id="badge-for-print"
        className="border border-gray-200 rounded-lg overflow-hidden shadow-sm"
        style={{
          width: dimensions.width,
          height: dimensions.height,
          margin: '0 auto',
          backgroundColor: getBackgroundColor(),
          color: getTextColor(),
          borderColor: badgeSettings?.borderColor || '#cccccc'
        }}
      >
        {/* Badge Header */}
        <div className="p-2 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
          <div>
            <div className="font-bold text-sm">{eventData?.name}</div>
            {eventData?.startDate && (
              <div className="text-xs text-gray-500">
                {new Date(eventData.startDate).toLocaleDateString()} - {new Date(eventData.endDate).toLocaleDateString()}
              </div>
            )}
          </div>
          {eventData?.logo && badgeSettings?.showLogo !== false && (
            <img src={eventData.logo} alt="Event Logo" className="h-6" crossOrigin="anonymous" />
          )}
        </div>
        
        {/* Badge Content */}
        <div className="p-3 flex flex-col items-center">
          {shouldShowField('name') && (
            <div className="font-bold text-lg text-center">
              {`${registrationData.personalInfo?.firstName || ''} ${registrationData.personalInfo?.lastName || ''}`}
            </div>
          )}
          
          {shouldShowField('organization') && registrationData.personalInfo?.organization && (
            <div className="text-sm text-gray-600 text-center mt-1">
              {registrationData.personalInfo.organization}
            </div>
          )}
          
          {shouldShowField('category') && (registrationData.categoryName || registrationData.category?.name) && (
            <div 
              className="px-2 py-1 rounded-full text-xs font-medium text-white mt-2"
              style={{ backgroundColor: registrationData.categoryColor || '#3B82F6' }}
            >
              {registrationData.categoryName || (registrationData.category?.name)}
            </div>
          )}
          
          {/* QR Code */}
          {showQR && shouldShowField('qrCode') && (
            <div className="mt-3 mb-1">
              <QRCode
                id="qr-code-svg"
                value={qrValue}
                size={100}
                level="M"
                className="mx-auto"
              />
            </div>
          )}
          
          {shouldShowField('registrationId') && (
            <div className="text-sm text-gray-500 mt-1">
              {registrationData.registrationId || registrationData.regId}
            </div>
          )}
          
          {shouldShowField('country') && registrationData.country && (
            <div className="text-sm text-gray-500 mt-1">
              {registrationData.country}
            </div>
          )}
        </div>
      </div>
      
      {/* Badge Tools */}
      {showTools && (
        <div className="flex justify-center space-x-2 mt-4">
          <button
            onClick={printBadge}
            disabled={isLoading}
            className={`px-3 py-1.5 ${isLoading ? 'bg-primary-400' : 'bg-primary-600'} text-white rounded-md text-sm flex items-center`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Preparing...
              </>
            ) : (
              <>
                <i className="ri-printer-line mr-1"></i> Print
              </>
            )}
          </button>
          <button
            onClick={downloadBadge}
            disabled={isLoading}
            className={`px-3 py-1.5 ${isLoading ? 'bg-gray-400' : 'bg-gray-600'} text-white rounded-md text-sm flex items-center`}
          >
            {isLoading ? 'Preparing...' : (
              <>
                <i className="ri-download-line mr-1"></i> Download
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

BadgeTemplate.propTypes = {
  registrationData: PropTypes.shape({
    _id: PropTypes.string,
    id: PropTypes.string,
    registrationId: PropTypes.string,
    regId: PropTypes.string,
    name: PropTypes.string,
    firstName: PropTypes.string,
    lastName: PropTypes.string,
    organization: PropTypes.string,
    categoryName: PropTypes.string,
    categoryColor: PropTypes.string,
    category: PropTypes.shape({
      name: PropTypes.string,
      color: PropTypes.string
    }),
    country: PropTypes.string
  }).isRequired,
  eventData: PropTypes.shape({
    _id: PropTypes.string,
    id: PropTypes.string,
    name: PropTypes.string,
    startDate: PropTypes.string,
    endDate: PropTypes.string,
    logo: PropTypes.string
  }),
  template: PropTypes.oneOf(['standard', 'large', 'small', 'landscape']),
  showQR: PropTypes.bool,
  badgeSettings: PropTypes.shape({
    size: PropTypes.shape({
      width: PropTypes.string,
      height: PropTypes.string
    }),
    unit: PropTypes.string,
    background: PropTypes.string,
    textColor: PropTypes.string,
    borderColor: PropTypes.string,
    showLogo: PropTypes.bool,
    fields: PropTypes.object
  }),
  showTools: PropTypes.bool,
  className: PropTypes.string,
  onBadgePrinted: PropTypes.func,
};

export default BadgeTemplate; 