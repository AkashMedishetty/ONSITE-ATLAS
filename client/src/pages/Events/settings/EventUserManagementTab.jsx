import React, { useState, useEffect, useCallback } from 'react';
import { Button, Spinner, Alert, Card } from '../../../components/common';
import UserCreate from '../../Users/UserCreate';
import userService from '../../../services/userService'; // Add this import
import { useAuth } from '../../../contexts/AuthContext'; // Added import
import Modal from '../../../components/common/Modal';
import ConfirmModal from '../../../components/common/ConfirmModal';
import { EyeIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import Input from '../../../components/common/Input'; // Use your own Input if available, else fallback to HTML input

const roleOptions = [
  { value: 'reviewer', label: 'Reviewer' },
  { value: 'staff', label: 'Staff' },
  { value: 'manager', label: 'Manager' },
  { value: 'sponsor', label: 'Sponsor' },
];

const EventUserManagementTab = ({ eventId }) => {
  const { user: currentUser } = useAuth(); // Only for currentUser, not eventId
  const [showCreateUserForm, setShowCreateUserForm] = useState(false);
  const [eventUsers, setEventUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState(null);

  // New state for modals and selected user
  const [selectedUser, setSelectedUser] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({ name: '', email: '', role: '', password: '', confirmPassword: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState(null);

  // Always use eventId from props
  const fetchEventUsers = useCallback(async () => {
    if (!eventId) {
      setUsersError('Event ID is missing. Cannot fetch users.');
      setEventUsers([]);
      setLoadingUsers(false);
      return;
    }
    if (!currentUser) return; // Wait for currentUser

    // If user is reviewer, don't fetch and set an appropriate message or error
    if (currentUser.role === 'reviewer') {
      setUsersError("You do not have permission to view event users.");
      setEventUsers([]);
      setLoadingUsers(false);
      return;
    }

    setLoadingUsers(true);
    setUsersError(null);
    try {
      console.log('Fetching users for eventId:', eventId);
      const response = await userService.getUsers(eventId);
      console.log('API response:', response);
      if (response.data && Array.isArray(response.data.data)) {
        setEventUsers(response.data.data);
      } else {
        setEventUsers([]);
      }
    } catch (error) {
      setUsersError(error.message || 'An unexpected error occurred.');
      setEventUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  }, [eventId, currentUser]);

  useEffect(() => {
    if (currentUser && eventId) { // Only run if both are available
      fetchEventUsers();
    }
  }, [fetchEventUsers, currentUser, eventId]);

  if (!eventId) {
    return <Alert variant="danger" title="Error" description="Event ID is missing. Cannot manage users." />;
  }

  // Check user role
  if (currentUser && currentUser.role === 'reviewer') {
    return (
      <Alert 
        variant="info" 
        title="Permission Denied"
        description="You do not have permission to manage users for this event."
      />
    );
  }

  const handleUserCreated = () => {
    setShowCreateUserForm(false);
    fetchEventUsers(); // Refresh the user list after a new user is created
  };

  const handleCancelCreate = () => {
    setShowCreateUserForm(false);
  };

  // Handlers for actions
  const handleViewUser = (user) => {
    setSelectedUser(user);
    setIsViewModalOpen(true);
  };
  const handleEditUser = (user) => {
    if (!user || !user._id) {
      window.alert('Cannot edit: User data is missing or invalid.');
      return;
    }
    setSelectedUser(user);
    setEditFormData({
      name: user.name || '',
      email: user.email || '',
      role: (user.eventRoles && user.eventRoles[0]?.role) || user.role || '',
      password: '',
      confirmPassword: '',
    });
    setEditError(null);
    setIsEditModalOpen(true);
  };
  const handleDeleteUser = (user) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  // Edit form change
  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
    if (editError) setEditError(null);
  };
  const handleEditRoleChange = (value) => {
    setEditFormData((prev) => ({ ...prev, role: value }));
    if (editError) setEditError(null);
  };

  // Edit modal submit
  const handleEditSubmit = async () => {
    if (!selectedUser || !selectedUser._id) {
      setEditError('No user selected for editing.');
      return;
    }
    if (!editFormData.name.trim() || !editFormData.email.trim() || !editFormData.role) {
      setEditError('Name, email, and role are required.');
      return;
    }
    if (editFormData.password && editFormData.password !== editFormData.confirmPassword) {
      setEditError('Passwords do not match.');
      return;
    }
    setEditLoading(true);
    try {
      const payload = {
        name: editFormData.name,
        email: editFormData.email,
        eventId,
        role: editFormData.role,
      };
      if (editFormData.password) payload.password = editFormData.password;
      await userService.updateUser(selectedUser._id, payload);
      window.alert('User updated successfully');
      setIsEditModalOpen(false);
      setSelectedUser(null);
      fetchEventUsers();
    } catch (err) {
      setEditError(err.message || 'Failed to update user');
    } finally {
      setEditLoading(false);
    }
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!selectedUser || !selectedUser._id) {
      window.alert('No user selected for deletion.');
      return;
    }
    setEditLoading(true);
    try {
      await userService.deleteUser(selectedUser._id);
      window.alert('User deleted successfully');
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
      fetchEventUsers();
    } catch (err) {
      window.alert(err.message || 'Failed to delete user');
    } finally {
      setEditLoading(false);
    }
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
                  {eventUsers.filter(user => user._id).map((user, index) => {
                    let eventRole = null;
                    if (user.eventRoles && Array.isArray(user.eventRoles)) {
                      eventRole = user.eventRoles.find(er => er.eventId && er.eventId.toString() === eventId.toString());
                    }
                    return (
                      <li key={user.email || `user-${index}`} className="px-4 py-3 sm:px-6 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                        <div className="ml-2 flex-shrink-0 flex items-center gap-2">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {eventRole ? eventRole.role : (user.role || 'N/A')}
                          </span>
                          <Button size="xs" variant="outline" onClick={() => handleViewUser(user)} title="View"><EyeIcon className="h-4 w-4" /></Button>
                          <Button size="xs" variant="outline" onClick={() => handleEditUser(user)} title="Edit"><PencilIcon className="h-4 w-4" /></Button>
                          <Button size="xs" variant="danger" title="Delete" onClick={() => handleDeleteUser(user)}><TrashIcon className="h-4 w-4" /></Button>
                        </div>
                      </li>
                    );
                  })}
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

      {/* View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="User Details"
      >
        {selectedUser && (
          <div className="space-y-2">
            <div><strong>Name:</strong> {selectedUser.name}</div>
            <div><strong>Email:</strong> {selectedUser.email}</div>
            <div><strong>Role:</strong> {(selectedUser.eventRoles && selectedUser.eventRoles[0]?.role) || selectedUser.role}</div>
            <div><strong>Event ID:</strong> {eventId}</div>
            <div><strong>ID:</strong> {selectedUser._id}</div>
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit User"
        footer={null}
      >
        {(!selectedUser || !selectedUser._id) ? (
          <div className="text-red-500">No user selected for editing. Please close and try again.</div>
        ) : (
          <form
            onSubmit={e => {
              e.preventDefault();
              handleEditSubmit();
            }}
            className="space-y-3"
          >
            <Input name="name" value={editFormData.name} onChange={handleEditFormChange} placeholder="Name" />
            <Input name="email" value={editFormData.email} onChange={handleEditFormChange} placeholder="Email" />
            <select
              name="role"
              value={editFormData.role}
              onChange={e => handleEditRoleChange(e.target.value)}
              className="w-full border rounded px-2 py-1"
            >
              <option value="">Select Role</option>
              {roleOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <Input type="password" name="password" value={editFormData.password} onChange={handleEditFormChange} placeholder="New Password (leave blank to keep)" />
            <Input type="password" name="confirmPassword" value={editFormData.confirmPassword} onChange={handleEditFormChange} placeholder="Confirm Password" />
            {editError && <div className="text-red-500 text-xs">{editError}</div>}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" type="button" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
              <Button variant="primary" type="submit" disabled={!selectedUser || !selectedUser._id || editLoading} loading={editLoading}>Save</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedUser && (
        <ConfirmModal
          title="Delete User"
          message={`Are you sure you want to delete user ${selectedUser?.name} (${selectedUser?.email})?`}
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={handleConfirmDelete}
          onCancel={() => setIsDeleteModalOpen(false)}
          open={isDeleteModalOpen}
        />
      )}
    </div>
  );
};

export default EventUserManagementTab; 