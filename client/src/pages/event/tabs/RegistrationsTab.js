import { useNavigate } from 'react-router-dom';
import QRCode from 'qrcode.react';
import printService from '../../../services/printService';

const RegistrationsTab = ({ eventId }) => {
  const navigate = useNavigate();
  const [selectedPrinter, setSelectedPrinter] = useState('');
  const [availablePrinters, setAvailablePrinters] = useState([]);
  const [badgePreviewUrl, setBadgePreviewUrl] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [resourceUsage, setResourceUsage] = useState([]);
  const [isLoadingResource, setIsLoadingResource] = useState(false);
  const [isSendingCertificate, setIsSendingCertificate] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    // Load available printers when component mounts
    const loadPrinters = async () => {
      const response = await printService.getAvailablePrinters();
      if (response.success && response.data) {
        setAvailablePrinters(response.data);
        if (response.data.length > 0) {
          setSelectedPrinter(response.data[0].id);
        }
      }
    };
    
    loadPrinters();
  }, []);

  const handleEdit = (registration) => {
    // Fix to properly edit existing registration instead of creating a new one
    setSelectedItem(registration);
    setFormMode('edit');
    setIsModalOpen(true);
    
    // Pre-populate form with existing registration data
    setFormData({
      firstName: registration.firstName || '',
      lastName: registration.lastName || '',
      email: registration.email || '',
      phone: registration.phone || '',
      company: registration.company || '',
      position: registration.position || '',
      registrationType: registration.registrationType || '',
      paymentStatus: registration.paymentStatus || '',
      // Add other fields as needed
    });
  };

  const handleViewDetails = async (registration) => {
    setIsLoadingResource(true);
    setSelectedRegistration(registration);
    
    // Fetch additional details if needed
    try {
      const detailsResponse = await registrationService.getRegistration(eventId, registration._id);
      if (detailsResponse.success && detailsResponse.data) {
        setSelectedRegistration(detailsResponse.data);
      }
      
      // Get resource usage data
      const resourceResponse = await registrationService.getResourceUsage(eventId, registration._id);
      if (resourceResponse.success && resourceResponse.data) {
        setResourceUsage(resourceResponse.data);
      }
      
      // Get badge preview
      const previewResponse = await printService.previewBadge(eventId, registration._id);
      if (previewResponse.success && previewResponse.data) {
        setBadgePreviewUrl(previewResponse.data.imageUrl);
      }
    } catch (error) {
      console.error("Error fetching registration details:", error);
      message.error("Failed to load registration details");
    } finally {
      setIsLoadingResource(false);
    }
    
    setIsDetailModalOpen(true);
  };

  const handleSendCertificate = async () => {
    if (!selectedRegistration) return;
    
    setIsSendingCertificate(true);
    try {
      const response = await registrationService.sendCertificate(eventId, selectedRegistration._id);
      if (response.success) {
        message.success("Certificate sent successfully");
      } else {
        message.error(response.message || "Failed to send certificate");
      }
    } catch (error) {
      console.error("Error sending certificate:", error);
      message.error("Failed to send certificate");
    } finally {
      setIsSendingCertificate(false);
    }
  };

  const handlePrintBadge = async () => {
    if (!selectedRegistration || !selectedPrinter) return;
    
    setIsPrinting(true);
    try {
      const response = await printService.printBadge(eventId, selectedRegistration._id, {
        printerId: selectedPrinter
      });
      
      if (response.success) {
        message.success("Badge printed successfully");
      } else {
        message.error(response.message || "Failed to print badge");
      }
    } catch (error) {
      console.error("Error printing badge:", error);
      message.error("Failed to print badge");
    } finally {
      setIsPrinting(false);
    }
  };

  const navigateToDetailPage = (registration) => {
    navigate(`/events/${eventId}/registrations/${registration._id}`);
  };

  const columns = [
    // ... existing code ...
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" onClick={() => handleEdit(record)}>
            Edit
          </Button>
          <Button type="link" onClick={() => handleViewDetails(record)}>
            View
          </Button>
          <Button type="link" onClick={() => navigateToDetailPage(record)}>
            Details
          </Button>
          <Popconfirm
            title="Are you sure to delete this registration?"
            onConfirm={() => handleDelete(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" danger>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="registrations-tab">
      {/* ... existing code ... */}
      
      {/* Registration Detail Modal */}
      <Modal
        title="Registration Details"
        open={isDetailModalOpen}
        onCancel={() => setIsDetailModalOpen(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setIsDetailModalOpen(false)}>
            Close
          </Button>,
          <Button 
            key="certificate" 
            type="primary" 
            loading={isSendingCertificate}
            onClick={handleSendCertificate}
          >
            Send Certificate
          </Button>,
          <Button 
            key="print" 
            type="primary" 
            loading={isPrinting}
            onClick={handlePrintBadge}
          >
            Print Badge
          </Button>,
        ]}
      >
        {selectedRegistration && (
          <Spin spinning={isLoadingResource}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ flex: 1 }}>
                <Descriptions bordered column={1} size="small">
                  <Descriptions.Item label="Name">{`${selectedRegistration.firstName} ${selectedRegistration.lastName}`}</Descriptions.Item>
                  <Descriptions.Item label="Email">{selectedRegistration.email}</Descriptions.Item>
                  <Descriptions.Item label="Phone">{selectedRegistration.phone}</Descriptions.Item>
                  <Descriptions.Item label="Company">{selectedRegistration.company}</Descriptions.Item>
                  <Descriptions.Item label="Position">{selectedRegistration.position}</Descriptions.Item>
                  <Descriptions.Item label="Registration Type">{selectedRegistration.registrationType}</Descriptions.Item>
                  <Descriptions.Item label="Payment Status">
                    <Tag color={selectedRegistration.paymentStatus === 'Paid' ? 'green' : 'orange'}>
                      {selectedRegistration.paymentStatus}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Registration Date">
                    {new Date(selectedRegistration.createdAt).toLocaleString()}
                  </Descriptions.Item>
                </Descriptions>
                
                <Divider orientation="left">Badge Printing</Divider>
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
                </Form>
                
                <Divider orientation="left">Resource Usage</Divider>
                {resourceUsage.length > 0 ? (
                  <List
                    size="small"
                    bordered
                    dataSource={resourceUsage}
                    renderItem={item => (
                      <List.Item>
                        <span>{item.resourceName}: </span>
                        <Tag color={item.used ? 'green' : 'blue'}>
                          {item.used ? 'Used' : 'Not Used'}
                        </Tag>
                      </List.Item>
                    )}
                  />
                ) : (
                  <Empty description="No resource usage data" />
                )}
              </div>
              
              <div style={{ marginLeft: 20, textAlign: 'center' }}>
                <div style={{ marginBottom: 20 }}>
                  {badgePreviewUrl ? (
                    <Image 
                      src={badgePreviewUrl} 
                      alt="Badge Preview" 
                      style={{ maxWidth: 250 }}
                    />
                  ) : (
                    <div style={{ border: '1px dashed #ccc', padding: 20, marginBottom: 20 }}>
                      <p>Badge Preview Not Available</p>
                    </div>
                  )}
                </div>
                
                <div style={{ marginBottom: 10 }}>
                  <p>Registration QR Code</p>
                  <QRCode 
                    value={selectedRegistration._id} 
                    size={150}
                    level="H"
                    includeMargin={true}
                  />
                </div>
              </div>
            </div>
          </Spin>
        )}
      </Modal>
      
      {/* ... existing code ... */}
    </div>
  );
};

export default RegistrationsTab; 