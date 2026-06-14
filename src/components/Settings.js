import React, { useEffect, useState } from 'react';
import { useProvider } from '../context/ProviderContext';
import { maskApiKey } from '../services/providerService';
import '../styles/Settings.css';

const capabilityLabels = [
  ['supportsChat', 'Chat'],
  ['supportsImages', 'Images'],
  ['supportsTTS', 'Voice']
];

const Settings = ({ onClose }) => {
  const {
    providerId,
    selectedModel,
    provider,
    allProviders,
    changeProvider,
    changeModel,
    setApiKey,
    clearApiKey,
    keyStatus
  } = useProvider();

  const [apiKeyInput, setApiKeyInput] = useState('');
  const [saveState, setSaveState] = useState('');

  useEffect(() => {
    setApiKeyInput('');
    setSaveState('');
  }, [providerId]);

  const handleSaveKey = () => {
    setApiKey(apiKeyInput);
    setApiKeyInput('');
    setSaveState('Saved');
  };

  const handleClearKey = () => {
    clearApiKey();
    setApiKeyInput('');
    setSaveState('Cleared');
  };

  const providerList = Object.values(allProviders);
  const modelEntries = Object.entries(provider.models || {});
  const imageEntries = Object.entries(provider.imageModels || {});

  return (
    <div className="settings-overlay" onMouseDown={onClose}>
      <section
        className="settings-modal"
        aria-label="Settings"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="settings-header">
          <div>
            <p className="settings-eyebrow">Runtime Settings</p>
            <h2>AI Provider</h2>
          </div>
          <button className="settings-close" onClick={onClose} aria-label="Close settings">
            x
          </button>
        </header>

        <div className="settings-body">
          <div className="settings-grid">
            <label className="settings-field">
              <span>Provider</span>
              <select value={providerId} onChange={(event) => changeProvider(event.target.value)}>
                {providerList.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="settings-field">
              <span>Default Chat Model</span>
              <select value={selectedModel} onChange={(event) => changeModel(event.target.value)}>
                {modelEntries.map(([label, modelId]) => (
                  <option key={modelId} value={modelId}>
                    {label.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <section className="settings-section">
            <div className="settings-section-header">
              <div>
                <h3>API Key</h3>
                <p>{provider.apiKeyLabel}</p>
              </div>
              <span className={`key-pill ${provider.apiKey ? 'ready' : 'missing'}`}>
                {keyStatus}
              </span>
            </div>

            <div className="apikey-row">
              <input
                type="password"
                value={apiKeyInput}
                onChange={(event) => {
                  setApiKeyInput(event.target.value);
                  setSaveState('');
                }}
                placeholder={`Paste ${provider.name} key`}
                autoComplete="off"
              />
              <button className="settings-btn primary" onClick={handleSaveKey}>
                Save
              </button>
              <button className="settings-btn" onClick={handleClearKey}>
                Clear
              </button>
            </div>

            <div className="settings-note">
              Keys are stored in this browser's localStorage. They are no longer committed in source.
              {provider.docsURL && (
                <>
                  {' '}
                  <a href={provider.docsURL} target="_blank" rel="noreferrer">
                    Open key page
                  </a>
                </>
              )}
              {saveState && <span className="save-state">{saveState}</span>}
            </div>
          </section>

          <section className="settings-section">
            <div className="settings-section-header">
              <div>
                <h3>Capabilities</h3>
                <p>What Gaia will use this provider for.</p>
              </div>
            </div>
            <div className="capability-row">
              {capabilityLabels.map(([key, label]) => (
                <span key={key} className={`capability ${provider[key] ? 'enabled' : 'disabled'}`}>
                  {label}
                </span>
              ))}
            </div>
            {!provider.supportsImages && (
              <p className="settings-note">
                Image generation currently falls back to DeepInfra when a DeepInfra key is configured.
              </p>
            )}
            {!provider.supportsTTS && (
              <p className="settings-note">
                Voice playback currently uses DeepInfra voice endpoints when a DeepInfra key is configured.
              </p>
            )}
          </section>

          <section className="settings-section model-section">
            <div className="settings-section-header">
              <div>
                <h3>Available Models</h3>
                <p>{provider.name} chat models shown in persona editors.</p>
              </div>
            </div>
            <ul className="model-list">
              {modelEntries.map(([label, modelId]) => (
                <li key={modelId} className={modelId === selectedModel ? 'selected' : ''}>
                  <span>{label.replace(/_/g, ' ')}</span>
                  <code>{modelId}</code>
                </li>
              ))}
            </ul>

            {imageEntries.length > 0 && (
              <>
                <h4>Image Models</h4>
                <ul className="model-list compact">
                  {imageEntries.map(([label, modelId]) => (
                    <li key={modelId}>
                      <span>{label.replace(/_/g, ' ')}</span>
                      <code>{modelId}</code>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>

          <section className="settings-section compact-summary">
            <h3>Current Runtime</h3>
            <dl>
              <div>
                <dt>Provider</dt>
                <dd>{provider.name}</dd>
              </div>
              <div>
                <dt>Base URL</dt>
                <dd>{provider.baseURL}</dd>
              </div>
              <div>
                <dt>Key</dt>
                <dd>{maskApiKey(provider.apiKey)}</dd>
              </div>
            </dl>
          </section>
        </div>
      </section>
    </div>
  );
};

export default Settings;
