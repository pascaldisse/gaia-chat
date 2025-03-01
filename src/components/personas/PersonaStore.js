import React, { useState, useEffect, useContext } from 'react';
import { personaDB } from '../../services/db';
import '../../styles/personas/PersonaStore.css';
import { UserContext } from '../../contexts/UserContext';
import { PERSONA_CATEGORIES } from './PersonaManager';
import PersonaCard from './PersonaCard';
import PersonaDetails from './PersonaDetails';
import { addSamplePersonasToDatabase } from './SamplePersonas';

const PersonaStore = () => {
  const { user } = useContext(UserContext);
  const [activeTab, setActiveTab] = useState('featured'); // 'featured', 'partners', 'community'
  const [activeCategory, setActiveCategory] = useState('all');
  const [personas, setPersonas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNsfw, setShowNsfw] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState(null);
  const [showPersonaDetails, setShowPersonaDetails] = useState(false);

  // Load sample personas the first time the store is accessed
  useEffect(() => {
    const initializeStore = async () => {
      try {
        // Add sample personas to the database
        await addSamplePersonasToDatabase(personaDB);
      } catch (error) {
        console.error('Error initializing store with sample personas:', error);
      }
    };

    initializeStore();
  }, []);

  // Load personas based on active tab and filters
  useEffect(() => {
    const loadPersonas = async () => {
      setLoading(true);
      let personaList = [];

      try {
        switch (activeTab) {
          case 'partners':
            personaList = await personaDB.getPartnerPersonas(showNsfw);
            break;
          case 'community':
            personaList = await personaDB.getUserCreatedPersonas(user?.id, showNsfw);
            break;
          case 'featured':
          default:
            personaList = await personaDB.getStorePersonas(showNsfw);
            break;
        }

        // Apply category filter if not 'all'
        if (activeCategory !== 'all') {
          personaList = personaList.filter(p => p.category === activeCategory);
        }

        // Apply search filter if search query exists
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase().trim();
          personaList = personaList.filter(p => 
            (p.name && p.name.toLowerCase().includes(query)) ||
            (p.description && p.description.toLowerCase().includes(query)) ||
            (p.tags && p.tags.some(tag => tag.toLowerCase().includes(query)))
          );
        }

        setPersonas(personaList);
      } catch (error) {
        console.error('Error loading personas:', error);
        setPersonas([]);
      } finally {
        setLoading(false);
      }
    };

    loadPersonas();
  }, [activeTab, activeCategory, searchQuery, showNsfw, user]);

  const handlePersonaClick = (persona) => {
    setSelectedPersona(persona);
    setShowPersonaDetails(true);
  };

  const handleAddPersona = async (persona) => {
    try {
      // Create a copy of the persona without store-specific properties
      const newPersona = { ...persona };
      
      // Set a new ID to avoid overwriting the original
      newPersona.id = Date.now();
      
      // Mark as not published in the store
      newPersona.published = false;
      
      // Set the current user as the owner
      newPersona.userId = user?.id;
      
      // Reset statistics
      newPersona.downloads = 0;
      
      // Save to database
      await personaDB.savePersona(newPersona);
      
      // Increment the download count for the original persona
      await personaDB.incrementDownloads(persona.id);
      
      // Show success message or update UI
      alert(`${persona.name} has been added to your personas!`);
      
      // Close details modal if open
      setShowPersonaDetails(false);
    } catch (error) {
      console.error('Error adding persona:', error);
      alert('Failed to add persona. Please try again.');
    }
  };

  // Render category tabs
  const renderCategoryTabs = () => {
    const categories = [
      { id: 'all', label: 'All Categories' },
      ...Object.entries(PERSONA_CATEGORIES).map(([key, value]) => ({
        id: value,
        label: key.charAt(0) + key.slice(1).toLowerCase().replace('_', ' ')
      }))
    ];

    return (
      <div className="category-tabs">
        {categories.map(category => (
          <div
            key={category.id}
            className={`category-tab ${activeCategory === category.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(category.id)}
          >
            {category.label}
          </div>
        ))}
      </div>
    );
  };

  // Render tab navigation
  const renderTabNav = () => (
    <div className="store-nav">
      <div 
        className={`store-nav-item ${activeTab === 'featured' ? 'active' : ''}`}
        onClick={() => setActiveTab('featured')}
      >
        Featured
      </div>
      <div 
        className={`store-nav-item ${activeTab === 'partners' ? 'active' : ''}`}
        onClick={() => setActiveTab('partners')}
      >
        Partner Personas
      </div>
      <div 
        className={`store-nav-item ${activeTab === 'community' ? 'active' : ''}`}
        onClick={() => setActiveTab('community')}
      >
        Community Created
      </div>
    </div>
  );

  // Render search and filter controls
  const renderControls = () => (
    <div className="store-controls">
      <div className="store-search">
        <input
          type="text"
          placeholder="Search personas..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
        </svg>
      </div>
      <div className="nsfw-toggle">
        <label className="toggle-switch">
          <input 
            type="checkbox" 
            checked={showNsfw} 
            onChange={() => setShowNsfw(!showNsfw)}
          />
          <span className="toggle-slider"></span>
        </label>
        <label>Show NSFW Content</label>
      </div>
    </div>
  );

  // Render empty state when no personas are found
  const renderEmptyState = () => (
    <div className="empty-state">
      <div className="empty-icon">🔍</div>
      <h3 className="empty-title">No personas found</h3>
      <p className="empty-description">
        Try adjusting your search or filters to find what you're looking for.
      </p>
    </div>
  );

  // Render loading spinner
  const renderLoading = () => (
    <div className="loading-container">
      <div className="loading-spinner"></div>
    </div>
  );

  return (
    <div className="persona-store-container">
      <div className="store-header">
        <h1 className="store-title">Persona Store</h1>
        {renderControls()}
      </div>
      
      {renderTabNav()}
      {renderCategoryTabs()}
      
      {loading ? (
        renderLoading()
      ) : personas.length > 0 ? (
        <div className="persona-card-grid">
          {personas.map(persona => (
            <PersonaCard 
              key={persona.id}
              persona={persona}
              onAddClick={() => handleAddPersona(persona)}
              onViewDetails={() => handlePersonaClick(persona)}
            />
          ))}
        </div>
      ) : (
        renderEmptyState()
      )}
      
      {showPersonaDetails && selectedPersona && (
        <PersonaDetails
          persona={selectedPersona}
          onClose={() => setShowPersonaDetails(false)}
          onAdd={() => handleAddPersona(selectedPersona)}
        />
      )}
    </div>
  );
};

export default PersonaStore;