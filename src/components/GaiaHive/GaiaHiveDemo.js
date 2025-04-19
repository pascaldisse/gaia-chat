import React, { useState } from 'react';
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
      
      <div className="demo-form">
        <form onSubmit={handleSubmit}>
          <div className="query-label">Ask the Gaia Hive Mind a question:</div>
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
      
      {query && (
        <div className="gaia-hive-container">
          <GaiaHiveSimple 
            query={query}
            onResponse={handleResponse}
            attributes={customAttributes}
          />
        </div>
      )}
    </div>
  );
};

export default GaiaHiveDemo;