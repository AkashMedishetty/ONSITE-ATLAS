import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useRegistrantAuth } from '../contexts/RegistrantAuthContext.jsx';

const RegistrantRoute = ({ children }) => {
  const { isAuthenticated, loading } = useRegistrantAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to={`/registrant-portal/auth/login${location.search}`} replace />;
};

export default RegistrantRoute; 