import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Input,
  Textarea,
  Button,
  Alert,
  Spinner,
  Select
} from '../../components/common';

const AbstractForm = () => {
  const { eventId, abstractId } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!abstractId;

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    authors: [
      {
        firstName: '',
        lastName: '',
        email: '',
        organization: '',
        isPresenting: true
      }
    ],
    content: '',
    keywords: ['', '', '']
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    // Fetch categories for the event
    const fetchCategories = async () => {
      try {
        // Mock categories data
        setCategories([
          { id: 'clinical', name: 'Clinical Research' },
          { id: 'basic', name: 'Basic Science' },
          { id: 'technology', name: 'Medical Technology' },
          { id: 'education', name: 'Medical Education' }
        ]);
      } catch (error) {
        console.error('Error fetching abstract categories:', error);
        setStatus({
          type: 'error',
          message: 'Failed to load abstract categories. Please try again.'
        });
      }
    };

    // If in edit mode, fetch the abstract data
    const fetchAbstractData = async () => {
      setLoading(true);
      try {
        // Mock data for edit mode
        if (isEditMode) {
          // In a real app, this would be an API call to get the abstract by ID
          // Simulate API delay
          await new Promise(resolve => setTimeout(resolve, 800));
          
          setFormData({
            title: 'Effects of Novel Treatment on Clinical Outcomes',
            category: 'clinical',
            authors: [
              {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@example.com',
                organization: 'University Medical Center',
                isPresenting: true
              },
              {
                firstName: 'Jane',
                lastName: 'Smith',
                email: 'jane.smith@example.com',
                organization: 'Research Institute',
                isPresenting: false
              }
            ],
            content: 'Background: Lorem ipsum dolor sit amet, consectetur adipiscing elit.\n\nMethods: Ut enim ad minim veniam, quis nostrud exercitation.\n\nResults: Duis aute irure dolor in reprehenderit in voluptate.\n\nConclusion: Excepteur sint occaecat cupidatat non proident.',
            keywords: ['Treatment', 'Clinical', 'Outcomes']
          });
        }
      } catch (error) {
        console.error('Error fetching abstract:', error);
        setStatus({
          type: 'error',
          message: 'Failed to load abstract data. Please try again.'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
    if (isEditMode) {
      fetchAbstractData();
    }
  }, [eventId, abstractId, isEditMode]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAuthorChange = (index, field, value) => {
    setFormData(prev => {
      const updatedAuthors = [...prev.authors];
      updatedAuthors[index] = {
        ...updatedAuthors[index],
        [field]: value
      };
      return {
        ...prev,
        authors: updatedAuthors
      };
    });
  };

  const handleKeywordChange = (index, value) => {
    setFormData(prev => {
      const updatedKeywords = [...prev.keywords];
      updatedKeywords[index] = value;
      return {
        ...prev,
        keywords: updatedKeywords
      };
    });
  };

  const addAuthor = () => {
    setFormData(prev => ({
      ...prev,
      authors: [
        ...prev.authors,
        {
          firstName: '',
          lastName: '',
          email: '',
          organization: '',
          isPresenting: false
        }
      ]
    }));
  };

  const removeAuthor = (index) => {
    if (formData.authors.length <= 1) return;

    setFormData(prev => ({
      ...prev,
      authors: prev.authors.filter((_, i) => i !== index)
    }));
  };

  const setPresentingAuthor = (index) => {
    setFormData(prev => ({
      ...prev,
      authors: prev.authors.map((author, i) => ({
        ...author,
        isPresenting: i === index
      }))
    }));
  };

  const validateForm = () => {
    // Basic validation
    if (!formData.title.trim()) {
      setStatus({
        type: 'error',
        message: 'Please enter an abstract title.'
      });
      return false;
    }

    if (!formData.category) {
      setStatus({
        type: 'error',
        message: 'Please select an abstract category.'
      });
      return false;
    }

    if (!formData.content.trim()) {
      setStatus({
        type: 'error',
        message: 'Please enter abstract content.'
      });
      return false;
    }

    // Validate authors
    for (const author of formData.authors) {
      if (!author.firstName.trim() || !author.lastName.trim() || !author.email.trim() || !author.organization.trim()) {
        setStatus({
          type: 'error',
          message: 'Please complete all author fields.'
        });
        return false;
      }
    }

    // Validate at least one keyword
    if (!formData.keywords.some(keyword => keyword.trim())) {
      setStatus({
        type: 'error',
        message: 'Please enter at least one keyword.'
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setSubmitting(true);
    try {
      // Mock API call - in a real app, this would submit to the backend
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setStatus({
        type: 'success',
        message: isEditMode 
          ? 'Abstract updated successfully!' 
          : 'Abstract submitted successfully!'
      });
      
      // In a real app, navigate to the abstract details page after successful submission
      setTimeout(() => {
        navigate(`/events/${eventId}/abstracts`);
      }, 2000);
    } catch (error) {
      console.error('Error submitting abstract:', error);
      setStatus({
        type: 'error',
        message: 'Failed to submit abstract. Please try again.'
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleSaveDraft = async () => {
    setSubmitting(true);
    try {
      // Mock API call for saving draft
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStatus({
        type: 'success',
        message: 'Draft saved successfully!'
      });
    } catch (error) {
      console.error('Error saving draft:', error);
      setStatus({
        type: 'error',
        message: 'Failed to save draft. Please try again.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">
          {isEditMode ? 'Edit Abstract' : 'Submit Abstract'}
        </h2>
        <Button 
          variant="outline" 
          onClick={() => navigate(`/events/${eventId}/abstracts`)}
        >
          Cancel
        </Button>
      </div>

      {status && (
        <Alert 
          type={status.type} 
          message={status.message} 
          className="mb-6"
          onClose={() => setStatus(null)}
        />
      )}

      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <h3 className="text-xl font-medium mb-4">Abstract Information</h3>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-1">
                Abstract Title <span className="text-red-500">*</span>
              </label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter abstract title"
                required
                disabled={submitting}
              />
            </div>
            
            <div>
              <label htmlFor="category" className="block text-sm font-medium mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <Select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                options={categories.map(cat => ({
                  value: cat.id,
                  label: cat.name
                }))}
                placeholder="Select a category"
                required
                disabled={submitting}
              />
            </div>
            
            <div>
              <label htmlFor="keywords" className="block text-sm font-medium mb-1">
                Keywords <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {formData.keywords.map((keyword, index) => (
                  <Input
                    key={index}
                    value={keyword}
                    onChange={(e) => handleKeywordChange(index, e.target.value)}
                    placeholder={`Keyword ${index + 1}`}
                    disabled={submitting}
                  />
                ))}
              </div>
            </div>
            
            <div>
              <label htmlFor="content" className="block text-sm font-medium mb-1">
                Abstract Content <span className="text-red-500">*</span>
              </label>
              <Textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                placeholder="Enter abstract content. Suggested sections: Background, Methods, Results, Conclusion."
                rows={10}
                required
                disabled={submitting}
              />
              <p className="text-sm text-gray-500 mt-1">
                Formatting tip: Use double line breaks for new paragraphs.
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-medium">Authors</h3>
            <Button 
              type="button" 
              variant="secondary" 
              onClick={addAuthor}
              disabled={submitting}
            >
              + Add Author
            </Button>
          </div>
          
          {formData.authors.map((author, index) => (
            <div 
              key={index} 
              className="border rounded-md p-4 mb-4 last:mb-0"
            >
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-medium">Author {index + 1}</h4>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id={`presenting-${index}`}
                      name="presentingAuthor"
                      checked={author.isPresenting}
                      onChange={() => setPresentingAuthor(index)}
                      className="mr-2"
                      disabled={submitting}
                    />
                    <label htmlFor={`presenting-${index}`} className="text-sm">
                      Presenting Author
                    </label>
                  </div>
                  {formData.authors.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeAuthor(index)}
                      className="text-red-500 text-sm"
                      disabled={submitting}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={author.firstName}
                    onChange={(e) => handleAuthorChange(index, 'firstName', e.target.value)}
                    placeholder="First name"
                    required
                    disabled={submitting}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={author.lastName}
                    onChange={(e) => handleAuthorChange(index, 'lastName', e.target.value)}
                    placeholder="Last name"
                    required
                    disabled={submitting}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="email"
                    value={author.email}
                    onChange={(e) => handleAuthorChange(index, 'email', e.target.value)}
                    placeholder="Email address"
                    required
                    disabled={submitting}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Organization <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={author.organization}
                    onChange={(e) => handleAuthorChange(index, 'organization', e.target.value)}
                    placeholder="Organization/Institution"
                    required
                    disabled={submitting}
                  />
                </div>
              </div>
            </div>
          ))}
        </Card>
        
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleSaveDraft}
            disabled={submitting}
          >
            {submitting && !isEditMode ? <Spinner size="sm" className="mr-2" /> : null}
            Save as Draft
          </Button>
          <Button
            type="submit"
            disabled={submitting}
          >
            {submitting && isEditMode ? <Spinner size="sm" className="mr-2" /> : null}
            {isEditMode ? 'Update Abstract' : 'Submit Abstract'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AbstractForm; 