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

  // Process the query and start the agent conversation with streaming
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

      // Create attribute agents
      const attributeAgents = participatingAttributes.map(attr => 
        new AttributeAgent(attr.name, attr.value, attr.description, attr.model)
      );

      // Create an array to store the latest responses
      let currentResponses = participatingAttributes.map(attr => ({
        agent: attr.id,
        agentName: attr.name,
        message: "",
        model: attr.model,
        value: attr.value
      }));

      // Update the conversation state with empty messages initially
      setState(prev => ({ ...prev, conversation: [...currentResponses] }));

      // Start streaming responses from all attribute agents concurrently
      const responsePromises = attributeAgents.map((agent, index) => 
        agent.generateResponse(query, [], (updatedResponse) => {
          // Create a copy of the current responses array
          const updatedResponses = [...currentResponses];
          
          // Update the specific agent's response
          updatedResponses[index] = updatedResponse;
          
          // Update our tracking array
          currentResponses = updatedResponses;
          
          // Update the state
          setState(prev => ({ ...prev, conversation: updatedResponses }));
          
          // Stream partial responses to the parent component
          onResponse("", updatedResponses);
        })
      );

      // Wait for all agent responses to complete
      const finalAgentResponses = await Promise.all(responsePromises);
      console.log('HIVE: Complete agent responses:', finalAgentResponses);

      // Update conversation with the final responses
      setState(prev => ({ ...prev, conversation: finalAgentResponses }));

      // Create summary agent and start generating the final response with streaming
      const hiveMind = new HiveMindSummary();
      const summaryModel = MODELS.MIXTRAL_8X22B; // Use a powerful model for summary
      
      // Start streaming summary generation
      let currentSummary = "";
      
      const finalSummary = await hiveMind.generateSummary(
        query, 
        finalAgentResponses, 
        summaryModel,
        (summaryUpdate) => {
          // Update our current summary
          currentSummary = summaryUpdate;
          
          // Update the state
          setState(prev => ({ ...prev, finalSummary: currentSummary }));
          
          // Stream the partial summary to the parent component
          onResponse(currentSummary, finalAgentResponses);
        }
      );
      
      console.log('HIVE: Final complete summary:', finalSummary);
      
      // Determine winning agent based on attribute value
      const winningAgent = participatingAttributes.reduce((prev, current) => 
        (current.value > prev.value) ? current : prev
      );

      // Update state with final results
      setState(prev => ({ 
        ...prev, 
        isProcessing: false,
        conversation: finalAgentResponses,
        finalSummary: finalSummary,
        winningAgent: winningAgent
      }));

      // Send final response and conversation history back
      onResponse(finalSummary, finalAgentResponses);
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
      <h2>Hive Mind Processing</h2>
      
      {/* Process the query and generate the responses, 
          but don't display anything in the UI */}
      {query && state.isProcessing && (
        <div className="processing-indicator">
          Processing query: {query}...
        </div>
      )}
      
      {/* Hidden but still functional for the onResponse callback */}
      <div style={{ display: 'none' }}>
        {state.finalSummary}
      </div>
    </div>
  );
};

export default GaiaHiveSimple;