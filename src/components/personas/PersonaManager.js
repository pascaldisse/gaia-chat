import React, { useState } from 'react';
import Persona from '../../models/Persona';
import { personaDB } from '../../services/db';

const PersonaManager = ({ onPersonaUpdate, onClose }) => {
  const [personas, setPersonas] = useState([]);
  const [currentPersona, setCurrentPersona] = useState(new Persona({}));

  const handleSave = async () => {
    const persona = new Persona(currentPersona);
    await personaDB.savePersona(persona);
    onPersonaUpdate(await personaDB.getAllPersonas());
    onClose();
  };

  return (
    <div className="persona-manager-modal">
      <div className="modal-content">
        <div className="persona-editor">
          <input 
            value={currentPersona.name}
            onChange={(e) => setCurrentPersona({...currentPersona, name: e.target.value})}
            placeholder="Persona Name"
          />
          <textarea
            value={currentPersona.systemPrompt}
            onChange={(e) => setCurrentPersona({...currentPersona, systemPrompt: e.target.value})}
            placeholder="System Prompt"
            rows={6}
          />
          {/* Add file upload and example dialogue components */}
        </div>
        <button onClick={onClose}>Cancel</button>
        <button onClick={handleSave}>Save</button>
      </div>
    </div>
  );
};

export default PersonaManager;

