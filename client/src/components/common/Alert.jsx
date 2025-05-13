import React from 'react';

/**
 * Alert/ErrorMessage component for displaying feedback messages
 * @param {Object} props
 * @param {string} props.type - Type of alert (success, error, warning, info)
 * @param {string} props.message - The message to display
 * @param {string} props.className - Additional classes to apply
 */
const Alert = ({ 
  type = 'info', 
  message, 
  className = '' 
}) => {
  
  if (!message) return null;
  
  // Define base styles
  const baseClasses = 'px-4 py-3 rounded relative mb-4';
  
  // Define type-specific styles
  const typeClasses = {
    success: 'bg-green-100 border border-green-400 text-green-700',
    error: 'bg-red-100 border border-red-400 text-red-700',
    warning: 'bg-yellow-100 border border-yellow-400 text-yellow-700',
    info: 'bg-blue-100 border border-blue-400 text-blue-700'
  };
  
  return (
    <div 
      className={`${baseClasses} ${typeClasses[type]} ${className}`} 
      role="alert"
    >
      <span className="block sm:inline">{message}</span>
    </div>
  );
};

// Also export as ErrorMessage for backwards compatibility
export const ErrorMessage = (props) => <Alert type="error" {...props} />;

export default Alert; 