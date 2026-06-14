import React, { useEffect, useState } from 'react';
import { useProvider } from '../context/ProviderContext';
import { maskApiKey } from '../services/providerService';
import {
  IMAGE_PROVIDER_DEFINITIONS,
  getImageProviderDefinition
} from '../config/providers';
import {
  getImageLocalBaseURL,
  getProviderApiKey,
  setImageLocalBaseURL,
  setProviderApiKey
} from '../services/providerService';
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
    setBaseURL,
    keyStatus,
    imageProviderId,
    imageModel,
    changeImageProvider,
    changeImageModel
  } = useProvider();

  const [apiKeyInput, setApiKeyInput] = useState('');
  const [modelInput, setModelInput] = useState('');
  const [baseURLInput, setBaseURLInput] = useState('');
  const [saveState, setSaveState] = useState('');

  // Image provider local state
  const [imageApiKeyInput, setImageApiKeyInput] = useState('');
  const [imageBaseURLInput, setImageBaseURLInput] = useState('');
  const [imageSaveState, setImageSaveState] = useState('');

  const currentIP = getImageProviderDefinition(imageProviderId);
  const imageModelEntries = Object.entries(currentIP.imageModels || {});

  useEffect(() => {
    setApiKeyInput('');
    setModelInput('');
    setBaseURLInput(provider.baseURL || '');
    setSaveState('');
  }, [providerId, provider.baseURL]);

  useEffect(() => {
    setImageApiKeyInput('');
    setImageBaseURLInput(currentIP.needsBaseUrlInput ? getImageLocalBaseURL() : '');
    setImageSaveState('');
  }, [imageProviderId, currentIP.needsBaseUrlInput]);

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

  const handleUseCustomModel = () => {
    if (!modelInput.trim()) return;
    changeModel(modelInput.trim());
    setModelInput('');
    setSaveState('Model saved');
  };

  const handleSaveBaseURL = () => {
    setBaseURL(baseURLInput);
    setSaveState('Base URL saved');
  };

  const providerList = Object.values(allProviders);
  const modelEntries = Object.entries(provider.models || {});
  const selectedInList = modelEntries.some(([, modelId]) => modelId === selectedModel);
  const selectModelEntries = selectedInList || !selectedModel
    ? modelEntries
    : [['CUSTOM_SELECTED', selectedModel], ...modelEntries];
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
                {selectModelEntries.map(([label, modelId]) => (
                  <option key={modelId} value={modelId}>
                    {label.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {provider.allowCustomBaseURL && (
            <section className="settings-section">
              <div className="settings-section-header">
                <div>
                  <h3>Base URL</h3>
                  <p>OpenAI-compatible endpoint for local or custom servers.</p>
                </div>
              </div>
              <div className="single-input-row">
                <input
                  type="url"
                  value={baseURLInput}
                  onChange={(event) => {
                    setBaseURLInput(event.target.value);
                    setSaveState('');
                  }}
                  placeholder="http://localhost:11434/v1"
                />
                <button className="settings-btn primary" onClick={handleSaveBaseURL}>
                  Save URL
                </button>
              </div>
            </section>
          )}

          <section className="settings-section">
            <div className="settings-section-header">
              <div>
              <h3>API Key</h3>
                <p>{provider.apiKeyLabel}{provider.requiresApiKey ? '' : ' (optional)'}</p>
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
              {selectModelEntries.map(([label, modelId]) => (
                <li key={modelId} className={modelId === selectedModel ? 'selected' : ''}>
                  <span>{label.replace(/_/g, ' ')}</span>
                  <code>{modelId}</code>
                </li>
              ))}
            </ul>

            {provider.allowCustomModel && (
              <div className="custom-model-row">
                <input
                  type="text"
                  value={modelInput}
                  onChange={(event) => {
                    setModelInput(event.target.value);
                    setSaveState('');
                  }}
                  placeholder="Enter exact model ID"
                />
                <button className="settings-btn primary" onClick={handleUseCustomModel}>
                  Use Model
                </button>
              </div>
            )}

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

          {/* ---- Image Provider Section ---- */}
          <section className="settings-section">
            <div className="settings-section-header">
              <div>
                <h3>Image Provider</h3>
                <p>Select the provider used for image generation.</p>
              </div>
            </div>

            <div className="settings-grid">
              <label className="settings-field">
                <span>Provider</span>
                <select
                  value={imageProviderId}
                  onChange={(e) => changeImageProvider(e.target.value)}
                >
                  {Object.values(IMAGE_PROVIDER_DEFINITIONS).map((ip) => (
                    <option key={ip.id} value={ip.id}>
                      {ip.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="settings-field">
                <span>Model</span>
                <select
                  value={imageModel}
                  onChange={(e) => changeImageModel(e.target.value)}
                >
                  {imageModelEntries.map(([label, id]) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {/* DeepInfra note */}
            {imageProviderId === 'deepinfra' && (
              <p className="settings-note">
                Uses your DeepInfra API key configured in the LLM provider section above.
              </p>
            )}

            {/* OpenAI: shared key */}
            {imageProviderId === 'openai' && (
              <>
                {!getProviderApiKey('openai') && (
                  <p className="settings-note" style={{ color: '#e6a817' }}>
                    ⚠ Your OpenAI API key must be set in the LLM provider section above.
                  </p>
                )}
                <p className="settings-note">
                  Uses your OpenAI API key configured above. No separate key needed.
                </p>
              </>
            )}

            {/* Flux (BFL): own API key */}
            {imageProviderId === 'flux' && (
              <>
                <div className="apikey-row">
                  <input
                    type="password"
                    value={imageApiKeyInput}
                    onChange={(e) => {
                      setImageApiKeyInput(e.target.value);
                      setImageSaveState('');
                    }}
                    placeholder="Paste BFL API key"
                    autoComplete="off"
                  />
                  <button
                    className="settings-btn primary"
                    onClick={() => {
                      setProviderApiKey('flux', imageApiKeyInput);
                      setImageApiKeyInput('');
                      setImageSaveState('Saved');
                    }}
                  >
                    Save
                  </button>
                </div>
                <p className="settings-note">
                  Get a key at{' '}
                  <a href="https://bfl.ai" target="_blank" rel="noreferrer">
                    bfl.ai
                  </a>
                  {imageSaveState && (
                    <span className="save-state"> {imageSaveState}</span>
                  )}
                </p>
              </>
            )}

            {/* Local: base URL + optional key */}
            {imageProviderId === 'local' && (
              <>
                <div className="single-input-row">
                  <input
                    type="url"
                    value={imageBaseURLInput}
                    onChange={(e) => {
                      setImageBaseURLInput(e.target.value);
                      setImageSaveState('');
                    }}
                    placeholder="http://localhost:8080"
                  />
                  <button
                    className="settings-btn primary"
                    onClick={() => {
                      setImageLocalBaseURL(imageBaseURLInput);
                      setImageSaveState('Base URL saved');
                    }}
                  >
                    Save URL
                  </button>
                </div>
                <div className="apikey-row">
                  <input
                    type="password"
                    value={imageApiKeyInput}
                    onChange={(e) => {
                      setImageApiKeyInput(e.target.value);
                      setImageSaveState('');
                    }}
                    placeholder="API key (optional)"
                    autoComplete="off"
                  />
                  <button
                    className="settings-btn primary"
                    onClick={() => {
                      setProviderApiKey('local', imageApiKeyInput);
                      setImageApiKeyInput('');
                      setImageSaveState('Saved');
                    }}
                  >
                    Save
                  </button>
                </div>
                <p className="settings-note">
                  Expects a BFL-compatible API (POST /v1/{'{model}'} then poll /v1/get_result).
                  {imageSaveState && (
                    <span className="save-state"> {imageSaveState}</span>
                  )}
                </p>
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
                <dt>API type</dt>
                <dd>{provider.apiType}</dd>
              </div>
              <div>
                <dt>Model</dt>
                <dd>{selectedModel}</dd>
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
