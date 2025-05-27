import React, { useState, useEffect } from 'react';
import { Card, Input, Select, Textarea, Button } from '../../../components/common';

const GeneralTab = ({ event, setEvent, id, setFormChanged }) => {
  // Log received props on initial render and re-renders
  console.log("[GeneralTab Props] Received:", { event, setEvent, id, setFormChanged });
  console.log("[GeneralTab Props] typeof setEvent:", typeof setEvent);
  console.log("[GeneralTab Props] typeof setFormChanged:", typeof setFormChanged);

  const [generalSettings, setGeneralSettings] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    location: '',
    timezone: 'UTC',
    status: 'draft',
    registrationPrefix: 'REG',
    maxAttendees: ''
  });

  // Initialize settings from the event data
  useEffect(() => {
    if (event) {
      setGeneralSettings({
        name: event.name || '',
        description: event.description || '',
        startDate: event.startDate ? new Date(event.startDate).toISOString().split('T')[0] : '',
        endDate: event.endDate ? new Date(event.endDate).toISOString().split('T')[0] : '',
        location: event.location || event.venue?.name || '',
        timezone: event.timezone || 'UTC',
        status: event.status || 'draft',
        registrationPrefix: event.registrationSettings?.idPrefix || 'REG',
        maxAttendees: event.maxAttendees || ''
      });
    }
  }, [event]);

  // Handle input changes - Update local state and notify parent via props
  const handleInputChange = (eOrName, valueArg) => {
    // If called from a standard input event
    if (eOrName && eOrName.target) {
      const { name, value } = eOrName.target;
      setGeneralSettings(prev => ({
        ...prev,
        [name]: value
      }));
      if (name === 'registrationPrefix') {
        setEvent(prevEvent => ({
          ...prevEvent,
          registrationSettings: {
            ...(prevEvent?.registrationSettings || {}),
            idPrefix: value
          }
        }));
      } else if (name === 'location') {
        setEvent(prevEvent => ({
          ...prevEvent,
          location: value,
          venue: {
            ...(prevEvent?.venue || {}),
            name: value
          }
        }));
      } else {
        setEvent(prevEvent => ({
          ...prevEvent,
          [name]: value
        }));
      }
      if (typeof setFormChanged === 'function') {
        setFormChanged(true);
      }
    } else if (typeof eOrName === 'string') {
      // Called as (name, value) from custom Select
      const name = eOrName;
      const value = valueArg;
      setGeneralSettings(prev => ({
        ...prev,
        [name]: value
      }));
      if (name === 'registrationPrefix') {
        setEvent(prevEvent => ({
          ...prevEvent,
          registrationSettings: {
            ...(prevEvent?.registrationSettings || {}),
            idPrefix: value
          }
        }));
      } else if (name === 'location') {
        setEvent(prevEvent => ({
          ...prevEvent,
          location: value,
          venue: {
            ...(prevEvent?.venue || {}),
            name: value
          }
        }));
      } else {
        setEvent(prevEvent => ({
          ...prevEvent,
          [name]: value
        }));
      }
      if (typeof setFormChanged === 'function') {
        setFormChanged(true);
      }
    }
  };

  const statusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'published', label: 'Published' },
    { value: 'closed', label: 'Closed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  return (
    <div className="space-y-6">
      <Card title="Basic Information">
        <div className="space-y-4">
          <Input
            label="Event Name"
            name="name"
            value={generalSettings.name}
            onChange={handleInputChange}
            placeholder="Enter event name"
            required
          />
          
          <Textarea
            label="Description"
            name="description"
            value={generalSettings.description}
            onChange={handleInputChange}
            placeholder="Provide a short description of your event"
            rows={4}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="date"
              label="Start Date"
              name="startDate"
              value={generalSettings.startDate}
              onChange={handleInputChange}
            />
            
            <Input
              type="date"
              label="End Date"
              name="endDate"
              value={generalSettings.endDate}
              onChange={handleInputChange}
            />
          </div>
          
          <Input
            label="Location"
            name="location"
            value={generalSettings.location}
            onChange={handleInputChange}
            placeholder="Enter event location"
          />
          
          <Select
            label="Status"
            name="status"
            value={generalSettings.status}
            onChange={value => handleInputChange('status', value)}
            options={statusOptions}
          />
        </div>
      </Card>
      
      <Card title="Registration Settings">
        <div className="space-y-4">
          <Input
            label="Registration ID Prefix"
            name="registrationPrefix"
            value={generalSettings.registrationPrefix}
            onChange={handleInputChange}
            placeholder="e.g., REG, CONF, etc."
            helperText="This prefix will be used for all registration IDs (e.g., REG-0001)"
          />
          
          <Input
            type="number"
            label="Maximum Attendees"
            name="maxAttendees"
            value={generalSettings.maxAttendees}
            onChange={handleInputChange}
            placeholder="Leave empty for unlimited"
            helperText="Set a limit for the total number of registrations"
          />
        </div>
      </Card>
    </div>
  );
};

export default GeneralTab; 