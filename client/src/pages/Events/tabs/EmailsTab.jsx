import React, { useState, useEffect } from 'react';
import { Card, Button, Tabs, Alert, Spinner, Modal } from '../../../components/common';
import { useParams } from 'react-router-dom';
import eventService from '../../../services/eventService';
import categoryService from '../../../services/categoryService';
import emailService from '../../../services/emailService';
import { FiSend, FiUsers, FiFileText, FiClock, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

const EmailsTab = () => {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState('compose');
  const [emailData, setEmailData] = useState({
    subject: '',
    body: '',
    attachments: []
  });
  const [filters, setFilters] = useState({
    categories: [],
    workshopFilter: 'all',
    specificEmails: ''
  });
  const [recipientPreview, setRecipientPreview] = useState(null);
  const [sendStatus, setSendStatus] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [emailHistory, setEmailHistory] = useState([]);
  const [templates, setTemplates] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load event data and categories
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch Event Details
      console.log("Fetching event details for email tab...");
      const eventDetails = await eventService.getEventById(id);
      if (eventDetails && eventDetails.success) {
        setEvent(eventDetails.data);
        console.log("Event details fetched:", eventDetails.data);
      } else {
        console.error("Failed to fetch event details:", eventDetails?.message);
        // Handle event fetch error if needed, maybe set specific error state
      }

      // Fetch Categories
      console.log("Fetching categories for email tab...");
      // Assuming categoryService.getCategories takes eventId
      // Adjust if the service function signature is different
      const categoriesData = await categoryService.getCategories(id); 
      if (categoriesData && categoriesData.success) {
        // Assuming the data is in categoriesData.data.data or categoriesData.data
        // Adjust based on the actual API response structure
        setCategories(categoriesData.data?.data || categoriesData.data || []); 
        console.log("Categories fetched:", categoriesData.data?.data || categoriesData.data);
      } else {
        console.error("Failed to fetch categories:", categoriesData?.message);
        setCategories([]); // Set empty array on error
      }

      // TODO: Restore these calls when backend endpoints are fixed/implemented
      // console.log("Attempting to fetch email history...");
      // const historyData = await emailService.getEmailHistory(id);
      // console.log("History data received:", historyData);
      // setEmailHistory(historyData.data || []); 

      // console.log("Attempting to fetch email templates...");
      // const templatesData = await emailService.getTemplates(id);
      // console.log("Templates data received:", templatesData);
      // setTemplates(templatesData.data || []); 

      // Placeholder data to avoid breaking UI completely
      setEmailHistory([]); 
      setTemplates([]);

    } catch (err) {
      console.error("Error fetching email tab data:", err);
      setError(err.message || 'Failed to fetch required data for email tab');
      // Set empty arrays on error too
      setEvent(null);
      setCategories([]);
      setEmailHistory([]); 
      setTemplates([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  // Handle category filter change
  const handleCategoryChange = (categoryId) => {
    setFilters(prev => {
      const categoryIndex = prev.categories.indexOf(categoryId);
      if (categoryIndex === -1) {
        return { ...prev, categories: [...prev.categories, categoryId] };
      } else {
        return { 
          ...prev, 
          categories: prev.categories.filter(id => id !== categoryId) 
        };
      }
    });
  };

  // Handle workshop filter change
  const handleWorkshopFilterChange = (filter) => {
    setFilters(prev => ({ ...prev, workshopFilter: filter }));
  };

  // Handle specific emails change
  const handleSpecificEmailsChange = (emailsText) => {
    setFilters(prev => ({ ...prev, specificEmails: emailsText }));
  };

  // Load a template
  const handleTemplateSelect = (templateName) => {
    if (!templates || !templateName) return;
    
    setSelectedTemplate(templateName);
    const template = templates[templateName];
    
    setEmailData(prev => ({
      ...prev,
      subject: template.subject || '',
      body: template.body || ''
    }));
  };

  // Preview recipients based on filters
  const handlePreviewRecipients = async () => {
    try {
      // Parse email addresses if using specific emails
      const specificEmails = filters.specificEmails 
        ? filters.specificEmails.split(/[,;\n]/).map(email => email.trim()).filter(email => email)
        : [];
      
      const filterData = {
        ...filters,
        specificEmails
      };
      
      const preview = await emailService.getFilteredRecipients(id, filterData);
      setRecipientPreview(preview.data);
      setShowPreviewModal(true);
    } catch (error) {
      console.error('Error previewing recipients:', error);
      setSendStatus({
        type: 'error',
        message: 'Failed to load recipient preview: ' + (error.message || 'Unknown error')
      });
    }
  };

  // Send email
  const handleSendEmail = async () => {
    // Validate inputs
    if (!emailData.subject.trim() || !emailData.body.trim()) {
      setSendStatus({
        type: 'error',
        message: 'Email subject and body are required.'
      });
      return;
    }
    
    try {
      setIsSending(true);
      setSendStatus(null);
      
      // Parse email addresses if using specific emails
      const specificEmails = filters.specificEmails 
        ? filters.specificEmails.split(/[,;\n]/).map(email => email.trim()).filter(email => email)
        : [];
      
      // Prepare filter data
      const filterData = {
        ...filters,
        specificEmails
      };
      
      // Send email
      const result = await emailService.sendEmail(id, emailData, filterData);
      
      // Handle result
      if (result.success) {
        setSendStatus({
          type: 'success',
          message: `Email sent successfully to ${result.data.sent} recipients.`
        });
        
        // Refresh email history
        const history = await emailService.getEmailHistory(id);
        setEmailHistory(history.data);
      } else {
        setSendStatus({
          type: 'error',
          message: result.message || 'Failed to send email'
        });
      }
    } catch (error) {
      console.error('Error sending email:', error);
      setSendStatus({
        type: 'error',
        message: 'Failed to send email: ' + (error.message || 'Unknown error')
      });
    } finally {
      setIsSending(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  // Check if email settings are configured
  const isEmailConfigured = event && 
    event.emailSettings && 
    event.emailSettings.enabled && 
    event.emailSettings.smtpHost && 
    event.emailSettings.smtpUser;

  const renderComposeTab = () => (
    <div className="space-y-6">
      {!isEmailConfigured && (
        <Alert 
          variant="warning" 
          title="Email Not Configured" 
          className="mb-4"
        >
          Email settings are not configured for this event. Please set up your SMTP server in the Email tab under Settings.
        </Alert>
      )}

      <Card>
        <h3 className="text-lg font-medium mb-4">Email Template</h3>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Template</label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            value={selectedTemplate}
            onChange={(e) => handleTemplateSelect(e.target.value)}
          >
            <option value="">-- Select a template --</option>
            {templates && Object.keys(templates).map(templateName => (
              <option key={templateName} value={templateName}>
                {templateName.charAt(0).toUpperCase() + templateName.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-medium mb-4">Compose Email</h3>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
          <input
            type="text"
            value={emailData.subject}
            onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            placeholder="Enter email subject"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Body</label>
          <textarea
            rows={12}
            value={emailData.body}
            onChange={(e) => setEmailData(prev => ({ ...prev, body: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 font-mono text-sm"
            placeholder="Enter email content"
          />
          <p className="mt-1 text-xs text-gray-500">
            Use <code>{'{{'}firstName{'}}'}</code>, <code>{'{{'}eventName{'}}'}</code>, <code>{'{{'}registrationId{'}}'}</code>, etc. as placeholders.
            Use <code>[QR_CODE]</code> to include the registration QR code.
          </p>
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-medium mb-4">Recipients</h3>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Categories</label>
          <div className="flex flex-wrap gap-2">
            {categories.length === 0 ? (
              <p className="text-gray-500">No categories found</p>
            ) : (
              categories.map(category => (
                <div key={category._id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`category-${category._id}`}
                    checked={filters.categories.includes(category._id)}
                    onChange={() => handleCategoryChange(category._id)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor={`category-${category._id}`}
                    className="ml-2 text-sm text-gray-700"
                    style={{ color: category.color }}
                  >
                    {category.name}
                  </label>
                </div>
              ))
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {filters.categories.length === 0 
              ? 'No categories selected. All categories will be included.' 
              : `Selected ${filters.categories.length} of ${categories.length} categories.`}
          </p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Workshop Filter</label>
          <div className="flex gap-4">
            <div className="flex items-center">
              <input
                type="radio"
                id="workshop-all"
                checked={filters.workshopFilter === 'all'}
                onChange={() => handleWorkshopFilterChange('all')}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
              />
              <label htmlFor="workshop-all" className="ml-2 text-sm text-gray-700">
                All Attendees
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="radio"
                id="workshop-with"
                checked={filters.workshopFilter === 'withWorkshop'}
                onChange={() => handleWorkshopFilterChange('withWorkshop')}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
              />
              <label htmlFor="workshop-with" className="ml-2 text-sm text-gray-700">
                Workshop Attendees
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="radio"
                id="workshop-without"
                checked={filters.workshopFilter === 'withoutWorkshop'}
                onChange={() => handleWorkshopFilterChange('withoutWorkshop')}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
              />
              <label htmlFor="workshop-without" className="ml-2 text-sm text-gray-700">
                Non-Workshop Attendees
              </label>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Specific Email Addresses (Optional)
          </label>
          <textarea
            rows={4}
            value={filters.specificEmails}
            onChange={(e) => handleSpecificEmailsChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            placeholder="Enter email addresses separated by commas, semicolons, or new lines"
          />
          <p className="text-xs text-gray-500 mt-1">
            If provided, the email will only be sent to these addresses, ignoring other filters.
          </p>
        </div>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePreviewRecipients}
            className="flex items-center gap-2"
          >
            <FiUsers /> Preview Recipients
          </Button>
          <Button
            variant="primary"
            onClick={handleSendEmail}
            className="flex items-center gap-2"
            disabled={isSending || !isEmailConfigured}
          >
            {isSending ? <Spinner size="sm" className="mr-2" /> : <FiSend />}
            Send Email
          </Button>
        </div>

        {sendStatus && (
          <Alert
            variant={sendStatus.type === 'success' ? 'success' : 'error'}
            title={sendStatus.type === 'success' ? 'Success' : 'Error'}
            className="mt-4"
          >
            {sendStatus.message}
          </Alert>
        )}
      </Card>
    </div>
  );

  const renderHistoryTab = () => (
    <div className="space-y-6">
      <Card>
        <h3 className="text-lg font-medium mb-4">Email History</h3>
        
        {emailHistory.length === 0 ? (
          <p className="text-gray-500">No emails have been sent yet for this event.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recipients
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {emailHistory.map((email, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(email.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {email.subject}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {email.recipients}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        email.status === 'completed' ? 'bg-green-100 text-green-800' :
                        email.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {email.status === 'completed' && <FiCheckCircle className="mr-1" />}
                        {email.status === 'pending' && <FiClock className="mr-1" />}
                        {email.status === 'failed' && <FiAlertCircle className="mr-1" />}
                        {email.status.charAt(0).toUpperCase() + email.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Emails</h2>
      <p className="text-gray-500">Send emails to event participants, view email history, and manage templates.</p>

      <Tabs
        tabs={[
          { id: "compose", label: "Compose Email" },
          { id: "history", label: "Email History" }
        ]}
        activeTab={activeTab}
        onChange={(index) => {
          const newTabId = index === 0 ? 'compose' : 'history';
          setActiveTab(newTabId);
        }}
        variant="underline"
      />

      <div className="mt-6">
        {activeTab === 'compose' && renderComposeTab()}
        {activeTab === 'history' && renderHistoryTab()}
      </div>

      {/* Recipient Preview Modal */}
      <Modal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        title="Recipient Preview"
        size="lg"
      >
        {recipientPreview ? (
          <>
            <p className="mb-4">
              This email will be sent to <strong>{recipientPreview.totalCount}</strong> recipients.
            </p>
            {recipientPreview.totalCount > 0 && (
              <>
                <p className="text-sm text-gray-500 mb-2">Sample recipients:</p>
                <div className="max-h-64 overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-4 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-4 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Category
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {recipientPreview.sample.map((recipient, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                            {recipient.personalInfo.firstName} {recipient.personalInfo.lastName}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                            {recipient.personalInfo.email}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                            {recipient.category ? recipient.category.name : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        ) : (
          <p>Loading recipients...</p>
        )}
        <div className="flex justify-end mt-4">
          <Button variant="secondary" onClick={() => setShowPreviewModal(false)} className="mr-2">
            Close
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setShowPreviewModal(false);
              handleSendEmail();
            }}
            disabled={!recipientPreview || recipientPreview.totalCount === 0 || isSending || !isEmailConfigured}
          >
            {isSending ? <Spinner size="sm" className="mr-2" /> : null}
            Send Email
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default EmailsTab; 