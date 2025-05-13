import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { categoryService } from '../../services';
import { Spinner, ErrorMessage, ConfirmModal } from '../../components/common';
import responseHandler from '../../utils/responseHandler';

const CategoryList = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await categoryService.getCategories(eventId);
      
      if (responseHandler.isSuccess(response)) {
        setCategories(responseHandler.extractData(response, []));
      } else {
        setError(responseHandler.getMessage(response, 'Failed to fetch categories'));
      }
    } catch (err) {
      setError('Error fetching categories. Please try again.');
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [eventId]);

  const handleDelete = async () => {
    if (!categoryToDelete) return;
    
    try {
      setLoading(true);
      const response = await categoryService.deleteCategory(categoryToDelete._id);
      
      if (responseHandler.isSuccess(response)) {
        setCategories(prevCategories => 
          prevCategories.filter(cat => cat._id !== categoryToDelete._id)
        );
        setShowDeleteModal(false);
        setCategoryToDelete(null);
      } else {
        setError(responseHandler.getMessage(response, 'Failed to delete category'));
      }
    } catch (err) {
      setError('Error deleting category. Please try again.');
      console.error('Error deleting category:', err);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (category) => {
    setCategoryToDelete(category);
    setShowDeleteModal(true);
  };

  const filteredCategories = categories.filter(category => 
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && categories.length === 0) {
    return <Spinner />;
  }

  if (error && categories.length === 0) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white rounded-lg shadow-soft p-6"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-primary-700">Categories</h1>
            <p className="text-gray-500 mt-2">
              Manage attendee categories and their permissions
            </p>
          </div>
          
          <div className="mt-4 md:mt-0">
            <Link 
              to={`/events/${eventId}/categories/new`}
              className="btn btn-primary"
            >
              <i className="ri-add-line mr-2"></i>
              Add Category
            </Link>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}
        
        {/* Search Box */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search categories..."
              className="input pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <i className="ri-search-line text-gray-400"></i>
            </div>
          </div>
        </div>
        
        {filteredCategories.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <i className="ri-folder-info-line text-5xl"></i>
            </div>
            <h3 className="text-lg font-medium text-gray-500">No categories found</h3>
            <p className="text-gray-400 mt-2">
              {searchTerm ? 'Try adjusting your search term.' : 'Get started by adding a new category.'}
            </p>
            {searchTerm && (
              <button 
                className="mt-4 btn btn-outline-secondary"
                onClick={() => setSearchTerm('')}
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Permissions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registrations
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCategories.map((category) => (
                  <motion.tr
                    key={category._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    layout
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div 
                          className="w-4 h-4 rounded-full mr-3" 
                          style={{ backgroundColor: category.color }}
                        ></div>
                        <div className="font-medium text-gray-900">
                          {category.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">
                        {category.description}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        {category.permissions.meals && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Meals
                          </span>
                        )}
                        {category.permissions.kitItems && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Kit
                          </span>
                        )}
                        {category.permissions.certificates && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            Cert
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {category.registrationCount} registrations
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Link
                          to={`/events/${eventId}/categories/${category._id}`}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          <i className="ri-eye-line text-lg"></i>
                        </Link>
                        <Link
                          to={`/events/${eventId}/categories/${category._id}/edit`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <i className="ri-edit-line text-lg"></i>
                        </Link>
                        <button
                          onClick={() => confirmDelete(category)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <i className="ri-delete-bin-line text-lg"></i>
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
      
      {showDeleteModal && (
        <ConfirmModal
          title="Delete Category"
          message={`Are you sure you want to delete "${categoryToDelete?.name}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={handleDelete}
          onCancel={() => {
            setShowDeleteModal(false);
            setCategoryToDelete(null);
          }}
        />
      )}
    </div>
  );
};

export default CategoryList;