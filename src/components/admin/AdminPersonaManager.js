import React, { useState, useEffect } from 'react';
import Persona from '../../models/Persona';
import { personaDB } from '../../services/db';
import { MODELS } from '../../config';
import { PERSONA_CATEGORIES } from '../personas/PersonaManager';
import '../../styles/admin/AdminPersonaManager.css';

const AdminPersonaManager = () => {
  const [personas, setPersonas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPersona, setEditingPersona] = useState(null);
  const [selectedPersonaId, setSelectedPersonaId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showNsfw, setShowNsfw] = useState(true);
  const [filterType, setFilterType] = useState('all'); // 'all', 'partner', 'user', 'system'
  const [feedbackMessage, setFeedbackMessage] = useState(null);
  
  // Fetch all personas
  const loadPersonas = async () => {
    try {
      setLoading(true);
      let allPersonas = await personaDB.getAllPersonas();
      
      // Apply filters
      if (filterCategory !== 'all') {
        allPersonas = allPersonas.filter(p => p.category === filterCategory);
      }
      
      if (!showNsfw) {
        allPersonas = allPersonas.filter(p => !p.isNsfw);
      }
      
      if (filterType !== 'all') {
        if (filterType === 'partner') {
          allPersonas = allPersonas.filter(p => p.partnerCreated);
        } else if (filterType === 'user') {
          allPersonas = allPersonas.filter(p => p.userId && !p.partnerCreated && !p.isSystem);
        } else if (filterType === 'system') {
          allPersonas = allPersonas.filter(p => p.isSystem);
        }
      }
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase().trim();
        allPersonas = allPersonas.filter(p => 
          (p.name?.toLowerCase().includes(query)) ||
          (p.description?.toLowerCase().includes(query)) ||
          (p.systemPrompt?.toLowerCase().includes(query)) ||
          (p.creator?.toLowerCase().includes(query)) ||
          (p.tags?.some(tag => tag.toLowerCase().includes(query)))
        );
      }
      
      setPersonas(allPersonas);
    } catch (error) {
      console.error('Error loading personas:', error);
      showFeedback('Error loading personas', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Load personas on mount and when filters change
  useEffect(() => {
    loadPersonas();
  }, [filterCategory, showNsfw, filterType, searchQuery]);
  
  // Feedback message display and auto-hide
  const showFeedback = (message, type = 'success') => {
    setFeedbackMessage({ message, type });
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 3000);
  };
  
  // Create a new persona
  const createNewPersona = async () => {
    try {
      const newPersona = new Persona({
        name: 'New Persona',
        description: 'Persona description',
        systemPrompt: 'You are a helpful assistant.',
        model: MODELS.LLAMA3_70B,
        category: PERSONA_CATEGORIES.GENERAL,
        tags: ['AI Assistant'],
        partnerCreated: false,
        isNsfw: false,
        published: false
      });
      
      await personaDB.savePersona(newPersona);
      showFeedback('New persona created successfully');
      loadPersonas();
      setSelectedPersonaId(newPersona.id);
      setEditingPersona(newPersona);
    } catch (error) {
      console.error('Error creating persona:', error);
      showFeedback('Error creating persona', 'error');
    }
  };
  
  // Delete a persona
  const deletePersona = async (personaId) => {
    if (!window.confirm('Are you sure you want to delete this persona? This action cannot be undone.')) {
      return;
    }
    
    try {
      await personaDB.deletePersona(personaId);
      showFeedback('Persona deleted successfully');
      
      if (selectedPersonaId === personaId) {
        setSelectedPersonaId(null);
        setEditingPersona(null);
      }
      
      loadPersonas();
    } catch (error) {
      console.error('Error deleting persona:', error);
      showFeedback('Error deleting persona', 'error');
    }
  };
  
  // Save edited persona
  const savePersona = async () => {
    if (!editingPersona) return;
    
    try {
      await personaDB.savePersona(editingPersona);
      showFeedback('Persona saved successfully');
      loadPersonas();
    } catch (error) {
      console.error('Error saving persona:', error);
      showFeedback('Error saving persona', 'error');
    }
  };
  
  // Toggle publish status
  const togglePublishStatus = async (personaId, currentStatus) => {
    try {
      const persona = await personaDB.getPersonaById(personaId);
      if (!persona) {
        showFeedback('Persona not found', 'error');
        return;
      }
      
      persona.published = !currentStatus;
      await personaDB.savePersona(persona);
      showFeedback(`Persona ${!currentStatus ? 'published' : 'unpublished'} successfully`);
      loadPersonas();
      
      if (selectedPersonaId === personaId) {
        setEditingPersona({...persona});
      }
    } catch (error) {
      console.error('Error toggling publish status:', error);
      showFeedback('Error updating persona', 'error');
    }
  };

  // Handle input changes for editing
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setEditingPersona(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  // Handle array/tag changes
  const handleTagsChange = (e) => {
    const tagsString = e.target.value;
    const tagsArray = tagsString.split(',').map(tag => tag.trim()).filter(Boolean);
    
    setEditingPersona(prev => ({
      ...prev,
      tags: tagsArray
    }));
  };
  
  // Select a persona for editing
  const selectPersona = async (personaId) => {
    try {
      const persona = await personaDB.getPersonaById(personaId);
      setSelectedPersonaId(personaId);
      setEditingPersona(persona);
    } catch (error) {
      console.error('Error selecting persona:', error);
      showFeedback('Error loading persona details', 'error');
    }
  };

  return (
    <div className="admin-persona-manager">
      {feedbackMessage && (
        <div className={`feedback-message ${feedbackMessage.type}`}>
          {feedbackMessage.message}
        </div>
      )}
      
      <div className="top-controls">
        <div className="search-filter-container">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search personas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span className="search-icon">🔍</span>
          </div>
          
          <div className="filters">
            <select 
              value={filterCategory} 
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              {Object.entries(PERSONA_CATEGORIES).map(([key, value]) => (
                <option key={value} value={value}>
                  {key.charAt(0) + key.slice(1).toLowerCase().replace('_', ' ')}
                </option>
              ))}
            </select>
            
            <select 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="partner">Partner</option>
              <option value="user">User Created</option>
              <option value="system">System</option>
            </select>
            
            <label className="nsfw-toggle">
              <input
                type="checkbox"
                checked={showNsfw}
                onChange={() => setShowNsfw(!showNsfw)}
              />
              Show NSFW
            </label>
          </div>
        </div>
        
        <button 
          className="new-persona-button"
          onClick={createNewPersona}
        >
          + New Persona
        </button>
      </div>
      
      <div className="personas-editor-container">
        <div className="personas-list">
          {loading ? (
            <div className="loading">Loading personas...</div>
          ) : personas.length === 0 ? (
            <div className="no-results">No personas found</div>
          ) : (
            <div className="personas-grid">
              {personas.map(persona => (
                <div 
                  key={persona.id} 
                  className={`persona-card ${selectedPersonaId === persona.id ? 'selected' : ''}`}
                  onClick={() => selectPersona(persona.id)}
                >
                  <div className="persona-card-image">
                    {persona.image ? (
                      <img src={persona.image} alt={persona.name} />
                    ) : (
                      <div className="no-image">No Image</div>
                    )}
                    {persona.isNsfw && <span className="nsfw-tag">NSFW</span>}
                  </div>
                  
                  <div className="persona-card-info">
                    <h3>{persona.name}</h3>
                    <div className="persona-badges">
                      {persona.partnerCreated && <span className="badge partner">Partner</span>}
                      {persona.isSystem && <span className="badge system">System</span>}
                      {persona.published && <span className="badge published">Published</span>}
                      {persona.userId && !persona.partnerCreated && !persona.isSystem && (
                        <span className="badge user">User</span>
                      )}
                    </div>
                    <p className="persona-desc">{persona.description || 'No description'}</p>
                    <div className="persona-tags">
                      {persona.tags && persona.tags.map((tag, index) => (
                        <span key={index} className="tag">{tag}</span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="persona-card-actions">
                    <button 
                      className="action-btn edit"
                      onClick={(e) => {
                        e.stopPropagation();
                        selectPersona(persona.id);
                      }}
                    >
                      Edit
                    </button>
                    <button 
                      className="action-btn delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        deletePersona(persona.id);
                      }}
                    >
                      Delete
                    </button>
                    <button 
                      className={`action-btn ${persona.published ? 'unpublish' : 'publish'}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePublishStatus(persona.id, persona.published);
                      }}
                    >
                      {persona.published ? 'Unpublish' : 'Publish'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {editingPersona && (
          <div className="persona-editor">
            <h2>Edit Persona</h2>
            
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                name="name"
                value={editingPersona.name || ''}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={editingPersona.description || ''}
                onChange={handleInputChange}
                rows={3}
              ></textarea>
            </div>
            
            <div className="form-group">
              <label>System Prompt</label>
              <textarea
                name="systemPrompt"
                value={editingPersona.systemPrompt || ''}
                onChange={handleInputChange}
                rows={8}
              ></textarea>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Category</label>
                <select
                  name="category"
                  value={editingPersona.category || PERSONA_CATEGORIES.GENERAL}
                  onChange={handleInputChange}
                >
                  {Object.entries(PERSONA_CATEGORIES).map(([key, value]) => (
                    <option key={value} value={value}>
                      {key.charAt(0) + key.slice(1).toLowerCase().replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Model</label>
                <select
                  name="model"
                  value={editingPersona.model || MODELS.LLAMA3_70B}
                  onChange={handleInputChange}
                >
                  {Object.entries(MODELS).map(([key, value]) => (
                    <option key={key} value={value}>{key}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="form-group">
              <label>Image URL</label>
              <input
                type="text"
                name="image"
                value={editingPersona.image || ''}
                onChange={handleInputChange}
              />
              {editingPersona.image && (
                <div className="image-preview">
                  <img src={editingPersona.image} alt={editingPersona.name} />
                </div>
              )}
            </div>
            
            <div className="form-group">
              <label>Tags (comma separated)</label>
              <input
                type="text"
                name="tags"
                value={(editingPersona.tags || []).join(', ')}
                onChange={handleTagsChange}
              />
            </div>
            
            <div className="form-row">
              <div className="form-group checkbox">
                <label>
                  <input
                    type="checkbox"
                    name="isNsfw"
                    checked={editingPersona.isNsfw || false}
                    onChange={handleInputChange}
                  />
                  NSFW Content
                </label>
              </div>
              
              <div className="form-group checkbox">
                <label>
                  <input
                    type="checkbox"
                    name="partnerCreated"
                    checked={editingPersona.partnerCreated || false}
                    onChange={handleInputChange}
                  />
                  Partner Created
                </label>
              </div>
              
              <div className="form-group checkbox">
                <label>
                  <input
                    type="checkbox"
                    name="published"
                    checked={editingPersona.published || false}
                    onChange={handleInputChange}
                  />
                  Published in Store
                </label>
              </div>
            </div>
            
            <div className="form-group">
              <label>Creator</label>
              <input
                type="text"
                name="creator"
                value={editingPersona.creator || ''}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="form-actions">
              <button 
                className="save-button"
                onClick={savePersona}
              >
                Save Changes
              </button>
              <button 
                className="cancel-button"
                onClick={() => {
                  setEditingPersona(null);
                  setSelectedPersonaId(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPersonaManager;