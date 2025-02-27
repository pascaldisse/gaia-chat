import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

// File node component
const FileNode = ({ data }) => {
  const {
    fileId,
    fileName = 'Select File',
    fileType = 'unknown',
    fileSize = '0 KB',
    onPreview,
    onSelect
  } = data;

  // Get file icon based on type
  const getFileIcon = () => {
    if (fileType?.includes('pdf')) {
      return (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
          <path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm10 5.5h1v-3h-1v3z" />
        </svg>
      );
    } else if (fileType?.includes('image')) {
      return (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
          <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
        </svg>
      );
    } else if (fileType?.includes('text') || fileType?.includes('csv')) {
      return (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
          <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
        </svg>
      );
    } else if (fileType?.includes('office') || fileName?.match(/\.(doc|xls|ppt)x?$/i)) {
      return (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
          <path d="M6 2c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6H6zm7 7V3.5L18.5 9H13z" />
        </svg>
      );
    } else {
      return (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
          <path d="M6 2c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6H6zm7 7V3.5L18.5 9H13z" />
        </svg>
      );
    }
  };

  return (
    <div 
      className="agent-flow-node file" 
      style={{ backgroundColor: '#607D8B' }}
      title={fileName}
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
        {getFileIcon()}
      </div>
      
      <div className="node-label">
        {fileName?.length > 20 ? fileName.substring(0, 17) + '...' : fileName}
      </div>
      
      <div className="node-file-info">
        <span className="file-type">{fileType?.split('/')[1] || 'unknown'}</span>
        <span className="file-size">{fileSize}</span>
      </div>
      
      <div className="node-actions">
        {fileId ? (
          <>
            <button 
              className="node-action-button preview"
              onClick={(e) => {
                e.stopPropagation();
                onPreview && onPreview(fileId);
              }}
              title="Preview File"
            >
              Preview
            </button>
          </>
        ) : (
          <button 
            className="node-action-button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect && onSelect();
            }}
            title="Select File"
          >
            Select
          </button>
        )}
      </div>
    </div>
  );
};

export default memo(FileNode);