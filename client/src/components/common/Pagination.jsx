import React from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';

const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  siblingCount = 1,
  boundaryCount = 1,
  showFirstButton = true,
  showLastButton = true,
  size = 'md',
  variant = 'outline',
  shape = 'rounded',
  className = '',
  renderPageButton,
  prevLabel = 'Previous',
  nextLabel = 'Next',
  prevIcon = <ChevronLeftIcon className="h-4 w-4" />,
  nextIcon = <ChevronRightIcon className="h-4 w-4" />,
  showPageInfo = true,
  pageInfoText = 'Page {current} of {total}',
  showPageSizeOptions = false,
  pageSizeOptions = [10, 25, 50, 100],
  pageSize = 10,
  onPageSizeChange,
  disableRipple = false,
  ...props
}) => {
  // Log the received totalPages prop
  console.log('[Pagination Component] Received props:', { currentPage, totalPages, totalCount: props.totalCount });

  // Ensure current page is within range
  const normalizedCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  
  // Size styles
  const sizeStyles = {
    xs: 'h-6 min-w-6 px-1 text-xs',
    sm: 'h-8 min-w-8 px-2 text-sm',
    md: 'h-10 min-w-10 px-3 text-sm',
    lg: 'h-12 min-w-12 px-4 text-base'
  };
  
  // Variant styles
  const variantStyles = {
    outline: {
      base: 'border',
      normal: 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
      active: 'border-blue-500 bg-blue-50 text-blue-600 hover:bg-blue-100',
      disabled: 'border-gray-200 bg-gray-100 text-gray-400'
    },
    solid: {
      base: 'border border-transparent',
      normal: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
      active: 'bg-blue-500 text-white hover:bg-blue-600',
      disabled: 'bg-gray-100 text-gray-400'
    },
    text: {
      base: '',
      normal: 'text-gray-700 hover:bg-gray-100',
      active: 'text-blue-600 font-medium hover:bg-blue-50',
      disabled: 'text-gray-400'
    }
  };
  
  // Shape styles
  const shapeStyles = {
    rounded: 'rounded-md',
    circular: 'rounded-full'
  };
  
  // Generate page numbers to show
  const generatePageNumbers = () => {
    const totalPageNumbers = siblingCount * 2 + 3 + boundaryCount * 2;
    
    // If total pages is less than total page numbers to show, just show all pages
    if (totalPages <= totalPageNumbers) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    const leftSiblingIndex = Math.max(normalizedCurrentPage - siblingCount, boundaryCount + 1);
    const rightSiblingIndex = Math.min(normalizedCurrentPage + siblingCount, totalPages - boundaryCount);
    
    const showLeftDots = leftSiblingIndex > boundaryCount + 2;
    const showRightDots = rightSiblingIndex < totalPages - boundaryCount - 1;
    
    const leftBoundaryArray = Array.from({ length: boundaryCount }, (_, i) => i + 1);
    const rightBoundaryArray = Array.from({ length: boundaryCount }, (_, i) => totalPages - boundaryCount + i + 1);
    
    if (!showLeftDots && showRightDots) {
      const leftItemCount = 3 + 2 * siblingCount + boundaryCount;
      const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
      return [...leftRange, '...', ...rightBoundaryArray];
    }
    
    if (showLeftDots && !showRightDots) {
      const rightItemCount = 3 + 2 * siblingCount + boundaryCount;
      const rightRange = Array.from(
        { length: rightItemCount },
        (_, i) => totalPages - rightItemCount + i + 1
      );
      return [...leftBoundaryArray, '...', ...rightRange];
    }
    
    if (showLeftDots && showRightDots) {
      const middleRange = Array.from(
        { length: rightSiblingIndex - leftSiblingIndex + 1 },
        (_, i) => leftSiblingIndex + i
      );
      return [...leftBoundaryArray, '...', ...middleRange, '...', ...rightBoundaryArray];
    }
  };
  
  const pageNumbers = generatePageNumbers();
  // Log the generated page numbers array
  console.log('[Pagination Component] Generated pageNumbers:', pageNumbers);
  
  // Navigate to a specific page
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages && page !== normalizedCurrentPage) {
      onPageChange(page);
    }
  };
  
  // Handle page size change
  const handlePageSizeChange = (e) => {
    if (onPageSizeChange) {
      onPageSizeChange(Number(e.target.value));
    }
  };
  
  // Format page info text
  const formattedPageInfo = pageInfoText
    .replace('{current}', normalizedCurrentPage)
    .replace('{total}', totalPages);
  
  // Render a page button with appropriate styling
  const PageButton = ({ page, isActive, isDisabled, ariaLabel, children }) => {
    // Button base styles
    const buttonBaseStyles = `
      inline-flex items-center justify-center
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
      transition-colors duration-200
      ${sizeStyles[size]}
      ${shapeStyles[shape]}
      ${variantStyles[variant].base}
      ${isDisabled
        ? variantStyles[variant].disabled
        : isActive
          ? variantStyles[variant].active
          : variantStyles[variant].normal
      }
      ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}
    `;
    
    // If custom render function provided
    if (renderPageButton) {
      return renderPageButton({
        page,
        isActive,
        isDisabled,
        onPageChange: () => handlePageChange(page)
      });
    }
    
    // Animation variants
    const buttonVariants = {
      hover: !disableRipple && !isDisabled ? { scale: 1.05 } : {},
      tap: !disableRipple && !isDisabled ? { scale: 0.95 } : {}
    };
    
    return (
      <motion.button
        type="button"
        onClick={() => handlePageChange(page)}
        disabled={isDisabled}
        aria-label={ariaLabel}
        aria-current={isActive ? 'page' : undefined}
        className={buttonBaseStyles}
        whileHover="hover"
        whileTap="tap"
        variants={buttonVariants}
      >
        {children}
      </motion.button>
    );
  };
  
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${className}`} {...props}>
      {/* Page size options */}
      {showPageSizeOptions && (
        <div className="flex items-center space-x-2 text-sm">
          <label htmlFor="pageSize" className="text-gray-600">Rows per page:</label>
          <select
            id="pageSize"
            value={pageSize}
            onChange={handlePageSizeChange}
            className="border border-gray-300 rounded-md py-1 pl-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {pageSizeOptions.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      )}
      
      <div className="flex items-center justify-center sm:justify-end space-x-1">
        {/* Previous page button */}
        <PageButton
          page={normalizedCurrentPage - 1}
          isDisabled={normalizedCurrentPage <= 1}
          ariaLabel="Go to previous page"
        >
          <span className="sr-only">{prevLabel}</span>
          {prevIcon}
        </PageButton>
        
        {/* First page button */}
        {showFirstButton && normalizedCurrentPage > boundaryCount + 2 && (
          <>
            <PageButton
              page={1}
              isActive={normalizedCurrentPage === 1}
              ariaLabel="Go to first page"
            >
              1
            </PageButton>
            {normalizedCurrentPage > boundaryCount + 3 && (
              <span className="px-2 text-gray-500 select-none">...</span>
            )}
          </>
        )}
        
        {/* Page numbers */}
        {pageNumbers.map((page, index) => {
          if (page === '...') {
            return <span key={`ellipsis-${index}`} className="px-2 text-gray-500 select-none">...</span>;
          }
          
          return (
            <PageButton
              key={page}
              page={page}
              isActive={page === normalizedCurrentPage}
              ariaLabel={`Go to page ${page}`}
            >
              {page}
            </PageButton>
          );
        })}
        
        {/* Last page button */}
        {showLastButton && normalizedCurrentPage < totalPages - boundaryCount - 1 && (
          <>
            {normalizedCurrentPage < totalPages - boundaryCount - 2 && (
              <span className="px-2 text-gray-500 select-none">...</span>
            )}
            <PageButton
              page={totalPages}
              isActive={normalizedCurrentPage === totalPages}
              ariaLabel="Go to last page"
            >
              {totalPages}
            </PageButton>
          </>
        )}
        
        {/* Next page button */}
        <PageButton
          page={normalizedCurrentPage + 1}
          isDisabled={normalizedCurrentPage >= totalPages}
          ariaLabel="Go to next page"
        >
          <span className="sr-only">{nextLabel}</span>
          {nextIcon}
        </PageButton>
      </div>
      
      {/* Page info text */}
      {showPageInfo && (
        <div className="text-sm text-gray-600 mt-2 sm:mt-0 text-center sm:order-first">
          {formattedPageInfo}
        </div>
      )}
    </div>
  );
};

Pagination.propTypes = {
  currentPage: PropTypes.number,
  totalPages: PropTypes.number,
  onPageChange: PropTypes.func.isRequired,
  siblingCount: PropTypes.number,
  boundaryCount: PropTypes.number,
  showFirstButton: PropTypes.bool,
  showLastButton: PropTypes.bool,
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg']),
  variant: PropTypes.oneOf(['outline', 'solid', 'text']),
  shape: PropTypes.oneOf(['rounded', 'circular']),
  className: PropTypes.string,
  renderPageButton: PropTypes.func,
  prevLabel: PropTypes.string,
  nextLabel: PropTypes.string,
  prevIcon: PropTypes.node,
  nextIcon: PropTypes.node,
  showPageInfo: PropTypes.bool,
  pageInfoText: PropTypes.string,
  showPageSizeOptions: PropTypes.bool,
  pageSizeOptions: PropTypes.arrayOf(PropTypes.number),
  pageSize: PropTypes.number,
  onPageSizeChange: PropTypes.func,
  disableRipple: PropTypes.bool
};

export default Pagination;