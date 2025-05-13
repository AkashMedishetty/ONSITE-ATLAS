import React from 'react';
import QRCode from 'react-qr-code';

/**
 * BadgeElementRenderer Component
 * Renders an individual element on the badge based on its type and properties
 */
const BadgeElementRenderer = ({ 
  element, 
  registration, 
  isSelected = false, 
  onSelect = null,
  isDraggable = false,
  onElementMouseDown = null
}) => {
  if (!element) return null;
  
  const { 
    type, 
    id, 
    fieldType, 
    content, 
    position, 
    size, 
    style = {} 
  } = element;
  
  // Base style for the element
  const elementStyle = {
    position: 'absolute',
    left: `${position.x}px`,
    top: `${position.y}px`,
    zIndex: style.zIndex || 1,
    ...(isDraggable && { cursor: 'move' })
  };
  
  // Combined handler for mouse down, can be used for both selection and drag start
  const handleMouseDown = (e) => {
    e.stopPropagation();
    if (onSelect && !isSelected) {
      onSelect(element);
    }
    if (onElementMouseDown) {
      onElementMouseDown(element, e);
    }
  };
  
  // Classes for the element
  const elementClasses = `badge-element${isSelected ? ' selected' : ''}${isDraggable ? ' draggable' : ''}`;
  
  // Render based on element type
  switch (type) {
    case 'text': {
      let displayText = content || '';
      
      // If this is a dynamic field, get value from registration data
      if (fieldType && fieldType !== 'custom') {
        switch (fieldType) {
          case 'name':
            displayText = registration 
              ? `${registration.firstName || ''} ${registration.lastName || ''}`.trim()
              : 'Attendee Name';
            break;
          case 'firstName':
            displayText = registration?.firstName || 'First Name';
            break;
          case 'lastName':
            displayText = registration?.lastName || 'Last Name';
            break;
          case 'organization':
            displayText = registration?.organization || 'Organization';
            break;
          case 'registrationId':
            displayText = registration?.registrationId || 'REG-12345';
            break;
          case 'categoryName':
            displayText = registration?.category || 'Category';
            break;
          case 'country':
            displayText = registration?.country || 'Country';
            break;
          case 'email':
            displayText = registration?.email || 'Email Address';
            break;
          default:
            break;
        }
      }
      
      // Text element specific styles
      const textStyle = {
        ...elementStyle,
        fontSize: `${style.fontSize || 16}px`,
        fontFamily: style.fontFamily || 'Arial',
        fontWeight: style.fontWeight || 'normal',
        color: style.color || '#000000',
        backgroundColor: style.backgroundColor || 'transparent',
        padding: style.padding ? `${style.padding}px` : '0',
        whiteSpace: 'nowrap'
      };
      
      return (
        <div
          id={`element-${id}`}
          className={elementClasses}
          style={textStyle}
          onMouseDown={handleMouseDown}
        >
          {displayText}
        </div>
      );
    }
    
    case 'qrCode': {
      // QR Code content
      let qrValue = '';
      
      if (fieldType === 'qrCode') {
        qrValue = registration?.registrationId || 'sample-id';
      } else if (fieldType === 'custom') {
        qrValue = content || 'https://example.com';
      }
      
      // QR Code element specific styles
      const qrCodeStyle = {
        ...elementStyle,
        width: `${size?.width || 100}px`,
        height: `${size?.height || 100}px`,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: style.backgroundColor || 'transparent',
        padding: style.padding ? `${style.padding}px` : '0'
      };
      
      return (
        <div
          id={`element-${id}`}
          className={elementClasses}
          style={qrCodeStyle}
          onMouseDown={handleMouseDown}
        >
          <QRCode
            value={qrValue}
            size={Math.min(size?.width || 100, size?.height || 100) - 10}
            level="M"
            fgColor="#000000"
            bgColor="#FFFFFF"
          />
        </div>
      );
    }
    
    case 'image': {
      // Image element specific styles
      const imageStyle = {
        ...elementStyle,
        width: `${size?.width || 100}px`,
        height: `${size?.height || 100}px`,
        opacity: style.opacity ?? 1,
        borderRadius: style.borderRadius ? `${style.borderRadius}px` : '0',
        overflow: 'hidden'
      };
      
      return (
        <div
          id={`element-${id}`}
          className={elementClasses}
          style={imageStyle}
          onMouseDown={handleMouseDown}
        >
          {content ? (
            <img 
              src={content} 
              alt="Badge Element" 
              style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
            />
          ) : (
            <div style={{ 
              width: '100%', 
              height: '100%', 
              backgroundColor: '#E5E7EB', 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              fontSize: '12px',
              color: '#6B7280'
            }}>
              Image
            </div>
          )}
        </div>
      );
    }
    
    case 'shape': {
      // Shape element specific styles
      const shapeStyle = {
        ...elementStyle,
        width: `${size?.width || 100}px`,
        height: `${size?.height || 100}px`,
        backgroundColor: style.backgroundColor || '#E5E7EB',
        borderColor: style.borderColor || 'transparent',
        borderWidth: style.borderWidth ? `${style.borderWidth}px` : '0',
        borderStyle: style.borderWidth ? 'solid' : 'none',
        opacity: style.opacity ?? 1
      };
      
      // Apply specific styles based on shape type
      if (content === 'circle') {
        shapeStyle.borderRadius = '50%';
      } else if (content === 'rectangle') {
        shapeStyle.borderRadius = style.borderRadius ? `${style.borderRadius}px` : '0';
      } else if (content === 'line') {
        shapeStyle.height = `${style.borderWidth || 1}px`;
        shapeStyle.backgroundColor = style.borderColor || '#000000';
      }
      
      return (
        <div
          id={`element-${id}`}
          className={elementClasses}
          style={shapeStyle}
          onMouseDown={handleMouseDown}
        >
          {isSelected && content === 'line' && (
            <div style={{ 
              position: 'absolute', 
              top: '-10px', 
              width: '100%', 
              height: '20px' 
            }}></div>
          )}
        </div>
      );
    }
    
    case 'category': {
      // Category text
      const categoryText = registration?.category || 'Category';
      
      // Category element specific styles
      const categoryStyle = {
        ...elementStyle,
        width: `${size?.width || 80}px`,
        minHeight: `${size?.height || 30}px`,
        fontSize: `${style.fontSize || 14}px`,
        fontFamily: style.fontFamily || 'Arial',
        fontWeight: style.fontWeight || 'normal',
        color: style.color || '#FFFFFF',
        backgroundColor: style.backgroundColor || '#3B82F6',
        padding: style.padding ? `${style.padding}px` : '5px',
        borderRadius: style.borderRadius ? `${style.borderRadius}px` : '16px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center'
      };
      
      return (
        <div
          id={`element-${id}`}
          className={elementClasses}
          style={categoryStyle}
          onMouseDown={handleMouseDown}
        >
          {categoryText}
        </div>
      );
    }
    
    default:
      return null;
  }
};

export default BadgeElementRenderer; 