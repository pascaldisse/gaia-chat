import React, { useState, useEffect } from 'react';
import { MODELS } from '../../config';
import Persona from '../../models/Persona';
import { personaDB } from '../../services/db';

const PersonaManager = ({ persona, onPersonaUpdate, onClose }) => {
  const [currentPersona, setCurrentPersona] = useState(
    persona || new Persona({ name: '', systemPrompt: '', model: MODELS.LLAMA3_70B })
  );

  useEffect(() => {
    if (persona) {
      setCurrentPersona(persona);
    }
  }, [persona]);

  const handleSave = async () => {
    const updatedPersona = new Persona({
      ...currentPersona,
      updatedAt: Date.now()
    });
    await onPersonaUpdate(updatedPersona);
    onClose();
  };

  return (
    <div className="persona-manager-modal">
      <div className="modal-content">
        <h2>{persona ? 'Edit Persona' : 'New Persona'}</h2>
        <div className="persona-editor">
          <input 
            value={currentPersona.name}
            onChange={(e) => setCurrentPersona({...currentPersona, name: e.target.value})}
            placeholder="Persona Name"
          />
          <input 
            value={currentPersona.image}
            onChange={(e) => setCurrentPersona({...currentPersona, image: e.target.value})}
            placeholder="Image URL"
          />
          <select
            value={currentPersona.model}
            onChange={(e) => setCurrentPersona({...currentPersona, model: e.target.value})}
          >
            {Object.entries(MODELS).map(([key, value]) => (
              <option key={key} value={value}>{key}</option>
            ))}
          </select>
          <textarea
            value={currentPersona.systemPrompt}
            onChange={(e) => setCurrentPersona({...currentPersona, systemPrompt: e.target.value})}
            placeholder="System Prompt"
            rows={6}
          />
        </div>
        <div className="modal-actions">
          <button onClick={onClose}>Cancel</button>
          <button onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
};

export default PersonaManager;

