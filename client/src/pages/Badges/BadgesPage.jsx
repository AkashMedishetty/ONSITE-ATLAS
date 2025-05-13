import React from 'react';
import { Link, useParams } from 'react-router-dom';

const BadgesPage = () => {
  const { eventId } = useParams();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Badges</h1>
        <div className="flex space-x-2">
          <Link 
            to={`/events/${eventId}/badges/print`}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Print Badges
          </Link>
          <Link
            to={`/events/${eventId}/badges/template`}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Edit Template
          </Link>
        </div>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-gray-500">This is a placeholder for the BadgesPage component for event ID: {eventId}</p>
      </div>
    </div>
  );
};

export default BadgesPage; 