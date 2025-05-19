import React, { useEffect, useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
// You might want to import a specific Navbar/Header for the reviewer portal if needed
// import ReviewerNavbar from '../components/Navbars/ReviewerNavbar'; 
import { useAuth } from '../contexts/AuthContext'; // Assuming AuthContext is in this path
import eventService from '../services/eventService'; // Changed to default import

const ReviewerPortalLayout = () => {
  const { currentEventId } = useAuth();
  const [eventName, setEventName] = useState('Reviewer Portal');

  useEffect(() => {
    if (currentEventId) {
      const fetchEventName = async () => {
        try {
          // Ensure getEventById returns an object with a data property, which contains the event details
          const response = await eventService.getEventById(currentEventId);
          if (response && response.success && response.data && response.data.name) {
            setEventName(response.data.name);
            document.title = `${response.data.name} - Reviewer Portal`;
          } else {
            // Fallback if event name is not found in the response
            setEventName('Reviewer Portal');
            document.title = 'Reviewer Portal';
            console.warn('Event details or name not found for ID:', currentEventId, 'Response:', response);
          }
        } catch (error) {
          console.error('Failed to fetch event name:', error);
          setEventName('Reviewer Portal'); // Fallback on error
          document.title = 'Reviewer Portal';
        }
      };
      fetchEventName();
    } else {
      // Reset if no currentEventId (e.g., after logout)
      setEventName('Reviewer Portal');
      document.title = 'Reviewer Portal';
    }
  }, [currentEventId]);

  return (
    <div className="reviewer-portal-layout min-h-screen bg-gray-100 flex flex-col">
      {/* <ReviewerNavbar /> Optional: A specific navbar for reviewers */}
      <header className="bg-indigo-600 text-white shadow-md">
        <nav className="container mx-auto px-6 py-3 flex justify-between items-center">
          <Link to="/reviewer/dashboard" className="text-xl font-bold hover:text-indigo-200">
            {eventName}
          </Link>
          <div>
            {/* Add logout button or other relevant links here later */}
            {/* Example: <button onClick={handleLogout} className="text-sm hover:text-indigo-200">Logout</button> */}
          </div>
        </nav>
      </header>
      <main className="container mx-auto p-4 sm:p-6 lg:p-8 flex-grow">
        <Outlet />
      </main>
      <footer className="bg-gray-700 text-white text-center p-4 mt-auto">
        <p>&copy; {new Date().getFullYear()} Onsite Atlas - Reviewer System</p>
      </footer>
    </div>
  );
};

export default ReviewerPortalLayout; 