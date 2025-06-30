# Gaia - AI Persona Chat System

Gaia is an innovative AI chat application that implements a unique RPG-style personality system for AI agents. The system enables dynamic, personality-driven interactions between users and AI personas, each with distinct traits, capabilities, and behavior patterns.

![Gaia Project Banner](src/assets/banner.png)

## Latest Updates

- 🛡️ **CVE Security Scanner**: New vulnerability audit tool for Node.js, Python, and Flutter projects
- 🌐 **External API**: New API server for applications to access LLM capabilities
- 🔊 **Improved Audio System**: Fixed audio playback issues and added new debugging tools
- 🚀 **Server Persistence**: Enhanced restart script for continuous server operation
- 🎭 **Expanded Persona Customization**: Updated persona attribute editors with new features

## Features

- 🤖 **Multi-Persona Chat System**: Interact with multiple AI personas simultaneously
- 🎲 **RPG-Based Personality System**: Dynamic behavior generation using D20-based mechanics
- 📚 **Knowledge Integration**: Upload and manage knowledge files for personas
- 🎨 **Image Generation**: Create images using state-of-the-art AI models
- 🛠️ **Customizable Tools**: Configure agent capabilities and behaviors
- 🔊 **Enhanced Voice System**: Voice responses with multiple TTS engines and improved audio playback sequencing
- 🎭 **Message Formatting**: Custom formatting rules for roleplay and character actions
- ⚡ **Real-time Streaming**: Instant response streaming for better UX
- 🛡️ **CVE Security Scanner**: Automated vulnerability scanning for dependencies

## Quick Start

1. **Installation**
   ```bash
   # Clone the repository
   git clone https://github.com/yourusername/gaia.git
   cd gaia

   # Install dependencies
   npm install
   ```

2. **Configuration**
   - Copy configuration templates and add your API keys:
   ```bash
   # Frontend API keys
   cp src/config.keys.template.js src/config.keys.js
   
   # Server API keys
   cp server/config.keys.template.js server/config.keys.js
   
   # Edit both files to add your actual API keys
   ```
   
   - For other configuration:
   ```bash
   cp .env.example .env
   ```

3. **Run Development Server**
   ```bash
   npm start
   ```
   Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

## Available Scripts

- `npm start`: Run development server (React frontend)
- `npm test`: Launch test runner
- `npm run build`: Build for production
- `npm run server`: Run the API server only
- `npm run dev`: Run both the frontend and API server simultaneously
- `npm run eject`: Eject from Create React App
- `node test/test-cve-scanner.js`: Test CVE scanner functionality
- `node server/cve-api/index.js`: Start CVE scanner API server

## Documentation

