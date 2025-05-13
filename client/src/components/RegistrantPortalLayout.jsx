import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useRegistrantAuth } from '../contexts/RegistrantAuthContext';
import { useActiveEvent } from '../contexts/ActiveEventContext';
import apiRegistrant from '../services/apiRegistrant';

const RegistrantPortalLayout = ({ children }) => {
  const { currentRegistrant, isAuthenticated, logout } = useRegistrantAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [eventInfo, setEventInfo] = useState({
    name: "International Research Conference 2023",
    dates: "October 15-18, 2023",
    location: "Grand Convention Center, New York",
    logo: "https://via.placeholder.com/150x50",
    theme: {
      primary: "#4F46E5", // Indigo
      secondary: "#10B981", // Emerald
      accent: "#F59E0B", // Amber
      text: "#111827", // Gray-900
      background: "#F9FAFB" // Gray-50
    }
  });
  const navigate = useNavigate();
  const location = useLocation();
  const { activeEventId } = useActiveEvent();

  // Fetch event information (would be from API in a real app)
  useEffect(() => {
    async function fetchEventInfo() {
      if (!activeEventId) return;
      try {
        const response = await apiRegistrant.get(`/registrant-portal/events/${activeEventId}`);
        if (response.data && response.data.data) {
          const event = response.data.data;
          setEventInfo((prev) => ({
            ...prev,
            name: event.name || prev.name,
            dates: event.dateRange || (event.startDate && event.endDate ? `${new Date(event.startDate).toLocaleDateString()} - ${new Date(event.endDate).toLocaleDateString()}` : prev.dates),
            location: event.location || prev.location,
            logo: event.logo || prev.logo,
            theme: {
              ...prev.theme,
              ...(event.theme || {})
            }
          }));
        }
      } catch (err) {
        // Fallback to static info if fetch fails
        console.error('Failed to fetch event info for navbar:', err);
      }
    }
    fetchEventInfo();
  }, [activeEventId]);

  const handleLogout = () => {
    logout();
    navigate('/registrant-portal/login');
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  // Navigation items for authenticated users - more event-focused
  const navItems = [
    { name: 'Event Home', path: '/registrant-portal/dashboard' },
    { name: 'My Abstracts', path: '/registrant-portal/abstracts' },
    { name: 'Schedule', path: '/registrant-portal/schedule' },
    { name: 'My Profile', path: '/registrant-portal/profile' }
  ];

  // Check if we're on the login or signup page
  const isAuthPage = location.pathname.includes('/login') || 
                     location.pathname.includes('/signup') || 
                     location.pathname.includes('/forgot-password') ||
                     location.pathname.includes('/reset-password');

  // CSS Variables for theming
  const themeCSS = {
    '--primary-color': eventInfo.theme.primary,
    '--secondary-color': eventInfo.theme.secondary,
    '--accent-color': eventInfo.theme.accent,
    '--text-color': eventInfo.theme.text,
    '--bg-color': eventInfo.theme.background
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50" style={themeCSS}>
      {/* Event Banner - only show on authenticated pages */}
      {isAuthenticated && !isAuthPage && (
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 px-4 shadow-md">
          <div className="container mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-center md:text-left mb-3 md:mb-0">
                <h1 className="text-2xl font-bold">{eventInfo.name}</h1>
                <p className="text-sm opacity-90">{eventInfo.dates} • {eventInfo.location}</p>
              </div>
              {currentRegistrant && (
                <div className="flex items-center space-x-2 text-sm">
                  <div className="bg-white bg-opacity-20 px-3 py-1 rounded-full">
                    ID: {currentRegistrant.registrationId || "REG-1234"}
                  </div>
                  <div className="bg-white bg-opacity-20 px-3 py-1 rounded-full">
                    {currentRegistrant.role || "Participant"}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white shadow sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/registrant-portal" className="flex items-center">
                <img 
                  src={eventInfo.logo} 
                  alt="Event Logo" 
                  className="h-8 w-auto mr-2" 
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = 'none';
                  }}
                />
                <span className="font-bold text-xl" style={{color: eventInfo.theme.primary}}>
                  {eventInfo.name} <span className="text-gray-600">Portal</span>
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  {/* Main nav items */}
                  <nav className="flex items-center space-x-4">
                    {navItems.map(item => (
                      <NavLink
                        key={item.name}
                        to={item.path}
                        className={({ isActive }) => 
                          `px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                            isActive 
                              ? `bg-opacity-10 text-${eventInfo.theme.primary}` 
                              : 'text-gray-700 hover:bg-gray-100'
                          }`
                        }
                        style={({ isActive }) => ({
                          backgroundColor: isActive ? `${eventInfo.theme.primary}20` : '',
                          color: isActive ? eventInfo.theme.primary : ''
                        })}
                      >
                        {item.name}
                      </NavLink>
                    ))}
                  </nav>

                  {/* User menu */}
                  <div className="relative ml-4 flex items-center">
                    <div className="flex items-center mr-2">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden mr-2">
                        {currentRegistrant?.avatar ? (
                          <img 
                            src={currentRegistrant.avatar} 
                            alt={currentRegistrant?.name || "User"} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-gray-600 text-sm font-bold">
                            {currentRegistrant?.name?.charAt(0) || "U"}
                          </span>
                        )}
                      </div>
                      <span className="text-gray-700 text-sm hidden lg:inline">
                        {currentRegistrant?.name || currentRegistrant?.email}
                      </span>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                    >
                      Log Out
                    </button>
                  </div>
                </>
              ) : (
                // Show login/signup buttons if not authenticated
                !isAuthPage && (
                  <>
                    <Link 
                      to="/registrant-portal/login" 
                      className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                    >
                      Log In
                    </Link>
                    <Link 
                      to="/registrant-portal/signup" 
                      className="px-3 py-2 rounded-md text-sm font-medium text-white transition-colors duration-200"
                      style={{ backgroundColor: eventInfo.theme.primary }}
                    >
                      Sign Up
                    </Link>
                  </>
                )
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                type="button"
                className="p-2 rounded-md text-gray-700 hover:bg-gray-100"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <span className="sr-only">Open main menu</span>
                {/* Hamburger icon */}
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white shadow-md">
          <div className="container mx-auto px-4 py-3 space-y-1">
            {isAuthenticated ? (
              <>
                {/* User info on mobile */}
                <div className="px-3 py-3 border-b border-gray-200 mb-2 flex items-center">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden mr-3">
                    {currentRegistrant?.avatar ? (
                      <img 
                        src={currentRegistrant.avatar} 
                        alt={currentRegistrant?.name || "User"} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-600 font-bold">
                        {currentRegistrant?.name?.charAt(0) || "U"}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">
                      {currentRegistrant?.name || currentRegistrant?.email}
                    </p>
                    <p className="text-xs text-gray-500">
                      {currentRegistrant?.registrationId || "REG-1234"}
                    </p>
                  </div>
                </div>
                
                {/* Navigation items */}
                {navItems.map(item => (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    className={({ isActive }) => 
                      `block px-3 py-2 rounded-md text-base font-medium ${
                        isActive 
                          ? 'bg-indigo-50 text-indigo-700' 
                          : 'text-gray-700 hover:bg-gray-100'
                      }`
                    }
                    style={({ isActive }) => ({
                      backgroundColor: isActive ? `${eventInfo.theme.primary}10` : '',
                      color: isActive ? eventInfo.theme.primary : ''
                    })}
                    onClick={closeMobileMenu}
                  >
                    {item.name}
                  </NavLink>
                ))}
                
                {/* Logout button */}
                <button
                  onClick={() => {
                    handleLogout();
                    closeMobileMenu();
                  }}
                  className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50 mt-2"
                >
                  Log Out
                </button>
              </>
            ) : (
              // Show login/signup buttons if not authenticated
              !isAuthPage && (
                <div className="space-y-1">
                  <Link 
                    to="/registrant-portal/login" 
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
                    onClick={closeMobileMenu}
                  >
                    Log In
                  </Link>
                  <Link 
                    to="/registrant-portal/signup" 
                    className="block px-3 py-2 rounded-md text-base font-medium text-white"
                    style={{ backgroundColor: eventInfo.theme.primary }}
                    onClick={closeMobileMenu}
                  >
                    Sign Up
                  </Link>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-grow" style={{ backgroundColor: eventInfo.theme.background }}>
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-gray-600 text-sm">
                &copy; {new Date().getFullYear()} {eventInfo.name}
              </p>
            </div>
            <div className="flex space-x-6">
              <Link to="/event/faq" className="text-gray-600 text-sm hover:text-indigo-600">
                FAQ
              </Link>
              <Link to="/event/schedule" className="text-gray-600 text-sm hover:text-indigo-600">
                Schedule
              </Link>
              <Link to="/event/contact" className="text-gray-600 text-sm hover:text-indigo-600">
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default RegistrantPortalLayout; 
                     