import {
  DEFAULT_PROVIDER,
  DEFAULT_IMAGE_PROVIDER,
  IMAGE_PROVIDER_DEFINITIONS,
  PROVIDER_DEFINITIONS
} from './config/providers';

export * from './config/providers';

const defaultProvider = PROVIDER_DEFINITIONS[DEFAULT_PROVIDER];
const defaultImageProvider = IMAGE_PROVIDER_DEFINITIONS[DEFAULT_IMAGE_PROVIDER];

// Backward-compatible model exports for older modules during the refactor.
export const MODELS = { ...defaultProvider.models };
export const IMAGE_MODELS = { ...defaultImageProvider.imageModels };
