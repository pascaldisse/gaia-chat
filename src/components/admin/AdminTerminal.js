import React, { useState, useRef, useEffect } from 'react';
import { personaDB, userDB, chatDB } from '../../services/db';
import '../../styles/admin/AdminTerminal.css';

const AdminTerminal = () => {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState([
    { type: 'system', content: 'Admin Terminal initialized. Type "help" for available commands.' }
  ]);
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const terminalRef = useRef(null);
  const inputRef = useRef(null);

  // Available built-in commands
  const commands = {
    help: {
      description: 'Show available commands',
      execute: () => {
        return Object.entries(commands).map(([cmd, info]) => 
          `${cmd.padEnd(15)} - ${info.description}`
        ).join('\n');
      }
    },
    clear: {
      description: 'Clear terminal',
      execute: () => {
        setHistory([{ type: 'system', content: 'Terminal cleared.' }]);
        return null;
      }
    },
    users: {
      description: 'List all users',
      execute: async () => {
        try {
          const users = await userDB.getAllUsers();
          return JSON.stringify(users, null, 2);
        } catch (error) {
          return `Error: ${error.message}`;
        }
      }
    },
    personas: {
      description: 'List all personas',
      execute: async () => {
        try {
          const personas = await personaDB.getAllPersonas();
          return JSON.stringify(personas, null, 2);
        } catch (error) {
          return `Error: ${error.message}`;
        }
      }
    },
    chats: {
      description: 'List all chats',
      execute: async () => {
        try {
          const chats = await chatDB.getAllChats();
          return JSON.stringify(chats, null, 2);
        } catch (error) {
          return `Error: ${error.message}`;
        }
      }
    },
    makeAdmin: {
      description: 'Make a user an admin: makeAdmin(userId)',
      execute: async (userId) => {
        if (!userId) return 'Error: userId is required';
        try {
          const user = await userDB.getUserById(userId);
          if (!user) return `Error: User ${userId} not found`;
          
          await userDB.updateUser(userId, { isAdmin: true });
          return `User ${userId} has been made an admin.`;
        } catch (error) {
          return `Error: ${error.message}`;
        }
      }
    },
    deletePersona: {
      description: 'Delete a persona: deletePersona(personaId)',
      execute: async (personaId) => {
        if (!personaId) return 'Error: personaId is required';
        try {
          await personaDB.deletePersona(personaId);
          return `Persona ${personaId} has been deleted.`;
        } catch (error) {
          return `Error: ${error.message}`;
        }
      }
    }
  };

  // Auto-scroll to bottom when history changes
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const executeCommand = async (cmd) => {
    // Add to command history
    setCommandHistory(prev => [...prev, cmd]);
    setHistoryIndex(-1);
    
    // Parse command and arguments
    let output = '';
    let isError = false;
    
    try {
      // First check if it's a built-in command
      const [command, ...args] = cmd.trim().split(/\s+/);
      
      if (commands[command]) {
        output = await commands[command].execute(...args);
        if (output === null) return; // For commands that don't want to add output (like clear)
      } else {
        // If not a built-in command, try to execute as JavaScript
        // Create context with db services available
        const context = {
          personaDB,
          userDB,
          chatDB,
          ...commands
        };
        
        // Create function with context variables
        const contextKeys = Object.keys(context);
        const contextValues = Object.values(context);
        
        const func = new Function(...contextKeys, `return (async () => { 
          try { 
            return ${cmd} 
          } catch(e) { 
            return "Error: " + e.message; 
          }
        })()`);
        
        const result = await func(...contextValues);
        
        if (result !== undefined) {
          // Pretty-print objects and arrays
          if (typeof result === 'object' && result !== null) {
            output = JSON.stringify(result, null, 2);
          } else {
            output = String(result);
          }
        }
      }
    } catch (error) {
      output = `Error: ${error.message}`;
      isError = true;
    }
    
    setHistory(prev => [
      ...prev,
      { type: 'command', content: cmd },
      { type: isError ? 'error' : 'output', content: output }
    ]);
    
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && input.trim()) {
      executeCommand(input.trim());
    } else if (e.key === 'ArrowUp') {
      // Navigate up in command history
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex;
        setHistoryIndex(newIndex);
        setInput(commandHistory[commandHistory.length - 1 - newIndex] || '');
      }
    } else if (e.key === 'ArrowDown') {
      // Navigate down in command history
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[commandHistory.length - 1 - newIndex] || '');
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput('');
      }
    }
  };

  return (
    <div className="admin-terminal-container">
      <div className="terminal-header">
        <div className="terminal-title">Admin Terminal</div>
        <button 
          className="clear-terminal-btn"
          onClick={() => executeCommand('clear')}
        >
          Clear
        </button>
      </div>
      
      <div className="terminal-body" ref={terminalRef}>
        {history.map((entry, index) => (
          <div key={index} className={`terminal-line terminal-${entry.type}`}>
            {entry.type === 'command' ? (
              <>
                <span className="terminal-prompt">admin&gt; </span>
                {entry.content}
              </>
            ) : entry.type === 'system' ? (
              <span className="terminal-system">[SYSTEM] {entry.content}</span>
            ) : (
              <pre>{entry.content}</pre>
            )}
          </div>
        ))}
      </div>
      
      <div className="terminal-input-line">
        <span className="terminal-prompt">admin&gt; </span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a command or JavaScript..."
          className="terminal-input"
        />
      </div>
    </div>
  );
};

export default AdminTerminal;