import React, { useEffect, useState, useRef } from 'react';
import apiClient from '../../services/apiClient';
import eventService from '../../services/eventService';
import * as XLSX from 'xlsx';
// TODO: Integrate with client portal registrants API and context
import { useActiveEvent } from '../../contexts/ActiveEventContext';
import { useAuth } from '../../contexts/AuthContext';
import { useClientAuth } from '../../contexts/ClientAuthContext';
import ClientBulkImport from './ClientBulkImport';

const ClientRegistrantsPage = () => {
  const [registrants, setRegistrants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ search: '', category: '', status: '', registrationType: '' });
  const [page, setPage] = useState(1); // Pagination: current page
  const [limit, setLimit] = useState(50); // Pagination: page size
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 1, hasNextPage: false, hasPrevPage: false });
  const fileInputRef = useRef();
  const [importStep, setImportStep] = useState(1);
  const [importFile, setImportFile] = useState(null);
  const [importFileData, setImportFileData] = useState([]);
  const [importHeaders, setImportHeaders] = useState([]);
  const [importFieldMappings, setImportFieldMappings] = useState({});
  const [importCategories, setImportCategories] = useState([]);
  const [importCategoriesLoading, setImportCategoriesLoading] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [importError, setImportError] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importCategoryMap, setImportCategoryMap] = useState({});
  const [showImportModal, setShowImportModal] = useState(false);
  const [eventId, setEventId] = useState(null);
  let activeEventId, currentEventId, clientEventId;
  try {
    activeEventId = useActiveEvent ? useActiveEvent()?.activeEventId : undefined;
  } catch { activeEventId = undefined; }
  try {
    currentEventId = useAuth ? useAuth()?.currentEventId : undefined;
  } catch { currentEventId = undefined; }
  try {
    const clientAuth = useClientAuth ? useClientAuth() : undefined;
    clientEventId = clientAuth && clientAuth.event ? clientAuth.event._id : undefined;
  } catch { clientEventId = undefined; }
  const { event, loading: authLoading } = useClientAuth();

  // Required and optional fields for mapping
  const requiredFields = [
    { id: 'firstName', label: 'First Name', required: true },
    { id: 'lastName', label: 'Last Name', required: true },
    { id: 'email', label: 'Email', required: true },
    { id: 'categoryId', label: 'Category', required: true }
  ];
  const optionalFields = [
    { id: 'registrationId', label: 'Registration ID (Optional)', required: false },
    { id: 'organization', label: 'Organization', required: false },
    { id: 'phoneNumber', label: 'Phone Number', required: false },
    { id: 'address', label: 'Address', required: false },
    { id: 'city', label: 'City', required: false },
    { id: 'state', label: 'State', required: false },
    { id: 'country', label: 'Country', required: false },
    { id: 'postalCode', label: 'Postal Code', required: false },
    { id: 'mciNumber', label: 'MCI Number', required: false },
    { id: 'membership', label: 'Membership', required: false }
  ];
  const allFields = [...requiredFields, ...optionalFields];

  const fetchRegistrants = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { ...filters, page, limit };
      if (event?._id) params.eventId = event._id;
      const res = await apiClient.get('/client-portal-auth/me/registrants', { params });
      if (res.data && res.data.success) {
        setRegistrants(res.data.data || res.data.registrants || []);
        // Store pagination info if present
        if (res.data.meta && res.data.meta.pagination) {
          setPagination(res.data.meta.pagination);
        } else {
          setPagination({ page, limit, total: (res.data.data || []).length, totalPages: 1, hasNextPage: false, hasPrevPage: false });
        }
      } else {
        setError(res.data?.message || 'Failed to load registrants.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load registrants.');
    } finally {
      setLoading(false);
    }
  };

  // Only fetch registrants when event is available and not loading
  useEffect(() => {
    if (!authLoading && event && event._id) {
      fetchRegistrants();
    }
  }, [filters, page, limit, authLoading, event]);

  useEffect(() => {
    if (importStep === 3 && eventId) {
      setImportCategoriesLoading(true);
      console.log('Using eventId for categories:', eventId);
      eventService.getEventCategoriesPublic(eventId)
        .then(res => {
          setImportCategories(res.data || []);
          setImportCategoriesLoading(false);
          const map = (res.data || []).reduce((acc, cat) => {
            acc[cat.name.trim().toLowerCase()] = cat._id;
            return acc;
          }, {});
          setImportCategoryMap(map);
          console.log('Available categories:', map);
          Object.keys(map).forEach(k => console.log('Category key char codes:', Array.from(k).map(c => c.charCodeAt(0))));
        })
        .catch(() => setImportCategoriesLoading(false));
    }
  }, [importStep, eventId]);

  // Set eventId from context if not already set
  useEffect(() => {
    if (!eventId) {
      let resolvedEventId = activeEventId || currentEventId || clientEventId;
      if (resolvedEventId) setEventId(resolvedEventId);
      else console.warn('[ImportWizard] No eventId found in any context!');
    }
  }, [eventId, activeEventId, currentEventId, clientEventId]);

  const handleImportFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImportFile(file);
    setImportLoading(true);
    setImportError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        if (jsonData.length < 2) {
          setImportError('File must contain at least a header row and one data row');
          setImportLoading(false);
          return;
        }
        const headers = jsonData[0].map((header, index) => ({
          value: `Column ${String.fromCharCode(65 + index)}`,
          label: `Column ${String.fromCharCode(65 + index)} - Example: ${header}`,
          originalHeader: header,
          index
        }));
        const extractedData = jsonData.slice(1).map(row => {
          const rowData = {};
          jsonData[0].forEach((header, index) => {
            rowData[header] = row[index] || '';
          });
          return rowData;
        });
        setImportHeaders(headers);
        setImportFileData(extractedData);
        setImportLoading(false);
        setImportStep(2);
      } catch (error) {
        setImportError('Failed to parse the file. Please make sure it is a valid Excel file.');
        setImportLoading(false);
      }
    };
    reader.onerror = () => {
      setImportError('Failed to read the file');
      setImportLoading(false);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleContinueToMapping = () => {
    setImportError(null);
    setImportStep(3);
  };

  const handleFieldMapping = (fieldId, columnValue) => {
    setImportFieldMappings(prev => ({ ...prev, [fieldId]: columnValue }));
  };

  const handleContinueToImport = async () => {
    // Validate required mappings
    const missingRequiredFields = requiredFields
      .filter(field => !importFieldMappings[field.id])
      .map(field => field.label);
    if (missingRequiredFields.length > 0) {
      setImportError(`Please map the following required fields: ${missingRequiredFields.join(', ')}`);
      return;
    }
    setImportLoading(true);
    setImportError(null);
    setImportResults(null);
    // Prepare data for API
    const processingErrors = [];
    const processedData = [];
    importFileData.forEach((row, index) => {
      const registrationPayload = {
        personalInfo: {},
        customFields: {},
        originalFileRowNumber: index + 2,
      };
      let rowHasError = false;
      const currentErrors = [];
      const mappedHeaders = Object.values(importFieldMappings);
      // Map all fields
      Object.entries(importFieldMappings).forEach(([fieldId, columnValue]) => {
        if (columnValue) {
          const columnLetter = columnValue.split(' ')[1];
          const headerIndex = columnLetter.charCodeAt(0) - 65;
          const originalHeader = importHeaders.find(h => h.index === headerIndex)?.originalHeader;
          const rawValue = originalHeader ? row[originalHeader] : undefined;
          if (fieldId === 'categoryId') {
            const categoryName = String(rawValue).trim().toLowerCase();
            console.log('Trying to match category:', categoryName);
            console.log('Raw value char codes:', Array.from(String(rawValue)).map(c => c.charCodeAt(0)));
            Object.keys(importCategoryMap).forEach(k => console.log('Category key char codes:', Array.from(k).map(c => c.charCodeAt(0))));
            const categoryId = importCategoryMap[categoryName];
            if (categoryId) {
              registrationPayload.category = categoryId;
            } else {
              currentErrors.push(`Category "${rawValue}" not found in event categories.`);
              rowHasError = true;
            }
          } else if (fieldId === 'registrationId') {
            if (rawValue !== null && rawValue !== undefined && String(rawValue).trim() !== '') {
              registrationPayload.registrationId = String(rawValue).trim();
            }
          } else if (fieldId === 'mciNumber' || fieldId === 'membership') {
            registrationPayload.professionalInfo = registrationPayload.professionalInfo || {};
            registrationPayload.professionalInfo[fieldId] = rawValue;
          } else if ([
            'firstName','lastName','email','organization','phoneNumber','address','city','state','country','postalCode'
          ].includes(fieldId)) {
            registrationPayload.personalInfo[fieldId] = rawValue;
          } else {
            registrationPayload.customFields[fieldId] = rawValue;
          }
        }
      });
      // Map any unmapped columns as custom fields
      importHeaders.forEach(header => {
        if (!mappedHeaders.includes(header.value)) {
          const val = row[header.originalHeader];
          if (val !== undefined && val !== null && String(val).trim() !== '') {
            registrationPayload.customFields[header.originalHeader] = val;
          }
        }
      });
      // Validate required personal info
      const personalInfo = registrationPayload.personalInfo;
      if (personalInfo?.lastName && typeof personalInfo.lastName !== 'string') personalInfo.lastName = String(personalInfo.lastName);
      if (!personalInfo?.lastName?.trim()) {
        currentErrors.push('Missing Last Name');
        rowHasError = true;
      }
      if (!personalInfo?.email?.trim()) {
        currentErrors.push('Missing Email');
        rowHasError = true;
      }
      if (rowHasError) {
        processingErrors.push({
          rowNumber: index + 2,
          message: `Row validation failed: ${currentErrors.join(', ')}`,
          originalExcelRow: row,
        });
      } else {
        processedData.push(registrationPayload);
      }
    });
    if (processedData.length === 0) {
      setImportResults({
        total: importFileData.length,
        successful: 0,
        failed: importFileData.length,
        errors: processingErrors
      });
      setImportLoading(false);
      setImportStep(4);
      return;
    }
    try {
      const res = await apiClient.post('/client-bulk-import/registrants', { registrations: processedData });
      if (res.data && res.data.success) {
        setImportResults({
          total: importFileData.length,
          successful: processedData.length,
          failed: processingErrors.length,
          errors: processingErrors
        });
        setImportStep(4);
        fetchRegistrants(); // Refresh list
      } else {
        setImportResults({
          total: importFileData.length,
          successful: 0,
          failed: importFileData.length,
          errors: [{ rowNumber: 'API', message: res.data?.message || 'Import failed.' }]
        });
        setImportStep(4);
      }
    } catch (err) {
      setImportResults({
        total: importFileData.length,
        successful: 0,
        failed: importFileData.length,
        errors: [{ rowNumber: 'API', message: err.response?.data?.message || 'Import failed.' }]
      });
      setImportStep(4);
    } finally {
      setImportLoading(false);
    }
  };

  // Utility to recursively remove all keys starting with '$' from an object
  function cleanForExport(obj) {
    if (Array.isArray(obj)) {
      return obj.map(cleanForExport);
    } else if (obj && typeof obj === 'object') {
      const cleaned = {};
      for (const key in obj) {
        if (!key.startsWith('$')) {
          cleaned[key] = cleanForExport(obj[key]);
        }
      }
      return cleaned;
    }
    return obj;
  }

  const handleExport = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/client-portal-auth/me/registrants/export', { responseType: 'blob' });
      // If the backend ever returns JSON data, clean it before exporting:
      // Example for future CSV/Excel export:
      // const cleanedData = cleanForExport(res.data);
      // ...convert cleanedData to Excel/CSV...

      // If exporting a file directly (blob), just download as before:
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'registrants.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Export failed.');
    } finally {
      setLoading(false);
    }
  };

  // Pagination UI helpers
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages && newPage !== page) {
      setPage(newPage);
    }
  };
  const handleLimitChange = (e) => {
    setLimit(Number(e.target.value));
    setPage(1); // Reset to first page on page size change
  };
  const renderPageNumbers = () => {
    const { totalPages } = pagination;
    if (totalPages <= 1) return null;
    const pageNumbers = [];
    // Show up to 5 page numbers, with ellipsis if needed
    let start = Math.max(1, page - 2);
    let end = Math.min(totalPages, page + 2);
    if (page <= 3) {
      end = Math.min(5, totalPages);
    } else if (page >= totalPages - 2) {
      start = Math.max(1, totalPages - 4);
    }
    for (let i = start; i <= end; i++) {
      pageNumbers.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-1 rounded ${i === page ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-blue-100'}`}
          aria-current={i === page ? 'page' : undefined}
        >
          {i}
        </button>
      );
    }
    if (start > 1) {
      pageNumbers.unshift(<span key="start-ellipsis" className="px-2">...</span>);
      pageNumbers.unshift(
        <button key={1} onClick={() => handlePageChange(1)} className="px-3 py-1 rounded bg-gray-100 text-gray-700 hover:bg-blue-100">1</button>
      );
    }
    if (end < totalPages) {
      pageNumbers.push(<span key="end-ellipsis" className="px-2">...</span>);
      pageNumbers.push(
        <button key={totalPages} onClick={() => handlePageChange(totalPages)} className="px-3 py-1 rounded bg-gray-100 text-gray-700 hover:bg-blue-100">{totalPages}</button>
      );
    }
    return pageNumbers;
  };

  // Render import wizard steps
  const renderImportStep = () => {
    switch (importStep) {
      case 1:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h3 className="mt-2 text-lg font-medium text-gray-900">Upload Excel File</h3>
              <p className="mt-1 text-sm text-gray-500">
                Upload an Excel file (.xlsx) containing registration data. The file should have headers in the first row.
              </p>
            </div>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
              <input
                type="file"
                accept=".xlsx"
                onChange={handleImportFileUpload}
                className="sr-only"
                id="client-import-upload"
              />
              <label htmlFor="client-import-upload" className="cursor-pointer text-primary-600 font-medium">
                Click to select .xlsx file
              </label>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Review the data from your file and continue to map the columns to registration fields.
            </p>
            <div className="overflow-x-auto border rounded-lg w-full">
              <table className="min-w-full w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {importHeaders.map((header, index) => (
                      <th key={index} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider break-words max-w-[180px]">{header.originalHeader}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {importFileData.slice(0, 5).map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {importHeaders.map((header, colIndex) => (
                        <td key={colIndex} className="px-6 py-4 whitespace-normal text-sm text-gray-500 break-words max-w-[180px]">{row[header.originalHeader] || ''}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {importFileData.length > 5 && (
              <p className="text-xs text-gray-500 italic">Showing 5 of {importFileData.length} rows.</p>
            )}
            <div className="flex justify-between pt-4">
              <button className="bg-gray-100 px-4 py-2 rounded" onClick={() => setImportStep(1)}>Back</button>
              <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={handleContinueToMapping}>Continue to Field Mapping</button>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Map each column from your file to the corresponding registration field.</p>
            <div className="border rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registration Field</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">File Column</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Required</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {allFields.map((field) => (
                    <tr key={field.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{field.label}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <select
                          value={importFieldMappings[field.id] || ''}
                          onChange={e => handleFieldMapping(field.id, e.target.value)}
                          className="min-w-[200px] border rounded px-2 py-1"
                        >
                          <option value="">Not Mapped</option>
                          {importHeaders.map(h => (
                            <option key={h.value} value={h.value}>{h.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {field.required ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Required</span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">Optional</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-between pt-4">
              <button className="bg-gray-100 px-4 py-2 rounded" onClick={() => setImportStep(2)}>Back</button>
              <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={handleContinueToImport} disabled={importLoading}>Import Registrations</button>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="mt-2 text-lg font-medium text-gray-900">Import Results</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center"><p className="text-sm text-gray-500">Total Records</p><p className="text-3xl font-bold text-gray-900">{importResults?.total}</p></div>
              <div className="text-center"><p className="text-sm text-gray-500">Successfully Imported</p><p className="text-3xl font-bold text-green-600">{importResults?.successful}</p></div>
              <div className="text-center"><p className="text-sm text-gray-500">Failed</p><p className="text-3xl font-bold text-red-600">{importResults?.failed}</p></div>
            </div>
            {importResults?.errors && importResults.errors.length > 0 && (
              <div className="border rounded-lg divide-y">
                <div className="px-4 py-3 bg-gray-50"><h4 className="text-sm font-medium text-gray-900">Error Details ({importResults.errors.length})</h4></div>
                <div className="p-4 space-y-2">
                  {importResults.errors.map((error, index) => (
                    <div key={index} className="bg-red-50 p-3 rounded-md">
                      <div className="flex"><div className="flex-shrink-0"><span className="text-red-400">&#9888;</span></div><div className="ml-3"><p className="text-sm text-red-700">{error.message}</p>{error.rowNumber && (<p className="text-xs text-red-500">Row {error.rowNumber}</p>)}</div></div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex justify-between items-center pt-4">
              <button className="bg-gray-100 px-4 py-2 rounded" onClick={() => setImportStep(1)}>Import More</button>
              <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={() => setImportStep(1)}>Close</button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // Render import modal
  const ImportModal = ({ open, onClose }) => (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 ${open ? '' : 'hidden'}`}>
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl mx-auto p-6 relative max-h-[80vh] flex flex-col">
        <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" onClick={onClose}>&times;</button>
        <div className="overflow-y-auto overflow-x-hidden flex-1 w-full">{renderImportStep()}</div>
      </div>
    </div>
  );

  // Show error if event context is missing after loading
  if (!authLoading && !event) {
    return <div className="flex items-center justify-center h-64 text-red-600 font-semibold">Event context missing. Please log out and log in again.</div>;
  }

  if (loading) return <div className="text-center text-blue-700">Loading registrants...</div>;
  if (error) return <div className="text-center text-red-600">{error}</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-blue-900 mb-1">Registrants</h1>
          <p className="text-gray-600">View and manage event registrations. No edit/delete allowed.</p>
        </div>
        <div className="flex gap-2 items-center">
          <input
            type="file"
            accept=".xlsx"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleImportFileUpload}
          />
          <button
            onClick={() => setShowImportModal(true)}
            className="bg-blue-100 text-blue-700 px-4 py-2 rounded hover:bg-blue-200 font-medium"
          >
            Import (Excel)
          </button>
          <button onClick={handleExport} className="bg-green-100 text-green-700 px-4 py-2 rounded hover:bg-green-200 font-medium">Export (Excel)</button>
        </div>
      </div>
      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-4">
        <input type="text" placeholder="Search..." className="border rounded px-3 py-2" value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} />
        <select className="border rounded px-3 py-2" value={filters.category} onChange={e => setFilters(f => ({ ...f, category: e.target.value }))}>
          <option value="">All Categories</option>
          {/* TODO: Dynamically load categories */}
          <option value="Delegate">Delegate</option>
          <option value="Faculty">Faculty</option>
        </select>
        <select className="border rounded px-3 py-2" value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select className="border rounded px-3 py-2" value={filters.registrationType} onChange={e => setFilters(f => ({ ...f, registrationType: e.target.value }))}>
          <option value="">All Types</option>
          {/* Show all possible registration types as per backend enum */}
          <option value="pre-registered">Pre-registered</option>
          <option value="onsite">Onsite</option>
          <option value="imported">Imported</option>
          <option value="sponsored">Sponsored</option>
          <option value="complementary">Complementary</option>
        </select>
        <select className="border rounded px-3 py-2" value={limit} onChange={handleLimitChange}>
          {[10, 20, 50, 100].map(opt => (
            <option key={opt} value={opt}>{opt} per page</option>
          ))}
        </select>
      </div>
      {/* Table */}
      <div className="overflow-x-auto bg-white rounded shadow">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-100 text-gray-700">
              <th className="px-4 py-2 text-left">Registration ID</th>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Email</th>
              <th className="px-4 py-2 text-left">Category</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Type</th>
            </tr>
          </thead>
          <tbody>
            {registrants.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400">No registrants found.</td></tr>
            ) : registrants.map(r => (
              <tr key={r.registrationId || r._id} className="border-b">
                <td className="px-4 py-2 font-mono">{r.registrationId}</td>
                <td className="px-4 py-2">{r.personalInfo ? `${r.personalInfo.firstName} ${r.personalInfo.lastName}` : r.name}</td>
                <td className="px-4 py-2">{r.personalInfo ? r.personalInfo.email : r.email}</td>
                <td className="px-4 py-2">{r.category?.name || r.category || ''}</td>
                <td className="px-4 py-2">{r.status}</td>
                <td className="px-4 py-2">{r.registrationType}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* Pagination controls */}
        <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
          <div className="text-gray-600 text-sm">
            Showing {registrants.length === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1}
            -{(pagination.page - 1) * pagination.limit + registrants.length}
            of {pagination.total} registrants
          </div>
          <div className="flex gap-1 items-center">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={!pagination.hasPrevPage}
              className="px-3 py-1 rounded bg-gray-100 text-gray-700 hover:bg-blue-100 disabled:opacity-50"
            >Prev</button>
            {renderPageNumbers()}
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={!pagination.hasNextPage}
              className="px-3 py-1 rounded bg-gray-100 text-gray-700 hover:bg-blue-100 disabled:opacity-50"
            >Next</button>
          </div>
        </div>
      </div>
      {/* Import modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl mx-auto p-6 relative max-h-[90vh] flex flex-col">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl" onClick={() => setShowImportModal(false)}>&times;</button>
            <div className="overflow-y-auto flex-1 w-full">
              <ClientBulkImport eventId={eventId} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientRegistrantsPage; 