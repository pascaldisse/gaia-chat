# Core AI Engine Integration Guide

## Overview

The Gaia Chat application has been refactored to use a centralized Python-based Core AI Engine built with LangChain. This provides better AI capabilities, tool integration, and a unified interface for all AI operations.

## Architecture

```
┌─────────────────┐     HTTP/WebSocket      ┌──────────────────┐
│   Gaia Chat     │ ◄─────────────────────► │  Core AI Engine  │
│   (React UI)    │                          │  (Python/FastAPI)│
└─────────────────┘                          └──────────────────┘
        │                                             │
        │                                             │
        ▼                                             ▼
┌─────────────────┐                          ┌──────────────────┐
│ coreAIAdapter.js│                          │   LangChain      │
│   (HTTP Client) │                          │   Agents & Tools │
└─────────────────┘                          └──────────────────┘
```

## Setup Instructions

### 1. Set up the Core AI Engine

```bash
# Run the setup script to create gaia-core repository
./setup-gaia-core.sh

# Navigate to gaia-core
cd ../gaia-core

# Install Python dependencies
pip install -e .

# Set environment variables
export DEEPINFRA_API_KEY="your-api-key"
export OPENAI_API_KEY="your-openai-key"  # Optional
export ANTHROPIC_API_KEY="your-anthropic-key"  # Optional
```

### 2. Start the Core AI Engine Server

```bash
# From gaia-core directory
python -m core_ai_engine.server

# Or with custom settings
python -m core_ai_engine.server --host 0.0.0.0 --port 8000
```

The server will be available at http://localhost:8000
API documentation at http://localhost:8000/docs

### 3. Configure Gaia Chat

Update your environment variables in gaia-chat:

```bash
# In gaia-chat/.env
CORE_AI_ENGINE_URL=http://localhost:8000
```

### 4. Start Gaia Chat

```bash
# From gaia-chat directory
npm install
npm start
```

## API Usage

### Creating Personas

The Core AI Engine handles persona creation with tools:

```javascript
import { coreAI } from './services/coreAIAdapter';

// Create a persona
await coreAI.createPersona({
  id: 'assistant',
  name: 'Assistant',
  systemPrompt: 'You are a helpful assistant',
  model: 'llama3-70b',
  temperature: 0.7,
  tools: ['tavily_search', 'dice_roll', 'image_generation'],
  attributes: {
    intelligence: 8,
    wisdom: 7,
    charisma: 6,
    empathy: 8,
    humor: 5
  }
});
```

### Chatting with Personas

```javascript
// Chat with streaming
const response = await coreAI.chatWithPersona({
  personaId: 'assistant',
  message: 'Hello, how are you?',
  includeHistory: true,
  onToken: (token) => {
    // Handle streaming tokens
    console.log(token);
  }
});
```

### Using Hive Mind

```javascript
// Process through multiple perspectives
const result = await coreAI.processHiveMind({
  query: 'Should we implement this feature?',
  attributes: [
    { name: 'Logic', value: 5, description: 'Rational thinking' },
    { name: 'Creativity', value: 4, description: 'Creative approaches' },
    { name: 'Empathy', value: 5, description: 'User impact' }
  ],
  summaryModel: 'llama3-70b',
  parallel: true
});
```

## Available Tools

The Core AI Engine provides these built-in tools:

1. **tavily_search** - AI-optimized web search
2. **duckduckgo_search** - Privacy-focused web search
3. **vector_search** - Semantic search in documents
4. **dice_roll** - RPG dice rolling
5. **file_search** - Search uploaded files
6. **image_generation** - Generate images from text

## Migrating from Direct LangChain

The refactoring replaces direct LangChain usage in JavaScript with API calls to the Python Core AI Engine:

### Before (JavaScript LangChain):
```javascript
import { ChatDeepInfra } from "@langchain/community/chat_models/deepinfra";
const chat = new ChatDeepInfra({ apiKey, modelName });
```

### After (Core AI Adapter):
```javascript
import { coreAI } from './services/coreAIAdapter';
const response = await coreAI.chat({ message, model });
```

## Benefits

1. **Centralized AI Logic** - All AI operations in one place
2. **Better Tool Support** - Python has more mature tool integrations
3. **Improved Performance** - Async operations and connection pooling
4. **Language Flexibility** - Can be used from any language via REST API
5. **CLI Access** - Direct command-line interface for testing
6. **WebSocket Support** - Real-time streaming for chat

## Troubleshooting

### Engine Not Running
```bash
# Check if server is running
curl http://localhost:8000/health

# Check logs
python -m core_ai_engine.server --reload
```

### Connection Issues
```javascript
// Check health in gaia-chat
const isHealthy = await coreAI.healthCheck();
console.log('Core AI Engine healthy:', isHealthy);
```

### Missing Dependencies
```bash
# Reinstall dependencies
cd ../gaia-core
pip install -e . --upgrade
```

## Development

### Adding New Tools

1. Create tool in `gaia-core/core_ai_engine/tools/`
2. Register in `ToolRegistry`
3. Use in personas:

```python
# In core_ai_engine/tools/custom.py
class CustomTool(BaseToolWithCallback):
    name = "custom_tool"
    description = "My custom tool"
    
    async def _arun(self, query: str) -> str:
        # Implementation
        return "Result"
```

### Testing

```bash
# Run Python tests
cd ../gaia-core
pytest

# Test CLI
python -m core_ai_engine.cli query "Test message"

# Test API
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Test"}'
```

## Next Steps

1. Add more specialized tools
2. Implement vector database for knowledge storage
3. Add authentication to the API
4. Create Docker deployment setup
5. Add monitoring and logging