import React, { useState, useEffect } from 'react';
import { Modal, Button, Tabs, Spinner, Alert, Switch } from '../../../components/common';
import { FaUtensils, FaBox, FaCertificate, FaUsers } from 'react-icons/fa';
import resourceService from '../../../services/resourceService';
import categoryService from '../../../services/categoryService';
import registrationService from '../../../services/registrationService';

// Utility: Check for valid MongoDB ObjectId (24 hex chars)
function isValidObjectId(id) {
  return typeof id === 'string' && /^[a-fA-F0-9]{24}$/.test(id);
}

const CategoryResourcesConfig = ({ isOpen, onClose, category, eventId, onSave }) => {
  const [activeTab, setActiveTab] = useState('food');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Resource settings states
  const [foodItems, setFoodItems] = useState([]);
  const [kitItems, setKitItems] = useState([]);
  const [certificateTypes, setCertificateTypes] = useState([]);
  const [loadingFood, setLoadingFood] = useState(false);
  const [loadingKit, setLoadingKit] = useState(false);
  const [loadingCertificate, setLoadingCertificate] = useState(false);
  
  // Selected items
  const [selectedFoodItems, setSelectedFoodItems] = useState([]);
  const [selectedKitItems, setSelectedKitItems] = useState([]);
  const [selectedCertificateTypes, setSelectedCertificateTypes] = useState([]);
  
  // Entitlement objects
  const [mealEntitlements, setMealEntitlements] = useState([]);
  const [kitItemEntitlements, setKitItemEntitlements] = useState([]);
  const [certificateEntitlements, setCertificateEntitlements] = useState([]);

  // Permissions state
  const [permissions, setPermissions] = useState({
    meals: false,
    kitItems: false,
    certificates: false,
    abstractSubmission: false
  });

  // Registrants
  const [registrants, setRegistrants] = useState([]);
  const [loadingRegistrants, setLoadingRegistrants] = useState(false);
  
  // First, add search state for registrants
  const [searchRegistrant, setSearchRegistrant] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // Toggle permissions
  const toggleFoodPermission = () => {
    setPermissions(prev => ({
      ...prev,
      meals: !prev.meals
    }));
  };

  const toggleKitPermission = () => {
    setPermissions(prev => ({
      ...prev,
      kitItems: !prev.kitItems
    }));
  };

  const toggleCertificatePermission = () => {
    setPermissions(prev => ({
      ...prev,
      certificates: !prev.certificates
    }));
  };

  const toggleAbstractPermission = () => {
    setPermissions(prev => ({
      ...prev,
      abstractSubmission: !prev.abstractSubmission
    }));
  };

  // Toggle food item selection
  const toggleFoodItem = (foodId) => {
    const isSelected = selectedFoodItems.includes(foodId);
    const updatedFoodItems = isSelected
      ? selectedFoodItems.filter((id) => id !== foodId)
      : [...selectedFoodItems, foodId];
    setSelectedFoodItems(updatedFoodItems);

    // Update permissions to ensure the UI shows it as allowed
    if (updatedFoodItems.length > 0 && !permissions.meals) {
      setPermissions(prev => ({
        ...prev,
        meals: true
      }));
    }

    // Map foodItems to format expected by mealEntitlements (use ObjectId, not string keys)
    const meals = foodItems.map((food) => ({
      mealId: food._id, // FIXED: use ObjectId
      entitled: updatedFoodItems.includes(food._id)
    }));
    setMealEntitlements(meals);
    console.log('[CategoryResourcesConfig] Updated mealEntitlements:', meals);
  };

  // Toggle kit item selection
  const toggleKitItem = (kitId) => {
    const isSelected = selectedKitItems.includes(kitId);
    const updatedKitItems = isSelected
      ? selectedKitItems.filter((id) => id !== kitId)
      : [...selectedKitItems, kitId];
    setSelectedKitItems(updatedKitItems);

    // Update permissions to ensure the UI shows it as allowed
    if (updatedKitItems.length > 0 && !permissions.kitItems) {
      setPermissions(prev => ({
        ...prev,
        kitItems: true
      }));
    }

    // Map kitItems to format expected by kitItemEntitlements (use itemId, not kitItemId)
    const kits = kitItems.map((kit) => ({
      itemId: kit._id, // FIXED: use itemId
      entitled: updatedKitItems.includes(kit._id)
    }));
    setKitItemEntitlements(kits);
    console.log('[CategoryResourcesConfig] Updated kitItemEntitlements:', kits);
  };

  // Toggle certificate type selection
  const toggleCertificateType = (certificateId) => {
    const isSelected = selectedCertificateTypes.includes(certificateId);
    const updatedCertificateTypes = isSelected
      ? selectedCertificateTypes.filter((id) => id !== certificateId)
      : [...selectedCertificateTypes, certificateId];
    setSelectedCertificateTypes(updatedCertificateTypes);

    // Update permissions to ensure the UI shows it as allowed
    if (updatedCertificateTypes.length > 0 && !permissions.certificates) {
      setPermissions(prev => ({
        ...prev,
        certificates: true
      }));
    }

    // Map certificateTypes to format expected by certificateEntitlements
    const certificates = certificateTypes.map((cert) => ({
      certificateId: cert._id,
      entitled: updatedCertificateTypes.includes(cert._id)
    }));
    setCertificateEntitlements(certificates);
  };

  // Initialize component
  useEffect(() => {
    if (category && eventId) {
      // Initialize permissions from category
      setPermissions({
        meals: category.permissions?.meals || false,
        kitItems: category.permissions?.kitItems || false,
        certificates: category.permissions?.certificates || false,
        abstractSubmission: category.permissions?.abstractSubmission || false,
      });

      // Initialize meal entitlements
      if (category.mealEntitlements && Array.isArray(category.mealEntitlements)) {
        const entitledMeals = category.mealEntitlements
          .filter(meal => meal.entitled)
          .map(meal => meal.mealId);
        setSelectedFoodItems(entitledMeals);
        setMealEntitlements(category.mealEntitlements);
      }

      // Initialize kit entitlements
      if (category.kitItemEntitlements && Array.isArray(category.kitItemEntitlements)) {
        const entitledKits = category.kitItemEntitlements
          .filter(kit => kit.entitled)
          .map(kit => kit.kitItemId);
        setSelectedKitItems(entitledKits);
        setKitItemEntitlements(category.kitItemEntitlements);
      }

      // Initialize certificate entitlements
      if (category.certificateEntitlements && Array.isArray(category.certificateEntitlements)) {
        const entitledCerts = category.certificateEntitlements
          .filter(cert => cert.entitled)
          .map(cert => cert.certificateId);
        setSelectedCertificateTypes(entitledCerts);
        setCertificateEntitlements(category.certificateEntitlements);
      }

      // Load resource settings
      fetchResources();
    }
  }, [category, eventId]);

  // Add the useEffect hook to reset pagination when search or tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchRegistrant]);

  // Fetch all resources
  const fetchResources = async () => {
    setLoading(true);
    setError(null);
    
    console.log('Fetching all resources for category:', category?._id, 'in event:', eventId);
    
    try {
      // Fetch all resource types in parallel with individual error handling
      const foodPromise = fetchFoodSettings().catch(err => {
        console.error('Error fetching food settings:', err);
        return null;
      });
      
      const kitPromise = fetchKitSettings().catch(err => {
        console.error('Error fetching kit settings:', err);
        return null;
      });
      
      const certPromise = fetchCertificateSettings().catch(err => {
        console.error('Error fetching certificate settings:', err);
        return null;
      });
      
      const registrantsPromise = fetchRegistrants().catch(err => {
        console.error('Error fetching registrants:', err);
        return null;
      });
      
      await Promise.all([foodPromise, kitPromise, certPromise, registrantsPromise]);
      console.log('All resources fetched successfully');
    } catch (err) {
      console.error('Error loading resource settings:', err);
      setError('Failed to load resource settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Prepare data for saving
  const handleSave = async () => {
    if (!category) {
      console.error('Missing category');
      setError('Missing required data');
      return;
    }
    setSaving(true);
    setSuccess(null);
    setError(null);
    try {
      console.log('[CategoryResourcesConfig] Saving category entitlements:', {
        permissions,
        mealEntitlements,
        kitItemEntitlements,
        certificateEntitlements
      });

      // Filter out invalid entitlements before sending to backend
      const filteredMealEntitlements = (mealEntitlements || []).filter(e => e.mealId && isValidObjectId(e.mealId));
      const filteredKitItemEntitlements = (kitItemEntitlements || []).filter(e => e.itemId && isValidObjectId(e.itemId));
      const filteredCertificateEntitlements = (certificateEntitlements || []).filter(e => e.certificateId && isValidObjectId(e.certificateId));

      if (filteredMealEntitlements.length !== (mealEntitlements || []).length) {
        console.warn('[handleSave] Filtered out invalid mealEntitlements:', mealEntitlements);
      }
      if (filteredKitItemEntitlements.length !== (kitItemEntitlements || []).length) {
        console.warn('[handleSave] Filtered out invalid kitItemEntitlements:', kitItemEntitlements);
      }
      if (filteredCertificateEntitlements.length !== (certificateEntitlements || []).length) {
        console.warn('[handleSave] Filtered out invalid certificateEntitlements:', certificateEntitlements);
      }

      const result = await categoryService.updateCategoryPermissions(category._id, null, {
        permissions: permissions,
        mealEntitlements: filteredMealEntitlements,
        kitItemEntitlements: filteredKitItemEntitlements,
        certificateEntitlements: filteredCertificateEntitlements
      });
      setSaving(false);
      setSuccess('Category permissions updated successfully');
      setTimeout(() => {
        setSuccess(null);
        onClose && onClose(result);
      }, 1500);
    } catch (err) {
      console.error('Error updating category permissions:', err);
      setError(err.message || 'Failed to update category permissions');
      setSaving(false);
    }
  };
  
  const fetchRegistrants = async () => {
    if (!category || !eventId) {
      console.error('Cannot fetch registrants: missing category or eventId');
      return;
    }
    
    setLoadingRegistrants(true);
    console.log(`Fetching registrants for category: ${category._id} in event: ${eventId}`);
    
    try {
      // Try direct API call with a large limit to get all registrants
      let registrantsData = [];
      
      try {
        const apiUrl = `${import.meta.env.VITE_API_URL || '/api'}/events/${eventId}/registrations?category=${category._id}&limit=1000&page=1`;
        console.log(`Trying direct API call to ${apiUrl}`);
        
        const apiResponse = await fetch(apiUrl, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (apiResponse.ok) {
          const apiData = await apiResponse.json();
          console.log('Direct API registrants response:', apiData);
          
          if (apiData.success && (apiData.data?.registrations || apiData.data)) {
            registrantsData = apiData.data?.registrations || apiData.data;
            console.log(`Got ${registrantsData.length} registrants from direct API call`);
          }
        }
      } catch (err) {
        console.warn('Direct API call failed, falling back to service:', err);
      }
      
      // If direct API call didn't work, try the service method
      if (registrantsData.length === 0) {
        const response = await registrationService.getCategoryRegistrations(eventId, category._id, 1000);
        console.log('Raw registrants response from service:', response);
        
      if (response && response.success) {
          registrantsData = response.data || [];
          console.log(`Received ${registrantsData.length} registrants from service call`);
        }
      }
      
      // If we still don't have data, try a secondary API endpoint with category in the path
      if (registrantsData.length === 0) {
        try {
          const secondaryUrl = `${import.meta.env.VITE_API_URL || '/api'}/events/${eventId}/categories/${category._id}/registrations?limit=1000`;
          console.log(`Trying secondary API endpoint: ${secondaryUrl}`);
          
          const secondaryResponse = await fetch(secondaryUrl, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (secondaryResponse.ok) {
            const secondaryData = await secondaryResponse.json();
            console.log('Secondary API response:', secondaryData);
            
            if (secondaryData.success) {
              registrantsData = secondaryData.data || [];
              console.log(`Got ${registrantsData.length} registrants from secondary API call`);
            }
          }
        } catch (err) {
          console.warn('Secondary API call failed:', err);
        }
      }
      
      // If we still don't have data, try to get all registrants and filter by category
      if (registrantsData.length === 0) {
        try {
          console.log('Fetching all registrants and filtering by category client-side');
          const allRegistrantsUrl = `${import.meta.env.VITE_API_URL || '/api'}/events/${eventId}/registrations?limit=10000`;
          
          const allRegistrantsResponse = await fetch(allRegistrantsUrl, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (allRegistrantsResponse.ok) {
            const allRegistrantsData = await allRegistrantsResponse.json();
            console.log(`Fetched ${allRegistrantsData.data?.length || 0} total registrants for filtering`);
            
            if (allRegistrantsData.success && (allRegistrantsData.data?.registrations || allRegistrantsData.data)) {
              const allRegs = allRegistrantsData.data?.registrations || allRegistrantsData.data || [];
              
              // Filter registrants by category
              registrantsData = allRegs.filter(reg => 
                reg.category === category._id || 
                reg.categoryId === category._id || 
                (reg.category && reg.category._id === category._id) ||
                (reg.categoryInfo && reg.categoryInfo._id === category._id) ||
                (reg.categoryName && reg.categoryName === category.name)
              );
              
              console.log(`Filtered down to ${registrantsData.length} registrants for category ${category.name}`);
            }
          }
        } catch (err) {
          console.warn('Failed to fetch all registrants for filtering:', err);
        }
      }
      
      // SAFETY: Ensure explicit filtering by category in case the API doesn't filter properly
      registrantsData = registrantsData.filter(reg => {
        // Try all possible ways the category might be referenced
        return (
          reg.category === category._id || 
          reg.categoryId === category._id || 
          (reg.category && reg.category._id === category._id) ||
          (reg.categoryInfo && reg.categoryInfo._id === category._id) ||
          (reg.categoryName && reg.categoryName === category.name)
        );
      });
      
      console.log(`Total registrants data after explicit filtering: ${registrantsData.length}`);
      
      // Process registrants to ensure all required fields
      const processedRegistrants = registrantsData.map(reg => ({
        _id: reg._id || reg.id,
        id: reg._id || reg.id,
        category: reg.category || reg.categoryId,
        categoryId: reg.categoryId || reg.category,
        registrationId: reg.registrationId || reg.regId || 'N/A',
        name: reg.name || (reg.firstName && reg.lastName ? `${reg.firstName} ${reg.lastName}` : 
              (reg.personalInfo?.firstName && reg.personalInfo?.lastName ? 
                `${reg.personalInfo.firstName} ${reg.personalInfo.lastName}` : 'Unknown')),
        firstName: reg.firstName || reg.personalInfo?.firstName,
        lastName: reg.lastName || reg.personalInfo?.lastName,
        email: reg.email || reg.personalInfo?.email || 'No email',
        mobile: reg.mobile || reg.phone || reg.personalInfo?.mobile || reg.personalInfo?.phone || 'N/A'
      }));
      
      console.log('Processed registrants:', processedRegistrants);
      setRegistrants(processedRegistrants);
      
      if (processedRegistrants.length === 0) {
        console.warn('No registrants found after all attempts');
      } else if (processedRegistrants.length < parseInt(category.registrantCount || 0)) {
        console.warn(`Only retrieved ${processedRegistrants.length} registrants, but category shows ${category.registrantCount}`);
      }
    } catch (err) {
      console.error('Error loading registrants:', err);
      setRegistrants([]);
    } finally {
      setLoadingRegistrants(false);
    }
  };
  
  const fetchFoodSettings = async () => {
    if (!eventId) {
      console.error('Cannot fetch food settings: missing eventId');
      return;
    }
    
    setLoadingFood(true);
    console.log(`Fetching food settings for event: ${eventId}`);
    
    try {
      // Skip direct API call and use resource service directly
      const response = await resourceService.getFoodSettings(eventId);
      console.log('Food settings response:', response);
      
      if (!response) {
        console.error('Food settings response is null or undefined');
        return;
      }
      
      // Process the response like in ResourcesTab
      if (response && (response.success || response.status === 'success')) {
        const data = response.data || {};
        console.log('Food settings raw data:', data);
        
        // Extract days and meals from the settings
        let foodSettingsData = data.settings || {};
        if (!foodSettingsData.days && data.days) {
          foodSettingsData.days = data.days;
        }
        
        const days = foodSettingsData.days || [];
        console.log('Food days found:', days.length);
        
        // Extract meal items from all days - include every meal for every day
        let allMeals = [];
        days.forEach(day => {
          if (day.meals && Array.isArray(day.meals)) {
            day.meals.forEach(meal => {
              // Generate a unique ID that includes the day to ensure uniqueness
              const mealId = meal._id || `meal-${day.date}-${meal.name}-${Math.random().toString(36).substring(7)}`;
              
              allMeals.push({
                _id: mealId,
                name: meal.name,
                description: `${meal.name} (${meal.startTime || '00:00'} - ${meal.endTime || '00:00'})`,
                day: day.date,
                startTime: meal.startTime,
                endTime: meal.endTime,
                // Store the original meal ID and day for reference
                originalId: meal._id,
                dayDate: day.date
              });
            });
          }
        });
        
        // If no meals found in days, try direct foodItems
        if (allMeals.length === 0) {
          if (data.settings?.foodItems && Array.isArray(data.settings.foodItems)) {
            allMeals = data.settings.foodItems.map(item => ({
              _id: item._id || item.id || String(Math.random()),
              name: typeof item.name === 'string' ? item.name : 'Unknown Item',
              description: typeof item.description === 'string' ? item.description : ''
            }));
          } else if (data.foodItems && Array.isArray(data.foodItems)) {
            allMeals = data.foodItems.map(item => ({
              _id: item._id || item.id || String(Math.random()),
              name: typeof item.name === 'string' ? item.name : 'Unknown Item',
              description: typeof item.description === 'string' ? item.description : ''
            }));
          }
        }
        
        console.log('All meals extracted:', allMeals);
        setFoodItems(allMeals);
        
        // Update meal entitlements
        if (allMeals.length > 0 && (!mealEntitlements || mealEntitlements.length === 0)) {
          console.log('Creating default meal entitlements');
          const newEntitlements = allMeals.map(item => ({
            mealId: item._id,
            entitled: selectedFoodItems.includes(item._id)
          }));
          setMealEntitlements(newEntitlements);
        }
      } else {
        console.warn('Failed to fetch food settings:', response?.message);
      }
    } catch (error) {
      console.error('Error fetching food settings:', error);
    } finally {
      setLoadingFood(false);
    }
  };
  
  const fetchKitSettings = async () => {
    setLoadingKit(true);
    try {
      const response = await resourceService.getKitSettings(eventId);
      console.log('Kit settings raw response:', response);
      
      if (response && response.success) {
        let processedItems = [];
        
        // Check all possible data structures
        if (response.data?.settings?.kitItems && Array.isArray(response.data.settings.kitItems)) {
          console.log('Found kitItems array in settings');
          processedItems = response.data.settings.kitItems.map(item => ({
            _id: item._id || item.id || String(Math.random()),
            name: typeof item.name === 'string' ? item.name : 'Unknown Item',
            description: typeof item.description === 'string' ? item.description : '',
            quantity: item.quantity
          }));
        } else if (response.data?.settings?.items && Array.isArray(response.data.settings.items)) {
          console.log('Found items array in settings');
          processedItems = response.data.settings.items.map(item => {
            // Handle if item is a string or an object
            if (typeof item === 'string') {
              return {
                _id: item,
            name: item,
            description: `${item} kit item`
              };
            } else if (typeof item === 'object' && item !== null) {
              return {
                _id: item._id || item.id || String(Math.random()),
                name: typeof item.name === 'string' ? item.name : 'Unknown Item',
                description: typeof item.description === 'string' ? item.description : '',
                quantity: item.quantity
              };
            }
            return null;
          }).filter(item => item !== null);
        }
        
        console.log('Processed kit items:', processedItems);
        setKitItems(processedItems);
      } else {
        console.warn('Failed to fetch kit settings:', response?.message);
      }
    } catch (error) {
      console.error('Error fetching kit settings:', error);
    } finally {
      setLoadingKit(false);
    }
  };
  
  const fetchCertificateSettings = async () => {
    setLoadingCertificate(true);
    try {
      const response = await resourceService.getCertificateSettings(eventId);
      console.log('Certificate settings raw response:', response);
      
      if (response && response.success) {
        let processedTypes = [];
        
        // Check all possible data structures
        if (response.data?.settings?.certificateTypes && Array.isArray(response.data.settings.certificateTypes)) {
          console.log('Found certificateTypes array in settings');
          processedTypes = response.data.settings.certificateTypes.map(type => ({
            _id: type._id || type.id || String(Math.random()),
            name: typeof type.name === 'string' ? type.name : 'Unknown Type',
            description: typeof type.description === 'string' ? type.description : ''
          }));
        } else if (response.data?.settings?.types && Array.isArray(response.data.settings.types)) {
          console.log('Found types array in settings');
          processedTypes = response.data.settings.types.map(type => {
            // Handle if type is a string or an object
            if (typeof type === 'string') {
              return {
                _id: type,
            name: type,
            description: `${type} certificate`
              };
            } else if (typeof type === 'object' && type !== null) {
              return {
                _id: type._id || type.id || String(Math.random()),
                name: typeof type.name === 'string' ? type.name : 'Unknown Type',
                description: typeof type.description === 'string' ? type.description : ''
              };
            }
            return null;
          }).filter(type => type !== null);
        }
        
        console.log('Processed certificate types:', processedTypes);
        setCertificateTypes(processedTypes);
      } else {
        console.warn('Failed to fetch certificate settings:', response?.message);
      }
    } catch (error) {
      console.error('Error fetching certificate settings:', error);
    } finally {
      setLoadingCertificate(false);
    }
  };
  
  const renderFoodConfig = () => {
    console.log('Rendering food config, items:', foodItems, 'permissions:', permissions);
    
    // Group food items by day if day info is available
    const foodItemsByDay = {};
    foodItems.forEach(item => {
      if (item.day) {
        if (!foodItemsByDay[item.day]) {
          foodItemsByDay[item.day] = [];
        }
        foodItemsByDay[item.day].push(item);
      } else {
        if (!foodItemsByDay['unspecified']) {
          foodItemsByDay['unspecified'] = [];
        }
        foodItemsByDay['unspecified'].push(item);
      }
    });
    
    // Sort days chronologically
    const sortedDays = Object.keys(foodItemsByDay).sort((a, b) => {
      // Put 'unspecified' at the end
      if (a === 'unspecified') return 1;
      if (b === 'unspecified') return -1;
      
      // Compare dates
      return new Date(a) - new Date(b);
    });
    
    const formatDate = (dateString) => {
      try {
        const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
      } catch (error) {
        return dateString;
      }
    };
    
    return (
      <div key="food-tab" className="p-4">
        <h3 className="text-lg font-medium mb-4">Food Settings</h3>
        
        <div className="mb-4 p-4 bg-gray-50 rounded-md">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={permissions.meals}
              onChange={toggleFoodPermission}
              className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm font-medium">Enable food access for this category</span>
          </label>
          <p className="mt-2 text-xs text-gray-500">
            When enabled, registrants in this category can access meal options based on selections below.
          </p>
        </div>
        
        {loadingFood && (
          <div className="text-center py-8">
          <Spinner />
            <p className="mt-4 text-gray-500">Loading food settings...</p>
          </div>
        )}
        
        {!loadingFood && foodItems.length === 0 && (
          <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-500">No food items configured for this event.</p>
            <p className="text-sm text-gray-400 mt-2">
              Configure food items in the event settings first.
            </p>
          </div>
        )}
        
        {!loadingFood && foodItems.length > 0 && (
          <div className="space-y-8">
            {/* Display days in chronological order */}
            {sortedDays.length > 0 ? (
              sortedDays.map(day => (
                <div key={day} className="border rounded-md overflow-hidden mb-6">
                  <div className="bg-gray-50 px-4 py-2 font-medium border-b">
                    {day !== 'unspecified' ? formatDate(day) : 'Other Meals (No Date)'}
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {/* Sort meals by start time within each day */}
                      {foodItemsByDay[day]
                        .sort((a, b) => {
                          if (!a.startTime || !b.startTime) return 0;
                          return a.startTime.localeCompare(b.startTime);
                        })
                        .map((item) => (
                          <div key={item._id || String(Math.random())} className="border rounded-md p-6 bg-white shadow-sm mb-2">
                            <div className="font-semibold text-base mb-1">
                              {typeof item.name === 'string' ? item.name : 'Unknown Item'}
                            </div>
                            {item.description && typeof item.description === 'string' && (
                              <div className="text-sm text-gray-600 mt-1 mb-2">{item.description}</div>
                            )}
                            <div className="flex items-center justify-between mt-3">
                              <span className={`text-xs px-2 py-1 rounded ${
                                permissions.meals && selectedFoodItems.includes(item._id) 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {permissions.meals && selectedFoodItems.includes(item._id) ? 'Allowed' : 'Not Allowed'}
                              </span>
                              <Switch
                                checked={selectedFoodItems.includes(item._id)}
                                onChange={() => toggleFoodItem(item._id)}
                                disabled={!permissions.meals}
                              />
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              // Simple list if no day information is available
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {foodItems.map((item) => (
                  <div key={item._id || String(Math.random())} className="border rounded-md p-6 bg-white shadow-sm mb-2">
                    <div className="font-semibold text-base mb-1">
                      {typeof item.name === 'string' ? item.name : 'Unknown Item'}
                    </div>
                    {item.description && typeof item.description === 'string' && (
                      <div className="text-sm text-gray-600 mt-1 mb-2">{item.description}</div>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <span className={`text-xs px-2 py-1 rounded ${
                        permissions.meals && selectedFoodItems.includes(item._id) 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {permissions.meals && selectedFoodItems.includes(item._id) ? 'Allowed' : 'Not Allowed'}
                      </span>
                      <Switch
                        checked={selectedFoodItems.includes(item._id)}
                        onChange={() => toggleFoodItem(item._id)}
                        disabled={!permissions.meals}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };
  
  const renderKitConfig = () => {
    return (
      <div key="kit-tab" className="p-4">
        <h3 className="text-lg font-medium mb-4">Kit Settings</h3>
        {loadingKit && <div className="text-center py-4">Loading kit settings...</div>}
        
        {!loadingKit && kitItems.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            No kit items configured for this event.
        </div>
        )}
        
        {!loadingKit && kitItems.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {kitItems.map((item) => (
              <div key={item._id || String(Math.random())} className="border rounded-md p-6 bg-white shadow-sm mb-2">
                <div className="font-semibold text-base mb-1">
                  {typeof item.name === 'string' ? item.name : 'Unknown Item'}
                </div>
                {item.description && typeof item.description === 'string' && (
                  <div className="text-sm text-gray-600 mb-2">{item.description}</div>
                )}
                {item.quantity !== undefined && (
                  <div className="text-sm text-gray-700 mb-2">
                    Quantity: {typeof item.quantity === 'number' ? item.quantity : 'N/A'}
                  </div>
                )}
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {permissions.kitItems && selectedKitItems.includes(item._id) 
                      ? 'Allowed' 
                      : 'Not Allowed'}
                  </span>
                  <Switch
                    checked={selectedKitItems.includes(item._id)}
                    onChange={(checked) => toggleKitItem(item._id)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };
  
  const renderCertificateConfig = () => {
    return (
      <div key="certificate-tab" className="p-4">
        <h3 className="text-lg font-medium mb-4">Certificate Settings</h3>
        {loadingCertificate && <div className="text-center py-4">Loading certificate settings...</div>}
        
        {!loadingCertificate && certificateTypes.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            No certificate types configured for this event.
        </div>
        )}
        
        {!loadingCertificate && certificateTypes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {certificateTypes.map((type) => (
              <div key={type._id || String(Math.random())} className="border rounded-md p-6 bg-white shadow-sm mb-2">
                <div className="font-semibold text-base mb-1">
                  {typeof type.name === 'string' ? type.name : 'Unknown Type'}
                </div>
                {type.description && typeof type.description === 'string' && (
                  <div className="text-sm text-gray-600 mb-2">{type.description}</div>
                )}
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {permissions.certificates && selectedCertificateTypes.includes(type._id) 
                      ? 'Allowed' 
                      : 'Not Allowed'}
                  </span>
                  <Switch
                    checked={selectedCertificateTypes.includes(type._id)}
                    onChange={(checked) => toggleCertificateType(type._id)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };
  
  const renderTabContent = () => {
    console.log('Rendering tab content, activeTab:', activeTab);
    
    switch (activeTab) {
      case 'food':
        return renderFoodConfig();
      case 'kit':
        return renderKitConfig();
      case 'certificate':
        return renderCertificateConfig();
      case 'registrants':
        // Compute filtered and paginated registrants
        const filteredRegistrants = registrants.filter(reg => {
          if (!searchRegistrant) return true;
          const searchTerm = searchRegistrant.toLowerCase();
      return (
            (reg.name && reg.name.toLowerCase().includes(searchTerm)) ||
            (reg.email && reg.email.toLowerCase().includes(searchTerm)) ||
            (reg.mobile && reg.mobile.toLowerCase().includes(searchTerm)) ||
            (reg.registrationId && reg.registrationId.toLowerCase().includes(searchTerm))
          );
        });
        
        const totalPages = Math.max(1, Math.ceil(filteredRegistrants.length / pageSize));
        const paginatedRegistrants = filteredRegistrants.slice((currentPage - 1) * pageSize, currentPage * pageSize);
        
      return (
          <div key="registrants-tab" className="pt-2">
            <h3 className="text-lg font-medium mb-4">Manage Registrants</h3>
            
            {/* Search input */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search registrants by name, email, mobile, or ID..."
                value={searchRegistrant}
                onChange={(e) => setSearchRegistrant(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
        </div>
            
            {loadingRegistrants && (
              <div className="text-center py-8">
                <Spinner />
                <p className="mt-4 text-gray-500">Loading registrants...</p>
              </div>
            )}
            
            {!loadingRegistrants && (!registrants || registrants.length === 0) && (
              <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-gray-500">No registrants in this category</p>
                <p className="text-sm text-gray-400 mt-2">
                  Registrants will appear here once they are assigned to this category.
                </p>
              </div>
            )}
            
            {!loadingRegistrants && registrants && registrants.length > 0 && (
              <div className="overflow-x-auto border rounded-lg max-h-[400px] overflow-y-auto bg-white">
                <table className="min-w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Reg ID</th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Name</th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Email</th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Mobile</th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Actions</th>
            </tr>
          </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paginatedRegistrants.map(registrant => (
                      <tr key={registrant._id || registrant.id || String(Math.random())}>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {registrant.registrationId || 'N/A'}
                          </div>
                </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {registrant.name || 
                              (registrant.firstName && registrant.lastName ? 
                                `${registrant.firstName} ${registrant.lastName}` : 'Unknown')}
                          </div>
                </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{registrant.email || 'No email'}</div>
                </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{registrant.mobile || 'N/A'}</div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <button
                            className="text-red-600 hover:text-red-900 text-sm font-medium"
                            onClick={() => removeRegistrantFromCategory(registrant._id || registrant.id)}
                          >
                            Remove
                          </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
                
                {/* Pagination controls */}
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">{Math.min((currentPage - 1) * pageSize + 1, filteredRegistrants.length)}</span> to{' '}
                        <span className="font-medium">{Math.min(currentPage * pageSize, filteredRegistrants.length)}</span> of{' '}
                        <span className="font-medium">{filteredRegistrants.length}</span> registrants
                      </p>
      </div>
                    <div>
                      <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${
                            currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          <span className="sr-only">Previous</span>
                          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                          </svg>
                        </button>
                        
                        {/* Show page numbers, but limit to 5 pages */}
                        {Array.from({length: Math.min(5, totalPages)}, (_, i) => {
                          // Calculate which page numbers to show
                          let pageNum = i + 1;
                          if (totalPages > 5) {
                            if (currentPage > 3) {
                              pageNum = currentPage - 3 + i + 1;
                            }
                            if (pageNum > totalPages) {
                              pageNum = totalPages - (5 - (i + 1));
                            }
                          }
                          
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                                currentPage === pageNum
                                  ? 'z-10 bg-primary-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600'
                                  : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                        
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${
                            currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          <span className="sr-only">Next</span>
                          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      default:
        return (
          <div className="p-4 text-center text-gray-500">
            Select a tab to view and configure resources
          </div>
        );
    }
  };
  
  const removeRegistrantFromCategory = async (registrantId) => {
    if (!registrantId || !category || !eventId) {
      console.error('Missing required data for removing registrant');
      setError('Missing required data');
      return;
    }
    
    try {
      console.log(`Removing registrant ${registrantId} from category ${category._id}`);
      setLoading(true);
      
      // Call the API to remove the registrant from the category
      const response = await registrationService.removeRegistrantFromCategory(
        eventId, 
        category._id, 
        registrantId
      );
      
      console.log('Remove registrant response:', response);
      
      if (response && response.success) {
        // Update the local state to remove the registrant from the list
        setRegistrants(prevRegistrants => 
          prevRegistrants.filter(reg => reg._id !== registrantId && reg.id !== registrantId)
        );
        
        setSuccess('Registrant removed from category successfully');
        
        // Clear success message after a delay
        setTimeout(() => {
          setSuccess(null);
        }, 3000);
      } else {
        setError(response?.message || 'Failed to remove registrant from category');
      }
    } catch (err) {
      console.error('Error removing registrant from category:', err);
      setError(err.message || 'An error occurred while removing registrant');
    } finally {
      setLoading(false);
    }
  };
  
  // --- Add handler functions for 'Allow All' actions ---
  const handleAllowAllMeals = () => {
    setMealEntitlements((prev) => prev.map(e => ({ ...e, entitled: true })));
    setSelectedFoodItems(foodItems.map(item => item._id)); // Ensure all are checked
  };
  const handleAllowAllKits = () => {
    setKitItemEntitlements((prev) => prev.map(e => ({ ...e, entitled: true })));
    setSelectedKitItems(kitItems.map(item => item._id)); // Ensure all are checked
  };
  const handleAllowAllCertificates = () => {
    setCertificateEntitlements((prev) => prev.map(e => ({ ...e, entitled: true })));
    setSelectedCertificateTypes(certificateTypes.map(type => type._id)); // Ensure all are checked
  };
  
  if (!isOpen) return null;
  const registrantWarning = registrants.length < (category?.registrantCount || 0);
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Configure Resources: ${category?.name || 'Category'}`}
      size="full"
      fullWidth={true}
      className="max-w-[98vw] w-full mx-auto"
      contentClassName="p-0 overflow-visible"
    >
      {error && (
        <Alert type="error" message={error} onClose={() => setError(null)} className="m-4" />
      )}
      {success && (
        <Alert type="success" message={success} onClose={() => setSuccess(null)} className="m-4" />
      )}
      {registrantWarning && (
        <Alert type="warning" message={`Only showing ${registrants.length} of ${category?.registrantCount} registrants. Not all registrants are displayed.`} className="m-4" />
      )}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-8">
          <Spinner />
          <p className="mt-4 text-gray-500">Loading resource settings...</p>
        </div>
      ) : (
        <div className="flex flex-col h-[80vh] min-h-[600px]">
          <div className="px-6 pt-4 pb-2 bg-white sticky top-0 z-10 border-b">
            <Tabs 
              onChange={(tabValue) => {
                console.log(`Switching to tab: ${tabValue} from ${activeTab}`);
                setActiveTab(tabValue);
              }}
              tabs={[
                { label: <span className="flex items-center gap-2"><FaUtensils /> Food</span>, value: 'food' },
                { label: <span className="flex items-center gap-2"><FaBox /> Kit</span>, value: 'kit' },
                { label: <span className="flex items-center gap-2"><FaCertificate /> Certificate</span>, value: 'certificate' },
                { label: <span className="flex items-center gap-2"><FaUsers /> Registrants</span>, value: 'registrants' },
              ]}
              className="mb-0"
            />
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-4 bg-gray-50">
            {/* In each resource tab, add the button at the top right of the tab content */}
            {activeTab === 'food' && (
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold text-gray-700">Meal Entitlements</h4>
                <Button size="sm" variant="primary" onClick={handleAllowAllMeals}>
                  Allow All Meals
                </Button>
              </div>
            )}
            {activeTab === 'kit' && (
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold text-gray-700">Kit Item Entitlements</h4>
                <Button size="sm" variant="primary" onClick={handleAllowAllKits}>
                  Allow All Kits
                </Button>
              </div>
            )}
            {activeTab === 'certificate' && (
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold text-gray-700">Certificate Entitlements</h4>
                <Button size="sm" variant="primary" onClick={handleAllowAllCertificates}>
                  Allow All Certificates
                </Button>
              </div>
            )}
            {renderTabContent()}
          </div>
          <div className="flex justify-end gap-3 px-6 py-4 bg-white border-t sticky bottom-0 z-10">
            <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button variant="primary" onClick={handleSave} loading={!!saving}>Save</Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default CategoryResourcesConfig;