import {
  DEFAULT_PROVIDER,
  PROVIDER_DEFINITIONS
} from './config/providers';

export * from './config/providers';

const defaultProvider = PROVIDER_DEFINITIONS[DEFAULT_PROVIDER];

// Backward-compatible model exports for older modules during the refactor.
export const MODELS = { ...defaultProvider.models };
export const IMAGE_MODELS = { ...defaultProvider.imageModels };
