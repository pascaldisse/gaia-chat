# Gaia — AI Persona Chat System

Gaia is an AI chat application with an RPG-style personality system. Each AI persona has distinct traits (initiative, empathy, talkativeness, curiosity, etc.) that shape its behavior and response style. Personas can use tools, generate images, and deliberate via a multi-attribute Hive Mind.

## Features

- **Multi-persona chat** — create and manage AI personas with custom system prompts, agent settings, and tool configurations.
- **RPG personality system** — 11 D20-style attributes (initiative, talkativeness, confidence, curiosity, empathy, etc.) with modifiers that influence response style.
- **Multi-provider LLM** — switch between chat providers and models in Settings. Supported providers: DeepInfra, DeepSeek, OpenAI, Anthropic, local OpenAI-compatible, and custom OpenAI-compatible endpoints.
- **Independent image generation** — image provider and model are selected separately from the chat LLM. Supported backends: DeepInfra (FLUX), OpenAI (GPT Image / DALL·E), Flux BFL, and local BFL-compatible.
- **Voice / TTS** — text-to-speech via DeepInfra (Zonos, Kokoro engines) with persona-specific voice settings.
- **Custom message formatting** — `<speech>`, `<action>`, and `<function>` tags for roleplay and structured output.
- **Tools (agent-callable)** — file search against uploaded knowledge files, web search (Tavily, DuckDuckGo), image generation, and dice roll. Tools are enabled per persona in agent settings.
- **Hive Mind** — multi-attribute deliberation where each attribute agent evaluates a query from its own perspective.
- **Persistence** — conversations and personas are stored client-side via IndexedDB (idb).
- **Knowledge files** — upload and search PDFs (pdfjs-dist) and text files for persona knowledge.

## Tech Stack

- **React 18** (functional components + hooks)
- **Vite 6** (build tool and dev server)
- **Vitest** (test runner)
- **IndexedDB** via idb (client-side persistence)
- **pdfjs-dist** (PDF parsing)

## Getting Started

### Prerequisites

- Node.js 18+ (Vite 6 requirement)
- npm

### Install

```bash
npm install
```

### Run (development)

```bash
npm run dev       # or: npm start
```

Opens on [http://localhost:3000](http://localhost:3000).

### Build (production)

```bash
npm run build     # output → build/
npm run preview   # preview production build locally
```

### Test

```bash
npm test          # runs Vitest
```

## Configuration

Gaia stores all configuration in the browser (localStorage). No `.env` file is required.

### Chat LLM provider

1. Open **Settings** in the app.
2. Under **Provider**, select one of: **DeepInfra**, **DeepSeek**, **OpenAI**, **Anthropic**, **Local OpenAI-Compatible**, or **Custom OpenAI-Compatible**.
3. Enter your API key for the selected provider.
4. Choose a model from the provider’s supported list (or enter a custom model ID where allowed).
5. For Local and Custom providers you can also set a custom base URL.

Provider and model selections, API keys, and base URLs are persisted in `localStorage`.

### Image provider

The image provider is configured independently from the chat LLM:

1. In Settings, under **Image Provider**, select: **DeepInfra**, **OpenAI**, **Flux (BFL)**, or **Local (BFL-Compatible)**.
2. Enter the API key for the chosen image provider.
3. Choose a model (e.g., FLUX-1-schnell, DALL·E 3, FLUX Pro 1.1, etc.).

### Voice (TTS)

TTS is available when using the **DeepInfra** chat provider. Personas can be assigned a voice ID and TTS engine (Zonos or Kokoro) via the persona editor.

## Project Structure

```
src/
├── components/       # React UI components
│   ├── admin/        # Admin/settings panels
│   ├── auth/         # Auth-related components
│   ├── GaiaHive/     # Hive Mind UI
│   └── personas/     # Persona creation and editing
├── config/           # Provider definitions, constants
├── context/          # React context providers (ProviderContext, etc.)
├── contexts/         # Additional contexts
├── docs/             # Documentation (API.md, DESIGN.md)
├── models/           # Data models (Persona)
├── services/         # Core services
│   ├── db.js         # IndexedDB persistence layer
│   ├── llmService.js # LLM chat completion (streaming)
│   ├── providerService.js  # Provider state management
│   ├── imageService.js     # Image generation
│   ├── voiceService.js     # TTS
│   ├── hiveMindService.js  # Hive Mind deliberation
│   └── tools.js      # Agent tools (search, dice, image gen)
├── styles/           # CSS
├── tests/            # Test files
└── utils/            # Utility functions
```

## License

Gaia is open source under the [MIT License](LICENSE).
