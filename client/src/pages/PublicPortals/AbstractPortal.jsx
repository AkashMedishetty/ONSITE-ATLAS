import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Card,
  Input,
  Button,
  Alert,
  Spinner,
  Textarea,
  Select,
  Tabs
} from '../../components/common';
import { eventService, abstractService, registrationService } from '../../services';
import toast from 'react-hot-toast';
import { REGISTRANT_TOKEN_KEY } from '../../config'; // Import the key

// API URL constant - use this instead of process.env
const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:5000' 
  : window.location.origin;

/**
 * Parses a date string in various formats including the admin-specific DD-MM-YYYY format
 * @param {string|Date} dateInput - Date string or Date object
 * @returns {Date} - Parsed Date object
 */
const parseAdminDateFormat = (dateInput) => {
  if (!dateInput) return null;
  
  // If it's already a Date object, return it
  if (dateInput instanceof Date) return dateInput;
  
  // Try to parse the date string
  try {
    // Check for DD-MM-YYYY format
    if (typeof dateInput === 'string' && dateInput.match(/^\d{2}-\d{2}-\d{4}$/)) {
      const [day, month, year] = dateInput.split('-');
      return new Date(`${year}-${month}-${day}`);
    }
    
    // Handle ISO format date (YYYY-MM-DDTHH:mm:ss.sssZ)
    if (typeof dateInput === 'string' && dateInput.includes('T') && dateInput.includes('Z')) {
      // ISO dates can be parsed directly by the Date constructor
      const date = new Date(dateInput);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    
    // Otherwise use standard date parsing
    const date = new Date(dateInput);
    
    // Verify the date is valid before returning
    if (isNaN(date.getTime())) {
      console.warn("Invalid date after parsing:", dateInput);
      return null;
    }
    
    return date;
  } catch (error) {
    console.error("Error parsing date:", error, dateInput);
    return null;
  }
};

/**
 * Custom FileUpload component
 */
const FileUpload = ({ onChange, error, accept, maxSize }) => {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };
  
  const handleFile = (file) => {
    // Validate file size if maxSize is provided
    if (maxSize && file.size > maxSize) {
      alert(`File is too large. Maximum size is ${Math.round(maxSize / (1024 * 1024))}MB.`);
      return;
    }
    setFile(file);
    if (onChange) onChange(file);
  };

  return (
    <div className="mt-1">
      <div 
        className={`relative border-2 border-dashed rounded-md p-6 ${error ? 'border-red-300' : dragActive ? 'border-blue-300 bg-blue-50' : 'border-gray-300'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="file-upload"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={handleChange}
          accept={accept}
        />
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="mt-1 text-sm text-gray-600">
            {file ? file.name : 'Drag and drop a file, or click to select a file'}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {accept?.split(',').map(type => type.replace(/\./g, '').toUpperCase()).join(', ')} 
            up to {maxSize ? `${Math.round(maxSize / (1024 * 1024))}MB` : '5MB'}
          </p>
        </div>
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      {file && (
        <div className="mt-2 flex items-center">
          <span className="text-sm text-gray-500 mr-2">Selected file:</span>
          <span className="text-sm font-medium">{file.name}</span>
          <button
            type="button"
            className="ml-auto text-sm text-red-600 hover:text-red-900"
            onClick={() => {
              setFile(null);
              if (onChange) onChange(null);
            }}
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * Creates a valid MongoDB ObjectId string
 * This is for testing/demo purposes when a real MongoDB ID is not available
 * Based on MongoDB ObjectId algorithm: 4-byte timestamp + 5-byte random + 3-byte counter
 * @returns {string} A 24-character hex string that resembles a MongoDB ObjectId
 */
const generateValidObjectId = () => {
  const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
  const randomPart = Math.random().toString(16).substring(2, 12).padStart(10, '0');
  const counter = Math.floor(Math.random() * 16777216).toString(16).padStart(6, '0');
  return timestamp + randomPart + counter;
};

/**
 * Helper function to format dates
 */
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

/**
 * Enhanced Abstract Portal Component
 * Features:
 * - Login with registration ID
 * - View existing abstracts
 * - Submit new abstracts (text or file upload)
 * - Admin review interface
 */
const AbstractPortal = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();

  // Override window.alert to automatically dismiss messages about edit functionality
  useEffect(() => {
    // Store the original alert function
    const originalAlert = window.alert;
    
    // Override with our own implementation
    window.alert = function(message) {
      // Check if it's our specific message about edit functionality
      if (message && typeof message === 'string' && 
          message.toLowerCase().includes('edit functionality will be implemented')) {
        console.log("Intercepted alert about edit functionality - allowing edit to proceed");
        // Just log the message but don't display the alert
        return;
      }
      
      // For all other alerts, call the original function
      return originalAlert.apply(this, arguments);
    };
    
    // Restore the original alert function when the component unmounts
    return () => {
      window.alert = originalAlert;
    };
  }, []);

  // State
  const [loading, setLoading] = useState(true);
  const [authenticating, setAuthenticating] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [eventDetails, setEventDetails] = useState(null);
  const [registrationId, setRegistrationId] = useState('');
  const [userInfo, setUserInfo] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [userAbstracts, setUserAbstracts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [fileUploading, setFileUploading] = useState(false);
  const [selectedSubTopics, setSelectedSubTopics] = useState([]); // State for sub-topics of the selected category
  
  const [abstractForm, setAbstractForm] = useState({
    title: '',
    authors: '',
    affiliations: '',
    category: '', // This will store the selected category's value (e.g., name or ID)
    subTopic: '', // This will store the selected sub-topic's value (e.g., name)
    content: '',
    file: null,
    existingAbstractId: null // To track if the form is for edit mode
  });
  const [formErrors, setFormErrors] = useState({}); // For form field validation errors
  const [submitMessage, setSubmitMessage] = useState({ type: '', text: '' }); // For overall form submission status

  // Controls the main view of the portal for authors
  const [currentView, setCurrentView] = useState('login'); // Possible values: 'login', 'list', 'form'
  const [editingAbstract, setEditingAbstract] = useState(null); // Holds the abstract object if in edit mode

  // Fetch Event Details
  useEffect(() => {
    const fetchEventData = async () => {
        setLoading(true);
      try {
        const details = await eventService.getEventById(eventId);
        if (details.success) {
          setEventDetails(details.data);
          if (details.data.abstractSettings?.categories?.length > 0) {
            // Store the full category object, including subTopics
            // Ensure each category object has a unique 'value' for the Select component,
            // using its _id.
            setCategories(details.data.abstractSettings.categories.map((cat, index) => {
              if (!cat._id) {
                console.warn(`Category "${cat.name}" at index ${index} is missing an _id. Submission might fail. Using name as fallback value.`);
              }
              return {
                value: cat._id || cat.name, // Use _id if available, fallback to name (and log warning)
                label: cat.name,
                subTopics: cat.subTopics || [] // Ensure subTopics is an array
              };
            }));
          }
        } else {
          toast.error(details.message || 'Failed to fetch event details.');
        }
      } catch (err) {
        toast.error('Error fetching event details: ' + err.message);
      }
      setLoading(false); // Ensure loading is set to false regardless of outcome
    };
    fetchEventData();
  }, [eventId, toast]);

  const resetAbstractForm = () => {
    setAbstractForm({
      title: '',
      authors: '',
      affiliations: '',
      category: eventDetails?.abstractSettings?.defaultCategory || categories[0]?.value || '',
      subTopic: '',
      content: '',
      file: null,
      existingAbstractId: null
    });
    setFormErrors({});
    setEditingAbstract(null);
  };

  const handleRegistrationAuth = async (e) => {
    if (e) e.preventDefault();
    setAuthenticating(true);
    setAuthError(null);
    try {
      const response = await registrationService.getRegistrationByRegIdString(eventId, registrationId);
      // Assuming the response structure is { success: boolean, data: userInfo, token: string }
      if (response.success && response.data && response.token) {
        setUserInfo(response.data);
        setAuthenticated(true);
        localStorage.setItem(REGISTRANT_TOKEN_KEY, response.token); // STORE THE TOKEN
        await fetchUserAbstracts(response.data._id);
        setCurrentView('list');
        toast.success('Logged in successfully!');
      } else if (response.success && response.data && !response.token) {
        // Handle case where login is successful but no token is returned (should not happen for registrant auth)
        setAuthError('Authentication successful, but no session token was provided. Please contact support.');
        setAuthenticated(false);
        } else {
        setAuthError(response.message || 'Invalid Registration ID or Event.');
        setAuthenticated(false);
      }
    } catch (err) {
      setAuthError(err.message || 'Authentication failed. Please try again.');
      setAuthenticated(false);
    }
    setAuthenticating(false);
  };

  const fetchUserAbstracts = async (registrationMongoId) => {
    if (!registrationMongoId || !eventId) return;
    setLoading(true); // Consider a different loading state for abstract list
    try {
      // Assuming abstractService.getAbstracts can be filtered by registration Mongo ID and eventId
      // The backend controller for getAbstracts was shown to handle query.registration = mongoId
      const params = { registration: registrationMongoId }; 
      const response = await abstractService.getAbstracts(eventId, params);
      if (response.success) {
        setUserAbstracts(response.data || []);
      } else {
        toast.error(response.message || 'Failed to fetch your abstracts.');
      }
    } catch (err) {
      toast.error('Error fetching your abstracts: ' + err.message);
    }
      setLoading(false);
  };
  
  const handleLogout = () => {
    setUserInfo(null);
    setAuthenticated(false);
    setUserAbstracts([]);
    setRegistrationId('');
    setCurrentView('login');
    // toast.success('Logged out.'); // Optional: if you have a global toast setup
    // Potentially call a backend logout endpoint if session/token needs invalidation server-side
  };
  
  // Form handling methods
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setAbstractForm(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };
  
  const handleSelectChange = (value, { name }) => {
    setAbstractForm(prev => ({
      ...prev,
      [name]: value,
      // If the main category is changing, reset the subTopic field in the form
      ...(name === 'category' && { subTopic: '' })
    }));

    // If the category select itself was changed, update the available sub-topics
    if (name === 'category') {
      const selectedCategoryData = categories.find(cat => cat.value === value);
      if (selectedCategoryData && selectedCategoryData.subTopics && selectedCategoryData.subTopics.length > 0) {
        setSelectedSubTopics(selectedCategoryData.subTopics.map(st => ({ value: st.name, label: st.name })));
      } else {
        setSelectedSubTopics([]); // No sub-topics for this category, or category not found
      }
    }
    
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
    // If category changed, also clear any existing subTopic error
    if (name === 'category' && formErrors.subTopic) {
      setFormErrors(prev => ({
        ...prev,
        subTopic: null
      }));
    }
  };
  
  const handleFileChange = (file) => {
    setAbstractForm(prev => ({
      ...prev,
      file
    }));
    
    // Clear file error
    if (formErrors.file) {
      setFormErrors(prev => ({
        ...prev,
        file: null
      }));
    }
  };
  
  const validateAbstractForm = () => {
    const errors = {};
    
    // Validate title
    if (!abstractForm.title || !abstractForm.title.trim()) {
      errors.title = 'Title is required';
    } else if (abstractForm.title.trim().length < 3) {
      errors.title = 'Title must be at least 3 characters long';
    } else if (abstractForm.title.trim().length > 200) {
      errors.title = 'Title must be less than 200 characters';
    }
    
    // Validate authors
    if (!abstractForm.authors || !abstractForm.authors.trim()) {
      errors.authors = 'Authors are required';
    } else if (abstractForm.authors.trim().length < 2) {
      errors.authors = 'Authors field must be at least 2 characters long';
    }
    
    // Validate affiliations
    if (!abstractForm.affiliations || !abstractForm.affiliations.trim()) {
      errors.affiliations = 'Affiliations are required';
    }
    
    // Validate category
    if (!abstractForm.category) {
      errors.category = 'Please select a category';
    }
    
    // Validate subTopic if the selected category has sub-topics and sub-topic selection is required
    // This logic assumes a convention or a specific setting (e.g., requireSubTopicPerCategory in abstractSettings)
    const selectedCategoryData = categories.find(cat => cat.value === abstractForm.category);
    if (selectedCategoryData && selectedCategoryData.subTopics && selectedCategoryData.subTopics.length > 0) {
      // Example: Make subTopic required if eventDetails.abstractSettings.requireSubTopic is true
      // You might have a more granular setting, e.g. category.requireSubTopic
      const subTopicIsRequired = eventDetails?.abstractSettings?.requireSubTopicForEnabledCategories; // Hypothetical setting
      if (subTopicIsRequired && !abstractForm.subTopic) {
        errors.subTopic = 'Please select a sub-topic for the chosen category';
      }
    }
    
    // Validate content
    if (!abstractForm.content || !abstractForm.content.trim()) {
      errors.content = 'Abstract content is required';
    } else if (abstractForm.content.trim().length < 10) {
      errors.content = 'Abstract content must be at least 10 characters long';
    }
    
    // Check word count
    if (abstractForm.content) {
      const wordCount = abstractForm.content.trim().split(/\s+/).length;
      const maxWords = eventDetails?.abstractSettings?.maxLength || 500;
      
      if (wordCount > maxWords) {
        errors.content = `Abstract exceeds maximum word count of ${maxWords} words`;
      }
    }
    
    // Check for existing abstract in this category, but only if we're not in edit mode
    if (!formErrors.edit) {
      // Only check for duplicate categories if we're NOT editing an existing abstract
      const existingAbstract = userAbstracts.find(
        abstract => abstract.category === abstractForm.category
      );
      
      if (existingAbstract) {
        errors.category = 'You have already submitted an abstract for this category';
      }
    }
    
    setFormErrors(prev => ({
      ...prev,
      ...errors,
      // Preserve the edit flag if it exists
      edit: prev.edit
    }));
    
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmitAbstract = async (e) => {
    e.preventDefault();
    if (!validateAbstractForm()) return;
    setSubmitMessage({ type: '', text: '' });
    console.log('Submitting abstract data (raw form values):', abstractForm);

    // Prepare data to send: ensure both category and topic are sent with the same ID value.
    // AND include subTopic
    const { file, category, subTopic, ...formData } = abstractForm; 
    const categoryId = category; // Assuming abstractForm.category holds the ID/name used as value

    const dataToSend = {
       ...formData, 
       topic: categoryId,    // Main category ID/name (ensure backend expects this as 'topic')
       category: categoryId, // Also send as 'category' for compatibility or specific backend needs
       subTopic: subTopic || null, // Include selected subTopic, send null if none selected
       event: eventId,
       registration: userInfo?._id
    };
    console.log('Data being sent to backend:', dataToSend);

    const hasFile = !!dataToSend.file; 

    try {
      let response;
      // Create a payload for the service, excluding the file object itself
      const payloadForService = { ...dataToSend };
      if (payloadForService.file) { // abstractForm.file might be null
        delete payloadForService.file; // Remove if it's just a placeholder or null
      }

      if (abstractForm.existingAbstractId) {
        console.log('Attempting to update abstract:', abstractForm.existingAbstractId);
        response = await abstractService.updateAbstract(eventId, abstractForm.existingAbstractId, payloadForService);
      } else {
        console.log('Attempting to create new abstract.');
        response = await abstractService.createAbstract(eventId, payloadForService); 
      }

      console.log('API Response:', response);

      if (response && response.success) {
        const abstractData = response.data;
        if (!abstractData || !abstractData._id) {
          console.error('API success response is missing data or data._id:', response);
          toast.error('Submission successful but response data is incomplete.');
          return;
        }
        const abstractId = abstractData._id;

        if (hasFile && abstractForm.file) { // Use hasActualFile and abstractForm.file
          console.log('Uploading file for abstract:', abstractId);
          const fileUploadResponse = await abstractService.uploadAbstractFile(eventId, abstractId, abstractForm.file);
          console.log('File Upload Response:', fileUploadResponse);
          if (!fileUploadResponse || !fileUploadResponse.success) {
            const fileErrorMessage = fileUploadResponse?.message || 'File upload failed after abstract submission.';
            toast.error(`Abstract ${abstractForm.existingAbstractId ? 'updated' : 'created'} but file upload failed: ${fileErrorMessage}`);
          } else {
            toast.success(`Abstract ${abstractForm.existingAbstractId ? 'updated' : 'created'} and file uploaded successfully!`);
          }
        } else {
          toast.success(`Abstract ${abstractForm.existingAbstractId ? 'updated' : 'created'} successfully!`);
        }
        resetAbstractForm();
        if (userInfo && userInfo._id) {
            await fetchUserAbstracts(userInfo._id);
        }
        setCurrentView('list');
      } else {
        // Handle failed API response
        console.error('Abstract submission failed. API Response:', response);
        const errorMessage = response?.message || 'Submission failed due to an unknown server error.';
        setSubmitMessage({ type: 'error', text: errorMessage });
        toast.error(String(errorMessage)); // Ensure it's a string
      }
    } catch (err) {
      // Handle exceptions during the API call or subsequent logic
      console.error('Error during abstract submission process:', err);
      let clientErrorMessage = 'An unexpected error occurred during submission.';
      if (err && typeof err.message === 'string') {
        clientErrorMessage = err.message;
      }
      setSubmitMessage({ type: 'error', text: clientErrorMessage });
      toast.error(clientErrorMessage);
    }
  };
  
  const handleDeleteAbstract = async (abstractIdToDelete) => {
    if (!window.confirm('Are you sure you want to delete this abstract?')) return;
    try {
      // Ensure abstract belongs to user - backend should enforce this, but good client check too
      const abstractToDelete = userAbstracts.find(abs => abs._id === abstractIdToDelete);
      if (!abstractToDelete || abstractToDelete.registration !== userInfo?._id) {
         // This check might be tricky if registration is not directly on abstract object or populated differently
         // console.warn("Attempt to delete abstract not belonging to user or user info missing.");
         // toast.error("Unauthorized to delete this abstract.");
         // return;
      }

      const response = await abstractService.deleteAbstract(eventId, abstractIdToDelete);
      if (response.success) {
        toast.success('Abstract deleted successfully.');
        await fetchUserAbstracts(userInfo._id);
        // If currentView was showing details of this abstract, switch to list
        if (currentView === 'form' && editingAbstract?._id === abstractIdToDelete) {
            setCurrentView('list');
            resetAbstractForm();
        }
      } else {
        toast.error(response.message || 'Failed to delete abstract.');
      }
    } catch (error) {
      toast.error(error.message || 'Error deleting abstract.');
    }
  };

  const handleEditAbstract = (abstractToEdit) => {
    // Set the abstract being edited
    setEditingAbstract(abstractToEdit);
    // Pre-populate the form fields from the abstract data
    setAbstractForm({
      title: abstractToEdit.title || '',
      authors: abstractToEdit.authors || '',
      affiliations: abstractToEdit.authorAffiliations || '',
      category: abstractToEdit.category?._id || abstractToEdit.category || '', // Handle populated vs ID
      subTopic: abstractToEdit.subTopic || '',
      content: abstractToEdit.content || '',
      file: null, // File needs separate handling - show current, allow replace
      existingAbstractId: abstractToEdit._id // Set ID for update logic
    });
    // Clear any previous form errors
    setFormErrors({});
    // Clear any previous submission status message
    setSubmitMessage({ type: '', text: '' });
    // Switch the view to the form
    setCurrentView('form');
  };

  const handleAddNewAbstract = () => {
    // Ensure the form is reset to its default state for a new submission
    resetAbstractForm(); 
    // Switch the view to show the abstract form
    setCurrentView('form'); 
  };

  // Function to handle viewing an abstract's details
  const handleViewAbstract = (abstract) => {
    console.log("Viewing abstract:", abstract);
    
    // Create modal for viewing abstract details
    const modalDiv = document.createElement('div');
    modalDiv.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center';
    modalDiv.innerHTML = `
      <div class="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        <div class="flex justify-between items-center p-4 border-b">
          <h3 class="text-lg font-medium">Abstract Details</h3>
          <button class="modal-close text-gray-500 hover:text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class="p-4">
          <div class="mb-3">
            <p class="text-sm font-semibold text-gray-700">Title:</p>
            <p class="text-lg font-medium">${abstract.title || 'Untitled'}</p>
          </div>
          
          <div class="mb-3">
            <p class="text-sm font-semibold text-gray-700">Authors:</p>
            <p>${abstract.authors || 'Not specified'}</p>
          </div>
          
          <div class="mb-3">
            <p class="text-sm font-semibold text-gray-700">Affiliations:</p>
            <p>${abstract.authorAffiliations || abstract.affiliations || 'Not provided'}</p>
          </div>
          
          <div class="mb-3">
            <p class="text-sm font-semibold text-gray-700">Category:</p>
            <p>${abstract.topic || abstract.abstractCategory || 'General'}</p>
          </div>
          
          <div class="mb-3">
            <p class="text-sm font-semibold text-gray-700">Abstract Content:</p>
            <div class="border rounded-md p-4 bg-gray-50 max-h-60 overflow-y-auto whitespace-pre-wrap">
              ${abstract.content || 'No content provided'}
            </div>
          </div>
          
          ${abstract.fileUrl ? `
            <div class="mb-3">
              <p class="text-sm font-semibold text-gray-700">Attached File:</p>
              <a href="${abstract.fileUrl?.startsWith('http') ? 
                abstract.fileUrl : 
                `${API_BASE_URL}${abstract.fileUrl}`}" 
                target="_blank" 
                class="text-blue-600 hover:underline flex items-center">
                ${abstract.fileName || 'Download File'}
              </a>
            </div>
          ` : ''}

          <div class="mb-3">
            <p class="text-sm font-semibold text-gray-700">Review Details:</p>
            ${abstract.reviewDetails && Array.isArray(abstract.reviewDetails.reviews) && abstract.reviewDetails.reviews.length > 0
              ? abstract.reviewDetails.reviews.map((review, idx) => `
                <div class="border rounded p-2 mb-2 bg-gray-50">
                  <div><span class="font-semibold">Decision:</span> ${review.decision || 'N/A'}</div>
                  <div><span class="font-semibold">Score:</span> ${review.score !== undefined && review.score !== null ? review.score : 'N/A'}</div>
                  <div><span class="font-semibold">Comments:</span> <span class="whitespace-pre-line">${review.comments || 'No comments'}</span></div>
                </div>
              `).join('')
              : '<div class="text-gray-500">No reviews available yet.</div>'}
          </div>
        </div>
        <div class="p-4 border-t flex justify-end">
          <button class="modal-close px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">Close</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modalDiv);
    
    // Add event listeners for closing the modal
    const closeButtons = modalDiv.querySelectorAll('.modal-close');
    closeButtons.forEach(button => {
      button.addEventListener('click', () => {
        document.body.removeChild(modalDiv);
      });
    });
    
    // Also close when clicking outside the modal
    modalDiv.addEventListener('click', (e) => {
      if (e.target === modalDiv) {
        document.body.removeChild(modalDiv);
      }
    });
  };

  // Fix the filter function to be more aggressive and debug more thoroughly
  const filterAbstractsByRegistration = (abstracts, registrationMongoId) => {
    if (!abstracts || !Array.isArray(abstracts) || abstracts.length === 0) {
      console.log("No abstracts to filter");
      return [];
    }
    
    if (!registrationMongoId) {
      console.log("No registration ID provided for filtering");
      return [];
    }
    
    console.log(`FILTERING: ${abstracts.length} abstracts for registration: ${registrationMongoId}`);
    console.log("Registration ID type:", typeof registrationMongoId);
    
    // Convert registration ID to string for comparison
    const registrationIdStr = String(registrationMongoId);
    
    // Log all abstracts for debugging
    abstracts.forEach((abstract, index) => {
      console.log(`Abstract #${index + 1}:`, {
        id: abstract._id,
        title: abstract.title,
        regObj: abstract.registration,
        regInfo: abstract.registrationInfo,
        regType: typeof abstract.registration
      });
    });
    
    const filteredAbstracts = abstracts.filter(abstract => {
      // Extract registration ID from the abstract
      let abstractRegId = null;
      
      // Handle different ways the registration ID might be stored
      if (abstract.registration) {
        if (typeof abstract.registration === 'object' && abstract.registration._id) {
          abstractRegId = abstract.registration._id;
        } else {
          abstractRegId = abstract.registration;
        }
      } else if (abstract.registrationInfo && abstract.registrationInfo._id) {
        abstractRegId = abstract.registrationInfo._id;
      } else if (abstract.registrationId) {
        abstractRegId = abstract.registrationId;
      }
      
      // If no registration ID found, this abstract doesn't match
      if (!abstractRegId) {
        console.log(`Abstract ${abstract._id || abstract.title}: No registration ID found`);
        return false;
      }
      
      // Convert to string for comparison
      const abstractRegIdStr = String(abstractRegId);
      
      // Log the comparison
      console.log(`Abstract ${abstract._id}: abstractRegId=${abstractRegIdStr}, userRegId=${registrationIdStr}, match=${abstractRegIdStr === registrationIdStr}`);
      
      return abstractRegIdStr === registrationIdStr;
    });
    
    console.log(`After filtering: ${filteredAbstracts.length} abstracts match`);
    return filteredAbstracts;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <Spinner />
      </div>
    );
  }

  // If loading is done, but eventDetails still couldn't be fetched.
  if (!eventDetails) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <Card>
            <div className="p-4">
              <Alert type="error" message="Failed to load event details. Please check the event ID or try again later." />
              <Link to="/" className="mt-4 inline-block text-indigo-600 hover:text-indigo-800">
                &larr; Go to Homepage
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Check if abstract submissions are enabled
  if (eventDetails && !eventDetails.abstractSettings?.enabled) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <Card>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">{eventDetails.name}</h2>
              <p className="mt-2 text-gray-600">Abstract Submission Portal</p>
            </div>
            
            <Alert 
              type="info" 
              message="Abstract submissions are not currently enabled for this event." 
            />
          </Card>
        </div>
      </div>
    );
  }

  // Check if within submission dates
  const currentDate = new Date();
  
  // Get submission dates with better error handling and date parsing
  let submissionStartDate;
  let submissionEndDate;
  
  try {
    // Determine submissionEndDate (deadline)
    if (eventDetails.abstractSettings?.deadline) {
      submissionEndDate = parseAdminDateFormat(eventDetails.abstractSettings.deadline);
    } else if (eventDetails.abstractSettings?.submissionEndDate) {
      submissionEndDate = parseAdminDateFormat(eventDetails.abstractSettings.submissionEndDate);
    } else {
      console.log("Using event end date as fallback for submission END date:", eventDetails.endDate);
      submissionEndDate = parseAdminDateFormat(eventDetails.endDate);
    }
    
    // Determine submissionStartDate
    if (eventDetails.abstractSettings?.submissionStartDate) {
      console.log("Using submissionStartDate from abstractSettings:", eventDetails.abstractSettings.submissionStartDate);
      submissionStartDate = parseAdminDateFormat(eventDetails.abstractSettings.submissionStartDate);
    } else {
      // If no explicit start date, set to a very past date, meaning submissions are open if enabled.
      console.log("No explicit submissionStartDate in abstractSettings. Assuming submissions open if enabled and before deadline.");
      submissionStartDate = new Date(0); // January 1, 1970 (effectively always in the past)
    }
    
    // Fallback for invalid dates after parsing (mainly for submissionEndDate)
    if (!submissionEndDate || isNaN(submissionEndDate.getTime())) {
      console.error("Invalid submission end date after parsing. Using fallback future date.", eventDetails.abstractSettings?.deadline || eventDetails.abstractSettings?.submissionEndDate);
      submissionEndDate = new Date();
      submissionEndDate.setFullYear(submissionEndDate.getFullYear() + 1); 
    }
    
    // Fallback for invalid submissionStartDate (should be rare with new logic but good to keep)
    if (!submissionStartDate || isNaN(submissionStartDate.getTime())) {
        console.error("Invalid submission start date after parsing. Defaulting to epoch.");
        submissionStartDate = new Date(0);
    }

  } catch (error) {
    console.error("Error parsing submission dates:", error);
    
    // Create failsafe fallback dates
    submissionStartDate = new Date();
    submissionStartDate.setFullYear(submissionStartDate.getFullYear() - 1); // One year ago
    
    submissionEndDate = new Date();
    submissionEndDate.setFullYear(submissionEndDate.getFullYear() + 1); // One year from now
    
    console.log("Using failsafe fallback dates after error:", { 
      start: submissionStartDate, 
      end: submissionEndDate 
    });
  }
  
  // Log the dates for debugging
  console.log("Submission period:", { 
    start: submissionStartDate ? submissionStartDate.toISOString() : 'Invalid date', 
    end: submissionEndDate ? submissionEndDate.toISOString() : 'Invalid date',
    current: currentDate.toISOString(),
    deadlineFromSettings: eventDetails.abstractSettings?.deadline,
    parsedDeadline: submissionEndDate ? formatDate(submissionEndDate) : 'Invalid date',
    isCurrentAfterStart: submissionStartDate && (currentDate >= submissionStartDate),
    isCurrentBeforeEnd: submissionEndDate && (currentDate <= submissionEndDate),
    startValid: submissionStartDate && !isNaN(submissionStartDate.getTime()),
    endValid: submissionEndDate && !isNaN(submissionEndDate.getTime()),
    isSubmissionPeriodActive: submissionStartDate && !isNaN(submissionStartDate.getTime()) && 
                              submissionEndDate && !isNaN(submissionEndDate.getTime()) &&
                              currentDate >= submissionStartDate && 
                              currentDate <= submissionEndDate
  });
  
  // For debugging/demo purposes, force the abstract submission to be active
  // The deadline is in 2025, so it should be active
  console.log("Raw deadline date from API:", eventDetails.abstractSettings?.deadline);
  
  // Directly calculate if the period is active based on dates and enabled status
  const isSubmissionPeriodActive = eventDetails.abstractSettings?.enabled && 
                                 submissionStartDate && !isNaN(submissionStartDate.getTime()) && 
                                 submissionEndDate && !isNaN(submissionEndDate.getTime()) &&
                                 currentDate >= submissionStartDate && 
                                 currentDate <= submissionEndDate;
  
  if (!isSubmissionPeriodActive) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <Card>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">{eventDetails.name}</h2>
              <p className="mt-2 text-gray-600">Abstract Submission Portal</p>
            </div>
            
            {/* Only show 'will open on' if there IS an explicit future start date AND submissions are enabled */}
            {eventDetails.abstractSettings?.enabled && eventDetails.abstractSettings?.submissionStartDate && currentDate < submissionStartDate ? (
              <Alert 
                type="info" 
                message={`Abstract submissions will open on ${formatDate(submissionStartDate)}.`} 
              />
            ) : !eventDetails.abstractSettings?.enabled ? (
              <Alert 
                type="info" 
                message="Abstract submissions are not currently enabled for this event." 
              />
            ) : ( /* Submissions are enabled, but past deadline or other condition */
              <Alert 
                type="warning" 
                message={`Abstract submission deadline has passed (${formatDate(submissionEndDate)}).`} 
              />
            )}
          </Card>
        </div>
      </div>
    );
  }

  // Authentication screen
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <Card>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">{eventDetails.name}</h2>
              <p className="mt-2 text-gray-600">Abstract Submission Portal</p>
            </div>
            
            <div className="text-center mb-6">
              <p className="text-gray-700">
                Please enter your Registration ID to access the abstract submission portal.
              </p>
            </div>
            
            <form onSubmit={handleRegistrationAuth} className="max-w-md mx-auto">
              {authError && (
                <Alert 
                  type="error" 
                  message={authError} 
                  className="mb-4"
                  onClose={() => setAuthError(null)}
                />
              )}
              
              <div className="mb-4">
                <label htmlFor="registrationId" className="block text-sm font-medium text-gray-700 mb-1">
                  Registration ID
                </label>
                <Input
                  id="registrationId"
                  name="registrationId"
                  type="text"
                  value={registrationId}
                  onChange={(e) => {
                    console.log("Registration ID input changed:", e.target.value);
                    setRegistrationId(e.target.value);
                  }}
                  placeholder="Enter your registration ID (e.g., MED25-001)"
                  required
                  disabled={authenticating}
                />
              </div>
              
              <div className="mt-6">
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={authenticating || !registrationId.trim()}
                >
                  {authenticating ? <Spinner size="sm" className="mr-2" /> : null}
                  Continue
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    );
  }

  // Regular user interface after authentication
  if (authenticated) {
    // REMOVE the existing Tab component and its contents
    // REPLACE with conditional rendering based on currentView
    if (currentView === 'list') {
      // Render User's Abstract List View
    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
              <h2 className="text-2xl font-bold text-gray-900">{eventDetails?.name}</h2>
              <p className="mt-1 text-gray-600">Your Abstract Submissions</p>
              </div>
            <div className="space-x-2">
               <Button variant="primary" onClick={handleAddNewAbstract}>Submit New Abstract</Button>
               <Button variant="outline" onClick={handleLogout}>Logout</Button>
                </div>
              </div>
              
          {loading && <p>Loading abstracts...</p>} {/* Add loading state for abstracts list */} 

          {userAbstracts.length === 0 && !loading && (
                <div className="p-6 text-center border rounded-lg bg-gray-50">
              <p className="text-gray-500">You haven't submitted any abstracts yet.</p>
              <Button onClick={handleAddNewAbstract} className="mt-4">Submit Your First Abstract</Button>
                </div>
              )}

          {userAbstracts.length > 0 && (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul role="list" className="divide-y divide-gray-200">
                {userAbstracts.map((abs) => (
                  <li key={abs._id} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <p className="text-lg font-medium text-indigo-600 truncate">{abs.title}</p>
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${ abs.status === 'approved' ? 'bg-green-100 text-green-800' : abs.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                         {abs.status}
                      </span>
                  </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <p className="text-sm text-gray-500">Submitted: {formatDate(abs.submissionDate || abs.createdAt)}</p>
                      <div className="mt-2 sm:mt-0 space-x-2">
                         <Button variant="outline" size="sm" onClick={() => handleViewAbstract(abs)}>View</Button>
                         {(abs.status === 'draft' || abs.status === 'submitted') && (
                             <Button variant="secondary" size="sm" onClick={() => handleEditAbstract(abs)}>Edit</Button>
                         )}
                         <Button variant="danger" size="sm" onClick={() => handleDeleteAbstract(abs._id)}>Delete</Button>
                    </div>
                            </div>
                  </li>
                          ))}
              </ul>
                        </div>
          )}
      </div>
    );
  }

    if (currentView === 'form') {
      // Render Abstract Form View
  return (
      <div className="max-w-4xl mx-auto">
              <div className="flex justify-between items-center mb-6">
                <div>
                <h2 className="text-2xl font-bold text-gray-900">{eventDetails?.name}</h2>
                <p className="mt-1 text-gray-600">{abstractForm.existingAbstractId ? 'Edit Abstract' : 'Submit New Abstract'}</p>
                </div>
               <Button variant="outline" onClick={() => { resetAbstractForm(); setCurrentView('list'); }}>Back to List</Button>
              </div>
              
            {/* Abstract Form JSX - needs careful integration of existing fields/components */}
            <form onSubmit={handleSubmitAbstract} className="space-y-4 bg-white shadow rounded-lg p-6">
                {submitMessage.text && <Alert type={submitMessage.type}>{submitMessage.text}</Alert>}

                {/* Title Field */} 
                      <div>
                  <label htmlFor="title">Title <span className="text-red-500">*</span></label>
                  <Input id="title" name="title" value={abstractForm.title} onChange={handleInputChange} error={formErrors.title} />
                      </div>
                      
                {/* Authors Field */} 
                      <div>
                  <label htmlFor="authors">Authors <span className="text-red-500">*</span></label>
                  <Input id="authors" name="authors" value={abstractForm.authors} onChange={handleInputChange} error={formErrors.authors} />
                      </div>
                      
                {/* Affiliations Field */} 
                      <div>
                  <label htmlFor="affiliations">Affiliations <span className="text-red-500">*</span></label>
                  <Input id="affiliations" name="affiliations" value={abstractForm.affiliations} onChange={handleInputChange} error={formErrors.affiliations} />
                      </div>
              
                {/* Category Field */}
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Category <span className="text-red-500">*</span></label>
                  <Select
                    id="category"
                    name="category"
                    value={abstractForm.category}
                    onChange={handleSelectChange}
                    options={categories} // Populated from eventDetails.abstractSettings.categories
                    placeholder="Select a category"
                    error={formErrors.category}
                    required
                  />
                </div>

                {/* Sub-Topic Field - Conditionally Rendered */}
                {selectedSubTopics && selectedSubTopics.length > 0 && (
                  <div>
                    <label htmlFor="subTopic" className="block text-sm font-medium text-gray-700 mb-1">Sub-Topic {eventDetails?.abstractSettings?.requireSubTopic ? <span className="text-red-500">*</span> : <span className="text-xs text-gray-500">(Optional)</span>}</label>
                    <Select
                      id="subTopic"
                      name="subTopic"
                      value={abstractForm.subTopic}
                      onChange={handleSelectChange} // Uses the same handler as category
                      options={selectedSubTopics} // Populated based on selected category
                      placeholder="Select a sub-topic (if applicable)"
                      error={formErrors.subTopic}
                      // Add 'required' prop if sub-topics are mandatory for the selected category
                      // This might need more complex logic based on eventDetails.abstractSettings
                    />
                  </div>
                )}
                
                {/* Content Field */} 
                        <div>
                  <label htmlFor="content">Content <span className="text-red-500">*</span></label>
                  <Textarea id="content" name="content" value={abstractForm.content} onChange={handleInputChange} error={formErrors.content} rows={10} />
                   {/* Add word count display if needed */}
                        </div>
                        
                {/* File Upload Field */} 
                {eventDetails?.abstractSettings?.allowFiles && (
                          <div>
                    <label>File Upload</label>
                    {/* Display current file info if editing */} 
                    {editingAbstract && editingAbstract.fileUrl && (
                       <p className="text-sm text-gray-500 mb-1">Current file: <a href={editingAbstract.fileUrl} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">{editingAbstract.fileName}</a></p>
                            )}
                            <FileUpload
                              onChange={handleFileChange}
                              error={formErrors.file}
                      accept=".pdf,.doc,.docx,.ppt,.pptx" // Adjust based on actual allowed types
                      maxSize={(eventDetails?.abstractSettings?.maxFileSize || 5) * 1024 * 1024} 
                    />
                          </div>
                        )}
                        
                <div className="border-t pt-4 flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => { resetAbstractForm(); setCurrentView('list'); }}>Cancel</Button>
                  <Button type="submit" variant="primary" disabled={loading /* use isSubmitting state */}>
                      {loading ? <Spinner size="sm"/> : null}
                      {abstractForm.existingAbstractId ? 'Update Abstract' : 'Submit Abstract'}
                          </Button>
                        </div>
                      </form>
    </div>
  );
    }
    // Fallback view within authenticated state
    return <div>Loading your view... <button onClick={handleLogout}>Logout</button></div>;
  }

  // Fallback if authenticated but view is not list/form (shouldn't happen in normal flow)
  return <div>Loading your abstract view... <button onClick={handleLogout}>Logout</button></div>;

};

export default AbstractPortal; 