import React from 'react';
import { Link, useParams } from 'react-router-dom';

const SponsorForm = () => {
  const { eventId, sponsorId } = useParams();
  const isEditMode = !!sponsorId;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">
        {isEditMode ? 'Edit Sponsor' : 'Create Sponsor'}
      </h1>
      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-gray-500">
          This is a placeholder for the SponsorForm component for event ID: {eventId}
          {isEditMode ? ` and sponsor ID: ${sponsorId}` : ''}
        </p>
        <div className="mt-4">
          <Link 
            to={`/events/${eventId}/sponsors`} 
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 mr-2"
          >
            Back to Sponsors
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SponsorForm; 