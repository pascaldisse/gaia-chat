import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

// Communication node component to manage agent interactions
const CommunicationNode = ({ data }) => {
  const {
    name = "Communication Channel",
    mode = "broadcast", // broadcast, p2p, roundRobin, etc.
    description = "Communication channel for agents",
    format = "text", // text, structured, json
    onEdit,
    onView
  } = data;

  const getCommunicationIcon = () => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
      <path d="M20,2H4A2,2 0 0,0 2,4V22L6,18H20A2,2 0 0,0 22,16V4A2,2 0 0,0 20,2M6,9H18V11H6M14,14H6V12H14M18,8H6V6H18" />
    </svg>
  );

  const getViewIcon = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="white">
      <path d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z" />
    </svg>
  );

  // Calculate color based on communication mode
  const getBackgroundColor = () => {
    switch (mode) {
      case 'broadcast':
        return '#ff5722'; // Deep orange for broadcast
      case 'p2p':
        return '#8bc34a'; // Light green for peer-to-peer
      case 'roundRobin':
        return '#03a9f4'; // Light blue for round robin
      case 'debateStyle':
        return '#e91e63'; // Pink for debate-style communication
      default:
        return '#757575'; // Grey for other types
    }
  };

  const bgColor = getBackgroundColor();

  return (
    <div 
      className="agent-flow-node communication" 
      style={{ backgroundColor: bgColor }}
      title={description}
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
        {name}
      </div>
      
      <div className="node-attributes">
        <div className="attribute-chip">
          {mode}
        </div>
        <div className="attribute-chip">
          {format}
        </div>
      </div>
      
      <div className="node-icons">
        {getCommunicationIcon()}
      </div>
      
      <div className="node-actions">
        <button 
          className="node-action-button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit && onEdit();
          }}
          title="Configure Channel"
        >
          Edit
        </button>
        
        <button 
          className="node-action-button view"
          onClick={(e) => {
            e.stopPropagation();
            onView && onView();
          }}
          title="View Messages"
        >
          {getViewIcon()}
        </button>
      </div>
    </div>
  );
};

export default memo(CommunicationNode);