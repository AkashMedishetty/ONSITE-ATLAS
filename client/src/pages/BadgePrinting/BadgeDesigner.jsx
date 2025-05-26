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
import { nanoid } from 'nanoid';

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
    category: { name: 'Attendee', color: '#3B82F6' },
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
  
  // Add state for activeAccordionKeys
  const [activeAccordionKeys, setActiveAccordionKeys] = useState([]);
  
  // Drag state
  const dragInfoRef = useRef(null);

  // Add at the top-level of the component, after other state declarations
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);

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
  
  // --- Validation function ---
  const VALID_TYPES = ['text', 'image', 'qrCode', 'shape', 'category'];
  const VALID_FIELD_TYPES = ['name', 'organization', 'registrationId', 'category', 'country', 'custom', 'qrCode', 'image', 'shape'];
  function validateTemplate(template) {
    const ids = new Set();
    for (const el of template.elements) {
      if (!el.id || !el.type || !el.fieldType || !el.position) {
        toast.error('All elements must have id, type, fieldType, and position.');
        return false;
      }
      if (!VALID_TYPES.includes(el.type)) {
        toast.error(`Element type '${el.type}' is not valid.`);
        return false;
      }
      if (!VALID_FIELD_TYPES.includes(el.fieldType)) {
        toast.error(`Element fieldType '${el.fieldType}' is not valid.`);
        return false;
      }
      if (ids.has(el.id)) {
        toast.error('Duplicate element IDs found.');
        return false;
      }
      ids.add(el.id);
    }
    // Overlap detection (simple bounding box check)
    for (let i = 0; i < template.elements.length; i++) {
      const a = template.elements[i];
      if (!a.size) continue;
      for (let j = i + 1; j < template.elements.length; j++) {
        const b = template.elements[j];
        if (!b.size) continue;
        if (
          a.position.x < b.position.x + b.size.width &&
          a.position.x + a.size.width > b.position.x &&
          a.position.y < b.position.y + b.size.height &&
          a.position.y + a.size.height > b.position.y
        ) {
          toast.warn('Some elements overlap. Please adjust their positions.');
          // Not a hard error, just a warning
        }
      }
    }
    return true;
  }
  
  // Save template to database
  const handleSaveTemplate = async () => {
    if (!validateTemplate(template)) return;
    setSaving(true);
    try {
      let response;
      if (templateId) {
        response = await badgeTemplateService.updateTemplate(templateId, template);
      } else {
        response = await badgeTemplateService.createTemplate(template);
      }
      if (response.success) {
        toast.success('Template saved successfully');
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
    let newX = initialElementX + (deltaX / scale);
    let newY = initialElementY + (deltaY / scale);
    // Prevent out of bounds
    const badgeWidth = (template.size.width || 0) * (template.unit === 'in' ? 100 : template.unit === 'cm' ? 39.37 : template.unit === 'mm' ? 3.937 : 1);
    const badgeHeight = (template.size.height || 0) * (template.unit === 'in' ? 100 : template.unit === 'cm' ? 39.37 : template.unit === 'mm' ? 3.937 : 1);
    const draggedEl = elementBeingDraggedRef.current;
    const elWidth = draggedEl.size?.width || 0;
    const elHeight = draggedEl.size?.height || 0;
    newX = Math.max(0, Math.min(newX, badgeWidth - elWidth));
    newY = Math.max(0, Math.min(newY, badgeHeight - elHeight));
    const draggedId = draggedEl.id;
    setTemplate(prevTemplate => {
      return {
        ...prevTemplate,
        elements: prevTemplate.elements.map(el => 
          el.id === draggedId ? { ...el, position: { x: Math.round(newX), y: Math.round(newY) } } : el
        )
      };
    });
  }, [scale, setTemplate, template.size, template.unit]);

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
    const id = nanoid();
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
          fieldType: 'category',
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
    // Prevent overlap: check if new element overlaps any existing
    const overlaps = template.elements.some(el => {
      if (!el.size) return false;
      return (
        newElement.position.x < el.position.x + el.size.width &&
        newElement.position.x + newElement.size.width > el.position.x &&
        newElement.position.y < el.position.y + el.size.height &&
        newElement.position.y + newElement.size.height > el.position.y
      );
    });
    if (overlaps) {
      toast.warn('New element overlaps an existing element. Please move it after adding.');
    }
    setTemplate(prevTemplate => {
      const updatedElements = [...(prevTemplate.elements || []), newElement];
      const nextTemplateState = { ...prevTemplate, elements: updatedElements };
      stableAddToHistory(nextTemplateState);
      // Select the new element from the updated elements
      setSelectedElement(updatedElements.find(el => el.id === id));
      return nextTemplateState;
    });
    console.log("Added element:", newElement, "Current elements:", template.elements); 
  }, [template.elements, stableAddToHistory, setSelectedElement, setTemplate]);

  const handleUpdateElement = useCallback((elementId, updates) => {
    // Input validation for size and style
    if (updates.size) {
      if (updates.size.width !== undefined && updates.size.width <= 0) {
        toast.error('Width must be positive.');
        return;
      }
      if (updates.size.height !== undefined && updates.size.height <= 0) {
        toast.error('Height must be positive.');
        return;
      }
    }
    if (updates.style) {
      if (updates.style.fontSize !== undefined && updates.style.fontSize <= 0) {
        toast.error('Font size must be positive.');
        return;
      }
      if (updates.style.borderWidth !== undefined && updates.style.borderWidth < 0) {
        toast.error('Border width cannot be negative.');
        return;
      }
      if (updates.style.borderRadius !== undefined && updates.style.borderRadius < 0) {
        toast.error('Border radius cannot be negative.');
        return;
      }
      if (updates.style.opacity !== undefined && (updates.style.opacity < 0 || updates.style.opacity > 1)) {
        toast.error('Opacity must be between 0 and 1.');
        return;
      }
      if (updates.style.padding !== undefined && updates.style.padding < 0) {
        toast.error('Padding cannot be negative.');
        return;
      }
    }
    setTemplate(prevTemplate => {
      const updatedElements = prevTemplate.elements.map(el => 
        el.id === elementId ? { ...el, ...updates, style: {...el.style, ...updates.style}, size: {...el.size, ...updates.size} } : el
      );
      const newTemplateState = { ...prevTemplate, elements: updatedElements };
      stableAddToHistory(newTemplateState);
      setSelectedElement(updatedElements.find(el => el.id === elementId));
      return newTemplateState;
    });
  }, [setTemplate, stableAddToHistory, setSelectedElement]);

  const handleDeleteElement = useCallback((elementId) => {
    if (!window.confirm('Are you sure you want to delete this element?')) return;
    setTemplate(prevTemplate => {
      const updatedElements = prevTemplate.elements.filter(el => el.id !== elementId);
      const newTemplateState = { ...prevTemplate, elements: updatedElements };
      stableAddToHistory(newTemplateState);
      return newTemplateState;
    });
    setSelectedElement(prev => (prev && prev.id === elementId ? null : prev));
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

  // Guarantee selectedElement is always in sync with template.elements
  useEffect(() => {
    if (!selectedElement) return;
    // Only update if the element is missing or has changed reference
    const latest = template.elements.find(el => el.id === selectedElement.id);
    if (!latest) {
      if (template.elements.length > 0) {
        setSelectedElement(template.elements[0]);
      } else {
        setSelectedElement(null);
      }
    } else if (latest !== selectedElement) {
      setSelectedElement(latest);
    }
  }, [template.elements]);

  // Add a simple preview for elements-based templates
  const renderElementsPreview = () => {
    if (!template.elements || template.elements.length === 0) {
      return (
        <div className="empty-badge-placeholder">
          <span>Badge is blank.<br/>Add elements from the left panel.</span>
        </div>
      );
    }
    // Use badge size and unit for scaling
    const DPIN = 100;
    let badgeWidthPx, badgeHeightPx;
    if (template.unit === 'in') {
      badgeWidthPx = (template.size.width || 0) * DPIN;
      badgeHeightPx = (template.size.height || 0) * DPIN;
    } else if (template.unit === 'cm') {
      badgeWidthPx = (template.size.width || 0) * (DPIN / 2.54);
      badgeHeightPx = (template.size.height || 0) * (DPIN / 2.54);
    } else if (template.unit === 'mm') {
      badgeWidthPx = (template.size.width || 0) * (DPIN / 25.4);
      badgeHeightPx = (template.size.height || 0) * (DPIN / 25.4);
    } else {
      badgeWidthPx = (template.size.width || 0);
      badgeHeightPx = (template.size.height || 0);
    }
    const scalePx = scale;
    const style = {
      width: `${badgeWidthPx * scalePx}px`,
      height: `${badgeHeightPx * scalePx}px`,
      background: template.background || '#fff',
      position: 'relative',
      overflow: 'hidden',
      border: '1px dashed #ccc',
      margin: '0 auto',
    };
    return (
      <div style={style} className="badge-template-elements-preview">
        {template.elements.map(el => {
          const elStyle = {
            position: 'absolute',
            left: (el.position?.x || 0) * scalePx,
            top: (el.position?.y || 0) * scalePx,
            width: (el.size?.width || 100) * scalePx,
            height: (el.size?.height || 30) * scalePx,
            fontSize: (el.style?.fontSize || 16) * scalePx,
            color: el.style?.color || '#000',
            background: el.style?.backgroundColor || 'transparent',
            borderRadius: el.style?.borderRadius || 0,
            border: '1px solid #eee',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            zIndex: el.zIndex || 1,
          };
          // Remove key from mouseDownProps
          const mouseDownProps = {
            onMouseDown: (e) => handleElementMouseDown(el, e),
            style: elStyle,
            className: selectedElement && selectedElement.id === el.id ? 'badge-element selected' : 'badge-element',
          };
          if (el.type === 'text') {
            return <div key={el.id} {...mouseDownProps}>{el.content || 'Text'}</div>;
          }
          if (el.type === 'category') {
            return <div key={el.id} {...mouseDownProps}>{sampleRegistration.category?.name || 'Category'}</div>;
          }
          if (el.type === 'qrCode') {
            return <div key={el.id} {...mouseDownProps}><span>QR</span></div>; // TODO: Render QRCode
          }
          if (el.type === 'image') {
            return <img key={el.id} {...mouseDownProps} src={el.content} alt="img" style={{...elStyle, objectFit: 'contain'}} />;
          }
          if (el.type === 'shape') {
            return <div key={el.id} {...mouseDownProps} />;
          }
          return null;
        })}
      </div>
    );
  };

  const handleElementMouseDown = (el, e) => {
    e.stopPropagation();
    setSelectedElement(el);
    setActiveAccordionKeys([el.type + '-style']);
    dragInfoRef.current = {
      id: el.id,
      startX: e.clientX,
      startY: e.clientY,
      origX: el.position?.x || 0,
      origY: el.position?.y || 0
    };
    document.addEventListener('mousemove', handleElementMouseMove);
    document.addEventListener('mouseup', handleElementMouseUp);
  };

  const handleElementMouseMove = (e) => {
    if (!dragInfoRef.current) return;
    const { id, startX, startY, origX, origY } = dragInfoRef.current;
    const dx = (e.clientX - startX) / scale;
    const dy = (e.clientY - startY) / scale;
    setTemplate(prevTemplate => {
      const updatedElements = prevTemplate.elements.map(el =>
        el.id === id ? { ...el, position: { x: Math.max(0, origX + dx), y: Math.max(0, origY + dy) } } : el
      );
      return { ...prevTemplate, elements: updatedElements };
    });
  };

  const handleElementMouseUp = () => {
    dragInfoRef.current = null;
    document.removeEventListener('mousemove', handleElementMouseMove);
    document.removeEventListener('mouseup', handleElementMouseUp);
  };

  // Add this function inside the component
  const handleSelectTemplateFromLibrary = (newTemplate) => {
    setTemplate(newTemplate);
    if (newTemplate.elements && newTemplate.elements.length > 0) {
      setSelectedElement(newTemplate.elements[0]);
    } else {
      setSelectedElement(null);
    }
    setShowTemplateLibrary(false);
    stableAddToHistory(newTemplate);
  };

  if (loading) return <Container className="py-5 text-center"><Spinner animation="border" /> Loading Designer...</Container>;

  return (
    <div className="badge-designer-container bg-light print-badge-designer">
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
          <Button variant="outline-info" size="sm" className="me-2" onClick={() => setShowTemplateLibrary(true)}>
            <FaLayerGroup className="me-1" /> Template Library
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
              onClick={e => {
                if (e.target === e.currentTarget) setSelectedElement(null);
              }}
            >
              {renderElementsPreview()}
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
            activeAccordionKeys={activeAccordionKeys}
            setActiveAccordionKeys={setActiveAccordionKeys}
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
                  <Form.Control size="sm" type="text" value={sampleRegistration.category.name} onChange={(e) => setSampleRegistration(s => ({...s, category: { ...s.category, name: e.target.value } }))} />
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Label className="small">Category Color</Form.Label>
                  <Form.Control size="sm" type="color" value={sampleRegistration.category.color} onChange={(e) => setSampleRegistration(s => ({...s, category: { ...s.category, color: e.target.value } }))} />
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

      {/* Just before the main return, add this modal/panel for the template library: */}
      {showTemplateLibrary && (
        <div className="template-library-modal-overlay">
          <div className="template-library-modal">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h5 className="m-0">Select a Badge Template</h5>
              <Button size="sm" variant="outline-secondary" onClick={() => setShowTemplateLibrary(false)}>Close</Button>
            </div>
            <BadgeTemplateList 
              eventId={eventId}
              onSelectTemplate={handleSelectTemplateFromLibrary}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default BadgeDesigner; 