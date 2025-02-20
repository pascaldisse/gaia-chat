import React, { useState } from 'react';
import Chat from './components/Chat';
import Sidebar from './components/Sidebar';
import './styles/Sidebar.css';
import './App.css';
import './styles/Chat.css';
import { MODELS } from './config';

function App() {
  const [currentChat, setCurrentChat] = useState([]);
  const [model, setModel] = useState(MODELS.LLAMA3_70B);
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful assistant.');

  return (
    <div className="app">
      <Sidebar 
        setCurrentChat={setCurrentChat} 
        model={model} 
        setModel={setModel}
        systemPrompt={systemPrompt}
        setSystemPrompt={setSystemPrompt}
      />
      <Chat 
        currentChat={currentChat} 
        setCurrentChat={setCurrentChat} 
        model={model}
        systemPrompt={systemPrompt}
      />
    </div>
  );
}

export default App;

