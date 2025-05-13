import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FaUsers, FaUtensils, FaBox, FaCertificate, FaEdit, 
  FaTrash, FaPlus, FaSearch, FaFilter, FaDownload 
} from 'react-icons/fa';
import { 
  Button, Spinner, Modal, Badge, Alert, Card, 
  Input, Select
} from '../../../components/common';
import eventService from '../../../services/eventService';
import categoryService from '../../../services/categoryService';
import registrationService from '../../../services/registrationService';
import resourceService from '../../../services/resourceService';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import CategoryResourcesConfig from './CategoryResourcesConfig';
import AddCategoryModal from './AddCategoryModal';
import { useAuth } from '../../../contexts/AuthContext';

const CategoriesTab = ({ event, debug = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const eventId = id || (event && event._id);
  const { isAuthenticated, loading: authLoading } = useAuth();

  // Main state
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalCategories: 0,
    totalRegistrants: 0,
    categoriesWithFood: 0,
    categoriesWithKits: 0,
    categoriesWithCertificates: 0
  });

  // UI state
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('name-asc');
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleteInProgress, setDeleteInProgress] = useState(false);

  // Resource settings
  const [foodSettings, setFoodSettings] = useState(null);
  const [kitSettings, setKitSettings] = useState(null);
  const [certificateSettings, setCertificateSettings] = useState(null);

  // Force re-render when switching tabs
  const [renderKey, setRenderKey] = useState(Date.now());
  
  // Reset state and force re-render when eventId changes
  useEffect(() => {
    console.log('CategoriesTab - EventId changed, resetting state:', eventId);
    setCategories([]);
    setStats({
      totalCategories: 0,
      totalRegistrants: 0,
      categoriesWithFood: 0,
      categoriesWithKits: 0,
      categoriesWithCertificates: 0
    });
    setLoading(true);
    setRenderKey(Date.now());
  }, [eventId]);

  // If debug mode is enabled, log key information
  useEffect(() => {
    if (debug) {
      console.log('CategoriesTab DEBUG MODE:');
      console.log('- eventId:', eventId);
      console.log('- event:', event);
    }
  }, [debug, eventId, event]);

  // Load data on component mount or when event/id changes
  useEffect(() => {
    console.log('CategoriesTab - Loading data for eventId:', eventId, 'renderKey:', renderKey);
    
    // Only load if auth check is done, user is authenticated, and eventId exists
    if (eventId && !authLoading && isAuthenticated) {
      fetchCategoriesAndStats();
      fetchResourceSettings();
    } else if (eventId && !authLoading && !isAuthenticated) {
      setError('Authentication required to view categories.');
      setLoading(false);
    }
    
    // Return cleanup function
    return () => {
      console.log('CategoriesTab - Cleaning up');
    };
  }, [eventId, renderKey, authLoading, isAuthenticated]);

  // Fetch categories and calculate statistics
  const fetchCategoriesAndStats = async () => {
    if (!eventId) return;

    setLoading(true);
    setError(null);

    try {
      console.log('Fetching categories for event:', eventId);
      // Get categories
      const categoriesResponse = await categoryService.getEventCategories(eventId);
      console.log('Categories response:', categoriesResponse);
      
      // Get event statistics
      const statsResponse = await eventService.getEventStatistics(eventId);
      console.log('Statistics response RAW:', JSON.stringify(statsResponse));
      
      if (categoriesResponse && categoriesResponse.success) {
        // Process categories to ensure consistent format
        let processedCategories = categoriesResponse.data.map(category => ({
          ...category,
          permissions: {
            meals: category.permissions?.meals || false,
            kitItems: category.permissions?.kitItems || false,
            certificates: category.permissions?.certificates || false,
            abstractSubmission: category.permissions?.abstractSubmission || false
          },
          mealEntitlements: category.mealEntitlements || [],
          kitItemEntitlements: category.kitItemEntitlements || [],
          certificateEntitlements: category.certificateEntitlements || [],
          registrantCount: 0 // Initialize with 0
        }));
        
        let countedCategories = [...processedCategories];
        
        // Use the statistics data as the primary source now
        if (statsResponse && statsResponse.success && statsResponse.data) {
          console.log('Using statistics data for counts:', statsResponse.data);
          
          // Try different potential formats for categories
          const categoryStats = statsResponse.data.categories || 
                               statsResponse.data.registrationsByCategory || 
                               (statsResponse.data.registrations && statsResponse.data.registrations.byCategory) || 
                               [];
          
          // Convert to array if it's an object
          let categoryArray = Array.isArray(categoryStats) ? categoryStats : [];
          
          // If it's an object mapping category IDs to counts
          if (!Array.isArray(categoryStats) && typeof categoryStats === 'object') {
            categoryArray = Object.entries(categoryStats).map(([key, value]) => {
              // Handle both { categoryId: count } and { categoryId: { count, ... } } formats
              return {
                id: key,
                categoryId: key,
                count: typeof value === 'object' ? value.count || 0 : value
              };
            });
          }
          
          console.log('Processed category stats array:', categoryArray);
          
          if (categoryArray.length > 0) {
            countedCategories = processedCategories.map(category => {
              // Try to find the category in the stats using different potential ID fields
              const statsItem = categoryArray.find(item => {
                return (
                  (item.id && (item.id === category._id || item.id === category.id)) ||
                  (item.categoryId && (item.categoryId === category._id || item.categoryId === category.id)) ||
                  (item._id && (item._id === category._id || item._id === category.id)) ||
                  (item.name && item.name === category.name) // Fallback to name matching
                );
              });
              
              const count = statsItem ? (statsItem.count || 0) : 0;
              console.log(`Category ${category.name} (${category._id}) has ${count} registrants from statistics`);
              
              return {
            ...category,
                registrantCount: count
              };
            });
          }
        }
        
        // TEMP: Disable fallback mechanisms to isolate count issue
        /*
        // Third try: If there are still categories with 0 count, try getting each one individually
        let needsIndividualCounts = countedCategories.some(cat => cat.registrantCount === 0);
        
        if (needsIndividualCounts) {
          console.log('Some categories still have 0 count, fetching individual counts [DISABLED]');
          // The loop for individual fetches is commented out
        }
        */
        
        /*
        // Fourth try: Use the sidebar data shown in your screenshot as last resort [DISABLED]
        if (countedCategories.some(cat => cat.registrantCount === 0)) {
          console.log('Some categories still have 0 count after all methods, trying to match with sidebar data [DISABLED]');
          // The sidebar matching logic is commented out
        }
        */

        /*
        // Debug placeholder counts [DISABLED]
        if (debug && countedCategories.some(cat => cat.registrantCount === 0)) {
           console.log('DEBUG MODE: Adding placeholder registration counts for testing [DISABLED]');
        }
        */
        
        console.log('Final processed categories with counts (using ONLY stats data):', countedCategories);
        setCategories(countedCategories);
        
        // Calculate statistics
        const categoryStats = {
          totalCategories: countedCategories.length,
          totalRegistrants: countedCategories.reduce((sum, cat) => sum + (cat.registrantCount || 0), 0),
          categoriesWithFood: countedCategories.filter(c => c.permissions?.meals).length,
          categoriesWithKits: countedCategories.filter(c => c.permissions?.kitItems).length,
          categoriesWithCertificates: countedCategories.filter(c => c.permissions?.certificates).length
        };
        
        console.log('Calculated category stats:', categoryStats);
        setStats(categoryStats);
      } else {
        throw new Error(categoriesResponse?.message || 'Failed to load categories');
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError(error.message || 'Failed to load categories');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch resource settings
  const fetchResourceSettings = async () => {
    if (!eventId) return;

    try {
      // Food settings
      try {
        const foodResponse = await resourceService.getFoodSettings(eventId);
        if (foodResponse && foodResponse.success) {
          setFoodSettings(foodResponse.data);
        }
      } catch (error) {
        console.error('Error fetching food settings:', error);
      }

      // Kit settings
      try {
        const kitResponse = await resourceService.getKitSettings(eventId);
        if (kitResponse && kitResponse.success) {
          setKitSettings(kitResponse.data);
        }
      } catch (error) {
        console.error('Error fetching kit settings:', error);
      }

      // Certificate settings
      try {
        const certResponse = await resourceService.getCertificateSettings(eventId);
        if (certResponse && certResponse.success) {
          setCertificateSettings(certResponse.data);
        }
      } catch (error) {
        console.error('Error fetching certificate settings:', error);
      }
    } catch (error) {
      console.error('Error fetching resource settings:', error);
    }
  };

  // Filter and sort categories
  const filteredCategories = useMemo(() => {
    // First filter by search query
    let result = categories;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = categories.filter(category => 
        category.name.toLowerCase().includes(query) || 
        (category.description && category.description.toLowerCase().includes(query))
      );
    }
    
    // Then sort by selected option
    switch (sortOption) {
      case 'name-asc':
        return [...result].sort((a, b) => a.name.localeCompare(b.name));
      case 'name-desc':
        return [...result].sort((a, b) => b.name.localeCompare(a.name));
      case 'registrants-asc':
        return [...result].sort((a, b) => (a.registrantCount || 0) - (b.registrantCount || 0));
      case 'registrants-desc':
        return [...result].sort((a, b) => (b.registrantCount || 0) - (a.registrantCount || 0));
      default:
        return result;
    }
  }, [categories, searchQuery, sortOption]);

  // Category card actions
  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    setShowConfigModal(true);
  };

  const handleConfigClick = (category, e) => {
    e.stopPropagation();
    setSelectedCategory(category);
    setShowConfigModal(true);
  };

  const handleDeleteClick = (category, e) => {
    e.stopPropagation();
    setSelectedCategory(category);
    setShowDeleteModal(true);
  };

  const handleAddCategory = () => {
    console.log("Add Category button clicked, opening modal.");
    setIsAddModalOpen(true);
  };

  const handleCategoryCreated = (newCategoryData) => {
    console.log("New category created, preparing to update list:", newCategoryData);
    // Ensure the new category object includes registrantCount: 0
    const categoryWithCount = {
      ...newCategoryData,
      permissions: { // Ensure permissions exist, copying structure from fetch
          meals: newCategoryData.permissions?.meals || false,
          kitItems: newCategoryData.permissions?.kitItems || false,
          certificates: newCategoryData.permissions?.certificates || false,
          abstractSubmission: newCategoryData.permissions?.abstractSubmission || false
      },
      registrantCount: 0 // Explicitly set count to 0
    };
    // Add the *prepared* new category to the beginning of the list
    setCategories(prev => [categoryWithCount, ...prev]);
    
    // Update statistics (only total count for now)
    setStats(prev => ({ 
      ...prev,
      totalCategories: prev.totalCategories + 1
      // Note: totalRegistrants remains unchanged as count is 0
    }));
    
    // Optional: Consider a full refresh if detailed stats need immediate update
    // fetchCategoriesAndStats(); 
  };

  const handleSaveConfig = async (updatedPermissions) => {
    if (!selectedCategory) return;

    try {
      const response = await categoryService.updateCategoryPermissions(
        eventId,
        selectedCategory._id,
        updatedPermissions
      );

      if (response && response.success) {
        // Update local state
        setCategories(categories.map(c =>
          c._id === selectedCategory._id
            ? { ...c, permissions: updatedPermissions }
            : c
        ));
        setShowConfigModal(false);
        
        // Refresh data to get latest counts
        fetchCategoriesAndStats();
      } else {
        throw new Error(response?.message || 'Failed to update category permissions');
      }
    } catch (error) {
      console.error('Error updating permissions:', error);
      alert('Failed to save permissions');
    }
  };

  const handleDeleteCategory = async () => {
    if (deleteConfirmation !== 'DELETE') return;

    setDeleteInProgress(true);

    try {
      const response = await categoryService.deleteCategory(eventId, selectedCategory._id);

      if (response && response.success) {
        // Remove category from state
        setCategories(categories.filter(c => c._id !== selectedCategory._id));
        setShowDeleteModal(false);
        setDeleteConfirmation('');
        
        // Update statistics
        setStats(prev => ({
          ...prev,
          totalCategories: prev.totalCategories - 1,
          totalRegistrants: prev.totalRegistrants - (selectedCategory.registrantCount || 0),
          categoriesWithFood: prev.categoriesWithFood - (selectedCategory.permissions?.meals ? 1 : 0),
          categoriesWithKits: prev.categoriesWithKits - (selectedCategory.permissions?.kitItems ? 1 : 0),
          categoriesWithCertificates: prev.categoriesWithCertificates - (selectedCategory.permissions?.certificates ? 1 : 0)
        }));
      } else {
        throw new Error(response?.message || 'Failed to delete category');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      setError('Failed to delete category. Please try again.');
    } finally {
      setDeleteInProgress(false);
    }
  };

  const handleExportRegistrations = async (category, e) => {
    if (!category) return;
    e.stopPropagation();

    // Add loading state maybe?
    // setLoadingExport(true);
    
    try {
      const response = await registrationService.exportCategoryRegistrations(
        eventId,
        category._id
      );

      // Check if the response looks like a successful blob response
      if (response && response.status === 200 && response.data instanceof Blob) {
        // 1. Extract filename
        let filename = `registrations_${category.name.replace(/\s+/g, '_')}_${eventId}.xlsx`; // Default filename
        const disposition = response.headers['content-disposition'];
        if (disposition) {
          const filenameRegex = /filename[^;=\n]*=((['"])(.*?)\2|([^;\n]*))/;
          const matches = filenameRegex.exec(disposition);
          if (matches != null && matches[3]) {
            filename = matches[3].replace(/['"]/g, '');
          } else if (matches != null && matches[4]) {
            // Handle filename without quotes
            filename = matches[4];
          }
        }

        // 2. Create Blob URL
        const url = window.URL.createObjectURL(response.data);

        // 3. Simulate Link Click
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();

        // 4. Cleanup
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

      } else {
        // Handle potential errors returned as JSON (e.g., validation errors from backend)
        let errorMessage = 'Failed to export registrations.';
        if (response && response.data && typeof response.data === 'object' && !(response.data instanceof Blob)) {
           // If we got JSON, try to get a message
           errorMessage = response.data.message || errorMessage;
        } else if (response && response.status) {
            errorMessage = `Failed to export registrations. Status: ${response.status}`;
        } 
        console.error('Export failed:', response); // Log the actual response
        alert(errorMessage);
      }
    } catch (error) {
      console.error('Error exporting registrations:', error);
      alert(`Error exporting registrations: ${error.message || 'Unknown error'}`);
    }
    // finally {
    //   setLoadingExport(false);
    // }
  };

  // Helper functions for resource badges
  const isResourceAllowed = (category, resourceType) => {
    if (!category.permissions) return false;

    switch (resourceType) {
      case 'food':
        return category.permissions.meals || false;
      case 'kit':
        return category.permissions.kitItems || false;
      case 'certificate':
        return category.permissions.certificates || false;
      default:
        return false;
    }
  };

  const getResourceStats = (category, resourceType) => {
    if (!category.permissions) return 0;

    switch (resourceType) {
      case 'food':
        return Array.isArray(category.mealEntitlements) ? 
          category.mealEntitlements.filter(item => item.entitled).length : 0;
      case 'kit':
        return Array.isArray(category.kitItemEntitlements) ? 
          category.kitItemEntitlements.filter(item => item.entitled).length : 0;
      case 'certificate':
        return Array.isArray(category.certificateEntitlements) ? 
          category.certificateEntitlements.filter(item => item.entitled).length : 0;
      default:
        return 0;
    }
  };

  // Render the resource badge
  const renderResourceBadge = (category, type, icon) => {
    const isAllowed = isResourceAllowed(category, type);
    const count = getResourceStats(category, type);

    return (
      <div className="flex flex-col items-center">
        <Badge
          variant={isAllowed ? (count > 0 ? "success" : "primary") : "default"}
          size="md"
          className="mb-1"
        >
          {icon}
          <span className="ml-1">{count}</span>
        </Badge>
        <span className="text-xs text-gray-500">
          {isAllowed ? (count > 0 ? "Configured" : "Enabled") : "Disabled"}
        </span>
      </div>
    );
  };

  // Render chart colors
  const CHART_COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B'];

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
        <span className="ml-2">Loading categories...</span>
      </div>
    );
  }

  // Log categories for debugging
  console.log('Rendering categories:', categories);

  return (
    <div className="space-y-6">
      {error && (
        <Alert type="error" message={error} onClose={() => setError(null)} />
      )}

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-4 bg-white rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-700">Total Categories</h3>
          <div className="mt-2 flex items-baseline">
            <span className="text-3xl font-bold text-indigo-600">{stats.totalCategories}</span>
            <span className="ml-2 text-sm text-gray-500">types</span>
          </div>
        </Card>
        
        <Card className="p-4 bg-white rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-700">Total Registrants</h3>
          <div className="mt-2 flex items-baseline">
            <span className="text-3xl font-bold text-green-600">{stats.totalRegistrants}</span>
            <span className="ml-2 text-sm text-gray-500">people</span>
          </div>
        </Card>
        
        <Card className="p-4 bg-white rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-700">With Food Access</h3>
          <div className="mt-2 flex items-baseline">
            <span className="text-3xl font-bold text-amber-600">{stats.categoriesWithFood}</span>
            <span className="ml-2 text-sm text-gray-500">categories</span>
          </div>
        </Card>
        
        <Card className="p-4 bg-white rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-700">With Kit Access</h3>
          <div className="mt-2 flex items-baseline">
            <span className="text-3xl font-bold text-blue-600">{stats.categoriesWithKits}</span>
            <span className="ml-2 text-sm text-gray-500">categories</span>
          </div>
        </Card>
        
        <Card className="p-4 bg-white rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-700">With Certificates</h3>
          <div className="mt-2 flex items-baseline">
            <span className="text-3xl font-bold text-purple-600">{stats.categoriesWithCertificates}</span>
            <span className="ml-2 text-sm text-gray-500">categories</span>
          </div>
        </Card>
      </div>

      {/* Chart and actions row */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Distribution chart */}
        <Card className="p-4 bg-white rounded-lg shadow-sm lg:w-1/3">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Registrant Distribution</h3>
          {categories.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={categories.map((cat, index) => ({
                    name: cat.name,
                    value: cat.registrantCount || 0,
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categories.map((cat, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value} registrants`, name]} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-500">
              No data to display
            </div>
          )}
        </Card>

        {/* Search and filters */}
        <Card className="p-4 bg-white rounded-lg shadow-sm lg:w-2/3">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="md:w-1/2">
              <h3 className="text-lg font-medium text-gray-700 mb-4">Search & Filter</h3>
              <div className="relative">
                <Input
                  id="category-search"
                  type="text"
                  placeholder="Search by name or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                  icon={<FaSearch className="text-gray-400" />}
                />
              </div>
        </div>
            
            <div className="md:w-1/2">
              <h3 className="text-lg font-medium text-gray-700 mb-4">Sort & Actions</h3>
              <div className="flex gap-3">
                <Select 
                  options={[
                    { value: 'name-asc', label: 'Name (A-Z)' },
                    { value: 'name-desc', label: 'Name (Z-A)' },
                    { value: 'registrants-asc', label: 'Registrants (Low to High)' },
                    { value: 'registrants-desc', label: 'Registrants (High to Low)' }
                  ]}
                  value={sortOption}
                  onChange={(value) => setSortOption(value)}
                  placeholder="Sort by..."
                  className="flex-1"
                />
                
        <Button 
          variant="primary"
          onClick={handleAddCategory}
          leftIcon={<FaPlus />}
        >
                  Add Category
        </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Categories grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCategories.length === 0 ? (
          <div className="col-span-full">
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <h3 className="text-lg font-medium text-gray-700">
                {searchQuery ? "No categories found" : "No categories yet"}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchQuery ? "Try a different search term" : "Create your first category to get started"}
              </p>
            <Button 
              variant="primary"
              onClick={handleAddCategory}
              leftIcon={<FaPlus />}
            >
              Add First Category
            </Button>
            </div>
          </div>
        ) : (
          filteredCategories.map(category => (
            <motion.div 
              key={category._id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer"
              onClick={() => handleCategoryClick(category)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{ backgroundColor: category.color || '#9CA3AF' }}
                  ></div>
                  <h3 className="text-lg font-medium text-gray-900">{category.name}</h3>
                </div>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                  {category.description || 'No description'}
                </p>
              </div>
              
              <div className="p-4">
                <div className="flex justify-center mb-4">
                  <div className="flex space-x-8">
                    <div>
                      {renderResourceBadge(
                        category, 
                        'food', 
                        <FaUtensils className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      {renderResourceBadge(
                        category, 
                        'kit', 
                        <FaBox className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      {renderResourceBadge(
                        category, 
                        'certificate', 
                        <FaCertificate className="h-4 w-4" />
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between mt-4">
                  <span className="inline-flex items-center text-sm">
                    <FaUsers className="mr-1 h-4 w-4 text-gray-500" />
                    <span className="font-medium mr-1">{category.registrantCount !== undefined ? category.registrantCount : 0}</span>
                    <span className="text-gray-500">Registrants</span>
                  </span>
                  {debug && (
                    <span className="text-xs text-gray-400">ID: {category._id?.substring(0, 6)}...</span>
                  )}
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 flex justify-between">
                <div className="flex gap-2">
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={(e) => handleDeleteClick(category, e)}
                  leftIcon={<FaTrash className="h-4 w-4 text-red-500" />}
                >
                  Delete
                </Button>
                  
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={(e) => handleExportRegistrations(category, e)}
                    leftIcon={<FaDownload className="h-4 w-4 text-blue-500" />}
                  >
                    Export
                  </Button>
                </div>
                
                <Button 
                  variant="primary"
                  size="sm"
                  onClick={(e) => handleConfigClick(category, e)}
                  leftIcon={<FaEdit className="h-4 w-4" />}
                >
                  Configure
                </Button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Category Resources Configuration Modal */}
      <CategoryResourcesConfig
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        category={selectedCategory}
        eventId={eventId}
        onSave={handleSaveConfig}
      />

      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteConfirmation('');
        }}
        title="Delete Category"
      >
        <div className="p-4">
          <p className="mb-4 text-red-600">
            Deleting the <strong>{selectedCategory?.name}</strong> category will remove all associated permissions. This action cannot be undone.
          </p>
          
          <div className="mb-4">
            <label htmlFor="confirmDelete" className="block text-sm font-medium text-gray-700">
              Type DELETE to confirm
            </label>
            <input
              type="text"
              id="confirmDelete"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false);
                setDeleteConfirmation('');
              }}
              disabled={deleteInProgress}
            >
              Cancel
            </Button>
            
            <Button
              variant="danger"
              onClick={handleDeleteCategory}
              disabled={deleteConfirmation !== 'DELETE' || deleteInProgress}
              loading={deleteInProgress}
            >
              Delete Category
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add New Category Modal */}
      <AddCategoryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        eventId={eventId}
        onCategoryCreated={handleCategoryCreated} 
      />
    </div>
  );
};

export default CategoriesTab; 