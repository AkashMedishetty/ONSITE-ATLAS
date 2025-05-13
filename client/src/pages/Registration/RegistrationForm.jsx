import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import eventService from '../../services/eventService';
import registrationService from '../../services/registrationService';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const RegistrationForm = ({ isOnsite = false }) => {
  const { id: eventIdParam, registrationId } = useParams();
  const navigate = useNavigate();
  
  // Use the extracted parameter for eventId
  const eventId = eventIdParam;
  
  // Use registrationId if available (for edit mode)
  const actualRegistrationId = registrationId;
  
  // State management
  const [event, setEvent] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [formErrors, setFormErrors] = useState({});
  
  // Form configuration from event settings
  const [formConfig, setFormConfig] = useState({
    requiredFields: ['firstName', 'lastName', 'email', 'categoryId'],
    visibleFields: [
      'firstName', 'lastName', 'email', 'phone', 'categoryId'
    ],
    fieldOrder: []
  });
  
  // Initial form data
  const initialFormData = {
      firstName: '',
      lastName: '',
      email: '',
    phone: '',
    organization: '',
    title: '',
    categoryId: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    dietaryRestrictions: '',
    emergencyContact: '',
    emergencyPhone: '',
    specialRequirements: '',
    agreeToTerms: false
  };
  
  const [formData, setFormData] = useState(initialFormData);
  
  // Load event, categories and form configuration
  useEffect(() => {
    const fetchEventData = async () => {
      try {
        setLoading(true);
        
        // Fetch event details
          console.log('Fetching event data for ID:', eventId);
          const eventResponse = await eventService.getEventById(eventId);
        const eventData = eventResponse.data || eventResponse;
        setEvent(eventData);
          console.log('Event data:', eventData);
        
        // Get form configuration FIRST - to know what fields to display
        try {
          // Try to get registration form config from the event data first
          if (eventData?.registrationSettings?.formConfig) {
            console.log('Using form config from event data:', eventData.registrationSettings.formConfig);
            setFormConfig(eventData.registrationSettings.formConfig);
          } else {
            // If not available in event data, try to fetch it separately
            console.log('Fetching registration form config from API...');
            const formConfigResponse = await eventService.getRegistrationFormConfig(eventId);
            
            if (formConfigResponse?.success && formConfigResponse.data) {
              console.log('Received form config from API:', formConfigResponse.data);
              setFormConfig(formConfigResponse.data);
            }
          }
        } catch (configError) {
          console.error('Error fetching form configuration:', configError);
          // Keep using default configuration on error
        }
        
        // Fetch categories for this event
        try {
          const categoriesResponse = await eventService.getEventCategories(eventId);
          console.log('Categories response:', categoriesResponse);
          
          if (categoriesResponse.success && categoriesResponse.data) {
            setCategories(categoriesResponse.data);
            
            // Set the first category as selected by default if categories exist
            if (categoriesResponse.data.length > 0) {
              setFormData(prev => ({
                ...prev,
                categoryId: categoriesResponse.data[0]._id
              }));
            }
          } else {
            console.error('Failed to fetch categories:', categoriesResponse.message);
            setErrorMessage('Failed to load registration categories');
          }
        } catch (error) {
          console.error('Error fetching categories:', error);
          setErrorMessage('Error loading registration categories');
        }
      } catch (error) {
        console.error('Error loading event data:', error);
        setErrorMessage('Failed to load event information');
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
  }, [eventId]);
  
  // Handle form field changes
  const handleChange = (e) => {
    // For DOM input elements 
    if (e && e.target) {
      const { name, value, type, checked } = e.target;
      console.log(`Field "${name}" changed to:`, type === 'checkbox' ? checked : value);
      
      setFormData(prevData => ({
        ...prevData,
        [name]: type === 'checkbox' ? checked : value
      }));
      
      // Clear error for this field
      if (formErrors[name]) {
        setFormErrors(prev => {
          const newErrors = {...prev};
          delete newErrors[name];
          return newErrors;
        });
      }
      return;
    }
    
    console.warn('Unhandled form change event:', e);
  };
  
  // Validate form data
  const validateForm = () => {
    const errors = {};
    
    // Check required fields
    formConfig.requiredFields.forEach(field => {
      if (!formData[field] && formConfig.visibleFields.includes(field)) {
        errors[field] = 'This field is required';
      }
    });
    
    // Validate email format
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    // Validate phone format if provided
    if (formData.phone && !/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/.test(formData.phone)) {
      errors.phone = 'Please enter a valid phone number';
    }
    
    return errors;
  };
  
  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log("Submitting form with eventId:", eventId);
    console.log("Form data:", formData);
    console.log("Form configuration:", formConfig);
    
    // Validate form
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      setErrorMessage('Please correct the errors below');
      return;
    }
    
    setIsSubmitting(true);
    setFormErrors({});
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      // Ensure eventId is a string
      const eventIdValue = String(eventId);
      console.log("Using eventId value:", eventIdValue);
      
      // Prepare personal info data - ALWAYS include required fields
      const personalInfo = {
        firstName: formData.firstName || '',
        lastName: formData.lastName || '',
        email: formData.email || ''
      };
      
      // Add other personal info fields that are visible
      const personalInfoFields = [
        'phone', 'organization', 'title', 'address', 
        'city', 'state', 'country', 'postalCode'
      ];
      
      personalInfoFields.forEach(field => {
        if (formConfig.visibleFields.includes(field) && formData[field]) {
          personalInfo[field] = formData[field];
        }
      });
      
      // Prepare custom fields
      const customFields = {};
      const customFieldsList = [
        'dietaryRestrictions', 'emergencyContact', 'emergencyPhone', 
        'specialRequirements', 'agreeToTerms'
      ];
      
      customFieldsList.forEach(field => {
        if (formConfig.visibleFields.includes(field) && formData[field] !== undefined) {
          customFields[field] = formData[field];
        }
      });
      
      // Get registration ID format config from event data if available
      const registrationSettings = event?.registrationSettings || {};
      
      // Prepare registration data with all required fields - similar approach to bulk import
      const registrationData = {
        eventId: eventIdValue,
        categoryId: formData.categoryId,
        personalInfo,
        customFields,
        // No need to send prefix information - the backend will use the proper idGenerator utility
        // that gets the prefix directly from the event document in the database
      };
      
      console.log("Sending registration data:", registrationData);
      
      // Create new registration - Pass only the registrationData object
      // as the service function expects eventId within that object.
      const response = await registrationService.createRegistration(registrationData);
      
      if (response.success) {
        setSuccessMessage(`Registration created successfully! ID: ${response.data?.registrationId || ''}`);
        setFormData({...initialFormData});
        
        // Redirect to registrations list after success, signaling a refresh
        setTimeout(() => {
          navigate(
            `/events/${eventIdValue}/registrations`, 
            { 
              replace: true, // Replace history entry to prevent back button going to form
              state: { refresh: true } // Signal to EventPortal to refresh data
            }
          );
        }, 5000); // Increased delay to 5 seconds
      } else {
        setErrorMessage(response.message || 'Failed to create registration');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setErrorMessage(err.message || 'An error occurred during registration');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Field label mapper function
  const getFieldLabel = (field) => {
    const labels = {
      firstName: 'First Name',
      lastName: 'Last Name',
      email: 'Email Address',
      phone: 'Phone Number',
      organization: 'Organization/Institution',
      title: 'Job Title',
      categoryId: 'Registration Category',
      address: 'Address',
      city: 'City',
      state: 'State/Province',
      country: 'Country',
      postalCode: 'Postal Code',
      dietaryRestrictions: 'Dietary Restrictions',
      emergencyContact: 'Emergency Contact',
      emergencyPhone: 'Emergency Contact Phone',
      specialRequirements: 'Special Requirements',
      agreeToTerms: 'I agree to the terms and conditions'
    };
    
    return labels[field] || field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  };
  
  // Render form field based on field type
  const renderField = (field) => {
    // Skip fields that aren't in the visibleFields configuration
    if (!formConfig.visibleFields.includes(field)) {
      return null;
    }
    
    const isRequired = formConfig.requiredFields.includes(field);
    const hasError = formErrors[field];
    
    switch (field) {
      case 'categoryId':
        return (
          <div key={field} className="form-group mb-4">
            <label htmlFor={field} className="form-label font-medium">
              {getFieldLabel(field)}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </label>
            <select
              id={field}
              name={field}
              value={formData[field] || ''}
              onChange={handleChange}
              className={`form-select block w-full rounded-md ${hasError ? 'border-red-500' : 'border-gray-300'}`}
              required={isRequired}
            >
              <option value="">Select a Category</option>
              {categories.map(category => (
                <option key={category._id} value={category._id}>
                  {category.name} {category.fee !== undefined && (category.fee > 0 ? `($${category.fee})` : '(Free)')}
                </option>
              ))}
            </select>
            {hasError && <div className="text-red-500 mt-1 text-sm">{hasError}</div>}
            {formData.categoryId && (
              <div className="text-gray-500 mt-1 text-sm">
                {categories.find(c => c._id === formData.categoryId)?.description || ''}
              </div>
            )}
          </div>
        );
        
      case 'agreeToTerms':
        return (
          <div key={field} className="form-group mb-4">
            <div className="form-check">
              <input
                id={field}
                name={field}
                type="checkbox"
                checked={formData[field] || false}
                onChange={handleChange}
                className={`form-check-input ${hasError ? 'border-red-500' : ''}`}
                required={isRequired}
              />
              <label htmlFor={field} className="form-check-label ml-2">
                  {getFieldLabel(field)}
                {isRequired && <span className="text-red-500 ml-1">*</span>}
                
                  {event?.termsUrl && (
                  <span className="ml-1">
                    (<a href={event.termsUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      View Terms
                    </a>)
                  </span>
                )}
              </label>
            </div>
            {hasError && <div className="text-red-500 mt-1 text-sm">{hasError}</div>}
          </div>
        );
        
      case 'specialRequirements':
      case 'dietaryRestrictions':
        return (
          <div key={field} className="form-group mb-4">
            <label htmlFor={field} className="form-label font-medium">
              {getFieldLabel(field)}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </label>
            <textarea
              id={field}
              name={field}
              value={formData[field] || ''}
              onChange={handleChange}
              rows={3}
              className={`form-control block w-full rounded-md ${hasError ? 'border-red-500' : 'border-gray-300'}`}
              required={isRequired}
            ></textarea>
            {hasError && <div className="text-red-500 mt-1 text-sm">{hasError}</div>}
          </div>
        );
        
      default:
        // Text inputs (firstName, lastName, email, etc.)
        return (
          <div key={field} className="form-group mb-4">
            <label htmlFor={field} className="form-label font-medium">
              {getFieldLabel(field)}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type={field === 'email' ? 'email' : field === 'phone' ? 'tel' : 'text'}
              id={field}
              name={field}
              value={formData[field] || ''}
              onChange={handleChange}
              className={`form-control block w-full rounded-md ${hasError ? 'border-red-500' : 'border-gray-300'}`}
              required={isRequired}
            />
            {hasError && <div className="text-red-500 mt-1 text-sm">{hasError}</div>}
          </div>
        );
    }
  };
  
  // Get fields to render based on form configuration
  const getFormFields = () => {
    // Use fieldOrder if available, otherwise use visibleFields
    if (formConfig.fieldOrder && formConfig.fieldOrder.length > 0) {
      return formConfig.fieldOrder.filter(field => formConfig.visibleFields.includes(field));
    }
    
    // Default field ordering if no fieldOrder is defined
    const defaultOrder = [
      'firstName', 'lastName', 'email', 'phone', 'organization', 'title',
      'address', 'city', 'state', 'country', 'postalCode',
      'categoryId',
      'dietaryRestrictions', 'emergencyContact', 'emergencyPhone', 'specialRequirements',
      'agreeToTerms'
    ];
    
    // Filter to only include fields that are in visibleFields
    return defaultOrder.filter(field => formConfig.visibleFields.includes(field));
  };
  
  // Main render function
  return (
    <div className="bg-white shadow-sm rounded-lg p-6">
      {/* Header section */}
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate(`/events/${eventId}`)}
          className="btn btn-link text-gray-600 p-0 mr-4 flex items-center"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Event
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Event Registration</h1>
      </div>
      
      {/* Event details */}
          {event && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-700">{event.name}</h2>
          {event.startDate && event.endDate && (
            <p className="text-gray-600">
              {new Date(event.startDate).toLocaleDateString()} to {new Date(event.endDate).toLocaleDateString()}
            </p>
          )}
        </div>
      )}
      
      {/* Loading state */}
      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="spinner-border text-primary" role="status">
            <span className="sr-only">Loading...</span>
          </div>
        </div>
      ) : (
        <>
          {/* Messages */}
          {errorMessage && (
            <div className="alert alert-danger p-4 mb-6 bg-red-50 border border-red-200 text-red-700 rounded">
              {errorMessage}
            </div>
          )}
          
          {successMessage && (
            <div className="alert alert-success p-4 mb-6 bg-green-50 border border-green-200 text-green-700 rounded">
              {successMessage}
            </div>
          )}
          
          {/* Registration form */}
          <form onSubmit={handleSubmit} className="registration-form">
            <div className="card mb-6 border border-gray-200 rounded-lg overflow-hidden">
              <div className="card-header p-4 bg-gray-50 border-b border-gray-200">
                <h3 className="text-lg font-semibold">Registration Information</h3>
                <p className="text-sm text-gray-600">Please fill in the details below to complete your registration.</p>
              </div>
              
              <div className="card-body p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                  {getFormFields().map(field => renderField(field))}
                </div>
              </div>
            </div>
            
            {/* Form actions */}
            <div className="form-actions flex justify-end">
              <button
              type="submit"
                disabled={isSubmitting}
                className="btn btn-primary px-6 py-2.5 bg-blue-600 text-white font-medium rounded shadow-md hover:bg-blue-700 focus:outline-none disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : "Complete Registration"}
              </button>
          </div>
        </form>
        </>
      )}
    </div>
  );
};

export default RegistrationForm; 