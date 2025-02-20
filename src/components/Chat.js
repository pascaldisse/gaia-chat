import React, { useState, useRef, useEffect } from 'react';
import Message from './Message';
import { API_URL, API_KEY, MODELS } from '../config';
import '../styles/Chat.css';

const Chat = ({ currentChat, setCurrentChat, model, systemPrompt }) => {
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [debugLog, setDebugLog] = useState([]);
  const messagesEndRef = useRef(null);
  const [isCancelled, setIsCancelled] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const newMessage = {
      id: Date.now(),
      content: inputMessage,
      isUser: true
    };

    // Single state update for user message
    setCurrentChat(prev => [...prev, newMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const messages = [];
      if (systemPrompt) {
        messages.push({ role: "system", content: systemPrompt });
      }
      messages.push({ role: "user", content: inputMessage });

      const requestBody = {
        model: model,
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
        isUser: false
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
      const messages = [];
      if (systemPrompt) {
        messages.push({ role: "system", content: systemPrompt });
      }
      messages.push({ role: "user", content: userMessage.content });

      const requestBody = {
        model: model,
        messages: messages,
        stream: true
      };

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
        isUser: false
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
          />
        ))}
        <div ref={messagesEndRef} />
      </div>
      
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

      <form className="input-area" onSubmit={handleSubmit}>
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type your message..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Sending...' : 'Send'}
        </button>
        {isLoading && (
          <button 
            type="button"
            className="cancel-button" 
            onClick={() => {
              setIsCancelled(true);
              if (controllerRef.current) {
                controllerRef.current.abort();
              }
            }}>
            Cancel
          </button>
        )}
      </form>
    </div>
  );
};

export default Chat;
