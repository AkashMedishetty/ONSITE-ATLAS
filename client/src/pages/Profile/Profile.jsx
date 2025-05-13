import React from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';

const Profile = () => {
  const { currentUser } = useAuth();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">User Profile</h1>
      <div className="bg-white shadow rounded-lg p-6">
        <div className="mb-4">
          <h2 className="text-lg font-medium">Profile Information</h2>
          <p className="text-gray-500 mt-1">Basic information about your account</p>
        </div>
        
        <div className="border-t border-gray-200 pt-4 mt-4">
          <dl className="divide-y divide-gray-200">
            <div className="py-3 grid grid-cols-3 gap-4">
              <dt className="text-sm font-medium text-gray-500">Name</dt>
              <dd className="text-sm text-gray-900 col-span-2">{currentUser?.name || 'Not available'}</dd>
            </div>
            <div className="py-3 grid grid-cols-3 gap-4">
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="text-sm text-gray-900 col-span-2">{currentUser?.email || 'Not available'}</dd>
            </div>
            <div className="py-3 grid grid-cols-3 gap-4">
              <dt className="text-sm font-medium text-gray-500">Role</dt>
              <dd className="text-sm text-gray-900 col-span-2">{currentUser?.role || 'Not available'}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
};

export default Profile; 