import React from 'react';
import { knowledgeDB } from '../services/db';
import '../styles/FilePreview.css';

const FilePreview = ({ fileId, onDelete }) => {
  const [file, setFile] = React.useState(null);

  React.useEffect(() => {
    console.log('[FilePreview] Loading file with ID:', fileId);
    const loadFile = async () => {
      try {
        const data = await knowledgeDB.getFiles([fileId]);
        console.log('[FilePreview] Loaded data:', data);
        console.log('[FilePreview] First file:', data[0]);
        setFile(data[0]);
      } catch (error) {
        console.error('[FilePreview] Error loading file:', error);
      }
    };
    loadFile();
  }, [fileId]);

  console.log('[FilePreview] Current file state:', file);
  if (!file) {
    console.log('[FilePreview] No file to render, returning null');
    return null;
  }

  const getFileIcon = (type) => {
    if (type.includes('image')) return '🖼️';
    if (type.includes('pdf')) return '📄';
    if (type.includes('word')) return '📝';
    if (type.includes('excel') || type.includes('spreadsheet')) return '📊';
    return '📁';
  };

  return (
    <div className="file-preview">
      <span className="file-icon">{getFileIcon(file.type)}</span>
      <span className="file-name">{file.name}</span>
      <button className="delete-file" onClick={() => onDelete(file.id)}>×</button>
    </div>
  );
};

export default FilePreview;