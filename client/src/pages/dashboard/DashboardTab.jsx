import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/common';

const DashboardTab = ({ eventId, event, statistics }) => {
  return (
    <div className="space-y-6">
      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Registrations</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold">{statistics?.totalRegistrations?.total || 0}</p>
              <p className="text-sm text-gray-500">Total</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">{statistics?.totalRegistrations?.checkedIn || 0}</p>
              <p className="text-sm text-gray-500">Checked In</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Resources</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-3xl font-bold">{statistics?.resourcesDistributed?.food || 0}</p>
              <p className="text-sm text-gray-500">Food</p>
            </div>
            <div>
              <p className="text-3xl font-bold">{statistics?.resourcesDistributed?.kits || 0}</p>
              <p className="text-sm text-gray-500">Kits</p>
            </div>
            <div>
              <p className="text-3xl font-bold">{statistics?.resourcesDistributed?.certificates || 0}</p>
              <p className="text-sm text-gray-500">Certs</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Abstracts</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold">{statistics?.abstractsSubmitted || 0}</p>
              <p className="text-sm text-gray-500">Submitted</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">{statistics?.abstractsApproved || 0}</p>
              <p className="text-sm text-gray-500">Approved</p>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Quick links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <Link to={`/events/${eventId}/registrations/new`} className="block w-full p-2 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition">
              New Registration
            </Link>
            <Link to={`/events/${eventId}/resources/scanner`} className="block w-full p-2 bg-green-50 text-green-700 rounded hover:bg-green-100 transition">
              Scanner Station
            </Link>
            <Link to={`/events/${eventId}/reports`} className="block w-full p-2 bg-purple-50 text-purple-700 rounded hover:bg-purple-100 transition">
              Generate Reports
            </Link>
          </div>
        </Card>
        
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Event Details</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className="font-medium">{event?.status || 'Draft'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Start Date:</span>
              <span className="font-medium">{event?.startDate ? new Date(event.startDate).toLocaleDateString() : 'Not set'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">End Date:</span>
              <span className="font-medium">{event?.endDate ? new Date(event.endDate).toLocaleDateString() : 'Not set'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Location:</span>
              <span className="font-medium">{event?.location || 'Not specified'}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DashboardTab; 