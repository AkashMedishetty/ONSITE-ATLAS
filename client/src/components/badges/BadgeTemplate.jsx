import React from 'react';
import QRCode from 'react-qr-code';
import BadgeElementRenderer from './BadgeElementRenderer';

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
  // Interactivity props from BadgeDesigner
  selectedElementId = null,
  onElementSelect = null,
  isInteractive = false,
  onElementMouseDown = null // New prop from BadgeDesigner
}) => {
  // Log received props
  // console.log('[BadgeTemplate] Received registrationData:', registrationData);
  // console.log('[BadgeTemplate] Received badgeSettings (template object):', badgeSettings);

  if (!badgeSettings) {
    console.error('[BadgeTemplate] Missing required prop: badgeSettings (template object)');
    return <div className="text-red-500 p-4">Badge settings (template object) missing.</div>;
  }
  
  // Extract template settings with defaults FROM badgeSettings (which is the template object)
  const {
    orientation = 'portrait',
    size = { width: 3.375, height: 5.375 },
    unit = 'in',
    background = '#FFFFFF',
    backgroundImage,
    elements = [],
  } = badgeSettings;

  // --- Get data FROM registrationData --- 
  const registration = registrationData || {};

  // Calculate dimensions for the badge container based on scale and unit
  let badgeWidthPx;
  let badgeHeightPx;
  const DPIN = 100;

  if (unit === 'in') {
    badgeWidthPx = size.width * DPIN;
    badgeHeightPx = size.height * DPIN;
  } else if (unit === 'cm') {
    badgeWidthPx = size.width * (DPIN / 2.54);
    badgeHeightPx = size.height * (DPIN / 2.54);
  } else if (unit === 'mm') {
    badgeWidthPx = size.width * (DPIN / 25.4);
    badgeHeightPx = size.height * (DPIN / 25.4);
  } else {
    badgeWidthPx = size.width;
    badgeHeightPx = size.height;
  }

  const badgeStyle = {
    width: `${badgeWidthPx * scale}px`,
    height: `${badgeHeightPx * scale}px`,
    backgroundColor: background,
    backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    transform: orientation === 'landscape' ? 'rotate(90deg)' : 'none',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: 'Arial, sans-serif',
    boxSizing: 'border-box',
    border: previewMode ? '1px dashed #ccc' : (badgeSettings.printSettings?.showBorder ? `${badgeSettings.printSettings.borderWidth || 1}px solid ${badgeSettings.printSettings.borderColor || '#CCCCCC'}` : 'none')
  };
  
  return (
    <div className={`badge-template-container ${className}`} style={badgeStyle}>
      {elements.map(element => (
        <BadgeElementRenderer
          key={element.id}
          element={element}
          registration={registration}
          isSelected={isInteractive && selectedElementId === element.id}
          onSelect={isInteractive ? onElementSelect : null}
          onElementMouseDown={isInteractive ? onElementMouseDown : null}
          isDraggable={isInteractive}
        />
      ))}
      
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