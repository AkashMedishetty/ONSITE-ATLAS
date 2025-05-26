import React, { useEffect, useState } from 'react';
import { Card, Button, Modal, Form } from 'react-bootstrap';
import badgeTemplateService from '../../services/badgeTemplateService';
import { FaCopy, FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import { toast } from 'react-toastify';
import defaultBadgeTemplate from './DefaultBadgeTemplate';

/**
 * Badge Template List Component
 * Displays a list of available badge templates with options to create, edit, duplicate, and delete
 */
const BadgeTemplateList = ({ 
  eventId, 
  onSelectTemplate, 
  selectedTemplateId = null,
  showCreateButton = true
}) => {
  console.log('[BadgeTemplateList] Received eventId prop:', eventId);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    isGlobal: false
  });
  const [isEditing, setIsEditing] = useState(false);

  // Load templates when component mounts or eventId changes
  useEffect(() => {
    loadTemplates();
  }, [eventId]);

  // Load templates from API
  const loadTemplates = async () => {
    setLoading(true);
    try {
      const response = await badgeTemplateService.getTemplates(eventId);
      if (response.success) {
        // Defensive: ensure templates is always an array
        let arr = [];
        if (Array.isArray(response.data)) {
          arr = response.data;
        } else if (response.data && Array.isArray(response.data.data)) {
          arr = response.data.data;
        }
        setTemplates(arr);
      } else {
        toast.error('Failed to load badge templates');
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('An error occurred while loading templates');
      setTemplates([]); // Defensive fallback
    } finally {
      setLoading(false);
    }
  };

  // Handle template selection
  const handleSelectTemplate = (template) => {
    if (onSelectTemplate) {
      onSelectTemplate(template);
    }
  };

  // Open create template modal
  const handleCreateTemplate = () => {
    setTemplateForm({
      name: '',
      description: '',
      isGlobal: false
    });
    setIsEditing(false);
    setShowTemplateModal(true);
  };

  // Open edit template modal
  const handleEditTemplate = (template) => {
    setTemplateForm({
      id: template._id,
      name: template.name,
      description: template.description || '',
      isGlobal: template.isGlobal || false
    });
    setIsEditing(true);
    setShowTemplateModal(true);
  };

  // Handle template form change
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setTemplateForm({
      ...templateForm,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Handle template save
  const handleSaveTemplate = async () => {
    setLoading(true);
    setError(null);

    // Safeguard: Check if eventId is present
    console.log('[BadgeTemplateList] handleSaveTemplate eventId BEFORE check:', eventId);
    if (!eventId) {
      console.error('[BadgeTemplateList] Event ID is missing. Cannot save template.');
      toast.error('Event ID is missing. Cannot save template.');
      return;
    }

    try {
      let response;
      
      if (isEditing) {
        response = await badgeTemplateService.updateTemplate(templateForm.id, {
          name: templateForm.name,
          description: templateForm.description,
          isGlobal: templateForm.isGlobal
        });
      } else {
        // Use the default badge template as the base and override with form values
        const templateData = {
          ...defaultBadgeTemplate,
          name: templateForm.name,
          description: templateForm.description,
          isGlobal: templateForm.isGlobal,
          event: eventId, 
          elements: [] // <-- Start with no elements!
        };
        console.log('[BadgeTemplateList] Creating new template with payload:', templateData);
        response = await badgeTemplateService.createTemplate(templateData);
      }
      
      if (response.success) {
        toast.success(`Template ${isEditing ? 'updated' : 'created'} successfully`);
        setShowTemplateModal(false);
        loadTemplates(); // Reload the list to show the new template
      } else {
        toast.error(response.message || `Failed to ${isEditing ? 'update' : 'create'} template`);
      }
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('An error occurred while saving template');
    } finally {
      setLoading(false);
    }
  };

  // Handle duplicate template
  const handleDuplicateTemplate = async (template) => {
    try {
      const response = await badgeTemplateService.duplicateTemplate(template._id, eventId);
      if (response.success) {
        toast.success('Template duplicated successfully');
        loadTemplates();
      } else {
        toast.error(response.message || 'Failed to duplicate template');
      }
    } catch (error) {
      console.error('Error duplicating template:', error);
      toast.error('An error occurred while duplicating template');
    }
  };

  // Open delete confirmation modal
  const handleDeleteClick = (template) => {
    setTemplateToDelete(template);
    setShowDeleteModal(true);
  };

  // Handle delete template
  const handleDeleteTemplate = async () => {
    if (!templateToDelete) return;
    
    try {
      const response = await badgeTemplateService.deleteTemplate(templateToDelete._id);
      if (response.success) {
        toast.success('Template deleted successfully');
        setShowDeleteModal(false);
        loadTemplates();
      } else {
        toast.error(response.message || 'Failed to delete template');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('An error occurred while deleting template');
    }
  };

  return (
    <div className="badge-template-list">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="m-0">Badge Templates</h5>
        {showCreateButton && (
          <Button 
            size="sm" 
            variant="primary" 
            onClick={handleCreateTemplate}
          >
            <FaPlus className="me-1" /> New Template
          </Button>
        )}
      </div>
      
      {loading ? (
        <div className="text-center py-4">Loading templates...</div>
      ) : !Array.isArray(templates) || templates.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-muted">No templates available</p>
          {showCreateButton && (
            <Button 
              variant="outline-primary" 
              size="sm" 
              onClick={handleCreateTemplate}
            >
              Create Your First Template
            </Button>
          )}
        </div>
      ) : (
        <div className="row g-3">
          {(templates || []).map(template => (
            <div key={template._id} className="col-md-6 col-lg-4">
              <Card 
                className={`h-100 ${selectedTemplateId === template._id ? 'border-primary' : ''}`}
                onClick={() => handleSelectTemplate(template)}
                style={{ cursor: 'pointer' }}
              >
                <Card.Body>
                  <Card.Title className="d-flex justify-content-between align-items-start">
                    <div>{template.name}</div>
                    {template.isGlobal && (
                      <span className="badge bg-info text-white">Global</span>
                    )}
                  </Card.Title>
                  {template.description && (
                    <Card.Text className="text-muted small">
                      {template.description}
                    </Card.Text>
                  )}
                </Card.Body>
                <Card.Footer className="d-flex justify-content-end bg-white">
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="text-primary p-1" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditTemplate(template);
                    }}
                    title="Edit template"
                  >
                    <FaEdit />
                  </Button>
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="text-success p-1" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDuplicateTemplate(template);
                    }}
                    title="Duplicate template"
                  >
                    <FaCopy />
                  </Button>
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="text-danger p-1" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(template);
                    }}
                    title="Delete template"
                  >
                    <FaTrash />
                  </Button>
                </Card.Footer>
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete the template "{templateToDelete?.name}"? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteTemplate}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Template Form Modal */}
      <Modal show={showTemplateModal} onHide={() => setShowTemplateModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{isEditing ? 'Edit Template' : 'Create New Template'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Template Name</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={templateForm.name}
                onChange={handleFormChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={templateForm.description}
                onChange={handleFormChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Make this template available to all events (global)"
                name="isGlobal"
                checked={templateForm.isGlobal}
                onChange={handleFormChange}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowTemplateModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSaveTemplate}
            disabled={!templateForm.name.trim()}
          >
            {isEditing ? 'Save Changes' : 'Create Template'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default BadgeTemplateList; 