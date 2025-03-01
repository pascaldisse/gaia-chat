import React, { useState } from 'react';
import '../../styles/personas/FormatRuleEditor.css';

// Component for editing a single format rule
const FormatRuleEditor = ({ rule, index, onUpdate, onRemove }) => {
  // Prevent event propagation to parent containers
  const stopPropagation = (e) => {
    e.stopPropagation();
  };
  const [localRule, setLocalRule] = useState({...rule});
  const [showPreview, setShowPreview] = useState(false);
  const [previewText, setPreviewText] = useState(`${rule.startTag || '<tag>'}Example content${rule.endTag || '</tag>'}`);
  
  const handleChange = (field, value) => {
    const updatedRule = { ...localRule, [field]: value };
    setLocalRule(updatedRule);
    onUpdate(index, updatedRule);
  };
  
  // Generate a preview of how the formatting will look
  const renderPreview = () => {
    if (!localRule.startTag) return previewText;
    
    let formattedText = previewText;
    
    // For complete tag preview
    if (previewText.includes(localRule.startTag) && previewText.includes(localRule.endTag || '')) {
      const regex = new RegExp(`${localRule.startTag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(.*?)${(localRule.endTag || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gs');
      formattedText = formattedText.replace(regex, (match, capturedContent) => {
        return localRule.markdownFormat.replace('{{content}}', capturedContent);
      });
    }
    
    // For incomplete tag preview (if enabled)
    if (localRule.renderIncomplete && previewText.includes(localRule.startTag) && !previewText.includes(localRule.endTag || '')) {
      const contentText = previewText.split(localRule.startTag)[1] || '';
      const incompleteFormat = localRule.incompleteMarkdown || localRule.markdownFormat;
      formattedText = previewText.replace(new RegExp(`${localRule.startTag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(.*)$`, 'gs'), (match, capturedContent) => {
        return incompleteFormat.replace('{{content}}', capturedContent || contentText);
      });
    }
    
    return formattedText;
  };
  
  return (
    <div className="format-rule-editor" onClick={stopPropagation}>
      <div className="rule-header">
        <h4>Rule #{index + 1}{localRule.name ? `: ${localRule.name}` : ''}</h4>
        <button className="remove-rule-btn" onClick={(e) => {
          stopPropagation(e);
          onRemove(index);
        }}>Remove</button>
      </div>
      
      <div className="rule-fields">
        <div className="field-group">
          <label>
            Rule Name:
            <input 
              type="text" 
              value={localRule.name || ''} 
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="E.g., Speech Tags"
            />
          </label>
        </div>
        
        <div className="field-group">
          <label>
            <input
              type="checkbox"
              checked={localRule.enabled !== false}
              onChange={(e) => handleChange('enabled', e.target.checked)}
            />
            Enabled
          </label>
        </div>
        
        <div className="field-group">
          <label>
            Start Tag:
            <input 
              type="text" 
              value={localRule.startTag || ''} 
              onChange={(e) => handleChange('startTag', e.target.value)}
              placeholder="E.g., <speech>"
            />
          </label>
        </div>
        
        <div className="field-group">
          <label>
            End Tag:
            <input 
              type="text" 
              value={localRule.endTag || ''} 
              onChange={(e) => handleChange('endTag', e.target.value)}
              placeholder="E.g., </speech>"
            />
          </label>
        </div>
        
        <div className="field-group">
          <label>
            Markdown Format:
            <input 
              type="text" 
              value={localRule.markdownFormat || ''} 
              onChange={(e) => handleChange('markdownFormat', e.target.value)}
              placeholder="E.g., **{{content}}**"
            />
            <small>Use {'{{'+'content'+'}}'} to insert the tagged content</small>
          </label>
        </div>
        
        <div className="field-group">
          <label>
            <input
              type="checkbox"
              checked={localRule.renderIncomplete !== false}
              onChange={(e) => handleChange('renderIncomplete', e.target.checked)}
            />
            Render incomplete tags (during streaming)
          </label>
        </div>
        
        {localRule.renderIncomplete && (
          <div className="field-group">
            <label>
              Incomplete Tag Format:
              <input 
                type="text" 
                value={localRule.incompleteMarkdown || ''} 
                onChange={(e) => handleChange('incompleteMarkdown', e.target.value)}
                placeholder="E.g., *{{content}}*"
              />
              <small>Format for incomplete tags while streaming (optional)</small>
            </label>
          </div>
        )}
      </div>
      
      <div className="rule-preview">
        <div className="preview-header">
          <h4>Preview</h4>
          <button className="toggle-preview-btn" onClick={(e) => {
            stopPropagation(e);
            setShowPreview(!showPreview);
          }}>
            {showPreview ? 'Hide' : 'Show'}
          </button>
        </div>
        
        {showPreview && (
          <div className="preview-content">
            <div className="preview-input">
              <label>Test Text:</label>
              <input
                type="text"
                value={previewText}
                onChange={(e) => setPreviewText(e.target.value)}
                placeholder="Enter text with tags to preview"
              />
            </div>
            
            <div className="preview-output">
              <label>Output:</label>
              <div className="preview-formatted">
                {renderPreview()}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FormatRuleEditor;