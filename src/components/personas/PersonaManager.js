import React, { useState, useEffect } from 'react';
import { MODELS } from '../../config';
import Persona from '../../models/Persona';
import { personaDB } from '../../services/db';
import PersonaAttributesEditor from './PersonaAttributesEditor';
import '../../styles/personas/PersonaManager.css';
import { DEFAULT_PERSONA_ID } from '../../config/defaultPersona';
import { GAIA_CONFIG } from '../../config/defaultPersona';
import FilePreview from '../FilePreview';
import { knowledgeDB } from '../../services/db';
import ToolsPopup from './ToolsPopup';

const availableTools = [
  { name: 'diceRoll', label: 'Dice Roll', description: 'Roll polyhedral dice' },
  { name: 'imageGeneration', label: 'Image Generation', description: 'Generate images from text' }
];

const defaultToolConfig = {
  fileSearch: true,
  imageGeneration: false,
  diceRoll: false
};

// Store categories
export const PERSONA_CATEGORIES = {
  GENERAL: 'general',
  PRODUCTIVITY: 'productivity',
  CREATIVE: 'creative',
  ENTERTAINMENT: 'entertainment',
  EDUCATION: 'education',
  ROLEPLAY: 'roleplay',
  GAMING: 'gaming',
  CODING: 'coding',
  PROFESSIONAL: 'professional',
  OTHER: 'other'
};

const defaultAgentSettings = {
  maxIterations: 3,
  toolConfig: defaultToolConfig
};

