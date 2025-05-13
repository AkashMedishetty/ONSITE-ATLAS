import React from 'react';
import { Row, Col, Card, Button, Form, InputGroup, ListGroup } from 'react-bootstrap';
import { nanoid } from 'nanoid';
import { FaFont, FaImage, FaQrcode, FaShapes, FaTrash, FaBold, FaItalic, FaUnderline, FaAlignLeft, FaAlignCenter, FaAlignRight } from 'react-icons/fa';
import BadgeTemplateList from '../../components/badges/BadgeTemplateList';

/**
 * BadgeDesignerPart2 Component
 * This component contains the tab content and element handling functionality for the BadgeDesigner
 * It should be imported and used in the BadgeDesigner component
 */
const BadgeDesignerPart2 = ({ 
  activeTab, 
  template, 
  updateTemplate, 
  eventId,
  selectedElement, 
  setSelectedElement,
  sampleRegistration
}) => {
  console.log('BadgeDesignerPart2 received eventId:', eventId);
  // Elements tab - add new element
  const handleAddElement = (type) => {
    const id = nanoid(8);
    let newElement = {
      id,
      type,
      position: { x: 50, y: 50 },
      zIndex: template.elements.length + 1,
    };
    
    // Add specific properties based on element type
    switch (type) {
      case 'text':
        newElement.fieldType = 'custom';
        newElement.content = 'New Text';
        newElement.style = {
          fontSize: 16,
          fontFamily: 'Arial',
          fontWeight: 'normal',
          color: '#000000',
          backgroundColor: 'transparent',
        };
        break;
        
      case 'qrCode':
        newElement.fieldType = 'qrCode';
        newElement.size = { width: 100, height: 100 };
        break;
        
      case 'image':
        newElement.fieldType = 'image';
        newElement.content = '';
        newElement.size = { width: 100, height: 100 };
        newElement.style = {
          opacity: 1,
          borderRadius: 0
        };
        break;
        
      case 'shape':
        newElement.fieldType = 'shape';
        newElement.content = 'rectangle';
        newElement.size = { width: 100, height: 50 };
        newElement.style = {
          backgroundColor: '#E5E7EB',
          borderColor: '#9CA3AF',
          borderWidth: 1,
          borderRadius: 4,
          opacity: 1
        };
        break;
        
      case 'category':
        newElement.fieldType = 'category';
        newElement.size = { width: 80, height: 30 };
        newElement.style = {
          fontSize: 14,
          fontFamily: 'Arial',
          fontWeight: 'normal',
          color: '#FFFFFF',
          backgroundColor: template.printSettings.borderColor || '#3B82F6',
          padding: 5,
          borderRadius: 16
        };
        break;
        
      default:
        break;
    }
    
    updateTemplate({
      elements: [...template.elements, newElement]
    });
    
    // Select the new element
    setSelectedElement(newElement);
  };
  
  // Elements tab - remove element
  const handleRemoveElement = (id) => {
    updateTemplate({
      elements: template.elements.filter(el => el.id !== id)
    });
    
    if (selectedElement && selectedElement.id === id) {
      setSelectedElement(null);
    }
  };
  
  // Elements tab - update element properties
  const handleElementPropertyChange = (property, value) => {
    if (!selectedElement) return;
    
    const updatedElements = template.elements.map(el => {
      if (el.id === selectedElement.id) {
        if (property.includes('.')) {
          // Handle nested properties like style.fontSize
          const [parent, child] = property.split('.');
          return {
            ...el,
            [parent]: {
              ...el[parent],
              [child]: value
            }
          };
        } else {
          // Handle top-level properties
          return {
            ...el,
            [property]: value
          };
        }
      }
      return el;
    });
    
    updateTemplate({ elements: updatedElements });
    
    // Update the selected element reference
    const updatedElement = updatedElements.find(el => el.id === selectedElement.id);
    setSelectedElement(updatedElement);
  };
  
  // Render design tab
  const renderDesignTab = () => (
    <div className="design-tab">
      <Row>
        <Col>
          <h5 className="mb-3">Add Elements</h5>
          <div className="element-palette">
            <div className="element-palette-item" onClick={() => handleAddElement('text')}>
              <FaFont size={24} />
              <span>Text</span>
            </div>
            <div className="element-palette-item" onClick={() => handleAddElement('qrCode')}>
              <FaQrcode size={24} />
              <span>QR Code</span>
            </div>
            <div className="element-palette-item" onClick={() => handleAddElement('image')}>
              <FaImage size={24} />
              <span>Image</span>
            </div>
            <div className="element-palette-item" onClick={() => handleAddElement('shape')}>
              <FaShapes size={24} />
              <span>Shape</span>
            </div>
            <div className="element-palette-item" onClick={() => handleAddElement('category')}>
              <span className="badge bg-primary p-2 mb-2">Category</span>
              <span>Category</span>
            </div>
          </div>
          
          <h5 className="mb-3 mt-4">Badge Properties</h5>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Background Color</Form.Label>
              <Form.Control 
                type="color" 
                value={template.background}
                onChange={(e) => updateTemplate({ background: e.target.value })}
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Background Image URL</Form.Label>
              <Form.Control 
                type="text" 
                value={template.backgroundImage || ''}
                onChange={(e) => updateTemplate({ backgroundImage: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Logo URL</Form.Label>
              <Form.Control 
                type="text" 
                value={template.logo || ''}
                onChange={(e) => updateTemplate({ logo: e.target.value })}
                placeholder="https://example.com/logo.png"
              />
            </Form.Group>
          </Form>
        </Col>
      </Row>
    </div>
  );
  
  // Render elements tab
  const renderElementsTab = () => (
    <div className="elements-tab">
      <Row>
        <Col md={6}>
          <h5 className="mb-3">Elements</h5>
          <ListGroup>
            {template.elements.map(element => (
              <ListGroup.Item 
                key={element.id} 
                active={selectedElement && selectedElement.id === element.id}
                className="d-flex justify-content-between align-items-center"
                onClick={() => setSelectedElement(element)}
                action
              >
                <div>
                  <strong>{element.type.charAt(0).toUpperCase() + element.type.slice(1)}</strong>
                  {element.content && <span className="ms-2 text-muted small">{element.content}</span>}
                </div>
                <Button 
                  variant="link" 
                  className="text-danger p-0" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveElement(element.id);
                  }}
                >
                  <FaTrash />
                </Button>
              </ListGroup.Item>
            ))}
            {template.elements.length === 0 && (
              <div className="text-center py-4 text-muted">
                No elements added yet. Use the Design tab to add elements.
              </div>
            )}
          </ListGroup>
        </Col>
        
        <Col md={6}>
          <h5 className="mb-3">Properties</h5>
          {selectedElement ? (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Element Type</Form.Label>
                <Form.Control type="text" value={selectedElement.type} disabled />
              </Form.Group>
              
              {/* Position inputs */}
              <Row>
                <Col>
                  <Form.Group className="mb-3">
                    <Form.Label>X Position</Form.Label>
                    <Form.Control 
                      type="number" 
                      value={selectedElement.position.x}
                      onChange={(e) => handleElementPropertyChange('position.x', parseInt(e.target.value))}
                    />
                  </Form.Group>
                </Col>
                <Col>
                  <Form.Group className="mb-3">
                    <Form.Label>Y Position</Form.Label>
                    <Form.Control 
                      type="number" 
                      value={selectedElement.position.y}
                      onChange={(e) => handleElementPropertyChange('position.y', parseInt(e.target.value))}
                    />
                  </Form.Group>
                </Col>
              </Row>
              
              {/* Size inputs for elements that have dimensions */}
              {selectedElement.size && (
                <Row>
                  <Col>
                    <Form.Group className="mb-3">
                      <Form.Label>Width</Form.Label>
                      <Form.Control 
                        type="number" 
                        value={selectedElement.size.width}
                        onChange={(e) => handleElementPropertyChange('size.width', parseInt(e.target.value))}
                      />
                    </Form.Group>
                  </Col>
                  <Col>
                    <Form.Group className="mb-3">
                      <Form.Label>Height</Form.Label>
                      <Form.Control 
                        type="number" 
                        value={selectedElement.size.height}
                        onChange={(e) => handleElementPropertyChange('size.height', parseInt(e.target.value))}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              )}
              
              {/* Text specific controls */}
              {selectedElement.type === 'text' && (
                <>
                  <Form.Group className="mb-3">
                    <Form.Label>Text Content</Form.Label>
                    <Form.Control 
                      type="text" 
                      value={selectedElement.content}
                      onChange={(e) => handleElementPropertyChange('content', e.target.value)}
                    />
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Font Size</Form.Label>
                    <Form.Control 
                      type="number" 
                      value={selectedElement.style.fontSize}
                      onChange={(e) => handleElementPropertyChange('style.fontSize', parseInt(e.target.value))}
                    />
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Font Family</Form.Label>
                    <Form.Select 
                      value={selectedElement.style.fontFamily}
                      onChange={(e) => handleElementPropertyChange('style.fontFamily', e.target.value)}
                    >
                      <option value="Arial">Arial</option>
                      <option value="Helvetica">Helvetica</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Courier New">Courier New</option>
                      <option value="Verdana">Verdana</option>
                      <option value="Georgia">Georgia</option>
                    </Form.Select>
                  </Form.Group>
                  
                  <div className="mb-3">
                    <Form.Label>Text Style</Form.Label>
                    <div className="d-flex">
                      <Button 
                        variant={selectedElement.style.fontWeight === 'bold' ? 'primary' : 'outline-secondary'} 
                        className="me-1"
                        onClick={() => handleElementPropertyChange(
                          'style.fontWeight', 
                          selectedElement.style.fontWeight === 'bold' ? 'normal' : 'bold'
                        )}
                      >
                        <FaBold />
                      </Button>
                      <Button 
                        variant="outline-secondary" 
                        className="me-1"
                      >
                        <FaItalic />
                      </Button>
                      <Button 
                        variant="outline-secondary" 
                        className="me-1"
                      >
                        <FaUnderline />
                      </Button>
                    </div>
                  </div>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Text Color</Form.Label>
                    <Form.Control 
                      type="color" 
                      value={selectedElement.style.color}
                      onChange={(e) => handleElementPropertyChange('style.color', e.target.value)}
                    />
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Background Color</Form.Label>
                    <Form.Control 
                      type="color" 
                      value={selectedElement.style.backgroundColor}
                      onChange={(e) => handleElementPropertyChange('style.backgroundColor', e.target.value)}
                    />
                  </Form.Group>
                </>
              )}
              
              {/* Shape specific controls */}
              {selectedElement.type === 'shape' && (
                <>
                  <Form.Group className="mb-3">
                    <Form.Label>Shape Type</Form.Label>
                    <Form.Select 
                      value={selectedElement.content}
                      onChange={(e) => handleElementPropertyChange('content', e.target.value)}
                    >
                      <option value="rectangle">Rectangle</option>
                      <option value="circle">Circle</option>
                      <option value="line">Line</option>
                    </Form.Select>
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Background Color</Form.Label>
                    <Form.Control 
                      type="color" 
                      value={selectedElement.style.backgroundColor}
                      onChange={(e) => handleElementPropertyChange('style.backgroundColor', e.target.value)}
                    />
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Border Color</Form.Label>
                    <Form.Control 
                      type="color" 
                      value={selectedElement.style.borderColor}
                      onChange={(e) => handleElementPropertyChange('style.borderColor', e.target.value)}
                    />
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Border Width</Form.Label>
                    <Form.Control 
                      type="number" 
                      value={selectedElement.style.borderWidth}
                      onChange={(e) => handleElementPropertyChange('style.borderWidth', parseInt(e.target.value))}
                    />
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Border Radius</Form.Label>
                    <Form.Control 
                      type="number" 
                      value={selectedElement.style.borderRadius}
                      onChange={(e) => handleElementPropertyChange('style.borderRadius', parseInt(e.target.value))}
                    />
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Opacity</Form.Label>
                    <Form.Range 
                      min="0" 
                      max="100" 
                      value={selectedElement.style.opacity * 100}
                      onChange={(e) => handleElementPropertyChange('style.opacity', parseInt(e.target.value) / 100)}
                    />
                  </Form.Group>
                </>
              )}
              
              {/* Image specific controls */}
              {selectedElement.type === 'image' && (
                <>
                  <Form.Group className="mb-3">
                    <Form.Label>Image URL</Form.Label>
                    <Form.Control 
                      type="text" 
                      value={selectedElement.content}
                      onChange={(e) => handleElementPropertyChange('content', e.target.value)}
                      placeholder="https://example.com/image.jpg"
                    />
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Border Radius</Form.Label>
                    <Form.Control 
                      type="number" 
                      value={selectedElement.style.borderRadius}
                      onChange={(e) => handleElementPropertyChange('style.borderRadius', parseInt(e.target.value))}
                    />
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Opacity</Form.Label>
                    <Form.Range 
                      min="0" 
                      max="100" 
                      value={selectedElement.style.opacity * 100}
                      onChange={(e) => handleElementPropertyChange('style.opacity', parseInt(e.target.value) / 100)}
                    />
                  </Form.Group>
                </>
              )}
              
              {/* QR Code specific controls */}
              {selectedElement.type === 'qrCode' && (
                <>
                  <Form.Group className="mb-3">
                    <Form.Label>QR Code Type</Form.Label>
                    <Form.Select 
                      value={selectedElement.fieldType}
                      onChange={(e) => handleElementPropertyChange('fieldType', e.target.value)}
                    >
                      <option value="qrCode">Registration ID</option>
                      <option value="custom">Custom Text</option>
                    </Form.Select>
                  </Form.Group>
                  
                  {selectedElement.fieldType === 'custom' && (
                    <Form.Group className="mb-3">
                      <Form.Label>Custom Content</Form.Label>
                      <Form.Control 
                        type="text" 
                        value={selectedElement.content || ''}
                        onChange={(e) => handleElementPropertyChange('content', e.target.value)}
                      />
                    </Form.Group>
                  )}
                </>
              )}
              
              {/* Category specific controls */}
              {selectedElement.type === 'category' && (
                <>
                  <Form.Group className="mb-3">
                    <Form.Label>Font Size</Form.Label>
                    <Form.Control 
                      type="number" 
                      value={selectedElement.style.fontSize}
                      onChange={(e) => handleElementPropertyChange('style.fontSize', parseInt(e.target.value))}
                    />
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Text Color</Form.Label>
                    <Form.Control 
                      type="color" 
                      value={selectedElement.style.color}
                      onChange={(e) => handleElementPropertyChange('style.color', e.target.value)}
                    />
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Background Color</Form.Label>
                    <Form.Control 
                      type="color" 
                      value={selectedElement.style.backgroundColor}
                      onChange={(e) => handleElementPropertyChange('style.backgroundColor', e.target.value)}
                    />
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Border Radius</Form.Label>
                    <Form.Control 
                      type="number" 
                      value={selectedElement.style.borderRadius}
                      onChange={(e) => handleElementPropertyChange('style.borderRadius', parseInt(e.target.value))}
                    />
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Padding</Form.Label>
                    <Form.Control 
                      type="number" 
                      value={selectedElement.style.padding}
                      onChange={(e) => handleElementPropertyChange('style.padding', parseInt(e.target.value))}
                    />
                  </Form.Group>
                </>
              )}
              
              {/* Common controls for all elements */}
              <Form.Group className="mb-3">
                <Form.Label>Z-Index (Layer Order)</Form.Label>
                <Form.Control 
                  type="number" 
                  value={selectedElement.style?.zIndex || 1}
                  onChange={(e) => handleElementPropertyChange('style.zIndex', parseInt(e.target.value))}
                />
              </Form.Group>
            </Form>
          ) : (
            <div className="text-center py-4 text-muted">
              Select an element to view its properties.
            </div>
          )}
        </Col>
      </Row>
    </div>
  );
  
  // Render preview tab
  const renderPreviewTab = () => (
    <div className="preview-tab">
      <Row>
        <Col>
          <Card className="mb-3">
            <Card.Body className="text-center">
              <p className="mb-3">This is how your badge will look when printed.</p>
              <p>Sample data is shown. Actual badges will use attendee information.</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
  
  // Render template library tab
  const renderTemplateLibraryTab = () => (
    <div className="template-library-tab">
      <BadgeTemplateList 
        eventId={eventId}
        onSelectTemplate={(template) => updateTemplate(template)}
      />
    </div>
  );
  
  // Render the active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'design':
        return renderDesignTab();
      case 'elements':
        return renderElementsTab();
      case 'preview':
        return renderPreviewTab();
      case 'library':
        return renderTemplateLibraryTab();
      default:
        return renderDesignTab();
    }
  };
  
  return renderTabContent();
};

export default BadgeDesignerPart2; 