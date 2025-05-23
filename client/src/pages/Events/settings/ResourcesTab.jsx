import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircleIcon, TrashIcon, ClockIcon, PencilIcon, PrinterIcon } from '@heroicons/react/24/outline';
import { Card, Input, Switch, Button, Textarea, Badge } from '../../../components/common';
import { resourceService } from '../../../services';
import { format } from 'date-fns';

// Helper function to get the API base URL
const getApiBaseUrl = () => {
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:5000'; // Your local backend URL
  } else {
    // For production, you might use a relative path if served from the same origin,
    // or an environment variable for a different API domain.
    return process.env.REACT_APP_API_URL || window.location.origin;
  }
};

const dataSourceOptions = [
  { value: 'Static', label: 'Static Text (Use input below)' },
  // Registration
  { group: 'Registration', value: 'Registration.registrationId', label: 'ID' },
  { group: 'Registration', value: 'Registration.personalInfo.firstName', label: 'Personal - First Name' },
  { group: 'Registration', value: 'Registration.personalInfo.lastName', label: 'Personal - Last Name' },
  { group: 'Registration', value: 'Registration.personalInfo.fullName', label: 'Personal - Full Name (auto-joins first & last)' },
  { group: 'Registration', value: 'Registration.personalInfo.email', label: 'Personal - Email' },
  { group: 'Registration', value: 'Registration.personalInfo.phone', label: 'Personal - Phone' },
  { group: 'Registration', value: 'Registration.personalInfo.organization', label: 'Personal - Organization' },
  { group: 'Registration', value: 'Registration.personalInfo.designation', label: 'Personal - Designation' },
  { group: 'Registration', value: 'Registration.personalInfo.country', label: 'Personal - Country' },
  { group: 'Registration', value: 'Registration.category.name', label: 'Category Name' },
  { group: 'Registration', value: 'Registration.status', label: 'Status' },
  // Event
  { group: 'Event', value: 'Event.name', label: 'Name' },
  { group: 'Event', value: 'Event.shortName', label: 'Short Name' },
  { group: 'Event', value: 'Event.theme', label: 'Theme' },
  { group: 'Event', value: 'Event.startDate', label: 'Start Date' },
  { group: 'Event', value: 'Event.endDate', label: 'End Date' },
  { group: 'Event', value: 'Event.venue.name', label: 'Venue - Name' },
  { group: 'Event', value: 'Event.venue.city', label: 'Venue - City' },
  // Abstract
  { group: 'Abstract', value: 'Abstract.title', label: 'Title' },
  { group: 'Abstract', value: 'Abstract.authors', label: 'Authors (String)' },
  { group: 'Abstract', value: 'Abstract.presentingAuthor', label: 'Presenting Author' },
  { group: 'Abstract', value: 'Abstract.topic', label: 'Topic' },
  { group: 'Abstract', value: 'Abstract.submissionType', label: 'Submission Type' },
  // Workshop
  { group: 'Workshop', value: 'Workshop.title', label: 'Title' },
  { group: 'Workshop', value: 'Workshop.instructor.name', label: 'Instructor Name' },
  { group: 'Workshop', value: 'Workshop.date', label: 'Date' },
];

// Helper functions for unit conversion, moved to top-level
const convertToPxGlobal = (value, unit) => {
  if (unit === 'mm') return value * 3.779528; 
  if (unit === 'cm') return value * 37.79528;  
  if (unit === 'in') return value * 96;      
  if (unit === 'pt') return value * (4 / 3); 
  return value; 
};

const convertFromPxGlobal = (pxValue, unit) => {
  if (unit === 'mm') return pxValue / 3.779528;
  if (unit === 'cm') return pxValue / 37.79528;
  if (unit === 'in') return pxValue / 96;
  if (unit === 'pt') return pxValue * (3 / 4);
  return pxValue; 
};

// Update StaticCertificateBackground to use PNG and check aspect ratio, add onError and debug border
const StaticCertificateBackground = React.memo(({ templateImageUrl, onImageLoad }) => {
  const imgRef = useRef(null);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (imgRef.current && onImageLoad) {
      imgRef.current.onload = () => {
        onImageLoad(imgRef.current);
      };
    }
  }, [templateImageUrl, onImageLoad]);

    if (!templateImageUrl) return null;
  if (imgError) return <div style={{width: '100%', height: '100%', background: '#fee', color: '#900', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #f00', position: 'absolute', top: 0, left: 0, zIndex: 1}}>Image failed to load</div>;
  return (
    <img
      ref={imgRef}
      src={templateImageUrl}
      alt="Certificate Template Preview"
      style={{
        display: 'block',
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        opacity: 0.7,
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 1,
        border: '2px dashed #007bff', // debug border
        background: '#fff', // debug background
      }}
      onError={() => setImgError(true)}
    />
  );
});

