import React from 'react';
import { Link } from 'react-router-dom';

const EventsPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Events</h1>
      <div className="bg-white shadow rounded-lg p-6">
        <p>This is a placeholder for the EventsPage component.</p>
        <div className="mt-4">
          <Link 
            to="/events/new" 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Create New Event
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EventsPage; 