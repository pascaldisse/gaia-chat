import React, { useState, useContext, useEffect } from 'react';
import { UserContext } from '../../contexts/UserContext';
import AdminTerminal from './AdminTerminal';
import AdminPersonaManager from './AdminPersonaManager';
import UserManagement from './UserManagement';
import AdminDebugTools from './AdminDebugTools';
import '../../styles/admin/AdminDashboard.css';

const AdminDashboard = () => {
  const { user } = useContext(UserContext);
  const [activeTab, setActiveTab] = useState('personas');
  const [accessDenied, setAccessDenied] = useState(false);

  // Check if user has admin access
  useEffect(() => {
    if (!user || !user.isAdmin) {
      setAccessDenied(true);
    }
  }, [user]);

  // Show access denied message if not an admin
  if (accessDenied) {
    return (
      <div className="admin-access-denied">
        <h2>Access Denied</h2>
        <div className="denied-icon">⚠️</div>
        <p>You do not have permission to access the Admin Dashboard.</p>
        <p>This area is restricted to administrative users only.</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <div className="admin-badge">Admin: {user?.displayName || user?.username}</div>
      </div>

      <div className="admin-nav">
        <button 
          className={activeTab === 'personas' ? 'active' : ''} 
          onClick={() => setActiveTab('personas')}
        >
          Persona Management
        </button>
        <button 
          className={activeTab === 'users' ? 'active' : ''} 
          onClick={() => setActiveTab('users')}
        >
          User Management
        </button>
        <button 
          className={activeTab === 'terminal' ? 'active' : ''} 
          onClick={() => setActiveTab('terminal')}
        >
          Admin Terminal
        </button>
        <button 
          className={activeTab === 'debug' ? 'active' : ''} 
          onClick={() => setActiveTab('debug')}
        >
          Debug Tools
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'personas' && <AdminPersonaManager />}
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'terminal' && <AdminTerminal />}
        {activeTab === 'debug' && <AdminDebugTools />}
      </div>
    </div>
  );
};

export default AdminDashboard;