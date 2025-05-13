import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import eventService from '../../services/eventService';
import registrationService from '../../services/registrationService';
import { Card, Button, Alert, Spinner, ProgressBar } from '../../components/common';
import * as XLSX from 'xlsx';

const POLLING_INTERVAL = 3000; // Poll every 3 seconds

const BulkImport = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  
  // State variables
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [eventData, setEventData] = useState(null);
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [preview, setPreview] = useState([]);
  const [importStep, setImportStep] = useState(1); // 1: Upload, 2: Preview, 3: Mapping, 4: Results
  const [selectedFields, setSelectedFields] = useState({});
  const [importInProgress, setImportInProgress] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [fileData, setFileData] = useState(null);
  
  // New state for async import processing
  const [jobId, setJobId] = useState(null);
  const [jobStatus, setJobStatus] = useState(null); // Stores the whole job object from backend

  const pollingIntervalRef = useRef(null); // To store interval ID
  
  useEffect(() => {
    const fetchEventData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch event details
        const eventResponse = await eventService.getEventById(eventId);
        if (!eventResponse.success) {
          throw new Error(eventResponse.message || 'Failed to fetch event details');
        }
        
        // Fetch categories for the event
        const categoriesResponse = await eventService.getEventCategories(eventId);
        if (!categoriesResponse.success) {
          throw new Error(categoriesResponse.message || 'Failed to fetch categories');
        }
        
        // Fetch form configuration
        const formConfigResponse = await eventService.getRegistrationFormConfig(eventId);
        if (!formConfigResponse.success && !formConfigResponse.data) {
          console.warn('Using default form configuration');
        }
        
        // Format data to match our expected structure
        const formattedEventData = {
          id: eventResponse.data._id,
          name: eventResponse.data.name,
          registrationSettings: {
            fields: [
              { id: 'f1', name: 'firstName', label: 'First Name', required: true },
              { id: 'f2', name: 'lastName', label: 'Last Name', required: true },
              { id: 'f3', name: 'email', label: 'Email', required: true },
              { id: 'f4', name: 'organization', label: 'Organization', required: false },
              { id: 'f5', name: 'phone', label: 'Phone Number', required: false },
              { id: 'f6', name: 'country', label: 'Country', required: false },
              { id: 'f7', name: 'categoryId', label: 'Category', required: true }
            ],
            categories: categoriesResponse.data.map(cat => ({
              id: cat._id,
              name: cat.name
            }))
          }
        };
        
        // If form config exists, update the fields based on it
        if (formConfigResponse.success && formConfigResponse.data) {
          const { requiredFields = [] } = formConfigResponse.data;
          formattedEventData.registrationSettings.fields = 
            formattedEventData.registrationSettings.fields.map(field => ({
              ...field,
              required: requiredFields.includes(field.name)
            }));
        }
        
        setEventData(formattedEventData);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching event data:', err);
        setError('Failed to load event data: ' + err.message);
        setIsLoading(false);
      }
    };
    
    fetchEventData();
  }, [eventId]);
  
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    
    if (!selectedFile) return;
    
    if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.csv')) {
      setError('Please upload an Excel (.xlsx) or CSV (.csv) file');
      return;
    }
    
    setFile(selectedFile);
    setFileName(selectedFile.name);
    setError(null);
    
    // Parse the file using XLSX library
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get the first worksheet
        const worksheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[worksheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 'A' });
        
        // Take first 5 rows for preview
        const previewData = jsonData.slice(0, 5);
        
        setPreview(previewData);
        setFileData(jsonData); // Set the full data
        setImportStep(2); // Move to preview step
      } catch (error) {
        console.error('Error parsing file:', error);
        setError('Failed to parse file. Please check the format and try again.');
      }
    };
    reader.readAsArrayBuffer(selectedFile);
  };
  
  const handleFieldMapping = (excelColumn, fieldName) => {
    setSelectedFields({
      ...selectedFields,
      [fieldName]: excelColumn
    });
  };
  
  const handleInitiateImport = async () => {
    // Validate required field mappings
    const requiredFields = eventData.registrationSettings.fields
      .filter(field => field.required)
      .map(field => field.name);
      
    const missingRequiredFields = requiredFields.filter(
      field => !selectedFields[field]
    );
    
    if (missingRequiredFields.length > 0) {
      setError(`Please map the following required fields: ${missingRequiredFields.join(', ')}`);
      return;
    }
    
    setImportInProgress(true);
    setError(null);
    setJobStatus(null); // Reset previous job status
    setImportResults(null); // Reset previous results
    setImportStep(3); // Move to Processing step

    try {
      // Format the data according to mappings
      const formattedData = fileData.slice(1).map(row => {
        const formattedRow = {};
        
        // Apply field mappings
        Object.entries(selectedFields).forEach(([fieldName, excelColumn]) => {
          if (excelColumn) {
            formattedRow[fieldName] = row[excelColumn];
          }
        });
        
        return formattedRow;
      });
      
      // Call the bulk import function
      const response = await registrationService.bulkImport(eventId, formattedData, fileName);
      console.log('Import initiation response:', response);
      
      if (response && response.data && response.data.success && response.data.data?.jobId) {
        setJobId(response.data.data.jobId);
        // Polling will start via useEffect watching jobId
      } else {
        const errorMessage = response?.data?.message || response?.message || 'Failed to initiate import job.';
        setError(errorMessage);
        setImportInProgress(false);
        setImportStep(2); // Revert to mapping/preview step on initiation failure
      }
    } catch (err) {
      console.error('Error initiating import:', err);
      setError('Failed to start import process: ' + (err.message || 'Unknown error'));
      setImportInProgress(false);
      setImportStep(2); // Revert to mapping/preview step
    }
  };
  
  // Effect for polling job status
  useEffect(() => {
    const fetchJobStatus = async () => {
      if (!jobId) return;
      console.log(`[BulkImport polling] Fetching status for jobId: ${jobId}`); // Added for context

      try {
        const response = await registrationService.getImportJobStatus(jobId);
        console.log('[BulkImport polling] Raw response from getImportJobStatus service:', response); // Key log to check structure

        if (response && response.data && response.data.success) {
          const currentJob = response.data.data;
          setJobStatus(currentJob);

          if (currentJob.status === 'completed' || currentJob.status === 'failed' || currentJob.status === 'partial_completion') {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
            setImportInProgress(false);
            setImportResults({
              total: currentJob.totalRecords,
              successful: currentJob.successfulRecords,
              failed: currentJob.failedRecords,
              errors: currentJob.errorDetails || [], 
              status: currentJob.status,
              generalMessage: currentJob.generalErrorMessage
            });
            setImportStep(4);
            setJobId(null);
          } else {
            setImportInProgress(true); 
          }
        } else {
          const pollError = response?.data?.message || 'Failed to get job status update. Server indicated failure or malformed response.';
          console.warn('[BulkImport polling] Polling error or non-successful job status response:', pollError, response);
          setError(pollError);
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
          setImportInProgress(false);
          setImportResults({
              total: jobStatus?.totalRecords || (fileData ? fileData.length -1 : 0), 
              successful: 0,
              failed: jobStatus?.totalRecords || (fileData ? fileData.length -1 : 0),
              errors: [{ rowNumber: 'N/A', message: pollError, rowData: 'PollingResponseError' }],
              status: 'failed',
              generalMessage: pollError
          });
          setImportStep(4);
          setJobId(null);
        }
      } catch (pollError) {
        console.error('[BulkImport polling] Error polling job status (exception):', pollError);
        setError('Error fetching import progress: ' + pollError.message);
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
        setImportInProgress(false);
        setImportResults({
            total: jobStatus?.totalRecords || (fileData ? fileData.length -1 : 0),
            successful: 0,
            failed: jobStatus?.totalRecords || (fileData ? fileData.length -1 : 0),
            errors: [{ rowNumber: 'N/A', message: 'Polling exception: ' + pollError.message, rowData: 'PollingException' }],
            status: 'failed',
            generalMessage: 'Could not retrieve final import status due to a client-side error during polling.'
        });
        setImportStep(4);
        setJobId(null);
      }
    };

    if (jobId && importInProgress && !pollingIntervalRef.current) { // ensure importInProgress is true to start polling
      fetchJobStatus();
      pollingIntervalRef.current = setInterval(fetchJobStatus, POLLING_INTERVAL);
      // setImportInProgress(true); // Already set by handleInitiateImport or if job is still processing
      // setImportStep(3); // Already set by handleInitiateImport
    }

    // Cleanup function
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [jobId, importInProgress]); // Added importInProgress to dependencies to re-evaluate if polling should run
  
  // Add a preview function to check mappings
  const previewMappings = () => {
    if (fileData.length < 2) {
      setError('No data to preview');
      return;
    }
    
    // Check if we have any mappings
    if (Object.keys(selectedFields).length === 0) {
      setError('Please map at least one field before previewing');
      return;
    }
    
    // Take 3 rows as preview sample
    const previewSample = fileData.slice(1, 4);
    
    // Format data according to mappings
    const formattedPreview = previewSample.map(row => {
      const mappedRow = {};
      
      // Apply mappings
      Object.entries(selectedFields).forEach(([fieldName, excelColumn]) => {
        if (excelColumn) {
          const fieldLabel = eventData.registrationSettings.fields.find(f => f.name === fieldName)?.label || fieldName;
          mappedRow[fieldLabel] = row[excelColumn];
        }
      });
      
      return mappedRow;
    });
    
    // Show preview in a more structured way
    return (
      <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-700">Data Preview with Current Mappings</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {Object.keys(formattedPreview[0] || {}).map((header, idx) => (
                  <th 
                    key={idx} 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {formattedPreview.map((row, rowIdx) => (
                <tr key={rowIdx}>
                  {Object.values(row).map((value, cellIdx) => (
                    <td 
                      key={cellIdx} 
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                    >
                      {value}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };
  
  const resetImport = () => {
    setFile(null);
    setFileName('');
    setPreview([]);
    setImportStep(1);
    setSelectedFields({});
    setImportResults(null);
    setFileData(null);
    setError(null);
  };

  // Render loading state
  if (isLoading && !eventData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-sm rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">
            Bulk Import Registrations for: {eventData?.name || 'Loading event...'}
          </h1>
          <button
            type="button"
            onClick={() => navigate(`/events/${eventId || ''}/registrations`)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Back to Registrations
          </button>
        </div>
        
        {error && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Steps indicator */}
        <div className="mb-8">
          <nav aria-label="Progress">
            <ol role="list" className="flex items-center">
              {[
                { id: 1, name: 'Upload File' },
                { id: 2, name: 'Preview Data' },
                { id: 3, name: 'Map Fields' },
                { id: 4, name: 'Results' }
              ].map((step, index) => (
                <li key={step.id} className={`relative ${index !== 0 ? 'pl-6 sm:pl-8' : ''} ${index !== 3 ? 'pr-6 sm:pr-8' : ''} flex-1`}>
                  <div className="flex items-center">
                    <div aria-current={importStep >= step.id ? 'step' : undefined} className={`relative flex h-6 w-6 items-center justify-center rounded-full ${importStep > step.id ? 'bg-primary-600' : importStep === step.id ? 'border-2 border-primary-600' : 'border-2 border-gray-300'}`}>
                      {importStep > step.id ? (
                        <svg className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <span className={`text-xs font-semibold ${importStep === step.id ? 'text-primary-600' : 'text-gray-500'}`}>{step.id}</span>
                      )}
                    </div>
                    {index !== 3 && (
                      <div className={`flex-1 h-0.5 ${importStep > index + 1 ? 'bg-primary-600' : 'bg-gray-300'}`}></div>
                    )}
                  </div>
                  <div className="mt-2 text-xs text-center font-medium">{step.name}</div>
                </li>
              ))}
            </ol>
          </nav>
        </div>
        
        {/* Step 1: Upload File */}
        {importStep === 1 && (
          <div className="space-y-4">
            <p className="text-gray-700">Upload an Excel file (.xlsx) or CSV (.csv) containing registration data.</p>
            
            <div className="mt-1 sm:mt-0 sm:col-span-2">
              <div className="max-w-lg flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="flex text-sm text-gray-600">
                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500">
                      <span>Upload a file</span>
                      <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".xlsx,.csv" />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">XLSX or CSV up to 10MB</p>
                </div>
              </div>
            </div>
            
            {fileName && (
              <div className="flex items-center mt-2 text-sm text-gray-700">
                <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>File selected: {fileName}</span>
              </div>
            )}
            
            <div className="pt-5">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => navigate(`/events/${eventId || ''}/registrations`)}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Step 2: Preview Data */}
        {importStep === 2 && (
          <div className="space-y-4">
            <p className="text-gray-700">Review the data from your file and continue to map the columns to registration fields.</p>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-300">
                <thead>
                  <tr>
                    {preview.length > 0 && Object.keys(preview[0]).map((column) => (
                      <th key={column} scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Column {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {preview.slice(0, 5).map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {Object.values(row).map((value, cellIndex) => (
                        <td key={cellIndex} className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {value}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="pt-5">
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={resetImport}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setImportStep(3)}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Continue to Field Mapping
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Step 3: Map Fields OR Show Processing Progress */}
        {importStep === 3 && (
          importInProgress && jobId ? renderProcessingStep() : (
            <div className="space-y-4">
              <p className="text-gray-700">Map each column from your file to the corresponding registration field.</p>
              
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                        Registration Field
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        File Column
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Required
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {eventData.registrationSettings.fields.map((field) => (
                      <tr key={field.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {field.label}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <select
                            value={selectedFields[field.name] || ''}
                            onChange={(e) => handleFieldMapping(e.target.value, field.name)}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                          >
                            <option value="">Not Mapped</option>
                            {preview.length > 0 && Object.keys(preview[0]).map((column) => (
                              <option key={column} value={column}>
                                Column {column} - Example: {preview[0][column]}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {field.required ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Required
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Optional
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-6 flex justify-between">
                <Button onClick={() => { setImportStep(2); setError(null); }} variant="outline">Back</Button>
                <div>
                  <Button onClick={handleInitiateImport} disabled={importInProgress || !fileData} variant="primary">
                    {importInProgress ? (<><Spinner size="sm" className="mr-2" />Processing...</>) : 'Start Import'}
                  </Button>
                </div>
              </div>
            </div>
          )
        )}
        
        {/* Step 4: Results - Adapted for new importResults structure */}
        {importStep === 4 && importResults && (
          <div className="space-y-6">
            <Alert 
              type={importResults.status === 'failed' && importResults.successful === 0 ? 'danger' : importResults.failed > 0 ? 'warning' : 'success'}
              message={
                importResults.generalMessage || 
                `Import ${importResults.status}. Total: ${importResults.total}, Successful: ${importResults.successful}, Failed: ${importResults.failed}.`
              }
            />
            
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              {/* Total Records Card */}
              <Card title="Total Records" className="text-center">
                <p className="mt-1 text-3xl font-semibold text-gray-900">{importResults.total}</p>
              </Card>
              {/* Successfully Imported Card */}
              <Card title="Successfully Imported" className="text-center">
                <p className="mt-1 text-3xl font-semibold text-green-600">{importResults.successful}</p>
              </Card>
              {/* Failed Imports Card */}
              <Card title="Failed Imports" className="text-center">
                <p className="mt-1 text-3xl font-semibold text-red-600">{importResults.failed}</p>
              </Card>
            </div>
            
            {importResults.errors && importResults.errors.length > 0 && (
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-3">Error Details</h4>
                <Card className="max-h-96 overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Row</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Error Message</th>
                        {/* Optionally display problematic rowData if needed */}
                        {/* <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Row Data</th> */}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {importResults.errors.map((err, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{err.rowNumber || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm text-red-700 break-words">{err.message}</td>
                          {/* <td className="px-4 py-3 text-xs text-gray-500 break-all">{JSON.stringify(err.rowData)}</td> */}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              </div>
            )}
            
            <div className="pt-5 border-t border-gray-200">
              <div className="flex justify-end space-x-3">
                <Button onClick={resetImport} variant="outline">
                  Import Another File
                </Button>
                <Button onClick={() => navigate(`/events/${eventId || ''}/registrations`)} variant="primary">
                  Go to Registrations
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkImport; 