import React, { useState, useRef } from 'react';
import '../styles/ChatInput.css';

const COMMANDS = [
  { name: 'imagine', description: 'Generate an image from text description' }
];

const ChatInput = ({ personas, onSendMessage, isLoading, onCancel }) => {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [mentionStartIndex, setMentionStartIndex] = useState(null);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

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
    const matches = personas.filter(p =>
      p.name.toLowerCase().startsWith(mentionQuery.toLowerCase())
    );
    
    setFilteredSuggestions(matches);
    setShowSuggestions(matches.length > 0);
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
              ) : (
                // Persona mention
                <>
                  <img 
                    src={suggestion.image || '/default-avatar.png'} 
                    alt={suggestion.name}
                    className="persona-avatar"
                  />
                  <div className="persona-name">{suggestion.name}</div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
      <textarea
        ref={inputRef}
        value={inputValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Type @ to mention a persona..."
        disabled={isLoading}
        rows={3}
      />
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
    </form>
  );
};

export default ChatInput;
