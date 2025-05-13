import React, { useState, useEffect, useCallback } from 'react';
import { Button, Spinner, Alert, Card } from '../../../components/common';
import UserCreate from '../../Users/UserCreate';
import eventService from '../../../services/eventService'; // Import eventService

const EventUserManagementTab = ({ eventId }) => {
  const [showCreateUserForm, setShowCreateUserForm] = useState(false);
  const [eventUsers, setEventUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState(null);

  const fetchEventUsers = useCallback(async () => {
    if (!eventId) return;
    setLoadingUsers(true);
    setUsersError(null);
    try {
      const response = await eventService.getEventUsers(eventId);
      if (response.success) {
        setEventUsers(response.data || []);
      } else {
        setUsersError(response.message || 'Failed to fetch users.');
        setEventUsers([]);
      }
    } catch (error) {
      setUsersError(error.message || 'An unexpected error occurred.');
      setEventUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchEventUsers();
  }, [fetchEventUsers]);

  if (!eventId) {
    return <Alert variant="danger" title="Error" description="Event ID is missing. Cannot manage users." />;
  }

  const handleUserCreated = () => {
    setShowCreateUserForm(false);
    fetchEventUsers(); // Refresh the user list after a new user is created
  };

  const handleCancelCreate = () => {
    setShowCreateUserForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Event User Management</h3>
        {!showCreateUserForm && (
          <Button 
            variant="primary"
            onClick={() => setShowCreateUserForm(true)}
            disabled={loadingUsers}
          >
            Create New User
          </Button>
        )}
      </div>

      {showCreateUserForm ? (
        <Card className="p-4 md:p-6">
          <UserCreate 
            eventId={eventId} 
            onUserCreated={handleUserCreated} 
            onCancel={handleCancelCreate} 
            isEventContext={true}
          />
        </Card>
      ) : (
        <>
          {loadingUsers && (
            <div className="flex justify-center items-center py-8">
              <Spinner />
              <p className="ml-2">Loading event users...</p>
            </div>
          )}
          {usersError && (
            <Alert variant="danger" title="Error Loading Users" description={usersError} />
          )}
          {!loadingUsers && !usersError && (
            eventUsers.length > 0 ? (
              <Card>
                <ul className="divide-y divide-gray-200">
                  {eventUsers.map(user => (
                    <li key={user._id} className="px-4 py-3 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                        <div className="ml-2 flex-shrink-0 flex">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {user.role}
                          </span>
                          {/* Placeholder for future actions like Edit/Remove from event */}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No users are specifically associated with this event yet.</p>
                <p className="text-gray-400 text-sm mt-1">Users created via this tab with roles like 'staff' or 'reviewer' will appear here.</p>
              </div>
            )
          )}
        </>
      )}
    </div>
  );
};

export default EventUserManagementTab; 