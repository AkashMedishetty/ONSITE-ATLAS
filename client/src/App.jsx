import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { Toaster } from 'react-hot-toast';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useParams } from 'react-router-dom';

// Import layouts
import MainLayout from './layouts/MainLayout';
import DashboardLayout from './layouts/DashboardLayout';
import AuthLayout from './layouts/AuthLayout';
import RegistrantPortalLayout from './layouts/RegistrantPortalLayout';
import ReviewerPortalLayout from './layouts/ReviewerPortalLayout';

// Import pages
import Dashboard from './pages/Dashboard';
import Timeline from './pages/Timeline';

// Import components using barrel exports
import { EventList, EventForm, EventPortal, ResourcesTab } from './pages/Events';
import { CategoryList, CategoryForm, CategoryDetail, CategoryResources } from './pages/Categories';
import { RegistrationList, RegistrationForm } from './pages/Registration';
import { AbstractList, AbstractSubmissionForm, AbstractDetail } from './pages/Abstracts';
import { BadgePrintingPage, BadgeDesigner } from './pages/BadgePrinting';

// Import enhanced registration detail component
import RegistrationDetail from './pages/Events/registrations/RegistrationDetail';

// Import resource components
import { ResourceList, ScannerStation, FoodTracking, KitBagDistribution, CertificateIssuance, CertificatePrinting, CertificatePrintingScanner } from './pages/Resources';

// Import new components
import BulkImportWizard from './pages/Registrations/BulkImportWizard';
import LandingPagesManager from './pages/LandingPages/LandingPagesManager';
import LandingPageEditor from './pages/LandingPages/LandingPageEditor';
import LandingPagePreview from './pages/LandingPages/LandingPagePreview';
import PublicLandingPage from './pages/Public/PublicLandingPage';
import AbstractManagementDashboard from './pages/AbstractManagement/AbstractManagementDashboard';
import AbstractReview from './pages/AbstractManagement/AbstractReview';
import ClientLoginPage from './pages/ClientPortal/ClientLoginPage';
import ClientPortalRoutes from './pages/ClientPortal/ClientPortalRoutes';

// Lazily loaded components
const EventSettings = lazy(() => import('./pages/Events/EventSettings'));
const BulkImport = lazy(() => import('./pages/Registration/BulkImport'));
const ResourceConfiguration = lazy(() => import('./pages/Resources/ResourceConfiguration'));
const AbstractForm = lazy(() => import('./pages/Abstracts/AbstractForm'));
const AbstractPortal = lazy(() => import('./pages/PublicPortals/AbstractPortal'));
const ReportsPage = lazy(() => import('./pages/Reports/ReportsPage'));
const ReportBuilder = lazy(() => import('./pages/Reports/ReportBuilder'));
const SettingsPage = lazy(() => import('./pages/Settings/SettingsPage'));
const UserManagement = lazy(() => import('./pages/Settings/UserManagement'));
const GlobalSettings = lazy(() => import('./pages/Settings/GlobalSettings'));
const EmailTemplates = lazy(() => import('./pages/Settings/EmailTemplates'));
const PaymentGateways = lazy(() => import('./pages/Settings/PaymentGateways'));
const LoginPage = lazy(() => import('./pages/Auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/Auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/Auth/ForgotPasswordPage'));
const RegistrationPortal = lazy(() => import('./pages/PublicPortals/RegistrationPortal'));
const SponsorLoginPortal = lazy(() => import('./pages/PublicPortals/SponsorLoginPortal'));
const SponsorRegistrantManagement = lazy(() => import('./pages/PublicPortals/SponsorRegistrantManagement'));

// Reviewer Portal Pages (Lazy Load)
const ReviewerLoginPage = lazy(() => import('./pages/ReviewerPortal/ReviewerLoginPage'));
const ReviewerDashboardPage = lazy(() => import('./pages/ReviewerPortal/ReviewerDashboardPage'));
const ReviewerAbstractReviewPage = lazy(() => import('./pages/ReviewerPortal/ReviewerAbstractReviewPage'));

// Authentication
import { AuthProvider } from './contexts/AuthContext.jsx';
import { RegistrantAuthProvider } from './contexts/RegistrantAuthContext.jsx';
import PrivateRoute from './components/PrivateRoute';
import PublicRoute from './components/PublicRoute';
import RegistrantRoute from './components/RegistrantRoute';
import { ClientAuthProvider } from './contexts/ClientAuthContext';

// Admin pages
import EventsPage from './pages/Events/EventsPage';
import EventCreate from './pages/Events/EventCreate';
import Profile from './pages/Profile/Profile';
import Users from './pages/Users/Users';
import UserCreate from './pages/Users/UserCreate';
import UserEdit from './pages/Users/UserEdit';
import SystemSettings from './pages/Settings/SystemSettings';
import Billing from './pages/Billing/Billing';
import Help from './pages/Help/Help';
import ClientDashboard from './pages/ClientDashboard';
import { SponsorsList, SponsorForm, SponsorView } from './pages/SponsorManagement';

