// To use Mantine RTE, install:
// npm install @mantine/core @mantine/rte @mantine/hooks

// To use Tiptap (React 19+ compatible WYSIWYG), install:
// npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-link @tiptap/extension-image @tiptap/extension-underline @tiptap/extension-text-align

import React, { useEffect, useState, useRef } from 'react';
import { Card, Tabs, Button, Alert, Spinner } from '../../../components/common';
import emailService from '../../../services/emailService';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { RichTextEditor } from '@mantine/rte';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';

const TEMPLATE_TYPES = [
  {
    key: 'registration',
    label: 'Registration Confirmation',
    required: ['{{firstName}}', '{{eventName}}', '{{registrationId}}', '[QR_CODE]'],
    placeholders: [
      { key: '{{firstName}}', desc: 'Attendee first name' },
      { key: '{{eventName}}', desc: 'Event name' },
      { key: '{{registrationId}}', desc: 'Registration ID' },
      { key: '{{eventDate}}', desc: 'Event date' },
      { key: '{{eventVenue}}', desc: 'Event venue' },
      { key: '[QR_CODE]', desc: 'Registration QR code' }
    ]
  },
  {
    key: 'reminder',
    label: 'Event Reminder',
    required: ['{{firstName}}', '{{eventName}}', '{{eventDate}}', '{{eventVenue}}'],
    placeholders: [
      { key: '{{firstName}}', desc: 'Attendee first name' },
      { key: '{{eventName}}', desc: 'Event name' },
      { key: '{{eventDate}}', desc: 'Event date' },
      { key: '{{eventVenue}}', desc: 'Event venue' }
    ]
  },
  {
    key: 'certificate',
    label: 'Certificate Delivery',
    required: ['{{firstName}}', '{{eventName}}'],
    placeholders: [
      { key: '{{firstName}}', desc: 'Attendee first name' },
      { key: '{{eventName}}', desc: 'Event name' }
    ]
  },
  {
    key: 'workshop',
    label: 'Workshop Information',
    required: ['{{firstName}}', '{{eventName}}', '{{workshopTitle}}', '{{workshopDate}}', '{{workshopTime}}', '{{workshopLocation}}'],
    placeholders: [
      { key: '{{firstName}}', desc: 'Attendee first name' },
      { key: '{{eventName}}', desc: 'Event name' },
      { key: '{{workshopTitle}}', desc: 'Workshop title' },
      { key: '{{workshopDate}}', desc: 'Workshop date' },
      { key: '{{workshopTime}}', desc: 'Workshop time' },
      { key: '{{workshopLocation}}', desc: 'Workshop location' }
    ]
  },
  {
    key: 'scientificBrochure',
    label: 'Scientific Brochure',
    required: ['{{firstName}}', '{{eventName}}'],
    placeholders: [
      { key: '{{firstName}}', desc: 'Attendee first name' },
      { key: '{{eventName}}', desc: 'Event name' }
    ]
  },
  {
    key: 'custom',
    label: 'Custom Email',
    required: ['{{firstName}}', '{{eventName}}'],
    placeholders: [
      { key: '{{firstName}}', desc: 'Attendee first name' },
      { key: '{{eventName}}', desc: 'Event name' }
    ]
  }
];

function insertAtCursor(inputRef, value) {
  const input = inputRef.current;
  if (!input) return;
  const start = input.selectionStart;
  const end = input.selectionEnd;
  const text = input.value;
  input.value = text.slice(0, start) + value + text.slice(end);
  input.selectionStart = input.selectionEnd = start + value.length;
  input.focus();
  // Trigger change event
  const event = new Event('input', { bubbles: true });
  input.dispatchEvent(event);
}

