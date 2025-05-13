import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
// Assuming a userService that will handle the API call
import userService from '../../services/userService'; 
import { Button, Input, Select, Card, Spinner } from '../../components/common'; // Assuming common components

const UserCreate = ({
  eventId = null, // New prop for event context
  onUserCreated, // New prop for callback on creation
  onCancel,      // New prop for cancel action in event context
  isEventContext = false // New prop to determine context
}) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user', // Default role, might want to make this configurable or smarter in event context
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [availableRoles] = useState([
    { value: 'admin', label: 'Admin' },
    { value: 'user', label: 'User' },
    { value: 'reviewer', label: 'Reviewer' },
    { value: 'staff', label: 'Staff' },
    { value: 'manager', label: 'Manager' },
    { value: 'sponsor', label: 'Sponsor' },
  ]);

  const handleChange = (eventOrValue, fieldNameFromSelect) => {
    // If eventOrValue has a target, it's a standard event (e.g., from Input)
    if (eventOrValue && eventOrValue.target) {
      const { name, value } = eventOrValue.target;
      setFormData(prevState => ({
        ...prevState,
        [name]: value,
      }));
    } 
    // Otherwise, assume it's a direct value (e.g., from Select) and use fieldNameFromSelect
    else if (fieldNameFromSelect) {
      setFormData(prevState => ({
        ...prevState,
        [fieldNameFromSelect]: eventOrValue, // eventOrValue is the direct selected value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.name || !formData.email || !formData.password || !formData.role) {
      toast.error('Please fill in all fields.');
      return;
    }

    // Basic email validation
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
        toast.error('Please enter a valid email address.');
        return;
    }

    // Basic password validation (e.g., minimum length)
    if (formData.password.length < 6) {
        toast.error('Password must be at least 6 characters long.');
        return;
    }

    setLoading(true);
    try {
      const payload = isEventContext && eventId ? { ...formData, eventId } : formData;
      console.log('UserCreate: Sending payload:', payload);
      const response = await userService.createUser(payload);
      
      toast.success(response?.data?.message || 'User created successfully!');
      
      if (isEventContext && onUserCreated) {
        onUserCreated(response?.data?.data);
      } else {
        navigate('/users');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create user.';
      toast.error(errorMessage);
      setError(errorMessage);
      console.error('Create user error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBackOrCancel = () => {
    if (isEventContext && onCancel) {
      onCancel();
    } else {
      navigate('/users');
    }
  };

  return (
    <div className={`container mx-auto ${isEventContext ? 'p-0' : 'p-4'}`}> {/* No padding if in context*/}
      <Card className={isEventContext ? 'shadow-none border-0' : ''}> {/* No shadow/border if in context*/}
        <div className={`flex justify-between items-center ${isEventContext ? 'mb-4' : 'mb-6'}`}>
          <h1 className={`font-bold ${isEventContext ? 'text-xl' : 'text-2xl'}`}>Create User</h1>
          {!isEventContext && (
            <Button variant="outline" onClick={handleBackOrCancel}>
              Back to Users
            </Button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <Input
              type="text"
              name="name"
              id="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter full name"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <Input
              type="email"
              name="email"
              id="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter email address"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <Input
              type="password"
              name="password"
              id="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter password (min. 6 characters)"
              required
            />
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <Select
              name="role"
              id="role"
              value={formData.role}
              onChange={(value) => handleChange(value, 'role')}
              options={availableRoles}
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          <div className={`flex items-center justify-end space-x-3 ${isEventContext ? 'pt-2' : 'pt-4 border-t border-gray-200'}`}>
            <Button
              type="button"
              variant="light"
              onClick={handleBackOrCancel} // Unified cancel/back logic
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              leftIcon={loading ? <Spinner size="sm" color="white" /> : null}
            >
              {loading ? 'Creating...' : 'Create User'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default UserCreate; 