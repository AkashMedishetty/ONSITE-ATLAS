import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { GlobalSearch } from '../common';

// Navigation items for the sidebar
const navItems = [
  { name: 'Dashboard', path: '/', icon: 'ri-dashboard-line' },
  { name: 'Events', path: '/events', icon: 'ri-calendar-event-line' },
  { name: 'Registrations', path: '/registrations', icon: 'ri-user-add-line' },
  { name: 'Badge Printing', path: '/badges', icon: 'ri-printer-line' },
  { name: 'Food Tracking', path: '/food', icon: 'ri-restaurant-line' },
  { name: 'Kit Bags', path: '/kits', icon: 'ri-shopping-bag-line' },
  { name: 'Certificates', path: '/certificates', icon: 'ri-award-line' },
  { name: 'Abstracts', path: '/abstracts', icon: 'ri-file-text-line' },
  { name: 'Reports', path: '/reports', icon: 'ri-bar-chart-box-line' },
  { name: 'Settings', path: '/settings', icon: 'ri-settings-4-line' },
];

const MainLayout = ({ children }) => {
  const location = useLocation();

  return (
    <div className="clickup-layout">
      {/* Sidebar */}
      <aside className="clickup-sidebar">
        <div className="flex items-center justify-between mb-8">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-600 rounded-md flex items-center justify-center">
              <span className="text-white font-bold">OA</span>
            </div>
            <span className="text-xl font-bold text-primary-700">Onsite Atlas</span>
          </Link>
        </div>

        {/* Navigation items */}
        <nav className="flex-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`clickup-nav mb-2 ${location.pathname === item.path ? 'active' : ''}`}
            >
              <i className={`${item.icon} text-lg`}></i>
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>

        {/* User profile */}
        <div className="mt-auto pt-4 border-t border-gray-200">
          <div className="flex items-center p-2 rounded-md hover:bg-gray-100 cursor-pointer">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold">
              A
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">Admin User</p>
              <p className="text-xs text-gray-500">admin@onsiteatlas.com</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="clickup-main">
        {/* Topbar */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              {navItems.find((item) => item.path === location.pathname)?.name || 'Dashboard'}
            </h1>
          </div>

          {/* Global Search Component */}
          <div className="w-80">
            <GlobalSearch />
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            <button className="btn btn-outline flex items-center">
              <i className="ri-notification-3-line mr-1"></i>
              <span>Notifications</span>
            </button>
            <button className="btn btn-primary flex items-center">
              <i className="ri-add-line mr-1"></i>
              <span>New</span>
            </button>
          </div>
        </div>

        {/* Page content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default MainLayout; 