import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircleIcon, TrashIcon, ClockIcon, PencilIcon, PrinterIcon } from '@heroicons/react/24/outline';
import { Card, Input, Switch, Button, Textarea, Badge } from '../../../components/common';
import { resourceService } from '../../../services';
import { format } from 'date-fns';

const ResourcesTab = ({ event, setEvent, setFormChanged = () => {}, initialSection }) => {
  const [activeSection, setActiveSection] = useState(initialSection || 'food');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [newMealName, setNewMealName] = useState('');
  const [newKitItem, setNewKitItem] = useState({ name: '', description: '', quantity: 0 });
  const [newCertificateType, setNewCertificateType] = useState({ name: '', description: '' });
  const [newPrintTemplate, setNewPrintTemplate] = useState({ 
    name: '', 
    type: 'attendance',
    fields: ['name'] 
  });
  const [editingMeal, setEditingMeal] = useState(null);
  const [localResourceSettings, setLocalResourceSettings] = useState({
    food: { enabled: true, days: [] },
    kits: { enabled: true, items: [] },
    certificates: { enabled: true, types: [] },
    certificatePrinting: { enabled: true, templates: [] }
  });
  
  const hasLoadedOnce = useRef(false);
  const lastLoadedSection = useRef(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (initialSection && initialSection !== activeSection && [
      'food', 'kits', 'certificates', 'certificatePrinting'
    ].includes(initialSection)) {
      console.log(`ResourceSettings: Setting activeSection from initialSection prop: ${initialSection}`);
      setActiveSection(initialSection);
      lastLoadedSection.current = null; 
    }
  }, [initialSection]);

  useEffect(() => {
    if (!event?._id) {
      console.log("ResourceSettings: Skipping load, no event ID.");
      return;
    }

    if (!hasLoadedOnce.current) {
      console.log("ResourceSettings: Initializing local state for the first time.");
      console.log("ResourceSettings: Initial event.resourceSettings:", event.resourceSettings);
      const initialSettings = event.resourceSettings || {
        food: { enabled: true, days: [] },
        kits: { enabled: true, items: [] },
        certificates: { enabled: true, types: [] },
        certificatePrinting: { enabled: true, templates: [] }
      };
      setLocalResourceSettings(initialSettings);
    }

    if (activeSection !== lastLoadedSection.current || !hasLoadedOnce.current) {
        console.log(`ResourceSettings: Conditions met. Triggering load for event ${event._id}, section ${activeSection}`);
        loadResourceSettings(activeSection, event._id);
        lastLoadedSection.current = activeSection;
        hasLoadedOnce.current = true;
    } else {
        console.log(`ResourceSettings: Skipping load for section ${activeSection}, already loaded.`);
    }

  }, [event?._id, activeSection, event?.resourceSettings]);

  const loadResourceSettings = useCallback(async (section, eventId) => {
    if (loading) {
        console.log("ResourceSettings: Load request ignored, already loading.");
        return;
    }
    
    try {
      setLoading(true);
      setError(null);
      console.log(`ResourceSettings: Loading settings for section: ${section}, Event ID: ${eventId}`);

      // Add a timestamp to avoid cached responses
      const timestamp = Date.now();
      let settingsData = null;
      let needsGeneration = false;
      let generatedData = null;

      if (section === 'food') {
        const response = await resourceService.getFoodSettings(eventId, timestamp);
        console.log('Food settings response:', response);
        if (response && response.success && response.data) {
          settingsData = response.data.settings || { enabled: true, days: [] };
          if ((!settingsData.days || settingsData.days.length === 0) && event?.startDate && event?.endDate) {
            console.log('No food days found in loaded data. Flagging for generation.');
            needsGeneration = true;
          }
        } else {
          setError(response?.message || 'Failed to load food settings');
        }
      } else if (section === 'kits') {
        const response = await resourceService.getKitSettings(eventId, timestamp);
        console.log('Kit settings response:', response);
        if (response && response.success && response.data) {
           settingsData = response.data.settings || { enabled: true, items: [] };
           if (!settingsData.items) settingsData.items = [];
        } else {
          setError(response?.message || 'Failed to load kit settings');
        }
      } else if (section === 'certificates') {
         const response = await resourceService.getCertificateSettings(eventId, timestamp);
         console.log('Certificate settings response:', response);
         if (response && response.success && response.data) {
            settingsData = response.data.settings || { enabled: true, types: [] };
            if (!settingsData.types) settingsData.types = [];
         } else {
            setError(response?.message || 'Failed to load certificate settings');
         }
      } else if (section === 'certificatePrinting') {
         const response = await resourceService.getCertificatePrintingSettings(eventId, timestamp);
         console.log('Certificate Printing settings response:', response);
         if (response && response.success && response.data) {
            settingsData = response.data.settings || { enabled: true, templates: [] };
            if (!settingsData.templates) settingsData.templates = [];
         } else {
            setError(response?.message || 'Failed to load certificate printing settings');
         }
      }

      if (settingsData !== null) {
        // Update local state
        setLocalResourceSettings(prevSettings => {
          console.log(`ResourceSettings: Updating local state for section ${section} with fetched data:`, settingsData);
          return {
            ...prevSettings,
            [section]: settingsData 
          };
        });

        // Also update the parent event state
        if (typeof setEvent === 'function') {
          console.log(`ResourceSettings: Updating parent event state for section ${section}`);
          setEvent(prevEvent => {
            // Create a fresh copy to ensure React detects the change
            const updatedEvent = { ...prevEvent };
            
            // Initialize resourceSettings if it doesn't exist
            if (!updatedEvent.resourceSettings) {
              updatedEvent.resourceSettings = {};
            } else {
              // Create a copy of resourceSettings to avoid mutating the original
              updatedEvent.resourceSettings = { ...updatedEvent.resourceSettings };
            }
            
            // Update the specific resource type
            updatedEvent.resourceSettings[section] = settingsData;
            
            console.log(`ResourceSettings: Updated parent event state with ${section} settings:`, updatedEvent.resourceSettings);
            return updatedEvent;
          });
        }

        if (section === 'food' && needsGeneration) {
            console.log('ResourceSettings: Proceeding with food days generation.');
            generatedData = await generateFoodDays(settingsData);
            if (generatedData) {
                setLocalResourceSettings(prevSettings => {
                    console.log(`ResourceSettings: Updating local state for section ${section} with generated data.`);
                    return {
                        ...prevSettings,
                        [section]: generatedData
                    };
                 });

                // Also update the parent event state with generated data
                if (typeof setEvent === 'function') {
                  setEvent(prevEvent => {
                    const updatedEvent = { ...prevEvent };
                    if (!updatedEvent.resourceSettings) {
                      updatedEvent.resourceSettings = {};
                    } else {
                      updatedEvent.resourceSettings = { ...updatedEvent.resourceSettings };
                    }
                    updatedEvent.resourceSettings[section] = generatedData;
                    return updatedEvent;
                  });
                }
                 
                 setFormChanged(true); 
            }
        }
      }
      
    } catch (err) {
      console.error(`ResourceSettings: Error loading settings for ${section}:`, err);
      setError(`Failed to load ${section} settings: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
      console.log(`ResourceSettings: Loading finished for section: ${section}`);
    }
  }, [event?.startDate, event?.endDate, loading, setFormChanged, setEvent]);

  const generateFoodDays = async (currentFoodSettings) => {
    if (!event?.startDate || !event?.endDate) {
      console.error("Cannot generate food days: Event start or end date missing.");
      return null;
    }

    console.log("Generating food days...");
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);
    const days = [];
    let currentDate = new Date(start);

    while (currentDate <= end) {
      days.push({
        date: currentDate.toISOString().split('T')[0],
        meals: [
          { name: 'Breakfast', time: '08:00', enabled: true },
          { name: 'Lunch', time: '12:00', enabled: true },
          { name: 'Dinner', time: '18:00', enabled: true },
        ]
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }
    console.log(`Generating ${days.length} days of food settings`);

    const newFoodSettings = {
        ...currentFoodSettings,
        days: days
    };

    try {
        console.log("Saving generated food days to server...");
        await resourceService.updateFoodSettings(event._id, newFoodSettings);
        console.log("Food days generated and saved successfully");
        return newFoodSettings;
    } catch (saveError) {
        console.error("Error saving generated food days:", saveError);
        setError("Failed to save auto-generated food days. Please save manually.");
        return null;
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000); // Auto-dismiss after 5 seconds
  };
  
  const saveResourceSettings = async (type) => {
    if (!event?._id || !localResourceSettings[type]) {
      setError(`Cannot save ${type} settings: Missing event ID or settings data.`);
      showToast(`Cannot save ${type} settings: Missing event ID or settings data.`, 'error');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const settingsToSave = { ...localResourceSettings[type] };
      const timestamp = Date.now(); // Add timestamp for cache busting
      let response;

      console.log(`Saving ${type} settings for event ${event._id}:`, JSON.stringify(settingsToSave, null, 2));

      // Ensure the settingsToSave has the necessary arrays initialized
      if (type === 'food' && !Array.isArray(settingsToSave.days)) {
        settingsToSave.days = [];
      } else if (type === 'kits' && !Array.isArray(settingsToSave.items)) {
        settingsToSave.items = [];
      } else if (type === 'certificates' && !Array.isArray(settingsToSave.types)) {
        settingsToSave.types = [];
      } else if (type === 'certificatePrinting' && !Array.isArray(settingsToSave.templates)) {
        settingsToSave.templates = [];
      }

      // Always set enabled property to true if not explicitly false
      if (settingsToSave.enabled === undefined) {
        settingsToSave.enabled = true;
      }

      // Deep clone the settings and explicitly set all missing properties to ensure complete save
      const finalSettings = {
        ...settingsToSave,
        enabled: settingsToSave.enabled !== false
      };

      switch (type) {
        case 'food':
          response = await resourceService.updateFoodSettings(event._id, finalSettings, finalSettings.enabled);
          break;
        case 'kits':
          response = await resourceService.updateKitSettings(event._id, finalSettings, finalSettings.enabled);
          break;
        case 'certificates':
          response = await resourceService.updateCertificateSettings(event._id, finalSettings, finalSettings.enabled);
          break;
        case 'certificatePrinting':
          response = await resourceService.updateCertificatePrintingSettings(event._id, finalSettings, finalSettings.enabled);
          break;
        default:
          throw new Error(`Unknown resource type: ${type}`);
      }

      console.log(`${type} settings save response:`, response);

      if (response && response.success) {
        // Show success toast
        showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} settings saved successfully!`);
        
        // Update the parent event state immediately with the new settings
        // This ensures the changes are retained across page refreshes
        if (typeof setEvent === 'function') {
          console.log(`Immediately updating parent event state with new ${type} settings`);
          setEvent(prevEvent => {
            const newEvent = { ...prevEvent };
            
            // Ensure resourceSettings exists
            if (!newEvent.resourceSettings) {
              newEvent.resourceSettings = {};
            } else {
              newEvent.resourceSettings = { ...newEvent.resourceSettings };
            }
            
            newEvent.resourceSettings[type] = finalSettings;
            
            return newEvent;
          });
        }

        // Force reload the data from server to ensure we have the latest settings
        // Use a small delay to ensure the backend has fully processed the update
        setTimeout(async () => {
          await loadResourceSettings(type, event._id);
          console.log(`Reloaded ${type} settings after save`);
          setFormChanged(false);
        }, 300);
        
        return true;
      } else {
        throw new Error(response?.message || `Failed to save ${type} settings`);
      }
    } catch (err) {
      console.error(`Error saving ${type} settings:`, err);
      setError(`Failed to save ${type} settings: ${err.message}`);
      showToast(`Failed to save ${type} settings: ${err.message}`, 'error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleResourceChange = (resourceType, property, value) => {
    setLocalResourceSettings(prevSettings => ({
      ...prevSettings,
      [resourceType]: {
        ...prevSettings[resourceType],
        [property]: value
      }
    }));
    
    setFormChanged(true);
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, 'EEE, MMM d, yyyy');
    } catch (error) {
      return dateString;
    }
  };

  const handleUpdateDay = (dayIndex, dayData) => {
    const foodSettings = localResourceSettings?.food || { enabled: true, days: [] };
    const days = [...(foodSettings.days || [])];
    
    if (dayIndex >= 0 && dayIndex < days.length) {
      days[dayIndex] = { ...days[dayIndex], ...dayData };
      
      setLocalResourceSettings(prevSettings => ({
        ...prevSettings,
        food: {
          ...foodSettings,
          days
        }
      }));
      
      setFormChanged(true);
    }
  };

  const handleAddMeal = (dayIndex) => {
    if (!newMealName.trim()) return;
    
    const foodSettings = localResourceSettings?.food || { enabled: true, days: [] };
    const days = [...(foodSettings.days || [])];
    
    if (dayIndex < 0 || dayIndex >= days.length) return;
    
    const day = days[dayIndex];
    const meals = [...(day.meals || [])];
    
    if (!meals.some(meal => meal.name === newMealName)) {
      meals.push({
        name: newMealName,
        startTime: '12:00',
        endTime: '14:00'
      });
      
      days[dayIndex] = { ...day, meals };
      
      setLocalResourceSettings(prevSettings => ({
        ...prevSettings,
        food: {
          ...foodSettings,
          days
        }
      }));
      
      setFormChanged(true);
    }
    
    setNewMealName('');
  };

  const handleUpdateMeal = (dayIndex, mealIndex, mealData) => {
    const foodSettings = localResourceSettings?.food || { enabled: true, days: [] };
    const days = [...(foodSettings.days || [])];
    
    if (dayIndex < 0 || dayIndex >= days.length) return;
    
    const day = days[dayIndex];
    const meals = [...(day.meals || [])];
    
    if (mealIndex < 0 || mealIndex >= meals.length) return;
    
    meals[mealIndex] = { ...meals[mealIndex], ...mealData };
      days[dayIndex] = { ...day, meals };
      
    setLocalResourceSettings(prevSettings => ({
      ...prevSettings,
      food: {
        ...foodSettings,
        days
      }
    }));
    
    if (editingMeal && editingMeal.dayIndex === dayIndex && editingMeal.mealIndex === mealIndex) {
      setEditingMeal(null);
    }
    
    setFormChanged(true);
  };

  const handleRemoveMeal = (dayIndex, mealIndex) => {
    const foodSettings = localResourceSettings?.food || { enabled: true, days: [] };
    const days = [...(foodSettings.days || [])];
    
    if (dayIndex < 0 || dayIndex >= days.length) return;
    
    const day = days[dayIndex];
    const meals = [...(day.meals || [])];
    
    if (mealIndex < 0 || mealIndex >= meals.length) return;
    
    meals.splice(mealIndex, 1);
    days[dayIndex] = { ...day, meals };
    
    setLocalResourceSettings(prevSettings => ({
      ...prevSettings,
      food: {
        ...foodSettings,
        days
      }
    }));
    
    setFormChanged(true);
  };

  const handleAddKitItem = () => {
    if (!newKitItem.name.trim()) return;
    
    const kitSettings = localResourceSettings?.kits || { enabled: true, items: [] };
    const items = [...(kitSettings.items || [])];
    
    items.push({
      name: newKitItem.name,
      description: newKitItem.description,
      quantity: parseInt(newKitItem.quantity) || 0
    });
    
    setLocalResourceSettings(prevSettings => ({
      ...prevSettings,
          kits: {
            ...kitSettings,
            items
          }
    }));
    
    setFormChanged(true);
    
    setNewKitItem({ name: '', description: '', quantity: 0 });
  };

  const handleUpdateKitItem = (index, itemData) => {
    const kitSettings = localResourceSettings?.kits || { enabled: true, items: [] };
    const items = [...(kitSettings.items || [])];
    
    if (index < 0 || index >= items.length) return;
    
    items[index] = { ...items[index], ...itemData };
    
    setLocalResourceSettings(prevSettings => ({
      ...prevSettings,
      kits: {
        ...kitSettings,
        items
      }
    }));
    
      setFormChanged(true);
  };

  const handleRemoveKitItem = (index) => {
    const kitSettings = localResourceSettings?.kits || { enabled: true, items: [] };
    const items = [...(kitSettings.items || [])];
    
    if (index < 0 || index >= items.length) return;
    
    items.splice(index, 1);
    
    setLocalResourceSettings(prevSettings => ({
      ...prevSettings,
        kits: {
          ...kitSettings,
          items
        }
    }));
    
    setFormChanged(true);
  };
  
  const handleAddCertificateType = () => {
    if (!newCertificateType.name.trim()) return;
    
    const certSettings = localResourceSettings?.certificates || { enabled: true, types: [] };
    const types = [...(certSettings.types || [])];
    
    types.push({
      name: newCertificateType.name,
      description: newCertificateType.description
    });
    
    setLocalResourceSettings(prevSettings => ({
      ...prevSettings,
          certificates: {
            ...certSettings,
            types
          }
    }));
    
    setFormChanged(true);
    
    setNewCertificateType({ name: '', description: '' });
  };

  const handleUpdateCertificateType = (index, typeData) => {
    const certSettings = localResourceSettings?.certificates || { enabled: true, types: [] };
    const types = [...(certSettings.types || [])];
    
    if (index < 0 || index >= types.length) return;
    
    types[index] = { ...types[index], ...typeData };
    
    setLocalResourceSettings(prevSettings => ({
      ...prevSettings,
      certificates: {
        ...certSettings,
        types
      }
    }));
    
      setFormChanged(true);
  };

  const handleRemoveCertificateType = (index) => {
    const certSettings = localResourceSettings?.certificates || { enabled: true, types: [] };
    const types = [...(certSettings.types || [])];
    
    if (index < 0 || index >= types.length) return;
    
    types.splice(index, 1);
    
    setLocalResourceSettings(prevSettings => ({
      ...prevSettings,
      certificates: {
        ...certSettings,
        types
      }
    }));
    
    setFormChanged(true);
  };

  const handleAddPrintTemplate = () => {
    if (!newPrintTemplate.name.trim()) return;
    
    const printSettings = localResourceSettings?.certificatePrinting || { enabled: true, templates: [] };
    const templates = [...(printSettings.templates || [])];
    
    templates.push({
      name: newPrintTemplate.name,
      type: newPrintTemplate.type,
      fields: [...newPrintTemplate.fields]
    });
    
    setLocalResourceSettings(prevSettings => ({
      ...prevSettings,
      certificatePrinting: {
        ...printSettings,
        templates
      }
    }));
    
    setFormChanged(true);
    
    setNewPrintTemplate({ 
      name: '', 
      type: 'attendance',
      fields: ['name'] 
    });
  };

  const handleUpdatePrintTemplate = (index, templateData) => {
    const printSettings = localResourceSettings?.certificatePrinting || { enabled: true, templates: [] };
    const templates = [...(printSettings.templates || [])];
    
    if (index < 0 || index >= templates.length) return;
    
    templates[index] = { ...templates[index], ...templateData };
    
    setLocalResourceSettings(prevSettings => ({
      ...prevSettings,
      certificatePrinting: {
        ...printSettings,
        templates
      }
    }));
    
    setFormChanged(true);
  };

  const handleRemovePrintTemplate = (index) => {
    const printSettings = localResourceSettings?.certificatePrinting || { enabled: true, templates: [] };
    const templates = [...(printSettings.templates || [])];
    
    if (index < 0 || index >= templates.length) return;
    
    templates.splice(index, 1);
    
    setLocalResourceSettings(prevSettings => ({
      ...prevSettings,
      certificatePrinting: {
        ...printSettings,
        templates
      }
    }));
    
    setFormChanged(true);
  };

  const renderSectionHeader = (title, section) => {
    return (
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">{title}</h2>
        <div className="flex space-x-2">
          <Button 
            onClick={() => loadResourceSettings(section, event?._id)}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </Button>
          <Button
            onClick={() => saveResourceSettings(section)}
            variant="primary"
            size="sm"
            disabled={loading}
          >
            Save Changes
          </Button>
        </div>
      </div>
    );
  };

  if (!event) {
    return <div className="text-gray-500">Loading resource settings...</div>;
  }

  const renderFoodConfig = () => {
    const foodSettings = localResourceSettings?.food || { enabled: true, days: [] };
    const days = foodSettings.days || [];
    
    const handleRegenerateDays = async () => {
      setLoading(true);
      
      try {
        const result = await generateFoodDays(localResourceSettings?.food || {});
        if (result) {
          setError(null);
        }
      } catch (err) {
        console.error('Error in handleRegenerateDays:', err);
        setError(`Failed to regenerate food days: ${err.message || 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };
    
    return (
      <div className="space-y-6">
        {renderSectionHeader('Food & Meals Configuration', 'food')}
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <Switch
              checked={foodSettings.enabled !== false}
              onChange={(checked) => handleResourceChange('food', 'enabled', checked)}
              label="Enable Food Tracking"
            />
          </div>
          <div className="flex space-x-2">
            {days.length > 0 && (
              <Button
                onClick={handleRegenerateDays}
                variant="outline"
                disabled={loading}
              >
                Regenerate Days
              </Button>
            )}
            <Button
              onClick={() => saveResourceSettings('food')}
              variant="primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {loading && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded mb-4 flex items-center">
            <svg className="animate-spin h-5 w-5 mr-3 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Loading resource settings...</span>
          </div>
        )}
        
        {foodSettings.enabled !== false && (
          <div className="space-y-6">
            {days.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No food days configured yet.</p>
                <p className="text-gray-400 text-sm mt-2">
                  Food days are automatically generated based on event start and end dates.
                </p>
                <Button
                  onClick={handleRegenerateDays}
                  variant="primary"
                  className="mt-4"
                  disabled={!event.startDate || !event.endDate || loading}
                >
                  Generate Food Days
                </Button>
              </div>
            ) : (
              days.map((day, dayIndex) => (
                <Card key={dayIndex} title={`Day ${dayIndex + 1} - ${formatDate(day.date)}`}>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-700">Meals</h4>
                      {day.meals && day.meals.length > 0 ? (
                        <div className="space-y-2">
                          {day.meals.map((meal, mealIndex) => (
                            <div key={mealIndex} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                              <div className="flex-1">
                                <h5 className="font-medium">{meal.name}</h5>
                                <div className="text-sm text-gray-500 flex items-center">
                                  <ClockIcon className="h-4 w-4 mr-1" />
                                  {meal.startTime} - {meal.endTime}
                                </div>
                              </div>
                              
                              {editingMeal && editingMeal.dayIndex === dayIndex && editingMeal.mealIndex === mealIndex ? (
                                <div className="flex flex-col space-y-2 w-2/3">
                                  <Input 
                                    name="name"
                                    value={meal.name}
                                    onChange={(e) => handleUpdateMeal(dayIndex, mealIndex, { name: e.target.value })}
                                    placeholder="Meal name"
                                  />
                                  <div className="flex space-x-2">
                                    <Input 
                                      type="time"
                                      name="startTime"
                                      value={meal.startTime}
                                      onChange={(e) => handleUpdateMeal(dayIndex, mealIndex, { startTime: e.target.value })}
                                    />
                                    <Input 
                                      type="time"
                                      name="endTime"
                                      value={meal.endTime}
                                      onChange={(e) => handleUpdateMeal(dayIndex, mealIndex, { endTime: e.target.value })}
                                    />
                                  </div>
                                  <div className="flex justify-end space-x-2">
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => setEditingMeal(null)}
                                    >
                                      Cancel
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="primary"
                                      onClick={() => setEditingMeal(null)}
                                    >
                                      Save
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => setEditingMeal({ dayIndex, mealIndex })}
                                    className="text-blue-500 hover:text-blue-700"
                                  >
                                    <PencilIcon className="h-5 w-5" />
                                  </button>
                                  <button
                                    onClick={() => handleRemoveMeal(dayIndex, mealIndex)}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    <TrashIcon className="h-5 w-5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">No meals configured for this day.</p>
                      )}
                      
                      <div className="flex space-x-2 mt-4">
                        <Input
                          value={newMealName}
                          onChange={(e) => setNewMealName(e.target.value)}
                          placeholder="New meal name (e.g., Tea Break)"
                          className="flex-1"
                        />
                        <Button
                          onClick={() => handleAddMeal(dayIndex)}
                          variant="outline"
                          disabled={!newMealName.trim()}
                        >
                          Add Meal
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    );
  };

  const renderKitConfig = () => {
    const kitSettings = localResourceSettings?.kits || { enabled: true, items: [] };
    const items = kitSettings.items || [];
    
    return (
      <div className="space-y-6">
        {renderSectionHeader('Kit Bags Configuration', 'kits')}
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <Switch
              checked={kitSettings.enabled !== false}
              onChange={(checked) => handleResourceChange('kits', 'enabled', checked)}
              label="Enable Kit Bag Management"
            />
          </div>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {loading && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded mb-4 flex items-center">
            <svg className="animate-spin h-5 w-5 mr-3 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Loading kit settings...</span>
          </div>
        )}
        
        {kitSettings.enabled !== false && (
          <div className="space-y-6">
            <Card title="Kit Items">
              {items.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">No kit items configured yet.</p>
                  <p className="text-gray-400 text-sm mt-2">
                    Add items below to track kit distribution during the event.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{item.name}</h4>
                          <p className="text-sm text-gray-600">{item.description}</p>
                          <Badge className="mt-2">Quantity: {item.quantity}</Badge>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleRemoveKitItem(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="mt-6 border-t pt-4">
                <h4 className="font-medium mb-3">Add New Kit Item</h4>
                <div className="space-y-3">
                  <Input
                    label="Item Name"
                    value={newKitItem.name}
                    onChange={(e) => setNewKitItem({ ...newKitItem, name: e.target.value })}
                    placeholder="Conference Kit"
                  />
                  <Textarea
                    label="Description"
                    value={newKitItem.description}
                    onChange={(e) => setNewKitItem({ ...newKitItem, description: e.target.value })}
                    placeholder="Standard conference kit with essentials"
                    rows={2}
                  />
                  <Input
                    type="number"
                    label="Quantity"
                    value={newKitItem.quantity}
                    onChange={(e) => setNewKitItem({ ...newKitItem, quantity: e.target.value })}
                    placeholder="100"
                  />
                  <div className="flex justify-end">
                    <Button
                      onClick={handleAddKitItem}
                      variant="primary"
                      disabled={!newKitItem.name.trim()}
                    >
                      Add Kit Item
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    );
  };

  const renderCertificateConfig = () => {
    const certSettings = localResourceSettings?.certificates || { enabled: true, types: [] };
    const types = certSettings.types || [];
    
    return (
      <div className="space-y-6">
        {renderSectionHeader('Certificates Configuration', 'certificates')}
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <Switch
              checked={certSettings.enabled !== false}
              onChange={(checked) => handleResourceChange('certificates', 'enabled', checked)}
              label="Enable Certificate Management"
            />
          </div>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {loading && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded mb-4 flex items-center">
            <svg className="animate-spin h-5 w-5 mr-3 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Loading certificate settings...</span>
          </div>
        )}
        
        {certSettings.enabled !== false && (
          <div className="space-y-6">
            <Card title="Certificate Types">
              {types.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">No certificate types configured yet.</p>
                  <p className="text-gray-400 text-sm mt-2">
                    Add certificate types below to track certificate distribution during the event.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {types.map((type, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{type.name}</h4>
                          <p className="text-sm text-gray-600">{type.description}</p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleRemoveCertificateType(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="mt-6 border-t pt-4">
                <h4 className="font-medium mb-3">Add New Certificate Type</h4>
                <div className="space-y-3">
                  <Input
                    label="Certificate Name"
                    value={newCertificateType.name}
                    onChange={(e) => setNewCertificateType({ ...newCertificateType, name: e.target.value })}
                    placeholder="Participation Certificate"
                  />
                  <Textarea
                    label="Description"
                    value={newCertificateType.description}
                    onChange={(e) => setNewCertificateType({ ...newCertificateType, description: e.target.value })}
                    placeholder="Certificate of participation for attendees"
                    rows={2}
                  />
                  <div className="flex justify-end">
                    <Button
                      onClick={handleAddCertificateType}
                      variant="primary"
                      disabled={!newCertificateType.name.trim()}
                    >
                      Add Certificate Type
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    );
  };

  const renderCertificatePrintingConfig = () => {
    const printSettings = localResourceSettings?.certificatePrinting || { enabled: true, templates: [] };
    const templates = printSettings.templates || [];
    
    console.log('[renderCertificatePrintingConfig] Current settings:', printSettings);

    return (
      <div className="space-y-6">
        {renderSectionHeader('Certificate Printing Configuration', 'certificatePrinting')}
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <Switch
              checked={printSettings.enabled !== false}
              onChange={(checked) => handleResourceChange('certificatePrinting', 'enabled', checked)}
              label="Enable Certificate Printing"
            />
          </div>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {loading && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded mb-4 flex items-center">
            <svg className="animate-spin h-5 w-5 mr-3 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Loading certificate printing settings...</span>
          </div>
        )}
        
        {printSettings.enabled !== false && (
          <div className="space-y-6">
            <Card title="Certificate Templates">
              {templates.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">No certificate templates configured yet.</p>
                  <p className="text-gray-400 text-sm mt-2">
                    Add templates below to use for certificate printing.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {templates.map((template, index) => (
                    <div key={template._id || index} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{template.name || 'Unnamed Template'}</h4>
                          <p className="text-sm text-gray-600">Type: {template.type || 'general'}</p>
                          <div className="mt-2">
                            <p className="text-sm font-medium">Fields:</p>
                            <ul className="text-xs text-gray-500 mt-1 list-disc pl-5">
                              {template.fields?.map((field, fieldIndex) => (
                                <li key={fieldIndex}>{typeof field === 'string' ? field : field.name || field.displayName || 'Unnamed Field'}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleRemovePrintTemplate(index)}
                            className="text-red-500 hover:text-red-700"
                            title="Remove Template"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="mt-4 border-t pt-4">
                <h3 className="text-sm font-medium mb-2">Add New Template</h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Input 
                    label="Template Name"
                    value={newPrintTemplate.name}
                    onChange={(e) => setNewPrintTemplate({...newPrintTemplate, name: e.target.value})}
                    placeholder="e.g. Speaker Certificate"
                  />
                  <div className="sm:col-span-1">
                    <label className="block text-sm font-medium text-gray-700">Template Type</label>
                    <select 
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={newPrintTemplate.type}
                      onChange={(e) => setNewPrintTemplate({...newPrintTemplate, type: e.target.value})}
                    >
                      <option value="attendance">Attendance</option>
                      <option value="speaker">Speaker</option>
                      <option value="participation">Participation</option>
                      <option value="award">Award</option>
                    </select>
                  </div>
                </div>
                <Button 
                  variant="secondary" 
                  className="mt-3"
                  onClick={handleAddPrintTemplate}
                  disabled={!newPrintTemplate.name.trim()}
                >
                  Add Template
                </Button>
              </div>
            </Card>
            
            <div className="p-4 border rounded bg-blue-50 text-blue-800 text-sm">
              <p><strong>Note:</strong> Certificate templates define what information will be required when printing certificates.</p>
              <p className="mt-1">Each template can have its own set of fields that need to be filled out during the printing process.</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex space-x-4 mb-6 flex-wrap">
        <button
          className={`px-4 py-2 rounded-lg font-medium mb-2 ${
            activeSection === 'food'
              ? 'bg-primary-100 text-primary-700'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          onClick={() => setActiveSection('food')}
        >
          Food
        </button>
        <button
          className={`px-4 py-2 rounded-lg font-medium mb-2 ${
            activeSection === 'kits'
              ? 'bg-primary-100 text-primary-700'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          onClick={() => setActiveSection('kits')}
        >
          Kits
        </button>
        <button
          className={`px-4 py-2 rounded-lg font-medium mb-2 ${
            activeSection === 'certificates'
              ? 'bg-primary-100 text-primary-700'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          onClick={() => setActiveSection('certificates')}
        >
          Certificates
        </button>
        <button
          className={`px-4 py-2 rounded-lg font-medium mb-2 ${
            activeSection === 'certificatePrinting'
              ? 'bg-primary-100 text-primary-700'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          onClick={() => setActiveSection('certificatePrinting')}
        >
          Certificate Printing
        </button>
      </div>

      {activeSection === 'food' && renderFoodConfig()}
      {activeSection === 'kits' && renderKitConfig()}
      {activeSection === 'certificates' && renderCertificateConfig()}
      {activeSection === 'certificatePrinting' && renderCertificatePrintingConfig()}
      
      {/* Toast notification */}
      {toast && (
        <div 
          className={`fixed bottom-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
            toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}
          style={{ 
            animation: 'fade-in-out 5s ease-in-out',
            maxWidth: '300px'
          }}
        >
          <div className="flex items-center">
            {toast.type === 'success' ? (
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <span>{toast.message}</span>
          </div>
          <button 
            className="absolute top-1 right-1 text-white opacity-70 hover:opacity-100"
            onClick={() => setToast(null)}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      
      {/* Add a simple CSS animation for the toast */}
      <style jsx>{`
        @keyframes fade-in-out {
          0% { opacity: 0; transform: translateY(20px); }
          10% { opacity: 1; transform: translateY(0); }
          90% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(20px); }
        }
      `}</style>
    </div>
  );
};

export default ResourcesTab; 