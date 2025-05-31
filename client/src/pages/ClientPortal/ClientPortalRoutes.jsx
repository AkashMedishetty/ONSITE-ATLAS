import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ClientPortalLayout from '../../layouts/ClientPortalLayout';
import ClientLoginPage from './ClientLoginPage';
import ClientDashboardPage from './ClientDashboardPage';
import ClientRegistrantsPage from './ClientRegistrantsPage';
import ClientAbstractsPage from './ClientAbstractsPage';
import ClientSponsorsPage from './ClientSponsorsPage';
import ClientReportsPage from './ClientReportsPage';
import ClientBulkImport from './ClientBulkImport';
// TODO: Implement and import the other page components
// import ClientRegistrantsPage from './ClientRegistrantsPage';
// import ClientAbstractsPage from './ClientAbstractsPage';
// import ClientSponsorsPage from './ClientSponsorsPage';
// import ClientReportsPage from './ClientReportsPage';

const ClientPortalRoutes = () => (
  <Routes>
    {/* Public login route */}
    <Route path="/login" element={<ClientLoginPage />} />

    {/* Protected routes (require client auth) */}
    <Route element={<ClientPortalLayout />}>
      <Route path="/dashboard" element={<ClientDashboardPage />} />
      <Route path="/registrants" element={<ClientRegistrantsPage />} />
      <Route path="/abstracts" element={<ClientAbstractsPage />} />
      <Route path="/sponsors" element={<ClientSponsorsPage />} />
      <Route path="/reports" element={<ClientReportsPage />} />
      <Route path="/bulk-import" element={<ClientBulkImport />} />
      {/* Default redirect to dashboard */}
      <Route path="*" element={<Navigate to="/client/dashboard" replace />} />
    </Route>
  </Routes>
);

export default ClientPortalRoutes; 