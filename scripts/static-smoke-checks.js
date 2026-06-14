const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function readAllSourceFiles() {
  const sourceRoot = path.join(root, 'src');
  const files = [];

  function walk(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (/\.(js|jsx|ts|tsx|css|md)$/.test(entry.name)) {
        files.push(fullPath);
      }
    }
  }

  walk(sourceRoot);
  return files.map(file => fs.readFileSync(file, 'utf8')).join('\n');
}

const source = readAllSourceFiles();

const checks = [
  {
    name: 'GaiaScript artifacts are removed',
    run() {
      return !exists('chat.gaia') && !exists('build-chat.sh');
    }
  },
  {
    name: 'No checked-in DeepInfra bearer token',
    run() {
      return !source.includes('u5q1opMM9uw9x84EJLtxqaQ6HcnXbUAq');
    }
  },
  {
    name: 'Generated messages do not use raw HTML injection',
    run() {
      return !source.includes('dangerouslySetInnerHTML');
    }
  },
  {
    name: 'Web search state is not stored on window',
    run() {
      return !source.includes('window.webSearchEnabled');
    }
  },
  {
    name: 'Removed stale SDXL image model reference',
    run() {
      return !source.includes('IMAGE_MODELS.SDXL');
    }
  },
  {
    name: 'Workflow memory tool does not call missing persistence API',
    run() {
      return !source.includes('savePersistentMemory');
    }
  },
  {
    name: 'RPG dice helper exists',
    run() {
      return read('src/utils/RPGSystem.js').includes('static rollDice');
    }
  },
  {
    name: 'Duplicate utility Persona model is removed',
    run() {
      return !exists('src/utils/Persona.js') && !source.includes("from '../utils/Persona'");
    }
  },
  {
    name: 'Voice service does not register global debug patch',
    run() {
      return !source.includes('debugGaiaAudio') && !source.includes('trackAllAudio');
    }
  },
  {
    name: 'Chat storage sanitizer is active',
    run() {
      return read('src/services/db.js').includes('sanitizeChatForStorage');
    }
  },
  {
    name: 'Anthropic, local, and custom providers are configured',
    run() {
      const providers = read('src/config/providers.js');
      return providers.includes('anthropic') &&
        providers.includes('local') &&
        providers.includes('custom') &&
        providers.includes("apiType: 'anthropic'") &&
        providers.includes("apiType: 'openai-compatible'");
    }
  },
  {
    name: 'Hive Mind uses direct provider client',
    run() {
      const hiveMind = read('src/services/hiveMindService.js');
      return hiveMind.includes('streamChatCompletion') &&
        !hiveMind.includes('ChatOpenAI') &&
        !hiveMind.includes('ChatPromptTemplate');
    }
  },
  {
    name: 'Legacy LangChain and AgentFlow code is removed',
    run() {
      const packageJson = read('package.json');
      return !packageJson.includes('langchain') &&
        !packageJson.includes('reactflow') &&
        !exists('src/services/agentService.js') &&
        !exists('src/services/agentFlow') &&
        !exists('src/components/AgentFlow');
    }
  }
];

let failed = false;

for (const check of checks) {
  const ok = check.run();
  console.log(`${ok ? 'PASS' : 'FAIL'} ${check.name}`);
  if (!ok) failed = true;
}

if (failed) {
  process.exitCode = 1;
}