// Event management pages
import RegistrationsPage from './pages/Registrations/RegistrationsPage';
import CategoriesPage from './pages/Categories/CategoriesPage';
import ResourcesPage from './pages/Resources/ResourcesPage';
import BadgesPage from './pages/Badges/BadgesPage';
import EmailsPage from './pages/Emails/EmailsPage';
import AbstractsPage from './pages/Abstracts/AbstractsPage';
import ScheduleManagement from './pages/EventManagement/ScheduleManagement';

// Registrant Portal Pages
import RegistrantHome from './pages/RegistrantPortal/RegistrantHome';
import RegistrantLogin from './pages/RegistrantPortal/RegistrantLogin';
import RegistrantSignup from './pages/RegistrantPortal/RegistrantSignup';
import RegistrantForgotPassword from './pages/RegistrantPortal/RegistrantForgotPassword';
import RegistrantResetPassword from './pages/RegistrantPortal/RegistrantResetPassword';
import RegistrantProfile from './pages/RegistrantPortal/RegistrantProfile';
import RegistrantDashboard from './pages/RegistrantPortal/RegistrantDashboard';
import RegistrantEvents from './pages/RegistrantPortal/RegistrantEvents';
import AbstractsList from './pages/RegistrantPortal/AbstractsList';
import { default as RegistrantAbstractSubmissionForm } from './pages/RegistrantPortal/AbstractSubmissionForm';
import { default as RegistrantAbstractDetail } from './pages/RegistrantPortal/AbstractDetail';

// Public Pages
import HomePage from './pages/Public/HomePage';
import AboutPage from './pages/Public/AboutPage';
import ContactPage from './pages/Public/ContactPage';
import EventsListPage from './pages/Public/EventsListPage';
import EventDetailsPage from './pages/Public/EventDetailsPage';
import PrivacyPolicyPage from './pages/Public/PrivacyPolicyPage';
import TermsOfUsePage from './pages/Public/TermsOfUsePage';

// 404 Page
import NotFoundPage from './pages/NotFound/NotFoundPage';

// Sponsor Portal Components (lazy load for consistency, or import directly if small)
const SponsorPortalLayout = lazy(() => import('./pages/SponsorPortal/SponsorPortalLayout'));
const SponsorProfilePage = lazy(() => import('./pages/SponsorPortal/SponsorProfilePage'));
const SponsorRegistrantListPage = lazy(() => import('./pages/SponsorPortal/SponsorRegistrantListPage'));
const SponsorDashboard = lazy(() => import('./pages/SponsorPortal/SponsorDashboard'));

// Import sponsorAuthService for SponsorRoute
import sponsorAuthService from './services/sponsorAuthService';

// LoadingFallback component for Suspense
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600"></div>
  </div>
);

// Placeholder for SponsorRoute - implement proper auth check later
const SponsorRoute = ({ children }) => {
  const token = sponsorAuthService.getCurrentSponsorToken();
  const sponsorDetails = sponsorAuthService.getCurrentSponsorData();

  // Valid session: token exists, and sponsorDetails (which includes eventId) exist.
  if (token && sponsorDetails && sponsorDetails.eventId) {
    return children;
  }

  // Try to get eventId from sponsorDetails, or from the current URL if missing
  let eventId = sponsorDetails && sponsorDetails.eventId;
  if (!eventId && typeof window !== 'undefined') {
    // Try to extract from /sponsor-portal/events/:eventId or /portal/sponsor-login/:eventId
    const match = window.location.pathname.match(/sponsor-portal(?:\/events)?\/(\w+)/) || window.location.pathname.match(/portal\/sponsor-login\/(\w+)/);
    if (match) eventId = match[1];
  }
  if (eventId) {
    return <Navigate to={`/portal/sponsor-login/${eventId}`} replace />;
  }
  // Fallback
  return <Navigate to="/portal/sponsor-login/" replace />;
};

