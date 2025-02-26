import React, { useState, useEffect } from 'react';
import Chat from './components/Chat';
import Sidebar from './components/Sidebar';
import { chatDB } from './services/db';
import './styles/Sidebar.css';
import './App.css';
import './styles/Chat.css';
import { MODELS } from './config';
import { personaDB } from './services/db';
import Persona from './models/Persona';
import PersonaManager from './components/personas/PersonaManager';
import { GAIA_CONFIG, DEFAULT_PERSONA_ID } from './config/defaultPersona';

function App() {
  const [currentChat, setCurrentChat] = useState([]);
  const [model, setModel] = useState(MODELS.LLAMA3_70B);
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful assistant.');
  const [chatHistory, setChatHistory] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [personas, setPersonas] = useState([]);
  const [selectedPersonaId, setSelectedPersonaId] = useState(null);
  const [showPersonaManager, setShowPersonaManager] = useState(false);
  const [editingPersona, setEditingPersona] = useState(null);
  const [activePersonas, setActivePersonas] = useState([]);

  // Load chat history from database
  useEffect(() => {
    const loadChats = async () => {
      try {
        const chats = await chatDB.getAllChats();
        const sortedChats = chats.sort((a, b) => b.createdAt - a.createdAt);
        
        if (selectedChatId) {
          const currentChatFromDB = chats.find(c => c.id === selectedChatId);
          if (currentChatFromDB) {
            setCurrentChat(
              Array.isArray(currentChatFromDB.messages) 
                ? currentChatFromDB.messages 
                : []
            );
            const activePersonas = personas.filter(p => 
              currentChatFromDB.activePersonas?.includes(p.id)
            );
            setActivePersonas(activePersonas);
          }
        }
        
        setChatHistory(sortedChats);
      } catch (error) {
        console.error('Error loading chats:', error);
      }
    };
    loadChats();
  }, [selectedChatId, personas]);

  // Save chat to database when it changes
  useEffect(() => {
    const saveChat = async () => {
      if (selectedChatId && Array.isArray(currentChat) && currentChat.length > 0) {
        // First get the existing chat to preserve knowledgeFiles
        const existingChat = await chatDB.getChatById(selectedChatId);
        
        const updatedChat = {
          id: selectedChatId,
          messages: currentChat,
          systemPrompt,
          model,
          activePersonas: activePersonas.map(p => p.id),
          // Preserve existing knowledgeFiles if they exist
          knowledgeFiles: existingChat?.knowledgeFiles || [],
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

    const timeoutId = setTimeout(saveChat, 100);
    return () => clearTimeout(timeoutId);
  }, [currentChat, selectedChatId, systemPrompt, model, chatHistory, activePersonas]);

  // Add useEffect for loading personas
  useEffect(() => {
    const loadPersonas = async () => {
      const loaded = await personaDB.getAllPersonas();
      
      // Check if GAIA already exists in the database
      const existingGaia = loaded.find(p => p.id === DEFAULT_PERSONA_ID);
      
      // If GAIA doesn't exist, create it from config
      if (!existingGaia) {
        const defaultGaia = new Persona(GAIA_CONFIG);
        await personaDB.savePersona(defaultGaia);
        setPersonas([defaultGaia, ...loaded]);
      } else {
        // Use the database version of GAIA
        setPersonas(loaded);
      }
    };
    loadPersonas();
  }, []);

  const createNewChat = async () => {
    const defaultGaia = personas.find(p => p.id === DEFAULT_PERSONA_ID);
    
    if (!defaultGaia) {
      console.error('GAIA persona not found!');
      return;
    }

    const newChat = {
      id: Date.now(),
      messages: [],
      systemPrompt,
      model,
      createdAt: Date.now(),
      timestamp: Date.now(),
      title: 'New Chat',
      activePersonas: [defaultGaia.id], // Always include GAIA
      knowledgeFiles: [] // Initialize as empty array
    };

    try {
      await chatDB.saveChat(newChat);
      const updatedHistory = await chatDB.getAllChats();
      setChatHistory(updatedHistory.sort((a, b) => b.createdAt - a.createdAt));
      setSelectedChatId(newChat.id);
      setCurrentChat([]); // Initialize as empty array
      setActivePersonas([defaultGaia]); // Set GAIA as the only active persona
    } catch (error) {
      console.error('Error creating new chat:', error);
    }
  };

  const createNewPersona = async () => {
    const newPersona = new Persona({
      name: 'New Persona',
      systemPrompt: 'You are a helpful assistant',
      model: MODELS.LLAMA3_70B
    });
    
    try {
      await personaDB.savePersona(newPersona);
      const updatedPersonas = await personaDB.getAllPersonas();
      setPersonas(updatedPersonas);
      setSelectedPersonaId(newPersona.id);
      setEditingPersona(newPersona);
    } catch (error) {
      console.error('Error creating persona:', error);
    }
  };

  const handleEditPersona = async (updatedPersona) => {
    try {
      // Save the updated persona
      await personaDB.savePersona(updatedPersona);
      
      // Update the personas state
      const updatedPersonas = await personaDB.getAllPersonas();
      setPersonas(updatedPersonas);
      
      setEditingPersona(null);
    } catch (error) {
      console.error('Error updating persona:', error);
    }
  };

  const handleDeletePersona = async (personaToDelete) => {
    try {
      await personaDB.deletePersona(personaToDelete.id);
      const updatedPersonas = await personaDB.getAllPersonas();
      setPersonas(updatedPersonas);
      if(selectedPersonaId === personaToDelete.id) {
        setSelectedPersonaId(null);
      }
      setEditingPersona(null);
    } catch (error) {
      console.error('Error deleting persona:', error);
    }
  };

  return (
    <div className="app">
      <Sidebar 
        setCurrentChat={setCurrentChat} 
        chatHistory={chatHistory}
        selectedChatId={selectedChatId}
        setSelectedChatId={setSelectedChatId}
        createNewChat={createNewChat}
        personas={personas}
        selectedPersonaId={selectedPersonaId}
        setSelectedPersonaId={setSelectedPersonaId}
        createNewPersona={createNewPersona}
        onEditPersona={setEditingPersona}
      />
      <Chat 
        currentChat={currentChat} 
        setCurrentChat={setCurrentChat} 
        model={model}
        systemPrompt={systemPrompt}
        personas={personas}
        activePersonas={activePersonas}
        setActivePersonas={setActivePersonas}
        selectedChatId={selectedChatId}
        chatHistory={chatHistory}
      />
      {editingPersona && (
        <PersonaManager 
          persona={editingPersona}
          onPersonaUpdate={handleEditPersona}
          onDelete={handleDeletePersona}
          onClose={() => setEditingPersona(null)}
        />
      )}
    </div>
  );
}

export default App;

