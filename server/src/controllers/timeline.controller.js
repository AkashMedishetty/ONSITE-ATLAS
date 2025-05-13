/**
 * Timeline controller
 * Provides information about project development timeline
 */

const getTimelineData = async (req, res) => {
  try {
    // In a production app, this would likely come from a database
    // Here we're providing static timeline data
    const timelineData = {
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
    };

    // Send successful response
    return res.status(200).json({
      success: true,
      message: 'Timeline data retrieved successfully',
      data: timelineData
    });
  } catch (error) {
    console.error('Error in getTimelineData:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve timeline data',
      error: error.message
    });
  }
};

module.exports = {
  getTimelineData
}; 