import React from 'react';

const PersonaManagerDebug = () => {
  const handleTestClick = (e) => {
    console.log('[DEBUG] Test button clicked!');
    console.log('[DEBUG] Event:', e);
    console.log('[DEBUG] Target:', e.target);
    console.log('[DEBUG] CurrentTarget:', e.currentTarget);
    
    // Check if any parent elements have pointer-events: none
    let element = e.target;
    while (element) {
      const style = window.getComputedStyle(element);
      console.log(`[DEBUG] Element ${element.tagName}.${element.className}: pointer-events = ${style.pointerEvents}, z-index = ${style.zIndex}`);
      element = element.parentElement;
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      background: 'white',
      padding: '20px',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      zIndex: 20000
    }}>
      <h3>Click Test</h3>
      <button 
        onClick={handleTestClick}
        style={{
          padding: '10px 20px',
          background: 'blue',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '16px'
        }}
      >
        Test Click Handler
      </button>
    </div>
  );
};

export default PersonaManagerDebug;