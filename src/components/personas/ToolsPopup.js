import React from 'react';
import '../../styles/personas/ToolsPopup.css';

const availableTools = [
  { name: 'dice_roll', label: 'Dice Roll', description: 'Roll polyhedral dice' },
  { name: 'image_generation', label: 'Image Generation', description: 'Generate images from text' }
];

export default function ToolsPopup({ tools, onUpdate, onClose }) {
  const [localTools, setLocalTools] = React.useState(tools);

  const handleToggle = (toolName) => {
    setLocalTools(prev => ({
      ...prev,
      [toolName]: !prev[toolName]
    }));
  };

  const handleSave = () => {
    onUpdate(localTools);
    onClose();
  };

  return (
    <div className="tools-popup">
      <div className="tools-content">
        <h3>Available Tools</h3>
        <button className="close-button" onClick={onClose}>×</button>
        <div className="tools-list">
          {availableTools.map(tool => (
            <div key={tool.name} className="tool-item">
              <label>
                <input
                  type="checkbox"
                  checked={localTools[tool.name] || false}
                  onChange={() => handleToggle(tool.name)}
                />
                <div className="tool-info">
                  <span className="tool-name">{tool.label}</span>
                  <span className="tool-description">{tool.description}</span>
                </div>
              </label>
            </div>
          ))}
        </div>
        <div className="modal-footer">
          <button className="save-button" onClick={handleSave}>
            Save Tools
          </button>
        </div>
      </div>
    </div>
  );
} 