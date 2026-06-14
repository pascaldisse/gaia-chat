import React, { useState, useRef, useEffect } from 'react';
import Message from './Message';
import { MODELS, IMAGE_MODELS } from '../config';
import '../styles/Chat.css';
import ChatInput from './ChatInput';
import { RPGSystem } from '../utils/RPGSystem';
import Persona from '../models/Persona';
import { DEFAULT_PERSONA_ID } from '../config/defaultPersona';
import FilePreview from './FilePreview';
import { chatDB, knowledgeDB, userDB } from '../services/db';
import { parseFileContent } from '../utils/FileParser';
import { createPersonaTools } from "../services/tools";
import { isDiceRollCommand, extractDiceParams, formatDiceNotation } from "../utils/ToolUtilities";
import { getImageProviderConfig, resolveModelForProvider } from '../services/providerService';
import { streamChatCompletion } from '../services/llmService';

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
  const messagesContainerRef = useRef(null);
  // Whether the view should stick to the bottom. Stays true while the user is
  // near the bottom; flips to false as soon as they scroll up so streaming
  // updates don't yank them back down.
  const isPinnedToBottomRef = useRef(true);
  const [isCancelled, setIsCancelled] = useState(false);
  const [showDebugLog, setShowDebugLog] = useState(false);
  const [rpgOutcomes, setRpgOutcomes] = useState({});
  const [showImageModal, setShowImageModal] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('flux_schnell');
  const [selectedStyle, setSelectedStyle] = useState('realistic');
  const [useEnhancement, setUseEnhancement] = useState(true);
  const [imageModel, setImageModel] = useState(getImageProviderConfig().imageModel || IMAGE_MODELS.FLUX_SCHNELL);
  const [chatKnowledgeFiles, setChatKnowledgeFiles] = useState([]);
  const [filesUpdated, setFilesUpdated] = useState(false);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);

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

  // Only scroll the messages list itself — never via scrollIntoView, which
  // would also scroll the page/ancestors and yank the whole viewport.
  const scrollToBottom = () => {
    const container = messagesContainerRef.current;
    if (container && isPinnedToBottomRef.current) {
      container.scrollTop = container.scrollHeight;
    }
  };

  // Track whether the user is near the bottom; once they scroll up, stop
  // auto-following so streaming updates don't drag them back down.
  const handleMessagesScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    isPinnedToBottomRef.current = distanceFromBottom < 150;
  };

  useEffect(scrollToBottom, [currentChat]);

  // When switching to a different chat, re-pin and jump to the latest message
  // (the messages load asynchronously, so the [currentChat] effect handles the
  // actual scroll once they arrive).
  useEffect(() => {
    isPinnedToBottomRef.current = true;
  }, [selectedChatId]);

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
      const modulatedPrompt = `${persona.systemPrompt}
${generateRpgInstructions(outcome)}

Recent conversation:
${recentMessages}

${knowledgeContent ? `Knowledge Base:\n${knowledgeContent}\n` : ""}

You are ${persona.name}. Respond naturally to the most recent message.`;

      await streamChatCompletion({
        model: resolveModelForProvider(persona.model),
        messages: [
          { role: "system", content: modulatedPrompt },
          { role: "user", content: triggerMessage.content }
        ],
        maxTokens: 1000,
        signal: controllerRef.current.signal,
        onToken: (_token, fullText) => {
          setCurrentChat(prev => 
            prev.map(msg => 
              msg.id === messageId 
                ? { ...msg, content: fullText }
                : msg
            )
          );
        }
      });

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
    
    // Check if web search is enabled
    if (webSearchEnabled) {
      console.log('Web search is enabled, checking for search persona');
      
      // Find or enable a persona with search capability
      const searchPersona = activePersonas.find(p => personaHasTool(p, 'duckDuckGoSearch')) || 
                         activePersonas.find(p => p.isDefault) || 
                         activePersonas[0];
      
      if (searchPersona) {
        console.log(`Using ${searchPersona.name} for web search`);
        
        // Make sure search is enabled for this persona
        if (!searchPersona.agentSettings) {
          searchPersona.agentSettings = { toolConfig: {} };
        } else if (!searchPersona.agentSettings.toolConfig) {
          searchPersona.agentSettings.toolConfig = {};
        }
        
        // Enable DuckDuckGo search for this persona
        searchPersona.agentSettings.toolConfig.duckDuckGoSearch = true;
        console.log(`Enabled DuckDuckGo search for ${searchPersona.name}`, searchPersona.agentSettings);
        
        // Create component reference for search tool
        const componentRef = {
          knowledgeDB,
          generateImage,
          imageModel,
          selectedStyle,
          setCurrentChat
        };
        
        // Create a search tool we can use directly
        const searchTools = createPersonaTools(componentRef, searchPersona);
        const searchTool = searchTools.find(tool => tool.name === "duckduckgo_search");
        
        if (searchTool) {
          console.log(`Created search tool for ${searchPersona.name}`);
          
          // Add message indicating search is happening
          setCurrentChat(prev => [...prev, {
            id: Date.now(),
            content: `🔍 Searching the web for information related to your message...`,
            isUser: false,
            isCommand: true,
            personaId: searchPersona.id
          }]);
          
          // Execute the search
          searchTool.func(message)
            .then(() => {
              console.log("Web search completed");
            })
            .catch(error => {
              console.error("Web search error:", error);
              setCurrentChat(prev => [...prev, {
                id: Date.now(),
                content: `❌ Error searching the web: ${error.message}`,
                isUser: false,
                isCommand: true,
                personaId: searchPersona.id
              }]);
            });
        }
      }
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

          await streamChatCompletion({
            model: resolveModelForProvider(persona.model),
            messages: [
              { role: "system", content: modulatedPrompt },
              { role: "user", content: newMessage.content }
            ],
            maxTokens: 1000,
            signal: controllerRef.current.signal,
            onToken: (_token, fullText) => {
              setCurrentChat(prev => 
                prev.map(msg => 
                  msg.id === messageId 
                    ? { ...msg, content: fullText }
                    : msg
                )
              );
            }
          });
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
      case 'search':
        if (!args || args.trim() === '') {
          console.warn('Search command requires a query');
          setCurrentChat(prev => [...prev, {
            id: Date.now(),
            content: `⚠️ Please provide a search query. Usage: /search your search query`,
            isUser: false,
            isCommand: true,
            personaId: activePersonas.find(p => p.isDefault)?.id || activePersonas[0]?.id
          }]);
          return;
        }
        
        // Find a persona with DuckDuckGo search tool enabled
        const searchEnabledPersona = activePersonas.find(p => 
          personaHasTool(p, 'duckDuckGoSearch')
        );
        
        if (!searchEnabledPersona) {
          // No persona has search enabled, enable it for the default persona
          const defaultPersona = activePersonas.find(p => p.isDefault) || activePersonas[0];
          
          if (defaultPersona && defaultPersona.agentSettings) {
            // Enable the search tool for this persona temporarily
            if (!defaultPersona.agentSettings.toolConfig) {
              defaultPersona.agentSettings.toolConfig = {};
            }
            defaultPersona.agentSettings.toolConfig.duckDuckGoSearch = true;
            
            // Create component reference for tool creation
            const componentRef = {
              knowledgeDB,
              generateImage,
              imageModel,
              selectedStyle,
              setCurrentChat
            };
            
            // Create tools including the search tool
            const searchTools = createPersonaTools(componentRef, defaultPersona);
            
            // Find the search tool
            const searchTool = searchTools.find(tool => tool.name === "duckduckgo_search");
            
            if (searchTool) {
              // Execute search directly
              setCurrentChat(prev => [...prev, {
                id: Date.now(),
                content: `🔍 Searching the web for: "${args}"...`,
                isUser: false,
                isCommand: true,
                personaId: defaultPersona.id
              }]);
              
              searchTool.func(args)
                .then(() => {
                  console.log("Search completed");
                  // The tool will add its own message to chat with results
                })
                .catch(error => {
                  console.error("Search error:", error);
                  setCurrentChat(prev => [...prev, {
                    id: Date.now(),
                    content: `❌ Error searching the web: ${error.message}`,
                    isUser: false,
                    isCommand: true,
                    personaId: defaultPersona.id
                  }]);
                });
            } else {
              console.error("Failed to create search tool");
              setCurrentChat(prev => [...prev, {
                id: Date.now(),
                content: `❌ Error: Failed to initialize search tool`,
                isUser: false,
                isCommand: true,
                personaId: defaultPersona.id
              }]);
            }
          }
        } else {
          // Found a persona with search enabled, use it
          const componentRef = {
            knowledgeDB,
            generateImage,
            imageModel,
            selectedStyle,
            setCurrentChat
          };
          
          const searchTools = createPersonaTools(componentRef, searchEnabledPersona);
          const searchTool = searchTools.find(tool => tool.name === "duckduckgo_search");
          
          if (searchTool) {
            setCurrentChat(prev => [...prev, {
              id: Date.now(),
              content: `🔍 ${searchEnabledPersona.name} is searching for: "${args}"...`,
              isUser: false,
              isCommand: true,
              personaId: searchEnabledPersona.id
            }]);
            
            searchTool.func(args)
              .then(() => {
                console.log("Search completed");
              })
              .catch(error => {
                console.error("Search error:", error);
                setCurrentChat(prev => [...prev, {
                  id: Date.now(),
                  content: `❌ Error searching the web: ${error.message}`,
                  isUser: false,
                  isCommand: true,
                  personaId: searchEnabledPersona.id
                }]);
              });
          }
        }
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

      const imageProvider = getImageProviderConfig();
      if (!imageProvider.apiKey) {
        throw new Error('Missing DeepInfra API key. Image generation currently requires a DeepInfra key in Settings.');
      }

      const response = await fetch(`${imageProvider.inferenceBaseURL}/${options.model}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${imageProvider.apiKey}`,
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
	              content: options.prompt,
	              imageData: imageBase64,
	              imageSrc: imageSource,
	              imageAlt: options.prompt
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
      <div className="messages" ref={messagesContainerRef} onScroll={handleMessagesScroll}>
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
            // We will handle the webSearchEnabled flag directly in handleSubmit
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
	        onToggleSearch={(enabled) => {
          setWebSearchEnabled(enabled);
          // Add a notification to the chat
          setCurrentChat(prev => [...prev, {
            id: Date.now(),
            content: enabled 
              ? "🔍 Web search enabled. Your messages will now also search the web using DuckDuckGo." 
              : "🔍 Web search disabled.",
            isUser: false,
            isCommand: true,
            // Use the default persona for system messages if available
	            personaId: activePersonas.find(p => p.isDefault)?.id || activePersonas[0]?.id
	          }]);
	        }}
        webSearchEnabled={webSearchEnabled}
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
