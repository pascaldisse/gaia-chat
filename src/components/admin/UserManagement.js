import React, { useState, useEffect } from 'react';
import { userDB } from '../../services/db';
import '../../styles/admin/UserManagement.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: '',
    email: '',
    isAdmin: false
  });

  // Load all users
  const loadUsers = async () => {
    try {
      setLoading(true);
      const allUsers = await userDB.getAllUsers();
      
      // Filter by search query if any
      let filteredUsers = allUsers;
      if (searchQuery) {
        const query = searchQuery.toLowerCase().trim();
        filteredUsers = allUsers.filter(user => 
          (user.username && user.username.toLowerCase().includes(query)) ||
          (user.displayName && user.displayName.toLowerCase().includes(query)) ||
          (user.email && user.email.toLowerCase().includes(query)) ||
          (user.id && user.id.toLowerCase().includes(query))
        );
      }
      
      setUsers(filteredUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      showFeedback('Error loading users', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Load users on mount and when search changes
  useEffect(() => {
    loadUsers();
  }, [searchQuery]);

  // Show feedback messages with auto-hide
  const showFeedback = (message, type = 'success') => {
    setFeedbackMessage({ message, type });
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 3000);
  };

  // Select a user to view/edit
  const selectUser = (user) => {
    setSelectedUser(user);
    setEditMode(false);
    
    // Initialize edit form with current values
    setEditForm({
      displayName: user.displayName || '',
      email: user.email || '',
      isAdmin: user.isAdmin || false
    });
  };

  // Toggle admin status for a user
  const toggleAdminStatus = async (userId, currentStatus) => {
    try {
      await userDB.updateUser(userId, { isAdmin: !currentStatus });
      showFeedback(`User is now ${!currentStatus ? 'an admin' : 'no longer an admin'}`);
      loadUsers();
      
      // Update selected user if it's the one being modified
      if (selectedUser && selectedUser.id === userId) {
        const updatedUser = await userDB.getUserById(userId);
        setSelectedUser(updatedUser);
        setEditForm(prev => ({...prev, isAdmin: !currentStatus}));
      }
    } catch (error) {
      console.error('Error toggling admin status:', error);
      showFeedback('Error updating user', 'error');
    }
  };
  
  // Enter edit mode
  const enableEditMode = () => {
    setEditMode(true);
  };
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  // Save user changes
  const saveUserChanges = async () => {
    if (!selectedUser) return;
    
    try {
      await userDB.updateUser(selectedUser.id, editForm);
      showFeedback('User updated successfully');
      
      // Refresh user list and selected user
      loadUsers();
      const updatedUser = await userDB.getUserById(selectedUser.id);
      setSelectedUser(updatedUser);
      setEditMode(false);
    } catch (error) {
      console.error('Error updating user:', error);
      showFeedback(`Error: ${error.message}`, 'error');
    }
  };

  return (
    <div className="admin-user-management">
      {feedbackMessage && (
        <div className={`feedback-message ${feedbackMessage.type}`}>
          {feedbackMessage.message}
        </div>
      )}
      
      <div className="user-management-container">
        <div className="users-list-section">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span className="search-icon">🔍</span>
          </div>
          
          <div className="users-list">
            {loading ? (
              <div className="loading">Loading users...</div>
            ) : users.length === 0 ? (
              <div className="no-results">No users found</div>
            ) : (
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Display Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr 
                      key={user.id} 
                      className={selectedUser && selectedUser.id === user.id ? 'selected' : ''}
                      onClick={() => selectUser(user)}
                    >
                      <td>{user.username || 'N/A'}</td>
                      <td>{user.displayName || 'N/A'}</td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`role-badge ${user.isAdmin ? 'admin' : 'user'}`}>
                          {user.isAdmin ? 'Admin' : 'User'}
                        </span>
                      </td>
                      <td>
                        <button
                          className={`action-btn ${user.isAdmin ? 'remove-admin' : 'make-admin'}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleAdminStatus(user.id, user.isAdmin);
                          }}
                        >
                          {user.isAdmin ? 'Remove Admin' : 'Make Admin'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
        
        {selectedUser && (
          <div className="user-details-section">
            <h2>{editMode ? 'Edit User' : 'User Details'}</h2>
            
            <div className="user-id-display">
              <label>User ID</label>
              <div className="id-value">{selectedUser.id}</div>
            </div>
            
            {editMode ? (
              <div className="edit-form">
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={editForm.email}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="form-group">
                  <label>Display Name</label>
                  <input
                    type="text"
                    name="displayName"
                    value={editForm.displayName}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="form-group checkbox">
                  <label>
                    <input
                      type="checkbox"
                      name="isAdmin"
                      checked={editForm.isAdmin}
                      onChange={handleInputChange}
                    />
                    Admin User
                  </label>
                </div>
                
                <div className="form-actions">
                  <button 
                    className="save-button"
                    onClick={saveUserChanges}
                  >
                    Save Changes
                  </button>
                  <button 
                    className="cancel-button"
                    onClick={() => setEditMode(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="user-details">
                <div className="detail-item">
                  <label>Username</label>
                  <div>{selectedUser.username || 'Not set'}</div>
                </div>
                
                <div className="detail-item">
                  <label>Display Name</label>
                  <div>{selectedUser.displayName || 'Not set'}</div>
                </div>
                
                <div className="detail-item">
                  <label>Email</label>
                  <div>{selectedUser.email}</div>
                </div>
                
                <div className="detail-item">
                  <label>Role</label>
                  <div>
                    <span className={`role-badge ${selectedUser.isAdmin ? 'admin' : 'user'}`}>
                      {selectedUser.isAdmin ? 'Admin' : 'User'}
                    </span>
                  </div>
                </div>
                
                <div className="detail-item">
                  <label>Created</label>
                  <div>{new Date(selectedUser.createdAt).toLocaleString()}</div>
                </div>
                
                <div className="detail-item">
                  <label>Last Login</label>
                  <div>{new Date(selectedUser.lastLogin).toLocaleString()}</div>
                </div>
                
                <div className="user-actions">
                  <button 
                    className="edit-button"
                    onClick={enableEditMode}
                  >
                    Edit User
                  </button>
                  <button 
                    className={`toggle-admin-button ${selectedUser.isAdmin ? 'remove-admin' : 'make-admin'}`}
                    onClick={() => toggleAdminStatus(selectedUser.id, selectedUser.isAdmin)}
                  >
                    {selectedUser.isAdmin ? 'Remove Admin' : 'Make Admin'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;