// Update CertificatePreview to lock to A4 landscape and overlay fields, and fix dragging
const CertificatePreview = React.memo(
  ({ previewContainerRef, templateImageUrl, fields, templateUnit = 'pt', onFieldDragStart, printableArea, onImageLoad }) => {
    // A4 landscape: 297mm x 210mm. At 3.78 px/mm: 1122 x 794 px. We'll use 1122 x 794 px for preview.
    const A4_WIDTH_PX = 1122;
    const A4_HEIGHT_PX = 794;
    // For field dragging
    const fieldRefs = useRef([]);

    // Helper to start drag and pass ref
    const handleFieldMouseDown = (e, index) => {
      if (onFieldDragStart) {
        const field = fields[index];
        const x = field.position?.x || 0;
        const y = field.position?.y || 0;
      onFieldDragStart(
        index,
          x,
          y,
        e.clientX,
        e.clientY,
          fieldRefs.current[index],
        templateUnit 
      );
      }
    };

    return (
      <div 
        ref={previewContainerRef}
        style={{
          position: 'relative',
          border: '1px dashed #ccc',
          width: `${A4_WIDTH_PX}px`,
          height: `${A4_HEIGHT_PX}px`,
          margin: 'auto',
          userSelect: 'none',
          background: '#fff',
          overflow: 'hidden',
        }}
      >
        <StaticCertificateBackground templateImageUrl={templateImageUrl} onImageLoad={onImageLoad} />
        {printableArea && (
          <div
            style={{
              position: 'absolute',
              left: `${printableArea.left || 0}px`,
              top: `${printableArea.top || 0}px`,
              width: `${printableArea.width || (A4_WIDTH_PX - (printableArea.left || 0))}px`,
              height: `${printableArea.height || (A4_HEIGHT_PX - (printableArea.top || 0))}px`,
              border: '2px dashed #007bff',
              zIndex: 3,
              pointerEvents: 'none',
            }}
          />
        )}
        {fields && fields.map((field, index) => {
          const xPos = convertToPxGlobal(field.position?.x || 0, templateUnit);
          const yPos = convertToPxGlobal(field.position?.y || 0, templateUnit);
          const fontSize = convertToPxGlobal(field.style?.fontSize || 12, templateUnit);
          const previewText = field.label || `Field ${index + 1}`;
          const rotation = field.style?.rotation || 0;
          return (
            <div
              key={field.id || index}
              ref={el => fieldRefs.current[index] = el}
              onMouseDown={e => handleFieldMouseDown(e, index)}
              style={{
                position: 'absolute',
                left: `${xPos}px`,
                top: `${yPos}px`,
                fontFamily: field.style?.font || 'Helvetica',
                fontSize: `${fontSize}px`,
                color: field.style?.color || '#000000',
                border: '1px dashed rgba(0,0,0,0.3)', 
                padding: '2px',
                whiteSpace: 'nowrap', 
                cursor: 'grab',
                zIndex: 4,
                transform: `rotate(${rotation}deg)`
              }}
            >
              {previewText}
            </div>
          );
        })}
      </div>
    );
  },
  (prevProps, nextProps) => {
    // ... existing memo logic ...
    return prevProps.templateImageUrl === nextProps.templateImageUrl &&
      prevProps.fields === nextProps.fields &&
      prevProps.templateUnit === nextProps.templateUnit &&
      prevProps.onFieldDragStart === nextProps.onFieldDragStart &&
      prevProps.previewContainerRef === nextProps.previewContainerRef &&
      prevProps.printableArea === nextProps.printableArea;
  }
);

