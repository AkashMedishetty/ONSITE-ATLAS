import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, Button, Spinner, Alert, Badge, Input, Modal, Pagination } from '../../../components/common';
import QRCode from 'react-qr-code';
import { 
  PlusIcon, 
  DocumentDuplicateIcon, 
  ChartBarIcon, 
  ArrowDownTrayIcon, 
  ArrowUpTrayIcon,
  MagnifyingGlassIcon,
  PrinterIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  EnvelopeIcon,
  QrCodeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PhoneIcon,
  BuildingOffice2Icon,
  TagIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  XCircleIcon,
  NoSymbolIcon,
  UserCircleIcon,
  GlobeAltIcon,
  ClipboardDocumentListIcon,
  InformationCircleIcon,
  TicketIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import registrationService from '../../../services/registrationService';
import eventService from '../../../services/eventService';
import resourceService from '../../../services/resourceService';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import BadgeTemplate from "../../../components/badges/BadgeTemplate";
import { debounce } from 'lodash';
import {
  Table,
  Space,
  Tag,
  Tooltip,
  Select as AntSelect,
  message,
  Modal as AntdModal,
  Popconfirm,
  Button as AntdButton,
  DatePicker
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  ImportOutlined,
  ExportOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  MailOutlined,
  PrinterOutlined,
  QrcodeOutlined,
  UserSwitchOutlined,
  UploadOutlined
} from '@ant-design/icons';
import printService from '../../../services/printService';
import RegistrationForm from '../../Registration/RegistrationForm';
import BulkImportWizard from '../../Registrations/BulkImportWizard';

const { Option } = AntSelect;

// Place these at the top of the component, before any JSX
const dropdownStyle = { background: '#fff', color: '#1a202c' };
const inputClass = 'bg-white text-gray-900';

const RegistrationsTab = ({ eventId }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [registrations, setRegistrations] = useState([]);
  const [error, setError] = useState(null);
  const [activeAction, setActiveAction] = useState(null);
  
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 1,
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const [previewModal, setPreviewModal] = useState(false);
  const [selectedRegistrant, setSelectedRegistrant] = useState(null);
  const [deleteModal, setDeleteModal] = useState(false);
  const [isPrintModalVisible, setIsPrintModalVisible] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [badgeSettings, setBadgeSettings] = useState(null);
  const [isPrinting, setIsPrinting] = useState(false);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    firstName: '', lastName: '', email: '', mobile: '', organization: '', designation: '', country: '',
    mciNumber: '', membership: '',
    customFields: {},
    categoryId: '', status: 'active', registrationType: 'pre-registered', sponsoredBy: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [categories, setCategories] = useState([]);
  
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isLoadingResource, setIsLoadingResource] = useState(false);
  const [resourceUsage, setResourceUsage] = useState([]);
  const [resourceConfig, setResourceConfig] = useState({ meals: [], kitItems: [], certificates: [] });
  const [badgePreviewUrl, setBadgePreviewUrl] = useState(null);
  const [isSendingCertificate, setIsSendingCertificate] = useState(false);
  const [isVoiding, setIsVoiding] = useState(false);
  
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState(null);
  const [registrationTypeFilter, setRegistrationTypeFilter] = useState('');

  // --- Diagnostic State --- 
  const [updateCounter, setUpdateCounter] = useState(0); // Force re-render

  // ADDED: State for event details for the modal
  const [currentEventDetailsForModal, setCurrentEventDetailsForModal] = useState(null);

  // --- Add state for sponsors and event config ---
  const [sponsors, setSponsors] = useState([]);
  const [eventConfig, setEventConfig] = useState(null);

  // --- Fetch sponsors and event config when edit modal opens ---
  useEffect(() => {
    if (isEditModalOpen && eventId) {
      eventService.getEventSponsors(eventId).then(res => {
        setSponsors(res?.results || []);
      }).catch(() => setSponsors([]));
      eventService.getEventById(eventId).then(res => {
        setEventConfig(res?.data?.registrationSettings || null);
      }).catch(() => setEventConfig(null));
    }
  }, [isEditModalOpen, eventId]);

  // Effect to monitor print modal visibility state
  useEffect(() => {
    console.log(`[Effect Log] isPrintModalVisible changed to: ${isPrintModalVisible}`);
  }, [isPrintModalVisible]);

  const [isExporting, setIsExporting] = useState(false); // State for export loading

  const [allRegistrations, setAllRegistrations] = useState([]);

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportFilters, setExportFilters] = useState({
    category: '',
    status: '',
    registrationType: '',
    badgePrinted: '',
    startDate: null,
    endDate: null,
    paymentStatus: '',
    workshopId: '',
  });

  const fetchRegistrations = useCallback(async (page = 1, limit = 10, currentSearch = searchTerm, currentCategory = categoryFilter, currentStatus = statusFilter) => {
    setLoading(true);
    setError(null);
    console.log(`Fetching: Page ${page}, Limit ${limit}, Search: '${currentSearch}', Cat: ${currentCategory}, Status: ${currentStatus}`);
    try {
      const filters = {
        page: page,
        limit: limit,
        ...(currentSearch && { search: currentSearch }),
        ...(currentCategory && currentCategory !== '' && { category: currentCategory }),
        ...(currentStatus && { status: currentStatus }),
        ...(registrationTypeFilter && ['pre-registered','onsite','imported','sponsored','complementary'].includes(registrationTypeFilter) && { registrationType: registrationTypeFilter }),
      };
      const response = await registrationService.getRegistrations(eventId, filters);
      console.log('API Response (Axios):', response);

      const backendData = response?.data;
      
      console.log('Checking backendData structure:', backendData); 

      if (backendData && backendData.success) { 
        let fetchedData = Array.isArray(backendData.data) ? backendData.data : [];
        setAllRegistrations(fetchedData);
        // Frontend fallback filter for category (for display only)
        let filtered = fetchedData;
        if (categoryFilter && categoryFilter !== '') {
          filtered = fetchedData.filter(reg =>
            (reg.category && reg.category._id === categoryFilter) ||
            reg.category === categoryFilter
          );
        }
        setRegistrations(filtered);

        const apiPagination = backendData.pagination || {}; 
        
        const newPaginationState = { 
            currentPage: Number(apiPagination.page) || 1,
            pageSize: Number(apiPagination.limit) || limit,
            totalCount: Number(apiPagination.total) || 0,
            totalPages: Number(apiPagination.totalPages) || 1 
        };
        console.log('Calculated newPaginationState before setting:', newPaginationState);
        
        setPagination(newPaginationState);
        console.log('Pagination state updated (confirming):', newPaginationState);

      } else {
        throw new Error(backendData?.message || response?.statusText || 'Failed to fetch registrations'); 
      }
    } catch (err) {
      console.error('Error fetching registrations:', err);
      setError(`Failed to fetch registrations: ${err.message || err.toString()}`); 
      setRegistrations([]);
      setPagination(prev => ({ ...prev, totalCount: 0, totalPages: 1 }));
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  const isInitialMount = useRef(true);
  
  useEffect(() => {
    if (eventId) {
      console.log("Initial fetch triggered by eventId change or mount");
      fetchRegistrations(1, 10);
      
      const fetchCategories = async () => {
          try {
              const response = await eventService.getEventCategories(eventId);
              setCategories(response.success ? response.data : []);
          } catch (error) { console.error('Error fetching categories:', error); setCategories([]); }
      };
      fetchCategories();
    }
  }, [eventId, fetchRegistrations]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (eventId) { 
        console.log("Filters/search/pageSize changed, re-fetching page 1");
        setPagination(prev => ({ ...prev, currentPage: 1 })); 
        fetchRegistrations(1, pagination.pageSize, searchTerm, categoryFilter, statusFilter);
    }
  }, [searchTerm, categoryFilter, statusFilter, pagination.pageSize, eventId, fetchRegistrations]);
  
  const handleAddRegistration = () => {
    if (!eventId) {
      setError("Cannot add registration: Event ID is missing");
      return;
    }
    
    navigate(`/events/${eventId}/registrations/new`);
  };
  
  const handleBulkImport = () => {
    if (!eventId) {
      setError("Cannot import registrations: Event ID is missing");
      return;
    }
    
    navigate(`/events/${eventId}/registrations/bulk-import`);
  };
  
  const handleExport = async () => {
    setIsExporting(true);
    message.loading({ content: 'Generating export...', key: 'exportReg' });
    
    try {
      const filters = {
        ...(searchTerm && { search: searchTerm }), 
        ...(categoryFilter && { category: categoryFilter }), 
        ...(statusFilter && { status: statusFilter }), 
      };
      
      const response = await registrationService.exportRegistrations(eventId, filters);
      
      // Check if the response is a blob
      if (response && response.data instanceof Blob) {
        const blob = response.data;
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        // Extract filename from content-disposition header if available
        const contentDisposition = response.headers['content-disposition'];
        let filename = `registrations_${eventId}_${new Date().toISOString().split('T')[0]}.xlsx`; // Default filename
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename\*?=(?:UTF-8''|\")?([^;\"]+)/i);
          if (filenameMatch && filenameMatch[1]) {
            filename = decodeURIComponent(filenameMatch[1].replace(/\"/g, ''));
          }
        }
        
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        
        // Clean up
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        message.success({ content: 'Export downloaded successfully!', key: 'exportReg', duration: 3 });
      } else {
        // Handle cases where the response might be JSON error
        let errorMessage = 'Failed to generate export file.';
        if (response && response.data && !(response.data instanceof Blob)) {
          try {
            // Attempt to parse JSON error from blob if needed, or check if data is already JSON
            const errorData = (typeof response.data === 'string') ? JSON.parse(response.data) : response.data;
            errorMessage = errorData.message || errorMessage;
          } catch (e) {
            console.error("Could not parse error response:", response.data);
          }
        }
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("Error exporting registrations:", error);
      message.error({ content: `Export failed: ${error.message}`, key: 'exportReg', duration: 3 });
    } finally {
      setIsExporting(false);
    }
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric'
      };
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (err) {
      return 'Invalid date';
    }
  };
  
  const handleViewRegistration = (registrationId) => {
    if (!eventId) {
      setError("Cannot view registration: Event ID is missing");
      return;
    }
    
    navigate(`/events/${eventId}/registrations/${registrationId}`);
  };

  const handlePreviewRegistration = async (registration) => {
    console.log('[Preview Modal] handlePreviewRegistration triggered with:', registration);
    setSelectedRegistrant(registration);

    // Fetch badge settings if not already loaded
    if (!badgeSettings) {
      console.log('[Preview Modal] Badge settings not loaded, fetching...');
      try {
        const fetchedSettings = await fetchBadgeSettings(eventId);
        if (fetchedSettings) {
          setBadgeSettings(fetchedSettings); // Update state
          console.log('[Preview Modal] Fetched and set badgeSettings:', fetchedSettings);
        } else {
          console.warn('[Preview Modal] Failed to fetch badge settings for preview.');
          // badgeSettings will remain null, BadgeTemplate will use fallback
        }
      } catch (error) {
        console.error('[Preview Modal] Error fetching badge settings:', error);
        // badgeSettings will remain null
      }
    }
    setPreviewModal(true);
  };

  // Always fetch the default designer badge template for the event, with detailed logging
  const fetchBadgeSettings = async (eventId) => {
    try {
      console.log('[fetchBadgeSettings] Fetching templates for eventId:', eventId);
      const templatesResponse = await import('../../../services/badgeTemplateService').then(m => m.default.getTemplates(eventId));
      console.log('[fetchBadgeSettings] API response:', templatesResponse);
      if (templatesResponse.success && Array.isArray(templatesResponse.data)) {
        // Log all templates for this event
        console.log('[fetchBadgeSettings] Templates fetched:', templatesResponse.data);
        // Defensive: ensure eventId is string
        const eventIdStr = typeof eventId === 'string' ? eventId : (eventId?.$oid || String(eventId));
        // Pick the default template for this event
        const defaultTemplate = templatesResponse.data.find(t => t.isDefault && (t.event === eventIdStr || t.event?._id === eventIdStr || t.event?.$oid === eventIdStr));
        console.log('[fetchBadgeSettings] Picked default template:', defaultTemplate);
        if (defaultTemplate) {
          return defaultTemplate;
        } else {
          console.warn('[fetchBadgeSettings] No default designer template found for event:', eventIdStr);
          return null;
        }
      } else {
        console.warn('[fetchBadgeSettings] No templates found or API error for event:', eventId);
        return null;
      }
    } catch (err) {
      console.error('[fetchBadgeSettings] Error fetching designer templates:', err);
      return null;
    }
  };

  // Fetch the latest badge template every time before printing
  const handlePrintBadgeClick = async (registration) => {
    console.log('[Action] handlePrintBadgeClick triggered', registration);
    // Always fetch the latest badge template for this event
    let currentBadgeSettings = null;
    try {
      currentBadgeSettings = await fetchBadgeSettings(eventId);
      if (!currentBadgeSettings) {
        message.error('Failed to load badge settings. Cannot open print modal.');
        console.error('[Print Badge] fetchBadgeSettings returned null or failed.');
        return; // Stop if settings failed to load
      }
      setBadgeSettings(currentBadgeSettings); // Always set the latest
      console.log('[Print Badge] Fetched badge settings successfully:', currentBadgeSettings);
    } catch (error) {
      message.error(`Error fetching badge settings: ${error.message}`);
      console.error('[Print Badge] Error in fetchBadgeSettings:', error);
      return; // Stop if fetch errored
    }
    // Prepare registration data
    const registrationWithEvent = {
      ...registration,
      eventId: eventId,
      qrCode: registration.registrationId // Assuming QR code is the registration ID
    };
    setSelectedRegistration(registrationWithEvent);
    setIsPrintModalVisible(true);
    console.log('[State Update] setIsPrintModalVisible called with true'); 
  };

  // Always fetch the latest badge template before printing
  const handlePrintBadge = async () => {
    if (!selectedRegistration) return;
    setIsPrinting(true);
    let currentBadgeSettings = badgeSettings;
    try {
      // Always fetch the latest template before printing
      currentBadgeSettings = await fetchBadgeSettings(eventId);
      if (!currentBadgeSettings) {
        message.error('Failed to load badge settings. Cannot print badge.');
        setIsPrinting(false);
        return;
      }
      setBadgeSettings(currentBadgeSettings); // Update state for consistency
      // Calculate badge pixel size
      const DPIN = 100;
      const size = currentBadgeSettings.size || { width: 3.375, height: 5.375 };
      const unit = currentBadgeSettings.unit || 'in';
      let badgeWidthPx, badgeHeightPx;
      if (unit === 'in') {
        badgeWidthPx = (size.width || 0) * DPIN;
        badgeHeightPx = (size.height || 0) * DPIN;
      } else if (unit === 'cm') {
        badgeWidthPx = (size.width || 0) * (DPIN / 2.54);
        badgeHeightPx = (size.height || 0) * (DPIN / 2.54);
      } else if (unit === 'mm') {
        badgeWidthPx = (size.width || 0) * (DPIN / 25.4);
        badgeHeightPx = (size.height || 0) * (DPIN / 25.4);
      } else {
        badgeWidthPx = (size.width || 0);
        badgeHeightPx = (size.height || 0);
      }
      // Create a hidden container for print (not the modal preview node)
      const hiddenDiv = document.createElement('div');
      hiddenDiv.style.position = 'fixed';
      hiddenDiv.style.left = '-9999px';
      hiddenDiv.style.top = '0';
      hiddenDiv.style.width = `${badgeWidthPx}px`;
      hiddenDiv.style.height = `${badgeHeightPx}px`;
      document.body.appendChild(hiddenDiv);
      // Render only the badge (no modal/buttons)
      const { createRoot } = await import('react-dom/client');
      const root = createRoot(hiddenDiv);
      root.render(
        <BadgeTemplate
          registrationData={normalizeRegistrationData(selectedRegistration)}
          template={currentBadgeSettings}
          previewMode={false}
          scale={1}
        />
      );
      await new Promise(resolve => setTimeout(resolve, 100));
      const canvas = await html2canvas(hiddenDiv, { scale: 1, useCORS: true, logging: false, allowTaint: true, width: badgeWidthPx, height: badgeHeightPx });
      const dataUrl = canvas.toDataURL('image/png');
      root.unmount();
      document.body.removeChild(hiddenDiv);
      // Print window
      const printWindow = window.open('', '_blank');
      if (!printWindow) { throw new Error("Could not open print window. Please check your popup blocker settings."); }
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Print Badge - ${selectedRegistration.personalInfo?.firstName || ''} ${selectedRegistration.personalInfo?.lastName || ''}</title>
            <style>
              @media print {
                @page { size: ${size.width}${unit} ${size.height}${unit}; margin: 0; }
                body { margin: 0; }
                .badge-img { page-break-inside: avoid; width: ${size.width}${unit}; height: ${size.height}${unit}; display: block; }
              }
              body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background-color: #fff; }
              .badge-img { width: ${size.width}${unit}; height: ${size.height}${unit}; object-fit: contain; display: block; box-shadow: none; border: none; }
            </style>
          </head>
          <body onload="window.print(); window.onafterprint = function(){ window.close(); }">
            <img src="${dataUrl}" class="badge-img" alt="Badge" />
          </body>
        </html>
      `);
      printWindow.document.close();
    } catch (error) {
      console.error('Error printing badge:', error);
      message.error(`Failed to print badge: ${error.message}`);
    } finally {
      setIsPrinting(false);
    }
  };

  const handleSendCertificate = async (registration) => {
    setIsSendingCertificate(true);
    message.loading({ content: 'Sending certificate...', key: 'sendCert' });
    try {
      const certificateSettings = await eventService.getCertificateSettings(eventId);
      console.log('Certificate settings:', certificateSettings);
      
      if (!certificateSettings || !certificateSettings.data) {
        setError('Certificate settings not found for this event');
        setIsSendingCertificate(false);
        return;
      }
      
      const emailSettings = await eventService.getEmailSettings(eventId);
      console.log('Email settings:', emailSettings);
      
      if (!emailSettings || !emailSettings.data) {
        setError('Email settings not found for this event');
        setIsSendingCertificate(false);
        return;
      }
      
      const response = await registrationService.sendCertificate(
        eventId, 
        registration._id,
        {
          certificateType: certificateSettings.data.defaultType || 'attendance',
          emailTemplate: emailSettings.data.certificateTemplate || 'default',
          includeQR: true
        }
      );
      
      console.log('Certificate sent response:', response);
      
      if (response && response.success) {
        message.success({ content: 'Certificate sent successfully!', key: 'sendCert', duration: 2 });
      } else {
        setError(`Failed to send certificate: ${response?.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error sending certificate:', err);
      setError(`Failed to send certificate: ${err.message}`);
    } finally {
      setIsSendingCertificate(false);
    }
  };

  // --- Update handleEditRegistration to populate all fields ---
  const handleEditRegistration = (registration) => {
    const personal = registration.personalInfo || {};
    const professional = registration.professionalInfo || {};
    setEditFormData({
      _id: registration._id,
      registrationId: registration.registrationId,
      firstName: personal.firstName || '',
      lastName: personal.lastName || '',
      email: personal.email || '',
      mobile: personal.phone || '',
      organization: personal.organization || '',
      designation: personal.designation || '',
      country: personal.country || '',
      mciNumber: professional.mciNumber || '',
      membership: professional.membership || '',
      customFields: { ...registration.customFields },
      categoryId: registration.category?._id || '',
      status: registration.status || 'active',
      registrationType: registration.registrationType || 'pre-registered',
      sponsoredBy: registration.sponsoredBy || ''
    });
    setValidationErrors({});
    setIsEditModalOpen(true);
  };

  // --- Update handleEditFormChange to support all fields ---
  const handleEditFormChange = (e) => {
    const { name, value, type, checked } = e.target || {};
    if (name?.startsWith('customFields.')) {
      const field = name.replace('customFields.', '');
      setEditFormData(prev => ({ ...prev, customFields: { ...prev.customFields, [field]: value } }));
    } else {
      setEditFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    }
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  const validateEditForm = () => {
    const errors = {};
    
    if (!editFormData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }
    
    if (!editFormData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }
    
    if (!editFormData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(editFormData.email)) {
      errors.email = 'Email is invalid';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // --- Update handleUpdateRegistration to send all fields ---
  const handleUpdateRegistration = async () => {
    if (!validateEditForm()) return;
    setIsSubmitting(true);
    try {
      const updateData = {
        personalInfo: {
          firstName: editFormData.firstName,
          lastName: editFormData.lastName,
          email: editFormData.email,
          phone: editFormData.mobile,
          organization: editFormData.organization,
          designation: editFormData.designation,
          country: editFormData.country
        },
        professionalInfo: {
          mciNumber: editFormData.mciNumber,
          membership: editFormData.membership
        },
        customFields: editFormData.customFields,
        categoryId: editFormData.categoryId,
        status: editFormData.status,
        registrationType: editFormData.registrationType,
        sponsoredBy: editFormData.registrationType === 'sponsored' ? editFormData.sponsoredBy : undefined
      };
      const response = await registrationService.updateRegistration(eventId, editFormData._id, updateData);
      if (response?.data?.success) {
        const updatedRegData = response.data.data;
        setRegistrations(prev => {
          const idx = prev.findIndex(r => r._id === editFormData._id);
          if (idx === -1) return [...prev, updatedRegData];
          const newRegs = [...prev];
          newRegs[idx] = updatedRegData;
          return newRegs;
        });
        setIsEditModalOpen(false);
        setError(null);
        message.success('Registration updated successfully!');
      } else {
        setError(`Failed to update registration: ${response?.data?.message || response?.message || 'Unknown error'}`);
      }
    } catch (err) {
      setError(`Error updating registration: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDeleteRegistration = (registration) => {
    console.log('[Action] confirmDeleteRegistration triggered', registration);
    setSelectedRegistrant(registration);
    setDeleteModal(true);
  };

  const handleDeleteRegistration = async () => {
    if (!selectedRegistrant) return;
    
    setLoading(true);
    try {
      const response = await registrationService.deleteRegistration(eventId, selectedRegistrant._id);
      if (response && response.success) {
        message.success('Registration deleted successfully');
        setDeleteModal(false);
        setSelectedRegistrant(null);

        // Check if we need to adjust the page number
        let pageToFetch = pagination.currentPage;
        if (registrations.length === 1 && pagination.currentPage > 1) {
          // If this was the last item on the current page (and not page 1)
          pageToFetch = pagination.currentPage - 1;
        }
        
        // Fetch with potentially adjusted page number
        fetchRegistrations(pageToFetch, pagination.pageSize, searchTerm, categoryFilter, statusFilter);

      } else {
        throw new Error(response?.message || response?.message || 'Unknown error during deletion');
      }
    } catch (err) {
      console.error("Error deleting registration:", err)
      message.error(`Failed to delete registration: ${err.message}`);
      // setLoading(false); // Already in finally
      setDeleteModal(false);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleCategoryChange = (value) => {
    setCategoryFilter(value || '');
  };
  
  const handleStatusChange = (value) => {
    setStatusFilter(value);
  };

  const handlePageChange = (newPage) => {
    console.log(`Changing to page: ${newPage}`);
    fetchRegistrations(newPage, pagination.pageSize, searchTerm, categoryFilter, statusFilter);
  };

  const handlePageSizeChange = (newPageSize) => {
    console.log(`Changing page size to: ${newPageSize}`);
    setPagination(prev => ({ ...prev, pageSize: newPageSize, currentPage: 1 }));
    fetchRegistrations(1, newPageSize, searchTerm, categoryFilter, statusFilter);
  };

  const handleViewDetails = async (registration) => {
    console.log('[Action] handleViewDetails triggered for:', registration.registrationId);
    setIsLoadingResource(true);
    setSelectedRegistrant(registration);
    setResourceUsage([]);
    setResourceConfig({ meals: [], kitItems: [], certificates: [] });
    setBadgeSettings(null);
    setCurrentEventDetailsForModal(null); // Reset event details for modal
    
    try {
      // Use new modal endpoint for resource usage
      const [usageResponse, configResponse, fetchedBadgeSettings, eventDetailsResponse] = await Promise.all([
        resourceService.getRegistrationResourceUsageModal(eventId, registration._id),
        eventService.getResourceConfig(eventId),
        fetchBadgeSettings(eventId),
        eventService.getEventById(eventId) // Fetch event details
      ]);

      console.log('[Details Fetch] Usage Response:', usageResponse);
      console.log('[Details Fetch] Config Response:', configResponse);
      console.log('[Details Fetch] Badge Settings Response:', fetchedBadgeSettings);
      console.log('[Details Fetch] Event Details Response:', eventDetailsResponse);

      // Use enriched resource usage from new endpoint
      if (usageResponse?.success && Array.isArray(usageResponse.data)) {
        setResourceUsage(usageResponse.data);
      } else {
         console.warn("Could not load resource usage or format invalid:", usageResponse);
         setResourceUsage([]);
      }

      if (configResponse?.success && configResponse.data) {
         setResourceConfig({
            meals: configResponse.data.meals || [],
            kitItems: configResponse.data.kitItems || [],
            certificates: configResponse.data.certificates || []
         });
      } else {
         console.warn("Could not load resource config or format invalid:", configResponse);
         setResourceConfig({ meals: [], kitItems: [], certificates: [] });
      }

      if (fetchedBadgeSettings) {
        setBadgeSettings(fetchedBadgeSettings);
        console.log('[Details Fetch] Badge settings state updated.');
      } else {
        console.warn('[Details Fetch] Badge settings not found or failed to load for preview.');
        setBadgeSettings(null);
      }

      if (eventDetailsResponse?.success && eventDetailsResponse.data) {
        setCurrentEventDetailsForModal(eventDetailsResponse.data);
        console.log('[Details Fetch] Event details for modal state updated.');
      } else {
        console.warn('[Details Fetch] Failed to load event details for modal.');
        setCurrentEventDetailsForModal(null);
      }

      setIsDetailModalOpen(true);
      console.log('[Details Fetch] Opening detail modal.');

    } catch (error) {
      console.error("Error fetching registration details:", error);
      message.error(`Failed to load details: ${error.message}`);
      setIsDetailModalOpen(false);
    } finally {
      setIsLoadingResource(false);
    }
  };

  const handleVoidResource = async (resourceUsageId) => {
    if (!selectedRegistrant || !resourceUsageId) return;
    
    setIsVoiding(true);
    message.loading({ content: 'Voiding resource...', key: `void-${resourceUsageId}` });
    
    try {
      const response = await registrationService.voidResourceUsage(
        eventId,
        selectedRegistrant._id,
        resourceUsageId
      );
      
      console.log("Void API response:", response);
      
      if (response?.data?.success) {
        message.success({ content: 'Resource usage voided successfully!', key: `void-${resourceUsageId}`, duration: 2 });
        
        setResourceUsage(prevUsage => 
          prevUsage.map(item => 
            item._id === resourceUsageId 
              ? { ...item, isVoided: true, voidedAt: new Date(), voidedBy: response.data.data?.voidedBy }
              : item
          )
        );
      } else {
        throw new Error(response?.data?.message || response?.message || 'Failed to void resource');
      }
      
    } catch (error) {
      console.error('Error voiding resource:', error);
      message.error({ content: `Failed to void resource: ${error.message}`, key: `void-${resourceUsageId}`, duration: 3 });
    } finally {
      setIsVoiding(false);
    }
  };

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [currentRegistration, setCurrentRegistration] = useState(null);

  const handleOpenAddModal = () => {
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
  };

  const handleOpenViewModal = () => {
    setIsViewModalOpen(true);
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
  };

  const handleOpenDeleteModal = () => {
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
  };

  const handleOpenPrintModal = () => {
    setIsPrintModalOpen(true);
  };

  const handleClosePrintModal = () => {
    setIsPrintModalOpen(false);
  };

  const columns = useMemo(() => [
    {
      title: 'ID',
      dataIndex: 'registrationId',
      key: 'registrationId',
      width: 100,
      fixed: 'left',
      render: (text) => <a>{text}</a>,
    },
    {
      title: 'Name',
      dataIndex: 'personalInfo.firstName',
      key: 'firstName',
      width: 150,
      render: (text, record) => (
        <a>{`${record.personalInfo?.firstName || ''} ${record.personalInfo?.lastName || ''}`}</a>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'personalInfo.email',
      key: 'email',
      width: 200,
    },
    {
      title: 'Category',
      dataIndex: 'category.name',
      key: 'category',
      width: 150,
    },
    {
      title: 'Mobile',
      dataIndex: 'personalInfo.phone',
      key: 'phone',
      width: 150,
    },
    {
      title: 'Registration Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (text) => <span>{formatDate(text)}</span>,
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 100,
      render: (_, record) => (
        <Space size="small">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePreviewRegistration(record);
            }}
            className="text-blue-600 hover:text-blue-900"
            title="Preview"
          >
            <EyeIcon className="h-5 w-5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrintBadgeClick(record);
            }}
            className="text-green-600 hover:text-green-900"
            title="Print Badge"
          >
            <PrinterIcon className="h-5 w-5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEditRegistration(record);
            }}
            className="text-gray-600 hover:text-gray-900"
            title="Edit"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              confirmDeleteRegistration(record);
            }}
            className="text-red-600 hover:text-red-900"
            title="Delete"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </Space>
      ),
    },
  ], [handlePreviewRegistration, handlePrintBadgeClick, handleEditRegistration, confirmDeleteRegistration]);

  // Helper to normalize registration data for badge rendering
  function normalizeRegistrationData(reg) {
    if (!reg) return {};
    const personal = reg.personalInfo || {};
    return {
      ...reg,
      firstName: personal.firstName,
      lastName: personal.lastName,
      name: personal.name || `${personal.firstName || ''} ${personal.lastName || ''}`,
      organization: personal.organization,
      country: personal.country,
      designation: personal.designation,
      email: personal.email,
      phone: personal.phone,
      // Add more fields as needed
    };
  }

  // After fetchRegistrations, if categories is empty, fallback to extracting from registrations
  useEffect(() => {
    if (categories.length === 0 && registrations.length > 0) {
      const uniqueCategories = [];
      const seen = new Set();
      for (const reg of registrations) {
        const cat = reg.category;
        if (cat && cat._id && !seen.has(cat._id)) {
          uniqueCategories.push(cat);
          seen.add(cat._id);
        }
      }
      setCategories(uniqueCategories);
    }
  }, [registrations]);

  // Derive allCategories: combine categories from API and unique categories from registrations
  const allCategories = useMemo(() => {
    const apiCats = Array.isArray(categories) ? categories : [];
    const seen = new Set(apiCats.map(cat => cat._id));
    const cats = [...apiCats];
    for (const reg of allRegistrations) {
      const cat = reg.category;
      // If category is an object and not already in the list
      if (cat && typeof cat === 'object' && cat._id && !seen.has(cat._id)) {
        cats.push(cat);
        seen.add(cat._id);
      }
      // If category is a string (ID) and not already in the list
      if (cat && typeof cat === 'string' && !seen.has(cat)) {
        cats.push({ _id: cat, name: cat }); // Fallback: show ID as name
        seen.add(cat);
      }
    }
    return cats;
  }, [categories, allRegistrations]);

  if (activeAction === 'new') {
    handleAddRegistration();
    return null;
  }
  
  if (activeAction === 'import') {
    handleBulkImport();
    return null;
  }
  
  if (!eventId) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Event data is not available.</p>
      </div>
    );
  }

  const totalPages = Math.ceil((searchTerm ? searchResults.length : registrations.length) / pagination.pageSize);
  
  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-semibold text-gray-800">Registrations</h2>
        <div className="flex flex-wrap gap-2">
          <AntdButton 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleAddRegistration} 
            style={{ 
              backgroundColor: '#2A4365', // Primary color 
              color: '#ffffff',         // White text
              opacity: 1               // Full opacity
            }}
            className="inline-flex" // Ensure display
          >
            Add
          </AntdButton>
          <AntdButton 
            icon={<ImportOutlined />} 
            onClick={() => navigate(`/events/${eventId}/registrations/bulk-import`)}
            className="inline-flex" // Ensure display
          >
            Import
          </AntdButton>
          <AntdButton 
            icon={<ExportOutlined />} 
            onClick={handleExport}
            loading={isExporting}
            className="inline-flex" // Ensure display
          >
            Export
          </AntdButton>
          <AntdButton
            icon={<ExportOutlined />}
            onClick={() => setIsExportModalOpen(true)}
            className="inline-flex"
          >
            Advanced Export
          </AntdButton>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
        <Input
            placeholder="Search by name, email, ID..."
            prefix={<SearchOutlined className="text-gray-400" />}
            value={searchTerm}
            onChange={handleSearchChange}
            allowClear
            className="w-full md:max-w-sm"
        />
        <div className="flex gap-2">
            <AntSelect
                placeholder="Filter by Category"
                allowClear
                style={{ width: 200, background: '#fff', color: '#1a202c', border: '1px solid #2A4365' }}
                dropdownStyle={{ background: '#fff', color: '#1a202c', border: '1px solid #2A4365' }}
                className={inputClass}
                value={categoryFilter || ''}
                onChange={handleCategoryChange}
            >
                {allCategories.map(cat => (
                    <Option key={cat._id} value={cat._id}>{cat.name}</Option>
                ))}
            </AntSelect>
            <AntSelect
                placeholder="Filter by Status"
                allowClear
                style={{ width: 150, background: '#fff', color: '#1a202c', border: '1px solid #2A4365' }}
                dropdownStyle={{ background: '#fff', color: '#1a202c', border: '1px solid #2A4365' }}
                className={inputClass}
                value={statusFilter}
                onChange={handleStatusChange}
            >
                <Option value="active">Active</Option>
                <Option value="cancelled">Cancelled</Option>
                <Option value="no-show">No-Show</Option>
            </AntSelect>
            <AntSelect
                placeholder="Filter by Reg. Type"
                allowClear
                style={{ width: 180, background: '#fff', color: '#1a202c', border: '1px solid #2A4365' }}
                dropdownStyle={{ background: '#fff', color: '#1a202c', border: '1px solid #2A4365' }}
                className={inputClass}
                value={registrationTypeFilter}
                onChange={setRegistrationTypeFilter}
            >
                <Option value="pre-registered">Pre-Registered</Option>
                <Option value="onsite">Onsite</Option>
                <Option value="imported">Imported</Option>
                <Option value="sponsored">Sponsored</Option>
                <Option value="complementary">Complementary</Option>
            </AntSelect>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
          <span className="ml-2 text-gray-500">Loading registrations...</span>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Failed to fetch registrations</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
                <p className="mt-2">Try refreshing the page or check the API connectivity.</p>
                {eventId && (
                  <div className="mt-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={fetchRegistrations}
                      className="mr-2"
                    >
                      Retry
                    </Button>
                    <Button 
                      variant="primary" 
                      size="sm"
                      onClick={handleAddRegistration}
                    >
                      Add Registration
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <Card>
          {registrations.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No registrations found for this event.</p>
              {eventId && (
                <div className="flex justify-center space-x-2">
                  <Button 
                    variant="primary" 
                    size="sm"
                    onClick={handleAddRegistration}
                  >
                    Add Registration
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate(`/events/${eventId}/registrations/bulk-import`)}
                  >
                    Import Registrations
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mobile
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Registration Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {registrations.map((registration) => {
                    console.log(`[Render Check] Rendering row key: ${registration._id}, personalInfo:`, registration?.personalInfo);
                    return (
                    <tr key={registration._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer"
                        onClick={() => handleViewDetails(registration)}>
                        {registration.registrationId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {`${registration.personalInfo?.firstName || ''} ${registration.personalInfo?.lastName || ''}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {registration.personalInfo?.email || ''}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {registration.category?.name || ''}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {registration.personalInfo?.phone || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(registration.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex space-x-2 justify-end">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePreviewRegistration(registration);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                            title="Preview"
                          >
                            <EyeIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePrintBadgeClick(registration);
                            }}
                            className="text-green-600 hover:text-green-900"
                            title="Print Badge"
                          >
                            <PrinterIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditRegistration(registration);
                            }}
                            className="text-gray-600 hover:text-gray-900"
                            title="Edit"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                        <button
                            onClick={(e) => {
                              e.stopPropagation();
                              confirmDeleteRegistration(registration);
                            }}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                        >
                            <TrashIcon className="h-5 w-5" />
                        </button>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        totalCount={pagination.totalCount}
        pageSize={pagination.pageSize}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        showPageInfo={false}
      />

      {selectedRegistrant && (
        <Modal
          isOpen={previewModal}
          onClose={() => {
            console.log('[Preview Modal] Closing modal');
            setPreviewModal(false);
          }}
          title={`Badge Preview: ${selectedRegistrant.personalInfo?.firstName} ${selectedRegistrant.personalInfo?.lastName}`}
          centered={true}
        >
          <div className="flex flex-col items-center space-y-4">
            {(() => {
              console.log('[Preview Modal] Rendering badge preview. badgeSettings:', badgeSettings, 'selectedRegistrant:', selectedRegistrant);
              if (badgeSettings) {
                console.log('[Preview Modal] Rendering BadgeTemplate with badgeSettings.');
                return (
                  <div className="mb-4 p-4 border rounded flex justify-center bg-white">
                    <BadgeTemplate 
                      registrationData={normalizeRegistrationData(selectedRegistrant)}
                      template={badgeSettings}
                      previewMode={true}
                    />
                  </div>
                );
              } else {
                console.log('[Preview Modal] badgeSettings missing, rendering fallback preview.');
                return (
                  <div className="mb-4 p-4 border rounded flex flex-col items-center bg-white">
                    <div className="font-bold text-lg mb-2">{selectedRegistrant.personalInfo?.firstName} {selectedRegistrant.personalInfo?.lastName}</div>
                    <div className="text-gray-600 mb-2">ID: {selectedRegistrant.registrationId}</div>
                    <QRCode value={selectedRegistrant.registrationId || 'no-id'} size={96} />
                  </div>
                );
              }
            })()}
            <div className="flex justify-end space-x-3 w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  console.log('[Preview Modal] Close button clicked');
                  setPreviewModal(false);
                }}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {isEditModalOpen && (
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
          title="Edit Registration"
        >
          <div className="space-y-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">First Name</label>
            <Input
                id="firstName" 
              name="firstName"
              value={editFormData.firstName}
              onChange={handleEditFormChange}
              error={validationErrors.firstName}
            />
          </div>
          <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Last Name</label>
            <Input
                id="lastName" 
              name="lastName"
              value={editFormData.lastName}
              onChange={handleEditFormChange}
              error={validationErrors.lastName}
            />
          </div>
          <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <Input
                id="email" 
              name="email"
                type="email"
              value={editFormData.email}
              onChange={handleEditFormChange}
              error={validationErrors.email}
            />
          </div>
          <div>
              <label htmlFor="mobile" className="block text-sm font-medium text-gray-700">Mobile</label>
            <Input
                id="mobile" 
              name="mobile"
              value={editFormData.mobile}
              onChange={handleEditFormChange}
            />
          </div>
          <div>
              <label htmlFor="organization" className="block text-sm font-medium text-gray-700">Organization</label>
            <Input
                id="organization" 
              name="organization"
              value={editFormData.organization}
              onChange={handleEditFormChange}
            />
          </div>
          <div>
              <label htmlFor="designation" className="block text-sm font-medium text-gray-700">Designation</label>
            <Input
                id="designation" 
              name="designation"
              value={editFormData.designation}
              onChange={handleEditFormChange}
            />
          </div>
          <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700">Country</label>
            <Input
                id="country" 
              name="country"
              value={editFormData.country}
              onChange={handleEditFormChange}
            />
          </div>
          <div>
              <label htmlFor="mciNumber" className="block text-sm font-medium text-gray-700">MCI Number</label>
            <Input
                id="mciNumber" 
              name="mciNumber"
              value={editFormData.mciNumber}
              onChange={handleEditFormChange}
            />
          </div>
          <div>
              <label htmlFor="membership" className="block text-sm font-medium text-gray-700">Membership</label>
            <Input
                id="membership" 
              name="membership"
              value={editFormData.membership}
              onChange={handleEditFormChange}
            />
          </div>
          {/* Render custom fields dynamically */}
          {editFormData.customFields && Object.keys(editFormData.customFields).map((key) => (
            <div key={key}>
              <label htmlFor={`customFields.${key}`} className="block text-sm font-medium text-gray-700">{key}</label>
              <Input
                id={`customFields.${key}`}
                name={`customFields.${key}`}
                value={editFormData.customFields[key] || ''}
                onChange={handleEditFormChange}
              />
            </div>
          ))}
          <div>
              <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700">Category</label>
              <AntSelect 
              value={editFormData.categoryId}
                 onChange={(value) => handleEditFormChange({ target: { name: 'categoryId', value } })}
                 style={{ width: '100%' }}
              >
                {categories.map(cat => (
                  <Option key={cat._id} value={cat._id}>{cat.name}</Option>
                ))}
              </AntSelect>
            </div>
            <div>
              <label htmlFor="registrationType" className="block text-sm font-medium text-gray-700">Registration Type</label>
              <AntSelect
                id="registrationType"
                value={editFormData.registrationType}
                onChange={value => handleEditFormChange({ target: { name: 'registrationType', value } })}
                style={{ width: '100%' }}
              >
                <Option value="pre-registered">Pre-Registered</Option>
                <Option value="onsite">Onsite</Option>
                <Option value="imported">Imported</Option>
                <Option value="sponsored">Sponsored</Option>
                <Option value="complementary">Complementary</Option>
              </AntSelect>
            </div>
            <div className="flex justify-end space-x-2 mt-4">
                <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                <Button variant="primary" onClick={handleUpdateRegistration} loading={isSubmitting}>Save Changes</Button>
          </div>
        </div>
      </Modal>
      )}

      {selectedRegistrant && (
        <Modal
          isOpen={deleteModal}
          onClose={() => setDeleteModal(false)}
          title="Confirm Deletion"
          centered={true}
        >
          <p>Are you sure you want to delete registration for 
             <strong> {selectedRegistrant.personalInfo?.firstName} {selectedRegistrant.personalInfo?.lastName}</strong> ({selectedRegistrant.registrationId})?
          </p>
          <div className="flex justify-end space-x-2 mt-6">
            <Button variant="outline" onClick={() => setDeleteModal(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleDeleteRegistration} loading={loading}>Delete</Button>
          </div>
        </Modal>
      )}

      {console.log(`[Render Check - Print Modal] isVisible: ${isPrintModalVisible}, selectedReg: ${!!selectedRegistration}, badgeSettings: ${!!badgeSettings}`)}
      {selectedRegistration && (
        <Modal
          isOpen={isPrintModalVisible}
          onClose={() => setIsPrintModalVisible(false)}
          title={`Print Badge: ${selectedRegistration.personalInfo?.firstName} ${selectedRegistration.personalInfo?.lastName}`}
        >
          <div id="badge-preview-container" className="mb-4 p-4 border rounded flex justify-center">
            {(() => {
              console.log('[Print Modal] badgeSettings passed to BadgeTemplate:', badgeSettings);
              if (!badgeSettings) {
                return <div className="text-red-600 font-semibold">No default badge template found for this event. Please set a default template in the Badge Designer.</div>;
              }
              return (
                <BadgeTemplate 
                  registrationData={normalizeRegistrationData(selectedRegistration)}
                  template={badgeSettings}
                />
              );
            })()}
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsPrintModalVisible(false)}>Cancel</Button>
            <Button 
              variant="primary" 
              onClick={handlePrintBadge} 
              loading={isPrinting ? true : undefined}
              disabled={!badgeSettings}
            >
              Print
            </Button>
          </div>
        </Modal>
      )}

      {/* --- Detail Modal --- */}
      {selectedRegistrant && (
        <AntdModal
          open={isDetailModalOpen}
          onCancel={() => setIsDetailModalOpen(false)}
          title="Registration Details"
          width={1000}
          footer={[
            <AntdButton key="print" icon={<PrinterOutlined />} onClick={() => handlePrintBadgeClick(selectedRegistrant)} disabled={!badgeSettings}>
              Print Badge
            </AntdButton>,
            <AntdButton key="cert" icon={<MailOutlined />} onClick={() => handleSendCertificate(selectedRegistrant)} loading={isSendingCertificate ? true : undefined}>
              Send Certificate
            </AntdButton>,
            <AntdButton key="close" onClick={() => setIsDetailModalOpen(false)}>
              Close
            </AntdButton>,
          ]}
        >
          {isLoadingResource ? (
            <div className="flex justify-center items-center h-40">
              <Spinner />
              <span className="ml-2">Loading details...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-x-8 gap-y-8 p-6">
              <div className="md:col-span-3 space-y-6">
                <div className="pb-4 border-b border-gray-200">
                  <h3 className="text-2xl font-bold text-gray-900 leading-tight">
                    {`${selectedRegistrant.personalInfo?.firstName} ${selectedRegistrant.personalInfo?.lastName}`}
                  </h3>
                  <div className="mt-1">
                    <Tag color={selectedRegistrant.category?.color || 'blue'} icon={<TagIcon className="h-4 w-4 mr-1 inline-block"/>}>
                       {selectedRegistrant.category?.name || 'N/A'}
                    </Tag>
                    <span className="ml-3 text-sm text-gray-500">ID: {selectedRegistrant.registrationId}</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Contact & Organization</h4>
                   <div className="flex items-center text-sm text-gray-700">
                     <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                     <span>{selectedRegistrant.personalInfo?.email || <span className="text-gray-400 italic">No email</span>}</span>
                   </div>
                   <div className="flex items-center text-sm text-gray-700">
                     <PhoneIcon className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                     <span>{selectedRegistrant.personalInfo?.phone || <span className="text-gray-400 italic">No phone</span>}</span>
                   </div>
                   <div className="flex items-center text-sm text-gray-700">
                     <BuildingOffice2Icon className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                     <span>{selectedRegistrant.personalInfo?.organization || <span className="text-gray-400 italic">No organization</span>}</span>
                   </div>
                   <div className="flex items-center text-sm text-gray-700">
                     <UserCircleIcon className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                     <span>Designation: {selectedRegistrant.personalInfo?.designation || <span className="text-gray-400 italic">Not Set</span>}</span>
                   </div>
                   <div className="flex items-center text-sm text-gray-700">
                     <GlobeAltIcon className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                     <span>Country: {selectedRegistrant.personalInfo?.country || <span className="text-gray-400 italic">Not Set</span>}</span>
                   </div>
                 </div>
                 
                {/* --- Professional Info --- */}
                {(selectedRegistrant.professionalInfo && (selectedRegistrant.professionalInfo.mciNumber || selectedRegistrant.professionalInfo.membership)) && (
                  <div className="space-y-3 pt-3 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Professional Info</h4>
                    <div className="flex items-center text-sm text-gray-700">
                      <span className="font-semibold w-32 inline-block">MCI Number:</span>
                      <span>{selectedRegistrant.professionalInfo?.mciNumber || <span className="text-gray-400 italic">N/A</span>}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-700">
                      <span className="font-semibold w-32 inline-block">Membership:</span>
                      <span>{selectedRegistrant.professionalInfo?.membership || <span className="text-gray-400 italic">N/A</span>}</span>
                    </div>
                  </div>
                )}
                 
                 {/* --- Registration Info --- */}
                 <div className="space-y-3 pt-3 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Registration Info</h4>
                    <div className="flex items-center text-sm text-gray-700">
                       <CalendarDaysIcon className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                       <span>Registered: {formatDate(selectedRegistrant.createdAt)}</span>
                     </div>
                     {selectedRegistrant.updatedAt && selectedRegistrant.updatedAt !== selectedRegistrant.createdAt && (
                       <div className="flex items-center text-sm text-gray-700">
                         <ArrowPathIcon className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                         <span>Last Updated: {formatDate(selectedRegistrant.updatedAt)}</span>
                       </div>
                     )}
                     <div className="flex items-center text-sm text-gray-700">
                       <InformationCircleIcon className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                       <span>Status: <Tag>{selectedRegistrant.status || 'N/A'}</Tag></span>
                     </div>
                     <div className="flex items-center text-sm text-gray-700">
                       <InformationCircleIcon className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                       <span><strong>Type:</strong> <Tag color="blue">{selectedRegistrant.registrationType || 'N/A'}</Tag></span>
                     </div>
                     <div className="flex items-center text-sm text-gray-700">
                       <InformationCircleIcon className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                       <span><strong>Payment Status:</strong> <Tag color="orange">N/A</Tag> {/* TODO: Implement payment status */}</span>
                     </div>
                     <div className="flex items-center text-sm text-gray-700">
                       <InformationCircleIcon className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                       <span><strong>Workshop Registration:</strong> <Tag color="default">N/A</Tag> {/* TODO: Implement workshop registration */}</span>
                     </div>
                     <div className="flex items-center text-sm text-gray-700">
                      {selectedRegistrant.checkIn?.isCheckedIn ? 
                        <CheckCircleIcon className="h-4 w-4 mr-2 text-green-500 flex-shrink-0" /> : 
                        <XCircleIcon className="h-4 w-4 mr-2 text-red-500 flex-shrink-0" />
                      }
                       <span>Checked In: {selectedRegistrant.checkIn?.isCheckedIn ? `Yes (${formatDate(selectedRegistrant.checkIn?.checkedInAt)})` : 'No'}</span>
                     </div>
                     <div className="flex items-center text-sm text-gray-700">
                       <TicketIcon className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                       <span>Badge Printed: {selectedRegistrant.badgePrinted ? 'Yes' : 'No'}</span>
                     </div>
                 </div>
                 
                 {/* --- Notes --- */}
                 {selectedRegistrant.notes && (
                    <div className="space-y-2 pt-3 border-t border-gray-200">
                      <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Notes</h4>
                       <div className="flex items-start text-sm text-gray-700">
                         <ClipboardDocumentListIcon className="h-4 w-4 mr-2 mt-0.5 text-gray-400 flex-shrink-0" />
                         <p className="whitespace-pre-wrap">{selectedRegistrant.notes}</p>
                       </div>
                    </div>
                 )}
                 
                 {/* --- Custom Fields --- */}
                 {selectedRegistrant.customFields && Object.keys(selectedRegistrant.customFields).length > 0 && (
                     <div className="space-y-2 pt-3 border-t border-gray-200">
                       <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Custom Fields</h4>
                       {Object.entries(selectedRegistrant.customFields).map(([key, value]) => (
                         <div key={key} className="flex items-center text-sm text-gray-700">
                           <TagIcon className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                           <span><strong>{key}:</strong> {value?.toString() || 'N/A'}</span>
                         </div>
                       ))}
                    </div>
                 )}
              </div>

              <div className="md:col-span-2 space-y-8">
                <div className="flex flex-col items-center p-4 bg-white rounded-lg border border-gray-200 shadow">
                  <h4 className="text-base font-semibold mb-4 text-gray-700">Badge Preview</h4>
                  
                  <div 
                    className="w-full max-w-xs p-5 border border-gray-300 rounded-xl bg-slate-50 shadow-lg flex flex-col items-center space-y-3 text-center"
                    style={{ minHeight: '320px' }} // Increased height
                  >
                    {/* Event Name - Placed at the top */}
                    {currentEventDetailsForModal?.name && (
                      <div className="text-xs text-gray-500 mb-1 w-full truncate px-2">
                        {currentEventDetailsForModal.name}
                      </div>
                    )}

                    {/* Category Tag */}
                    <div 
                      className="px-4 py-1.5 rounded-full text-sm font-semibold text-white shadow-md tracking-wide"
                      style={{ backgroundColor: selectedRegistrant.category?.color || '#3B82F6' }}
                    >
                      {selectedRegistrant.category?.name || 'N/A'}
                    </div>

                    {/* Full Name */}
                    <div className="font-bold text-2xl text-gray-800 pt-2">
                      {`${selectedRegistrant.personalInfo?.firstName || ''} ${selectedRegistrant.personalInfo?.lastName || ''}`}
                    </div>

                    {/* Registration ID */}
                    <div className="text-md text-gray-600">
                      ID: {selectedRegistrant.registrationId || 'N/A'}
                    </div>

                    {/* QR Code - with more space around it */}
                    <div className="p-2.5 bg-white border-2 border-gray-200 rounded-lg inline-block shadow-md my-3">
                      <QRCode 
                        value={selectedRegistrant.registrationId || 'no-id'} 
                        size={110} // Adjusted size
                        level="H"
                      />
                    </div>

                    {/* Organization - Placed at the bottom */}
                    {selectedRegistrant.personalInfo?.organization && (
                        <div className="text-sm text-gray-500 pt-2 border-t border-gray-200 w-full mt-auto">
                           {selectedRegistrant.personalInfo.organization}
                        </div>
                    )}
                     {!selectedRegistrant.personalInfo?.organization && (
                        <div className="text-sm text-gray-400 italic pt-2 border-t border-gray-200 w-full mt-auto">
                           No Organization
                        </div>
                    )}
                  </div>
                  
                </div>
                
                <div className="mt-4">
                  <h4 className="text-base font-semibold border-b pb-2 mb-3 text-gray-800">Resource Usage</h4>
                  {resourceUsage.length > 0 ? (
                    <div className="space-y-2 text-sm max-h-96 overflow-y-auto pr-2">
                      {resourceUsage.map(item => (
                        <div key={item._id} className={`flex justify-between items-center p-2 rounded border ${item.isVoided ? 'bg-gray-100 border-gray-200 opacity-60' : 'bg-white border-gray-300'}`}>
                          <div>
                             <span className={`font-medium ${item.isVoided ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                               {item.displayName}
                             </span>
                             <span className="block text-xs text-gray-500">
                               {item.type.charAt(0).toUpperCase() + item.type.slice(1)} - {formatDate(item.actionDate || item.createdAt)}
                               {item.isVoided && ` (Voided ${formatDate(item.voidedAt)})`}
                             </span>
                          </div>
                          {!item.isVoided && (
                            <Popconfirm
                              title="Void this resource usage?"
                              description="This action cannot be undone."
                              onConfirm={() => handleVoidResource(item._id)}
                              okText="Yes, Void"
                              cancelText="No"
                              okButtonProps={{ loading: isVoiding, danger: true }}
                            >
                              <Button 
                                 danger 
                                 size="small" 
                                 icon={<NoSymbolIcon className="h-4 w-4" />} 
                                 disabled={isVoiding}
                              >
                                Void
                              </Button>
                            </Popconfirm>
                          )}
                          {item.isVoided && (
                              <Tag color="red" icon={<NoSymbolIcon className="h-3 w-3 inline" />}>Voided</Tag>
                          )}
                        </div>
                      ))}
                    </div>
                   ) : (
                    <p className="text-xs text-gray-500 italic mt-1">(No resources recorded for this registration)</p> 
                  )}
                </div>
              </div>
            </div>
          )}
        </AntdModal>
      )}

      {/* Advanced Export Modal */}
      <AntdModal
        open={isExportModalOpen}
        onCancel={() => setIsExportModalOpen(false)}
        title="Advanced Export"
        footer={null}
        styles={{ body: { background: '#fff', color: '#1a202c' } }}
      >
        <div className="space-y-4">
          <AntSelect
            placeholder="Category"
            allowClear
            style={{ width: '100%', background: '#fff', color: '#1a202c', border: '1px solid #2A4365', '::placeholder': { color: '#2A4365' } }}
            dropdownStyle={{ background: '#fff', color: '#1a202c', border: '1px solid #2A4365' }}
            className={inputClass}
            value={exportFilters.category}
            onChange={v => setExportFilters(f => ({ ...f, category: v }))}
          >
            {allCategories.map(cat => (
              <Option key={cat._id} value={cat._id}>{cat.name}</Option>
            ))}
          </AntSelect>
          <AntSelect
            placeholder="Status"
            allowClear
            style={{ width: '100%', background: '#fff', color: '#1a202c', border: '1px solid #2A4365', '::placeholder': { color: '#2A4365' } }}
            dropdownStyle={{ background: '#fff', color: '#1a202c', border: '1px solid #2A4365' }}
            className={inputClass}
            value={exportFilters.status}
            onChange={v => setExportFilters(f => ({ ...f, status: v }))}
          >
            <Option value="active">Active</Option>
            <Option value="cancelled">Cancelled</Option>
            <Option value="no-show">No-Show</Option>
          </AntSelect>
          <AntSelect
            placeholder="Registration Type"
            allowClear
            style={{ width: '100%', background: '#fff', color: '#1a202c', border: '1px solid #2A4365', '::placeholder': { color: '#2A4365' } }}
            dropdownStyle={{ background: '#fff', color: '#1a202c', border: '1px solid #2A4365' }}
            className={inputClass}
            value={exportFilters.registrationType}
            onChange={v => setExportFilters(f => ({ ...f, registrationType: v }))}
          >
            <Option value="pre-registered">Pre-Registered</Option>
            <Option value="onsite">Onsite</Option>
            <Option value="imported">Imported</Option>
            <Option value="sponsored">Sponsored</Option>
            <Option value="complementary">Complementary</Option>
          </AntSelect>
          <AntSelect
            placeholder="Badge Printed"
            allowClear
            style={{ width: '100%', background: '#fff', color: '#1a202c', border: '1px solid #2A4365', '::placeholder': { color: '#2A4365' } }}
            dropdownStyle={{ background: '#fff', color: '#1a202c', border: '1px solid #2A4365' }}
            className={inputClass}
            value={exportFilters.badgePrinted}
            onChange={v => setExportFilters(f => ({ ...f, badgePrinted: v }))}
          >
            <Option value="true">Yes</Option>
            <Option value="false">No</Option>
          </AntSelect>
          <div className="flex gap-2">
            <DatePicker
              placeholder="Start Date"
              style={{ width: '50%', background: '#fff', color: '#1a202c', border: '1px solid #2A4365' }}
              className={inputClass}
              inputReadOnly={false}
              inputStyle={{ color: '#2A4365' }}
              value={exportFilters.startDate}
              onChange={date => setExportFilters(f => ({ ...f, startDate: date }))}
            />
            <DatePicker
              placeholder="End Date"
              style={{ width: '50%', background: '#fff', color: '#1a202c', border: '1px solid #2A4365' }}
              className={inputClass}
              inputReadOnly={false}
              inputStyle={{ color: '#2A4365' }}
              value={exportFilters.endDate}
              onChange={date => setExportFilters(f => ({ ...f, endDate: date }))}
            />
          </div>
          <AntSelect
            placeholder="Payment Status"
            allowClear
            style={{ width: '100%', background: '#fff', color: '#1a202c', border: '1px solid #2A4365', '::placeholder': { color: '#2A4365' } }}
            dropdownStyle={{ background: '#fff', color: '#1a202c', border: '1px solid #2A4365' }}
            className={inputClass}
            value={exportFilters.paymentStatus}
            onChange={v => setExportFilters(f => ({ ...f, paymentStatus: v }))}
          >
            <Option value="pending">Pending</Option>
            <Option value="completed">Completed</Option>
            <Option value="failed">Failed</Option>
            <Option value="refunded">Refunded</Option>
            <Option value="partially_refunded">Partially Refunded</Option>
          </AntSelect>
          <AntSelect
            placeholder="Workshop"
            allowClear
            style={{ width: '100%', background: '#fff', color: '#1a202c', border: '1px solid #2A4365', '::placeholder': { color: '#2A4365' } }}
            dropdownStyle={{ background: '#fff', color: '#1a202c', border: '1px solid #2A4365' }}
            className={inputClass}
            value={exportFilters.workshopId}
            onChange={v => setExportFilters(f => ({ ...f, workshopId: v }))}
          >
            {/* Map workshop options here if available */}
          </AntSelect>
          <div className="flex justify-end gap-2 mt-4">
            <AntdButton onClick={() => setIsExportModalOpen(false)}>Cancel</AntdButton>
            <AntdButton
              type="primary"
              icon={<ExportOutlined />}
              loading={isExporting}
              onClick={async () => {
                setIsExporting(true);
                try {
                  const params = {};
                  Object.entries(exportFilters).forEach(([k, v]) => {
                    if (v && typeof v === 'object' && v.format) {
                      params[k] = v.format('YYYY-MM-DD');
                    } else if (v) {
                      params[k] = v;
                    }
                  });
                  const response = await registrationService.exportRegistrations(eventId, params);
                  if (response instanceof Blob) {
                    const url = window.URL.createObjectURL(response);
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', `registrations_${eventId}_${new Date().toISOString().split('T')[0]}.xlsx`);
                    document.body.appendChild(link);
                    link.click();
                    link.parentNode.removeChild(link);
                    window.URL.revokeObjectURL(url);
                  } else {
                    throw new Error('Export failed');
                  }
                  setIsExportModalOpen(false);
                } catch (error) {
                  message.error('Export failed: ' + (error.message || error.toString()));
                } finally {
                  setIsExporting(false);
                }
              }}
            >
              Export
            </AntdButton>
          </div>
        </div>
      </AntdModal>

    </div>
  );
};

export default RegistrationsTab; 