const EmailTab = ({ event, eventId, setEvent, setFormChanged }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [testEmailStatus, setTestEmailStatus] = useState(null);
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [testingEmail, setTestingEmail] = useState(false);

  // --- Email Templates State (moved from renderTemplatesTab) ---
  const [selectedTemplate, setSelectedTemplate] = useState('registration');
  const [localTemplates, setLocalTemplates] = useState(() => JSON.parse(JSON.stringify((event?.emailSettings?.templates) || {})));
  const [saving, setSaving] = useState(false);
  const [templateError, setTemplateError] = useState(null);
  const subjectRef = useRef();
  const bodyRef = useRef();

  // Update local state if event changes
  useEffect(() => {
    setLocalTemplates(JSON.parse(JSON.stringify((event?.emailSettings?.templates) || {})));
  }, [event?.emailSettings?.templates]);

  // Log eventId and event on every render for debugging
  console.log('[EmailTab] Render: eventId =', eventId, 'event =', event);

  // Initialize email settings if they don't exist
  useEffect(() => {
    if (!event || !event.emailSettings) {
      const updatedEvent = {
        ...event,
        emailSettings: {
          enabled: false,
          senderName: event?.name || 'Event Organizer',
          senderEmail: 'noreply@example.com',
          replyToEmail: '',
          smtpHost: '',
          smtpPort: 587,
          smtpUser: '',
          smtpPassword: '',
          smtpSecure: true,
          automaticEmails: {
            registrationConfirmation: true,
            eventReminder: false,
            certificateDelivery: false,
            workshopInfo: false,
            scientificBrochure: false
          },
          templates: {
            registration: {
              subject: 'Registration Confirmation - {{eventName}}',
              body: `Dear {{firstName}},

Thank you for registering for {{eventName}}.

Your registration ID is: {{registrationId}}

Please keep this email for your reference. You can use the QR code below at the event for check-in:

[QR_CODE]

Event Details:
Date: {{eventDate}}
Venue: {{eventVenue}}

If you have any questions, please contact us.

Regards,
The Organizing Team`
            },
            reminder: {
              subject: 'Event Reminder - {{eventName}}',
              body: `Dear {{firstName}},

This is a friendly reminder that {{eventName}} is happening soon.

Date: {{eventDate}}
Venue: {{eventVenue}}

Don't forget to bring your registration QR code for quick check-in.

We look forward to seeing you there!

Regards,
The Organizing Team`
            },
            certificate: {
              subject: 'Your Certificate for {{eventName}}',
              body: `Dear {{firstName}},

Thank you for participating in {{eventName}}.

Your certificate of participation is attached to this email.

We hope you enjoyed the event and look forward to seeing you again!

Regards,
The Organizing Team`
            },
            workshop: {
              subject: 'Workshop Information - {{eventName}}',
              body: `Dear {{firstName}},

Thank you for registering for the workshop at {{eventName}}.

Workshop Details:
Title: {{workshopTitle}}
Date: {{workshopDate}}
Time: {{workshopTime}}
Location: {{workshopLocation}}

Please arrive 15 minutes early for registration.

Regards,
The Organizing Team`
            },
            scientificBrochure: {
              subject: 'Scientific Brochure - {{eventName}}',
              body: `Dear {{firstName}},

Please find attached the scientific brochure for {{eventName}}.

The brochure contains detailed information about the sessions, speakers, and scientific program.

We look forward to your participation!

Regards,
The Organizing Team`
            },
            custom: {
              subject: 'Important Update - {{eventName}}',
              body: `Dear {{firstName}},

We wanted to share an important update regarding {{eventName}}.

[Your custom message here]

If you have any questions, please don't hesitate to contact us.

Regards,
The Organizing Team`
            }
          }
        }
      };
      setEvent(updatedEvent);
      setFormChanged(true);
    }
  }, [event, setEvent, setFormChanged]);

  const handleToggleEnabled = (e) => {
    if (!setEvent || !setFormChanged) return;
    
    setEvent({
      ...event,
      emailSettings: {
        ...event.emailSettings,
        enabled: e.target.checked
      }
    });
    setFormChanged(true);
  };

  const handleEmailChange = (field, value) => {
    if (!setEvent || !setFormChanged) return;
    
    setEvent({
      ...event,
      emailSettings: {
        ...event.emailSettings,
        [field]: value
      }
    });
    setFormChanged(true);
  };

  const handleAutomaticEmailToggle = (type, checked) => {
    if (!setEvent || !setFormChanged) return;
    
    setEvent({
      ...event,
      emailSettings: {
        ...event.emailSettings,
        automaticEmails: {
          ...event.emailSettings.automaticEmails,
          [type]: checked
        }
      }
    });
    setFormChanged(true);
  };

  const handleTemplateChange = (templateName, field, value) => {
    if (!setEvent || !setFormChanged) return;

    setEvent({
      ...event,
      emailSettings: {
        ...event.emailSettings,
        templates: {
          ...event.emailSettings.templates,
          [templateName]: {
            ...event.emailSettings.templates[templateName],
            [field]: value
          }
        }
      }
    });
    setFormChanged(true);
  };

  const handleTestEmail = async () => {
    console.log('handleTestEmail: eventId:', eventId, 'event:', event);
    if (!eventId) {
      setTestEmailStatus({
        type: 'error',
        message: 'Event ID is missing. Please reload the page or contact support.'
      });
      return;
    }
    if (!testEmailAddress || !testEmailAddress.includes('@')) {
      setTestEmailStatus({
        type: 'error',
        message: 'Please enter a valid email address'
      });
      return;
    }
    setTestingEmail(true);
    setTestEmailStatus(null);
    try {
      const res = await emailService.testSmtpConfiguration(eventId, testEmailAddress);
      if (res.success) {
        setTestEmailStatus({
          type: 'success',
          message: res.message || `Test email sent to ${testEmailAddress}`
        });
      } else {
        setTestEmailStatus({
          type: 'error',
          message: res.message || 'Failed to send test email'
        });
      }
    } catch (error) {
      setTestEmailStatus({
        type: 'error',
        message: error?.response?.data?.message || error.message || 'Failed to send test email'
      });
    } finally {
      setTestingEmail(false);
    }
  };

  // Return placeholder if event data isn't loaded yet
  if (!event) {
    return <div className="text-gray-500">Loading email settings...</div>;
  }

  const emailSettings = event.emailSettings || {};

  const renderGeneralTab = () => (
    <div className="space-y-6">
      <Card>
        <h3 className="text-lg font-medium mb-4">Email Notifications</h3>
      <p className="text-gray-500 mb-4">Configure email notification settings for your event</p>

        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            id="enable-emails"
            checked={emailSettings.enabled || false}
            onChange={handleToggleEnabled}
            className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
          />
          <label htmlFor="enable-emails" className="ml-2 text-sm font-medium text-gray-700">
            Enable email notifications
          </label>
        </div>

        {emailSettings.enabled && (
          <div className="space-y-4">
            <p className="text-sm text-amber-600">
              Note: Make sure to configure your SMTP settings before sending emails.
            </p>
          </div>
        )}
      </Card>

      {emailSettings.enabled && (
        <Card>
          <h3 className="text-lg font-medium mb-4">Automatic Emails</h3>
          <p className="text-gray-500 mb-4">Configure which emails are sent automatically</p>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div>
                <h4 className="font-medium">Registration Confirmation</h4>
                <p className="text-sm text-gray-500">Send confirmation email when attendees register</p>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="auto-registration"
                  checked={emailSettings.automaticEmails?.registrationConfirmation || false}
                  onChange={(e) => handleAutomaticEmailToggle('registrationConfirmation', e.target.checked)}
                  className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="auto-registration" className="ml-2 text-sm font-medium text-gray-700">
                  {emailSettings.automaticEmails?.registrationConfirmation ? 'Enabled' : 'Disabled'}
                </label>
              </div>
            </div>
            
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div>
                <h4 className="font-medium">Event Reminder</h4>
                <p className="text-sm text-gray-500">Send reminder email before the event</p>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="auto-reminder"
                  checked={emailSettings.automaticEmails?.eventReminder || false}
                  onChange={(e) => handleAutomaticEmailToggle('eventReminder', e.target.checked)}
                  className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="auto-reminder" className="ml-2 text-sm font-medium text-gray-700">
                  {emailSettings.automaticEmails?.eventReminder ? 'Enabled' : 'Disabled'}
                </label>
              </div>
            </div>
            
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
          <div>
                <h4 className="font-medium">Certificate Delivery</h4>
                <p className="text-sm text-gray-500">Send certificates after event completion</p>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="auto-certificate"
                  checked={emailSettings.automaticEmails?.certificateDelivery || false}
                  onChange={(e) => handleAutomaticEmailToggle('certificateDelivery', e.target.checked)}
                  className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="auto-certificate" className="ml-2 text-sm font-medium text-gray-700">
                  {emailSettings.automaticEmails?.certificateDelivery ? 'Enabled' : 'Disabled'}
                </label>
              </div>
            </div>
            
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div>
                <h4 className="font-medium">Workshop Information</h4>
                <p className="text-sm text-gray-500">Send workshop details to attendees</p>
                </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="auto-workshop"
                  checked={emailSettings.automaticEmails?.workshopInfo || false}
                  onChange={(e) => handleAutomaticEmailToggle('workshopInfo', e.target.checked)}
                  className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="auto-workshop" className="ml-2 text-sm font-medium text-gray-700">
                  {emailSettings.automaticEmails?.workshopInfo ? 'Enabled' : 'Disabled'}
                </label>
              </div>
            </div>
            
            <div className="flex items-center justify-between py-2">
              <div>
                <h4 className="font-medium">Scientific Brochure</h4>
                <p className="text-sm text-gray-500">Send scientific brochure to attendees</p>
                </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="auto-brochure"
                  checked={emailSettings.automaticEmails?.scientificBrochure || false}
                  onChange={(e) => handleAutomaticEmailToggle('scientificBrochure', e.target.checked)}
                  className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="auto-brochure" className="ml-2 text-sm font-medium text-gray-700">
                  {emailSettings.automaticEmails?.scientificBrochure ? 'Enabled' : 'Disabled'}
                </label>
              </div>
            </div>
          </div>
        </Card>
      )}

      <Card>
        <h3 className="text-lg font-medium mb-4">Sender Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sender Name</label>
            <input
              type="text"
              value={emailSettings.senderName || ''}
              onChange={(e) => handleEmailChange('senderName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="Event Organizer"
            />
            <p className="mt-1 text-xs text-gray-500">This name will appear as the sender of all emails</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sender Email</label>
            <input
              type="email"
              value={emailSettings.senderEmail || ''}
              onChange={(e) => handleEmailChange('senderEmail', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="noreply@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reply-To Email (Optional)</label>
            <input
              type="email"
              value={emailSettings.replyToEmail || ''}
              onChange={(e) => handleEmailChange('replyToEmail', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="support@example.com"
            />
            <p className="mt-1 text-xs text-gray-500">If recipients reply to your emails, they will be directed to this address</p>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderSMTPTab = () => (
    <div className="space-y-6">
      <Card>
        <h3 className="text-lg font-medium mb-4">SMTP Server Settings</h3>
        <p className="text-gray-500 mb-4">Configure the SMTP server used to send emails</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Host</label>
            <input
              type="text"
              value={emailSettings.smtpHost || ''}
              onChange={(e) => handleEmailChange('smtpHost', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="smtp.example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Port</label>
            <input
              type="number"
              value={emailSettings.smtpPort || 587}
              onChange={(e) => handleEmailChange('smtpPort', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="587"
            />
          </div>
        </div>

        <div className="space-y-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Username</label>
            <input
              type="text"
              value={emailSettings.smtpUser || ''}
              onChange={(e) => handleEmailChange('smtpUser', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="username"
            />
            </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Password</label>
            <input
              type="password"
              value={emailSettings.smtpPassword || ''}
              onChange={(e) => handleEmailChange('smtpPassword', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="••••••••"
            />
          </div>
        </div>

        <div className="flex items-center mb-6">
          <input
            type="checkbox"
            id="smtp-secure"
            checked={emailSettings.smtpSecure || false}
            onChange={(e) => handleEmailChange('smtpSecure', e.target.checked)}
            className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
          />
          <label htmlFor="smtp-secure" className="ml-2 text-sm font-medium text-gray-700">
            Use SSL/TLS
          </label>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Test SMTP Configuration</h4>
          <div className="flex">
            <input
              type="email"
              value={testEmailAddress}
              onChange={(e) => setTestEmailAddress(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter email address"
            />
            <Button
              variant="primary"
              className="rounded-l-none"
              onClick={handleTestEmail}
              disabled={testingEmail || !eventId}
            >
              {testingEmail ? <Spinner size="sm" className="mr-2" /> : null}
              Send Test
            </Button>
          </div>
          {testEmailStatus && (
            <div className={`mt-2 text-sm ${testEmailStatus.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {testEmailStatus.message}
            </div>
          )}
        </div>
      </Card>
    </div>
  );

  const renderTemplatesTab = () => (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2 mb-4">
        {TEMPLATE_TYPES.map(t => (
          <button
            key={t.key}
            className={`px-4 py-2 rounded-md font-medium border transition-all duration-150 ${selectedTemplate === t.key ? 'bg-primary-600 text-white border-primary-600 shadow' : 'bg-white text-gray-700 border-gray-300 hover:bg-primary-50'}`}
            onClick={() => setSelectedTemplate(t.key)}
            type="button"
          >
            {t.label}
          </button>
        ))}
      </div>
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <div className="flex gap-2 mb-1">
                {templateMeta.placeholders.map(ph => (
                  <button
                    key={ph.key + '-subject'}
                    className="px-2 py-1 text-xs bg-primary-50 text-primary-700 rounded hover:bg-primary-100 border border-primary-200"
                    type="button"
                    onClick={() => handleInsert('subject', ph.key)}
                  >
                    {ph.key}
                  </button>
                ))}
              </div>
              <input
                ref={subjectRef}
                type="text"
                value={template.subject || ''}
                onChange={e => handleFieldChange('subject', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 font-mono"
                placeholder="Enter email subject"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Body</label>
              <TiptapToolbar editor={tiptapEditor} onInsertPlaceholder={handleTiptapInsertPlaceholder} />
              <div className="border rounded-md bg-white min-h-[200px] p-2">
                <EditorContent editor={tiptapEditor} />
              </div>
            </div>
            {templateError && <Alert variant="error" className="mt-2">{templateError}</Alert>}
            <div className="flex gap-2 mt-4">
              <Button variant="primary" onClick={handleSave} disabled={saving}>
                {saving ? <Spinner size="sm" className="mr-2" /> : null} Save Template
              </Button>
              <Button variant="outline" onClick={handleReset} disabled={saving}>Reset</Button>
            </div>
          </div>
          <div className="flex-1">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 shadow-sm">
              <h4 className="font-semibold text-gray-700 mb-2">Live Preview</h4>
              <div className="text-sm text-gray-800 whitespace-pre-line min-h-[120px]">
                <strong>Subject:</strong> {renderPreview(template.subject)}
                <br />
                <strong>Body:</strong>
                <div className="mt-1">{renderPreview(template.body)}</div>
              </div>
            </div>
            <div className="mt-6">
              <h5 className="font-semibold text-gray-600 mb-1">Required Placeholders</h5>
              <ul className="list-disc list-inside text-xs text-gray-500">
                {templateMeta.required.map(ph => (
                  <li key={ph}>{ph}</li>
                ))}
              </ul>
              <h5 className="font-semibold text-gray-600 mt-4 mb-1">Available Placeholders</h5>
              <ul className="list-disc list-inside text-xs text-gray-500">
                {templateMeta.placeholders.map(ph => (
                  <li key={ph.key}><span className="font-mono text-primary-700">{ph.key}</span> - {ph.desc}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );

  // Template meta and handlers
  const templateMeta = TEMPLATE_TYPES.find(t => t.key === selectedTemplate);
  const template = localTemplates[selectedTemplate] || { subject: '', body: '' };

  const handleInsert = (field, value) => {
    if (field === 'subject') {
      insertAtCursor(subjectRef, value);
    } else {
      insertAtCursor(bodyRef, value);
    }
  };

  const handleFieldChange = (field, value) => {
    setLocalTemplates(prev => ({
      ...prev,
      [selectedTemplate]: {
        ...prev[selectedTemplate],
        [field]: value
      }
    }));
  };

  const validateTemplate = () => {
    const { subject, body } = localTemplates[selectedTemplate] || {};
    const missing = templateMeta.required.filter(ph => !((subject || '') + (body || '')).includes(ph));
    return missing;
  };

  const handleSave = async () => {
    setSaving(true);
    setTemplateError(null);
    const missing = validateTemplate();
    if (missing.length > 0) {
      setTemplateError('Missing required placeholders: ' + missing.join(', '));
      setSaving(false);
      return;
    }
    try {
      await emailService.updateTemplates(eventId, localTemplates);
      toast.success('Template saved!');
      setEvent({ ...event, emailSettings: { ...event.emailSettings, templates: localTemplates } });
    } catch (err) {
      setTemplateError(err?.response?.data?.message || err.message || 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setLocalTemplates(JSON.parse(JSON.stringify((event?.emailSettings?.templates) || {})));
    setTemplateError(null);
  };

  // Live preview with sample data
  const sampleData = {
    firstName: 'Jane',
    eventName: 'Sample Event',
    registrationId: 'REG123',
    eventDate: 'June 1, 2025',
    eventVenue: 'Grand Hall',
    workshopTitle: 'AI Workshop',
    workshopDate: 'June 2, 2025',
    workshopTime: '10:00 AM',
    workshopLocation: 'Room 101'
  };
  function renderPreview(str) {
    if (!str) return '';
    let out = str;
    Object.entries(sampleData).forEach(([k, v]) => {
      out = out.replaceAll(`{{${k}}}`, v);
    });
    out = out.replaceAll('[QR_CODE]', '[QR_CODE]');
    return out;
  }

  // Custom image upload handler for Mantine RTE
  async function handleMantineImageUpload(file, eventId) {
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await fetch(`/api/events/${eventId}/emails/upload-image`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      const data = await res.json();
      if (data.url) {
        return data.url;
      } else {
        toast.error('Image upload failed');
        return null;
      }
    } catch (err) {
      toast.error('Image upload error');
      return null;
    }
  }

  // Image upload handler for Tiptap
  const handleTiptapImageUpload = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.click();
    input.onchange = async () => {
      const file = input.files[0];
      console.log('[Tiptap Image Upload] Selected file:', file); // Debug log
      if (!file) return;
      const formData = new FormData();
      formData.append('image', file);
      try {
        const res = await fetch(`/api/events/${eventId}/emails/upload-image`, {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });
        const data = await res.json();
        if (data.url) {
          tiptapEditor.chain().focus().setImage({ src: data.url }).run();
        } else {
          toast.error('Image upload failed');
        }
      } catch (err) {
        toast.error('Image upload error');
      }
    };
  };

  // Tiptap toolbar component
  function TiptapToolbar({ editor, onInsertPlaceholder }) {
    if (!editor) return null;
    return (
      <div className="flex flex-wrap gap-2 mb-2 border-b pb-2">
        <button onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'font-bold text-primary-700' : ''}>B</button>
        <button onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'italic text-primary-700' : ''}>I</button>
        <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={editor.isActive('underline') ? 'underline text-primary-700' : ''}>U</button>
        <button onClick={() => editor.chain().focus().toggleStrike().run()} className={editor.isActive('strike') ? 'line-through text-primary-700' : ''}>S</button>
        <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={editor.isActive('heading', { level: 1 }) ? 'font-bold text-lg text-primary-700' : ''}>H1</button>
        <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={editor.isActive('heading', { level: 2 }) ? 'font-bold text-primary-700' : ''}>H2</button>
        <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? 'text-primary-700' : ''}>• List</button>
        <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive('orderedList') ? 'text-primary-700' : ''}>1. List</button>
        <button onClick={() => editor.chain().focus().setTextAlign('left').run()} className={editor.isActive({ textAlign: 'left' }) ? 'text-primary-700' : ''}>Left</button>
        <button onClick={() => editor.chain().focus().setTextAlign('center').run()} className={editor.isActive({ textAlign: 'center' }) ? 'text-primary-700' : ''}>Center</button>
        <button onClick={() => editor.chain().focus().setTextAlign('right').run()} className={editor.isActive({ textAlign: 'right' }) ? 'text-primary-700' : ''}>Right</button>
        <button onClick={() => editor.chain().focus().setTextAlign('justify').run()} className={editor.isActive({ textAlign: 'justify' }) ? 'text-primary-700' : ''}>Justify</button>
        {/* Image by URL */}
        <button onClick={() => {
          const url = prompt('Enter image URL');
          if (url) editor.chain().focus().setImage({ src: url }).run();
        }}>Image by URL</button>
        {/* Image upload */}
        <button type="button" onClick={handleTiptapImageUpload}>Upload Image</button>
        <button onClick={() => {
          const url = prompt('Enter link URL');
          if (url) editor.chain().focus().setLink({ href: url }).run();
        }}>Link</button>
        <button onClick={() => editor.chain().focus().unsetLink().run()}>Unlink</button>
        {/* Placeholder buttons */}
        {onInsertPlaceholder && (
          <span className="ml-4 flex gap-1">
            {TEMPLATE_TYPES.find(t => t.key === selectedTemplate)?.placeholders.map(ph => (
              <button
                key={ph.key + '-body'}
                className="px-2 py-1 text-xs bg-primary-50 text-primary-700 rounded hover:bg-primary-100 border border-primary-200"
                type="button"
                onClick={() => onInsertPlaceholder(ph.key)}
              >
                {ph.key}
              </button>
            ))}
          </span>
        )}
      </div>
    );
  }

  // Tiptap editor instance for the template body
  const tiptapEditor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link,
      Image,
      TextAlign.configure({ types: ['heading', 'paragraph'] })
    ],
    content: template.body || '',
    onUpdate: ({ editor }) => {
      handleFieldChange('body', editor.getHTML());
    },
  });

  // Insert placeholder at cursor in Tiptap
  const handleTiptapInsertPlaceholder = (placeholder) => {
    if (tiptapEditor) {
      tiptapEditor.chain().focus().insertContent(placeholder).run();
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Email Settings</h2>
      <p className="text-gray-500 mb-4">Configure email notification settings for your event</p>

      <Tabs
        tabs={[
          { id: "general", label: "General" },
          { id: "smtp", label: "SMTP Settings" },
          { id: "templates", label: "Email Templates" }
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
        variant="underline"
      />

      <div className="mt-6">
        {activeTab === 0 && renderGeneralTab()}
        {activeTab === 1 && renderSMTPTab()}
        {activeTab === 2 && renderTemplatesTab()}
      </div>
      
      {/* Debug info */}
      {false && import.meta.env.DEV && (
        <div className="mt-8 border-t border-gray-200 pt-6">
          <h3 className="text-sm font-medium text-gray-500">Email Settings Debug</h3>
          <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-auto">
            {JSON.stringify(event.emailSettings, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default EmailTab; 