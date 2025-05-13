import React, { useEffect, useState } from 'react';
import { Card, Switch, Select, Input } from '../../../components/common';

const PaymentTab = ({ event, updateEvent, onFormChange }) => {
  // *** Add check for event existence early ***
  if (!event) {
      return <div className="p-4 text-gray-500 dark:text-gray-400">Loading event data...</div>;
  }

  // Initialize payment settings if they don't exist
  useEffect(() => {
    // Now we know 'event' is defined, but check 'paymentSettings'
    if (!event.paymentSettings) {
      const defaultPaymentSettings = {
        enabled: false,
        allowRegistrationWithoutPayment: false,
        currency: 'USD',
        gateway: 'stripe',
        categoryPricing: [
          { category: 'Attendee', price: 499 },
          { category: 'Student', price: 199 },
          { category: 'Speaker', price: 0 },
          { category: 'VIP', price: 999 }
        ],
        stripe: {
          publishableKey: '',
          secretKey: ''
        }
      };
      
      if (typeof updateEvent === 'function') { 
          updateEvent(prevEvent => ({ 
            ...prevEvent,
            paymentSettings: defaultPaymentSettings
          }));
          if (typeof onFormChange === 'function') {
              onFormChange(true);
          }
      }
    }
  }, [event, updateEvent, onFormChange]);

  // Return placeholder if event data isn't loaded yet or paymentSettings missing
  // *** This specific check might be redundant now due to the top-level check, but keep for safety ***
  if (!event.paymentSettings) {
    return <div className="text-gray-500">Initializing payment settings...</div>;
  }

  const paymentSettings = event.paymentSettings;

  const handlePaymentSettingChange = (settingName, value) => {
      if (typeof updateEvent === 'function') {
        updateEvent(prevEvent => ({
          ...prevEvent,
          paymentSettings: {
            ...prevEvent.paymentSettings,
            [settingName]: value
          }
        }));
        if (typeof onFormChange === 'function') {
            onFormChange(true);
        }
      }
  };

  const handleStripeKeyChange = (keyType, value) => {
      if (typeof updateEvent === 'function') {
          updateEvent(prevEvent => ({
              ...prevEvent,
              paymentSettings: {
                  ...prevEvent.paymentSettings,
                  stripe: {
                      ...prevEvent.paymentSettings.stripe,
                      [keyType]: value
                  }
              }
          }));
          if (typeof onFormChange === 'function') {
              onFormChange(true);
          }
      }
  };

  const handlePriceChange = (category, value) => {
    if (typeof updateEvent === 'function') {
      const updatedPricing = paymentSettings.categoryPricing?.map(item => {
        if (item.category === category) {
          return { ...item, price: value === 'free' ? 0 : Number(value) };
        }
        return item;
      }) || [];

      updateEvent(prevEvent => ({
        ...prevEvent,
        paymentSettings: {
          ...prevEvent.paymentSettings,
          categoryPricing: updatedPricing
        }
      }));
      if (typeof onFormChange === 'function') {
          onFormChange(true);
      }
    }
  };

  // Example helper (can be removed if pricing is handled elsewhere)
  const formatPrice = (price, currency) => {
    if (price === 0) return 'Free';
    return `${currency || 'USD'} ${price}`
  };

  const currencyOptions = [
    { value: 'USD', label: 'USD - US Dollar' },
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'GBP', label: 'GBP - British Pound' },
    { value: 'INR', label: 'INR - Indian Rupee' },
    // Add more currencies as needed
  ];

  const gatewayOptions = [
    { value: 'stripe', label: 'Stripe' },
    { value: 'paypal', label: 'PayPal (Coming Soon)', disabled: true },
    // Add other gateways
  ];

  // Placeholder return with basic controls
  return (
    <div className="space-y-6">
      <Card title="Payment Gateway Configuration" className="bg-white dark:bg-gray-800">
        <div className="space-y-4 p-4">
          <div className="flex items-center justify-between">
            <label htmlFor="paymentEnabled" className="text-sm font-medium text-gray-700 dark:text-gray-300">Enable Online Payments</label>
            <Switch
              id="paymentEnabled"
              checked={paymentSettings.enabled || false}
              onChange={(checked) => handlePaymentSettingChange('enabled', checked)}
            />
          </div>

          {paymentSettings.enabled && (
            <>
              <div className="flex items-center justify-between">
                <label htmlFor="allowRegistrationWithoutPayment" className="text-sm font-medium text-gray-700 dark:text-gray-300">Allow Registration Without Immediate Payment</label>
                <Switch
                  id="allowRegistrationWithoutPayment"
                  checked={paymentSettings.allowRegistrationWithoutPayment || false}
                  onChange={(checked) => handlePaymentSettingChange('allowRegistrationWithoutPayment', checked)}
                />
              </div>

              <div>
                <label htmlFor="currency" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Default Currency</label>
                <Select
                  id="currency"
                  options={currencyOptions}
                  value={paymentSettings.currency || 'USD'}
                  onChange={(e) => handlePaymentSettingChange('currency', e.target.value)}
                  className="mt-1 w-full"
                />
              </div>

              <div>
                <label htmlFor="gateway" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payment Gateway</label>
                <Select
                  id="gateway"
                  options={gatewayOptions}
                  value={paymentSettings.gateway || 'stripe'}
                  onChange={(e) => handlePaymentSettingChange('gateway', e.target.value)}
                  className="mt-1 w-full"
                />
              </div>

              {/* Stripe Specific Settings */}
              {paymentSettings.gateway === 'stripe' && (
                 <div className="mt-4 border-t pt-4 space-y-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Stripe Settings</h3>
                     <div>
                         <label htmlFor="stripePublishableKey" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Publishable Key</label>
                         <Input
                            id="stripePublishableKey"
                            type="text"
                            placeholder="pk_test_..."
                            value={paymentSettings.stripe?.publishableKey || ''}
                            onChange={(e) => handleStripeKeyChange('publishableKey', e.target.value)}
                            className="mt-1 w-full"
                         />
                     </div>
                     <div>
                         <label htmlFor="stripeSecretKey" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Secret Key</label>
                         <Input
                            id="stripeSecretKey"
                            type="password"
                            placeholder="sk_test_..."
                            value={paymentSettings.stripe?.secretKey || ''}
                            onChange={(e) => handleStripeKeyChange('secretKey', e.target.value)}
                            className="mt-1 w-full"
                         />
                     </div>
                 </div>
              )}
              {/* Add sections for other gateways similarly */}

            </>
          )}
        </div>
      </Card>

      {paymentSettings.enabled && (
        <Card title="Category Pricing" className="bg-white dark:bg-gray-800">
          <div className="space-y-4 p-4">
            {(paymentSettings.categoryPricing || []).map((item, index) => (
              <div key={index} className="flex items-center justify-between border-b pb-2 mb-2 last:border-b-0 last:pb-0 last:mb-0">
                <span className="text-gray-700 dark:text-gray-300">{item.category}</span>
                <div className='flex items-center space-x-2'>
                    <span className='text-gray-500 dark:text-gray-400'>{paymentSettings.currency || 'USD'}</span>
                    <Input
                        type="number"
                        min="0"
                        step="0.01" // Allow cents
                        placeholder="e.g., 499.00"
                        value={item.price === 0 ? '' : (item.price / 100).toFixed(2)} // Assume price is in cents
                        onChange={(e) => handlePriceChange(item.category, e.target.value === '' ? 'free' : Math.round(parseFloat(e.target.value || 0) * 100))} // Convert back to cents
                        className="w-32 text-right"
                        disabled={item.category === 'Speaker'} // Example: Disable price change for speakers
                    />
                    {item.price === 0 && <span className="text-green-600 dark:text-green-400">(Free)</span>}
                 </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default PaymentTab;