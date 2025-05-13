import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Card, 
  Button, 
  Tabs, 
  Alert, 
  Spinner, 
  Modal, 
  Badge
} from '../../components/common';
import eventService from '../../services/eventService';

const EmailTemplates = () => {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('compose');
  const [emailHistory, setEmailHistory] = useState([]);
  
  // Email composition state
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [recipients, setRecipients] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('custom');
  const [selectedFile, setSelectedFile] = useState(null);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);
  
  // Filter options
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [workshopFilter, setWorkshopFilter] = useState('all'); // 'all', 'withWorkshop', 'withoutWorkshop'
  const [specificRecipients, setSpecificRecipients] = useState('');
  
  // Confirmation modal
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [recipientCount, setRecipientCount] = useState(0);
  
  // Load event data
  useEffect(() => {
    const loadEventData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await eventService.getEventById(id);
        if (response && response.success) {
          setEvent(response.data);
          
          // Load email history
          try {
            // Here we would call a service method to get email history
            // For now, use sample data
            setEmailHistory([
              { 
                id: 1, 
                subject: 'Registration Confirmation', 
                date: new Date().toISOString(),
                recipients: 45,
                status: 'completed'
              },
              { 
                id: 2, 
                subject: 'Event Reminder', 
                date: new Date(Date.now() - 86400000).toISOString(),
                recipients: 38,
                status: 'completed'
              }
            ]);
          } catch (err) {
            console.error("Error loading email history:", err);
          }
        } else {
          throw new Error(response?.message || 'Failed to load event');
        }
      } catch (err) {
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    loadEventData();
  }, [id]);
  
  // Load recipients based on filters
  useEffect(() => {
    const loadRecipients = async () => {
      // In a real implementation, this would call an API with the filters
      // For now, just simulate a delay and set sample data
      try {
        const filters = {
          categories: selectedCategories,
          workshopFilter,
          specificEmails: specificRecipients ? specificRecipients.split(',').map(email => email.trim()) : []
        };
        
        // Simulated API call to get recipients
        // In a real implementation, use eventService.getFilteredRecipients(id, filters)
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Sample recipients data
        const sampleRecipients = [];
        // Generate some sample recipients based on filters
        const categoryNames = selectedCategories.map(c => event?.categories?.find(cat => cat._id === c)?.name || c);
        
        if (specificRecipients) {
          // If specific recipients are provided, use those
          const emails = specificRecipients.split(',').map(email => email.trim());
          emails.forEach((email, index) => {
            if (email) {
              sampleRecipients.push({
                id: `spec-${index}`,
                name: `Specific Recipient ${index + 1}`,
                email,
                category: 'Manual Entry'
              });
            }
          });
        } else {
          // Otherwise, use category and workshop filters
          const count = Math.max(5, 10 * selectedCategories.length);
          for (let i = 0; i < count; i++) {
            const hasWorkshop = Math.random() > 0.5;
            if (
              (workshopFilter === 'all') || 
              (workshopFilter === 'withWorkshop' && hasWorkshop) || 
              (workshopFilter === 'withoutWorkshop' && !hasWorkshop)
            ) {
              const categoryIndex = i % Math.max(1, selectedCategories.length);
              const categoryId = selectedCategories[categoryIndex];
              const categoryName = categoryNames[categoryIndex] || 'General';
              
              sampleRecipients.push({
                id: `reg-${i}`,
                name: `Attendee ${i + 1}`,
                email: `attendee${i + 1}@example.com`,
                category: categoryName,
                hasWorkshop
              });
            }
          }
        }
        
        setRecipients(sampleRecipients);
        setRecipientCount(sampleRecipients.length);
      } catch (err) {
        console.error("Error loading recipients:", err);
      }
    };
    
    if (event) {
      loadRecipients();
    }
  }, [event, selectedCategories, workshopFilter, specificRecipients, id]);
  
  // Load template content
  useEffect(() => {
    if (!event?.emailSettings?.templates || selectedTemplate === 'custom') {
      return;
    }
    
    const template = event.emailSettings.templates[selectedTemplate];
    if (template) {
      setSubject(template.subject || '');
      setBody(template.body || '');
    }
  }, [selectedTemplate, event]);
  
  const handleSendEmail = async () => {
    setShowConfirmation(false);
    setSending(true);
    setSendResult(null);
    
    try {
      // In a real implementation, this would call an API
      // For now, just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSendResult({
        success: true,
        message: `Email "${subject}" sent successfully to ${recipientCount} recipients`
      });
      
      // Add to history
      setEmailHistory(prevHistory => [
        {
          id: Date.now(),
          subject,
          date: new Date().toISOString(),
          recipients: recipientCount,
          status: 'completed'
        },
        ...prevHistory
      ]);
      
      // Clear the form if using a custom template
      if (selectedTemplate === 'custom') {
        setSubject('');
        setBody('');
      }
      
      setSelectedFile(null);
    } catch (err) {
      setSendResult({
        success: false,
        message: err.message || 'Failed to send email'
      });
    } finally {
      setSending(false);
    }
  };
  
  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      dateStyle: 'medium', 
      timeStyle: 'short' 
    }).format(date);
  };
  
  // Render loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <Alert 
        variant="error" 
        title="Error Loading Event" 
        description={error}
      />
    );
  }
  
  // SMTP not configured warning
  const isSmtpConfigured = event?.emailSettings?.smtpHost && 
                           event?.emailSettings?.smtpUser && 
                           event?.emailSettings?.enabled;
  
  const renderComposeTab = () => (
    <div className="space-y-6">
      {!isSmtpConfigured && (
        <Alert 
          variant="warning" 
          title="SMTP Not Configured" 
          description="Email settings are not fully configured. Please configure SMTP settings in the Settings tab before sending emails." 
        />
      )}
      
      <Card>
        <h3 className="text-lg font-medium mb-4">Email Recipients</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Target by Category</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {event?.categories?.map(category => (
                <div key={category._id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`category-${category._id}`}
                    checked={selectedCategories.includes(category._id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCategories(prev => [...prev, category._id]);
                      } else {
                        setSelectedCategories(prev => prev.filter(id => id !== category._id));
                      }
                    }}
                    className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 mr-2"
                  />
                  <label htmlFor={`category-${category._id}`} className="text-sm text-gray-700">
                    {category.name}
                  </label>
                </div>
              ))}
            </div>
            
            {selectedCategories.length === 0 && (
              <p className="text-sm text-amber-600">
                Select at least one category or specify individual recipients below
              </p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Workshop Filter</label>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="workshop-all"
                  name="workshop-filter"
                  checked={workshopFilter === 'all'}
                  onChange={() => setWorkshopFilter('all')}
                  className="h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                />
                <label htmlFor="workshop-all" className="ml-2 text-sm text-gray-700">
                  All Attendees
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="radio"
                  id="workshop-with"
                  name="workshop-filter"
                  checked={workshopFilter === 'withWorkshop'}
                  onChange={() => setWorkshopFilter('withWorkshop')}
                  className="h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                />
                <label htmlFor="workshop-with" className="ml-2 text-sm text-gray-700">
                  With Workshop
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="radio"
                  id="workshop-without"
                  name="workshop-filter"
                  checked={workshopFilter === 'withoutWorkshop'}
                  onChange={() => setWorkshopFilter('withoutWorkshop')}
                  className="h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                />
                <label htmlFor="workshop-without" className="ml-2 text-sm text-gray-700">
                  Without Workshop
                </label>
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Specific Recipients (Optional)</label>
            <textarea
              rows="2"
              value={specificRecipients}
              onChange={(e) => setSpecificRecipients(e.target.value)}
              placeholder="Enter email addresses separated by commas"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              If specified, only these addresses will receive the email, ignoring category and workshop filters.
            </p>
          </div>
          
          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Preview Recipients ({recipients.length})</h4>
            
            {recipients.length > 0 ? (
              <div className="max-h-40 overflow-auto border border-gray-200 rounded-md">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recipients.slice(0, 5).map((recipient) => (
                      <tr key={recipient.id}>
                        <td className="px-4 py-2 text-sm text-gray-900">{recipient.name}</td>
                        <td className="px-4 py-2 text-sm text-gray-500">{recipient.email}</td>
                        <td className="px-4 py-2 text-sm text-gray-500">
                          <Badge variant="info" className="text-xs">{recipient.category}</Badge>
                        </td>
                      </tr>
                    ))}
                    {recipients.length > 5 && (
                      <tr>
                        <td colSpan="3" className="px-4 py-2 text-sm text-gray-500 text-center">
                          ...and {recipients.length - 5} more
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">No recipients match your current filters</p>
            )}
          </div>
        </div>
      </Card>
      
      <Card>
        <h3 className="text-lg font-medium mb-4">Email Content</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Template</label>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="custom">Custom Email</option>
              <option value="registration">Registration Confirmation</option>
              <option value="reminder">Event Reminder</option>
              <option value="certificate">Certificate Delivery</option>
              <option value="workshop">Workshop Information</option>
              <option value="scientificBrochure">Scientific Brochure</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter email subject"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
            <textarea
              rows="10"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 font-mono text-sm"
              placeholder="Enter email content"
            />
            <p className="mt-1 text-xs text-gray-500">
              Use placeholders like {'{{firstName}}'}, {'{{eventName}}'}, {'{{registrationId}}'} for dynamic content.
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Attachment (Optional)</label>
            <div className="flex items-center space-x-2">
              <input
                type="file"
                onChange={handleFileChange}
                className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              />
              {selectedFile && (
                <button 
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              )}
            </div>
            {selectedFile && (
              <p className="mt-1 text-xs text-gray-500">
                Selected: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
              </p>
            )}
          </div>
          
          {sendResult && (
            <Alert
              variant={sendResult.success ? "success" : "error"}
              title={sendResult.success ? "Email Sent" : "Error"}
              description={sendResult.message}
            />
          )}
          
          <div className="pt-4 flex justify-end">
            <Button
              variant="primary"
              onClick={() => setShowConfirmation(true)}
              disabled={sending || !subject || !body || recipients.length === 0 || !isSmtpConfigured}
            >
              {sending ? <Spinner size="sm" className="mr-2" /> : null}
              Send Email
            </Button>
          </div>
        </div>
      </Card>
      
      <Modal
        title="Confirm Email"
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowConfirmation(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSendEmail}>
              Confirm Send
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p>You are about to send the following email to {recipientCount} recipients:</p>
          
          <div className="rounded-md bg-gray-50 p-4">
            <p className="font-medium">{subject}</p>
            <p className="text-sm text-gray-500 mt-2">{recipients.length > 0 ? `To: ${recipients[0].email}${recipients.length > 1 ? ` and ${recipients.length - 1} more` : ''}` : ''}</p>
            {selectedFile && <p className="text-sm text-gray-500">Attachment: {selectedFile.name}</p>}
          </div>
          
          <Alert
            variant="info"
            title="Note"
            description="This action cannot be undone. Emails will be sent immediately."
          />
        </div>
      </Modal>
    </div>
  );
  
  const renderHistoryTab = () => (
    <div className="space-y-6">
      <Card>
        <h3 className="text-lg font-medium mb-4">Email History</h3>
        
        {emailHistory.length > 0 ? (
          <div className="overflow-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recipients
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {emailHistory.map((email) => (
                  <tr key={email.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{email.subject}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{formatDate(email.date)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{email.recipients}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge 
                        variant={email.status === 'completed' ? 'success' : 'warning'}
                      >
                        {email.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            <p>No emails have been sent yet</p>
          </div>
        )}
      </Card>
    </div>
  );
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Email Communications</h1>
      
      <Tabs
        tabs={[
          { id: "compose", label: "Compose Email" },
          { id: "history", label: "Email History" }
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
        variant="underline"
      />
      
      <div className="mt-6">
        {activeTab === 'compose' && renderComposeTab()}
        {activeTab === 'history' && renderHistoryTab()}
      </div>
    </div>
  );
};

export default EmailTemplates; 