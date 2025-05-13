import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

const Tooltip = ({
  children,
  content,
  position = 'top',
  delay = 300,
  hideDelay = 100,
  maxWidth = 250,
  className = '',
  tooltipClassName = '',
  wrapperClassName = '',
  arrow = true,
  closeOnClick = false,
  closeOnEsc = false,
  closeOnScrollOrResize = true,
  interactive = false,
  animationDuration = 0.2,
  animationType = 'fade-scale',
  offset = 8,
  color = 'dark',
  placement = '', // For exact control over placement e.g. 'top-start', 'bottom-end'
  showOnFocus = false,
  withExitAnimation = true,
  followMouse = false,
  sticky = false,
  trigger = 'hover', // hover, click, focus, manual
  isOpen = null, // For controlled usage
  onOpen = () => {},
  onClose = () => {},
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(isOpen === null ? false : isOpen);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const triggerRef = useRef(null);
  const tooltipRef = useRef(null);
  const timeoutRef = useRef(null);
  const clickOutsideRef = useRef(null);
  
  // Sync with isOpen prop (controlled usage)
  useEffect(() => {
    if (isOpen !== null && isOpen !== isVisible) {
      setIsVisible(isOpen);
      
      if (isOpen) {
        setTimeout(calculatePosition, 0);
      }
    }
  }, [isOpen]);
  
  // Determine actual position based on placement or position
  const getActualPosition = () => {
    if (placement) {
      const [basePosition, alignment] = placement.split('-');
      return {
        basePosition: basePosition || position,
        alignment: alignment || 'center'
      };
    }
    return {
      basePosition: position,
      alignment: 'center'
    };
  };

  const calculatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const scrollY = window.scrollY || window.pageYOffset;
    const scrollX = window.scrollX || window.pageXOffset;

    let top = 0;
    let left = 0;
    
    const { basePosition, alignment } = getActualPosition();
    
    // If following mouse, position tooltip relative to mouse
    if (followMouse) {
      switch (basePosition) {
        case 'top':
          top = mousePosition.y + scrollY - tooltipRect.height - offset;
          left = mousePosition.x + scrollX - (tooltipRect.width / 2);
          break;
        case 'bottom':
          top = mousePosition.y + scrollY + offset;
          left = mousePosition.x + scrollX - (tooltipRect.width / 2);
          break;
        case 'left':
          top = mousePosition.y + scrollY - (tooltipRect.height / 2);
          left = mousePosition.x + scrollX - tooltipRect.width - offset;
          break;
        case 'right':
          top = mousePosition.y + scrollY - (tooltipRect.height / 2);
          left = mousePosition.x + scrollX + offset;
          break;
        default:
          break;
      }
    } else {
      // Position tooltip relative to trigger element
      switch (basePosition) {
        case 'top':
          top = triggerRect.top + scrollY - tooltipRect.height - offset;
          
          if (alignment === 'start') {
            left = triggerRect.left + scrollX;
          } else if (alignment === 'end') {
            left = triggerRect.right + scrollX - tooltipRect.width;
          } else {
            left = triggerRect.left + scrollX + (triggerRect.width / 2) - (tooltipRect.width / 2);
          }
          break;
          
        case 'bottom':
          top = triggerRect.bottom + scrollY + offset;
          
          if (alignment === 'start') {
            left = triggerRect.left + scrollX;
          } else if (alignment === 'end') {
            left = triggerRect.right + scrollX - tooltipRect.width;
          } else {
            left = triggerRect.left + scrollX + (triggerRect.width / 2) - (tooltipRect.width / 2);
          }
          break;
          
        case 'left':
          left = triggerRect.left + scrollX - tooltipRect.width - offset;
          
          if (alignment === 'start') {
            top = triggerRect.top + scrollY;
          } else if (alignment === 'end') {
            top = triggerRect.bottom + scrollY - tooltipRect.height;
          } else {
            top = triggerRect.top + scrollY + (triggerRect.height / 2) - (tooltipRect.height / 2);
          }
          break;
          
        case 'right':
          left = triggerRect.right + scrollX + offset;
          
          if (alignment === 'start') {
            top = triggerRect.top + scrollY;
          } else if (alignment === 'end') {
            top = triggerRect.bottom + scrollY - tooltipRect.height;
          } else {
            top = triggerRect.top + scrollY + (triggerRect.height / 2) - (tooltipRect.height / 2);
          }
          break;
          
        default:
          break;
      }
    }

    // Adjust to ensure tooltip is within viewport
    const viewport = {
      width: document.documentElement.clientWidth,
      height: document.documentElement.clientHeight,
    };

    // Check left boundary
    if (left < 10) left = 10;
    
    // Check right boundary
    if (left + tooltipRect.width > viewport.width - 10) {
      left = viewport.width - tooltipRect.width - 10;
    }

    // Check top boundary
    if (top < 10) top = 10;
    
    // Check bottom boundary
    if (top + tooltipRect.height > viewport.height + scrollY - 10) {
      top = viewport.height + scrollY - tooltipRect.height - 10;
    }

    setTooltipPosition({ top, left });
  };
  
  // Track mouse position
  const handleMouseMove = (e) => {
    if (followMouse) {
      setMousePosition({ x: e.clientX, y: e.clientY });
      if (isVisible) {
        calculatePosition();
      }
    }
  };
  
  const openTooltip = () => {
    if (isVisible) return;
    if (isOpen !== null) {
      onOpen();
      return;
    }
    
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
      onOpen();
      // Wait for tooltip to be visible before calculating position
      setTimeout(() => {
        calculatePosition();
      }, 0);
    }, delay);
  };
  
  const closeTooltip = () => {
    if (!isVisible) return;
    if (isOpen !== null) {
      onClose();
      return;
    }
    
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, hideDelay);
  };

  const handleMouseEnter = () => {
    if (trigger === 'hover' || trigger === 'manual') {
      openTooltip();
    }
  };

  const handleMouseLeave = () => {
    if (trigger === 'hover' || (trigger === 'manual' && !interactive)) {
      closeTooltip();
    }
  };
  
  const handleClick = () => {
    if (trigger === 'click') {
      if (isVisible) {
        closeTooltip();
      } else {
        openTooltip();
      }
    }
    
    if (closeOnClick && isVisible) {
      closeTooltip();
    }
  };
  
  const handleFocus = () => {
    if (trigger === 'focus' || showOnFocus) {
      openTooltip();
    }
  };
  
  const handleBlur = () => {
    if (trigger === 'focus') {
      closeTooltip();
    }
  };
  
  // Handle click outside for interactive tooltips
  useEffect(() => {
    if (isVisible && interactive) {
      const handleClickOutside = (event) => {
        if (
          triggerRef.current && 
          !triggerRef.current.contains(event.target) &&
          tooltipRef.current && 
          !tooltipRef.current.contains(event.target)
        ) {
          closeTooltip();
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isVisible, interactive]);
  
  // Handle ESC key for closable tooltips
  useEffect(() => {
    if (isVisible && closeOnEsc) {
      const handleEscKey = (event) => {
        if (event.key === 'Escape') {
          closeTooltip();
        }
      };

      document.addEventListener('keydown', handleEscKey);
      return () => {
        document.removeEventListener('keydown', handleEscKey);
      };
    }
  }, [isVisible, closeOnEsc]);

  // Add window resize and scroll event listeners
  useEffect(() => {
    if (isVisible) {
      const handleResize = () => {
        calculatePosition();
        if (closeOnScrollOrResize) {
          closeTooltip();
        }
      };
      
      const handleScroll = () => {
        if (sticky) {
          calculatePosition();
        } else if (closeOnScrollOrResize) {
          closeTooltip();
        }
      };

      if (followMouse) {
        document.addEventListener('mousemove', handleMouseMove);
      }
      
      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleScroll, true);

      return () => {
        if (followMouse) {
          document.removeEventListener('mousemove', handleMouseMove);
        }
        window.addEventListener('resize', handleResize);
        window.addEventListener('scroll', handleScroll, true);
      };
    }
  }, [isVisible, sticky, closeOnScrollOrResize, followMouse]);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      clearTimeout(timeoutRef.current);
    };
  }, []);

  // Tooltip animation variants based on position
  const tooltipVariants = {
    hidden: {
      opacity: 0,
      scale: 0.95,
      transition: { duration: animationDuration },
      ...(() => {
        if (animationType === 'fade') return {};
        if (animationType === 'shift') {
          const { basePosition } = getActualPosition();
          switch (basePosition) {
            case 'top': return { y: -5 };
            case 'bottom': return { y: 5 };
            case 'left': return { x: -5 };
            case 'right': return { x: 5 };
            default: return {};
          }
        }
        return {};
      })()
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      x: 0,
      transition: { duration: animationDuration }
    }
  };

  // Position classes and styles for the tooltip arrow
  const getArrowClass = () => {
    const { basePosition, alignment } = getActualPosition();
    
    const baseClasses = 'absolute h-0 w-0 border-[6px]';
    
    const colorClass = color === 'light' 
      ? 'border-t-white border-l-transparent border-r-transparent' 
      : 'border-t-gray-800 border-l-transparent border-r-transparent';
    
    let positionClass = '';
    
    switch (basePosition) {
      case 'top':
        positionClass = 'bottom-0 translate-y-full';
        if (alignment === 'start') {
          positionClass += ' left-4';
        } else if (alignment === 'end') {
          positionClass += ' right-4';
        } else {
          positionClass += ' left-1/2 -translate-x-1/2';
        }
        break;
        
      case 'bottom':
        positionClass = 'top-0 -translate-y-full rotate-180';
        if (alignment === 'start') {
          positionClass += ' left-4';
        } else if (alignment === 'end') {
          positionClass += ' right-4';
        } else {
          positionClass += ' left-1/2 -translate-x-1/2';
        }
        break;
        
      case 'left':
        positionClass = 'right-0 translate-x-full rotate-90';
        if (alignment === 'start') {
          positionClass += ' top-4';
        } else if (alignment === 'end') {
          positionClass += ' bottom-4';
        } else {
          positionClass += ' top-1/2 -translate-y-1/2';
        }
        break;
        
      case 'right':
        positionClass = 'left-0 -translate-x-full -rotate-90';
        if (alignment === 'start') {
          positionClass += ' top-4';
        } else if (alignment === 'end') {
          positionClass += ' bottom-4';
        } else {
          positionClass += ' top-1/2 -translate-y-1/2';
        }
        break;
        
      default:
        break;
    }
    
    return `${baseClasses} ${positionClass} ${colorClass}`;
  };
  
  // Get background color class based on color prop
  const getBackgroundClass = () => {
    switch (color) {
      case 'light': return 'bg-white text-gray-800 border border-gray-200';
      case 'dark': return 'bg-gray-800 text-white';
      case 'primary': return 'bg-primary-600 text-white';
      case 'secondary': return 'bg-secondary-600 text-white';
      case 'success': return 'bg-green-600 text-white';
      case 'danger': return 'bg-red-600 text-white';
      case 'warning': return 'bg-yellow-600 text-white';
      case 'info': return 'bg-blue-600 text-white';
      default: return 'bg-gray-800 text-white';
    }
  };

  // Props for trigger element
  const triggerProps = {
    ref: triggerRef,
    className: `inline-flex ${wrapperClassName}`,
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    onClick: handleClick,
    onFocus: handleFocus,
    onBlur: handleBlur,
    tabIndex: showOnFocus ? 0 : undefined,
    ...props
  };

  return (
    <>
      <div {...triggerProps}>
        {children}
      </div>
      
      <AnimatePresence>
        {isVisible && content && createPortal(
          <motion.div
            ref={tooltipRef}
            className={`fixed z-50 ${interactive ? '' : 'pointer-events-none'} ${className}`}
            style={{
              top: `${tooltipPosition.top}px`,
              left: `${tooltipPosition.left}px`,
              maxWidth: `${maxWidth}px`,
            }}
            initial="hidden"
            animate="visible"
            exit={withExitAnimation ? "hidden" : { opacity: 0, transition: { duration: 0.1 } }}
            variants={tooltipVariants}
          >
            <div className="relative">
              <div className={`${getBackgroundClass()} text-sm rounded-md py-2 px-3 shadow-lg ${tooltipClassName}`}>
                {typeof content === 'string' ? <p>{content}</p> : content}
              </div>
              {arrow && (
                <div className={getArrowClass()}></div>
              )}
            </div>
          </motion.div>,
          document.body
        )}
      </AnimatePresence>
    </>
  );
};

