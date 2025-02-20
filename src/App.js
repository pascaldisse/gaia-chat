import React, { useState, useEffect } from 'react';
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
  const [chatHistory, setChatHistory] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);

  // Load chat history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('chatHistory');
    if (savedHistory) {
      setChatHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Save chat history to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
  }, [chatHistory]);

  // Create new chat
  const createNewChat = () => {
    const newChat = {
      id: Date.now(),
      messages: [],
      systemPrompt,
      model,
      timestamp: new Date().toISOString(),
      title: 'New Chat'
    };
    setChatHistory(prev => [newChat, ...prev]);
    setSelectedChatId(newChat.id);
    setCurrentChat([]);
  };

  // Update current chat in history
  useEffect(() => {
    if (selectedChatId && currentChat.length > 0) {
      setChatHistory(prev => prev.map(chat => 
        chat.id === selectedChatId 
          ? { ...chat, messages: currentChat, systemPrompt, model }
          : chat
      ));
    }
  }, [currentChat, selectedChatId, systemPrompt, model]);

  return (
    <div className="app">
      <Sidebar 
        setCurrentChat={setCurrentChat} 
        model={model} 
        setModel={setModel}
        systemPrompt={systemPrompt}
        setSystemPrompt={setSystemPrompt}
        chatHistory={chatHistory}
        selectedChatId={selectedChatId}
        setSelectedChatId={setSelectedChatId}
        createNewChat={createNewChat}
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

