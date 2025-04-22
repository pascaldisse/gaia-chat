# Gaia API Server

This API server provides access to Gaia's AI capabilities including chat, completion, and persona-based interactions.

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the API server:
```bash
npm run server
```

For development with both React and API server:
```bash
npm run dev
```

## API Endpoints

### LLM Endpoints

#### `GET /api/llm/health`
Health check endpoint.

#### `GET /api/llm/models`
Get list of available LLM models.

#### `POST /api/llm/completion`
Generate text completion.

Request body:
```json
{
  "model": "meta-llama/Meta-Llama-3-70B-Instruct",
  "prompt": "Your prompt text here",
  "temperature": 0.7,
  "max_tokens": 800
}
```

#### `POST /api/llm/chat`
Generate chat response.

Request body:
```json
{
  "model": "meta-llama/Meta-Llama-3-70B-Instruct",
  "messages": [
    { "role": "user", "content": "Hello, how are you?" }
  ],
  "temperature": 0.7,
  "max_tokens": 800
}
```

#### `POST /api/llm/stream`
Stream chat response (Server-Sent Events).

Request body: Same as chat endpoint.

### Persona Endpoints

#### `GET /api/personas`
Get all available personas.

#### `GET /api/personas/:id`
Get persona by ID.

#### `POST /api/personas`
Create a new persona.

Request body:
```json
{
  "name": "Custom Assistant",
  "systemPrompt": "You are a helpful assistant...",
  "model": "meta-llama/Meta-Llama-3-70B-Instruct",
  "initiative": 7,
  "talkativeness": 8,
  "confidence": 7,
  "curiosity": 8,
  "empathy": 8,
  "creativity": 7
}
```

#### `POST /api/personas/:id/chat`
Chat with a specific persona.

Request body:
```json
{
  "message": "Hello, how are you?",
  "history": [
    { "role": "user", "content": "Previous message" },
    { "role": "assistant", "content": "Previous response" }
  ]
}
```

#### `POST /api/personas/:id/stream`
Stream chat with a specific persona (Server-Sent Events).

Request body: Same as persona chat endpoint.

## Authentication

Currently, the API uses a simple API key authentication system. Include your API key in the request headers:

```
Authorization: Bearer YOUR_API_KEY
```

## Error Handling

All endpoints return appropriate HTTP status codes:
- 200: Success
- 400: Bad Request (missing parameters)
- 401: Unauthorized (invalid API key)
- 404: Not Found (persona or resource not found)
- 500: Server Error

Error responses follow this format:
```json
{
  "error": true,
  "message": "Description of the error"
}
```