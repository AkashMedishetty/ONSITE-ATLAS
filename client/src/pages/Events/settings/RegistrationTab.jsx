import React, { useState, useEffect } from 'react';
import { PlusIcon, TrashIcon, ArrowsUpDownIcon, CogIcon, EyeIcon, LinkIcon, PencilIcon } from '@heroicons/react/24/outline';
import { Card, Input, Select, Switch, Button, Textarea, Badge } from '../../../components/common';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// Draggable field component
const DraggableField = ({ id, index, field, moveField, editField, removeField }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'FIELD',
    item: { id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const [, drop] = useDrop(() => ({
    accept: 'FIELD',
    hover(item, monitor) {
      if (item.index !== index) {
        moveField(item.index, index);
        item.index = index;
      }
    },
  }));

  return (
    <div 
      ref={(node) => drag(drop(node))} 
      className={`border rounded-lg p-3 mb-2 bg-white ${isDragging ? 'opacity-50' : 'opacity-100'}`}
      style={{ cursor: 'move' }}
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <ArrowsUpDownIcon className="h-4 w-4 text-gray-400 mr-2" />
          <div>
            <span className="font-medium">{field.label}</span>
            <span className="text-xs ml-2 text-gray-500">({field.type})</span>
            {field.required && <Badge className="ml-2 text-xs" variant="primary">Required</Badge>}
          </div>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={() => editField(index)} 
            className="text-gray-500 hover:text-blue-500"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button 
            onClick={() => removeField(index)} 
            className="text-gray-500 hover:text-red-500"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

const RegistrationTab = ({ event, setEvent, setFormChanged, id }) => {
  const [registrationSettings, setRegistrationSettings] = useState({
    isOpen: true,
    requiresApproval: false,
    collectPhoneNumber: true,
    collectOrganization: true,
    collectAddress: false,
    collectDietaryRestrictions: true,
    customFields: [],
    termsAndConditions: '',
    registrationInstructions: '',
    portal: {
      enabled: true,
      title: 'Event Registration',
      subtitle: 'Complete the form below to register',
      logoEnabled: true,
      backgroundImage: '',
      primaryColor: '#4F46E5',
      secondaryColor: '#10B981',
      buttonText: 'Submit Registration',
      successMessage: 'Registration successful! Thank you for registering.',
      showSocialShare: true
    }
  });

  const [editingField, setEditingField] = useState(null);
  const [newField, setNewField] = useState({
    name: '',
    label: '',
    type: 'text',
    required: false,
    placeholder: '',
    options: [],
    description: ''
  });
  const [newOption, setNewOption] = useState('');
  const [activeSection, setActiveSection] = useState('fields');
  const [showFieldModal, setShowFieldModal] = useState(false);

  // Initialize settings from the event data
  useEffect(() => {
    if (event && event.registrationSettings) {
      setRegistrationSettings({
        ...registrationSettings,
        ...event.registrationSettings
      });
    } else if (event && !event.registrationSettings) {
      // Create default settings if they don't exist
      const updatedEvent = {
        ...event,
        registrationSettings: registrationSettings
      };
      setEvent(updatedEvent);
    }
  }, [event, setEvent]);

  // Handle toggle changes
  const handleToggleChange = (field, value) => {
    setRegistrationSettings({
      ...registrationSettings,
      [field]: value
    });
    
    const updatedEvent = {
      ...event,
      registrationSettings: {
        ...event.registrationSettings,
        [field]: value
      }
    };
    
    setEvent(updatedEvent);
    setFormChanged(true);
  };

  // Handle portal settings changes
  const handlePortalChange = (field, value) => {
    setRegistrationSettings({
      ...registrationSettings,
      portal: {
        ...registrationSettings.portal,
        [field]: value
      }
    });
    
    const updatedEvent = {
      ...event,
      registrationSettings: {
        ...event.registrationSettings,
        portal: {
          ...(event.registrationSettings?.portal || {}),
          [field]: value
        }
      }
    };
    
    setEvent(updatedEvent);
    setFormChanged(true);
  };

  // Handle text input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setRegistrationSettings({
      ...registrationSettings,
      [name]: value
    });
    
    const updatedEvent = {
      ...event,
      registrationSettings: {
        ...event.registrationSettings,
        [name]: value
      }
    };
    
    setEvent(updatedEvent);
    setFormChanged(true);
  };

  // Move a field (for drag and drop)
  const moveField = (fromIndex, toIndex) => {
    const updatedFields = [...registrationSettings.customFields];
    const [movedField] = updatedFields.splice(fromIndex, 1);
    updatedFields.splice(toIndex, 0, movedField);
    
    setRegistrationSettings({
      ...registrationSettings,
      customFields: updatedFields
    });
    
    const updatedEvent = {
      ...event,
      registrationSettings: {
        ...event.registrationSettings,
        customFields: updatedFields
      }
    };
    
    setEvent(updatedEvent);
    setFormChanged(true);
  };

  // Prepare to edit a field
  const editField = (index) => {
    setEditingField(index);
    setNewField(registrationSettings.customFields[index]);
    setShowFieldModal(true);
  };

  // Add a custom field
  const addCustomField = () => {
    const fieldId = `field_${Date.now()}`;
    const finalField = {
      ...newField,
      id: fieldId,
      name: newField.name || `field_${fieldId}`,
    };
    
    let updatedFields;
    
    if (editingField !== null) {
      // Update existing field
      updatedFields = [...registrationSettings.customFields];
      updatedFields[editingField] = finalField;
    } else {
      // Add new field
      updatedFields = [...registrationSettings.customFields, finalField];
    }
    
    setRegistrationSettings({
      ...registrationSettings,
      customFields: updatedFields
    });
    
    const updatedEvent = {
      ...event,
      registrationSettings: {
        ...event.registrationSettings,
        customFields: updatedFields
      }
    };
    
    setEvent(updatedEvent);
    setFormChanged(true);
    
    // Reset form
    setNewField({
      name: '',
      label: '',
      type: 'text',
      required: false,
      placeholder: '',
      options: [],
      description: ''
    });
    
    setEditingField(null);
    setShowFieldModal(false);
  };

  // Add option to a select/radio/checkbox field
  const addOption = () => {
    if (!newOption.trim()) return;
    
    setNewField({
      ...newField,
      options: [...newField.options, newOption.trim()]
    });
    
    setNewOption('');
  };

  // Remove option from a select/radio/checkbox field
  const removeOption = (index) => {
    const updatedOptions = [...newField.options];
    updatedOptions.splice(index, 1);
    
    setNewField({
      ...newField,
      options: updatedOptions
    });
  };

  // Remove a custom field
  const removeField = (index) => {
    const updatedFields = [...registrationSettings.customFields];
    updatedFields.splice(index, 1);
    
    setRegistrationSettings({
      ...registrationSettings,
      customFields: updatedFields
    });
    
    const updatedEvent = {
      ...event,
      registrationSettings: {
        ...event.registrationSettings,
        customFields: updatedFields
      }
    };
    
    setEvent(updatedEvent);
    setFormChanged(true);
  };

  // Handle field input changes
  const handleFieldChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewField({
      ...newField,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Field type options
  const fieldTypeOptions = [
    { value: 'text', label: 'Text' },
    { value: 'email', label: 'Email' },
    { value: 'number', label: 'Number' },
    { value: 'phone', label: 'Phone' },
    { value: 'date', label: 'Date' },
    { value: 'select', label: 'Dropdown' },
    { value: 'checkbox', label: 'Checkbox' },
    { value: 'radio', label: 'Radio' },
    { value: 'textarea', label: 'Text Area' }
  ];

  // Get external registration link
  const getExternalLink = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/register/${id}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex space-x-2 mb-6 border-b">
        <button
          className={`py-3 px-4 font-medium text-sm ${activeSection === 'fields' ? 'border-b-2 border-primary-500 text-primary-600' : 'text-gray-500'}`}
          onClick={() => setActiveSection('fields')}
        >
          Form Fields
        </button>
        <button
          className={`py-3 px-4 font-medium text-sm ${activeSection === 'portal' ? 'border-b-2 border-primary-500 text-primary-600' : 'text-gray-500'}`}
          onClick={() => setActiveSection('portal')}
        >
          External Portal
        </button>
        <button
          className={`py-3 px-4 font-medium text-sm ${activeSection === 'terms' ? 'border-b-2 border-primary-500 text-primary-600' : 'text-gray-500'}`}
          onClick={() => setActiveSection('terms')}
        >
          Terms & Conditions
        </button>
      </div>

      {activeSection === 'fields' && (
        <div className="space-y-6">
          <Card title="Registration Status">
            <div className="space-y-4">
              <Switch
                label="Registration Open"
                checked={registrationSettings.isOpen}
                onChange={(checked) => handleToggleChange('isOpen', checked)}
                description="When enabled, attendees can register for this event"
              />
              
              <Switch
                label="Require Approval"
                checked={registrationSettings.requiresApproval}
                onChange={(checked) => handleToggleChange('requiresApproval', checked)}
                description="When enabled, registrations require admin approval"
              />
            </div>
          </Card>
          
          <Card title="Standard Fields">
            <div className="space-y-4">
              <p className="text-sm text-gray-600 mb-4">
                These fields are always included in the registration form. You can choose which ones are required.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">First Name</span>
                      <Badge className="ml-2" variant="primary">Required</Badge>
                    </div>
                    <div className="text-xs text-gray-500">Always included</div>
                  </div>
                </div>
                
                <div className="border rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">Last Name</span>
                      <Badge className="ml-2" variant="primary">Required</Badge>
                    </div>
                    <div className="text-xs text-gray-500">Always included</div>
                  </div>
                </div>
                
                <div className="border rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">Email</span>
                      <Badge className="ml-2" variant="primary">Required</Badge>
                    </div>
                    <div className="text-xs text-gray-500">Always included</div>
                  </div>
                </div>
                
                <div className="border rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">Phone Number</span>
                      <Switch
                        label=""
                        checked={registrationSettings.collectPhoneNumber}
                        onChange={(checked) => handleToggleChange('collectPhoneNumber', checked)}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="border rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">Organization</span>
                      <Switch
                        label=""
                        checked={registrationSettings.collectOrganization}
                        onChange={(checked) => handleToggleChange('collectOrganization', checked)}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="border rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">Address</span>
                      <Switch
                        label=""
                        checked={registrationSettings.collectAddress}
                        onChange={(checked) => handleToggleChange('collectAddress', checked)}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="border rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">Dietary Restrictions</span>
                      <Switch
                        label=""
                        checked={registrationSettings.collectDietaryRestrictions}
                        onChange={(checked) => handleToggleChange('collectDietaryRestrictions', checked)}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="border rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">Category</span>
                      <Badge className="ml-2" variant="primary">Required</Badge>
                    </div>
                    <div className="text-xs text-gray-500">Always included</div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
          
          <Card title="Custom Fields">
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Form Builder</h4>
                  <p className="text-xs text-gray-500">Drag and drop to reorder fields</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingField(null);
                    setNewField({
                      name: '',
                      label: '',
                      type: 'text',
                      required: false,
                      placeholder: '',
                      options: [],
                      description: ''
                    });
                    setShowFieldModal(true);
                  }}
                  leftIcon={<PlusIcon className="h-4 w-4" />}
                >
                  Add Field
                </Button>
              </div>
              
              <DndProvider backend={HTML5Backend}>
                <div className="space-y-2">
                  {registrationSettings.customFields.length === 0 ? (
                    <div className="bg-gray-50 p-8 text-center rounded-lg border border-dashed border-gray-300">
                      <p className="text-gray-500">No custom fields added yet.</p>
                      <p className="text-sm text-gray-400 mt-1">Click "Add Field" to create your first custom field.</p>
                    </div>
                  ) : (
                    registrationSettings.customFields.map((field, index) => (
                      <DraggableField
                        key={field.id || index}
                        id={field.id || index}
                        index={index}
                        field={field}
                        moveField={moveField}
                        editField={editField}
                        removeField={removeField}
                      />
                    ))
                  )}
                </div>
              </DndProvider>
            </div>
          </Card>
        </div>
      )}

      {activeSection === 'portal' && (
        <div className="space-y-6">
          <Card title="External Registration Portal">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Switch
                  label="Enable External Registration Page"
                  checked={registrationSettings.portal?.enabled}
                  onChange={(checked) => handlePortalChange('enabled', checked)}
                  description="When enabled, attendees can register through a public link"
                />
                
                {registrationSettings.portal?.enabled && (
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<EyeIcon className="h-4 w-4" />}
                    onClick={() => window.open(getExternalLink(), '_blank')}
                  >
                    Preview Page
                  </Button>
                )}
              </div>
              
              {registrationSettings.portal?.enabled && (
                <>
                  <div className="border-t border-gray-200 pt-4 mt-2">
                    <div className="flex flex-col space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Registration Link</label>
                      <div className="flex">
                        <input
                          type="text"
                          readOnly
                          value={getExternalLink()}
                          className="flex-1 border-gray-300 rounded-l-md focus:ring-primary-500 focus:border-primary-500"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(getExternalLink());
                            alert('Link copied to clipboard!');
                          }}
                          className="bg-gray-100 border border-gray-300 border-l-0 rounded-r-md px-4 py-2 hover:bg-gray-200"
                        >
                          <LinkIcon className="h-5 w-5 text-gray-500" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-500">Share this link with potential attendees</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Page Title"
                      value={registrationSettings.portal?.title || ''}
                      onChange={(e) => handlePortalChange('title', e.target.value)}
                      placeholder="Event Registration"
                    />
                    
                    <Input
                      label="Subtitle"
                      value={registrationSettings.portal?.subtitle || ''}
                      onChange={(e) => handlePortalChange('subtitle', e.target.value)}
                      placeholder="Complete the form below to register"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      type="color"
                      label="Primary Color"
                      value={registrationSettings.portal?.primaryColor || '#4F46E5'}
                      onChange={(e) => handlePortalChange('primaryColor', e.target.value)}
                      description="Used for buttons and highlights"
                    />
                    
                    <Input
                      type="color"
                      label="Secondary Color"
                      value={registrationSettings.portal?.secondaryColor || '#10B981'}
                      onChange={(e) => handlePortalChange('secondaryColor', e.target.value)}
                      description="Used for accents and secondary elements"
                    />
                  </div>
                  
                  <Switch
                    label="Show Event Logo"
                    checked={registrationSettings.portal?.logoEnabled}
                    onChange={(checked) => handlePortalChange('logoEnabled', checked)}
                  />
                  
                  <Input
                    label="Background Image URL"
                    value={registrationSettings.portal?.backgroundImage || ''}
                    onChange={(e) => handlePortalChange('backgroundImage', e.target.value)}
                    placeholder="https://example.com/background.jpg"
                    description="Optional. Leave blank for default background."
                  />
                  
                  <Input
                    label="Submit Button Text"
                    value={registrationSettings.portal?.buttonText || 'Submit Registration'}
                    onChange={(e) => handlePortalChange('buttonText', e.target.value)}
                  />
                  
                  <Textarea
                    label="Success Message"
                    value={registrationSettings.portal?.successMessage || 'Registration successful! Thank you for registering.'}
                    onChange={(e) => handlePortalChange('successMessage', e.target.value)}
                    rows={3}
                  />
                  
                  <Switch
                    label="Enable Social Sharing"
                    checked={registrationSettings.portal?.showSocialShare}
                    onChange={(checked) => handlePortalChange('showSocialShare', checked)}
                    description="Allow attendees to share on social media after registering"
                  />
                </>
              )}
            </div>
          </Card>
        </div>
      )}

      {activeSection === 'terms' && (
        <Card title="Terms and Conditions">
          <div className="space-y-4">
            <Textarea
              label="Registration Instructions"
              name="registrationInstructions"
              value={registrationSettings.registrationInstructions || ''}
              onChange={handleInputChange}
              placeholder="Enter any special instructions for attendees"
              rows={4}
              description="These instructions will appear at the top of the registration form"
            />
            
            <Textarea
              label="Terms and Conditions"
              name="termsAndConditions"
              value={registrationSettings.termsAndConditions || ''}
              onChange={handleInputChange}
              placeholder="Enter the terms and conditions for registration"
              rows={8}
              description="Attendees will be required to accept these terms before registering"
            />
          </div>
    </Card>
      )}

      {/* Field Modal */}
      {showFieldModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium">
                {editingField !== null ? 'Edit Field' : 'Add New Field'}
              </h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Field Label"
                  name="label"
                  value={newField.label}
                  onChange={handleFieldChange}
                  placeholder="e.g., Job Title"
                  required
                />
                
                <Input
                  label="Field Name (ID)"
                  name="name"
                  value={newField.name}
                  onChange={handleFieldChange}
                  placeholder="e.g., jobTitle"
                  description="No spaces, used in code"
                />
                
                <Select
                  label="Field Type"
                  name="type"
                  value={newField.type}
                  onChange={handleFieldChange}
                  options={fieldTypeOptions}
                />
                
                <div className="flex items-center pt-6">
                  <Switch
                    label="Required Field"
                    name="required"
                    checked={newField.required}
                    onChange={(checked) => handleFieldChange({ target: { name: 'required', checked, type: 'checkbox' } })}
                  />
                </div>
              </div>
              
              <Input
                label="Placeholder Text"
                name="placeholder"
                value={newField.placeholder}
                onChange={handleFieldChange}
                placeholder="Enter placeholder text"
              />
              
              <Textarea
                label="Field Description"
                name="description"
                value={newField.description}
                onChange={handleFieldChange}
                placeholder="Explain this field to the user"
                rows={2}
              />
              
              {['select', 'radio', 'checkbox'].includes(newField.type) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
                  <div className="space-y-2">
                    {newField.options.map((option, index) => (
                      <div key={index} className="flex items-center">
                        <input
                          type="text"
                          value={option}
                          readOnly
                          className="flex-1 border-gray-300 rounded-l-md focus:ring-primary-500 focus:border-primary-500"
                        />
                        <button
                          type="button"
                          onClick={() => removeOption(index)}
                          className="bg-red-100 border border-red-300 border-l-0 rounded-r-md px-3 py-2 hover:bg-red-200"
                        >
                          <TrashIcon className="h-4 w-4 text-red-500" />
                        </button>
                      </div>
                    ))}
                    
                    <div className="flex mt-2">
                      <input
                        type="text"
                        value={newOption}
                        onChange={(e) => setNewOption(e.target.value)}
                        placeholder="Add new option"
                        className="flex-1 border-gray-300 rounded-l-md focus:ring-primary-500 focus:border-primary-500"
                      />
                      <button
                        type="button"
                        onClick={addOption}
                        className="bg-green-100 border border-green-300 border-l-0 rounded-r-md px-3 py-2 hover:bg-green-200"
                      >
                        <PlusIcon className="h-4 w-4 text-green-600" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowFieldModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={addCustomField}
                disabled={!newField.label}
              >
                {editingField !== null ? 'Update Field' : 'Add Field'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistrationTab; 