import React from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';

const Badge = ({ 
  children,
  variant = 'default',
  size = 'md',
  rounded = 'full',
  withDot = false,
  dotColor,
  icon,
  iconPosition = 'left',
  removable = false,
  onRemove,
  className = '',
  ...props
}) => {
  // Size styles
  const sizeStyles = {
    xs: 'text-xs px-1.5 py-0.5',
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-0.5',
    lg: 'text-sm px-3 py-1',
  };
  
  // Rounded styles
  const roundedStyles = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  };
  
  // Variant styles (color schemes)
  const variantStyles = {
    default: 'bg-gray-100 text-gray-800',
    primary: 'bg-blue-100 text-blue-800',
    secondary: 'bg-purple-100 text-purple-800',
    success: 'bg-green-100 text-green-800',
    danger: 'bg-red-100 text-red-800',
    warning: 'bg-amber-100 text-amber-800',
    info: 'bg-cyan-100 text-cyan-800',
    light: 'bg-gray-50 text-gray-600 border border-gray-200',
    dark: 'bg-gray-700 text-white',
    outline: 'bg-transparent border border-current',
    'outline-primary': 'bg-transparent text-blue-600 border border-blue-600',
    'outline-secondary': 'bg-transparent text-purple-600 border border-purple-600',
    'outline-success': 'bg-transparent text-green-600 border border-green-600',
    'outline-danger': 'bg-transparent text-red-600 border border-red-600',
    'outline-warning': 'bg-transparent text-amber-600 border border-amber-600',
    'outline-info': 'bg-transparent text-cyan-600 border border-cyan-600',
    'outline-dark': 'bg-transparent text-gray-800 border border-gray-800',
  };
  
  // Dot styles (used when withDot is true)
  const dotStyles = {
    primary: 'bg-blue-500',
    secondary: 'bg-purple-500',
    success: 'bg-green-500',
    danger: 'bg-red-500',
    warning: 'bg-amber-500',
    info: 'bg-cyan-500',
    dark: 'bg-gray-700',
    light: 'bg-gray-300',
  };
  
  // Determine dot color
  const dotColorClass = dotColor ? dotStyles[dotColor] : dotStyles[variant] || dotStyles.primary;
  
  // Remove button animation
  const removeButtonVariants = {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    hover: { scale: 1.1 },
    tap: { scale: 0.95 },
  };
  
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={`
        inline-flex items-center font-medium
        ${sizeStyles[size]}
        ${roundedStyles[rounded]}
        ${variantStyles[variant]}
        ${className}
      `}
      {...props}
    >
      {withDot && (
        <span 
          className={`mr-1.5 h-2 w-2 ${dotColorClass} ${roundedStyles.full} inline-block`}
          aria-hidden="true"
        />
      )}
      
      {icon && iconPosition === 'left' && (
        <span className="mr-1 flex-shrink-0">{icon}</span>
      )}
      
      <span>{children}</span>
      
      {icon && iconPosition === 'right' && (
        <span className="ml-1 flex-shrink-0">{icon}</span>
      )}
      
      {removable && (
        <motion.button
          type="button"
          className="flex-shrink-0 ml-1 -mr-1 h-4 w-4 rounded-full inline-flex items-center justify-center focus:outline-none"
          onClick={onRemove}
          aria-label="Remove badge"
          variants={removeButtonVariants}
          initial="initial"
          animate="animate"
          whileHover="hover"
          whileTap="tap"
        >
          <svg className="h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </motion.button>
      )}
    </motion.span>
  );
};

Badge.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf([
    'default', 'primary', 'secondary', 'success', 'danger', 
    'warning', 'info', 'light', 'dark', 'outline',
    'outline-primary', 'outline-secondary', 'outline-success',
    'outline-danger', 'outline-warning', 'outline-info', 'outline-dark'
  ]),
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg']),
  rounded: PropTypes.oneOf(['none', 'sm', 'md', 'lg', 'full']),
  withDot: PropTypes.bool,
  dotColor: PropTypes.oneOf(['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'dark', 'light']),
  icon: PropTypes.node,
  iconPosition: PropTypes.oneOf(['left', 'right']),
  removable: PropTypes.bool,
  onRemove: PropTypes.func,
  className: PropTypes.string,
};

export default Badge; 