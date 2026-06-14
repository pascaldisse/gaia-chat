export const PROVIDER_DEFINITIONS = {
  deepinfra: {
    id: 'deepinfra',
    name: 'DeepInfra',
    baseURL: 'https://api.deepinfra.com/v1/openai',
    inferenceBaseURL: 'https://api.deepinfra.com/v1/inference',
    apiKeyLabel: 'DeepInfra API key',
    docsURL: 'https://deepinfra.com/dash/api_keys',
    supportsChat: true,
    supportsImages: true,
    supportsTTS: true,
    models: {
      LLAMA3_70B: 'meta-llama/Meta-Llama-3-70B-Instruct',
      MIXTRAL_8X22B: 'mistralai/Mixtral-8x22B-Instruct-v0.1',
      DEEPSEEK_V3: 'deepseek-ai/DeepSeek-V3',
      DEEPSEEK_R1: 'deepseek-ai/DeepSeek-R1',
      DBRX: 'databricks/dbrx-instruct'
    },
    imageModels: {
      FLUX_SCHNELL: 'black-forest-labs/FLUX-1-schnell',
      FLUX_DEV: 'black-forest-labs/FLUX-1-dev'
    },
    ttsModels: {
      ZONOS: 'Zyphra/Zonos-v0.1-hybrid',
      KOKORO: 'hexgrad/Kokoro-82M'
    }
  },

  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek',
    baseURL: 'https://api.deepseek.com/v1',
    inferenceBaseURL: '',
    apiKeyLabel: 'DeepSeek API key',
    docsURL: 'https://platform.deepseek.com/api_keys',
    supportsChat: true,
    supportsImages: false,
    supportsTTS: false,
    models: {
      DEEPSEEK_CHAT: 'deepseek-chat',
      DEEPSEEK_REASONER: 'deepseek-reasoner'
    },
    imageModels: {},
    ttsModels: {}
  },

  openai: {
    id: 'openai',
    name: 'OpenAI',
    baseURL: 'https://api.openai.com/v1',
    inferenceBaseURL: '',
    apiKeyLabel: 'OpenAI API key',
    docsURL: 'https://platform.openai.com/api-keys',
    supportsChat: true,
    supportsImages: false,
    supportsTTS: false,
    models: {
      GPT_4_1: 'gpt-4.1',
      GPT_4_1_MINI: 'gpt-4.1-mini',
      GPT_4O: 'gpt-4o'
    },
    imageModels: {},
    ttsModels: {}
  }
};

export const DEFAULT_PROVIDER = 'deepinfra';
export const PROVIDER_STORAGE_KEY = 'gaia_selected_provider';
export const PROVIDER_API_KEY_PREFIX = 'gaia_provider_apikey_';
export const PROVIDER_MODEL_PREFIX = 'gaia_provider_model_';

export function getProviderDefinition(providerId = DEFAULT_PROVIDER) {
  return PROVIDER_DEFINITIONS[providerId] || PROVIDER_DEFINITIONS[DEFAULT_PROVIDER];
}

export function getDefaultModel(providerId = DEFAULT_PROVIDER) {
  const provider = getProviderDefinition(providerId);
  return Object.values(provider.models)[0] || '';
}

export function getDefaultImageModel(providerId = DEFAULT_PROVIDER) {
  const provider = getProviderDefinition(providerId);
  return Object.values(provider.imageModels || {})[0] || '';
}

export function getProviderModelOptions(providerId = DEFAULT_PROVIDER) {
  const provider = getProviderDefinition(providerId);
  return Object.entries(provider.models).map(([label, id]) => ({
    label,
    id
  }));
}

export function getProviderImageModelOptions(providerId = DEFAULT_PROVIDER) {
  const provider = getProviderDefinition(providerId);
  return Object.entries(provider.imageModels || {}).map(([label, id]) => ({
    label,
    id
  }));
}
