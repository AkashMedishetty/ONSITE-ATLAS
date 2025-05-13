import React from 'react';
import { Link, useParams } from 'react-router-dom';

const UserEdit = () => {
  const { id } = useParams();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Edit User</h1>
      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-gray-500 mb-4">This is a placeholder for the UserEdit component for user ID: {id}</p>
        <div className="mt-4">
          <Link 
            to="/users" 
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 mr-2"
          >
            Back to Users
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UserEdit; 