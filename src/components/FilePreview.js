import React from 'react';
import { knowledgeDB } from '../services/db';
import '../styles/FilePreview.css';

const FilePreview = ({ fileId, onDelete }) => {
  const [file, setFile] = React.useState(null);

  React.useEffect(() => {
    const loadFile = async () => {
      const data = await knowledgeDB.getFiles([fileId]);
      setFile(data[0]);
    };
    loadFile();
  }, [fileId]);

  if (!file) return null;

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