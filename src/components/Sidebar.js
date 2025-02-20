import React from 'react';
import { MODELS } from '../config';
import '../styles/Sidebar.css';

const Sidebar = ({ setCurrentChat, model, setModel }) => {
  const handleNewChat = () => setCurrentChat([]);
  
  return (
    <div className="sidebar">
      <button onClick={handleNewChat} className="new-chat-btn">
        + New Chat
      </button>
      <div className="model-selector">
        <label>Select Model:</label>
        <select value={model} onChange={(e) => setModel(e.target.value)}>
          <option value={MODELS.LLAMA3_70B}>Llama 3 70B</option>
          <option value={MODELS.MIXTRAL_8X22B}>Mixtral 8x22B</option>
          <option value={MODELS.DEEPSEEK_V3}>DeepSeek V3</option>
          <option value={MODELS.DEEPSEEK_R1}>DeepSeek R1</option>
        </select>
      </div>
    </div>
  );
};

export default Sidebar;
