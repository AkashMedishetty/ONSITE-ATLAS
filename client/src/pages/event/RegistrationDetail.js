import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, 
  PageHeader, 
  Descriptions, 
  Tabs, 
  Table, 
  Button, 
  Space, 
  Tag, 
  message, 
  Spin, 
  Modal, 
  Select,
  Form,
  Divider,
  Timeline,
  Statistic,
  Row,
  Col
} from 'antd';
import { 
  PrinterOutlined, 
  MailOutlined, 
  EditOutlined, 
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  DollarOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import QRCode from 'qrcode.react';
import registrationService from '../../services/registrationService';
import printService from '../../services/printService';
import './RegistrationDetail.css';

const { TabPane } = Tabs;

const RegistrationDetail = () => {
  const { eventId, registrationId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [registration, setRegistration] = useState(null);
  const [resourceUsage, setResourceUsage] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [selectedPrinter, setSelectedPrinter] = useState('');
  const [availablePrinters, setAvailablePrinters] = useState([]);
  const [isPrintModalVisible, setIsPrintModalVisible] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isSendingCertificate, setIsSendingCertificate] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch registration details
        const response = await registrationService.getRegistration(eventId, registrationId);
        if (!response.success) {
          message.error('Failed to load registration details');
          return;
        }
        
        setRegistration(response.data);
        
        // Fetch resource usage
        const resourceResponse = await registrationService.getResourceUsage(eventId, registrationId);
        if (resourceResponse.success) {
          setResourceUsage(resourceResponse.data);
        }
        
        // Load available printers
        const printersResponse = await printService.getAvailablePrinters();
        if (printersResponse.success && printersResponse.data && printersResponse.data.length > 0) {
          setAvailablePrinters(printersResponse.data);
          setSelectedPrinter(printersResponse.data[0].id);
        }
        
        // For demonstration, generate fake activity logs
        setActivityLogs([
          { 
            id: 1, 
            timestamp: new Date(Date.now() - 86400000).toISOString(), 
            action: 'Registration Created',
            user: 'System',
            details: 'Registration submitted through registration form'
          },
          { 
            id: 2, 
            timestamp: new Date(Date.now() - 43200000).toISOString(), 
            action: 'Payment Received',
            user: 'Payment Gateway',
            details: 'Payment of $199.99 received via Credit Card'
          },
          { 
            id: 3, 
            timestamp: new Date(Date.now() - 3600000).toISOString(), 
            action: 'Badge Printed',
            user: 'Admin User',
            details: 'Badge printed on Printer #1'
          }
        ]);
      } catch (error) {
        console.error('Error fetching registration details:', error);
        message.error('An error occurred while loading registration data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [eventId, registrationId]);
  
  const handlePrintBadge = async () => {
    try {
      setIsPrinting(true);
      const response = await printService.printBadge(eventId, registrationId, {
        printerId: selectedPrinter
      });
      
      if (response.success) {
        message.success('Badge printed successfully');
        setIsPrintModalVisible(false);
      } else {
        message.error(response.message || 'Failed to print badge');
      }
    } catch (error) {
      console.error('Error printing badge:', error);
      message.error('Failed to print badge');
    } finally {
      setIsPrinting(false);
    }
  };
  
  const handleSendCertificate = async () => {
    try {
      setIsSendingCertificate(true);
      const response = await registrationService.sendCertificate(eventId, registrationId);
      
      if (response.success) {
        message.success('Certificate sent successfully');
      } else {
        message.error(response.message || 'Failed to send certificate');
      }
    } catch (error) {
      console.error('Error sending certificate:', error);
      message.error('Failed to send certificate');
    } finally {
      setIsSendingCertificate(false);
    }
  };
  
  const handleEditRegistration = () => {
    // Navigate to edit page or show edit modal
    navigate(`/events/${eventId}/edit-registration/${registrationId}`);
  };
  
  const goBack = () => {
    navigate(`/events/${eventId}/tabs/registrations`);
  };
  
  const renderPaymentStatus = (status) => {
    if (!status) return null;
    
    const statusColors = {
      'Paid': 'green',
      'Pending': 'orange',
      'Failed': 'red',
      'Refunded': 'geekblue'
    };
    
    return (
      <Tag color={statusColors[status] || 'default'}>
        {status}
      </Tag>
    );
  };
  
  const renderCheckInStatus = (checkInStatus) => {
    if (checkInStatus) {
      return (
        <Tag icon={<CheckCircleOutlined />} color="success">
          Checked In
        </Tag>
      );
    } else {
      return (
        <Tag icon={<ClockCircleOutlined />} color="default">
          Not Checked In
        </Tag>
      );
    }
  };
  
  const resourceColumns = [
    {
      title: 'Resource',
      dataIndex: 'resourceName',
      key: 'resourceName',
    },
    {
      title: 'Type',
      dataIndex: 'resourceType',
      key: 'resourceType',
    },
    {
      title: 'Status',
      dataIndex: 'used',
      key: 'used',
      render: (used) => (
        <Tag color={used ? 'green' : 'blue'}>
          {used ? 'Used' : 'Not Used'}
        </Tag>
      ),
    },
    {
      title: 'Timestamp',
      dataIndex: 'usedAt',
      key: 'usedAt',
      render: (usedAt) => usedAt ? new Date(usedAt).toLocaleString() : '-',
    }
  ];
  
  const activityColumns = [
    {
      title: 'Time',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp) => new Date(timestamp).toLocaleString(),
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
    },
    {
      title: 'User',
      dataIndex: 'user',
      key: 'user',
    },
    {
      title: 'Details',
      dataIndex: 'details',
      key: 'details',
    }
  ];
  
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Spin size="large" tip="Loading registration details..." />
      </div>
    );
  }
  
  if (!registration) {
    return (
      <Card>
        <div style={{ textAlign: 'center' }}>
          <h2>Registration not found</h2>
          <Button type="primary" onClick={goBack}>
            Back to Registrations
          </Button>
        </div>
      </Card>
    );
  }
  
  return (
    <div className="registration-detail-page">
      <PageHeader
        ghost={false}
        onBack={goBack}
        title="Registration Details"
        subTitle={`ID: ${registrationId}`}
        extra={[
          <Button 
            key="print" 
            icon={<PrinterOutlined />} 
            onClick={() => setIsPrintModalVisible(true)}
          >
            Print Badge
          </Button>,
          <Button 
            key="certificate" 
            icon={<MailOutlined />} 
            loading={isSendingCertificate}
            onClick={handleSendCertificate}
          >
            Send Certificate
          </Button>,
          <Button 
            key="edit" 
            type="primary" 
            icon={<EditOutlined />} 
            onClick={handleEditRegistration}
          >
            Edit
          </Button>
        ]}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Full Name">{`${registration.firstName} ${registration.lastName}`}</Descriptions.Item>
              <Descriptions.Item label="Email">{registration.email}</Descriptions.Item>
              <Descriptions.Item label="Phone">{registration.phone || 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="Company">{registration.company || 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="Position">{registration.position || 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="Registration Type">{registration.registrationType}</Descriptions.Item>
              <Descriptions.Item label="Payment Status">
                {renderPaymentStatus(registration.paymentStatus)}
              </Descriptions.Item>
              <Descriptions.Item label="Check-in Status">
                {renderCheckInStatus(registration.checkedIn)}
              </Descriptions.Item>
              <Descriptions.Item label="Registration Date">
                {new Date(registration.createdAt).toLocaleString()}
              </Descriptions.Item>
            </Descriptions>
          </Col>
          <Col span={12} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ marginBottom: 20 }}>
              <QRCode 
                value={registrationId} 
                size={150}
                level="H"
                includeMargin={true}
              />
              <p style={{ textAlign: 'center', marginTop: 10 }}>Registration QR Code</p>
            </div>
            
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="Registration ID"
                  value={registrationId.substring(0, 8) + '...'}
                  prefix={<UserOutlined />}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Days Until Event"
                  value={5}
                  prefix={<CalendarOutlined />}
                />
              </Col>
            </Row>
          </Col>
        </Row>
      </PageHeader>
      
      <Card style={{ marginTop: 16 }}>
        <Tabs defaultActiveKey="resources">
          <TabPane tab="Resource Usage" key="resources">
            <Table 
              dataSource={resourceUsage} 
              columns={resourceColumns} 
              rowKey="id"
              pagination={false}
            />
          </TabPane>
          <TabPane tab="Activity Log" key="activity">
            <Table 
              dataSource={activityLogs} 
              columns={activityColumns} 
              rowKey="id"
              pagination={false}
            />
          </TabPane>
          <TabPane tab="Additional Information" key="additional">
            <Descriptions bordered column={1}>
              <Descriptions.Item label="Dietary Restrictions">
                {registration.dietaryRestrictions || 'None'}
              </Descriptions.Item>
              <Descriptions.Item label="Special Accommodations">
                {registration.specialAccommodations || 'None'}
              </Descriptions.Item>
              <Descriptions.Item label="Emergency Contact">
                {registration.emergencyContact || 'Not provided'}
              </Descriptions.Item>
              <Descriptions.Item label="Notes">
                {registration.notes || 'No notes'}
              </Descriptions.Item>
            </Descriptions>
          </TabPane>
        </Tabs>
      </Card>
      
      <Modal
        title="Print Badge"
        visible={isPrintModalVisible}
        onCancel={() => setIsPrintModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsPrintModalVisible(false)}>
            Cancel
          </Button>,
          <Button 
            key="print" 
            type="primary" 
            loading={isPrinting}
            onClick={handlePrintBadge}
          >
            Print
          </Button>
        ]}
      >
        <Form layout="vertical">
          <Form.Item label="Select Printer">
            <Select 
              value={selectedPrinter} 
              onChange={setSelectedPrinter}
              style={{ width: '100%' }}
            >
              {availablePrinters.map(printer => (
                <Select.Option key={printer.id} value={printer.id}>
                  {printer.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Divider />
          <div style={{ textAlign: 'center' }}>
            <p>Badge Preview</p>
            <div style={{ border: '1px dashed #ccc', padding: 20, marginBottom: 10 }}>
              <h3>{`${registration.firstName} ${registration.lastName}`}</h3>
              <p>{registration.company}</p>
              <p>{registration.position}</p>
              <div style={{ marginTop: 10 }}>
                <QRCode 
                  value={registrationId} 
                  size={100}
                  level="H"
                  includeMargin={true}
                />
              </div>
            </div>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default RegistrationDetail; 