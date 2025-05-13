import React from 'react';

const HomePage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to Atlas</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          The comprehensive platform for conference and event management
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-blue-600 mb-4">Event Management</h2>
          <p className="text-gray-700 mb-4">
            Create and manage your conferences, workshops, and events with our powerful tools.
          </p>
          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Learn More
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-green-600 mb-4">Abstract Submissions</h2>
          <p className="text-gray-700 mb-4">
            Streamline the process of collecting and reviewing abstract submissions.
          </p>
          <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
            Learn More
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-purple-600 mb-4">Registration</h2>
          <p className="text-gray-700 mb-4">
            Simplify attendee registration with customizable forms and payment processing.
          </p>
          <button className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
            Learn More
          </button>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-8 mb-12">
        <h2 className="text-3xl font-bold text-center mb-6">Why Choose Atlas?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start">
            <div className="bg-blue-100 p-3 rounded-full mr-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">All-in-One Solution</h3>
              <p className="text-gray-700">Everything you need to run successful events in a single platform.</p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="bg-blue-100 p-3 rounded-full mr-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">User-Friendly</h3>
              <p className="text-gray-700">Intuitive interfaces for organizers, reviewers, and attendees.</p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="bg-blue-100 p-3 rounded-full mr-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Customizable</h3>
              <p className="text-gray-700">Tailor the platform to match your specific event requirements.</p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="bg-blue-100 p-3 rounded-full mr-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Analytics & Reporting</h3>
              <p className="text-gray-700">Gain insights with comprehensive data and reporting tools.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage; 