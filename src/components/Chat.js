import React, { useState, useRef, useEffect } from 'react';
import Message from './Message';
import { API_KEY, MODELS, IMAGE_MODELS } from '../config';
import '../styles/Chat.css';
import ChatInput from './ChatInput';
import { RPGSystem } from '../utils/RPGSystem';
import { Persona } from '../utils/Persona';
import { DEFAULT_PERSONA_ID } from '../config/defaultPersona';
import FilePreview from './FilePreview';
import { chatDB, knowledgeDB, userDB } from '../services/db';
import { parseFileContent } from '../utils/FileParser';
import { PersonaAgent } from "../services/agentService";
import { createPersonaTools } from "../services/tools";
import { isDiceRollCommand, extractDiceParams, formatDiceNotation } from "../utils/ToolUtilities";

const Chat = ({ 
  currentChat, 
  setCurrentChat, 
  model, 
  systemPrompt, 
  personas,
  activePersonas,
  setActivePersonas,
  activeUsers,
  setActiveUsers,
  selectedChatId,
  chatHistory,
  setChatHistory
}) => {
  // Add a utility function to check if a persona has a specific tool
  const personaHasTool = (persona, toolName) => {
    return persona?.agentSettings?.toolConfig?.[toolName] === true;
  };
  const [isLoading, setIsLoading] = useState(false);
  const [debugLog, setDebugLog] = useState([]);
  const messagesEndRef = useRef(null);
  const [isCancelled, setIsCancelled] = useState(false);
  const [showDebugLog, setShowDebugLog] = useState(false);
  const [rpgOutcomes, setRpgOutcomes] = useState({});
  const [showImageModal, setShowImageModal] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('flux_schnell');
  const [selectedStyle, setSelectedStyle] = useState('realistic');
  const [useEnhancement, setUseEnhancement] = useState(true);
  const [imageModel, setImageModel] = useState(IMAGE_MODELS.SDXL);
  const [chatKnowledgeFiles, setChatKnowledgeFiles] = useState([]);
  const [filesUpdated, setFilesUpdated] = useState(false);

  // Create a ref for the AbortController
  const controllerRef = useRef(null);

  const addDebugLog = (type, data) => {
    setDebugLog(prev => [
      ...prev,
      { 
        timestamp: new Date().toISOString(),
        type,
        data: JSON.stringify(data, null, 2)
      }
    ]);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [currentChat]);

  const getMentionedPersonas = (message) => {
    const matches = message.match(/@(\w+)/g) || [];
    return matches
      .map(match => match.substring(1)) // Remove @ symbol
      .map(name => personas.find(p => p.name.toLowerCase() === name.toLowerCase()))
      .filter(Boolean);
  };

  const getMentionedUsers = async (message) => {
    try {
      const matches = message.match(/@(\w+)/g) || [];
      if (matches.length === 0) return [];
      
      // Get all users
      const allUsers = await userDB.getAllUsers();
      
      // Find mentioned users by username or displayName
      return matches
        .map(match => match.substring(1)) // Remove @ symbol
        .map(name => allUsers.find(u => 
          (u.username && u.username.toLowerCase() === name.toLowerCase()) ||
          (u.displayName && u.displayName.toLowerCase() === name.toLowerCase())
        ))
        .filter(Boolean);
    } catch (error) {
      console.error('Error getting mentioned users:', error);
      return [];
    }
  };

  const updateActivePersonas = (message, currentPersonas) => {
    const mentionedPersonas = getMentionedPersonas(message);
    const newPersonas = mentionedPersonas.filter(p => 
      !currentPersonas.some(ap => ap.id === p.id)
    );
    return [...currentPersonas, ...newPersonas];
  };

  const updateActiveUsers = async (message, currentUsers) => {
    const mentionedUsers = await getMentionedUsers(message);
    const newUsers = mentionedUsers.filter(u => 
      !currentUsers.some(au => au.id === u.id)
    );
    return [...currentUsers, ...newUsers];
  };

  const analyzeMessageContext = (message) => {
    return {
      topicAlignment: message.toLowerCase().includes('ai') || message.toLowerCase().includes('artificial intelligence'),
      unfamiliarTopic: message.toLowerCase().includes('quantum physics'),
      mentionedPersonaIds: getMentionedPersonas(message).map(p => p.id)
    };
  };

  const generateRpgInstructions = (outcome) => {
    const instructions = [];
    
    // Assertiveness
    if (outcome.assertiveness === 'hesitant') {
      instructions.push('Respond with hesitation, using phrases like "Maybe" or "Perhaps"');
    } else if (outcome.assertiveness === 'assertive') {
      instructions.push('Respond assertively and confidently');
    }

    // Emotional tone
    if (outcome.emotionalTone === 'detached') {
      instructions.push('Maintain a logical, detached tone');
    } else if (outcome.emotionalTone === 'empathetic') {
      instructions.push('Respond with empathy and emotional understanding');
    }

    // Curiosity
    if (outcome.questionDepth === 'deep') {
      instructions.push('Ask a thoughtful, insightful question');
    }

    // Creativity
    if (outcome.creativity.total >= 15) {
      instructions.push('Include creative metaphors or analogies');
    }

    // Humor
    if (outcome.humor.total >= 12) {
      instructions.push('Include a joke or witty remark');
    }

    return instructions.join('\n');
  };

  // We now use imported utility functions for dice roll detection and parameter extraction
  
  const generatePersonaResponse = async (persona, triggerMessage, outcome) => {
    let messageId = Date.now();
    try {
      // Create new AbortController for this request
      controllerRef.current = new AbortController();
      
      const context = {
        ...analyzeMessageContext(triggerMessage.content),
        isResponseToPersona: !triggerMessage.isUser
      };

      // Get last 5 messages for context
      const recentMessages = currentChat
        .slice(-5)
        .map(msg => {
          const speaker = msg.personaId ? 
            personas.find(p => p.id === msg.personaId)?.name : 
            'User';
          return `${speaker}: ${msg.content}`;
        })
        .join('\n');

      // Get knowledge file content to include in the context
      let knowledgeContent = "";
      if (chatKnowledgeFiles && chatKnowledgeFiles.length > 0) {
        try {
          // Gather file content from knowledgeDB
          const fileDetails = await Promise.all(
            chatKnowledgeFiles.map(async (file) => {
              const fullFile = await knowledgeDB.getFiles([file.id]);
              if (fullFile && fullFile.length > 0 && fullFile[0].content) {
                // Parse the file content based on type
                const parsedContent = await parseFileContent(
                  fullFile[0].content,
                  fullFile[0].type,
                  fullFile[0].name
                );
                return `--- File: ${fullFile[0].name} ---\n${parsedContent}\n\n`;
              }
              return "";
            })
          );
          
          // Combine all file content
          knowledgeContent = fileDetails.join("");
          
          // Log for debugging
          console.log(`Including ${chatKnowledgeFiles.length} knowledge files in request`);
        } catch (error) {
          console.error("Error processing knowledge files:", error);
        }
      }

      // Initialize an empty message in the chat
      setCurrentChat(prev => [...prev, {
        id: messageId,
        content: '',
        isUser: false,
        personaId: persona.id
      }]);
      
      // Create a component reference for tool creation
      const componentRef = {
        knowledgeDB,
        generateImage,
        imageModel,
        selectedStyle,
        setCurrentChat  // Pass this so tools can add messages to chat
      };
      
      // Check if persona has tools configured and create them
      let useAgent = false;
      let tools = [];
      
      if (persona.agentSettings?.toolConfig) {
        console.log(`Persona ${persona.name} has tool configuration:`, persona.agentSettings.toolConfig);
        
        // Check if any tools are enabled
        const hasEnabledTools = Object.values(persona.agentSettings.toolConfig).some(enabled => enabled);
        
        if (hasEnabledTools) {
          console.log(`Creating tools for persona ${persona.name}`);
          tools = createPersonaTools(componentRef, persona);
          useAgent = tools.length > 0;
          console.log(`Created ${tools.length} tools for persona ${persona.name}`);
          
          // Add debug log for tools
          addDebugLog('TOOLS', {
            persona: persona.name,
            tools: tools.map(t => t.name),
            toolConfig: persona.agentSettings.toolConfig
          });
          
          // This dice roll handling is now moved to the useAgent condition for more reliable execution
          console.log("Direct dice roll handling moved to the useAgent section");
        }
      }
      
      // If we have tools, use the agent approach
      if (useAgent) {
        console.log(`Using agent with tools for persona ${persona.name}`);
        
        // First, check if this is a direct dice roll command that we can handle immediately
        if (personaHasTool(persona, 'diceRoll') && 
            isDiceRollCommand(triggerMessage.content)) {
          try {
            console.log(`Direct tool execution: Dice roll command detected for ${persona.name}`);
            
            // Find the dice roll tool
            const diceRollTool = tools.find(tool => tool.name === "dice_roll");
            if (diceRollTool) {
              // Extract dice parameters
              const { sides, count } = extractDiceParams(triggerMessage.content);
              const diceNotation = formatDiceNotation(sides, count);
              
              console.log(`Executing dice roll directly: ${diceNotation}`);
              
              // First update message with "thinking" state
              setCurrentChat(prev => 
                prev.map(msg => 
                  msg.id === messageId 
                    ? { ...msg, content: `*Rolling ${diceNotation}...*` }
                    : msg
                )
              );
              
              // Execute the dice roll
              const result = await diceRollTool.func(diceNotation);
              console.log("Dice roll result:", result);
              
              // Update message with the result
              setCurrentChat(prev => 
                prev.map(msg => 
                  msg.id === messageId 
                    ? { 
                        ...msg, 
                        content: `I rolled ${diceNotation} for you: ${result.replace('🎲 ', '')}`
                      }
                    : msg
                )
              );
              
              // Skip the rest of the agent processing
              if (typeof persona.markActive === 'function') {
                persona.markActive();
              }
              return;
            }
          } catch (error) {
            console.error("Error executing dice roll directly:", error);
            // Continue with normal processing if direct execution fails
          }
        }
        
        // Create token handler for streaming
        let assistantMessage = '';
        const handleNewToken = (token) => {
          assistantMessage += token;
          setCurrentChat(prev => 
            prev.map(msg => 
              msg.id === messageId 
                ? { ...msg, content: assistantMessage }
                : msg
            )
          );
        };
        
        // Create the agent
        const agent = await PersonaAgent.create(
          persona,
          tools,
          {
            handleNewToken,
            handleToolStart: (tool) => {
              console.log(`Tool execution started: ${tool.name}`);
              addDebugLog('TOOL_START', { 
                name: tool.name,
                persona: persona.name, 
                input: tool.input
              });
            },
            handleToolEnd: (output) => {
              console.log(`Tool execution completed with output:`, output);
              addDebugLog('TOOL_END', { 
                result: output, 
                persona: persona.name
              });
            },
            handleChainStart: (chain) => {
              console.log(`Chain execution started for ${persona.name}`);
            },
            handleChainEnd: (output) => {
              console.log(`Chain execution completed for ${persona.name}:`, output);
            },
            handleAgentAction: (action) => {
              console.log(`Agent ${persona.name} is taking action:`, action);
              addDebugLog('AGENT_ACTION', { 
                action: action.tool,
                input: action.toolInput,
                persona: persona.name
              });
            }
          }
        );
        
        // Invoke the agent
        const result = await agent.invoke({
          message: triggerMessage.content,
          history: recentMessages,
          outcome
        });
        
        console.log("Agent result:", result);
      } else {
        // Use the standard approach if no tools are enabled
        console.log(`Using standard chat for persona ${persona.name} (no tools)`);
        
        const modulatedPrompt = `${persona.systemPrompt}
${generateRpgInstructions(outcome)}

Recent conversation:
${recentMessages}

${knowledgeContent ? `Knowledge Base:\n${knowledgeContent}\n` : ""}

You are ${persona.name}. Respond naturally to the most recent message.`;

        const response = await fetch('https://api.deepinfra.com/v1/openai/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
          },
          body: JSON.stringify({
            model: persona.model,
            messages: [
              { role: "system", content: modulatedPrompt },
              { role: "user", content: triggerMessage.content }
            ],
            stream: true
          }),
          signal: controllerRef.current.signal // Add the abort signal
        });

        if (!response.ok) throw new Error(`API Error: ${response.status}`);

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let assistantMessage = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(line => line.trim());
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                // Handle the special [DONE] marker that isn't valid JSON
                if (line.slice(6).trim() === '[DONE]') {
                  continue;
                }
                
                const data = JSON.parse(line.slice(6));
                if (data.choices?.[0]?.delta?.content) {
                  assistantMessage += data.choices[0].delta.content;
                  setCurrentChat(prev => 
                    prev.map(msg => 
                      msg.id === messageId 
                        ? { ...msg, content: assistantMessage }
                        : msg
                    )
                  );
                }
              } catch (error) {
                console.error('Parse error:', error);
              }
            }
          }
        }
      }

      // Check if markActive method exists before calling it
      if (typeof persona.markActive === 'function') {
        try {
          persona.markActive();
          console.log(`Marked persona ${persona.name} as active`);
        } catch (error) {
          console.warn(`Error marking persona ${persona.name} as active:`, error);
        }
      } else {
        console.log(`No markActive method for persona ${persona.name}`);
      }
    } catch (error) {
      console.error('Error generating response:', error);
      if (error.name === 'AbortError') {
        setCurrentChat(prev => prev.filter(msg => msg.id !== messageId));
      } else {
        // If it's not an abort error, update the message to show the error
        setCurrentChat(prev => 
          prev.map(msg => 
            msg.id === messageId 
              ? { ...msg, content: `Error: ${error.message}. Please try again.` }
              : msg
          )
        );
      }
      addDebugLog('ERROR', {
        message: error.message,
        stack: error.stack,
        context: 'generatePersonaResponse',
        personaId: persona.id,
        personaName: persona.name
      });
    }
  };

  const handleSubmit = async (message) => {
    if (!message.trim()) return;

    const messageId = Date.now();
    const newMessage = {
      id: messageId,
      content: message,
      isUser: true
    };
    setCurrentChat(prev => [...prev, newMessage]);
    setIsLoading(true);
    
    // Log message submission and any potential tool trigger
    console.log(`User message: "${message}"`);
    const isDiceCommand = isDiceRollCommand(message);
    if (isDiceCommand) {
      console.log(`Detected potential dice roll command: "${message}"`);
      // Log which personas have the dice roll tool enabled
      const personasWithDiceRoll = activePersonas.filter(p => personaHasTool(p, 'diceRoll'));
      console.log(`Personas with dice roll tool enabled: ${personasWithDiceRoll.map(p => p.name).join(', ') || 'None'}`);
      
      // Add debug information about enabled tools
      addDebugLog('DICE_COMMAND', { 
        message,
        personasWithDiceRoll: personasWithDiceRoll.map(p => p.name),
        parsed: extractDiceParams(message)
      });
    }

    try {
      // Check for direct dice roll commands and handle them before AI response
      if (isDiceRollCommand(message)) {
        // Find a persona that has the dice roll tool enabled
        const diceEnabledPersona = activePersonas.find(p => personaHasTool(p, 'diceRoll'));
        
        if (diceEnabledPersona) {
          console.log(`Handling direct dice roll with ${diceEnabledPersona.name}`);
          
          // Extract dice parameters
          const { sides, count } = extractDiceParams(message);
          const notation = formatDiceNotation(sides, count);
          
          // Roll the dice
          const results = Array.from({length: count}, () => 
            Math.floor(Math.random() * sides) + 1
          );
          
          const total = results.reduce((a,b) => a + b, 0);
          const resultString = `🎲 Rolling ${notation}: [${results.join(', ')}] = ${total}`;
          
          // Add dice roll result to chat
          setCurrentChat(prev => [...prev, {
            id: Date.now(),
            content: `**Tool Used**: Dice Roll\n**Input**: ${notation}\n**Result**: ${resultString}`,
            isUser: false,
            isCommand: true,
            isToolUsage: true,
            toolName: "Dice Roll",
            personaId: diceEnabledPersona.id,
            toolData: {
              toolName: "Dice Roll",
              input: notation,
              result: resultString,
              timestamp: new Date().toISOString(),
              persona: diceEnabledPersona.name
            }
          }]);
          
          // Log dice roll for debugging
          addDebugLog('DICE_ROLL_EXECUTED', { 
            persona: diceEnabledPersona.name,
            notation,
            results,
            total
          });
          
          setIsLoading(false);
          return; // Exit early, no need for AI response
        }
      }

      // Get recent messages for context
      const recentMessages = currentChat
        .slice(-5)
        .map(msg => {
          const speaker = msg.personaId ?
            personas.find(p => p.id === msg.personaId)?.name :
            'User';
          return `${speaker}: ${msg.content}`;
        })
        .join('\n');

      // Update active personas based on mentions
      const mentionedPersonas = getMentionedPersonas(message);
      const updatedPersonas = updateActivePersonas(message, activePersonas);
      setActivePersonas(updatedPersonas);
      
      // Update active users based on mentions
      const updatedUsers = await updateActiveUsers(message, activeUsers);
      setActiveUsers(updatedUsers);
      
      // If we have any newly added users, add user notification message and add them as participants to the chat
      const newUsers = updatedUsers.filter(u => !activeUsers.some(au => au.id === u.id));
      if (newUsers.length > 0 && selectedChatId) {
        const usernames = newUsers.map(u => u.displayName || u.username).join(', ');
        setCurrentChat(prev => [...prev, {
          id: Date.now(),
          content: `👤 Added ${newUsers.length === 1 ? 'user' : 'users'} to chat: ${usernames}`,
          isUser: false,
          isCommand: true,
          // Use the default persona for system messages if available
          personaId: activePersonas.find(p => p.isDefault)?.id || activePersonas[0]?.id
        }]);
        
        // Add each new user as a participant in the database
        for (const user of newUsers) {
          try {
            await chatDB.addParticipantToChat(selectedChatId, user.id);
            console.log(`Added user ${user.id} (${user.displayName || user.username}) as participant in chat ${selectedChatId}`);
          } catch (error) {
            console.error(`Error adding user ${user.id} as participant:`, error);
          }
        }
      }

      // Get response candidates
      const responseCandidates = mentionedPersonas.length > 0
        ? [...new Set([...updatedPersonas, ...mentionedPersonas])]
        : activePersonas;

      const context = analyzeMessageContext(message);

      // Calculate responses for all candidates
      const responseQueue = await Promise.all(
        responseCandidates.map(async (persona) => {
          const outcome = RPGSystem.calculateOutcome(persona, context);
          
          // Log persona tools availability 
          const hasToolConfig = !!persona.agentSettings?.toolConfig;
          const enabledTools = hasToolConfig ? 
            Object.entries(persona.agentSettings.toolConfig)
              .filter(([name, enabled]) => enabled)
              .map(([name]) => name) : 
            [];
            
          console.log(`Persona ${persona.name} tool status:`, {
            hasToolConfig,
            enabledTools,
            outcome: {
              shouldRespond: outcome.shouldRespond,
              responsePriority: outcome.responsePriority
            }
          });
          
          // Log if the persona can handle a potential dice roll
          if (isDiceRollCommand(message) && personaHasTool(persona, 'diceRoll')) {
            console.log(`${persona.name} can handle the dice roll command`);
            addDebugLog('DICE_ROLL_CAPABLE', { persona: persona.name });
            
            // Force a response for dice rolls if the tool is available
            if (!outcome.shouldRespond) {
              console.log(`Overriding shouldRespond for ${persona.name} to handle dice roll`);
              outcome.shouldRespond = true;
              outcome.responsePriority += 10; // Increase priority significantly for tool use
            }
          }
            
          return { persona, outcome };
        })
      );

      // Filter and sort responders
      const responders = responseQueue
        .filter(({ outcome }) => outcome.shouldRespond)
        .sort((a, b) => {
          if (a.persona.id === DEFAULT_PERSONA_ID) return -1;
          if (b.persona.id === DEFAULT_PERSONA_ID) return 1;

          const aIsMentioned = context.mentionedPersonaIds?.includes(a.persona.id);
          const bIsMentioned = context.mentionedPersonaIds?.includes(b.persona.id);

          if (aIsMentioned === bIsMentioned) {
            return b.outcome.responsePriority - a.outcome.responsePriority;
          }
          if (aIsMentioned) return -1;
          return 1;
        });

      // Generate responses
      for (const { persona, outcome } of responders) {
        const messageId = Date.now(); // Unique ID for each persona's response

        // Initialize empty message in chat
        setCurrentChat(prev => [...prev, {
          id: messageId,
          content: '',
          isUser: false,
          personaId: persona.id
        }]);

        try {
          // Create new AbortController for this request
          controllerRef.current = new AbortController();

          // Get knowledge file content to include in the context
          let knowledgeContent = "";
          if (chatKnowledgeFiles && chatKnowledgeFiles.length > 0) {
            try {
              // Gather file content from knowledgeDB
              const fileDetails = await Promise.all(
                chatKnowledgeFiles.map(async (file) => {
                  const fullFile = await knowledgeDB.getFiles([file.id]);
                  if (fullFile && fullFile.length > 0 && fullFile[0].content) {
                    // Parse the file content based on type
                    const parsedContent = await parseFileContent(
                      fullFile[0].content,
                      fullFile[0].type,
                      fullFile[0].name
                    );
                    return `--- File: ${fullFile[0].name} ---\n${parsedContent}\n\n`;
                  }
                  return "";
                })
              );
              
              // Combine all file content
              knowledgeContent = fileDetails.join("");
              
              // Log for debugging
              console.log(`Including ${chatKnowledgeFiles.length} knowledge files in request`);
            } catch (error) {
              console.error("Error processing knowledge files:", error);
            }
          }

          const modulatedPrompt = `${persona.systemPrompt}
${generateRpgInstructions(outcome)}

Recent conversation:
${recentMessages}

${knowledgeContent ? `Knowledge Base:\n${knowledgeContent}\n` : ""}

You are ${persona.name}. Respond naturally to the most recent message.`;

          const response = await fetch('https://api.deepinfra.com/v1/openai/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
              model: persona.model,
              messages: [
                { role: "system", content: modulatedPrompt },
                { role: "user", content: newMessage.content } // Use the original user message
              ],
              stream: true
            }),
            signal: controllerRef.current.signal // Add the abort signal
          });

          if (!response.ok) throw new Error(`API Error: ${response.status}`);

          const reader = response.body.getReader();
          const decoder = new TextDecoder();

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.trim());

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  // Check for the special [DONE] marker
                  const dataText = line.slice(6).trim();
                  if (dataText === '[DONE]') {
                    console.log('Received [DONE] marker for streaming completion');
                    continue;
                  }
                  
                  const data = JSON.parse(dataText);
                  if (data.choices?.[0]?.delta?.content) {
                    // Update the chat content directly with each chunk
                    setCurrentChat(prev => {
                      const lastMessage = prev[prev.length - 1];
                      if (lastMessage && lastMessage.id === messageId) {
                        return [
                          ...prev.slice(0, -1),
                          { ...lastMessage, content: lastMessage.content + data.choices[0].delta.content }
                        ];
                      }
                      return prev;
                    });
                  }
                } catch (error) {
                  console.error('Parse error:', error, 'on line:', line);
                }
              }
            }
          }
          // Check if markActive exists before calling it
          if (typeof persona.markActive === 'function') {
            try {
              persona.markActive();
              console.log(`Marked persona ${persona.name} as active after response`);
            } catch (error) {
              console.warn(`Error marking persona ${persona.name} as active after response:`, error);
            }
          }
        } catch (error) {
            console.error('Error generating response:', error);
            if (error.name === 'AbortError') {
                setCurrentChat(prev => prev.filter(msg => msg.id !== messageId));
            }
            addDebugLog('ERROR', error.message);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      addDebugLog('ERROR', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCommand = (command, args) => {
    switch(command) {
      case 'imagine':
        setImagePrompt(args);
        setShowImageModal(true);
        break;
      default:
        console.warn(`Unknown command: /${command}`);
    }
  };

  const generateImage = async (options) => {
    const messageId = Date.now();

    try {
      setCurrentChat(prev => [...prev, {
        id: messageId,
        content: `Generating ${options.style} image with ${options.model}: "${options.prompt}"...`,
        isUser: false,
        isCommand: true,
        imageData: null,
        // Use the default persona for system messages if available
        personaId: activePersonas.find(p => p.isDefault)?.id || activePersonas[0]?.id
      }]);

      const requestBody = {
        prompt: options.enhancement 
          ? `8k resolution, professional composition, ${options.style} style, ${options.prompt}`
          : options.prompt,
        negative_prompt: options.style === 'realistic' ? 'anime, cartoon, drawing' : '',
        width: 1024,
        height: 1024,
        num_inference_steps: options.model.includes('FLUX') ? 30 : 50,
        guidance_scale: 7.5
      };

      const response = await fetch(`https://api.deepinfra.com/v1/inference/${options.model}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`API Error (${response.status}): ${errorData}`);
      }

      const data = await response.json();
      
      if (!data.images?.[0]) {
        throw new Error('No image data received from API');
      }

      const imageBase64 = data.images[0];
      
      // Check if the base64 string already includes the data URI prefix
      const imageSource = imageBase64.startsWith('data:image/') 
        ? imageBase64 
        : `data:image/png;base64,${imageBase64}`;
      
      setCurrentChat(prev => prev.map(msg => 
        msg.id === messageId 
          ? { 
              ...msg, 
              content: `<img src="${imageSource}" alt="${options.prompt}" class="generated-image"/>`,
              imageData: imageBase64
            }
          : msg
      ));

    } catch (error) {
      console.error("Image generation failed:", error);
      const errorMessage = error.message || 'Network request failed';
      setCurrentChat(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, content: `Failed to generate image: ${errorMessage}. Please check your API key and network connection.` }
          : msg
      ));
    }
  };

  const handleRegenerate = async (message) => {
    const messageIndex = currentChat.findIndex(m => m.id === message.id);
    const userMessage = currentChat[messageIndex - 1];
    
    if (!userMessage || !userMessage.isUser) return;
    
    setCurrentChat(prev => prev.slice(0, messageIndex));
    setIsLoading(true);

    try {
      const mentionedPersonas = getMentionedPersonas(userMessage.content);
      let activePersona = mentionedPersonas[mentionedPersonas.length - 1];
      
      if (!activePersona) {
        activePersona = new Persona({
          name: 'Assistant',
          systemPrompt: 'You are a helpful assistant',
          model: MODELS.LLAMA3_70B,
          talkativeness: 15
        });
      }

      const context = analyzeMessageContext(userMessage.content);
      const outcome = RPGSystem.calculateOutcome(activePersona, context);
      setRpgOutcomes(outcome);
      addDebugLog('RPG_OUTCOME', outcome);

      // Force response for regeneration
      outcome.shouldRespond = true;
      await generatePersonaResponse(activePersona, userMessage, outcome);
    } catch (error) {
      console.error('Error:', error);
      addDebugLog('ERROR', error.message);
      setCurrentChat(prev => [...prev, {
        id: Date.now(),
        content: `Error: ${error.message}`,
        isUser: false,
        // Use the default persona for system messages if available
        personaId: activePersonas.find(p => p.isDefault)?.id || activePersonas[0]?.id
      }]);
    }
    setIsLoading(false);
  };

  const handleRemovePersona = (personaId) => {
    setActivePersonas(prev => 
      prev.filter(p => p.id !== personaId)
    );
  };
  
  const handleRemoveUser = async (userId) => {
    // Remove user from UI first
    setActiveUsers(prev => prev.filter(u => u.id !== userId));
    
    // Then remove them from the chat in the database
    if (selectedChatId) {
      try {
        // Get user name for notification message
        const removedUser = activeUsers.find(u => u.id === userId);
        const userName = removedUser ? (removedUser.displayName || removedUser.username) : 'User';
        
        // Remove from database
        await chatDB.removeParticipantFromChat(selectedChatId, userId);
        
        // Add notification to the chat
        setCurrentChat(prev => [...prev, {
          id: Date.now(),
          content: `👤 Removed user from chat: ${userName}`,
          isUser: false,
          isCommand: true,
          // Use the default persona for system messages if available
          personaId: activePersonas.find(p => p.isDefault)?.id || activePersonas[0]?.id
        }]);
        
        console.log(`Removed user ${userId} from chat ${selectedChatId}`);
      } catch (error) {
        console.error(`Error removing user ${userId} from chat:`, error);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
      setIsCancelled(false);
    };
  }, []);

  useEffect(() => {
    const defaultGaia = personas.find(p => p.id === DEFAULT_PERSONA_ID);
    if (defaultGaia) {
      setActivePersonas(prev => [
        ...prev.filter(p => p.id !== DEFAULT_PERSONA_ID), // Remove any existing GAIA
        defaultGaia // Add fresh GAIA
      ]);
    }
  }, [personas]);

  useEffect(() => {
    console.log('Debug Log updated:', debugLog);
  }, [debugLog]);
  
  // State for toggling participants panel
  const [showParticipants, setShowParticipants] = useState(true);
  
  // Log active personas with their tool configurations whenever they change
  useEffect(() => {
    if (activePersonas.length > 0) {
      console.log('Active personas with tool configurations:');
      activePersonas.forEach(persona => {
        const toolConfig = persona.agentSettings?.toolConfig || {};
        const enabledTools = Object.entries(toolConfig)
          .filter(([name, enabled]) => enabled)
          .map(([name]) => name);
          
        console.log(`- ${persona.name}: Tools enabled: ${enabledTools.join(', ') || 'None'}`);
      });
    }
  }, [activePersonas]);

  // More robust loadFiles function with better error handling
  const loadFiles = async (fileIds) => {
    console.log("Loading files for IDs:", fileIds);
    
    // Clear files first to avoid showing stale data
    setChatKnowledgeFiles([]);
    
    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      console.log("No files to load, knowledge base cleared");
      return;
    }
    
    try {
      // Get files directly from database with fresh query
      const files = await knowledgeDB.getFiles(fileIds);
      console.log("Successfully loaded files:", files);
      
      if (files && files.length > 0) {
        // Set the files in state
        setChatKnowledgeFiles(files);
      }
    } catch (error) {
      console.error("Error loading chat files:", error);
    }
  };

  // Add this debug useEffect to track changes
  useEffect(() => {
    console.log("Current chatKnowledgeFiles:", chatKnowledgeFiles);
  }, [chatKnowledgeFiles]);

  // Completely revised useEffect for file loading
  useEffect(() => {
    console.log("Selected chat changed to:", selectedChatId);
    
    // Define an async function to load chat files
    const loadSelectedChatFiles = async () => {
      if (!selectedChatId) {
        console.log("No chat selected, clearing files");
        setChatKnowledgeFiles([]);
        return;
      }
      
      try {
        // Always get the most current chat data directly from database
        const chat = await chatDB.getChatById(selectedChatId);
        
        if (!chat) {
          console.error("Selected chat not found in database");
          setChatKnowledgeFiles([]);
          return;
        }
        
        console.log("Retrieved chat:", chat);
        
        // Check if knowledgeFiles exists and has items
        if (chat.knowledgeFiles && Array.isArray(chat.knowledgeFiles) && chat.knowledgeFiles.length > 0) {
          console.log("Chat has knowledge files:", chat.knowledgeFiles);
          await loadFiles(chat.knowledgeFiles);
        } else {
          console.log("Chat has no knowledge files");
          setChatKnowledgeFiles([]);
        }
      } catch (error) {
        console.error("Error loading files for selected chat:", error);
        setChatKnowledgeFiles([]);
      }
    };
    
    // Call the async function
    loadSelectedChatFiles();
    
  }, [selectedChatId]); // Only trigger when selected chat changes

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setIsLoading(true);
      try {
        // Add status message
        const statusMessageId = Date.now();
        setCurrentChat(prev => [...prev, {
          id: statusMessageId,
          content: `📎 Uploading and processing file: ${file.name}...`,
          isUser: false,
          isCommand: true,
          // Use the default persona for system messages if available
          personaId: activePersonas.find(p => p.isDefault)?.id || activePersonas[0]?.id
        }]);
        
        // Choose the correct reading method based on file type
        const reader = new FileReader();
        
        // Create a promise to handle file reading
        const readFilePromise = new Promise((resolve, reject) => {
          reader.onload = (event) => resolve(event.target.result);
          reader.onerror = (error) => reject(error);
          
          // PDF files and other binary formats should be read as ArrayBuffer
          if (file.type === 'application/pdf' || 
              file.name.toLowerCase().endsWith('.pdf') ||
              file.type.startsWith('image/') ||
              file.type.includes('spreadsheet') ||
              file.type.includes('msword') ||
              file.type.includes('officedocument')) {
            reader.readAsArrayBuffer(file);
          } else {
            // Text files can be read as text
            reader.readAsText(file);
          }
        });
        
        // Wait for file to be read
        const content = await readFilePromise;
        
        // Save file to knowledge DB
        const fileData = {
          name: file.name,
          type: file.type,
          content: content,
          uploadedAt: Date.now()
        };
        
        const fileId = await knowledgeDB.addFile(fileData);
        console.log("Added new file with ID:", fileId);
        
        // Add file to UI immediately
        const newFile = { id: fileId, name: file.name, type: file.type };
        setChatKnowledgeFiles(prevFiles => [...prevFiles, newFile]);
        
        // Update chat in database
        if (selectedChatId) {
          try {
            // Get current chat
            const currentChat = await chatDB.getChatById(selectedChatId);
            if (!currentChat) {
              console.error("Current chat not found");
              // Update status message
              setCurrentChat(prev => prev.map(msg => 
                msg.id === statusMessageId 
                  ? { ...msg, content: `❌ Error: Could not find chat to update` }
                  : msg
              ));
              setIsLoading(false);
              return;
            }
            
            // Prepare updated knowledge files array
            const currentFiles = Array.isArray(currentChat.knowledgeFiles) 
              ? currentChat.knowledgeFiles 
              : [];
            
            const updatedFiles = [...currentFiles, fileId];
            console.log("Updating chat with files:", updatedFiles);
            
            // Update chat using chatDB (not knowledgeDB)
            const updatedChat = {
              ...currentChat,
              knowledgeFiles: updatedFiles
            };
            
            await chatDB.updateChat(updatedChat);
            
            // Update status message
            setCurrentChat(prev => prev.map(msg => 
              msg.id === statusMessageId 
                ? { ...msg, content: `✅ File uploaded: ${file.name}` }
                : msg
            ));
          } catch (error) {
            console.error("Error updating chat with new file:", error);
            // Update status message
            setCurrentChat(prev => prev.map(msg => 
              msg.id === statusMessageId 
                ? { ...msg, content: `❌ Error updating chat: ${error.message}` }
                : msg
            ));
          }
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error uploading file:', error);
        // Add error message to chat
        setCurrentChat(prev => [...prev, {
          id: Date.now(),
          content: `❌ Error uploading file: ${error.message}`,
          isUser: false,
          isCommand: true,
          // Use the default persona for system messages if available
          personaId: activePersonas.find(p => p.isDefault)?.id || activePersonas[0]?.id
        }]);
        setIsLoading(false);
      }
    }
  };

  const handleFileDelete = async (fileId) => {
    const file = chatKnowledgeFiles.find(f => f.id === fileId);
    if (!file) return;

    await knowledgeDB.deleteFile(fileId);
    setCurrentChat(prev => ({
      ...prev,
      knowledgeFiles: prev.knowledgeFiles.filter(id => id !== fileId)
    }));
    setChatKnowledgeFiles(prev => prev.filter(f => f.id !== fileId));

    // Add a command message for the deleted file
    const deleteMessage = {
      id: Date.now(),
      content: `🗑️ Deleted file: ${file.name}`,
      isUser: false,
      isCommand: true,
      // Use the default persona for system messages if available
      personaId: activePersonas.find(p => p.isDefault)?.id || activePersonas[0]?.id
    };
    setCurrentChat(prev => [...prev, deleteMessage]);
  };

  return (
    <div className="chat-container">
      {/* Fixed toggle button that's always visible */}
      <button 
        className="participants-toggle-fixed"
        onClick={() => setShowParticipants(!showParticipants)}
        aria-label={showParticipants ? "Hide participants" : "Show participants"}
        title={showParticipants ? "Hide active personas" : "Show active personas"}
      >
        👥
      </button>
      
      {/* Collapsible participants panel */}
      <div className={`active-participants ${showParticipants ? 'expanded' : 'collapsed'}`}>
        <button 
          className="participants-toggle"
          onClick={() => setShowParticipants(false)}
          aria-label="Hide participants"
        >
          ✕
        </button>
        
        <div className="participants-content">
          <div className="active-personas">
            <h4>Active Personas</h4>
            <div className="persona-list">
              {activePersonas.map(persona => (
                <div key={persona.id} className="persona-item">
                  <img 
                    src={persona.image || '/default-avatar.png'} 
                    alt={persona.name}
                    className="persona-avatar"
                  />
                  <span>{persona.name}</span>
                  <button 
                    className="remove-persona"
                    onClick={() => handleRemovePersona(persona.id)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
          
          {activeUsers.length > 0 && (
            <div className="active-users">
              <h4>Active Users</h4>
              <div className="user-list">
                {activeUsers.map(user => (
                  <div key={user.id} className="user-item">
                    <img 
                      src={'/user-avatar.png'} 
                      alt={user.displayName || user.username}
                      className="user-avatar"
                    />
                    <span>{user.displayName || user.username}</span>
                    <button 
                      className="remove-user"
                      onClick={() => handleRemoveUser(user.id)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="messages">
        {currentChat.map(message => (
          <Message 
            key={message.id} 
            message={message} 
            onRegenerate={handleRegenerate}
            personas={personas}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      {showDebugLog && (
        <div className="debug-panel">
          <h3>Debug Information</h3>
          <div className="debug-controls">
            <button onClick={() => setDebugLog([])}>Clear Logs</button>
            <div className="debug-filters">
              <label>
                <input 
                  type="checkbox" 
                  checked={true} 
                  onChange={() => {}} 
                />
                Show Tool Usage
              </label>
            </div>
          </div>
          <div className="debug-logs">
            {debugLog.map((log, index) => (
              <div key={index} className={`log-entry ${log.type}`}>
                <div className="log-header">
                  [{log.timestamp}] {log.type}
                  {log.type === 'RPG_OUTCOME' && (
                    <span className="dice-result">🎲 {log.data.match(/"total": (\d+)/)[1]}</span>
                  )}
                  {log.type === 'TOOL_START' && (
                    <span className="tool-start">🛠️ Started</span>
                  )}
                  {log.type === 'TOOL_END' && (
                    <span className="tool-end">✅ Completed</span>
                  )}
                  {log.type === 'AGENT_ACTION' && (
                    <span className="agent-action">🤖 Action</span>
                  )}
                </div>
                <pre>{typeof log.data === 'string' ? log.data : JSON.stringify(log.data, null, 2)}</pre>
              </div>
            ))}
          </div>
        </div>
      )}

      <button 
        className="debug-toggle"
        onClick={() => setShowDebugLog(!showDebugLog)}
      >
        {showDebugLog ? 'Hide Debug' : 'Show Debug'}
      </button>

      <ChatInput
        personas={personas}
        onSendMessage={(message) => {
          if (message.startsWith('/')) {
            const [command, ...args] = message.slice(1).split(' ');
            handleCommand(command, args.join(' '));
          } else {
            handleSubmit(message);
          }
        }}
        isLoading={isLoading}
        onCancel={() => {
          setIsCancelled(true);
          if (controllerRef.current) {
            controllerRef.current.abort();
          }
        }}
      />

      {showImageModal && (
        <ImageModal
          onClose={() => setShowImageModal(false)}
          onGenerate={(options) => generateImage(options)}
          initialPrompt={imagePrompt}
        />
      )}

      <div className="knowledge-base">
        <h4>Chat Knowledge Base</h4>
        <input 
          type="file"
          onChange={handleFileUpload}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.jpg,.jpeg,.png"
        />
        <div className="file-list">
          {chatKnowledgeFiles.map(file => (
            <FilePreview key={file.id} fileId={file.id} onDelete={handleFileDelete} />
          ))}
        </div>
      </div>
    </div>
  );
};

const ImageModal = ({ onClose, onGenerate, initialPrompt }) => {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [style, setStyle] = useState('realistic');
  const [enhancement, setEnhancement] = useState(true);
  const [selectedModel, setSelectedModel] = useState(IMAGE_MODELS.FLUX_SCHNELL);

  const handleGenerate = () => {
    onGenerate({
      prompt,
      style,
      enhancement,
      model: selectedModel
    });
    onClose();
  };

  return (
    <div className="image-modal">
      <h3>Generate Image</h3>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe the image you want to generate..."
      />
      <div className="image-options">
        <label>
          Style:
          <select value={style} onChange={(e) => setStyle(e.target.value)}>
            <option value="realistic">Realistic</option>
            <option value="cartoon">Cartoon</option>
            <option value="anime">Anime</option>
          </select>
        </label>
        <label>
          Model:
          <select 
            value={selectedModel} 
            onChange={(e) => setSelectedModel(e.target.value)}
          >
            <option value={IMAGE_MODELS.FLUX_SCHNELL}>Flux Schnell (Fast)</option>
            <option value={IMAGE_MODELS.FLUX_DEV}>Flux Dev</option>
          </select>
        </label>
        <label>
          <input
            type="checkbox"
            checked={enhancement}
            onChange={(e) => setEnhancement(e.target.checked)}
          />
          Enhance Prompt
        </label>
      </div>
      <div className="modal-actions">
        <button onClick={handleGenerate}>Generate</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
};

export default Chat;



