import { getCurrentProviderConfig } from './providerService';

function assertProviderReady(provider) {
  if (provider.requiresApiKey && !provider.apiKey) {
    throw new Error(`Missing API key for ${provider.providerName}. Open Settings to add one.`);
  }

  if (!provider.baseURL) {
    throw new Error(`Missing base URL for ${provider.providerName}. Open Settings to add one.`);
  }
}

function trimTrailingSlash(value) {
  return String(value || '').replace(/\/+$/, '');
}

function splitAnthropicMessages(messages) {
  const system = messages
    .filter(message => message.role === 'system')
    .map(message => message.content)
    .join('\n\n');

  const chatMessages = messages
    .filter(message => message.role !== 'system')
    .map(message => ({
      role: message.role === 'assistant' ? 'assistant' : 'user',
      content: String(message.content || '')
    }));

  return { system, chatMessages };
}

async function readServerSentEvents(response, onEvent) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split('\n\n');
    buffer = events.pop() || '';

    for (const event of events) {
      const dataLines = event
        .split('\n')
        .filter(line => line.startsWith('data: '))
        .map(line => line.slice(6).trim());

      for (const dataText of dataLines) {
        if (!dataText || dataText === '[DONE]') continue;
        onEvent(JSON.parse(dataText));
      }
    }
  }
}

async function streamOpenAICompatible({ provider, model, messages, temperature, maxTokens, signal, onToken }) {
  const headers = {
    'Content-Type': 'application/json'
  };

  if (provider.apiKey) {
    headers.Authorization = `Bearer ${provider.apiKey}`;
  }

  const response = await fetch(`${trimTrailingSlash(provider.baseURL)}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: true
    }),
    signal
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`API Error ${response.status}: ${body}`);
  }

  let fullText = '';
  await readServerSentEvents(response, data => {
    const token = data.choices?.[0]?.delta?.content || '';
    if (!token) return;
    fullText += token;
    onToken?.(token, fullText);
  });

  return fullText;
}

async function streamAnthropic({ provider, model, messages, temperature, maxTokens, signal, onToken }) {
  const { system, chatMessages } = splitAnthropicMessages(messages);
  const response = await fetch(`${trimTrailingSlash(provider.baseURL)}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': provider.apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model,
      system,
      messages: chatMessages,
      temperature,
      max_tokens: maxTokens,
      stream: true
    }),
    signal
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Anthropic API Error ${response.status}: ${body}`);
  }

  let fullText = '';
  await readServerSentEvents(response, data => {
    const token = data.type === 'content_block_delta' ? data.delta?.text || '' : '';
    if (!token) return;
    fullText += token;
    onToken?.(token, fullText);
  });

  return fullText;
}

export async function streamChatCompletion({
  model,
  messages,
  temperature = 0.7,
  maxTokens = 1000,
  signal,
  onToken
}) {
  const provider = getCurrentProviderConfig();
  assertProviderReady(provider);

  const selectedModel = model || provider.model;
  if (!selectedModel) {
    throw new Error(`No model selected for ${provider.providerName}. Open Settings to choose one.`);
  }

  if (provider.apiType === 'anthropic') {
    return streamAnthropic({
      provider,
      model: selectedModel,
      messages,
      temperature,
      maxTokens,
      signal,
      onToken
    });
  }

  return streamOpenAICompatible({
    provider,
    model: selectedModel,
    messages,
    temperature,
    maxTokens,
    signal,
    onToken
  });
}
