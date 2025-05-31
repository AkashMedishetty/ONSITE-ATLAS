import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  Box, Typography, TextField, Button, Select, MenuItem, FormControl,
  InputLabel, FormHelperText, CircularProgress, Alert as MuiAlert, Paper, Grid, Chip, IconButton,
  List, ListItem, ListItemText, ListItemSecondaryAction, Divider, Container
} from '@mui/material';
import { styled } from '@mui/material/styles';
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

  const handleFileChangeInternal = (event) => {
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
              onChange={handleFileChangeInternal} 
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

// Helper function to get category name by ID (similar to AbstractPortal)
const getCategoryNameById = (categoryId, localCategories) => {
  if (!categoryId || !localCategories || localCategories.length === 0) {
    return 'N/A';
  }
  const category = localCategories.find(cat => cat.value === categoryId || cat._id === categoryId);
  return category ? category.label : 'Unknown Category';
};

// --- Main Component ---
function AbstractSubmissionForm() {
  const { abstractId: abstractIdFromParams } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { activeEventId } = useActiveEvent();
  const { currentRegistrant, loading: authLoading } = useRegistrantAuth();

  const [loading, setLoading] = useState(true); // For event details and abstract (if editing)
  const [eventDetails, setEventDetails] = useState(null);
  const [categories, setCategories] = useState([]);
  const [settings, setSettings] = useState(null);
  const [submissionDeadlinePassed, setSubmissionDeadlinePassed] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // editingAbstract stores the original abstract data when in edit mode
  const [editingAbstract, setEditingAbstract] = useState(null); 

  const [abstractForm, setAbstractForm] = useState({
    title: '',
    authors: '',
    affiliations: '',
    category: '',
    topic: '',
    content: '',
    file: null,
    currentFileName: null,
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitMessage, setSubmitMessage] = useState({ type: '', text: '' });
  const [userAbstracts, setUserAbstracts] = useState([]); // For duplicate category check

  const eventId = activeEventId;
  const isEditMode = !!abstractIdFromParams; // Determine edit mode from URL param

  // Effect to fetch Event Details & Settings
  useEffect(() => {
    if (!eventId) {
      console.log("No activeEventId, cannot fetch event details.");
      toast.error("No active event selected. Please select an event first.");
      setLoading(false);
      navigate('/registrant-portal/events'); // Redirect if no eventId
      return;
    }
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const eventResponse = await eventService.getEventById(eventId);
        if (eventResponse.success) {
          setEventDetails(eventResponse.data);
          const abstractSettings = eventResponse.data?.abstractSettings;
          setSettings(abstractSettings);
          if (!abstractSettings?.enabled) {
            toast.error("Abstract submissions are not enabled for this event.");
            navigate(`/registrant-portal/abstracts?event=${eventId}`);
            return;
          }
          const deadlineDate = parseAdminDateFormat(abstractSettings?.submissionDeadline || abstractSettings?.deadline);
          const deadlinePassed = deadlineDate ? dayjs().isAfter(deadlineDate) : false;
          setSubmissionDeadlinePassed(deadlinePassed);
          if (deadlinePassed && !isEditMode) {
            toast.warn("The submission deadline has passed. You cannot submit a new abstract.");
            // Potentially navigate away or disable form for new submissions
          } else if (deadlinePassed && isEditMode && editingAbstract?.status?.toLowerCase() !== 'revision-requested') {
            toast.warn("The submission deadline has passed. Only abstracts requiring revision can be updated.");
            // Potentially disable form fields if not revision-requested status
          }

          if (abstractSettings?.categories?.length > 0) {
            setCategories(
              abstractSettings.categories.map(cat => ({
                value: cat._id,
                label: cat.name,
                subTopics: cat.subTopics || [],
                ...cat
              }))
            );
          } else {
             setCategories([]);
          }
        } else {
          toast.error(eventResponse.message || 'Failed to fetch event details.');
          navigate('/registrant-portal/dashboard'); // Or a more appropriate fallback
          return;
        }
        if (currentRegistrant?._id) {
          const abstractsResponse = await abstractService.getAbstracts(eventId, { registration: currentRegistrant._id });
          if (abstractsResponse.success) {
            setUserAbstracts(abstractsResponse.data || []);
          } else {
            console.warn("Could not fetch user's existing abstracts for duplicate check:", abstractsResponse.message);
            setUserAbstracts([]);
          }
          }
        } catch (err) {
        toast.error('Error fetching initial data: ' + err.message);
        navigate('/registrant-portal/dashboard');
        return;
      } finally {
        if (!isEditMode) setLoading(false); 
      }
    };
    fetchInitialData();
  }, [eventId, isEditMode, currentRegistrant?._id, navigate]); // Removed editingAbstract from dep array here

  // Effect to load abstract data if in edit mode
  useEffect(() => {
    if (isEditMode && eventId && currentRegistrant?._id && eventDetails) { // Ensure eventDetails (for categories) is loaded
      setLoading(true); 
      const fetchAbstractToEdit = async () => {
        try {
          const response = await abstractService.getAbstractById(eventId, abstractIdFromParams);
          if (response.success && response.data) {
            const abstractData = response.data;
            setEditingAbstract(abstractData);
            
            let categoryValue = '';
            let validCategoryForEdit = null;
            // Use categories from state, which are already processed
            if (abstractData.category && categories.length > 0) { 
                const catId = typeof abstractData.category === 'object' ? abstractData.category._id : abstractData.category;
                validCategoryForEdit = categories.find(cat => cat.value === catId);
                if (validCategoryForEdit) categoryValue = validCategoryForEdit.value;
            }

            let topicValue = ''; // This is for subTopic ID
            if (validCategoryForEdit && (abstractData.subTopic || abstractData.topic)) { // Check original subTopic or topic
                const subTopics = validCategoryForEdit.subTopics || [];
                let subTopicIdToMatch = '';
                if (typeof abstractData.subTopic === 'object' && abstractData.subTopic._id) {
                  subTopicIdToMatch = abstractData.subTopic._id;
                } else if (typeof abstractData.subTopic === 'string') {
                  subTopicIdToMatch = abstractData.subTopic;
                } else if (typeof abstractData.topic === 'object' && abstractData.topic._id) { // Fallback to old topic field if it was ID
                  subTopicIdToMatch = abstractData.topic._id;
                } else if (typeof abstractData.topic === 'string') { // Fallback to old topic field if it was ID string
                   subTopicIdToMatch = abstractData.topic;
                }
                
                const validSubTopic = subTopics.find(st => st._id === subTopicIdToMatch || st.value === subTopicIdToMatch);
                if (validSubTopic) topicValue = validSubTopic._id || validSubTopic.value;
            }

            setAbstractForm({
              title: abstractData.title || '',
              authors: abstractData.authors || '',
              affiliations: abstractData.authorAffiliations || abstractData.affiliations || '',
              category: categoryValue,
              topic: topicValue || '', // This state field holds subTopic ID
              content: abstractData.content || '',
              file: null, 
              currentFileName: abstractData.fileName || null,
            });
             // Re-check deadline passed toast for edit mode after abstract is loaded
            if (submissionDeadlinePassed && abstractData.status?.toLowerCase() !== 'revision-requested') {
                toast.warn("Submission deadline has passed. Only abstracts requiring revision can be updated.", { duration: 5000 });
                 }
        } else {
            toast.error(response.message || 'Failed to load abstract for editing.');
                   navigate(`/registrant-portal/abstracts?event=${eventId}`, { replace: true });
                }
        } catch (error) {
          toast.error('Error loading abstract: ' + error.message);
          navigate(`/registrant-portal/abstracts?event=${eventId}`, { replace: true });
        } finally {
          setLoading(false); 
        }
      };
      
      if (categories.length > 0 || (eventDetails && !settings?.categories?.length)) {
          fetchAbstractToEdit();
      } else if (!loading && eventDetails && categories.length === 0 && settings?.categories?.length > 0){
          // This case means eventDetails loaded, settings show categories, but state `categories` isn't updated yet.
          // This might indicate a race condition or a need to ensure `categories` state is set before this effect runs.
          // Or, ensure fetchAbstractToEdit is robust enough if `categories` is temporarily empty.
          console.warn("Trying to fetch abstract for edit, but categories state might not be fully populated yet.");
          fetchAbstractToEdit(); // Attempt anyway, category mapping might be partial initially
      }
      
    } else if (!isEditMode) {
      resetAbstractForm();
      if (eventDetails && !loading) setLoading(false); 
    }
  }, [isEditMode, abstractIdFromParams, eventId, currentRegistrant, navigate, categories, eventDetails, settings, submissionDeadlinePassed]); // Added submissionDeadlinePassed


  const resetAbstractForm = useCallback(() => {
    setAbstractForm({
      title: '',
      authors: '',
      affiliations: '',
      category: categories[0]?.value || '',
      topic: '',
      content: '',
      file: null,
      currentFileName: null,
    });
    setFormErrors({});
    setEditingAbstract(null); 
    setSubmitMessage({ type: '', text: '' });
     const fileInput = document.getElementById('file-upload-input'); 
     if (fileInput) fileInput.value = '';
  }, [categories]);

  useEffect(() => { // Ensure form is reset if categories change and it's a new form
    if (!isEditMode) {
        resetAbstractForm();
    }
  }, [categories, isEditMode, resetAbstractForm]);


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAbstractForm(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleSelectChange = (e) => {
    const { name, value } = e.target;
    setAbstractForm(prev => ({ ...prev, [name]: value, ...(name === 'category' && { topic: '' }) })); // Reset topic if category changes
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: null }));
    if (name === 'category' && formErrors.topic) setFormErrors(prev => ({ ...prev, topic: null}));
  };

  const handleFileChange = (selectedFile) => {
      setAbstractForm(prev => ({
          ...prev,
      file: selectedFile,
      currentFileName: selectedFile ? selectedFile.name : (editingAbstract?.fileName && !selectedFile ? editingAbstract.fileName : null)
      }));
    if (formErrors.file) setFormErrors(prev => ({ ...prev, file: null }));
      if (!selectedFile) {
          const fileInput = document.getElementById('file-upload-input');
          if (fileInput) fileInput.value = '';
      }
  };
  
  const handleRemoveFile = () => {
    setAbstractForm(prev => ({ ...prev, file: null, currentFileName: null }));
    // If there was an initial file and we remove it, this state should be clear
    if (isEditMode && editingAbstract?.filePath) {
        // We might need a flag to indicate the original file should be deleted on submit
        // For now, just clearing the selection. The backend will handle dissociation if a new file is (not) uploaded.
       }
  };

  const validateAbstractForm = () => {
    const errors = {};
    const { title, authors, category, affiliations, content, file } = abstractForm;

    if (!title?.trim()) errors.title = 'Title is required.';
    if (!authors?.trim()) errors.authors = 'Authors are required.';
    // Affiliations are no longer mandatory
    // if (!affiliations?.trim()) errors.affiliations = 'Affiliations are required.';
    if (!category) errors.category = 'Category is required.';

    // The requirement for either content or a file is removed.
    // const contentText = content?.replace(/<(.|\n)*?>/g, '').trim();
    // if (!contentText && !file && !(isEditMode && editingAbstract?.filePath)) {
    //   errors.contentOrFile = 'Either abstract content or a file is required.';
    // }

    // Client-side check for duplicate category submission by the same user for the same event
    if (!isEditMode && userAbstracts && userAbstracts.length > 0 && eventDetails && eventId) {
      const eventCategories = eventDetails?.abstractSettings?.categories || [];
      // Ensure getCategoryNameById is available and correctly used
      const selectedCategoryObject = eventCategories.find(cat => cat._id === category || cat.value === category);
      const selectedCategoryName = selectedCategoryObject ? selectedCategoryObject.name : 'Unknown Category';

      if (selectedCategoryName && selectedCategoryName !== 'Unknown Category') {
        const hasSubmittedCategory = userAbstracts.some(abs => {
          // Ensure comparison is robust, abs.category might be an ID
          const abstractCategoryObject = eventCategories.find(cat => cat._id === abs.category || cat.value === abs.category);
          const abstractCategoryName = abstractCategoryObject ? abstractCategoryObject.name : 'Unknown Category';
          return abstractCategoryName === selectedCategoryName && abs.eventId === eventId;
      });
        if (hasSubmittedCategory) {
          errors.category = `You have already submitted an abstract for the category: ${selectedCategoryName}.`;
      }
    }
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitAbstract = async (e) => {
    e.preventDefault();
    if (submissionDeadlinePassed && isEditMode && editingAbstract?.status?.toLowerCase() !== 'revision-requested') { 
       toast.error("The submission deadline has passed. Only abstracts requiring revision can be updated.");
        return;
    } else if (submissionDeadlinePassed && !isEditMode) {
        toast.error("The submission deadline has passed. Cannot submit new abstract.");
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

    // Construct metadata payload (JSON)
    const metadataPayload = {
      title: abstractForm.title,
      authors: abstractForm.authors,
      authorAffiliations: abstractForm.affiliations, // Ensure backend handles 'authorAffiliations'
      category: abstractForm.category, // This is category ID
      subTopic: abstractForm.topic, // abstractForm.topic stores subTopic ID
      topic: getCategoryNameById(abstractForm.category, categories), // This sends Category Name as 'topic'
      content: abstractForm.content,
      event: eventId,
      registration: currentRegistrant._id,
      // Do not include file info in metadata payload
    };
    
    // If content is empty and file is present, mimic AbstractPortal's behavior (optional)
    if (!metadataPayload.content && abstractForm.file) {
        metadataPayload.content = '[See attached file]';
    }


    try {
      let abstractIdToUse = abstractIdFromParams;
      let metadataResponse;

      if (isEditMode) {
        metadataResponse = await abstractService.updateAbstract(eventId, abstractIdToUse, metadataPayload);
      } else {
        metadataResponse = await abstractService.createAbstract(eventId, metadataPayload);
        if (metadataResponse.success && metadataResponse.data?._id) {
          abstractIdToUse = metadataResponse.data._id; // Get new abstract ID for file upload
        }
      }
      
      if (metadataResponse.success) {
        toast.success(`Abstract metadata ${isEditMode ? 'updated' : 'submitted'} successfully!`);

        // Step 2: Upload file if present
        if (abstractForm.file && abstractIdToUse) {
          toast.loading('Uploading file...');
          const fileUploadResponse = await abstractService.uploadAbstractFile(eventId, abstractIdToUse, abstractForm.file);
          toast.dismiss(); // Dismiss loading toast
          if (fileUploadResponse.success) {
            toast.success('File uploaded successfully!');
          } else {
            toast.error(`File upload failed: ${fileUploadResponse.message || 'Unknown error'}`);
            // Abstract metadata was saved, but file upload failed. User might need to re-upload.
          }
        } else if (isEditMode && !abstractForm.currentFileName && editingAbstract?.fileName && abstractForm.file === null) {
            // Logic to explicitly tell backend to remove file if UI indicated removal and no new file.
            // Current `updateAbstract` on backend might not support this directly for registrants.
            // `uploadAbstractFile` with null or a special flag could be an option, or admin action.
            // For now, if user removes file from form and doesn't add new one, existing server file persists unless `uploadAbstractFile` replaces it.
            // If we want to support explicit deletion by registrant without new upload:
            // await abstractService.removeAbstractFile(eventId, abstractIdToUse); // Hypothetical service call
            console.log("File was removed from form, but no new file provided. Existing server file might persist or need admin removal if not replaced.");
        }
        
        navigate(`/registrant-portal/abstracts?event=${eventId}`, { replace: true });

      } else {
        setSubmitMessage({ type: 'error', text: metadataResponse.message || 'Submission failed.' });
        toast.error(metadataResponse.message || 'Submission failed.');
         if (metadataResponse.errors) { // Assuming backend might send structured errors
           const backendErrors = {};
           for (const key in metadataResponse.errors) {
             backendErrors[key === 'authorAffiliations' ? 'affiliations' : key] = metadataResponse.errors[key].msg || 'Invalid value';
           }
           setFormErrors(prev => ({ ...prev, ...backendErrors }));
         }
      }
    } catch (error) {
        const errorMsg = error.response?.data?.message || error.message || 'An unexpected error occurred.';
      setSubmitMessage({ type: 'error', text: errorMsg });
      toast.error(errorMsg);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Conditional rendering for loading, errors, or the form
     if (!eventId) {
    return <MuiAlert severity="error" sx={{m:2}}>Event ID not found. Cannot load abstract submission form.</MuiAlert>;
  }
  if (authLoading || !currentRegistrant) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 3, height: 'calc(100vh - 200px)' }}>
            <CircularProgress />
        <Typography sx={{ ml: 2 }}>{authLoading ? 'Authenticating...' : 'Loading registrant data...'}</Typography>
        </Box>
    );
  }
  if (loading) { // Covers loading event details or abstract for edit
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 3, height: 'calc(100vh - 200px)' }}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>
          {isEditMode && !editingAbstract ? 'Loading abstract details...' : 'Loading event settings...'}
            </Typography>
        </Box>
    );
  }
  if (!eventDetails) {
    return <MuiAlert severity="error" sx={{m:2}}>Failed to load event details. Please try again later.</MuiAlert>;
  }
  if (!settings) {
    return <MuiAlert severity="warning" sx={{m:2}}>Abstract submission settings are not configured for this event.</MuiAlert>;
  }
  if (!settings.enabled) {
    return <MuiAlert severity="info" sx={{m:2}}>Abstract submissions are not currently enabled for this event.</MuiAlert>;
  }

  // Main Form Render
    return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main', mb: 3, textAlign: 'center' }}>
            {isEditMode ? 'Edit Abstract' : 'Submit New Abstract'}
          </Typography>
        <Typography variant="subtitle1" gutterBottom sx={{ mb: 3, textAlign: 'center', color: 'text.secondary' }}>
          For event: {eventDetails.name}
        </Typography>

        {submitMessage.text && (
          <MuiAlert severity={submitMessage.type || 'info'} sx={{ mb: 3 }} onClose={() => setSubmitMessage({ type: '', text: '' })}>
            {submitMessage.text}
             </MuiAlert>
           )}

        <form onSubmit={handleSubmitAbstract}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth 
                label="Abstract Title"
                name="title" 
                value={abstractForm.title}
                onChange={handleInputChange}
                error={!!formErrors.title}
                helperText={formErrors.title}
                required
                disabled={submissionDeadlinePassed && !isEditMode}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth 
                label="Author(s)" 
                name="authors"
                value={abstractForm.authors}
                onChange={handleInputChange}
                error={!!formErrors.authors}
                helperText={formErrors.authors}
                required
                placeholder="e.g., John Doe, Jane Smith"
                disabled={submissionDeadlinePassed && !isEditMode}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth 
                label="Affiliation(s)"
                name="affiliations"
                value={abstractForm.affiliations}
                onChange={handleInputChange}
                error={!!formErrors.affiliations}
                helperText={formErrors.affiliations}
                placeholder="e.g., University Name, Organization"
                disabled={submissionDeadlinePassed && !isEditMode}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!formErrors.category} disabled={submissionDeadlinePassed && !isEditMode}>
                <InputLabel id="category-select-label">Category/Topic *</InputLabel>
                <Select
                  labelId="category-select-label"
                  name="category"
                  value={abstractForm.category}
                  onChange={handleSelectChange}
                  label="Category/Topic *"
                  disabled={isEditMode || (submissionDeadlinePassed && !isEditMode)} // Disable in edit mode
                >
                  {categories.length > 0 ? (
                    categories.map((cat) => (
                    <MenuItem key={cat.value} value={cat.value}>{cat.label}</MenuItem>
                    ))
                  ) : (
                    <MenuItem value=""><em>No categories available</em></MenuItem>
                  )}
                </Select>
                {formErrors.category && <FormHelperText>{formErrors.category}</FormHelperText>}
              </FormControl>
            </Grid>

            {eventDetails && eventDetails.abstractSettings && eventDetails.abstractSettings.categories && eventDetails.abstractSettings.categories.length > 0 && (
              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={!!formErrors.topic} disabled={!abstractForm.category || isEditMode || (submissionDeadlinePassed && !isEditMode)}>
                  <InputLabel id="subtopic-select-label">Sub Topic</InputLabel>
                <Select
                    labelId="subtopic-select-label"
                  name="topic"
                    value={abstractForm.topic}
                  onChange={handleSelectChange}
                    label="Sub Topic"
                    disabled={!abstractForm.category || isEditMode || (submissionDeadlinePassed && !isEditMode)} // Disable if no category, or in edit mode
                >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                  {categories
                    .find(cat => cat.value === abstractForm.category)
                    ?.subTopics?.map(st => (
                      <MenuItem key={st._id} value={st._id}>{st.name}</MenuItem>
                      ))}
                </Select>
                {formErrors.topic && <FormHelperText>{formErrors.topic}</FormHelperText>}
              </FormControl>
            </Grid>
            )}

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Abstract Content"
                name="content"
                value={abstractForm.content}
                onChange={handleInputChange}
                multiline
                rows={10}
                error={!!formErrors.content}
                helperText={formErrors.content || `Max ${settings?.maxLength || 500} words.`}
                disabled={submissionDeadlinePassed && !isEditMode}
              />
            </Grid>

            {settings?.allowFiles && (
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom sx={{mt:1}}>Attach File (Optional)</Typography>
                   <FileUploadControl
                     onChange={handleFileChange}
                     error={formErrors.file}
                  accept={settings.allowedFileTypes?.join(',') || '.pdf,.doc,.docx,.txt'}
                  maxSize={(settings.maxFileSizeMB || 5) * 1024 * 1024}
                     currentFileName={abstractForm.currentFileName}
                  onRemove={handleRemoveFile}
                  disabled={submissionDeadlinePassed && !isEditMode}
                   />
              </Grid>
            )}

            <Grid item xs={12} sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                    <Button 
                    variant="outlined"
                onClick={() => navigate(`/registrant-portal/abstracts?event=${eventId}`)}
                disabled={submissionDeadlinePassed && !isEditMode}
                >
                    Cancel
                    </Button>
                          <Button
                type="submit" 
                  variant="contained"
                  color="primary"
                disabled={submissionDeadlinePassed && !isEditMode}
                startIcon={submissionDeadlinePassed && !isEditMode ? <CircularProgress size={20} color="inherit" /> : null}
                >
                {submissionDeadlinePassed && !isEditMode ? 'Submission Deadline Passed' : (isEditMode ? 'Update Abstract' : 'Submit Abstract')}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
    );
}

export default AbstractSubmissionForm;                    