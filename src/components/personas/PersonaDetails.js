import React from 'react';
import '../../styles/personas/PersonaStore.css';

/**
 * PersonaDetails component for displaying detailed information about a persona
 * @param {Object} props
 * @param {Object} props.persona - The persona data
 * @param {Function} props.onClose - Function to call when closing the modal
 * @param {Function} props.onAdd - Function to call when adding the persona
 */
const PersonaDetails = ({ persona, onClose, onAdd }) => {
  // Format tags for display
  const displayTags = persona.tags && persona.tags.length > 0 
    ? persona.tags 
    : ['AI Assistant'];
  
  // Use a default image if none provided
  const imageUrl = persona.image || '/assets/personas/gaia-default.jpeg';
  
  // Generate a list of attributes to display
  const attributes = [
    { name: 'Initiative', value: persona.initiative },
    { name: 'Talkativeness', value: persona.talkativeness },
    { name: 'Confidence', value: persona.confidence },
    { name: 'Curiosity', value: persona.curiosity },
    { name: 'Empathy', value: persona.empathy },
    { name: 'Creativity', value: persona.creativity },
    { name: 'Humor', value: persona.humor },
    { name: 'Adaptability', value: persona.adaptability },
    { name: 'Patience', value: persona.patience },
    { name: 'Skepticism', value: persona.skepticism },
    { name: 'Optimism', value: persona.optimism }
  ];
  
  // Format download count for display
  const formatDownloads = (count) => {
    if (!count) return '0';
    if (count < 1000) return count.toString();
    if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
    return `${(count / 1000000).toFixed(1)}M`;
  };
  
  // Get enabled tools
  const getEnabledTools = () => {
    const toolConfig = persona?.agentSettings?.toolConfig || {};
    
    const toolNames = {
      fileSearch: 'File Search',
      imageGeneration: 'Image Generation', 
      diceRoll: 'Dice Roll'
    };
    
    return Object.entries(toolConfig)
      .filter(([_, enabled]) => enabled)
      .map(([tool]) => toolNames[tool] || tool);
  };
  
  // Handle click outside modal to close
  const handleModalClick = (e) => {
    if (e.target.className === 'persona-details-modal') {
      onClose();
    }
  };

  return (
    <div className="persona-details-modal" onClick={handleModalClick}>
      <div className="details-content">
        <div className="details-header">
          <img 
            className="details-image" 
            src={imageUrl} 
            alt={persona.name} 
            onError={(e) => {
              e.target.src = '/assets/personas/gaia-default.jpeg';
            }}
          />
          
          <div className="details-title-section">
            <h2 className="details-title">{persona.name}</h2>
            <div className="details-creator">
              by {persona.creator || 'Unknown Creator'}
              {persona.partnerCreated && ' • Partner'}
              {persona.isNsfw && ' • NSFW'}
            </div>
            
            <div className="details-tags">
              {displayTags.map((tag, index) => (
                <span key={index} className="details-tag">{tag}</span>
              ))}
            </div>
            
            <div className="details-stats">
              <div className="downloads">
                <span>📥</span> {formatDownloads(persona.downloads)} downloads
              </div>
              <div className="model">
                <span>🤖</span> {persona.model || 'Default model'}
              </div>
            </div>
          </div>
        </div>
        
        <div className="details-body">
          <div className="details-section">
            <h3 className="details-section-title">Description</h3>
            <div className="details-description">
              {persona.description || 'No description provided for this persona.'}
            </div>
          </div>
          
          <div className="details-section">
            <h3 className="details-section-title">Personality Attributes</h3>
            <div className="attribute-grid">
              {attributes.map(attr => (
                <div key={attr.name} className="attribute-item">
                  <div className="attribute-name">{attr.name}</div>
                  <div className="attribute-value">
                    <div 
                      className="attribute-fill" 
                      style={{ width: `${(attr.value / 10) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {getEnabledTools().length > 0 && (
            <div className="details-section">
              <h3 className="details-section-title">Enabled Tools</h3>
              <div className="tools-list">
                {getEnabledTools().map((tool, index) => (
                  <div key={index} className="tool-item">
                    <span>🔧</span> {tool}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="details-footer">
          <button className="close-button" onClick={onClose}>
            Close
          </button>
          <button className="add-from-details-button" onClick={onAdd}>
            Add to My Personas
          </button>
        </div>
      </div>
    </div>
  );
};

export default PersonaDetails;