import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Input,
  Select,
  Alert,
  Spinner,
  Tabs
} from '../../components/common';
import authService from '../../services/authService';

const UserManagement = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: '',
    status: 'active'
  });
  const [status, setStatus] = useState(null);
  const [activeTab, setActiveTab] = useState('users');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch users from API
        const usersResponse = await authService.getUsers();
        if (usersResponse.success) {
          setUsers(usersResponse.data || []);
        } else {
          throw new Error(usersResponse.message || 'Failed to fetch users');
        }
        
        // Fetch roles from API
        const rolesResponse = await authService.getRoles();
        if (rolesResponse.success) {
          setRoles(rolesResponse.data || []);
        } else {
          throw new Error(rolesResponse.message || 'Failed to fetch roles');
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setStatus({
          type: 'error',
          message: 'Failed to load user data: ' + (error.message || 'Unknown error')
        });
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  const handleAddUser = async () => {
    if (!newUser.firstName || !newUser.lastName || !newUser.email || !newUser.role) {
      setStatus({
        type: 'error',
        message: 'Please fill in all required fields'
      });
      return;
    }
    
    if (!/\S+@\S+\.\S+/.test(newUser.email)) {
      setStatus({
        type: 'error',
        message: 'Please enter a valid email address'
      });
      return;
    }
    
    setLoading(true);
    try {
      // Call API to add user
      const response = await authService.createUser(newUser);
      
      if (response.success) {
        // Add new user to state
        setUsers([...users, response.data]);
        setIsAddingUser(false);
        setNewUser({
          firstName: '',
          lastName: '',
          email: '',
          role: '',
          status: 'active'
        });
        
        setStatus({
          type: 'success',
          message: 'User added successfully'
        });
      } else {
        throw new Error(response.message || 'Failed to add user');
      }
    } catch (error) {
      console.error('Error adding user:', error);
      setStatus({
        type: 'error',
        message: 'Failed to add user: ' + (error.message || 'Unknown error')
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleUpdateUserStatus = async (userId, newStatus) => {
    setLoading(true);
    try {
      // Call API to update user status
      const response = await authService.updateUserStatus(userId, newStatus);
      
      if (response.success) {
        // Update user in state
        const updatedUsers = users.map(user => 
          user.id === userId ? { ...user, status: newStatus } : user
        );
        
        setUsers(updatedUsers);
        
        // If the selected user is updated, update selectedUser as well
        if (selectedUser && selectedUser.id === userId) {
          setSelectedUser({ ...selectedUser, status: newStatus });
        }
        
        setStatus({
          type: 'success',
          message: `User status updated to ${newStatus}`
        });
      } else {
        throw new Error(response.message || 'Failed to update user status');
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      setStatus({
        type: 'error',
        message: 'Failed to update user status: ' + (error.message || 'Unknown error')
      });
    } finally {
      setLoading(false);
    }
  };
  
  const renderUserList = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <Spinner />
        </div>
      );
    }
    
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Login
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map(user => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {user.firstName} {user.lastName}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{user.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {roles.find(r => r.id === user.role)?.name || user.role}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Button
                    size="xs"
                    variant="outline"
                    className="mr-2"
                    onClick={() => setSelectedUser(user)}
                  >
                    View
                  </Button>
                  {user.status === 'active' ? (
                    <Button
                      size="xs"
                      variant="danger"
                      onClick={() => handleUpdateUserStatus(user.id, 'inactive')}
                    >
                      Deactivate
                    </Button>
                  ) : (
                    <Button
                      size="xs"
                      variant="success"
                      onClick={() => handleUpdateUserStatus(user.id, 'active')}
                    >
                      Activate
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };
  
  const renderRolesList = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <Spinner />
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {roles.map(role => (
          <Card key={role.id} className="hover:shadow-lg transition-shadow duration-200">
            <div className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium">{role.name}</h3>
                  <p className="text-gray-600 mt-1">{role.description}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                >
                  Edit
                </Button>
              </div>
              
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Permissions:</h4>
                <div className="flex flex-wrap gap-2">
                  {role.permissions.map(permission => (
                    <span 
                      key={permission} 
                      className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-md"
                    >
                      {permission}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  };
  
  const renderUserDetail = () => {
    if (!selectedUser) return null;
    
    const userRole = roles.find(r => r.id === selectedUser.role);
    
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold">User Details</h2>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setSelectedUser(null)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium">{selectedUser.firstName} {selectedUser.lastName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{selectedUser.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Role</p>
                <p className="font-medium">{userRole?.name || selectedUser.role}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-medium">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    selectedUser.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedUser.status}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Last Login</p>
                <p className="font-medium">{selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleString() : 'Never'}</p>
              </div>
            </div>
            
            {userRole && (
              <div className="mb-6">
                <h3 className="text-md font-medium mb-2">Permissions</h3>
                <div className="bg-gray-50 p-3 rounded-md">
                  <div className="flex flex-wrap gap-2">
                    {userRole.permissions.map(permission => (
                      <span 
                        key={permission} 
                        className="px-2 py-1 bg-gray-200 text-gray-800 text-xs rounded-md"
                      >
                        {permission}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setSelectedUser(null)}
              >
                Close
              </Button>
              <Button>
                Edit User
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  const renderAddUserForm = () => {
    if (!isAddingUser) return null;
    
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold">Add New User</h2>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setIsAddingUser(false)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Input
                    label="First Name"
                    value={newUser.firstName}
                    onChange={e => setNewUser({...newUser, firstName: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Input
                    label="Last Name"
                    value={newUser.lastName}
                    onChange={e => setNewUser({...newUser, lastName: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <Input
                label="Email"
                type="email"
                value={newUser.email}
                onChange={e => setNewUser({...newUser, email: e.target.value})}
                required
              />
              
              <Select
                label="Role"
                value={newUser.role}
                onChange={e => setNewUser({...newUser, role: e.target.value})}
                options={roles.map(role => ({ value: role.id, label: role.name }))}
                required
              />
              
              <Select
                label="Status"
                value={newUser.status}
                onChange={e => setNewUser({...newUser, status: e.target.value})}
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' }
                ]}
                required
              />
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setIsAddingUser(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddUser}
                disabled={loading}
              >
                {loading ? <Spinner size="sm" className="mr-2" /> : null}
                Add User
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <Button onClick={() => setIsAddingUser(true)}>
          Add User
        </Button>
      </div>
      
      {status && (
        <Alert 
          type={status.type} 
          message={status.message} 
          className="mb-6"
          onClose={() => setStatus(null)}
        />
      )}
      
      <Card>
        <Tabs
          tabs={[
            { id: 'users', label: 'Users' },
            { id: 'roles', label: 'Roles & Permissions' }
          ]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        
        <div className="p-6">
          {activeTab === 'users' ? renderUserList() : renderRolesList()}
        </div>
      </Card>
      
      {renderUserDetail()}
      {renderAddUserForm()}
    </div>
  );
};

export default UserManagement; 