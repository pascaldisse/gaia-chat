import React, { useState, useEffect } from 'react';
import { RPGSystem } from '../../utils/RPGSystem';
import './GaiaHive.css';

const GaiaHiveSimple = ({ query, onResponse, attributes = {} }) => {
  const [state, setState] = useState({
    isProcessing: false,
    activeAgents: [],
    conversation: [],
    finalSummary: null,
    currentRound: 0,
    winningAgent: null
  });

  // Default attributes if not provided
  const defaultAttributes = {
    autonomy: { value: 4, description: "Respect for freedom of thought, choice, and self-determination" },
    compassion: { value: 3, description: "Capacity to alleviate suffering and emotional distress" },
    creativity: { value: 2, description: "Value placed on expression, invention, and innovation" },
    truthRecognition: { value: 3, description: "Commitment to understanding reality, even when painful" },
    collectiveFlourishin: { value: 3, description: "Preference for actions that benefit many rather than few" },
  };

  // Combine default with provided attributes
  const combinedAttributes = { ...defaultAttributes, ...attributes };

  // Process the query and start the agent conversation
  const processQuery = async () => {
    console.log('SIMPLE: Processing query:', query);
    if (!query || state.isProcessing) return;

    setState(prev => ({ 
      ...prev, 
      isProcessing: true,
      conversation: [],
      finalSummary: null,
      currentRound: 1,
      winningAgent: null
    }));

    // Determine which attributes should participate
    const participatingAttributes = Object.entries(combinedAttributes)
      .filter(([key, attr]) => {
        return true; // All participate in simple version
      })
      .map(([key, attr]) => ({
        id: key,
        name: key.charAt(0).toUpperCase() + key.slice(1),
        value: attr.value,
        description: attr.description
      }));

    console.log('SIMPLE: Participating attributes:', participatingAttributes);
    setState(prev => ({ ...prev, activeAgents: participatingAttributes }));

    // Create conversation
    const conversation = [];
    for (const agent of participatingAttributes) {
      const message = `I am the ${agent.name} attribute with value ${agent.value}. For "${query}", I think we should consider my perspective.`;
      conversation.push({
        agent: agent.id,
        agentName: agent.name,
        message,
        roll: 10,
        total: 10 + agent.value,
        isWinner: agent.id === participatingAttributes[0].id
      });
    }

    console.log('SIMPLE: Generated conversation:', conversation);
    setState(prev => ({ ...prev, conversation }));

    // Generate summary
    const summary = `This is a simple summary for "${query}" considering all attributes.`;
    console.log('SIMPLE: Final summary:', summary);
    
    setState(prev => ({ 
      ...prev, 
      isProcessing: false,
      conversation,
      finalSummary: summary,
      winningAgent: participatingAttributes[0]
    }));

    onResponse(summary);
  };

  // Process the query when it changes
  useEffect(() => {
    console.log('SIMPLE: Effect triggered with query:', query);
    if (query) {
      processQuery();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <div className="gaia-hive-simple">
      <h2>Hive Mind Response</h2>
      
      <div className="simple-query">
        <strong>Query:</strong> {query || 'No query provided'}
      </div>
      
      {/* Show only if we have active agents but keep it simplified */}
      {state.activeAgents.length > 0 && (
        <div className="simple-agents">
          <div className="simple-agent-list">
            {state.activeAgents.map(agent => (
              <div key={agent.id} className="simple-agent">
                {agent.name}: {agent.value}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Only show if we have a final summary */}
      {state.finalSummary && (
        <div className="simple-summary">
          <h3>Response</h3>
          <div>{state.finalSummary}</div>
        </div>
      )}
    </div>
  );
};

export default GaiaHiveSimple;