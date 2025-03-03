import React, { useState, useRef, useEffect } from 'react';
import '../styles/ChatInput.css';
import { userDB } from '../services/db';
import { useUser } from '../contexts/UserContext';

const COMMANDS = [
  { name: 'imagine', description: 'Generate an image from text description' },
  { name: 'search', description: 'Search the web using DuckDuckGo' }
];

const ChatInput = ({ personas, onSendMessage, isLoading, onCancel }) => {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [mentionStartIndex, setMentionStartIndex] = useState(null);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  const [users, setUsers] = useState([]);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const { user: currentUser } = useUser();
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  
  // Fetch all users on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // In a real app, this would be a server-side API call with pagination
        const allUsers = await userDB.getAllUsers();
        // Filter out the current user
        const filteredUsers = allUsers.filter(u => 
          currentUser && u.id !== currentUser.id
        );
        setUsers(filteredUsers);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    
    fetchUsers();
  }, [currentUser]);

  const updateSuggestions = (value, cursorPos) => {
    const substring = value.substring(0, cursorPos);
    const atIndex = substring.lastIndexOf('@');
    
    if (atIndex === -1) {
      setShowSuggestions(false);
      setMentionStartIndex(null);
      return;
    }
    
    setMentionStartIndex(atIndex);
    const mentionQuery = substring.substring(atIndex + 1);
    
    // First, filter personas
    const personaMatches = personas.filter(p =>
      p.name.toLowerCase().startsWith(mentionQuery.toLowerCase())
    );
    
    // Then, filter users
    const userMatches = users.filter(u =>
      (u.displayName && u.displayName.toLowerCase().startsWith(mentionQuery.toLowerCase())) ||
      (u.username && u.username.toLowerCase().startsWith(mentionQuery.toLowerCase()))
    ).map(u => ({
      ...u,
      name: u.displayName || u.username,
      isUser: true // Flag to identify this as a user mention
    }));
    
    // Combine both with personas first, then users
    const combined = [...personaMatches, ...userMatches];
    
    setFilteredSuggestions(combined);
    setShowSuggestions(combined.length > 0);
    setSelectedSuggestionIndex(0);
  };

  const updateCommandSuggestions = (value, cursorPos) => {
    const substring = value.substring(0, cursorPos);
    const slashIndex = substring.lastIndexOf('/');
    
    if (slashIndex === -1) return;

    setMentionStartIndex(slashIndex);
    const commandQuery = substring.substring(slashIndex + 1);
    const matches = COMMANDS.filter(c =>
      c.name.toLowerCase().startsWith(commandQuery.toLowerCase())
    );
    
    setFilteredSuggestions(matches);
    setShowSuggestions(matches.length > 0);
    setSelectedSuggestionIndex(0);
  };

  const handleChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    
    const cursorPos = e.target.selectionStart;
    const substring = value.substring(0, cursorPos);
    
    // Check for mention trigger
    const atIndex = substring.lastIndexOf('@');
    // Check for command trigger
    const slashIndex = substring.lastIndexOf('/');
    
    // Show mentions if @ was the last trigger
    if (atIndex > slashIndex) {
      updateSuggestions(value, cursorPos);
    }
    // Show commands if / was the last trigger
    else if (slashIndex > atIndex) {
      updateCommandSuggestions(value, cursorPos);
    }
    // Hide suggestions if neither
    else {
      setShowSuggestions(false);
    }
  };

  const handleKeyDown = (e) => {
    if (showSuggestions) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          const nextIndex = (selectedSuggestionIndex + 1) % filteredSuggestions.length;
          setSelectedSuggestionIndex(nextIndex);
          scrollToSuggestion(nextIndex);
          break;
        case 'ArrowUp':
          e.preventDefault();
          const prevIndex = (selectedSuggestionIndex - 1 + filteredSuggestions.length) % filteredSuggestions.length;
          setSelectedSuggestionIndex(prevIndex);
          scrollToSuggestion(prevIndex);
          break;
        case 'Enter':
          if (mentionStartIndex !== null) {
            e.preventDefault();
            selectSuggestion(filteredSuggestions[selectedSuggestionIndex]);
          }
          break;
        case 'Escape':
          setShowSuggestions(false);
          break;
      }
    } else if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if (inputValue.trim()) {
        onSendMessage(inputValue);
        setInputValue('');
        setShowSuggestions(false);
      }
    }
  };

  const selectSuggestion = (suggestion) => {
    if (mentionStartIndex === null) return;
    
    const before = inputValue.substring(0, mentionStartIndex);
    const after = inputValue.substring(inputRef.current.selectionStart);
    
    // Determine if we're handling a mention or command
    const triggerChar = inputValue[mentionStartIndex];
    
    // Handle commands immediately
    if (triggerChar === '/') {
      if (suggestion.name === 'imagine') {
        onSendMessage(`/imagine `); // Clear input and trigger command
        setShowSuggestions(false);
        return;
      } else if (suggestion.name === 'search') {
        onSendMessage(`/search `); // Clear input and trigger search command
        setShowSuggestions(false);
        return;
      }
    }
    
    // Handle mentions normally
    const newValue = triggerChar === '@' 
      ? `${before}@${suggestion.name} ${after}`
      : `${before}/${suggestion.name} ${after}`;
    
    setInputValue(newValue.trim());
    setShowSuggestions(false);

    const newCursorPos = mentionStartIndex + suggestion.name.length + 2;
    setTimeout(() => {
      inputRef.current.focus();
      inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      // Save the webSearchEnabled state to window so it can be accessed by the Chat component
      window.webSearchEnabled = webSearchEnabled;
      
      onSendMessage(inputValue);
      setInputValue('');
      setShowSuggestions(false);
    }
  };

  const scrollToSuggestion = (index) => {
    if (suggestionsRef.current && suggestionsRef.current.children[index]) {
      const selectedElement = suggestionsRef.current.children[index];
      selectedElement.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  };

  return (
    <form className="chat-input-container" onSubmit={handleSubmit}>
      {showSuggestions && (
        <div 
          className="mention-suggestions" 
          ref={suggestionsRef}
        >
          {filteredSuggestions.map((suggestion, index) => (
            <div
              key={suggestion.id || suggestion.name}
              className={`suggestion-item ${index === selectedSuggestionIndex ? 'selected' : ''}`}
              onClick={() => selectSuggestion(suggestion)}
            >
              {suggestion.description ? (
                // Command suggestion
                <>
                  <div className="command-name">/{suggestion.name}</div>
                  <div className="command-description">{suggestion.description}</div>
                </>
              ) : suggestion.isUser ? (
                // User mention
                <>
                  <img 
                    src={'/user-avatar.png'} 
                    alt={suggestion.name}
                    className="user-avatar"
                  />
                  <div className="user-name">{suggestion.name}</div>
                  <div className="user-type">User</div>
                </>
              ) : (
                // Persona mention
                <>
                  <img 
                    src={suggestion.image || '/default-avatar.png'} 
                    alt={suggestion.name}
                    className="persona-avatar"
                  />
                  <div className="persona-name">{suggestion.name}</div>
                  <div className="persona-type">Persona</div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
      <div className="chat-input-tools">
        <button 
          type="button" 
          className={`web-search-toggle ${webSearchEnabled ? 'enabled' : ''}`}
          onClick={() => setWebSearchEnabled(!webSearchEnabled)}
          title={webSearchEnabled ? "Web search enabled (DuckDuckGo)" : "Enable web search"}
        >
          <span role="img" aria-label="Web Search">🔍</span>
        </button>
      </div>
      <textarea
        ref={inputRef}
        value={inputValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={webSearchEnabled ? "Type @ to mention a persona... Web search enabled 🔍" : "Type @ to mention a persona..."}
        disabled={isLoading}
        rows={3}
      />
      <div className="chat-input-buttons">
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Sending...' : 'Send'}
        </button>
        {isLoading && (
          <button 
            type="button"
            className="cancel-button" 
            onClick={onCancel}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

export default ChatInput;
