import React, { useState } from 'react';
import { useUser } from '../../contexts/UserContext';
import '../../styles/UserProfile.css';

const UserProfile = ({ onClose }) => {
  const { user, updateUser, updateSettings, deleteAccount, logout, isLoading } = useUser();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    displayName: user.displayName || '',
    username: user.username || '',
    email: user.email || ''
  });
  
  const [settingsData, setSettingsData] = useState({
    theme: user.settings?.theme || 'light',
    defaultModel: user.settings?.defaultModel || 'meta-llama/Meta-Llama-3-70B-Instruct',
    defaultPersona: user.settings?.defaultPersona || ''
  });
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSettingsChange = (e) => {
    const { name, value } = e.target;
    setSettingsData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    
    try {
      await updateUser({
        displayName: formData.displayName,
        username: formData.username !== user.username ? formData.username : undefined,
        email: formData.email !== user.email ? formData.email : undefined
      });
      
      setFormSuccess('Profile updated successfully');
    } catch (err) {
      setFormError(err.message || 'Failed to update profile');
    }
  };
  
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    
    // Validation
    if (newPassword !== confirmPassword) {
      setFormError('New passwords do not match');
      return;
    }
    
    if (newPassword.length < 8) {
      setFormError('New password must be at least 8 characters long');
      return;
    }
    
    try {
      // Get current password hash using auth service
      const { hashPassword } = await import('../../services/auth');
      const currentPasswordHash = await hashPassword(currentPassword);
      const newPasswordHash = await hashPassword(newPassword);
      
      await updateUser({
        passwordHash: newPasswordHash,
        currentPasswordHash // For verification on server
      });
      
      setFormSuccess('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setFormError(err.message || 'Failed to update password');
    }
  };
  
  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    
    try {
      await updateSettings(settingsData);
      setFormSuccess('Settings updated successfully');
    } catch (err) {
      setFormError(err.message || 'Failed to update settings');
    }
  };
  
  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    setFormError('');
    
    if (deleteConfirmation !== user.username) {
      setFormError('Username confirmation does not match');
      return;
    }
    
    try {
      await deleteAccount(deletePassword);
      onClose();
    } catch (err) {
      setFormError(err.message || 'Failed to delete account');
    }
  };
  
  return (
    <div className="user-profile-container">
      <div className="user-profile-card">
        <div className="profile-header">
          <h2>Your Account</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="profile-tabs">
          <button 
            className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </button>
          <button 
            className={`tab-button ${activeTab === 'password' ? 'active' : ''}`}
            onClick={() => setActiveTab('password')}
          >
            Password
          </button>
          <button 
            className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </button>
          <button 
            className={`tab-button ${activeTab === 'danger' ? 'active' : ''}`}
            onClick={() => setActiveTab('danger')}
          >
            Delete Account
          </button>
        </div>
        
        {formError && <div className="profile-error">{formError}</div>}
        {formSuccess && <div className="profile-success">{formSuccess}</div>}
        
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <form onSubmit={handleProfileSubmit} className="profile-form">
            <div className="form-group">
              <label htmlFor="displayName">Display Name</label>
              <input
                type="text"
                id="displayName"
                name="displayName"
                value={formData.displayName}
                onChange={handleProfileChange}
                disabled={isLoading}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleProfileChange}
                disabled={isLoading}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleProfileChange}
                disabled={isLoading}
              />
            </div>
            
            <button 
              type="submit" 
              className="profile-button" 
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        )}
        
        {/* Password Tab */}
        {activeTab === 'password' && (
          <form onSubmit={handlePasswordSubmit} className="profile-form">
            <div className="form-group">
              <label htmlFor="currentPassword">Current Password</label>
              <input
                type="password"
                id="currentPassword"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            
            <button 
              type="submit" 
              className="profile-button" 
              disabled={isLoading}
            >
              {isLoading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        )}
        
        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <form onSubmit={handleSettingsSubmit} className="profile-form">
            <div className="form-group">
              <label htmlFor="theme">Theme</label>
              <select
                id="theme"
                name="theme"
                value={settingsData.theme}
                onChange={handleSettingsChange}
                disabled={isLoading}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System Default</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="defaultModel">Default Model</label>
              <select
                id="defaultModel"
                name="defaultModel"
                value={settingsData.defaultModel}
                onChange={handleSettingsChange}
                disabled={isLoading}
              >
                <option value="meta-llama/Meta-Llama-3-70B-Instruct">Meta Llama 3 70B</option>
                <option value="mistralai/Mixtral-8x22B-Instruct-v0.1">Mixtral 8x22B</option>
                <option value="deepseek-ai/DeepSeek-V3">DeepSeek V3</option>
                <option value="deepseek-ai/DeepSeek-R1">DeepSeek R1</option>
                <option value="databricks/dbrx-instruct">DBRX</option>
              </select>
            </div>
            
            <button 
              type="submit" 
              className="profile-button" 
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Settings'}
            </button>
          </form>
        )}
        
        {/* Danger Zone Tab */}
        {activeTab === 'danger' && (
          <div className="danger-zone">
            <div className="danger-warning">
              <h3>Delete Your Account</h3>
              <p>This action cannot be undone. All your data, including chats, personas, and workflows, will be permanently deleted.</p>
            </div>
            
            <form onSubmit={handleDeleteAccount} className="profile-form">
              <div className="form-group">
                <label htmlFor="deleteConfirmation">Type your username to confirm</label>
                <input
                  type="text"
                  id="deleteConfirmation"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder={`Type "${user.username}" to confirm`}
                  disabled={isLoading}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="deletePassword">Enter your password</label>
                <input
                  type="password"
                  id="deletePassword"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
              
              <button 
                type="submit" 
                className="danger-button" 
                disabled={isLoading || deleteConfirmation !== user.username}
              >
                {isLoading ? 'Processing...' : 'Permanently Delete My Account'}
              </button>
            </form>
            
            <div className="logout-section">
              <button
                onClick={logout}
                className="logout-button"
                disabled={isLoading}
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;