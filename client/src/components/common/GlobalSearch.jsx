import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Mock data - in a real app this would come from API calls
const mockSearchResults = {
  events: [
    { _id: '1', name: 'Annual Tech Conference 2023', type: 'event' },
    { _id: '2', name: 'Medical Symposium', type: 'event' },
  ],
  registrations: [
    { _id: '101', name: 'John Doe', email: 'john@example.com', regId: 'REG-1001', eventId: '1', type: 'registration' },
    { _id: '102', name: 'Jane Smith', email: 'jane@example.com', regId: 'REG-1002', eventId: '1', type: 'registration' },
  ],
  abstracts: [
    { _id: '201', title: 'Advances in Machine Learning', author: 'Dr. Smith', eventId: '1', type: 'abstract' },
    { _id: '202', title: 'Modern Web Development', author: 'Jane Cooper', eventId: '2', type: 'abstract' },
  ],
  categories: [
    { _id: '301', name: 'VIP', eventId: '1', type: 'category' },
    { _id: '302', name: 'Speaker', eventId: '2', type: 'category' },
  ]
};

const GlobalSearch = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [activeSection, setActiveSection] = useState(null);
  const [activeSectionIndex, setActiveSectionIndex] = useState(-1);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Search functionality
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults({});
      return;
    }

    setIsLoading(true);
    // Simulate API call with delay
    const timer = setTimeout(() => {
      // Filter mock data based on search term
      const term = searchTerm.toLowerCase();
      
      const filteredResults = {
        events: mockSearchResults.events.filter(event => 
          event.name.toLowerCase().includes(term)
        ),
        registrations: mockSearchResults.registrations.filter(reg => 
          reg.name.toLowerCase().includes(term) || 
          reg.email.toLowerCase().includes(term) ||
          reg.regId.toLowerCase().includes(term)
        ),
        abstracts: mockSearchResults.abstracts.filter(abstract => 
          abstract.title.toLowerCase().includes(term) ||
          abstract.author.toLowerCase().includes(term)
        ),
        categories: mockSearchResults.categories.filter(category => 
          category.name.toLowerCase().includes(term)
        )
      };
      
      setSearchResults(filteredResults);
      setIsLoading(false);
      
      // Set active section to the first non-empty section
      const firstSection = Object.keys(filteredResults).find(
        key => filteredResults[key].length > 0
      );
      setActiveSection(firstSection);
      setActiveSectionIndex(0);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Count total results
  const totalResults = Object.values(searchResults).reduce(
    (total, results) => total + results.length, 
    0
  );

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen || !activeSection || totalResults === 0) return;
    
    const sections = Object.keys(searchResults).filter(
      key => searchResults[key].length > 0
    );
    
    const currentSectionIndex = sections.indexOf(activeSection);
    const currentSection = searchResults[activeSection];
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (activeSectionIndex < currentSection.length - 1) {
          setActiveSectionIndex(activeSectionIndex + 1);
        } else if (currentSectionIndex < sections.length - 1) {
          setActiveSection(sections[currentSectionIndex + 1]);
          setActiveSectionIndex(0);
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (activeSectionIndex > 0) {
          setActiveSectionIndex(activeSectionIndex - 1);
        } else if (currentSectionIndex > 0) {
          const prevSection = sections[currentSectionIndex - 1];
          setActiveSection(prevSection);
          setActiveSectionIndex(searchResults[prevSection].length - 1);
        }
        break;
      case 'Enter':
        e.preventDefault();
        if (activeSection && activeSectionIndex >= 0) {
          const selectedItem = searchResults[activeSection][activeSectionIndex];
          navigateToResult(selectedItem);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  // Navigate to selected result
  const navigateToResult = (item) => {
    setIsOpen(false);
    setSearchTerm('');

    switch (item.type) {
      case 'event':
        navigate(`/events/${item._id}`);
        break;
      case 'registration':
        navigate(`/events/${item.eventId}/registrations/${item._id}`);
        break;
      case 'abstract':
        navigate(`/events/${item.eventId}/abstracts/${item._id}`);
        break;
      case 'category':
        navigate(`/events/${item.eventId}/categories/${item._id}`);
        break;
      default:
        break;
    }
  };

  return (
    <div className="relative" ref={searchRef}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <i className="ri-search-line text-gray-400"></i>
        </div>
        <input
          type="text"
          className="input pl-10 w-full"
          placeholder="Search everything..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(e.target.value.trim() !== '');
          }}
          onFocus={() => {
            if (searchTerm.trim() !== '') setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
        />
        {searchTerm && (
          <button
            className="absolute inset-y-0 right-0 flex items-center pr-3"
            onClick={() => {
              setSearchTerm('');
              setIsOpen(false);
            }}
          >
            <i className="ri-close-line text-gray-400 hover:text-gray-600"></i>
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 mt-2 w-full bg-white shadow-lg rounded-md overflow-hidden"
            style={{ maxHeight: '80vh', overflowY: 'auto' }}
          >
            {isLoading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500">Searching...</p>
              </div>
            ) : totalResults === 0 ? (
              <div className="p-4 text-center">
                <p className="text-gray-500">No results found</p>
              </div>
            ) : (
              <div>
                {/* Search Results Summary */}
                <div className="bg-gray-50 px-4 py-2 text-xs text-gray-500 border-b">
                  Found {totalResults} results for "{searchTerm}"
                </div>

                {/* Event Results */}
                {searchResults.events && searchResults.events.length > 0 && (
                  <div className="pt-2">
                    <h3 className="px-4 text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                      Events
                    </h3>
                    <ul>
                      {searchResults.events.map((event, index) => (
                        <li
                          key={event._id}
                          className={`px-4 py-2 hover:bg-primary-50 cursor-pointer ${
                            activeSection === 'events' && activeSectionIndex === index
                              ? 'bg-primary-50'
                              : ''
                          }`}
                          onClick={() => navigateToResult(event)}
                          onMouseEnter={() => {
                            setActiveSection('events');
                            setActiveSectionIndex(index);
                          }}
                        >
                          <div className="flex items-center">
                            <i className="ri-calendar-event-line text-primary-500 mr-2"></i>
                            <span className="font-medium">{event.name}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Registration Results */}
                {searchResults.registrations && searchResults.registrations.length > 0 && (
                  <div className="pt-2">
                    <h3 className="px-4 text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                      Registrations
                    </h3>
                    <ul>
                      {searchResults.registrations.map((registration, index) => (
                        <li
                          key={registration._id}
                          className={`px-4 py-2 hover:bg-primary-50 cursor-pointer ${
                            activeSection === 'registrations' && activeSectionIndex === index
                              ? 'bg-primary-50'
                              : ''
                          }`}
                          onClick={() => navigateToResult(registration)}
                          onMouseEnter={() => {
                            setActiveSection('registrations');
                            setActiveSectionIndex(index);
                          }}
                        >
                          <div className="flex items-center">
                            <i className="ri-user-line text-secondary-500 mr-2"></i>
                            <div>
                              <div className="font-medium">{registration.name}</div>
                              <div className="text-xs text-gray-500">
                                {registration.regId} • {registration.email}
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Abstract Results */}
                {searchResults.abstracts && searchResults.abstracts.length > 0 && (
                  <div className="pt-2">
                    <h3 className="px-4 text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                      Abstracts
                    </h3>
                    <ul>
                      {searchResults.abstracts.map((abstract, index) => (
                        <li
                          key={abstract._id}
                          className={`px-4 py-2 hover:bg-primary-50 cursor-pointer ${
                            activeSection === 'abstracts' && activeSectionIndex === index
                              ? 'bg-primary-50'
                              : ''
                          }`}
                          onClick={() => navigateToResult(abstract)}
                          onMouseEnter={() => {
                            setActiveSection('abstracts');
                            setActiveSectionIndex(index);
                          }}
                        >
                          <div className="flex items-center">
                            <i className="ri-file-text-line text-indigo-500 mr-2"></i>
                            <div>
                              <div className="font-medium">{abstract.title}</div>
                              <div className="text-xs text-gray-500">By {abstract.author}</div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Category Results */}
                {searchResults.categories && searchResults.categories.length > 0 && (
                  <div className="pt-2">
                    <h3 className="px-4 text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                      Categories
                    </h3>
                    <ul>
                      {searchResults.categories.map((category, index) => (
                        <li
                          key={category._id}
                          className={`px-4 py-2 hover:bg-primary-50 cursor-pointer ${
                            activeSection === 'categories' && activeSectionIndex === index
                              ? 'bg-primary-50'
                              : ''
                          }`}
                          onClick={() => navigateToResult(category)}
                          onMouseEnter={() => {
                            setActiveSection('categories');
                            setActiveSectionIndex(index);
                          }}
                        >
                          <div className="flex items-center">
                            <i className="ri-price-tag-3-line text-amber-500 mr-2"></i>
                            <span className="font-medium">{category.name}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GlobalSearch; 