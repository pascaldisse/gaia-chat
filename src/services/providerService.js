import {
  DEFAULT_PROVIDER,
  PROVIDER_API_KEY_PREFIX,
  PROVIDER_BASE_URL_PREFIX,
  PROVIDER_DEFINITIONS,
  PROVIDER_MODEL_PREFIX,
  PROVIDER_STORAGE_KEY,
  getDefaultImageModel,
  getDefaultModel,
  getProviderDefinition
} from '../config/providers';

function hasStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage);
}

function readStorage(key) {
  if (!hasStorage()) return null;
  return window.localStorage.getItem(key);
}

function writeStorage(key, value) {
  if (!hasStorage()) return;
  window.localStorage.setItem(key, value);
}

function removeStorage(key) {
  if (!hasStorage()) return;
  window.localStorage.removeItem(key);
}

export function getSelectedProviderId() {
  const stored = readStorage(PROVIDER_STORAGE_KEY);
  return PROVIDER_DEFINITIONS[stored] ? stored : DEFAULT_PROVIDER;
}

export function setSelectedProviderId(providerId) {
  if (!PROVIDER_DEFINITIONS[providerId]) {
    throw new Error(`Unknown provider: ${providerId}`);
  }
  writeStorage(PROVIDER_STORAGE_KEY, providerId);
  return providerId;
}

export function getProviderApiKey(providerId = getSelectedProviderId()) {
  return readStorage(PROVIDER_API_KEY_PREFIX + providerId) || '';
}

export function setProviderApiKey(providerId, apiKey) {
  if (!PROVIDER_DEFINITIONS[providerId]) {
    throw new Error(`Unknown provider: ${providerId}`);
  }

  if (apiKey && apiKey.trim()) {
    writeStorage(PROVIDER_API_KEY_PREFIX + providerId, apiKey.trim());
  } else {
    removeStorage(PROVIDER_API_KEY_PREFIX + providerId);
  }
}

export function getSelectedModel(providerId = getSelectedProviderId()) {
  const provider = getProviderDefinition(providerId);
  const stored = readStorage(PROVIDER_MODEL_PREFIX + providerId);
  const supportedModels = new Set(Object.values(provider.models));
  if (supportedModels.has(stored) || (provider.allowCustomModel && stored)) {
    return stored;
  }
  return getDefaultModel(providerId);
}

export function setSelectedModel(providerId, modelId) {
  const provider = getProviderDefinition(providerId);
  const supportedModels = new Set(Object.values(provider.models));
  if (!supportedModels.has(modelId) && !provider.allowCustomModel) {
    throw new Error(`Model ${modelId} is not available for ${provider.name}`);
  }
  writeStorage(PROVIDER_MODEL_PREFIX + providerId, modelId);
  return modelId;
}

export function getProviderBaseURL(providerId = getSelectedProviderId()) {
  const provider = getProviderDefinition(providerId);
  if (!provider.allowCustomBaseURL) {
    return provider.baseURL;
  }
  return readStorage(PROVIDER_BASE_URL_PREFIX + providerId) || provider.baseURL;
}

export function setProviderBaseURL(providerId, baseURL) {
  const provider = getProviderDefinition(providerId);
  if (!provider.allowCustomBaseURL) {
    throw new Error(`${provider.name} does not support custom base URLs`);
  }

  if (baseURL && baseURL.trim()) {
    writeStorage(PROVIDER_BASE_URL_PREFIX + providerId, baseURL.trim().replace(/\/+$/, ''));
  } else {
    removeStorage(PROVIDER_BASE_URL_PREFIX + providerId);
  }
}

export function resolveModelForProvider(preferredModel, providerId = getSelectedProviderId()) {
  const provider = getProviderDefinition(providerId);
  const knownModels = new Set(Object.values(provider.models || {}));

  if (provider.acceptsArbitraryModels && preferredModel) {
    return preferredModel;
  }

  if (knownModels.has(preferredModel)) {
    return preferredModel;
  }

  return getSelectedModel(providerId);
}

export function resolveProvider(providerId = getSelectedProviderId()) {
  const provider = getProviderDefinition(providerId);
  const apiKey = getProviderApiKey(provider.id);
  const selectedModel = getSelectedModel(provider.id);
  const baseURL = getProviderBaseURL(provider.id);
  return {
    ...provider,
    baseURL,
    apiKey,
    selectedModel,
    defaultModel: getDefaultModel(provider.id),
    defaultImageModel: getDefaultImageModel(provider.id),
    hasApiKey: Boolean(apiKey)
  };
}

export function getCurrentProviderConfig() {
  const provider = resolveProvider();
  return {
    providerId: provider.id,
    providerName: provider.name,
    apiType: provider.apiType,
    apiKey: provider.apiKey,
    baseURL: provider.baseURL,
    inferenceBaseURL: provider.inferenceBaseURL,
    model: provider.selectedModel,
    supportsChat: provider.supportsChat,
    supportsImages: provider.supportsImages,
    supportsTTS: provider.supportsTTS,
    requiresApiKey: provider.requiresApiKey,
    acceptsArbitraryModels: provider.acceptsArbitraryModels
  };
}

export function getImageProviderConfig() {
  const deepinfra = resolveProvider('deepinfra');
  return {
    providerId: deepinfra.id,
    providerName: deepinfra.name,
    apiKey: deepinfra.apiKey,
    inferenceBaseURL: deepinfra.inferenceBaseURL,
    imageModel: deepinfra.defaultImageModel,
    supportsImages: deepinfra.supportsImages
  };
}

export function maskApiKey(apiKey) {
  if (!apiKey) return 'Not set';
  if (apiKey.length <= 8) return 'Set';
  return `Set ending in ${apiKey.slice(-4)}`;
}
