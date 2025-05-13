import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';

const AbstractDetails = () => {
  const { id } = useParams();
  const [abstract, setAbstract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // This would be an API call in a real application
    const fetchAbstract = async () => {
      setLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Dummy data
        const dummyAbstract = {
          id: id,
          title: 'Advances in Machine Learning for Medical Imaging',
          authors: 'John Doe, Jane Smith, Robert Johnson',
          event: 'Sample Conference 2023',
          category: 'Machine Learning',
          abstract: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam auctor, nisl eget ultricies lacinia, nisl nisl aliquam nisl, eget aliquam nisl nisl eget nisl. Nullam auctor, nisl eget ultricies lacinia, nisl nisl aliquam nisl, eget aliquam nisl nisl eget nisl. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam auctor, nisl eget ultricies lacinia, nisl nisl aliquam nisl, eget aliquam nisl nisl eget nisl. Nullam auctor, nisl eget ultricies lacinia, nisl nisl aliquam nisl, eget aliquam nisl nisl eget nisl.',
          submittedDate: '2023-06-15',
          status: 'accepted',
          reviewComments: 'Great work! The methodology is sound and the results are promising. Consider expanding on the limitations section in future work.',
          presentationType: 'Oral Presentation',
          presentationDate: '2023-10-15',
          presentationTime: '14:30 - 15:00',
          presentationLocation: 'Room A102'
        };
        
        setAbstract(dummyAbstract);
        setError(null);
      } catch (err) {
        setError('Failed to load abstract details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAbstract();
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-gray-600">Loading abstract details...</p>
      </div>
    );
  }

  if (error || !abstract) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 text-red-700 p-4 rounded">
          {error || 'Abstract not found'}
        </div>
        <div className="mt-4">
          <Link
            to="/registrant-portal/abstracts"
            className="text-blue-600 hover:underline"
          >
            &larr; Back to Abstracts
          </Link>
        </div>
      </div>
    );
  }

  // Function to render the status badge
  const getStatusBadge = (status) => {
    const classes = {
      accepted: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${classes[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex justify-between items-center">
        <Link
          to="/registrant-portal/abstracts"
          className="text-blue-600 hover:underline"
        >
          &larr; Back to Abstracts
        </Link>
        {abstract.status === 'pending' && (
          <Link
            to={`/registrant-portal/abstracts/${abstract.id}/edit`}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Edit Abstract
          </Link>
        )}
      </div>
      
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <h1 className="text-2xl font-bold text-gray-900">{abstract.title}</h1>
            {getStatusBadge(abstract.status)}
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Submitted: {new Date(abstract.submittedDate).toLocaleDateString()}
            {' • '}
            Event: {abstract.event}
            {' • '}
            Category: {abstract.category}
          </p>
        </div>
        
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-medium mb-2">Authors</h2>
          <p className="text-gray-700">{abstract.authors}</p>
        </div>
        
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-medium mb-2">Abstract</h2>
          <p className="text-gray-700 whitespace-pre-line">{abstract.abstract}</p>
        </div>
        
        {abstract.status === 'accepted' && (
          <div className="p-6 border-b border-gray-200 bg-green-50">
            <h2 className="text-lg font-medium mb-2">Presentation Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Type</p>
                <p className="font-medium">{abstract.presentationType}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Date</p>
                <p className="font-medium">{abstract.presentationDate}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Time</p>
                <p className="font-medium">{abstract.presentationTime}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Location</p>
                <p className="font-medium">{abstract.presentationLocation}</p>
              </div>
            </div>
          </div>
        )}
        
        {abstract.reviewComments && (
          <div className="p-6">
            <h2 className="text-lg font-medium mb-2">Reviewer Comments</h2>
            <p className="text-gray-700 bg-gray-50 p-3 rounded">{abstract.reviewComments}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AbstractDetails; 