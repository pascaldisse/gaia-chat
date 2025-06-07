import React, { useState } from 'react';
import PersonaCleanup from './admin/PersonaCleanup';
import { clearAllUserData } from '../utils/clearAllData';
import '../styles/DeveloperOverlay.css';

function DeveloperOverlay({ onClose, user }) {
  const [activeTab, setActiveTab] = useState('cleanup');
  const [clearDataResult, setClearDataResult] = useState(null);
  const [isClearing, setIsClearing] = useState(false);

  const handleClearAllData = async () => {
    if (!window.confirm('This will DELETE ALL data including chats, personas, and settings. Are you sure?')) {
      return;
    }

    setIsClearing(true);
    try {
      const results = await clearAllUserData();
      setClearDataResult(results);
    } catch (error) {
      setClearDataResult({ error: error.message });
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="developer-overlay">
      <div className="developer-overlay-header">
        <h2>Developer Tools</h2>
        <button className="close-button" onClick={onClose}>×</button>
      </div>

      <div className="developer-tabs">
        <button 
          className={`tab ${activeTab === 'cleanup' ? 'active' : ''}`}
          onClick={() => setActiveTab('cleanup')}
        >
          Data Cleanup
        </button>
        <button 
          className={`tab ${activeTab === 'console' ? 'active' : ''}`}
          onClick={() => setActiveTab('console')}
        >
          Console
        </button>
        <button 
          className={`tab ${activeTab === 'network' ? 'active' : ''}`}
          onClick={() => setActiveTab('network')}
        >
          Network
        </button>
        <button 
          className={`tab ${activeTab === 'storage' ? 'active' : ''}`}
          onClick={() => setActiveTab('storage')}
        >
          Storage
        </button>
      </div>

      <div className="developer-content">
        {activeTab === 'cleanup' && (
          <div className="cleanup-section">
            <h3>Persona Cleanup</h3>
            <PersonaCleanup />
            
            <div className="separator"></div>
            
            <h3>Complete Data Wipe</h3>
            <div className="warning-box">
              <p>⚠️ This will delete ALL data including:</p>
              <ul>
                <li>All chats and messages</li>
                <li>All personas (including GAIA)</li>
                <li>All user data and settings</li>
                <li>All knowledge bases</li>
                <li>localStorage and sessionStorage</li>
              </ul>
            </div>
            <button 
              className="danger-button"
              onClick={handleClearAllData}
              disabled={isClearing}
            >
              {isClearing ? 'Clearing...' : '🗑️ Clear All Data'}
            </button>
            
            {clearDataResult && (
              <div className={`result-box ${clearDataResult.error ? 'error' : 'success'}`}>
                {clearDataResult.error ? (
                  <p>Error: {clearDataResult.error}</p>
                ) : (
                  <>
                    <h4>Clear Data Results:</h4>
                    <ul>
                      {clearDataResult.databases?.map((db, i) => (
                        <li key={i}>Deleted database: {db}</li>
                      ))}
                      {clearDataResult.localStorage && <li>Cleared localStorage</li>}
                      {clearDataResult.sessionStorage && <li>Cleared sessionStorage</li>}
                    </ul>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'console' && (
          <div className="console-section">
            <h3>Console Output</h3>
            <div className="console-log">
              <p>Console logging will appear here...</p>
            </div>
          </div>
        )}

        {activeTab === 'network' && (
          <div className="network-section">
            <h3>Network Activity</h3>
            <div className="network-log">
              <p>Network requests will appear here...</p>
            </div>
          </div>
        )}

        {activeTab === 'storage' && (
          <div className="storage-section">
            <h3>Storage Information</h3>
            <div className="storage-info">
              <p>IndexedDB databases:</p>
              <ul>
                <li>GaiaChatDB</li>
                <li>PersonaDB</li>
                <li>KnowledgeDB</li>
                <li>UserDB</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DeveloperOverlay;