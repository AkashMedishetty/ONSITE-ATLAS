import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import RegistrantPortalLayout from './RegistrantPortalLayout';
import RegistrantLogin from '../pages/RegistrantPortal/RegistrantLogin';
import RegistrantSignup from '../pages/RegistrantPortal/RegistrantSignup';
import RegistrantForgotPassword from '../pages/RegistrantPortal/RegistrantForgotPassword';
import RegistrantResetPassword from '../pages/RegistrantPortal/RegistrantResetPassword';
import RegistrantHome from '../pages/RegistrantPortal/RegistrantHome';
import RegistrantDashboard from '../pages/RegistrantPortal/RegistrantDashboard';
import RegistrantProfile from '../pages/RegistrantPortal/RegistrantProfile';
import RegistrantEvents from '../pages/RegistrantPortal/RegistrantEvents';
import RegistrantEventDetails from '../pages/RegistrantPortal/RegistrantEventDetails';
import AbstractsList from '../pages/RegistrantPortal/AbstractsList';
import AbstractDetails from '../pages/RegistrantPortal/AbstractDetails';
import AbstractForm from '../pages/RegistrantPortal/AbstractForm';
import Schedule from '../pages/RegistrantPortal/Schedule';
import { useRegistrantAuth } from '../contexts/RegistrantAuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useRegistrantAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/registrant-portal/login" />;
  }

  return children;
};

const RegistrantPortalRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <RegistrantPortalLayout>
            <RegistrantLogin />
          </RegistrantPortalLayout>
        }
      />
      <Route
        path="/signup"
        element={
          <RegistrantPortalLayout>
            <RegistrantSignup />
          </RegistrantPortalLayout>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <RegistrantPortalLayout>
            <RegistrantForgotPassword />
          </RegistrantPortalLayout>
        }
      />
      <Route
        path="/reset-password/:token"
        element={
          <RegistrantPortalLayout>
            <RegistrantResetPassword />
          </RegistrantPortalLayout>
        }
      />

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <RegistrantPortalLayout>
              <RegistrantHome />
            </RegistrantPortalLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <RegistrantPortalLayout>
              <RegistrantDashboard />
            </RegistrantPortalLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <RegistrantPortalLayout>
              <RegistrantProfile />
            </RegistrantPortalLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/events"
        element={
          <ProtectedRoute>
            <RegistrantPortalLayout>
              <RegistrantEvents />
            </RegistrantPortalLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/events/:eventId"
        element={
          <ProtectedRoute>
            <RegistrantPortalLayout>
              <RegistrantEventDetails />
            </RegistrantPortalLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/abstracts"
        element={
          <ProtectedRoute>
            <RegistrantPortalLayout>
              <AbstractsList />
            </RegistrantPortalLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/events/:eventId/abstracts"
        element={
          <ProtectedRoute>
            <RegistrantPortalLayout>
              <AbstractsList />
            </RegistrantPortalLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/abstracts/:abstractId"
        element={
          <ProtectedRoute>
            <RegistrantPortalLayout>
              <AbstractDetails />
            </RegistrantPortalLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/abstracts/new"
        element={
          <ProtectedRoute>
            <RegistrantPortalLayout>
              <AbstractForm />
            </RegistrantPortalLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/abstracts/:abstractId/edit"
        element={
          <ProtectedRoute>
            <RegistrantPortalLayout>
              <AbstractForm isEditing />
            </RegistrantPortalLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/schedule"
        element={
          <ProtectedRoute>
            <RegistrantPortalLayout>
              <Schedule />
            </RegistrantPortalLayout>
          </ProtectedRoute>
        }
      />

      {/* Fallback for unrecognized routes */}
      <Route path="/*" element={<Navigate to="/registrant-portal" />} />
    </Routes>
  );
};

export default RegistrantPortalRoutes; 
