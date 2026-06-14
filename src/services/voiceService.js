import {
  getSelectedTTSModel,
  getTTSProviderConfig,
  setSelectedTTSModel,
  setTTSProviderId
} from './providerService';

const DEEPINFRA_KOKORO_MODEL = 'hexgrad/Kokoro-82M';
const DEEPINFRA_ZONOS_MODEL = 'Zyphra/Zonos-v0.1-hybrid';

function joinUrl(baseURL, path) {
  return `${String(baseURL || '').replace(/\/+$/, '')}/${String(path || '').replace(/^\/+/, '')}`;
}

function isKokoroVoice(voiceId) {
  return /^(af|am|bf|bm)_/.test(voiceId || '');
}

function modelLooksLikeKokoro(model) {
  return String(model || '').toLowerCase().includes('kokoro');
}

function getDefaultVoice(config) {
  const modelVoices = (config.voices || []).filter((voice) => !voice.model || voice.model === config.model);
  return modelVoices[0]?.id || config.voices?.[0]?.id || 'default';
}

function getVoicesForConfig(config = getTTSProviderConfig()) {
  const voices = config.voices || [];
  const matching = voices.filter((voice) => !voice.model || voice.model === config.model);
  return matching.length > 0 ? matching : voices;
}

function createObjectURLFromBase64(base64Data, mimeType = 'audio/mpeg') {
  const cleaned = base64Data.includes('base64,')
    ? base64Data.split('base64,')[1]
    : base64Data;
  const byteCharacters = atob(cleaned);
  const byteNumbers = new Array(byteCharacters.length);

  for (let i = 0; i < byteCharacters.length; i += 1) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }

  return URL.createObjectURL(new Blob([new Uint8Array(byteNumbers)], { type: mimeType }));
}

function normalizeAudioValue(value, baseURL = '') {
  if (!value) return null;

  if (value instanceof Blob) {
    return URL.createObjectURL(value);
  }

  if (typeof value === 'string') {
    if (value.startsWith('blob:') || value.startsWith('data:audio/')) return value;
    if (/^https?:\/\//.test(value)) return value;
    if (/^[A-Za-z0-9+/=]+$/.test(value) && value.length > 100) {
      return createObjectURLFromBase64(value);
    }
    if (baseURL && (value.startsWith('/') || value.includes('/'))) {
      const filePath = value.startsWith('/') ? value : `/${value}`;
      return joinUrl(baseURL, `file=${filePath}`);
    }
  }

  if (typeof value === 'object') {
    return normalizeAudioValue(
      value.url || value.audio_url || value.audio || value.path || value.name,
      baseURL
    );
  }

  return null;
}

async function responseToAudioURL(response, baseURL = '') {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.startsWith('audio/')) {
    return URL.createObjectURL(await response.blob());
  }

  const data = await response.json();
  const direct = normalizeAudioValue(
    data.audio || data.audio_url || data.url || data.output || data.result,
    baseURL
  );
  if (direct) return direct;

  if (Array.isArray(data.data)) {
    for (const item of data.data) {
      const url = normalizeAudioValue(item, baseURL);
      if (url) return url;
    }
  }

  throw new Error('TTS response did not include playable audio.');
}

async function postJSON(url, body, headers = {}) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`TTS request failed (${response.status}): ${detail || response.statusText}`);
  }

  return response;
}

async function generateDeepInfraSpeech(text, voiceId, config) {
  if (!config.apiKey) {
    throw new Error('Missing DeepInfra API key. Add it once in Settings and it will be reused for TTS.');
  }

  const model = config.model || (isKokoroVoice(voiceId) ? DEEPINFRA_KOKORO_MODEL : DEEPINFRA_ZONOS_MODEL);
  const useKokoro = modelLooksLikeKokoro(model) || isKokoroVoice(voiceId);
  const resolvedVoice = voiceId || (useKokoro ? 'af_bella' : 'american_female');
  const endpoint = joinUrl(config.baseURL, model);
  const requestData = useKokoro
    ? {
        text,
        preset_voice: [resolvedVoice],
        output_format: 'mp3'
      }
    : {
        text,
        preset_voice: resolvedVoice,
        language: 'en-us',
        output_format: 'mp3'
      };

  const response = await postJSON(endpoint, requestData, {
    Authorization: `Bearer ${config.apiKey}`
  });
  return responseToAudioURL(response, config.baseURL);
}

async function generateOpenAIAudioSpeech(text, voiceId, config) {
  const response = await postJSON(joinUrl(config.baseURL, '/v1/audio/speech'), {
    model: config.model || 'tts-1',
    input: text,
    voice: voiceId || 'alloy',
    response_format: 'mp3'
  }, config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {});

  return responseToAudioURL(response, config.baseURL);
}

async function generateGenericJSONSpeech(text, voiceId, config) {
  const response = await postJSON(joinUrl(config.baseURL, '/tts'), {
    text,
    input: text,
    voice: voiceId,
    voice_id: voiceId,
    model: config.model
  }, config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {});

  return responseToAudioURL(response, config.baseURL);
}

function parseServerSentData(text) {
  const events = text
    .split('\n')
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trim())
    .filter((line) => line && line !== '[DONE]');

  for (let i = events.length - 1; i >= 0; i -= 1) {
    try {
      return JSON.parse(events[i]);
    } catch (error) {
      // Keep scanning earlier events.
    }
  }

  throw new Error('Gradio TTS call completed without JSON output.');
}

