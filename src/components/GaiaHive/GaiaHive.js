import React, { useState, useEffect } from 'react';
import { RPGSystem } from '../../utils/RPGSystem';
import './GaiaHive.css';
import AttributeAgent from './AttributeAgent';
import SummaryAgent from './SummaryAgent';

const GaiaHive = ({ query, onResponse, attributes = {} }) => {
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
    sentience: { value: 4, description: "Ability to detect and honor cognitive/emotional presence" },
    habitat: { value: 3, description: "Importance of preserving native environments" },
    freedom: { value: 2, description: "Preference for non-captive, unconfined existence" },
    empathy: { value: 3, description: "Emotional valuation of relationships" },
    observation: { value: 3, description: "Preference to learn without altering behavior" },
    willenskraft: { value: 3, description: "Determination and persistence in the face of challenges" }
  };

  // Combine default with provided attributes
  const combinedAttributes = { ...defaultAttributes, ...attributes };

  // Process the query and start the agent conversation
  const processQuery = async () => {
    console.log('GAIA HIVE: Processing query:', query);
    if (!query || state.isProcessing) {
      console.log('GAIA HIVE: Query empty or already processing, aborting');
      return;
    }

    console.log('GAIA HIVE: Setting initial state');
    setState(prev => ({ 
      ...prev, 
      isProcessing: true,
      conversation: [],
      finalSummary: null,
      currentRound: 1,
      winningAgent: null
    }));

    console.log('GAIA HIVE: Determining participating attributes');
    // Determine which attributes should participate based on their values
    const participatingAttributes = Object.entries(combinedAttributes)
      .filter(([key, attr]) => {
        // Roll dice to see if this attribute will participate
        const roll = RPGSystem.rollD20();
        const total = roll + attr.value;
        console.log(`GAIA HIVE: Attribute ${key} rolled ${roll} + ${attr.value} = ${total}`);
        // Participation threshold (adjust as needed)
        const participating = total > 15;
        console.log(`GAIA HIVE: Attribute ${key} will ${participating ? '' : 'not '}participate`);
        return participating;
      })
      .map(([key, attr]) => ({
        id: key,
        name: key.charAt(0).toUpperCase() + key.slice(1),
        value: attr.value,
        description: attr.description
      }));

    console.log('GAIA HIVE: Participating attributes:', participatingAttributes);
    setState(prev => ({ ...prev, activeAgents: participatingAttributes }));

    // If we have participating agents, start the conversation
    if (participatingAttributes.length > 0) {
      console.log('GAIA HIVE: Starting conversation with participating attributes');
      await simulateConversation(participatingAttributes, query);
    } else {
      // No agents qualified to participate
      console.log('GAIA HIVE: No attributes qualified to participate');
      setState(prev => ({
        ...prev,
        isProcessing: false,
        finalSummary: "No attributes had strong enough influence to participate in this decision."
      }));
      onResponse("No attributes had strong enough influence to participate in this decision.");
    }
  };

  // Simulate a conversation between attribute agents
  const simulateConversation = async (agents, queryText) => {
    console.log('GAIA HIVE: Starting conversation simulation');
    // Number of dialogue rounds
    const rounds = 3;
    const conversation = [];

    // For each round of conversation
    for (let round = 1; round <= rounds; round++) {
      console.log(`GAIA HIVE: Starting round ${round} of ${rounds}`);
      setState(prev => ({ ...prev, currentRound: round }));

      // Have each agent "roll" for their turn and add their attribute value
      console.log('GAIA HIVE: Agents rolling dice for speaking order');
      const agentsWithRolls = agents.map(agent => {
        const roll = RPGSystem.rollD20();
        const total = roll + agent.value;
        console.log(`GAIA HIVE: Agent ${agent.name} rolled ${roll} + ${agent.value} = ${total}`);
        return { 
          ...agent, 
          roll,
          total
        };
      });

      // Sort by total to determine speaking order
      const sortedAgents = [...agentsWithRolls].sort((a, b) => b.total - a.total);
      console.log('GAIA HIVE: Sorted agents by roll:', 
        sortedAgents.map(a => `${a.name}(${a.total})`).join(', '));
      
      // The highest roll "wins" this round
      const roundWinner = sortedAgents[0];
      console.log(`GAIA HIVE: Round ${round} winner: ${roundWinner.name} with ${roundWinner.total}`);

      // Add each agent's message to the conversation
      for (const agent of sortedAgents) {
        const isWinner = agent.id === roundWinner.id;
        console.log(`GAIA HIVE: Agent ${agent.name} is ${isWinner ? '' : 'not '}the winner`);
        
        // Generate a message from this agent
        // In a real implementation, this would call an AI model
        console.log(`GAIA HIVE: Generating message for ${agent.name}`);
        const message = await generateAgentMessage(agent, queryText, conversation, round, isWinner);
        console.log(`GAIA HIVE: Generated message for ${agent.name}:`, message.substring(0, 50) + '...');
        
        conversation.push({
          round,
          agent: agent.id,
          agentName: agent.name,
          message,
          roll: agent.roll,
          total: agent.total,
          isWinner
        });

        // Update the state with the new message
        console.log(`GAIA HIVE: Updating state with message from ${agent.name}`);
        setState(prev => ({ 
          ...prev, 
          conversation: [...conversation],
          winningAgent: isWinner ? agent : prev.winningAgent
        }));

        // Simulate delay between messages
        console.log(`GAIA HIVE: Pausing for 1s before next agent speaks`);
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    // After all rounds, generate a final summary
    console.log('GAIA HIVE: All conversation rounds complete. Generating final summary.');
    const finalSummary = await generateSummary(conversation, queryText);
    console.log('GAIA HIVE: Final summary generated:', finalSummary.substring(0, 50) + '...');
    
    setState(prev => ({ 
      ...prev, 
      isProcessing: false,
      finalSummary
    }));

    // Return the final response
    console.log('GAIA HIVE: Sending response to caller');
    onResponse(finalSummary);
  };

  // Generate a message from an attribute agent (placeholder for AI call)
  const generateAgentMessage = async (agent, query, conversation, round, isWinner) => {
    console.log(`GAIA HIVE: generateAgentMessage called for ${agent.name}, round ${round}, winner: ${isWinner}`);
    
    // This would be replaced with an actual AI call in production
    const context = conversation.length > 0 
      ? `Previous messages: ${conversation.slice(-3).map(m => `${m.agentName}: ${m.message}`).join(' | ')}`
      : '';
    
    console.log(`GAIA HIVE: Context for ${agent.name}:`, context.substring(0, 100) + (context.length > 100 ? '...' : ''));
    
    // In a real implementation, we would make an API call here to generate the message
    const message = `As the ${agent.name} attribute ${isWinner ? '(dominant this round)' : ''}, I value ${agent.description}. For "${query}", I believe we should consider...`;
    
    console.log(`GAIA HIVE: Generated message for ${agent.name}:`, message);
    return message;
  };

  // Generate the final summary (placeholder for AI call)
  const generateSummary = async (conversation, query) => {
    console.log(`GAIA HIVE: generateSummary called with ${conversation.length} messages`);
    
    // This would be replaced with an actual AI call in production
    const winningMessages = conversation
      .filter(m => m.isWinner)
      .map(m => `${m.agentName}: ${m.message}`)
      .join('\n');
    
    console.log(`GAIA HIVE: Winning messages:`, winningMessages.substring(0, 100) + '...');
    
    // In a real implementation, we would make an API call here to generate the summary
    const summary = `After careful consideration of all attributes, with particular weight given to dominant perspectives in each round, I recommend: [AI-generated summary would appear here, synthesizing the winning viewpoints from each round]`;
    
    console.log(`GAIA HIVE: Generated summary:`, summary);
    return summary;
  };

  // Start processing when the query changes
  useEffect(() => {
    console.log('GAIA HIVE: useEffect triggered with query:', query);
    if (query) {
      console.log('GAIA HIVE: Query detected, calling processQuery()');
      processQuery();
    } else {
      console.log('GAIA HIVE: No query provided, skipping processing');
    }
  }, [query]);

  // Debug log current state when it changes
  useEffect(() => {
    console.log('GAIA HIVE: Current state:', {
      isProcessing: state.isProcessing,
      activeAgents: state.activeAgents.length,
      conversation: state.conversation.length,
      finalSummary: state.finalSummary ? 'exists' : 'none',
      currentRound: state.currentRound,
      winningAgent: state.winningAgent?.name || 'none'
    });
  }, [state]);

  return (
    <div className="gaia-hive">
      <h2>Gaia Hive Mind</h2>
      
      {state.isProcessing && (
        <div className="processing-indicator">
          The attributes are deliberating... (Round {state.currentRound}/3)
        </div>
      )}

      <div className="participating-attributes">
        <h3>Participating Attributes</h3>
        <div className="attribute-agents-grid">
          {state.activeAgents.map(agent => {
            // Find all messages from this agent
            const agentMessages = state.conversation.filter(msg => msg.agent === agent.id);
            
            return (
              <div 
                key={agent.id} 
                className={`attribute-agent-card ${state.winningAgent?.id === agent.id ? 'winner' : ''}`}
              >
                <div className="agent-card-header">
                  <h4 className="agent-name">{agent.name}</h4>
                  <span className="agent-value">{agent.value}</span>
                </div>
                <div className="agent-description">{agent.description}</div>
                
                <div className="agent-chat-box">
                  {agentMessages.length > 0 ? (
                    agentMessages.map((msg, idx) => (
                      <div key={idx} className={`agent-message ${msg.isWinner ? 'winner' : ''}`}>
                        <div className="agent-message-round">Round {msg.round}</div>
                        <div className="agent-message-roll">
                          🎲 {msg.roll} + {msg.total - msg.roll} = {msg.total}
                          {msg.isWinner && ' 👑'}
                        </div>
                        <div className="agent-message-content">{msg.message}</div>
                      </div>
                    ))
                  ) : (
                    <div className="agent-waiting">Waiting to speak...</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="main-conversation-container">
        <h3>Conversation Timeline</h3>
        <div className="conversation-timeline">
          {state.conversation.map((message, index) => (
            <div 
              key={index} 
              className={`timeline-message ${message.isWinner ? 'winner' : ''}`}
            >
              <div className="timeline-message-header">
                <div className="timeline-round">Round {message.round}</div>
                <strong className="timeline-agent">{message.agentName}</strong>
                <span className="roll-result">
                  Rolled: {message.roll} + {message.total - message.roll} = {message.total}
                  {message.isWinner && ' (Round Winner)'}
                </span>
              </div>
              <div className="timeline-message-content">{message.message}</div>
            </div>
          ))}
        </div>
      </div>

      {state.finalSummary && (
        <div className="final-summary">
          <h3>Final Response</h3>
          <div className="final-summary-header">
            <div className="summary-title">Collective Wisdom of the Gaia Hive Mind</div>
            {state.winningAgent && (
              <div className="dominant-attribute">
                Dominant Attribute: <span className="attribute-highlight">{state.winningAgent.name}</span>
              </div>
            )}
          </div>
          <div className="summary-content">{state.finalSummary}</div>
        </div>
      )}
    </div>
  );
};

export default GaiaHive;