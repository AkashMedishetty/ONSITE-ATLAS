import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Button, Table, Modal, Form, Input, Space, message, Tooltip, Popconfirm } from 'antd';
import { PlusIcon, PencilIcon, EyeIcon, TrashIcon, ArrowUpTrayIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { CheckIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline';
import landingPageService from '../../services/landingPageService';
import { formatDistanceToNow } from 'date-fns';

const LandingPagesManager = ({ eventId }) => {
  const navigate = useNavigate();
  const [landingPages, setLandingPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [importForm] = Form.useForm();

  useEffect(() => {
    fetchLandingPages();
  }, [eventId]);

  const fetchLandingPages = async () => {
    try {
      setLoading(true);
      const response = await landingPageService.getLandingPages(eventId);
      setLandingPages(response.data.landingPages || []);
    } catch (error) {
      console.error('Error fetching landing pages:', error);
      message.error('Failed to load landing pages');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLandingPage = async (values) => {
    try {
      await landingPageService.createLandingPage(eventId, values);
      message.success('Landing page created successfully');
      setCreateModalVisible(false);
      form.resetFields();
      fetchLandingPages();
    } catch (error) {
      console.error('Error creating landing page:', error);
      message.error('Failed to create landing page');
    }
  };

  const handleImportHtml = async (values) => {
    try {
      await landingPageService.importHtmlPage(eventId, values);
      message.success('HTML landing page imported successfully');
      setImportModalVisible(false);
      importForm.resetFields();
      fetchLandingPages();
    } catch (error) {
      console.error('Error importing HTML:', error);
      message.error('Failed to import HTML landing page');
    }
  };

  const handleEdit = (id) => {
    navigate(`/events/${eventId}/landing-pages/${id}/edit`);
  };

  const handlePreview = (id) => {
    navigate(`/events/${eventId}/landing-pages/${id}/preview`);
  };

  const handleDelete = async (id) => {
    try {
      await landingPageService.deleteLandingPage(eventId, id);
      message.success('Landing page deleted successfully');
      fetchLandingPages();
    } catch (error) {
      console.error('Error deleting landing page:', error);
      message.error('Failed to delete landing page');
    }
  };

  const handlePublish = async (id) => {
    try {
      await landingPageService.publishLandingPage(eventId, id);
      message.success('Landing page published successfully');
      fetchLandingPages();
    } catch (error) {
      console.error('Error publishing landing page:', error);
      message.error('Failed to publish landing page');
    }
  };

  const handleDuplicate = async (id) => {
    try {
      const response = await landingPageService.getLandingPageById(eventId, id);
      const landingPage = response.data.landingPage;
      
      const newLandingPage = {
        title: `${landingPage.title} (Copy)`,
        slug: `${landingPage.slug}-copy`,
        components: landingPage.components,
        seo: landingPage.seo
      };
      
      await landingPageService.createLandingPage(eventId, newLandingPage);
      message.success('Landing page duplicated successfully');
      fetchLandingPages();
    } catch (error) {
      console.error('Error duplicating landing page:', error);
      message.error('Failed to duplicate landing page');
    }
  };

  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Slug',
      dataIndex: 'slug',
      key: 'slug',
    },
    {
      title: 'Status',
      dataIndex: 'isPublished',
      key: 'isPublished',
      render: (isPublished) => (
        <span className={`px-2 py-1 rounded text-sm ${isPublished ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
          {isPublished ? 'Published' : 'Draft'}
        </span>
      ),
    },
    {
      title: 'Last Modified',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (updatedAt) => formatDistanceToNow(new Date(updatedAt), { addSuffix: true }),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Edit">
            <Button 
              icon={<PencilIcon className="h-4 w-4" />} 
              onClick={() => handleEdit(record._id)} 
            />
          </Tooltip>
          <Tooltip title="Preview">
            <Button 
              icon={<EyeIcon className="h-4 w-4" />} 
              onClick={() => handlePreview(record._id)} 
            />
          </Tooltip>
          <Tooltip title="Publish">
            <Button 
              icon={<CheckIcon className="h-4 w-4" />} 
              onClick={() => handlePublish(record._id)} 
              disabled={record.isPublished}
            />
          </Tooltip>
          <Tooltip title="Duplicate">
            <Button 
              icon={<DocumentDuplicateIcon className="h-4 w-4" />} 
              onClick={() => handleDuplicate(record._id)} 
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Popconfirm
              title="Delete landing page"
              description="Are you sure you want to delete this landing page?"
              onConfirm={() => handleDelete(record._id)}
              okText="Yes"
              cancelText="No"
            >
              <Button 
                danger 
                icon={<TrashIcon className="h-4 w-4" />} 
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="container mx-auto py-6">
      <Card title="Landing Pages" className="shadow">
        <Row className="mb-4" justify="end">
          <Col>
            <Space>
              <Button 
                type="primary" 
                icon={<PlusIcon className="h-4 w-4" />} 
                onClick={() => setCreateModalVisible(true)}
              >
                Create New
              </Button>
              <Button 
                icon={<ArrowDownTrayIcon className="h-4 w-4" />} 
                onClick={() => setImportModalVisible(true)}
              >
                Import HTML
              </Button>
            </Space>
          </Col>
        </Row>
        
        <Table 
          columns={columns} 
          dataSource={landingPages} 
          rowKey="_id" 
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
      
      {/* Create Modal */}
      <Modal
        title="Create Landing Page"
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateLandingPage}
        >
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: 'Please enter a title' }]}
          >
            <Input placeholder="Enter landing page title" />
          </Form.Item>
          
          <Form.Item
            name="slug"
            label="Slug"
            rules={[
              { required: true, message: 'Please enter a slug' },
              { pattern: /^[a-z0-9-]+$/, message: 'Slug can only contain lowercase letters, numbers, and hyphens' }
            ]}
          >
            <Input placeholder="Enter landing page slug" />
          </Form.Item>
          
          <Form.Item
            name="seo"
            label="SEO Description"
          >
            <Input.TextArea placeholder="Enter SEO description" />
          </Form.Item>
          
          <Form.Item className="flex justify-end">
            <Space>
              <Button onClick={() => setCreateModalVisible(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                Create
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
      
      {/* Import Modal */}
      <Modal
        title="Import HTML Landing Page"
        open={importModalVisible}
        onCancel={() => {
          setImportModalVisible(false);
          importForm.resetFields();
        }}
        footer={null}
      >
        <Form
          form={importForm}
          layout="vertical"
          onFinish={handleImportHtml}
        >
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: 'Please enter a title' }]}
          >
            <Input placeholder="Enter landing page title" />
          </Form.Item>
          
          <Form.Item
            name="slug"
            label="Slug"
            rules={[
              { required: true, message: 'Please enter a slug' },
              { pattern: /^[a-z0-9-]+$/, message: 'Slug can only contain lowercase letters, numbers, and hyphens' }
            ]}
          >
            <Input placeholder="Enter landing page slug" />
          </Form.Item>
          
          <Form.Item
            name="htmlContent"
            label="HTML Content"
            rules={[{ required: true, message: 'Please enter HTML content' }]}
          >
            <Input.TextArea 
              placeholder="Paste HTML content here" 
              rows={10}
            />
          </Form.Item>
          
          <Form.Item className="flex justify-end">
            <Space>
              <Button onClick={() => setImportModalVisible(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                Import
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default LandingPagesManager; 