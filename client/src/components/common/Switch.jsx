import React from 'react';

/**
 * Toggle switch component for boolean settings
 * 
 * @param {Object} props
 * @param {string} props.label - Label text for the switch
 * @param {boolean} props.checked - Whether the switch is checked
 * @param {function} props.onChange - Function to call when the switch state changes
 * @param {string} props.description - Optional description text
 * @param {string} props.className - Additional CSS classes
 */
const Switch = ({ 
  label, 
  checked = false, 
  onChange, 
  description,
  className = ''
}) => {
  return (
    <div className={`flex items-start ${className}`}>
      <div className="flex items-center h-5">
        <input
          id={`switch-${label?.replace(/\s+/g, '-').toLowerCase()}`}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
        />
      </div>
      <div className="ml-3 text-sm">
        <label 
          htmlFor={`switch-${label?.replace(/\s+/g, '-').toLowerCase()}`} 
          className="font-medium text-gray-700 cursor-pointer"
        >
          {label}
        </label>
        {description && (
          <p className="text-gray-500 mt-1">{description}</p>
        )}
      </div>
    </div>
  );
};

export default Switch; 