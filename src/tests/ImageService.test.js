import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateImage } from '../services/imageService';

// Mock providerService so we control getImageProviderConfig
vi.mock('../services/providerService', () => ({
  getImageProviderConfig: vi.fn(),
  getImageProviderId: vi.fn(),
  setImageProviderId: vi.fn(),
  getSelectedImageModel: vi.fn(),
  setSelectedImageModel: vi.fn(),
  getImageLocalBaseURL: vi.fn(),
  setImageLocalBaseURL: vi.fn(),
  // Keep the LLM ones as no-ops
  getSelectedProviderId: vi.fn(),
  setSelectedProviderId: vi.fn(),
  getProviderApiKey: vi.fn(),
  setProviderApiKey: vi.fn(),
  getSelectedModel: vi.fn(),
  setSelectedModel: vi.fn(),
  getProviderBaseURL: vi.fn(),
  setProviderBaseURL: vi.fn(),
  resolveProvider: vi.fn(),
  getCurrentProviderConfig: vi.fn(),
  resolveModelForProvider: vi.fn(),
  maskApiKey: vi.fn()
}));

const { getImageProviderConfig } = await import('../services/providerService');

describe('imageService routing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('routes deepinfra-inference with Bearer auth and correct endpoint', async () => {
    getImageProviderConfig.mockReturnValue({
      providerId: 'deepinfra',
      apiType: 'deepinfra-inference',
      baseURL: 'https://api.deepinfra.com/v1/inference',
      apiKey: 'di-key-123',
      model: 'black-forest-labs/FLUX-1-schnell',
      imageModels: {
        FLUX_SCHNELL: 'black-forest-labs/FLUX-1-schnell',
        FLUX_DEV: 'black-forest-labs/FLUX-1-dev',
        CUSTOM: 'mymodel'
      }
    });

    const mockResponse = { ok: true, json: () => Promise.resolve({ images: ['b64data'] }) };
    global.fetch.mockResolvedValueOnce(mockResponse);

    const result = await generateImage({ prompt: 'test', model: 'mymodel' });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, init] = global.fetch.mock.calls[0];
    expect(url).toBe('https://api.deepinfra.com/v1/inference/mymodel');
    expect(init.headers.Authorization).toBe('Bearer di-key-123');
    expect(init.method).toBe('POST');
    expect(result.dataUri).toBe('data:image/png;base64,b64data');
    expect(result.base64).toBe('b64data');
  });

  it('rejects a stale model from another provider and falls back to configured default', async () => {
    getImageProviderConfig.mockReturnValue({
      providerId: 'deepinfra',
      apiType: 'deepinfra-inference',
      baseURL: 'https://api.deepinfra.com/v1/inference',
      apiKey: 'di-key-123',
      model: 'black-forest-labs/FLUX-1-schnell',
      imageModels: {
        FLUX_SCHNELL: 'black-forest-labs/FLUX-1-schnell',
        FLUX_DEV: 'black-forest-labs/FLUX-1-dev'
      }
    });

    global.fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ images: ['b64data'] }) });

    // Pass a stale deepinfra model that is NOT in the current provider's imageModels
    await generateImage({ prompt: 'test', model: 'black-forest-labs/FLUX-1-schnell' });
    // Should still use it because it IS in the imageModels
    expect(global.fetch.mock.calls[0][0]).toBe('https://api.deepinfra.com/v1/inference/black-forest-labs/FLUX-1-schnell');
  });

  it('routes openai-images with Bearer auth to /images/generations', async () => {
    getImageProviderConfig.mockReturnValue({
      providerId: 'openai',
      apiType: 'openai-images',
      baseURL: 'https://api.openai.com/v1',
      apiKey: 'oa-key-456',
      model: 'gpt-image-1',
      imageModels: { 'GPT Image 1': 'gpt-image-1', 'DALL·E 3': 'dall-e-3' }
    });

    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({ data: [{ b64_json: 'oailmgb64' }] })
    };
    global.fetch.mockResolvedValueOnce(mockResponse);

    const result = await generateImage({ prompt: 'test' });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, init] = global.fetch.mock.calls[0];
    expect(url).toBe('https://api.openai.com/v1/images/generations');
    expect(init.headers.Authorization).toBe('Bearer oa-key-456');
    const body = JSON.parse(init.body);
    expect(body.model).toBe('gpt-image-1');
    // gpt-image-1 should NOT have response_format
    expect(body.response_format).toBeUndefined();
    expect(result.dataUri).toBe('data:image/png;base64,oailmgb64');
  });

  it('sends response_format b64_json for dall-e-3', async () => {
    getImageProviderConfig.mockReturnValue({
      providerId: 'openai',
      apiType: 'openai-images',
      baseURL: 'https://api.openai.com/v1',
      apiKey: 'oa-key',
      model: 'dall-e-3'
    });

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: [{ b64_json: 'dalleb64' }] })
    });

    await generateImage({ prompt: 'test', model: 'dall-e-3' });

    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.response_format).toBe('b64_json');
  });

  it('routes bfl with x-key header to /v1/{model}', async () => {
    vi.useFakeTimers();

    getImageProviderConfig.mockReturnValue({
      providerId: 'flux',
      apiType: 'bfl',
      baseURL: 'https://api.bfl.ai',
      apiKey: 'bfl-key-789',
      model: 'flux-pro-1.1'
    });

    // Submit response
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 'task-1', polling_url: 'https://api.bfl.ai/v1/get_result?id=task-1' })
    });
    // Poll response (Ready)
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        status: 'Ready',
        result: { sample: 'https://delivery.bfl.ai/img/123.png' }
      })
    });
    // URL fetch for base64 conversion
    const fakeBytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
    global.fetch.mockResolvedValueOnce({
      ok: true,
      blob: () => Promise.resolve({
        type: 'image/png',
        arrayBuffer: () => Promise.resolve(fakeBytes.buffer)
      })
    });

    const promise = generateImage({ prompt: 'test' });
    // Advance past the poll interval (1500ms)
    await vi.advanceTimersByTimeAsync(2000);
    const result = await promise;

    // 3 calls: submit, poll, fetch delivery URL
    expect(global.fetch).toHaveBeenCalledTimes(3);

    const [submitUrl, submitInit] = global.fetch.mock.calls[0];
    expect(submitUrl).toBe('https://api.bfl.ai/v1/flux-pro-1.1');
    expect(submitInit.headers['x-key']).toBe('bfl-key-789');
    expect(submitInit.method).toBe('POST');

    const [pollUrl, pollInit] = global.fetch.mock.calls[1];
    expect(pollUrl).toBe('https://api.bfl.ai/v1/get_result?id=task-1');
    expect(pollInit.headers['x-key']).toBe('bfl-key-789');

    expect(result.mime).toBe('image/png');
    expect(result.dataUri).toMatch(/^data:image\/png;base64,/);

    vi.useRealTimers();
  });

  it('throws on missing API key for deepinfra', async () => {
    getImageProviderConfig.mockReturnValue({
      providerId: 'deepinfra',
      apiType: 'deepinfra-inference',
      baseURL: 'https://api.deepinfra.com/v1/inference',
      apiKey: '',
      model: 'black-forest-labs/FLUX-1-schnell'
    });

    await expect(generateImage({ prompt: 'test' }))
      .rejects.toThrow('Missing DeepInfra API key');
  });

  it('routes local BFL provider — uses correct model, strips trailing slash, rejects stale model', async () => {
    vi.useFakeTimers();

    getImageProviderConfig.mockReturnValue({
      providerId: 'local',
      apiType: 'bfl',
      baseURL: 'http://localhost:8080/',
      apiKey: '',
      model: 'flux-2-klein-4b',
      imageModels: {
        'FLUX.2 Klein 4B': 'flux-2-klein-4b',
        'FLUX.2 Klein 9B': 'flux-2-klein-9b'
      }
    });

    // Submit response
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 'local-task-1', polling_url: 'http://localhost:8080/v1/get_result?id=local-task-1' })
    });
    // Poll response (Ready with base64 result)
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        status: 'Ready',
        result: 'iVBORw0KGgo='
      })
    });

    // Call with NO model — should use the default flux-2-klein-4b
    const promise1 = generateImage({ prompt: 'x' });
    await vi.advanceTimersByTimeAsync(2000);
    await promise1;

    const submitUrl1 = global.fetch.mock.calls[0][0];
    expect(submitUrl1).toBe('http://localhost:8080/v1/flux-2-klein-4b');
    expect(submitUrl1).not.toContain('black-forest-labs');

    // Reset mocks
    global.fetch.mockClear();

    // Submit for the stale-model call
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 'local-task-2', polling_url: 'http://localhost:8080/v1/get_result?id=local-task-2' })
    });
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ status: 'Ready', result: 'iVBORw0KGgo=' })
    });

    // Call with a STALE deepinfra model — must fall back to flux-2-klein-4b
    const promise2 = generateImage({ prompt: 'x', model: 'black-forest-labs/FLUX-1-schnell' });
    await vi.advanceTimersByTimeAsync(2000);
    await promise2;

    const submitUrl2 = global.fetch.mock.calls[0][0];
    expect(submitUrl2).toBe('http://localhost:8080/v1/flux-2-klein-4b');
    expect(submitUrl2).not.toContain('black-forest-labs');

    // Verify poll URL was used
    expect(global.fetch.mock.calls[1][0]).toBe('http://localhost:8080/v1/get_result?id=local-task-2');

    vi.useRealTimers();
  });

  it('throws on unknown apiType', async () => {
    getImageProviderConfig.mockReturnValue({
      providerId: 'unknown',
      apiType: 'some-weird-type',
      baseURL: 'http://x',
      apiKey: 'k',
      model: 'm'
    });

    await expect(generateImage({ prompt: 'test' }))
      .rejects.toThrow('Unknown image API type: some-weird-type');
  });
});
