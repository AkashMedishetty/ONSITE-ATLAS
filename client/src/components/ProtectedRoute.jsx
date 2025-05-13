import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useRegistrantAuth } from '../contexts/RegistrantAuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useRegistrantAuth();
  const location = useLocation();

  // Show loading state if authentication is still being checked
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    // Save the location they were trying to go to
    return <Navigate to="/registrant-portal/login" state={{ from: location }} replace />;
  }

  // If they are authenticated, show the protected route
  return children;
};

export default ProtectedRoute; 