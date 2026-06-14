import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { PROVIDER_DEFINITIONS } from '../config/providers';
import {
  getImageProviderId,
  getSelectedImageModel,
  getSelectedModel,
  getSelectedProviderId,
  getSelectedTTSModel,
  getTTSLocalBaseURL,
  getTTSProviderId,
  maskApiKey,
  resolveProvider,
  setImageProviderId,
  setProviderBaseURL,
  setProviderApiKey,
  setSelectedImageModel,
  setSelectedModel,
  setSelectedProviderId,
  setSelectedTTSModel,
  setTTSLocalAdapter,
  setTTSLocalBaseURL,
  setTTSLocalLanguage,
  setTTSLocalStyle,
  setTTSProviderId
} from '../services/providerService';

const ProviderContext = createContext(null);

export function ProviderProvider({ children }) {
  const [providerId, setProviderIdState] = useState(getSelectedProviderId);
  const [selectedModel, setSelectedModelState] = useState(() => getSelectedModel(providerId));
  const [imageProviderId, setImageProviderIdState] = useState(getImageProviderId);
  const [imageModel, setImageModelState] = useState(() => getSelectedImageModel(getImageProviderId()));
  const [ttsProviderId, setTTSProviderIdState] = useState(getTTSProviderId);
  const [ttsModel, setTTSModelState] = useState(() => getSelectedTTSModel(getTTSProviderId()));
  const [, setRevision] = useState(0);

  const provider = resolveProvider(providerId);

  const changeProvider = useCallback((newProviderId) => {
    setSelectedProviderId(newProviderId);
    const nextModel = getSelectedModel(newProviderId);
    setProviderIdState(newProviderId);
    setSelectedModelState(nextModel);
    setRevision(value => value + 1);
  }, []);

  const changeModel = useCallback((modelId) => {
    setSelectedModel(providerId, modelId);
    setSelectedModelState(modelId);
    setRevision(value => value + 1);
  }, [providerId]);

  const saveApiKey = useCallback((apiKey) => {
    setProviderApiKey(providerId, apiKey);
    setRevision(value => value + 1);
  }, [providerId]);

  const clearApiKey = useCallback(() => {
    setProviderApiKey(providerId, '');
    setRevision(value => value + 1);
  }, [providerId]);

  const saveBaseURL = useCallback((baseURL) => {
    setProviderBaseURL(providerId, baseURL);
    setRevision(value => value + 1);
  }, [providerId]);

  const changeImageProvider = useCallback((newIpId) => {
    setImageProviderId(newIpId);
    const nextModel = getSelectedImageModel(newIpId);
    setImageProviderIdState(newIpId);
    setImageModelState(nextModel);
    setRevision(value => value + 1);
  }, []);

  const changeImageModel = useCallback((modelId) => {
    setSelectedImageModel(imageProviderId, modelId);
    setImageModelState(modelId);
    setRevision(value => value + 1);
  }, [imageProviderId]);

  const changeTTSProvider = useCallback((newTTSProviderId) => {
    setTTSProviderId(newTTSProviderId);
    const nextModel = getSelectedTTSModel(newTTSProviderId);
    setTTSProviderIdState(newTTSProviderId);
    setTTSModelState(nextModel);
    setRevision(value => value + 1);
  }, []);

  const changeTTSModel = useCallback((modelId) => {
    setSelectedTTSModel(ttsProviderId, modelId);
    setTTSModelState(modelId);
    if (modelId === 'dots-tts-mlx') {
      setTTSLocalAdapter('openai-audio');
      const currentURL = getTTSLocalBaseURL();
      if (!currentURL || currentURL === 'http://127.0.0.1:7860') {
        setTTSLocalBaseURL('http://localhost:8091');
      }
    }
    setRevision(value => value + 1);
  }, [ttsProviderId]);

  const saveTTSLocalBaseURL = useCallback((baseURL) => {
    setTTSLocalBaseURL(baseURL);
    setRevision(value => value + 1);
  }, []);

  const saveTTSLocalAdapter = useCallback((adapter) => {
    setTTSLocalAdapter(adapter);
    setRevision(value => value + 1);
  }, []);

  const saveTTSLocalLanguage = useCallback((language) => {
    setTTSLocalLanguage(language);
    setRevision(value => value + 1);
  }, []);

  const saveTTSLocalStyle = useCallback((style) => {
    setTTSLocalStyle(style);
    setRevision(value => value + 1);
  }, []);

  const value = useMemo(() => ({
    providerId,
    selectedModel,
    provider,
    allProviders: PROVIDER_DEFINITIONS,
    changeProvider,
    changeModel,
    setApiKey: saveApiKey,
    clearApiKey,
    setBaseURL: saveBaseURL,
    keyStatus: maskApiKey(provider.apiKey),
    getDefaultModel: (id = providerId) => getSelectedModel(id),
    imageProviderId,
    imageModel,
    changeImageProvider,
    changeImageModel,
    ttsProviderId,
    ttsModel,
    changeTTSProvider,
    changeTTSModel,
    setTTSBaseURL: saveTTSLocalBaseURL,
    setTTSAdapter: saveTTSLocalAdapter,
    setTTSLanguage: saveTTSLocalLanguage,
    setTTSStyle: saveTTSLocalStyle
  }), [
    providerId,
    selectedModel,
    provider,
    changeProvider,
    changeModel,
    saveApiKey,
    clearApiKey,
    saveBaseURL,
    imageProviderId,
    imageModel,
    changeImageProvider,
    changeImageModel,
    ttsProviderId,
    ttsModel,
    changeTTSProvider,
    changeTTSModel,
    saveTTSLocalBaseURL,
    saveTTSLocalAdapter,
    saveTTSLocalLanguage,
    saveTTSLocalStyle
  ]);

  return (
    <ProviderContext.Provider value={value}>
      {children}
    </ProviderContext.Provider>
  );
}

export function useProvider() {
  const context = useContext(ProviderContext);
  if (!context) {
    throw new Error('useProvider must be used within a ProviderProvider');
  }
  return context;
}

export default ProviderContext;
