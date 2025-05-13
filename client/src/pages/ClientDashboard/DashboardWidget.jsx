import React from 'react';
import { Card } from 'react-bootstrap';

const DashboardWidget = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  variant = 'primary', 
  iconBackground = false,
  format,
  footer,
  isLoading = false,
  children
}) => {
  // Helper function to format the value
  const formatValue = (val) => {
    if (isLoading) return '—';
    if (val === undefined || val === null) return '—';
    
    if (format === 'currency') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0
      }).format(val);
    }
    
    if (format === 'number') {
      return new Intl.NumberFormat('en-US').format(val);
    }
    
    if (format === 'percent') {
      return `${val}%`;
    }
    
    return val;
  };

  // Generate variant-specific classes
  const getVariantClass = () => {
    return {
      borderVariant: `border-${variant}`,
      textVariant: `text-${variant}`,
      bgVariant: `bg-${variant}`
    };
  };

  const { borderVariant, textVariant, bgVariant } = getVariantClass();

  return (
    <Card className={`h-100 shadow-sm ${borderVariant}`} style={{ borderWidth: '1px', borderRadius: '0.5rem' }}>
      <Card.Body className="d-flex flex-column p-3">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h6 className="text-muted mb-0 text-uppercase small">{title}</h6>
          {icon && (
            <div className={`p-2 ${iconBackground ? bgVariant : ''} ${iconBackground ? 'text-white' : textVariant}`} 
                 style={{ borderRadius: '0.375rem' }}>
              {icon}
            </div>
          )}
        </div>
        
        {!children && (
          <>
            <div className="mt-2">
              <h4 className={`mb-0 ${isLoading ? 'text-muted' : ''}`} style={{ fontWeight: '600' }}>
                {formatValue(value)}
              </h4>
              {subtitle && <p className="text-muted small mb-0">{subtitle}</p>}
            </div>
            
            {footer && (
              <div className="mt-auto pt-3 border-top">
                <small className="text-muted">{footer}</small>
              </div>
            )}
          </>
        )}
        
        {children && <div className="mt-2 flex-grow-1">{children}</div>}
      </Card.Body>
    </Card>
  );
};

export default DashboardWidget; 