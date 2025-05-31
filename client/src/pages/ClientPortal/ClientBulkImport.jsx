// THIS COMPONENT IS THE SINGLE SOURCE OF TRUTH FOR CLIENT PORTAL BULK IMPORT.
// All import logic, polling, and error handling must go through here.
// Do not duplicate import logic elsewhere.
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import eventService from '../../services/eventService';
import apiClient from '../../services/apiClient';
import * as XLSX from 'xlsx';
import clientBulkImportService from '../../services/clientBulkImportService';

const REQUIRED_FIELDS = [
  { id: 'firstName', label: 'First Name', required: true },
  { id: 'lastName', label: 'Last Name', required: true },
  { id: 'email', label: 'Email', required: true },
  { id: 'categoryId', label: 'Category', required: true }
];
const OPTIONAL_FIELDS = [
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
const ALL_FIELDS = [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS];

const ClientBulkImport = ({ eventId: propEventId }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [fileData, setFileData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [fieldMappings, setFieldMappings] = useState({});
  const [categories, setCategories] = useState([]);
  const [categoryMap, setCategoryMap] = useState({});
  const [importResults, setImportResults] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [isPolling, setIsPolling] = useState(false);
  const [jobProgress, setJobProgress] = useState({ processed: 0, total: 0, status: '' });
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [eventId, setEventId] = useState(propEventId || '');

  // Fetch eventId from context if not provided
  useEffect(() => {
    if (!eventId && window.localStorage.getItem('client_event_id')) {
      setEventId(window.localStorage.getItem('client_event_id'));
    }
  }, [eventId]);

  // Fetch categories for the event
  useEffect(() => {
    if (!eventId) return;
    eventService.getEventCategoriesPublic(eventId).then(res => {
      const cats = res.data || [];
      setCategories(cats);
      const map = cats.reduce((acc, cat) => {
        acc[cat.name.trim().toLowerCase()] = cat._id;
        return acc;
      }, {});
      setCategoryMap(map);
    });
  }, [eventId]);

  // Step 1: File upload
  const handleFileUpload = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    setIsLoading(true);
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        if (jsonData.length < 2) {
          setError('File must contain at least a header row and one data row');
          setIsLoading(false);
          return;
        }
        const extractedHeaders = jsonData[0].map((header, index) => ({
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
        setHeaders(extractedHeaders);
        setFileData(extractedData);
        setIsLoading(false);
        setStep(2);
      } catch (error) {
        setError('Failed to parse the file. Please make sure it is a valid Excel file.');
        setIsLoading(false);
      }
    };
    reader.onerror = () => {
      setError('Failed to read the file');
      setIsLoading(false);
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  // Step 2: Continue to mapping
  const handleContinueToMapping = () => {
    setError(null);
    setStep(3);
  };

  // Step 3: Field mapping
  const handleFieldMapping = (fieldId, columnValue) => {
    setFieldMappings(prev => ({ ...prev, [fieldId]: columnValue }));
  };

  // Step 4: Import
  const handleContinueToImport = async () => {
    // Validate required mappings
    const missingRequiredFields = REQUIRED_FIELDS
      .filter(field => !fieldMappings[field.id])
      .map(field => field.label);
    if (missingRequiredFields.length > 0) {
      setError(`Please map the following required fields: ${missingRequiredFields.join(', ')}`);
      return;
    }
    setIsLoading(true);
    setError(null);
    setImportResults(null);
    // Prepare data for API
    const processingErrors = [];
    const processedData = [];
    fileData.forEach((row, index) => {
      const registrationPayload = {
        personalInfo: {},
        customFields: {},
        registrationType: 'complementary', // Always set as complementary for client portal
      };
      let rowHasError = false;
      const currentErrors = [];
      Object.entries(fieldMappings).forEach(([fieldId, columnValue]) => {
        if (columnValue) {
          const columnLetter = columnValue.split(' ')[1];
          const headerIndex = columnLetter.charCodeAt(0) - 65;
          const originalHeader = headers.find(h => h.index === headerIndex)?.originalHeader;
          const rawValue = originalHeader ? row[originalHeader] : undefined;
          if (fieldId === 'categoryId') {
            const categoryName = String(rawValue).trim();
            const categoryId = categoryMap[categoryName.toLowerCase()];
            if (categoryId) {
              registrationPayload.category = categoryId;
            } else {
              currentErrors.push(`Category "${categoryName}" not found.`);
              rowHasError = true;
            }
          } else if (fieldId === 'registrationId') {
            if (rawValue !== null && rawValue !== undefined && String(rawValue).trim() !== '') {
              registrationPayload.registrationId = String(rawValue).trim();
            }
          } else if (fieldId === 'mciNumber' || fieldId === 'membership') {
            if (!registrationPayload.professionalInfo) registrationPayload.professionalInfo = {};
            registrationPayload.professionalInfo[fieldId] = rawValue;
          } else if ([
            'firstName','lastName','email','organization','address','city','state','country','postalCode'
          ].includes(fieldId)) {
            registrationPayload.personalInfo[fieldId] = rawValue;
          } else if ([
            'phone','phoneNumber','mobileNumber'
          ].includes(fieldId)) {
            // Always set as personalInfo.phone for backend compatibility
            if (rawValue) registrationPayload.personalInfo.phone = rawValue;
          } else {
            registrationPayload.customFields[fieldId] = rawValue;
          }
        }
      });
      // Remove empty objects
      if (registrationPayload.professionalInfo && Object.keys(registrationPayload.professionalInfo).length === 0) delete registrationPayload.professionalInfo;
      if (Object.keys(registrationPayload.customFields).length === 0) delete registrationPayload.customFields;
      // Validation
      const personalInfo = registrationPayload.personalInfo;
      // Ensure values are strings before calling .trim()
      if (personalInfo?.firstName && typeof personalInfo.firstName !== 'string') personalInfo.firstName = String(personalInfo.firstName);
      if (personalInfo?.lastName && typeof personalInfo.lastName !== 'string') personalInfo.lastName = String(personalInfo.lastName);
      if (personalInfo?.email && typeof personalInfo.email !== 'string') personalInfo.email = String(personalInfo.email);
      if (!personalInfo?.firstName?.trim()) {
        currentErrors.push('Missing First Name');
        rowHasError = true;
      }
      if (!personalInfo?.lastName?.trim()) {
        currentErrors.push('Missing Last Name');
        rowHasError = true;
      }
      if (!personalInfo?.email?.trim()) {
        currentErrors.push('Missing Email');
        rowHasError = true;
      }
      if (!registrationPayload.category) {
        currentErrors.push('Missing or unmapped Category');
        rowHasError = true;
      }
      if (rowHasError) {
        processingErrors.push({
          rowNumber: index + 2,
          message: `Row validation failed: ${currentErrors.join(', ')}`,
          originalExcelRow: row
        });
      } else {
        processedData.push(registrationPayload);
      }
    });
    if (processedData.length === 0) {
      setImportResults({
        total: fileData.length,
        successful: 0,
        failed: fileData.length,
        errors: processingErrors
      });
      setIsLoading(false);
      setStep(4);
      return;
    }
    // API call (use clientBulkImportService)
    try {
      const response = await clientBulkImportService.bulkImport(processedData, file?.name);
      if (response.data && response.data.success && response.data.data?.jobId) {
        setJobId(response.data.data.jobId);
        setIsPolling(true);
        setStep(4);
      } else {
        setImportResults({
          total: fileData.length,
          successful: response.data.data?.successful || 0,
          failed: response.data.data?.failed || processedData.length,
          errors: [...processingErrors, ...(response.data.data?.errors || [])]
        });
        setIsLoading(false);
        setStep(4);
      }
    } catch (err) {
      setImportResults({
        total: fileData.length,
        successful: 0,
        failed: fileData.length,
        errors: [
          ...processingErrors,
          { rowNumber: 'API Error', message: err.response?.data?.message || err.message || 'Unknown error' }
        ]
      });
      setIsLoading(false);
      setStep(4);
    }
  };

  // Polling for job status (use clientBulkImportService)
  useEffect(() => {
    let intervalId;
    const pollStatus = async () => {
      if (!jobId) return;
      try {
        const res = await clientBulkImportService.getImportJobStatus(jobId);
        if (res && res.success && res.data) {
          const job = res.data;
          setJobProgress({ processed: job.processedRecords, total: job.totalRecords, status: job.status });
          if ([ 'completed', 'failed', 'partial_completion' ].includes(job.status)) {
            setIsPolling(false);
            setIsLoading(false);
            setJobId(null);
            setImportResults({
              total: job.totalRecords,
              successful: job.successfulRecords,
              failed: job.failedRecords,
              errors: job.errorDetails || []
            });
          }
        }
      } catch (err) {
        setError('Error polling import job status.');
        setIsPolling(false);
        setIsLoading(false);
        setJobId(null);
      }
    };
    if (jobId && isPolling) {
      pollStatus();
      intervalId = setInterval(pollStatus, 4000);
    }
    return () => clearInterval(intervalId);
  }, [jobId, isPolling]);

  // Download failed rows as Excel
  const handleDownloadFailedRows = () => {
    if (!importResults || !importResults.errors || importResults.errors.length === 0) return;
    const downloadHeaders = headers.map(h => h.originalHeader);
    downloadHeaders.push('Import Error');
    const downloadRows = importResults.errors.map(error => {
      const rowValues = [];
      headers.forEach(header => {
        let value = '';
        if (error.originalExcelRow) {
          value = error.originalExcelRow[header.originalHeader];
        }
        rowValues.push(value !== undefined && value !== null ? String(value) : '');
      });
      rowValues.push(error.message || 'Unknown error');
      return rowValues;
    });
    const ws = XLSX.utils.aoa_to_sheet([downloadHeaders, ...downloadRows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Failed Imports');
    const filename = `failed_imports_${eventId}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  // UI rendering (step-based)
  return (
    <div className="bg-white shadow-sm rounded-lg p-6 max-w-4xl mx-auto mt-8">
      <h1 className="text-2xl font-semibold mb-6 text-gray-900">Bulk Import Registrations</h1>
      {/* Stepper */}
      <div className="flex items-center mb-8">
        {[1,2,3,4].map((s, idx) => (
          <React.Fragment key={s}>
            <div className={`flex items-center justify-center h-8 w-8 rounded-full text-white font-bold ${step >= s ? 'bg-primary-600' : 'bg-gray-300'}`}>{s}</div>
            {idx < 3 && <div className={`flex-1 h-1 ${step > s ? 'bg-primary-600' : 'bg-gray-200'}`}></div>}
          </React.Fragment>
        ))}
      </div>
      {/* Error */}
      {error && <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 text-red-700">{error}</div>}
      {/* Step 1: Upload */}
      {step === 1 && (
        <div>
          <p className="mb-4 text-gray-700">Upload an Excel (.xlsx) or CSV (.csv) file with registration data.</p>
          <input type="file" accept=".xlsx,.csv" onChange={handleFileUpload} className="mb-4" />
          {file && <div className="mb-2 text-green-700">File selected: {file.name}</div>}
          <div className="flex justify-end">
            <button className="bg-primary-600 text-white px-4 py-2 rounded" onClick={() => setStep(2)} disabled={!file}>Continue</button>
          </div>
        </div>
      )}
      {/* Step 2: Preview */}
      {step === 2 && (
        <div>
          <p className="mb-4 text-gray-700">Preview your data and continue to map columns.</p>
          <div className="overflow-x-auto mb-4">
            <table className="min-w-full divide-y divide-gray-300">
              <thead>
                <tr>
                  {headers.map(h => <th key={h.value} className="px-3 py-2 text-left text-xs font-semibold text-gray-900">{h.originalHeader}</th>)}
                </tr>
              </thead>
              <tbody>
                {fileData.slice(0,5).map((row, i) => (
                  <tr key={i}>
                    {headers.map(h => <td key={h.value} className="px-3 py-2 text-sm text-gray-700">{row[h.originalHeader]}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-between">
            <button className="bg-gray-200 px-4 py-2 rounded" onClick={() => setStep(1)}>Back</button>
            <button className="bg-primary-600 text-white px-4 py-2 rounded" onClick={handleContinueToMapping}>Continue to Mapping</button>
          </div>
        </div>
      )}
      {/* Step 3: Mapping */}
      {step === 3 && (
        <div>
          <p className="mb-4 text-gray-700">Map each column to a registration field.</p>
          <div className="overflow-x-auto mb-4">
            <table className="min-w-full divide-y divide-gray-300">
              <thead>
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-900">Registration Field</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-900">File Column</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-900">Required</th>
                </tr>
              </thead>
              <tbody>
                {ALL_FIELDS.map(field => (
                  <tr key={field.id}>
                    <td className="px-3 py-2 text-sm text-gray-900">{field.label}</td>
                    <td className="px-3 py-2">
                      <select value={fieldMappings[field.id] || ''} onChange={e => handleFieldMapping(field.id, e.target.value)} className="border rounded px-2 py-1">
                        <option value="">Not Mapped</option>
                        {headers.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2 text-sm">
                      {field.required ? <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">Required</span> : <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">Optional</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-between">
            <button className="bg-gray-200 px-4 py-2 rounded" onClick={() => setStep(2)}>Back</button>
            <button className="bg-primary-600 text-white px-4 py-2 rounded" onClick={handleContinueToImport} disabled={isLoading}>{isLoading ? 'Processing...' : 'Start Import'}</button>
          </div>
        </div>
      )}
      {/* Step 4: Results */}
      {step === 4 && importResults && (
        <div>
          <div className="mb-4">
            <div className={`p-4 rounded ${importResults.failed === 0 ? 'bg-green-100 text-green-800' : importResults.successful === 0 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>{
              importResults.failed === 0 ? 'Import completed successfully!' :
              importResults.successful === 0 ? 'Import failed. See errors below.' :
              'Import completed with some errors.'
            }</div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div className="bg-gray-50 p-4 rounded text-center"><div className="text-xs text-gray-500">Total</div><div className="text-2xl font-bold">{importResults.total}</div></div>
            <div className="bg-gray-50 p-4 rounded text-center"><div className="text-xs text-gray-500">Successful</div><div className="text-2xl font-bold text-green-600">{importResults.successful}</div></div>
            <div className="bg-gray-50 p-4 rounded text-center"><div className="text-xs text-gray-500">Failed</div><div className="text-2xl font-bold text-red-600">{importResults.failed}</div></div>
          </div>
          {importResults.errors && importResults.errors.length > 0 && (
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Error Details</h3>
              <div className="overflow-x-auto max-h-64 border rounded">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead><tr><th className="px-3 py-2 text-left text-xs font-semibold text-gray-900">Row</th><th className="px-3 py-2 text-left text-xs font-semibold text-gray-900">Error</th></tr></thead>
                  <tbody>
                    {importResults.errors.map((err, i) => (
                      <tr key={i} className={i%2===0?'bg-white':'bg-gray-50'}>
                        <td className="px-3 py-2 text-sm">{err.rowNumber}</td>
                        <td className="px-3 py-2 text-sm text-red-700 break-words">{err.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          <div className="flex justify-between">
            <button className="bg-gray-200 px-4 py-2 rounded" onClick={() => setStep(1)}>Import Another File</button>
            {importResults.failed > 0 && <button className="bg-primary-600 text-white px-4 py-2 rounded" onClick={handleDownloadFailedRows}>Download Failed Rows</button>}
          </div>
        </div>
      )}
      {/* Loading spinner */}
      {isLoading && <div className="fixed inset-0 bg-black bg-opacity-10 flex items-center justify-center z-50"><div className="animate-spin rounded-full h-16 w-16 border-t-4 border-primary-600 border-b-4 border-gray-200"></div></div>}
    </div>
  );
}

export default ClientBulkImport; 