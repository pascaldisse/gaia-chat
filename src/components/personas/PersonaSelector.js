const PersonaSelector = ({ personas, selectedId, onSelect }) => (
    <div className="persona-selector">
      {personas.map(persona => (
        <div 
          key={persona.id}
          className={`persona-item ${selectedId === persona.id ? 'selected' : ''}`}
          onClick={() => onSelect(persona)}
        >
          <h4>{persona.name}</h4>
          <p>{persona.systemPrompt.substring(0, 50)}...</p>
        </div>
      ))}
    </div>
  );