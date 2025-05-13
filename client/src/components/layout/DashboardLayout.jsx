import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import MainLayout from './MainLayout';

const DashboardLayout = ({ children }) => {
  const { eventId } = useParams();
  const [activeEvent, setActiveEvent] = useState(null);
  
  // Mock events data (will be replaced with API data)
  const events = [
    { id: 'event-1', name: 'Medical Conference 2023', status: 'active' },
    { id: 'event-2', name: 'Tech Summit 2023', status: 'upcoming' },
    { id: 'event-3', name: 'Science Expo 2022', status: 'completed' },
  ];
  
  // Event-specific navigation items
  const eventNavItems = [
    { name: 'Overview', path: `/events/${eventId || ':eventId'}`, icon: 'ri-dashboard-line' },
    { name: 'Registrations', path: `/events/${eventId || ':eventId'}/registrations`, icon: 'ri-user-add-line' },
    { name: 'Resources', path: `/events/${eventId || ':eventId'}/resources`, icon: 'ri-stack-line' },
    { name: 'Abstracts', path: `/events/${eventId || ':eventId'}/abstracts`, icon: 'ri-file-text-line' },
    { name: 'Reports', path: `/events/${eventId || ':eventId'}/reports`, icon: 'ri-bar-chart-box-line' },
    { name: 'Settings', path: `/events/${eventId || ':eventId'}/settings`, icon: 'ri-settings-4-line' },
  ];

  return (
    <MainLayout>
      <div className="grid grid-cols-12 gap-6">
        {/* Event Sidebar */}
        <div className="col-span-3 bg-white rounded-lg shadow-soft p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium">Events</h2>
            <button className="text-sm text-secondary-500 hover:text-secondary-600">
              <i className="ri-add-line mr-1"></i>
              New Event
            </button>
          </div>
          
          {/* Event list */}
          <div className="space-y-2">
            {events.map((event) => (
              <div 
                key={event.id}
                className={`p-3 rounded-md cursor-pointer transition-all ${
                  activeEvent === event.id ? 'bg-primary-50 border-l-4 border-primary-500' : 'hover:bg-gray-50'
                }`}
                onClick={() => setActiveEvent(event.id)}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{event.name}</span>
                  <span className={`badge ${
                    event.status === 'active' ? 'badge-success' : 
                    event.status === 'upcoming' ? 'badge-primary' : 'badge-secondary'
                  }`}>
                    {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          {/* Event navigation (only shown when event is selected) */}
          {activeEvent && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Event Navigation</h3>
              <nav className="space-y-1">
                {eventNavItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.path.replace(':eventId', activeEvent)}
                    className="flex items-center space-x-2 text-gray-600 py-2 px-3 rounded-md hover:bg-gray-50"
                  >
                    <i className={`${item.icon} text-lg`}></i>
                    <span>{item.name}</span>
                  </Link>
                ))}
              </nav>
            </div>
          )}
        </div>
        
        {/* Main content */}
        <div className="col-span-9">
          {children}
        </div>
      </div>
    </MainLayout>
  );
};

export default DashboardLayout; 