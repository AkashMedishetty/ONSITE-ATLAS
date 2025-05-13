import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Spinner, Alert } from '../../components/common';
import categoryService from '../../services/categoryService';
import eventService from '../../services/eventService';

// Mock category data for edit mode
const mockCategory = {
  _id: '1',
  name: 'VIP',
  description: 'Very Important Person - Full access to all amenities',
  color: '#FFD700',
  permissions: {
    meals: true,
    kitItems: true,
    certificates: true
  }
};

const CategoryForm = () => {
  const { eventId, id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditMode = !!id;
  
  // Get return information from multiple sources for better reliability
  const searchParams = new URLSearchParams(location.search);
  const returnToPortal = searchParams.get('returnToPortal') === 'true';
  const returnPath = location.state?.returnTo || `/events/${eventId}/categories`;
  
  // More reliable way to return to the portal with correct tab
  const getReturnDestination = () => {
    if (returnToPortal) {
      return {
        pathname: `/events/${eventId}`,
        state: { activeTab: 'categories' }
      };
    }
    return returnPath;
  };
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#4F46E5',
    permissions: {
      meals: false,
      kitItems: false,
      certificates: false
    }
  });
  
  const [loading, setLoading] = useState(isEditMode);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  useEffect(() => {
    if (isEditMode) {
      const fetchCategory = async () => {
        try {
          setLoading(true);
          // First try using categoryService
          try {
            const response = await categoryService.getCategoryById(id);
            if (response && response.success && response.data) {
              setFormData(response.data);
              setLoading(false);
              return;
            }
          } catch (err) {
            console.warn('Failed to fetch with categoryService, trying backup method:', err);
          }
          
          // Fallback: try getting from event categories
          try {
            const eventCategoriesResponse = await eventService.getEventCategories(eventId);
            if (eventCategoriesResponse && eventCategoriesResponse.success) {
              const categories = eventCategoriesResponse.data.categories || [];
              const category = categories.find(c => c._id === id);
              if (category) {
                setFormData(category);
                setLoading(false);
                return;
              }
            }
          } catch (eventErr) {
            console.error('Both category fetch methods failed:', eventErr);
          }
          
          throw new Error('Failed to fetch category data from any source');
        } catch (err) {
          console.error('Error fetching category:', err);
          setError(err.message || 'Failed to fetch category details');
        } finally {
          setLoading(false);
        }
      };
      
      fetchCategory();
    }
  }, [isEditMode, id, eventId]);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : value
      });
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    
    try {
      // Validate form
      if (!formData.name.trim()) {
        throw new Error('Category name is required');
      }
      
      let response;
      const categoryData = {
        ...formData,
        event: eventId
      };
      
      if (isEditMode) {
        // Update existing category
        response = await categoryService.updateCategory(id, categoryData);
      } else {
        // Create new category
        response = await eventService.createEventCategory(eventId, categoryData);
      }
      
      if (response && (response.success || response.data)) {
        console.log('Category saved:', response.data || response);
        
        // Navigate back using the enhanced return logic
        navigate(getReturnDestination());
      } else {
        throw new Error(response?.message || 'Failed to save category');
      }
    } catch (err) {
      console.error('Error saving category:', err);
      setError(err.message || 'Failed to save category');
      setSubmitting(false);
    }
  };
  
  // Predefined colors for easy selection
  const colorOptions = [
    { value: '#4F46E5', label: 'Indigo' },
    { value: '#10B981', label: 'Emerald' },
    { value: '#F59E0B', label: 'Amber' },
    { value: '#EF4444', label: 'Red' },
    { value: '#6B7280', label: 'Gray' },
    { value: '#8B5CF6', label: 'Purple' },
    { value: '#EC4899', label: 'Pink' },
    { value: '#3B82F6', label: 'Blue' },
    { value: '#FFD700', label: 'Gold' },
  ];
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container mx-auto px-4 py-8 max-w-3xl"
    >
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6">
          {isEditMode ? 'Edit Category' : 'Create New Category'}
        </h1>
        
        {error && (
          <Alert type="error" message={error} className="mb-4" />
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Category Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="input input-bordered w-full"
              required
            />
          </div>
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="textarea textarea-bordered w-full"
              rows="3"
            ></textarea>
          </div>
          
          <div>
            <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-1">
              Color
            </label>
            <div className="flex items-center">
              <input
                type="color"
                id="color"
                name="color"
                value={formData.color}
                onChange={handleChange}
                className="w-12 h-12 rounded-md cursor-pointer"
              />
              <span className="ml-2 text-sm text-gray-500">{formData.color}</span>
            </div>
          </div>
          
          <div>
            <h3 className="text-md font-medium text-gray-700 mb-2">Permissions</h3>
            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="meals"
                  name="permissions.meals"
                  checked={formData.permissions.meals}
                  onChange={handleChange}
                  className="checkbox checkbox-primary"
                />
                <label htmlFor="meals" className="ml-2 text-sm text-gray-700">
                  Access to Meals
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="kitItems"
                  name="permissions.kitItems"
                  checked={formData.permissions.kitItems}
                  onChange={handleChange}
                  className="checkbox checkbox-primary"
                />
                <label htmlFor="kitItems" className="ml-2 text-sm text-gray-700">
                  Access to Kit Items
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="certificates"
                  name="permissions.certificates"
                  checked={formData.permissions.certificates}
                  onChange={handleChange}
                  className="checkbox checkbox-primary"
                />
                <label htmlFor="certificates" className="ml-2 text-sm text-gray-700">
                  Access to Certificates
                </label>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => navigate(getReturnDestination())}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? <Spinner size="sm" className="mr-2" /> : null}
              {isEditMode ? 'Update Category' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default CategoryForm; 