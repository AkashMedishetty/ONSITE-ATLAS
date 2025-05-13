import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Spinner, Alert } from '../components/common';
import axios from 'axios';

const Timeline = () => {
  const [timelineData, setTimelineData] = useState({
    progress: [],
    currentFocus: [],
    completed: [],
    inProgress: [],
    upcoming: [],
    features: {}
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchTimelineData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await axios.get('/api/timeline');
        
        if (response.data.success) {
          setTimelineData(response.data.data);
        } else {
          throw new Error(response.data.message || 'Failed to fetch timeline data');
        }
      } catch (error) {
        console.error('Error fetching timeline data:', error);
        setError('Failed to fetch timeline data. Please try again later.');
        // Fall back to local data if API fails
        setTimelineData({
          progress: [
            { name: 'Foundation Setup', progress: 100, status: 'COMPLETED' },
            { name: 'Event Management', progress: 95, status: 'IN_PROGRESS' },
            { name: 'Registration System', progress: 90, status: 'IN_PROGRESS' },
            { name: 'Resource Tracking', progress: 80, status: 'IN_PROGRESS' },
            { name: 'Abstract Submission', progress: 75, status: 'IN_PROGRESS' },
            { name: 'Reports & Analytics', progress: 60, status: 'IN_PROGRESS' },
            { name: 'Global Search', progress: 40, status: 'IN_PROGRESS' },
            { name: 'UI/UX Polish', progress: 70, status: 'IN_PROGRESS' },
            { name: 'Deployment', progress: 30, status: 'IN_PROGRESS' }
          ],
          currentFocus: [
            'Finalizing remaining components',
            'Ensuring all API integrations work properly',
            'Fixing UI/UX issues',
            'Preparing for deployment'
          ],
          completed: [
            'Project structure and configuration',
            'Core UI components',
            'Base layouts',
            'Authentication system',
            'Event management core features'
          ],
          inProgress: [
            'Resource tracking enhancements',
            'Abstract submission refinements',
            'Report generation improvements',
            'UI/UX polish'
          ],
          upcoming: [
            'Final testing',
            'Deployment preparation',
            'Documentation finalization'
          ],
          features: {
            foundation: [
              { name: 'Project Structure', status: 'completed', notes: 'Complete' },
              { name: 'Development Environment', status: 'completed', notes: 'Complete' },
              { name: 'Core Components', status: 'completed', notes: 'Complete' },
              { name: 'Base Layouts', status: 'completed', notes: 'Complete' },
              { name: 'Authentication', status: 'completed', notes: 'Complete' },
              { name: 'Database Setup', status: 'completed', notes: 'Complete' }
            ],
            eventManagement: [
              { name: 'Event Creation', status: 'completed', notes: 'Complete' },
              { name: 'Event Dashboard', status: 'completed', notes: 'Complete' },
              { name: 'Event Settings', status: 'completed', notes: 'Complete' },
              { name: 'Category Management', status: 'completed', notes: 'Complete' }
            ],
            registrationSystem: [
              { name: 'Registration Form Builder', status: 'completed', notes: 'Complete' },
              { name: 'Registration ID Config', status: 'completed', notes: 'Complete' },
              { name: 'Onsite Registration', status: 'completed', notes: 'Complete' },
              { name: 'Badge Generation', status: 'completed', notes: 'Complete' },
              { name: 'Bulk Import/Export', status: 'in-progress', notes: 'Export completed, import in progress' }
            ],
            resourceTracking: [
              { name: 'Food Tracking', status: 'completed', notes: 'Complete' },
              { name: 'Kit Bag Tracking', status: 'completed', notes: 'Complete' },
              { name: 'Certificate Management', status: 'in-progress', notes: 'Almost complete' },
              { name: 'Scanner Interface', status: 'completed', notes: 'Complete' }
            ],
            abstractSubmission: [
              { name: 'Submission Portal', status: 'completed', notes: 'Complete' },
              { name: 'Abstract Management', status: 'completed', notes: 'Complete' },
              { name: 'Review Process', status: 'in-progress', notes: 'Minor adjustments needed' },
              { name: 'Bulk Download', status: 'completed', notes: 'Complete' }
            ],
            reportsAnalytics: [
              { name: 'Dashboard Analytics', status: 'completed', notes: 'Complete' },
              { name: 'Registration Reports', status: 'completed', notes: 'Complete' },
              { name: 'Resource Reports', status: 'in-progress', notes: 'Almost complete' },
              { name: 'Export Options', status: 'in-progress', notes: 'PDF exports in progress' }
            ],
            globalSearch: [
              { name: 'Universal Search', status: 'in-progress', notes: 'Core functionality complete' },
              { name: 'Result Display', status: 'in-progress', notes: 'UI refinements needed' },
              { name: 'Inline Editing', status: 'in-progress', notes: 'Basic functionality working' }
            ]
          }
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchTimelineData();
  }, []);
  
  const getStatusEmoji = (status) => {
    switch (status) {
      case 'completed':
      case 'complete':
        return '🟢';
      case 'in-progress':
        return '🟡';
      case 'not-started':
        return '🔴';
      default:
        return '⚪';
    }
  };
  
  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
      case 'complete':
        return 'Completed';
      case 'in-progress':
        return 'In Progress';
      case 'not-started':
        return 'Not Started';
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <motion.h1 
            className="text-4xl font-bold text-gray-900 mb-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Onsite Atlas Development Timeline
          </motion.h1>
          <p className="text-lg text-gray-600">
            Current project development status and roadmap
          </p>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <Alert 
            type="error" 
            title="Error Loading Timeline" 
            message={error}
            actions={
              <button 
                onClick={() => window.location.reload()}
                className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700"
              >
                Retry
              </button>
            }
          />
        ) : (
          <div className="space-y-12">
            {/* Progress Overview */}
            <motion.div 
              className="bg-white rounded-lg shadow-soft p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <h2 className="clickup-heading">Project Progress Overview</h2>
              <div className="space-y-4 mt-6">
                {timelineData.progress.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{item.name}</span>
                      <span className={`badge ${
                        item.status === 'COMPLETED' ? 'badge-success' : 
                        item.status === 'STARTED' ? 'badge-primary' : 'badge-secondary'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-primary-500 h-2.5 rounded-full" 
                        style={{ width: `${item.progress}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
            
            {/* Current Focus */}
            <motion.div 
              className="bg-white rounded-lg shadow-soft p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <h2 className="clickup-heading">Current Focus</h2>
              <ul className="list-disc pl-5 mt-4 space-y-2">
                {timelineData.currentFocus.map((item, index) => (
                  <li key={index} className="text-gray-700">{item}</li>
                ))}
              </ul>
            </motion.div>
            
            {/* Status Columns */}
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              {/* Completed */}
              <div className="bg-white rounded-lg shadow-soft p-6">
                <h2 className="text-lg font-medium text-green-600 mb-4 flex items-center">
                  <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                  Completed
                </h2>
                {timelineData.completed.length === 0 ? (
                  <p className="text-gray-500 italic">No features completed yet</p>
                ) : (
                  <ul className="space-y-2">
                    {timelineData.completed.map((item, index) => (
                      <li key={index} className="text-gray-700">{item}</li>
                    ))}
                  </ul>
                )}
              </div>
              
              {/* In Progress */}
              <div className="bg-white rounded-lg shadow-soft p-6">
                <h2 className="text-lg font-medium text-yellow-600 mb-4 flex items-center">
                  <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
                  In Progress
                </h2>
                <ul className="space-y-2">
                  {timelineData.inProgress.map((item, index) => (
                    <li key={index} className="text-gray-700">{item}</li>
                  ))}
                </ul>
              </div>
              
              {/* Upcoming */}
              <div className="bg-white rounded-lg shadow-soft p-6">
                <h2 className="text-lg font-medium text-blue-600 mb-4 flex items-center">
                  <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                  Upcoming
                </h2>
                <ul className="space-y-2">
                  {timelineData.upcoming.map((item, index) => (
                    <li key={index} className="text-gray-700">{item}</li>
                  ))}
                </ul>
              </div>
            </motion.div>
            
            {/* Feature Status */}
            <motion.div 
              className="bg-white rounded-lg shadow-soft p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <h2 className="clickup-heading">Feature Status</h2>
              
              <div className="mt-6 space-y-8">
                {/* Foundation */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Foundation</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Feature</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {timelineData.features.foundation.map((feature, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{feature.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <span className="flex items-center">
                                <span className="mr-2">{getStatusEmoji(feature.status)}</span>
                                {getStatusText(feature.status)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{feature.notes}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                {/* Event Management */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Event Management</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Feature</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {timelineData.features.eventManagement.map((feature, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{feature.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <span className="flex items-center">
                                <span className="mr-2">{getStatusEmoji(feature.status)}</span>
                                {getStatusText(feature.status)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{feature.notes}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                {/* Registration System */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Registration System</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Feature</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {timelineData.features.registrationSystem.map((feature, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{feature.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <span className="flex items-center">
                                <span className="mr-2">{getStatusEmoji(feature.status)}</span>
                                {getStatusText(feature.status)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{feature.notes}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 text-center">
                <p className="text-gray-500 italic">Next update will be after completing the project structure and configurations</p>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Timeline; 