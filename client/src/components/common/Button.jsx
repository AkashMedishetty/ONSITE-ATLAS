import React from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  rounded = 'md',
  fullWidth = false,
  disabled = false,
  isLoading = false,
  leftIcon,
  rightIcon,
  href,
  to,
  type = 'button',
  onClick,
  className = '',
  spinnerSize = 'sm',
  ...props
}) => {
  // Base styles
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  // Size styles
  const sizeStyles = {
    xs: 'text-xs px-2.5 py-1.5 min-h-8',
    sm: 'text-sm px-3 py-1.5 min-h-9',
    md: 'text-sm px-4 py-2 min-h-10',
    lg: 'text-base px-5 py-2.5 min-h-11',
    xl: 'text-lg px-6 py-3 min-h-12'
  };
  
  // Rounded styles
  const roundedStyles = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full'
  };
  
  // Button variants
  const variantStyles = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    warning: 'bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-500',
    info: 'bg-cyan-600 text-white hover:bg-cyan-700 focus:ring-cyan-500',
    light: 'bg-gray-100 text-gray-800 hover:bg-gray-200 focus:ring-gray-500',
    dark: 'bg-gray-800 text-white hover:bg-gray-900 focus:ring-gray-500',
    
    // Outline variants
    'outline-primary': 'bg-transparent text-blue-600 border border-blue-600 hover:bg-blue-50 focus:ring-blue-500',
    'outline-secondary': 'bg-transparent text-purple-600 border border-purple-600 hover:bg-purple-50 focus:ring-purple-500',
    'outline-success': 'bg-transparent text-green-600 border border-green-600 hover:bg-green-50 focus:ring-green-500',
    'outline-danger': 'bg-transparent text-red-600 border border-red-600 hover:bg-red-50 focus:ring-red-500',
    'outline-warning': 'bg-transparent text-amber-500 border border-amber-500 hover:bg-amber-50 focus:ring-amber-500',
    'outline-info': 'bg-transparent text-cyan-600 border border-cyan-600 hover:bg-cyan-50 focus:ring-cyan-500',
    'outline-light': 'bg-transparent text-gray-500 border border-gray-300 hover:bg-gray-50 focus:ring-gray-500',
    'outline-dark': 'bg-transparent text-gray-800 border border-gray-800 hover:bg-gray-100 focus:ring-gray-500',
    
    // Ghost variants
    'ghost-primary': 'bg-transparent text-blue-600 hover:bg-blue-50 focus:ring-blue-500',
    'ghost-secondary': 'bg-transparent text-purple-600 hover:bg-purple-50 focus:ring-purple-500',
    'ghost-success': 'bg-transparent text-green-600 hover:bg-green-50 focus:ring-green-500',
    'ghost-danger': 'bg-transparent text-red-600 hover:bg-red-50 focus:ring-red-500',
    'ghost-warning': 'bg-transparent text-amber-500 hover:bg-amber-50 focus:ring-amber-500',
    'ghost-info': 'bg-transparent text-cyan-600 hover:bg-cyan-50 focus:ring-cyan-500',
    'ghost-light': 'bg-transparent text-gray-500 hover:bg-gray-50 focus:ring-gray-500',
    'ghost-dark': 'bg-transparent text-gray-800 hover:bg-gray-100 focus:ring-gray-500',
    
    // Link variants
    'link-primary': 'bg-transparent p-0 text-blue-600 hover:underline focus:ring-0 hover:text-blue-700',
    'link-secondary': 'bg-transparent p-0 text-purple-600 hover:underline focus:ring-0 hover:text-purple-700',
    'link-success': 'bg-transparent p-0 text-green-600 hover:underline focus:ring-0 hover:text-green-700',
    'link-danger': 'bg-transparent p-0 text-red-600 hover:underline focus:ring-0 hover:text-red-700',
    'link-warning': 'bg-transparent p-0 text-amber-500 hover:underline focus:ring-0 hover:text-amber-600',
    'link-info': 'bg-transparent p-0 text-cyan-600 hover:underline focus:ring-0 hover:text-cyan-700',
    'link-light': 'bg-transparent p-0 text-gray-500 hover:underline focus:ring-0 hover:text-gray-600',
    'link-dark': 'bg-transparent p-0 text-gray-800 hover:underline focus:ring-0 hover:text-gray-900',
  };
  
  // Spinner loader
  const spinnerSizes = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
    xl: 'h-7 w-7'
  };
  
  // Animation variants
  const buttonVariants = {
    hover: { scale: 1.02 },
    tap: { scale: 0.98 },
    disabled: { opacity: 0.6 }
  };
  
  // Handle icon spacing
  const iconSpacing = {
    left: leftIcon ? 'mr-2' : '',
    right: rightIcon ? 'ml-2' : ''
  };
  
  // Combine all styles
  const buttonStyles = `
    ${baseStyles}
    ${sizeStyles[size]}
    ${roundedStyles[rounded]}
    ${variantStyles[variant]}
    ${fullWidth ? 'w-full' : ''}
    ${variant.startsWith('link') ? '' : 'shadow-sm'}
    ${className}
  `;
  
  // Loading state
  const isDisabled = disabled || isLoading;
  
  // Spinner component
  const Spinner = () => (
    <svg
      className={`animate-spin ${spinnerSizes[spinnerSize]}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      data-testid="loading-spinner"
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
  );
  
  // Content with icons and/or spinner
  const buttonContent = (
    <>
      {isLoading && (
        <span className="mr-2">
          <Spinner />
        </span>
      )}
      
      {leftIcon && !isLoading && (
        <span className={iconSpacing.left}>
          {leftIcon}
        </span>
      )}
      
      <span className={isLoading ? 'opacity-75' : ''}>
        {children}
      </span>
      
      {rightIcon && !isLoading && (
        <span className={iconSpacing.right}>
          {rightIcon}
        </span>
      )}
    </>
  );
  
  // If it's a link
  if (to) {
    return (
      <motion.div
        whileHover={!isDisabled ? 'hover' : undefined}
        whileTap={!isDisabled ? 'tap' : undefined}
        animate={isDisabled ? 'disabled' : 'initial'}
        variants={buttonVariants}
        className="inline-block"
      >
        <Link
          to={to}
          className={`${buttonStyles} ${isDisabled ? 'opacity-60 cursor-not-allowed pointer-events-none' : ''}`}
          {...props}
        >
          {buttonContent}
        </Link>
      </motion.div>
    );
  }
  
  // If it's an external link
  if (href) {
    return (
      <motion.div
        whileHover={!isDisabled ? 'hover' : undefined}
        whileTap={!isDisabled ? 'tap' : undefined}
        animate={isDisabled ? 'disabled' : 'initial'}
        variants={buttonVariants}
        className="inline-block"
      >
        <a
          href={href}
          className={`${buttonStyles} ${isDisabled ? 'opacity-60 cursor-not-allowed pointer-events-none' : ''}`}
          target="_blank"
          rel="noopener noreferrer"
          {...props}
        >
          {buttonContent}
        </a>
      </motion.div>
    );
  }
  
  // Regular button
  return (
    <motion.button
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      className={buttonStyles}
      whileHover={!isDisabled ? 'hover' : undefined}
      whileTap={!isDisabled ? 'tap' : undefined}
      animate={isDisabled ? 'disabled' : 'initial'}
      variants={buttonVariants}
      {...props}
    >
      {buttonContent}
    </motion.button>
  );
};

Button.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf([
    'primary', 'secondary', 'success', 'danger', 'warning', 'info', 'light', 'dark',
    'outline-primary', 'outline-secondary', 'outline-success', 'outline-danger', 
    'outline-warning', 'outline-info', 'outline-light', 'outline-dark',
    'ghost-primary', 'ghost-secondary', 'ghost-success', 'ghost-danger',
    'ghost-warning', 'ghost-info', 'ghost-light', 'ghost-dark',
    'link-primary', 'link-secondary', 'link-success', 'link-danger',
    'link-warning', 'link-info', 'link-light', 'link-dark'
  ]),
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
  rounded: PropTypes.oneOf(['none', 'sm', 'md', 'lg', 'xl', 'full']),
  fullWidth: PropTypes.bool,
  disabled: PropTypes.bool,
  isLoading: PropTypes.bool,
  leftIcon: PropTypes.node,
  rightIcon: PropTypes.node,
  href: PropTypes.string,
  to: PropTypes.string,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  onClick: PropTypes.func,
  className: PropTypes.string,
  spinnerSize: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
};

export { Button };
export default Button; 