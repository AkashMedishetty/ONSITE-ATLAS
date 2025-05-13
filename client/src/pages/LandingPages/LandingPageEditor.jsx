import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Space, message, Tabs, Spin, Row, Col, Collapse, Typography, Input, Form, Switch, Divider } from 'antd';
import { ArrowLeftIcon, ArrowUpOnSquareIcon, EyeIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Bars3Icon } from '@heroicons/react/24/outline';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import landingPageService from '../../services/landingPageService';
import paymentService from '../../services/paymentService';

const { Title, Text } = Typography;
const { Panel } = Collapse;
const { TabPane } = Tabs;

// Component types available for the landing page builder
const COMPONENT_TYPES = {
  HERO: 'hero',
  TEXT: 'text',
  IMAGE: 'image',
  GALLERY: 'gallery',
  CTA: 'cta',
  REGISTRATION_FORM: 'registration_form',
  SPONSOR_SHOWCASE: 'sponsor_showcase',
  AGENDA: 'agenda',
  COUNTDOWN: 'countdown',
  MAP: 'map',
  PAYMENT_FORM: 'payment_form',
  SPEAKERS: 'speakers',
  FAQ: 'faq',
  CONTACT_FORM: 'contact_form',
  VIDEO: 'video',
  CUSTOM_HTML: 'custom_html'
};

// Default templates for each component type
const DEFAULT_COMPONENTS = {
  [COMPONENT_TYPES.HERO]: {
    type: COMPONENT_TYPES.HERO,
    title: 'Welcome to Our Event',
    subtitle: 'Join us for an amazing experience',
    backgroundImage: '',
    buttonText: 'Register Now',
    buttonLink: '/register',
    alignment: 'center',
    overlayOpacity: 0.5,
    height: 500
  },
  [COMPONENT_TYPES.TEXT]: {
    type: COMPONENT_TYPES.TEXT,
    content: '<p>Enter your text content here. You can format it and add headings, paragraphs, lists, etc.</p>',
    alignment: 'left',
    padding: 20
  },
  [COMPONENT_TYPES.IMAGE]: {
    type: COMPONENT_TYPES.IMAGE,
    imageUrl: '',
    altText: 'Image description',
    caption: '',
    width: '100%',
    alignment: 'center'
  },
  [COMPONENT_TYPES.CTA]: {
    type: COMPONENT_TYPES.CTA,
    title: 'Ready to Join?',
    description: 'Secure your spot at our event today.',
    buttonText: 'Register Now',
    buttonLink: '/register',
    backgroundColor: '#f0f0f0',
    textColor: '#333333',
    buttonColor: '#4a90e2'
  },
  [COMPONENT_TYPES.REGISTRATION_FORM]: {
    type: COMPONENT_TYPES.REGISTRATION_FORM,
    title: 'Register for the Event',
    description: 'Fill out the form below to register.',
    fields: [
      { name: 'name', label: 'Full Name', type: 'text', required: true },
      { name: 'email', label: 'Email Address', type: 'email', required: true },
      { name: 'organization', label: 'Organization', type: 'text', required: false }
    ],
    buttonText: 'Submit Registration',
    successMessage: 'Thank you for registering!'
  },
  [COMPONENT_TYPES.PAYMENT_FORM]: {
    type: COMPONENT_TYPES.PAYMENT_FORM,
    title: 'Payment Information',
    description: 'Complete your payment to confirm registration.',
    itemOptions: [
      { id: '1', name: 'Standard Registration', price: 99, description: 'Regular event access' },
      { id: '2', name: 'VIP Registration', price: 199, description: 'Premium event access with exclusive benefits' }
    ],
    showQuantity: true,
    acceptedPaymentMethods: ['credit_card', 'paypal'],
    buttonText: 'Complete Payment',
    successMessage: 'Payment successful! Your registration is confirmed.'
  }
};