async function generateGradioQwen3Speech(text, voiceId, config) {
  const payload = {
    data: [
      text,
      config.language || 'English',
      voiceId || 'Ryan',
      config.style || '',
      config.model || '1.7B 8-bit'
    ]
  };

  const modernEndpoints = [
    joinUrl(config.baseURL, '/gradio_api/call/generate'),
    joinUrl(config.baseURL, '/call/generate')
  ];

  for (const endpoint of modernEndpoints) {
    try {
      const response = await postJSON(endpoint, payload);
      const data = await response.json();
      if (!data.event_id) continue;

      const eventResponse = await fetch(joinUrl(endpoint, data.event_id));
      if (!eventResponse.ok) continue;
      const eventData = parseServerSentData(await eventResponse.text());
      const audioURL = normalizeAudioValue(eventData.data?.[0] || eventData.output, config.baseURL);
      if (audioURL) return audioURL;
    } catch (error) {
      console.warn(`Qwen3 Gradio endpoint failed: ${endpoint}`, error);
    }
  }

  const legacyResponse = await postJSON(joinUrl(config.baseURL, '/run/predict'), {
    fn_index: 0,
    ...payload
  });
  return responseToAudioURL(legacyResponse, config.baseURL);
}

async function generateLocalSpeech(text, voiceId, config) {
  switch (config.adapter) {
    case 'openai-audio':
      return generateOpenAIAudioSpeech(text, voiceId, config);
    case 'generic-json':
      return generateGenericJSONSpeech(text, voiceId, config);
    case 'deepinfra-compatible':
      return generateDeepInfraSpeech(text, voiceId, {
        ...config,
        apiKey: config.apiKey || 'local'
      });
    case 'gradio-qwen3':
    default:
      return generateGradioQwen3Speech(text, voiceId, config);
  }
}

/**
 * Get current DeepInfra engine compatibility label.
 * @returns {'zonos'|'kokoro'|'local'} Legacy engine string for older callers/tests.
 */
export const getTTSEngine = () => {
  const config = getTTSProviderConfig();
  if (config.providerId === 'local') return 'local';
  return modelLooksLikeKokoro(config.model) ? 'kokoro' : 'zonos';
};

export const setTTSEngine = (engine) => {
  setTTSProviderId('deepinfra');
  setSelectedTTSModel('deepinfra', engine === 'kokoro' ? DEEPINFRA_KOKORO_MODEL : DEEPINFRA_ZONOS_MODEL);
  return engine === 'kokoro' ? 'kokoro' : 'zonos';
};

/**
 * Get available voices based on the selected TTS provider/model.
 * @returns {Promise<Array>} Array of voice objects.
 */
export const getVoices = async () => {
  return getVoicesForConfig().map((voice) => ({
    voice_id: voice.id,
    name: voice.name,
    provider: getTTSProviderConfig().providerId,
    model: voice.model
  }));
};

export const getVoiceOptions = () => {
  return getVoicesForConfig().map((voice) => ({
    id: voice.id,
    name: voice.name,
    model: voice.model
  }));
};

/**
 * Split text into sentences for chunked TTS processing.
 * @param {string} text - Text to split into sentences
 * @returns {Array<string>} Array of text chunks
 */
export const splitTextIntoSentences = (text) => {
  if (!text || typeof text !== 'string') {
    return [];
  }

  const cleanText = text.replace(/\s+/g, ' ').trim();
  if (!cleanText) return [];

  const chunks = [];
  let currentChunk = '';
  const segments = cleanText.split(/(?<=[.!?])\s+/);

  segments.forEach((segment) => {
    const processedSegment = /[.!?]$/.test(segment) ? segment : `${segment}.`;
    if (currentChunk && currentChunk.length + processedSegment.length > 180) {
      chunks.push(currentChunk);
      currentChunk = processedSegment;
    } else {
      currentChunk += `${currentChunk ? ' ' : ''}${processedSegment}`;
    }
  });

  if (currentChunk) chunks.push(currentChunk);
  return chunks;
};

/**
 * Generate TTS audio from text.
 * @param {string} text - Text to convert to speech
 * @param {string} voiceId - Voice ID to use for TTS
 * @returns {Promise<string>} Audio URL
 */
export const generateSpeech = async (text, voiceId) => {
  const config = getTTSProviderConfig();
  const resolvedVoiceId = voiceId || getDefaultVoice(config);
  const clippedText = String(text || '').slice(0, 600);

  if (!clippedText.trim()) {
    return createFallbackAudio();
  }

  try {
    if (config.providerId === 'local') {
      return await generateLocalSpeech(clippedText, resolvedVoiceId, config);
    }

    return await generateDeepInfraSpeech(clippedText, resolvedVoiceId, config);
  } catch (error) {
    window.lastTTSError = error.message || String(error);
    console.error('[TTS] Speech generation failed:', error);
    return createFallbackAudio();
  }
};

/**
 * Generate TTS audio for multiple text chunks.
 * @param {Array<string>} textChunks - Array of text chunks to convert to speech
 * @param {string} voiceId - Voice ID to use for TTS
 * @returns {Promise<Array<string>>} Array of audio URLs
 */
export const generateSpeechChunks = async (textChunks, voiceId) => {
  const chunks = (textChunks || []).filter(Boolean);
  if (chunks.length === 0) return [];

  const urls = [];
  for (const chunk of chunks) {
    urls.push(await generateSpeech(chunk, voiceId));
  }
  return urls;
};

/**
 * Create a fallback audio for demo/development.
 * @returns {Promise<string>} URL to fallback audio blob
 */
export const createFallbackAudio = () => {
  return new Promise((resolve) => {
    const base64Audio = 'UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

    try {
      resolve(createObjectURLFromBase64(base64Audio, 'audio/wav'));
    } catch (error) {
      console.error('Error creating fallback audio:', error);
      resolve(`data:audio/wav;base64,${base64Audio}`);
    }
  });
};
