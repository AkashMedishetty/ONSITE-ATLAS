import React from 'react';
import QRCode from 'react-qr-code';
// import BadgeElementRenderer from './BadgeElementRenderer'; // May not be needed if we render fixed fields

/**
 * Badge Template Component
 * Renders a badge with the provided registration data and template configuration
 */
const BadgeTemplate = ({ 
  registrationData,
  badgeSettings,
  previewMode = false,
  scale = 1,
  className = '',
  // Interactivity props (may become less relevant with fixed fields)
  selectedElementId = null,
  onElementSelect = null,
  isInteractive = false,
  onElementMouseDown = null
}) => {
  console.log('[BadgeTemplate Refactored] Rendering. Preview:', previewMode, 'Scale:', scale);
  // console.log('[BadgeTemplate Refactored] Received registrationData:', registrationData ? { ...registrationData } : null);
  // console.log('[BadgeTemplate Refactored] Received badgeSettings:', badgeSettings ? { ...badgeSettings } : null);

  if (!badgeSettings || typeof badgeSettings.fields !== 'object' || typeof badgeSettings.fieldConfig !== 'object') {
    if (previewMode) {
      console.log('[BadgeTemplate Refactored] Invalid or missing badgeSettings.fields/fieldConfig, rendering fallback for previewMode.');
      return (
        <div className="flex flex-col items-center justify-center p-4 border rounded bg-white">
          <div className="font-bold text-lg mb-2">{registrationData?.personalInfo?.firstName} {registrationData?.personalInfo?.lastName}</div>
          <div className="text-gray-600 mb-2">ID: {registrationData?.registrationId}</div>
          {registrationData?.registrationId && <QRCode value={registrationData.registrationId} size={96} />}
          <p className="text-xs text-orange-500 mt-2">Error: Badge settings incomplete.</p>
        </div>
      );
    }
    console.error('[BadgeTemplate Refactored] Missing or invalid badgeSettings.fields or badgeSettings.fieldConfig');
    return <div className="text-red-500 p-4">Badge settings structure is invalid or missing required fields/fieldConfig.</div>;
  }
  
  const {
    orientation = 'portrait',
    size = { width: 3.375, height: 5.375 }, 
    unit = 'in',
    colors = { background: '#FFFFFF', text: '#000000', accent: '#3B82F6', borderColor: '#CCCCCC' },
    backgroundImage, // from badgeSettings.background (if it's a URL)
    logo, // from badgeSettings.logo (if it's a URL)
    fields, // visibility toggles e.g., { name: true, organization: false, ... }
    fieldConfig, // style/position configs e.g., { name: { fontSize: 18, fontWeight: 'bold', position: {top:10, left:10}}, ...}
    showBorderSetting // Assuming a general border setting if needed, else use previewMode logic
  } = badgeSettings;

  // console.log('[BadgeTemplate Refactored] Destructured settings - Orientation:', orientation, 'Size:', size, 'Unit:', unit, 'Colors:', colors, 'Fields:', fields);

  const registration = registrationData || {};
  const personalInfo = registration.personalInfo || {};

  let badgeWidthPx, badgeHeightPx;
  const DPIN = 100;

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

  const finalWidth = badgeWidthPx * scale;
  const finalHeight = badgeHeightPx * scale;

  const badgeStyle = {
    width: `${finalWidth}px`,
    height: `${finalHeight}px`,
    backgroundColor: colors.background || '#FFFFFF',
    backgroundImage: backgroundImage ? `url(${backgroundImage})` : (badgeSettings.background && !badgeSettings.background.startsWith('#') ? `url(${badgeSettings.background})` : 'none'),
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: 'Arial, sans-serif',
    boxSizing: 'border-box',
    border: previewMode ? '1px dashed #ccc' : (showBorderSetting ? `1px solid ${colors.borderColor || '#CCCCCC'}` : 'none')
  };

  if (finalWidth === 0 || finalHeight === 0) {
    console.warn('[BadgeTemplate Refactored] Calculated width or height is zero.');
    return <div style={{color: 'orange', padding: '10px'}}>Badge dimensions are zero. Check badgeSettings.</div>;
  }

  // Helper to create style for an element based on fieldConfig
  const getElementStyle = (fieldName) => {
    const config = fieldConfig[fieldName] || {};
    return {
      position: 'absolute',
      top: `${(config.position?.top || 0) * scale}px`,
      left: `${(config.position?.left || 0) * scale}px`,
      fontSize: `${(config.fontSize || 12) * scale}px`,
      fontWeight: config.fontWeight || 'normal',
      color: config.color || colors.text || '#000000',
      // Add other style properties as needed from your fieldConfig structure
      textAlign: config.textAlign || 'left',
      // width: config.size?.width ? `${config.size.width * scale}px` : 'auto',
      // height: config.size?.height ? `${config.size.height * scale}px` : 'auto',
      // whiteSpace: 'nowrap', // Prevent text wrapping if needed by design
      // overflow: 'hidden',
      // textOverflow: 'ellipsis',
    };
  };
  
  return (
    <div className={`badge-template-container ${className}`} style={badgeStyle}>
      {/* Render Logo if configured */}
      {logo && (
        <img 
          src={logo} 
          alt="Event Logo" 
          style={{
            position: 'absolute',
            // Example positioning - adjust based on badgeSettings.logoPosition or specific config
            top: `${(fieldConfig.logo?.position?.top || 10) * scale}px`, 
            left: `${(fieldConfig.logo?.position?.left || 10) * scale}px`,
            width: `${(fieldConfig.logo?.size?.width || 50) * scale}px`, // Default size
            height: 'auto'
            // maxHeight: `${(fieldConfig.logo?.size?.height || 50) * scale}px`
          }}
        />
      )}

      {fields.name && (
        <div style={getElementStyle('name')}>
          {`${personalInfo.firstName || ''} ${personalInfo.lastName || ''}`}
        </div>
      )}
      {fields.organization && personalInfo.organization && (
        <div style={getElementStyle('organization')}>
          {personalInfo.organization}
        </div>
      )}
      {fields.registrationId && registration.registrationId && (
        <div style={getElementStyle('registrationId')}>
          {registration.registrationId}
        </div>
      )}
      {fields.category && registration.category?.name && (
        <div style={getElementStyle('category')}>
          {registration.category.name}
        </div>
      )}
      {fields.country && personalInfo.country && (
        <div style={getElementStyle('country')}>
          {personalInfo.country}
        </div>
      )}
      {fields.qrCode && registration.registrationId && (
        <div 
          style={{
            position: 'absolute',
            top: `${(fieldConfig.qrCode?.position?.top || 135) * scale}px`,
            left: `${(fieldConfig.qrCode?.position?.left || 100) * scale}px`,
            // Wrapper for QR code might need specific dimensions if QR size is fixed
            width: `${(fieldConfig.qrCode?.size || 100) * scale}px`, 
            height: `${(fieldConfig.qrCode?.size || 100) * scale}px`,
          }}
        >
          <QRCode 
            value={registration.registrationId} 
            size={(fieldConfig.qrCode?.size || 100) * scale} // QR code size from config, scaled
            level="H"
            bgColor={colors.background || '#FFFFFF'} // Match badge BG for QR
            fgColor={colors.text || '#000000'}     // Match badge text for QR
          />
        </div>
      )}

      {previewMode && (
        <div style={{ 
          position: 'absolute', 
          bottom: '2px', 
          right: '2px', 
          fontSize: '10px', 
          color: '#999',
          backgroundColor: 'rgba(255,255,255,0.7)',
          padding: '1px 3px',
          borderRadius: '2px'
        }}>
          Preview
        </div>
      )}
    </div>
  );
};

export default BadgeTemplate; 