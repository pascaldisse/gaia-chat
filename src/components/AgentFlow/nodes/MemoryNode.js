import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

// Memory node component to store shared state between agents
const MemoryNode = ({ data }) => {
  const {
    memoryName = "Shared Memory",
    memoryType = "simple", // simple, structured, vector, etc.
    memoryDescription = "Shared memory for agent collaboration",
    memorySize = 0,
    onEdit,
    onView
  } = data;

  const getMemoryIcon = () => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
      <path d="M17,17H7V7H17M21,11V9H19V7C19,5.89 18.1,5 17,5H15V3H13V5H11V3H9V5H7C5.89,5 5,5.89 5,7V9H3V11H5V13H3V15H5V17A2,2 0 0,0 7,19H9V21H11V19H13V21H15V19H17A2,2 0 0,0 19,17V15H21V13H19V11M13,13H11V11H13Z" />
    </svg>
  );

  const getViewIcon = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="white">
      <path d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z" />
    </svg>
  );

  // Calculate color based on memory type
  const getBackgroundColor = () => {
    switch (memoryType) {
      case 'structured':
        return '#00bcd4'; // Cyan for structured memory
      case 'vector':
        return '#795548'; // Brown for vector memory
      case 'persistent':
        return '#673ab7'; // Deep purple for persistent memory
      default:
        return '#546e7a'; // Blue-grey for simple memory
    }
  };

  // Format memory size as human-readable
  const formatMemorySize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const bgColor = getBackgroundColor();
  const formattedSize = formatMemorySize(memorySize);

  return (
    <div 
      className="agent-flow-node memory" 
      style={{ backgroundColor: bgColor }}
      title={memoryDescription}
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
        {memoryName}
      </div>
      
      <div className="node-attributes">
        <div className="attribute-chip">
          {memoryType}
        </div>
        {memorySize > 0 && (
          <div className="attribute-chip">
            {formattedSize}
          </div>
        )}
      </div>
      
      <div className="node-icons">
        {getMemoryIcon()}
      </div>
      
      <div className="node-actions">
        <button 
          className="node-action-button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit && onEdit();
          }}
          title="Configure Memory"
        >
          Edit
        </button>
        
        <button 
          className="node-action-button view"
          onClick={(e) => {
            e.stopPropagation();
            onView && onView();
          }}
          title="View Memory Contents"
        >
          {getViewIcon()}
        </button>
      </div>
    </div>
  );
};

export default memo(MemoryNode);