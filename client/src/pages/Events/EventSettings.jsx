import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
// Import tab components directly
import {
  GeneralTab,
  RegistrationTab,
  BadgesTab, 
  AbstractsTab,
  ResourcesTab, 
  EmailTab, 
  PaymentTab,
  CategoriesTab
} from './settings';
import eventService from '../../services/eventService';
import { Loading } from '../../components/common';

const EventSettings = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [activeTab, setActiveTab] = useState('general');
  const [activeSection, setActiveSection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Add diagnostic useEffect
  useEffect(() => {
    console.log("🔥 EventSettings component MOUNTED WITH BUTTONS");
    console.log("DOM Contents:", document.querySelector('.container')?.innerHTML);
    
    // Check if the fixed button exists
    console.log("Fixed button exists:", !!document.querySelector('[data-test-fixed-button]'));
    
    // Check for any z-index or CSS that might be affecting visibility
    const computedStyle = window.getComputedStyle(document.body);
    console.log("Body overflow:", computedStyle.overflow);
    
    // Return cleanup function
    return () => {
      console.log("🔥 EventSettings component UNMOUNTED");
    };
  }, []);

  // Parse URL parameters when component loads or URL changes
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    const sectionParam = params.get('section');
    
    // Set the active tab if it's valid
    if (tabParam && ['general', 'registration', 'resources', 'abstracts', 'badges', 'email', 'payment', 'categories'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
    
    // Store the section parameter to pass to the tab component
    if (sectionParam) {
      setActiveSection(sectionParam);
    }
  }, [location.search]);

  useEffect(() => {
    const getEvent = async () => {
      try {
        setLoading(true);
        const eventData = await eventService.getEventById(id);
        
        // Create a fallback event object if data is empty or missing
        if (!eventData || Object.keys(eventData).length === 0) {
          setEvent({
            name: "New Event",
            description: "",
            startDate: "",
            endDate: "",
            location: "",
            status: "draft",
            generalSettings: {},
            registrationSettings: {},
            resourceSettings: {},
            abstractSettings: {},
            badgeSettings: {},
            emailSettings: {},
            paymentSettings: {},
            categorySettings: {}
          });
        } else {
          setEvent(eventData);
        }
        
        setLoading(false);
      } catch (err) {
        setError(err.message || 'Failed to load event data');
        setLoading(false);
      }
    };
    
    getEvent();
  }, [id]);

  const handleTabChange = (tab) => {
    // Update URL when tab changes
    const params = new URLSearchParams(location.search);
    params.set('tab', tab);
    navigate(`/events/${id}/settings?${params.toString()}`, { replace: true });
    setActiveTab(tab);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await eventService.updateEvent(id, event);
      setSaving(false);
    } catch (err) {
      setError(err.message || 'Failed to save event data');
      setSaving(false);
    }
  };

  // Simple helper to check if event exists and has required structure
  const isValidEvent = () => {
    return event && typeof event === 'object';
  }

  const renderTab = (tabName) => {
    if (!isValidEvent()) {
      return <div className="p-4 bg-yellow-50 text-yellow-700 rounded">Loading event data...</div>;
    }
    
    try {
      switch (tabName) {
        case 'general':
          return <GeneralTab event={event} setEvent={setEvent} id={id} />;
        case 'registration':
          return <RegistrationTab event={event} setEvent={setEvent} id={id} />;
        case 'badges':
          return <BadgesTab event={event} setEvent={setEvent} id={id} />;
        case 'abstracts':
          return <AbstractsTab event={event} setEvent={setEvent} />;
        case 'resources':
          return <ResourcesTab event={event} setEvent={setEvent} id={id} initialSection={activeSection} />;
        case 'email':
          return <EmailTab event={event} setEvent={setEvent} id={id} />;
        case 'payment':
          return <PaymentTab event={event} setEvent={setEvent} id={id} />;
        case 'categories':
          return <CategoriesTab event={event} setEvent={setEvent} id={id} />;
        default:
          return <div>Tab not found</div>;
      }
    } catch (err) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
          <p className="font-bold">Error rendering {tabName} tab</p>
          <p className="text-sm">{err.message}</p>
        </div>
      );
    }
  };

  if (loading) {
    return <Loading message="Loading event settings..." />;
  }
  
  console.log("🔥 EventSettings RENDER FUNCTION EXECUTED");

  return (
    <React.Fragment>
      {/* Hardcoded element outside any containers */}
      <button 
        data-test-fixed-button
        style={{
          position: 'absolute', 
          top: 0, 
          left: 0, 
          zIndex: 10000,
          backgroundColor: 'red',
          color: 'white',
          padding: '10px',
          fontSize: '16px'
        }}
      >
        ABSOLUTE POSITIONED BUTTON
      </button>
    
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-end space-x-4 mb-6">
          <button 
            style={{
              backgroundColor: 'magenta',
              color: 'white', 
              padding: '20px', 
              fontSize: '24px', 
              border: '5px solid limegreen',
              position: 'fixed',
              top: '50px', 
              left: '50px',
              zIndex: '9999'
            }}
          >
            TOP LEVEL TEST BUTTON
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Event Settings</h1>
            <p className="text-gray-500">Configure your event settings</p>
          </div>
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded text-red-700">
              {error}
            </div>
          )}
          
          <div className="flex border-b border-gray-200 mb-6">
            {['general', 'registration', 'badges', 'abstracts', 'resources', 'email', 'payment', 'categories'].map((tab) => (
              <button
                key={tab}
                className={`px-4 py-2 font-medium text-sm ${
                  activeTab === tab
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => handleTabChange(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Add inline save button here too */}
          <div className="bg-yellow-200 p-4 mb-6 flex justify-end">
            <button
              onClick={handleSave}
              style={{backgroundColor: 'blue', color: 'white', padding: '10px', fontWeight: 'bold'}}
            >
              INLINE SAVE BUTTON
            </button>
          </div>

          <div className="mb-6">
            {renderTab(activeTab)}
          </div>
          
          {/* Add explicit button at the bottom */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <button
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded"
                onClick={() => navigate(`/events/${id}`)}
              >
                BOTTOM CANCEL BUTTON
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded"
                onClick={handleSave}
              >
                BOTTOM SAVE BUTTON
              </button>
            </div>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

export default EventSettings;