import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Input, Button, Textarea, Select, Spinner, Alert as CustomAlert } from '../../components/common';
import sponsorService from '../../services/sponsorService';
// Removed eventService import as sponsor ID generation is now backend's responsibility
import { toast } from 'react-toastify';

const SponsorForm = ({ eventRegPrefix, sponsorIdForEdit }) => {
  // const { id: eventId, sponsorDbId } = useParams(); // Old way
  const { id: eventIdFromParams, sponsorDbId: sponsorDbIdFromParams } = useParams();
  const navigate = useNavigate();

  const eventId = eventIdFromParams; // Assuming eventId always comes from params for this form's context
  const sponsorDbId = sponsorIdForEdit || sponsorDbIdFromParams; // Prefer prop if available

  const isEditMode = !!sponsorDbId;

  console.log("[SponsorForm] Mounted. EventID:", eventId, "sponsorIdForEdit (prop):", sponsorIdForEdit, "sponsorDbIdFromParams:", sponsorDbIdFromParams, "Final sponsorDbId:", sponsorDbId, "IsEditMode:", isEditMode);

  const initialFormData = {
    companyName: '',
    authorizedPerson: '',
    email: '',
    displayPhoneNumber: '', // New field for actual contact number
    contactPhone: '', // This is for login password, will be blank in edit mode
    sponsoringAmount: '',
    registrantAllotment: 0,
    description: '',
    status: 'Active', // Default status, updated options
  };

  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const statusOptions = [
    { value: 'Active', label: 'Active' },
    { value: 'Inactive', label: 'Inactive' },
  ];

  const fetchSponsorDetails = useCallback(async () => {
    if (isEditMode && eventId && sponsorDbId) {
      setLoading(true);
      setError(null);
      console.log(`Edit mode: Attempting to load sponsor ${sponsorDbId} for event ${eventId}`);
      try {
        const response = await sponsorService.getSponsorById(eventId, sponsorDbId);
        if (response.success && response.data) {
          const sponsorData = response.data;
          setFormData({
            companyName: sponsorData.companyName || '',
            authorizedPerson: sponsorData.authorizedPerson || '',
            email: sponsorData.email || '',
            displayPhoneNumber: sponsorData.displayPhoneNumber || '', // Populate display number
            contactPhone: '', // Keep login password field blank in edit mode
            sponsoringAmount: sponsorData.sponsoringAmount === null || sponsorData.sponsoringAmount === undefined ? '' : sponsorData.sponsoringAmount,
            registrantAllotment: sponsorData.registrantAllotment || 0,
            description: sponsorData.description || '',
            status: sponsorData.status || 'Active',
          });
          console.log("Loaded sponsor data for editing:", sponsorData);
        } else {
          setError(response.message || 'Failed to load sponsor data for editing.');
          toast.error(response.message || 'Failed to load sponsor data for editing.');
        }
      } catch (err) {
        console.error("Error loading sponsor for editing:", err);
        setError(err.message || 'Error loading sponsor details.');
        toast.error(err.message || 'Error loading sponsor details.');
      }
      setLoading(false);
    }
  }, [eventId, sponsorDbId, isEditMode]);

  useEffect(() => {
    fetchSponsorDetails();
  }, [fetchSponsorDetails]);

  const handleChange = (e) => {
    // If the event is from the custom Select, e will be the value directly.
    // If it's a standard event, it will have e.target.
    const name = e.target?.name || 'status'; // Special handling for status Select
    let value = e.target?.value === undefined ? e : e.target.value; 
    const type = e.target?.type;
    const checked = e.target?.checked;

    let processedValue = value;

    // Apply 10-digit numeric cleaning for both phone fields
    if (name === 'contactPhone' || name === 'displayPhoneNumber') {
      processedValue = String(value).replace(/\\D/g, '').slice(0, 10);
    } else if (type === 'number') {
      processedValue = value === '' ? '' : (isNaN(parseFloat(value)) ? formData[name] : parseFloat(value));
    } else if (type === 'checkbox') {
      processedValue = checked;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const cleanedLoginPhone = formData.contactPhone.replace(/\\D/g, '');
    const cleanedDisplayPhone = formData.displayPhoneNumber.replace(/\\D/g, '');

    if (!formData.companyName || !formData.authorizedPerson || !formData.email) {
      setError('Please fill in all mandatory fields: Company Name, Authorized Person, Email.');
      toast.error('Please fill in all mandatory fields: Company Name, Authorized Person, Email.');
      return;
    }

    console.log("[SponsorForm handleSubmit] Email for validation:", `'${formData.email}'`);
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      setError('Please enter a valid email address.');
      toast.error('Please enter a valid email address.');
      return;
    }

    if (!isEditMode && !cleanedLoginPhone) {
      setError('Login Phone / Password is required for new sponsors.');
      toast.error('Login Phone / Password is required for new sponsors.');
      return;
    }
    
    if (cleanedLoginPhone) { // Validate login phone only if it's provided (for new or to change password)
      if (cleanedLoginPhone.length !== 10) {
        setError('Login Phone / Password must be exactly 10 digits if provided.');
        toast.error('Login Phone / Password must be exactly 10 digits if provided.');
        return;
      }
    } else if (!isEditMode) { 
      setError('Login Phone / Password is required for new sponsors.'); // Should be caught above
      toast.error('Login Phone / Password is required for new sponsors.');
      return;
    }

    // Validate displayPhoneNumber if provided
    if (cleanedDisplayPhone && cleanedDisplayPhone.length !== 10) {
        setError('Display Phone Number must be exactly 10 digits if provided.');
        toast.error('Display Phone Number must be exactly 10 digits if provided.');
        return;
    }
    
    if (formData.registrantAllotment === '' || formData.registrantAllotment < 0) {
        setError('No. of Registrants must be a non-negative number.');
        toast.error('No. of Registrants must be a non-negative number.');
        return;
    }
    if (!formData.status) {
        setError('Please select a status for the sponsor.');
        toast.error('Please select a status for the sponsor.');
        return;
    }

    setLoading(true);
    
    const payload = {
      companyName: formData.companyName,
      authorizedPerson: formData.authorizedPerson,
      email: formData.email,
      displayPhoneNumber: cleanedDisplayPhone || null, // Send cleaned display phone, or null if empty
      sponsoringAmount: formData.sponsoringAmount === '' || formData.sponsoringAmount === null ? null : parseFloat(formData.sponsoringAmount),
      registrantAllotment: parseInt(formData.registrantAllotment, 10) || 0,
      description: formData.description || null,
      status: formData.status,
    };

    // Conditionally add contactPhone to payload
    if (!isEditMode) { // Create mode - login contactPhone is mandatory
      payload.contactPhone = cleanedLoginPhone;
    } else if (cleanedLoginPhone) { // Edit mode - login contactPhone is provided, so update it
      payload.contactPhone = cleanedLoginPhone;
    }
    // If isEditMode and cleanedLoginPhone is empty, contactPhone is not added to payload for login,
    // so backend will not update it.

    try {
      let response;
      if (isEditMode) {
        console.log("Attempting to update sponsor. EventId:", eventId, "SponsorDB_ID:", sponsorDbId, "Payload:", payload);
        response = await sponsorService.updateSponsor(eventId, sponsorDbId, payload);
      } else {
        console.log("Attempting to create sponsor. EventId:", eventId, "Payload:", payload);
        response = await sponsorService.createSponsor(eventId, payload);
      }

      if (response.success) {
        toast.success(response.message || (isEditMode ? 'Sponsor updated successfully!' : 'Sponsor created successfully!'));
        navigate(`/events/${eventId}/sponsors`, { state: { refreshSponsors: Date.now() } });
      } else {
        setError(response.message || 'An error occurred.');
        toast.error(response.message || 'An error occurred.');
      }
    } catch (err) {
      console.error("Sponsor form submission error:", err);
      const errMsg = err.data?.message || err.message || 'An unexpected error occurred.';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode && !formData.companyName) { 
    return (
        <div className="container mx-auto px-4 py-8 text-center">
            <Spinner size="lg" /> <p className="ml-2">Loading sponsor details...</p>
        </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          {isEditMode ? 'Edit Sponsor' : 'Add New Sponsor'}
        </h1>
        <Link
          to={`/events/${eventId}/sponsors`}
          className="text-sm text-blue-600 hover:underline"
        >
          &larr; Back to Sponsors List
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="bg-white shadow-xl rounded-lg p-8 space-y-6">
        {error && (
          <CustomAlert variant="danger" title="Form Error">
            {error}
          </CustomAlert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
              Company Name <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              name="companyName"
              id="companyName"
              value={formData.companyName}
              onChange={handleChange}
              placeholder="e.g., Innovatech Solutions"
              required
              className="w-full"
            />
          </div>
          <div>
            <label htmlFor="authorizedPerson" className="block text-sm font-medium text-gray-700 mb-1">
              Authorized Person <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              name="authorizedPerson"
              id="authorizedPerson"
              value={formData.authorizedPerson}
              onChange={handleChange}
              placeholder="e.g., Jane Doe"
              required
              className="w-full"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <Input
              type="email"
              name="email"
              id="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="e.g., jane.doe@example.com"
              required
              className="w-full"
            />
          </div>
          <div>
            <label htmlFor="displayPhoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
              Display Phone Number <span className="text-gray-500 text-xs">(10 digits, optional)</span>
            </label>
            <Input
              type="tel"
              name="displayPhoneNumber"
              id="displayPhoneNumber"
              value={formData.displayPhoneNumber}
              onChange={handleChange}
              placeholder="e.g., 1234567890"
              className="w-full"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700 mb-1">
              Login Phone / Password <span className="text-red-500">*</span> <span className="text-gray-500 text-xs">(10 digits)</span>
            </label>
            <Input
              type="tel"
              name="contactPhone"
              id="contactPhone"
              value={formData.contactPhone}
              onChange={handleChange}
              placeholder={isEditMode ? "New Password (10 digits, leave blank to keep current)" : "Login Password (10 digits)"}
              className="w-full"
            />
          </div>
          <div>
            <label htmlFor="sponsoringAmount" className="block text-sm font-medium text-gray-700 mb-1">
              Sponsoring Amount
            </label>
            <Input
              type="number"
              name="sponsoringAmount"
              id="sponsoringAmount"
              value={formData.sponsoringAmount}
              onChange={handleChange}
              placeholder="e.g., 5000"
              min="0"
              step="any"
              className="w-full"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="registrantAllotment" className="block text-sm font-medium text-gray-700 mb-1">
              Registrant Allotment <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              name="registrantAllotment"
              id="registrantAllotment"
              value={formData.registrantAllotment}
              onChange={handleChange}
              placeholder="e.g., 5"
              min="0"
              required
              className="w-full"
            />
          </div>
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status <span className="text-red-500">*</span>
            </label>
            <Select 
              name="status" 
              id="status" 
              value={formData.status} 
              onChange={handleChange} 
              options={statusOptions} 
              required 
              className="w-full"
              placeholder="Select a status"
            />
          </div>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description / Notes
          </label>
          <Textarea 
            name="description" 
            id="description" 
            value={formData.description} 
            onChange={handleChange} 
            rows={4} 
            placeholder="Brief description about the sponsor or any internal notes..."
            className="w-full"
          />
        </div>

        <div className="flex items-center justify-end pt-6 border-t border-gray-200 mt-6">
          <Link
            to={`/events/${eventId}/sponsors`}
            className="text-gray-600 hover:text-gray-900 px-4 py-2 rounded-md text-sm font-medium mr-3"
          >
            Cancel
          </Link>
          <Button type="submit" variant="primary" disabled={loading || (isEditMode && !formData.companyName && loading) }>
            {loading ? (isEditMode ? 'Updating Sponsor...' : 'Creating Sponsor...') : (isEditMode ? 'Save Changes' : 'Create Sponsor')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SponsorForm; 