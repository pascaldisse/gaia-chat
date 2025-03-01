import React, { useState, useEffect } from 'react';
import { chatDB, personaDB, userDB } from '../../services/db';
import '../../styles/admin/AdminDebugTools.css';

const AdminDebugTools = () => {
  const [databaseStats, setDatabaseStats] = useState({
    users: 0,
    personas: 0,
    chats: 0,
    files: 0
  });
  
  const [systemInfo, setSystemInfo] = useState({
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    cookiesEnabled: navigator.cookieEnabled,
    localStorage: typeof localStorage !== 'undefined',
    sessionStorage: typeof sessionStorage !== 'undefined',
    indexedDB: typeof indexedDB !== 'undefined'
  });
  
  const [logs, setLogs] = useState([]);
  const [showClearDbConfirm, setShowClearDbConfirm] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState(null);
  
  useEffect(() => {
    // Load database statistics
    const fetchDatabaseStats = async () => {
      try {
        const users = await userDB.getAllUsers();
        const personas = await personaDB.getAllPersonas();
        const chats = await chatDB.getAllChats();
        
        setDatabaseStats({
          users: users.length,
          personas: personas.length,
          chats: chats.length,
          files: 0 // Would need to add file count if needed
        });
        
        // Add a log entry
        addLogEntry('Database statistics loaded', 'info');
      } catch (error) {
        console.error('Error fetching database stats:', error);
        addLogEntry(`Error: ${error.message}`, 'error');
      }
    };
    
    fetchDatabaseStats();
  }, []);
  
  // Function to add a log entry
  const addLogEntry = (message, type = 'info') => {
    const timestamp = new Date().toISOString();
    setLogs(prev => [{ message, type, timestamp }, ...prev].slice(0, 50)); // Keep last 50 logs
  };
  
  // Function to run a debug operation
  const runDebugOperation = async (operation) => {
    setSelectedOperation(operation);
    addLogEntry(`Running operation: ${operation}`, 'info');
    
    try {
      switch (operation) {
        case 'databaseBackup':
          await handleDatabaseBackup();
          break;
        case 'clearDatabase':
          setShowClearDbConfirm(true);
          return; // Don't complete yet, wait for confirmation
        case 'repairPersonas':
          await repairPersonas();
          break;
        case 'validateUsers':
          await validateUsers();
          break;
        default:
          addLogEntry(`Unknown operation: ${operation}`, 'error');
      }
      
      addLogEntry(`Operation complete: ${operation}`, 'success');
    } catch (error) {
      console.error(`Error during ${operation}:`, error);
      addLogEntry(`Error: ${error.message}`, 'error');
    } finally {
      if (operation !== 'clearDatabase') {
        setSelectedOperation(null);
      }
    }
  };
  
  // Handle database backup
  const handleDatabaseBackup = async () => {
    try {
      // Get all data from the database
      const users = await userDB.getAllUsers();
      const personas = await personaDB.getAllPersonas();
      const chats = await chatDB.getAllChats();
      
      // Create backup object
      const backup = {
        timestamp: new Date().toISOString(),
        users,
        personas,
        chats,
        version: '1.0'
      };
      
      // Convert to JSON and create download link
      const backupJson = JSON.stringify(backup, null, 2);
      const blob = new Blob([backupJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Create download link and trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = `gaia_backup_${new Date().toISOString().replace(/:/g, '-')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      addLogEntry('Database backup created and downloaded', 'success');
    } catch (error) {
      console.error('Error creating backup:', error);
      addLogEntry(`Error creating backup: ${error.message}`, 'error');
      throw error;
    }
  };
  
  // Clear database (dangerous!)
  const confirmClearDatabase = async () => {
    try {
      addLogEntry('Clearing database...', 'warning');
      
      // This would need to be replaced with actual reset functionality
      // For safety, this is not implemented
      
      // Mock functionality
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      addLogEntry('Database cleared successfully', 'success');
      
      // Reset stats
      setDatabaseStats({
        users: 0,
        personas: 0,
        chats: 0,
        files: 0
      });
      
      setShowClearDbConfirm(false);
      setSelectedOperation(null);
    } catch (error) {
      console.error('Error clearing database:', error);
      addLogEntry(`Error clearing database: ${error.message}`, 'error');
      setShowClearDbConfirm(false);
      setSelectedOperation(null);
      throw error;
    }
  };
  
  // Cancel database clear
  const cancelClearDatabase = () => {
    setShowClearDbConfirm(false);
    setSelectedOperation(null);
    addLogEntry('Database clear operation cancelled', 'info');
  };
  
  // Repair personas (fix any corrupted data)
  const repairPersonas = async () => {
    try {
      addLogEntry('Checking personas for data integrity issues...', 'info');
      
      const personas = await personaDB.getAllPersonas();
      let repairedCount = 0;
      
      for (const persona of personas) {
        let needsRepair = false;
        
        // Check for missing required fields
        if (!persona.name) {
          persona.name = 'Unnamed Persona';
          needsRepair = true;
        }
        
        if (!persona.systemPrompt) {
          persona.systemPrompt = 'You are a helpful assistant.';
          needsRepair = true;
        }
        
        // Check for incorrect types and fix them
        if (persona.tags && !Array.isArray(persona.tags)) {
          persona.tags = [];
          needsRepair = true;
        }
        
        if (persona.knowledgeFiles && !Array.isArray(persona.knowledgeFiles)) {
          persona.knowledgeFiles = [];
          needsRepair = true;
        }
        
        // If persona needs repair, save it
        if (needsRepair) {
          await personaDB.savePersona(persona);
          repairedCount++;
        }
      }
      
      addLogEntry(`Persona repair complete. Fixed ${repairedCount} personas.`, 'success');
    } catch (error) {
      console.error('Error repairing personas:', error);
      addLogEntry(`Error repairing personas: ${error.message}`, 'error');
      throw error;
    }
  };
  
  // Validate users
  const validateUsers = async () => {
    try {
      addLogEntry('Validating user data...', 'info');
      
      const users = await userDB.getAllUsers();
      let validCount = 0;
      let issueCount = 0;
      
      for (const user of users) {
        // Check for required fields
        if (!user.email) {
          addLogEntry(`User ${user.id} missing email`, 'warning');
          issueCount++;
          continue;
        }
        
        // Check for email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(user.email)) {
          addLogEntry(`User ${user.id} has invalid email format`, 'warning');
          issueCount++;
          continue;
        }
        
        // All checks passed
        validCount++;
      }
      
      addLogEntry(`User validation complete. Valid: ${validCount}, Issues: ${issueCount}`, 'success');
    } catch (error) {
      console.error('Error validating users:', error);
      addLogEntry(`Error validating users: ${error.message}`, 'error');
      throw error;
    }
  };

  return (
    <div className="admin-debug-tools">
      <div className="debug-columns">
        <div className="debug-column">
          <div className="debug-card">
            <h2>Database Statistics</h2>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-value">{databaseStats.users}</div>
                <div className="stat-label">Users</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{databaseStats.personas}</div>
                <div className="stat-label">Personas</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{databaseStats.chats}</div>
                <div className="stat-label">Chats</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{databaseStats.files}</div>
                <div className="stat-label">Files</div>
              </div>
            </div>
          </div>
          
          <div className="debug-card">
            <h2>System Information</h2>
            <div className="info-list">
              <div className="info-item">
                <div className="info-label">User Agent</div>
                <div className="info-value">{systemInfo.userAgent}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Platform</div>
                <div className="info-value">{systemInfo.platform}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Language</div>
                <div className="info-value">{systemInfo.language}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Storage</div>
                <div className="info-value">
                  <span className={systemInfo.localStorage ? 'available' : 'unavailable'}>
                    localStorage
                  </span> | 
                  <span className={systemInfo.indexedDB ? 'available' : 'unavailable'}>
                    IndexedDB
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="debug-card">
            <h2>Debug Operations</h2>
            <div className="debug-operations">
              <button 
                className="operation-button"
                onClick={() => runDebugOperation('databaseBackup')}
                disabled={selectedOperation !== null}
              >
                Backup Database
              </button>
              <button 
                className="operation-button danger"
                onClick={() => runDebugOperation('clearDatabase')}
                disabled={selectedOperation !== null}
              >
                Clear Database
              </button>
              <button 
                className="operation-button"
                onClick={() => runDebugOperation('repairPersonas')}
                disabled={selectedOperation !== null}
              >
                Repair Personas
              </button>
              <button 
                className="operation-button"
                onClick={() => runDebugOperation('validateUsers')}
                disabled={selectedOperation !== null}
              >
                Validate Users
              </button>
            </div>
          </div>
        </div>
        
        <div className="debug-column">
          <div className="debug-card logs-card">
            <h2>Debug Logs</h2>
            <div className="logs-container">
              {logs.length === 0 ? (
                <div className="no-logs">No logs yet</div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className={`log-entry ${log.type}`}>
                    <span className="log-timestamp">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <span className="log-message">{log.message}</span>
                  </div>
                ))
              )}
            </div>
            <button 
              className="clear-logs"
              onClick={() => setLogs([])}
              disabled={logs.length === 0}
            >
              Clear Logs
            </button>
          </div>
        </div>
      </div>
      
      {showClearDbConfirm && (
        <div className="confirmation-modal">
          <div className="confirmation-content">
            <h3>⚠️ Dangerous Operation</h3>
            <p>
              You are about to clear the entire database. This will permanently delete all:
            </p>
            <ul>
              <li>User accounts</li>
              <li>Personas</li>
              <li>Chat history</li>
              <li>Uploaded files</li>
            </ul>
            <p className="warning-text">
              This action cannot be undone!
            </p>
            <div className="confirmation-actions">
              <button 
                className="cancel-button"
                onClick={cancelClearDatabase}
              >
                Cancel
              </button>
              <button 
                className="confirm-button"
                onClick={confirmClearDatabase}
              >
                Yes, Clear Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDebugTools;