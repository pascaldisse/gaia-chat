import React, { useState } from 'react';
import { cleanupPersonas, getCurrentUserInfo } from '../../utils/cleanupPersonas';

const PersonaCleanup = () => {
  const [status, setStatus] = useState('');
  const [userInfo, setUserInfo] = useState(null);
  const [cleanupResult, setCleanupResult] = useState(null);

  const checkUser = async () => {
    const user = await getCurrentUserInfo();
    setUserInfo(user);
    setStatus(user ? `Logged in as: ${user.email || user.username || 'Unknown'}` : 'No user logged in');
  };

  const runCleanup = async () => {
    setStatus('Running cleanup...');
    try {
      const result = await cleanupPersonas();
      setCleanupResult(result);
      setStatus(`Cleanup complete! Deleted ${result.deleted} personas, kept GAIA.`);
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
  };

  return (
    <div style={{ padding: '20px', background: '#1a1a1a', color: 'white', borderRadius: '8px', margin: '20px' }}>
      <h2>Persona Cleanup Tool</h2>
      
      <button onClick={checkUser} style={{ marginRight: '10px', padding: '10px 20px' }}>
        Check Current User
      </button>
      
      <button onClick={runCleanup} style={{ padding: '10px 20px', background: '#cf6679', color: 'white' }}>
        Delete All Personas Except GAIA
      </button>
      
      {status && <p style={{ marginTop: '20px' }}>{status}</p>}
      
      {userInfo && (
        <div style={{ marginTop: '20px', background: '#2d2d2d', padding: '10px', borderRadius: '4px' }}>
          <h3>User Info:</h3>
          <pre>{JSON.stringify(userInfo, null, 2)}</pre>
        </div>
      )}
      
      {cleanupResult && (
        <div style={{ marginTop: '20px', background: '#2d2d2d', padding: '10px', borderRadius: '4px' }}>
          <h3>Cleanup Result:</h3>
          <p>Total personas found: {cleanupResult.total}</p>
          <p>Deleted: {cleanupResult.deleted}</p>
          <p>Kept: {cleanupResult.kept} (GAIA)</p>
          {cleanupResult.deletedPersonas.length > 0 && (
            <>
              <h4>Deleted Personas:</h4>
              <ul>
                {cleanupResult.deletedPersonas.map(p => (
                  <li key={p.id}>{p.name} (ID: {p.id})</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default PersonaCleanup;