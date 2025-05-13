import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';

const Tabs = ({
  tabs = [],
  defaultTab = 0,
  onChange,
  variant = 'line',
  size = 'md',
  fullWidth = false,
  className = '',
  tabClassName = '',
  panelClassName = '',
  contentClassName = '',
  activeTabClassName = '',
  inactiveTabClassName = '',
  children // Add children prop for external content
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [indicatorWidth, setIndicatorWidth] = useState(0);
  const [indicatorLeft, setIndicatorLeft] = useState(0);
  const tabsRef = useRef([]);
  
  // Size styles
  const sizeStyles = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };
  
  // Variant styles
  const variantStyles = {
    line: 'border-b border-gray-200',
    pills: 'flex space-x-1 p-1 bg-gray-100 rounded-lg',
    enclosed: 'border-b border-gray-200'
  };
  
  // Tab styles
  const baseTabStyles = 'font-medium transition-all duration-200 focus:outline-none';
  
  const tabStyles = {
    line: 'px-4 py-2.5 border-b-2 border-transparent hover:text-primary-600 hover:border-primary-200',
    pills: 'px-4 py-2 rounded-md hover:bg-white hover:text-primary-600',
    enclosed: 'px-4 py-2.5 border-b-2 border-transparent hover:text-primary-600 border-r border-l border-t rounded-t-lg -mb-px'
  };
  
  const activeTabStyles = {
    line: 'text-primary-600 border-b-2 border-primary-500',
    pills: 'bg-white text-primary-600 shadow-sm',
    enclosed: 'text-primary-600 border-b-0 border-r border-l border-t border-gray-200 bg-white'
  };
  
  const inactiveTabStyles = {
    line: 'text-gray-500',
    pills: 'text-gray-500',
    enclosed: 'text-gray-500 bg-gray-50'
  };
  
  // Panel animations
  const panelVariants = {
    hidden: { opacity: 0, y: 5 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.3,
        ease: 'easeOut'
      }
    },
    exit: {
      opacity: 0,
      y: 5,
      transition: {
        duration: 0.2
      }
    }
  };
  
  // Update indicator position on tab change or window resize
  useEffect(() => {
    const updateIndicator = () => {
      if (variant === 'line' && tabsRef.current[activeTab]) {
        const tab = tabsRef.current[activeTab];
        setIndicatorWidth(tab.offsetWidth);
        setIndicatorLeft(tab.offsetLeft);
      }
    };
    
    updateIndicator();
    window.addEventListener('resize', updateIndicator);
    
    return () => {
      window.removeEventListener('resize', updateIndicator);
    };
  }, [activeTab, variant]);
  
  // Handle tab change
  const handleTabChange = (index) => {
    console.log("Tab clicked:", index);
    
    // Handle both numeric indices and string values
    if (typeof index === 'number') {
      // Set local state first
      setActiveTab(index);
      
      // Then call parent onChange handler
      if (onChange) {
        // Log before calling onChange
        console.log(`Tabs: Calling onChange with index ${index}`);
        
        // If tabs have value property, use that instead of index
        const tabValue = tabs[index]?.value !== undefined ? tabs[index].value : index;
        
        // Ensure onChange is called in the next tick to avoid potential state issues
        setTimeout(() => {
          onChange(tabValue);
        }, 0);
      }
    } else {
      // If index is a string/value, find the matching tab index
      const tabIndex = tabs.findIndex(tab => tab.value === index);
      if (tabIndex !== -1) {
        setActiveTab(tabIndex);
        if (onChange) {
          console.log(`Tabs: Calling onChange with string value ${index}`);
          setTimeout(() => {
            onChange(index);
          }, 0);
        }
      }
    }
  };
  
  // When component renders, we need to set the active tab based on defaultTab, which could be a value
  useEffect(() => {
    // If defaultTab is a string, find the matching tab index
    if (typeof defaultTab === 'string') {
      const tabIndex = tabs.findIndex(tab => tab.value === defaultTab);
      if (tabIndex !== -1) {
        setActiveTab(tabIndex);
      }
    } else if (typeof defaultTab === 'number') {
      setActiveTab(defaultTab);
    }
  }, []);

  // Get the current tab's value (string or index)
  const getTabValue = (index) => {
    return tabs[index]?.value !== undefined ? tabs[index].value : index;
  };
  
  return (
    <div className={className}>
      <div className={`mb-4 ${variantStyles[variant]}`}>
        <div className={`relative flex ${fullWidth ? 'w-full' : ''} ${variant === 'pills' ? '' : 'space-x-4'}`}>
          {tabs.map((tab, index) => (
            <button
              key={index}
              ref={(el) => (tabsRef.current[index] = el)}
              className={`
                ${baseTabStyles}
                ${tabStyles[variant]}
                ${sizeStyles[size]}
                ${activeTab === index 
                  ? `${activeTabStyles[variant]} ${activeTabClassName}`
                  : `${inactiveTabStyles[variant]} ${inactiveTabClassName}`}
                ${fullWidth ? 'flex-1 text-center' : ''}
                ${tabClassName}
              `}
              onClick={() => handleTabChange(index)}
            >
              {tab.icon && (
                <span className="mr-2 inline-flex items-center">{tab.icon}</span>
              )}
              {typeof tab.label === 'string' ? (
                <span>{tab.label}</span>
              ) : (
                tab.label
              )}
            </button>
          ))}
          
          {/* Animated indicator for line variant */}
          {variant === 'line' && (
            <motion.div
              className="absolute bottom-0 h-0.5 bg-primary-500 rounded-full"
              initial={false}
              animate={{
                left: indicatorLeft,
                width: indicatorWidth
              }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 30
              }}
            />
          )}
        </div>
      </div>
      
      <div className={contentClassName}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={panelVariants}
            className={panelClassName}
          >
            {/* Check if tab has content first, otherwise use external children */}
            {tabs[activeTab] && tabs[activeTab].content ? 
              tabs[activeTab].content : 
              children
            }
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

Tabs.propTypes = {
  tabs: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
      content: PropTypes.node,
      icon: PropTypes.node
    })
  ).isRequired,
  defaultTab: PropTypes.number,
  onChange: PropTypes.func,
  variant: PropTypes.oneOf(['line', 'pills', 'enclosed']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  fullWidth: PropTypes.bool,
  className: PropTypes.string,
  tabClassName: PropTypes.string,
  panelClassName: PropTypes.string,
  contentClassName: PropTypes.string,
  activeTabClassName: PropTypes.string,
  inactiveTabClassName: PropTypes.string,
  children: PropTypes.node
};

export default Tabs; 