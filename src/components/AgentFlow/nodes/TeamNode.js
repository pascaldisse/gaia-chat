import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

// Team node component to manage multiple agents
const TeamNode = ({ data }) => {
  const {
    teamName = "Agent Team",
    teamDescription = "A team of collaborative agents",
    agents = [],
    teamRole = "coordinator", // coordinator, debate, consensus, etc.
    onEdit,
    onSettings
  } = data;

  const getTeamIcon = () => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
      <path d="M16,13C15.71,13 15.38,13 15.03,13.05C16.19,13.89 17,15 17,16.5V19H23V16.5C23,14.17 18.33,13 16,13M8,13C5.67,13 1,14.17 1,16.5V19H15V16.5C15,14.17 10.33,13 8,13M8,11A3,3 0 0,0 11,8A3,3 0 0,0 8,5A3,3 0 0,0 5,8A3,3 0 0,0 8,11M16,11A3,3 0 0,0 19,8A3,3 0 0,0 16,5A3,3 0 0,0 13,8A3,3 0 0,0 16,11Z" />
    </svg>
  );

  const getSettingsIcon = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="white">
      <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
    </svg>
  );

  // Calculate color based on team role
  const getBackgroundColor = () => {
    switch (teamRole) {
      case 'coordinator':
        return '#9c27b0'; // Purple for coordinator teams
      case 'debate':
        return '#ff9800'; // Orange for debate teams
      case 'consensus':
        return '#009688'; // Teal for consensus teams
      case 'specialist':
        return '#3f51b5'; // Indigo for specialist teams
      default:
        return '#607d8b'; // Blue-gray default
    }
  };

  // Format agent count and names
  const getAgentSummary = () => {
    const count = agents.length;
    if (count === 0) return "No agents";
    if (count === 1) return `1 agent: ${agents[0].name}`;
    if (count === 2) return `2 agents: ${agents[0].name}, ${agents[1].name}`;
    return `${count} agents`;
  };

  const bgColor = getBackgroundColor();

  return (
    <div 
      className="agent-flow-node team" 
      style={{ backgroundColor: bgColor }}
      title={teamDescription}
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
        {teamName}
      </div>
      
      <div className="node-attributes">
        <div className="attribute-chip">
          {teamRole}
        </div>
        <div className="attribute-chip">
          {getAgentSummary()}
        </div>
      </div>
      
      <div className="node-icons">
        {getTeamIcon()}
      </div>
      
      <div className="node-actions">
        <button 
          className="node-action-button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit && onEdit();
          }}
          title="Edit Team"
        >
          Edit
        </button>
        
        <button 
          className="node-action-button settings"
          onClick={(e) => {
            e.stopPropagation();
            onSettings && onSettings();
          }}
          title="Configure Team"
        >
          {getSettingsIcon()}
        </button>
      </div>
    </div>
  );
};

export default memo(TeamNode);