import React, { useState, useEffect } from 'react';
import { Card, Input, Select, Switch, Button, Textarea } from '../../../components/common';
import BadgeTemplate from '../../../components/badges/BadgeTemplate';
import defaultBadgeTemplate from '../../../components/badges/DefaultBadgeTemplate';
import { useNavigate, useParams } from 'react-router-dom';
import badgeTemplateService from '../../../services/badgeTemplateService';
import { toast } from 'react-toastify';

const BadgesTab = ({ event, setEvent, setFormChanged }) => {
  const navigate = useNavigate();
  const { eventId: eventIdFromParams } = useParams();
  const eventId = event?._id || eventIdFromParams;

  const [badgeSettings, setBadgeSettings] = useState({
    orientation: 'portrait',
    size: { width: 3.5, height: 5 },
    showLogo: true,
    logoPosition: 'top',
    showQR: true,
    qrPosition: 'bottom',
    fields: {
      name: { enabled: true, fontSize: 'large', fontWeight: 'bold' },
      organization: { enabled: true, fontSize: 'medium', fontWeight: 'normal' },
      category: { enabled: true, fontSize: 'small', fontWeight: 'normal' }
    },
    background: '#FFFFFF',
    textColor: '#000000',
    borderColor: '#CCCCCC'
  });

  // Sample registration data for preview
  const [sampleRegistration, setSampleRegistration] = useState({
    _id: '123456789',
    registrationId: 'REG-001',
    firstName: 'John',
    lastName: 'Doe',
    name: 'John Doe',
    organization: 'Acme Organization',
    category: { name: 'Delegate', color: '#3B82F6' },
    categoryName: 'Delegate',
    categoryColor: '#3B82F6',
    country: 'United States'
  });

  // State for available custom templates
  const [availableTemplates, setAvailableTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  
  // State for the selected template ID (can be custom ID or standard value)
  const [selectedTemplateValue, setSelectedTemplateValue] = useState('standard'); // Default to 'standard'

  // Fetch custom templates for the event
  useEffect(() => {
    const fetchTemplates = async () => {
      console.log('[BadgesTab] Fetching templates for eventId:', eventId);
      if (!eventId) {
        console.log('[BadgesTab] No eventId, skipping fetch.');
        return;
      }
      setLoadingTemplates(true);
      try {
        const response = await badgeTemplateService.getTemplates(eventId);
        console.log('[BadgesTab] Raw response from getTemplates:', response);
        if (response.success && Array.isArray(response.data)) {
          console.log('[BadgesTab] Templates fetched successfully:', response.data);
          setAvailableTemplates(response.data);

          // Find default template
          const defaultTemplate = response.data.find(t => t.isDefault);
          if (defaultTemplate) {
            setSelectedTemplateValue(defaultTemplate._id);
          } else {
            setSelectedTemplateValue('standard');
          }
        } else {
          console.error('[BadgesTab] Failed to fetch templates or response format incorrect. Expected response.data to be an array. Received:', response);
          toast.error(response.message || 'Failed to load custom badge templates.');
          setAvailableTemplates([]);
          setSelectedTemplateValue('standard');
        }
      } catch (error) {
        console.error('[BadgesTab] Error fetching badge templates:', error);
        toast.error('An error occurred while fetching templates.');
        setAvailableTemplates([]);
        setSelectedTemplateValue('standard');
      } finally {
        setLoadingTemplates(false);
      }
    };
    fetchTemplates();
  }, [eventId]);

  useEffect(() => {
    if (event && event.badgeSettings) {
      // Ensure badgeSettings has the correct structure with defaults for missing properties
      const settings = {
        ...badgeSettings, // Start with our default values
        ...event.badgeSettings, // Override with event values
        // Ensure size object exists with default values for missing properties
        size: {
          width: 3.5,
          height: 5,
          ...(event.badgeSettings.size || {})
        },
        // Ensure fields object exists with defaults
        fields: {
          name: { enabled: true, fontSize: 'large', fontWeight: 'bold', ...(typeof event.badgeSettings.fields?.name === 'object' ? event.badgeSettings.fields.name : {}) },
          organization: { enabled: true, fontSize: 'medium', fontWeight: 'normal', ...(typeof event.badgeSettings.fields?.organization === 'object' ? event.badgeSettings.fields.organization : {}) },
          category: { enabled: true, fontSize: 'small', fontWeight: 'normal', ...(typeof event.badgeSettings.fields?.category === 'object' ? event.badgeSettings.fields.category : {}) }
        }
      };
      setBadgeSettings(settings);
    } else if (event && !event.badgeSettings) {
      // Initialize badge settings if they don't exist
      const updatedEvent = {
        ...event,
        badgeSettings: badgeSettings
      };
      setEvent(updatedEvent);
      setFormChanged(true);
    }
  }, [event, setEvent, setFormChanged]);

  const handleBadgeChange = (property, value) => {
    const updatedSettings = {
      ...badgeSettings,
      [property]: value
    };
    
    setBadgeSettings(updatedSettings);
    
    const updatedEvent = {
      ...event,
      badgeSettings: updatedSettings
    };
    
    setEvent(updatedEvent);
    setFormChanged(true);
  };

  const handleSizeChange = (dimension, value) => {
    const updatedSize = {
      ...badgeSettings.size,
      [dimension]: parseFloat(value) || 0
    };
    
    const updatedSettings = {
      ...badgeSettings,
      size: updatedSize
    };
    
    setBadgeSettings(updatedSettings);
    
    const updatedEvent = {
      ...event,
      badgeSettings: updatedSettings
    };
    
    setEvent(updatedEvent);
    setFormChanged(true);
  };

  const handleFieldChange = (fieldId, property, value) => {
    const updatedFields = {
      ...badgeSettings.fields,
      [fieldId]: {
        ...badgeSettings.fields[fieldId],
        [property]: value
      }
    };
    
    const updatedSettings = {
      ...badgeSettings,
      fields: updatedFields
    };
    
    setBadgeSettings(updatedSettings);
    
    const updatedEvent = {
      ...event,
      badgeSettings: updatedSettings
    };
    
    setEvent(updatedEvent);
    setFormChanged(true);
  };

  // Navigate to the full badge designer
  const goToBadgeDesigner = () => {
    const currentEventId = event?._id || eventIdFromParams;
    if (currentEventId) {
      navigate(`/events/${currentEventId}/badges/designer`);
    } else {
      console.error('BadgeDesigner navigation error: Event ID is not available.');
      // Optionally, show a toast notification to the user
      // toast.error('Could not navigate to badge designer: Event ID missing.');
    }
  };

  const orientationOptions = [
    { value: 'portrait', label: 'Portrait' },
    { value: 'landscape', label: 'Landscape' }
  ];

  const positionOptions = [
    { value: 'top', label: 'Top' },
    { value: 'middle', label: 'Middle' },
    { value: 'bottom', label: 'Bottom' }
  ];

  const fontSizeOptions = [
    { value: 'small', label: 'Small' },
    { value: 'medium', label: 'Medium' },
    { value: 'large', label: 'Large' },
    { value: 'xlarge', label: 'Extra Large' }
  ];

  const fontWeightOptions = [
    { value: 'normal', label: 'Normal' },
    { value: 'bold', label: 'Bold' }
  ];

  // Combine standard options with fetched custom templates for the dropdown
  const templateOptions = [
    { value: 'standard', label: 'Standard Layout (Basic Settings)' },
    // Add other standard layouts if needed (large, small, landscape - though these might be better handled by orientation/size settings)
    // { value: 'large', label: 'Large Layout' }, 
    // { value: 'small', label: 'Small Layout' },
    // { value: 'landscape', label: 'Landscape Layout' },
    { value: 'divider', label: '--- Custom Templates ---', disabled: true },
    ...availableTemplates.map(template => ({
      value: template._id, // Use the template ID as the value
      label: template.name  // Use the template name as the label
    }))
  ];

  const [previewTemplate, setPreviewTemplate] = useState('standard');

  return (
    <div className="space-y-6">
      {/* Basic Badge Layout */}
      <Card title="Badge Layout">
        <div className="space-y-4">
          <Select
            label="Orientation"
            value={badgeSettings.orientation}
            onChange={(e) => handleBadgeChange('orientation', e.target.value)}
            options={orientationOptions}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="number"
              label="Width (inches)"
              value={badgeSettings.size.width}
              onChange={(e) => handleSizeChange('width', e.target.value)}
              step="0.1"
              min="1"
              max="10"
            />
            
            <Input
              type="number"
              label="Height (inches)"
              value={badgeSettings.size.height}
              onChange={(e) => handleSizeChange('height', e.target.value)}
              step="0.1"
              min="1"
              max="10"
            />
          </div>
        </div>
      </Card>
      
      {/* Design Elements */}
      <Card title="Design Elements">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              type="color"
              label="Background Color"
              value={badgeSettings.background}
              onChange={(e) => handleBadgeChange('background', e.target.value)}
            />
            
            <Input
              type="color"
              label="Text Color"
              value={badgeSettings.textColor}
              onChange={(e) => handleBadgeChange('textColor', e.target.value)}
            />
            
            <Input
              type="color"
              label="Border Color"
              value={badgeSettings.borderColor}
              onChange={(e) => handleBadgeChange('borderColor', e.target.value)}
            />
          </div>
          
          <div className="flex items-center space-x-4">
            <Switch
              label="Show Logo"
              checked={badgeSettings.showLogo}
              onChange={(checked) => handleBadgeChange('showLogo', checked)}
            />
            
            {badgeSettings.showLogo && (
              <Select
                label="Logo Position"
                value={badgeSettings.logoPosition}
                onChange={(e) => handleBadgeChange('logoPosition', e.target.value)}
                options={positionOptions}
              />
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <Switch
              label="Show QR Code"
              checked={badgeSettings.showQR}
              onChange={(checked) => handleBadgeChange('showQR', checked)}
            />
            
            {badgeSettings.showQR && (
              <Select
                label="QR Code Position"
                value={badgeSettings.qrPosition}
                onChange={(e) => handleBadgeChange('qrPosition', e.target.value)}
                options={positionOptions}
              />
            )}
          </div>
        </div>
      </Card>
      
      {/* Badge Fields */}
      <Card title="Badge Fields">
        <div className="space-y-4">
          {Object.entries(badgeSettings.fields).map(([fieldId, field]) => (
            <div key={fieldId} className="border-b border-gray-200 pb-4 last:border-0">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-medium">{fieldId.charAt(0).toUpperCase() + fieldId.slice(1)}</h4>
                <Switch
                  checked={field.enabled}
                  onChange={(checked) => handleFieldChange(fieldId, 'enabled', checked)}
                />
              </div>
              
              {field.enabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <Select
                    label="Font Size"
                    value={field.fontSize}
                    onChange={(e) => handleFieldChange(fieldId, 'fontSize', e.target.value)}
                    options={fontSizeOptions}
                  />
                  
                  <Select
                    label="Font Weight"
                    value={field.fontWeight}
                    onChange={(e) => handleFieldChange(fieldId, 'fontWeight', e.target.value)}
                    options={fontWeightOptions}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Badge Preview */}
      <Card title="Badge Preview">
        <div className="space-y-4">
          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-2">
              Preview how your badge will look. For advanced design options, use the Badge Designer.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Preview Template"
                value={selectedTemplateValue}
                onChange={async (selectedValue) => {
                  const value = selectedValue;
                  setSelectedTemplateValue(value);
                  console.log('Selected Template Value:', value);
                  
                  // Check if a custom template ID was selected (not 'standard' or a divider)
                  if (value && value !== 'standard' && value !== 'divider') {
                    try {
                      const templateId = value;
                      toast.info(`Setting ${availableTemplates.find(t => t._id === templateId)?.name || 'template'} as default...`);
                      const response = await badgeTemplateService.setDefaultTemplate(eventId, templateId);
                      if (response.success) {
                        toast.success('Default badge template updated successfully!');
                        // Optionally: Update the event state if the response contains the updated event
                        // if (response.data) setEvent(response.data);
                      } else {
                        toast.error(response.message || 'Failed to set default template.');
                      }
                    } catch (error) {
                      console.error('Error setting default template:', error);
                      toast.error('An error occurred while setting the default template.');
                    }
                  } else {
                    // Handle selection of non-custom templates if needed (e.g., clear default?)
                    console.log('Selected a non-custom template layout.');
                  }
                }}
                options={templateOptions}
                disabled={loadingTemplates}
              />
              <Button 
                variant="primary"
                onClick={goToBadgeDesigner}
              >
                Open Advanced Badge Designer
              </Button>
            </div>
          </div>
          
          <div className="flex justify-center p-4 bg-gray-50 rounded-lg">
            <BadgeTemplate
              template={
                selectedTemplateValue !== 'standard' && selectedTemplateValue !== 'divider'
                  ? (availableTemplates.find(t => t._id === selectedTemplateValue) || defaultBadgeTemplate)
                  : defaultBadgeTemplate
              }
              registrationData={sampleRegistration}
              previewMode={true}
              scale={1}
              className="scale-100"
            />
          </div>
          
          {/* Sample Data for Preview */}
          <div className="mt-4 border-t pt-4">
            <h4 className="font-medium mb-2">Sample Attendee Data</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="First Name"
                value={sampleRegistration.firstName}
                onChange={(e) => setSampleRegistration({...sampleRegistration, firstName: e.target.value, name: `${e.target.value} ${sampleRegistration.lastName}`})}
              />
              <Input
                label="Last Name"
                value={sampleRegistration.lastName}
                onChange={(e) => setSampleRegistration({...sampleRegistration, lastName: e.target.value, name: `${sampleRegistration.firstName} ${e.target.value}`})}
              />
              <Input
                label="Registration ID"
                value={sampleRegistration.registrationId}
                onChange={(e) => setSampleRegistration({...sampleRegistration, registrationId: e.target.value})}
              />
              <Input
                label="Organization"
                value={sampleRegistration.organization}
                onChange={(e) => setSampleRegistration({...sampleRegistration, organization: e.target.value})}
              />
              <Input
                label="Category"
                value={sampleRegistration.categoryName}
                onChange={(e) => setSampleRegistration({
                  ...sampleRegistration, 
                  categoryName: e.target.value, 
                  category: { ...sampleRegistration.category, name: e.target.value }
                })}
              />
              <Input
                type="color"
                label="Category Color"
                value={sampleRegistration.categoryColor}
                onChange={(e) => setSampleRegistration({
                  ...sampleRegistration, 
                  categoryColor: e.target.value,
                  category: { ...sampleRegistration.category, color: e.target.value }
                })}
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default BadgesTab; 