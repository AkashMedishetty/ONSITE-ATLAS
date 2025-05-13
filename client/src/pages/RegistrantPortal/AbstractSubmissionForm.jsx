import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  Box, Typography, TextField, Button, Select, MenuItem, FormControl,
  InputLabel, FormHelperText, CircularProgress, Alert as MuiAlert, Paper, Grid, Chip, IconButton,
  List, ListItem, ListItemText, ListItemSecondaryAction, Divider
} from '@mui/material';
import { styled } from '@mui/material/styles';
import AddCircleOutline from '@mui/icons-material/AddCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';

// Assuming services are correctly set up to use the appropriate axios instance (e.g., apiRegistrant)
import abstractService from '../../services/abstractService';
import { eventService } from '../../services'; 
import { useRegistrantAuth } from '../../contexts/RegistrantAuthContext';
import { useActiveEvent } from '../../contexts/ActiveEventContext';


// --- Helper Functions (Adapted from AbstractPortal) ---

// API URL constant - adjust if needed for file links
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
  if (dateInput instanceof Date) return dateInput;
  try {
    // Check for DD-MM-YYYY format first, return with T00:00:00 for consistency
    if (typeof dateInput === 'string' && dateInput.match(/^\\d{2}-\\d{2}-\\d{4}$/)) {
      const [day, month, year] = dateInput.split('-');
      // Ensure month/day order is correct for Date constructor (YYYY-MM-DD)
      const parsedDate = new Date(`${year}-${month}-${day}T00:00:00Z`); // Use Z for UTC
      if (!isNaN(parsedDate.getTime())) return parsedDate;
    }
    // Handle ISO format date (YYYY-MM-DDTHH:mm:ss.sssZ or similar)
    if (typeof dateInput === 'string' && dateInput.includes('T') && (dateInput.includes('Z') || dateInput.match(/[+-]\\d{2}:\\d{2}$/))) {
      const date = new Date(dateInput);
      if (!isNaN(date.getTime())) return date;
    }
    // Try standard parsing for other formats (like YYYY-MM-DD)
    const date = new Date(dateInput);
    if (!isNaN(date.getTime())) return date;
    
    // If all parsing fails
    console.warn("Invalid date after parsing attempts:", dateInput);
    return null;
  } catch (error) {
    console.error("Error parsing date:", error, dateInput);
    return null;
  }
};

/**
 * Helper function to format dates for display
 */
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = parseAdminDateFormat(dateString); // Use consistent parsing
    if (!date || isNaN(date.getTime())) return 'Invalid Date';
    // Use dayjs for robust formatting
    return dayjs(date).format('MMM D, YYYY'); 
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

// Custom FileUpload component adapted to MUI style
const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

const FileUploadControl = ({ onChange, error, accept, maxSize, currentFileName, onRemove, disabled }) => {
  const maxSizeMB = maxSize ? Math.round(maxSize / (1024 * 1024)) : 5; // Default 5MB

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
       const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
       const acceptedTypesArray = accept ? accept.split(',').map(t => t.trim().toLowerCase()) : [];
      
      // Validate Size
      if (maxSize && file.size > maxSize) {
        toast.error(`File is too large. Maximum size is ${maxSizeMB}MB.`);
        event.target.value = null; // Reset input
        if (onChange) onChange(null); 
      } 
      // Validate Type (using extension as primary check, fallback to MIME type if needed)
      else if (accept && !acceptedTypesArray.includes(fileExtension) && !acceptedTypesArray.includes(file.type)) {
         toast.error(`Invalid file type. Accepted: ${accept.split(',').map(t => t.startsWith('.') ? t.substring(1) : t).join(', ')}`);
         event.target.value = null;
         if (onChange) onChange(null);
      } else {
        if (onChange) onChange(file); // Pass the valid file up
      }
    } else {
       if (onChange) onChange(null); // Handle case where selection is cancelled
    }
  };

  return (
    <Box sx={{ mt: 1 }}>
      <Grid container spacing={1} alignItems="center">
        <Grid item>
          <Button
            component="label"
            role={undefined} // MUI recommendation
            variant="contained"
            tabIndex={-1}
            startIcon={<CloudUploadIcon />}
            disabled={disabled}
            // Add specific ID if needed for resetAbstractForm
            id="file-upload-button" 
          >
            {currentFileName ? 'Replace File' : 'Select File'}
            <VisuallyHiddenInput 
              type="file" 
              onChange={handleFileChange} 
              accept={accept} 
              disabled={disabled} 
              // Add specific ID if needed for resetAbstractForm
              id="file-upload-input" 
             />
          </Button>
        </Grid>
        {currentFileName && (
          <Grid item xs> {/* Allow chip to take remaining space */}
            <Chip
              label={currentFileName}
              onDelete={!disabled ? onRemove : undefined} // Conditionally enable delete
              color="primary"
              variant="outlined"
              sx={{ maxWidth: '100%' }} // Prevent chip from overflowing
            />
          </Grid>
        )}
      </Grid>
      <FormHelperText error={!!error} sx={{ mt: 1 }}>
        {error || `Accepted: ${accept?.split(',').map(t => t.startsWith('.') ? t.substring(1) : t).join(', ') || 'any'}. Max ${maxSizeMB}MB.`}
      </FormHelperText>
    </Box>
  );
};
// --- End Helper Functions ---

