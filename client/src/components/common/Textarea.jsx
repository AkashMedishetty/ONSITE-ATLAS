import React, { forwardRef, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';

const Textarea = forwardRef(({
  label,
  name,
  value = '',
  onChange,
  onBlur,
  onFocus,
  placeholder,
  className = '',
  containerClassName = '',
  labelClassName = '',
  errorClassName = '',
  hintClassName = '',
  rows = 4,
  maxLength,
  minLength,
  disabled = false,
  required = false,
  readOnly = false,
  error = '',
  hint = '',
  helperText = '',
  showCharCount = false,
  autoFocus = false,
  autoResize = false,
  minHeight,
  maxHeight,
  resize = true,
  variant = 'outlined',
  size = 'md',
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const [textareaHeight, setTextareaHeight] = useState('auto');
  
  // Update local value when prop value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Handle auto-resize functionality
  useEffect(() => {
    if (autoResize && ref?.current) {
      adjustHeight();
    }
  }, [localValue, autoResize]);

  // Handle focus events
  const handleFocus = (e) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };

  // Handle value change
  const handleChange = (e) => {
    setLocalValue(e.target.value);
    if (onChange) onChange(e);
    if (autoResize) adjustHeight();
  };

  // Adjust height for auto-resize
  const adjustHeight = () => {
    if (!ref?.current) return;
    
    // Reset height to calculate scroll height
    ref.current.style.height = 'auto';
    
    // Get the scroll height and add some padding
    let scrollHeight = ref.current.scrollHeight;
    
    // Apply min/max constraints
    if (minHeight && scrollHeight < minHeight) scrollHeight = minHeight;
    if (maxHeight && scrollHeight > maxHeight) scrollHeight = maxHeight;
    
    // Set the new height
    ref.current.style.height = `${scrollHeight}px`;
    setTextareaHeight(`${scrollHeight}px`);
  };

  // Determine styles based on props
  const getVariantStyles = () => {
    switch (variant) {
      case 'filled':
        return 'bg-gray-100 border-transparent hover:bg-gray-200 focus:bg-white';
      case 'flushed':
        return 'rounded-none border-0 border-b border-gray-300 focus:border-primary-500 px-0';
      case 'unstyled':
        return 'border-0 shadow-none ring-0 focus:ring-0 p-0';
      case 'outlined':
      default:
        return 'bg-white border-gray-300 hover:border-gray-400';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'xs':
        return 'py-1 px-2 text-xs';
      case 'sm':
        return 'py-1.5 px-2.5 text-sm';
      case 'lg':
        return 'py-2.5 px-3.5 text-lg';
      case 'xl':
        return 'py-3 px-4 text-xl';
      case 'md':
      default:
        return 'py-2 px-3 text-base';
    }
  };

  const getResizeStyles = () => {
    if (!resize) return 'resize-none';
    if (resize === true) return 'resize';
    return `resize-${resize}`;
  };

  const baseStyles = "w-full border rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent";
  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();
  const resizeStyles = getResizeStyles();
  const errorStyles = error ? 'border-red-300 text-red-900 focus:ring-red-500' : '';
  const disabledStyles = disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-200' : '';
  const readOnlyStyles = readOnly ? 'bg-gray-50 text-gray-700 cursor-default' : '';
  
  const effectiveStyles = `${baseStyles} ${variantStyles} ${sizeStyles} ${resizeStyles} ${errorStyles} ${disabledStyles} ${readOnlyStyles} ${className}`;
  
  const charCount = localValue?.length || 0;
  const isNearLimit = maxLength && charCount >= maxLength * 0.8;
  const isAtLimit = maxLength && charCount >= maxLength;
  const isUnderMinLength = minLength && charCount < minLength;

  return (
    <div className={`textarea-container ${containerClassName}`}>
      {label && (
        <div className="flex justify-between mb-1">
          <motion.label 
            htmlFor={name} 
            className={`block text-sm font-medium mb-1 ${error ? 'text-red-600' : isFocused ? 'text-primary-600' : 'text-gray-700'} ${labelClassName}`}
            animate={{ color: error ? '#DC2626' : isFocused ? '#2563EB' : '#374151' }}
            transition={{ duration: 0.2 }}
          >
            {label}
            {required && <span className="text-red-600 ml-1">*</span>}
          </motion.label>
          
          {showCharCount && maxLength && (
            <motion.span 
              className={`text-xs ${labelClassName}`}
              animate={{ 
                color: isAtLimit ? '#DC2626' : isNearLimit ? '#D97706' : '#6B7280'
              }}
              transition={{ duration: 0.2 }}
            >
              {charCount}/{maxLength}
            </motion.span>
          )}
        </div>
      )}
      
      <div className="relative">
        <textarea
          ref={ref}
          id={name}
          name={name}
          value={localValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          placeholder={placeholder}
          rows={autoResize ? 1 : rows}
          maxLength={maxLength}
          minLength={minLength}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          autoFocus={autoFocus}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={
            (error && `${name}-error`) || 
            (hint && `${name}-hint`) || 
            undefined
          }
          className={effectiveStyles}
          style={{ 
            height: autoResize ? textareaHeight : 'auto',
            minHeight: minHeight ? `${minHeight}px` : undefined,
            maxHeight: maxHeight ? `${maxHeight}px` : undefined
          }}
          {...props}
        />
        
        {variant === 'outlined' && (
          <AnimatePresence>
            {isFocused && !error && !disabled && !readOnly && (
              <motion.div 
                className="absolute inset-0 border-2 border-primary-500 rounded-md pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
            )}
          </AnimatePresence>
        )}
      </div>
      
      <AnimatePresence>
        {(hint || helperText) && !error && (
          <motion.p 
            className={`mt-1.5 text-sm text-gray-500 ${hintClassName}`}
            id={`${name}-hint`}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
          >
            {hint || helperText}
          </motion.p>
        )}
        
        {error && (
          <motion.p 
            className={`mt-1.5 text-sm text-red-600 ${errorClassName}`}
            id={`${name}-error`}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
          >
            {error}
          </motion.p>
        )}
        
        {isUnderMinLength && minLength > 0 && (
          <motion.p 
            className={`mt-1.5 text-sm text-amber-600 ${errorClassName}`}
            id={`${name}-min-length`}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
          >
            Minimum length: {minLength} characters
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
});

Textarea.displayName = 'Textarea';

Textarea.propTypes = {
  label: PropTypes.string,
  name: PropTypes.string.isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func,
  onBlur: PropTypes.func,
  onFocus: PropTypes.func,
  placeholder: PropTypes.string,
  className: PropTypes.string,
  containerClassName: PropTypes.string,
  labelClassName: PropTypes.string,
  errorClassName: PropTypes.string,
  hintClassName: PropTypes.string,
  rows: PropTypes.number,
  maxLength: PropTypes.number,
  minLength: PropTypes.number,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  readOnly: PropTypes.bool,
  error: PropTypes.string,
  hint: PropTypes.string,
  helperText: PropTypes.string,
  showCharCount: PropTypes.bool,
  autoFocus: PropTypes.bool,
  autoResize: PropTypes.bool,
  minHeight: PropTypes.number,
  maxHeight: PropTypes.number,
  resize: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.oneOf(['none', 'y', 'x']),
  ]),
  variant: PropTypes.oneOf(['outlined', 'filled', 'flushed', 'unstyled']),
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
};

export default Textarea; 