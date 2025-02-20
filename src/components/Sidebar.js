import React from 'react';
import { MODELS } from '../config';
import '../styles/Sidebar.css';

const Sidebar = ({ 
  personas,
  selectedPersonaId,
  setSelectedPersonaId,
  createNewPersona,
  setCurrentChat, 
  model, 
  setModel, 
  systemPrompt, 
  setSystemPrompt,
  chatHistory,
  selectedChatId,
  setSelectedChatId,
  createNewChat
}) => {
  const getChatTitle = (chat) => {
    const firstMessage = chat.messages[0]?.content;
    return firstMessage ? firstMessage.slice(0, 30) + '...' : 'New Chat';
  };

  const handleChatSelect = (chat) => {
    setSelectedChatId(chat.id);
    setCurrentChat(chat.messages);
    setSystemPrompt(chat.systemPrompt);
    setModel(chat.model);
  };

  return (
    <div className="sidebar">
      <button 
        className="new-chat-btn"
        onClick={createNewChat}
      >
        + New Chat
      </button>

      <div className="persona-section">
        <div className="section-header">
          <h3>Personas</h3>
          <button
            className="new-persona-btn"
            onClick={() => {
              setSelectedPersonaId(null);
              createNewPersona();
            }}
          >
            + New
          </button>
        </div>
        <div className="persona-list">
          {personas.map(persona => (
            <div 
              key={persona.id}
              className={`persona-item ${selectedPersonaId === persona.id ? 'selected' : ''}`}
              onClick={() => setSelectedPersonaId(persona.id)}
            >
              <div className="persona-title">{persona.name}</div>
              <div className="persona-prompt">
                {persona.systemPrompt.substring(0, 30)}...
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="chat-history">
        {chatHistory.map(chat => (
          <div 
            key={chat.id}
            className={`chat-item ${selectedChatId === chat.id ? 'selected' : ''}`}
            onClick={() => handleChatSelect(chat)}
          >
            <div className="chat-title">{getChatTitle(chat)}</div>
            <div className="chat-timestamp">
              {new Date(chat.timestamp).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>

      <div className="sidebar-section">
        <h3>Model</h3>
        <select 
          className="model-selector"
          value={model} 
          onChange={(e) => setModel(e.target.value)}
        >
          {Object.entries(MODELS).map(([key, value]) => (
            <option key={key} value={value}>{key}</option>
          ))}
        </select>
      </div>

      <div className="sidebar-section">
        <h3>System Prompt</h3>
        <textarea
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          placeholder="Enter system prompt..."
          rows={4}
          className="system-prompt-input"
        />
      </div>
    </div>
  );
};

export default Sidebar;
