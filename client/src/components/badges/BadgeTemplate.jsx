import React from 'react';
import QRCode from 'react-qr-code';
// import BadgeElementRenderer from './BadgeElementRenderer'; // May not be needed if we render fixed fields

/**
 * Badge Template Component
 * Renders a badge with the provided registration data and template configuration
 */
const BadgeTemplate = ({ 
  template,
  registrationData,
  previewMode = false,
  scale = 1,
  className = '',
  // Interactivity props (may become less relevant with fixed fields)
  selectedElementId = null,
  onElementSelect = null,
  isInteractive = false,
  onElementMouseDown = null
}) => {
  const DPIN = 100;
  console.log('[BadgeTemplate Designer] Rendering. Preview:', previewMode, 'Scale:', scale);

  // PATCH: If elements is empty, show a blank message and STOP rendering anything else
  if (template && Array.isArray(template.elements) && template.elements.length === 0) {
    return (
      <div className="empty-badge-placeholder" style={{width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', fontSize: '1.1em', textAlign: 'center'}}>
        <span>Badge is blank.<br/>Add elements from the left panel.</span>
      </div>
    );
  }

  if (template && Array.isArray(template.elements) && template.elements.length > 0) {
    // Designer mode: render elements array
    const unit = template.unit || 'in';
    let badgeWidthPx, badgeHeightPx;
    if (unit === 'in') {
      badgeWidthPx = (template.size.width || 0) * DPIN;
      badgeHeightPx = (template.size.height || 0) * DPIN;
    } else if (unit === 'cm') {
      badgeWidthPx = (template.size.width || 0) * (DPIN / 2.54);
      badgeHeightPx = (template.size.height || 0) * (DPIN / 2.54);
    } else if (unit === 'mm') {
      badgeWidthPx = (template.size.width || 0) * (DPIN / 25.4);
      badgeHeightPx = (template.size.height || 0) * (DPIN / 25.4);
    } else {
      badgeWidthPx = (template.size.width || 0);
      badgeHeightPx = (template.size.height || 0);
    }
    const finalWidth = badgeWidthPx * scale;
    const finalHeight = badgeHeightPx * scale;
    const badgeStyle = {
      width: `${finalWidth}px`,
      height: `${finalHeight}px`,
      backgroundColor: template.background || '#FFFFFF',
      backgroundImage: template.backgroundImage ? `url(${template.backgroundImage})` : 'none',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'Arial, sans-serif',
      boxSizing: 'border-box',
      border: previewMode ? '1px dashed #ccc' : (template.printSettings?.showBorder ? `1px solid ${template.printSettings?.borderColor || '#CCCCCC'}` : 'none')
    };
    const renderElement = (el) => {
      const isText = el.type === 'text';
      const style = {
        position: 'absolute',
        left: isText ? 0 : (el.position?.x || 0) * scale,
        width: isText ? '100%' : (el.size?.width ? el.size.width * scale : undefined),
        top: (el.position?.y || 0) * scale,
        height: el.size?.height ? el.size.height * scale : undefined,
        ...el.style,
        fontSize: el.style?.fontSize ? el.style.fontSize * scale : undefined,
        zIndex: el.style?.zIndex || 1,
        color: el.style?.color,
        backgroundColor: el.style?.backgroundColor,
        borderColor: el.style?.borderColor,
        borderWidth: el.style?.borderWidth,
        borderRadius: el.style?.borderRadius,
        padding: el.style?.padding,
        opacity: el.style?.opacity,
        transform: el.style?.rotation ? `rotate(${el.style.rotation}deg)` : undefined,
        textAlign: isText ? 'center' : (el.style?.textAlign || 'left'),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      };
      switch (el.type) {
        case 'text':
          return <div key={el.id} style={style}>{el.content || getFieldValue(el.fieldType, registrationData)}</div>;
        case 'qrCode':
          return <div key={el.id} style={style}><QRCode value={registrationData?.registrationId || ''} size={el.size?.width ? el.size.width * scale : 100} /></div>;
        case 'image':
          return <img key={el.id} src={el.content} alt="" style={style} />;
        case 'shape':
          return <div key={el.id} style={{...style, backgroundColor: el.style?.backgroundColor || '#eee'}} />;
        case 'category':
          return <div key={el.id} style={style}>{registrationData?.category?.name || registrationData?.categoryName || ''}</div>;
        default:
          return null;
      }
    };
    function getFieldValue(fieldType, reg) {
      switch (fieldType) {
        case 'name': return reg?.name || `${reg?.firstName || ''} ${reg?.lastName || ''}`;
        case 'organization': return reg?.organization;
        case 'registrationId': return reg?.registrationId;
        case 'category': return reg?.category?.name || reg?.categoryName;
        case 'country': return reg?.country;
        default: return '';
      }
    }
    return (
      <div className={`badge-template-designer ${className}`} style={badgeStyle}>
        {template.elements.map(renderElement)}
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
  }

  if (!template || (typeof template.fields !== 'object' && !Array.isArray(template.elements))) {
    // Try to infer a default structure if possible
    const fallbackFields = {
      name: true,
      organization: true,
      registrationId: true,
      category: true,
      country: true,
      qrCode: true
    };
    const fallbackFieldConfig = {
      name: { fontSize: 18, fontWeight: 'bold', position: { top: 40, left: 50 } },
      organization: { fontSize: 14, fontWeight: 'normal', position: { top: 65, left: 50 } },
      registrationId: { fontSize: 12, fontWeight: 'normal', position: { top: 85, left: 50 } },
      category: { fontSize: 12, fontWeight: 'normal', position: { top: 105, left: 50 } },
      country: { fontSize: 12, fontWeight: 'normal', position: { top: 240, left: 50 } },
      qrCode: { size: 100, position: { top: 135, left: 100 } }
    };
    const fallbackTemplate = {
      ...template,
      fields: fallbackFields,
      fieldConfig: fallbackFieldConfig,
      colors: template?.colors || { background: '#FFFFFF', text: '#000000', accent: '#3B82F6', borderColor: '#CCCCCC' },
      size: template?.size || { width: 3.375, height: 5.375 },
      unit: template?.unit || 'in',
    };
    template = fallbackTemplate;
  }

  if (!template || typeof template.fields !== 'object' || typeof template.fieldConfig !== 'object') {
    if (previewMode) {
      console.log('[BadgeTemplate Refactored] Invalid or missing template.fields/fieldConfig, rendering fallback for previewMode.');
      return (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-evenly',
            alignItems: 'center',
            background: '#fff',
            textAlign: 'center',
            fontFamily: 'Arial, sans-serif',
            boxSizing: 'border-box',
            padding: '5%',
          }}
        >
          <div style={{ fontWeight: 'bold', fontSize: '1.3em', marginBottom: '0.2em' }}>
            {registrationData?.personalInfo?.firstName} {registrationData?.personalInfo?.lastName}
          </div>
          {registrationData?.registrationId && (
            <div style={{ margin: '0.2em 0' }}>
              <QRCode value={registrationData.registrationId} size={80} />
            </div>
          )}
          <div style={{ fontSize: '1.1em', margin: '0.2em 0' }}>{registrationData?.registrationId}</div>
          {registrationData?.category?.name && (
            <div style={{ background: '#A5D6A7', color: '#222', width: '100%', fontSize: '1em', padding: '0.2em 0', borderRadius: 4, margin: '0.2em 0' }}>
              {registrationData.category.name}
            </div>
          )}
          {registrationData?.personalInfo?.organization && (
            <div style={{ fontSize: '1em', margin: '0.2em 0' }}>{registrationData.personalInfo.organization}</div>
          )}
          {registrationData?.personalInfo?.country && (
            <div style={{ fontSize: '1em', margin: '0.2em 0' }}>{registrationData.personalInfo.country}</div>
          )}
        </div>
      );
    }
    console.error('[BadgeTemplate Refactored] Missing or invalid template.fields or template.fieldConfig');
    return <div className="text-red-500 p-4">Template settings structure is invalid or missing required fields/fieldConfig.</div>;
  }
  
  const {
    orientation = 'portrait',
    size = { width: 3.375, height: 5.375 }, 
    unit = 'in',
    colors = { background: '#FFFFFF', text: '#000000', accent: '#3B82F6', borderColor: '#CCCCCC' },
    backgroundImage, // from template.background (if it's a URL)
    logo, // from template.logo (if it's a URL)
    fields, // visibility toggles e.g., { name: true, organization: false, ... }
    fieldConfig, // style/position configs e.g., { name: { fontSize: 18, fontWeight: 'bold', position: {top:10, left:10}}, ...}
    showBorderSetting // Assuming a general border setting if needed, else use previewMode logic
  } = template;

  // console.log('[BadgeTemplate Refactored] Destructured settings - Orientation:', orientation, 'Size:', size, 'Unit:', unit, 'Colors:', colors, 'Fields:', fields);

  const registration = registrationData || {};
  const personalInfo = registration.personalInfo || {};

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

  const finalWidth = badgeWidthPx * scale;
  const finalHeight = badgeHeightPx * scale;

  const badgeStyle = {
    width: `${finalWidth}px`,
    height: `${finalHeight}px`,
    backgroundColor: colors.background || '#FFFFFF',
    backgroundImage: backgroundImage ? `url(${backgroundImage})` : (template.background && !template.background.startsWith('#') ? `url(${template.background})` : 'none'),
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
    return <div style={{color: 'orange', padding: '10px'}}>Badge dimensions are zero. Check template.</div>;
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
            // Example positioning - adjust based on template.logoPosition or specific config
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