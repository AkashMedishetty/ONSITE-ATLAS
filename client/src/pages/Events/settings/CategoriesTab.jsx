import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { 
  Card, 
  Button, 
  Spinner, 
  Alert,
  Badge,
  Modal
} from '../../../components/common';
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';
import eventService from '../../../services/eventService';

const CategoriesTab = ({ event, setEvent, setFormChanged }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [deleteInProgress, setDeleteInProgress] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await eventService.getEventCategories(id);
        
        if (response.success) {
          console.log('API categories:', response.data);
          
          // Get categories from the response
          let categoriesData = [];
          if (response.data.categories && Array.isArray(response.data.categories)) {
            categoriesData = response.data.categories;
          } else if (Array.isArray(response.data)) {
            categoriesData = response.data;
          }
          
          setCategories(categoriesData);
        } else {
          setError(response.message || 'Failed to load categories');
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError(err.message || 'Failed to load categories');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [id]);

  const handleAddCategory = () => {
    // Navigate to the category form page with the event ID and better return state
    navigate(`/events/${id}/categories/new?returnToPortal=true`, {
      state: { 
        returnTo: `/events/${id}/categories`,
        activeTab: 'categories'
      }
    });
  };

  const handleEditCategory = (categoryId) => {
    // Navigate to the edit category page with better return state
    navigate(`/events/${id}/categories/${categoryId}/edit?returnToPortal=true`, {
      state: { 
        returnTo: `/events/${id}/categories`,
        activeTab: 'categories'
      }
    });
  };

  const confirmDelete = (category) => {
    setCategoryToDelete(category);
    setDeleteModalOpen(true);
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;
    
    setDeleteInProgress(true);
    try {
      const response = await eventService.deleteEventCategory(id, categoryToDelete._id);
      
      if (response.success) {
        // Remove from local state
        setCategories(categories.filter(c => c._id !== categoryToDelete._id));
        setDeleteModalOpen(false);
        setCategoryToDelete(null);
      } else {
        throw new Error(response.message || 'Failed to delete category');
      }
    } catch (err) {
      console.error('Error deleting category:', err);
      setError('Failed to delete category. Please try again.');
    } finally {
      setDeleteInProgress(false);
    }
  };

  const getPermissionBadge = (hasPermission, label) => {
    return (
      <Badge 
        variant={hasPermission ? "success" : "secondary"}
        className="mr-1"
      >
        {label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert 
        type="error" 
        message="Error loading categories" 
        details={error}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Attendee Categories</h2>
        <Button 
          variant="primary" 
          onClick={handleAddCategory}
          leadingIcon={<FiPlus />}
        >
          Add Category
        </Button>
      </div>
      
      {categories.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-500 mb-4">No categories have been created yet.</p>
          <Button 
            variant="outline" 
            onClick={handleAddCategory}
            leadingIcon={<FiPlus />}
          >
            Create your first category
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <motion.div
              key={category._id}
              className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                <div className="flex items-center">
                  <div 
                    className="w-4 h-4 rounded-full mr-2" 
                    style={{ backgroundColor: category.color || '#4F46E5' }}
                  ></div>
                  <h3 className="font-medium">{category.name}</h3>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditCategory(category._id)}
                    className="p-1.5 rounded-full text-gray-500 hover:bg-gray-100"
                    aria-label="Edit category"
                  >
                    <FiEdit2 size={16} />
                  </button>
                  <button
                    onClick={() => confirmDelete(category)}
                    className="p-1.5 rounded-full text-gray-500 hover:bg-gray-100 hover:text-red-500"
                    aria-label="Delete category"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="p-4">
                {category.description ? (
                  <p className="text-sm text-gray-600 mb-4">{category.description}</p>
                ) : (
                  <p className="text-sm text-gray-400 italic mb-4">No description</p>
                )}
                
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <span className={`mr-2 ${category.permissions?.meals ? 'text-green-500' : 'text-gray-400'}`}>
                      {category.permissions?.meals ? '✓' : '✗'}
                    </span>
                    <span className="text-gray-600">Access to Meals</span>
                  </div>
                  
                  <div className="flex items-center text-sm">
                    <span className={`mr-2 ${category.permissions?.kitItems ? 'text-green-500' : 'text-gray-400'}`}>
                      {category.permissions?.kitItems ? '✓' : '✗'}
                    </span>
                    <span className="text-gray-600">Access to Kit Items</span>
                  </div>
                  
                  <div className="flex items-center text-sm">
                    <span className={`mr-2 ${category.permissions?.certificates ? 'text-green-500' : 'text-gray-400'}`}>
                      {category.permissions?.certificates ? '✓' : '✗'}
                    </span>
                    <span className="text-gray-600">Access to Certificates</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          if (!deleteInProgress) {
            setDeleteModalOpen(false);
            setCategoryToDelete(null);
          }
        }}
        title="Delete Category"
      >
        <div className="p-4">
          <p className="mb-4">
            Are you sure you want to delete the category <strong>{categoryToDelete?.name}</strong>?
            This action cannot be undone.
          </p>
          
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => {
                if (!deleteInProgress) {
                  setDeleteModalOpen(false);
                  setCategoryToDelete(null);
                }
              }}
              disabled={deleteInProgress}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteCategory}
              disabled={deleteInProgress}
              loading={deleteInProgress}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CategoriesTab; 