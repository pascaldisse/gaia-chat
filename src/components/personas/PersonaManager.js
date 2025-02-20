import React, { useState, useEffect } from 'react';
import { MODELS } from '../../config';
import Persona from '../../models/Persona';
import { personaDB } from '../../services/db';
import PersonaAttributesEditor from './PersonaAttributesEditor';
import '../../styles/personas/PersonaManager.css';

const PersonaManager = ({ persona, onPersonaUpdate, onDelete, onClose }) => {
  const [currentPersona, setCurrentPersona] = useState(
    persona || new Persona({ name: '', systemPrompt: '', model: MODELS.LLAMA3_70B })
  );
  const [showAttributesEditor, setShowAttributesEditor] = useState(false);
  const [imageSource, setImageSource] = useState('url'); // 'url' or 'file'
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (persona) {
      setCurrentPersona(persona);
    }
  }, [persona]);

  const handleSave = async () => {
    const updatedPersona = new Persona({
      ...currentPersona,
      updatedAt: Date.now()
    });
    await onPersonaUpdate(updatedPersona);
    onClose();
  };

  const handleAttributesSave = (attributes) => {
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
              onChange={(e) => setCurrentPersona({ ...currentPersona, name: e.target.value })}
              placeholder="Persona Name"
              disabled={currentPersona.isDefault}
            />
            
            <div className="image-upload-section">
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
            </div>

            <select
              value={currentPersona.model}
              onChange={(e) => setCurrentPersona({ ...currentPersona, model: e.target.value })}
            >
              {Object.entries(MODELS).map(([key, value]) => (
                <option key={key} value={value}>{key}</option>
              ))}
            </select>
            <textarea
              value={currentPersona.systemPrompt}
              onChange={(e) => setCurrentPersona({ ...currentPersona, systemPrompt: e.target.value })}
              placeholder="System Prompt"
              rows={6}
            />
            <button 
              className="edit-attributes-button"
              onClick={() => setShowAttributesEditor(true)}
            >
              Edit Personality Attributes
            </button>
          </div>
          <div className="modal-footer">
            {persona && (
              <button 
                className="delete-button"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Delete
              </button>
            )}
            <button className="save-button" onClick={handleSave}>Save</button>
          </div>
        </div>
      </div>
      
      {showAttributesEditor && (
        <PersonaAttributesEditor
          persona={currentPersona}
          onSave={handleAttributesSave}
          onClose={() => setShowAttributesEditor(false)}
        />
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
    </>
  );
};

export default PersonaManager;


