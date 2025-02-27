import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

// Persona node component
const PersonaNode = ({ data }) => {
  const {
    personaData = {},
    onEdit,
    onSettings
  } = data;

  const getPersonaIcon = () => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
    </svg>
  );

  const getSettingsIcon = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="white">
      <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
    </svg>
  );

  // Calculate a color based on persona's capabilities or attributes
  const getBackgroundColor = () => {
    if (!personaData.id) return '#7289da'; // Default Discord blue
    
    // Determine color based on highest attributes
    if (personaData.creativity > 7) return '#e91e63'; // Creative - pink
    if (personaData.intelligence > 7) return '#2196f3'; // Intelligent - blue
    if (personaData.empathy > 7) return '#4caf50'; // Empathetic - green
    
    return '#7289da'; // Default color
  };

  const bgColor = getBackgroundColor();

  return (
    <div 
      className="agent-flow-node persona" 
      style={{ backgroundColor: bgColor }}
      title={personaData.description || "Persona Agent"}
    >
      <Handle
        type="target"
        position={Position.Top}
        id="in"
        style={{ background: '#fff' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="out"
        style={{ background: '#fff' }}
      />
      
      <div className="node-label">
        {personaData.name || "Select Persona"}
      </div>
      
      <div className="node-attributes">
        {personaData.id && (
          <>
            <div className="attribute-chip">
              {personaData.model?.substring(0, 6) || "No Model"}
            </div>
            <div className="attribute-chip">
              🎲 {personaData.initiative || 0}
            </div>
          </>
        )}
      </div>
      
      <div className="node-icons">
        {getPersonaIcon()}
      </div>
      
      <div className="node-actions">
        <button 
          className="node-action-button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit && onEdit(personaData);
          }}
          title="Select Persona"
        >
          Select
        </button>
        
        {personaData.id && (
          <button 
            className="node-action-button settings"
            onClick={(e) => {
              e.stopPropagation();
              onSettings && onSettings(personaData);
            }}
            title="Configure Agent"
          >
            {getSettingsIcon()}
          </button>
        )}
      </div>
    </div>
  );
};

export default memo(PersonaNode);