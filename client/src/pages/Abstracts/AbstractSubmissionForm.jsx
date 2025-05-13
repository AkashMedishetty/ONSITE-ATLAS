import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Alert, 
  Button, 
  Spinner 
} from '../../components/common';
import abstractService from '../../services/abstractService';
import eventService from '../../services/eventService';
import registrationService from '../../services/registrationService';

function AbstractSubmissionForm() {
  const { id, registrationId } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [events, setEvents] = useState([]);
  const [wordCount, setWordCount] = useState(0);
  
  const [formValues, setFormValues] = useState({
    eventId: '',
    registrationId: registrationId || '',
    title: '',
    authors: '',
    authorAffiliations: '',
    topic: '',
    content: ''
  });
  
  const [selectedEvent, setSelectedEvent] = useState(null);
  
  // Load events data and abstract data if in edit mode
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const eventsResponse = await eventService.getEvents({ abstractSettingsEnabled: true });
        
        if (Array.isArray(eventsResponse)) {
          setEvents(eventsResponse.filter(e => e.abstractSettings?.enabled));
        } else if (eventsResponse && eventsResponse.data) {
          setEvents(eventsResponse.data.filter(e => e.abstractSettings?.enabled));
        } else {
          setEvents([]);
        }
        
        // If we're in edit mode, load the abstract
        if (isEditMode) {
          await loadAbstract(id);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching events:', error);
        setError('Failed to load events with abstract submission enabled');
        setLoading(false);
      }
    };
    
    fetchEvents();
  }, [id, isEditMode]);
  
  // Load abstract data for editing
  const loadAbstract = async (abstractId) => {
    try {
      const abstractResponse = await abstractService.getAbstractById(abstractId);
      
      if (!abstractResponse.success) {
        throw new Error(abstractResponse.message || 'Failed to load abstract');
      }
      
      const abstract = abstractResponse.data;
      
      setFormValues({
        eventId: abstract.eventId,
        registrationId: abstract.registrationId,
        title: abstract.title,
        authors: abstract.authors,
        authorAffiliations: abstract.authorAffiliations || '',
        topic: abstract.topic,
        content: abstract.content
      });
      
      // Calculate word count
      calculateWordCount(abstract.content);
      
      setLoading(false);
    } catch (err) {
      console.error('Error loading abstract:', err);
      setError(err.message || 'Failed to load abstract data');
      setLoading(false);
    }
  };
  
  // Effect to update selected event when eventId changes
  useEffect(() => {
    if (formValues.eventId) {
      const event = events.find(e => e._id === formValues.eventId);
      setSelectedEvent(event);
    } else {
      setSelectedEvent(null);
    }
  }, [formValues.eventId, events]);
  
  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setFormValues(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Calculate word count for content
    if (name === 'content') {
      calculateWordCount(value);
    }
  };
  
  // Calculate word count
  const calculateWordCount = (content) => {
    if (!content) {
      setWordCount(0);
      return;
    }
    
    const words = content.trim().split(/\s+/);
    setWordCount(words.length);
  };
  
  // Check if deadline has passed
  const isDeadlinePassed = (deadlineDate) => {
    if (!deadlineDate) return false;
    const deadline = new Date(deadlineDate);
    const now = new Date();
    return now > deadline;
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Validate form
      if (!formValues.eventId) {
        throw new Error('Please select an event');
      }
      
      if (!formValues.registrationId) {
        throw new Error('Registration ID is required');
      }
      
      if (!formValues.title) {
        throw new Error('Title is required');
      }
      
      if (!formValues.authors) {
        throw new Error('Authors information is required');
      }
      
      if (!formValues.topic) {
        throw new Error('Please select a topic');
      }
      
      if (!formValues.content) {
        throw new Error('Abstract content is required');
      }
      
      // Check word count
      if (selectedEvent && wordCount > selectedEvent.abstractSettings.maxWordCount) {
        throw new Error(`Content exceeds the maximum word count of ${selectedEvent.abstractSettings.maxWordCount}`);
      }
      
      // Check deadline
      if (selectedEvent && isDeadlinePassed(selectedEvent.abstractSettings.deadlineDate)) {
        throw new Error('The submission deadline has passed');
      }
      
      // Validate registration ID exists
      if (!isEditMode) {
        const regResponse = await registrationService.getRegistrationById(formValues.registrationId);
        if (!regResponse.success) {
          throw new Error('Invalid registration ID. Please check and try again.');
        }
      }
      
      setSubmitting(true);
      setError(null);
      
      let response;
      if (isEditMode) {
        // Update existing abstract
        response = await abstractService.updateAbstract(id, formValues);
      } else {
        // Submit new abstract
        response = await abstractService.createAbstract(formValues);
      }
      
      if (!response.success) {
        throw new Error(response.message || `Failed to ${isEditMode ? 'update' : 'submit'} abstract`);
      }
      
      // Redirect to abstracts list or detail page
      navigate(isEditMode ? `/abstracts/${id}` : '/abstracts');
      
    } catch (err) {
      console.error('Error submitting abstract:', err);
      setError(err.message || `Failed to ${isEditMode ? 'update' : 'submit'} abstract`);
      setSubmitting(false);
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
        <span className="ml-2 text-gray-500">Loading...</span>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-primary-700">
          {isEditMode ? 'Edit Abstract' : 'Submit Abstract'}
        </h1>
        <p className="text-gray-500 mt-1">
          {isEditMode 
            ? 'Update your submitted abstract'
            : 'Submit your research abstract for review'}
        </p>
      </div>
      
      {error && (
        <Alert
          type="error"
          message={error}
          className="mb-6"
          onClose={() => setError(null)}
        />
      )}
      
      <div className="bg-white rounded-lg shadow-soft p-6">
        <form onSubmit={handleSubmit}>
          {/* Event Selection */}
          <div className="mb-6">
            <label htmlFor="eventId" className="block text-sm font-medium text-gray-700 mb-1">
              Event <span className="text-red-500">*</span>
            </label>
            <select
              id="eventId"
              name="eventId"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              value={formValues.eventId}
              onChange={handleInputChange}
              disabled={isEditMode}
              required
            >
              <option value="">Select an event</option>
              {events.map(event => (
                <option key={event._id} value={event._id}>
                  {event.name}
                </option>
              ))}
            </select>
            
            {selectedEvent && selectedEvent.abstractSettings && (
              <div className="mt-2 text-sm text-gray-500">
                <p>Submission deadline: {formatDate(selectedEvent.abstractSettings.deadlineDate)}</p>
                <p>Maximum word count: {selectedEvent.abstractSettings.maxWordCount} words</p>
              </div>
            )}
          </div>
          
          {/* Registration ID */}
          <div className="mb-6">
            <label htmlFor="registrationId" className="block text-sm font-medium text-gray-700 mb-1">
              Registration ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="registrationId"
              name="registrationId"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              value={formValues.registrationId}
              onChange={handleInputChange}
              disabled={isEditMode || !!registrationId}
              required
              placeholder="Your registration ID (e.g., CONF2023-0001)"
            />
            <p className="mt-1 text-sm text-gray-500">
              Enter the registration ID you received during event registration
            </p>
          </div>
          
          {/* Abstract Title */}
          <div className="mb-6">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Abstract Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              value={formValues.title}
              onChange={handleInputChange}
              required
              placeholder="Enter the title of your abstract"
            />
          </div>
          
          {/* Authors */}
          <div className="mb-6">
            <label htmlFor="authors" className="block text-sm font-medium text-gray-700 mb-1">
              Authors <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="authors"
              name="authors"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              value={formValues.authors}
              onChange={handleInputChange}
              required
              placeholder="e.g., John Smith, Jane Doe, Robert Johnson"
            />
            <p className="mt-1 text-sm text-gray-500">
              List all authors separated by commas
            </p>
          </div>
          
          {/* Author Affiliations */}
          <div className="mb-6">
            <label htmlFor="authorAffiliations" className="block text-sm font-medium text-gray-700 mb-1">
              Author Affiliations
            </label>
            <input
              type="text"
              id="authorAffiliations"
              name="authorAffiliations"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              value={formValues.authorAffiliations}
              onChange={handleInputChange}
              placeholder="e.g., University of Science, Research Institute"
            />
            <p className="mt-1 text-sm text-gray-500">
              List all affiliations of the authors
            </p>
          </div>
          
          {/* Topic Selection */}
          <div className="mb-6">
            <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-1">
              Topic <span className="text-red-500">*</span>
            </label>
            <select
              id="topic"
              name="topic"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              value={formValues.topic}
              onChange={handleInputChange}
              required
              disabled={!selectedEvent || !selectedEvent.abstractSettings}
            >
              <option value="">Select a topic</option>
              {selectedEvent && selectedEvent.abstractSettings && selectedEvent.abstractSettings.topics && 
                selectedEvent.abstractSettings.topics.map(topic => (
                  <option key={topic} value={topic}>
                    {topic}
                  </option>
                ))}
            </select>
          </div>
          
          {/* Abstract Content */}
          <div className="mb-6">
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
              Abstract Content <span className="text-red-500">*</span>
            </label>
            <textarea
              id="content"
              name="content"
              rows={8}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              value={formValues.content}
              onChange={handleInputChange}
              required
              placeholder="Enter your abstract content here..."
            ></textarea>
            <div className="mt-1 flex justify-between">
              <p className="text-sm text-gray-500">
                Include introduction, methods, results, and conclusions
              </p>
              <p className={`text-sm ${
                selectedEvent && selectedEvent.abstractSettings && 
                wordCount > selectedEvent.abstractSettings.maxWordCount
                  ? 'text-red-500 font-medium'
                  : 'text-gray-500'
              }`}>
                {wordCount} / {selectedEvent && selectedEvent.abstractSettings 
                  ? selectedEvent.abstractSettings.maxWordCount 
                  : '—'} words
              </p>
            </div>
          </div>
          
          {/* Submit Button */}
          <div className="mt-8 flex justify-end space-x-3">
            <Link
              to="/abstracts"
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Cancel
            </Link>
            <Button
              type="submit"
              variant="primary"
              disabled={
                submitting || 
                (selectedEvent && selectedEvent.abstractSettings && 
                 wordCount > selectedEvent.abstractSettings.maxWordCount)
              }
              isLoading={submitting}
              loadingText="Processing..."
            >
              {isEditMode ? 'Update Abstract' : 'Submit Abstract'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AbstractSubmissionForm; 