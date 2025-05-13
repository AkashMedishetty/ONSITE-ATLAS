import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Form, Row, Col, Card, Accordion, Button } from 'react-bootstrap';
import { FaTrash } from 'react-icons/fa';

const ElementPropertiesEditor = ({ selectedElement, onUpdateElement, onDeleteElement, eventId }) => {
  const [activeAccordionKeys, setActiveAccordionKeys] = useState([]);
  const prevSelectedElementIdRef = useRef(null);
  const lastPositionRef = useRef(null);
  const ignoreNextToggleRef = useRef(false);
  const ignoreToggleTimeoutRef = useRef(null);

  useEffect(() => {
    const currentSelectedId = selectedElement ? selectedElement.id : null;
    if (currentSelectedId !== prevSelectedElementIdRef.current) {
      if (selectedElement && typeof selectedElement === 'object' && selectedElement.type) {
        setActiveAccordionKeys([`${selectedElement.type}-style`]);
      } else {
        setActiveAccordionKeys([]); 
      }
    }
    prevSelectedElementIdRef.current = currentSelectedId;
  }, [selectedElement]);

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
  
  const textPropertiesContent = useMemo(() => {
    if (!selectedElement || typeof selectedElement !== 'object' || selectedElement.type !== 'text') return null;
    console.log('[ElementPropertiesEditor] useMemo for textPropertiesContent. Selected Element:', selectedElement);
    const fontFamilies = [
      'Arial', 'Verdana', 'Helvetica', 'Tahoma', 'Trebuchet MS', 'Times New Roman', 
      'Georgia', 'Garamond', 'Courier New', 'Brush Script MT'
    ];
    const fontWeights = [
      { label: 'Normal', value: 'normal' },
      { label: 'Bold', value: 'bold' },
      { label: 'Lighter', value: 'lighter' },
      { label: 'Bolder', value: 'bolder' },
      { label: '300', value: '300' }, { label: '400', value: '400' }, { label: '500', value: '500' },
      { label: '600', value: '600' }, { label: '700', value: '700' }
    ];

    const fieldTypeOptions = [
      { label: 'Custom Text', value: 'custom' },
      { label: 'Full Name', value: 'name' },
      { label: 'First Name', value: 'firstName' },
      { label: 'Last Name', value: 'lastName' },
      { label: 'Registration ID', value: 'registrationId' },
      { label: 'Category', value: 'categoryName' },
      { label: 'Organization', value: 'organization' },
      { label: 'Country', value: 'country' },
      { label: 'Email', value: 'email' },
    ];

    return (
      <Accordion.Item eventKey="text-style" key="text-properties-item">
        <Accordion.Header onClick={(e) => e.stopPropagation()}>Text Properties</Accordion.Header>
        <Accordion.Body>
          <p>Test Content inside Text Properties</p>
          {/* Original complex form content commented out for now
          <Form.Group className="mb-3">
            <Form.Label size="sm">Text Source</Form.Label>
            <Form.Select 
              size="sm" 
              value={selectedElement.fieldType || 'custom'} 
              onChange={(e) => {
                const newFieldType = e.target.value;
                // When changing to a dynamic field, clear custom content.
                // When changing to custom, preserve current content or set to default.
                const newContent = newFieldType === 'custom' ? (selectedElement.content || 'Custom Text') : '';
                onUpdateElement(selectedElement.id, { fieldType: newFieldType, content: newContent });
              }}
            >
              {fieldTypeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </Form.Select>
          </Form.Group>

          {selectedElement.fieldType === 'custom' && (
            <Form.Group className="mb-3">
              <Form.Label size="sm">Custom Text Content</Form.Label>
              <Form.Control 
                type="text" 
                size="sm" 
                value={selectedElement.content || ''} 
                onChange={(e) => handleInputChange('content', e.target.value)} 
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
                  onChange={(e) => handleInputChange('style.fontSize', parseInt(e.target.value, 10))} 
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
                  onChange={(e) => handleInputChange('style.color', e.target.value)} 
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label size="sm">Font Family</Form.Label>
            <Form.Select 
              size="sm" 
              value={selectedElement.style?.fontFamily || 'Arial'} 
              onChange={(e) => handleInputChange('style.fontFamily', e.target.value)}
            >
              {fontFamilies.map(font => <option key={font} value={font}>{font}</option>)}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label size="sm">Font Weight</Form.Label>
            <Form.Select 
              size="sm" 
              value={selectedElement.style?.fontWeight || 'normal'} 
              onChange={(e) => handleInputChange('style.fontWeight', e.target.value)}
            >
              {fontWeights.map(weight => <option key={weight.value} value={weight.value}>{weight.label}</option>)}
            </Form.Select>
          </Form.Group>
          
          <Form.Group className="mb-2">
            <Form.Label size="sm">Background Color</Form.Label>
            <Form.Control 
              type="color" 
              size="sm" 
              value={(selectedElement.style?.backgroundColor && selectedElement.style.backgroundColor !== 'transparent' && selectedElement.style.backgroundColor.startsWith('#')) ? selectedElement.style.backgroundColor : '#FFFFFF'} 
              onChange={(e) => handleInputChange('style.backgroundColor', e.target.value)} 
            />
          </Form.Group>
          */}
        </Accordion.Body>
      </Accordion.Item>
    );
  }, [selectedElement, handleInputChange]);

  const qrCodePropertiesContent = useMemo(() => {
    if (!selectedElement || typeof selectedElement !== 'object' || selectedElement.type !== 'qrCode') return null;
    return (
      <Accordion.Item eventKey="qrcode-style" key="qrcode-properties-item">
        <Accordion.Header onClick={(e) => e.stopPropagation()}>QR Code Settings</Accordion.Header>
        <Accordion.Body>
          <Form.Group className="mb-2">
            <Form.Label size="sm">Width (px)</Form.Label>
            <Form.Control 
              type="number" 
              size="sm" 
              value={selectedElement.size?.width || 80} 
              onChange={(e) => handleInputChange('size.width', parseInt(e.target.value, 10))} 
            />
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label size="sm">Height (px)</Form.Label>
            <Form.Control 
              type="number" 
              size="sm" 
              value={selectedElement.size?.height || 80} 
              onChange={(e) => handleInputChange('size.height', parseInt(e.target.value, 10))} 
            />
          </Form.Group>
          <p><em>More QR Code options coming soon...</em></p>
        </Accordion.Body>
      </Accordion.Item>
    );
  }, [selectedElement, handleInputChange]);
  
  const imagePropertiesContent = useMemo(() => {
    if (!selectedElement || typeof selectedElement !== 'object' || selectedElement.type !== 'image') return null;
    return (
      <Accordion.Item eventKey="image-style" key="image-properties-item">
        <Accordion.Header onClick={(e) => e.stopPropagation()}>Image Settings</Accordion.Header>
        <Accordion.Body>
           <Form.Group className="mb-2">
            <Form.Label size="sm">Image URL</Form.Label>
            <Form.Control 
              type="text" 
              size="sm" 
              placeholder="https://example.com/image.png"
              value={selectedElement.content || ''} 
              onChange={(e) => handleInputChange('content', e.target.value)} 
            />
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label size="sm">Width (px)</Form.Label>
            <Form.Control 
              type="number" 
              size="sm" 
              value={selectedElement.size?.width || 100} 
              onChange={(e) => handleInputChange('size.width', parseInt(e.target.value, 10))} 
            />
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label size="sm">Height (px)</Form.Label>
            <Form.Control 
              type="number" 
              size="sm" 
              value={selectedElement.size?.height || 100} 
              onChange={(e) => handleInputChange('size.height', parseInt(e.target.value, 10))} 
            />
          </Form.Group>
          {/* More image style properties (opacity, border-radius) */}
          <p><em>More image options coming soon...</em></p>
        </Accordion.Body>
      </Accordion.Item>
    );
  }, [selectedElement, handleInputChange]);

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
      <Card.Header>Properties: {selectedElement.type} (ID: ...{selectedElement.id.slice(-6)})</Card.Header>
      <Card.Body>
        <Accordion 
          activeKey={activeAccordionKeys} 
          onSelect={(newActiveKeys) => {
            console.log('[Accordion onSelect] Received newActiveKeys:', newActiveKeys);

            // Ignore this toggle if it's happening right after a drag
            if (ignoreNextToggleRef.current) {
              console.log('[Accordion onSelect] Ignoring toggle due to recent drag');
              return;
            }

            const keyToToggle = Array.isArray(newActiveKeys) ? newActiveKeys[0] : newActiveKeys;
            
            setActiveAccordionKeys(currentKeys => {
              console.log('[Accordion onSelect] Current keys:', currentKeys, 'Key to toggle:', keyToToggle);
              if (currentKeys.includes(keyToToggle)) {
                const nextKeys = currentKeys.filter(k => k !== keyToToggle);
                console.log('[Accordion onSelect] Closing. Next keys:', nextKeys);
                return nextKeys;
              } else {
                const nextKeys = [keyToToggle];
                console.log('[Accordion onSelect] Opening. Next keys:', nextKeys);
                return nextKeys;
              }
            });
          }}
          flush
        >
          {textPropertiesContent}
          {qrCodePropertiesContent}
          {imagePropertiesContent}
          {/* Add other types here */}
        </Accordion>
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