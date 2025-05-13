import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Input,
  Select,
  Checkbox,
  Alert,
  Spinner,
  Tabs
} from '../../components/common';

const GlobalSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    general: {
      siteName: 'Onsite Atlas',
      adminEmail: 'admin@example.com',
      timezone: 'UTC',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
      defaultLanguage: 'en',
      logoUrl: '',
      faviconUrl: ''
    },
    registration: {
      enablePublicRegistration: true,
      requireEmailVerification: true,
      allowSelfRegistration: false,
      defaultRegistrationPrefix: 'REG',
      autoGenerateQRCodes: true,
      qrCodeFormat: 'svg',
      registerConfirmEmailTemplate: 'registration_confirmation',
      registerThankYouMessage: 'Thank you for registering!'
    },
    notification: {
      enableEmailNotifications: true,
      enableSMSNotifications: false,
      emailProvider: 'smtp',
      smsProvider: 'none',
      adminNotificationEmail: 'admin@example.com',
      fromEmail: 'no-reply@example.com',
      emailFooter: '© 2023 Onsite Atlas. All rights reserved.'
    },
    security: {
      sessionTimeout: 60,
      maxLoginAttempts: 5,
      passwordMinLength: 8,
      passwordRequireNumbers: true,
      passwordRequireSymbols: true,
      passwordRequireUppercase: true,
      passwordExpiryDays: 90,
      enableTwoFactorAuth: false,
      enableReCaptcha: false,
      reCaptchaSiteKey: ''
    }
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        // Mock API call to fetch settings
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock settings data (already initialized in state above)
        setLoading(false);
      } catch (error) {
        console.error('Error fetching settings:', error);
        setStatus({
          type: 'error',
          message: 'Failed to load settings. Please try again.'
        });
        setLoading(false);
      }
    };
    
    fetchSettings();
  }, []);

  const handleChange = (section, field, value) => {
    setSettings({
      ...settings,
      [section]: {
        ...settings[section],
        [field]: value
      }
    });
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    setStatus(null);
    
    try {
      // Mock API call to save settings
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      setStatus({
        type: 'success',
        message: 'Settings saved successfully'
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      setStatus({
        type: 'error',
        message: 'Failed to save settings. Please try again.'
      });
    } finally {
      setSaving(false);
    }
  };

  const renderGeneralSettings = () => {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Input
              label="Site Name"
              value={settings.general.siteName}
              onChange={e => handleChange('general', 'siteName', e.target.value)}
            />
          </div>
          <div>
            <Input
              label="Admin Email"
              type="email"
              value={settings.general.adminEmail}
              onChange={e => handleChange('general', 'adminEmail', e.target.value)}
            />
          </div>
          <div>
            <Select
              label="Timezone"
              value={settings.general.timezone}
              onChange={e => handleChange('general', 'timezone', e.target.value)}
              options={[
                { value: 'UTC', label: 'UTC' },
                { value: 'America/New_York', label: 'Eastern Time (ET)' },
                { value: 'America/Chicago', label: 'Central Time (CT)' },
                { value: 'America/Denver', label: 'Mountain Time (MT)' },
                { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
                { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)' },
                { value: 'Europe/Paris', label: 'Central European Time (CET)' },
                { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)' }
              ]}
            />
          </div>
          <div>
            <Select
              label="Date Format"
              value={settings.general.dateFormat}
              onChange={e => handleChange('general', 'dateFormat', e.target.value)}
              options={[
                { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
                { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
                { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
                { value: 'DD.MM.YYYY', label: 'DD.MM.YYYY' }
              ]}
            />
          </div>
          <div>
            <Select
              label="Time Format"
              value={settings.general.timeFormat}
              onChange={e => handleChange('general', 'timeFormat', e.target.value)}
              options={[
                { value: '12h', label: '12-hour (AM/PM)' },
                { value: '24h', label: '24-hour' }
              ]}
            />
          </div>
          <div>
            <Select
              label="Default Language"
              value={settings.general.defaultLanguage}
              onChange={e => handleChange('general', 'defaultLanguage', e.target.value)}
              options={[
                { value: 'en', label: 'English' },
                { value: 'es', label: 'Spanish' },
                { value: 'fr', label: 'French' },
                { value: 'de', label: 'German' },
                { value: 'it', label: 'Italian' },
                { value: 'pt', label: 'Portuguese' },
                { value: 'ru', label: 'Russian' },
                { value: 'zh', label: 'Chinese' }
              ]}
            />
          </div>
        </div>
        
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium mb-4">Branding</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Input
                label="Logo URL"
                value={settings.general.logoUrl}
                onChange={e => handleChange('general', 'logoUrl', e.target.value)}
                placeholder="https://example.com/logo.png"
              />
              <p className="mt-1 text-sm text-gray-500">
                Recommended size: 200x50 pixels
              </p>
            </div>
            <div>
              <Input
                label="Favicon URL"
                value={settings.general.faviconUrl}
                onChange={e => handleChange('general', 'faviconUrl', e.target.value)}
                placeholder="https://example.com/favicon.ico"
              />
              <p className="mt-1 text-sm text-gray-500">
                Recommended size: 32x32 pixels
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderRegistrationSettings = () => {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <div className="space-y-3">
              <div className="flex items-center">
                <Checkbox
                  id="enablePublicRegistration"
                  checked={settings.registration.enablePublicRegistration}
                  onChange={e => handleChange('registration', 'enablePublicRegistration', e.target.checked)}
                />
                <label htmlFor="enablePublicRegistration" className="ml-2 block text-sm font-medium text-gray-700">
                  Enable public registration portals
                </label>
              </div>
              <div className="flex items-center">
                <Checkbox
                  id="requireEmailVerification"
                  checked={settings.registration.requireEmailVerification}
                  onChange={e => handleChange('registration', 'requireEmailVerification', e.target.checked)}
                />
                <label htmlFor="requireEmailVerification" className="ml-2 block text-sm font-medium text-gray-700">
                  Require email verification for public registrations
                </label>
              </div>
              <div className="flex items-center">
                <Checkbox
                  id="allowSelfRegistration"
                  checked={settings.registration.allowSelfRegistration}
                  onChange={e => handleChange('registration', 'allowSelfRegistration', e.target.checked)}
                />
                <label htmlFor="allowSelfRegistration" className="ml-2 block text-sm font-medium text-gray-700">
                  Allow attendees to self-register using kiosks at the event
                </label>
              </div>
              <div className="flex items-center">
                <Checkbox
                  id="autoGenerateQRCodes"
                  checked={settings.registration.autoGenerateQRCodes}
                  onChange={e => handleChange('registration', 'autoGenerateQRCodes', e.target.checked)}
                />
                <label htmlFor="autoGenerateQRCodes" className="ml-2 block text-sm font-medium text-gray-700">
                  Automatically generate QR codes for registrations
                </label>
              </div>
            </div>
          </div>
          
          <div>
            <Input
              label="Default Registration ID Prefix"
              value={settings.registration.defaultRegistrationPrefix}
              onChange={e => handleChange('registration', 'defaultRegistrationPrefix', e.target.value)}
            />
            <p className="mt-1 text-sm text-gray-500">
              This prefix will be used for all registration IDs unless overridden at the event level
            </p>
          </div>
          
          <div>
            <Select
              label="QR Code Format"
              value={settings.registration.qrCodeFormat}
              onChange={e => handleChange('registration', 'qrCodeFormat', e.target.value)}
              options={[
                { value: 'svg', label: 'SVG (Vector)' },
                { value: 'png', label: 'PNG (Raster)' }
              ]}
              disabled={!settings.registration.autoGenerateQRCodes}
            />
          </div>
          
          <div className="md:col-span-2">
            <Input
              type="textarea"
              label="Registration Thank You Message"
              value={settings.registration.registerThankYouMessage}
              onChange={e => handleChange('registration', 'registerThankYouMessage', e.target.value)}
              rows={3}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderNotificationSettings = () => {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <div className="space-y-3">
              <div className="flex items-center">
                <Checkbox
                  id="enableEmailNotifications"
                  checked={settings.notification.enableEmailNotifications}
                  onChange={e => handleChange('notification', 'enableEmailNotifications', e.target.checked)}
                />
                <label htmlFor="enableEmailNotifications" className="ml-2 block text-sm font-medium text-gray-700">
                  Enable email notifications
                </label>
              </div>
              <div className="flex items-center">
                <Checkbox
                  id="enableSMSNotifications"
                  checked={settings.notification.enableSMSNotifications}
                  onChange={e => handleChange('notification', 'enableSMSNotifications', e.target.checked)}
                />
                <label htmlFor="enableSMSNotifications" className="ml-2 block text-sm font-medium text-gray-700">
                  Enable SMS notifications
                </label>
              </div>
            </div>
          </div>
          
          <div>
            <Select
              label="Email Provider"
              value={settings.notification.emailProvider}
              onChange={e => handleChange('notification', 'emailProvider', e.target.value)}
              options={[
                { value: 'smtp', label: 'SMTP Server' },
                { value: 'sendgrid', label: 'SendGrid' },
                { value: 'mailgun', label: 'Mailgun' },
                { value: 'ses', label: 'Amazon SES' }
              ]}
              disabled={!settings.notification.enableEmailNotifications}
            />
          </div>
          
          <div>
            <Select
              label="SMS Provider"
              value={settings.notification.smsProvider}
              onChange={e => handleChange('notification', 'smsProvider', e.target.value)}
              options={[
                { value: 'none', label: 'None' },
                { value: 'twilio', label: 'Twilio' },
                { value: 'nexmo', label: 'Vonage (Nexmo)' },
                { value: 'aws', label: 'AWS SNS' }
              ]}
              disabled={!settings.notification.enableSMSNotifications}
            />
          </div>
          
          <div>
            <Input
              label="Admin Notification Email"
              type="email"
              value={settings.notification.adminNotificationEmail}
              onChange={e => handleChange('notification', 'adminNotificationEmail', e.target.value)}
              disabled={!settings.notification.enableEmailNotifications}
            />
          </div>
          
          <div>
            <Input
              label="From Email Address"
              type="email"
              value={settings.notification.fromEmail}
              onChange={e => handleChange('notification', 'fromEmail', e.target.value)}
              disabled={!settings.notification.enableEmailNotifications}
            />
          </div>
          
          <div className="md:col-span-2">
            <Input
              type="textarea"
              label="Email Footer"
              value={settings.notification.emailFooter}
              onChange={e => handleChange('notification', 'emailFooter', e.target.value)}
              rows={2}
              disabled={!settings.notification.enableEmailNotifications}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderSecuritySettings = () => {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Input
              label="Session Timeout (minutes)"
              type="number"
              value={settings.security.sessionTimeout}
              onChange={e => handleChange('security', 'sessionTimeout', parseInt(e.target.value) || 0)}
              min={5}
              max={480}
            />
          </div>
          
          <div>
            <Input
              label="Max Login Attempts"
              type="number"
              value={settings.security.maxLoginAttempts}
              onChange={e => handleChange('security', 'maxLoginAttempts', parseInt(e.target.value) || 0)}
              min={3}
              max={10}
            />
          </div>
          
          <div className="md:col-span-2 border-t pt-4">
            <h3 className="text-md font-medium mb-3">Password Policy</h3>
          </div>
          
          <div>
            <Input
              label="Minimum Password Length"
              type="number"
              value={settings.security.passwordMinLength}
              onChange={e => handleChange('security', 'passwordMinLength', parseInt(e.target.value) || 0)}
              min={6}
              max={20}
            />
          </div>
          
          <div>
            <Input
              label="Password Expiry (days)"
              type="number"
              value={settings.security.passwordExpiryDays}
              onChange={e => handleChange('security', 'passwordExpiryDays', parseInt(e.target.value) || 0)}
              min={0}
              max={365}
              hint="0 = Never expires"
            />
          </div>
          
          <div className="md:col-span-2">
            <div className="space-y-3">
              <div className="flex items-center">
                <Checkbox
                  id="passwordRequireNumbers"
                  checked={settings.security.passwordRequireNumbers}
                  onChange={e => handleChange('security', 'passwordRequireNumbers', e.target.checked)}
                />
                <label htmlFor="passwordRequireNumbers" className="ml-2 block text-sm font-medium text-gray-700">
                  Require at least one number
                </label>
              </div>
              <div className="flex items-center">
                <Checkbox
                  id="passwordRequireSymbols"
                  checked={settings.security.passwordRequireSymbols}
                  onChange={e => handleChange('security', 'passwordRequireSymbols', e.target.checked)}
                />
                <label htmlFor="passwordRequireSymbols" className="ml-2 block text-sm font-medium text-gray-700">
                  Require at least one special character
                </label>
              </div>
              <div className="flex items-center">
                <Checkbox
                  id="passwordRequireUppercase"
                  checked={settings.security.passwordRequireUppercase}
                  onChange={e => handleChange('security', 'passwordRequireUppercase', e.target.checked)}
                />
                <label htmlFor="passwordRequireUppercase" className="ml-2 block text-sm font-medium text-gray-700">
                  Require at least one uppercase letter
                </label>
              </div>
            </div>
          </div>
          
          <div className="md:col-span-2 border-t pt-4">
            <h3 className="text-md font-medium mb-3">Additional Security</h3>
          </div>
          
          <div className="md:col-span-2">
            <div className="space-y-3">
              <div className="flex items-center">
                <Checkbox
                  id="enableTwoFactorAuth"
                  checked={settings.security.enableTwoFactorAuth}
                  onChange={e => handleChange('security', 'enableTwoFactorAuth', e.target.checked)}
                />
                <label htmlFor="enableTwoFactorAuth" className="ml-2 block text-sm font-medium text-gray-700">
                  Enable Two-Factor Authentication
                </label>
              </div>
              <div className="flex items-center">
                <Checkbox
                  id="enableReCaptcha"
                  checked={settings.security.enableReCaptcha}
                  onChange={e => handleChange('security', 'enableReCaptcha', e.target.checked)}
                />
                <label htmlFor="enableReCaptcha" className="ml-2 block text-sm font-medium text-gray-700">
                  Enable reCAPTCHA for public forms
                </label>
              </div>
            </div>
          </div>
          
          {settings.security.enableReCaptcha && (
            <div className="md:col-span-2">
              <Input
                label="reCAPTCHA Site Key"
                value={settings.security.reCaptchaSiteKey}
                onChange={e => handleChange('security', 'reCaptchaSiteKey', e.target.value)}
                placeholder="6LdxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxIe"
              />
              <p className="mt-1 text-sm text-gray-500">
                Get your keys from the <a href="https://www.google.com/recaptcha/admin" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-500">reCAPTCHA Admin Console</a>
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <Spinner />
        </div>
      );
    }

    switch (activeTab) {
      case 'general':
        return renderGeneralSettings();
      case 'registration':
        return renderRegistrationSettings();
      case 'notification':
        return renderNotificationSettings();
      case 'security':
        return renderSecuritySettings();
      default:
        return renderGeneralSettings();
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Global Settings</h1>
        <Button 
          onClick={handleSaveSettings}
          disabled={saving}
        >
          {saving ? <Spinner size="sm" className="mr-2" /> : null}
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      {status && (
        <Alert 
          type={status.type} 
          message={status.message} 
          className="mb-6"
          onClose={() => setStatus(null)}
        />
      )}

      <Card>
        <Tabs
          tabs={[
            { id: 'general', label: 'General' },
            { id: 'registration', label: 'Registration' },
            { id: 'notification', label: 'Notifications' },
            { id: 'security', label: 'Security' }
          ]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        
        <div className="p-6">
          {renderTabContent()}
        </div>
      </Card>
    </div>
  );
};

export default GlobalSettings; 