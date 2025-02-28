import React, { useState, useEffect } from 'react';
import Chat from './components/Chat';
import Sidebar from './components/Sidebar';
import AgentFlow from './components/AgentFlow/AgentFlow';
import { chatDB, userDB } from './services/db';
import './styles/Sidebar.css';
import './App.css';
import './styles/Chat.css';
import { MODELS } from './config';
import { personaDB } from './services/db';
import Persona from './models/Persona';
import PersonaManager from './components/personas/PersonaManager';
import { GAIA_CONFIG, DEFAULT_PERSONA_ID } from './config/defaultPersona';
import { UserProvider } from './contexts/UserContext';

function AppContent() {
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
  const [activeUsers, setActiveUsers] = useState([]);
  const [viewMode, setViewMode] = useState('chat'); // 'chat' or 'agentflow'

  // Load chat history from database
  useEffect(() => {
    const loadChats = async () => {
      try {
        // Get current user from context
        const { getCurrentUser } = await import('./services/auth');
        const currentUser = await getCurrentUser();
        
        // Get chats based on user status
        let chats;
        if (currentUser) {
          // For logged in users, get their chats
          chats = await chatDB.getChatsByUser(currentUser.id);
        } else {
          // For anonymous users, get chats without userId
          chats = await chatDB.getAllChats();
          chats = chats.filter(chat => !chat.userId);
        }
        
        const sortedChats = chats.sort((a, b) => b.createdAt - a.createdAt);
        
        if (selectedChatId) {
          const currentChatFromDB = chats.find(c => c.id === selectedChatId);
          if (currentChatFromDB) {
            setCurrentChat(
              Array.isArray(currentChatFromDB.messages) 
                ? currentChatFromDB.messages 
                : []
            );
            
            // Set active personas
            const activePersonas = personas.filter(p => 
              currentChatFromDB.activePersonas?.includes(p.id)
            );
            setActivePersonas(activePersonas);
            
            // Load active users for this chat
            if (Array.isArray(currentChatFromDB.participants) && currentChatFromDB.participants.length > 0) {
              // Fetch user data for all participants
              const loadChatParticipants = async () => {
                try {
                  // Get all users
                  const allUsers = await userDB.getAllUsers();
                  
                  // Filter to just the participants in this chat
                  const chatParticipants = allUsers.filter(user => 
                    currentChatFromDB.participants.includes(user.id) &&
                    (currentUser && user.id !== currentUser.id) // Don't include current user in the UI list
                  );
                  
                  // Update state with chat participants
                  setActiveUsers(chatParticipants);
                } catch (error) {
                  console.error('Error loading chat participants:', error);
                }
              };
              
              loadChatParticipants();
            } else {
              // No participants in this chat
              setActiveUsers([]);
            }
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
        
        // Get current user
        const { getCurrentUser } = await import('./services/auth');
        const currentUser = await getCurrentUser();
        
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
          title: currentChat[0]?.content?.slice(0, 30) + '...' || 'New Chat',
          // Preserve existing userId or set it if user is logged in
          userId: existingChat?.userId || (currentUser ? currentUser.id : undefined),
          // Preserve existing participants
          participants: existingChat?.participants || (currentUser ? [currentUser.id] : [])
        };

        try {
          await chatDB.updateChat(updatedChat);
          
          // Get updated chat history based on user status
          let freshChats;
          if (currentUser) {
            freshChats = await chatDB.getChatsByUser(currentUser.id);
          } else {
            const allChats = await chatDB.getAllChats();
            freshChats = allChats.filter(chat => !chat.userId);
          }
          
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
      // Get current user from context
      const { getCurrentUser } = await import('./services/auth');
      const currentUser = await getCurrentUser();
      
      let loaded;
      if (currentUser) {
        // For logged in users, get both their personas and the system personas (those without userId)
        const userPersonas = await personaDB.getPersonasByUser(currentUser.id);
        const systemPersonas = await personaDB.getAllPersonas();
        const systemPersonasWithoutUser = systemPersonas.filter(p => !p.userId);
        loaded = [...userPersonas, ...systemPersonasWithoutUser];
      } else {
        // For anonymous users, get personas without userId
        const allPersonas = await personaDB.getAllPersonas();
        loaded = allPersonas.filter(p => !p.userId);
      }
      
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
    
    // Get current user
    const { getCurrentUser } = await import('./services/auth');
    const currentUser = await getCurrentUser();

    const newChat = {
      id: Date.now(),
      messages: [],
      systemPrompt,
      model,
      createdAt: Date.now(),
      timestamp: Date.now(),
      title: 'New Chat',
      activePersonas: [defaultGaia.id], // Always include GAIA
      knowledgeFiles: [], // Initialize as empty array
      userId: currentUser ? currentUser.id : undefined, // Associate with user if logged in
      participants: currentUser ? [currentUser.id] : [] // Initialize participants list with current user if logged in
    };

    try {
      await chatDB.saveChat(newChat);
      
      // Get updated chat history based on user status
      let updatedHistory;
      if (currentUser) {
        updatedHistory = await chatDB.getChatsByUser(currentUser.id);
      } else {
        const allChats = await chatDB.getAllChats();
        updatedHistory = allChats.filter(chat => !chat.userId);
      }
      
      setChatHistory(updatedHistory.sort((a, b) => b.createdAt - a.createdAt));
      setSelectedChatId(newChat.id);
      setCurrentChat([]); // Initialize as empty array
      setActivePersonas([defaultGaia]); // Set GAIA as the only active persona
    } catch (error) {
      console.error('Error creating new chat:', error);
    }
  };

  const createNewPersona = async () => {
    // Get current user
    const { getCurrentUser } = await import('./services/auth');
    const currentUser = await getCurrentUser();
    
    const newPersona = new Persona({
      name: 'New Persona',
      systemPrompt: 'You are a helpful assistant',
      model: MODELS.LLAMA3_70B,
      userId: currentUser ? currentUser.id : undefined // Associate with user if logged in
    });
    
    try {
      await personaDB.savePersona(newPersona);
      
      // Get updated personas based on user status
      let updatedPersonas;
      if (currentUser) {
        const userPersonas = await personaDB.getPersonasByUser(currentUser.id);
        const systemPersonas = await personaDB.getAllPersonas();
        const systemPersonasWithoutUser = systemPersonas.filter(p => !p.userId);
        updatedPersonas = [...userPersonas, ...systemPersonasWithoutUser];
      } else {
        const allPersonas = await personaDB.getAllPersonas();
        updatedPersonas = allPersonas.filter(p => !p.userId);
      }
      
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
      
      // Get current user
      const { getCurrentUser } = await import('./services/auth');
      const currentUser = await getCurrentUser();
      
      // Get updated personas based on user status
      let updatedPersonas;
      if (currentUser) {
        const userPersonas = await personaDB.getPersonasByUser(currentUser.id);
        const systemPersonas = await personaDB.getAllPersonas();
        const systemPersonasWithoutUser = systemPersonas.filter(p => !p.userId);
        updatedPersonas = [...userPersonas, ...systemPersonasWithoutUser];
      } else {
        const allPersonas = await personaDB.getAllPersonas();
        updatedPersonas = allPersonas.filter(p => !p.userId);
      }
      
      setPersonas(updatedPersonas);
      setEditingPersona(null);
    } catch (error) {
      console.error('Error updating persona:', error);
    }
  };

  const handleDeletePersona = async (personaToDelete) => {
    try {
      // Don't allow deleting system personas for regular users
      if (personaToDelete.id === DEFAULT_PERSONA_ID) {
        console.error('Cannot delete the default GAIA persona');
        return;
      }
      
      await personaDB.deletePersona(personaToDelete.id);
      
      // Get current user
      const { getCurrentUser } = await import('./services/auth');
      const currentUser = await getCurrentUser();
      
      // Get updated personas based on user status
      let updatedPersonas;
      if (currentUser) {
        const userPersonas = await personaDB.getPersonasByUser(currentUser.id);
        const systemPersonas = await personaDB.getAllPersonas();
        const systemPersonasWithoutUser = systemPersonas.filter(p => !p.userId);
        updatedPersonas = [...userPersonas, ...systemPersonasWithoutUser];
      } else {
        const allPersonas = await personaDB.getAllPersonas();
        updatedPersonas = allPersonas.filter(p => !p.userId);
      }
      
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
      
      <div className="view-toggle">
        <button 
          className={viewMode === 'chat' ? 'active' : ''} 
          onClick={() => setViewMode('chat')}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style={{ marginRight: '6px' }}>
            <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
          </svg>
          Chat
        </button>
        <button 
          className={viewMode === 'agentflow' ? 'active' : ''} 
          onClick={() => setViewMode('agentflow')}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style={{ marginRight: '6px' }}>
            <path d="M22 11V3h-7v3H9V3H2v8h7V8h2v10h4v3h7v-8h-7v3h-2V8h2v3h7zM7 9H4V5h3v4zm10 6h3v4h-3v-4zm0-10h3v4h-3V5z" />
          </svg>
          Agent Workflow
        </button>
      </div>
      
      {viewMode === 'chat' ? (
        <Chat 
          currentChat={currentChat} 
          setCurrentChat={setCurrentChat} 
          model={model}
          systemPrompt={systemPrompt}
          personas={personas}
          activePersonas={activePersonas}
          setActivePersonas={setActivePersonas}
          activeUsers={activeUsers}
          setActiveUsers={setActiveUsers}
          selectedChatId={selectedChatId}
          chatHistory={chatHistory}
          setChatHistory={setChatHistory}
        />
      ) : (
        <AgentFlow />
      )}
      
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

function App() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}

export default App;

