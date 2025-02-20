import React, { useState, useRef } from 'react';
import '../styles/ChatInput.css';

const ChatInput = ({ personas, onSendMessage, isLoading, onCancel }) => {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [mentionStartIndex, setMentionStartIndex] = useState(null);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  const inputRef = useRef(null);

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

  const handleChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    updateSuggestions(value, e.target.selectionStart);
  };

  const handleKeyDown = (e) => {
    if (showSuggestions) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedSuggestionIndex(prev => 
            (prev + 1) % filteredSuggestions.length
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedSuggestionIndex(prev => 
            (prev - 1 + filteredSuggestions.length) % filteredSuggestions.length
          );
          break;
        case 'Enter':
          if (mentionStartIndex !== null) {
            e.preventDefault();
            selectSuggestion(filteredSuggestions[selectedSuggestionIndex].name);
          }
          break;
        case 'Escape':
          setShowSuggestions(false);
          break;
      }
    }
  };

  const selectSuggestion = (suggestionName) => {
    if (mentionStartIndex === null) return;
    
    const before = inputValue.substring(0, mentionStartIndex);
    const after = inputValue.substring(inputRef.current.selectionStart);
    const newValue = before + '@' + suggestionName + after;
    
    setInputValue(newValue);
    setShowSuggestions(false);

    const newCursorPos = mentionStartIndex + suggestionName.length + 1;
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

  return (
    <form className="chat-input-container" onSubmit={handleSubmit}>
      {showSuggestions && (
        <div className="mention-suggestions">
          {filteredSuggestions.map((suggestion, index) => (
            <div
              key={suggestion.id}
              className={`suggestion-item ${index === selectedSuggestionIndex ? 'selected' : ''}`}
              onClick={() => selectSuggestion(suggestion.name)}
            >
              {suggestion.name}
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