const ResourcesTab = ({ event, setEvent, setFormChanged = () => {}, initialSection }) => {
  const [activeSection, setActiveSection] = useState(initialSection || 'food');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [newMealName, setNewMealName] = useState('');
  const [newKitItem, setNewKitItem] = useState({ name: '', description: '', quantity: 0 });
  const [newCertificateType, setNewCertificateType] = useState({ name: '', description: '' });
  const [newPrintTemplate, setNewPrintTemplate] = useState({ 
    name: '', 
    categoryType: 'Participation',
    templateUrl: '',
    templateUnit: 'pt',
    fields: [],
    file: null
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
  const [templateFileError, setTemplateFileError] = useState(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [editingPrintTemplateIndex, setEditingPrintTemplateIndex] = useState(null);
  const [currentEditingFields, setCurrentEditingFields] = useState([]);
  const [activeFieldData, setActiveFieldData] = useState(null);

  // State for managing drag operations within CertificatePreview
  const [draggingField, setDraggingField] = useState(null); 
  const previewContainerRef = useRef(null); // This ref is initialized here
  const fileInputRef = useRef(null);

  const handleFieldDragInternal = useCallback((fieldIndex, newXUnit, newYUnit) => {
    console.log('%c[ResourcesTab] EXECUTE handleFieldDragInternal %s', 'color: red; font-weight: bold;', `Field: ${fieldIndex}, X: ${newXUnit}, Y: ${newYUnit}`);
    setCurrentEditingFields(prevFields => {
      const newFields = [...prevFields];
      if (newFields[fieldIndex]) {
        newFields[fieldIndex] = {
          ...newFields[fieldIndex],
          position: {
            ...(newFields[fieldIndex].position || {}),
            x: newXUnit,
            y: newYUnit,
          },
        };
      }
      return newFields;
    });
    setFormChanged(true);
  }, [setCurrentEditingFields, setFormChanged]);

  const handleFieldDragStart = useCallback((index, initialFieldXUnit, initialFieldYUnit, mouseXStart, mouseYStart, elementRef, unitToUse) => {
    setDraggingField({
      index,
      initialFieldXUnit,
      initialFieldYUnit,
      mouseXStart,
      mouseYStart,
      unit: unitToUse || 'pt',
      elementRef 
    });
  }, [setDraggingField]);

  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      if (!draggingField || !draggingField.elementRef || !previewContainerRef.current) return;
      if (draggingField.elementRef && !document.body.contains(draggingField.elementRef)) {
        console.warn('[MouseMove] draggingField.elementRef is no longer in the document!');
        return; 
      }

      const previewRect = previewContainerRef.current.getBoundingClientRect();
      const fieldRect = draggingField.elementRef.getBoundingClientRect();

      let deltaXpx = e.clientX - draggingField.mouseXStart;
      let deltaYpx = e.clientY - draggingField.mouseYStart;

      const initialFieldXpx = convertToPxGlobal(draggingField.initialFieldXUnit, draggingField.unit);
      const initialFieldYpx = convertToPxGlobal(draggingField.initialFieldYUnit, draggingField.unit);

      let newXpx = initialFieldXpx + deltaXpx;
      let newYpx = initialFieldYpx + deltaYpx;

      // Constrain X within the preview container
      newXpx = Math.max(0, newXpx); // Min X
      newXpx = Math.min(previewRect.width - fieldRect.width, newXpx); // Max X

      // Constrain Y within the preview container
      newYpx = Math.max(0, newYpx); // Min Y
      newYpx = Math.min(previewRect.height - fieldRect.height, newYpx); // Max Y

      draggingField.elementRef.style.left = `${newXpx}px`;
      draggingField.elementRef.style.top = `${newYpx}px`;
    };

    const handleGlobalMouseUp = (e) => {
      if (!draggingField || !draggingField.elementRef) return; // Ensure elementRef exists for final calculation

      const currentDraggingField = { ...draggingField };
      setDraggingField(null);

      const previewRect = previewContainerRef.current?.getBoundingClientRect();
      const fieldRect = currentDraggingField.elementRef.getBoundingClientRect();
      
      if (!previewRect) {
        console.error("[MouseUp] Preview container ref not found, cannot calculate final position.");
        // Fallback: update with unconstrained values if previewRect is missing, though this shouldn't happen.
        const unconstrainedDeltaXpx = e.clientX - currentDraggingField.mouseXStart;
        const unconstrainedDeltaYpx = e.clientY - currentDraggingField.mouseYStart;
        const unconstrainedInitialFieldXpx = convertToPxGlobal(currentDraggingField.initialFieldXUnit, currentDraggingField.unit);
        const unconstrainedInitialFieldYpx = convertToPxGlobal(currentDraggingField.initialFieldYUnit, currentDraggingField.unit);
        const unconstrainedFinalFieldXpx = unconstrainedInitialFieldXpx + unconstrainedDeltaXpx;
        const unconstrainedFinalFieldYpx = unconstrainedInitialFieldYpx + unconstrainedDeltaYpx;
        const finalNewXUnitUnconstrained = convertFromPxGlobal(unconstrainedFinalFieldXpx, currentDraggingField.unit);
        const finalNewYUnitUnconstrained = convertFromPxGlobal(unconstrainedFinalFieldYpx, currentDraggingField.unit);
        handleFieldDragInternal(currentDraggingField.index, finalNewXUnitUnconstrained, finalNewYUnitUnconstrained);
        return;
      }

      // Get the final pixel position from the element's current style (which was updated by mousemove)
      // This is more reliable if the element was constrained during mousemove.
      let finalFieldXpx = parseFloat(currentDraggingField.elementRef.style.left) || 0;
      let finalFieldYpx = parseFloat(currentDraggingField.elementRef.style.top) || 0;

      // Ensure final position is also constrained if somehow style wasn't perfectly set or rects changed
      finalFieldXpx = Math.max(0, finalFieldXpx);
      finalFieldXpx = Math.min(previewRect.width - fieldRect.width, finalFieldXpx);
      finalFieldYpx = Math.max(0, finalFieldYpx);
      finalFieldYpx = Math.min(previewRect.height - fieldRect.height, finalFieldYpx);

      const finalNewXUnit = convertFromPxGlobal(finalFieldXpx, currentDraggingField.unit);
      const finalNewYUnit = convertFromPxGlobal(finalFieldYpx, currentDraggingField.unit);
      
      handleFieldDragInternal(currentDraggingField.index, finalNewXUnit, finalNewYUnit);
    };

    if (draggingField) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
    } else {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [draggingField, handleFieldDragInternal]); 

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
         console.log('Certificate Printing settings raw response from server:', response); // Log raw response
         if (response && response.success && response.data) {
            if (response.data.certificatePrintingTemplates) {
              console.log('Using new certificatePrintingTemplates field from response');
              settingsData = {
                enabled: response.data.isEnabled !== undefined ? response.data.isEnabled : true, 
                templates: response.data.certificatePrintingTemplates
              };
            } else if (response.data.settings) {
              console.log('Falling back to old settings.templates for certificatePrinting');
              settingsData = response.data.settings || { enabled: true, templates: [] };
            } else {
              settingsData = { enabled: true, templates: [] };
            }
            if (!settingsData.templates) settingsData.templates = [];
            console.log('[LoadCertPrint] Templates received from backend:', JSON.stringify(settingsData?.templates, null, 2)); // Log parsed templates
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
          { name: 'Breakfast', startTime: '08:00', endTime: '09:00', enabled: true },
          { name: 'Lunch', startTime: '12:00', endTime: '14:00', enabled: true },
          { name: 'Dinner', startTime: '18:00', endTime: '20:00', enabled: true },
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
        showToast('Food days and default meals generated!', 'success');
        // Reload settings from backend to update UI
        await loadResourceSettings('food', event._id);
        return newFoodSettings;
    } catch (saveError) {
        console.error("Error saving generated food days:", saveError);
        setError("Failed to save auto-generated food days. Please save manually.");
        showToast('Failed to save auto-generated food days. Please save manually.', 'error');
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
      return false; // Return false on initial validation fail
    }

    setLoading(true);
    setError(null);
    
    try {
      let settingsPayload = JSON.parse(JSON.stringify(localResourceSettings[type]));
      console.log(`Initial ${type} settings for save (after preliminary stringify):`, JSON.stringify(settingsPayload, null, 2));

      if (type === 'certificatePrinting' && Array.isArray(localResourceSettings.certificatePrinting?.templates)) {
        console.log('[SaveCertPrint] Starting pre-processing and file upload for templates...');
        let allTemplatesValid = true;
        const originalTemplates = localResourceSettings.certificatePrinting.templates;

        const processedTemplatesPromises = originalTemplates.map(async (template, tIndex) => {
          let processedTemplate = JSON.parse(JSON.stringify(template));
          if (template.file instanceof File) {
            processedTemplate.file = template.file;
          }

          if (!processedTemplate.categoryType) {
            processedTemplate.categoryType = 'Participation';
          }

          if (!processedTemplate.templateUrl && !(processedTemplate.file && processedTemplate.file instanceof File)) {
            allTemplatesValid = false;
            console.error(`[SaveCertPrint] Validation Error: Template "${processedTemplate.name || 'Unnamed'}" (index ${tIndex}) needs a file.`);
          }

          if (Array.isArray(processedTemplate.fields)) {
            processedTemplate.fields = processedTemplate.fields.map((field, fIndex) => {
              if (typeof field === 'string') {
                return {
                  id: `field_migrated_${Date.now()}_${tIndex}_${fIndex}`,
                  type: 'text', // Default type
                  label: field, // Use the string as the label
                  dataSource: 'Static', // Default dataSource
                  staticText: field, // Use the string as static text as well
                  position: { 
                    x: 10 + (fIndex * 5), // Default position, slightly staggered
                    y: 10 + (fIndex * 20) 
                  },
                  style: { // Provide default style object
                    font: 'Helvetica',
                    fontSize: 12,
                    color: '#000000',
                    align: 'left',
                    fontWeight: 'normal'
                    // maxWidth can be omitted as it's optional
                  },
                  sampleValue: field, // Use string as sample
                  isRequired: false // Default isRequired
                };
              }
              // If it's already an object, ensure it has the required sub-fields if possible,
              // or trust it was correctly formed by the UI field editor.
              // For simplicity here, we assume objects from UI are correctly structured.
              // A more robust solution might involve deeper validation/defaulting for objects too.
              if (typeof field === 'object' && field !== null) {
                if (!field.id) field.id = `field_existing_${Date.now()}_${tIndex}_${fIndex}`;
                if (!field.label) field.label = 'Unnamed Field';
                if (!field.dataSource) field.dataSource = 'Static';
                if (field.dataSource === 'Static' && typeof field.staticText === 'undefined') field.staticText = field.label;
                if (!field.position) field.position = { x: 10, y: 10 };
                if (typeof field.position.x === 'undefined') field.position.x = 10;
                if (typeof field.position.y === 'undefined') field.position.y = 10;
                if (!field.style) field.style = { font: 'Helvetica', fontSize: 12, color: '#000000', align: 'left', fontWeight: 'normal' };
              }
              return field;
            });
          } else {
            processedTemplate.fields = [];
          }

          if (processedTemplate.file && processedTemplate.file instanceof File) {
            const uploadResponse = await resourceService.uploadCertificateTemplateFile(event._id, processedTemplate.file);
            if (uploadResponse && uploadResponse.success && uploadResponse.data?.templateUrl) {
              const { file, ...restOfTemplate } = processedTemplate;
              processedTemplate = { ...restOfTemplate, templateUrl: uploadResponse.data.templateUrl };
              // Show backend warning if present
              if (uploadResponse.data.aspectWarning) {
                setTemplateFileError(uploadResponse.data.aspectWarning);
              } else {
                setTemplateFileError(null);
              }
            } else {
              allTemplatesValid = false;
              console.error(`[SaveCertPrint] Upload Failure for "${processedTemplate.name || 'Unnamed'}"`);
            }
          }
          if (processedTemplate.file instanceof File) {
            delete processedTemplate.file;
          }
          return processedTemplate;
        });
        
        const fullyProcessedTemplates = await Promise.all(processedTemplatesPromises);

        if (!allTemplatesValid) {
          const finalErrorMessage = "One or more certificate templates are invalid. Ensure files are uploaded & valid.";
          showToast(finalErrorMessage, 'error');
          setError(finalErrorMessage);
          // setLoading(false); // setLoading is handled in finally
          return false; // Abort save
        }
        settingsPayload.templates = fullyProcessedTemplates;
        console.log('[SaveCertPrint] Templates for payload: ', settingsPayload.templates);
      }

      const finalSettings = {
        ...settingsPayload,
        enabled: settingsPayload.enabled !== false
      };
      
      if (type === 'certificatePrinting') {
        console.log('[SaveCertPrint] Payload being sent to backend:', JSON.stringify(finalSettings.templates, null, 2));
      }
      // Variable to hold the response from the service call
      let apiResponse;

      switch (type) {
        case 'food':
          apiResponse = await resourceService.updateFoodSettings(event._id, finalSettings, finalSettings.enabled);
          break;
        case 'kits':
          apiResponse = await resourceService.updateKitSettings(event._id, finalSettings, finalSettings.enabled);
          break;
        case 'certificates':
          apiResponse = await resourceService.updateCertificateSettings(event._id, finalSettings, finalSettings.enabled);
          break;
        case 'certificatePrinting':
          apiResponse = await resourceService.updateCertificatePrintingSettings(event._id, finalSettings, finalSettings.enabled);
          break;
        default:
          throw new Error(`Unknown resource type: ${type}`);
      }

      // This block MUST be inside the try, after apiResponse is assigned.
      console.log(`${type} settings save response from service:`, apiResponse);

      if (apiResponse && apiResponse.success) {
        showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} settings saved successfully!`);
        if (typeof setEvent === 'function') {
          setEvent(prevEvent => {
            const newEvent = { ...prevEvent };
            if (!newEvent.resourceSettings) newEvent.resourceSettings = {};
            else newEvent.resourceSettings = { ...newEvent.resourceSettings };
            newEvent.resourceSettings[type] = finalSettings;
            return newEvent;
          });
        }
        setTimeout(async () => {
          await loadResourceSettings(type, event._id);
          setFormChanged(false);
        }, 300);
        return true; // Indicate success
      } else {
        // If apiResponse is falsy or apiResponse.success is false
        throw new Error(apiResponse?.message || `Failed to save ${type} settings due to server error or unexpected response.`);
      }

    } catch (err) {
      console.error(`Error in saveResourceSettings for ${type}:`, err);
      const displayMessage = err.message.startsWith("One or more certificate templates are invalid") 
                             ? err.message 
                             : `Failed to save ${type} settings: ${err.message}`;
      setError(displayMessage);
      showToast(displayMessage, 'error');
      return false; // Indicate failure
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
    const currentTemplates = printSettings.templates || []; 
    
    const newTemplateToAdd = {
      name: newPrintTemplate.name,
      categoryType: newPrintTemplate.categoryType, 
      templateUrl: newPrintTemplate.templateUrl, 
      templateUnit: newPrintTemplate.templateUnit,
      fields: [...newPrintTemplate.fields], 
      file: newPrintTemplate.file 
    };

    console.log('[handleAddPrintTemplate] Adding template:', JSON.stringify(newTemplateToAdd, null, 2)); // Added log
    
    setLocalResourceSettings(prevSettings => ({
      ...prevSettings,
      certificatePrinting: {
        ...(prevSettings.certificatePrinting || { enabled: true }), // Ensure certificatePrinting object exists
        templates: [...currentTemplates, newTemplateToAdd] // Add new template to a copy of the array
      }
    }));
    
    setFormChanged(true);
    
    setNewPrintTemplate({ 
      name: '', 
      categoryType: 'Participation',
      templateUrl: '',
      templateUnit: 'pt',
      fields: [],
      file: null
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

  const handleFileValidation = (file) => {
    if (file) {
      const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg'];
      if (allowedTypes.includes(file.type)) {
        setNewPrintTemplate(prevState => ({...prevState, file: file }));
        setTemplateFileError(null);
      } else {
        setNewPrintTemplate(prevState => ({...prevState, file: null }));
        setTemplateFileError('File type not supported. Please upload a PDF, PNG, or JPG.');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } else {
      setNewPrintTemplate(prevState => ({...prevState, file: null }));
      setTemplateFileError(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileValidation(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
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
    const templates = localResourceSettings.certificatePrinting?.templates || [];

    const handleStartEditPrintTemplate = (index) => {
      setEditingPrintTemplateIndex(index);
      const templateToEdit = templates[index];

      if (templateToEdit && templateToEdit.fields) {
        const processedFields = templateToEdit.fields.map((field, fieldIdx) => {
          if (typeof field === 'string') {
            // Convert string to a default field object
            console.warn(`[ResourcesTab] Migrating string field "${field}" to object for template: ${templateToEdit.name}`);
            return {
              id: `field_migrated_${Date.now()}_${fieldIdx}`,
              type: 'text',
              label: field, // Use the string as the initial label
              dataSource: 'Static', // Default to Static if it was just a string
              staticText: field, 
              position: { x: 10, y: 10 + (fieldIdx * 30) }, // Stagger default positions
              style: { font: 'Helvetica', fontSize: 12, color: '#000000', align: 'left', fontWeight: 'normal', maxWidth: 200 },
              sampleValue: field,
              isRequired: false
            };
          }
          // Deep copy existing valid objects to avoid direct mutation issues elsewhere
          // Ensure field is an object and not null before stringifying
          if (field && typeof field === 'object') {
            return JSON.parse(JSON.stringify(field)); 
          }
          // If field is something unexpected (null, number, etc.), create a default field
          console.warn(`[ResourcesTab] Unexpected field type found: ${typeof field}, value: ${field}. Creating default field.`);
          return {
            id: `field_defaulted_${Date.now()}_${fieldIdx}`,
            type: 'text',
            label: 'Default Field',
            dataSource: 'Static',
            staticText: 'Default',
            position: { x: 10, y: 10 + (fieldIdx * 30) },
            style: { font: 'Helvetica', fontSize: 12, color: '#000000', align: 'left', fontWeight: 'normal', maxWidth: 200 },
            sampleValue: '',
            isRequired: false
          };
        });
        setCurrentEditingFields(processedFields);
      } else {
        setCurrentEditingFields([]); // Initialize with empty if no fields exist or template is undefined
      }
    };

    const handleCancelEditPrintTemplate = () => {
      setEditingPrintTemplateIndex(null);
      setCurrentEditingFields([]);
    };

    // Placeholder for saving edited fields back to the main state
    const handleSaveEditedFields = () => {
      if (editingPrintTemplateIndex === null) return;
      const updatedTemplates = [...templates];
      // Ensure fields is an array, even if it was null/undefined on the template initially
      updatedTemplates[editingPrintTemplateIndex].fields = Array.isArray(currentEditingFields) ? currentEditingFields : [];
      setLocalResourceSettings(prev => ({
        ...prev,
        certificatePrinting: {
          ...prev.certificatePrinting,
          templates: updatedTemplates
        }
      }));
      setFormChanged(true);
      setEditingPrintTemplateIndex(null); // Exit editing mode
      showToast('Template fields updated locally. Save all settings to persist.');
    };

    // Functions to manage currentEditingFields
    const handleAddFieldToCurrent = () => {
      const newField = {
        id: `field_${Date.now()}`,
        type: 'text',
        label: 'New Field',
        dataSource: 'Registration.personalInfo.firstName', // Default example
        staticText: '',
        position: { x: 10, y: 10 }, // Default position in 'pt' (or current templateUnit)
        style: {
          font: 'Helvetica',
          fontSize: 12, // Default size in 'pt'
          color: '#000000',
          align: 'left',
          fontWeight: 'normal',
          maxWidth: 200,
          rotation: 0 // Added rotation
        },
        sampleValue: '',
        isRequired: false
      };
      setCurrentEditingFields(prevFields => [...prevFields, newField]);
    };

    const handleUpdateFieldInCurrent = (index, propertyPath, value) => {
      setCurrentEditingFields(prevFields => {
        const newFields = JSON.parse(JSON.stringify(prevFields)); // Deep copy
        // Simple path update, for nested like position.x or style.fontSize
        const keys = propertyPath.split('.');
        let current = newFields[index];
        for (let i = 0; i < keys.length - 1; i++) {
          if (!current[keys[i]]) current[keys[i]] = {}; // Create nested object if it doesn't exist
          current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = value;
        // Coerce numeric types for specific paths
        if (propertyPath === 'position.x' || propertyPath === 'position.y' || 
            propertyPath === 'style.fontSize' || propertyPath === 'style.maxWidth' ||
            propertyPath === 'style.rotation') { // Added rotation here
          current[keys[keys.length - 1]] = parseFloat(value) || 0;
        }
        return newFields;
      });
    };

    const handleRemoveFieldFromCurrent = (index) => {
      setCurrentEditingFields(prevFields => prevFields.filter((_, i) => i !== index));
      setFormChanged(true); // Ensure form is marked as changed
    };

    // Add this inside ResourcesTab component, before renderCertificatePrintingConfig
    const handleTemplateImageLoad = (img) => {
      // A4 landscape: 297mm x 210mm, aspect ratio ≈ 1.414
      const expectedAspect = 297 / 210;
      const actualAspect = img.naturalWidth / img.naturalHeight;
      if (Math.abs(actualAspect - expectedAspect) > 0.05) {
        setTemplateFileError('Warning: Uploaded template is not A4 landscape (297x210mm). Preview may not match print.');
      } else {
        setTemplateFileError(null);
      }
    };

    return (
      <Card 
        className="mb-6"
        // title="Certificate Printing Configuration" // Title is now handled by renderSectionHeader
      >
        {renderSectionHeader('Certificate Printing Configuration', 'certificatePrinting')} {/* <-- ADDED THIS LINE */} 
        <div className="flex items-center justify-between mb-4 mt-4"> {/* Added mt-4 for spacing after header */}
          <div className="flex items-center space-x-4">
            <Switch
              checked={localResourceSettings.certificatePrinting?.enabled !== false}
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
        
        {localResourceSettings.certificatePrinting?.enabled !== false && (
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
                          <p className="text-sm text-gray-600">Type: {template.categoryType || 'general'}</p>
                          {(template.file && typeof template.file === 'object' && template.file.name) ? (
                            <p className="text-sm text-gray-500 italic">File: {template.file.name} (Pending save)</p>
                          ) : (template.templateUrl && typeof template.templateUrl === 'string') ? (
                            (() => {
                              const backendBaseUrl = process.env.NODE_ENV === 'development' 
                                ? 'http://localhost:5000' 
                                : window.location.origin;
                              
                              const fullUrl = template.templateUrl.startsWith('/') 
                                ? `${backendBaseUrl}${template.templateUrl}` 
                                : template.templateUrl;

                              return (
                                <a 
                                  href={fullUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline italic cursor-pointer"
                                  title={`Open ${template.templateUrl.substring(template.templateUrl.lastIndexOf('/') + 1)}`}
                                >
                                  File: {template.templateUrl.substring(template.templateUrl.lastIndexOf('/') + 1)}
                                </a>
                              );
                            })()
                          ) : (typeof template.file === 'string' && template.file) ? (
                            <a 
                              href={template.file} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-sm text-blue-600 hover:text-blue-800 hover:underline italic cursor-pointer"
                              title={`Open ${template.file.substring(template.file.lastIndexOf('/') + 1)}`}
                            >
                              File: {template.file.substring(template.file.lastIndexOf('/') + 1)}
                            </a>
                          ) : (template.fileName) ? (
                            <a 
                              href={template.fileName}
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-sm text-blue-600 hover:text-blue-800 hover:underline italic cursor-pointer"
                              title={`Open ${template.fileName}`}
                            >
                              File: {template.fileName}
                            </a>
                          ) : (
                            <p className="text-sm text-gray-400 italic">No template file uploaded.</p>
                          )}
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
                            onClick={() => handleStartEditPrintTemplate(index)}
                            className="text-blue-500 hover:text-blue-700"
                            title="Edit Fields"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
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
                      value={newPrintTemplate.categoryType} // Use categoryType
                      onChange={(e) => setNewPrintTemplate({...newPrintTemplate, categoryType: e.target.value})} // Update categoryType
                    >
                      <option value="attendance">Attendance</option>
                      <option value="speaker">Speaker</option>
                      <option value="participation">Participation</option>
                      <option value="award">Award</option>
                      <option value="abstract">Abstract</option>
                      <option value="workshop">Workshop</option>
                    </select>
                  </div>
                  <div 
                    className={`sm:col-span-2 p-3 border-2 border-dashed rounded-lg ${
                      isDraggingOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <label className="block text-sm font-medium text-gray-700">Template File (PDF, PNG, JPG) - Drag & Drop or Click</label>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      ref={fileInputRef}
                      onChange={(e) => {
                        handleFileValidation(e.target.files[0]);
                      }}
                      className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
                    />
                    {templateFileError && (
                      <p className="mt-1 text-xs text-red-600">{templateFileError}</p>
                    )}
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

        {editingPrintTemplateIndex !== null && templates[editingPrintTemplateIndex] && (
          <div className="mt-6 pt-4 border-t border-gray-200"> 
            <h3 className="text-xl font-semibold mb-3">{`Editing Fields for: ${templates[editingPrintTemplateIndex].name}`}</h3>
            <div className="p-4 space-y-4 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-600">
                Template Type: {templates[editingPrintTemplateIndex].categoryType || templates[editingPrintTemplateIndex].type}
              </p>

              {/* Certificate Preview Area */}
              {(() => {
                const currentTemplate = templates[editingPrintTemplateIndex];
                console.log('[CertificatePreview] Current template object:', currentTemplate);
                const rawTemplateUrl = currentTemplate.templateUrl;
                console.log('[CertificatePreview] Raw templateUrl from template:', rawTemplateUrl);
                const baseUrl = getApiBaseUrl();
                console.log('[CertificatePreview] Base API URL:', baseUrl);
                
                const finalImageUrl = rawTemplateUrl?.startsWith('http') 
                  ? rawTemplateUrl 
                  : rawTemplateUrl ? `${baseUrl}${rawTemplateUrl}` : null;
                console.log('[CertificatePreview] Final computed Image URL for preview:', finalImageUrl);

                return (
                  <CertificatePreview 
                    previewContainerRef={previewContainerRef}
                    templateImageUrl={finalImageUrl}
                    fields={currentEditingFields}
                    templateUnit={currentTemplate.templateUnit || 'pt'}
                    onFieldDragStart={handleFieldDragStart} // Pass down the callback
                    printableArea={currentTemplate.printableArea}
                    onImageLoad={handleTemplateImageLoad}
                  />
                );
              })()}

              {/* Current image preview - will be replaced by CertificatePreview */}
              {/* templates[editingPrintTemplateIndex].templateUrl && (
                <div className="flex items-center space-x-2">
                    <img 
                        src={templates[editingPrintTemplateIndex].templateUrl.startsWith('http') ? templates[editingPrintTemplateIndex].templateUrl : `${getApiBaseUrl()}${templates[editingPrintTemplateIndex].templateUrl}`}
                        alt="Template Preview" 
                        className="max-w-xs max-h-48 border p-1 rounded-md object-contain"
                    />
                    <a 
                        href={templates[editingPrintTemplateIndex].templateUrl.startsWith('http') ? templates[editingPrintTemplateIndex].templateUrl : `${getApiBaseUrl()}${templates[editingPrintTemplateIndex].templateUrl}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm"
                    >
                        (View Full Size)
                    </a>
                </div>
              )} */}

              <div className="border-t pt-4">
                <h4 className="text-md font-semibold mb-2">Fields Configuration:</h4>
                {currentEditingFields.length === 0 && (
                  <p className="text-gray-500 italic">No fields configured yet for this template.</p>
                )}
                {currentEditingFields.map((field, index) => (
                  <div key={field.id || index} className="p-3 mb-3 border rounded-md bg-gray-50 space-y-3">
                    <div className="flex justify-between items-center">
                      <p className="font-medium text-sm">Field: {field.label || `Field ${index + 1}`}</p>
                      <Button 
                        variant="danger-outline"
                        size="xs"
                        onClick={() => handleRemoveFieldFromCurrent(index)}
                        leftIcon={<TrashIcon className="h-4 w-4" />}
                      >
                        Delete Field
                      </Button>
                    </div>
                    <Input
                      label="Label"
                      value={field.label || ''}
                      onChange={(e) => handleUpdateFieldInCurrent(index, 'label', e.target.value)}
                      placeholder="e.g., Participant Name"
                    />
                    <div>
                      <label htmlFor={`field-dataSource-${index}`} className="block text-sm font-medium text-gray-700 mb-1">Data Source</label>
                      <select
                        id={`field-dataSource-${index}`}
                        value={field.dataSource || ''}
                        onChange={(e) => handleUpdateFieldInCurrent(index, 'dataSource', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      >
                        <option value="" disabled>Select a source...</option>
                        {
                          // Group options by model
                          Object.values(
                            dataSourceOptions.reduce((acc, option) => {
                              const group = option.group || 'General';
                              if (!acc[group]) acc[group] = [];
                              acc[group].push(option);
                              return acc;
                            }, {})
                          ).map((groupOptions, groupIndex) => (
                            <optgroup label={groupOptions[0].group || 'General'} key={groupIndex}>
                              {groupOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </optgroup>
                          ))
                        }
                      </select>
                    </div>

                    {field.dataSource === 'Static' && (
                      <Input
                        label="Static Text"
                        value={field.staticText || ''}
                        onChange={(e) => handleUpdateFieldInCurrent(index, 'staticText', e.target.value)}
                        placeholder="Enter static text to display"
                      />
                    )}

                    {/* Basic position and style inputs - can be expanded later */}
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label="Position X (pt)"
                        type="number"
                        value={field.position?.x || 0}
                        onChange={(e) => handleUpdateFieldInCurrent(index, 'position.x', e.target.value)}
                      />
                      <Input
                        label="Position Y (pt)"
                        type="number"
                        value={field.position?.y || 0}
                        onChange={(e) => handleUpdateFieldInCurrent(index, 'position.y', e.target.value)}
                      />
                    </div>
                     <div className="grid grid-cols-2 gap-3">
                      <Input
                        label="Font Size (pt)"
                        type="number"
                        value={field.style?.fontSize || 12}
                        onChange={(e) => handleUpdateFieldInCurrent(index, 'style.fontSize', e.target.value)}
                      />
                       <Input
                        label="Color (hex)"
                        value={field.style?.color || '#000000'}
                        onChange={(e) => handleUpdateFieldInCurrent(index, 'style.color', e.target.value)}
                      />
                    </div>
                    <Input
                      label="Rotation (degrees)"
                      type="number"
                      value={field.style?.rotation || 0}
                      onChange={(e) => handleUpdateFieldInCurrent(index, 'style.rotation', e.target.value)}
                      placeholder="0"
                    />
                  </div>
                ))}
                <Button 
                  variant="neutral-outline"
                  onClick={handleAddFieldToCurrent} 
                  leftIcon={<PlusCircleIcon className="h-5 w-5 mr-1" />} 
                  className="mt-2"
                >
                  Add New Field
                </Button>
              </div>

              <div className="flex justify-end space-x-3 mt-4">
                <Button variant="outline" onClick={handleCancelEditPrintTemplate}>Cancel</Button>
                <Button variant="primary" onClick={handleSaveEditedFields}>Save Fields to Template (Local)</Button>
              </div>
            </div>
          </div>
        )}
      </Card>
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