// Sortable component wrapper
const SortableComponent = ({ id, component, onEdit, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  
  const style = {
    transform: transform ? `translate3d(0, ${transform.y}px, 0)` : undefined,
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative',
    marginBottom: '1rem',
    borderRadius: '0.375rem',
    backgroundColor: 'white',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  };
  
  const renderComponentPreview = () => {
    switch (component.type) {
      case COMPONENT_TYPES.HERO:
        return (
          <div className="bg-gray-100 p-4 relative" style={{ height: '120px' }}>
            <div className="text-center">
              <h3 className="text-lg font-semibold">{component.title}</h3>
              <p className="text-sm">{component.subtitle}</p>
              {component.buttonText && (
                <button className="mt-2 px-4 py-1 bg-blue-500 text-white rounded text-sm">
                  {component.buttonText}
                </button>
              )}
            </div>
          </div>
        );
      
      case COMPONENT_TYPES.TEXT:
        return (
          <div className="p-4">
            <div dangerouslySetInnerHTML={{ __html: component.content.substring(0, 150) + (component.content.length > 150 ? '...' : '') }} />
          </div>
        );
      
      case COMPONENT_TYPES.CTA:
        return (
          <div className="p-4 bg-gray-100">
            <h3 className="text-lg font-semibold">{component.title}</h3>
            <p className="text-sm">{component.description}</p>
            <button className="mt-2 px-4 py-1 bg-blue-500 text-white rounded text-sm">
              {component.buttonText}
            </button>
          </div>
        );
      
      case COMPONENT_TYPES.PAYMENT_FORM:
        return (
          <div className="p-4">
            <h3 className="text-lg font-semibold">{component.title}</h3>
            <p className="text-sm">{component.description}</p>
            <div className="mt-2 text-sm border p-2 rounded">
              {component.itemOptions.map((item, idx) => (
                <div key={idx} className="flex justify-between border-b last:border-b-0 py-1">
                  <span>{item.name}</span>
                  <span>${item.price}</span>
                </div>
              ))}
            </div>
          </div>
        );
      
      default:
        return (
          <div className="p-4">
            <p>{component.type} component</p>
          </div>
        );
    }
  };
  
  return (
    <div ref={setNodeRef} style={style}>
      <div className="flex items-center justify-between bg-gray-50 p-2 border-b">
        <div className="flex items-center">
          <Button 
            icon={<Bars3Icon className="h-4 w-4" />} 
            {...attributes} 
            {...listeners} 
            className="cursor-grab"
          />
          <span className="ml-2 capitalize">{component.type.replace('_', ' ')}</span>
        </div>
        <div>
          <Button 
            icon={<TrashIcon className="h-4 w-4" />}
            onClick={() => onDelete(id)}
            danger
            className="ml-2"
          />
        </div>
      </div>
      <div onClick={() => onEdit(id)}>
        {renderComponentPreview()}
      </div>
    </div>
  );
};

// Main component editor
const ComponentEditor = ({ component, onChange }) => {
  const handleChange = (field, value) => {
    onChange({ ...component, [field]: value });
  };
  
  const renderEditor = () => {
    switch (component.type) {
      case COMPONENT_TYPES.HERO:
        return (
          <div>
            <Form layout="vertical">
              <Form.Item label="Title">
                <Input 
                  value={component.title} 
                  onChange={(e) => handleChange('title', e.target.value)} 
                />
              </Form.Item>
              <Form.Item label="Subtitle">
                <Input 
                  value={component.subtitle} 
                  onChange={(e) => handleChange('subtitle', e.target.value)} 
                />
              </Form.Item>
              <Form.Item label="Background Image URL">
                <Input 
                  value={component.backgroundImage} 
                  onChange={(e) => handleChange('backgroundImage', e.target.value)} 
                />
              </Form.Item>
              <Form.Item label="Button Text">
                <Input 
                  value={component.buttonText} 
                  onChange={(e) => handleChange('buttonText', e.target.value)} 
                />
              </Form.Item>
              <Form.Item label="Button Link">
                <Input 
                  value={component.buttonLink} 
                  onChange={(e) => handleChange('buttonLink', e.target.value)} 
                />
              </Form.Item>
              <Form.Item label="Alignment">
                <select 
                  className="w-full border p-2 rounded" 
                  value={component.alignment} 
                  onChange={(e) => handleChange('alignment', e.target.value)}
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </Form.Item>
              <Form.Item label="Height (px)">
                <Input 
                  type="number" 
                  value={component.height} 
                  onChange={(e) => handleChange('height', parseInt(e.target.value))} 
                />
              </Form.Item>
            </Form>
          </div>
        );
      
      case COMPONENT_TYPES.TEXT:
        return (
          <div>
            <Form layout="vertical">
              <Form.Item label="Content">
                <Input.TextArea 
                  rows={8} 
                  value={component.content} 
                  onChange={(e) => handleChange('content', e.target.value)} 
                />
              </Form.Item>
              <Form.Item label="Alignment">
                <select 
                  className="w-full border p-2 rounded" 
                  value={component.alignment} 
                  onChange={(e) => handleChange('alignment', e.target.value)}
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </Form.Item>
              <Form.Item label="Padding (px)">
                <Input 
                  type="number" 
                  value={component.padding} 
                  onChange={(e) => handleChange('padding', parseInt(e.target.value))} 
                />
              </Form.Item>
            </Form>
          </div>
        );
      
      case COMPONENT_TYPES.CTA:
        return (
          <div>
            <Form layout="vertical">
              <Form.Item label="Title">
                <Input 
                  value={component.title} 
                  onChange={(e) => handleChange('title', e.target.value)} 
                />
              </Form.Item>
              <Form.Item label="Description">
                <Input.TextArea 
                  value={component.description} 
                  onChange={(e) => handleChange('description', e.target.value)} 
                />
              </Form.Item>
              <Form.Item label="Button Text">
                <Input 
                  value={component.buttonText} 
                  onChange={(e) => handleChange('buttonText', e.target.value)} 
                />
              </Form.Item>
              <Form.Item label="Button Link">
                <Input 
                  value={component.buttonLink} 
                  onChange={(e) => handleChange('buttonLink', e.target.value)} 
                />
              </Form.Item>
              <Form.Item label="Background Color">
                <Input 
                  type="color" 
                  value={component.backgroundColor} 
                  onChange={(e) => handleChange('backgroundColor', e.target.value)} 
                />
              </Form.Item>
              <Form.Item label="Text Color">
                <Input 
                  type="color" 
                  value={component.textColor} 
                  onChange={(e) => handleChange('textColor', e.target.value)} 
                />
              </Form.Item>
              <Form.Item label="Button Color">
                <Input 
                  type="color" 
                  value={component.buttonColor} 
                  onChange={(e) => handleChange('buttonColor', e.target.value)} 
                />
              </Form.Item>
            </Form>
          </div>
        );
        
      case COMPONENT_TYPES.PAYMENT_FORM:
        return (
          <div>
            <Form layout="vertical">
              <Form.Item label="Title">
                <Input 
                  value={component.title} 
                  onChange={(e) => handleChange('title', e.target.value)} 
                />
              </Form.Item>
              <Form.Item label="Description">
                <Input.TextArea 
                  value={component.description} 
                  onChange={(e) => handleChange('description', e.target.value)} 
                />
              </Form.Item>
              
              <Divider>Payment Items</Divider>
              
              {component.itemOptions.map((item, index) => (
                <div key={index} className="mb-4 p-3 border rounded">
                  <div className="flex justify-between mb-2">
                    <strong>Item {index + 1}</strong>
                    <Button 
                      danger 
                      icon={<TrashIcon className="h-4 w-4" />} 
                      onClick={() => {
                        const newItems = [...component.itemOptions];
                        newItems.splice(index, 1);
                        handleChange('itemOptions', newItems);
                      }}
                    />
                  </div>
                  
                  <Form.Item label="Item Name">
                    <Input 
                      value={item.name} 
                      onChange={(e) => {
                        const newItems = [...component.itemOptions];
                        newItems[index].name = e.target.value;
                        handleChange('itemOptions', newItems);
                      }} 
                    />
                  </Form.Item>
                  
                  <Form.Item label="Price">
                    <Input 
                      type="number" 
                      value={item.price} 
                      onChange={(e) => {
                        const newItems = [...component.itemOptions];
                        newItems[index].price = parseFloat(e.target.value);
                        handleChange('itemOptions', newItems);
                      }} 
                    />
                  </Form.Item>
                  
                  <Form.Item label="Description">
                    <Input 
                      value={item.description} 
                      onChange={(e) => {
                        const newItems = [...component.itemOptions];
                        newItems[index].description = e.target.value;
                        handleChange('itemOptions', newItems);
                      }} 
                    />
                  </Form.Item>
                </div>
              ))}
              
              <Button 
                type="dashed" 
                block 
                icon={<PlusIcon className="h-4 w-4" />} 
                onClick={() => {
                  handleChange('itemOptions', [
                    ...component.itemOptions, 
                    { id: Date.now().toString(), name: 'New Item', price: 0, description: '' }
                  ]);
                }}
              >
                Add Item
              </Button>
              
              <Form.Item label="Show Quantity" className="mt-4">
                <Switch 
                  checked={component.showQuantity} 
                  onChange={(checked) => handleChange('showQuantity', checked)} 
                />
              </Form.Item>
              
              <Form.Item label="Button Text">
                <Input 
                  value={component.buttonText} 
                  onChange={(e) => handleChange('buttonText', e.target.value)} 
                />
              </Form.Item>
              
              <Form.Item label="Success Message">
                <Input.TextArea 
                  value={component.successMessage} 
                  onChange={(e) => handleChange('successMessage', e.target.value)} 
                />
              </Form.Item>
            </Form>
          </div>
        );
      
      default:
        return (
          <div>
            <Text>No editor available for this component type.</Text>
          </div>
        );
    }
  };
  
  return (
    <div>
      <Title level={4} className="capitalize">{component.type.replace('_', ' ')} Editor</Title>
      {renderEditor()}
    </div>
  );
};

// Main landing page editor component
const LandingPageEditor = () => {
  const { eventId, pageId } = useParams();
  const navigate = useNavigate();
  const [landingPage, setLandingPage] = useState(null);
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComponentId, setSelectedComponentId] = useState(null);
  const [savingStatus, setSavingStatus] = useState('saved'); // 'saved', 'saving', 'error'
  const [activeTab, setActiveTab] = useState('components');
  const [paymentGateways, setPaymentGateways] = useState([]);
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );
  
  useEffect(() => {
    fetchLandingPageData();
    fetchPaymentGateways();
  }, [pageId]);
  
  const fetchLandingPageData = async () => {
    try {
      setLoading(true);
      const response = await landingPageService.getLandingPageById(pageId);
      const page = response.data.landingPage;
      setLandingPage(page);
      setComponents(page.components || []);
    } catch (error) {
      console.error('Error fetching landing page:', error);
      message.error('Failed to load landing page data');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchPaymentGateways = async () => {
    try {
      const response = await paymentService.getPaymentGateways();
      setPaymentGateways(response.data.paymentGateways || []);
    } catch (error) {
      console.error('Error fetching payment gateways:', error);
    }
  };
  
  const handleSaveLandingPage = async () => {
    try {
      setSavingStatus('saving');
      const updatedPage = {
        ...landingPage,
        components
      };
      
      await landingPageService.updateLandingPage(pageId, updatedPage);
      setSavingStatus('saved');
      message.success('Landing page saved successfully');
    } catch (error) {
      console.error('Error saving landing page:', error);
      message.error('Failed to save landing page');
      setSavingStatus('error');
    }
  };
  
  const handlePreview = () => {
    navigate(`/events/${eventId}/landing-pages/${pageId}/preview`);
  };
  
  const handleAddComponent = (componentType) => {
    const newComponent = {
      id: `component-${Date.now()}`,
      ...DEFAULT_COMPONENTS[componentType]
    };
    
    setComponents([...components, newComponent]);
    setSelectedComponentId(newComponent.id);
    setActiveTab('editor');
    
    // Auto-save after adding a component
    setTimeout(handleSaveLandingPage, 500);
  };
  
  const handleEditComponent = (id) => {
    setSelectedComponentId(id);
    setActiveTab('editor');
  };
  
  const handleDeleteComponent = (id) => {
    setComponents(components.filter(component => component.id !== id));
    if (selectedComponentId === id) {
      setSelectedComponentId(null);
    }
    
    // Auto-save after deleting a component
    setTimeout(handleSaveLandingPage, 500);
  };
  
  const handleUpdateComponent = (updatedComponent) => {
    setComponents(components.map(component => 
      component.id === selectedComponentId ? updatedComponent : component
    ));
    
    // Auto-save when the component is updated
    setTimeout(handleSaveLandingPage, 1000);
  };
  
  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      setComponents((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        
        return arrayMove(items, oldIndex, newIndex);
      });
      
      // Auto-save after reordering
      setTimeout(handleSaveLandingPage, 500);
    }
  };
  
  const selectedComponent = components.find(c => c.id === selectedComponentId);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center">
          <Button 
            icon={<ArrowLeftIcon className="h-4 w-4" />} 
            onClick={() => navigate(`/events/${eventId}/landing-pages`)}
          >
            Back to Landing Pages
          </Button>
          <Title level={3} className="mb-0 ml-4">{landingPage?.title}</Title>
        </div>
        <div>
          <Space>
            <span>
              {savingStatus === 'saved' && 'All changes saved'}
              {savingStatus === 'saving' && 'Saving...'}
              {savingStatus === 'error' && 'Error saving'}
            </span>
            <Button 
              type="primary"
              icon={<ArrowUpOnSquareIcon className="h-4 w-4" />}
              onClick={handleSaveLandingPage}
              loading={savingStatus === 'saving'}
            >
              Save
            </Button>
            <Button 
              icon={<EyeIcon className="h-4 w-4" />}
              onClick={handlePreview}
            >
              Preview
            </Button>
          </Space>
        </div>
      </div>
      
      <Row gutter={16}>
        {/* Left sidebar: Components and settings */}
        <Col span={6}>
          <Card className="shadow">
            <Tabs activeKey={activeTab} onChange={setActiveTab}>
              <TabPane tab="Components" key="components">
                <div className="mb-4">
                  <Text type="secondary">Drag and drop components to build your landing page</Text>
                </div>
                
                <Collapse defaultActiveKey={['content', 'forms']}>
                  <Panel header="Content Components" key="content">
                    <div className="space-y-2">
                      <Button block onClick={() => handleAddComponent(COMPONENT_TYPES.HERO)}>
                        Hero Banner
                      </Button>
                      <Button block onClick={() => handleAddComponent(COMPONENT_TYPES.TEXT)}>
                        Text Block
                      </Button>
                      <Button block onClick={() => handleAddComponent(COMPONENT_TYPES.IMAGE)}>
                        Image
                      </Button>
                      <Button block onClick={() => handleAddComponent(COMPONENT_TYPES.CTA)}>
                        Call to Action
                      </Button>
                      <Button block onClick={() => handleAddComponent(COMPONENT_TYPES.CUSTOM_HTML)}>
                        Custom HTML
                      </Button>
                    </div>
                  </Panel>
                  
                  <Panel header="Forms & Interaction" key="forms">
                    <div className="space-y-2">
                      <Button block onClick={() => handleAddComponent(COMPONENT_TYPES.REGISTRATION_FORM)}>
                        Registration Form
                      </Button>
                      <Button block onClick={() => handleAddComponent(COMPONENT_TYPES.PAYMENT_FORM)}>
                        Payment Form
                      </Button>
                      <Button block onClick={() => handleAddComponent(COMPONENT_TYPES.CONTACT_FORM)}>
                        Contact Form
                      </Button>
                    </div>
                  </Panel>
                  
                  <Panel header="Event Specific" key="event">
                    <div className="space-y-2">
                      <Button block onClick={() => handleAddComponent(COMPONENT_TYPES.AGENDA)}>
                        Agenda
                      </Button>
                      <Button block onClick={() => handleAddComponent(COMPONENT_TYPES.SPONSOR_SHOWCASE)}>
                        Sponsor Showcase
                      </Button>
                      <Button block onClick={() => handleAddComponent(COMPONENT_TYPES.SPEAKERS)}>
                        Speakers
                      </Button>
                      <Button block onClick={() => handleAddComponent(COMPONENT_TYPES.FAQ)}>
                        FAQ
                      </Button>
                      <Button block onClick={() => handleAddComponent(COMPONENT_TYPES.COUNTDOWN)}>
                        Countdown
                      </Button>
                    </div>
                  </Panel>
                </Collapse>
              </TabPane>
              
              <TabPane tab="Settings" key="settings">
                <Form layout="vertical">
                  <Form.Item label="Page Title">
                    <Input 
                      value={landingPage?.title} 
                      onChange={(e) => setLandingPage({ ...landingPage, title: e.target.value })} 
                    />
                  </Form.Item>
                  
                  <Form.Item label="Slug">
                    <Input 
                      value={landingPage?.slug} 
                      onChange={(e) => setLandingPage({ ...landingPage, slug: e.target.value })} 
                    />
                  </Form.Item>
                  
                  <Form.Item label="SEO Description">
                    <Input.TextArea 
                      value={landingPage?.seo} 
                      onChange={(e) => setLandingPage({ ...landingPage, seo: e.target.value })} 
                    />
                  </Form.Item>
                  
                  <Button 
                    type="primary" 
                    block 
                    onClick={handleSaveLandingPage}
                  >
                    Save Settings
                  </Button>
                </Form>
              </TabPane>
              
              {selectedComponent && (
                <TabPane tab="Editor" key="editor">
                  {selectedComponent ? (
                    <ComponentEditor 
                      component={selectedComponent} 
                      onChange={handleUpdateComponent} 
                    />
                  ) : (
                    <div className="text-center py-4">
                      <Text type="secondary">Select a component to edit</Text>
                    </div>
                  )}
                </TabPane>
              )}
            </Tabs>
          </Card>
        </Col>
        
        {/* Main content area: Component preview */}
        <Col span={18}>
          <Card className="shadow" bodyStyle={{ minHeight: '70vh' }}>
            <div className="mb-4">
              <Title level={4}>Page Layout</Title>
              <Text type="secondary">Drag to reorder components</Text>
            </div>
            
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
              modifiers={[restrictToVerticalAxis]}
            >
              <SortableContext items={components.map(c => c.id)} strategy={verticalListSortingStrategy}>
                {components.length > 0 ? (
                  <div>
                    {components.map((component) => (
                      <SortableComponent
                        key={component.id}
                        id={component.id}
                        component={component}
                        onEdit={handleEditComponent}
                        onDelete={handleDeleteComponent}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 p-8 text-center rounded">
                    <Text type="secondary">Your landing page is empty. Add components from the sidebar.</Text>
                  </div>
                )}
              </SortableContext>
            </DndContext>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default LandingPageEditor;