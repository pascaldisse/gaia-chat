import React from 'react';

const TestDeleteButton = ({ onDelete, persona }) => {
  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: 'red',
      color: 'white',
      padding: '10px 20px',
      borderRadius: '8px',
      cursor: 'pointer',
      zIndex: 30000,
      boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
    }}
    onClick={() => {
      console.log('[TestDeleteButton] Clicked!');
      console.log('[TestDeleteButton] onDelete type:', typeof onDelete);
      console.log('[TestDeleteButton] persona:', persona);
      if (typeof onDelete === 'function' && persona) {
        console.log('[TestDeleteButton] Calling onDelete...');
        onDelete(persona);
      }
    }}
    >
      TEST DELETE {persona?.name || 'No Persona'}
    </div>
  );
};

export default TestDeleteButton;