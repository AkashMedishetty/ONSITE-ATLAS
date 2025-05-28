import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowUpTrayIcon, 
  DocumentTextIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';
import { Button, Card, Select, Spinner } from '../../components/common';
import * as XLSX from 'xlsx';
import registrationService from '../../services/registrationService';
import eventService from '../../services/eventService';

const BulkImportWizard = () => {
  const { id: eventIdParam } = useParams();
  const navigate = useNavigate();
  
  const eventId = eventIdParam;
  
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [fileData, setFileData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldMappings, setFieldMappings] = useState({});
  const [importResults, setImportResults] = useState(null);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoryMap, setCategoryMap] = useState({});
  const [currentJobId, setCurrentJobId] = useState(null);
  const [isPolling, setIsPolling] = useState(false);
  const [pollingError, setPollingError] = useState(null);
  const [jobProgress, setJobProgress] = useState({
    processedRecords: 0,
    successfulRecords: 0,
    failedRecords: 0,
    totalRecords: 0,
    progressPercent: 0,
    status: 'pending'
  });
  
  // Required and optional fields
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
  
  useEffect(() => {
    eventService.getEventCategories(eventId)
      .then(response => {
        setCategories(response.data);
        setCategoriesLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch categories:', err);
        setCategoriesLoading(false);
      });
  }, [eventId]);
  
  useEffect(() => {
    const map = categories.reduce((acc, category) => {
      acc[category.name.toLowerCase()] = category._id;
      return acc;
    }, {});
    setCategoryMap(map);
  }, [categories]);
  
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
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length < 2) {
          setError('File must contain at least a header row and one data row');
          setIsLoading(false);
          return;
        }
        
        // Extract headers and data
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
        
        // Initialize field mappings with empty values
        const initialMappings = {};
        allFields.forEach(field => {
          initialMappings[field.id] = '';
        });
        setFieldMappings(initialMappings);
        
        // Try to auto-map fields based on header names
        const autoMappings = { ...initialMappings };
        extractedHeaders.forEach(header => {
          const headerText = header.originalHeader.toLowerCase();
          
          // Auto-map based on common field names
          if (headerText.includes('first') || headerText === 'name' || headerText.includes('fname')) {
            autoMappings.firstName = header.value;
          } else if (headerText.includes('last') || headerText.includes('lname') || headerText.includes('surname')) {
            autoMappings.lastName = header.value;
          } else if (headerText.includes('email')) {
            autoMappings.email = header.value;
          } else if (headerText.includes('phone') || headerText.includes('mobile') || headerText.includes('cell')) {
            autoMappings.phoneNumber = header.value;
          } else if (headerText.includes('org') || headerText.includes('company')) {
            autoMappings.organization = header.value;
          } else if (headerText === 'city') {
            autoMappings.city = header.value;
          } else if (headerText === 'state' || headerText.includes('province')) {
            autoMappings.state = header.value;
          } else if (headerText === 'country') {
            autoMappings.country = header.value;
          } else if (headerText.includes('zip') || headerText.includes('postal')) {
            autoMappings.postalCode = header.value;
          } else if (headerText.includes('category') || headerText.includes('membership')) {
            autoMappings.categoryId = header.value;
          } else if (headerText.includes('regid') || headerText.includes('registration id') || headerText.includes('registration_id') || headerText.includes('participant id') || headerText.includes('member id')) {
            autoMappings.registrationId = header.value;
          }
        });
        
        setFieldMappings(autoMappings);
        setStep(2);
      } catch (error) {
        console.error('Error parsing Excel file:', error);
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
    setFieldMappings(prev => ({
      ...prev,
      [fieldId]: columnValue
    }));
  };
  
  const validateMappings = () => {
    const missingRequiredFields = requiredFields
      .filter(field => !fieldMappings[field.id])
      .map(field => field.label);
    
    if (missingRequiredFields.length > 0) {
      setError(`Please map the following required fields: ${missingRequiredFields.join(', ')}`);
      return false;
    }
    
    return true;
  };
  
  // Make this function async to handle awaits for category creation
  const handleContinueToImport = async () => { 
    if (!validateMappings()) return;
    
    if (categoriesLoading) {
      setError('Categories are still loading. Please wait and try again.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setPollingError(null);
    setImportResults(null);
    setCurrentJobId(null);
    setStep(4);
    
    // --- Pre-process to find and create unique new categories --- 
    const uniqueFileCategoryNames = [...new Set(
        fileData.map(row => {
            const categoryColumnValue = fieldMappings.categoryId;
            if (!categoryColumnValue) return null; // Skip if category column not mapped
            
            const columnLetter = categoryColumnValue.split(' ')[1];
            const headerIndex = columnLetter.charCodeAt(0) - 65;
            const originalHeader = headers.find(h => h.index === headerIndex)?.originalHeader;
            
            return originalHeader ? String(row[originalHeader]).trim().toLowerCase() : null;
        })
        .filter(name => name) // Filter out null/empty names
    )];
    
    const categoriesToCreate = uniqueFileCategoryNames.filter(name => !categoryMap[name]);
    const failedCategoryCreations = new Set();
    
    if (categoriesToCreate.length > 0) {
        console.log('Attempting to create new categories:', categoriesToCreate);
        const creationPromises = categoriesToCreate.map(name => 
            eventService.createEventCategory(eventId, { name }) // Assuming name is enough
                .then(response => {
                    if (response && response.data && response.data.success && response.data.data?._id) {
                        console.log(`Category "${response.data.data.name}" created successfully.`);
                        return response.data.data; // Return the new category object from the nested data field
                    } else {
                        // Log the actual response structure if it's not as expected
                        console.error(`Failed to create category "${name}": API response did not indicate success or data was missing. Raw response.data:`, response?.data);
                        failedCategoryCreations.add(name.toLowerCase());
                        return null;
                    }
                })
                .catch(creationError => {
                    console.error(`API Error creating category "${name}":`, creationError);
                    failedCategoryCreations.add(name.toLowerCase());
                    return null;
                })
        );
        
        const newCategories = (await Promise.all(creationPromises)).filter(cat => cat !== null);
        
        // Update local state and map if new categories were created
        if (newCategories.length > 0) {
            setCategories(prev => [...prev, ...newCategories]);
            newCategories.forEach(cat => {
                categoryMap[cat.name.toLowerCase()] = cat._id;
            });
        }
    }
    // --- End of pre-processing ---

    // Process the data according to the mappings - Use updated categoryMap
    const processingErrors = []; // Rows that failed client-side validation
    const processedData = []; // Rows that passed client-side validation and are ready for API
    
    fileData.forEach((row, index) => {
      const registrationPayload = {
        personalInfo: {},
        professionalInfo: {},
        customFields: {},
        originalFileRowNumber: index + 2,
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
                if (failedCategoryCreations.has(categoryName.toLowerCase())) {
                    currentErrors.push(`Category "${categoryName}" could not be created.`);
                } else if (!categoryName) {
                     currentErrors.push(`Missing category name in source file.`);
                } else {
                    currentErrors.push(`Category "${categoryName}" not found and was not created.`);
                }
                rowHasError = true;
            }
          } else if (fieldId === 'registrationId') {
              if (rawValue !== null && rawValue !== undefined && String(rawValue).trim() !== '') {
                  registrationPayload.registrationId = String(rawValue).trim();
              }
          } else if (fieldId === 'mciNumber' || fieldId === 'membership') {
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
      // Remove empty objects
      if (Object.keys(registrationPayload.professionalInfo).length === 0) delete registrationPayload.professionalInfo;
      if (Object.keys(registrationPayload.customFields).length === 0) delete registrationPayload.customFields;
      
      // --- Refined Frontend Validation Check --- 
      const personalInfo = registrationPayload.personalInfo;
      if (!personalInfo?.firstName?.trim()) {
         currentErrors.push('Missing First Name');
         rowHasError = true;
      }
      if (!personalInfo?.lastName?.trim()) {
         currentErrors.push('Missing Last Name');
         rowHasError = true;
      }
      // REMOVED: Email check is no longer blocking
      // if (!personalInfo?.email?.trim()) { 
      //    currentErrors.push('Missing Email');
      //    rowHasError = true;
      // }
      // --- End Validation Check --- 
      
      if (rowHasError) {
          // Add specific validation errors for rows that FAIL client-side check
          processingErrors.push({
              rowNumber: index + 2, 
              message: `Row validation failed: ${currentErrors.join(', ')}`,
              originalExcelRow: row, // ADDED: Store the original Excel row data for client-side failures
          });
          console.warn(`Row ${index + 2} failed validation: ${currentErrors.join(', ')}`, row);
      } else {
          // Add successfully validated rows to the data to be sent
          processedData.push(registrationPayload); 
      }
    });
    
    // Log counts before API call
    console.log(`Client-side validation complete. Failed rows: ${processingErrors.length}. Rows to submit: ${processedData.length}.`);

    // --- API Call Section --- 
    // Only proceed if there's valid data to send
    if (processedData.length === 0) {
        console.log("No valid data to submit after client-side validation.");
        // Update results to show only client-side errors
        setImportResults({
            total: fileData.length, 
            successful: 0,
            failed: fileData.length, 
            errors: processingErrors // Show only the client-side errors
        });
        setIsLoading(false); 
        return; // Exit
    }

    // --- Make the API call with the VALIDATED data --- 
    console.log("Data being sent to bulkImport API:", JSON.stringify(processedData, null, 2));
    
    registrationService.bulkImport(eventId, processedData)
      .then(response => {
        // API call was made, check for jobId to start polling
        if (response.status === 202 && response.data?.data?.jobId) {
          const jobId = response.data.data.jobId;
          console.log("Bulk import job started successfully. Job ID:", jobId);
          setCurrentJobId(jobId);
          setIsPolling(true); // Start polling, isLoading remains true
          // Polling will be handled by useEffect
        } else {
          // --- Correctly access the NESTED data object from the API response --- 
          const apiResponseData = response.data?.data || {}; // Get the nested data object, or default to empty
          // ---------------------------------------------------------------------

          const apiSuccessful = apiResponseData.successful || 0;
          // If 'failed' is not directly provided, calculate it based on processedData length and successful
          const apiFailed = apiResponseData.failed ?? (processedData.length - apiSuccessful);
          const apiErrors = apiResponseData.errors || [];
          
          console.log("Received IMMEDIATE API import results (nested data):", apiResponseData);

          setImportResults({
            total: fileData.length, // Total rows from the file
            successful: apiSuccessful, // Rows successfully imported by API
            failed: processingErrors.length + apiFailed, // Client validation failures + API failures
            errors: [...processingErrors, ...apiErrors], // Combine client and API errors
            registrations: apiResponseData.registrations || [] 
          });
          setIsLoading(false); // Import finished (or failed) immediately
        }
      })
      .catch(err => {
        console.error("Bulk Import API call failed:", err);
        const message = err.response?.data?.message || err.message || 'Unknown error during initial API call';
        // API call failed entirely, combine client errors with the API error message
        setImportResults({
            total: fileData.length,
            successful: 0,
            failed: fileData.length, // All considered failed
            errors: [
                ...processingErrors, // Include rows that failed client validation
                { rowNumber: 'API Error', message: `API Call Failed: ${message}` } // Add the overall API error
            ]
        });
        setIsLoading(false);
        // Error is displayed via importResults in renderStep 4
      });
  };
  
  // --- useEffect for Polling Job Status ---
  useEffect(() => {
    let intervalId;
    if (currentJobId && isPolling) {
      setError(null); // Clear general errors, show polling status
      setPollingError(null); // Clear previous polling errors
      
      const pollStatus = async () => {
        try {
          console.log(`Polling for job status: ${currentJobId}`);
          const jobStatusResponse = await registrationService.getImportJobStatus(currentJobId);
          
          if (jobStatusResponse && jobStatusResponse.data) {
            const job = jobStatusResponse.data; // This is the full ImportJob object
            console.log("Job status received:", job);

            // Update granular progress regardless of status, as long as job data is valid
            setJobProgress({
              processedRecords: job.processedRecords || 0,
              successfulRecords: job.successfulRecords || 0,
              failedRecords: job.failedRecords || 0,
              totalRecords: job.totalRecords || (fileData.length > 0 ? fileData.length : 0), // Fallback to fileData.length for total
              progressPercent: job.progressPercent || (job.totalRecords > 0 ? Math.round((job.processedRecords / job.totalRecords) * 100) : 0),
              status: job.status || 'unknown'
            });

            if (job.status === 'completed' || job.status === 'failed' || job.status === 'partial_completion') {
              setIsPolling(false);
              setIsLoading(false); // Polling and loading finished
              setCurrentJobId(null); // Clear job ID
              
              // Transform job data to importResults structure
              setImportResults({
                total: job.totalRecords,
                successful: job.successfulRecords,
                failed: job.failedRecords,
                errors: job.errorDetails || [], // Ensure errors is an array
                registrations: job.registrations || [], // If available
                statusMessage: job.generalErrorMessage || `Import ${job.status}.`,
                jobStatus: job.status
              });
              if (job.generalErrorMessage) {
                 setPollingError(job.generalErrorMessage); // Display general job error
              }
            } else if (job.status === 'pending' || job.status === 'processing') {
              // Still processing, continue polling. 
              // jobProgress state is already updated above.
              console.log(`Job ${currentJobId} is still ${job.status}. Progress: ${job.progressPercent}%`);
            }
          } else {
            // Handle cases where jobStatusResponse or jobStatusResponse.data is not as expected
            console.error('Invalid job status response structure:', jobStatusResponse);
            setPollingError('Received an invalid response while checking job status.');
            // Potentially stop polling here if the response is consistently bad
          }
        } catch (pollError) {
          console.error("Polling error:", pollError);
          // If specific error message from server, use it. Otherwise, generic.
          const message = pollError.message || 'Error checking import status. Will retry.';
          setPollingError(message); 
          // Decide if we should stop polling or let it retry.
          // For simplicity, we'll let it retry for a few times or until a different error (e.g. 404)
          // For robust solution, add retry count and max retries.
          // If pollError.status === 404, it implies job ID is invalid, stop polling.
          if (pollError.response && pollError.response.status === 404) {
            setPollingError(`Import job ${currentJobId} not found. Please check the job ID or contact support.`);
            setIsPolling(false);
            setIsLoading(false);
            setCurrentJobId(null);
          }
        }
      };

      pollStatus(); // Initial check
      intervalId = setInterval(pollStatus, 5000); // Poll every 5 seconds
    }

    return () => {
      clearInterval(intervalId); // Cleanup on component unmount or if polling stops
    };
  }, [currentJobId, isPolling, eventId]); // eventId might not be needed but good for consistency
  
  // --- Function to handle downloading failed rows --- 
  const handleDownloadFailedRows = () => {
    if (!importResults || !importResults.errors || importResults.errors.length === 0) {
      console.warn('No failed rows with data to download.');
      return;
    }

    // Create a map from category ID to category name for easier lookup
    const categoryIdToNameMap = categories.reduce((acc, cat) => {
      acc[cat._id] = cat.name;
      return acc;
    }, {});

    // Filter errors that have rowData (API errors), originalExcelRow (client errors), or at least a rowNumber
    const errorsToProcess = importResults.errors.filter(e => e.rowData || e.originalExcelRow || e.rowNumber);
    
    if (errorsToProcess.length === 0) {
      console.warn('No failed rows with processable data found in errors.');
      return;
    }

    // 1. Determine headers: Use original mapped headers + "Import Error"
    const downloadHeaders = headers.map(h => h.originalHeader); 
    downloadHeaders.push('Import Error'); 

    // 2. Prepare rows
    const downloadRows = errorsToProcess.map(error => {
      const rowValues = [];
      const isClientError = !!error.originalExcelRow; // Check if it's a client-side error with originalExcelRow
      const backendRowData = error.rowData; // Data from backend (registrationPayload like structure)
      
      headers.forEach(header => {
        let value = '';
        if (isClientError) {
          // For client-side errors, use the originalExcelRow directly with the original header
          value = error.originalExcelRow[header.originalHeader];
        } else if (backendRowData) {
          // For backend errors, find which system fieldId this Excel header was mapped to
          const mappedFieldId = Object.keys(fieldMappings).find(fieldId => {
              const mappingValue = fieldMappings[fieldId]; // e.g., "Column A"
              if (!mappingValue) return false;
              const columnLetter = mappingValue.split(' ')[1];
              const headerIndexFromFile = columnLetter.charCodeAt(0) - 65;
              return header.index === headerIndexFromFile;
          });

          if (mappedFieldId) {
            if (mappedFieldId === 'categoryId') {
              value = backendRowData.category ? categoryIdToNameMap[backendRowData.category] || backendRowData.category : '';
            } else if (mappedFieldId === 'registrationId') {
              value = backendRowData.registrationId;
            } else if (backendRowData.personalInfo && backendRowData.personalInfo[mappedFieldId] !== undefined) {
              value = backendRowData.personalInfo[mappedFieldId];
            } else if (backendRowData[mappedFieldId] !== undefined) { // Fallback for fields not in personalInfo
                value = backendRowData[mappedFieldId];
            }
          } else {
            // If the original Excel column was not mapped to any system field, its value will be empty.
            // This path is taken if an Excel column header had no corresponding mapping to a system fieldId.
          }
        } 
        rowValues.push(value !== undefined && value !== null ? String(value) : ''); 
      });

      // Add the error message
      rowValues.push(error.message || 'Unknown error'); 
      
      return rowValues;
    });

    // 3. Create Worksheet and Workbook
    const ws = XLSX.utils.aoa_to_sheet([downloadHeaders, ...downloadRows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Failed Imports');

    // 4. Trigger Download
    const filename = `failed_imports_${eventId}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, filename);
  };
  // --- End Download Function ---
  
  // Render steps based on current step
  const renderStep = () => {
    switch (step) {
      case 1: // Upload File
        return (
          <div className="space-y-8">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                <ArrowUpTrayIcon className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="mt-2 text-lg font-medium text-gray-900">Upload Excel File</h3>
              <p className="mt-1 text-sm text-gray-500">
                Upload an Excel file containing registration data. The file should have headers in the first row.
              </p>
            </div>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
              <input
                type="file"
                id="file-upload"
                className="sr-only"
                accept=".xlsx, .xls"
                onChange={handleFileUpload}
              />
              <label
                htmlFor="file-upload"
                className="relative cursor-pointer rounded-md font-medium text-primary-600 focus-within:outline-none"
              >
                <div className="space-y-1 text-center">
                  <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <span>Drop file here, or</span>
                    <p className="pl-1 text-primary-600">browse</p>
                  </div>
                  <p className="text-xs text-gray-500">Excel files only (.xlsx, .xls)</p>
                </div>
              </label>
            </div>
          </div>
        );
        
      case 2: // Preview Data
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Review the data from your file and continue to map the columns to registration fields.
            </p>
            
            <div className="overflow-x-auto border rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {headers.map((header, index) => (
                      <th
                        key={index}
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {header.originalHeader}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {fileData.slice(0, 5).map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {headers.map((header, colIndex) => (
                        <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {row[header.originalHeader] || ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {fileData.length > 5 && (
              <p className="text-xs text-gray-500 italic">
                Showing 5 of {fileData.length} rows.
              </p>
            )}
            
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button variant="primary" onClick={handleContinueToMapping}>
                Continue to Field Mapping
              </Button>
            </div>
          </div>
        );
        
      case 3: // Map Fields
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Map each column from your file to the corresponding registration field.
            </p>
            
            <div className="border rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Registration Field
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      File Column
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Required
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {requiredFields.map((field) => (
                    <tr key={field.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {field.label}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <Select
                          options={[
                            { value: '', label: 'Not Mapped' },
                            ...headers
                          ]}
                          value={fieldMappings[field.id] || ''}
                          onChange={(selectedValue) => handleFieldMapping(field.id, selectedValue)}
                          className="min-w-[300px]"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          Required
                        </span>
                      </td>
                    </tr>
                  ))}
                  
                  {optionalFields.map((field) => (
                    <tr key={field.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {field.label}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <Select
                          options={[
                            { value: '', label: 'Not Mapped' },
                            ...headers
                          ]}
                          value={fieldMappings[field.id] || ''}
                          onChange={(selectedValue) => handleFieldMapping(field.id, selectedValue)}
                          className="min-w-[300px]"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          Optional
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button variant="primary" onClick={handleContinueToImport}>
                Import Registrations
              </Button>
            </div>
          </div>
        );
        
      case 4: // Results
        return (
          <div className="space-y-6">
            {isLoading ? (
              <div className="text-center py-12">
                <Spinner size="lg" />
                <p className="mt-4 text-gray-600">
                  {isPolling && currentJobId 
                    ? `Processing import (Job ID: ${currentJobId}): ${jobProgress.progressPercent}% complete. Processed: ${jobProgress.processedRecords}/${jobProgress.totalRecords} (Successful: ${jobProgress.successfulRecords}, Failed: ${jobProgress.failedRecords}). This may take a few moments...`
                    : `Preparing import of ${fileData.length > 0 ? `${fileData.length} records` : 'your file'}. Please wait...`}
                </p>
                {pollingError && (
                  <div className="mt-4 bg-red-50 p-3 rounded-md text-sm text-red-700">
                    <p>{pollingError}</p>
                  </div>
                )}
              </div>
            ) : importResults ? (
              <>
                <div className="text-center">
                  <div className={`mx-auto h-12 w-12 rounded-full flex items-center justify-center ${
                      importResults.jobStatus === 'completed' && importResults.failed === 0 ? 'bg-green-100' :
                      importResults.jobStatus === 'partial_completion' || (importResults.jobStatus === 'completed' && importResults.failed > 0) ? 'bg-yellow-100' :
                      'bg-red-100'
                    }`}
                  >
                    {importResults.jobStatus === 'completed' && importResults.failed === 0 ? <CheckCircleIcon className="h-6 w-6 text-green-600" /> :
                     importResults.jobStatus === 'partial_completion' ? <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" /> :
                     <XCircleIcon className="h-6 w-6 text-red-600" />}
                  </div>
                  <h3 className="mt-2 text-lg font-medium text-gray-900">
                    {importResults.jobStatus === 'completed' && importResults.failed === 0 ? 'Import Completed Successfully' :
                     importResults.jobStatus === 'partial_completion' ? 'Import Partially Completed' :
                     importResults.jobStatus === 'completed' && importResults.failed > 0 ? 'Import Completed with Failures' :
                     'Import Failed'}
                  </h3>
                  {importResults.statusMessage && (
                    <p className="mt-1 text-sm text-gray-600">{importResults.statusMessage}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Total Records</p>
                      <p className="text-3xl font-bold text-gray-900">{importResults.total}</p>
                    </div>
                  </Card>
                  
                  <Card>
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Successfully Imported</p>
                      <p className="text-3xl font-bold text-green-600">{importResults.successful}</p>
                    </div>
                  </Card>
                  
                  <Card>
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Failed</p>
                      <p className="text-3xl font-bold text-red-600">{importResults.failed}</p>
                    </div>
                  </Card>
                </div>
                
                {importResults.errors && importResults.errors.length > 0 && (
                  <div className="border rounded-lg divide-y">
                    <div className="px-4 py-3 bg-gray-50">
                      <h4 className="text-sm font-medium text-gray-900">Error Details ({importResults.errors.length})</h4>
                    </div>
                    <div className="p-4 space-y-2">
                      {importResults.errors.map((error, index) => (
                        <div key={index} className="bg-red-50 p-3 rounded-md">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <XCircleIcon className="h-5 w-5 text-red-400" />
                            </div>
                            <div className="ml-3">
                              <p className="text-sm text-red-700">{error.message}</p>
                              {error.rowNumber && (
                                <p className="text-xs text-red-500">Row {error.rowNumber}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex justify-between items-center pt-4">
                   {/* Existing Buttons */}
                   <div className="flex space-x-3">
                  <Button variant="outline" onClick={() => navigate(`/events/${eventId}/registrations`)}>
                    View Registrations
                  </Button>
                  <Button variant="primary" onClick={() => setStep(1)}>
                    Import More
                  </Button>
                   </div>

                   {/* --- Add Download Button --- */} 
                   {importResults.failed > 0 && (
                      <Button 
                        variant="secondary" // Or choose an appropriate style
                        onClick={handleDownloadFailedRows}
                        disabled={!importResults.errors.some(e => e.rowData || e.rowNumber)} // Disable if no downloadable errors
                      >
                         Download Failed Rows
                      </Button>
                   )}
                   {/* --- End Download Button --- */}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <div className="mx-auto h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="mt-2 text-lg font-medium text-gray-900">Error During Import</h3>
                <p className="mt-1 text-sm text-red-500">{pollingError}</p>
                <Button variant="outline" className="mt-4" onClick={() => setStep(1)}>
                  Start Over
                </Button>
              </div>
            )}
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Bulk Import Registrations</h1>
        <Link
          to={`/events/${eventId}/registrations`}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Back to Registrations
        </Link>
      </div>
      
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {/* Step 1 Indicator */}
          <div className="flex items-center relative">
            <div className={`rounded-full h-8 w-8 flex items-center justify-center 
              ${step >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
              1
            </div>
            <div className="ml-2 text-sm font-medium text-gray-900">Upload File</div>
          </div>
          <div className={`flex-1 h-0.5 mx-4 ${step >= 2 ? 'bg-primary-600' : 'bg-gray-200'}`}></div>
          {/* Step 2 Indicator */}
          <div className="flex items-center relative">
            <div className={`rounded-full h-8 w-8 flex items-center justify-center 
              ${step >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
              2
            </div>
            <div className="ml-2 text-sm font-medium text-gray-900">Preview Data</div>
          </div>
          <div className={`flex-1 h-0.5 mx-4 ${step >= 3 ? 'bg-primary-600' : 'bg-gray-200'}`}></div>
          {/* Step 3 Indicator */}
          <div className="flex items-center relative">
            <div className={`rounded-full h-8 w-8 flex items-center justify-center 
              ${step >= 3 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
              3
            </div>
            <div className="ml-2 text-sm font-medium text-gray-900">Map Fields</div>
          </div>
          <div className={`flex-1 h-0.5 mx-4 ${step >= 4 ? 'bg-primary-600' : 'bg-gray-200'}`}></div>
          {/* Step 4 Indicator */}
          <div className="flex items-center relative">
            <div className={`rounded-full h-8 w-8 flex items-center justify-center 
              ${step >= 4 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
              4
            </div>
            <div className="ml-2 text-sm font-medium text-gray-900">Results</div>
          </div>
        </div>
      </div>
      
      {/* Main Content Card */}
      <Card>
        {error && step !== 4 && !isPolling && (
          <div className="mb-4 bg-red-50 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <XCircleIcon className="h-5 w-5 text-red-400" />
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

export default BulkImportWizard;