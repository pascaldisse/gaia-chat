import React, { useState, useEffect } from 'react';
import GaiaHiveSimple from './GaiaHiveSimple';
import { MODELS } from '../../config';
import './GaiaHive.css';

const GaiaHiveDemo = () => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversation, setConversation] = useState([]);
  
  // Available models from config.js
  const availableModels = Object.entries(MODELS).map(([key, value]) => ({
    id: value,
    name: key.replace(/_/g, ' ').toLowerCase(),
    displayName: key.replace(/_/g, ' ')
  }));
  
  // Default model
  const defaultModel = availableModels[0].id;
  
  // Define some custom attributes for the demo with added model selection
  const [attributeSettings, setAttributeSettings] = useState({
    autonomy: { 
      value: 5, 
      description: "Respect for freedom of thought, choice, and self-determination",
      model: defaultModel
    },
    compassion: { 
      value: 4, 
      description: "Capacity to alleviate suffering and emotional distress",
      model: defaultModel
    },
    creativity: { 
      value: 3, 
      description: "Value placed on expression, invention, and innovation",
      model: defaultModel
    },
    ecological: { 
      value: 5, 
      description: "Consideration for environmental impact and sustainability",
      model: defaultModel
    },
    efficiency: { 
      value: 2, 
      description: "Preference for optimal use of resources and time",
      model: defaultModel
    }
  });
  
  // For animated display of chat messages
  const [visibleMessages, setVisibleMessages] = useState([]);
  // Store timestamp for each message
  const [messageTimes, setMessageTimes] = useState({});
  
  useEffect(() => {
    // Animate attribute messages appearing one by one
    const keys = Object.keys(attributeSettings);
    
    // Show all messages immediately instead of animating
    setVisibleMessages(keys);
    
    // Set timestamps for all messages
    const timestamps = {};
    keys.forEach(key => {
      timestamps[key] = new Date();
    });
    setMessageTimes(timestamps);
    
    // No interval to clear anymore
  }, [attributeSettings]);
  
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
  
  const handleResponse = (result, conversationHistory) => {
    console.log('GAIA HIVE DEMO: Received response from GaiaHive:', result);
    console.log('GAIA HIVE DEMO: Conversation history:', conversationHistory);
    
    setResponse(result);
    setIsProcessing(false);
    
    // Update conversation history if provided
    if (conversationHistory) {
      // Update timestamps for all responses
      const timestamps = { ...messageTimes };
      conversationHistory.forEach(msg => {
        timestamps[msg.agent] = new Date();
      });
      setMessageTimes(timestamps);
      
      // Set conversation
      setConversation(conversationHistory);
      
      // Make sure all attribute IDs are in visible messages
      setVisibleMessages(conversationHistory.map(msg => msg.agent));
    }
  };
  
  // Handle model change for an attribute
  const handleModelChange = (attributeKey, modelId) => {
    setAttributeSettings(prev => ({
      ...prev,
      [attributeKey]: {
        ...prev[attributeKey],
        model: modelId
      }
    }));
  };
  
  // Create a style element to override parent styles and ensure visibility
  useEffect(() => {
    // Create a style element to override parent constraints
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .app { 
        height: auto !important; 
        min-height: auto !important; 
        max-height: none !important; 
        overflow: auto !important;
      }
      .view-toggle { 
        position: fixed !important;
        height: auto !important; 
        min-height: auto !important;
        width: auto !important;
        bottom: auto !important;
        top: var(--spacing-md) !important;
        z-index: 1100 !important;
      }
      .app #gaia-hive-container {
        height: auto !important;
        overflow: visible !important;
        min-height: fit-content !important;
        padding-top: 70px !important; /* Add space for the fixed nav */
      }
      .gaia-hive-demo {
        height: auto !important;
      }
      div.app > div {
        height: auto !important;
        overflow: auto !important;
      }
      .demo-attributes-info {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
      }
    `;
    document.head.appendChild(styleElement);
    
    // Function to ensure attribute settings are visible
    const ensureElementsVisible = () => {
      // Check if attributes are visible and scroll to them if not
      const attributesElement = document.querySelector('.demo-attributes-info');
      if (attributesElement) {
        // Force display
        attributesElement.style.display = 'block';
        attributesElement.style.visibility = 'visible';
        attributesElement.style.opacity = '1';
        
        // Scroll into view if needed
        const rect = attributesElement.getBoundingClientRect();
        if (rect.top < 0 || rect.bottom > window.innerHeight) {
          attributesElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    };
    
    // Run initially and on any resize events
    ensureElementsVisible();
    window.addEventListener('resize', ensureElementsVisible);
    
    // Run again after a small delay to ensure everything is rendered
    setTimeout(ensureElementsVisible, 500);
    setTimeout(ensureElementsVisible, 1500);
    
    // Clean up on unmount
    return () => {
      document.head.removeChild(styleElement);
      window.removeEventListener('resize', ensureElementsVisible);
    };
  }, []);

  return (
    <div id="gaia-hive-container" className="gaia-hive-demo" style={{
      display: 'flex', 
      flexDirection: 'column', 
      height: 'auto !important', 
      minHeight: 'fit-content !important',
      maxHeight: 'none !important',
      width: '100%', 
      position: 'relative', 
      overflow: 'visible',
      paddingBottom: '150px',
      marginBottom: '100px',
      paddingTop: '70px' // Add space for the fixed nav bar
    }}>
      <div className="demo-header">
        <h1>🌿 Gaia Hive Mind</h1>
        <p>
          This multi-agent system lets different attributes compete and collaborate, 
          with dice rolls determining which aspects have the strongest influence on the final response.
        </p>
      </div>
      
      {/* Attribute settings with model selection - MOVED TO TOP */}
      <div id="attribute-settings-container" className="demo-attributes-info" style={{display: 'block !important', visibility: 'visible !important', opacity: 1, zIndex: 100, position: 'relative'}}>
        <h3>Attribute Settings</h3>
        <div className="attributes-grid" style={{display: 'grid', width: '100%'}}>
          {Object.entries(attributeSettings).map(([key, attr]) => (
            <div key={key} className="attribute-chip" style={{display: 'flex', flexDirection: 'column', width: '100%', visibility: 'visible'}}>
              <span className="attribute-name">{key.charAt(0).toUpperCase() + key.slice(1)}</span>
              <span className="attribute-value">{attr.value}</span>
              <div className="attribute-desc">{attr.description}</div>
              <div className="attribute-model-select" style={{width: '100%', visibility: 'visible', display: 'block'}}>
                <label htmlFor={`model-${key}`} style={{display: 'block', visibility: 'visible'}}>Model:</label>
                <select 
                  id={`model-${key}`}
                  value={attr.model}
                  onChange={(e) => handleModelChange(key, e.target.value)}
                  disabled={isProcessing}
                  style={{width: '100%', display: 'block', visibility: 'visible'}}
                >
                  {availableModels.map((model) => (
                    <option key={model.id} value={model.id} style={{display: 'block'}}>
                      {model.displayName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Input form section */}
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
      
      {/* Results container - hidden processor */}
      {query && (
        <div className="gaia-hive-container" style={{ display: 'none' }}>
          <GaiaHiveSimple 
            query={query}
            onResponse={handleResponse}
            attributes={attributeSettings}
          />
        </div>
      )}
      
      {/* Show final response in a new UI element */}
      {response && (
        <div className="demo-response">
          <h3>Hive Mind Response</h3>
          <div className="response-content">
            {response}
          </div>
        </div>
      )}
      
      {/* Attribute dialogue */}
      <div className="demo-attributes-chat">
        <h3>Attribute Dialogue</h3>
        <div className="attributes-chat-window">
          {(conversation.length > 0 ? conversation : Object.entries(attributeSettings)
            .filter(([key]) => visibleMessages.includes(key))
            .map(([key, attr]) => {
              return {
                agent: key,
                agentName: key.charAt(0).toUpperCase() + key.slice(1),
                message: "Waiting for input...",
                model: attr.model,
                value: attr.value
              };
            }))
            .map((msg) => {
              // Determine avatar color based on agent/attribute type
              let avatarColor = "#28a745"; // Default green
              
              switch(msg.agent) {
                case "autonomy":
                  avatarColor = "#4682B4"; // Steel Blue
                  break;
                case "compassion":
                  avatarColor = "#E6A8D7"; // Pink
                  break;
                case "creativity":
                  avatarColor = "#FFD700"; // Gold
                  break;
                case "ecological":
                  avatarColor = "#228B22"; // Forest Green
                  break;
                case "efficiency":
                  avatarColor = "#B22222"; // Firebrick
                  break;
              }
              
              return (
                <div key={msg.agent} className="attribute-message animate-in">
                  <div className="attribute-avatar" style={{backgroundColor: avatarColor}}>
                    {msg.agentName.charAt(0)}
                  </div>
                  <div className="attribute-bubble">
                    <div className="attribute-header">
                      <div className="attribute-speaker" style={{color: avatarColor}}>
                        {msg.agentName}
                      </div>
                      <div className="attribute-model-info">
                        {msg.model ? `(${msg.model.split('/').pop().substring(0, 10)}...)` : ''}
                      </div>
                      <div className="message-timestamp">{formatTime(messageTimes[msg.agent])}</div>
                    </div>
                    <div className="attribute-content">{msg.message}</div>
                  </div>
                </div>
              );
            })}
            
            {/* Removed typing indicator since we show all messages at once */}
        </div>
      </div>
    </div>
  );
};


export default GaiaHiveDemo;