import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, Button, Spinner, Alert, Badge, Tabs, Modal } from '../../../components/common';
import { ArrowDownTrayIcon, CheckIcon, XMarkIcon, CheckCircleIcon, ExclamationCircleIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import abstractService from '../../../services/abstractService';
import eventService from '../../../services/eventService';
import categoryService from '../../../services/categoryService';
import { toast } from 'react-hot-toast';

const ABSTRACT_STATUSES = [
  'draft', 'submitted', 'under-review', 'approved', 'rejected', 'revision-requested', 'pending', 'accepted', 'revised-pending-review'
];

const AbstractsTab = ({ event }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [abstracts, setAbstracts] = useState([]);
  const [error, setError] = useState(null);
  const [selectedAbstractIds, setSelectedAbstractIds] = useState(new Set());
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);
  const [bulkActionError, setBulkActionError] = useState(null);
  const [bulkActionSuccess, setBulkActionSuccess] = useState(null);
  
  const [showAssignReviewerModal, setShowAssignReviewerModal] = useState(false);
  const [selectedAbstractsForAssignment, setSelectedAbstractsForAssignment] = useState([]);
  
  const [availableReviewers, setAvailableReviewers] = useState([]);
  const [selectedReviewerIdsInModal, setSelectedReviewerIdsInModal] = useState(new Set());
  const [loadingReviewers, setLoadingReviewers] = useState(false);
  const [errorReviewers, setErrorReviewers] = useState(null);
  const [isAssigningReviewers, setIsAssigningReviewers] = useState(false);
  
  // New state to store the full abstract object when a single abstract is selected for assignment
  const [singleSelectedAbstractDetail, setSingleSelectedAbstractDetail] = useState(null);

  // Export filter state
  const [exportMode, setExportMode] = useState('excel-single');
  const [exportCategory, setExportCategory] = useState('');
  const [exportTopic, setExportTopic] = useState('');
  const [minScore, setMinScore] = useState('');
  const [maxScore, setMaxScore] = useState('');
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [topicOptions, setTopicOptions] = useState([]);
  const [reviewerOptions, setReviewerOptions] = useState([]);
  const [exportReviewer, setExportReviewer] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportStatus, setExportStatus] = useState('');

  const [showFilesZipModal, setShowFilesZipModal] = useState(false);
  const [isFilesZipExporting, setIsFilesZipExporting] = useState(false);
  const [filesZipExportError, setFilesZipExportError] = useState(null);

  const fetchAbstracts = useCallback(async () => {
    if (!event || !event._id) {
      setError('Event data is not available.');
      setLoading(false);
      return;
    }
    
    try {
      setError(null);
      setBulkActionError(null);
      setBulkActionSuccess(null);
      const response = await abstractService.getAbstractsByEvent(event._id);
      
      if (response.success) {
        setAbstracts(response.data || []);
      } else {
        setError(response.message || 'Failed to fetch abstracts.');
        setAbstracts([]);
      }
    } catch (err) {
      console.error("Error fetching abstracts:", err);
      setError('An unexpected error occurred while fetching abstracts.');
      setAbstracts([]);
    } finally {
      if (loading) setLoading(false);
    }
  }, [event]);
  
  useEffect(() => {
    setLoading(true);
    fetchAbstracts();
  }, [event]);
  
  useEffect(() => {
    if (showAssignReviewerModal && event?._id) {
      const fetchReviewersForModal = async () => {
        setLoadingReviewers(true);
        setErrorReviewers(null);
        try {
          const response = await eventService.getEventReviewers(event._id);
          if (response.success && Array.isArray(response.data)) {
            setAvailableReviewers(response.data);
          } else {
            setErrorReviewers(response.message || 'Failed to load reviewers.');
            setAvailableReviewers([]);
          }
        } catch (err) {
          setErrorReviewers(err.message || 'An error occurred while fetching reviewers.');
          setAvailableReviewers([]);
        }
        setLoadingReviewers(false);
      };
      fetchReviewersForModal();
    }
  }, [showAssignReviewerModal, event?._id]);
  
  // Fetch categories, topics, and reviewers for export filters
  useEffect(() => {
    if (!event || !event._id) return;
    // Fetch categories
    categoryService.getCategoriesByEvent(event._id).then(res => {
      if (res.success) setCategoryOptions(res.data);
      else setCategoryOptions([]);
    });
    // Fetch topics from event settings
    if (event.abstractSettings && Array.isArray(event.abstractSettings.topics)) {
      setTopicOptions(event.abstractSettings.topics);
    } else {
      setTopicOptions([]);
    }
    // Fetch reviewers
    setExportReviewer('');
    setReviewerOptions([]);
    eventService.getEventReviewers(event._id).then(res => {
      if (res.success && Array.isArray(res.data)) setReviewerOptions(res.data);
      else setReviewerOptions([]);
    });
  }, [event]);
  
  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
      case 'accepted':
        return (
          <Badge 
            variant="success"
            className="flex items-center"
          >
            <CheckIcon className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge 
            variant="error"
            className="flex items-center"
          >
            <XMarkIcon className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      case 'pending':
      case 'in-review':
      case 'revision-requested':
      default:
        return (
          <Badge 
            variant="warning"
            className="flex items-center"
          >
            {status ? status.replace('-', ' ').charAt(0).toUpperCase() + status.slice(1).replace('-', ' ') : 'Pending'}
          </Badge>
        );
    }
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString();
    } catch (e) {
        return 'Invalid Date';
    }
  };
  
  const filteredAbstracts = useMemo(() => {
    const statusMap = ['all', 'approved', 'pending', 'rejected'];
    const currentStatusFilter = statusMap[activeTab];

    if (currentStatusFilter === 'all') return abstracts;
    
    const statusesToMatch = [];
    if (currentStatusFilter === 'approved') statusesToMatch.push('approved', 'accepted');
    else if (currentStatusFilter === 'pending') statusesToMatch.push('pending', 'in-review', 'revision-requested');
    else if (currentStatusFilter === 'rejected') statusesToMatch.push('rejected');
    
    return abstracts.filter(abstract => statusesToMatch.includes(abstract.status));
  }, [abstracts, activeTab]);
  
  const handleSelectAbstract = (abstractId) => {
    setSelectedAbstractIds(prevSelected => {
      const newSelected = new Set(prevSelected);
      if (newSelected.has(abstractId)) {
        newSelected.delete(abstractId);
      } else {
        newSelected.add(abstractId);
      }
      return newSelected;
    });
  };
  
  const handleSelectAll = () => {
    if (selectedAbstractIds.size === filteredAbstracts.length) {
      setSelectedAbstractIds(new Set());
    } else {
      setSelectedAbstractIds(new Set(filteredAbstracts.map(a => a._id)));
    }
  };
  
  const handleExport = async () => {
    console.log('[AbstractsTab] handleExport called');
    if (!event || !event._id) return;
    setIsExporting(true);
    setExportError(null);
    try {
      const filters = {
        exportMode,
        category: exportCategory || undefined,
        topic: exportTopic || undefined,
        minScore: minScore !== '' ? minScore : undefined,
        maxScore: maxScore !== '' ? maxScore : undefined,
        reviewer: exportReviewer || undefined,
      };
      const response = await abstractService.exportAbstracts(event._id, filters);
      if (response.success && response.data?.fileUrl) {
        // Use the filename returned by the service (which parses Content-Disposition)
        const link = document.createElement('a');
        link.href = response.data.fileUrl;
        link.setAttribute('download', response.data.filename || 'abstracts.xlsx');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        setExportError(response.message || 'Failed to export abstracts.');
      }
    } catch (err) {
      console.error('Error exporting abstracts:', err);
      setExportError('An unexpected error occurred while exporting abstracts.');
    } finally {
      setIsExporting(false);
    }
  };
  
  const handleDownloadZip = async () => {
    setIsExporting(true);
    setExportError(null);
    try {
      // No exportMode, so this will trigger ZIP download
      const response = await abstractService.exportAbstracts(event._id, {});
      if (response.success && response.data?.fileUrl) {
        const link = document.createElement('a');
        link.href = response.data.fileUrl;
        link.setAttribute('download', response.data.filename || 'abstracts.zip');
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(response.data.fileUrl);
        }, 1500);
      } else {
        setExportError(response.message || 'Failed to export abstracts.');
      }
    } catch (err) {
      setExportError('An unexpected error occurred while exporting abstracts.');
    } finally {
      setIsExporting(false);
    }
  };
  
  const handleDownloadFilesZip = async () => {
    setIsExporting(true);
    setExportError(null);
    try {
      console.log('[AbstractsTab] handleDownloadFilesZip called with exportMode=files-only');
      const response = await abstractService.exportAbstracts(event._id, { exportMode: 'files-only' });
      console.log('[AbstractsTab] exportAbstracts response:', response);
      if (response.success && response.data?.fileUrl) {
        const link = document.createElement('a');
        link.href = response.data.fileUrl;
        link.setAttribute('download', response.data.filename || 'abstracts-files.zip');
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(response.data.fileUrl);
        }, 1500);
      } else {
        setExportError(response.message || 'Failed to export abstracts.');
      }
    } catch (err) {
      setExportError('An unexpected error occurred while exporting abstracts.');
    } finally {
      setIsExporting(false);
    }
  };
  
  const handleBulkAction = async (action) => {
    if (!event || !event._id || selectedAbstractIds.size === 0) return;

    const statusMap = {
      approve: 'approved',
      reject: 'rejected'
    };
    const targetStatus = statusMap[action];
    if (!targetStatus) return;

    setIsProcessingBulk(true);
    setBulkActionError(null);
    setBulkActionSuccess(null);

    const results = { success: 0, failed: 0, errors: [] };
    const idsToProcess = Array.from(selectedAbstractIds);

    for (const abstractId of idsToProcess) {
        try {
            const response = await abstractService.updateAbstractStatus(event._id, abstractId, targetStatus);
            if (response.success) {
                results.success++;
            } else {
                results.failed++;
                results.errors.push(`ID ${abstractId}: ${response.message || 'Unknown error'}`);
            }
        } catch (err) {
            results.failed++;
            results.errors.push(`ID ${abstractId}: ${err.message || 'Network/Service error'}`);
            console.error(`Error processing bulk action for ${abstractId}:`, err);
        }
    }

    setIsProcessingBulk(false);
    setSelectedAbstractIds(new Set());

    if (results.failed > 0) {
        setBulkActionError(`Action completed with ${results.failed} error(s). ${results.errors.length > 0 ? `First error: ${results.errors[0]}` : ''}`);
    }
    if (results.success > 0) {
         setBulkActionSuccess(`${results.success} abstract(s) successfully ${targetStatus}.`);
    }
    
    await fetchAbstracts();
  };
  
  const handleOpenAssignReviewerModal = (currentSelectedAbstractIds) => {
    if (currentSelectedAbstractIds.size === 0) {
      toast.error('Please select at least one abstract to assign reviewers.');
      return;
    }
    setSelectedAbstractsForAssignment(currentSelectedAbstractIds);
    setShowAssignReviewerModal(true);

    if (currentSelectedAbstractIds.size === 1) {
      const abstractId = currentSelectedAbstractIds.values().next().value;
      const selectedFullAbstract = abstracts.find(abs => abs._id === abstractId);
      if (selectedFullAbstract && selectedFullAbstract.reviewDetails && selectedFullAbstract.reviewDetails.assignedTo && selectedFullAbstract.reviewDetails.assignedTo.length > 0) {
        const assignedReviewerId = typeof selectedFullAbstract.reviewDetails.assignedTo[0] === 'string' 
                                    ? selectedFullAbstract.reviewDetails.assignedTo[0] 
                                    : selectedFullAbstract.reviewDetails.assignedTo[0]?.id;
        if (assignedReviewerId) {
            setSelectedReviewerIdsInModal(new Set([assignedReviewerId]));
        }
        setSingleSelectedAbstractDetail(selectedFullAbstract); 
      } else {
        setSelectedReviewerIdsInModal(new Set());
        setSingleSelectedAbstractDetail(null);
      }
    } else {
      setSelectedReviewerIdsInModal(new Set());
      setSingleSelectedAbstractDetail(null);
    }
  };
  
  const handleToggleReviewerSelection = (reviewerId) => {
    setSelectedReviewerIdsInModal(prevSelectedIds => {
      const newSelectedIds = new Set();
      if (!prevSelectedIds.has(reviewerId)) {
        newSelectedIds.add(reviewerId);
      }
      return newSelectedIds;
    });
  };
  
  const handleConfirmAssignment = async () => {
    setIsAssigningReviewers(true);
    try {
      const abstractIdsArray = Array.from(selectedAbstractsForAssignment);
      const reviewerIdsArray = Array.from(selectedReviewerIdsInModal);

      if (abstractIdsArray.length === 0) {
        toast.error("No abstracts selected for assignment.");
        setIsAssigningReviewers(false);
        return;
      }
      if (reviewerIdsArray.length === 0) {
        toast.error("No reviewers selected in the modal.");
        setIsAssigningReviewers(false);
        return;
      }

      const response = await abstractService.assignReviewers(event._id, abstractIdsArray, reviewerIdsArray);

      if (response.success) {
        toast.success(response.message || 'Reviewers assignment process completed.');
        
        if (response.results && Array.isArray(response.results)) {
          const failures = response.results.filter(r => !r.success);
          if (failures.length > 0) {
            console.error("[AbstractsTab] Assignment Failures (from response.results):", failures);
            toast.error(`There were ${failures.length} failure(s) during assignment. Check console for details.`);
          }
        } else {
            console.log("[AbstractsTab] Assignment response (response.success true, but no 'results' array found directly on response):", response);
        }
        setShowAssignReviewerModal(false);
        fetchAbstracts();
        setSelectedAbstractIds(new Set());
      } else {
        toast.error(response.message || 'Failed to assign reviewers.');
        
        if (response.results && Array.isArray(response.results)) {
          console.error("[AbstractsTab] Assignment Failure Details (from response.results):", response.results);
        } else {
            console.error("[AbstractsTab] Assignment Failure (response.success false, no 'results' array found directly on response):", response);
        }
      }
    } catch (err) {
      toast.error(err.message || 'An error occurred during assignment.');
    } finally {
      setIsAssigningReviewers(false);
    }
  };
  
  const handleCloseAssignReviewerModal = () => {
    setShowAssignReviewerModal(false);
    setSelectedReviewerIdsInModal(new Set());
    setAvailableReviewers([]);
    setLoadingReviewers(false);
    setErrorReviewers(null);
    setIsAssigningReviewers(false);
    setSingleSelectedAbstractDetail(null);
  };
  
  const isAllSelected = filteredAbstracts.length > 0 && selectedAbstractIds.size === filteredAbstracts.length;
  const isIndeterminate = selectedAbstractIds.size > 0 && selectedAbstractIds.size < filteredAbstracts.length;

  const handleDownloadFilesZipDirect = async () => {
    setIsFilesZipExporting(true);
    setFilesZipExportError(null);
    try {
      console.log('[AbstractsTab] handleDownloadFilesZipDirect called with exportMode=files-only');
      const response = await abstractService.exportAbstracts(event._id, { exportMode: 'files-only' });
      console.log('[AbstractsTab] exportAbstracts response (files-only):', response);
      if (response.success && response.data?.fileUrl) {
        const link = document.createElement('a');
        link.href = response.data.fileUrl;
        link.setAttribute('download', response.data.filename || 'abstracts-files.zip');
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(response.data.fileUrl);
        }, 1500);
        setShowFilesZipModal(false);
      } else {
        setFilesZipExportError(response.message || 'Failed to export abstracts.');
      }
    } catch (err) {
      setFilesZipExportError('An unexpected error occurred while exporting abstracts.');
    } finally {
      setIsFilesZipExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }
  
  if (error) {
    return (
      <Alert 
        type="error" 
        message="Error loading abstracts" 
        details={error}
      />
    );
  }
  
  const assignReviewerModalContent = (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
      <div className="relative mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg leading-6 font-medium text-gray-900 text-center mb-4">Assign Reviewers</h3>
          <p className="text-sm text-gray-600 mb-2">
            Assigning reviewers for {Array.from(selectedAbstractsForAssignment).length} abstract(s).
          </p>
          
          {loadingReviewers && <div className="text-center p-4"><Spinner /> Loading reviewers...</div>}
          {errorReviewers && <Alert variant="danger" className="mb-3">Error loading reviewers: {errorReviewers}</Alert>}
          {!loadingReviewers && !errorReviewers && availableReviewers.length === 0 && (
            <div className="p-4 text-center text-gray-500">
              No reviewers available for this event.
            </div>
          )}
          {!loadingReviewers && !errorReviewers && availableReviewers.length > 0 && (
            <div className="my-4 max-h-60 overflow-y-auto border rounded-md p-3 space-y-2">
              {availableReviewers.map(reviewer => {
                return (
                  <label key={reviewer.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                    <input 
                      type="checkbox"
                      className="form-checkbox h-5 w-5 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                      checked={selectedReviewerIdsInModal.has(reviewer.id)}
                      onChange={() => {
                        handleToggleReviewerSelection(reviewer.id);
                      }}
                    />
                    <span className="text-sm text-gray-700">
                      {reviewer.name} ({reviewer.email})
                    </span>
                  </label>
                );
              })}
            </div>
          )}

          <div className="items-center px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-gray-200 mt-4 pt-4">
            <Button
              variant="primary"
              onClick={handleConfirmAssignment}
              disabled={isAssigningReviewers || selectedReviewerIdsInModal.size === 0}
              className="w-full sm:ml-3 sm:w-auto"
            >
              {isAssigningReviewers ? <><Spinner size="sm" mr="2"/> Assigning...</> : 'Confirm Assignment'}
            </Button>
            <Button
              variant="light"
              onClick={handleCloseAssignReviewerModal}
              disabled={isAssigningReviewers}
              className="mt-3 w-full sm:mt-0 sm:w-auto"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  // Export Modal UI
  const exportModalContent = (
    <Modal isOpen={showExportModal} onClose={() => setShowExportModal(false)}>
      <div className="p-6">
        <h2 className="text-lg font-semibold mb-4">Export Abstracts</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Export Mode</label>
            <select
              className="border rounded px-2 py-1 text-sm w-full"
              value={exportMode}
              onChange={e => setExportMode(e.target.value)}
            >
              <option value="excel-single">Excel (Single Row per Abstract)</option>
              <option value="excel-multi">Excel (Multi Row per Review)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Abstract Category</label>
            <select
              className="border rounded px-2 py-1 text-sm w-full"
              value={exportCategory}
              onChange={e => setExportCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categoryOptions.map(cat => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Topic</label>
            <select
              className="border rounded px-2 py-1 text-sm w-full"
              value={exportTopic}
              onChange={e => setExportTopic(e.target.value)}
            >
              <option value="">All Topics</option>
              {topicOptions.map(topic => (
                <option key={topic} value={topic}>{topic}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Reviewer</label>
            <select
              className="border rounded px-2 py-1 text-sm w-full"
              value={exportReviewer}
              onChange={e => setExportReviewer(e.target.value)}
            >
              <option value="">All Reviewers</option>
              {reviewerOptions.map(reviewer => (
                <option key={reviewer._id || reviewer.email || reviewer.name} value={reviewer._id}>{reviewer.name} ({reviewer.email})</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Min Score</label>
              <input
                type="number"
                className="border rounded px-2 py-1 w-full text-sm"
                placeholder="Min Score"
                value={minScore}
                onChange={e => setMinScore(e.target.value)}
                min={0}
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Max Score</label>
              <input
                type="number"
                className="border rounded px-2 py-1 w-full text-sm"
                placeholder="Max Score"
                value={maxScore}
                onChange={e => setMaxScore(e.target.value)}
                min={0}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              className="border rounded px-2 py-1 text-sm w-full"
              value={exportStatus}
              onChange={e => setExportStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              {ABSTRACT_STATUSES.map(status => (
                <option key={status} value={status}>{status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="light" onClick={() => setShowExportModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={() => { console.log('[AbstractsTab] Export button clicked'); handleExport(); }} disabled={isExporting} leftIcon={<ArrowDownTrayIcon className="h-5 w-5" />}>
            {isExporting ? 'Exporting...' : 'Export'}
          </Button>
        </div>
        {exportError && (
          <Alert variant="error" title="Export Failed" className="mt-4">
            {exportError}
          </Alert>
        )}
      </div>
    </Modal>
  );

  // Add the new modal for ZIP download
  const filesZipModalContent = (
    <Modal isOpen={showFilesZipModal} onClose={() => setShowFilesZipModal(false)}>
      <div className="p-6">
        <h2 className="text-lg font-semibold mb-4">Download All Files as ZIP</h2>
        <p className="mb-4">This will download a ZIP file containing all files submitted by registrants for their abstracts. No Excel or text summaries will be included.</p>
        {filesZipExportError && (
          <Alert variant="error" title="Export Failed" className="mb-4">
            {filesZipExportError}
          </Alert>
        )}
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="light" onClick={() => setShowFilesZipModal(false)} disabled={isFilesZipExporting}>Cancel</Button>
          <Button variant="primary" onClick={handleDownloadFilesZipDirect} disabled={isFilesZipExporting} leftIcon={<ArrowDownTrayIcon className="h-5 w-5" />}>
            {isFilesZipExporting ? 'Downloading...' : 'Download ZIP'}
          </Button>
        </div>
      </div>
    </Modal>
  );

  console.log('[AbstractsTab] exportModalContent rendered. showExportModal:', showExportModal);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h2 className="text-xl font-semibold">Abstract Submissions</h2>
        <div className="flex flex-col md:flex-row md:items-center gap-2">
          <Button 
            variant="outline" 
            leftIcon={<ArrowDownTrayIcon className="h-5 w-5" />}
            onClick={() => { console.log('[AbstractsTab] Export Abstracts button clicked'); setShowExportModal(true); }}
            disabled={isExporting}
          >
            Export Abstracts
          </Button>
          <Button
            variant="outline"
            leftIcon={<ArrowDownTrayIcon className="h-5 w-5" />}
            onClick={() => setShowFilesZipModal(true)}
            disabled={isFilesZipExporting}
          >
            Download All Files as ZIP
          </Button>
        </div>
      </div>
      <div className="text-xs text-gray-500 mt-1 mb-2">
        <span>Tip: Use the export button to select filters for abstracts export.</span>
      </div>
      {exportModalContent}
      
      {bulkActionError && (
        <Alert variant="error" title="Bulk Action Failed" className="mt-4">
          {bulkActionError}
        </Alert>
      )}
      
      {bulkActionSuccess && (
        <Alert variant="success" title="Bulk Action Completed" className="mt-4">
          {bulkActionSuccess}
        </Alert>
      )}
      
      <Card>
        {selectedAbstractIds.size > 0 && (
            <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center space-x-3 flex-wrap gap-y-2">
                <span className="text-sm font-medium text-gray-700">{selectedAbstractIds.size} selected</span>
                <Button 
                    size="sm" 
                    variant="success" 
                    onClick={() => handleBulkAction('approve')}
                    disabled={isProcessingBulk}
                    leftIcon={isProcessingBulk ? <Spinner size="xs"/> : <CheckCircleIcon className="h-4 w-4"/>}
                >
                    {isProcessingBulk ? 'Processing...' : 'Approve Selected'}
                </Button>
                <Button 
                    size="sm" 
                    variant="danger" 
                    onClick={() => handleBulkAction('reject')}
                    disabled={isProcessingBulk}
                    leftIcon={isProcessingBulk ? <Spinner size="xs"/> : <ExclamationCircleIcon className="h-4 w-4"/>}
                 >
                     {isProcessingBulk ? 'Processing...' : 'Reject Selected'}
                 </Button>
                 <Button
                    size="sm"
                    variant="info"
                    onClick={() => handleOpenAssignReviewerModal(selectedAbstractIds)}
                    disabled={isProcessingBulk}
                    leftIcon={isProcessingBulk ? <Spinner size="xs" /> : <UserGroupIcon className="h-4 w-4" />}
                 >
                    {isProcessingBulk ? 'Processing...' : 'Assign Reviewer(s)'}
                 </Button>
            </div>
        )}
        
        <Tabs
          tabs={[
            { id: "all", label: `All (${abstracts.length})` },
            { id: "approved", label: `Approved (${abstracts.filter(a => a.status === 'approved').length})` },
            { id: "pending", label: `Pending (${abstracts.filter(a => a.status === 'pending').length})` },
            { id: "rejected", label: `Rejected (${abstracts.filter(a => a.status === 'rejected').length})` }
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
        
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    ref={(el) => {
                      if (el) {
                        el.indeterminate = isIndeterminate;
                      }
                    }}
                    className="form-checkbox h-4 w-4 text-primary-600 transition duration-150 ease-in-out"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                  />
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Author
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned Reviewers
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAbstracts.map((abstract) => (
                <tr key={abstract._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    <input
                      type="checkbox"
                      className="form-checkbox h-4 w-4 text-primary-600 transition duration-150 ease-in-out"
                      checked={selectedAbstractIds.has(abstract._id)}
                      onChange={() => handleSelectAbstract(abstract._id)}
                    />
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {abstract.title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {abstract.authorName}
                    <div className="text-xs text-gray-400">{abstract.registrationId}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {abstract.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    {abstract.reviewDetails?.assignedTo?.length || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getStatusBadge(abstract.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(abstract.submittedAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link to={`/events/${event?._id}/abstracts/${abstract._id}`} className="text-primary-600 hover:text-primary-900">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredAbstracts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No abstracts found matching the selected filter.</p>
            </div>
          )}
        </div>
      </Card>
      
      <Card>
        <h3 className="text-lg font-medium mb-4">Abstract Submission Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-1">Submission Period</h4>
            <p>
              {formatDate(event?.abstractSettings?.submissionStartDate)} - {formatDate(event?.abstractSettings?.submissionEndDate)}
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-1">Review Deadline</h4>
            <p>{formatDate(event?.abstractSettings?.reviewDeadline)}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-1">Word Limit</h4>
            <p>{event?.abstractSettings?.maxWordCount || 500} words</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-1">Allow Edits After Submission</h4>
            <p>{event?.abstractSettings?.allowEdit ? 'Yes' : 'No'}</p>
          </div>
        </div>
        
        <div className="mt-6">
          <Button 
            variant="outline"
            onClick={() => navigate(`/events/${event?._id}/settings`)}
          >
            Edit Configuration
          </Button>
        </div>
      </Card>
      
      {showAssignReviewerModal && assignReviewerModalContent}
      {filesZipModalContent}
    </div>
  );
};

export default AbstractsTab; 