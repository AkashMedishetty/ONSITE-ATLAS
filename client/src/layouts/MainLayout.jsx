import { useState, useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GlobalSearch } from '../components/common';
import { useAuth } from '../contexts/AuthContext';
import { 
  HomeIcon, 
  CalendarIcon, 
  UsersIcon, 
  UserGroupIcon, 
  ClipboardDocumentListIcon, 
  QrCodeIcon, 
  DocumentTextIcon, 
  ChartBarIcon, 
  Cog6ToothIcon,
  BellIcon,
  MagnifyingGlassIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowLeftOnRectangleIcon
} from '@heroicons/react/24/outline';

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const auth = useAuth();

  // Navigation items
  const navItems = [
    { label: 'Dashboard', to: '/', icon: HomeIcon },
    { label: 'Events', to: '/events', icon: CalendarIcon },
    { label: 'Categories', to: '/categories', icon: UserGroupIcon },
    { label: 'Registrations', to: '/registrations', icon: UsersIcon },
    { label: 'Resources', to: '/resources', icon: QrCodeIcon },
    { label: 'Abstracts', to: '/abstracts', icon: DocumentTextIcon },
    { label: 'Badges', to: '/events/:id/badges', icon: ClipboardDocumentListIcon },
    { label: 'Reports', to: '/reports', icon: ChartBarIcon },
    { label: 'Settings', to: '/settings', icon: Cog6ToothIcon },
  ];

  // Check for window resize to update isMobile state
  useEffect(() => {
    const handleResize = () => {
      const newIsMobile = window.innerWidth < 768;
      setIsMobile(newIsMobile);
      
      // Auto-collapse sidebar on mobile
      if (newIsMobile && !collapsed) {
        setCollapsed(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [collapsed]);

  // Close mobile menu when navigating
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Toggle sidebar collapse
  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Toggle global search
  const toggleSearch = () => {
    setSearchOpen(!searchOpen);
  };

  // User info - this would come from auth context in a real app
  const { user } = auth;
  
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Global search functionality would go here
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  // Animation variants
  const sidebarVariants = {
    expanded: { width: '250px' },
    collapsed: { width: '80px' }
  };

  const contentVariants = {
    expanded: { marginLeft: '250px' },
    collapsed: { marginLeft: '80px' },
    mobile: { marginLeft: '0px' }
  };

  const logoVariants = {
    expanded: { opacity: 1, display: 'block' },
    collapsed: { opacity: 0, display: 'none' }
  };

  const itemVariants = {
    expanded: { opacity: 1, x: 0, display: 'flex' },
    collapsed: { opacity: 0, x: -10, display: 'none' }
  };

  const iconVariants = {
    expanded: { marginRight: '16px' },
    collapsed: { marginRight: '0px' }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top navbar */}
      <header className="bg-white border-b border-gray-100 shadow-sm z-20 sticky top-0">
        <div className="px-4 md:px-6 h-16 flex justify-between items-center">
          {/* Left side - Logo and hamburger */}
          <div className="flex items-center space-x-4">
            {isMobile ? (
              <button
                onClick={toggleMobileMenu}
                className="text-gray-600 hover:text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-full p-1 transition-colors duration-200"
                aria-label="Toggle menu"
              >
                <Bars3Icon className="h-6 w-6" />
              </button>
            ) : (
              <button
                onClick={toggleSidebar}
                className="text-gray-600 hover:text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-full p-1 transition-colors duration-200"
                aria-label="Toggle sidebar"
              >
                <Bars3Icon className="h-6 w-6" />
              </button>
            )}
            
            <Link to="/" className="flex items-center">
              <span className="text-2xl text-primary-600 font-bold mr-2">
                <span className="text-primary-600">Onsite</span>
                <span className="text-indigo-600">Atlas</span>
              </span>
            </Link>
          </div>
          
          {/* Right side - Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleSearch}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-600 hover:text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors duration-200"
              aria-label="Search"
            >
              <MagnifyingGlassIcon className="h-5 w-5" />
            </button>
            
            <div className="relative">
              <button
                className="p-2 rounded-full hover:bg-gray-100 text-gray-600 hover:text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors duration-200"
                aria-label="Notifications"
              >
                <BellIcon className="h-5 w-5" />
              </button>
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                3
              </span>
            </div>
            
            <div className="relative group">
              <button
                className="flex items-center space-x-2 focus:outline-none p-1 rounded-full focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
                aria-label="User menu"
              >
                <motion.div 
                  className="h-8 w-8 rounded-full bg-gradient-to-r from-indigo-500 to-primary-500 flex items-center justify-center text-white font-semibold shadow-md"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  {user && user.name ? user.name.charAt(0) : 'U'}
                </motion.div>
                <span className="text-sm font-medium text-gray-700 hidden md:block">{user && user.name ? user.name : 'Admin User'}</span>
              </button>
              
              {/* User dropdown menu */}
              <div 
                className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 hidden group-hover:block group-focus-within:block z-50 border border-gray-100"
              >
                <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none rounded-t-md">
                  Profile
                </Link>
                <Link to="/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none">
                  Settings
                </Link>
                <div className="border-t border-gray-100 my-1"></div>
                <button 
                  onClick={handleLogout}
                  className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none rounded-b-md"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <div className="flex flex-1 overflow-hidden relative">
        {/* Global search overlay */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-x-0 top-0 z-50"
            >
              <GlobalSearch onClose={toggleSearch} />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Sidebar - Desktop */}
        {!isMobile && (
          <motion.aside
            initial={false}
            animate={collapsed ? "collapsed" : "expanded"}
            variants={sidebarVariants}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="bg-white border-r border-gray-100 shadow-sm flex-shrink-0 flex flex-col z-10 h-[calc(100vh-64px)] fixed left-0 top-16"
          >
            <nav className="flex-1 py-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 hover:scrollbar-thumb-gray-300">
              <ul className="space-y-1 px-3">
                {navItems.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      className={({ isActive }) => 
                        `flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 ${
                          isActive 
                            ? 'bg-primary-50 text-primary-700 font-medium' 
                            : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'
                        }`
                      }
                    >
                      <motion.div
                        animate={collapsed ? "collapsed" : "expanded"}
                        variants={iconVariants}
                        transition={{ duration: 0.2 }}
                        className="flex items-center"
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                      </motion.div>
                      
                      <motion.span
                        animate={collapsed ? "collapsed" : "expanded"}
                        variants={itemVariants}
                        transition={{ duration: 0.2, delay: collapsed ? 0 : 0.1 }}
                        className="ml-3 whitespace-nowrap"
                      >
                        {item.label}
                      </motion.span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>
            
            <div className="p-4 border-t border-gray-100">
              <motion.div
                animate={collapsed ? "collapsed" : "expanded"}
                variants={itemVariants}
                transition={{ duration: 0.2 }}
                className="text-xs text-gray-500"
              >
                <div className="flex items-center justify-between mb-2">
                  <span>Storage</span>
                  <span>75%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div className="bg-primary-600 h-1.5 rounded-full" style={{ width: '75%' }}></div>
                </div>
              </motion.div>
              
              <div className="mt-4">
                <Link 
                  to="/logout" 
                  className="flex items-center text-sm text-gray-600 hover:text-primary-600 transition-colors duration-200"
                >
                  <ArrowLeftOnRectangleIcon className="h-5 w-5 mr-2" />
                  <motion.span
                    animate={collapsed ? "collapsed" : "expanded"}
                    variants={itemVariants}
                    transition={{ duration: 0.2 }}
                  >
                    Logout
                  </motion.span>
                </Link>
              </div>
            </div>
          </motion.aside>
        )}
        
        {/* Mobile menu overlay */}
        <AnimatePresence>
          {isMobile && mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-gray-900 bg-opacity-50 backdrop-blur-sm"
              onClick={toggleMobileMenu}
            />
          )}
        </AnimatePresence>
        
        {/* Mobile sidebar */}
        <AnimatePresence>
          {isMobile && mobileMenuOpen && (
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="fixed inset-y-0 left-0 w-72 bg-white shadow-xl z-50 flex flex-col"
            >
              <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100">
                <div className="flex items-center">
                  <span className="text-xl font-semibold">
                    <span className="text-primary-600">Onsite</span>
                    <span className="text-indigo-600">Atlas</span>
                  </span>
                </div>
                <button
                  onClick={toggleMobileMenu}
                  className="text-gray-500 hover:text-primary-600 focus:outline-none"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-r from-indigo-500 to-primary-500 flex items-center justify-center text-white font-semibold shadow-md mr-3">
                      {user && user.name ? user.name.charAt(0) : 'U'}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{user && user.name ? user.name : 'User Name'}</div>
                      <div className="text-xs text-gray-500">{user && user.email ? user.email : 'user@example.com'}</div>
                    </div>
                  </div>
                </div>
                
                <nav className="space-y-1">
                  {navItems.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) => 
                        `flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
                          isActive 
                            ? 'bg-primary-50 text-primary-700 font-medium' 
                            : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'
                        }`
                      }
                      onClick={toggleMobileMenu}
                    >
                      <item.icon className="h-5 w-5 mr-3 flex-shrink-0" />
                      <span>{item.label}</span>
                    </NavLink>
                  ))}
                </nav>
              </div>
              
              <div className="p-4 border-t border-gray-100">
                <Link 
                  to="/logout" 
                  className="flex items-center text-sm text-gray-600 hover:text-primary-600 transition-colors duration-200"
                >
                  <ArrowLeftOnRectangleIcon className="h-5 w-5 mr-2" />
                  <span>Logout</span>
                </Link>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
        
        {/* Main content */}
        <motion.main
          initial={false}
          animate={isMobile ? "mobile" : (collapsed ? "collapsed" : "expanded")}
          variants={contentVariants}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="flex-1 overflow-auto relative"
        >
          <div className="container mx-auto px-4 py-6 md:px-6 lg:px-8">
            {/* Page content */}
            <Outlet />
          </div>
        </motion.main>
      </div>
    </div>
  );
};

export default MainLayout; 