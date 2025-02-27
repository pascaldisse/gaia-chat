import React, { useState, useEffect } from 'react';
import './Modal.css';

const FileSelector = ({ files, onSelect, onCancel, onUpload }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredFiles, setFilteredFiles] = useState([]);
  
  useEffect(() => {
    if (files) {
      setFilteredFiles(
        files.filter(file => 
          file.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
  }, [files, searchTerm]);
  
  // Helper to format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };
  
  // Get file icon based on type
  const getFileIcon = (fileType, fileName) => {
    if (fileType?.includes('pdf') || fileName?.endsWith('.pdf')) {
      return (
        <svg viewBox="0 0 24 24" width="24" height="24" fill="#ff5252">
          <path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm10 5.5h1v-3h-1v3z" />
        </svg>
      );
    } else if (fileType?.includes('image') || fileName?.match(/\.(jpe?g|png|gif|svg)$/i)) {
      return (
        <svg viewBox="0 0 24 24" width="24" height="24" fill="#4caf50">
          <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
        </svg>
      );
    } else if (fileType?.includes('text') || 
               fileName?.match(/\.(txt|csv|md|json)$/i)) {
      return (
        <svg viewBox="0 0 24 24" width="24" height="24" fill="#2196f3">
          <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
        </svg>
      );
    } else if (fileType?.includes('office') || 
               fileName?.match(/\.(docx?|xlsx?|pptx?)$/i)) {
      return (
        <svg viewBox="0 0 24 24" width="24" height="24" fill="#ff9800">
          <path d="M6 2c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6H6zm7 7V3.5L18.5 9H13z" />
        </svg>
      );
    } else {
      return (
        <svg viewBox="0 0 24 24" width="24" height="24" fill="#9e9e9e">
          <path d="M6 2c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6H6zm7 7V3.5L18.5 9H13z" />
        </svg>
      );
    }
  };
  
  return (
    <div className="agent-modal-backdrop">
      <div className="agent-modal">
        <div className="agent-modal-header">
          <h3>Select File</h3>
          <button 
            className="agent-modal-close" 
            onClick={onCancel}
          >
            &times;
          </button>
        </div>
        
        <div className="agent-modal-search">
          <input 
            type="text"
            placeholder="Search files..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="agent-modal-content file-list">
          {filteredFiles.length === 0 ? (
            <div className="no-files">
              <p>No files found</p>
              <button 
                className="agent-modal-button upload"
                onClick={onUpload}
              >
                Upload New File
              </button>
            </div>
          ) : (
            filteredFiles.map(file => (
              <div 
                key={file.id} 
                className="file-item"
                onClick={() => onSelect(file)}
              >
                <div className="file-icon">
                  {getFileIcon(file.type, file.name)}
                </div>
                <div className="file-details">
                  <div className="file-name">{file.name}</div>
                  <div className="file-info">
                    <span className="file-type">{file.type?.split('/')[1] || 'unknown'}</span>
                    <span className="file-size">{formatFileSize(file.size)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="agent-modal-footer">
          <button 
            className="agent-modal-button upload"
            onClick={onUpload}
          >
            Upload New File
          </button>
          <button 
            className="agent-modal-button cancel" 
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileSelector;