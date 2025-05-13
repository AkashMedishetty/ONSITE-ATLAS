import React, { forwardRef, useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDownIcon, ChevronUpIcon, CheckIcon } from '@heroicons/react/24/solid';
import ReactDOM from 'react-dom';

const Select = forwardRef(({
  id,
  name,
  label,
  placeholder = 'Select an option',
  options = [],
  value,
  onChange,
  error,
  helperText,
  disabled = false,
  required = false,
  multiple = false,
  clearable = false,
  searchable = false,
  size = 'md',
  variant = 'outline',
  className = '',
  containerClassName = '',
  labelClassName = '',
  menuClassName = '',
  isLoading = false,
  noOptionsMessage = 'No options available',
  formatOptionLabel,
  getOptionValue = option => option.value,
  getOptionLabel = option => option.label,
  isOptionDisabled = option => option.disabled,
  onMenuOpen,
  onMenuClose,
  menuPortalTarget,
  menuPlacement = 'bottom',
  hideSelectedOptions = false,
  closeMenuOnSelect = true,
  ...props
}, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const selectRef = useRef(null);
  const inputRef = useRef(null);
  const menuRef = useRef(null);
  const combinedRef = ref || selectRef;
  
  // Handle outside click to close the dropdown
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (
        isOpen &&
        selectRef.current &&
        !selectRef.current.contains(e.target) &&
        (!menuPortalTarget || (menuRef.current && !menuRef.current.contains(e.target)))
      ) {
        setIsOpen(false);
        if (onMenuClose) onMenuClose();
      }
    };
    
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen, onMenuClose, menuPortalTarget]);
  
  // Focus the search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, searchable]);
  
  // Size styles
  const sizeStyles = {
    sm: 'py-1.5 pl-3 pr-8 text-sm',
    md: 'py-2 pl-3 pr-8 text-base',
    lg: 'py-2.5 pl-4 pr-10 text-lg'
  };
  
  // Variant styles
  const variantStyles = {
    outline: `bg-white border ${error ? 'border-red-500 focus-within:ring-red-200' : 'border-gray-300 focus-within:border-blue-500 focus-within:ring-blue-200'} focus-within:ring-2 focus-within:ring-offset-0`,
    filled: `bg-gray-100 border border-transparent ${error ? 'focus-within:bg-white focus-within:border-red-500 focus-within:ring-red-200' : 'focus-within:bg-white focus-within:border-blue-500 focus-within:ring-blue-200'} focus-within:ring-2 focus-within:ring-offset-0`,
    flushed: `bg-transparent border-b rounded-none px-0 ${error ? 'border-red-500 focus-within:border-red-500' : 'border-gray-300 focus-within:border-blue-500'}`
  };
  
  // State-specific styles
  const stateStyles = `
    ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'cursor-pointer'}
  `;
  
  // Get selected option(s)
  const getSelectedOption = () => {
    if (!value) return multiple ? [] : null;
    
    if (multiple) {
      if (!Array.isArray(value)) return [];
      return options.filter(option => 
        value.includes(getOptionValue(option))
      );
    } else {
      return options.find(option => 
        getOptionValue(option) === value
      ) || null;
    }
  };
  
  // Filter options by search query
  const filteredOptions = searchable && searchQuery
    ? options.filter(option => 
        getOptionLabel(option).toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;
  
  // Handle toggle
  const handleToggle = () => {
    if (disabled) return;
    
    if (!isOpen && onMenuOpen) onMenuOpen();
    if (isOpen && onMenuClose) onMenuClose();
    
    setIsOpen(!isOpen);
    setSearchQuery('');
  };
  
  // Handle option click
  const handleOptionClick = (option) => {
    console.log('[Select] handleOptionClick called for:', option);
    if (isOptionDisabled(option)) return;
    
    if (multiple) {
      const selectedValues = Array.isArray(value) ? [...value] : [];
      const optionValue = getOptionValue(option);
      
      if (selectedValues.includes(optionValue)) {
        onChange(selectedValues.filter(val => val !== optionValue), {
          name,
          action: 'remove-value',
          removedValue: option
        });
      } else {
        onChange([...selectedValues, optionValue], {
          name,
          action: 'select-option',
          option
        });
      }
      
      if (closeMenuOnSelect) {
        setIsOpen(false);
        if (onMenuClose) onMenuClose();
      }
    } else {
      onChange(getOptionValue(option), {
        name,
        action: 'select-option',
        option
      });
      
      setIsOpen(false);
      if (onMenuClose) onMenuClose();
    }
  };
  
  // Handle clear
  const handleClear = (e) => {
    e.stopPropagation();
    onChange(multiple ? [] : '', {
      name,
      action: 'clear'
    });
  };
  
  // Animation variants
  const menuVariants = {
    hidden: { 
      opacity: 0,
      y: menuPlacement === 'top' ? 10 : -10,
      scale: 0.95,
      transition: { duration: 0.1 }
    },
    visible: { 
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { 
        type: 'spring',
        stiffness: 300,
        damping: 20
      }
    }
  };
  
  // Selected option(s)
  const selectedOption = getSelectedOption();
  const hasSelectedOption = multiple 
    ? selectedOption && selectedOption.length > 0
    : selectedOption !== null;
  
  // Render the display value
  const renderDisplayValue = () => {
    if (!hasSelectedOption) {
      return (
        <span className="text-gray-400">
          {placeholder}
        </span>
      );
    }
    
    if (multiple) {
      if (selectedOption.length === 0) {
        return (
          <span className="text-gray-400">
            {placeholder}
          </span>
        );
      }
      
      return (
        <div className="flex flex-wrap gap-1 max-w-full">
          {selectedOption.map((option) => (
            <div 
              key={getOptionValue(option)}
              className="inline-flex items-center bg-blue-100 text-blue-800 text-sm rounded-full px-2 py-0.5 truncate max-w-[150px]"
            >
              <span className="truncate">
                {getOptionLabel(option)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    
    return formatOptionLabel 
      ? formatOptionLabel(selectedOption, false) 
      : (
          <span className="truncate">
            {getOptionLabel(selectedOption)}
          </span>
        );
  };
  
  // Render menu in portal if specified
  const menu = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          className={`
            absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg max-h-60 overflow-auto focus:outline-none
            py-1 text-base ring-1 ring-black ring-opacity-5
            ${menuPlacement === 'top' ? 'bottom-full mb-1' : 'top-full'}
            ${variant === 'flushed' ? 'left-0' : ''}
            ${menuClassName}
          `}
          variants={menuVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#CBD5E0 #F7FAFC'
          }}
        >
          {/* Search input */}
          {searchable && (
            <div className="px-3 py-2 sticky top-0 bg-white border-b border-gray-100">
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full border-none text-sm focus:outline-none focus:ring-0 p-0"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
          
          {/* No options message */}
          {filteredOptions.length === 0 ? (
            <div className="text-gray-400 text-sm py-2 px-3">
              {noOptionsMessage}
            </div>
          ) : (
            filteredOptions.map((option) => {
              const optionValue = getOptionValue(option);
              const isSelected = multiple
                ? Array.isArray(value) && value.includes(optionValue)
                : value === optionValue;
              const isDisabled = isOptionDisabled(option);
              
              // Skip if hideSelectedOptions is true and option is selected
              if (hideSelectedOptions && isSelected && multiple) {
                return null;
              }
              
              return (
                <div
                  key={optionValue}
                  className={`
                    px-3 py-2 cursor-pointer flex items-center justify-between
                    ${isSelected ? 'bg-blue-50 text-blue-800' : 'text-gray-900 hover:bg-gray-50'}
                    ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                  onClick={() => !isDisabled && handleOptionClick(option)}
                >
                  <div className="flex items-center">
                    {/* If multiple, show checkbox */}
                    {multiple && (
                      <span className={`
                        inline-flex mr-2 h-4 w-4 items-center justify-center rounded border
                        ${isSelected ? 'border-blue-500 bg-blue-500 text-white' : 'border-gray-300'}
                      `}>
                        {isSelected && <CheckIcon className="h-3 w-3" />}
                      </span>
                    )}
                    
                    {/* Option label */}
                    {formatOptionLabel 
                      ? formatOptionLabel(option, true) 
                      : getOptionLabel(option)
                    }
                  </div>
                  
                  {/* Checkmark for single select */}
                  {!multiple && isSelected && (
                    <CheckIcon className="h-4 w-4 text-blue-500" />
                  )}
                </div>
              );
            })
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
  
  return (
    <div className={`w-full ${containerClassName}`}>
      {/* Label */}
      {label && (
        <label 
          htmlFor={id || name} 
          className={`block mb-1.5 text-sm font-medium text-gray-700 ${labelClassName}`}
        >
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}
      
      {/* Select container */}
      <div className="relative">
        <div
          ref={combinedRef}
          className={`
            relative w-full rounded-md
            transition-colors duration-150
            ${sizeStyles[size]}
            ${variantStyles[variant]}
            ${stateStyles}
            ${className}
          `}
          onClick={handleToggle}
        >
          {/* Selected value(s) display */}
          <div className="flex items-center truncate">
            {renderDisplayValue()}
          </div>
          
          {/* Indicators */}
          <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            {/* Loading indicator */}
            {isLoading ? (
              <svg
                className="animate-spin h-5 w-5 text-gray-400"
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
            ) : (
              <>
                {/* Clear button */}
                {clearable && hasSelectedOption && !disabled && (
                  <button
                    type="button"
                    className="h-4 w-4 rounded-full text-gray-400 hover:text-gray-600 focus:outline-none mr-1"
                    onClick={handleClear}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
                
                {/* Dropdown indicator */}
                {isOpen ? (
                  <ChevronUpIcon className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                )}
              </>
            )}
          </span>
        </div>
        
        {/* Menu */}
        {menuPortalTarget ? (
          ReactDOM.createPortal(menu, menuPortalTarget)
        ) : (
          menu
        )}
      </div>
      
      {/* Helper text */}
      {helperText && (
        <p className={`mt-1 text-sm ${error ? 'text-red-500' : 'text-gray-500'}`}>
          {helperText}
        </p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

Select.propTypes = {
  id: PropTypes.string,
  name: PropTypes.string,
  label: PropTypes.node,
  placeholder: PropTypes.string,
  options: PropTypes.array.isRequired,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.array
  ]),
  onChange: PropTypes.func.isRequired,
  error: PropTypes.bool,
  helperText: PropTypes.node,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  multiple: PropTypes.bool,
  clearable: PropTypes.bool,
  searchable: PropTypes.bool,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  variant: PropTypes.oneOf(['outline', 'filled', 'flushed']),
  className: PropTypes.string,
  containerClassName: PropTypes.string,
  labelClassName: PropTypes.string,
  menuClassName: PropTypes.string,
  isLoading: PropTypes.bool,
  noOptionsMessage: PropTypes.string,
  formatOptionLabel: PropTypes.func,
  getOptionValue: PropTypes.func,
  getOptionLabel: PropTypes.func,
  isOptionDisabled: PropTypes.func,
  onMenuOpen: PropTypes.func,
  onMenuClose: PropTypes.func,
  menuPortalTarget: PropTypes.instanceOf(typeof Element !== 'undefined' ? Element : Object),
  menuPlacement: PropTypes.oneOf(['top', 'bottom']),
  hideSelectedOptions: PropTypes.bool,
  closeMenuOnSelect: PropTypes.bool
};

export default Select; 