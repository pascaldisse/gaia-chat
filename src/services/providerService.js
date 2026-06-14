import {
  DEFAULT_IMAGE_PROVIDER,
  DEFAULT_TTS_PROVIDER,
  DEFAULT_PROVIDER,
  IMAGE_LOCAL_BASE_URL_KEY,
  IMAGE_PROVIDER_DEFINITIONS,
  IMAGE_PROVIDER_MODEL_PREFIX,
  IMAGE_PROVIDER_STORAGE_KEY,
  PROVIDER_API_KEY_PREFIX,
  PROVIDER_BASE_URL_PREFIX,
  PROVIDER_DEFINITIONS,
  PROVIDER_MODEL_PREFIX,
  PROVIDER_STORAGE_KEY,
  TTS_LOCAL_ADAPTER_KEY,
  TTS_LOCAL_BASE_URL_KEY,
  TTS_LOCAL_LANGUAGE_KEY,
  TTS_LOCAL_STYLE_KEY,
  TTS_PROVIDER_DEFINITIONS,
  TTS_PROVIDER_MODEL_PREFIX,
  TTS_PROVIDER_STORAGE_KEY,
  getDefaultImageModel,
  getDefaultModel,
  getImageProviderDefinition,
  getProviderDefinition,
  getTTSProviderDefinition
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

/* ---- Image provider helpers ---- */

export function getImageProviderId() {
  const stored = readStorage(IMAGE_PROVIDER_STORAGE_KEY);
  return IMAGE_PROVIDER_DEFINITIONS[stored] ? stored : DEFAULT_IMAGE_PROVIDER;
}

export function setImageProviderId(id) {
  if (!IMAGE_PROVIDER_DEFINITIONS[id]) {
    throw new Error(`Unknown image provider: ${id}`);
  }
  writeStorage(IMAGE_PROVIDER_STORAGE_KEY, id);
  return id;
}

export function getSelectedImageModel(imageProviderId = getImageProviderId()) {
  const ip = getImageProviderDefinition(imageProviderId);
  const stored = readStorage(IMAGE_PROVIDER_MODEL_PREFIX + imageProviderId);
  const supported = new Set(Object.values(ip.imageModels || {}));
  if (supported.has(stored)) return stored;
  return ip.defaultModel;
}

export function setSelectedImageModel(imageProviderId, model) {
  const ip = getImageProviderDefinition(imageProviderId);
  const supported = new Set(Object.values(ip.imageModels || {}));
  if (!supported.has(model)) {
    throw new Error(`Model ${model} is not available for ${ip.name}`);
  }
  writeStorage(IMAGE_PROVIDER_MODEL_PREFIX + imageProviderId, model);
  return model;
}

export function getImageLocalBaseURL() {
  return readStorage(IMAGE_LOCAL_BASE_URL_KEY) || 'http://localhost:8080';
}

export function setImageLocalBaseURL(url) {
  if (url && url.trim()) {
    writeStorage(IMAGE_LOCAL_BASE_URL_KEY, url.trim().replace(/\/+$/, ''));
  } else {
    removeStorage(IMAGE_LOCAL_BASE_URL_KEY);
  }
}

export function getImageProviderConfig() {
  const imageProviderId = getImageProviderId();
  const ip = getImageProviderDefinition(imageProviderId);
  const model = getSelectedImageModel(imageProviderId);

  // Resolve API key from the provider's apiKeyStorageKey
  const apiKey = readStorage(ip.apiKeyStorageKey) || '';

  let baseURL = ip.baseURL;
  if (ip.needsBaseUrlInput) {
    baseURL = getImageLocalBaseURL();
  }

  return {
    providerId: ip.id,
    providerName: ip.name,
    apiType: ip.apiType,
    baseURL,
    apiKey,
    model,
    needsBaseUrlInput: Boolean(ip.needsBaseUrlInput),
    imageModels: ip.imageModels
  };
}

/* ---- TTS provider helpers ---- */

function migrateLegacyTTSEngine() {
  const legacyEngine = readStorage('tts_engine');
  if (!legacyEngine) return;

  writeStorage(TTS_PROVIDER_STORAGE_KEY, 'deepinfra');
  const legacyModel = legacyEngine === 'kokoro'
    ? 'hexgrad/Kokoro-82M'
    : 'Zyphra/Zonos-v0.1-hybrid';
  writeStorage(TTS_PROVIDER_MODEL_PREFIX + 'deepinfra', legacyModel);
  removeStorage('tts_engine');
}

export function getTTSProviderId() {
  migrateLegacyTTSEngine();
  const stored = readStorage(TTS_PROVIDER_STORAGE_KEY);
  return TTS_PROVIDER_DEFINITIONS[stored] ? stored : DEFAULT_TTS_PROVIDER;
}

export function setTTSProviderId(id) {
  if (!TTS_PROVIDER_DEFINITIONS[id]) {
    throw new Error(`Unknown TTS provider: ${id}`);
  }
  writeStorage(TTS_PROVIDER_STORAGE_KEY, id);
  return id;
}

export function getSelectedTTSModel(ttsProviderId = getTTSProviderId()) {
  const provider = getTTSProviderDefinition(ttsProviderId);
  const stored = readStorage(TTS_PROVIDER_MODEL_PREFIX + ttsProviderId);
  const supported = new Set(Object.values(provider.ttsModels || {}));
  if (supported.has(stored)) return stored;
  return provider.defaultModel || Object.values(provider.ttsModels || {})[0] || '';
}

export function setSelectedTTSModel(ttsProviderId, model) {
  const provider = getTTSProviderDefinition(ttsProviderId);
  const supported = new Set(Object.values(provider.ttsModels || {}));
  if (!supported.has(model)) {
    throw new Error(`TTS model ${model} is not available for ${provider.name}`);
  }
  writeStorage(TTS_PROVIDER_MODEL_PREFIX + ttsProviderId, model);
  return model;
}

export function getTTSLocalBaseURL() {
  return readStorage(TTS_LOCAL_BASE_URL_KEY) || getTTSProviderDefinition('local').baseURL;
}

export function setTTSLocalBaseURL(url) {
  if (url && url.trim()) {
    writeStorage(TTS_LOCAL_BASE_URL_KEY, url.trim().replace(/\/+$/, ''));
  } else {
    removeStorage(TTS_LOCAL_BASE_URL_KEY);
  }
}

export function getTTSLocalAdapter() {
  const provider = getTTSProviderDefinition('local');
  const stored = readStorage(TTS_LOCAL_ADAPTER_KEY);
  return Object.values(provider.adapters || {}).includes(stored) ? stored : provider.defaultAdapter;
}

export function setTTSLocalAdapter(adapter) {
  const provider = getTTSProviderDefinition('local');
  if (!Object.values(provider.adapters || {}).includes(adapter)) {
    throw new Error(`Unknown local TTS adapter: ${adapter}`);
  }
  writeStorage(TTS_LOCAL_ADAPTER_KEY, adapter);
  return adapter;
}

export function getTTSLocalLanguage() {
  return readStorage(TTS_LOCAL_LANGUAGE_KEY) || 'English';
}

export function setTTSLocalLanguage(language) {
  if (language && language.trim()) {
    writeStorage(TTS_LOCAL_LANGUAGE_KEY, language.trim());
  } else {
    removeStorage(TTS_LOCAL_LANGUAGE_KEY);
  }
}

export function getTTSLocalStyle() {
  return readStorage(TTS_LOCAL_STYLE_KEY) || '';
}

export function setTTSLocalStyle(style) {
  if (style && style.trim()) {
    writeStorage(TTS_LOCAL_STYLE_KEY, style.trim());
  } else {
    removeStorage(TTS_LOCAL_STYLE_KEY);
  }
}

export function getTTSProviderConfig() {
  const ttsProviderId = getTTSProviderId();
  const provider = getTTSProviderDefinition(ttsProviderId);
  const model = getSelectedTTSModel(ttsProviderId);
  const apiKey = readStorage(provider.apiKeyStorageKey) || '';

  let baseURL = provider.baseURL;
  let adapter = provider.defaultAdapter;
  let language = 'English';
  let style = '';

  if (provider.needsBaseUrlInput) {
    baseURL = getTTSLocalBaseURL();
    adapter = getTTSLocalAdapter();
    language = getTTSLocalLanguage();
    style = getTTSLocalStyle();
  }

  return {
    providerId: provider.id,
    providerName: provider.name,
    apiType: provider.apiType,
    baseURL,
    apiKey,
    model,
    adapter,
    language,
    style,
    ttsModels: provider.ttsModels || {},
    voices: provider.voices || [],
    needsBaseUrlInput: Boolean(provider.needsBaseUrlInput)
  };
}

export function maskApiKey(apiKey) {
  if (!apiKey) return 'Not set';
  if (apiKey.length <= 8) return 'Set';
  return `Set ending in ${apiKey.slice(-4)}`;
}
