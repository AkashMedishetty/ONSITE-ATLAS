import React, { useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useClientAuth } from '../contexts/ClientAuthContext';
// TODO: Integrate client/event context for dynamic info

const navLinks = [
  { to: '/client/dashboard', label: 'Dashboard' },
  { to: '/client/registrants', label: 'Registrants' },
  { to: '/client/abstracts', label: 'Abstracts' },
  { to: '/client/sponsors', label: 'Sponsors' },
  { to: '/client/reports', label: 'Reports' },
];

const ClientPortalLayout = () => {
  const navigate = useNavigate();
  const { client, event, logout, isAuthenticated } = useClientAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/client/login');
    }
  }, [isAuthenticated, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/client/login');
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r flex flex-col py-6 px-4">
        <div className="mb-8">
          <div className="text-xl font-bold text-blue-900">{event?.name || 'Event Name'}</div>
          <div className="text-sm text-gray-500">{client?.name || 'Organizing Committee'}</div>
        </div>
        <nav className="flex-1 space-y-2">
          {navLinks.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `block px-4 py-2 rounded transition-colors ${isActive ? 'bg-blue-100 text-blue-700 font-semibold' : 'text-gray-700 hover:bg-blue-50'}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={handleLogout}
          className="mt-8 px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 font-medium"
        >
          Logout
        </button>
      </aside>
      {/* Main content */}
      <main className="flex-1 flex flex-col">
        {/* Topbar */}
        <header className="h-16 bg-white border-b flex items-center px-6 justify-between">
          <div className="font-semibold text-lg text-blue-900">Client Portal</div>
          <div className="text-gray-600 text-sm">{event?.name || ''}</div>
        </header>
        <section className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </section>
      </main>
    </div>
  );
};

export default ClientPortalLayout; 