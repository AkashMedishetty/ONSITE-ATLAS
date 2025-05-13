import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { CheckIcon } from '@heroicons/react/24/solid';

const Checkbox = forwardRef(({
  id,
  name,
  label,
  checked = false,
  disabled = false,
  required = false,
  onChange,
  size = 'md',
  color = 'primary',
  labelPosition = 'right',
  indeterminate = false,
  error = false,
  helperText,
  className = '',
  ...props
}, ref) => {
  // Size styles
  const sizeStyles = {
    sm: {
      checkbox: 'h-3.5 w-3.5',
      label: 'text-sm',
      spacing: 'space-x-2'
    },
    md: {
      checkbox: 'h-4 w-4',
      label: 'text-base',
      spacing: 'space-x-2.5'
    },
    lg: {
      checkbox: 'h-5 w-5',
      label: 'text-lg',
      spacing: 'space-x-3'
    }
  };
  
  // Color styles
  const colorStyles = {
    primary: {
      border: 'border-blue-500',
      bg: 'bg-blue-600',
      hover: 'hover:border-blue-600',
      focus: 'focus:ring-blue-500'
    },
    secondary: {
      border: 'border-purple-500',
      bg: 'bg-purple-600',
      hover: 'hover:border-purple-600',
      focus: 'focus:ring-purple-500'
    },
    success: {
      border: 'border-green-500',
      bg: 'bg-green-600',
      hover: 'hover:border-green-600',
      focus: 'focus:ring-green-500'
    },
    danger: {
      border: 'border-red-500',
      bg: 'bg-red-600',
      hover: 'hover:border-red-600',
      focus: 'focus:ring-red-500'
    },
    warning: {
      border: 'border-amber-500',
      bg: 'bg-amber-600',
      hover: 'hover:border-amber-600',
      focus: 'focus:ring-amber-500'
    },
    info: {
      border: 'border-cyan-500',
      bg: 'bg-cyan-600',
      hover: 'hover:border-cyan-600',
      focus: 'focus:ring-cyan-500'
    },
    dark: {
      border: 'border-gray-700',
      bg: 'bg-gray-800',
      hover: 'hover:border-gray-800',
      focus: 'focus:ring-gray-500'
    }
  };
  
  // Base styles
  const baseCheckboxStyles = `
    appearance-none 
    border 
    rounded 
    transition-colors 
    duration-200 
    cursor-pointer
    focus:outline-none 
    focus:ring-2 
    focus:ring-offset-2
    ${checked ? colorStyles[color].bg : 'bg-white'}
    ${error ? 'border-red-500 focus:ring-red-500' : checked ? colorStyles[color].border : 'border-gray-300'}
    ${!disabled && !checked ? colorStyles[color].hover : ''}
    ${!disabled ? colorStyles[color].focus : ''}
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
    ${sizeStyles[size].checkbox}
  `;
  
  // Container styles
  const containerStyles = `
    flex items-center
    ${labelPosition === 'right' ? sizeStyles[size].spacing : 'flex-row-reverse space-x-reverse ' + sizeStyles[size].spacing}
    ${className}
  `;
  
  // Animation variants
  const checkVariants = {
    unchecked: { scale: 0, opacity: 0 },
    checked: { scale: 1, opacity: 1 },
    indeterminate: { scale: 1, opacity: 1 }
  };
  
  // Helper text styles
  const helperTextStyles = `mt-1 text-sm ${error ? 'text-red-500' : 'text-gray-500'}`;
  
  return (
    <div className="flex flex-col">
      <div className={containerStyles}>
        <div className="relative flex items-center">
          <input
            ref={ref}
            type="checkbox"
            id={id}
            name={name}
            checked={checked}
            disabled={disabled}
            required={required}
            onChange={onChange}
            className={baseCheckboxStyles}
            {...props}
          />
          
          {/* Check icon with animation */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none text-white"
            initial={checked ? "checked" : "unchecked"}
            animate={indeterminate ? "indeterminate" : checked ? "checked" : "unchecked"}
            variants={checkVariants}
            transition={{ duration: 0.2 }}
          >
            {indeterminate ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3/5 w-3/5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            ) : (
              <CheckIcon className="h-3/5 w-3/5" />
            )}
          </motion.div>
        </div>
        
        {label && (
          <label 
            htmlFor={id}
            className={`
              ${sizeStyles[size].label} 
              ${disabled ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 cursor-pointer'}
            `}
          >
            {label}
            {required && <span className="ml-1 text-red-500">*</span>}
          </label>
        )}
      </div>
      
      {helperText && (
        <p className={helperTextStyles}>{helperText}</p>
      )}
    </div>
  );
});

Checkbox.displayName = 'Checkbox';

Checkbox.propTypes = {
  id: PropTypes.string.isRequired,
  name: PropTypes.string,
  label: PropTypes.node,
  checked: PropTypes.bool,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  onChange: PropTypes.func,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  color: PropTypes.oneOf(['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'dark']),
  labelPosition: PropTypes.oneOf(['left', 'right']),
  indeterminate: PropTypes.bool,
  error: PropTypes.bool,
  helperText: PropTypes.node,
  className: PropTypes.string
};

export default Checkbox; 