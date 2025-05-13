import React from 'react';
import { Link } from 'react-router-dom';

const EventCreate = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Create Event</h1>
      <div className="bg-white shadow rounded-lg p-6">
        <p>This is a placeholder for the EventCreate component.</p>
        <div className="mt-4">
          <Link 
            to="/events" 
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 mr-2"
          >
            Back to Events
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EventCreate; 