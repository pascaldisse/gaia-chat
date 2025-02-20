import React from 'react';
import { MODELS } from '../config';
import '../styles/Sidebar.css';

const Sidebar = ({ setCurrentChat, model, setModel, systemPrompt, setSystemPrompt }) => {
  return (
    <div className="sidebar">
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

      <button 
        className="new-chat-btn"
        onClick={() => setCurrentChat([])}
      >
        New Chat
      </button>
    </div>
  );
};

export default Sidebar;
