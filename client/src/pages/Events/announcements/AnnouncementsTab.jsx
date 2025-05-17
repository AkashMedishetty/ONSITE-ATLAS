import React, { useState, useEffect, useCallback } from 'react';
import { Button, Table, Badge, Modal, Form, Spinner, Alert, Row, Col } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import { announcementService } from '../../../services'; // Adjust path if necessary
import { toast } from 'react-hot-toast';
import { formatDate } from '../../../utils/dateUtils'; // Adjust path if necessary

// Simple Rich Text Editor (Placeholder - consider a library like react-quill or Slate.js for real use)
const SimpleRichTextEditor = ({ value, onChange, placeholder }) => {
  return (
    <Form.Control 
      as="textarea" 
      rows={5} 
      value={value} 
      onChange={e => onChange(e.target.value)} 
      placeholder={placeholder || "Enter content..."}
    />
  );
};

const AnnouncementsTab = ({ eventId }) => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentAnnouncement, setCurrentAnnouncement] = useState(null);
  
  const [formState, setFormState] = useState({
    title: '',
    content: '',
    deadline: '',
    isActive: true,
  });

  const fetchAnnouncements = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await announcementService.getAnnouncementsByEvent(eventId, { limit: 100 });
      if (response.success) {
        setAnnouncements(response.data || []);
      } else {
        throw new Error(response.message || 'Failed to fetch announcements');
      }
    } catch (err) {
      console.error("Error fetching announcements:", err);
      setError(err.message);
      toast.error(`Error fetching announcements: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleModalOpen = (announcementToEdit = null) => {
    if (announcementToEdit) {
      setIsEditing(true);
      setCurrentAnnouncement(announcementToEdit);
      setFormState({
        title: announcementToEdit.title,
        content: announcementToEdit.content,
        deadline: announcementToEdit.deadline ? new Date(announcementToEdit.deadline).toISOString().split('T')[0] : '',
        isActive: announcementToEdit.isActive,
      });
    } else {
      setIsEditing(false);
      setCurrentAnnouncement(null);
      setFormState({ title: '', content: '', deadline: '', isActive: true });
    }
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setIsEditing(false);
    setCurrentAnnouncement(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormState(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };
  
  const handleContentChange = (contentValue) => {
    setFormState(prev => ({
        ...prev,
        content: contentValue
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!eventId) {
      toast.error("Event ID is missing, cannot submit announcement.");
      return;
    }
    const toastId = toast.loading(isEditing ? 'Updating announcement...' : 'Creating announcement...');
    try {
      const payload = { 
        ...formState, 
        deadline: formState.deadline ? new Date(formState.deadline).toISOString() : null 
      };

      let response;
      if (isEditing && currentAnnouncement?._id) {
        response = await announcementService.updateAnnouncement(eventId, currentAnnouncement._id, payload);
      } else {
        response = await announcementService.createAnnouncement(eventId, payload);
      }

      if (response.success) {
        toast.success(`Announcement ${isEditing ? 'updated' : 'created'} successfully!`);
        fetchAnnouncements();
        handleModalClose();
      } else {
        throw new Error(response.message || 'Operation failed');
      }
    } catch (err) {
      console.error("Error submitting announcement:", err);
      toast.error(err.message || `Failed to ${isEditing ? 'update' : 'create'} announcement.`);
    } finally {
      toast.dismiss(toastId);
    }
  };
  
  const handleToggleActive = async (announcement) => {
    if (!eventId || !announcement?._id) {
        toast.error("Missing Event ID or Announcement ID to toggle status.");
        return;
    }
    const newStatus = !announcement.isActive;
    const toastId = toast.loading('Updating status...');
    try {
        const response = await announcementService.updateAnnouncement(eventId, announcement._id, { isActive: newStatus });
        if (response.success) {
            toast.success('Status updated!');
            fetchAnnouncements();
        } else {
            throw new Error(response.message || 'Failed to update status');
        }
    } catch (err) {
        console.error("Error toggling active status:", err);
        toast.error(err.message);
    } finally {
        toast.dismiss(toastId);
    }
  };

  const handleDelete = async (announcementToDelete) => {
    if (!eventId || !announcementToDelete?._id) {
        toast.error("Missing Event ID or Announcement ID to delete.");
        return;
    }
    if (window.confirm(`Are you sure you want to delete the announcement: "${announcementToDelete.title}"?`)) {
        const toastId = toast.loading('Deleting announcement...');
        try {
            const response = await announcementService.deleteAnnouncement(eventId, announcementToDelete._id);
            if (response.success) {
                toast.success('Announcement deleted!');
                fetchAnnouncements();
            } else {
                throw new Error(response.message || 'Failed to delete');
            }
        } catch (err) {
            console.error("Error deleting announcement:", err);
            toast.error(err.message);
        } finally {
            toast.dismiss(toastId);
        }
    }
  };

  if (loading) {
    return <div className="d-flex justify-content-center align-items-center p-5"><Spinner animation="border" /> Loading Announcements...</div>;
  }

  if (error && !announcements.length) { // Show error prominently if no data is loaded
    return <Alert variant="danger" className="m-3">Error loading announcements: {error}</Alert>;
  }

  return (
    <div className="p-3">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="h4">Event Announcements</h2>
        <Button variant="primary" onClick={() => handleModalOpen()}> 
          <FaPlus className="me-2" /> Create New
        </Button>
      </div>

      {error && <Alert variant="warning" className="mb-3">Partial data shown due to an error: {error}</Alert>} 

      {announcements.length === 0 && !loading && !error ? (
        <Alert variant="info">No announcements found for this event. Get started by creating one!</Alert>
      ) : (
        <Table striped bordered hover responsive size="sm" className="announcements-table">
          <thead className="table-light">
            <tr>
              <th>Title</th>
              <th>Content Snippet</th>
              <th>Deadline</th>
              <th>Status</th>
              <th>Posted By</th>
              <th>Created At</th>
              <th style={{width: '150px'}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {announcements.map(ann => (
              <tr key={ann._id}>
                <td>{ann.title}</td>
                <td>{ann.content?.substring(0, 75)}{ann.content?.length > 75 ? '...' : ''}</td>
                <td>{ann.deadline ? formatDate(ann.deadline, 'PPP') : <span className="text-muted">N/A</span>}</td>
                <td>
                  <Badge pill bg={ann.isActive ? 'success' : 'secondary'} className="cursor-pointer" onClick={() => handleToggleActive(ann)} title={ann.isActive ? "Click to Deactivate" : "Click to Activate"}>
                    {ann.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </td>
                <td>{ann.postedBy?.name || <span className="text-muted">N/A</span>}</td>
                <td>{formatDate(ann.createdAt)}</td>
                <td>
                  <Button variant="outline-primary" size="sm" className="me-1 mb-1 mb-md-0" onClick={() => handleModalOpen(ann)} title="Edit">
                    <FaEdit />
                  </Button>
                  <Button variant="outline-danger" size="sm" className="mb-1 mb-md-0" onClick={() => handleDelete(ann)} title="Delete">
                    <FaTrash />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <Modal show={showModal} onHide={handleModalClose} size="lg" backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>{isEditing ? 'Edit' : 'Create'} Announcement</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3" controlId="announcementTitle">
              <Form.Label>Title <span className="text-danger">*</span></Form.Label>
              <Form.Control 
                type="text" 
                name="title" 
                value={formState.title} 
                onChange={handleInputChange} 
                required 
                placeholder="Enter a clear and concise title"
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="announcementContent">
              <Form.Label>Content <span className="text-danger">*</span></Form.Label>
              <SimpleRichTextEditor 
                value={formState.content} 
                onChange={handleContentChange} 
                placeholder="Provide the full details of the announcement here..."
              />
            </Form.Group>
            <Row>
                <Col md={6}>
                    <Form.Group className="mb-3" controlId="announcementDeadline">
                    <Form.Label>Deadline (Optional)</Form.Label>
                    <Form.Control 
                        type="date" 
                        name="deadline" 
                        value={formState.deadline} 
                        onChange={handleInputChange} 
                    />
                    </Form.Group>
                </Col>
                <Col md={6}>
                    <Form.Group className="mb-3 mt-md-4 pt-md-2" controlId="announcementIsActive">
                    <Form.Check 
                        type="switch" 
                        id="isActiveSwitch"
                        label="Active (Visible to registrants)" 
                        name="isActive" 
                        checked={formState.isActive} 
                        onChange={handleInputChange} 
                    />
                    </Form.Group>
                </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleModalClose}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}> 
              {loading ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-1" /> : null}
              {isEditing ? 'Save Changes' : 'Create Announcement'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default AnnouncementsTab; 