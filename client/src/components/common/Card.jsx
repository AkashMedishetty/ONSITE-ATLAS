import React from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';

const Card = ({
  children,
  title,
  subtitle,
  footer,
  headerAction,
  footerAction,
  variant = 'elevated',
  border = false,
  padding = 'default',
  rounded = 'lg',
  shadow = 'md',
  hover = false,
  className = '',
  bodyClassName = '',
  headerClassName = '',
  footerClassName = '',
  animate = false,
  ...props
}) => {
  // Base styles
  const baseStyles = 'w-full';
  
  // Padding styles
  const paddingStyles = {
    none: 'p-0',
    xs: 'p-2',
    sm: 'p-3',
    default: 'p-4',
    lg: 'p-5',
    xl: 'p-6'
  };
  
  // Rounded styles
  const roundedStyles = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    '3xl': 'rounded-3xl',
    full: 'rounded-full'
  };
  
  // Shadow styles
  const shadowStyles = {
    none: 'shadow-none',
    sm: 'shadow-sm',
    md: 'shadow',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
    '2xl': 'shadow-2xl'
  };
  
  // Variant styles
  const variantStyles = {
    elevated: `bg-white ${shadowStyles[shadow]}`,
    flat: 'bg-white',
    outline: 'bg-white border border-gray-200',
    filled: 'bg-gray-50',
    transparent: 'bg-transparent'
  };
  
  // Border styles
  const borderStyles = border ? 'border border-gray-200' : '';
  
  // Hover styles
  const hoverStyles = hover ? 'transition-all duration-200 hover:shadow-lg hover:-translate-y-1' : '';
  
  // Combined styles
  const cardStyles = `
    ${baseStyles}
    ${variantStyles[variant]}
    ${roundedStyles[rounded]}
    ${borderStyles}
    ${hoverStyles}
    ${className}
  `;

  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0.4, 0, 0.2, 1]
      }
    }
  };
  
  // Header
  const Header = () => (
    <div className={`flex justify-between items-center border-b border-gray-100 pb-3 mb-3 ${headerClassName}`}>
      <div>
        {title && <h3 className="font-medium text-gray-900">{title}</h3>}
        {subtitle && <div className="mt-0.5 text-sm text-gray-500">{subtitle}</div>}
      </div>
      {headerAction && <div>{headerAction}</div>}
    </div>
  );
  
  // Footer
  const Footer = () => (
    <div className={`border-t border-gray-100 pt-3 mt-3 ${footerClassName}`}>
      <div className="flex justify-between items-center">
        {footer && <div>{footer}</div>}
        {footerAction && <div>{footerAction}</div>}
      </div>
    </div>
  );
  
  const CardComponent = (
    <div className={cardStyles} {...props}>
      <div className={paddingStyles[padding]}>
        {(title || subtitle || headerAction) && <Header />}
        <div className={bodyClassName}>{children}</div>
        {(footer || footerAction) && <Footer />}
      </div>
    </div>
  );
  
  // Return with or without animation
  return animate ? (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={cardVariants}
    >
      {CardComponent}
    </motion.div>
  ) : CardComponent;
};

Card.propTypes = {
  children: PropTypes.node,
  title: PropTypes.node,
  subtitle: PropTypes.node,
  footer: PropTypes.node,
  headerAction: PropTypes.node,
  footerAction: PropTypes.node,
  variant: PropTypes.oneOf(['elevated', 'flat', 'outline', 'filled', 'transparent']),
  border: PropTypes.bool,
  padding: PropTypes.oneOf(['none', 'xs', 'sm', 'default', 'lg', 'xl']),
  rounded: PropTypes.oneOf(['none', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', 'full']),
  shadow: PropTypes.oneOf(['none', 'sm', 'md', 'lg', 'xl', '2xl']),
  hover: PropTypes.bool,
  className: PropTypes.string,
  bodyClassName: PropTypes.string,
  headerClassName: PropTypes.string,
  footerClassName: PropTypes.string,
  animate: PropTypes.bool
};

export default Card; 