// Add a wrapper for ScannerStation to inject eventId from params
function ScannerStationWrapper() {
  const { id: eventIdFromParams } = useParams();
  return <ScannerStation eventId={eventIdFromParams} />;
}

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <RegistrantAuthProvider>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              {/* Auth Routes */}
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              </Route>

              {/* Public Routes */}
              <Route path="/events/:eventSlug/landing" element={<PublicLandingPage />} />
              <Route path="/go/:shortCode" element={<PublicLandingPage />} />

              {/* Public Portal Routes */}
              <Route path="/portal">
                <Route path="register/:eventId" element={<RegistrationPortal />} />
                <Route path="abstract/:eventId" element={<AbstractPortal />} />
                <Route path="reviewer/:eventId" element={<ReviewerLoginPage />} />
                <Route path="sponsor-login/:eventId" element={<SponsorLoginPortal />} />
                <Route path="sponsor-dashboard/:eventId/:sponsorId/registrants" element={<SponsorRegistrantManagement />} />
                <Route
                  path="client-login/:eventId"
                  element={
                    <ClientAuthProvider>
                      <ClientLoginPage />
                    </ClientAuthProvider>
                  }
                />
              </Route>

              {/* Registrant Portal Routes */}
              <Route path="/registrant-portal/auth" element={<AuthLayout isRegistrantPortal />}>
                <Route path="login" element={<RegistrantLogin />} />
                <Route path="signup" element={<RegistrantSignup />} />
                <Route path="forgot-password" element={<RegistrantForgotPassword />} />
                <Route path="reset-password/:token" element={<RegistrantResetPassword />} />
              </Route>

              <Route path="/registrant-portal" element={<RegistrantRoute><RegistrantPortalLayout /></RegistrantRoute>}>
                <Route index element={<RegistrantDashboard />} />
                <Route path="profile" element={<RegistrantProfile />} />
                <Route path="events" element={<RegistrantEvents />} />
                <Route path="abstracts">
                  <Route index element={<AbstractsList />} />
                  <Route path="new" element={<RegistrantAbstractSubmissionForm />} />
                  <Route path=":abstractId" element={<RegistrantAbstractDetail />} />
                  <Route path=":abstractId/edit" element={<RegistrantAbstractSubmissionForm />} />
                </Route>
                {/* Event-scoped abstract detail and edit routes */}
                <Route path="events/:eventId/abstracts/:abstractId" element={<RegistrantAbstractDetail />} />
                <Route path="events/:eventId/abstracts/:abstractId/edit" element={<RegistrantAbstractSubmissionForm />} />
              </Route>

              {/* Reviewer Portal Routes */}
              <Route path="/reviewer/login" element={<ReviewerLoginPage />} />
              <Route element={<PrivateRoute><ReviewerPortalLayout /></PrivateRoute>}>
                <Route path="/reviewer/dashboard" element={<ReviewerDashboardPage />} />
                <Route path="/reviewer/abstract/:abstractId/review" element={<ReviewerAbstractReviewPage />} />
              </Route>

              {/* Sponsor Portal Routes */}
              <Route path="/sponsor-portal" element={<SponsorRoute><SponsorPortalLayout /></SponsorRoute>}>
                <Route index element={<Navigate to="profile" replace />} />
                <Route path="profile" element={<SponsorProfilePage />} />
                <Route path="registrants" element={<SponsorRegistrantListPage />} />
                <Route path="dashboard" element={<SponsorDashboard />} />
              </Route>

              {/* Main Dashboard and Management Routes */}
              <Route element={<MainLayout />}>
                <Route path="/" element={<Dashboard />} />
                
                {/* Events List & Creation/Edit Forms (Remain outside EventPortal) */}
                <Route path="/events">
                  <Route index element={<EventList />} />
                  <Route path="new" element={<EventForm />} />
                  <Route path=":id/edit" element={<EventForm />} />
                  {/* Settings might be separate or handled within EventPortal depending on design */}
                  {/* <Route path=":id/settings" element={<EventSettings />} /> */}
                </Route>
                
                {/* Global routes (Categories, Registrations, Resources, Abstracts) - KEEP THESE if they show ALL items across events */}
                {/* If these should ONLY be event-specific, they can be removed */}
                <Route path="/categories">
                  <Route index element={<CategoryList />} />
                  {/* <Route path="new" element={<CategoryForm />} /> ... */} 
                </Route>
                <Route path="/registrations">
                  <Route index element={<RegistrationList />} />
                   {/* <Route path="new" element={<RegistrationForm />} /> ... */} 
                </Route>
                <Route path="/resources">
                  <Route index element={<ResourceList />} />
                   {/* <Route path="scanner" element={<ScannerStation />} /> ... */} 
                </Route>
                 <Route path="/abstracts">
                  <Route index element={<AbstractList />} />
                   {/* <Route path=":id" element={<AbstractDetail />} /> ... */} 
                </Route>

                {/* Reports (Likely Global) */}
                <Route path="/reports">
                  <Route index element={<ReportsPage />} />
                  <Route path="builder" element={<ReportBuilder />} />
                  <Route path=":reportType" element={<ReportsPage />} />
                </Route>

                {/* Settings (Likely Global) */}
                <Route path="/settings">
                  <Route index element={<SettingsPage />} />
                  <Route path="users" element={<UserManagement />} />
                  <Route path="global" element={<GlobalSettings />} />
                  <Route path="email" element={<EmailTemplates />} />
                  <Route path="payment" element={<PaymentGateways />} />
                </Route>

                {/* Define specific event sub-routes BEFORE the catch-all portal route */}
                <Route path="/events/:id/registrations/new" element={<RegistrationForm />} />
                <Route path="/events/:id/registrations/bulk-import" element={<BulkImportWizard />} />
                <Route path="/events/:id/schedule-management" element={<ScheduleManagement />} />
                {/* Add other specific routes like edit here if they should also be outside the portal layout */}
                {/* <Route path="/events/:id/registrations/:registrationId/edit" element={<RegistrationForm />} /> */}

                {/* Event Portal Route - Handles all event-specific sub-navigation */}
                {/* The `/*` allows EventPortal to match /events/123, /events/123/dashboard, /events/123/registrations, etc. */}
                {/* Make sure the nested routes inside EventPortal do NOT duplicate the ones defined above */}
                <Route path="/events/:id/*" element={<EventPortal />}>
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  {/* Adjust the nested 'registrations' route inside EventPortal */}
                  <Route path="registrations">
                    {/* Keep the index route for the tab view */}
                    <Route index element={<RegistrationList />} />
                    {/* Remove the 'new' route from here as it's defined outside */}
                    {/* <Route path="new" element={<RegistrationForm />} /> */}
                    <Route path=":registrationId" element={<RegistrationDetail />} />
                    {/* Consider moving edit outside as well if needed */}
                    <Route path=":registrationId/edit" element={<RegistrationForm />} />
                    {/* Remove the 'bulk-import' route from here as it's defined outside */}
                    {/* <Route path="bulk-import" element={<BulkImportWizard />} /> */}
                  </Route>
                  <Route path="categories">
                    <Route index element={<CategoryList />} />
                    <Route path="new" element={<CategoryForm />} />
                    <Route path=":categoryId" element={<CategoryDetail />} />
                    <Route path=":categoryId/edit" element={<CategoryForm />} />
                  </Route>
                  <Route path="sponsors" element={<SponsorsList />} />
                  <Route path="resources">
                    {/* Specific route first */}
                    <Route path="scanner" element={<ScannerStationWrapper />} />
                    {/* Dynamic route next */}
                    <Route path=":resourceType" element={<ResourcesTab />} />
                    {/* Index route last (matches if no other sub-path is provided) */}
                    <Route index element={<ResourcesTab />} />
                  </Route>
                  <Route path="abstracts">
                    <Route index element={<AbstractList />} />
                    <Route path="new" element={<AbstractForm />} />
                    <Route path=":abstractId" element={<AbstractDetail />} />
                    <Route path=":abstractId/edit" element={<AbstractForm />} />
                  </Route>
                  <Route path="badges">
                     <Route index element={<BadgesPage />} />
                     <Route path="designer" element={<BadgeDesigner />} />
                     <Route path="designer/:templateId" element={<BadgeDesigner />} />
                     <Route path="print" element={<BadgePrintingPage />} />
                  </Route>
                   <Route path="emails" element={<EmailsPage />} />
                  <Route path="settings" element={<EventSettings />} />
                  {/* Add other event-specific routes here */}
                </Route>

                {/* REMOVE Conflicting Event-Specific Routes that were previously separate */}
                {/* <Route path="/events/:eventId/dashboard" element={<ClientDashboard />} /> */}
                {/* <Route path="/events/:eventId/registrations"> ... </Route> */}
                {/* <Route path="/events/:eventId/categories"> ... </Route> */}
                {/* <Route path="/events/:eventId/resources"> ... </Route> */}
                {/* <Route path="/events/:eventId/abstracts"> ... </Route> */}
                {/* <Route path="/events/:eventId/sponsors"> ... </Route> */}
                {/* <Route path="/badge-designer/:eventId" element={<BadgeDesigner />} /> */}
                {/* These should now be handled INTERNALLY by EventPortal based on the URL */}
                
                {/* Profile and other main layout routes */}
                <Route path="/profile" element={<Profile />} />
                <Route path="/users">
                    <Route index element={<Users />} />
                    <Route path="new" element={<UserCreate />} />
                    <Route path=":userId/edit" element={<UserEdit />} />
                </Route>
                <Route path="/system-settings" element={<SystemSettings />} />
                <Route path="/billing" element={<Billing />} />
                <Route path="/help" element={<Help />} />
                <Route path="/timeline" element={<Timeline />} />
                
              </Route>

              {/* Catch-all 404 Route */}
              <Route path="*" element={<NotFoundPage />} />

              {/* Client Portal Routes */}
              <Route
                path="/client/*"
                element={
                  <ClientAuthProvider>
                    <ClientPortalRoutes />
                  </ClientAuthProvider>
                }
              />
            </Routes>
          </Suspense>
          <Toaster position="top-right" />
        </RegistrantAuthProvider>
      </AuthProvider>
      <ToastContainer position="top-right" autoClose={5000} />
    </Router>
  );
};

export default App;

      