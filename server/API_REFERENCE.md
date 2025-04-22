# Gaia API Reference

## Overview

The Gaia API provides programmatic access to Gaia's LLM capabilities and persona-based AI system. This RESTful API allows developers to interact with AI models, create and manage personas, and generate contextual responses based on personality traits.

## Base URL

All API endpoints are relative to the base URL:

```
http://localhost:5000/api
```

For production deployments, this would be replaced with your domain.

## Authentication

The API uses bearer token authentication. Include your API key in the request headers:

```
Authorization: Bearer YOUR_API_KEY
```

## Error Handling

All endpoints return standard HTTP status codes:

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 400 | Bad Request - Missing or invalid parameters |
| 401 | Unauthorized - Invalid API key |
| 404 | Not Found - Resource doesn't exist |
| 500 | Server Error - Something went wrong on the server |

Error responses follow this format:

```json
{
  "error": true,
  "message": "Description of the error"
}
```

## Rate Limiting

The API currently does not implement rate limiting, but this may change in future versions.

## Endpoints

### LLM Endpoints

#### Check API Health

```
GET /llm/health
```

Verifies that the API server is running correctly.

**Response**

```json
{
  "status": "ok",
  "message": "LLM API is running"
}
```

#### Get Available Models

```
GET /llm/models
```

Returns a list of available LLM models.

**Response**

```json
{
  "models": [
    {
      "id": "meta-llama/Meta-Llama-3-70B-Instruct",
      "name": "LLAMA3_70B",
      "provider": "deepinfra"
    },
    {
      "id": "mistralai/Mixtral-8x22B-Instruct-v0.1",
      "name": "MIXTRAL_8X22B",
      "provider": "deepinfra"
    }
  ]
}
```

#### Generate Text Completion

```
POST /llm/completion
```

Generates a text completion using the specified model.

**Request Body**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| model | string | Yes | Model ID (e.g., "meta-llama/Meta-Llama-3-70B-Instruct") |
| prompt | string | Yes | Text prompt for completion |
| temperature | number | No | Sampling temperature (0-1, default: 0.7) |
| max_tokens | number | No | Maximum tokens to generate (default: 800) |

Example:

```json
{
  "model": "meta-llama/Meta-Llama-3-70B-Instruct",
  "prompt": "Explain quantum computing in simple terms",
  "temperature": 0.7,
  "max_tokens": 800
}
```

**Response**

```json
{
  "completion": "Quantum computing is like...",
  "model": "meta-llama/Meta-Llama-3-70B-Instruct"
}
```

#### Generate Chat Response

```
POST /llm/chat
```

Generates a chat response based on conversation history.

**Request Body**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| model | string | Yes | Model ID (e.g., "meta-llama/Meta-Llama-3-70B-Instruct") |
| messages | array | Yes | Array of message objects with role and content |
| temperature | number | No | Sampling temperature (0-1, default: 0.7) |
| max_tokens | number | No | Maximum tokens to generate (default: 800) |

Example:

```json
{
  "model": "meta-llama/Meta-Llama-3-70B-Instruct",
  "messages": [
    {"role": "user", "content": "Hello, how are you?"},
    {"role": "assistant", "content": "I'm doing well, thank you for asking! How can I help you today?"},
    {"role": "user", "content": "Can you explain what an API is?"}
  ],
  "temperature": 0.7,
  "max_tokens": 800
}
```

**Response**

```json
{
  "message": "An API (Application Programming Interface) is a set of rules and protocols...",
  "model": "meta-llama/Meta-Llama-3-70B-Instruct"
}
```

#### Stream Chat Response

```
POST /llm/stream
```

Streams a chat response as it's being generated using Server-Sent Events (SSE).

**Request Body**

Same as the `/llm/chat` endpoint.

**Response**

Server-Sent Events stream with the following event types:

- Token events: `{"token": "word "}`
- Completion event: `{"done": true}`
- Error event: `{"error": "Error message"}`

### Persona Endpoints

