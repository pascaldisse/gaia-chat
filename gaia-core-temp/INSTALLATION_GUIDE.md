# Gaia Core AI Engine - Installation & Usage Guide

## Table of Contents
1. [System Requirements](#system-requirements)
2. [Installation](#installation)
3. [Quick Start](#quick-start)
4. [Usage Examples](#usage-examples)
5. [API Reference](#api-reference)
6. [Configuration](#configuration)
7. [Troubleshooting](#troubleshooting)

## System Requirements

- Python 3.8 or higher
- pip (Python package manager)
- 4GB RAM minimum (8GB recommended)
- Internet connection for API calls

## Installation

### Step 1: Extract the Package
```bash
# Extract the zip file
unzip gaia-core.zip
cd gaia-core
```

### Step 2: Create Virtual Environment (Recommended)
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate
```

### Step 3: Install Dependencies
```bash
# Install the package in development mode
pip install -e .

# Or install just the requirements
pip install -r requirements.txt
```

### Step 4: Set Environment Variables
```bash
# Create .env file
cp .env.example .env

# Edit .env and add your API keys:
# DEEPINFRA_API_KEY=your-deepinfra-api-key
# OPENAI_API_KEY=your-openai-api-key (optional)
# ANTHROPIC_API_KEY=your-anthropic-api-key (optional)
```

## Quick Start

### 1. Start the REST API Server
```bash
# Start server with default settings
python -m core_ai_engine.server

# Or with custom settings
python -m core_ai_engine.server --host 0.0.0.0 --port 8000 --reload
```

The API will be available at:
- Base URL: http://localhost:8000
- API Documentation: http://localhost:8000/docs
- Health Check: http://localhost:8000/health

### 2. Use the CLI
```bash
# Quick query
python -m core_ai_engine.cli query "What is the meaning of life?"

# Interactive chat
python -m core_ai_engine.cli chat --persona assistant --model llama3-70b

# Use tools
python -m core_ai_engine.cli tool dice_roll notation=3d6+2

# List available models
python -m core_ai_engine.cli models

# List available tools
python -m core_ai_engine.cli tools
```

### 3. Python API Usage
```python
import asyncio
from core_ai_engine import AIEngine, PersonaConfig

async def main():
    # Initialize engine
    engine = AIEngine()
    
    # Simple chat
    response = await engine.chat(
        message="Hello, how are you?",
        model="llama3-70b"
    )
    print(response)
    
    # Create persona
    persona_config = PersonaConfig(
        id="assistant",
        name="Assistant",
        system_prompt="You are a helpful AI assistant",
        model="llama3-70b",
        creativity=7,
        intelligence=8,
        empathy=7
    )
    
    agent = engine.create_persona_agent(
        persona_config=persona_config,
        tools=["tavily_search", "dice_roll"]
    )
    
    # Chat with persona
    result = await agent.chat("Tell me about AI and roll a d20")
    print(result["content"])

asyncio.run(main())
```

## Usage Examples

### Example 1: Streaming Chat
```python
import asyncio
from core_ai_engine import AIEngine

async def stream_example():
    engine = AIEngine()
    
    # Define callback for streaming
    def print_token(token):
        print(token, end='', flush=True)
    
    # Stream response
    await engine.chat(
        message="Write a haiku about programming",
        stream_callback=print_token
    )

asyncio.run(stream_example())
```

### Example 2: Hive Mind System
```python
from core_ai_engine import AIEngine, AttributeConfig

async def hive_mind_example():
    engine = AIEngine()
    
    # Define attributes
    attributes = [
        AttributeConfig("Logic", 5, "Rational thinking"),
        AttributeConfig("Creativity", 4, "Creative approaches"),
        AttributeConfig("Empathy", 5, "Emotional understanding"),
        AttributeConfig("Practicality", 3, "Real-world focus")
    ]
    
    # Create hive mind
    hive_mind = engine.create_hive_mind(attributes)
    
    # Process query
    result = await hive_mind.process_query(
        query="Should we use AI in education?",
        parallel=True
    )
    
    print("Summary:", result["summary"])

asyncio.run(hive_mind_example())
```

### Example 3: Using Tools
```python
from core_ai_engine import AIEngine

async def tools_example():
    engine = AIEngine()
    
    # Get tool from registry
    search_tool = engine._tool_registry.get_tool("tavily_search")
    
    # Execute tool
    results = await search_tool.ainvoke({
        "query": "latest AI developments 2024"
    })
    
    print(results)

asyncio.run(tools_example())
```

## API Reference

### REST API Endpoints

#### Chat Endpoints
- `POST /chat` - Simple chat without personas
- `POST /personas` - Create a new persona
- `GET /personas` - List all personas
- `POST /personas/{persona_id}/chat` - Chat with specific persona

#### Hive Mind
- `POST /hive_mind` - Process query through multiple perspectives

#### Tools
- `GET /tools` - List available tools
- `POST /tools/execute` - Execute a specific tool

#### Models
- `GET /models` - List available models

#### WebSocket
- `WS /ws/chat/{persona_id}` - Real-time streaming chat

### Request Examples

#### Create Persona
```bash
curl -X POST http://localhost:8000/personas \
  -H "Content-Type: application/json" \
  -d '{
    "id": "creative_writer",
    "name": "Creative Writer",
    "system_prompt": "You are a creative writer",
    "model": "llama3-70b",
    "temperature": 0.9,
    "tools": ["dice_roll", "tavily_search"]
  }'
```

#### Chat with Persona
```bash
curl -X POST http://localhost:8000/personas/creative_writer/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Write me a short story",
    "persona_id": "creative_writer",
    "stream": false
  }'
```

## Configuration

### Engine Configuration
```python
from core_ai_engine import AIEngine, EngineConfig

config = EngineConfig(
    api_keys={
        "deepinfra": "your-key",
        "openai": "your-key"
    },
    default_model="llama3-70b",
    enable_caching=True,
    cache_ttl=3600,
    max_retries=3,
    timeout=30
)

engine = AIEngine(config)
```

### Available Models
- `llama3-70b` - Llama 3 70B (Default)
- `mixtral-8x22b` - Mixtral 8x22B
- `deepseek-v3` - DeepSeek V3
- `deepseek-r1` - DeepSeek R1
- `dbrx` - DBRX Instruct
- `gpt-4` - GPT-4 (requires OpenAI key)
- `gpt-3.5-turbo` - GPT-3.5 Turbo
- `claude-3-opus` - Claude 3 Opus (requires Anthropic key)

### Available Tools
- `tavily_search` - AI-optimized web search
- `duckduckgo_search` - Privacy-focused search
- `vector_search` - Semantic document search
- `dice_roll` - RPG dice rolling
- `file_search` - Search uploaded files
- `image_generation` - AI image generation

## Troubleshooting

### Common Issues

#### 1. Import Error
```bash
# Solution: Install in development mode
pip install -e .
```

#### 2. API Key Error
```bash
# Solution: Set environment variables
export DEEPINFRA_API_KEY="your-key"
# Or create .env file
```

#### 3. Connection Refused
```bash
# Solution: Make sure server is running
python -m core_ai_engine.server
```

#### 4. Out of Memory
```bash
# Solution: Reduce max_tokens or use smaller model
```

### Debug Mode
```python
# Enable debug logging
import logging
logging.basicConfig(level=logging.DEBUG)
```

### Testing Installation
```bash
# Run basic tests
python -c "from core_ai_engine import AIEngine; print('Installation successful!')"

# Run CLI test
python -m core_ai_engine.cli query "test"
```

## Integration with Other Projects

### JavaScript/Node.js Integration
```javascript
// Install axios
// npm install axios

const axios = require('axios');

const coreAI = axios.create({
  baseURL: 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' }
});

// Chat example
async function chat(message) {
  const response = await coreAI.post('/chat', {
    message: message,
    model: 'llama3-70b'
  });
  return response.data.response;
}
```

### Using with Docker
```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY . .

RUN pip install -e .

EXPOSE 8000

CMD ["python", "-m", "core_ai_engine.server", "--host", "0.0.0.0"]
```

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review the API documentation at http://localhost:8000/docs
3. Check the examples in the `examples/` directory

## License

MIT License - See LICENSE file for details