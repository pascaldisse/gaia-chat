import React, { useState, useEffect } from 'react';
import GaiaHiveSimple from './GaiaHiveSimple';
import './GaiaHive.css';

const GaiaHiveDemo = () => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Define some custom attributes for the demo
  const customAttributes = {
    autonomy: { value: 5, description: "Respect for freedom of thought, choice, and self-determination" },
    compassion: { value: 4, description: "Capacity to alleviate suffering and emotional distress" },
    creativity: { value: 3, description: "Value placed on expression, invention, and innovation" },
    ecological: { value: 5, description: "Consideration for environmental impact and sustainability" },
    efficiency: { value: 2, description: "Preference for optimal use of resources and time" }
  };
  
  // For animated display of chat messages
  const [visibleMessages, setVisibleMessages] = useState([]);
  // Store timestamp for each message
  const [messageTimes, setMessageTimes] = useState({});
  
  useEffect(() => {
    // Animate attribute messages appearing one by one
    const keys = Object.keys(customAttributes);
    let currentIndex = 0;
    
    // Show all messages immediately instead of animating
    setVisibleMessages(keys);
    
    // Set timestamps for all messages
    const timestamps = {};
    keys.forEach(key => {
      timestamps[key] = new Date();
    });
    setMessageTimes(timestamps);
    
    // No interval to clear anymore
  }, [customAttributes]);
  
  // Format timestamps in a human-readable way
  const formatTime = (date) => {
    if (!date) return '';
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    return `${formattedHours}:${formattedMinutes} ${ampm}`;
  };
  
  // Add scroll fix directly to the component
  useEffect(() => {
    // Force document to be scrollable
    document.body.style.height = 'auto';
    document.body.style.overflow = 'auto';
    document.documentElement.style.height = 'auto';
    document.documentElement.style.overflow = 'auto';
    
    // Scroll to the top initially
    window.scrollTo(0, 0);
    
    return () => {
      // Cleanup
      document.body.style.height = '';
      document.body.style.overflow = '';
      document.documentElement.style.height = '';
      document.documentElement.style.overflow = '';
    };
  }, []);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim() || isProcessing) return;
    
    console.log('GAIA HIVE DEMO: Form submitted with query:', query);
    setIsProcessing(true);
    setResponse('');
    
    // Using a temporary variable to hold the current query
    const processedQuery = query.trim();
    
    // First clear query to make sure component re-renders
    setQuery('');
    
    // Then set it back after a brief timeout
    setTimeout(() => {
      console.log('GAIA HIVE DEMO: Setting query to processed value:', processedQuery);
      setQuery(processedQuery);
    }, 10);
  };
  
  const handleResponse = (result) => {
    console.log('GAIA HIVE DEMO: Received response from GaiaHive:', result);
    setResponse(result);
    setIsProcessing(false);
  };
  
  return (
    <div className="gaia-hive-demo">
      <div className="demo-header">
        <h1>🌿 Gaia Hive Mind</h1>
        <p>
          This multi-agent system lets different attributes compete and collaborate, 
          with dice rolls determining which aspects have the strongest influence on the final response.
        </p>
      </div>
      
      {/* Input form section - MOVED TO TOP */}
      <div className="demo-form">
        <h3 style={{marginBottom: '8px', textAlign: 'center', fontSize: '15px'}}>Ask a Question</h3>
        <form onSubmit={handleSubmit}>
          <div className="query-label">Enter your question:</div>
          <div className="input-group">
            <input 
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="How should I approach sustainable development in my community?"
              disabled={isProcessing}
              className="query-input"
            />
            <button 
              type="submit" 
              disabled={isProcessing || !query.trim()}
              className="submit-button"
            >
              {isProcessing ? 'Processing...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
      
      {/* Results container - MOVED TO TOP */}
      {query && (
        <div className="gaia-hive-container">
          <GaiaHiveSimple 
            query={query}
            onResponse={handleResponse}
            attributes={customAttributes}
          />
        </div>
      )}
      
      {/* Attribute dialogue */}
      <div className="demo-attributes-chat">
        <h3>Attribute Dialogue</h3>
        <div className="attributes-chat-window">
          {Object.entries(customAttributes)
            .filter(([key]) => visibleMessages.includes(key))
            .map(([key, attr]) => {
              // Custom messages based on attribute type
              let message = "";
              let avatarColor = "";
              
              switch(key) {
                case "autonomy":
                  message = "Freedom of choice and self-determination are essential. My value of " + attr.value + " reflects how strongly I prioritize individual liberty.";
                  avatarColor = "#4682B4"; // Steel Blue
                  break;
                case "compassion":
                  message = "I seek to understand and alleviate suffering. With a value of " + attr.value + ", I emphasize empathy and emotional connection.";
                  avatarColor = "#E6A8D7"; // Pink
                  break;
                case "creativity":
                  message = "Innovation and expression drive progress. My value of " + attr.value + " shows how much I value original thinking.";
                  avatarColor = "#FFD700"; // Gold
                  break;
                case "ecological":
                  message = "We must respect our natural world. My value of " + attr.value + " represents my commitment to environmental sustainability.";
                  avatarColor = "#228B22"; // Forest Green
                  break;
                case "efficiency":
                  message = "Optimal use of resources is critical. With a value of " + attr.value + ", I focus on streamlined solutions.";
                  avatarColor = "#B22222"; // Firebrick
                  break;
                default:
                  message = "I represent " + key + ". My value is " + attr.value + " - " + attr.description;
                  avatarColor = "#28a745"; // Default green
              }
              
              return (
                <div key={key} className="attribute-message animate-in">
                  <div className="attribute-avatar" style={{backgroundColor: avatarColor}}>{key.charAt(0).toUpperCase()}</div>
                  <div className="attribute-bubble">
                    <div className="attribute-header">
                      <div className="attribute-speaker" style={{color: avatarColor}}>{key.charAt(0).toUpperCase() + key.slice(1)}</div>
                      <div className="message-timestamp">{formatTime(messageTimes[key])}</div>
                    </div>
                    <div className="attribute-content">{message}</div>
                  </div>
                </div>
              );
            })}
            
            {/* Removed typing indicator since we show all messages at once */}
        </div>
      </div>
      
      {/* Simple container with attribute values */}
      <div className="demo-attributes-info">
        <h3>Current Attribute Values</h3>
        <div className="attributes-grid">
          {Object.entries(customAttributes).map(([key, attr]) => (
            <div key={key} className="attribute-chip">
              <span className="attribute-name">{key.charAt(0).toUpperCase() + key.slice(1)}</span>
              <span className="attribute-value">{attr.value}</span>
              <div className="attribute-desc">{attr.description}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};


export default GaiaHiveDemo;