import React, { useState, useEffect } from 'react';
import Chat from './components/Chat';
import Sidebar from './components/Sidebar';
import { chatDB } from './services/db';
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

  // Load chat history from database
  useEffect(() => {
    const loadChats = async () => {
      try {
        const chats = await chatDB.getAllChats();
        const sortedChats = chats.sort((a, b) => b.createdAt - a.createdAt);
        
        // If there's a selected chat, ensure we have the latest version
        if (selectedChatId) {
          const currentChatFromDB = chats.find(c => c.id === selectedChatId);
          if (currentChatFromDB) {
            setCurrentChat(currentChatFromDB.messages);
          }
        }
        
        setChatHistory(sortedChats);
      } catch (error) {
        console.error('Error loading chats:', error);
      }
    };
    loadChats();
  }, [selectedChatId]);

  // Save chat to database when it changes
  useEffect(() => {
    const saveChat = async () => {
      if (selectedChatId && currentChat.length > 0) {
        const updatedChat = {
          id: selectedChatId,
          messages: currentChat,
          systemPrompt,
          model,
          createdAt: chatHistory.find(c => c.id === selectedChatId)?.createdAt || Date.now(),
          timestamp: Date.now(),
          title: currentChat[0]?.content?.slice(0, 30) + '...' || 'New Chat'
        };

        try {
          await chatDB.updateChat(updatedChat);
          const freshChats = await chatDB.getAllChats();
          setChatHistory(freshChats.sort((a, b) => b.createdAt - a.createdAt));
        } catch (error) {
          console.error('Error saving chat:', error);
        }
      }
    };

    // Debounce the save operation
    const timeoutId = setTimeout(saveChat, 100);
    return () => clearTimeout(timeoutId);
  }, [currentChat, selectedChatId, systemPrompt, model, chatHistory]);

  const createNewChat = async () => {
    const newChat = {
      id: Date.now(),
      messages: [],
      systemPrompt,
      model,
      createdAt: Date.now(),
      timestamp: Date.now(),
      title: 'New Chat'
    };

    try {
      await chatDB.saveChat(newChat);
      const updatedHistory = await chatDB.getAllChats();
      setChatHistory(updatedHistory.sort((a, b) => b.createdAt - a.createdAt));
      setSelectedChatId(newChat.id);
      setCurrentChat([]);
    } catch (error) {
      console.error('Error creating new chat:', error);
    }
  };

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

