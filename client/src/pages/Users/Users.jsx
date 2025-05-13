import React from 'react';
import { Link } from 'react-router-dom';

const Users = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Users</h1>
        <Link 
          to="/users/create" 
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Add User
        </Link>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-gray-500">This is a placeholder for the Users list component.</p>
      </div>
    </div>
  );
};

export default Users; 