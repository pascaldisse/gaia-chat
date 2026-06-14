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
      model: 'black-forest-labs/FLUX-1-schnell'
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

  it('routes openai-images with Bearer auth to /images/generations', async () => {
    getImageProviderConfig.mockReturnValue({
      providerId: 'openai',
      apiType: 'openai-images',
      baseURL: 'https://api.openai.com/v1',
      apiKey: 'oa-key-456',
      model: 'gpt-image-1'
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
