import React, { useState, useEffect } from 'react';
import '../../styles/personas/PersonaAttributesEditor.css';
import ToolsPopup from './ToolsPopup';

const PersonaAttributesEditor = ({ persona, onChange }) => {
  const [showToolsPopup, setShowToolsPopup] = useState(false);
  const [formattingExpanded, setFormattingExpanded] = useState(false);

  // Initialize default format settings if not present
  useEffect(() => {
    if (!persona.formatSettings) {
      onChange({
        ...persona,
        formatSettings: { useRoleplayMarkdown: false }
      });
    }
  }, [persona, onChange]);
  
  const handleAttributeChange = (attribute, value) => {
    onChange({
      ...persona,
      [attribute]: parseInt(value, 10)
    });
  };

  const handleFormatSettingChange = (setting, value) => {
    onChange({
      ...persona,
      formatSettings: {
        ...persona.formatSettings,
        [setting]: value
      }
    });
  };

  const handleToolsPopupClose = (updatedToolConfig) => {
    setShowToolsPopup(false);
    
    if (updatedToolConfig) {
      onChange({
        ...persona,
        agentSettings: {
          ...persona.agentSettings,
          toolConfig: updatedToolConfig
        }
      });
    }
  };

  const attributes = [
    { name: 'initiative', label: 'Initiative', description: 'How likely the persona is to start conversations' },
    { name: 'talkativeness', label: 'Talkativeness', description: 'How much the persona tends to talk' },
    { name: 'confidence', label: 'Confidence', description: 'How sure the persona is about their statements' },
    { name: 'curiosity', label: 'Curiosity', description: 'How interested the persona is in asking questions' },
    { name: 'empathy', label: 'Empathy', description: 'How much the persona considers others\' feelings' },
    { name: 'creativity', label: 'Creativity', description: 'How original and innovative the persona\'s ideas are' },
    { name: 'humor', label: 'Humor', description: 'How often the persona uses humor in conversation' },
    { name: 'adaptability', label: 'Adaptability', description: 'How well the persona adjusts to changing conversation topics' },
    { name: 'patience', label: 'Patience', description: 'How tolerant the persona is of repetition or confusion' },
    { name: 'skepticism', label: 'Skepticism', description: 'How likely the persona is to question information' },
    { name: 'optimism', label: 'Optimism', description: 'How positively the persona views situations' }
  ];

  return (
    <div className="persona-attributes-editor">
      <div className="attribute-section">
        <h3>Persona Attributes</h3>
        <p className="attribute-description">Adjust these attributes to shape the persona's behavior and conversation style.</p>
        
        {attributes.map(attr => (
          <div className="attribute-slider" key={attr.name}>
            <label title={attr.description}>
              {attr.label}
              <div className="slider-container">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={persona[attr.name] || 5}
                  onChange={(e) => handleAttributeChange(attr.name, e.target.value)}
                />
                <span className="slider-value">{persona[attr.name] || 5}</span>
              </div>
            </label>
          </div>
        ))}
      </div>

      <div className="tools-section">
        <h3>Persona Tools</h3>
        <p className="tools-description">Configure which tools this persona can use during conversations.</p>
        <button 
          className="configure-tools-button" 
          onClick={() => setShowToolsPopup(true)}
        >
          Configure Tools
        </button>
      </div>
      
      <div className="formatting-section">
        <h3 onClick={() => setFormattingExpanded(!formattingExpanded)} style={{ cursor: 'pointer' }}>
          Message Formatting {formattingExpanded ? '▼' : '►'}
        </h3>
        
        {formattingExpanded && (
          <>
            <p className="formatting-description">
              Configure how this persona's messages are displayed in chat.
            </p>
            
            <div className="format-option">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={persona.formatSettings?.useRoleplayMarkdown || false}
                  onChange={(e) => handleFormatSettingChange('useRoleplayMarkdown', e.target.checked)}
                />
                Use Roleplay Markdown
              </label>
              <p className="format-description">
                Converts roleplay tags like &lt;speech&gt; and &lt;action&gt; into formatted markdown.
              </p>
              
              {persona.formatSettings?.useRoleplayMarkdown && (
                <div className="format-example">
                  <h4>Example:</h4>
                  <pre>{`<speech as="Character">Hello there!</speech>
<action as="Character">waves hand excitedly</action>`}</pre>
                  <p>Will be displayed as:</p>
                  <div className="example-output">
                    <p><strong>Character:</strong> Hello there!</p>
                    <p><em>Character waves hand excitedly</em></p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {showToolsPopup && (
        <ToolsPopup
          persona={persona}
          onClose={handleToolsPopupClose}
        />
      )}
    </div>
  );
};

export default PersonaAttributesEditor;