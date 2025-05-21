import React, { Fragment, useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const Modal = ({
  isOpen = false,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  centered = false,
  closeOnClickOutside = true,
  closeOnEsc = true,
  showCloseButton = true,
  fullWidth = false,
  scrollBehavior = 'inside',
  closeButtonPosition = 'header',
  initialFocus,
  className = '',
  contentClassName = '',
  headerClassName = '',
  bodyClassName = '',
  footerClassName = '',
  ...props
}) => {
  // Close on escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (closeOnEsc && isOpen && e.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [closeOnEsc, isOpen, onClose]);
  
  // Size classes
  const sizeClasses = {
    xs: 'max-w-xs',
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
    full: 'max-w-full'
  };
  
  // Animation variants
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.3 }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.2, delay: 0.1 }
    }
  };
  
  const contentVariants = {
    hidden: { 
      opacity: 0,
      y: 20,
      scale: 0.98 
    },
    visible: { 
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { 
        type: 'spring',
        damping: 25,
        stiffness: 300
      }
    },
    exit: { 
      opacity: 0,
      y: 20,
      scale: 0.98,
      transition: { duration: 0.2 }
    }
  };
  
  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="fixed inset-0 z-50 overflow-y-auto"
        onClose={closeOnClickOutside ? onClose : () => {}}
        initialFocus={initialFocus}
        {...props}
      >
        <div className={`
          flex justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0
          ${centered ? 'items-center' : 'items-end sm:items-center sm:block'} 
        `}>
          {/* Background overlay */}
          <Transition.Child
            as={motion.div}
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            leave="ease-in duration-200"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm transition-opacity" />
          </Transition.Child>

          {/* This element is to trick the browser into centering the modal contents. */}
          <span
            className="hidden sm:inline-block sm:align-middle sm:h-screen"
            aria-hidden="true"
          >
            &#8203;
          </span>
          
          {/* Modal panel */}
          <Transition.Child
            as={motion.div}
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            enter="ease-out duration-300"
            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            leave="ease-in duration-200"
            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            className={`
              inline-block w-full text-left sm:my-8 
              ${centered ? '' : 'align-bottom sm:align-middle'}
              ${fullWidth ? 'w-full' : sizeClasses[size]}
              ${className}
            `}
          >
            <div className={`
              relative overflow-hidden bg-white rounded-lg shadow-xl
              ${contentClassName}
            `}>
              {/* Close button - if position is corner */}
              {showCloseButton && closeButtonPosition === 'corner' && (
                <button
                  className="absolute top-3 right-3 z-10 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onClick={onClose}
                  aria-label="Close"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              )}

              {/* Header */}
              {title && (
                <div className={`
                  px-6 py-4 border-b border-gray-100 flex items-center justify-between
                  ${headerClassName}
                `}>
                  <Dialog.Title className="text-lg font-medium text-gray-900">
                    {title}
                  </Dialog.Title>
                  
                  {showCloseButton && closeButtonPosition === 'header' && (
                    <button
                      className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onClick={onClose}
                      aria-label="Close"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>
              )}

              {/* Body */}
              <div className={`
                px-6 py-4
                ${scrollBehavior === 'inside' ? 'max-h-[calc(100vh-200px)] overflow-y-auto' : ''}
                ${bodyClassName}
              `}>
                {children}
              </div>

              {/* Footer */}
              {footer && (
                <div className={`
                  px-6 py-4 border-t border-gray-100 bg-gray-50
                  ${footerClassName}
                `}>
                  {footer}
                </div>
              )}
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
};

Modal.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.node,
  children: PropTypes.node,
  footer: PropTypes.node,
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl', 'full']),
  centered: PropTypes.bool,
  closeOnClickOutside: PropTypes.bool,
  closeOnEsc: PropTypes.bool,
  showCloseButton: PropTypes.bool,
  fullWidth: PropTypes.bool,
  scrollBehavior: PropTypes.oneOf(['inside', 'outside']),
  closeButtonPosition: PropTypes.oneOf(['header', 'corner']),
  initialFocus: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape({ current: PropTypes.instanceOf(Element) })
  ]),
  className: PropTypes.string,
  contentClassName: PropTypes.string,
  headerClassName: PropTypes.string,
  bodyClassName: PropTypes.string,
  footerClassName: PropTypes.string
};

export default Modal; 