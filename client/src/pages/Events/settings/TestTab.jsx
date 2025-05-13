import React from 'react';

const TestTab = ({ event, setEvent, setFormChanged, id }) => {
  // Added a console log to aid in debugging
  console.log("📋 Test Tab rendered with event:", event);
  
  return (
    <div className="p-4 bg-blue-50 rounded-lg">
      <h2 className="text-xl font-bold mb-4">Test Tab</h2>
      <p className="text-gray-700 mb-4">This is a simple test tab to verify rendering is working.</p>
      
      <div className="mt-4 p-4 bg-white rounded-lg border border-blue-200">
        <h3 className="text-lg font-medium mb-2">Debug Information</h3>
        <p className="text-sm text-gray-600 mb-2">Event ID: {id}</p>
        <p className="text-sm text-gray-600 mb-2">Event Name: {event?.name || 'Not set'}</p>
        <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
          {JSON.stringify(event, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default TestTab; 