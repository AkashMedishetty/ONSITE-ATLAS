import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { eventService } from '../../services';
import { Card, Input, Textarea, Select, Button } from '../../components/common';

const EventForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    venue: {
      name: '',
      address: '',
      city: '',
      state: '',
      country: '',
      zipCode: ''
    },
    registrationSettings: {
      idPrefix: '',
      startNumber: 1,
      isOpen: true,
      allowOnsite: true
    },
    abstractSettings: {
      isOpen: false,
      deadline: '',
      maxLength: 500,
      allowEditing: true
    },
    status: 'draft'
  });
  
  const [loading, setLoading] = useState(isEditMode);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [submitting, setSubmitting] = useState(false);
  
  useEffect(() => {
    if (isEditMode) {
      const fetchEvent = async () => {
        try {
          setLoading(true);
          const response = await eventService.getEventById(id);
          console.log('Event data received:', response.data);
          
          // Format dates for input fields
          const event = {
            ...response.data,
            startDate: response.data.startDate ? new Date(response.data.startDate).toISOString().split('T')[0] : '',
            endDate: response.data.endDate ? new Date(response.data.endDate).toISOString().split('T')[0] : '',
            // Ensure venue data is properly structured
            venue: {
              name: response.data.venue?.name || '',
              address: response.data.venue?.address || '',
              city: response.data.venue?.city || '',
              state: response.data.venue?.state || '',
              country: response.data.venue?.country || '',
              zipCode: response.data.venue?.zipCode || ''
            },
            abstractSettings: {
              ...response.data.abstractSettings,
              deadline: response.data.abstractSettings?.deadline 
                ? new Date(response.data.abstractSettings.deadline).toISOString().split('T')[0] 
                : ''
            }
          };
          
          setFormData(event);
          setLoading(false);
        } catch (err) {
          console.error('Error fetching event:', err);
          setError(`Failed to fetch event details: ${err.message || 'Unknown error'}`);
          setLoading(false);
        }
      };
      
      fetchEvent();
    }
  }, [isEditMode, id]);
  
  const handleChange = (eOrValue, meta) => {
    if (eOrValue && eOrValue.target) {
      // Standard input event
      const { name, value, type, checked } = eOrValue.target;
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
    } else if (meta && meta.name) {
      // Custom Select: value, meta
      const { name } = meta;
      setFormData({
        ...formData,
        [name]: eOrValue
      });
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      console.log('Submitting form data:', formData);
      
      let response;
      if (isEditMode) {
        response = await eventService.updateEvent(id, formData);
      } else {
        response = await eventService.createEvent(formData);
      }
      
      console.log('Event saved successfully:', response);
      
      // Redirect to events list
      navigate('/events');
    } catch (err) {
      console.error('Error saving event:', err);
      setError(`Failed to save event: ${err.response?.data?.message || err.message || 'Unknown error'}`);
      setSubmitting(false);
    }
  };
  
  const renderVenueFields = () => {
    return (
      <Card title="Venue Information" className="mb-6">
        <div className="space-y-4">
          <Input
            label="Venue Name"
            name="venue.name"
            value={formData.venue?.name || ''}
            onChange={handleChange}
            placeholder="Enter venue name"
            required
          />
          
          <Input
            label="Address"
            name="venue.address"
            value={formData.venue?.address || ''}
            onChange={handleChange}
            placeholder="Enter street address"
            required
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="City"
              name="venue.city"
              value={formData.venue?.city || ''}
              onChange={handleChange}
              placeholder="Enter city"
              required
            />
            
            <Input
              label="State/Province"
              name="venue.state"
              value={formData.venue?.state || ''}
              onChange={handleChange}
              placeholder="Enter state or province"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Country"
              name="venue.country"
              value={formData.venue?.country || ''}
              onChange={handleChange}
              placeholder="Enter country"
              required
            />
            
            <Input
              label="Postal/Zip Code"
              name="venue.zipCode"
              value={formData.venue?.zipCode || ''}
              onChange={handleChange}
              placeholder="Enter postal or zip code"
            />
          </div>
        </div>
      </Card>
    );
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-soft p-6"
      >
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-primary-700">
            {isEditMode ? 'Edit Event' : 'Create New Event'}
          </h1>
          <p className="text-gray-500 mt-2">
            {isEditMode ? 'Update your event details' : 'Fill in the details to create a new event'}
          </p>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
            <div className="space-y-6">
            <Card title="Basic Information" className="mb-6">
              <div className="space-y-4">
                <Input
                  label="Event Name"
                  name="name"
                  value={formData.name || ''}
                  onChange={handleChange}
                  placeholder="Enter event name"
                  required
                />
                
                <Textarea
                  label="Description"
                  name="description"
                  value={formData.description || ''}
                  onChange={handleChange}
                  placeholder="Provide a short description of your event"
                  rows={4}
                />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    type="date"
                    label="Start Date"
                    name="startDate"
                    value={formData.startDate || ''}
                    onChange={handleChange}
                    required
                  />
                  
                  <Input
                    type="date"
                    label="End Date"
                    name="endDate"
                    value={formData.endDate || ''}
                    onChange={handleChange}
                    required
                  />
              </div>
              
                <Select
                  label="Status"
                  name="status"
                  value={formData.status || 'draft'}
                  onChange={handleChange}
                  options={[
                    { value: 'draft', label: 'Draft' },
                    { value: 'published', label: 'Published' },
                    { value: 'archived', label: 'Archived' }
                  ]}
                />
              </div>
            </Card>
            
            {renderVenueFields()}
            
            <div className="flex justify-end space-x-3 mt-6">
              <Button
              type="button"
                variant="outline"
              onClick={() => navigate('/events')}
                disabled={submitting}
            >
              Cancel
              </Button>
              
              <Button
              type="submit"
                variant="primary"
              disabled={submitting}
            >
                {submitting ? 'Saving...' : isEditMode ? 'Update Event' : 'Create Event'}
              </Button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default EventForm; 