- [API Documentation](src/docs/API.md): Comprehensive system documentation
- [Design System](src/docs/DESIGN.md): UI design principles and guidelines
- [Component Guide](src/docs/API.md#ui-components): UI component documentation
- [Best Practices](src/docs/API.md#best-practices): Development guidelines
- [Examples](src/docs/API.md#examples): Code examples and usage patterns
- [Server API](server/README.md): External API server documentation

## Architecture

Gaia is built with a modular architecture:

```
/
├── src/                # React frontend application
│   ├── components/     # React UI components
│   ├── services/       # Core services and APIs
│   ├── utils/          # Utility functions
│   ├── models/         # Data models
│   ├── config/         # Configuration
│   ├── styles/         # CSS styles
│   └── docs/           # Documentation
│
└── server/             # API Server
    ├── routes/         # API route definitions
    ├── controllers/    # Request handlers
    ├── services/       # Business logic
    └── examples/       # Example API clients
```

## Core Components

### Persona System
The heart of Gaia is its persona system, allowing creation and management of AI personalities with customizable traits:

```javascript
const persona = new Persona({
  name: "Assistant",
  systemPrompt: "You are a helpful AI assistant",
  model: MODELS.LLAMA3_70B,
  initiative: 7,
  empathy: 8,
  voiceId: "american_female",
  formatSettings: {
    useRoleplayMarkdown: true,
    customFormatting: true,
    formatRules: [
      {
        name: "Speech",
        startTag: "<speech>",
        endTag: "</speech>",
        markdownFormat: "**{{content}}**",
        enabled: true
      }
    ]
  }
});
```

### RPG Mechanics
Unique D20-based system for generating dynamic behaviors:
- 11 distinct attributes (initiative, talkativeness, confidence, curiosity, empathy, etc.)
- Attribute modifiers affecting response style
- Context-aware responses
- Personality-driven interactions

### Voice System
Enhanced text-to-speech capabilities for more immersive experiences:
- Multiple voice engines: Zonos (high quality) and Kokoro (fast)
- Diverse voice options with different accents and genders
- Persona-specific voice settings
- Fixed audio playback sequence bugs to ensure smooth playback
- Enhanced debug UI for voice settings and audio troubleshooting
- Reliable audio chunk processing with improved error handling

### Message Formatting
Custom message formatting system for roleplay and structured outputs:
- Roleplay markdown for actions and speech
- Custom tag-based formatting
- Templated formatting rules for different content types

## Models

Gaia supports multiple AI models:

### Chat Models
- LLAMA3 70B
- Mixtral 8x22B
- DeepSeek V3/R1
- DBRX

### Image Models
- FLUX Schnell
- FLUX Dev

## Development

### Prerequisites
- Node.js 16+
- npm or yarn
- Modern web browser

### Setup Development Environment
1. Install dependencies
   ```bash
   npm install
   ```

2. Start development server
   ```bash
   # Start just the React frontend
   npm start
   
   # Start just the API server
   npm run server
   
   # Start both frontend and API server
   npm run dev
   ```

3. Run tests
   ```bash
   npm test
   ```

4. For production deployment with auto-restart
   ```bash
   # Start the server with persistence
   ./restart.sh
   
   # The server will automatically restart if it crashes
   ```

### API Server

The new API server allows external applications to access Gaia's LLM capabilities:

```javascript
// Example: Chat with an LLM
const response = await fetch('http://localhost:5000/api/llm/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your_api_key'
  },
  body: JSON.stringify({
    model: 'meta-llama/Meta-Llama-3-70B-Instruct',
    messages: [
      { role: 'user', content: 'What is machine learning?' }
    ]
  })
});

const data = await response.json();
console.log(data.message);
```

See the [API documentation](server/README.md) for more details.

## CVE Security Scanner

Gaia includes a powerful CVE (Common Vulnerabilities and Exposures) scanner designed specifically for startups and small teams. Unlike enterprise security tools, our scanner offers transparent, affordable pricing without minimum seat requirements.

### Features

- **Multi-Language Support**: Scans Node.js, Python, and Flutter/Dart projects
- **Intelligent Remediation**: Provides specific version recommendations with breaking change warnings
- **Multiple Report Formats**: JSON, HTML, Markdown, CSV, and SARIF (GitHub/VS Code compatible)
- **CI/CD Integration**: GitHub Actions workflow with configurable severity thresholds
- **RESTful API**: Remote scanning capabilities for automation

### Quick Start

1. **Run a scan on your project**:
   ```bash
   node test/test-cve-scanner.js
   ```

2. **Start the CVE API server**:
   ```bash
   node server/cve-api/index.js
   ```

3. **Scan via API**:
   ```bash
   curl -X POST http://localhost:3001/scan \
     -H "Content-Type: application/json" \
     -d '{"projectPath": "./my-project"}'
   ```

### Pricing

- **Free**: 10 scans/month - Perfect for personal projects
- **Startup**: $9/month for 100 scans - Ideal for small teams
- **Growth**: $29/month for 500 scans - For growing companies
- **Enterprise**: $99/month unlimited - Full API access and support

### Example Output

```
📊 Scan Results:
================
Critical: 0
High: 2
Medium: 3
Low: 1

📦 lodash @ 4.17.11 (npm)
  - CVE-2019-10744: Prototype Pollution in lodash
    Severity: HIGH (CVSS: 7.5)
    Fixed in: 4.17.19
  💡 Remediation:
     ➡️ npm install lodash@4.17.21
```

### Integration with CI/CD

Add to your GitHub Actions workflow:

```yaml
- name: CVE Security Scan
  run: |
    npm install
    node test/test-cve-scanner.js
```

The scanner will fail the build if critical or high severity vulnerabilities are found.

## Contributing

1. Fork the repository
2. Create your feature branch
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. Commit your changes
   ```bash
   git commit -m 'Add amazing feature'
   ```
4. Push to the branch
   ```bash
   git push origin feature/amazing-feature
   ```
5. Open a Pull Request

## License

Gaia is open source software [licensed under the MIT license](LICENSE). The MIT License is a permissive license that is short and to the point. It lets people do anything they want with your code as long as they provide attribution back to you and don't hold you liable.

### What you can do with this code:
- ✅ Commercial use
- ✅ Modify
- ✅ Distribute
- ✅ Private use

### Requirements:
- ℹ️ License and copyright notice

### Limitations:
- ⚠️ No liability
- ⚠️ No warranty

See the [LICENSE](LICENSE) file for the full license text.

## Acknowledgments

- Create React App for the initial project setup
- All the amazing open-source libraries used in this project
- The AI/ML community for their continuous innovations

## Support

For support, please:
1. Check the [documentation](src/docs/API.md)
2. Open an issue
3. Join our community Discord

---

Built with ❤️ using React and AI
