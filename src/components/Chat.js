import React, { useState, useRef, useEffect } from 'react';
import Message from './Message';
import { API_URL, API_KEY, MODELS, IMAGE_MODELS } from '../config';
import '../styles/Chat.css';
import ChatInput from './ChatInput';
import { RPGSystem } from '../utils/RPGSystem';
import { Persona } from '../utils/Persona';
import { DEFAULT_PERSONA_ID } from '../config/defaultPersona';
import FilePreview from './FilePreview';
import { knowledgeDB } from '../services/db';
import { parseFileContent } from '../utils/FileParser';

const Chat = ({ 
  currentChat, 
  setCurrentChat, 
  model, 
  systemPrompt, 
  personas,
  activePersonas,
  setActivePersonas,
  selectedChatId,
  chatHistory
}) => {
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

  const updateActivePersonas = (message, currentPersonas) => {
    const mentionedPersonas = getMentionedPersonas(message);
    const newPersonas = mentionedPersonas.filter(p => 
      !currentPersonas.some(ap => ap.id === p.id)
    );
    return [...currentPersonas, ...newPersonas];
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

      const modulatedPrompt = `${persona.systemPrompt}
${generateRpgInstructions(outcome)}

Recent conversation:
${recentMessages}

You are ${persona.name}. Respond naturally to the most recent message.`;

      const response = await fetch(API_URL, {
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

      setCurrentChat(prev => [...prev, {
        id: messageId,
        content: '',
        isUser: false,
        personaId: persona.id
      }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
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

      persona.markActive();
    } catch (error) {
      console.error('Error generating response:', error);
      if (error.name === 'AbortError') {
        setCurrentChat(prev => prev.filter(msg => msg.id !== messageId));
      }
      addDebugLog('ERROR', error.message);
    }
  };

  const handleSubmit = async (message) => {
    if (!message.trim()) return;

    // Check for command
    if (message.startsWith('/')) {
      const [command, ...args] = message.slice(1).split(' ');
      handleCommand(command, args.join(' '));
      return;
    }

    const newMessage = {
      id: Date.now(),
      content: message,
      isUser: true
    };
    setCurrentChat(prev => [...prev, newMessage]);
    setIsLoading(true);

    try {
      // Get mentioned personas and update active list
      const mentionedPersonas = getMentionedPersonas(message);
      const updatedPersonas = updateActivePersonas(message, activePersonas);
      setActivePersonas(updatedPersonas);

      // Use all active personas as response candidates when no one is mentioned
      const responseCandidates = mentionedPersonas.length > 0 
        ? [...new Set([...updatedPersonas, ...mentionedPersonas])]
        : activePersonas;

      const context = analyzeMessageContext(message);
      
      // Calculate responses for all candidates
      const responseQueue = await Promise.all(
        responseCandidates.map(async (persona) => {
          const outcome = RPGSystem.calculateOutcome(persona, context);
          return { persona, outcome };
        })
      );

      // Filter and sort responders by initiative
      const responders = responseQueue
        .filter(({ outcome }) => outcome.shouldRespond)
        .sort((a, b) => {
          // Always prioritize GAIA if present
          if (a.persona.id === DEFAULT_PERSONA_ID) return -1;
          if (b.persona.id === DEFAULT_PERSONA_ID) return 1;
          
          const aIsMentioned = context.mentionedPersonaIds?.includes(a.persona.id);
          const bIsMentioned = context.mentionedPersonaIds?.includes(b.persona.id);
          
          // If both are mentioned or neither, sort by initiative
          if (aIsMentioned === bIsMentioned) {
            return b.outcome.responsePriority - a.outcome.responsePriority;
          }
          // If only a is mentioned, a comes first
          if (aIsMentioned) return -1;
          return 1;
        });

      // Generate responses in order
      for (const { persona, outcome } of responders) {
        await generatePersonaResponse(persona, newMessage, outcome);
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
        imageData: null
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
        isUser: false
      }]);
    }
    setIsLoading(false);
  };

  const handleRemovePersona = (personaId) => {
    setActivePersonas(prev => 
      prev.filter(p => p.id !== personaId)
    );
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

  useEffect(() => {
    if (selectedChatId) {
      const chat = chatHistory.find(c => c.id === selectedChatId);
      if (chat?.knowledgeFiles) {
        loadChatFiles(chat.knowledgeFiles);
      }
    }
  }, [selectedChatId]);

  const loadChatFiles = async (fileIds) => {
    if (fileIds?.length > 0) {
      const files = await knowledgeDB.getFiles(fileIds);
      setChatKnowledgeFiles(files);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      // Convert ArrayBuffer to Base64
      const arrayBuffer = await file.arrayBuffer();
      const base64Content = btoa(
        new Uint8Array(arrayBuffer)
          .reduce((data, byte) => data + String.fromCharCode(byte), '')
      );

      // Parse the content
      const parsedText = await parseFileContent(arrayBuffer, file.type, file.name);

      const newFile = {
        name: file.name,
        type: file.type,
        content: base64Content, // Store as Base64 string instead of ArrayBuffer
        parsedText: parsedText,
        uploadedAt: Date.now()
      };

      const id = await knowledgeDB.addFile(newFile);
      setCurrentChat(prev => {
        const currentChatState = Array.isArray(prev) ? prev : [];
        return {
          ...currentChatState,
          knowledgeFiles: [...(currentChatState.knowledgeFiles || []), id]
        };
      });
      setChatKnowledgeFiles(prev => [...prev, { ...newFile, id }]);

      // Update command message to include parsed text preview
      const fileMessage = {
        id: Date.now(),
        content: `📁 Added file: ${newFile.name}\nParsed content: ${parsedText.substring(0, 200)}...`,
        isUser: false,
        isCommand: true,
        fileData: { id, parsedText }
      };
      setCurrentChat(prev => [...(Array.isArray(prev) ? prev : []), fileMessage]);
    } catch (error) {
      console.error('Error uploading file:', error);
      // Add error message to chat
      const errorMessage = {
        id: Date.now(),
        content: `❌ Error uploading file: ${file.name}`,
        isUser: false,
        isCommand: true
      };
      setCurrentChat(prev => [...(Array.isArray(prev) ? prev : []), errorMessage]);
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
      isCommand: true
    };
    setCurrentChat(prev => [...prev, deleteMessage]);
  };

  return (
    <div className="chat-container">
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
          <button onClick={() => setDebugLog([])}>Clear Logs</button>
          <div className="debug-logs">
            {debugLog.map((log, index) => (
              <div key={index} className={`log-entry ${log.type}`}>
                <div className="log-header">
                  [{log.timestamp}] {log.type}
                  {log.type === 'RPG_OUTCOME' && (
                    <span className="dice-result">🎲 {log.data.match(/"total": (\d+)/)[1]}</span>
                  )}
                </div>
                <pre>{log.data}</pre>
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



