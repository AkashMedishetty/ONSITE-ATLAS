import React, { useEffect } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import sponsorAuthService from '../../services/sponsorAuthService';

const SponsorPortalLayout = () => {
  const navigate = useNavigate();
  const sponsor = sponsorAuthService.getCurrentSponsorData();

  useEffect(() => {
    const currentToken = sponsorAuthService.getCurrentSponsorToken();
    if (!currentToken) {
      // Token is missing.
      // 'sponsor' state comes from getCurrentSponsorData() at component mount.
      // If we had sponsor data (meaning they were logged in for a specific event),
      // try to redirect to that event's login page.
      if (sponsor && sponsor.eventId) {
        navigate(`/portal/sponsor-login/${sponsor.eventId}`);
      } else {
        // If no sponsor data (e.g., localStorage cleared completely, or never logged in as sponsor)
        // then navigate to a generic fallback. Match SponsorRoute's fallback.
        navigate('/'); // Fallback to application root
      }
    }
  }, [navigate, sponsor]); // sponsor is in dependency array

  const handleLogout = () => {
    // Get eventId BEFORE clearing storage
    let eventId = null;
    const sponsorData = localStorage.getItem('sponsorData');
    if (sponsorData) {
      try {
        eventId = JSON.parse(sponsorData).eventId;
      } catch {}
    }
    sponsorAuthService.logout();
    if (eventId) {
      window.location.href = `/portal/sponsor-login/${eventId}`;
    } else {
      window.location.href = '/portal/sponsor-login/';
    }
  };

  if (!sponsor) {
    // This check helps prevent rendering parts of the layout if sponsor data isn't available yet
    // or if token exists but data fetching failed (though getProfile would ideally handle that)
    return <p>Loading sponsor portal...</p>; // Or a spinner
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 text-white flex flex-col">
        <div className="px-8 py-6">
          <h1 className="text-2xl font-semibold">Sponsor Portal</h1>
          <p className="text-sm text-gray-400">{sponsor.companyName}</p>
        </div>
        <nav className="flex-grow">
          <Link 
            to="/sponsor-portal/dashboard" 
            className="block px-8 py-3 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
          >
            Dashboard
          </Link>
          <Link 
            to="/sponsor-portal/profile" 
            className="block px-8 py-3 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
          >
            My Profile
          </Link>
          <Link 
            to="/sponsor-portal/registrants" 
            className="block px-8 py-3 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
          >
            My Registrants
          </Link>
          {/* Add other links like "My Registrants" here later */}
        </nav>
        <div className="px-8 py-6">
          <button 
            onClick={handleLogout} 
            className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          <Outlet /> {/* Child routes will render here */}
        </main>
      </div>
    </div>
  );
};

export default SponsorPortalLayout; 