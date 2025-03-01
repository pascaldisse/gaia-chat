import React, { useState, useEffect } from 'react';
import '../../styles/personas/PersonaAttributesEditor.css';
import ToolsPopup from './ToolsPopup';
import FormatRuleEditor from './FormatRuleEditor';

const PersonaAttributesEditor = ({ persona, onChange }) => {
  // Prevent event propagation to parent containers
  const stopPropagation = (e) => {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
  };
  const [showToolsPopup, setShowToolsPopup] = useState(false);
  const [formattingExpanded, setFormattingExpanded] = useState(false);
  const [customFormattingExpanded, setCustomFormattingExpanded] = useState(false);

  // Default format rules templates to offer
  const formatRuleTemplates = [
    {
      name: "Speech",
      startTag: "<speech>",
      endTag: "</speech>",
      markdownFormat: "**{{content}}**",
      renderIncomplete: true,
      incompleteMarkdown: "*typing...*",
      enabled: true
    },
    {
      name: "Action",
      startTag: "<action>",
      endTag: "</action>",
      markdownFormat: "*{{content}}*",
      renderIncomplete: true,
      incompleteMarkdown: "*{{content}}*",
      enabled: true
    },
    {
      name: "Function",
      startTag: "<function>",
      endTag: "</function>",
      markdownFormat: "```\n{{content}}\n```",
      renderIncomplete: false,
      enabled: true
    },
    {
      name: "Speech with Character",
      startTag: '<speech as="',
      endTag: '</speech>',
      markdownFormat: "**{{content}}**",
      renderIncomplete: false,
      enabled: false
    }
  ];

  // Initialize default format settings if not present
  useEffect(() => {
    if (!persona.formatSettings) {
      onChange({
        ...persona,
        formatSettings: { 
          useRoleplayMarkdown: false,
          customFormatting: false,
          formatRules: []
        }
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
  
  const addFormatRule = (template = null) => {
    const newRule = template || {
      name: `Rule ${(persona.formatSettings?.formatRules?.length || 0) + 1}`,
      startTag: "<tag>",
      endTag: "</tag>",
      markdownFormat: "**{{content}}**",
      renderIncomplete: false,
      enabled: true
    };
    
    onChange({
      ...persona,
      formatSettings: {
        ...persona.formatSettings,
        formatRules: [...(persona.formatSettings?.formatRules || []), newRule]
      }
    });
  };
  
  const updateFormatRule = (index, updatedRule) => {
    const updatedRules = [...(persona.formatSettings?.formatRules || [])];
    updatedRules[index] = updatedRule;
    
    onChange({
      ...persona,
      formatSettings: {
        ...persona.formatSettings,
        formatRules: updatedRules
      }
    });
  };
  
  const removeFormatRule = (index) => {
    const updatedRules = [...(persona.formatSettings?.formatRules || [])];
    updatedRules.splice(index, 1);
    
    onChange({
      ...persona,
      formatSettings: {
        ...persona.formatSettings,
        formatRules: updatedRules
      }
    });
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
    <div className="persona-attributes-editor" onClick={stopPropagation}>
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
        <h3 onClick={(e) => {
          stopPropagation(e);
          setFormattingExpanded(!formattingExpanded);
        }} style={{ cursor: 'pointer' }}>
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
<action as="Character">waves hand excitedly</action>
<function>generate_image("description")</function>`}</pre>
                  <p>Will be displayed as:</p>
                  <div className="example-output">
                    <p><strong>Character:</strong> Hello there!</p>
                    <p><em>Character waves hand excitedly</em></p>
                    <p><code>generate_image("description")</code></p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="format-option">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={persona.formatSettings?.customFormatting || false}
                  onChange={(e) => {
                    // If enabling custom formatting for the first time, add some default rules
                    if (e.target.checked && (!persona.formatSettings?.formatRules || persona.formatSettings.formatRules.length === 0)) {
                      onChange({
                        ...persona,
                        formatSettings: {
                          ...persona.formatSettings,
                          customFormatting: true,
                          formatRules: [formatRuleTemplates[0], formatRuleTemplates[1]]
                        }
                      });
                    } else {
                      handleFormatSettingChange('customFormatting', e.target.checked)
                    }
                  }}
                />
                Use Custom Tag Formatting
              </label>
              <p className="format-description">
                Define custom formatting rules for specific HTML-like tags.
              </p>
              
              {persona.formatSettings?.customFormatting && (
                <div className="custom-formatting-section">
                  <h4 onClick={(e) => {
                    stopPropagation(e);
                    setCustomFormattingExpanded(!customFormattingExpanded);
                  }} style={{ cursor: 'pointer' }}>
                    Format Rules {customFormattingExpanded ? '▼' : '►'}
                  </h4>
                  
                  {customFormattingExpanded && (
                    <>
                      <p>Define how specific tags should be formatted in chat messages.</p>
                      
                      {/* Rule editors */}
                      {persona.formatSettings?.formatRules?.map((rule, index) => (
                        <FormatRuleEditor
                          key={index}
                          rule={rule}
                          index={index}
                          onUpdate={updateFormatRule}
                          onRemove={removeFormatRule}
                        />
                      ))}
                      
                      {/* Add rule button */}
                      <button className="add-rule-button" onClick={() => addFormatRule()}>
                        + Add Custom Rule
                      </button>
                      
                      {/* Template buttons */}
                      <div className="template-section">
                        <h4>Add from templates:</h4>
                        <div className="template-buttons">
                          {formatRuleTemplates.map((template, index) => (
                            <button 
                              key={index}
                              className="template-button"
                              onClick={() => addFormatRule({...template})}
                            >
                              {template.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
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