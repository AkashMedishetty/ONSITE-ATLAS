import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { FaSave, FaUndo, FaRedo, FaPrint, FaRuler, FaImage, FaFont, FaQrcode, FaShapes, FaArrowLeft, FaPlus, FaPalette, FaListOl, FaLayerGroup } from 'react-icons/fa';
import { toast } from 'react-toastify';
import BadgeTemplate from '../../components/badges/BadgeTemplate';
import BadgeTemplateList from '../../components/badges/BadgeTemplateList';
import BadgeDesignerPart2 from './BadgeDesignerPart2';
import ElementPropertiesEditor from '../../components/badges/ElementPropertiesEditor';
import badgeTemplateService from '../../services/badgeTemplateService';
import eventService from '../../services/eventService';
import defaultBadgeTemplate from '../../components/badges/DefaultBadgeTemplate';
import './BadgeDesigner.css';

/**
 * Badge Designer Component
 * Provides a visual editor for creating and customizing badge templates
 */
const BadgeDesigner = ({ eventId: eventIdProp }) => {
  const { templateId } = useParams();
  const eventId = eventIdProp;
  console.log('[BadgeDesigner] eventId from prop:', eventId, 'templateId from useParams:', templateId);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [eventData, setEventData] = useState(null);
  
  // Template state
  const initialTemplateState = {
    name: 'New Badge Template',
    description: '',
    isGlobal: false,
    event: eventId || null,
    orientation: 'portrait',
    size: { width: 3.375, height: 5.375 },
    unit: 'in',
    background: '#FFFFFF',
    backgroundImage: null,
    logo: null,
    elements: [],
    printSettings: {
      showBorder: true,
      borderWidth: 1,
      borderColor: '#CCCCCC',
      padding: 5,
      margin: 5
    }
  };
  const [template, setTemplate] = useState(initialTemplateState);
  
  // History for undo/redo functionality
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Element state
  const [selectedElement, setSelectedElement] = useState(null);
  const [elementBeingDragged, setElementBeingDragged] = useState(null);
  const [showElementProperties, setShowElementProperties] = useState(false);
  
  // Sample data for preview
  const [sampleRegistration, setSampleRegistration] = useState({
    firstName: 'John',
    lastName: 'Doe',
    organization: 'Acme Corporation',
    registrationId: 'REG-12345',
    category: 'Attendee',
    country: 'United States',
    email: 'john.doe@example.com'
  });
  
  // Canvas refs for coordinate calculations
  const canvasRef = useRef(null);
  const isDraggingRef = useRef(false);
  
  // Dragging state
  const initialDragPositionRef = useRef({ mouseX: 0, mouseY: 0, elementX: 0, elementY: 0 });
  const elementBeingDraggedRef = useRef(null);
  const templateRef = useRef(template);

  const canvasWrapperRef = useRef(null);
  const scale = 1.5;
  
  // Load template or create new one on mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Load event data
        if (eventId) {
          const eventResponse = await eventService.getEventById(eventId);
          if (eventResponse.success && eventResponse.data) {
            setEventData(eventResponse.data);
          }
        }
        
        // Load template if templateId is provided
        if (templateId) {
          const templateResponse = await badgeTemplateService.getTemplateById(templateId);
          if (templateResponse.success && templateResponse.data) {
            setTemplate(templateResponse.data);
            // Initialize history
            stableAddToHistory(templateResponse.data);
          } else {
            // Template not found, create a new one
            toast.warn('Template not found, starting with a new one.');
            const newTemplate = {...initialTemplateState, event: eventId || null, name: `New Badge for ${eventData?.name || eventId}` };
            setTemplate(newTemplate);
            stableAddToHistory(newTemplate);
          }
        } else {
          // No template ID, initialize history with default template
          const newTemplate = {...initialTemplateState, event: eventId || null, name: `New Badge for ${eventData?.name || eventId}` };
          setTemplate(newTemplate);
          stableAddToHistory(newTemplate);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load template data');
        const newTemplate = {...initialTemplateState, event: eventId || null, name: `New Badge for ${eventData?.name || eventId}` };
        setTemplate(newTemplate);
        stableAddToHistory(newTemplate);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [eventId, templateId]);
  
  useEffect(() => {
    templateRef.current = template;
  }, [template]);
  
  // DEBUG: Log template.elements when it changes
  useEffect(() => {
    console.log('[BadgeDesigner] template.elements updated:', JSON.stringify(template.elements));
  }, [template.elements]);
  
  // Stable Add to History (needs to be stable for mouseup handler)
  const stableAddToHistory = useCallback((newHistoryState) => {
    setHistory(prevHistory => {
      const currentHistoryIndex = historyIndexRef.current;
      const nextHistory = prevHistory.slice(0, currentHistoryIndex + 1);
      nextHistory.push(JSON.parse(JSON.stringify(newHistoryState)));
      historyIndexRef.current = nextHistory.length - 1;
      setHistoryIndex(historyIndexRef.current);
      return nextHistory;
    });
  }, [setHistory, setHistoryIndex]);

  // Ref for historyIndex if stableAddToHistory needs it indirectly
  const historyIndexRef = useRef(historyIndex);
  useEffect(() => {
    historyIndexRef.current = historyIndex;
  }, [historyIndex]);
  
  // Update template and add to history
  const updateTemplate = useCallback((updates, addToHist = true) => {
    setTemplate(prevTemplate => {
    const updatedTemplate = {
        ...prevTemplate,
      ...updates
    };
      if (addToHist) {
        stableAddToHistory(updatedTemplate);
      }
      return updatedTemplate;
    });
  }, [setTemplate, stableAddToHistory]);
  
  // Handle undo
  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setTemplate(JSON.parse(JSON.stringify(history[historyIndex - 1])));
    }
  };
  
  // Handle redo
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setTemplate(JSON.parse(JSON.stringify(history[historyIndex + 1])));
    }
  };
  
  // Save template to database
  const handleSaveTemplate = async () => {
    setSaving(true);
    try {
      let response;
      
      if (templateId) {
        // Update existing template
        console.log('[BadgeDesigner] Updating template with ID:', templateId, 'Data:', template);
        response = await badgeTemplateService.updateTemplate(templateId, template);
      } else {
        // Create new template
        console.log('[BadgeDesigner] Creating new template with Data:', template);
        response = await badgeTemplateService.createTemplate(template);
      }
      
      if (response.success) {
        toast.success('Template saved successfully');
        
        // If new template was created, redirect to the template's edit page
        if (!templateId && response.data._id) {
          navigate(`/events/${eventId}/badge-designer/${response.data._id}`);
        }
        stableAddToHistory(template);
      } else {
        toast.error(response.message || 'Failed to save template');
      }
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('An error occurred while saving the template');
    } finally {
      setSaving(false);
    }
  };
  
  // Go back to event page
  const handleBackToEvent = () => {
    navigate(`/events/${eventId}/settings/badges`);
  };
  
  // Handle form field changes
  const handleGenericChange = (key, value, isNested = false, parentKey = null, addToHist = true) => {
    let updates;
    if (isNested && parentKey) {
      updates = { [parentKey]: { ...template[parentKey], [key]: value } };
    } else {
      updates = { [key]: value };
    }
    updateTemplate(updates, false);
  };
  
  // Handle sample data change for preview
  const handleSampleDataChange = (e) => {
    const { name, value } = e.target;
    setSampleRegistration({
      ...sampleRegistration,
      [name]: value
    });
  };
  
  // DRAG AND DROP HANDLERS - REORDERED DEFINITIONS

  const stableMouseMoveHandler = useCallback((event) => {
    console.log('[MouseMoveAttempt] Entered stable handler. isDragging:', isDraggingRef.current, 'elementBeingDragged:', !!elementBeingDraggedRef.current);
    if (!isDraggingRef.current || !elementBeingDraggedRef.current) {
      return;
    }
    event.preventDefault();

    const { mouseX: initialMouseX, mouseY: initialMouseY, 
            elementX: initialElementX, elementY: initialElementY } = initialDragPositionRef.current;
    
    const currentMouseX = event.clientX;
    const currentMouseY = event.clientY;

    const deltaX = currentMouseX - initialMouseX;
    const deltaY = currentMouseY - initialMouseY;

    const newX = initialElementX + (deltaX / scale);
    const newY = initialElementY + (deltaY / scale);
    
    console.log(
      `[Drag] Mouse: ${currentMouseX},${currentMouseY} | ` +
      `InitialMouse: ${initialMouseX},${initialMouseY} | ` +
      `InitialElement: ${initialElementX},${initialElementY} | ` +
      `Delta: ${deltaX},${deltaY} | ScaledDelta: ${(deltaX/scale).toFixed(2)},${(deltaY/scale).toFixed(2)} | ` +
      `NewPos: ${newX.toFixed(2)},${newY.toFixed(2)}`
    );
    
    const draggedId = elementBeingDraggedRef.current.id;
    setTemplate(prevTemplate => {
      return {
        ...prevTemplate,
        elements: prevTemplate.elements.map(el => 
          el.id === draggedId ? { ...el, position: { x: Math.round(newX), y: Math.round(newY) } } : el
        )
      };
    });
  }, [scale, setTemplate]);

  const stableMouseUpHandler = useCallback(() => {
    console.log('[MouseUp] Fired stable handler. Dragging was:', isDraggingRef.current, 'El:', !!elementBeingDraggedRef.current);
    if (isDraggingRef.current && elementBeingDraggedRef.current) {
      stableAddToHistory(templateRef.current); 
    }
    isDraggingRef.current = false;
    elementBeingDraggedRef.current = null; 
    
    document.removeEventListener('mousemove', stableMouseMoveHandler); 
    document.removeEventListener('mouseup', stableMouseUpHandler);
  }, [stableAddToHistory, stableMouseMoveHandler]);

  const handleElementMouseDownOnCanvas = useCallback((draggedElement, event) => {
    if (isDraggingRef.current || !draggedElement || !event) {
      return; 
    }
    event.preventDefault(); 
    
    console.log('[MouseDown] Fired on element:', draggedElement.id);
    
    isDraggingRef.current = true;
    elementBeingDraggedRef.current = draggedElement;
    setSelectedElement(draggedElement);

    const initialMouseX = event.clientX;
    const initialMouseY = event.clientY;
    initialDragPositionRef.current = {
      mouseX: initialMouseX, mouseY: initialMouseY,
      elementX: draggedElement.position.x, elementY: draggedElement.position.y,
    };
    document.addEventListener('mousemove', stableMouseMoveHandler);
    document.addEventListener('mouseup', stableMouseUpHandler);
    console.log('[MouseDown] Drag listeners added.');
  }, [setSelectedElement, stableMouseMoveHandler, stableMouseUpHandler]);

  useEffect(() => { 
    return () => {
      document.removeEventListener('mousemove', stableMouseMoveHandler);
      document.removeEventListener('mouseup', stableMouseUpHandler);
    };
  }, [stableMouseMoveHandler, stableMouseUpHandler]);

  // ELEMENT CREATION LOGIC (Moved and adapted from BadgeDesignerPart2)
  const handleAddElement = useCallback((type) => {
    const id = Date.now().toString();
    let newElementBase = {
      id,
      type,
      position: { x: 50, y: 50 },
      zIndex: (template.elements?.length || 0) + 1,
    };
    let specificProps = {};

    switch (type) {
      case 'text':
        specificProps = {
          fieldType: 'custom',
          content: 'New Text',
          size: { width: 150, height: 30 },
          style: { fontSize: 16, fontFamily: 'Arial', fontWeight: 'normal', color: '#000000', backgroundColor: 'transparent' },
        };
        break;
      case 'qrCode':
        specificProps = {
          fieldType: 'qrCode',
          content: '',
          size: { width: 80, height: 80 },
          style: { backgroundColor: 'transparent', padding: 0 }
        };
        break;
      case 'image':
        specificProps = {
          fieldType: 'image',
          content: '',
          size: { width: 100, height: 100 },
          style: { opacity: 1, borderRadius: 0 },
        };
        break;
      case 'shape':
        specificProps = {
          fieldType: 'shape',
          content: 'rectangle',
          size: { width: 100, height: 50 },
          style: { backgroundColor: '#E5E7EB', borderColor: '#9CA3AF', borderWidth: 1, borderRadius: 0, opacity: 1 },
        };
        break;
      case 'category':
        specificProps = {
            fieldType: 'categoryName',
            content: '',
            size: { width: 120, height: 30 },
            style: { fontSize: 14, fontFamily: 'Arial', fontWeight: 'normal', color: '#FFFFFF', backgroundColor: '#3B82F6', padding: 5, borderRadius: 16, textAlign: 'center' },
        };
        break;
      default:
        console.warn('Unknown element type:', type);
        return;
    }

    const newElement = { ...newElementBase, ...specificProps };
    
    setTemplate(prevTemplate => {
      const updatedElements = [...(prevTemplate.elements || []), newElement];
      const nextTemplateState = { ...prevTemplate, elements: updatedElements };
      stableAddToHistory(nextTemplateState);
      return nextTemplateState;
    });
    setSelectedElement(newElement);
    console.log("Added element:", newElement, "Current elements:", template.elements); 
  }, [template.elements, stableAddToHistory, setSelectedElement, setTemplate]);

  const handleUpdateElement = useCallback((elementId, updates) => {
    setTemplate(prevTemplate => {
      const updatedElements = prevTemplate.elements.map(el => 
        el.id === elementId ? { ...el, ...updates, style: {...el.style, ...updates.style}, size: {...el.size, ...updates.size} } : el
      );
      const newTemplateState = { ...prevTemplate, elements: updatedElements };
      stableAddToHistory(newTemplateState);
      return newTemplateState;
    });
    // If the selected element is being updated, ensure its state is also refreshed
    // This might be an issue if setSelectedElement is called with a stale version after an update.
    // Consider updating selectedElement state directly here IF NEEDED, but often re-render handles it.
    setSelectedElement(prevSelected => prevSelected && prevSelected.id === elementId 
      ? { ...prevSelected, ...updates, style: {...prevSelected.style, ...updates.style}, size: {...prevSelected.size, ...updates.size} } 
      : prevSelected
    );

  }, [setTemplate, stableAddToHistory, setSelectedElement]);

  const handleDeleteElement = useCallback((elementId) => {
    setTemplate(prevTemplate => {
      const updatedElements = prevTemplate.elements.filter(el => el.id !== elementId);
      const newTemplateState = { ...prevTemplate, elements: updatedElements };
      stableAddToHistory(newTemplateState);
      return newTemplateState;
    });
    setSelectedElement(null); // Clear selection as the element is gone
  }, [setTemplate, stableAddToHistory, setSelectedElement]);

  // Add default template elements
  const addDefaultTemplateElements = () => {
    const defaultElements = defaultBadgeTemplate.elements.map(element => ({
      ...element,
      id: `${element.id}-${Date.now()}` // Ensure unique IDs
    }));
    
    setTemplate(prevTemplate => {
      const nextTemplateState = { 
        ...prevTemplate, 
        elements: defaultElements,
        orientation: defaultBadgeTemplate.orientation,
        background: defaultBadgeTemplate.background,
        printSettings: defaultBadgeTemplate.printSettings
      };
      stableAddToHistory(nextTemplateState);
      return nextTemplateState;
    });
    
    toast.success('Default template elements added');
  };

  if (loading) return <Container className="py-5 text-center"><Spinner animation="border" /> Loading Designer...</Container>;

  return (
    <div className="badge-designer-container bg-light">
      {/* Top Bar */}
      <header className="bg-white shadow-sm p-3 d-flex justify-content-between align-items-center">
        <Button variant="outline-secondary" size="sm" onClick={() => navigate(`/events/${eventId}/settings/badges`)}>
          <FaArrowLeft className="me-2" /> Back to Settings
            </Button>
        <h4 className="m-0">Badge Designer {template.name ? `- ${template.name}` : ''}</h4>
        <div className="d-flex align-items-center">
          <Button variant="outline-secondary" size="sm" className="me-2" onClick={handleUndo} disabled={historyIndex <= 0}>
            <FaUndo className="me-1" /> Undo
              </Button>
          <Button variant="outline-secondary" size="sm" className="me-2" onClick={handleRedo} disabled={historyIndex >= history.length - 1}>
            <FaRedo className="me-1" /> Redo
          </Button>
          <Button variant="primary" size="sm" onClick={handleSaveTemplate} disabled={saving}>
                <FaSave className="me-2" /> {saving ? 'Saving...' : 'Save Template'}
          </Button>
        </div>
      </header>

      {/* Main Content Row */}
      <div className="badge-designer-main-row flex-grow-1">
        {/* Left Sidebar */}
        <aside className="badge-designer-left-sidebar">
          <Card className="designer-panel-card mb-3">
            <Card.Header><FaPalette className="me-2" />Template Settings</Card.Header>
            <Card.Body>
              <Form>
                <Form.Group className="mb-2">
                  <Form.Label className="small">Template Name</Form.Label>
                  <Form.Control size="sm" type="text" value={template.name} onChange={(e) => handleGenericChange('name', e.target.value, false, null, false)} />
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Label className="small">Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    name="description"
                    value={template.description || ''}
                    onChange={(e) => handleGenericChange('description', e.target.value, false, null, false)}
                  />
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Label className="small">Orientation</Form.Label>
                  <Form.Select size="sm" value={template.orientation} onChange={(e) => handleGenericChange('orientation', e.target.value, false, null, false)}>
                    <option value="portrait">Portrait</option>
                    <option value="landscape">Landscape</option>
                  </Form.Select>
                </Form.Group>
                <Row>
                  <Col>
                    <Form.Group className="mb-2">
                      <Form.Label className="small">Width</Form.Label>
                      <Form.Control
                        type="number"
                        step="0.125"
                        min="1"
                        name="width"
                        value={template.size.width}
                        onChange={(e) => handleGenericChange('width', parseFloat(e.target.value), true, 'size', false)}
                      />
                    </Form.Group>
                  </Col>
                  <Col>
                    <Form.Group className="mb-2">
                      <Form.Label className="small">Height</Form.Label>
                      <Form.Control
                        type="number"
                        step="0.125"
                        min="1"
                        name="height"
                        value={template.size.height}
                        onChange={(e) => handleGenericChange('height', parseFloat(e.target.value), true, 'size', false)}
                      />
                    </Form.Group>
                  </Col>
                  <Col>
                    <Form.Group className="mb-2">
                      <Form.Label className="small">Unit</Form.Label>
                      <Form.Select
                        size="sm"
                        name="unit"
                        value={template.unit}
                        onChange={(e) => handleGenericChange('unit', e.target.value, false, null, false)}
                      >
                        <option value="in">inches</option>
                        <option value="cm">cm</option>
                        <option value="mm">mm</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
                <Form.Group className="mb-2">
                  <Form.Label className="small">Background Color</Form.Label>
                  <Form.Control size="sm" type="color" value={template.background} onChange={(e) => handleGenericChange('background', e.target.value, false, null, false)} />
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Check
                          type="checkbox"
                    label="Make this template global (available to all events)"
                    name="isGlobal"
                    checked={template.isGlobal}
                    onChange={(e) => handleGenericChange('isGlobal', e.target.checked, false, null, false)}
                  />
                </Form.Group>
              </Form>
            </Card.Body>
          </Card>

          <Card className="designer-panel-card mb-3">
            <Card.Header><FaPlus className="me-2" />Add Elements</Card.Header>
            <Card.Body className="d-grid gap-2">
                <Button variant="outline-primary" size="sm" onClick={() => handleAddElement('text')}><FaFont className="me-2" />Text</Button>
                <Button variant="outline-primary" size="sm" onClick={() => handleAddElement('qrCode')}><FaQrcode className="me-2" />QR Code</Button>
                <Button variant="outline-primary" size="sm" onClick={() => handleAddElement('image')}><FaImage className="me-2" />Image</Button>
                <Button variant="outline-primary" size="sm" onClick={() => handleAddElement('shape')}><FaShapes className="me-2" />Shape</Button>
                <Button variant="outline-primary" size="sm" onClick={() => handleAddElement('category')}><FaListOl className="me-2" />Category</Button>
                <Button variant="outline-success" size="sm" onClick={addDefaultTemplateElements}><FaPlus className="me-2" />Add Default Template</Button>
            </Card.Body>
          </Card>
          
          <Card className="designer-panel-card">
            <Card.Header><FaLayerGroup className="me-2" />Layers</Card.Header>
            <Card.Body className="layers-panel-placeholder">
              Layers Panel (Future)
            </Card.Body>
          </Card>
        </aside>

        {/* Center Canvas Area */}
        <main className="badge-designer-canvas-area">
          <Card className="designer-panel-card badge-preview-wrapper">
            <Card.Body 
              ref={canvasWrapperRef}
              className="badge-preview-canvas-body"
              style={{ position: 'relative', overflow: 'hidden' }}
            >
              {template.elements && template.elements.length === 0 && (
                <div className="empty-badge-placeholder">
                  <FaRuler size={36} className="mb-2" />
                  <p>Badge is blank.</p>
                  <p className="small">Add elements from the left panel.</p>
                </div>
              )}
                <BadgeTemplate
                registrationData={sampleRegistration}
                badgeSettings={template}
                  previewMode={true}
                scale={scale}
                className="badge-visual-preview shadow-lg"
                selectedElementId={selectedElement?.id}
                onElementSelect={(element) => {
                  setSelectedElement(element);
                  console.log("Selected element on canvas:", element);
                }}
                isInteractive={true}
                onElementMouseDown={handleElementMouseDownOnCanvas}
              />
            </Card.Body>
          </Card>
        </main>

        {/* Right Sidebar */}
        <aside className="badge-designer-right-sidebar">
          <ElementPropertiesEditor 
            key={selectedElement ? selectedElement.id : 'no-selection'}
            selectedElement={selectedElement} 
            onUpdateElement={handleUpdateElement} 
            onDeleteElement={handleDeleteElement}
            eventId={eventId}
          />
        
          <Card className="designer-panel-card mb-3">
            <Card.Header>Sample Data</Card.Header>
            <Card.Body>
              <Form>
                <Form.Group className="mb-2">
                  <Form.Label className="small">First Name</Form.Label>
                  <Form.Control size="sm" type="text" value={sampleRegistration.firstName} onChange={(e) => setSampleRegistration(s => ({...s, firstName: e.target.value}))} />
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Label className="small">Last Name</Form.Label>
                  <Form.Control size="sm" type="text" value={sampleRegistration.lastName} onChange={(e) => setSampleRegistration(s => ({...s, lastName: e.target.value}))} />
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Label className="small">Organization</Form.Label>
                  <Form.Control size="sm" type="text" value={sampleRegistration.organization} onChange={(e) => setSampleRegistration(s => ({...s, organization: e.target.value}))} />
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Label className="small">Category</Form.Label>
                  <Form.Control size="sm" type="text" value={sampleRegistration.category} onChange={(e) => setSampleRegistration(s => ({...s, category: e.target.value}))} />
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Label className="small">Registration ID</Form.Label>
                  <Form.Control size="sm" type="text" value={sampleRegistration.registrationId} onChange={(e) => setSampleRegistration(s => ({...s, registrationId: e.target.value}))} />
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Label className="small">Country</Form.Label>
                  <Form.Control size="sm" type="text" value={sampleRegistration.country} onChange={(e) => setSampleRegistration(s => ({...s, country: e.target.value}))} />
                </Form.Group>
              </Form>
            </Card.Body>
          </Card>

          <Card className="designer-panel-card">
            <Card.Header>Print Settings</Card.Header>
            <Card.Body>
              <Form>
                <Form.Group className="mb-2">
                  <Form.Check type="checkbox" size="sm" label="Show Border" checked={template.printSettings.showBorder} onChange={(e) => handleGenericChange('showBorder', e.target.checked, true, 'printSettings', false)} />
                    </Form.Group>
              </Form>
            </Card.Body>
          </Card>
        </aside>
      </div>
    </div>
  );
};

export default BadgeDesigner; 