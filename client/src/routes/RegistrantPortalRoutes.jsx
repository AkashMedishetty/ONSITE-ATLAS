import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Import all Registrant Portal components
import RegistrantHome from '../pages/RegistrantPortal/RegistrantHome';
import RegistrantLogin from '../pages/RegistrantPortal/RegistrantLogin';
import RegistrantSignup from '../pages/RegistrantPortal/RegistrantSignup';
import RegistrantForgotPassword from '../pages/RegistrantPortal/RegistrantForgotPassword';
import RegistrantResetPassword from '../pages/RegistrantPortal/RegistrantResetPassword';
import RegistrantDashboard from '../pages/RegistrantPortal/RegistrantDashboard';
import RegistrantProfile from '../pages/RegistrantPortal/RegistrantProfile';
import RegistrantEvents from '../pages/RegistrantPortal/RegistrantEvents';
import AbstractsList from '../pages/RegistrantPortal/AbstractsList';
import AbstractSubmission from '../pages/RegistrantPortal/AbstractSubmission';
import AbstractDetails from '../pages/RegistrantPortal/AbstractDetails';
import AbstractEdit from '../pages/RegistrantPortal/AbstractEdit';

// Import the authentication context and protected route component
import { RegistrantAuthProvider } from '../contexts/RegistrantAuthContext';
import ProtectedRoute from '../components/ProtectedRoute';

const RegistrantPortalRoutes = () => {
  return (
    <RegistrantAuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<RegistrantHome />} />
        <Route path="/login" element={<RegistrantLogin />} />
        <Route path="/signup" element={<RegistrantSignup />} />
        <Route path="/forgot-password" element={<RegistrantForgotPassword />} />
        <Route path="/reset-password/:token" element={<RegistrantResetPassword />} />
        
        {/* Protected routes - require authentication */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <RegistrantDashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/profile" element={
          <ProtectedRoute>
            <RegistrantProfile />
          </ProtectedRoute>
        } />
        
        <Route path="/events" element={
          <ProtectedRoute>
            <RegistrantEvents />
          </ProtectedRoute>
        } />
        
        {/* Abstract management routes */}
        <Route path="/abstracts" element={
          <ProtectedRoute>
            <AbstractsList />
          </ProtectedRoute>
        } />
        
        <Route path="/abstracts/new" element={
          <ProtectedRoute>
            <AbstractSubmission />
          </ProtectedRoute>
        } />
        
        <Route path="/abstracts/:id" element={
          <ProtectedRoute>
            <AbstractDetails />
          </ProtectedRoute>
        } />
        
        <Route path="/abstracts/:id/edit" element={
          <ProtectedRoute>
            <AbstractEdit />
          </ProtectedRoute>
        } />
        
        {/* Fallback route for registrant portal */}
        <Route path="*" element={<Navigate to="/registrant-portal" replace />} />
      </Routes>
    </RegistrantAuthProvider>
  );
};

export default RegistrantPortalRoutes; 