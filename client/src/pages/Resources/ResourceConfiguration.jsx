import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Tabs, 
  Alert,
  Spinner,
  Button 
} from '../../components/common';
import { useParams } from 'react-router-dom';

const ResourceConfiguration = () => {
  const { eventId } = useParams();
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState(null);
  const [activeTab, setActiveTab] = useState('food');
  const [formChanged, setFormChanged] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);

  useEffect(() => {
    // Fetch event data
    const fetchEvent = async () => {
      try {
        // Mock data for now
        setEvent({
          _id: eventId,
          name: 'Conference 2025',
          resourceSettings: {
            meals: {
              enabled: true,
              mealTypes: [
                {
                  id: 'breakfast',
                  name: 'Breakfast',
                  days: ['2025-03-15', '2025-03-16'],
                  categoryPermissions: { delegate: true, speaker: true, staff: true }
                },
                {
                  id: 'lunch',
                  name: 'Lunch',
                  days: ['2025-03-15', '2025-03-16'],
                  categoryPermissions: { delegate: true, speaker: true, staff: true }
                }
              ]
            },
            kitItems: {
              enabled: true,
              items: [
                {
                  id: 'welcome_kit',
                  name: 'Welcome Kit',
                  categoryPermissions: { delegate: true, speaker: true, staff: false }
                },
                {
                  id: 'speaker_kit',
                  name: 'Speaker Kit',
                  categoryPermissions: { delegate: false, speaker: true, staff: false }
                }
              ]
            },
            certificates: {
              enabled: true,
              types: [
                {
                  id: 'participation',
                  name: 'Certificate of Participation',
                  categoryPermissions: { delegate: true, speaker: false, staff: false }
                },
                {
                  id: 'speaking',
                  name: 'Certificate of Speaking',
                  categoryPermissions: { delegate: false, speaker: true, staff: false }
                }
              ]
            }
          }
        });
        setLoading(false);
      } catch (error) {
        console.error('Error fetching event:', error);
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId]);

  const handleSave = async () => {
    setLoading(true);
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSaveStatus({ type: 'success', message: 'Resource configuration saved successfully!' });
      setFormChanged(false);
    } catch (error) {
      console.error('Error saving resource configuration:', error);
      setSaveStatus({ type: 'error', message: 'Failed to save resource configuration.' });
    } finally {
      setLoading(false);
    }
  };

  const FoodSettings = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Food Settings</h3>
      
      <div className="bg-gray-50 p-4 rounded-md">
        <h4 className="font-medium mb-2">Meal Types</h4>
        {event?.resourceSettings?.meals?.mealTypes.map(meal => (
          <div key={meal.id} className="border p-3 rounded-md mb-3 bg-white">
            <div className="flex justify-between items-center mb-2">
              <h5 className="font-medium">{meal.name}</h5>
              <button className="text-red-500 text-sm">Remove</button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">Meal Days</label>
                <div className="text-sm text-gray-700">
                  {meal.days.map(day => new Date(day).toLocaleDateString()).join(', ')}
                </div>
              </div>
              <div>
                <label className="block text-sm mb-1">Category Permissions</label>
                <div className="text-sm text-gray-700">
                  {Object.entries(meal.categoryPermissions)
                    .filter(([_, allowed]) => allowed)
                    .map(([category]) => category.charAt(0).toUpperCase() + category.slice(1))
                    .join(', ')}
                </div>
              </div>
            </div>
          </div>
        ))}
        <Button variant="secondary" className="mt-2">+ Add New Meal Type</Button>
      </div>
    </div>
  );

  const KitSettings = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Kit Bag Settings</h3>
      
      <div className="bg-gray-50 p-4 rounded-md">
        <h4 className="font-medium mb-2">Kit Items</h4>
        {event?.resourceSettings?.kitItems?.items.map(item => (
          <div key={item.id} className="border p-3 rounded-md mb-3 bg-white">
            <div className="flex justify-between items-center mb-2">
              <h5 className="font-medium">{item.name}</h5>
              <button className="text-red-500 text-sm">Remove</button>
            </div>
            <div>
              <label className="block text-sm mb-1">Category Permissions</label>
              <div className="text-sm text-gray-700">
                {Object.entries(item.categoryPermissions)
                  .filter(([_, allowed]) => allowed)
                  .map(([category]) => category.charAt(0).toUpperCase() + category.slice(1))
                  .join(', ')}
              </div>
            </div>
          </div>
        ))}
        <Button variant="secondary" className="mt-2">+ Add New Kit Item</Button>
      </div>
    </div>
  );

  const CertificateSettings = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Certificate Settings</h3>
      
      <div className="bg-gray-50 p-4 rounded-md">
        <h4 className="font-medium mb-2">Certificate Types</h4>
        {event?.resourceSettings?.certificates?.types.map(cert => (
          <div key={cert.id} className="border p-3 rounded-md mb-3 bg-white">
            <div className="flex justify-between items-center mb-2">
              <h5 className="font-medium">{cert.name}</h5>
              <button className="text-red-500 text-sm">Remove</button>
            </div>
            <div>
              <label className="block text-sm mb-1">Category Permissions</label>
              <div className="text-sm text-gray-700">
                {Object.entries(cert.categoryPermissions)
                  .filter(([_, allowed]) => allowed)
                  .map(([category]) => category.charAt(0).toUpperCase() + category.slice(1))
                  .join(', ')}
              </div>
            </div>
          </div>
        ))}
        <Button variant="secondary" className="mt-2">+ Add New Certificate Type</Button>
      </div>
    </div>
  );

  if (loading && !event) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Resource Configuration</h2>
        <Button 
          disabled={!formChanged || loading} 
          onClick={handleSave}
        >
          {loading ? <Spinner size="sm" className="mr-2" /> : null}
          Save Changes
        </Button>
      </div>

      {saveStatus && (
        <Alert 
          type={saveStatus.type} 
          message={saveStatus.message} 
          className="mb-4"
          onClose={() => setSaveStatus(null)}
        />
      )}

      <Card>
        <Tabs
          tabs={[
            { id: 'food', label: 'Food' },
            { id: 'kits', label: 'Kit Bags' },
            { id: 'certificates', label: 'Certificates' }
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
        
        <div className="mt-6">
          {activeTab === 'food' && <FoodSettings />}
          {activeTab === 'kits' && <KitSettings />}
          {activeTab === 'certificates' && <CertificateSettings />}
        </div>
      </Card>
    </div>
  );
};

export default ResourceConfiguration; 