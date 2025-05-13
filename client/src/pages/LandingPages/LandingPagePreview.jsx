import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Spin, message } from 'antd';
import { ArrowLeftIcon, PencilIcon, CheckIcon } from '@heroicons/react/24/outline';
import landingPageService from '../../services/landingPageService';

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
  
  registration_form: ({ component }) => (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-2">{component.title}</h2>
        <p className="text-gray-600 mb-6">{component.description}</p>
        
        <form className="space-y-4">
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
                  disabled
                />
              )}
              {field.type === 'email' && (
                <input 
                  type="email" 
                  placeholder={field.placeholder} 
                  className="p-2 border rounded"
                  disabled
                />
              )}
              {field.type === 'select' && (
                <select className="p-2 border rounded" disabled>
                  <option value="">Select an option</option>
                  {field.options?.map((option, i) => (
                    <option key={i} value={option.value}>{option.label}</option>
                  ))}
                </select>
              )}
            </div>
          ))}
          
          <button
            type="button"
            className="w-full bg-primary-600 text-white py-2 px-4 rounded hover:bg-primary-700 transition-colors mt-4"
          >
            {component.buttonText || 'Submit'}
          </button>
          
          <p className="text-sm text-gray-500 italic mt-2">
            This is a preview. Form submission is disabled.
          </p>
        </form>
      </div>
    </div>
  ),
  
  payment_form: ({ component }) => (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-2">{component.title}</h2>
        <p className="text-gray-600 mb-6">{component.description}</p>
        
        <div className="space-y-4">
          <h3 className="text-lg font-semibold mb-2">Payment Items</h3>
          
          {component.itemOptions?.map((item, index) => (
            <div key={index} className="flex justify-between items-center p-3 border rounded">
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>
              <div className="flex items-center">
                {component.showQuantity && (
                  <div className="flex items-center mr-4">
                    <button className="px-2 py-1 border rounded-l bg-gray-100">-</button>
                    <input type="text" value="1" disabled className="w-12 text-center border-y" />
                    <button className="px-2 py-1 border rounded-r bg-gray-100">+</button>
                  </div>
                )}
                <p className="font-bold">${item.price.toFixed(2)}</p>
              </div>
            </div>
          ))}
          
          <div className="flex justify-between font-bold text-lg mt-4 pt-2 border-t">
            <span>Total:</span>
            <span>
              ${component.itemOptions?.reduce((total, item) => total + item.price, 0).toFixed(2)}
            </span>
          </div>
          
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Payment Method</h3>
            <div className="space-y-2">
              {component.acceptedPaymentMethods?.includes('credit_card') && (
                <div className="border p-3 rounded flex items-center">
                  <input type="radio" name="payment-method" id="credit-card" defaultChecked disabled />
                  <label htmlFor="credit-card" className="ml-2">Credit Card</label>
                </div>
              )}
              {component.acceptedPaymentMethods?.includes('paypal') && (
                <div className="border p-3 rounded flex items-center">
                  <input type="radio" name="payment-method" id="paypal" disabled />
                  <label htmlFor="paypal" className="ml-2">PayPal</label>
                </div>
              )}
            </div>
          </div>
          
          <button
            type="button"
            className="w-full bg-primary-600 text-white py-2 px-4 rounded hover:bg-primary-700 transition-colors mt-4"
          >
            {component.buttonText || 'Complete Payment'}
          </button>
          
          <p className="text-sm text-gray-500 italic mt-2">
            This is a preview. Payment processing is disabled.
          </p>
        </div>
      </div>
    </div>
  ),
  
  // Fallback renderer for any component type that doesn't have a specific renderer
  default: ({ component }) => (
    <div className="container mx-auto py-12 px-4 border-2 border-dashed border-gray-300 rounded-lg">
      <div className="text-center text-gray-500">
        <p className="text-xl">Preview for <strong className="capitalize">{component.type.replace('_', ' ')}</strong> component</p>
        <p>No renderer available for this component type</p>
      </div>
    </div>
  )
};

const LandingPagePreview = () => {
  const { eventId, pageId } = useParams();
  const navigate = useNavigate();
  const [landingPage, setLandingPage] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchLandingPageData();
  }, [pageId]);
  
  const fetchLandingPageData = async () => {
    try {
      setLoading(true);
      const response = await landingPageService.previewLandingPage(pageId);
      setLandingPage(response.data.landingPage);
    } catch (error) {
      console.error('Error fetching landing page:', error);
      message.error('Failed to load landing page data');
    } finally {
      setLoading(false);
    }
  };
  
  const handleEdit = () => {
    navigate(`/events/${eventId}/landing-pages/${pageId}/edit`);
  };
  
  const handlePublish = async () => {
    try {
      await landingPageService.publishLandingPage(pageId);
      message.success('Landing page published successfully');
    } catch (error) {
      console.error('Error publishing landing page:', error);
      message.error('Failed to publish landing page');
    }
  };
  
  const renderComponent = (component) => {
    const Renderer = ComponentRenderers[component.type] || ComponentRenderers.default;
    return <Renderer key={component.id} component={component} />;
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" />
      </div>
    );
  }
  
  return (
    <div className="relative">
      {/* Preview header */}
      <div className="bg-white shadow-sm py-4 px-6 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center">
          <Button 
            icon={<ArrowLeftIcon className="h-4 w-4" />}
            onClick={() => navigate(`/events/${eventId}/landing-pages`)}
          >
            Back
          </Button>
          <h1 className="text-xl font-semibold ml-4">{landingPage?.title || 'Landing Page Preview'}</h1>
        </div>
        <div className="flex items-center">
          <Button 
            icon={<PencilIcon className="h-4 w-4" />}
            onClick={handleEdit}
            className="mr-2"
          >
            Edit
          </Button>
          {!landingPage?.isPublished && (
            <Button 
              type="primary"
              icon={<CheckIcon className="h-4 w-4" />}
              onClick={handlePublish}
            >
              Publish
            </Button>
          )}
        </div>
      </div>
      
      {/* Landing page content */}
      <div className="mt-16">
        {landingPage?.components?.length > 0 ? (
          <div>
            {landingPage.components.map(renderComponent)}
          </div>
        ) : (
          <div className="container mx-auto py-16 text-center">
            <div className="max-w-lg mx-auto p-8 bg-white rounded-lg shadow-lg">
              <h2 className="text-2xl font-bold mb-4">This landing page is empty</h2>
              <p className="text-gray-600 mb-6">Add components to your landing page to see them in the preview.</p>
              <Button 
                type="primary" 
                onClick={handleEdit}
              >
                Start Building
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LandingPagePreview; 