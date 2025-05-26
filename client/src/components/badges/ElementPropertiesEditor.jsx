import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Form, Row, Col, Card, Accordion, Button } from 'react-bootstrap';
import { FaTrash } from 'react-icons/fa';

const ElementPropertiesEditor = ({ selectedElement, onUpdateElement, onDeleteElement, eventId, activeAccordionKeys, setActiveAccordionKeys }) => {
  const prevSelectedElementIdRef = useRef(null);
  const lastPositionRef = useRef(null);
  const ignoreNextToggleRef = useRef(false);
  const ignoreToggleTimeoutRef = useRef(null);

  useEffect(() => {
    const currentSelectedId = selectedElement ? selectedElement.id : null;
    if (currentSelectedId !== prevSelectedElementIdRef.current) {
      if (selectedElement && typeof selectedElement === 'object' && selectedElement.type) {
        setActiveAccordionKeys([selectedElement.type + '-style']);
      } else {
        setActiveAccordionKeys([]); 
      }
    }
    prevSelectedElementIdRef.current = currentSelectedId;
  }, [selectedElement, setActiveAccordionKeys]);

  // Track position changes to detect drags
  useEffect(() => {
    if (selectedElement && selectedElement.position) {
      const currentPosition = JSON.stringify(selectedElement.position);
      if (lastPositionRef.current && lastPositionRef.current !== currentPosition) {
        // Position changed - likely a drag just completed
        console.log('[ElementPropertiesEditor] Position changed, ignoring next toggle');
        ignoreNextToggleRef.current = true;
        
        // Reset the ignore flag after a short delay
        clearTimeout(ignoreToggleTimeoutRef.current);
        ignoreToggleTimeoutRef.current = setTimeout(() => {
          ignoreNextToggleRef.current = false;
        }, 300); // 300ms should be enough to ignore post-drag events
      }
      lastPositionRef.current = currentPosition;
    }
    
    return () => {
      clearTimeout(ignoreToggleTimeoutRef.current);
    };
  }, [selectedElement?.position?.x, selectedElement?.position?.y]);

  const handleInputChange = useCallback((path, value) => {
    if (!selectedElement) return;

    const keys = path.split('.');
    let updatePayload = {};
    let current = updatePayload;

    keys.forEach((key, index) => {
      if (index === keys.length - 1) {
        current[key] = value;
      } else {
        current[key] = { ...(selectedElement[key] || {}) }; // Spread existing nested properties
        current = current[key];
      }
    });
    onUpdateElement(selectedElement.id, updatePayload);
  }, [selectedElement, onUpdateElement]);
  
  console.log('selectedElement', selectedElement);

  if (!selectedElement || typeof selectedElement !== 'object') {
    return (
      <Card className="designer-panel-card">
        <Card.Header>Properties</Card.Header>
        <Card.Body className="properties-panel-placeholder">
          Select an element to see its properties.
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="designer-panel-card">
      <Card.Header>Properties: {selectedElement ? selectedElement.type : ''} {selectedElement ? `(ID: ...${selectedElement.id.slice(-6)})` : ''}</Card.Header>
      <Card.Body>
        {selectedElement && selectedElement.type === 'text' && (
          <>
            <Form.Group className="mb-3">
              <Form.Label size="sm">Text Source</Form.Label>
              <Form.Select 
                size="sm" 
                value={selectedElement.fieldType || 'custom'} 
                onChange={(e) => {
                  const newFieldType = e.target.value;
                  const newContent = newFieldType === 'custom' ? (selectedElement.content || 'Custom Text') : '';
                  onUpdateElement(selectedElement.id, { fieldType: newFieldType, content: newContent });
                }}
              >
                <option value="custom">Custom Text</option>
                <option value="name">Full Name</option>
                <option value="firstName">First Name</option>
                <option value="lastName">Last Name</option>
                <option value="registrationId">Registration ID</option>
                <option value="category">Category</option>
                <option value="organization">Organization</option>
                <option value="country">Country</option>
                <option value="email">Email</option>
              </Form.Select>
            </Form.Group>
            {selectedElement.fieldType === 'custom' && (
              <Form.Group className="mb-3">
                <Form.Label size="sm">Custom Text Content</Form.Label>
                <Form.Control 
                  type="text" 
                  size="sm" 
                  value={selectedElement.content || ''} 
                  onChange={(e) => onUpdateElement(selectedElement.id, { content: e.target.value })} 
                />
              </Form.Group>
            )}
            <Row>
              <Col md={6}>
                <Form.Group className="mb-2">
                  <Form.Label size="sm">Font Size (px)</Form.Label>
                  <Form.Control 
                    type="number" 
                    size="sm" 
                    value={selectedElement.style?.fontSize || 16} 
                    onChange={(e) => onUpdateElement(selectedElement.id, { style: { ...selectedElement.style, fontSize: parseInt(e.target.value, 10) } })} 
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-2">
                  <Form.Label size="sm">Text Color</Form.Label>
                  <Form.Control 
                    type="color" 
                    size="sm" 
                    value={selectedElement.style?.color || '#000000'} 
                    onChange={(e) => onUpdateElement(selectedElement.id, { style: { ...selectedElement.style, color: e.target.value } })} 
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label size="sm">Font Family</Form.Label>
              <Form.Select 
                size="sm" 
                value={selectedElement.style?.fontFamily || 'Arial'} 
                onChange={(e) => onUpdateElement(selectedElement.id, { style: { ...selectedElement.style, fontFamily: e.target.value } })}
              >
                <option value="Arial">Arial</option>
                <option value="Verdana">Verdana</option>
                <option value="Helvetica">Helvetica</option>
                <option value="Tahoma">Tahoma</option>
                <option value="Trebuchet MS">Trebuchet MS</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Georgia">Georgia</option>
                <option value="Garamond">Garamond</option>
                <option value="Courier New">Courier New</option>
                <option value="Brush Script MT">Brush Script MT</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label size="sm">Font Weight</Form.Label>
              <Form.Select 
                size="sm" 
                value={selectedElement.style?.fontWeight || 'normal'} 
                onChange={(e) => onUpdateElement(selectedElement.id, { style: { ...selectedElement.style, fontWeight: e.target.value } })}
              >
                <option value="normal">Normal</option>
                <option value="bold">Bold</option>
                <option value="lighter">Lighter</option>
                <option value="bolder">Bolder</option>
                <option value="300">300</option>
                <option value="400">400</option>
                <option value="500">500</option>
                <option value="600">600</option>
                <option value="700">700</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label size="sm">Background Color</Form.Label>
              <Form.Control 
                type="color" 
                size="sm" 
                value={(selectedElement.style?.backgroundColor && selectedElement.style.backgroundColor !== 'transparent' && selectedElement.style.backgroundColor.startsWith('#')) ? selectedElement.style.backgroundColor : '#FFFFFF'} 
                onChange={(e) => onUpdateElement(selectedElement.id, { style: { ...selectedElement.style, backgroundColor: e.target.value } })} 
              />
            </Form.Group>
          </>
        )}
        {selectedElement && selectedElement.type === 'qrCode' && (
          <>
            <Form.Group className="mb-2">
              <Form.Label size="sm">Width (px)</Form.Label>
              <Form.Control 
                type="number" 
                size="sm" 
                value={selectedElement.size?.width || 80} 
                onChange={(e) => onUpdateElement(selectedElement.id, { size: { ...selectedElement.size, width: parseInt(e.target.value, 10) } })} 
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label size="sm">Height (px)</Form.Label>
              <Form.Control 
                type="number" 
                size="sm" 
                value={selectedElement.size?.height || 80} 
                onChange={(e) => onUpdateElement(selectedElement.id, { size: { ...selectedElement.size, height: parseInt(e.target.value, 10) } })} 
              />
            </Form.Group>
            {/* Add more QR code options as needed */}
          </>
        )}
        {selectedElement && selectedElement.type === 'image' && (
          <>
            <Form.Group className="mb-2">
              <Form.Label size="sm">Image URL</Form.Label>
              <Form.Control 
                type="text" 
                size="sm" 
                placeholder="https://example.com/image.png"
                value={selectedElement.content || ''} 
                onChange={(e) => onUpdateElement(selectedElement.id, { content: e.target.value })} 
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label size="sm">Width (px)</Form.Label>
              <Form.Control 
                type="number" 
                size="sm" 
                value={selectedElement.size?.width || 100} 
                onChange={(e) => onUpdateElement(selectedElement.id, { size: { ...selectedElement.size, width: parseInt(e.target.value, 10) } })} 
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label size="sm">Height (px)</Form.Label>
              <Form.Control 
                type="number" 
                size="sm" 
                value={selectedElement.size?.height || 100} 
                onChange={(e) => onUpdateElement(selectedElement.id, { size: { ...selectedElement.size, height: parseInt(e.target.value, 10) } })} 
              />
            </Form.Group>
            {/* Add more image options as needed */}
          </>
        )}
        {selectedElement && selectedElement.type === 'shape' && (
          <>
            <Form.Group className="mb-2">
              <Form.Label size="sm">Shape Type</Form.Label>
              <Form.Select size="sm" value={selectedElement.content || 'rectangle'} onChange={e => onUpdateElement(selectedElement.id, { content: e.target.value })}>
                <option value="rectangle">Rectangle</option>
                <option value="circle">Circle</option>
                <option value="line">Line</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label size="sm">Width (px)</Form.Label>
              <Form.Control type="number" size="sm" value={selectedElement.size?.width || 100} onChange={e => onUpdateElement(selectedElement.id, { size: { ...selectedElement.size, width: parseInt(e.target.value, 10) } })} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label size="sm">Height (px)</Form.Label>
              <Form.Control type="number" size="sm" value={selectedElement.size?.height || 50} onChange={e => onUpdateElement(selectedElement.id, { size: { ...selectedElement.size, height: parseInt(e.target.value, 10) } })} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label size="sm">Background Color</Form.Label>
              <Form.Control type="color" size="sm" value={selectedElement.style?.backgroundColor || '#E5E7EB'} onChange={e => onUpdateElement(selectedElement.id, { style: { ...selectedElement.style, backgroundColor: e.target.value } })} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label size="sm">Border Color</Form.Label>
              <Form.Control type="color" size="sm" value={selectedElement.style?.borderColor || '#9CA3AF'} onChange={e => onUpdateElement(selectedElement.id, { style: { ...selectedElement.style, borderColor: e.target.value } })} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label size="sm">Border Width</Form.Label>
              <Form.Control type="number" size="sm" value={selectedElement.style?.borderWidth || 1} onChange={e => onUpdateElement(selectedElement.id, { style: { ...selectedElement.style, borderWidth: parseInt(e.target.value, 10) } })} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label size="sm">Border Radius</Form.Label>
              <Form.Control type="number" size="sm" value={selectedElement.style?.borderRadius || 0} onChange={e => onUpdateElement(selectedElement.id, { style: { ...selectedElement.style, borderRadius: parseInt(e.target.value, 10) } })} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label size="sm">Opacity</Form.Label>
              <Form.Range min="0" max="100" value={Math.round((selectedElement.style?.opacity ?? 1) * 100)} onChange={e => onUpdateElement(selectedElement.id, { style: { ...selectedElement.style, opacity: parseInt(e.target.value, 10) / 100 } })} />
            </Form.Group>
          </>
        )}
        {selectedElement && selectedElement.type === 'category' && (
          <>
            <Form.Group className="mb-2">
              <Form.Label size="sm">Font Size</Form.Label>
              <Form.Control type="number" size="sm" value={selectedElement.style?.fontSize || 14} onChange={e => onUpdateElement(selectedElement.id, { style: { ...selectedElement.style, fontSize: parseInt(e.target.value, 10) } })} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label size="sm">Text Color</Form.Label>
              <Form.Control type="color" size="sm" value={selectedElement.style?.color || '#FFFFFF'} onChange={e => onUpdateElement(selectedElement.id, { style: { ...selectedElement.style, color: e.target.value } })} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label size="sm">Background Color</Form.Label>
              <Form.Control type="color" size="sm" value={selectedElement.style?.backgroundColor || '#3B82F6'} onChange={e => onUpdateElement(selectedElement.id, { style: { ...selectedElement.style, backgroundColor: e.target.value } })} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label size="sm">Border Radius</Form.Label>
              <Form.Control type="number" size="sm" value={selectedElement.style?.borderRadius || 16} onChange={e => onUpdateElement(selectedElement.id, { style: { ...selectedElement.style, borderRadius: parseInt(e.target.value, 10) } })} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label size="sm">Padding</Form.Label>
              <Form.Control type="number" size="sm" value={selectedElement.style?.padding || 5} onChange={e => onUpdateElement(selectedElement.id, { style: { ...selectedElement.style, padding: parseInt(e.target.value, 10) } })} />
            </Form.Group>
          </>
        )}
      </Card.Body>
      <Card.Footer className="text-end">
        <Button 
          variant="outline-danger" 
          size="sm" 
          onClick={() => onDeleteElement(selectedElement.id)}
          disabled={!onDeleteElement}
        >
          <FaTrash className="me-2" /> Delete Element
        </Button>
      </Card.Footer>
    </Card>
  );
};

export default ElementPropertiesEditor; 