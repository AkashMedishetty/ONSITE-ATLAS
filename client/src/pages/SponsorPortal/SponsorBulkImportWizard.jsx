import React, { useState, useEffect } from 'react';
import { Button, Card, Select, Spinner } from '../../components/common';
import * as XLSX from 'xlsx';
import sponsorAuthService from '../../services/sponsorAuthService';
import eventService from '../../services/eventService';

const SponsorBulkImportWizard = ({ eventId, onClose, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [fileData, setFileData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldMappings, setFieldMappings] = useState({});
  const [importResults, setImportResults] = useState(null);
  const [categories, setCategories] = useState([]);
  const [categoryMap, setCategoryMap] = useState({});
  const [failedRows, setFailedRows] = useState([]);

  // Only allow these fields for sponsors
  const allowedFields = [
    { id: 'firstName', label: 'First Name', required: true },
    { id: 'lastName', label: 'Last Name', required: true },
    { id: 'email', label: 'Email', required: true },
    { id: 'phone', label: 'Phone', required: false },
    { id: 'organization', label: 'Organization', required: false },
    { id: 'address', label: 'Address', required: false },
    { id: 'city', label: 'City', required: false },
    { id: 'state', label: 'State', required: false },
    { id: 'country', label: 'Country', required: false },
    { id: 'postalCode', label: 'Postal Code', required: false },
    { id: 'mciNumber', label: 'MCI Number', required: false },
    { id: 'membership', label: 'Membership', required: false },
    { id: 'category', label: 'Category', required: true },
    // Custom fields will be mapped dynamically
  ];

  useEffect(() => {
    eventService.getSponsorPortalCategories().then(res => {
      if (res.success && Array.isArray(res.data)) {
        setCategories(res.data);
        const map = res.data.reduce((acc, cat) => { acc[cat.name.toLowerCase()] = cat._id; return acc; }, {});
        setCategoryMap(map);
      }
    });
  }, []);

  // Step 1: File Upload
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
        // Initialize field mappings
        const initialMappings = {};
        allowedFields.forEach(field => { initialMappings[field.id] = ''; });
        setFieldMappings(initialMappings);
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

  // Step 2: Preview Data
  const handleContinueToMapping = () => {
    setError(null);
    setStep(3);
  };

  // Step 3: Map Fields
  const handleFieldMapping = (fieldId, columnValue) => {
    setFieldMappings(prev => ({ ...prev, [fieldId]: columnValue }));
  };

  const validateMappings = () => {
    const missingRequiredFields = allowedFields
      .filter(field => field.required && !fieldMappings[field.id])
      .map(field => field.label);
    if (missingRequiredFields.length > 0) {
      setError(`Please map the following required fields: ${missingRequiredFields.join(', ')}`);
      return false;
    }
    return true;
  };

  const handleContinueToImport = async () => {
    if (!validateMappings()) return;
    setIsLoading(true);
    setError(null);
    setImportResults(null);
    setStep(4);

    // Process the data according to the mappings
    const processedData = fileData.map(row => {
      const personalInfo = {};
      const professionalInfo = {};
      const customFields = {};
      let categoryRawValue = '';
      allowedFields.forEach(field => {
        if (fieldMappings[field.id]) {
          const columnLetter = fieldMappings[field.id].split(' ')[1];
          const headerIndex = columnLetter.charCodeAt(0) - 65;
          const originalHeader = headers.find(h => h.index === headerIndex)?.originalHeader;
          const rawValue = originalHeader ? row[originalHeader] : undefined;
          if (["firstName","lastName","email","phone","organization","address","city","state","country","postalCode"].includes(field.id)) {
            personalInfo[field.id] = rawValue;
          } else if (["mciNumber","membership"].includes(field.id)) {
            professionalInfo[field.id] = rawValue;
          } else if (field.id === 'category') {
            categoryRawValue = rawValue;
            // Map category name to ID
            const catId = categoryMap[String(rawValue).toLowerCase()];
            customFields.categoryName = rawValue;
            customFields.categoryId = catId;
          }
        }
      });
      // Add unmapped columns as custom fields
      Object.keys(row).forEach(header => {
        if (!allowedFields.some(f => f.label === header || f.id === header)) {
          customFields[header] = row[header];
        }
      });
      return {
        personalInfo,
        professionalInfo: Object.keys(professionalInfo).length ? professionalInfo : undefined,
        customFields: Object.keys(customFields).length ? customFields : undefined,
        category: customFields.categoryId || '',
        registrationType: 'sponsored',
        status: 'active',
        _originalCategory: categoryRawValue, // for error reporting
        _originalRow: row // for export
      };
    });

    // Split into valid and failed rows
    const validRows = processedData.filter(r => r.category);
    const failedRows = processedData.filter(r => !r.category);
    setFailedRows(failedRows); // <-- store for export

    if (validRows.length === 0) {
      setIsLoading(false);
      setError('No valid rows to import. All rows have missing or invalid categories.');
      return;
    }

    try {
      // Remove _originalCategory/_originalRow before sending
      const payload = validRows.map(({ _originalCategory, _originalRow, ...rest }) => rest);
      await sponsorAuthService.bulkImportSponsorPortalRegistrants(payload);
      setImportResults({ success: true, total: payload.length, failed: failedRows.length });
      setIsLoading(false);
      if (onSuccess) onSuccess();
    } catch (err) {
      setImportResults({ success: false, error: err.message || 'Bulk import failed.' });
      setIsLoading(false);
    }
  };

  // Export failed rows as CSV
  const handleExportFailedRows = () => {
    if (!failedRows.length) return;
    // Use the original row data for export
    const rows = failedRows.map(r => r._originalRow);
    const headers = Object.keys(rows[0] || {});
    const csv = [headers.join(',')].concat(
      rows.map(row => headers.map(h => `"${(row[h] || '').replace(/"/g, '""')}"`).join(','))
    ).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'failed-registrants.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Render steps
  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h3 className="mt-2 text-lg font-medium text-gray-900">Upload Excel File</h3>
              <p className="mt-1 text-sm text-gray-500">Upload an Excel file containing registration data. The file should have headers in the first row.</p>
            </div>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
              <input type="file" id="file-upload" className="sr-only" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} />
              <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-medium text-primary-600 focus-within:outline-none">
                <div className="space-y-1 text-center">
                  <div className="flex text-sm text-gray-600">
                    <span>Drop file here, or</span>
                    <p className="pl-1 text-primary-600">browse</p>
                  </div>
                  <p className="text-xs text-gray-500">Excel or CSV files only</p>
                </div>
              </label>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Review the data from your file and continue to map the columns to registration fields.</p>
            <div className="overflow-x-auto border rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {headers.map((header, index) => (
                      <th key={index} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{header.originalHeader}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {fileData.slice(0, 5).map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {headers.map((header, colIndex) => (
                        <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row[header.originalHeader] || ''}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button variant="primary" onClick={handleContinueToMapping}>Continue to Field Mapping</Button>
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
                  {allowedFields.map((field) => (
                    <tr key={field.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{field.label}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <Select
                          options={[{ value: '', label: 'Not Mapped' }, ...headers]}
                          value={fieldMappings[field.id] || ''}
                          onChange={val => handleFieldMapping(field.id, val)}
                          className="min-w-[300px]"
                        />
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
              <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
              <Button variant="primary" onClick={handleContinueToImport}>Import Registrations</Button>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            {isLoading ? (
              <div className="text-center py-12">
                <Spinner size="lg" />
                <p className="mt-4 text-gray-600">Processing import. This may take a few moments...</p>
              </div>
            ) : importResults ? (
              <>
                <div className="text-center">
                  <h3 className="mt-2 text-lg font-medium text-gray-900">
                    {importResults.success ? 'Import Completed Successfully' : 'Import Failed'}
                  </h3>
                  {importResults.success ? (
                    <p className="mt-1 text-sm text-gray-600">Imported {importResults.total} records.</p>
                  ) : (
                    <p className="mt-1 text-sm text-red-600">{importResults.error}</p>
                  )}
                </div>
                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={onClose}>Close</Button>
                  <Button variant="primary" onClick={() => setStep(1)}>Import More</Button>
                </div>
                {importResults && importResults.success && failedRows.length > 0 && (
                  <div className="text-center mt-4">
                    <p className="text-sm text-yellow-700">{failedRows.length} row(s) were skipped due to missing or invalid category.</p>
                    <Button variant="outline" onClick={handleExportFailedRows}>Export Failed Rows</Button>
                  </div>
                )}
              </>
            ) : null}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      <Card>
        {error && (
          <div className="mb-4 bg-red-50 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-red-400">!</span>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        {renderStep()}
      </Card>
    </div>
  );
};

export default SponsorBulkImportWizard; 