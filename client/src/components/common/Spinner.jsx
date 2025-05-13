import React from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';

const Spinner = ({
  size = 'md',
  color = 'primary',
  variant = 'border',
  label = 'Loading...',
  showLabel = false,
  labelPosition = 'bottom',
  thickness = 'medium',
  speed = 'normal',
  className = '',
  ...props
}) => {
  // Size styles
  const sizeStyles = {
    xs: '1rem',
    sm: '1.5rem',
    md: '2rem',
    lg: '3rem',
    xl: '4rem'
  };
  
  // Color styles
  const colorStyles = {
    primary: 'text-blue-600',
    secondary: 'text-purple-600',
    success: 'text-green-600',
    danger: 'text-red-600',
    warning: 'text-amber-500',
    info: 'text-cyan-600',
    light: 'text-gray-300',
    dark: 'text-gray-800',
    white: 'text-white'
  };
  
  // Thickness styles
  const thicknessStyles = {
    thin: { border: '1px', stroke: '1' },
    medium: { border: '2px', stroke: '2' },
    thick: { border: '3px', stroke: '3' }
  };
  
  // Speed styles
  const speedStyles = {
    slow: 1.5,
    normal: 1,
    fast: 0.6
  };
  
  // Animation duration
  const duration = speedStyles[speed];
  
  // Render border spinner
  const BorderSpinner = () => (
    <motion.div
      style={{
        width: sizeStyles[size],
        height: sizeStyles[size],
        borderWidth: thicknessStyles[thickness].border,
        borderTopColor: 'currentColor',
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderBottomColor: 'transparent',
        borderRadius: '50%',
      }}
      className={`inline-block ${colorStyles[color]}`}
      animate={{ rotate: 360 }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'linear'
      }}
    />
  );
  
  // Render grow spinner
  const GrowSpinner = () => (
    <motion.div
      style={{
        width: sizeStyles[size],
        height: sizeStyles[size],
        borderRadius: '50%'
      }}
      className={`inline-block ${colorStyles[color]}`}
      animate={{ 
        scale: [0.5, 1, 0.5],
        opacity: [0.3, 0.8, 0.3]
      }}
      transition={{
        duration: duration * 1.5,
        repeat: Infinity,
        ease: 'easeInOut'
      }}
    />
  );
  
  // Render spinner with SVG
  const SvgSpinner = () => (
    <motion.svg
      width={sizeStyles[size]}
      height={sizeStyles[size]}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block ${colorStyles[color]}`}
      animate={{ rotate: 360 }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'linear'
      }}
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        fill="none"
        strokeWidth={thicknessStyles[thickness].stroke}
      ></circle>
      <motion.path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></motion.path>
    </motion.svg>
  );
  
  // Render dots spinner
  const DotsSpinner = () => {
    const dotSize = parseInt(sizeStyles[size]) / 4;
    
    return (
      <div className={`inline-flex gap-${size === 'xs' ? '1' : '2'} ${colorStyles[color]}`}>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            style={{
              width: `${dotSize}px`,
              height: `${dotSize}px`,
              borderRadius: '50%',
              background: 'currentColor'
            }}
            initial={{ opacity: 0.3 }}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{
              duration: duration,
              repeat: Infinity,
              delay: i * 0.15,
              ease: 'easeInOut'
            }}
          />
        ))}
      </div>
    );
  };
  
  // Render the spinner based on variant
  const renderSpinner = () => {
    switch (variant) {
      case 'border':
        return <BorderSpinner />;
      case 'grow':
        return <GrowSpinner />;
      case 'dots':
        return <DotsSpinner />;
      case 'svg':
      default:
        return <SvgSpinner />;
    }
  };
  
  // Container styles for spinner with label
  const containerStyles = `
    inline-flex
    ${labelPosition === 'bottom' ? 'flex-col items-center' : 'items-center'}
    ${className}
  `;
  
  const labelStyles = `
    text-sm font-medium
    ${labelPosition === 'bottom' ? 'mt-2' : 'ml-3'}
    ${colorStyles[color]}
  `;
  
  // If no label is shown, just return the spinner
  if (!showLabel) {
    return (
      <div className={className} {...props}>
        {renderSpinner()}
      </div>
    );
  }
  
  // Return spinner with label
  return (
    <div className={containerStyles} {...props}>
      {renderSpinner()}
      {showLabel && <span className={labelStyles}>{label}</span>}
    </div>
  );
};

Spinner.propTypes = {
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
  color: PropTypes.oneOf(['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'light', 'dark', 'white']),
  variant: PropTypes.oneOf(['border', 'grow', 'dots', 'svg']),
  label: PropTypes.node,
  showLabel: PropTypes.bool,
  labelPosition: PropTypes.oneOf(['bottom', 'right']),
  thickness: PropTypes.oneOf(['thin', 'medium', 'thick']),
  speed: PropTypes.oneOf(['slow', 'normal', 'fast']),
  className: PropTypes.string
};

export default Spinner; 