import React, { useState, useEffect } from 'react';
import { AttributeAgent, HiveMindSummary } from '../../services/hiveMindService';
import { MODELS } from '../../config';
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
    autonomy: { value: 4, description: "Respect for freedom of thought, choice, and self-determination", model: MODELS.LLAMA3_70B },
    compassion: { value: 3, description: "Capacity to alleviate suffering and emotional distress", model: MODELS.LLAMA3_70B },
    creativity: { value: 2, description: "Value placed on expression, invention, and innovation", model: MODELS.LLAMA3_70B },
    truthRecognition: { value: 3, description: "Commitment to understanding reality, even when painful", model: MODELS.LLAMA3_70B },
    collectiveFlourishin: { value: 3, description: "Preference for actions that benefit many rather than few", model: MODELS.LLAMA3_70B },
  };

  // Combine default with provided attributes
  const combinedAttributes = { ...defaultAttributes, ...attributes };

  // Process the query and start the agent conversation
  const processQuery = async () => {
    console.log('HIVE: Processing query:', query);
    if (!query || state.isProcessing) return;

    setState(prev => ({ 
      ...prev, 
      isProcessing: true,
      conversation: [],
      finalSummary: null,
      currentRound: 1,
      winningAgent: null
    }));

    try {
      // Determine which attributes should participate
      const participatingAttributes = Object.entries(combinedAttributes)
        .map(([key, attr]) => ({
          id: key,
          name: key.charAt(0).toUpperCase() + key.slice(1),
          value: attr.value,
          description: attr.description,
          model: attr.model || MODELS.LLAMA3_70B
        }));

      console.log('HIVE: Participating attributes:', participatingAttributes);
      setState(prev => ({ ...prev, activeAgents: participatingAttributes }));

      // Create attribute agents and generate responses in parallel
      const attributeAgents = participatingAttributes.map(attr => 
        new AttributeAgent(attr.name, attr.value, attr.description, attr.model)
      );

      // Generate responses from all attribute agents
      const responsePromises = attributeAgents.map(agent => 
        agent.generateResponse(query)
      );

      // Wait for all agent responses
      const agentResponses = await Promise.all(responsePromises);
      console.log('HIVE: Agent responses:', agentResponses);

      // Update conversation with real responses
      setState(prev => ({ ...prev, conversation: agentResponses }));

      // Create summary agent and generate final response
      const hiveMind = new HiveMindSummary();
      const summaryModel = MODELS.MIXTRAL_8X22B; // Use a powerful model for summary
      const summary = await hiveMind.generateSummary(query, agentResponses, summaryModel);
      
      console.log('HIVE: Final summary:', summary);
      
      // Determine winning agent based on attribute value
      const winningAgent = participatingAttributes.reduce((prev, current) => 
        (current.value > prev.value) ? current : prev
      );

      // Update state with results
      setState(prev => ({ 
        ...prev, 
        isProcessing: false,
        conversation: agentResponses,
        finalSummary: summary,
        winningAgent: winningAgent
      }));

      // Send response and conversation history back
      onResponse(summary, agentResponses);
    } catch (error) {
      console.error('HIVE: Error processing query:', error);
      setState(prev => ({ 
        ...prev, 
        isProcessing: false,
        finalSummary: `Error: ${error.message}`
      }));
      
      onResponse(`Error: ${error.message}`);
    }
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