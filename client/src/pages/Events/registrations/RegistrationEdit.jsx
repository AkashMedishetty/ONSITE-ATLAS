import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, 
  Button, 
  Spinner, 
  Alert, 
  Input,
  Select,
  Switch,
  Textarea
} from '../../../components/common';
import { 
  ArrowLeftIcon,
  SaveIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import registrationService from '../../../services/registrationService';
import eventService from '../../../services/eventService';
import categoryService from '../../../services/categoryService';

const RegistrationEdit = () => {
  const { eventId, registrationId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [registration, setRegistration] = useState(null);
  const [event, setEvent] = useState(null);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    organization: '',
    category: '',
    status: 'registered',
    checkedIn: false,
    paymentStatus: 'unpaid',
    address: '',
    country: '',
    dietaryRestrictions: ''
  });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch event details
        const eventResponse = await eventService.getEvent(eventId);
        console.log('Event response:', eventResponse);
        
        if (!eventResponse || !eventResponse.success) {
          throw new Error(eventResponse?.message || 'Failed to fetch event details');
        }
        
        setEvent(eventResponse.data);
        
        // Fetch categories
        const categoriesResponse = await categoryService.getEventCategories(eventId);
        console.log('Categories response:', categoriesResponse);
        
        if (categoriesResponse && categoriesResponse.success) {
          setCategories(categoriesResponse.data || []);
        } else {
          console.warn('Failed to fetch categories');
        }
        
        // Fetch registration details
        const registrationResponse = await registrationService.getRegistration(eventId, registrationId);
        console.log('Registration response:', registrationResponse);
        
        if (!registrationResponse || !registrationResponse.success) {
          throw new Error(registrationResponse?.message || 'Failed to fetch registration details');
        }
        
        const registrationData = registrationResponse.data;
        setRegistration(registrationData);
        
        // Initialize form data
        const personalInfo = registrationData.personalInfo || {};
        
        setFormData({
          firstName: registrationData.firstName || personalInfo.firstName || '',
          lastName: registrationData.lastName || personalInfo.lastName || '',
          email: registrationData.email || personalInfo.email || '',
          mobile: registrationData.mobile || personalInfo.mobile || personalInfo.phone || '',
          organization: registrationData.organization || personalInfo.organization || '',
          category: registrationData.category || registrationData.categoryId || '',
          status: registrationData.status || 'registered',
          checkedIn: registrationData.checkedIn || false,
          paymentStatus: registrationData.paymentStatus || 'unpaid',
          address: personalInfo.address || '',
          country: personalInfo.country || '',
          dietaryRestrictions: personalInfo.dietaryRestrictions || '',
          // Add any custom fields here as needed
        });
        
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    
    if (eventId && registrationId) {
      fetchData();
    }
  }, [eventId, registrationId]);
  
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Handle different input types
    const inputValue = type === 'checkbox' ? checked : value;
    
    setFormData({
      ...formData,
      [name]: inputValue
    });
    
    // Clear error for this field if any
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    // Required fields
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    // Category validation
    if (!formData.category) newErrors.category = 'Category is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);
      
      // Prepare data for submission
      const updateData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        category: formData.category,
        status: formData.status,
        checkedIn: formData.checkedIn,
        paymentStatus: formData.paymentStatus,
        personalInfo: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          mobile: formData.mobile,
          organization: formData.organization,
          address: formData.address,
          country: formData.country,
          dietaryRestrictions: formData.dietaryRestrictions
        }
      };
      
      console.log('Submitting updated registration data:', updateData);
      
      // Call API to update registration
      const response = await registrationService.updateRegistration(eventId, registrationId, updateData);
      console.log('Update response:', response);
      
      if (response && response.success) {
        setSuccess('Registration updated successfully');
        
        // Navigate back to registration details after a short delay
        setTimeout(() => {
          navigate(`/events/${eventId}/registrations/${registrationId}`);
        }, 1500);
      } else {
        setError(`Failed to update registration: ${response?.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error updating registration:', err);
      setError(`Failed to update registration: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleCancel = () => {
    navigate(`/events/${eventId}/registrations/${registrationId}`);
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
        <span className="ml-2 text-gray-500">Loading registration data...</span>
      </div>
    );
  }
  
  if (error && !registration) {
    return (
      <div className="p-4">
        <Alert type="error" message={error} />
        <div className="mt-4">
          <Button
            variant="outline"
            onClick={() => navigate(`/events/${eventId}/registrations`)}
            leadingIcon={<ArrowLeftIcon className="h-4 w-4" />}
          >
            Back to Registrations
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 p-4">
      {/* Header with navigation */}
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/events/${eventId}/registrations/${registrationId}`)}
            leadingIcon={<ArrowLeftIcon className="h-4 w-4" />}
            className="mr-4"
          >
            Back to Details
          </Button>
          <h2 className="text-xl font-semibold">Edit Registration</h2>
        </div>
        
        <div className="text-sm text-gray-500">
          {registration?.registrationId}
        </div>
      </div>
      
      {/* Messages */}
      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}
      
      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-6">
          <Card title="Personal Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                required
                error={errors.firstName}
              />
              
              <Input
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                required
                error={errors.lastName}
              />
              
              <Input
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                error={errors.email}
              />
              
              <Input
                label="Mobile Number"
                name="mobile"
                value={formData.mobile}
                onChange={handleInputChange}
              />
              
              <Input
                label="Organization"
                name="organization"
                value={formData.organization}
                onChange={handleInputChange}
              />
              
              <Select
                label="Category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                options={categories.map(cat => ({
                  value: cat._id,
                  label: cat.name
                }))}
                required
                error={errors.category}
              />
              
              <Input
                label="Country"
                name="country"
                value={formData.country}
                onChange={handleInputChange}
              />
              
              <div className="md:col-span-2">
                <Textarea
                  label="Address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows={3}
                />
              </div>
              
              <div className="md:col-span-2">
                <Textarea
                  label="Dietary Restrictions"
                  name="dietaryRestrictions"
                  value={formData.dietaryRestrictions}
                  onChange={handleInputChange}
                  rows={2}
                />
              </div>
            </div>
          </Card>
          
          <Card title="Registration Status">
            <div className="space-y-4">
              <Select
                label="Status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                options={[
                  { value: 'registered', label: 'Registered' },
                  { value: 'approved', label: 'Approved' },
                  { value: 'rejected', label: 'Rejected' },
                  { value: 'waitlisted', label: 'Waitlisted' },
                  { value: 'cancelled', label: 'Cancelled' }
                ]}
              />
              
              <Switch
                label="Checked In"
                name="checkedIn"
                checked={formData.checkedIn}
                onChange={handleInputChange}
                description="Mark as checked in to the event"
              />
              
              <Select
                label="Payment Status"
                name="paymentStatus"
                value={formData.paymentStatus}
                onChange={handleInputChange}
                options={[
                  { value: 'unpaid', label: 'Unpaid' },
                  { value: 'paid', label: 'Paid' },
                  { value: 'refunded', label: 'Refunded' },
                  { value: 'free', label: 'Free Registration' }
                ]}
              />
            </div>
          </Card>
          
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              size="md"
              onClick={handleCancel}
              leadingIcon={<XMarkIcon className="h-4 w-4" />}
              disabled={submitting}
            >
              Cancel
            </Button>
            
            <Button
              variant="primary"
              size="md"
              type="submit"
              leadingIcon={<SaveIcon className="h-4 w-4" />}
              disabled={submitting}
              loading={submitting}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default RegistrationEdit; 