Tooltip.propTypes = {
  children: PropTypes.node.isRequired,
  content: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  position: PropTypes.oneOf(['top', 'bottom', 'left', 'right']),
  delay: PropTypes.number,
  hideDelay: PropTypes.number,
  maxWidth: PropTypes.number,
  className: PropTypes.string,
  tooltipClassName: PropTypes.string,
  wrapperClassName: PropTypes.string,
  arrow: PropTypes.bool,
  closeOnClick: PropTypes.bool,
  closeOnEsc: PropTypes.bool,
  closeOnScrollOrResize: PropTypes.bool,
  interactive: PropTypes.bool,
  animationDuration: PropTypes.number,
  animationType: PropTypes.oneOf(['fade', 'fade-scale', 'shift']),
  offset: PropTypes.number,
  color: PropTypes.oneOf(['light', 'dark', 'primary', 'secondary', 'success', 'danger', 'warning', 'info']),
  placement: PropTypes.string,
  showOnFocus: PropTypes.bool,
  withExitAnimation: PropTypes.bool,
  followMouse: PropTypes.bool,
  sticky: PropTypes.bool,
  trigger: PropTypes.oneOf(['hover', 'click', 'focus', 'manual']),
  isOpen: PropTypes.bool,
  onOpen: PropTypes.func,
  onClose: PropTypes.func,
};

export default Tooltip; 