// --- Main Component ---
function AbstractSubmissionForm({ abstract = null, isEdit = false, onSuccess, onCancel }) {
  // Hooks
  const { abstractId: abstractIdFromParams } = useParams(); // For edit mode via URL
  const navigate = useNavigate();
  const location = useLocation(); // To manage URL state/params
  const { activeEventId } = useActiveEvent(); // Use context for eventId
  const { currentRegistrant, loading: authLoading } = useRegistrantAuth(); // Get registrant info

  // State Variables (Adapted from AbstractPortal)
  const [loading, setLoading] = useState(true); // General loading state (event details, abstracts)
  const [eventDetails, setEventDetails] = useState(null);
  const [userAbstracts, setUserAbstracts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [settings, setSettings] = useState(null); // Abstract settings
  const [submissionDeadlinePassed, setSubmissionDeadlinePassed] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false); // Specific state for submission process

  // Form state (managed manually, similar to AbstractPortal)
  const [abstractForm, setAbstractForm] = useState({
    title: '',
    authors: '', // Simple string for now
    affiliations: '', // Simple string
    category: '', // Category ID
    topic: '',
    content: '',
    file: null, // Holds the File object for upload
    existingAbstractId: null, // ID if editing
    currentFileName: null, // Display name of existing/selected file
  });
  const [formErrors, setFormErrors] = useState({}); // For validation errors
  const [submitMessage, setSubmitMessage] = useState({ type: '', text: '' }); // For success/error messages

  // View control
  const [currentView, setCurrentView] = useState('list'); // 'list' or 'form'
  const [editingAbstract, setEditingAbstract] = useState(null); // Stores abstract being edited

  // Derived State
  const eventId = activeEventId; // Use eventId from context
  const isEditMode = !!abstractForm.existingAbstractId;

  // Effect to fetch Event Details & Settings
  useEffect(() => {
    if (!eventId) {
      console.log("No activeEventId, cannot fetch event details.");
      setLoading(false); // Stop loading if no event ID
      return;
    }
    const fetchEventData = async () => {
      setLoading(true);
      try {
        console.log(`Fetching event details for event: ${eventId}`);
        const response = await eventService.getEventById(eventId);
        if (response.success) {
          setEventDetails(response.data);
          const abstractSettings = response.data?.abstractSettings;
          setSettings(abstractSettings);
          console.log('Abstract settings loaded:', abstractSettings);

          if (abstractSettings?.categories?.length > 0) {
            setCategories(
              abstractSettings.categories.map(cat => ({
                value: cat._id,
                label: cat.name,
                subTopics: cat.subTopics || [],
                ...cat // preserve all other properties if needed
              }))
            );
          } else {
             setCategories([]);
          }

          // Check submission deadline
          const deadlineDate = parseAdminDateFormat(abstractSettings?.submissionDeadline || abstractSettings?.deadline);
          const deadlinePassed = deadlineDate ? dayjs().isAfter(deadlineDate) : false; // Default to not passed if no deadline
          setSubmissionDeadlinePassed(deadlinePassed);
           if (deadlinePassed) {
            console.warn('Submission deadline has passed.');
          }
          } else {
          toast.error(response.message || 'Failed to fetch event details.');
          setEventDetails(null);
          setSettings(null);
          }
        } catch (err) {
        toast.error('Error fetching event details: ' + err.message);
        setEventDetails(null);
        setSettings(null);
      } finally {
         // Loading state is handled by fetchUserAbstracts finally block
      }
    };
    fetchEventData();
  }, [eventId]); // Re-run if eventId changes

  // Effect to fetch User Abstracts
  // Revised Effect to Fetch User Abstracts
  useEffect(() => {
    // Capture state available in this specific effect execution
    const currentEventId = eventId;
    const currentRegistrantObj = currentRegistrant; // Capture the object
    const currentEventDetails = eventDetails;
  
    // --- Prerequisite Checks ---
    // 1. Check for essential IDs
    if (!currentEventId || !currentRegistrantObj?._id) {
      console.log(`[Abstracts Effect] Waiting: Missing eventId (${currentEventId}) or registrantId (${currentRegistrantObj?._id}).`);
      // If we are missing IDs, we depend on the main render logic's loading state
      // which checks authLoading and registrant presence.
      return; // Don't proceed further in this effect run
    }
  
    // 2. Check if event details (containing settings) are loaded
    if (!currentEventDetails) {
      console.log("[Abstracts Effect] Waiting: EventDetails not loaded yet.");
      // If IDs are present but details are missing, ensure a loading state is potentially shown
      setLoading(true); // Indicate we are still loading something essential (event details/abstracts)
      return; // Don't proceed further in this effect run
    }
  
    // --- Prerequisites Met ---
    // If we reach here, currentEventId, currentRegistrantObj._id, and currentEventDetails are all available
  
    const fetchUserAbstractsData = async () => {
      // Use the confirmed non-null ID from the outer scope check
      const registrantIdForFetch = currentRegistrantObj._id;
  
      console.log(`[Abstracts Effect] Prerequisites met. Fetching abstracts for event ${currentEventId}, user ${registrantIdForFetch}`);
      setLoading(true); // Indicate abstract fetching is starting
      try {
        const params = { registration: registrantIdForFetch };
        const response = await abstractService.getAbstracts(currentEventId, params);
        if (response.success) {
          setUserAbstracts(response.data || []);
          console.log("[Abstracts Effect] Successfully fetched user abstracts:", response.data);
        } else {
          toast.error(response.message || 'Failed to fetch your abstracts.');
          setUserAbstracts([]);
          console.error("[Abstracts Effect] Failed to fetch abstracts:", response.message);
        }
      } catch (err) {
        toast.error('Error fetching your abstracts: ' + err.message);
        setUserAbstracts([]);
        console.error("[Abstracts Effect] Catch error fetching abstracts:", err);
      } finally {
        setLoading(false); // Indicate abstract fetching is complete
      }
    };
  
    fetchUserAbstractsData();
  
    // Dependencies: Re-run if eventId, the registrant object reference, or eventDetails change.
    // The internal checks handle the "wait" state.
  }, [eventId, currentRegistrant, eventDetails]); // Using registrant object reference again

   // Effect to handle URL parameter for editing
  useEffect(() => {
         // Check if userAbstracts are loaded before attempting to find abstract
        if (abstractIdFromParams && userAbstracts.length > 0) {
            const abstractToEdit = userAbstracts.find(abs => abs._id === abstractIdFromParams);
            if (abstractToEdit) {
                 // Only call handleEditAbstract if not already editing this one
                 if (editingAbstract?._id !== abstractToEdit._id) {
                     handleEditAbstract(abstractToEdit);
                 }
        } else {
                console.warn(`Abstract ID ${abstractIdFromParams} from URL not found in user's abstracts.`);
                // Navigate back to list view if abstract not found
                if (currentView === 'form') { 
                   toast.error('Abstract not found.');
                   navigate(`/registrant-portal/abstracts?event=${eventId}`, { replace: true });
                }
            }
        } else if (!abstractIdFromParams && isEditMode) {
             // If URL param is removed AND we were in edit mode, go back to list
             console.log("URL parameter removed while editing, returning to list.");
             resetAbstractForm();
             setCurrentView('list');
        }
        // No specific action needed if !abstractIdFromParams and not in edit mode (either list or new form)
        
   }, [abstractIdFromParams, userAbstracts, navigate, eventId, isEditMode, currentView, editingAbstract]); // Dependencies updated

  useEffect(() => {
    if (!abstract) return;
    if (isEdit && Array.isArray(categories) && categories.length > 0) {
      // --- CATEGORY MAPPING ---
      let categoryValue = '';
      let validCategory = null;
      if (abstract.category) {
        // Try to match by _id, value, or name (string or object)
        const catId = typeof abstract.category === 'object' ? abstract.category._id : abstract.category;
        const catName = typeof abstract.category === 'object' ? abstract.category.name : abstract.category;
        validCategory = categories.find(cat =>
          cat.value === catId || cat._id === catId || cat.label === catName || cat.name === catName
        );
        if (validCategory) {
          categoryValue = validCategory.value;
        }
      }

      // --- TOPIC MAPPING ---
      let topicValue = '';
      if (validCategory && (abstract.topic || abstract.subTopic)) {
        const subTopics = validCategory.subTopics || [];
        let topicId = '';
        let topicName = '';
        if (typeof abstract.topic === 'object') {
          topicId = abstract.topic._id;
          topicName = abstract.topic.name;
        } else if (typeof abstract.topic === 'string') {
          topicName = abstract.topic;
        }
        if (!topicName && typeof abstract.subTopic === 'string') {
          topicName = abstract.subTopic;
        } else if (!topicName && typeof abstract.subTopic === 'object') {
          topicId = abstract.subTopic._id;
          topicName = abstract.subTopic.name;
        }
        // Try to match by _id or name
        const validTopic = subTopics.find(st =>
          st._id === topicId || st.name === topicName
        );
        if (validTopic) {
          topicValue = validTopic._id;
        }
      }

      setAbstractForm(prev => ({
        ...prev,
        title: abstract.title || '',
        authors: abstract.authors || '',
        affiliations: abstract.authorAffiliations || abstract.affiliations || '',
        category: categoryValue,
        topic: topicValue || '',
        content: abstract.content || '',
        file: null,
        existingAbstractId: abstract._id,
        currentFileName: abstract.fileName || null,
      }));
    }
  }, [abstract, isEdit, categories]);

  // --- Form State Management ---
  const resetAbstractForm = useCallback(() => {
    setAbstractForm({
      title: '',
      authors: '',
      affiliations: '',
      category: categories[0]?.value || '', // Default to first category or empty
      topic: '',
      content: '',
      file: null,
      existingAbstractId: null,
      currentFileName: null,
    });
    setFormErrors({});
    setEditingAbstract(null); // Clear the object being edited
    setSubmitMessage({ type: '', text: '' }); // Clear submission message
     // Reset file input visually
     const fileInput = document.getElementById('file-upload-input'); 
     if (fileInput) fileInput.value = '';
  }, [categories]); // Depend on categories for default value

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAbstractForm(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field if it exists
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Specific handler for Select components in MUI
  const handleSelectChange = (e) => {
    const { name, value } = e.target;
    setAbstractForm(prev => ({
      ...prev,
      [name]: value
    }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleFileChange = (selectedFile) => {
      // selectedFile is the File object or null
      setAbstractForm(prev => ({
          ...prev,
          file: selectedFile, // Store the File object
          // If a new file is selected, update currentFileName. If selection cancelled (null), keep existing name if editing.
          currentFileName: selectedFile ? selectedFile.name : (editingAbstract?.fileName || null) 
      }));
      if (formErrors.file) {
          setFormErrors(prev => ({ ...prev, file: null }));
      }
       // Clear the actual file input value if selection cancelled
      if (!selectedFile) {
          const fileInput = document.getElementById('file-upload-input');
          if (fileInput) fileInput.value = '';
      }
  };
  
  const handleRemoveFile = () => {
      setAbstractForm(prev => ({
          ...prev,
          file: null, // Clear the File object
          currentFileName: null // Clear display name
      }));
      // Also clear potential file input value visually
      const fileInput = document.getElementById('file-upload-input'); 
      if (fileInput) fileInput.value = '';
      console.log("File removed by user.");
       // Clear file error if it exists
       if (formErrors.file) {
         setFormErrors(prev => ({ ...prev, file: null }));
       }
  };

  // --- Validation ---
  const validateAbstractForm = () => {
    const errors = {};
    const { title, authors, affiliations, category, topic, content, file } = abstractForm;
    const maxWords = settings?.maxLength || 500; // Default 500 words
    const maxSize = (settings?.maxFileSize || 5) * 1024 * 1024; // Default 5MB
    const allowedTypesString = settings?.allowedFileTypes || '.pdf,.doc,.docx'; // Use settings or default
    const allowedTypesArray = allowedTypesString.split(',').map(t => t.trim().toLowerCase());

    if (!title.trim()) errors.title = 'Title is required';
    if (!authors.trim()) errors.authors = 'Authors are required';
    if (!affiliations.trim()) errors.affiliations = 'Affiliations are required';
    if (!category) errors.category = 'Please select a category';
    if (!topic) errors.topic = 'Please select a topic';
    if (!content.trim()) errors.content = 'Abstract content is required';
    else {
        const wordCount = content.trim().split(/\s+/).length;
        if (wordCount > maxWords) {
            errors.content = `Abstract exceeds maximum word count of ${maxWords} words (currently ${wordCount}).`;
        }
    }

     // File validation (only if file upload is enabled AND a file is selected)
     // Don't validate if editing and no NEW file is selected
     if (settings?.allowFiles && file) {
       if (file.size > maxSize) {
         errors.file = `File exceeds maximum size of ${settings?.maxFileSize || 5}MB.`;
       }
       // Basic type check based on extension
       const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;
        if (!allowedTypesArray.includes(fileExtension) && !allowedTypesArray.includes(file.type)) {
           console.warn(`File extension/type check failed: ext=${fileExtension}, type=${file.type} vs allowed=${allowedTypesArray.join('/')}`);
           errors.file = `Invalid file type. Allowed types: ${allowedTypesString.replace(/\./g, '')}`;
        }
     }

    // Duplicate category check (only for new submissions)
    if (!isEditMode) {
      // Find abstracts where the category ID matches the selected category
      const existingAbstractInCategory = userAbstracts.find(abs => {
          const absCategoryId = typeof abs.category === 'object' ? abs.category?._id : abs.category;
          return absCategoryId === category;
      });
      if (existingAbstractInCategory) {
        errors.category = 'You have already submitted an abstract for this category.';
      }
    }

    setFormErrors(errors);
    console.log("Validation errors:", errors); // Log validation results
    return Object.keys(errors).length === 0;
  };

  // --- Actions ---
  const handleSubmitAbstract = async (e) => {
    e.preventDefault();
    // Prevent submission/update if deadline passed (allow viewing though)
    if (submissionDeadlinePassed) { 
       toast.error("The submission deadline has passed. Cannot submit or update abstract.");
        return;
      }
    if (!validateAbstractForm()) {
        toast.error("Please fix the errors in the form.");
      return;
    }
    if (!eventId || !currentRegistrant?._id) {
        toast.error("Missing Event or Registrant ID. Cannot submit.");
        return;
    }

    setFormSubmitting(true);
    setSubmitMessage({ type: '', text: '' });

    // Use FormData for potential file upload
    const formData = new FormData();
    formData.append('title', abstractForm.title);
    formData.append('authors', abstractForm.authors);
    // Ensure backend field name matches (e.g., authorAffiliations or affiliations)
    formData.append('authorAffiliations', abstractForm.affiliations); 
    formData.append('category', abstractForm.category);
    formData.append('topic', abstractForm.topic);
    formData.append('content', abstractForm.content);
    formData.append('event', eventId);
    formData.append('registration', currentRegistrant._id); // Send registration ID

    // Append file only if a new one is selected
    if (abstractForm.file) {
      formData.append('abstractFile', abstractForm.file);
      console.log("Appending new file to FormData:", abstractForm.file.name);
    } else if (isEditMode && !abstractForm.currentFileName && editingAbstract?.fileName) {
       // Signal removal of existing file if file was explicitly removed in the form
       // This requires backend support to check for this field
       formData.append('removeExistingFile', 'true');
       console.log("Signalling removal of existing file.");
    }

    try {
      let response;
      if (isEditMode) {
        console.log(`Updating abstract ${abstractForm.existingAbstractId} for event ${eventId}`);
        // Ensure service handles FormData correctly for updates
        response = await abstractService.updateAbstract(eventId, abstractForm.existingAbstractId, formData);
      } else {
        console.log(`Creating new abstract for event ${eventId}`);
        response = await abstractService.createAbstract(eventId, formData); // Pass eventId separately if needed by service
      }
      
      if (response.success) {
        toast.success(`Abstract ${isEditMode ? 'updated' : 'submitted'} successfully!`);
        const updatedAbstracts = isEditMode
            ? userAbstracts.map(abs => abs._id === response.data._id ? response.data : abs)
            : [...userAbstracts, response.data];
        setUserAbstracts(updatedAbstracts);
        resetAbstractForm(); 
        setCurrentView('list'); // Go back to list view
        // Clear edit param from URL
        navigate(`/registrant-portal/abstracts?event=${eventId}`, { replace: true });
          } else {
        setSubmitMessage({ type: 'error', text: response.message || 'Submission failed.' });
        toast.error(response.message || 'Submission failed.');
         // Map potential backend validation errors (if service provides them)
         if (response.errors) {
           const backendErrors = {};
           for (const key in response.errors) {
              // Adjust keys if necessary (e.g., authorAffiliations vs affiliations)
             backendErrors[key === 'authorAffiliations' ? 'affiliations' : key] = response.errors[key].msg || 'Invalid value';
           }
           setFormErrors(prev => ({ ...prev, ...backendErrors }));
           console.log("Backend validation errors:", backendErrors);
         }
      }
    } catch (error) {
        console.error("Catch block error submitting abstract:", error);
        // Check if the error response contains details
        const errorMsg = error.response?.data?.message || error.message || 'An unexpected error occurred.';
      setSubmitMessage({ type: 'error', text: errorMsg });
      toast.error(errorMsg);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteAbstract = async (abstractIdToDelete) => {
    // Prevent deletion if deadline passed? Optional rule.
    // if (submissionDeadlinePassed) { 
    //    toast.error("The submission deadline has passed. Cannot delete abstract.");
    //    return;
    // }
    if (!window.confirm('Are you sure you want to delete this abstract? This cannot be undone.')) return;
     if (!eventId) {
        toast.error("Event ID missing, cannot delete.");
        return;
     }

    try {
      console.log(`Deleting abstract ${abstractIdToDelete} for event ${eventId}`);
      // Ensure abstractService.deleteAbstract uses authenticated request
      const response = await abstractService.deleteAbstract(eventId, abstractIdToDelete);
      if (response.success) {
        toast.success('Abstract deleted successfully.');
        setUserAbstracts(prev => prev.filter(abs => abs._id !== abstractIdToDelete)); // Update list immediately
        // If the deleted abstract was being edited, reset form and go to list
        if (isEditMode && editingAbstract?._id === abstractIdToDelete) {
          resetAbstractForm();
          setCurrentView('list');
          // Clear edit param from URL
          navigate(`/registrant-portal/abstracts?event=${eventId}`, { replace: true });
        }
      } else {
        toast.error(response.message || 'Failed to delete abstract.');
      }
    } catch (error) {
      toast.error(error.message || 'Error deleting abstract.');
      console.error("Error deleting abstract:", error);
    }
  };

  // Use useCallback to prevent unnecessary re-renders if passed as prop
  const handleEditAbstract = useCallback((abstractToEdit) => {
    if (!abstractToEdit) return;
    console.log("Editing abstract:", abstractToEdit);
    setEditingAbstract(abstractToEdit); // Store the full abstract object being edited
    setAbstractForm({
      title: abstractToEdit.title || '',
      authors: abstractToEdit.authors || '', // Assuming authors/affiliations are simple strings
      affiliations: abstractToEdit.authorAffiliations || abstractToEdit.affiliations || '',
      // Handle category potentially being an object or just an ID string
      category: typeof abstractToEdit.category === 'object' ? abstractToEdit.category?._id : abstractToEdit.category || '',
      topic: typeof abstractToEdit.topic === 'object' ? abstractToEdit.topic?._id : abstractToEdit.topic || '',
      content: abstractToEdit.content || '',
      file: null, // Clear file object on edit start, rely on currentFileName
      existingAbstractId: abstractToEdit._id,
      currentFileName: abstractToEdit.fileName || null, // Show existing file name
    });
    setFormErrors({}); // Clear previous errors
    setSubmitMessage({ type: '', text: '' });
    setCurrentView('form'); // Switch to form view
     // Update URL to reflect editing state
     navigate(`/registrant-portal/abstracts/${abstractToEdit._id}?event=${eventId}`, { replace: true });
  }, [navigate, eventId]); // Dependencies for useCallback

  const handleAddNewAbstract = () => {
    if (submissionDeadlinePassed) {
        toast.error("The submission deadline has passed. Cannot submit new abstracts.");
        return;
    }
    resetAbstractForm();
    setCurrentView('form');
     // Ensure URL doesn't have an abstract ID param
     navigate(`/registrant-portal/abstracts?event=${eventId}`, { replace: true });
  };

  // TODO: Implement handleViewAbstract using a Modal component if needed
  const handleViewAbstract = (abstract) => {
    console.log("View abstract details:", abstract);
    // Implementation would likely involve setting state for a Modal
    // and passing the abstract data to it.
    toast.info('View details functionality not implemented yet.');
  };

  // --- Render Logic ---

  // 1. Check for Event ID first - Essential for any further action
  if (!eventId) {
    return <MuiAlert severity="error">Event ID not found. Cannot load abstract submissions.</MuiAlert>;
  }

  // 2. Check Authentication and Registrant Availability
  if (authLoading || !currentRegistrant) {
    // Show loading if auth is in progress OR if auth is finished but registrant object isn't populated yet
    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>
              {authLoading ? 'Authenticating...' : 'Loading registrant data...'}
            </Typography>
        </Box>
    );
  }

  // --- At this point, we have eventId AND registrant --- 

  // 3. Check Core Data Loading State (Event Details and User Abstracts)
  if (loading) {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
            {/* Determine more specific message based on what might be loading */}
            <Typography sx={{ ml: 2 }}>
              { !eventDetails ? 'Loading event data...' : 'Loading your abstracts...' }
            </Typography>
        </Box>
    );
  }
  
  // 4. Check if Event Details failed to load (after loading is false)
  if (!eventDetails) {
    return <MuiAlert severity="error">Failed to load event details. Please try again later or contact support.</MuiAlert>;
  }

  // 5. Check Abstract Settings (after event details loaded)
  if (!settings) {
     return <MuiAlert severity="warning">Abstract submission settings are not configured for this event.</MuiAlert>;
  }
  if (!settings.enabled) {
     return <MuiAlert severity="info">Abstract submissions are not currently enabled for this event.</MuiAlert>;
  }

  // --- View Rendering ---

  if (currentView === 'list') {
    return (
      <Paper sx={{ p: 2, mt: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5">Your Abstract Submissions</Typography>
              <Button
                  variant="contained"
                  onClick={handleAddNewAbstract}
                  disabled={submissionDeadlinePassed} // Disable button if deadline passed
                  startIcon={<AddCircleOutline />}
              >
                  Submit New Abstract
              </Button>
          </Box>
           {submissionDeadlinePassed && (
             <MuiAlert severity="warning" sx={{ mb: 2 }}>
               The submission deadline ({formatDate(settings?.submissionDeadline)}) has passed. You can view existing abstracts but cannot submit new ones or edit existing ones.
             </MuiAlert>
           )}

          {userAbstracts.length === 0 ? (
              <Typography sx={{ textAlign: 'center', p: 3, color: 'text.secondary' }}>
                  You haven't submitted any abstracts yet.
              </Typography>
          ) : (
              <List disablePadding>
                  {userAbstracts.map((abs) => (
                      <React.Fragment key={abs._id}>
                          <ListItem >
                              <ListItemText
                                  primary={abs.title || 'Untitled Abstract'}
                                  // Display category name if available
                                  secondary={`Category: ${abs.category?.name || 'N/A'} | Submitted: ${formatDate(abs.submissionDate || abs.createdAt)} | Status: ${abs.status || 'Submitted'}`}
                               />
                              <ListItemSecondaryAction>
                                  {/* View Button - Implement Modal Later */}
                                  <IconButton edge="end" aria-label="view" onClick={() => handleViewAbstract(abs)} sx={{ mr: 0.5 }}>
                                       <VisibilityIcon />
                                  </IconButton>
                                  {/* Edit Button - Conditionally enable */}
                                  <IconButton
                                     edge="end"
                                     aria-label="edit"
                                     onClick={() => handleEditAbstract(abs)}
                                     disabled={submissionDeadlinePassed} // Disable edit after deadline
                                     sx={{ mr: 0.5 }}
                                  >
                                      <EditIcon />
                                  </IconButton>
                                  {/* Delete Button */}
                                  <IconButton 
                                     edge="end" 
                                     aria-label="delete" 
                                     onClick={() => handleDeleteAbstract(abs._id)}
                                     // Optionally disable delete after deadline too
                                     // disabled={submissionDeadlinePassed} 
                                  >
                                      <DeleteIcon color="error" />
                                  </IconButton>
                              </ListItemSecondaryAction>
                          </ListItem>
                          <Divider component="li" />
                      </React.Fragment>
                  ))}
              </List>
          )}
      </Paper>
    );
  }

  if (currentView === 'form') {
    return (
      <Paper sx={{ p: 3, mt: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">
            {isEditMode ? 'Edit Abstract' : 'Submit New Abstract'}
          </Typography>
           <Button variant="outlined" onClick={() => { resetAbstractForm(); setCurrentView('list'); navigate(`/registrant-portal/abstracts?event=${eventId}`, { replace: true }); }}>
             Back to List
                </Button>
        </Box>

         {submissionDeadlinePassed && (
             <MuiAlert severity="warning" sx={{ mb: 2 }}>
                 The submission deadline ({formatDate(settings?.submissionDeadline)}) has passed. You can view but no longer submit or edit abstracts.
             </MuiAlert>
           )}
        {submitMessage.text && <MuiAlert severity={submitMessage.type || 'info'} sx={{ mb: 2 }}>{submitMessage.text}</MuiAlert>}

        <Box component="form" onSubmit={handleSubmitAbstract} noValidate sx={{ mt: 1 }}>
          <Grid container spacing={3}>
            {/* Title */}
            <Grid item xs={12}>
              <TextField
                name="title"
                label="Abstract Title"
                value={abstractForm.title}
                onChange={handleInputChange}
                error={!!formErrors.title}
                helperText={formErrors.title}
                required
                fullWidth
                variant="outlined"
                disabled={formSubmitting || submissionDeadlinePassed}
              />
            </Grid>

            {/* Authors (Simple Text Input for now) */}
            <Grid item xs={12} sm={6}>
              <TextField
                name="authors"
                label="Authors"
                value={abstractForm.authors}
                onChange={handleInputChange}
                error={!!formErrors.authors}
                helperText={formErrors.authors || "List all author names, separated by commas"}
                required
                fullWidth
                variant="outlined"
                disabled={formSubmitting || submissionDeadlinePassed}
              />
            </Grid>

            {/* Affiliations (Simple Text Input for now) */}
            <Grid item xs={12} sm={6}>
              <TextField
                name="affiliations"
                label="Affiliations"
                value={abstractForm.affiliations}
                onChange={handleInputChange}
                error={!!formErrors.affiliations}
                helperText={formErrors.affiliations || "List author affiliations"}
                required
                fullWidth
                variant="outlined"
                disabled={formSubmitting || submissionDeadlinePassed}
              />
            </Grid>

            {/* Category */}
            <Grid item xs={12}>
              <FormControl fullWidth required error={!!formErrors.category} disabled={formSubmitting || submissionDeadlinePassed || categories.length === 0 || isEditMode}>
                <InputLabel id="category-select-label">Category</InputLabel>
                <Select
                  labelId="category-select-label"
                  id="category"
                  name="category"
                  value={abstractForm.category || ''}
                  label="Category"
                  onChange={handleSelectChange}
                  disabled={formSubmitting || submissionDeadlinePassed || categories.length === 0 || isEditMode}
                >
                  <MenuItem value="" disabled><em>Select a category...</em></MenuItem>
                  {categories.map(cat => (
                    <MenuItem key={cat.value} value={cat.value}>{cat.label}</MenuItem>
                  ))}
                  {!categories.length && <MenuItem value="" disabled>No categories defined for this event</MenuItem>}
                </Select>
                {formErrors.category && <FormHelperText>{formErrors.category}</FormHelperText>}
                {isEditMode && <FormHelperText>This field cannot be changed in edit mode.</FormHelperText>}
                {categories.length === 0 && !loading && <FormHelperText>No abstract categories available.</FormHelperText>} 
              </FormControl>
            </Grid>

            {/* Topic */}
            <Grid item xs={12}>
              <FormControl fullWidth required error={!!formErrors.topic} disabled={formSubmitting || submissionDeadlinePassed || categories.length === 0 || isEditMode}>
                <InputLabel id="topic-select-label">Topic</InputLabel>
                <Select
                  labelId="topic-select-label"
                  id="topic"
                  name="topic"
                  value={abstractForm.topic || ''}
                  label="Topic"
                  onChange={handleSelectChange}
                  disabled={formSubmitting || submissionDeadlinePassed || categories.length === 0 || isEditMode}
                >
                  <MenuItem value="" disabled><em>Select a topic...</em></MenuItem>
                  {categories
                    .find(cat => cat.value === abstractForm.category)
                    ?.subTopics?.map(st => (
                      <MenuItem key={st._id} value={st._id}>{st.name}</MenuItem>
                    )) || []}
                  {!abstractForm.category && <MenuItem value="" disabled>Select a category first</MenuItem>}
                </Select>
                {formErrors.topic && <FormHelperText>{formErrors.topic}</FormHelperText>}
                {isEditMode && <FormHelperText>This field cannot be changed in edit mode.</FormHelperText>}
              </FormControl>
            </Grid>

            {/* Abstract Content */}
            <Grid item xs={12}>
              <TextField
                name="content"
                label="Abstract Content"
                value={abstractForm.content}
                onChange={handleInputChange}
                error={!!formErrors.content}
                helperText={formErrors.content || `Max ${settings?.maxLength || 500} words. Current: ${abstractForm.content.trim().split(/\s+/).filter(Boolean).length}`}
                required
                fullWidth
                multiline
                rows={10}
                variant="outlined"
                disabled={formSubmitting || submissionDeadlinePassed}
              />
            </Grid>

             {/* File Upload (Optional based on settings) */}
            {settings?.allowFiles && (
              <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>File Upload {isEditMode && abstractForm.currentFileName ? '(Replace existing)' : '(Optional)'}</Typography>
                   <FileUploadControl
                     onChange={handleFileChange}
                     onRemove={handleRemoveFile}
                     error={formErrors.file}
                     accept={settings?.allowedFileTypes || '.pdf,.doc,.docx'} // Pass allowed types
                     maxSize={(settings?.maxFileSize || 5) * 1024 * 1024} // Pass max size
                     currentFileName={abstractForm.currentFileName}
                     disabled={formSubmitting || submissionDeadlinePassed}
                   />
              </Grid>
            )}

            {/* Submit/Cancel Buttons */}
            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
                    <Button 
                    variant="outlined"
                    onClick={() => { resetAbstractForm(); setCurrentView('list'); navigate(`/registrant-portal/abstracts?event=${eventId}`, { replace: true }); }}
                    disabled={formSubmitting}
                >
                    Cancel
                    </Button>
                          <Button
                type="submit" 
                  variant="contained"
                  color="primary"
                  disabled={formSubmitting || submissionDeadlinePassed}
                >
                  {formSubmitting ? <CircularProgress size={24} /> : (isEditMode ? 'Update Abstract' : 'Submit Abstract')}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    );
  }

  // Fallback if view state is somehow invalid
  return <MuiAlert severity="error">Invalid view state. Current view: {currentView}</MuiAlert>;
}

export default AbstractSubmissionForm;                    