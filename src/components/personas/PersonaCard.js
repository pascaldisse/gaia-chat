import React from 'react';
import '../../styles/personas/PersonaStore.css';

/**
 * PersonaCard component for displaying a persona in the store
 * @param {Object} props
 * @param {Object} props.persona - The persona data
 * @param {Function} props.onAddClick - Function to call when the "Add" button is clicked
 * @param {Function} props.onViewDetails - Function to call when the "View Details" button is clicked
 */
const PersonaCard = ({ persona, onAddClick, onViewDetails }) => {
  // Format tags for display (limit to 3 maximum)
  const displayTags = persona.tags && persona.tags.length > 0 
    ? persona.tags.slice(0, 3) 
    : ['AI Assistant'];
  
  // Use a default image if none provided
  const imageUrl = persona.image || '/assets/personas/gaia-default.jpeg';
  
  // Format download count for display
  const formatDownloads = (count) => {
    if (!count) return '0';
    if (count < 1000) return count.toString();
    if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
    return `${(count / 1000000).toFixed(1)}M`;
  };
  
  // Format rating for display (e.g., "4.5/5")
  const formatRating = (rating) => {
    return `${rating || 0}/5`;
  };

  return (
    <div className="persona-card">
      {persona.isNsfw && (
        <div className="card-nsfw-badge">NSFW</div>
      )}
      
      <img 
        className="card-image" 
        src={imageUrl} 
        alt={persona.name} 
        onError={(e) => {
          e.target.src = '/assets/personas/gaia-default.jpeg';
        }}
      />
      
      <div className="card-content">
        <div className="card-header">
          <div>
            <h3 className="card-title">{persona.name}</h3>
            <div className="card-creator">by {persona.creator || 'Unknown Creator'}</div>
          </div>
          {persona.partnerCreated && (
            <div className="card-partner-badge">Partner</div>
          )}
        </div>
        
        <p className="card-description">
          {persona.description || 'No description available.'}
        </p>
        
        <div className="card-tags">
          {displayTags.map((tag, index) => (
            <span key={index} className="card-tag">{tag}</span>
          ))}
        </div>
        
        <div className="card-stats">
          <div className="downloads">
            <span>📥</span> {formatDownloads(persona.downloads)} downloads
          </div>
          <div className="rating">
            <span>⭐</span> {formatRating(persona.rating)}
          </div>
        </div>
        
        <div className="card-actions">
          <button className="add-button" onClick={onAddClick}>
            <span>+</span> Add to My Personas
          </button>
        </div>
        
        <div style={{ marginTop: '10px' }}>
          <button className="view-details-button" onClick={onViewDetails}>
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default PersonaCard;