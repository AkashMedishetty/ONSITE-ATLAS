import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

// Mock data - this would come from API in a real application
const mockCategory = {
  _id: '301',
  name: 'VIP',
  description: 'Very Important Participants',
  eventId: '1',
  color: '#8B5CF6'
};

const mockResourceTypes = [
  {
    type: 'meal',
    name: 'Meals',
    icon: 'ri-restaurant-line',
    color: 'bg-green-100 text-green-600',
    items: [
      { id: 'breakfast', name: 'Breakfast', days: ['day1', 'day2', 'day3'] },
      { id: 'lunch', name: 'Lunch', days: ['day1', 'day2', 'day3'] },
      { id: 'dinner', name: 'Dinner', days: ['day1', 'day2', 'day3'] },
      { id: 'snacks', name: 'Snacks', days: ['day1', 'day2', 'day3'] }
    ]
  },
  {
    type: 'kit',
    name: 'Kit Items',
    icon: 'ri-shopping-bag-line',
    color: 'bg-blue-100 text-blue-600',
    items: [
      { id: 'bag', name: 'Conference Bag', quantity: 1 },
      { id: 'tshirt', name: 'T-Shirt', quantity: 1 },
      { id: 'notepad', name: 'Notepad', quantity: 1 },
      { id: 'pen', name: 'Pen', quantity: 2 }
    ]
  },
  {
    type: 'certificate',
    name: 'Certificates',
    icon: 'ri-award-line',
    color: 'bg-amber-100 text-amber-600',
    items: [
      { id: 'participation', name: 'Participation Certificate' },
      { id: 'speaker', name: 'Speaker Certificate' },
      { id: 'achievement', name: 'Achievement Certificate' }
    ]
  }
];

const CategoryResources = () => {
  const { eventId, categoryId } = useParams();
  const navigate = useNavigate();
  
  const [category, setCategory] = useState(null);
  const [resourceTypes, setResourceTypes] = useState([]);
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saveStatus, setSaveStatus] = useState(null);

  // Fetch category and resource data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // This would be actual API calls in a real app
        setCategory(mockCategory);
        setResourceTypes(mockResourceTypes);
        
        // Initialize permissions - this would come from API
        const initialPermissions = {};
        
        mockResourceTypes.forEach(type => {
          type.items.forEach(item => {
            if (type.type === 'meal') {
              // For meals, we track permissions by day
              item.days.forEach(day => {
                const permKey = `${type.type}_${item.id}_${day}`;
                initialPermissions[permKey] = Math.random() > 0.3; // Random for demo
              });
            } else {
              // For other resources
              const permKey = `${type.type}_${item.id}`;
              initialPermissions[permKey] = Math.random() > 0.3; // Random for demo
              
              // For kit items with quantity
              if (type.type === 'kit' && item.quantity) {
                initialPermissions[`${permKey}_quantity`] = Math.floor(Math.random() * 3) + 1;
              }
            }
          });
        });
        
        setPermissions(initialPermissions);
        setLoading(false);
      } catch (err) {
        setError('Failed to load category and resource data');
        setLoading(false);
      }
    };

    fetchData();
  }, [categoryId, eventId]);

  // Handle permission toggle
  const handlePermissionToggle = (permKey) => {
    setPermissions(prev => ({
      ...prev,
      [permKey]: !prev[permKey]
    }));
  };

  // Handle quantity change
  const handleQuantityChange = (permKey, value) => {
    const quantity = parseInt(value, 10);
    if (isNaN(quantity) || quantity < 0) return;
    
    setPermissions(prev => ({
      ...prev,
      [permKey]: quantity
    }));
  };

  // Handle save
  const handleSave = async () => {
    setSaveStatus('saving');
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // This would be an actual API call in a real app
      console.log('Saved permissions:', permissions);
      
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 3000);
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
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Resource Permissions</h1>
          <div className="flex items-center">
            <span 
              className="inline-block w-4 h-4 rounded-full mr-2" 
              style={{ backgroundColor: category.color }}
            ></span>
            <span className="text-lg text-gray-700">{category.name}</span>
          </div>
        </div>
        <div className="flex space-x-4">
          <button 
            className="btn btn-outline" 
            onClick={() => navigate(`/events/${eventId}/categories/${categoryId}`)}
          >
            Cancel
          </button>
          <button 
            className={`btn btn-primary ${saveStatus === 'saving' ? 'opacity-75 cursor-not-allowed' : ''}`}
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
          >
            {saveStatus === 'saving' ? (
              <>
                <i className="ri-loader-4-line animate-spin mr-2"></i>
                Saving...
              </>
            ) : (
              'Save Permissions'
            )}
          </button>
        </div>
      </div>

      {saveStatus === 'success' && (
        <motion.div 
          className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <i className="ri-checkbox-circle-line mr-2"></i>
          Permissions saved successfully!
        </motion.div>
      )}

      {saveStatus === 'error' && (
        <motion.div 
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <i className="ri-error-warning-line mr-2"></i>
          Error saving permissions. Please try again.
        </motion.div>
      )}

      <div className="space-y-6">
        {resourceTypes.map((resourceType, typeIndex) => (
          <motion.div 
            key={resourceType.type}
            className="bg-white rounded-lg shadow-soft p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: typeIndex * 0.1 }}
          >
            <div className="flex items-center mb-4">
              <div className={`w-10 h-10 rounded-full ${resourceType.color} flex items-center justify-center mr-3`}>
                <i className={`${resourceType.icon} text-lg`}></i>
              </div>
              <h2 className="text-xl font-semibold">{resourceType.name}</h2>
            </div>

            {resourceType.type === 'meal' ? (
              // Meal permissions with days
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Meal
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Day 1
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Day 2
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Day 3
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {resourceType.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        </td>
                        {item.days.map((day) => {
                          const permKey = `${resourceType.type}_${item.id}_${day}`;
                          return (
                            <td key={day} className="px-6 py-4 whitespace-nowrap">
                              <label className="inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  className="form-checkbox h-5 w-5 text-primary-600 rounded focus:ring-primary-500"
                                  checked={permissions[permKey] || false}
                                  onChange={() => handlePermissionToggle(permKey)}
                                />
                                <span className="ml-2 text-sm text-gray-700">Allowed</span>
                              </label>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              // Other resource types
              <ul className="space-y-3">
                {resourceType.items.map((item) => {
                  const permKey = `${resourceType.type}_${item.id}`;
                  const quantityKey = `${permKey}_quantity`;
                  
                  return (
                    <li key={item.id} className="p-3 bg-gray-50 rounded-md">
                      <div className="flex flex-wrap items-center justify-between">
                        <div className="flex items-center">
                          <label className="inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="form-checkbox h-5 w-5 text-primary-600 rounded focus:ring-primary-500"
                              checked={permissions[permKey] || false}
                              onChange={() => handlePermissionToggle(permKey)}
                            />
                            <span className="ml-2 font-medium text-gray-900">{item.name}</span>
                          </label>
                        </div>
                        
                        {/* Quantity input for kit items */}
                        {resourceType.type === 'kit' && permissions[permKey] && item.quantity && (
                          <div className="flex items-center mt-2 sm:mt-0">
                            <span className="mr-2 text-sm text-gray-500">Quantity:</span>
                            <input
                              type="number"
                              min="1"
                              className="input w-16 text-center"
                              value={permissions[quantityKey] || 1}
                              onChange={(e) => handleQuantityChange(quantityKey, e.target.value)}
                            />
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default CategoryResources; 