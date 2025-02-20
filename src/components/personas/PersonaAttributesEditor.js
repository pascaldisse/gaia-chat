import React, { useState } from 'react';
import '../../styles/personas/PersonaAttributesEditor.css';

const PersonaAttributesEditor = ({ persona, onSave, onClose }) => {
  const [currentAttributes, setCurrentAttributes] = useState({
    initiative: persona.initiative || 5,
    talkativeness: persona.talkativeness || 5,
    confidence: persona.confidence || 5,
    curiosity: persona.curiosity || 5,
    empathy: persona.empathy || 5,
    creativity: persona.creativity || 5,
    humor: persona.humor || 5,
    adaptability: persona.adaptability || 5,
    patience: persona.patience || 5,
    skepticism: persona.skepticism || 5,
    optimism: persona.optimism || 5
  });

  const attributeLabels = {
    initiative: 'Initiative - How quickly they jump into conversations',
    talkativeness: 'Talkativeness - How often they speak up',
    confidence: 'Confidence - How assertive their responses are',
    curiosity: 'Curiosity - How often they ask questions',
    empathy: 'Empathy - How emotionally attuned they are',
    creativity: 'Creativity - How imaginative their responses are',
    humor: 'Humor - How often they use wit and jokes',
    adaptability: 'Adaptability - How well they adjust to new topics',
    patience: 'Patience - How long they wait before responding',
    skepticism: 'Skepticism - How likely they are to question statements',
    optimism: 'Optimism - How positive their responses tend to be'
  };

  return (
    <div className="attributes-editor-modal">
      <div className="attributes-content">
        <button className="close-button" onClick={onClose}>×</button>
        <h2>Personality Attributes</h2>
        <div className="attributes-grid">
          {Object.entries(currentAttributes).map(([key, value]) => (
            <div key={key} className="attribute-control">
              <label title={attributeLabels[key]}>{key}</label>
              <div className="attribute-slider">
                <span className="slider-label">Low</span>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={value}
                  onChange={(e) => setCurrentAttributes(prev => ({
                    ...prev,
                    [key]: parseInt(e.target.value)
                  }))}
                />
                <span className="slider-label">High</span>
                <div className="attribute-value">{value}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="modal-footer">
          <button className="save-button" onClick={() => onSave(currentAttributes)}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default PersonaAttributesEditor;