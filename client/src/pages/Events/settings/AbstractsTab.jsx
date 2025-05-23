import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Switch, Input, Textarea, Spinner } from '../../../components/common';
import api from '../../../services/api';
import eventService from '../../../services/eventService';

const AbstractsTab = ({ event, setEvent, updateAbstractSettings, setFormChanged }) => {
  const isFirstRender = useRef(true);
  const userInitiatedChange = useRef(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [abstractSettings, setAbstractSettings] = useState({
    enabled: false,
    isOpen: false,
    deadline: null,
    maxLength: 500,
    allowEditing: false,
    guidelines: '',
    categories: [],
    notifyOnSubmission: false,
    allowFiles: false,
    maxFileSize: 5,
  });
  const [reviewers, setReviewers] = useState([]);
  const [loadingReviewers, setLoadingReviewers] = useState(false);
  const [reviewerError, setReviewerError] = useState(null);
  const lastEventIdRef = useRef(null);

  // Load settings from event data on mount or when event changes
  useEffect(() => {
    if (!event || !event._id) return;
    if (lastEventIdRef.current !== event._id) {
      console.log('[AbstractsTab] Loading settings from event', event._id);
      let settings = {
        ...abstractSettings, // Use default values as fallback
        ...event.abstractSettings, // Override with actual event values
      };
      // Sanitize reviewerIds in categories to only keep valid ObjectId strings and convert to string
      if (settings.categories && Array.isArray(settings.categories)) {
        settings.categories = settings.categories.map(cat => {
          if (cat.reviewerIds && Array.isArray(cat.reviewerIds)) {
            cat.reviewerIds = cat.reviewerIds
              .filter(id => (typeof id === 'string' || (id && typeof id === 'object' && id.toString)))
              .map(id => typeof id === 'string' ? id : (id && id.toString ? id.toString() : ''))
              .filter(id => /^[a-f\d]{24}$/i.test(id));
          }
          return cat;
        });
      }
      setAbstractSettings(settings);
      lastEventIdRef.current = event._id;
    }
  }, [event?._id]);

  // Fetch reviewers for this event
  useEffect(() => {
    if (!event || !event._id) return;
    setLoadingReviewers(true);
    setReviewerError(null);
    eventService.getEventReviewers(event._id)
      .then(res => {
        if (res.success && Array.isArray(res.data)) setReviewers(res.data);
        else {
          setReviewers([]);
          setReviewerError(res.message || 'Failed to load reviewers');
        }
      })
      .catch(err => {
        setReviewers([]);
        setReviewerError(err.message || 'Error loading reviewers');
      })
      .finally(() => setLoadingReviewers(false));
  }, [event?._id]);

  // Format date from ISO to YYYY-MM-DD
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return ''; // Invalid date
      
      // Format as YYYY-MM-DD
      return date.toISOString().split('T')[0];
    } catch (err) {
      console.error('Error formatting date:', err);
      return '';
    }
  };

  // Format date from YYYY-MM-DD to ISO
  const formatDateForApi = (dateString) => {
    if (!dateString) return null;
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return null;
      return date.toISOString();
    } catch (err) {
      console.error('Error formatting date for API:', err);
      return null;
    }
  };

  // Update parent component when user has changed settings
  useEffect(() => {
    if (isFirstRender.current) return;
    
    if (userInitiatedChange.current) {
      console.log("User changed abstract settings, updating parent");
      
      if (updateAbstractSettings) {
        updateAbstractSettings(abstractSettings);
      } else if (setEvent) {
        setEvent((prev) => ({
          ...prev,
          abstractSettings,
        }));
      }
      
      if (setFormChanged) {
        setFormChanged(true);
      }
      
      userInitiatedChange.current = false;
    }
  }, [abstractSettings, updateAbstractSettings, setEvent, setFormChanged]);

  const handleChange = (field, value) => {
    userInitiatedChange.current = true;
    setAbstractSettings(prev => ({
      ...prev,
      [field]: field === 'deadline' ? formatDateForApi(value) : value
    }));
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    handleChange(name, type === 'checkbox' ? checked : value);
  };

  const handleAddCategory = () => {
    userInitiatedChange.current = true;
    setAbstractSettings(prev => ({
      ...prev,
      categories: [...prev.categories, { name: '', description: '', subTopics: [] }]
    }));
  };

  // Add debug log before handleCategoryChange
  console.log('reviewers', reviewers);

  const handleCategoryChange = (index, field, value) => {
    userInitiatedChange.current = true;
    const updatedCategories = [...abstractSettings.categories];
    let newValue = value; // For reviewerIds, 'value' is the 'selected' array from select onChange

    // If 'value' (the 'selected' array from onChange) is already processed to be _id strings,
    // no further mapping/filtering is needed here.
    // The select onChange handler is now responsible for providing a clean array of _id strings.
    
    updatedCategories[index] = {
      ...updatedCategories[index],
      [field]: newValue 
    };
    setAbstractSettings(prev => ({
      ...prev,
      categories: updatedCategories
    }));
    // Debug log
    if (field === 'reviewerIds') {
      console.log('[AbstractsTab HIDEBUG] handleCategoryChange for reviewerIds. New value:', newValue, 'for category index:', index);
    }
  };

  const handleAddSubTopic = (categoryIndex) => {
    userInitiatedChange.current = true;
    const updatedCategories = [...abstractSettings.categories];
    if (!updatedCategories[categoryIndex].subTopics) {
      updatedCategories[categoryIndex].subTopics = [];
    }
    
    updatedCategories[categoryIndex].subTopics.push({ name: '', description: '' });
    
    setAbstractSettings(prev => ({
      ...prev,
      categories: updatedCategories
    }));
  };

  const handleSubTopicChange = (categoryIndex, subTopicIndex, field, value) => {
    userInitiatedChange.current = true;
    const updatedCategories = [...abstractSettings.categories];
    
    if (!updatedCategories[categoryIndex].subTopics) {
      updatedCategories[categoryIndex].subTopics = [];
    }
    
    updatedCategories[categoryIndex].subTopics[subTopicIndex] = {
      ...updatedCategories[categoryIndex].subTopics[subTopicIndex],
      [field]: value
    };
    
    setAbstractSettings(prev => ({
      ...prev,
      categories: updatedCategories
    }));
  };

  const handleDeleteCategory = (index) => {
    userInitiatedChange.current = true;
    const updatedCategories = [...abstractSettings.categories];
    updatedCategories.splice(index, 1);
    
    setAbstractSettings(prev => ({
      ...prev,
      categories: updatedCategories
    }));
  };

  const handleDeleteSubTopic = (categoryIndex, subTopicIndex) => {
    userInitiatedChange.current = true;
    const updatedCategories = [...abstractSettings.categories];
    
    if (updatedCategories[categoryIndex].subTopics) {
      updatedCategories[categoryIndex].subTopics.splice(subTopicIndex, 1);
      
      setAbstractSettings(prev => ({
        ...prev,
        categories: updatedCategories
      }));
    }
  };

  const saveAbstractSettings = async () => {
    if (!event || !event._id) {
      setError('Cannot save settings: Event ID is missing');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      console.log(`Saving abstract settings for event ${event._id}`);
      console.log('Abstract settings to save:', abstractSettings);
      
      const response = await eventService.saveAbstractSettings(event._id, abstractSettings);
      
      console.log('Abstract settings saved successfully:', response);

      // Fetch the latest event data from the backend to ensure UI is up to date
      if (response && response.success) {
        const latestEventResp = await eventService.getEventById(event._id);
        if (latestEventResp && latestEventResp.success && latestEventResp.data) {
          if (setEvent) {
            setEvent(latestEventResp.data);
          }
        } else {
          // fallback: update only abstractSettings if event fetch fails
          if (updateAbstractSettings) {
            updateAbstractSettings(abstractSettings);
          } else if (setEvent) {
            setEvent(prevEvent => ({
              ...prevEvent,
              abstractSettings: response.data || abstractSettings
            }));
          }
        }
        // After saving, settings are no longer "changed" by the user
        userInitiatedChange.current = false;
        setFormChanged(false);
      }
    } catch (err) {
      console.error('Error saving abstract settings:', err);
      setError(err.response?.data?.message || 'Failed to save abstract settings');
    } finally {
      setSaving(false);
    }
  };

  if (!event) {
    return <Spinner size="lg" />;
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-visible">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Abstract Submission Settings</h3>
          <Button
            onClick={saveAbstractSettings}
            variant="primary"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {saving && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded mb-4 flex items-center">
            <svg className="animate-spin h-5 w-5 mr-3 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Saving abstract settings...</span>
          </div>
        )}
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium">Enable Abstract Submissions</h4>
              <p className="text-xs text-gray-500 mt-1">Allow participants to submit abstracts for this event</p>
            </div>
            <Switch 
              label="Enable"
              checked={abstractSettings.enabled} 
              onChange={(checked) => handleChange('enabled', checked)} 
            />
          </div>
          
          {abstractSettings.enabled && (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium">Open for Submissions</h4>
                  <p className="text-xs text-gray-500 mt-1">Allow abstracts to be submitted now</p>
                </div>
                <Switch 
                  label="Open"
                  checked={abstractSettings.isOpen} 
                  onChange={(checked) => handleChange('isOpen', checked)} 
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Submission Deadline</label>
                  <Input
                    type="date"
                    name="deadline"
                    value={formatDateForInput(abstractSettings.deadline)} 
                    onChange={handleInputChange} 
                    placeholder="Select deadline date"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Maximum Word Count</label>
                  <Input
                    type="number"
                    name="maxLength"
                    min={100}
                    max={5000}
                    value={abstractSettings.maxLength}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium">Allow Editing After Submission</h4>
                  <p className="text-xs text-gray-500 mt-1">Let authors edit their abstracts after submission</p>
                </div>
                <Switch 
                  label="Allow Editing"
                  checked={abstractSettings.allowEditing} 
                  onChange={(checked) => handleChange('allowEditing', checked)} 
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium">Allow File Attachments</h4>
                  <p className="text-xs text-gray-500 mt-1">Let authors attach files to their abstracts</p>
                </div>
                <Switch 
                  label="Allow Files"
                  checked={abstractSettings.allowFiles} 
                  onChange={(checked) => handleChange('allowFiles', checked)} 
                />
              </div>
              
              {abstractSettings.allowFiles && (
                <div>
                  <label className="block text-sm font-medium mb-1">Maximum File Size (MB)</label>
                  <Input
                    type="number"
                    name="maxFileSize"
                    min={1}
                    max={50}
                    value={abstractSettings.maxFileSize}
                    onChange={handleInputChange}
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium mb-1">Abstract Submission Guidelines</label>
                <Textarea
                  rows={4}
                  name="guidelines"
                  value={abstractSettings.guidelines}
                  onChange={handleInputChange}
                  placeholder="Enter guidelines for abstract submission..."
                />
              </div>
              
              {/* Categories Section */}
              <div className="mt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium">Abstract Categories</h3>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleAddCategory}
                    >
                      Add Category
                    </Button>
                  </div>
                </div>
                
                {abstractSettings.categories.length === 0 ? (
                  <div className="bg-gray-50 p-4 rounded-md text-center text-gray-500">
                    No categories defined. Add categories to allow abstract submissions.
                  </div>
                ) : (
                  <div className="space-y-6">
                {abstractSettings.categories.map((category, index) => (
                      <div key={category._id || index} className="border border-gray-200 rounded-md p-4 bg-white">
                        <div className="flex justify-between items-start mb-4">
                          <div className="w-full">
                            <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Category Name
                                </label>
                        <Input
                                  type="text"
                          value={category.name}
                          onChange={(e) => handleCategoryChange(index, 'name', e.target.value)}
                                  placeholder="Category name"
                        />
                      </div>
                      <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Description
                                </label>
                        <Input
                                  type="text"
                                  value={category.description || ''}
                          onChange={(e) => handleCategoryChange(index, 'description', e.target.value)}
                                  placeholder="Category description"
                                />
                              </div>
                            </div>
                            
                            {/* Reviewer Assignment UI */}
                            <div className="mt-2 mb-4">
                              <label className="block text-sm font-medium text-gray-700 mb-1">Assign Reviewers</label>
                              {console.log('category.reviewerIds', category.reviewerIds)}
                              {console.log('[AbstractsTab HIDEBUG] reviewers array:', reviewers)}
                              {loadingReviewers ? (
                                <div className="text-gray-500 text-sm">Loading reviewers...</div>
                              ) : reviewerError ? (
                                <div className="text-red-500 text-sm">{reviewerError}</div>
                              ) : reviewers.length === 0 ? (
                                <div className="text-gray-500 text-sm">No reviewers available for this event.</div>
                              ) : (
                                <>
                                  {console.log('Rendering select with reviewers:', reviewers)}
                                  <select
                                    multiple
                                    className="border rounded px-2 py-1 text-sm w-full min-h-[40px]"
                                    value={category.reviewerIds ? category.reviewerIds.map(String) : []}
                                    onChange={e => {
                                      if (loadingReviewers || reviewers.length === 0) {
                                        // This alert might be disruptive if reviewers load slightly late.
                                        // console.warn('Reviewers are still loading or not available.');
                                        return;
                                      }

                                      console.log('[AbstractsTab HIDEBUG] --- Reviewer Select onChange Fired ---');
                                      console.log('[AbstractsTab HIDEBUG] Raw e.target.selectedOptions:', e.target.selectedOptions);
                                      console.log('[AbstractsTab HIDEBUG] Raw e.target.selectedOptions.length:', e.target.selectedOptions.length);

                                      const rawValues = [];
                                      for (let i = 0; i < e.target.selectedOptions.length; i++) {
                                        const opt = e.target.selectedOptions[i];
                                        console.log(`[AbstractsTab HIDEBUG] Option ${i}: value="${opt.value}", text="${opt.text}", selected="${opt.selected}"`);
                                        rawValues.push(opt.value);
                                      }
                                      console.log('[AbstractsTab HIDEBUG] Raw values from selected options:', rawValues);

                                      // Process selected options to get reviewer _id strings
                                      const selectedReviewerIds = Array.from(e.target.selectedOptions).map(opt => {
                                        // opt.value should be the reviewer._id or id
                                        if (/^[a-f\d]{24}$/i.test(opt.value)) {
                                          return String(opt.value);
                                        }
                                        // Fallback (should ideally not be needed if option values are _ids)
                                        console.warn(`[AbstractsTab HIDEBUG] opt.value "${opt.value}" is not a valid ObjectId. Trying to find by display text.`);
                                        const foundReviewer = reviewers.find(r => `${r.name} (${r.email})` === opt.text || String(r._id || r.id) === opt.value);
                                        return foundReviewer ? String(foundReviewer._id || foundReviewer.id) : null;
                                      }).filter(id => id && /^[a-f\d]{24}$/i.test(id));
                                      
                                      console.log('[AbstractsTab HIDEBUG] Processed selected reviewer IDs:', selectedReviewerIds);
                                      handleCategoryChange(index, 'reviewerIds', selectedReviewerIds);
                                    }}
                                  >
                                    {reviewers.map(r => (
                                      <option key={String(r._id || r.id)} value={String(r._id || r.id)}>{r.name} ({r.email})</option>
                                    ))}
                                  </select>
                                </>
                              )}
                              {category.reviewerIds && category.reviewerIds.length > 0 && reviewers.length > 0 && (
                                <div className="mt-1 text-xs text-gray-600">
                                  Assigned: {category.reviewerIds.map(id => {
                                    const found = reviewers.find(r => String(r._id) === String(id));
                                    return found ? `${found.name} (${found.email})` : id;
                                  }).join(', ')}
                                </div>
                              )}
                            </div>
                            
                            {/* Sub-topics Section - Enhanced with better visibility */}
                            <div className="mt-4 border-t border-gray-200 pt-4">
                              <div className="flex justify-between items-center mb-3">
                                <h4 className="text-md font-medium text-primary-600">Sub-Topics</h4>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleAddSubTopic(index)}
                                  className="text-primary-600 border-primary-600"
                                >
                                  Add Sub-Topic
                                </Button>
                              </div>
                              
                              {/* Information message about sub-topics */}
                              <div className="bg-blue-50 p-3 rounded-md mb-3 text-sm text-blue-600 border border-blue-200">
                                <p>
                                  <span className="font-semibold">Important:</span> Sub-topics allow registrants to further categorize their abstract submissions. 
                                  When a registrant selects this category, they'll be able to choose from these sub-topics in a dropdown menu.
                                </p>
                              </div>
                              
                              {!category.subTopics || category.subTopics.length === 0 ? (
                                <div className="bg-gray-50 p-3 rounded-md text-center text-gray-600">
                                  No sub-topics defined. Add sub-topics to provide more specific options for this category.
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  {category.subTopics.map((subTopic, subIndex) => (
                                    <div key={subTopic._id || subIndex} className="flex items-start space-x-2 bg-gray-50 p-3 rounded-md">
                                      <div className="flex-grow grid grid-cols-2 gap-3">
                                        <div>
                                          <Input
                                            type="text"
                                            value={subTopic.name || ''}
                                            onChange={(e) => handleSubTopicChange(index, subIndex, 'name', e.target.value)}
                                            placeholder="Sub-topic name"
                                            className="text-sm"
                                          />
                                        </div>
                                        <div className="flex space-x-2">
                                          <Input
                                            type="text"
                                            value={subTopic.description || ''}
                                            onChange={(e) => handleSubTopicChange(index, subIndex, 'description', e.target.value)}
                                            placeholder="Sub-topic description (optional)"
                                            className="text-sm"
                                          />
                                          <Button
                                            variant="icon"
                                            size="xs"
                                            onClick={() => handleDeleteSubTopic(index, subIndex)}
                                            className="text-red-500"
                                          >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <Button
                            variant="icon"
                            size="sm"
                            onClick={() => handleDeleteCategory(index)}
                            className="text-red-500 ml-2"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </Card>
      
      {/* New debugging section */}
      <Card className="border-dashed border-orange-300 mt-8">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-medium text-orange-700">Troubleshooting & Diagnostics</h3>
          <div className="text-sm text-orange-600">Admin Only</div>
        </div>
        
        <div className="p-3 bg-orange-50 rounded-md mb-4">
          <p className="text-sm text-orange-800">
            Use this section to diagnose any issues with abstract settings and sub-topics. 
            This information is only visible to administrators.
          </p>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          <div>
            <h4 className="text-md font-medium text-gray-700 mb-2">Categories & Sub-topics Structure</h4>
            <pre className="bg-gray-800 text-gray-200 p-3 rounded-md text-sm overflow-auto max-h-60">
              {JSON.stringify(abstractSettings.categories, null, 2)}
            </pre>
          </div>
          
          <div>
            <h4 className="text-md font-medium text-gray-700 mb-2">Implementation Checklist</h4>
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li className={abstractSettings.enabled ? "text-green-600" : "text-red-600"}>
                Abstract submissions {abstractSettings.enabled ? "are enabled" : "are disabled"}
              </li>
              <li className={abstractSettings.categories.length > 0 ? "text-green-600" : "text-red-600"}>
                {abstractSettings.categories.length} categories defined
                {abstractSettings.categories.length === 0 && " - you need at least one category"}
              </li>
              
              <li className={abstractSettings.categories.some(cat => cat.subTopics && cat.subTopics.length > 0) ? "text-green-600" : "text-yellow-600"}>
                {abstractSettings.categories.filter(cat => cat.subTopics && cat.subTopics.length > 0).length} 
                {" "}categories have sub-topics defined
              </li>
              
              <li className="text-gray-700">
                Form validation check: Are all required fields filled out?
                <ul className="list-disc pl-5 mt-1">
                  {abstractSettings.categories.map((cat, idx) => (
                    <li key={idx} className={cat.name ? "text-green-600" : "text-red-600"}>
                      Category {idx + 1}: {cat.name || "Missing name!"}
                      {cat.subTopics && cat.subTopics.length > 0 && (
                        <ul className="list-disc pl-5">
                          {cat.subTopics.map((sub, subIdx) => (
                            <li key={sub._id || subIdx} className={sub.name ? "text-green-600" : "text-red-600"}>
                              Sub-topic {subIdx + 1}: {sub.name || "Missing name!"}
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
          </div>
          
          <div className="border-t border-gray-200 pt-4 mt-2">
            <Button 
              variant="secondary"
              size="sm"
              onClick={() => {
                // Save settings and force a refresh of all related components
                saveAbstractSettings().then(() => {
                  alert('Settings saved. Check the form to make sure sub-topics are now visible.');
                });
              }}
            >
              Save & Test Sub-topics
            </Button>
            <p className="text-xs text-gray-500 mt-2">
              After saving, test the submission form to verify sub-topics are correctly displayed.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AbstractsTab; 
                                         