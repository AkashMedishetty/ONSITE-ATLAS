import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

// Mock category data
const mockCategory = {
  _id: '1',
  name: 'VIP',
  description: 'Very Important Person - Full access to all amenities and special treatment throughout the event',
  color: '#FFD700',
  permissions: {
    meals: true,
    kitItems: true,
    certificates: true
  },
  registrations: [
    { id: '1', name: 'John Doe', email: 'john@example.com', organization: 'Acme Corp' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com', organization: 'TechX' },
    { id: '3', name: 'Alice Johnson', email: 'alice@example.com', organization: 'Global Systems' }
  ]
};

const CategoryDetail = () => {
  const { eventId, id } = useParams();
  const navigate = useNavigate();
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  useEffect(() => {
    const fetchCategory = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // In a real app, this would fetch from the API
        setCategory(mockCategory);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch category details');
        setLoading(false);
      }
    };
    
    fetchCategory();
  }, [id]);
  
  const handleDelete = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Redirect to categories list after deletion
      navigate(`/events/${eventId}/categories`);
    } catch (err) {
      setError('Failed to delete category');
      setShowDeleteModal(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white rounded-lg shadow-soft p-6"
      >
        {/* Header section with title and action buttons */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 border-b border-gray-200 pb-6">
          <div className="flex items-center">
            <div 
              className="w-8 h-8 rounded-full mr-4" 
              style={{ backgroundColor: category.color }}
            ></div>
            <div>
              <h1 className="text-3xl font-bold text-primary-700">{category.name}</h1>
              <p className="text-gray-500 mt-1">{category.description}</p>
            </div>
          </div>
          
          <div className="flex space-x-3 mt-4 md:mt-0">
            <Link
              to={`/events/${eventId}/categories/${id}/resources`}
              className="btn btn-outline-secondary"
            >
              <i className="ri-stack-line mr-2"></i>
              Manage Resources
            </Link>
            <Link
              to={`/events/${eventId}/categories/${id}/edit`}
              className="btn btn-outline-primary"
            >
              <i className="ri-edit-line mr-2"></i>
              Edit
            </Link>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="btn btn-outline-danger"
            >
              <i className="ri-delete-bin-line mr-2"></i>
              Delete
            </button>
          </div>
        </div>
        
        {/* Category details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Details</h2>
            
            <div className="space-y-4">
              <div className="rounded-lg bg-gray-50 p-4">
                <h3 className="text-sm font-medium text-gray-500">Category ID</h3>
                <p className="mt-1 text-sm text-gray-900">{category._id}</p>
              </div>
              
              <div className="rounded-lg bg-gray-50 p-4">
                <h3 className="text-sm font-medium text-gray-500">Color</h3>
                <div className="mt-1 flex items-center">
                  <div 
                    className="w-6 h-6 rounded-full mr-2" 
                    style={{ backgroundColor: category.color }}
                  ></div>
                  <span className="text-sm text-gray-900">{category.color}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Permissions</h2>
            
            <div className="space-y-4">
              <div className="flex items-center rounded-lg bg-gray-50 p-4">
                <div className={`rounded-full h-4 w-4 mr-3 ${category.permissions.meals ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Meals Access</h3>
                  <p className="text-xs text-gray-500">
                    {category.permissions.meals 
                      ? 'Allowed to access meals during the event' 
                      : 'Not allowed to access meals during the event'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center rounded-lg bg-gray-50 p-4">
                <div className={`rounded-full h-4 w-4 mr-3 ${category.permissions.kitItems ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Kit Items</h3>
                  <p className="text-xs text-gray-500">
                    {category.permissions.kitItems 
                      ? 'Eligible to receive kit items' 
                      : 'Not eligible to receive kit items'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center rounded-lg bg-gray-50 p-4">
                <div className={`rounded-full h-4 w-4 mr-3 ${category.permissions.certificates ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Certificates</h3>
                  <p className="text-xs text-gray-500">
                    {category.permissions.certificates 
                      ? 'Eligible to receive certificates' 
                      : 'Not eligible to receive certificates'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Registrations list */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Registrations</h2>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              {category.registrations.length} registrations
            </span>
          </div>
          
          {category.registrations.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Organization
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {category.registrations.map((registration) => (
                    <tr key={registration.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{registration.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{registration.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{registration.organization}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link 
                          to={`/events/${eventId}/registrations/${registration.id}`}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          View <i className="ri-external-link-line ml-1"></i>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <div className="text-gray-400 mb-4">
                <i className="ri-user-search-line text-5xl"></i>
              </div>
              <h3 className="text-lg font-medium text-gray-500">No registrations found</h3>
              <p className="text-gray-400 mt-2">
                There are no attendees in this category yet
              </p>
            </div>
          )}
        </div>
        
        {/* Back button */}
        <div className="mt-10 border-t border-gray-200 pt-6">
          <Link
            to={`/events/${eventId}/categories`}
            className="text-primary-600 hover:text-primary-900 font-medium flex items-center"
          >
            <i className="ri-arrow-left-line mr-2"></i>
            Back to Categories
          </Link>
        </div>
      </motion.div>
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl p-6 max-w-md mx-4 w-full"
          >
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Delete Category
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete the category "{category.name}"? 
              This action cannot be undone and will affect {category.registrations.length} registrations.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="btn btn-danger"
              >
                Delete Category
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default CategoryDetail; 