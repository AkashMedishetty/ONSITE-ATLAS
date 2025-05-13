import React from 'react';
import { Link, useParams } from 'react-router-dom';

const CategoriesPage = () => {
  const { eventId } = useParams();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Categories</h1>
        <Link 
          to={`/events/${eventId}/categories/new`}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Add Category
        </Link>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-gray-500">This is a placeholder for the CategoriesPage component for event ID: {eventId}</p>
      </div>
    </div>
  );
};

export default CategoriesPage; 