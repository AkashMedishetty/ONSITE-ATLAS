import React from 'react';
import PropTypes from 'prop-types';

const ProgressBar = ({ percentage, className }) => {
  const validPercentage = Math.min(100, Math.max(0, percentage || 0));

  return (
    <div className={`w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 ${className || ''}`}>
      <div
        className="bg-primary-600 h-2.5 rounded-full transition-all duration-500 ease-out"
        style={{ width: `${validPercentage}%` }}
        role="progressbar"
        aria-valuenow={validPercentage}
        aria-valuemin="0"
        aria-valuemax="100"
      >
        <span className="sr-only">{validPercentage}% Complete</span>
      </div>
    </div>
  );
};

ProgressBar.propTypes = {
  percentage: PropTypes.number.isRequired,
  className: PropTypes.string,
};

ProgressBar.defaultProps = {
  className: '',
};

export default ProgressBar; 