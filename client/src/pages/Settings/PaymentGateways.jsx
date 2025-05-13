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

const PaymentGateways = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);
  const [activeGateway, setActiveGateway] = useState('stripe');
  const [gatewayConfigs, setGatewayConfigs] = useState({
    stripe: {
      enabled: true,
      sandbox: true,
      apiKey: 'pk_test_51xxxxxxxxxxxxxxxxxxxxxxxx',
      secretKey: 'sk_test_51xxxxxxxxxxxxxxxxxxxxxxxx',
      webhookSecret: 'whsec_xxxxxxxxxxxxxxxxxxxxxxxx',
      supportedCards: ['visa', 'mastercard', 'amex', 'discover'],
      supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
      defaultCurrency: 'USD'
    },
    paypal: {
      enabled: false,
      sandbox: true,
      clientId: '',
      clientSecret: '',
      supportedCurrencies: ['USD', 'EUR', 'GBP'],
      defaultCurrency: 'USD'
    },
    square: {
      enabled: false,
      sandbox: true,
      applicationId: '',
      accessToken: '',
      locationId: '',
      supportedCards: ['visa', 'mastercard', 'amex', 'discover'],
      supportedCurrencies: ['USD', 'CAD', 'GBP'],
      defaultCurrency: 'USD'
    },
    razorpay: {
      enabled: false,
      keyId: '',
      keySecret: '',
      supportedCurrencies: ['INR'],
      defaultCurrency: 'INR'
    }
  });
  
  const [generalSettings, setGeneralSettings] = useState({
    enablePayments: true,
    enableOfflinePayments: true,
    offlinePaymentInstructions: 'Please send payment to the following bank account...',
    defaultGateway: 'stripe',
    refundPolicy: 'Refunds must be requested within 30 days of purchase. A 10% processing fee applies to all refunds.',
    invoicePrefix: 'INV-',
    receiptFooter: 'Thank you for your payment.'
  });
  
  const [currencySettings, setCurrencySettings] = useState({
    defaultCurrency: 'USD',
    currencySymbolPosition: 'before',
    thousandsSeparator: ',',
    decimalSeparator: '.',
    numberOfDecimals: 2
  });

  const gatewayOptions = [
    { id: 'stripe', name: 'Stripe', logo: 'https://cdn.worldvectorlogo.com/logos/stripe-4.svg' },
    { id: 'paypal', name: 'PayPal', logo: 'https://cdn.worldvectorlogo.com/logos/paypal-2.svg' },
    { id: 'square', name: 'Square', logo: 'https://cdn.worldvectorlogo.com/logos/square-2.svg' },
    { id: 'razorpay', name: 'Razorpay', logo: 'https://avatars.githubusercontent.com/u/7713209?s=200&v=4' }
  ];
  
  const currencyOptions = [
    { value: 'USD', label: 'US Dollar (USD)' },
    { value: 'EUR', label: 'Euro (EUR)' },
    { value: 'GBP', label: 'British Pound (GBP)' },
    { value: 'CAD', label: 'Canadian Dollar (CAD)' },
    { value: 'AUD', label: 'Australian Dollar (AUD)' },
    { value: 'INR', label: 'Indian Rupee (INR)' },
    { value: 'JPY', label: 'Japanese Yen (JPY)' },
    { value: 'SGD', label: 'Singapore Dollar (SGD)' }
  ];

  useEffect(() => {
    const fetchGatewaySettings = async () => {
      try {
        // Mock API call to fetch payment gateway settings
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock data is already initialized in state
        setLoading(false);
      } catch (error) {
        console.error('Error fetching payment gateway settings:', error);
        setStatus({
          type: 'error',
          message: 'Failed to load payment gateway settings. Please try again.'
        });
        setLoading(false);
      }
    };
    
    fetchGatewaySettings();
  }, []);

  const handleGatewayConfigChange = (gateway, field, value) => {
    setGatewayConfigs({
      ...gatewayConfigs,
      [gateway]: {
        ...gatewayConfigs[gateway],
        [field]: value
      }
    });
  };

  const handleGeneralSettingChange = (field, value) => {
    setGeneralSettings({
      ...generalSettings,
      [field]: value
    });
  };

  const handleCurrencySettingChange = (field, value) => {
    setCurrencySettings({
      ...currencySettings,
      [field]: value
    });
  };

  const handleToggleGateway = (gateway, enabled) => {
    setGatewayConfigs({
      ...gatewayConfigs,
      [gateway]: {
        ...gatewayConfigs[gateway],
        enabled
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
        message: 'Payment gateway settings saved successfully'
      });
    } catch (error) {
      console.error('Error saving payment gateway settings:', error);
      setStatus({
        type: 'error',
        message: 'Failed to save payment gateway settings. Please try again.'
      });
    } finally {
      setSaving(false);
    }
  };

  const renderGatewaySelector = () => {
    return (
      <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
        {gatewayOptions.map(gateway => (
          <div
            key={gateway.id}
            className={`border rounded-lg p-4 cursor-pointer transition-colors duration-200 ${
              activeGateway === gateway.id
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setActiveGateway(gateway.id)}
          >
            <div className="flex flex-col items-center">
              <div className="h-12 w-12 mb-2 flex items-center justify-center">
                <img
                  src={gateway.logo}
                  alt={`${gateway.name} logo`}
                  className="max-h-full max-w-full"
                />
              </div>
              <div className="font-medium text-center">{gateway.name}</div>
              <div className="mt-2">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  gatewayConfigs[gateway.id].enabled
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {gatewayConfigs[gateway.id].enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderStripeSettings = () => {
    const config = gatewayConfigs.stripe;
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="h-8 w-8 mr-3">
              <img
                src="https://cdn.worldvectorlogo.com/logos/stripe-4.svg"
                alt="Stripe logo"
                className="max-h-full max-w-full"
              />
            </div>
            <h3 className="text-lg font-medium">Stripe Settings</h3>
          </div>
          <div>
            <Button
              variant={config.enabled ? 'danger' : 'success'}
              size="sm"
              onClick={() => handleToggleGateway('stripe', !config.enabled)}
            >
              {config.enabled ? 'Disable' : 'Enable'}
            </Button>
          </div>
        </div>
        
        <div className="border-t pt-4">
          <div className="mb-4">
            <Checkbox
              id="stripeSandbox"
              checked={config.sandbox}
              onChange={e => handleGatewayConfigChange('stripe', 'sandbox', e.target.checked)}
              label="Use Sandbox (Test Mode)"
              disabled={!config.enabled}
            />
            <p className="mt-1 text-sm text-gray-500 ml-6">
              In sandbox mode, no real transactions will be processed.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Input
                label="API Key"
                type="text"
                value={config.apiKey}
                onChange={e => handleGatewayConfigChange('stripe', 'apiKey', e.target.value)}
                placeholder={config.sandbox ? 'pk_test_...' : 'pk_live_...'}
                disabled={!config.enabled}
                hint="Publishable key"
              />
            </div>
            <div>
              <Input
                label="Secret Key"
                type="password"
                value={config.secretKey}
                onChange={e => handleGatewayConfigChange('stripe', 'secretKey', e.target.value)}
                placeholder={config.sandbox ? 'sk_test_...' : 'sk_live_...'}
                disabled={!config.enabled}
              />
            </div>
          </div>
          
          <div className="mt-4">
            <Input
              label="Webhook Secret"
              type="password"
              value={config.webhookSecret}
              onChange={e => handleGatewayConfigChange('stripe', 'webhookSecret', e.target.value)}
              placeholder="whsec_..."
              disabled={!config.enabled}
            />
            <p className="mt-1 text-sm text-gray-500">
              Used for verifying webhook signatures. Required for handling events like successful payments.
            </p>
          </div>
        </div>
        
        <div className="border-t pt-4">
          <h4 className="text-md font-medium mb-3">Currency & Payment Options</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Select
                label="Default Currency"
                value={config.defaultCurrency}
                onChange={e => handleGatewayConfigChange('stripe', 'defaultCurrency', e.target.value)}
                options={currencyOptions.filter(c => config.supportedCurrencies.includes(c.value))}
                disabled={!config.enabled}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Supported Credit Cards
              </label>
              <div className="space-y-2">
                {['visa', 'mastercard', 'amex', 'discover'].map(card => (
                  <div key={card} className="flex items-center">
                    <Checkbox
                      id={`stripe-card-${card}`}
                      checked={config.supportedCards.includes(card)}
                      onChange={e => {
                        const newCards = e.target.checked
                          ? [...config.supportedCards, card]
                          : config.supportedCards.filter(c => c !== card);
                        handleGatewayConfigChange('stripe', 'supportedCards', newCards);
                      }}
                      disabled={!config.enabled}
                    />
                    <label htmlFor={`stripe-card-${card}`} className="ml-2 capitalize">
                      {card}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPayPalSettings = () => {
    const config = gatewayConfigs.paypal;
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="h-8 w-8 mr-3">
              <img
                src="https://cdn.worldvectorlogo.com/logos/paypal-2.svg"
                alt="PayPal logo"
                className="max-h-full max-w-full"
              />
            </div>
            <h3 className="text-lg font-medium">PayPal Settings</h3>
          </div>
          <div>
            <Button
              variant={config.enabled ? 'danger' : 'success'}
              size="sm"
              onClick={() => handleToggleGateway('paypal', !config.enabled)}
            >
              {config.enabled ? 'Disable' : 'Enable'}
            </Button>
          </div>
        </div>
        
        <div className="border-t pt-4">
          <div className="mb-4">
            <Checkbox
              id="paypalSandbox"
              checked={config.sandbox}
              onChange={e => handleGatewayConfigChange('paypal', 'sandbox', e.target.checked)}
              label="Use Sandbox (Test Mode)"
              disabled={!config.enabled}
            />
            <p className="mt-1 text-sm text-gray-500 ml-6">
              In sandbox mode, no real transactions will be processed.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Input
                label="Client ID"
                type="text"
                value={config.clientId}
                onChange={e => handleGatewayConfigChange('paypal', 'clientId', e.target.value)}
                disabled={!config.enabled}
              />
            </div>
            <div>
              <Input
                label="Client Secret"
                type="password"
                value={config.clientSecret}
                onChange={e => handleGatewayConfigChange('paypal', 'clientSecret', e.target.value)}
                disabled={!config.enabled}
              />
            </div>
          </div>
        </div>
        
        <div className="border-t pt-4">
          <h4 className="text-md font-medium mb-3">Currency Options</h4>
          
          <div>
            <Select
              label="Default Currency"
              value={config.defaultCurrency}
              onChange={e => handleGatewayConfigChange('paypal', 'defaultCurrency', e.target.value)}
              options={currencyOptions.filter(c => config.supportedCurrencies.includes(c.value))}
              disabled={!config.enabled}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderSquareSettings = () => {
    const config = gatewayConfigs.square;
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="h-8 w-8 mr-3">
              <img
                src="https://cdn.worldvectorlogo.com/logos/square-2.svg"
                alt="Square logo"
                className="max-h-full max-w-full"
              />
            </div>
            <h3 className="text-lg font-medium">Square Settings</h3>
          </div>
          <div>
            <Button
              variant={config.enabled ? 'danger' : 'success'}
              size="sm"
              onClick={() => handleToggleGateway('square', !config.enabled)}
            >
              {config.enabled ? 'Disable' : 'Enable'}
            </Button>
          </div>
        </div>
        
        <div className="border-t pt-4">
          <div className="mb-4">
            <Checkbox
              id="squareSandbox"
              checked={config.sandbox}
              onChange={e => handleGatewayConfigChange('square', 'sandbox', e.target.checked)}
              label="Use Sandbox (Test Mode)"
              disabled={!config.enabled}
            />
            <p className="mt-1 text-sm text-gray-500 ml-6">
              In sandbox mode, no real transactions will be processed.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Input
                label="Application ID"
                type="text"
                value={config.applicationId}
                onChange={e => handleGatewayConfigChange('square', 'applicationId', e.target.value)}
                disabled={!config.enabled}
              />
            </div>
            <div>
              <Input
                label="Access Token"
                type="password"
                value={config.accessToken}
                onChange={e => handleGatewayConfigChange('square', 'accessToken', e.target.value)}
                disabled={!config.enabled}
              />
            </div>
          </div>
          
          <div className="mt-4">
            <Input
              label="Location ID"
              type="text"
              value={config.locationId}
              onChange={e => handleGatewayConfigChange('square', 'locationId', e.target.value)}
              disabled={!config.enabled}
            />
            <p className="mt-1 text-sm text-gray-500">
              Your Square location ID where transactions will be processed.
            </p>
          </div>
        </div>
        
        <div className="border-t pt-4">
          <h4 className="text-md font-medium mb-3">Currency & Payment Options</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Select
                label="Default Currency"
                value={config.defaultCurrency}
                onChange={e => handleGatewayConfigChange('square', 'defaultCurrency', e.target.value)}
                options={currencyOptions.filter(c => config.supportedCurrencies.includes(c.value))}
                disabled={!config.enabled}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Supported Credit Cards
              </label>
              <div className="space-y-2">
                {['visa', 'mastercard', 'amex', 'discover'].map(card => (
                  <div key={card} className="flex items-center">
                    <Checkbox
                      id={`square-card-${card}`}
                      checked={config.supportedCards.includes(card)}
                      onChange={e => {
                        const newCards = e.target.checked
                          ? [...config.supportedCards, card]
                          : config.supportedCards.filter(c => c !== card);
                        handleGatewayConfigChange('square', 'supportedCards', newCards);
                      }}
                      disabled={!config.enabled}
                    />
                    <label htmlFor={`square-card-${card}`} className="ml-2 capitalize">
                      {card}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderRazorpaySettings = () => {
    const config = gatewayConfigs.razorpay;
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="h-8 w-8 mr-3">
              <img
                src="https://avatars.githubusercontent.com/u/7713209?s=200&v=4"
                alt="Razorpay logo"
                className="max-h-full max-w-full"
              />
            </div>
            <h3 className="text-lg font-medium">Razorpay Settings</h3>
          </div>
          <div>
            <Button
              variant={config.enabled ? 'danger' : 'success'}
              size="sm"
              onClick={() => handleToggleGateway('razorpay', !config.enabled)}
            >
              {config.enabled ? 'Disable' : 'Enable'}
            </Button>
          </div>
        </div>
        
        <div className="border-t pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Input
                label="Key ID"
                type="text"
                value={config.keyId}
                onChange={e => handleGatewayConfigChange('razorpay', 'keyId', e.target.value)}
                disabled={!config.enabled}
              />
            </div>
            <div>
              <Input
                label="Key Secret"
                type="password"
                value={config.keySecret}
                onChange={e => handleGatewayConfigChange('razorpay', 'keySecret', e.target.value)}
                disabled={!config.enabled}
              />
            </div>
          </div>
        </div>
        
        <div className="border-t pt-4">
          <h4 className="text-md font-medium mb-3">Currency Options</h4>
          
          <div>
            <Input
              label="Default Currency"
              value={config.defaultCurrency}
              disabled={true}
              hint="Razorpay only supports Indian Rupee (INR)"
            />
          </div>
        </div>
      </div>
    );
  };

  const renderGeneralSettings = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">General Payment Settings</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center">
            <Checkbox
              id="enablePayments"
              checked={generalSettings.enablePayments}
              onChange={e => handleGeneralSettingChange('enablePayments', e.target.checked)}
            />
            <label htmlFor="enablePayments" className="ml-2 block text-sm font-medium text-gray-700">
              Enable online payments
            </label>
          </div>
          
          <div className="flex items-center">
            <Checkbox
              id="enableOfflinePayments"
              checked={generalSettings.enableOfflinePayments}
              onChange={e => handleGeneralSettingChange('enableOfflinePayments', e.target.checked)}
            />
            <label htmlFor="enableOfflinePayments" className="ml-2 block text-sm font-medium text-gray-700">
              Enable offline payment options (bank transfer, check, etc.)
            </label>
          </div>
        </div>
        
        {generalSettings.enableOfflinePayments && (
          <div className="pt-2">
            <Input
              type="textarea"
              label="Offline Payment Instructions"
              value={generalSettings.offlinePaymentInstructions}
              onChange={e => handleGeneralSettingChange('offlinePaymentInstructions', e.target.value)}
              rows={3}
            />
          </div>
        )}
        
        <div className="border-t pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {generalSettings.enablePayments && (
              <div>
                <Select
                  label="Default Payment Gateway"
                  value={generalSettings.defaultGateway}
                  onChange={e => handleGeneralSettingChange('defaultGateway', e.target.value)}
                  options={gatewayOptions
                    .filter(g => gatewayConfigs[g.id].enabled)
                    .map(g => ({ value: g.id, label: g.name }))}
                />
              </div>
            )}
            
            <div>
              <Input
                label="Invoice Prefix"
                value={generalSettings.invoicePrefix}
                onChange={e => handleGeneralSettingChange('invoicePrefix', e.target.value)}
              />
            </div>
          </div>
        </div>
        
        <div className="pt-2">
          <Input
            type="textarea"
            label="Refund Policy"
            value={generalSettings.refundPolicy}
            onChange={e => handleGeneralSettingChange('refundPolicy', e.target.value)}
            rows={3}
          />
          <p className="mt-1 text-sm text-gray-500">
            This will be displayed on registration pages and payment receipts.
          </p>
        </div>
        
        <div className="pt-2">
          <Input
            type="textarea"
            label="Receipt Footer"
            value={generalSettings.receiptFooter}
            onChange={e => handleGeneralSettingChange('receiptFooter', e.target.value)}
            rows={2}
          />
        </div>
      </div>
    );
  };

  const renderCurrencySettings = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Currency Format Settings</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Select
              label="Default Currency"
              value={currencySettings.defaultCurrency}
              onChange={e => handleCurrencySettingChange('defaultCurrency', e.target.value)}
              options={currencyOptions}
            />
            <p className="mt-1 text-sm text-gray-500">
              This will be the default currency for new events.
            </p>
          </div>
          
          <div>
            <Select
              label="Currency Symbol Position"
              value={currencySettings.currencySymbolPosition}
              onChange={e => handleCurrencySettingChange('currencySymbolPosition', e.target.value)}
              options={[
                { value: 'before', label: 'Before amount ($100)' },
                { value: 'after', label: 'After amount (100$)' }
              ]}
            />
          </div>
          
          <div>
            <Select
              label="Thousands Separator"
              value={currencySettings.thousandsSeparator}
              onChange={e => handleCurrencySettingChange('thousandsSeparator', e.target.value)}
              options={[
                { value: ',', label: 'Comma (,)' },
                { value: '.', label: 'Period (.)' },
                { value: ' ', label: 'Space ( )' },
                { value: '', label: 'None' }
              ]}
            />
          </div>
          
          <div>
            <Select
              label="Decimal Separator"
              value={currencySettings.decimalSeparator}
              onChange={e => handleCurrencySettingChange('decimalSeparator', e.target.value)}
              options={[
                { value: '.', label: 'Period (.)' },
                { value: ',', label: 'Comma (,)' }
              ]}
            />
          </div>
          
          <div>
            <Select
              label="Number of Decimals"
              value={currencySettings.numberOfDecimals.toString()}
              onChange={e => handleCurrencySettingChange('numberOfDecimals', parseInt(e.target.value))}
              options={[
                { value: '0', label: '0' },
                { value: '1', label: '1' },
                { value: '2', label: '2' },
                { value: '3', label: '3' }
              ]}
            />
          </div>
        </div>
        
        <div className="border-t pt-4">
          <h4 className="text-md font-medium mb-3">Preview</h4>
          
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="text-lg">
              {currencySettings.currencySymbolPosition === 'before' ? '$' : ''}
              1{currencySettings.thousandsSeparator}234
              {currencySettings.decimalSeparator}
              {currencySettings.numberOfDecimals > 0 ? '5'.padEnd(currencySettings.numberOfDecimals, '0') : ''}
              {currencySettings.currencySymbolPosition === 'after' ? '$' : ''}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderActiveGatewaySettings = () => {
    switch (activeGateway) {
      case 'stripe':
        return renderStripeSettings();
      case 'paypal':
        return renderPayPalSettings();
      case 'square':
        return renderSquareSettings();
      case 'razorpay':
        return renderRazorpaySettings();
      default:
        return renderStripeSettings();
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <Spinner />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Payment Gateways</h1>
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
      
      <Tabs
        tabs={[
          { id: 'gateways', label: 'Payment Gateways' },
          { id: 'general', label: 'General Settings' },
          { id: 'currency', label: 'Currency Format' }
        ]}
        activeTab="gateways"
        onTabChange={tab => {
          if (tab === 'gateways') {
            setActiveGateway('stripe');
          }
        }}
        className="mb-6"
      />
      
      <Card>
        <div className="p-6">
          {renderGatewaySelector()}
          {renderActiveGatewaySettings()}
        </div>
      </Card>
      
      <div className="mt-8">
        <Card>
          <div className="p-6">
            {renderGeneralSettings()}
          </div>
        </Card>
      </div>
      
      <div className="mt-8">
        <Card>
          <div className="p-6">
            {renderCurrencySettings()}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PaymentGateways; 