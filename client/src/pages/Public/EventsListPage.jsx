import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const EventsListPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  
  useEffect(() => {
    // Simulate API fetch
    const fetchEvents = async () => {
      try {
        // In a real app, this would be an API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Sample data
        const sampleEvents = [
          {
            id: '1',
            title: 'International Medical Conference 2023',
            date: 'May 15-18, 2023',
            location: 'San Francisco, CA',
            category: 'medical',
            image: 'https://via.placeholder.com/300x200',
            registrationOpen: true,
            description: 'Join leading medical professionals for the premier healthcare event of the year.'
          },
          {
            id: '2',
            title: 'Technology Summit 2023',
            date: 'June 5-7, 2023',
            location: 'Austin, TX',
            category: 'technology',
            image: 'https://via.placeholder.com/300x200',
            registrationOpen: true,
            description: 'Explore the latest innovations in AI, blockchain, and cloud computing.'
          },
          {
            id: '3',
            title: 'Global Education Forum',
            date: 'July 20-22, 2023',
            location: 'Boston, MA',
            category: 'education',
            image: 'https://via.placeholder.com/300x200',
            registrationOpen: true,
            description: 'Discussing the future of education and innovative teaching methodologies.'
          },
          {
            id: '4',
            title: 'Scientific Research Symposium',
            date: 'August 10-12, 2023',
            location: 'Chicago, IL',
            category: 'science',
            image: 'https://via.placeholder.com/300x200',
            registrationOpen: false,
            description: 'A platform for researchers to present groundbreaking scientific discoveries.'
          },
          {
            id: '5',
            title: 'Business Leadership Conference',
            date: 'September 18-20, 2023',
            location: 'New York, NY',
            category: 'business',
            image: 'https://via.placeholder.com/300x200',
            registrationOpen: true,
            description: 'Learn strategies from top executives and network with industry leaders.'
          },
          {
            id: '6',
            title: 'Environmental Sustainability Summit',
            date: 'October 5-7, 2023',
            location: 'Seattle, WA',
            category: 'environment',
            image: 'https://via.placeholder.com/300x200',
            registrationOpen: false,
            description: 'Addressing climate challenges and promoting sustainable business practices.'
          }
        ];
        
        setEvents(sampleEvents);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching events:', err);
        setLoading(false);
      }
    };
    
    fetchEvents();
  }, []);
  
  const filteredEvents = filter === 'all' 
    ? events 
    : filter === 'open' 
      ? events.filter(event => event.registrationOpen) 
      : events.filter(event => !event.registrationOpen);
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Upcoming Events</h1>
        
        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-md shadow-sm">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
                filter === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              } border border-gray-300`}
            >
              All Events
            </button>
            <button
              onClick={() => setFilter('open')}
              className={`px-4 py-2 text-sm font-medium ${
                filter === 'open' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              } border-t border-b border-r border-gray-300`}
            >
              Registration Open
            </button>
            <button
              onClick={() => setFilter('closed')}
              className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
                filter === 'closed' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              } border-t border-b border-r border-gray-300`}
            >
              Coming Soon
            </button>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No events found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredEvents.map(event => (
              <div key={event.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <img 
                  src={event.image} 
                  alt={event.title} 
                  className="w-full h-48 object-cover"
                />
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h2 className="text-xl font-semibold">{event.title}</h2>
                    {event.registrationOpen ? (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Open</span>
                    ) : (
                      <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">Coming Soon</span>
                    )}
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-gray-600 mb-1">
                      <span className="font-medium">Date:</span> {event.date}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">Location:</span> {event.location}
                    </p>
                  </div>
                  
                  <p className="text-gray-700 mb-4">{event.description}</p>
                  
                  <Link
                    to={`/events/${event.id}`}
                    className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-300"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventsListPage; 