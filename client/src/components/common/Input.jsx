import React, { forwardRef, useState } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const Input = forwardRef(({
  id,
  name,
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  helperText,
  disabled = false,
  readOnly = false,
  required = false,
  leftIcon,
  rightIcon,
  leftAddon,
  rightAddon,
  clearable = false,
  onClear,
  autoFocus = false,
  className = '',
  containerClassName = '',
  labelClassName = '',
  inputClassName = '',
  size = 'md',
  variant = 'outline',
  isLoading = false,
  max,
  min,
  maxLength,
  minLength,
  step,
  pattern,
  ...props
}, ref) => {
  // Internal state for password visibility
  const [showPassword, setShowPassword] = useState(false);
  
  // Base styles
  const baseInputStyles = `
    block
    w-full
    transition-colors
    duration-150
    placeholder-gray-400
    focus:outline-none
  `;
  
  // Size styles
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm h-8',
    md: 'px-3 py-2 text-base h-10',
    lg: 'px-4 py-2.5 text-lg h-12'
  };
  
  // Variant styles
  const variantStyles = {
    outline: `bg-white border focus:ring-2 focus:ring-offset-0 ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'}`,
    filled: `bg-gray-100 border border-transparent ${error ? 'focus:bg-white focus:border-red-500 focus:ring-red-200' : 'focus:bg-white focus:border-blue-500 focus:ring-blue-200'}`,
    flushed: `bg-transparent border-b rounded-none px-0 ${error ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'}`
  };
  
  // Rounded styles
  const roundedStyles = variant === 'flushed' ? '' : 'rounded-md';
  
  // State-specific styles
  const stateStyles = `
    ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}
    ${readOnly ? 'opacity-75 cursor-default bg-gray-50' : ''}
  `;
  
  // Icon styles
  const iconStyles = 'absolute inset-y-0 flex items-center pointer-events-none text-gray-400';
  
  // Combined styles
  const inputStyles = `
    ${baseInputStyles}
    ${sizeStyles[size]}
    ${variantStyles[variant]}
    ${roundedStyles}
    ${stateStyles}
    ${leftIcon || leftAddon ? 'pl-10' : ''}
    ${rightIcon || rightAddon || (type === 'password') || clearable ? 'pr-10' : ''}
    ${inputClassName}
  `;
  
  // Determine actual input type based on password visibility
  const inputType = type === 'password' && showPassword ? 'text' : type;
  
  // Error animation variants
  const errorAnimation = {
    initial: { opacity: 0, y: -10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 }
  };
  
  // Handler for clearing input
  const handleClear = () => {
    if (onClear) {
      onClear();
    } else if (onChange) {
      const event = { target: { name, value: '' } };
      onChange(event);
    }
  };
  
  // Helper text display with animation
  const HelperText = () => (
    <AnimatePresence mode="wait">
      {helperText && (
        <motion.p
          key={`helper-${error ? 'error' : 'info'}`}
          initial="initial"
          animate="animate"
          exit="exit"
          variants={errorAnimation}
          className={`mt-1 text-sm ${error ? 'text-red-500' : 'text-gray-500'}`}
        >
          {helperText}
        </motion.p>
      )}
    </AnimatePresence>
  );
  
  return (
    <div className={`w-full ${containerClassName}`}>
      {label && (
        <label 
          htmlFor={id || name} 
          className={`block mb-1.5 text-sm font-medium text-gray-700 ${labelClassName}`}
        >
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}
      
      <div className="relative">
        {/* Left icon */}
        {leftIcon && (
          <span className={`${iconStyles} left-3`}>
            {leftIcon}
          </span>
        )}
        
        {/* Left addon */}
        {leftAddon && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-3">
            {leftAddon}
          </div>
        )}
        
        {/* Input element */}
        <input
          ref={ref}
          id={id || name}
          name={name}
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled || isLoading}
          readOnly={readOnly}
          required={required}
          className={`${inputStyles} ${className}`}
          autoFocus={autoFocus}
          max={max}
          min={min}
          maxLength={maxLength}
          minLength={minLength}
          step={step}
          pattern={pattern}
          {...props}
        />
        
        {/* Loading spinner */}
        {isLoading && (
          <span className="absolute inset-y-0 right-3 flex items-center">
            <svg
              className="animate-spin h-4 w-4 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </span>
        )}
        
        {/* Clear button */}
        {clearable && value && !isLoading && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Clear input"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </button>
        )}
        
        {/* Password toggle button */}
        {type === 'password' && !isLoading && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
          </button>
        )}
        
        {/* Right icon */}
        {rightIcon && !isLoading && !(type === 'password') && !clearable && (
          <span className={`${iconStyles} right-3`}>
            {rightIcon}
          </span>
        )}
        
        {/* Right addon */}
        {rightAddon && !isLoading && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {rightAddon}
          </div>
        )}
      </div>
      
      <HelperText />
    </div>
  );
});

Input.displayName = 'Input';

Input.propTypes = {
  id: PropTypes.string,
  name: PropTypes.string,
  label: PropTypes.node,
  type: PropTypes.string,
  placeholder: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  error: PropTypes.bool,
  helperText: PropTypes.node,
  disabled: PropTypes.bool,
  readOnly: PropTypes.bool,
  required: PropTypes.bool,
  leftIcon: PropTypes.node,
  rightIcon: PropTypes.node,
  leftAddon: PropTypes.node,
  rightAddon: PropTypes.node,
  clearable: PropTypes.bool,
  onClear: PropTypes.func,
  autoFocus: PropTypes.bool,
  className: PropTypes.string,
  containerClassName: PropTypes.string,
  labelClassName: PropTypes.string,
  inputClassName: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  variant: PropTypes.oneOf(['outline', 'filled', 'flushed']),
  isLoading: PropTypes.bool,
  max: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  min: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  maxLength: PropTypes.number,
  minLength: PropTypes.number,
  step: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  pattern: PropTypes.string
};

export default Input; 