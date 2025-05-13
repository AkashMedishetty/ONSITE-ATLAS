import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Card from './Card';

/**
 * SafeCard - A wrapper around Card component that catches render errors
 * This prevents a single card error from breaking the entire page layout
 */
class SafeCard extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to the console
    console.error('SafeCard caught an error:', error, errorInfo);
  }

  render() {
    const { title, children, onRetry, ...cardProps } = this.props;
    
    if (this.state.hasError) {
      // Fallback UI when an error occurs
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-red-700">{title || 'Card Error'}</h3>
          <p className="text-sm text-red-600 mt-1">
            {this.state.error?.message || 'An error occurred while rendering this card.'}
          </p>
          {onRetry && (
            <button 
              className="mt-3 px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded hover:bg-red-200"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                if (typeof onRetry === 'function') onRetry();
              }}
            >
              Try Again
            </button>
          )}
        </div>
      );
    }

    // Normal rendering when there's no error
    return <Card title={title} {...cardProps}>{children}</Card>;
  }
}

SafeCard.propTypes = {
  // Add all the Card propTypes
  ...Card.propTypes,
  
  // Additional props
  onRetry: PropTypes.func
};

export default SafeCard; 