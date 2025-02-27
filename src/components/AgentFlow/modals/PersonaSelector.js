import React, { useState, useEffect } from 'react';
import './Modal.css';

const PersonaSelector = ({ personas, onSelect, onCancel }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPersonas, setFilteredPersonas] = useState([]);
  
  useEffect(() => {
    if (personas) {
      setFilteredPersonas(
        personas.filter(persona => 
          persona.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
  }, [personas, searchTerm]);
  
  return (
    <div className="agent-modal-backdrop">
      <div className="agent-modal">
        <div className="agent-modal-header">
          <h3>Select Persona</h3>
          <button 
            className="agent-modal-close" 
            onClick={onCancel}
          >
            &times;
          </button>
        </div>
        
        <div className="agent-modal-search">
          <input 
            type="text"
            placeholder="Search personas..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="agent-modal-content persona-list">
          {filteredPersonas.length === 0 ? (
            <div className="no-personas">No personas found</div>
          ) : (
            filteredPersonas.map(persona => (
              <div 
                key={persona.id} 
                className="persona-item"
                onClick={() => onSelect(persona)}
              >
                <div className="persona-icon">
                  {persona.image ? (
                    <img src={persona.image} alt={persona.name} />
                  ) : (
                    <div className="persona-avatar">
                      {persona.name.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="persona-details">
                  <div className="persona-name">{persona.name}</div>
                  <div className="persona-model">{persona.model}</div>
                  <div className="persona-attributes">
                    <span title="Initiative">🎲 {persona.initiative || 5}</span>
                    <span title="Creativity">✨ {persona.creativity || 5}</span>
                    <span title="Empathy">❤️ {persona.empathy || 5}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="agent-modal-footer">
          <button 
            className="agent-modal-button cancel" 
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default PersonaSelector;