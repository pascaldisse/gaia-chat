import API_KEYS from './config.keys.js';
export const API_KEY = API_KEYS.DEEPINFRA_API_KEY;
export const MODELS = {
  LLAMA3_70B: 'meta-llama/Meta-Llama-3-70B-Instruct',
  MIXTRAL_8X22B: 'mistralai/Mixtral-8x22B-Instruct-v0.1',
  DEEPSEEK_V3: 'deepseek-ai/DeepSeek-V3',
  DEEPSEEK_R1: 'deepseek-ai/DeepSeek-R1',
  DBRX: 'databricks/dbrx-instruct'
};

export const IMAGE_MODELS = {
  FLUX_SCHNELL: 'black-forest-labs/FLUX-1-schnell',
  FLUX_DEV: 'black-forest-labs/FLUX-1-dev'
};

