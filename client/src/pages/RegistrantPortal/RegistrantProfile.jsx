import React from 'react';
import { useRegistrantAuth } from '../../contexts/RegistrantAuthContext.jsx';

const RegistrantProfile = () => {
  const { currentRegistrant } = useRegistrantAuth();
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Your Profile</h1>
      
      <div className="bg-white shadow rounded-lg p-6">
        {currentRegistrant ? (
          <div>
            <div className="mb-6">
              <h2 className="text-lg font-medium">Personal Information</h2>
              <div className="mt-4 border-t border-gray-200 pt-4">
                <dl className="divide-y divide-gray-200">
                  <div className="py-3 grid grid-cols-3 gap-4">
                    <dt className="text-sm font-medium text-gray-500">Name</dt>
                    <dd className="text-sm text-gray-900 col-span-2">{currentRegistrant.name || 'Not available'}</dd>
                  </div>
                  <div className="py-3 grid grid-cols-3 gap-4">
                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                    <dd className="text-sm text-gray-900 col-span-2">{currentRegistrant.email || 'Not available'}</dd>
                  </div>
                  <div className="py-3 grid grid-cols-3 gap-4">
                    <dt className="text-sm font-medium text-gray-500">Phone</dt>
                    <dd className="text-sm text-gray-900 col-span-2">{currentRegistrant.phone || 'Not available'}</dd>
                  </div>
                  <div className="py-3 grid grid-cols-3 gap-4">
                    <dt className="text-sm font-medium text-gray-500">Institution</dt>
                    <dd className="text-sm text-gray-900 col-span-2">{currentRegistrant.institution || 'Not available'}</dd>
                  </div>
                </dl>
              </div>
            </div>
            
            <div>
              <button 
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Edit Profile
              </button>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">Loading profile information...</p>
        )}
      </div>
    </div>
  );
};

export default RegistrantProfile; 