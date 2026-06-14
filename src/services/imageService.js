import { getImageProviderConfig } from './providerService';

/**
 * Fetch a URL and convert its body to a base64 data URI.
 * Used for BFL delivery URLs (short-lived signed URLs).
 */
async function urlToBase64(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image from delivery URL (${response.status})`);
  }
  const blob = await response.blob();
  const mime = blob.type || 'image/png';
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return { dataUri: `data:${mime};base64,${base64}`, base64, mime };
}

/**
 * Generate an image using the configured image provider.
 *
 * @param {Object}  params
 * @param {string}  params.prompt
 * @param {string}  [params.negativePrompt]
 * @param {number}  [params.width=1024]
 * @param {number}  [params.height=1024]
 * @param {number}  [params.steps]
 * @param {number}  [params.guidanceScale]
 * @param {string}  [params.model]       - Override the configured model
 * @returns {Promise<{dataUri: string, base64: string, mime: string}>}
 */
export async function generateImage({
  prompt,
  negativePrompt,
  width = 1024,
  height = 1024,
  steps,
  guidanceScale,
  model
}) {
  const config = getImageProviderConfig();

  // Validate model belongs to this provider; fall back to the configured default
  const validModels = new Set(Object.values(config.imageModels || {}));
  let resolvedModel = model;
  if (!resolvedModel || !validModels.has(resolvedModel)) {
    resolvedModel = config.model;
  }

  const apiKey = config.apiKey;
  // Normalise baseURL to never end with / so concatenation never double-slashes
  const baseURL = String(config.baseURL || '').replace(/\/+$/, '');
  const patchedConfig = { ...config, baseURL };

  if (patchedConfig.apiType === 'deepinfra-inference') {
    return deepinfraGenerate({ config: patchedConfig, resolvedModel, prompt, negativePrompt, width, height, steps, guidanceScale, apiKey });
  }

  if (patchedConfig.apiType === 'openai-images') {
    return openaiGenerate({ config: patchedConfig, resolvedModel, prompt, width, height, apiKey });
  }

  if (patchedConfig.apiType === 'bfl') {
    return bflGenerate({ config: patchedConfig, resolvedModel, prompt, width, height, apiKey });
  }

  throw new Error(`Unknown image API type: ${patchedConfig.apiType}`);
}

/* ---- DeepInfra inference ---- */
async function deepinfraGenerate({ config, resolvedModel, prompt, negativePrompt, width, height, steps, guidanceScale, apiKey }) {
  if (!apiKey) {
    throw new Error('Missing DeepInfra API key. Configure it in Settings → Provider.');
  }

  const body = {
    prompt,
    negative_prompt: negativePrompt || '',
    width,
    height,
    num_inference_steps: steps || 30,
    guidance_scale: guidanceScale || 7.5
  };

  const response = await fetch(`${config.baseURL}/${resolvedModel}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`DeepInfra API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  if (!data.images?.[0]) {
    throw new Error('DeepInfra: no image data returned');
  }

  let raw = data.images[0];
  // strip any data: prefix if present
  if (raw.startsWith('data:image/')) {
    const comma = raw.indexOf(',');
    const mime = raw.slice(5, comma);
    const base64 = raw.slice(comma + 1);
    return { dataUri: raw, base64, mime };
  }

  return { dataUri: `data:image/png;base64,${raw}`, base64: raw, mime: 'image/png' };
}

/* ---- OpenAI images ---- */
async function openaiGenerate({ config, resolvedModel, prompt, width, height, apiKey }) {
  if (!apiKey) {
    throw new Error('Missing OpenAI API key. Configure it in Settings → Provider (LLM section).');
  }

  const body = {
    model: resolvedModel,
    prompt,
    n: 1,
    size: `${width}x${height}`
  };

  // dall-e-3 requires explicit b64_json response format
  if (resolvedModel === 'dall-e-3') {
    body.response_format = 'b64_json';
  }
  // gpt-image-1 returns b64_json by default and rejects the param

  const response = await fetch(`${config.baseURL}/images/generations`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI Images API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const item = data.data?.[0];
  if (!item) {
    throw new Error('OpenAI: no image data returned');
  }

  if (item.b64_json) {
    return { dataUri: `data:image/png;base64,${item.b64_json}`, base64: item.b64_json, mime: 'image/png' };
  }

  if (item.url) {
    // Some models may return a URL instead of b64
    return urlToBase64(item.url);
  }

  throw new Error('OpenAI: response contained no b64_json or url');
}

/* ---- BFL (Flux / Local BFL-compatible) ---- */
async function bflGenerate({ config, resolvedModel, prompt, width, height, apiKey }) {
  // 1. Submit
  const headers = {
    'Content-Type': 'application/json',
    accept: 'application/json'
  };
  if (apiKey) {
    headers['x-key'] = apiKey;
  }

  const submitBody = { prompt, width, height };

  const submitRes = await fetch(`${config.baseURL}/v1/${resolvedModel}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(submitBody)
  });

  if (!submitRes.ok) {
    const errText = await submitRes.text();
    throw new Error(`BFL submit error (${submitRes.status}): ${errText}`);
  }

  const submitData = await submitRes.json();
  const taskId = submitData.id;
  const pollingUrl = submitData.polling_url || `${config.baseURL}/v1/get_result?id=${taskId}`;

  if (!taskId) {
    throw new Error('BFL: no task id returned from submit');
  }

  // 2. Poll — local models (e.g. FLUX.2 on Apple Silicon) can take a while, so
  // allow up to ~3 min. Fast hosted providers return early; this only raises the ceiling.
  const POLL_INTERVAL = 1500;
  const MAX_ATTEMPTS = 120; // 120 * 1.5s = 180s

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    await new Promise(r => setTimeout(r, POLL_INTERVAL));

    const pollHeaders = { accept: 'application/json' };
    if (apiKey) {
      pollHeaders['x-key'] = apiKey;
    }

    const pollRes = await fetch(pollingUrl, { headers: pollHeaders });

    if (!pollRes.ok) {
      const errText = await pollRes.text();
      throw new Error(`BFL poll error (${pollRes.status}): ${errText}`);
    }

    const result = await pollRes.json();

    // Normalize status (some APIs use different casing)
    const status = (result.status || '').toString();

    if (status === 'Ready') {
      // Try to extract the image
      const sample = result.result?.sample
        || result.result?.sample_url
        || result.sample
        || result.sample_url;

      // If result.result is a base64 string directly
      if (typeof result.result === 'string' && result.result.startsWith('data:image/')) {
        return urlToBase64(result.result);
      }
      if (typeof result.result === 'string' && /^[A-Za-z0-9+/=]+$/.test(result.result)) {
        return { dataUri: `data:image/png;base64,${result.result}`, base64: result.result, mime: 'image/png' };
      }

      if (sample) {
        return urlToBase64(sample);
      }

      // defensive: look for first string value in result.result that looks like a URL
      if (result.result && typeof result.result === 'object') {
        for (const val of Object.values(result.result)) {
          if (typeof val === 'string' && (val.startsWith('http://') || val.startsWith('https://'))) {
            return urlToBase64(val);
          }
        }
      }

      throw new Error('BFL: status Ready but no sample URL or base64 found in result');
    }

    if (status === 'Error' || status === 'Request Moderated' || status === 'Content Moderated' || status === 'Task not found') {
      const detail = result.details || result.message || status;
      throw new Error(`BFL generation failed: ${detail}`);
    }

    // Pending / Processing / null — keep polling
    if (status !== 'Pending' && status !== 'Processing' && status !== '') {
      console.warn(`BFL: unknown status "${status}", continuing to poll...`);
    }
  }

  throw new Error(`Image generation timed out after ${(MAX_ATTEMPTS * POLL_INTERVAL) / 1000} seconds`);
}
