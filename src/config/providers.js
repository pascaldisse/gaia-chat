export const PROVIDER_DEFINITIONS = {
  deepinfra: {
    id: 'deepinfra',
    name: 'DeepInfra',
    apiType: 'openai-compatible',
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
    },
    acceptsArbitraryModels: false,
    allowCustomModel: true,
    allowCustomBaseURL: false,
    requiresApiKey: true
  },

  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek',
    apiType: 'openai-compatible',
    baseURL: 'https://api.deepseek.com',
    inferenceBaseURL: '',
    apiKeyLabel: 'DeepSeek API key',
    docsURL: 'https://platform.deepseek.com/api_keys',
    supportsChat: true,
    supportsImages: false,
    supportsTTS: false,
    models: {
      DEEPSEEK_V4_FLASH: 'deepseek-v4-flash',
      DEEPSEEK_V4_PRO: 'deepseek-v4-pro',
      DEEPSEEK_CHAT: 'deepseek-chat',
      DEEPSEEK_REASONER: 'deepseek-reasoner'
    },
    imageModels: {},
    ttsModels: {},
    acceptsArbitraryModels: false,
    allowCustomModel: true,
    allowCustomBaseURL: false,
    requiresApiKey: true
  },

  openai: {
    id: 'openai',
    name: 'OpenAI',
    apiType: 'openai-compatible',
    baseURL: 'https://api.openai.com/v1',
    inferenceBaseURL: '',
    apiKeyLabel: 'OpenAI API key',
    docsURL: 'https://platform.openai.com/api-keys',
    supportsChat: true,
    supportsImages: false,
    supportsTTS: false,
    models: {
      GPT_5_5: 'gpt-5.5',
      GPT_5_1: 'gpt-5.1',
      GPT_5_1_MINI: 'gpt-5.1-mini',
      GPT_4_1: 'gpt-4.1'
    },
    imageModels: {},
    ttsModels: {},
    acceptsArbitraryModels: false,
    allowCustomModel: true,
    allowCustomBaseURL: false,
    requiresApiKey: true
  },

  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    apiType: 'anthropic',
    baseURL: 'https://api.anthropic.com/v1',
    inferenceBaseURL: '',
    apiKeyLabel: 'Anthropic API key',
    docsURL: 'https://console.anthropic.com/settings/keys',
    supportsChat: true,
    supportsImages: false,
    supportsTTS: false,
    models: {
      CLAUDE_FABLE_5: 'claude-fable-5',
      CLAUDE_OPUS_4_8: 'claude-opus-4-8',
      CLAUDE_SONNET_4_6: 'claude-sonnet-4-6',
      CLAUDE_HAIKU_4_5: 'claude-haiku-4-5'
    },
    imageModels: {},
    ttsModels: {},
    acceptsArbitraryModels: false,
    allowCustomModel: true,
    allowCustomBaseURL: false,
    requiresApiKey: true
  },

  local: {
    id: 'local',
    name: 'Local OpenAI-Compatible',
    apiType: 'openai-compatible',
    baseURL: 'http://localhost:11434/v1',
    inferenceBaseURL: '',
    apiKeyLabel: 'Local API key',
    docsURL: '',
    supportsChat: true,
    supportsImages: false,
    supportsTTS: false,
    models: {
      LLAMA_3_2: 'llama3.2',
      QWEN_2_5: 'qwen2.5',
      MISTRAL: 'mistral'
    },
    imageModels: {},
    ttsModels: {},
    acceptsArbitraryModels: true,
    allowCustomModel: true,
    allowCustomBaseURL: true,
    requiresApiKey: false
  },

  custom: {
    id: 'custom',
    name: 'Custom OpenAI-Compatible',
    apiType: 'openai-compatible',
    baseURL: 'http://localhost:1234/v1',
    inferenceBaseURL: '',
    apiKeyLabel: 'API key',
    docsURL: '',
    supportsChat: true,
    supportsImages: false,
    supportsTTS: false,
    models: {
      CUSTOM_MODEL: 'local-model'
    },
    imageModels: {},
    ttsModels: {},
    acceptsArbitraryModels: true,
    allowCustomModel: true,
    allowCustomBaseURL: true,
    requiresApiKey: false
  }
};

export const DEFAULT_PROVIDER = 'deepinfra';
export const PROVIDER_STORAGE_KEY = 'gaia_selected_provider';
export const PROVIDER_API_KEY_PREFIX = 'gaia_provider_apikey_';
export const PROVIDER_MODEL_PREFIX = 'gaia_provider_model_';
export const PROVIDER_BASE_URL_PREFIX = 'gaia_provider_base_url_';

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
