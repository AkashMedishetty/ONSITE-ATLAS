import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';

const AbstractEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    authors: '',
    event: '',
    category: '',
    abstract: ''
  });
  const [initialData, setInitialData] = useState(null);
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

  useEffect(() => {
    const fetchAbstract = async () => {
      setLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Dummy data
        const dummyAbstract = {
          id: id,
          title: 'Deep Learning Applications in Natural Language Processing',
          authors: 'Jane Smith, John Doe',
          event: '2', // Research Symposium
          category: '2', // Natural Language Processing
          abstract: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam auctor, nisl eget ultricies lacinia, nisl nisl aliquam nisl, eget aliquam nisl nisl eget nisl. Nullam auctor, nisl eget ultricies lacinia, nisl nisl aliquam nisl, eget aliquam nisl nisl eget nisl.',
          submittedDate: '2023-09-03',
          status: 'pending'
        };
        
        setFormData(dummyAbstract);
        setInitialData(dummyAbstract);
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
    
    setSubmitting(true);
    
    try {
      // This would be an API call in a real app
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate successful submission
      alert('Abstract updated successfully!');
      navigate(`/registrant-portal/events/${formData.event}/abstracts/${id}`);
    } catch (error) {
      setErrors({
        submit: 'Failed to update abstract. Please try again.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-gray-600">Loading abstract details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 text-red-700 p-4 rounded">
          {error}
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

  // Check if the abstract is editable (only pending abstracts can be edited)
  if (initialData && initialData.status !== 'pending') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-100 text-yellow-800 p-4 rounded">
          This abstract cannot be edited because its status is {initialData.status}.
          Only abstracts with 'pending' status can be edited.
        </div>
        <div className="mt-4">
          <Link
            to={`/registrant-portal/events/${initialData.event}/abstracts/${id}`}
            className="text-blue-600 hover:underline"
          >
            &larr; Back to Abstract Details
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Edit Abstract</h1>
        <p className="text-gray-600 mt-2">
          Make changes to your abstract submission.
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
                disabled={initialData && initialData.event} // Disable if event was already selected
              >
                <option value="">Select an event</option>
                {events.map(event => (
                  <option key={event.id} value={event.id}>
                    {event.name}
                  </option>
                ))}
              </select>
              {errors.event && <p className="text-red-500 text-sm mt-1">{errors.event}</p>}
              {initialData && initialData.event && (
                <p className="text-gray-500 text-sm mt-1">Event cannot be changed after submission</p>
              )}
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
              to={`/registrant-portal/events/${formData.event}/abstracts/${id}`}
              className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AbstractEdit; 