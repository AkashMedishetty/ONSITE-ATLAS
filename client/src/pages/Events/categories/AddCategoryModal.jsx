import React, { useState, useEffect } from 'react';
import {
  Modal, Input, Textarea, Button, Alert, Checkbox
} from '../../../components/common';
import eventService from '../../../services/eventService';

const AddCategoryModal = ({ isOpen, onClose, eventId, onCategoryCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#4F46E5',
    permissions: {
      meals: false,
      kitItems: false,
      certificates: false,
      abstractSubmission: false
    }
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        name: '',
        description: '',
        color: '#4F46E5',
        permissions: { meals: false, kitItems: false, certificates: false, abstractSubmission: false }
      });
      setError(null);
      setIsSaving(false);
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Category name is required.');
      return;
    }
    
    setIsSaving(true);
    setError(null);

    const categoryData = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      color: formData.color,
      permissions: formData.permissions,
    };

    try {
      console.log(`Attempting to create category for event ${eventId} with data:`, categoryData);
      const response = await eventService.createEventCategory(eventId, categoryData);
      console.log("Create category response:", response);

      if (response && response.success && response.data) {
        onCategoryCreated(response.data);
        onClose();
      } else {
        throw new Error(response?.message || 'Failed to create category.');
      }
    } catch (err) {
      console.error('Error creating category:', err);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Category">
      <form onSubmit={handleSubmit}>
        <div className="p-6 space-y-6">
          {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
          
          <Input
            label="Category Name *"
            id="category-name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., Delegate, Speaker, VIP"
            required
            disabled={isSaving}
          />
          
          <Textarea
            label="Description (Optional)"
            id="category-description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Briefly describe this category"
            rows={3}
            disabled={isSaving}
          />

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
                className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                disabled={isSaving}
              />
              <span className="ml-3 text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">{formData.color}</span>
            </div>
          </div>

          <div>
            <h3 className="text-md font-medium text-gray-700 mb-2">Permissions</h3>
            <div className="space-y-2 pl-2">
              <Checkbox 
                label="Allow Meal Access" 
                name="permissions.meals"
                checked={formData.permissions.meals}
                onChange={handleChange}
                disabled={isSaving}
              />
              <Checkbox 
                label="Allow Kit Bag Access" 
                name="permissions.kitItems"
                checked={formData.permissions.kitItems}
                onChange={handleChange}
                disabled={isSaving}
              />
              <Checkbox 
                label="Allow Certificate Access" 
                name="permissions.certificates"
                checked={formData.permissions.certificates}
                onChange={handleChange}
                disabled={isSaving}
              />
               <Checkbox 
                label="Allow Abstract Submission" 
                name="permissions.abstractSubmission"
                checked={formData.permissions.abstractSubmission}
                onChange={handleChange}
                disabled={isSaving}
              />
            </div>
          </div>

        </div>
        <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={isSaving} disabled={isSaving || !formData.name.trim()}>
            {isSaving ? 'Creating...' : 'Create Category'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddCategoryModal; 