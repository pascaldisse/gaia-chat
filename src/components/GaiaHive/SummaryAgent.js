import React from 'react';
import './GaiaHive.css';

const SummaryAgent = ({ 
  conversation, 
  summary,
  query
}) => {
  // Collect the winning messages from each round
  const winningMessages = conversation
    .filter(msg => msg.isWinner)
    .sort((a, b) => a.round - b.round);

  return (
    <div className="summary-agent">
      <div className="summary-header">
        <h3>Collective Response</h3>
        <div className="query-text">Query: {query}</div>
      </div>
      
      <div className="winning-perspectives">
        <h4>Dominant Perspectives</h4>
        {winningMessages.map((msg, idx) => (
          <div key={idx} className="winning-message">
            <div className="winning-round">Round {msg.round}</div>
            <div className="winning-agent">{msg.agentName} (rolled {msg.total})</div>
            <div className="winning-content">{msg.message}</div>
          </div>
        ))}
      </div>
      
      <div className="final-synthesis">
        <h4>Synthesized Response</h4>
        <div className="synthesis-content">
          {summary}
        </div>
      </div>
    </div>
  );
};

export default SummaryAgent;