const PersonaManager = ({ persona, onPersonaUpdate, onDelete, onClose }) => {
  const [currentPersona, setCurrentPersona] = useState(() => {
    const initialPersona = persona || new Persona({ 
      name: '', 
      systemPrompt: '', 
      model: MODELS.LLAMA3_70B
    });

    // Ensure agentSettings and toolConfig exist
    return {
      ...initialPersona,
      agentSettings: {
        ...defaultAgentSettings,
        ...(initialPersona.agentSettings || {}),
        toolConfig: {
          ...defaultToolConfig,
          ...(initialPersona.agentSettings?.toolConfig || {})
        }
      }
    };
  });
  const [showAttributesEditor, setShowAttributesEditor] = useState(false);
  const [showToolsPopup, setShowToolsPopup] = useState(false);
  const [imageSource, setImageSource] = useState('url'); // 'url' or 'file'
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [files, setFiles] = useState([]);
  const [showPublishOptions, setShowPublishOptions] = useState(false);

  useEffect(() => {
    if (persona) {
      setCurrentPersona(persona);
      loadFiles(persona.knowledgeFiles);
    }
  }, [persona]);

  const loadFiles = async (fileIds) => {
    if (fileIds?.length > 0) {
      const files = await knowledgeDB.getFiles(fileIds);
      setFiles(files);
    }
  };

  const getEnabledTools = () => {
    const toolConfig = currentPersona?.agentSettings?.toolConfig || defaultToolConfig;
    
    return Object.entries(toolConfig)
      .filter(([tool, enabled]) => enabled && tool !== 'fileSearch')
      .map(([tool]) => {
        const toolInfo = availableTools.find(t => t.name === tool);
        return toolInfo ? toolInfo.label : tool;
      });
  };

  const handleToolsUpdate = (updatedTools) => {
    console.log('PersonaManager: Received updated tool configuration:', updatedTools);
    
    const updatedPersona = {
      ...currentPersona,
      agentSettings: {
        ...defaultAgentSettings,
        ...(currentPersona.agentSettings || {}),
        toolConfig: {
          ...defaultToolConfig,
          ...(currentPersona.agentSettings?.toolConfig || {}),
          ...updatedTools
        }
      }
    };
    
    console.log('PersonaManager: Updated persona with new tool configuration:', 
      updatedPersona.agentSettings.toolConfig);
    
    setCurrentPersona(updatedPersona);
  };

  const handleSave = async () => {
    console.log('PersonaManager: Saving persona with data:', currentPersona);
    
    // For GAIA, ensure we preserve the name, image, and system prompt
    let personaToSave = {...currentPersona};
    
    if (personaToSave.id === DEFAULT_PERSONA_ID) {
      // Get the original GAIA config to preserve name, image, and system prompt
      console.log('Preserving GAIA default name, image and system prompt');
      personaToSave.name = GAIA_CONFIG.name;
      personaToSave.image = GAIA_CONFIG.image;
      personaToSave.systemPrompt = GAIA_CONFIG.systemPrompt; // Preserve the system prompt
    }
    
    // Create a complete persona object including all properties
    const updatedPersona = new Persona({
      ...personaToSave,
      updatedAt: Date.now()
    });
    
    // Add the agentSettings manually since they're not part of the Persona constructor
    updatedPersona.agentSettings = currentPersona.agentSettings;
    
    console.log('PersonaManager: Final persona to be saved:', updatedPersona);
    
    await onPersonaUpdate(updatedPersona);
    onClose();
  };

  const handleAttributesSave = (attributes) => {
    console.log('PersonaManager: Saving attributes with voice:', attributes);
    setCurrentPersona(prev => ({
      ...prev,
      ...attributes
    }));
    setShowAttributesEditor(false);
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        alert('Please upload a JPEG, PNG or WebP image');
        return;
      }

      try {
        // Convert the file to base64
        const reader = new FileReader();
        reader.onload = (e) => {
          setCurrentPersona(prev => ({
            ...prev,
            image: e.target.result
          }));
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error('Error processing image:', error);
      }
    }
  };

  const handleRestoreDefault = async () => {
    const defaultGaia = new Persona(GAIA_CONFIG);
    setCurrentPersona(defaultGaia);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const newFile = {
      name: file.name,
      type: file.type,
      content: await file.arrayBuffer(),
      uploadedAt: Date.now()
    };

    const id = await knowledgeDB.addFile(newFile);
    setCurrentPersona(prev => ({
      ...prev,
      knowledgeFiles: [...prev.knowledgeFiles, id]
    }));
    setFiles(prev => [...prev, { ...newFile, id }]);
  };

  const handleFileDelete = async (fileId) => {
    await knowledgeDB.deleteFile(fileId);
    setCurrentPersona(prev => ({
      ...prev,
      knowledgeFiles: prev.knowledgeFiles.filter(id => id !== fileId)
    }));
    setFiles(prev => prev.filter(file => file.id !== fileId));
  };

  return (
    <>
      <div className="persona-manager-modal">
        <div className="modal-content">
          <button className="close-button" onClick={onClose}>×</button>
          <h2>{persona ? 'Edit Persona' : 'New Persona'}</h2>
          <div className="persona-editor">
            <input
              type="text"
              value={currentPersona.name}
              onChange={(e) => setCurrentPersona(prev => ({...prev, name: e.target.value}))}
              disabled={currentPersona.id === DEFAULT_PERSONA_ID}
              placeholder="Persona Name"
            />
            
            <div className="image-upload-section">
              {currentPersona.id === DEFAULT_PERSONA_ID ? (
                /* For GAIA: Only show the image preview, not editable */
                <div className="default-persona-image">
                  <div className="image-preview">
                    <img src={currentPersona.image} alt="Persona" />
                    <div className="image-locked-message">Image is locked for default persona</div>
                  </div>
                </div>
              ) : (
                /* For all other personas: Allow image editing */
                <>
                  <div className="image-source-toggle">
                    <button 
                      className={`source-button ${imageSource === 'url' ? 'active' : ''}`}
                      onClick={() => setImageSource('url')}
                    >
                      URL
                    </button>
                    <button 
                      className={`source-button ${imageSource === 'file' ? 'active' : ''}`}
                      onClick={() => setImageSource('file')}
                    >
                      Upload File
                    </button>
                  </div>

                  {imageSource === 'url' ? (
                    <input 
                      value={currentPersona.image}
                      onChange={(e) => setCurrentPersona({ ...currentPersona, image: e.target.value })}
                      placeholder="Image URL"
                    />
                  ) : (
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp"
                      onChange={handleImageUpload}
                      className="file-input"
                    />
                  )}

                  {currentPersona.image && (
                    <div className="image-preview">
                      <img src={currentPersona.image} alt="Persona" />
                    </div>
                  )}
                </>
              )}
            </div>

            <select
              value={currentPersona.model}
              onChange={(e) => setCurrentPersona(prev => ({...prev, model: e.target.value}))}
            >
              {Object.entries(MODELS).map(([key, value]) => (
                <option key={key} value={value}>{key}</option>
              ))}
            </select>
            <div className="system-prompt-section">
              {currentPersona.id === DEFAULT_PERSONA_ID ? (
                <div className="prompt-hidden-message">
                  <div className="lock-icon">🔒</div>
                  <p>GAIA's system prompt is protected and cannot be viewed or edited directly.</p>
                  <p className="prompt-tip">You can still customize GAIA's personality, voice, and tools below.</p>
                </div>
              ) : (
                <textarea
                  value={currentPersona.systemPrompt}
                  onChange={(e) => setCurrentPersona({ ...currentPersona, systemPrompt: e.target.value })}
                  placeholder="System Prompt"
                  rows={6}
                />
              )}
            </div>
            <button 
              className="edit-attributes-button"
              onClick={() => setShowAttributesEditor(true)}
            >
              Edit Personality, Formatting & Voice
            </button>
          </div>
          <div className="tools-section">
            <h3>Agent Tools</h3>
            <div className="current-tools">
              {getEnabledTools().length > 0 ? (
                getEnabledTools().map(tool => (
                  <div key={tool} className="tool-tag">
                    {tool}
                  </div>
                ))
              ) : (
                <span className="no-tools">No tools enabled</span>
              )}
            </div>
            <button 
              className="manage-tools-button"
              onClick={() => setShowToolsPopup(true)}
            >
              Manage Tools
            </button>
          </div>
          <div className="knowledge-section">
            <h3>Knowledge Base</h3>
            <input 
              type="file"
              onChange={handleFileUpload}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.jpg,.jpeg,.png"
            />
            <div className="file-list">
              {files.map(file => (
                <FilePreview key={file.id} fileId={file.id} onDelete={handleFileDelete} />
              ))}
            </div>
          </div>
          <div className="modal-footer">
            {currentPersona.id === DEFAULT_PERSONA_ID && (
              <button 
                className="restore-default-button"
                onClick={handleRestoreDefault}
              >
                Restore Default
              </button>
            )}
            {currentPersona.id !== DEFAULT_PERSONA_ID && (
              <>
                <button 
                  className="delete-button"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  Delete
                </button>
                <button
                  className="publish-button"
                  onClick={() => setShowPublishOptions(true)}
                >
                  {currentPersona.published ? 'Manage Publishing' : 'Publish to Store'}
                </button>
              </>
            )}
            <button className="save-button" onClick={handleSave}>Save</button>
          </div>
        </div>
      </div>
      
      {showAttributesEditor && (
        <div className="attributes-editor-modal">
          <div className="attributes-content">
            <h2>Edit Personality & Formatting</h2>
            <PersonaAttributesEditor
              persona={currentPersona}
              onChange={handleAttributesSave}
            />
            <div className="modal-footer">
              <button className="cancel-button" onClick={() => setShowAttributesEditor(false)}>
                Cancel
              </button>
              <button className="save-button" onClick={() => setShowAttributesEditor(false)}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="confirm-delete-modal">
          <div className="confirm-content">
            <h3>Delete Persona?</h3>
            <p>Are you sure you want to delete {currentPersona.name}? This action cannot be undone.</p>
            <div className="modal-footer">
              <button className="cancel-button" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </button>
              <button 
                className="delete-button"
                onClick={() => onDelete(currentPersona)}
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {currentPersona.id === DEFAULT_PERSONA_ID && (
        <button 
          className="restore-default-button"
          onClick={handleRestoreDefault}
        >
          Restore Default Settings
        </button>
      )}

      {showToolsPopup && (
        <ToolsPopup
          tools={currentPersona?.agentSettings?.toolConfig || defaultToolConfig}
          onUpdate={handleToolsUpdate}
          onClose={() => setShowToolsPopup(false)}
        />
      )}
      
      {showPublishOptions && (
        <div className="modal-overlay">
          <div className="publish-options-modal">
            <h3>Publish to Persona Store</h3>
            
            <div className="publish-form">
              <div className="form-group">
                <label>Description (visible in store)</label>
                <textarea
                  value={currentPersona.description || ''}
                  onChange={(e) => setCurrentPersona(prev => ({
                    ...prev,
                    description: e.target.value
                  }))}
                  placeholder="Provide a description of your persona for other users"
                  rows={4}
                />
              </div>
              
              <div className="form-group">
                <label>Creator Name</label>
                <input
                  type="text"
                  value={currentPersona.creator || ''}
                  onChange={(e) => setCurrentPersona(prev => ({
                    ...prev,
                    creator: e.target.value
                  }))}
                  placeholder="Your name or username"
                />
              </div>
              
              <div className="form-group">
                <label>Category</label>
                <select
                  value={currentPersona.category || PERSONA_CATEGORIES.GENERAL}
                  onChange={(e) => setCurrentPersona(prev => ({
                    ...prev,
                    category: e.target.value
                  }))}
                >
                  {Object.entries(PERSONA_CATEGORIES).map(([key, value]) => (
                    <option key={value} value={value}>
                      {key.charAt(0) + key.slice(1).toLowerCase().replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Tags (comma separated)</label>
                <input
                  type="text"
                  value={(currentPersona.tags || []).join(', ')}
                  onChange={(e) => setCurrentPersona(prev => ({
                    ...prev,
                    tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                  }))}
                  placeholder="AI, Assistant, Helper, etc."
                />
              </div>
              
              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={currentPersona.isNsfw || false}
                    onChange={(e) => setCurrentPersona(prev => ({
                      ...prev,
                      isNsfw: e.target.checked
                    }))}
                  />
                  <span>Contains NSFW content</span>
                </label>
                <p className="helper-text">
                  Check this box if your persona contains adult or sensitive content
                </p>
              </div>
            </div>
            
            <div className="publish-actions">
              <button
                className="cancel-button"
                onClick={() => setShowPublishOptions(false)}
              >
                Cancel
              </button>
              
              {currentPersona.published ? (
                <button
                  className="unpublish-button"
                  onClick={async () => {
                    try {
                      await personaDB.unpublishPersona(currentPersona.id, currentPersona.userId);
                      setCurrentPersona(prev => ({...prev, published: false}));
                      setShowPublishOptions(false);
                      alert('Your persona has been unpublished from the store.');
                    } catch (error) {
                      console.error('Error unpublishing persona:', error);
                      alert('Failed to unpublish persona. Please try again.');
                    }
                  }}
                >
                  Unpublish from Store
                </button>
              ) : (
                <button
                  className="publish-button"
                  onClick={async () => {
                    try {
                      await personaDB.publishPersona(currentPersona.id, currentPersona.userId);
                      setCurrentPersona(prev => ({...prev, published: true}));
                      setShowPublishOptions(false);
                      alert('Your persona has been published to the store!');
                    } catch (error) {
                      console.error('Error publishing persona:', error);
                      alert('Failed to publish persona. Please try again.');
                    }
                  }}
                >
                  Publish to Store
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PersonaManager;


