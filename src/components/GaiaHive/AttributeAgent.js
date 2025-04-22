import React from 'react';
import './GaiaHive.css';

const AttributeAgent = ({ 
  agent, 
  message, 
  roll, 
  total, 
  isWinner
}) => {
  return (
    <div className={`attribute-agent ${isWinner ? 'winner' : ''}`}>
      <div className="agent-header">
        <div className="agent-name">{agent.name}</div>
        <div className="agent-roll">
          <span className="dice">🎲 {roll}</span>
          <span className="modifier">+{agent.value}</span>
          <span className="total">{total}</span>
          {isWinner && <span className="winner-badge">Winner</span>}
        </div>
      </div>
      <div className="agent-description">
        {agent.description}
      </div>
      <div className="agent-message">
        {message}
      </div>
    </div>
  );
};

export default AttributeAgent;