#### Get All Personas

```
GET /personas
```

Returns all available personas.

**Response**

```json
{
  "personas": [
    {
      "id": "default-assistant",
      "name": "Assistant",
      "systemPrompt": "You are a helpful AI assistant.",
      "model": "meta-llama/Meta-Llama-3-70B-Instruct",
      "initiative": 7,
      "talkativeness": 8,
      "confidence": 7,
      "curiosity": 8,
      "empathy": 8,
      "creativity": 7,
      "humor": 6,
      "adaptability": 8,
      "patience": 9,
      "skepticism": 5,
      "optimism": 7,
      "createdAt": "2025-04-22T10:35:42.123Z",
      "updatedAt": "2025-04-22T10:35:42.123Z",
      "agentSettings": {
        "maxIterations": 3,
        "toolConfig": {
          "fileSearch": true,
          "imageGeneration": false,
          "diceRoll": false
        }
      }
    }
  ]
}
```

#### Get Persona by ID

```
GET /personas/:id
```

Returns a specific persona by ID.

**Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Persona ID |

**Response**

```json
{
  "persona": {
    "id": "default-assistant",
    "name": "Assistant",
    "systemPrompt": "You are a helpful AI assistant.",
    "model": "meta-llama/Meta-Llama-3-70B-Instruct",
    "initiative": 7,
    "talkativeness": 8,
    "confidence": 7,
    "curiosity": 8,
    "empathy": 8,
    "creativity": 7,
    "humor": 6,
    "adaptability": 8,
    "patience": 9,
    "skepticism": 5,
    "optimism": 7,
    "createdAt": "2025-04-22T10:35:42.123Z",
    "updatedAt": "2025-04-22T10:35:42.123Z",
    "agentSettings": {
      "maxIterations": 3,
      "toolConfig": {
        "fileSearch": true,
        "imageGeneration": false,
        "diceRoll": false
      }
    }
  }
}
```

#### Create New Persona

```
POST /personas
```

Creates a new persona with specified attributes.

**Request Body**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| name | string | Yes | Persona name |
| systemPrompt | string | Yes | System prompt defining the persona's behavior |
| model | string | Yes | Model ID (e.g., "meta-llama/Meta-Llama-3-70B-Instruct") |
| initiative | number | No | Initiative attribute (1-10, default: 5) |
| talkativeness | number | No | Talkativeness attribute (1-10, default: 5) |
| confidence | number | No | Confidence attribute (1-10, default: 5) |
| curiosity | number | No | Curiosity attribute (1-10, default: 5) |
| empathy | number | No | Empathy attribute (1-10, default: 5) |
| creativity | number | No | Creativity attribute (1-10, default: 5) |
| humor | number | No | Humor attribute (1-10, default: 5) |
| adaptability | number | No | Adaptability attribute (1-10, default: 5) |
| patience | number | No | Patience attribute (1-10, default: 5) |
| skepticism | number | No | Skepticism attribute (1-10, default: 5) |
| optimism | number | No | Optimism attribute (1-10, default: 5) |

Example:

```json
{
  "name": "Science Educator",
  "systemPrompt": "You are a science educator who specializes in explaining complex scientific concepts in simple terms.",
  "model": "meta-llama/Meta-Llama-3-70B-Instruct",
  "initiative": 6,
  "talkativeness": 8,
  "confidence": 9,
  "curiosity": 9,
  "empathy": 7,
  "creativity": 8,
  "humor": 6
}
```

**Response**

```json
{
  "persona": {
    "id": "persona-1650693252123",
    "name": "Science Educator",
    "systemPrompt": "You are a science educator who specializes in explaining complex scientific concepts in simple terms.",
    "model": "meta-llama/Meta-Llama-3-70B-Instruct",
    "initiative": 6,
    "talkativeness": 8,
    "confidence": 9,
    "curiosity": 9,
    "empathy": 7,
    "creativity": 8,
    "humor": 6,
    "createdAt": "2025-04-22T10:40:52.123Z",
    "updatedAt": "2025-04-22T10:40:52.123Z"
  },
  "message": "Persona created successfully"
}
```

