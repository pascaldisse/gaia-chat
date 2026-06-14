import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { AttributeAgent, HiveMindSummary } from '../../services/hiveMindService';
import { useProvider } from '../../context/ProviderContext';
import './GaiaHive.css';

const EMPTY_ATTRS = Object.freeze({});

const GaiaHiveSimple = ({ query, onResponse, attributes = EMPTY_ATTRS }) => {
  const { provider, getDefaultModel } = useProvider();
  const defaultModel = getDefaultModel();

  // Validate incoming attribute models against the current provider's model list
  const sanitizedAttributes = useMemo(() => {
    const validModelIds = new Set(Object.values(provider.models || {}));
    const result = {};
    for (const [key, attr] of Object.entries(attributes)) {
      result[key] = {
        ...attr,
        model: attr.model && validModelIds.has(attr.model) ? attr.model : defaultModel
      };
    }
    return result;
  }, [attributes, provider.models, defaultModel]);
  const [state, setState] = useState({
    isProcessing: false,
    activeAgents: [],
    conversation: [],
    finalSummary: null,
    currentRound: 0,
    winningAgent: null
  });

  // Default attributes if not provided — use the provider's default model
  const defaultAttributes = {
    autonomy: { value: 4, description: "Respect for freedom of thought, choice, and self-determination", model: defaultModel },
    compassion: { value: 3, description: "Capacity to alleviate suffering and emotional distress", model: defaultModel },
    creativity: { value: 2, description: "Value placed on expression, invention, and innovation", model: defaultModel },
    truthRecognition: { value: 3, description: "Commitment to understanding reality, even when painful", model: defaultModel },
    collectiveFlourishin: { value: 3, description: "Preference for actions that benefit many rather than few", model: defaultModel },
  };

  // Combine default with provided (sanitized) attributes
  const combinedAttributes = { ...defaultAttributes, ...sanitizedAttributes };

  // rAF throttle for per-token parent updates
  const onResponseRef = useRef(onResponse);
  useEffect(() => { onResponseRef.current = onResponse; });
  const pendingRef = useRef(null);
  const rafRef = useRef(null);

  const scheduleParentUpdate = useCallback((text, responses) => {
    pendingRef.current = { text, responses };
    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(() => {
        const p = pendingRef.current;
        rafRef.current = null;
        pendingRef.current = null;
        if (p) onResponseRef.current(p.text, p.responses);
      });
    }
  }, []);

  const flushParentUpdate = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    const p = pendingRef.current;
    pendingRef.current = null;
    if (p) onResponseRef.current(p.text, p.responses);
  }, []);

  // Process the query and start the agent conversation with streaming
  const processQuery = async (token) => {
    console.log('HIVE: Processing query:', query);
    if (!query || state.isProcessing) return;
    if (token.cancelled) return;

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
          model: attr.model || defaultModel
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
          
          // Schedule throttled parent update via rAF
          if (token.cancelled) return;
          scheduleParentUpdate('', updatedResponses);
        })
      );

      // Wait for all agent responses to complete
      const finalAgentResponses = await Promise.all(responsePromises);
      console.log('HIVE: Complete agent responses:', finalAgentResponses);
      if (token.cancelled) return;

      // Update conversation with the final responses
      setState(prev => ({ ...prev, conversation: finalAgentResponses }));

      // Create summary agent and start generating the final response with streaming
      const hiveMind = new HiveMindSummary();
      const summaryModel = defaultModel; // Use the selected provider's default model for summary
      
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
          
          // Stream throttled partial summary to the parent component
          if (token.cancelled) return;
          scheduleParentUpdate(currentSummary, finalAgentResponses);
        }
      );
      
      console.log('HIVE: Final complete summary:', finalSummary);
      
      if (token.cancelled) return;
      
      // Guarantee final summary delivered exactly once
      flushParentUpdate();
      
      // Determine winning agent based on attribute value
      const winningAgent = participatingAttributes.reduce((prev, current) => 
        (current.value > prev.value) ? current : prev
      );

      // Update state with final results
      // Bug A fix: do NOT re-dispatch already-streamed summary.
      // The streaming callback above already delivered the complete final text.
      setState(prev => ({ 
        ...prev, 
        isProcessing: false,
        winningAgent: winningAgent
      }));
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
    if (!query) return;
    const token = { cancelled: false };
    processQuery(token);
    return () => {
      token.cancelled = true;
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
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

export default React.memo(GaiaHiveSimple);