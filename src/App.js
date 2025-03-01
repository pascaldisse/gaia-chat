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
import PersonaStore from './components/personas/PersonaStore';
import AdminDashboard from './components/admin/AdminDashboard';
import { GAIA_CONFIG, DEFAULT_PERSONA_ID } from './config/defaultPersona';
import { UserProvider, useUser } from './contexts/UserContext';

function AppContent() {
  const { user: currentUser } = useUser();
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
  const [sidebarVisible, setSidebarVisible] = useState(false); // Control sidebar visibility

  // Load chat history from database
  useEffect(() => {
    const loadChats = async () => {
      try {
        // Get chats based on user status
        let chats;
        if (currentUser) {
          // For logged in users, get their chats
          console.log("Loading chats for user:", currentUser.id);
          chats = await chatDB.getChatsByUser(currentUser.id);
        } else {
          // For anonymous users, get chats without userId
          console.log("Loading chats for anonymous user");
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
  }, [selectedChatId, personas, currentUser]);

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
            console.log("Refreshing chats after save for user:", currentUser.id);
            freshChats = await chatDB.getChatsByUser(currentUser.id);
          } else {
            console.log("Refreshing chats after save for anonymous user");
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
  }, [currentChat, selectedChatId, systemPrompt, model, chatHistory, activePersonas, currentUser]);

  // Add useEffect for loading personas
  useEffect(() => {
    const loadPersonas = async () => {
      let loaded;
      if (currentUser) {
        // For logged in users, get both their personas and the system personas (those without userId)
        console.log("Loading personas for user:", currentUser.id);
        const userPersonas = await personaDB.getPersonasByUser(currentUser.id);
        const systemPersonas = await personaDB.getAllPersonas();
        const systemPersonasWithoutUser = systemPersonas.filter(p => !p.userId);
        loaded = [...userPersonas, ...systemPersonasWithoutUser];
      } else {
        // For anonymous users, get personas without userId
        console.log("Loading personas for anonymous user");
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
  }, [currentUser]);

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
      knowledgeFiles: [], // Initialize as empty array
      userId: currentUser ? currentUser.id : undefined, // Associate with user if logged in
      participants: currentUser ? [currentUser.id] : [] // Initialize participants list with current user if logged in
    };

    try {
      await chatDB.saveChat(newChat);
      
      // Get updated chat history based on user status
      let updatedHistory;
      if (currentUser) {
        console.log("Refreshing chats after new chat creation for user:", currentUser.id);
        updatedHistory = await chatDB.getChatsByUser(currentUser.id);
      } else {
        console.log("Refreshing chats after new chat creation for anonymous user");
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
        console.log("Getting updated personas for user:", currentUser.id);
        const userPersonas = await personaDB.getPersonasByUser(currentUser.id);
        const systemPersonas = await personaDB.getAllPersonas();
        const systemPersonasWithoutUser = systemPersonas.filter(p => !p.userId);
        updatedPersonas = [...userPersonas, ...systemPersonasWithoutUser];
      } else {
        console.log("Getting updated personas for anonymous user");
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
      
      // Get updated personas based on user status
      let updatedPersonas;
      if (currentUser) {
        console.log("Getting updated personas after edit for user:", currentUser.id);
        const userPersonas = await personaDB.getPersonasByUser(currentUser.id);
        const systemPersonas = await personaDB.getAllPersonas();
        const systemPersonasWithoutUser = systemPersonas.filter(p => !p.userId);
        updatedPersonas = [...userPersonas, ...systemPersonasWithoutUser];
      } else {
        console.log("Getting updated personas after edit for anonymous user");
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
      
      // Get updated personas based on user status
      let updatedPersonas;
      if (currentUser) {
        console.log("Getting updated personas after delete for user:", currentUser.id);
        const userPersonas = await personaDB.getPersonasByUser(currentUser.id);
        const systemPersonas = await personaDB.getAllPersonas();
        const systemPersonasWithoutUser = systemPersonas.filter(p => !p.userId);
        updatedPersonas = [...userPersonas, ...systemPersonasWithoutUser];
      } else {
        console.log("Getting updated personas after delete for anonymous user");
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
      {/* Hamburger menu toggle button */}
      <button 
        className="hamburger-menu" 
        onClick={() => setSidebarVisible(!sidebarVisible)}
        aria-label="Toggle sidebar"
      >
        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
          <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
        </svg>
      </button>
      
      {/* Sidebar with collapsible behavior */}
      <div className={`sidebar-container ${sidebarVisible ? 'visible' : 'hidden'}`}>
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
        {/* Close button for mobile */}
        <button 
          className="sidebar-close" 
          onClick={() => setSidebarVisible(false)}
        >
          ✕
        </button>
      </div>
      
      {/* Overlay for mobile */}
      {sidebarVisible && 
        <div className="sidebar-overlay" onClick={() => setSidebarVisible(false)}></div>
      }
      
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
        <button 
          className={viewMode === 'store' ? 'active' : ''} 
          onClick={() => setViewMode('store')}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style={{ marginRight: '6px' }}>
            <path d="M12 2l-5.5 9h11L12 2zm0 3.84L13.93 9h-3.87L12 5.84zM17.5 13c-2.49 0-4.5 2.01-4.5 4.5s2.01 4.5 4.5 4.5 4.5-2.01 4.5-4.5-2.01-4.5-4.5-4.5zm0 7c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5zM3 21.5h8v-8H3v8zm2-6h4v4H5v-4z" />
          </svg>
          Persona Store
        </button>
        {currentUser?.isAdmin && (
          <button 
            className={viewMode === 'admin' ? 'active' : ''} 
            onClick={() => setViewMode('admin')}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style={{ marginRight: '6px' }}>
              <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 9.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
            </svg>
            Admin
          </button>
        )}
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
      ) : viewMode === 'agentflow' ? (
        <AgentFlow />
      ) : viewMode === 'store' ? (
        <PersonaStore />
      ) : viewMode === 'admin' ? (
        <AdminDashboard />
      ) : (
        <PersonaStore />
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

