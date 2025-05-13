import React from 'react';
import { Outlet, Link } from 'react-router-dom';
// You might want to import a specific Navbar/Header for the reviewer portal if needed
// import ReviewerNavbar from '../components/Navbars/ReviewerNavbar'; 

const ReviewerPortalLayout = () => {
  return (
    <div className="reviewer-portal-layout min-h-screen bg-gray-100 flex flex-col">
      {/* <ReviewerNavbar /> Optional: A specific navbar for reviewers */}
      <header className="bg-indigo-600 text-white shadow-md">
        <nav className="container mx-auto px-6 py-3 flex justify-between items-center">
          <Link to="/reviewer/dashboard" className="text-xl font-bold hover:text-indigo-200">
            Reviewer Portal
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