import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Input,
  Select,
  Button,
  Checkbox,
  Alert,
  Spinner,
  Tabs
} from '../../components/common';

const ReportBuilder = () => {
  const navigate = useNavigate();
  
  // State
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);
  const [reportName, setReportName] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [selectedDataSource, setSelectedDataSource] = useState('registrations');
  const [selectedFields, setSelectedFields] = useState([]);
  const [filters, setFilters] = useState([{ field: '', operator: 'equals', value: '' }]);
  const [groupBy, setGroupBy] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  const [previewData, setPreviewData] = useState(null);
  
  // Available data sources and their fields
  const dataSources = [
    { value: 'registrations', label: 'Registrations' },
    { value: 'food_tracking', label: 'Food Tracking' },
    { value: 'kitbag_distribution', label: 'Kit Bag Distribution' },
    { value: 'certificate_issuance', label: 'Certificate Issuance' },
    { value: 'abstracts', label: 'Abstract Submissions' }
  ];
  
  const dataSourceFields = {
    registrations: [
      { value: 'registrationId', label: 'Registration ID' },
      { value: 'firstName', label: 'First Name' },
      { value: 'lastName', label: 'Last Name' },
      { value: 'email', label: 'Email' },
      { value: 'category', label: 'Category' },
      { value: 'organization', label: 'Organization' },
      { value: 'registrationDate', label: 'Registration Date' },
      { value: 'checkedIn', label: 'Checked In Status' },
      { value: 'checkInTime', label: 'Check-in Time' }
    ],
    food_tracking: [
      { value: 'registrationId', label: 'Registration ID' },
      { value: 'mealType', label: 'Meal Type' },
      { value: 'mealName', label: 'Meal Name' },
      { value: 'date', label: 'Date' },
      { value: 'time', label: 'Time' },
      { value: 'attendeeName', label: 'Attendee Name' },
      { value: 'category', label: 'Category' }
    ],
    kitbag_distribution: [
      { value: 'registrationId', label: 'Registration ID' },
      { value: 'kitType', label: 'Kit Type' },
      { value: 'distributionDate', label: 'Distribution Date' },
      { value: 'attendeeName', label: 'Attendee Name' },
      { value: 'category', label: 'Category' }
    ],
    certificate_issuance: [
      { value: 'registrationId', label: 'Registration ID' },
      { value: 'certificateType', label: 'Certificate Type' },
      { value: 'issuanceDate', label: 'Issuance Date' },
      { value: 'attendeeName', label: 'Attendee Name' },
      { value: 'sentByEmail', label: 'Sent By Email' }
    ],
    abstracts: [
      { value: 'abstractId', label: 'Abstract ID' },
      { value: 'title', label: 'Title' },
      { value: 'author', label: 'Author' },
      { value: 'authorEmail', label: 'Author Email' },
      { value: 'submissionDate', label: 'Submission Date' },
      { value: 'status', label: 'Status' },
      { value: 'reviewerComments', label: 'Reviewer Comments' },
      { value: 'category', label: 'Category' }
    ]
  };
  
  const filterOperators = [
    { value: 'equals', label: 'Equals' },
    { value: 'notEquals', label: 'Not Equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'greaterThan', label: 'Greater Than' },
    { value: 'lessThan', label: 'Less Than' },
    { value: 'between', label: 'Between' },
    { value: 'isNull', label: 'Is Empty' },
    { value: 'isNotNull', label: 'Is Not Empty' }
  ];
  
  // Set initial fields when data source changes
  useEffect(() => {
    const fields = dataSourceFields[selectedDataSource] || [];
    if (fields.length > 0) {
      setSelectedFields([fields[0].value]);
      // Also update filter fields to match new data source
      setFilters([{ field: fields[0].value, operator: 'equals', value: '' }]);
      setGroupBy('');
      setSortBy('');
    }
  }, [selectedDataSource]);
  
  const handleFieldToggle = (fieldValue) => {
    if (selectedFields.includes(fieldValue)) {
      setSelectedFields(selectedFields.filter(field => field !== fieldValue));
    } else {
      setSelectedFields([...selectedFields, fieldValue]);
    }
  };
  
  const handleAddFilter = () => {
    const fields = dataSourceFields[selectedDataSource] || [];
    setFilters([...filters, { field: fields[0].value, operator: 'equals', value: '' }]);
  };
  
  const handleRemoveFilter = (index) => {
    const newFilters = [...filters];
    newFilters.splice(index, 1);
    setFilters(newFilters);
  };
  
  const handleFilterChange = (index, field, value) => {
    const newFilters = [...filters];
    newFilters[index] = { ...newFilters[index], [field]: value };
    setFilters(newFilters);
  };
  
  const handleGeneratePreview = async () => {
    if (selectedFields.length === 0) {
      setStatus({
        type: 'error',
        message: 'Please select at least one field to include in the report.'
      });
      return;
    }
    
    setLoading(true);
    try {
      // Make API call to generate preview data
      const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/events/${eventId}/reports/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          reportType: reportType,
          fields: selectedFields,
          filters: filters,
          groupBy: groupBy,
          sortBy: sortBy,
          dateRange: dateRange
        })
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setPreviewData(result.data || []);
        setStatus({
          type: 'success',
          message: 'Preview generated successfully.'
        });
      } else {
        throw new Error(result.message || 'Failed to generate preview');
      }
    } catch (error) {
      console.error('Error generating preview:', error);
      setStatus({
        type: 'error',
        message: 'Failed to generate preview. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleSaveReport = async () => {
    if (!reportName) {
      setStatus({
        type: 'error',
        message: 'Please enter a name for your report.'
      });
      return;
    }
    
    if (selectedFields.length === 0) {
      setStatus({
        type: 'error',
        message: 'Please select at least one field to include in the report.'
      });
      return;
    }
    
    setSaving(true);
    try {
      // Mock API call to save report
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setStatus({
        type: 'success',
        message: 'Report saved successfully!'
      });
      
      // Redirect to reports page after a brief delay
      setTimeout(() => {
        navigate('/reports');
      }, 1500);
    } catch (error) {
      console.error('Error saving report:', error);
      setStatus({
        type: 'error',
        message: 'Failed to save report. Please try again.'
      });
    } finally {
      setSaving(false);
    }
  };
  
  const renderFieldSelector = () => {
    const fields = dataSourceFields[selectedDataSource] || [];
    
    return (
      <div className="p-4 border rounded-md bg-gray-50">
        <h3 className="text-md font-medium mb-3">Select Fields to Include</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {fields.map(field => (
            <div key={field.value} className="flex items-center">
              <Checkbox
                id={`field-${field.value}`}
                checked={selectedFields.includes(field.value)}
                onChange={() => handleFieldToggle(field.value)}
              />
              <label 
                htmlFor={`field-${field.value}`} 
                className="ml-2 text-sm cursor-pointer"
              >
                {field.label}
              </label>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  const renderFilterBuilder = () => {
    const fields = dataSourceFields[selectedDataSource] || [];
    
    return (
      <div className="mt-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-md font-medium">Filters</h3>
          <Button 
            size="sm" 
            onClick={handleAddFilter}
          >
            Add Filter
          </Button>
        </div>
        
        {filters.map((filter, index) => (
          <div key={index} className="mb-4 p-4 border rounded-md bg-gray-50">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium">Filter {index + 1}</h4>
              {filters.length > 1 && (
                <button
                  onClick={() => handleRemoveFilter(index)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Remove
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Field
                </label>
                <Select
                  value={filter.field}
                  onChange={(e) => handleFilterChange(index, 'field', e.target.value)}
                  options={fields.map(field => ({ value: field.value, label: field.label }))}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Operator
                </label>
                <Select
                  value={filter.operator}
                  onChange={(e) => handleFilterChange(index, 'operator', e.target.value)}
                  options={filterOperators}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Value
                </label>
                <Input
                  type="text"
                  value={filter.value}
                  onChange={(e) => handleFilterChange(index, 'value', e.target.value)}
                  disabled={['isNull', 'isNotNull'].includes(filter.operator)}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  const renderGroupingOptions = () => {
    const fields = dataSourceFields[selectedDataSource] || [];
    
    return (
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-md font-medium mb-3">Group By</h3>
          <Select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value)}
            options={[
              { value: '', label: 'No Grouping' },
              ...fields.map(field => ({ value: field.value, label: field.label }))
            ]}
            className="w-full"
          />
        </div>
        
        <div>
          <h3 className="text-md font-medium mb-3">Sort By</h3>
          <div className="grid grid-cols-2 gap-2">
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              options={[
                { value: '', label: 'No Sorting' },
                ...fields.map(field => ({ value: field.value, label: field.label }))
              ]}
              className="w-full"
            />
            
            <Select
              value={sortDirection}
              onChange={(e) => setSortDirection(e.target.value)}
              options={[
                { value: 'asc', label: 'Ascending' },
                { value: 'desc', label: 'Descending' }
              ]}
              disabled={!sortBy}
              className="w-full"
            />
          </div>
        </div>
      </div>
    );
  };
  
  const renderPreview = () => {
    if (!previewData || previewData.length === 0) {
      return (
        <div className="text-center py-10 text-gray-500">
          <p>No preview data available.</p>
          <p className="text-sm mt-2">Configure your report and click "Generate Preview" to see sample data.</p>
        </div>
      );
    }
    
    return (
      <div className="overflow-x-auto mt-2">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {selectedFields.map(field => {
                const fieldLabel = dataSourceFields[selectedDataSource].find(f => f.value === field)?.label || field;
                return (
                  <th 
                    key={field}
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {fieldLabel}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {previewData.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {selectedFields.map(field => (
                  <td key={field} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {row[field]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Custom Report Builder</h2>
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline"
            onClick={handleGeneratePreview}
            disabled={loading}
          >
            {loading ? <Spinner size="sm" className="mr-2" /> : null}
            Generate Preview
          </Button>
          <Button 
            onClick={handleSaveReport}
            disabled={saving}
          >
            {saving ? <Spinner size="sm" className="mr-2" /> : null}
            Save Report
          </Button>
        </div>
      </div>
      
      {status && (
        <Alert 
          type={status.type} 
          message={status.message} 
          className="mb-6"
          onClose={() => setStatus(null)}
        />
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-medium mb-6">Report Definition</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Report Name
                  </label>
                  <Input
                    type="text"
                    value={reportName}
                    onChange={(e) => setReportName(e.target.value)}
                    placeholder="Enter report name"
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <Input
                    type="textarea"
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    placeholder="Enter report description"
                    className="w-full"
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data Source
                  </label>
                  <Select
                    value={selectedDataSource}
                    onChange={(e) => setSelectedDataSource(e.target.value)}
                    options={dataSources}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>
        
        <div className="lg:col-span-2">
          <Card>
            <Tabs
              tabs={[
                { id: 'fields', label: 'Fields & Filters' },
                { id: 'preview', label: 'Preview' }
              ]}
              activeTab="fields"
            />
            
            <div className="p-6">
              <div>
                {renderFieldSelector()}
                {renderFilterBuilder()}
                {renderGroupingOptions()}
              </div>
            </div>
          </Card>
          
          <Card className="mt-6">
            <div className="p-6">
              <h3 className="text-lg font-medium mb-4">Preview</h3>
              {renderPreview()}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ReportBuilder; 