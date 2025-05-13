import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-blue-600">404</h1>
        <h2 className="text-6xl font-medium py-8">Page not found</h2>
        <p className="text-xl text-gray-600 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 justify-center">
          <Link
            to="/"
            className="px-6 py-3 bg-blue-600 text-white text-base font-medium rounded-md shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-300"
          >
            Return to Homepage
          </Link>
          <Link
            to="/contact"
            className="px-6 py-3 bg-white text-gray-700 text-base font-medium rounded-md border border-gray-300 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-300"
          >
            Contact Support
          </Link>
        </div>
      </div>
      
      <div className="mt-12">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Looking for something else?</h3>
        <ul className="space-y-2 text-blue-600">
          <li>
            <Link to="/events" className="hover:underline">Browse Events</Link>
          </li>
          <li>
            <Link to="/about" className="hover:underline">About Atlas</Link>
          </li>
          <li>
            <Link to="/privacy-policy" className="hover:underline">Privacy Policy</Link>
          </li>
          <li>
            <Link to="/terms-of-use" className="hover:underline">Terms of Use</Link>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default NotFoundPage; 