import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const AbstractSubmission = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    authors: '',
    event: '',
    category: '',
    abstract: ''
  });
  const [errors, setErrors] = useState({});

  // This would come from an API in a real app
  const events = [
    { id: '1', name: 'Sample Conference 2023' },
    { id: '2', name: 'Research Symposium' }
  ];

  const categories = [
    { id: '1', name: 'Machine Learning' },
    { id: '2', name: 'Natural Language Processing' },
    { id: '3', name: 'Computer Vision' },
    { id: '4', name: 'Ethics in AI' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.authors.trim()) newErrors.authors = 'Authors are required';
    if (!formData.event) newErrors.event = 'Please select an event';
    if (!formData.category) newErrors.category = 'Please select a category';
    if (!formData.abstract.trim()) newErrors.abstract = 'Abstract content is required';
    else if (formData.abstract.length < 100) newErrors.abstract = 'Abstract must be at least 100 characters';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setLoading(true);
    
    try {
      // This would be an API call in a real app
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate successful submission
      alert('Abstract submitted successfully!');
      navigate('/registrant-portal/abstracts');
    } catch (error) {
      setErrors({
        submit: 'Failed to submit abstract. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Submit Abstract</h1>
        <p className="text-gray-600 mt-2">
          Please fill out the form below to submit your abstract for review.
        </p>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6">
        {errors.submit && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {errors.submit}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2" htmlFor="title">
              Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded ${errors.title ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Enter abstract title"
            />
            {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2" htmlFor="authors">
              Authors
            </label>
            <input
              type="text"
              id="authors"
              name="authors"
              value={formData.authors}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded ${errors.authors ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Enter authors (comma separated)"
            />
            {errors.authors && <p className="text-red-500 text-sm mt-1">{errors.authors}</p>}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 font-medium mb-2" htmlFor="event">
                Event
              </label>
              <select
                id="event"
                name="event"
                value={formData.event}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded ${errors.event ? 'border-red-500' : 'border-gray-300'}`}
              >
                <option value="">Select an event</option>
                {events.map(event => (
                  <option key={event.id} value={event.id}>
                    {event.name}
                  </option>
                ))}
              </select>
              {errors.event && <p className="text-red-500 text-sm mt-1">{errors.event}</p>}
            </div>
            
            <div>
              <label className="block text-gray-700 font-medium mb-2" htmlFor="category">
                Category
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded ${errors.category ? 'border-red-500' : 'border-gray-300'}`}
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2" htmlFor="abstract">
              Abstract Content
            </label>
            <textarea
              id="abstract"
              name="abstract"
              value={formData.abstract}
              onChange={handleChange}
              rows="8"
              className={`w-full px-3 py-2 border rounded ${errors.abstract ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Enter your abstract content (minimum 100 characters)"
            />
            {errors.abstract && <p className="text-red-500 text-sm mt-1">{errors.abstract}</p>}
            <p className="text-sm text-gray-500 mt-1">
              Character count: {formData.abstract.length}/2500
            </p>
          </div>
          
          <div className="flex justify-between">
            <Link
              to="/registrant-portal/abstracts"
              className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Abstract'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AbstractSubmission; 