import React, { useState, useEffect } from 'react';
import '../../styles/personas/PersonaAttributesEditor.css';
import { getVoices } from '../../services/voiceService';

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
  const [voiceId, setVoiceId] = useState(persona.voiceId || '');
  const [availableVoices, setAvailableVoices] = useState([]);
  const [isLoadingVoices, setIsLoadingVoices] = useState(false);

  // Fetch available voices on component mount
  useEffect(() => {
    const fetchVoices = async () => {
      setIsLoadingVoices(true);
      try {
        const voices = await getVoices();
        setAvailableVoices(voices);
      } catch (error) {
        console.error('Failed to fetch voices:', error);
      } finally {
        setIsLoadingVoices(false);
      }
    };

    fetchVoices();
  }, []);

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

  const handleSave = () => {
    onSave({
      ...currentAttributes,
      voiceId
    });
  };

  return (
    <div className="attributes-editor-modal">
      <div className="attributes-content">
        <button className="close-button" onClick={onClose}>×</button>
        <h2>Personality Attributes</h2>

        {/* Voice Selection */}
        <div className="voice-selection">
          <h3>Voice Settings</h3>
          <div className="voice-selector">
            <label htmlFor="voice-select">Voice:</label>
            <select 
              id="voice-select"
              value={voiceId} 
              onChange={(e) => setVoiceId(e.target.value)}
              disabled={isLoadingVoices}
            >
              <option value="">None (No TTS)</option>
              {isLoadingVoices ? (
                <option value="" disabled>Loading voices...</option>
              ) : (
                availableVoices.map(voice => (
                  <option key={voice.voice_id} value={voice.voice_id}>
                    {voice.name}
                  </option>
                ))
              )}
              {/* Add Zonos voices as fallback */}
              <optgroup label="Zonos Voices">
                <option value="american_female">American Female</option>
                <option value="american_male">American Male</option>
                <option value="british_female">British Female</option>
                <option value="british_male">British Male</option>
                <option value="random">Random Voice</option>
              </optgroup>
            </select>
          </div>
          {voiceId && (
            <div className="voice-preview">
              <p>Selected voice: <strong>{availableVoices.find(v => v.voice_id === voiceId)?.name || 'Custom Voice'}</strong></p>
              <p className="voice-note">The voice will be used for text-to-speech when playing message content.</p>
            </div>
          )}
        </div>

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
          <button className="save-button" onClick={handleSave}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default PersonaAttributesEditor;