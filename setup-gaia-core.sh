#!/bin/bash

# Script to set up gaia-core as a git subrepo

echo "Setting up gaia-core repository..."

# Navigate to parent directory
cd ..

# Create gaia-core directory if it doesn't exist
if [ ! -d "gaia-core" ]; then
    echo "Creating gaia-core directory..."
    mkdir -p gaia-core
fi

# Move the core-ai-engine content to gaia-core
if [ -d "gaia-core-temp" ]; then
    echo "Moving core-ai-engine to gaia-core..."
    cp -r gaia-core-temp/* gaia-core/
    rm -rf gaia-core-temp
fi

# Initialize git repository in gaia-core
cd gaia-core
if [ ! -d ".git" ]; then
    echo "Initializing git repository..."
    git init
    
    # Create initial commit
    git add .
    git commit -m "Initial commit: Core AI Engine with Python LangChain"
fi

# Create a README for the main repo
cat > README.md << 'EOF'
# Gaia Core AI Engine

A Python-based AI engine using LangChain that provides a unified interface for AI services, agents, and tools. This engine serves as the backend for the Gaia ecosystem and can be imported into other projects or used via CLI/REST API.

## Features

- **LangChain Integration**: Built on LangChain for robust AI capabilities
- **Multi-Model Support**: DeepInfra models (Llama3, Mixtral, DeepSeek, etc.)
- **Agent System**: Persona-based agents with tool integration
- **Hive Mind System**: Multi-attribute agent collaboration
- **Tool Framework**: Extensible tool system (search, image generation, etc.)
- **REST API**: FastAPI server for integration with other services
- **CLI Interface**: Command-line interface for direct usage
- **Streaming Support**: Real-time response streaming

## Installation

```bash
pip install -e .
```

## Quick Start

### Python API
```python
from core_ai_engine import AIEngine, PersonaAgent, HiveMind

# Initialize engine
engine = AIEngine(api_key="your-api-key")

# Create a persona agent
agent = engine.create_persona_agent(
    name="Assistant",
    system_prompt="You are a helpful assistant",
    model="meta-llama/Meta-Llama-3-70B-Instruct"
)

# Chat with agent
response = await agent.chat("Hello, how are you?")
```

### REST API
```bash
# Start the server
python -m core_ai_engine.server

# Make requests
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello", "persona_id": "assistant"}'
```

### CLI
```bash
# Interactive chat
python -m core_ai_engine.cli chat --persona assistant

# Single query
python -m core_ai_engine.cli query "What is the weather?" --model llama3
```

## Integration with Gaia Chat

This engine is designed to be used as the backend for gaia-chat. To integrate:

1. Start the Core AI Engine server:
   ```bash
   python -m core_ai_engine.server
   ```

2. Configure gaia-chat to use the engine:
   ```javascript
   // In gaia-chat, use the coreAIAdapter
   import { coreAI } from './services/coreAIAdapter';
   
   // Check health
   const isHealthy = await coreAI.healthCheck();
   
   // Create personas and chat
   await coreAI.createPersona({...});
   const response = await coreAI.chatWithPersona({...});
   ```

## Development

```bash
# Install development dependencies
pip install -e ".[dev]"

# Run tests
pytest

# Format code
black core_ai_engine

# Lint
flake8 core_ai_engine
```

## License

MIT License - See LICENSE file for details
EOF

echo "Setup complete!"
echo ""
echo "To use gaia-core in gaia-chat:"
echo "1. Add gaia-core as a git submodule:"
echo "   cd gaia-chat"
echo "   git submodule add ../gaia-core gaia-core"
echo ""
echo "2. Or install it as a Python package:"
echo "   cd gaia-core"
echo "   pip install -e ."
echo ""
echo "3. Start the Core AI Engine server:"
echo "   python -m core_ai_engine.server"