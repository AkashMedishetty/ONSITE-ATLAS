import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Spin, Button, message } from 'antd';
import landingPageService from '../../services/landingPageService';
import paymentService from '../../services/paymentService';
import { Helmet } from 'react-helmet';

// Component renderers for each component type
const ComponentRenderers = {
  hero: ({ component }) => (
    <div 
      className="relative flex items-center justify-center"
      style={{ 
        height: `${component.height}px`,
        backgroundImage: component.backgroundImage ? `url(${component.backgroundImage})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div 
        className="absolute inset-0 bg-black" 
        style={{ opacity: component.overlayOpacity || 0.3 }}
      ></div>
      <div 
        className="relative z-10 text-white p-8"
        style={{ textAlign: component.alignment || 'center' }}
      >
        <h1 className="text-4xl font-bold mb-4">{component.title}</h1>
        <div className="text-xl mb-6">{component.subtitle}</div>
        {component.buttonText && (
          <a 
            href={component.buttonLink}
            className="inline-block px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            {component.buttonText}
          </a>
        )}
      </div>
    </div>
  ),
  
  text: ({ component }) => (
    <div 
      className="container mx-auto"
      style={{ 
        padding: `${component.padding || 20}px`,
        textAlign: component.alignment || 'left'
      }}
    >
      <div 
        className="prose max-w-none"
        dangerouslySetInnerHTML={{ __html: component.content }}
      />
    </div>
  ),
  
  image: ({ component }) => (
    <div 
      className="container mx-auto"
      style={{ 
        textAlign: component.alignment || 'center',
        padding: '20px'
      }}
    >
      <img 
        src={component.imageUrl} 
        alt={component.altText}
        style={{ maxWidth: component.width || '100%' }}
        className="mx-auto rounded-lg shadow-lg"
      />
      {component.caption && (
        <p className="mt-2 text-sm text-gray-600 italic">{component.caption}</p>
      )}
    </div>
  ),
  
  cta: ({ component }) => (
    <div 
      style={{ 
        backgroundColor: component.backgroundColor || '#f0f0f0',
        color: component.textColor || '#333333',
        padding: '50px 20px',
        textAlign: 'center'
      }}
    >
      <div className="container mx-auto">
        <h2 className="text-3xl font-bold mb-4">{component.title}</h2>
        <p className="text-xl mb-6 max-w-3xl mx-auto">{component.description}</p>
        <a 
          href={component.buttonLink}
          className="inline-block px-6 py-3 rounded-md hover:opacity-90 transition-opacity"
          style={{ backgroundColor: component.buttonColor || '#4a90e2', color: '#ffffff' }}
        >
          {component.buttonText}
        </a>
      </div>
    </div>
  ),
  
  registration_form: ({ component, eventData }) => {
    const [formData, setFormData] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    
    const handleChange = (e, field) => {
      setFormData({
        ...formData,
        [field.name]: e.target.value
      });
    };
    
    const handleSubmit = async (e) => {
      e.preventDefault();
      
      // Validate required fields
      const missingFields = component.fields
        .filter(field => field.required && !formData[field.name])
        .map(field => field.label);
      
      if (missingFields.length > 0) {
        message.error(`Please fill in the following required fields: ${missingFields.join(', ')}`);
        return;
      }
      
      try {
        setSubmitting(true);
        
        // In a real implementation, you would send the registration data to the server
        // For demonstration purposes, we're just simulating a successful submission
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setSubmitted(true);
        message.success(component.successMessage || 'Registration submitted successfully!');
      } catch (error) {
        console.error('Error submitting registration:', error);
        message.error('Failed to submit registration. Please try again.');
      } finally {
        setSubmitting(false);
      }
    };
    
    if (submitted) {
      return (
        <div className="container mx-auto py-12 px-4">
          <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-lg text-center">
            <h2 className="text-2xl font-bold mb-4">Thank You!</h2>
            <p className="text-gray-600 mb-6">{component.successMessage || 'Your registration has been submitted successfully.'}</p>
          </div>
        </div>
      );
    }
    
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-2">{component.title}</h2>
          <p className="text-gray-600 mb-6">{component.description}</p>
          
          <form className="space-y-4" onSubmit={handleSubmit}>
            {component.fields?.map((field, index) => (
              <div key={index} className="flex flex-col">
                <label className="mb-1 font-medium">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                {field.type === 'text' && (
                  <input 
                    type="text" 
                    placeholder={field.placeholder} 
                    className="p-2 border rounded"
                    onChange={(e) => handleChange(e, field)}
                    value={formData[field.name] || ''}
                  />
                )}
                {field.type === 'email' && (
                  <input 
                    type="email" 
                    placeholder={field.placeholder} 
                    className="p-2 border rounded"
                    onChange={(e) => handleChange(e, field)}
                    value={formData[field.name] || ''}
                  />
                )}
                {field.type === 'select' && (
                  <select 
                    className="p-2 border rounded"
                    onChange={(e) => handleChange(e, field)}
                    value={formData[field.name] || ''}
                  >
                    <option value="">Select an option</option>
                    {field.options?.map((option, i) => (
                      <option key={i} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                )}
              </div>
            ))}
            
            <button
              type="submit"
              className="w-full bg-primary-600 text-white py-2 px-4 rounded hover:bg-primary-700 transition-colors mt-4"
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : (component.buttonText || 'Submit')}
            </button>
          </form>
        </div>
      </div>
    );
  },
  
  payment_form: ({ component, eventData }) => {
    const [selectedItems, setSelectedItems] = useState(
      component.itemOptions.map(item => ({ ...item, quantity: 1 }))
    );
    const [paymentMethod, setPaymentMethod] = useState(
      component.acceptedPaymentMethods?.[0] || 'credit_card'
    );
    const [processing, setProcessing] = useState(false);
    const [completed, setCompleted] = useState(false);
    const [paymentError, setPaymentError] = useState(null);
    
    const updateQuantity = (index, newQuantity) => {
      const updated = [...selectedItems];
      updated[index].quantity = Math.max(1, Math.min(10, newQuantity)); // Limit between 1 and 10
      setSelectedItems(updated);
    };
    
    const calculateTotal = () => {
      return selectedItems.reduce((total, item) => 
        total + (item.price * (item.quantity || 1)), 0
      );
    };
    
    const handlePaymentSubmit = async () => {
      try {
        setProcessing(true);
        setPaymentError(null);
        
        // In a real implementation, you would process the payment using paymentService
        // For demonstration, we're simulating a payment process
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Success case
        setCompleted(true);
        message.success(component.successMessage || 'Payment completed successfully!');
      } catch (error) {
        console.error('Payment processing error:', error);
        setPaymentError('There was an error processing your payment. Please try again.');
        message.error('Payment failed. Please try again.');
      } finally {
        setProcessing(false);
      }
    };
    
    if (completed) {
      return (
        <div className="container mx-auto py-12 px-4">
          <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-lg text-center">
            <h2 className="text-2xl font-bold mb-4">Payment Successful!</h2>
            <p className="text-gray-600 mb-6">{component.successMessage || 'Your payment has been processed successfully.'}</p>
            <p className="text-gray-500">A confirmation email has been sent to your email address.</p>
          </div>
        </div>
      );
    }
    
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-2">{component.title}</h2>
          <p className="text-gray-600 mb-6">{component.description}</p>
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-2">Payment Items</h3>
            
            {selectedItems.map((item, index) => (
              <div key={index} className="flex justify-between items-center p-3 border rounded">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
                <div className="flex items-center">
                  {component.showQuantity && (
                    <div className="flex items-center mr-4">
                      <button 
                        type="button"
                        className="px-2 py-1 border rounded-l bg-gray-100"
                        onClick={() => updateQuantity(index, item.quantity - 1)}
                      >
                        -
                      </button>
                      <input 
                        type="text" 
                        value={item.quantity} 
                        className="w-12 text-center border-y"
                        readOnly
                      />
                      <button 
                        type="button"
                        className="px-2 py-1 border rounded-r bg-gray-100"
                        onClick={() => updateQuantity(index, item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                  )}
                  <p className="font-bold">${(item.price * (item.quantity || 1)).toFixed(2)}</p>
                </div>
              </div>
            ))}
            
            <div className="flex justify-between font-bold text-lg mt-4 pt-2 border-t">
              <span>Total:</span>
              <span>${calculateTotal().toFixed(2)}</span>
            </div>
            
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Payment Method</h3>
              <div className="space-y-2">
                {component.acceptedPaymentMethods?.includes('credit_card') && (
                  <div 
                    className={`border p-3 rounded flex items-center cursor-pointer ${paymentMethod === 'credit_card' ? 'border-blue-500 bg-blue-50' : ''}`}
                    onClick={() => setPaymentMethod('credit_card')}
                  >
                    <input 
                      type="radio" 
                      id="credit-card" 
                      checked={paymentMethod === 'credit_card'} 
                      onChange={() => setPaymentMethod('credit_card')}
                    />
                    <label htmlFor="credit-card" className="ml-2 cursor-pointer">Credit Card</label>
                  </div>
                )}
                {component.acceptedPaymentMethods?.includes('paypal') && (
                  <div 
                    className={`border p-3 rounded flex items-center cursor-pointer ${paymentMethod === 'paypal' ? 'border-blue-500 bg-blue-50' : ''}`}
                    onClick={() => setPaymentMethod('paypal')}
                  >
                    <input 
                      type="radio" 
                      id="paypal" 
                      checked={paymentMethod === 'paypal'} 
                      onChange={() => setPaymentMethod('paypal')}
                    />
                    <label htmlFor="paypal" className="ml-2 cursor-pointer">PayPal</label>
                  </div>
                )}
              </div>
            </div>
            
            {paymentError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded mt-4">
                {paymentError}
              </div>
            )}
            
            <button
              type="button"
              className="w-full bg-primary-600 text-white py-2 px-4 rounded hover:bg-primary-700 transition-colors mt-6"
              onClick={handlePaymentSubmit}
              disabled={processing || calculateTotal() <= 0}
            >
              {processing ? 'Processing...' : (component.buttonText || 'Complete Payment')}
            </button>
          </div>
        </div>
      </div>
    );
  },
  
  // Fallback renderer for any component type that doesn't have a specific renderer
  default: ({ component }) => (
    <div className="container mx-auto py-12 px-4">
      <div className="text-center text-gray-500">
        <p>Component type '{component.type}' cannot be rendered</p>
      </div>
    </div>
  )
};

const PublicLandingPage = () => {
  const { eventSlug } = useParams();
  const navigate = useNavigate();
  const [landingPage, setLandingPage] = useState(null);
  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    fetchLandingPageData();
  }, [eventSlug]);
  
  const fetchLandingPageData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await landingPageService.getPublicLandingPage(eventSlug);
      
      // The API response includes both the landing page and the event data
      setLandingPage(response.data.landingPage);
      setEventData(response.data.event);
    } catch (error) {
      console.error('Error fetching landing page:', error);
      setError('The requested landing page could not be found or is not published.');
    } finally {
      setLoading(false);
    }
  };
  
  const renderComponent = (component) => {
    const Renderer = ComponentRenderers[component.type] || ComponentRenderers.default;
    return <Renderer key={component.id} component={component} eventData={eventData} />;
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" />
      </div>
    );
  }
  
  if (error || !landingPage) {
    return (
      <div className="container mx-auto py-16 text-center">
        <div className="max-w-lg mx-auto p-8 bg-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-4">Landing Page Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The requested landing page is not available.'}</p>
          <Button 
            type="primary" 
            onClick={() => navigate('/')}
          >
            Return to Home
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      {/* Meta information for SEO */}
      <Helmet>
        <title>{landingPage.title} - {eventData.name}</title>
        {landingPage.seo && <meta name="description" content={landingPage.seo} />}
        <meta property="og:title" content={`${landingPage.title} - ${eventData.name}`} />
        {landingPage.seo && <meta property="og:description" content={landingPage.seo} />}
      </Helmet>
      
      {/* Landing page content */}
      <main>
        {landingPage.components?.length > 0 ? (
          <div>
            {landingPage.components.map(renderComponent)}
          </div>
        ) : (
          <div className="container mx-auto py-16 text-center">
            <div className="max-w-lg mx-auto p-8 bg-white rounded-lg shadow-lg">
              <h2 className="text-2xl font-bold mb-4">{eventData.name}</h2>
              <p className="text-gray-600 mb-6">This event landing page is under construction.</p>
              <Button 
                type="primary" 
                onClick={() => navigate(`/events/${eventData._id}/register`)}
              >
                Register for Event
              </Button>
            </div>
          </div>
        )}
      </main>
      
      {/* Footer */}
      <footer className="bg-gray-800 text-white py-6 mt-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p>&copy; {new Date().getFullYear()} {eventData.organizerName || 'Event Organizer'}</p>
            </div>
            <div>
              <a href="/terms" className="text-gray-300 hover:text-white mx-2">Terms of Service</a>
              <a href="/privacy" className="text-gray-300 hover:text-white mx-2">Privacy Policy</a>
              <a href="/contact" className="text-gray-300 hover:text-white mx-2">Contact Us</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLandingPage; 