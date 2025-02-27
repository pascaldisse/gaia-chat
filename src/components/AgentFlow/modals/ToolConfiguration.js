import React, { useState } from 'react';
import './Modal.css';

const ToolConfiguration = ({ toolData, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    toolName: toolData?.toolName || '',
    toolDescription: toolData?.toolDescription || '',
    toolType: toolData?.toolType || 'generic',
    toolConfig: toolData?.toolConfig || {}
  });
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleConfigChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      toolConfig: {
        ...prev.toolConfig,
        [name]: type === 'checkbox' ? checked : value
      }
    }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };
  
  // Render specific config form based on tool type
  const renderToolConfig = () => {
    switch (formData.toolType) {
      case 'search':
        return (
          <>
            <div className="form-group">
              <label>Search Type</label>
              <select 
                name="searchType" 
                value={formData.toolConfig.searchType || 'knowledge'}
                onChange={handleConfigChange}
              >
                <option value="knowledge">Knowledge Base</option>
                <option value="vector">Vector Database</option>
                <option value="web">Web Search</option>
              </select>
            </div>
            <div className="form-group">
              <label>Max Results</label>
              <input
                type="number"
                name="maxResults"
                min="1"
                max="10" 
                value={formData.toolConfig.maxResults || 3}
                onChange={handleConfigChange}
              />
            </div>
          </>
        );
        
      case 'files':
        return (
          <>
            <div className="form-group">
              <label>File Formats</label>
              <div className="checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="pdf"
                    checked={formData.toolConfig.pdf || false}
                    onChange={handleConfigChange}
                  />
                  PDF
                </label>
                <label>
                  <input
                    type="checkbox"
                    name="text"
                    checked={formData.toolConfig.text || false}
                    onChange={handleConfigChange}
                  />
                  Text
                </label>
                <label>
                  <input
                    type="checkbox"
                    name="office"
                    checked={formData.toolConfig.office || false}
                    onChange={handleConfigChange}
                  />
                  Office
                </label>
              </div>
            </div>
          </>
        );
        
      case 'image':
        return (
          <>
            <div className="form-group">
              <label>Model</label>
              <select 
                name="model" 
                value={formData.toolConfig.model || 'flux_schnell'}
                onChange={handleConfigChange}
              >
                <option value="flux_schnell">Flux Schnell (Fast)</option>
                <option value="flux_dev">Flux Dev</option>
              </select>
            </div>
            <div className="form-group">
              <label>Style Presets</label>
              <select 
                name="style" 
                value={formData.toolConfig.style || 'realistic'}
                onChange={handleConfigChange}
              >
                <option value="realistic">Realistic</option>
                <option value="anime">Anime</option>
                <option value="cartoon">Cartoon</option>
              </select>
            </div>
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  name="enhance"
                  checked={formData.toolConfig.enhance || true}
                  onChange={handleConfigChange}
                />
                Enhance Prompts
              </label>
            </div>
          </>
        );
        
      case 'dice':
        return (
          <>
            <div className="form-group">
              <label>Default Dice Type</label>
              <select 
                name="defaultDice" 
                value={formData.toolConfig.defaultDice || 'd20'}
                onChange={handleConfigChange}
              >
                <option value="d4">D4</option>
                <option value="d6">D6</option>
                <option value="d8">D8</option>
                <option value="d10">D10</option>
                <option value="d12">D12</option>
                <option value="d20">D20</option>
                <option value="d100">D100</option>
              </select>
            </div>
            <div className="form-group">
              <label>Max Dice Count</label>
              <input
                type="number"
                name="maxCount"
                min="1"
                max="100" 
                value={formData.toolConfig.maxCount || 10}
                onChange={handleConfigChange}
              />
            </div>
          </>
        );
        
      default:
        return (
          <div className="form-group">
            <p>No additional configuration needed.</p>
          </div>
        );
    }
  };
  
  return (
    <div className="agent-modal-backdrop">
      <div className="agent-modal">
        <div className="agent-modal-header">
          <h3>Configure Tool</h3>
          <button 
            className="agent-modal-close" 
            onClick={onCancel}
          >
            &times;
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="agent-modal-content">
          <div className="form-group">
            <label>Tool Type</label>
            <select 
              name="toolType" 
              value={formData.toolType}
              onChange={handleChange}
            >
              <option value="generic">Generic Tool</option>
              <option value="search">Search Tool</option>
              <option value="files">File Tool</option>
              <option value="image">Image Generation</option>
              <option value="dice">Dice Rolling</option>
              <option value="web">Web Access</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Tool Name</label>
            <input
              type="text"
              name="toolName"
              placeholder="Enter tool name..."
              value={formData.toolName}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Description</label>
            <textarea
              name="toolDescription"
              placeholder="Describe what this tool does..."
              value={formData.toolDescription}
              onChange={handleChange}
              rows={3}
              required
            />
          </div>
          
          <div className="tool-specific-config">
            <h4>Tool Configuration</h4>
            {renderToolConfig()}
          </div>
          
          <div className="agent-modal-footer">
            <button 
              type="button" 
              className="agent-modal-button cancel" 
              onClick={onCancel}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="agent-modal-button save"
            >
              Save Tool
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ToolConfiguration;