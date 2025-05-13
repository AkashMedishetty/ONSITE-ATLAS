import React, { useEffect, useState } from 'react';
import { Card, Tabs, Button, Alert, Spinner } from '../../../components/common';

const EmailTab = ({ event, setEvent, setFormChanged }) => {
  const [activeTab, setActiveTab] = useState('general');
  const [testEmailStatus, setTestEmailStatus] = useState(null);
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [testingEmail, setTestingEmail] = useState(false);

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
      // Simulate API call for test email
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Success simulation
      setTestEmailStatus({
        type: 'success',
        message: `Test email sent to ${testEmailAddress}`
      });
    } catch (error) {
      setTestEmailStatus({
        type: 'error',
        message: error.message || 'Failed to send test email'
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
              disabled={testingEmail}
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
    <div className="space-y-6">
      <Card>
        <h3 className="text-lg font-medium mb-4">Email Templates</h3>
        <p className="text-gray-500 mb-4">Customize the email templates used for different notifications</p>
        
        <div className="mb-4">
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            defaultValue="registration"
            onChange={(e) => setActiveTab(`template-${e.target.value}`)}
          >
            <option value="registration">Registration Confirmation</option>
            <option value="reminder">Event Reminder</option>
            <option value="certificate">Certificate Delivery</option>
            <option value="workshop">Workshop Information</option>
            <option value="scientificBrochure">Scientific Brochure</option>
            <option value="custom">Custom Email</option>
          </select>
        </div>

        <div className="mt-6">
          {activeTab === 'template-registration' && (
            <div className="space-y-4">
              <h4 className="font-medium">Registration Confirmation</h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={emailSettings.templates?.registration?.subject || ''}
                  onChange={(e) => handleTemplateChange('registration', 'subject', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Body</label>
                <textarea
                  rows={10}
                  value={emailSettings.templates?.registration?.body || ''}
                  onChange={(e) => handleTemplateChange('registration', 'body', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 font-mono text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Use <code>{'{{'}firstName{'}}'}</code>, <code>{'{{'}eventName{'}}'}</code>, <code>{'{{'}registrationId{'}}'}</code>, <code>{'{{'}eventDate{'}}'}</code>, <code>{'{{'}eventVenue{'}}'}</code> as placeholders.
                  Use <code>[QR_CODE]</code> to place the registration QR code.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'template-reminder' && (
            <div className="space-y-4">
              <h4 className="font-medium">Event Reminder</h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={emailSettings.templates?.reminder?.subject || ''}
                  onChange={(e) => handleTemplateChange('reminder', 'subject', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Body</label>
                <textarea
                  rows={10}
                  value={emailSettings.templates?.reminder?.body || ''}
                  onChange={(e) => handleTemplateChange('reminder', 'body', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 font-mono text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Use <code>{'{{'}firstName{'}}'}</code>, <code>{'{{'}eventName{'}}'}</code>, <code>{'{{'}eventDate{'}}'}</code>, <code>{'{{'}eventVenue{'}}'}</code> as placeholders.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'template-certificate' && (
            <div className="space-y-4">
              <h4 className="font-medium">Certificate Delivery</h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={emailSettings.templates?.certificate?.subject || ''}
                  onChange={(e) => handleTemplateChange('certificate', 'subject', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Body</label>
                <textarea
                  rows={10}
                  value={emailSettings.templates?.certificate?.body || ''}
                  onChange={(e) => handleTemplateChange('certificate', 'body', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 font-mono text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Use <code>{'{{'}firstName{'}}'}</code>, <code>{'{{'}eventName{'}}'}</code> as placeholders. Certificate will be attached automatically.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'template-workshop' && (
            <div className="space-y-4">
              <h4 className="font-medium">Workshop Information</h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={emailSettings.templates?.workshop?.subject || ''}
                  onChange={(e) => handleTemplateChange('workshop', 'subject', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Body</label>
                <textarea
                  rows={10}
                  value={emailSettings.templates?.workshop?.body || ''}
                  onChange={(e) => handleTemplateChange('workshop', 'body', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 font-mono text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Use <code>{'{{'}firstName{'}}'}</code>, <code>{'{{'}eventName{'}}'}</code>, <code>{'{{'}workshopTitle{'}}'}</code>, <code>{'{{'}workshopDate{'}}'}</code>, <code>{'{{'}workshopTime{'}}'}</code>, <code>{'{{'}workshopLocation{'}}'}</code> as placeholders.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'template-scientificBrochure' && (
            <div className="space-y-4">
              <h4 className="font-medium">Scientific Brochure</h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={emailSettings.templates?.scientificBrochure?.subject || ''}
                  onChange={(e) => handleTemplateChange('scientificBrochure', 'subject', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Body</label>
                <textarea
                  rows={10}
                  value={emailSettings.templates?.scientificBrochure?.body || ''}
                  onChange={(e) => handleTemplateChange('scientificBrochure', 'body', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 font-mono text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Use <code>{'{{'}firstName{'}}'}</code>, <code>{'{{'}eventName{'}}'}</code> as placeholders. The brochure will be attached automatically.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'template-custom' && (
            <div className="space-y-4">
              <h4 className="font-medium">Custom Email</h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={emailSettings.templates?.custom?.subject || ''}
                  onChange={(e) => handleTemplateChange('custom', 'subject', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Body</label>
                <textarea
                  rows={10}
                  value={emailSettings.templates?.custom?.body || ''}
                  onChange={(e) => handleTemplateChange('custom', 'body', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 font-mono text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Use <code>{'{{'}firstName{'}}'}</code>, <code>{'{{'}eventName{'}}'}</code> as placeholders. You can add attachments when sending.
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );

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
        {activeTab === 'general' && renderGeneralTab()}
        {activeTab === 'smtp' && renderSMTPTab()}
        {activeTab === 'templates' && renderTemplatesTab()}
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