import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { PROVIDER_DEFINITIONS } from '../config/providers';
import {
  getSelectedModel,
  getSelectedProviderId,
  maskApiKey,
  resolveProvider,
  setProviderApiKey,
  setSelectedModel,
  setSelectedProviderId
} from '../services/providerService';

const ProviderContext = createContext(null);

export function ProviderProvider({ children }) {
  const [providerId, setProviderIdState] = useState(getSelectedProviderId);
  const [selectedModel, setSelectedModelState] = useState(() => getSelectedModel(providerId));
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

  const value = useMemo(() => ({
    providerId,
    selectedModel,
    provider,
    allProviders: PROVIDER_DEFINITIONS,
    changeProvider,
    changeModel,
    setApiKey: saveApiKey,
    clearApiKey,
    keyStatus: maskApiKey(provider.apiKey),
    getDefaultModel: (id = providerId) => getSelectedModel(id)
  }), [
    providerId,
    selectedModel,
    provider,
    changeProvider,
    changeModel,
    saveApiKey,
    clearApiKey
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
