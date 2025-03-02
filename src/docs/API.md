# Gaia Project Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Core Components](#core-components)
4. [UI Components](#ui-components)
5. [Services](#services)
6. [Configuration](#configuration)
7. [Performance](#performance)
8. [Best Practices](#best-practices)
9. [Examples](#examples)
10. [Design System](#design-system)

## Overview

Gaia is an AI-powered chat application that implements a unique RPG-style personality system for AI agents. The system allows for dynamic, personality-driven interactions between users and AI personas, each with their own traits, capabilities, and behavior patterns.

### Key Features
- Multi-persona chat system
- RPG-based personality traits and behavior generation
- File handling and knowledge base integration
- Image generation capabilities
- Customizable AI agent tools
- Real-time streaming responses
- Enhanced voice system with multiple TTS engines
- Audio playback sequencing and debugging

## Architecture

### System Components
```
src/
├── components/     # React UI components
├── services/      # Core services and APIs
├── utils/         # Utility functions and helpers
├── models/        # Data models and types
├── config/        # Configuration files
├── styles/        # CSS and styling
└── docs/          # Documentation
```

### Data Flow
1. User Input → Chat Interface
2. Message Processing → Persona Selection
3. RPG System → Behavior Generation
4. AI Model → Response Generation
5. UI Update → Message Display

## Core Components

### Persona System

The Persona system is the core of the application, providing AI agent personalities and behavior management.

#### `Persona` Class
```typescript
interface PersonaConfig {
  id?: string;
  name: string;
  systemPrompt: string;
  model: string;
  image?: string;
  initiative?: number;
  talkativeness?: number;
  confidence?: number;
  curiosity?: number;
  empathy?: number;
  creativity?: number;
  humor?: number;
  adaptability?: number;
  patience?: number;
  skepticism?: number;
  optimism?: number;
  agentSettings?: {
    maxIterations: number;
    toolConfig: {
      fileSearch: boolean;
      imageGeneration: boolean;
      diceRoll: boolean;
    }
  }
}
```

#### Methods
- `constructor(config: PersonaConfig)`: Creates a new persona instance
- `markActive()`: Updates the last active timestamp
- `getAttributes()`: Returns all personality attributes

#### Usage Example
```javascript
const persona = new Persona({
  name: "Assistant",
  systemPrompt: "You are a helpful AI assistant",
  model: MODELS.LLAMA3_70B,
  initiative: 7,
  empathy: 8
});
```

### RPG System

The RPG system provides dynamic behavior generation for personas through a D20-based roll system.

#### `RPGSystem` Class

Methods:
- `getModifier(score: number): number` - Calculates attribute modifiers
- `rollD20(): number` - Generates a D20 roll
- `calculateOutcome(persona: Persona, context: Context): RPGOutcome` - Calculates interaction outcomes
- `rollAttribute(persona: Persona, attribute: string, context: Context): RollResult` - Performs attribute checks

#### Behavior Generation
The RPG system influences:
- Response assertiveness
- Emotional tone
- Question depth
- Creativity level
- Humor inclusion

#### Context Modifiers
```typescript
interface Context {
  topicAlignment: boolean;
  unfamiliarTopic: boolean;
  mentionedPersonaIds: string[];
}
```

## UI Components

### Chat Interface

#### `Chat.js`
Main chat component handling:
- Message display and history
- Real-time response streaming
- Persona mentions and activation
- File attachments
- Image generation

#### Key Features
- Real-time message streaming
- Multi-persona conversation management
- File preview and handling
- Debug logging
- RPG outcome visualization

#### `ChatInput.js`
Handles:
- Text input
- Command processing
- File uploads
- Mention suggestions

### Persona Management

#### `PersonaManager`
Interface for:
- Creating new personas
- Editing existing personas
- Managing personality attributes
- Configuring agent tools
- Knowledge file management

Available Tools:
- File Search
- Image Generation
- Dice Roll

## Services

### Agent Service (`PersonaAgent`)

Manages the execution and behavior of AI personas:
- Persona initialization
- RPG-based behavior generation
- Tool management
- Response generation

#### Usage Example
```javascript
const agent = new PersonaAgent(persona, tools, {
  onResponse: handleResponse,
  onError: handleError
});

await agent.respond(message, context);
```

### Database Service

IndexedDB-based persistence layer:
- `getAllPersonas()`: Retrieves all stored personas
- `savePersona(persona: Persona)`: Persists persona data
- `deletePersona(id: string)`: Removes a persona
- `getFiles(fileIds: string[])`: Retrieves knowledge base files
- `addFile(file: File)`: Adds file to knowledge base
- `deleteFile(fileId: string)`: Removes file from knowledge base

### File Handling

#### FileParser
Utilities for handling various file formats:
- PDF parsing with `pdfjs-dist`
- Text file handling
- Office document basic support
- Base64 conversion utilities

#### Supported Formats
- PDF (full text extraction)
- Text files (direct reading)
- Office documents (basic text extraction)
- Images (base64 conversion)

## Configuration

### Models
```typescript
const MODELS = {
  LLAMA3_70B: 'meta-llama/Meta-Llama-3-70B-Instruct',
  MIXTRAL_8X22B: 'mistralai/Mixtral-8x22B-Instruct-v0.1',
  DEEPSEEK_V3: 'deepseek-ai/DeepSeek-V3',
  DEEPSEEK_R1: 'deepseek-ai/DeepSeek-R1',
  DBRX: 'databricks/dbrx-instruct'
};
```

### Image Models
```typescript
const IMAGE_MODELS = {
  FLUX_SCHNELL: 'black-forest-labs/FLUX-1-schnell',
  FLUX_DEV: 'black-forest-labs/FLUX-1-dev'
};
```

## Performance Monitoring

The application includes web vitals monitoring:
- Cumulative Layout Shift (CLS)
- First Input Delay (FID)
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Time to First Byte (TTFB)

### Optimization Tips
1. Use streaming responses for better UX
2. Implement proper error handling
3. Monitor memory usage with multiple personas
4. Cache frequently used resources
5. Optimize file handling for large documents

## Best Practices

### 1. Persona Creation
- Set balanced attribute scores (1-10 range)
- Provide detailed system prompts
- Configure appropriate tool access
- Use clear, distinctive persona names
- Include representative images

### 2. RPG System Usage
- Use context modifiers appropriately
- Consider attribute interactions
- Handle critical rolls (1 and 20)
- Balance personality traits
- Monitor response patterns

### 3. File Handling
- Support multiple file formats
- Handle large files appropriately
- Implement proper error handling
- Use async operations for large files
- Validate file types and sizes

### 4. Database Operations
- Use async/await for all operations
- Implement proper error handling
- Maintain data consistency
- Regular cleanup of unused data
- Implement proper indexing

## Examples

### 1. Creating a New Persona
```javascript
const newPersona = new Persona({
  name: "Technical Expert",
  systemPrompt: "You are an expert in technology...",
  model: MODELS.LLAMA3_70B,
  initiative: 6,
  confidence: 8,
  empathy: 7,
  agentSettings: {
    maxIterations: 3,
    toolConfig: {
      fileSearch: true,
      imageGeneration: true
    }
  }
});
```

### 2. Handling Chat Interactions
```javascript
const handleMessage = async (message) => {
  const context = analyzeMessageContext(message);
  const personas = getMentionedPersonas(message);
  
  for (const persona of personas) {
    const outcome = RPGSystem.calculateOutcome(persona, context);
    await generatePersonaResponse(persona, message, outcome);
  }
};
```

### 3. Managing Files
```javascript
const handleFileUpload = async (file) => {
  const content = await parseFileContent(file);
  const fileId = await knowledgeDB.addFile({
    name: file.name,
    content,
    type: file.type
  });
  return fileId;
}; 
```

## Design System

For detailed information about Gaia's design system including UI principles, visual language, responsive design patterns, and platform-specific guidelines, please refer to our dedicated [Design System Documentation](./DESIGN.md).

The design system covers:

- Core design principles (Clarity, Consistency, Efficiency, Flexibility)
- Visual language (Color system, Typography, Spacing, Elevation)
- Responsive design approach and breakpoints
- Accessibility guidelines
- Component design patterns
- Mobile-specific guidelines
- Apple platform considerations

Developers and designers should follow these guidelines to maintain a consistent user experience across all platforms and screen sizes.