#### Chat with Persona

```
POST /personas/:id/chat
```

Generates a response from a specific persona based on a message and conversation history.

**Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Persona ID |

**Request Body**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| message | string | Yes | User message |
| history | array | No | Array of previous message objects (default: []) |

Example:

```json
{
  "message": "Can you explain quantum mechanics in simple terms?",
  "history": [
    {"role": "user", "content": "Hello, how are you?"},
    {"role": "assistant", "content": "I'm doing quite well, thank you for asking! I'm excited to share scientific knowledge with you today. How can I help?"}
  ]
}
```

**Response**

```json
{
  "response": "Quantum mechanics is like...",
  "outcome": {
    "initiative": {"roll": 15, "total": 18},
    "talkativeness": {"roll": 12, "total": 16},
    "confidence": {"roll": 18, "total": 22},
    "curiosity": {"roll": 16, "total": 20},
    "empathy": {"roll": 9, "total": 12},
    "creativity": {"roll": 14, "total": 19},
    "humor": {"roll": 7, "total": 10},
    "shouldRespond": true,
    "responsePriority": 18,
    "assertiveness": "assertive",
    "questionDepth": "moderate",
    "emotionalTone": "neutral"
  },
  "persona": {
    "id": "persona-1650693252123",
    "name": "Science Educator"
  }
}
```

#### Stream Chat with Persona

```
POST /personas/:id/stream
```

Streams a response from a specific persona using Server-Sent Events (SSE).

**Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Persona ID |

**Request Body**

Same as the `/personas/:id/chat` endpoint.

**Response**

Server-Sent Events stream with the following event types:

- Outcome event: `{"type": "outcome", "data": {...}}`
- Token events: `{"type": "token", "token": "word "}`
- Completion event: `{"type": "done", "done": true}`
- Error event: `{"type": "error", "error": "Error message"}`

## RPG Mechanics

The Persona endpoints integrate with Gaia's unique RPG-based behavior system. This system performs "dice rolls" based on persona attributes to generate dynamic interactions. The outcome of these rolls influences:

- Response assertiveness (hesitant, neutral, assertive)
- Emotional tone (detached, neutral, empathetic)
- Question depth (shallow, moderate, deep)
- Decision to respond (based on talkativeness)
- Response priority (based on initiative)

## Client Examples

### JavaScript Example

```javascript
// Chat with a persona
const response = await fetch('http://localhost:5000/api/personas/default-assistant/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    message: 'Hello, how are you?',
    history: []
  })
});

const data = await response.json();
console.log(data.response);
```

### Python Example

```python
import requests

# Generate a chat response
response = requests.post(
    'http://localhost:5000/api/llm/chat',
    headers={
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_API_KEY'
    },
    json={
        'model': 'meta-llama/Meta-Llama-3-70B-Instruct',
        'messages': [
            {'role': 'user', 'content': 'Hello, how are you?'}
        ],
        'temperature': 0.7
    }
)

data = response.json()
print(data['message'])
```

### Streaming Example (JavaScript)

```javascript
// Create streaming request
const response = await fetch('http://localhost:5000/api/personas/default-assistant/stream', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    message: 'Tell me about space exploration',
    history: []
  })
});

// Handle SSE stream
const reader = response.body.getReader();
const decoder = new TextDecoder();
let buffer = '';

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  buffer += decoder.decode(value, { stream: true });
  
  // Process complete events
  const lines = buffer.split('\n\n');
  buffer = lines.pop();
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.substring(6));
      
      if (data.type === 'token') {
        process.stdout.write(data.token);
      } else if (data.type === 'done') {
        console.log('\nStream completed');
        break;
      }
    }
  }
}
```

## Further Resources

For more detailed examples, check the example client implementations:

- `/server/examples/api-client.js` - JavaScript client example
- `/server/examples/python_client.py` - Python client example