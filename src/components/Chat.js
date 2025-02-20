import React, { useState, useRef, useEffect } from 'react';
import Message from './Message';
import { API_URL, API_KEY, MODELS } from '../config';
import '../styles/Chat.css';
import ChatInput from './ChatInput';

const Chat = ({ currentChat, setCurrentChat, model, systemPrompt, personas }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [debugLog, setDebugLog] = useState([]);
  const messagesEndRef = useRef(null);
  const [isCancelled, setIsCancelled] = useState(false);
  const [activePersonas, setActivePersonas] = useState([]);
  const [showDebugLog, setShowDebugLog] = useState(false);

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

  const handleSubmit = async (message) => {
    if (!message.trim()) return;

    const newMessage = {
      id: Date.now(),
      content: message,
      isUser: true
    };

    // Update active personas
    const updatedPersonas = updateActivePersonas(message, activePersonas);
    setActivePersonas(updatedPersonas);

    // Single state update for user message
    setCurrentChat(prev => [...prev, newMessage]);
    setIsLoading(true);

    try {
      // Get the last mentioned persona's settings
      const mentionedPersonas = getMentionedPersonas(message);
      const activePersona = mentionedPersonas[mentionedPersonas.length - 1];
      
      const effectiveSystemPrompt = activePersona?.systemPrompt || systemPrompt;
      const effectiveModel = activePersona?.model || model;

      const messages = [];
      if (effectiveSystemPrompt) {
        messages.push({ role: "system", content: effectiveSystemPrompt });
      }
      messages.push({ role: "user", content: message });

      const requestBody = {
        model: effectiveModel,
        messages: messages,
        stream: true
      };

      addDebugLog('REQUEST', {
        url: API_URL,
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: requestBody
      });

      // Create and store the AbortController in the ref
      controllerRef.current = new AbortController();
      const signal = controllerRef.current.signal;

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify(requestBody),
        signal
      });

      addDebugLog('RESPONSE_INIT', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        const errorData = await response.json();
        addDebugLog('RESPONSE_ERROR', errorData);
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';
      let messageId = Date.now();

      setCurrentChat(prev => [...prev, {
        id: messageId,
        content: '',
        isUser: false,
        personaId: activePersona?.id
      }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        addDebugLog('CHUNK', { raw: chunk });

        const lines = chunk.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              addDebugLog('PARSE_SUCCESS', data);

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
              addDebugLog('PARSE_ERROR', {
                error: error.message,
                line: line
              });
            }
          }
        }
      }
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

  const handleRegenerate = async (message) => {
    const messageIndex = currentChat.findIndex(m => m.id === message.id);
    const userMessage = currentChat[messageIndex - 1];
    
    if (!userMessage || !userMessage.isUser) return;
    
    setCurrentChat(prev => prev.slice(0, messageIndex));
    setIsLoading(true);

    try {
      const mentionedPersonas = getMentionedPersonas(userMessage.content);
      const activePersona = mentionedPersonas[mentionedPersonas.length - 1];
      
      const effectiveSystemPrompt = activePersona?.systemPrompt || systemPrompt;
      const effectiveModel = activePersona?.model || model;

      const messages = [];
      if (effectiveSystemPrompt) {
        messages.push({ role: "system", content: effectiveSystemPrompt });
      }
      messages.push({ role: "user", content: userMessage.content });

      const requestBody = {
        model: effectiveModel,
        messages: messages,
        stream: true
      };

      addDebugLog('REQUEST', {
        url: API_URL,
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: requestBody
      });

      // Create and store the AbortController in the ref
      controllerRef.current = new AbortController();
      const signal = controllerRef.current.signal;

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify(requestBody),
        signal
      });

      addDebugLog('RESPONSE_INIT', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        const errorData = await response.json();
        addDebugLog('RESPONSE_ERROR', errorData);
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';
      let messageId = Date.now();

      setCurrentChat(prev => [...prev, {
        id: messageId,
        content: '',
        isUser: false,
        personaId: activePersona?.id
      }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        addDebugLog('CHUNK', { raw: chunk });

        const lines = chunk.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              addDebugLog('PARSE_SUCCESS', data);

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
              addDebugLog('PARSE_ERROR', {
                error: error.message,
                line: line
              });
            }
          }
        }
      }
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

  return (
    <div className="chat-container">
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
        onSendMessage={handleSubmit}
        isLoading={isLoading}
        onCancel={() => {
          setIsCancelled(true);
          if (controllerRef.current) {
            controllerRef.current.abort();
          }
        }}
      />
    </div>
  );
};

export default Chat;

