import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

// Tool node component
const ToolNode = ({ data }) => {
  const {
    toolType = 'generic',
    toolName = 'Select Tool',
    toolDescription = 'No description',
    toolConfig = {},
    onConfigure
  } = data;

  // Get tool icon based on type
  const getToolIcon = () => {
    switch (toolType) {
      case 'search':
        return (
          <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
          </svg>
        );
      case 'files':
        return (
          <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
            <path d="M6 2c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6H6zm7 7V3.5L18.5 9H13z" />
          </svg>
        );
      case 'image':
        return (
          <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
          </svg>
        );
      case 'dice':
        return (
          <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
            <path d="M19 3H5C3.9 3 3 3.9 3 5v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 16H7v-2h10v2zm0-4H7v-2h10v2zm0-4H7V9h10v2zm0-4H7V5h10v2z" />
          </svg>
        );
      case 'web':
        return (
          <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
            <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm6.93 6h-2.95c-.32-1.25-.78-2.45-1.38-3.56 1.84.63 3.37 1.91 4.33 3.56zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2 0 .68.06 1.34.14 2H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56-1.84-.63-3.37-1.9-4.33-3.56zm2.95-8H5.08c.96-1.66 2.49-2.93 4.33-3.56C8.81 5.55 8.35 6.75 8.03 8zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66c-.09-.66-.16-1.32-.16-2 0-.68.07-1.35.16-2h4.68c.09.65.16 1.32.16 2 0 .68-.07 1.34-.16 2zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95c-.96 1.65-2.49 2.93-4.33 3.56zM16.36 14c.08-.66.14-1.32.14-2 0-.68-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z" />
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
            <path d="M22 9V7h-2V5c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-2h2v-2h-2v-2h2v-2h-2V9h2zm-4 10H4V5h14v14zM6 13h5v4H6zm6-6h4v3h-4zm-6 0h5v5H6z" />
          </svg>
        );
    }
  };

  // Get background color based on tool type
  const getBackgroundColor = () => {
    switch (toolType) {
      case 'search':
        return '#FF9800'; // Orange
      case 'files':
        return '#4CAF50'; // Green
      case 'image':
        return '#E91E63'; // Pink
      case 'dice':
        return '#673AB7'; // Purple
      case 'web':
        return '#2196F3'; // Blue
      default:
        return '#607D8B'; // Blue Grey
    }
  };

  const bgColor = getBackgroundColor();

  return (
    <div 
      className="agent-flow-node tool" 
      style={{ backgroundColor: bgColor }}
      title={toolDescription}
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
      
      <div className="node-icons">
        {getToolIcon()}
      </div>
      
      <div className="node-label">
        {toolName}
      </div>
      
      <div className="node-description">
        {toolDescription.substring(0, 50)}
        {toolDescription.length > 50 ? '...' : ''}
      </div>
      
      <div className="node-actions">
        <button 
          className="node-action-button"
          onClick={(e) => {
            e.stopPropagation();
            onConfigure && onConfigure();
          }}
          title="Configure Tool"
        >
          Configure
        </button>
      </div>
    </div>
  );
};

export default memo(ToolNode);