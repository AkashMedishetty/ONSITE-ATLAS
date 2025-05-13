import React from 'react';
import { Link, Outlet } from 'react-router-dom';

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center">
            <div className="w-10 h-10 bg-primary-600 rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-xl">OA</span>
            </div>
            <span className="ml-3 text-2xl font-bold text-primary-700">Onsite Atlas</span>
          </Link>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <Outlet />
        </div>
      </div>
      
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} Onsite Atlas. All rights reserved.</p>
      </div>
    </div>
  );
};

export default AuthLayout; 