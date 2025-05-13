import React from 'react';
import { useParams } from 'react-router-dom';

const ClientDashboard = () => {
  const { eventId } = useParams();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Event Dashboard</h1>
      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-gray-500">This is a placeholder for the ClientDashboard component for event ID: {eventId}</p>
      </div>
    </div>
  );
};

export default ClientDashboard; 