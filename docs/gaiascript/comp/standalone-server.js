/**
 * GaiaScript Standalone Server
 * A simple HTTP server to serve the GaiaScript application
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// Configuration
const PORT = process.env.PORT || 4004;
const PUBLIC_DIR = path.join(__dirname, '..', 'build');
const GAIA_FILE = path.join(__dirname, '..', 'main', 'main.gaia');

// Ensure public directory exists
if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

// MIME types for different file extensions
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain'
};

// Read and parse the GaiaScript file
function parseGaiaScript(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Enhanced parser to extract all components and UI definitions
    const components = {};
    
    // Extract all component definitions using regex
    const componentRegex = /C〈([^〉]+)〉([^:]+):⟨\{([\s\S]*?)\}⟩/g;
    let match;
    
    while ((match = componentRegex.exec(content)) !== null) {
      const [fullMatch, componentId, componentName, componentBody] = match;
      components[componentName.trim()] = {
        id: componentId.trim(),
        name: componentName.trim(),
        body: fullMatch,
        raw: componentBody
      };
      console.log(`Parsed component: ${componentName.trim()}`);
    }
    
    // Extract UI framework definition
    const uiMatch = content.match(/UI〈([^〉]+)〉([\s\S]*?)(?=C〈|$)/);
    const uiDefinition = uiMatch ? uiMatch[0] : null;
    
    // Extract theme information
    const themeMatch = content.match(/theme:\{([\s\S]*?)\}/);
    const themeDefinition = themeMatch ? themeMatch[1] : null;
    
    // Log what we found
    console.log(`Found ${Object.keys(components).length} components`);
    if (uiDefinition) console.log('Found UI definition');
    if (themeDefinition) console.log('Found theme definition');
    
    return {
      components,
      content,
      ui: uiDefinition,
      theme: themeDefinition
    };
  } catch (error) {
    console.error('Error parsing GaiaScript file:', error);
    return { components: {}, content: '', ui: null, theme: null };
  }
}

// Create web files based on GaiaScript content
function generateWebFiles() {
  console.log('Processing GaiaScript and generating web files...');
  
  // Parse GaiaScript
  const gaia = parseGaiaScript(GAIA_FILE);
  
  // Create HTML file
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GaiaChat</title>
  <link rel="stylesheet" href="styles.css">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🌍</text></svg>">
</head>
<body>
  <div id="app"></div>
  <script src="gaia-ui-runtime.js"></script>
  <script src="app.js"></script>
</body>
</html>`;
  
  fs.writeFileSync(path.join(PUBLIC_DIR, 'index.html'), html);
  
  // Create CSS file based on GaiaScript styles
  const css = `/* GaiaScript Generated Styles */
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  margin: 0;
  padding: 0;
  background-color: #f5f5f5;
}

#app {
  height: 100vh;
  width: 100%;
}

.app-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Chat container */
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  position: relative;
}

/* Messages area */
.messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background-color: #f5f5f5;
  display: flex;
  flex-direction: column;
}

.message {
  margin: 10px 0;
  padding: 15px;
  border-radius: 12px;
  max-width: 80%;
  position: relative;
  word-break: break-word;
}

.user-message {
  background-color: #0084ff;
  color: white;
  align-self: flex-end;
  margin-left: auto;
}

.ai-message {
  background-color: white;
  color: #333;
  align-self: flex-start;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.message-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
  gap: 5px;
}

.message-actions button {
  padding: 4px 8px;
  min-width: 30px;
  font-size: 12px;
}

.command-message {
  background-color: #f0f0f0;
  color: #666;
  font-style: italic;
  align-self: center;
  margin: 5px 0;
  padding: 8px 12px;
  border-radius: 8px;
  max-width: 80%;
}

.persona-name {
  font-weight: bold;
  margin-bottom: 5px;
  font-size: 14px;
  color: #555;
}

/* Input area */
.chat-input-container {
  padding: 10px;
  border-top: 1px solid #e6e6e6;
  background-color: white;
}

.simple-input-container {
  display: flex;
  align-items: center;
}

.chat-textarea {
  flex: 1;
  padding: 12px;
  border-radius: 20px;
  border: 1px solid #e6e6e6;
  resize: none;
  font-size: 14px;
  min-height: 40px;
  font-family: inherit;
}

/* General button styles */
button {
  padding: 8px 16px;
  background-color: #0084ff;
  color: white;
  border: none;
  border-radius: 20px;
  margin-left: 10px;
  cursor: pointer;
  font-size: 14px;
}

button:hover {
  background-color: #0077e6;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Participants panel */
.participants-toggle {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 10;
  padding: 5px 10px;
  border-radius: 50%;
  min-width: 30px;
  min-height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.participants-panel {
  position: absolute;
  top: 0;
  right: 0;
  width: 250px;
  height: 100%;
  background-color: white;
  box-shadow: -2px 0 10px rgba(0,0,0,0.1);
  z-index: 20;
  transform: translateX(100%);
  transition: transform 0.3s ease;
}

.participants-panel.visible {
  transform: translateX(0);
}

.participants-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid #eee;
}

.participants-title {
  font-weight: bold;
}

.participants-close {
  padding: 5px 10px;
  background: none;
  color: #666;
  font-size: 18px;
}

.participants-list {
  padding: 15px;
}

.participants-section {
  font-weight: bold;
  margin-bottom: 10px;
  color: #666;
}

.participant {
  display: flex;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f5f5f5;
}

.participant-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  margin-right: 10px;
  object-fit: cover;
}

.participant-name {
  flex: 1;
}

.participant-remove {
  background: none;
  color: #999;
  font-size: 16px;
  padding: 2px 6px;
}

/* Knowledge base */
.knowledge-base {
  border-top: 1px solid #e6e6e6;
  background-color: white;
}

.knowledge-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  cursor: pointer;
}

.knowledge-title {
  font-weight: bold;
}

.knowledge-toggle {
  background: none;
  color: #666;
}

.knowledge-files {
  padding: 15px;
  max-height: 200px;
  overflow-y: auto;
}

.file-preview {
  background-color: #f9f9f9;
  border-radius: 8px;
  margin-bottom: 10px;
  overflow: hidden;
}

.file-preview .header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background-color: #f0f0f0;
}

.file-info {
  flex: 1;
}

.file-name {
  font-weight: bold;
  margin-bottom: 3px;
}

.file-type {
  font-size: 12px;
  color: #666;
}

.delete-button {
  background: none;
  color: #999;
  font-size: 16px;
  padding: 2px 6px;
}

.preview {
  padding: 10px;
  font-size: 14px;
  color: #666;
}

.upload-button {
  width: 100%;
  text-align: center;
  margin-top: 10px;
  background-color: #f5f5f5;
  color: #333;
}

/* Debug log */
.debug-toggle {
  align-self: flex-end;
  margin: 10px;
  background-color: #666;
}

.debug-log {
  background-color: #333;
  color: #f0f0f0;
  padding: 10px;
  font-family: monospace;
  overflow-y: auto;
  max-height: 200px;
}

.debug-log .header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.debug-log .title {
  font-weight: bold;
}

.log-entry {
  margin-bottom: 10px;
  border-bottom: 1px solid #555;
  padding-bottom: 8px;
}

.log-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
  font-size: 12px;
}

.log-type {
  color: #ffc107;
}

.log-time {
  color: #aaa;
}

.log-content {
  margin: 0;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-word;
}

/* Suggestions (mentions) */
.suggestions {
  position: absolute;
  bottom: 100%;
  left: 0;
  background-color: white;
  border: 1px solid #e6e6e6;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  max-height: 200px;
  overflow-y: auto;
  width: 100%;
  z-index: 10;
}

.suggestion {
  padding: 8px 12px;
  cursor: pointer;
}

.suggestion:hover, .suggestion.selected {
  background-color: #f0f0f0;
}

/* Counter component */
.counter {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
}

.buttons {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}`;
  
  fs.writeFileSync(path.join(PUBLIC_DIR, 'styles.css'), css);
  
  // Create GaiaUI runtime implementation
  const runtime = `/**
 * GaiaUI Runtime
 * A minimal JavaScript runtime for GaiaScript
 */

(function() {
  // Symbol mapping for GaiaScript
  const symbols = {
    'П': 'div',             // Panel
    '⊞': 'grid',            // Grid
    '⌘': 'button',          // Button
    '⌑': 'text',            // Label
    '∮': 'canvas',          // Canvas
    '⌤': 'input',           // Input
    '⇄': 'bind',            // Data binding
    '⊕': 'increment',       // Increment
    '⊝': 'decrement',       // Decrement
    '⊜': 'assign'           // Assign
  };

  // Core GaiaUI functions
  window.GaiaUI = {
    createElement: function(type, props = {}, ...children) {
      // Map GaiaScript symbols to HTML elements if necessary
      const htmlType = symbols[type] || type;
      const element = document.createElement(htmlType === 'text' ? 'span' : htmlType);
      
      // Apply properties and event handlers
      for (const [key, value] of Object.entries(props)) {
        if (key === 'className' || key === 'class') {
          element.className = value;
        } else if (key.startsWith('on') && typeof value === 'function') {
          const eventName = key.substring(2).toLowerCase();
          element.addEventListener(eventName, value);
        } else if (key === 'style' && typeof value === 'object') {
          Object.assign(element.style, value);
        } else if (key === 'disabled') {
          if (value) element.setAttribute('disabled', 'disabled');
        } else {
          element.setAttribute(key, value);
        }
      }
      
      // Add children
      children.flat().forEach(child => {
        if (child === null || child === undefined) return;
        
        element.appendChild(
          typeof child === 'string' ? document.createTextNode(child) : child
        );
      });
      
      return element;
    },
    
    createStore: function(initialState = {}) {
      let state = { ...initialState };
      const subscribers = [];
      
      return {
        get: function() {
          return { ...state };
        },
        set: function(update) {
          state = typeof update === 'function' 
            ? update({ ...state }) 
            : { ...state, ...update };
          
          subscribers.forEach(callback => callback(state));
        },
        subscribe: function(callback) {
          subscribers.push(callback);
          callback(state);
          
          return function() {
            const index = subscribers.indexOf(callback);
            if (index !== -1) subscribers.splice(index, 1);
          };
        }
      };
    },
    
    render: function(component, container) {
      const root = typeof container === 'string' 
        ? document.querySelector(container) 
        : container;
      
      if (!root) return false;
      
      root.innerHTML = '';
      root.appendChild(component);
      
      return true;
    }
  };
})();`;
  
  fs.writeFileSync(path.join(PUBLIC_DIR, 'gaia-ui-runtime.js'), runtime);
  
  // Create app JS - Compiled from the GaiaScript
  // Build a more comprehensive app that includes all components
  const app = `// GaiaScript App - Compiled from main.gaia

// Define component registry
const GaiaComponents = {};

// Chat Application
document.addEventListener('DOMContentLoaded', () => {
  // State management based on application definition
  const initialState = {
    currentChat: [],
    personas: [
      {id:"1", name:"Gaia", image:"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='%230084ff'/%3E%3Ctext x='50' y='70' text-anchor='middle' font-size='60' fill='white'%3E🌍%3C/text%3E%3C/svg%3E", model:"llama3-70b", systemPrompt:"You are Gaia, a helpful AI assistant.", isDefault:true},
      {id:"2", name:"Sage", image:"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='%23a64dff'/%3E%3Ctext x='50' y='70' text-anchor='middle' font-size='60' fill='white'%3E🧠%3C/text%3E%3C/svg%3E", model:"llama3-70b", systemPrompt:"You are Sage, a wise and philosophical AI."},
      {id:"3", name:"Guru", image:"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='%23ff4d4d'/%3E%3Ctext x='50' y='70' text-anchor='middle' font-size='60' fill='white'%3E💡%3C/text%3E%3C/svg%3E", model:"llama3-70b", systemPrompt:"You are Guru, a technical expert AI."}
    ],
    activePersonas: [],
    isLoading: false,
    chatHistory: [],
    knowledgeFiles: [],
    showKnowledgeBase: false,
    showParticipants: false,
    showDebugLog: false,
    debugLog: [],
    inputValue: "",
    rpgSystem: null,
    showSuggestions: false,
    filteredSuggestions: [],
    mentionStartIndex: null,
    selectedSuggestionIndex: 0,
    webSearchEnabled: false
  };
  
  // Create the store
  const store = GaiaUI.createStore(initialState);
  
  // Initialize state with default persona
  const state = store.get();
  state.activePersonas = [state.personas.find(p => p.isDefault) || state.personas[0]];
  store.set(state);
  
  // Create main app container
  const appElement = GaiaUI.createElement('div', { className: 'app-container' });
  
  // Create component registry
  ${Object.keys(gaia.components).map(componentName => `
  // Register ${componentName} component
  GaiaComponents.${componentName} = {
    render: function(props) {
      // Create component element
      const elem = GaiaUI.createElement('div', { 
        className: '${componentName}-component',
        'data-component': '${componentName}'
      });
      
      // Add component specific rendering
      switch('${componentName}') {
        case 'message':
        case 'messageFormatter':
          renderMessage(elem, props);
          break;
        case 'chatInput':
          renderChatInput(elem, props);
          break;
        case 'chat':
          renderChat(elem, props);
          break;
        case 'filePreview':
        case 'knowledgeBase':
          renderFilePreview(elem, props);
          break; 
        case 'debugLog':
          renderDebugLog(elem, props);
          break;
        case 'rpgSystem':
          elem.textContent = 'RPG System Component';
          break;
        case 'voiceSystem':
          elem.textContent = 'Voice System Component';
          break;
        default:
          elem.textContent = 'Component ${componentName}';
      }
      
      return elem;
    }
  };
  `).join('\n')}
  
  // ==========================================
  // Component Rendering Functions
  // ==========================================
  
  // Render Message Component
  function renderMessage(container, props) {
    const { content, isUser, personaId, timestamp, onRegenerate, isCommand, personas = [] } = props;
    
    // Find persona if available
    const persona = personaId ? personas.find(p => p.id === personaId) : null;
    
    // Create message element with appropriate class
    const messageClass = isCommand 
      ? "message command-message" 
      : (isUser
          ? "message user-message"
          : "message ai-message");
          
    container.className = messageClass;
    
    // Show persona name for AI messages
    if (!isUser && !isCommand && persona) {
      const personaHeader = GaiaUI.createElement('div', { className: 'persona-name' }, persona.name);
      container.appendChild(personaHeader);
    }
    
    // Show content
    const contentElem = GaiaUI.createElement('div', { className: 'message-content' });
    
    // Check if it's an image
    if (content && content.match(/^https?:\\/\\/.+\\.(png|jpg|jpeg|gif|webp)$/i)) {
      const img = GaiaUI.createElement('img', { 
        src: content,
        className: 'message-image',
        alt: 'Image from ' + (persona ? persona.name : 'AI')
      });
      contentElem.appendChild(img);
    } else {
      // Apply basic markdown-like formatting
      const formattedContent = content
        .replace(/\\*\\*(.+?)\\*\\*/g, '<strong>$1</strong>') // Bold
        .replace(/\\*(.+?)\\*/g, '<em>$1</em>') // Italic
        .replace(/\\n/g, '<br>'); // Newlines
      
      contentElem.innerHTML = formattedContent;
    }
    
    container.appendChild(contentElem);
    
    // Add action buttons for AI messages
    if (!isUser && !isCommand) {
      const actionsDiv = GaiaUI.createElement('div', { className: 'message-actions' });
      
      // Copy button
      const copyBtn = GaiaUI.createElement('button', {
        className: 'copy-button',
        title: 'Copy to clipboard',
        onclick: () => {
          navigator.clipboard.writeText(content)
            .then(() => alert('Copied to clipboard!'))
            .catch(err => console.error('Failed to copy:', err));
        }
      }, '📋');
      
      actionsDiv.appendChild(copyBtn);
      
      // Regenerate button (if handler provided)
      if (onRegenerate) {
        const regenBtn = GaiaUI.createElement('button', {
          className: 'regenerate-button',
          title: 'Regenerate response',
          onclick: () => onRegenerate({
            id: Date.now(),
            content: content,
            isUser: isUser,
            personaId: personaId
          })
        }, '🔄');
        
        actionsDiv.appendChild(regenBtn);
      }
      
      container.appendChild(actionsDiv);
    }
  }
  
  // Render Simple ChatInput Component - Minimal version to avoid conflicts
  function renderChatInput(container, props) {
    const { onSendMessage, isLoading = false, onCancel } = props;
    
    container.className = 'chat-input-container';
    
    // Create a very simple input layout - just textarea and button
    const simpleInput = GaiaUI.createElement('div', { className: 'simple-input-container' });
    
    // Very simple textarea
    const textarea = GaiaUI.createElement('textarea', {
      placeholder: 'Type your message...',
      className: 'chat-textarea',
      disabled: isLoading
    });
    
    // Simple send button
    const sendBtn = GaiaUI.createElement('button', {
      className: 'send-button',
      disabled: isLoading,
      onclick: () => {
        if (textarea.value.trim() && onSendMessage) {
          onSendMessage(textarea.value);
          textarea.value = '';
        }
      }
    }, isLoading ? 'Sending...' : 'Send');
    
    // Add elements to container
    simpleInput.appendChild(textarea);
    simpleInput.appendChild(sendBtn);
    
    // Cancel button (if loading)
    if (isLoading && onCancel) {
      const cancelButton = GaiaUI.createElement('button', {
        type: 'button',
        className: 'cancel-button',
        onclick: onCancel
      }, 'Cancel');
      
      simpleInput.appendChild(cancelButton);
    }
    
    container.appendChild(simpleInput);
    return container;
  }
  
  // Render FilePreview Component
  function renderFilePreview(container, props) {
    const { fileId, fileName, fileType, onDelete } = props;
    
    container.className = 'file-preview';
    
    // Header with file info and delete button
    const header = GaiaUI.createElement('div', { className: 'header' });
    
    // File info
    const fileInfo = GaiaUI.createElement('div', { className: 'file-info' });
    fileInfo.appendChild(GaiaUI.createElement('div', { className: 'file-name' }, fileName || 'Unknown file'));
    fileInfo.appendChild(GaiaUI.createElement('div', { className: 'file-type' }, fileType || ''));
    
    header.appendChild(fileInfo);
    
    // Delete button
    const deleteBtn = GaiaUI.createElement('button', {
      className: 'delete-button',
      title: 'Delete file',
      onclick: () => {
        if (onDelete) onDelete(fileId);
      }
    }, '×');
    
    header.appendChild(deleteBtn);
    container.appendChild(header);
    
    // Preview placeholder
    const preview = GaiaUI.createElement('div', { className: 'preview' }, 
      'File preview for ' + (fileName || fileId || 'Unknown file')
    );
    container.appendChild(preview);
  }
  
  // Render DebugLog Component
  function renderDebugLog(container, props) {
    const { logs = [] } = props;
    
    container.className = 'debug-log';
    
    // Header with title
    const header = GaiaUI.createElement('div', { className: 'header' });
    header.appendChild(GaiaUI.createElement('div', { className: 'title' }, 'Debug Log'));
    container.appendChild(header);
    
    // Log entries
    if (logs.length === 0) {
      container.appendChild(GaiaUI.createElement('div', { className: 'no-logs' }, 'No logs available'));
    } else {
      const logsList = GaiaUI.createElement('div', { className: 'logs-list' });
      
      logs.forEach(log => {
        const entry = GaiaUI.createElement('div', { className: 'log-entry' });
        
        // Log header with type and time
        const logHeader = GaiaUI.createElement('div', { className: 'log-header' });
        logHeader.appendChild(GaiaUI.createElement('span', { className: 'log-type' }, log.type));
        
        const time = new Date(log.timestamp).toLocaleTimeString();
        logHeader.appendChild(GaiaUI.createElement('span', { className: 'log-time' }, time));
        
        entry.appendChild(logHeader);
        
        // Log content
        let content = log.data;
        if (typeof content !== 'string') {
          try {
            content = JSON.stringify(content, null, 2);
          } catch (e) {
            content = String(content);
          }
        }
        
        entry.appendChild(GaiaUI.createElement('pre', { className: 'log-content' }, content));
        logsList.appendChild(entry);
      });
      
      container.appendChild(logsList);
    }
  }
  
  // Render Chat Component (Main container)
  function renderChat(container, props) {
    const { 
      currentChat = [], 
      personas = [], 
      activePersonas = [],
      setActivePersonas,
      setCurrentChat,
      onSendMessage,
      onRegenerate
    } = props;
    
    const state = store.get();
    
    container.className = 'chat-container';
    
    // Participants toggle
    const participantsToggle = GaiaUI.createElement('button', {
      className: 'participants-toggle',
      title: state.showParticipants ? 'Hide participants' : 'Show participants',
      onclick: () => {
        store.set({ showParticipants: !state.showParticipants });
      }
    }, '👥');
    
    container.appendChild(participantsToggle);
    
    // Participants panel
    const participantsPanel = GaiaUI.createElement('div', { 
      className: 'participants-panel' + (state.showParticipants ? ' visible' : ''),
      style: { transform: state.showParticipants ? 'translateX(0)' : 'translateX(100%)' }
    });
    
    const panelHeader = GaiaUI.createElement('div', { className: 'participants-header' });
    panelHeader.appendChild(GaiaUI.createElement('div', { className: 'participants-title' }, 'Active Participants'));
    
    const closeBtn = GaiaUI.createElement('button', {
      className: 'participants-close',
      onclick: () => store.set({ showParticipants: false })
    }, '×');
    
    panelHeader.appendChild(closeBtn);
    participantsPanel.appendChild(panelHeader);
    
    // Participants list
    const participantsList = GaiaUI.createElement('div', { className: 'participants-list' });
    participantsList.appendChild(GaiaUI.createElement('div', { className: 'participants-section' }, 'Personas'));
    
    // Add active personas
    activePersonas.forEach(persona => {
      const item = GaiaUI.createElement('div', { className: 'participant' });
      
      const avatar = GaiaUI.createElement('img', {
        src: persona.image || '/default-avatar.png',
        className: 'participant-avatar',
        alt: persona.name
      });
      
      item.appendChild(avatar);
      item.appendChild(GaiaUI.createElement('div', { className: 'participant-name' }, persona.name));
      
      const removeBtn = GaiaUI.createElement('button', {
        className: 'participant-remove',
        onclick: () => {
          if (setActivePersonas) {
            setActivePersonas(activePersonas.filter(p => p.id !== persona.id));
          }
        }
      }, '×');
      
      item.appendChild(removeBtn);
      participantsList.appendChild(item);
    });
    
    participantsPanel.appendChild(participantsList);
    container.appendChild(participantsPanel);
    
    // Messages container
    const messages = GaiaUI.createElement('div', { className: 'messages' });
    
    // Render each message
    currentChat.forEach(message => {
      const messageElem = GaiaComponents.message.render({
        content: message.content,
        isUser: message.isUser,
        personaId: message.personaId,
        timestamp: message.timestamp,
        isCommand: message.isCommand,
        onRegenerate: onRegenerate,
        personas: personas
      });
      
      messages.appendChild(messageElem);
    });
    
    container.appendChild(messages);
    
    // Debug toggle
    const debugToggle = GaiaUI.createElement('button', {
      className: 'debug-toggle',
      onclick: () => store.set({ showDebugLog: !state.showDebugLog })
    }, state.showDebugLog ? 'Hide Debug' : 'Show Debug');
    
    container.appendChild(debugToggle);
    
    // Debug log (if visible)
    if (state.showDebugLog) {
      const debugLogElem = GaiaComponents.debugLog.render({ logs: state.debugLog });
      container.appendChild(debugLogElem);
    }
    
    // Knowledge base toggle
    const knowledgeBase = GaiaUI.createElement('div', { className: 'knowledge-base' });
    
    const knowledgeHeader = GaiaUI.createElement('div', { className: 'knowledge-header' });
    knowledgeHeader.appendChild(GaiaUI.createElement('div', { className: 'knowledge-title' }, 'Knowledge Base'));
    
    const knowledgeToggle = GaiaUI.createElement('button', {
      className: 'knowledge-toggle',
      onclick: () => store.set({ showKnowledgeBase: !state.showKnowledgeBase })
    }, state.showKnowledgeBase ? '▲' : '▼');
    
    knowledgeHeader.appendChild(knowledgeToggle);
    knowledgeBase.appendChild(knowledgeHeader);
    
    // Knowledge files list (if visible)
    if (state.showKnowledgeBase) {
      const filesList = GaiaUI.createElement('div', { className: 'knowledge-files' });
      
      state.knowledgeFiles.forEach(file => {
        const filePreview = GaiaComponents.filePreview.render({
          fileId: file.id,
          fileName: file.name,
          fileType: file.type,
          onDelete: (id) => {
            store.set({ 
              knowledgeFiles: state.knowledgeFiles.filter(f => f.id !== id) 
            });
            
            // Add a command message for deletion
            if (setCurrentChat) {
              const deletedFile = state.knowledgeFiles.find(f => f.id === id);
              const commandMessage = {
                id: Date.now(),
                content: \`🗑️ Removed file: \${deletedFile ? deletedFile.name : id}\`,
                isUser: false,
                isCommand: true,
                personaId: activePersonas.length > 0 ? activePersonas[0].id : null
              };
              
              setCurrentChat([...currentChat, commandMessage]);
            }
          }
        });
        
        filesList.appendChild(filePreview);
      });
      
      // Upload button
      const uploadBtn = GaiaUI.createElement('button', {
        className: 'upload-button',
        onclick: () => {
          // Create a file input element
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = '.pdf,.doc,.docx,.txt,.png,.jpg,.jpeg';
          
          // Handle file selection
          input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
              // Add file to knowledge base
              const fileId = Date.now().toString();
              const newFile = {
                id: fileId,
                name: file.name,
                type: file.type
              };
              
              // Add to state
              store.set({ 
                knowledgeFiles: [...state.knowledgeFiles, newFile] 
              });
              
              // Add a command message for upload
              if (setCurrentChat) {
                const commandMessage = {
                  id: Date.now(),
                  content: \`📎 File uploaded: \${file.name}\`,
                  isUser: false,
                  isCommand: true,
                  personaId: activePersonas.length > 0 ? activePersonas[0].id : null
                };
                
                setCurrentChat([...currentChat, commandMessage]);
              }
            }
          };
          
          // Trigger file dialog
          input.click();
        }
      }, '📎 Upload File');
      
      filesList.appendChild(uploadBtn);
      knowledgeBase.appendChild(filesList);
    }
    
    container.appendChild(knowledgeBase);
    
    // Chat input (render directly instead of using component to avoid circular dependency)
    const chatInputElem = renderChatInput(GaiaUI.createElement('div'), {
      onSendMessage: (message) => {
        if (onSendMessage) {
          onSendMessage(message);
        } else {
          // Default behavior if no handler provided
          if (setCurrentChat) {
            // Add user message
            const userMessage = {
              id: Date.now(),
              content: message,
              isUser: true,
              timestamp: new Date().toISOString()
            };
            
            setCurrentChat([...currentChat, userMessage]);
            
            // Generate simple AI response
            setTimeout(() => {
              const personaId = activePersonas.length > 0 ? activePersonas[0].id : null;
              
              const responses = [
                \`I understand your question about \${message.substring(0, 20)}...\`,
                \`That's an interesting point about \${message.substring(0, 15)}...\`,
                \`Let me think about \${message.substring(0, 10)}...\`,
                \`I'd be happy to help with \${message.substring(0, 25)}...\`
              ];
              
              const aiResponse = {
                id: Date.now(),
                content: responses[Math.floor(Math.random() * responses.length)],
                isUser: false,
                personaId,
                timestamp: new Date().toISOString()
              };
              
              setCurrentChat([...currentChat, userMessage, aiResponse]);
            }, 1000);
          }
        }
      },
      isLoading: state.isLoading,
      onCancel: () => {
        store.set({ isLoading: false });
      },
      onToggleSearch: (enabled) => {
        store.set({ webSearchEnabled: enabled });
        
        // Add a command message
        if (setCurrentChat) {
          const commandMessage = {
            id: Date.now(),
            content: enabled
              ? "🔍 Web search enabled. Messages will include web search results."
              : "🔍 Web search disabled.",
            isUser: false,
            isCommand: true,
            personaId: activePersonas.length > 0 ? activePersonas[0].id : null
          };
          
          setCurrentChat([...currentChat, commandMessage]);
        }
      },
      personas
    });
    
    container.appendChild(chatInputElem);
  }
  
  // ==========================================
  // Application Functions
  // ==========================================
  
  // Application Actions
  const actions = {
    sendMessage: function(message) {
      if (!message.trim()) return;
      
      const state = store.get();
      
      // Add user message
      const userMessage = {
        id: Date.now(),
        content: message,
        isUser: true,
        timestamp: new Date().toISOString()
      };
      
      // Update chat with user message
      const updatedChat = [...state.currentChat, userMessage];
      
      // Update state
      store.set({
        currentChat: updatedChat,
        isLoading: true,
        inputValue: ""
      });
      
      // Generate AI response after delay
      setTimeout(() => {
        const currentState = store.get();
        
        // Get active persona
        const personaId = currentState.activePersonas.length > 0 
          ? currentState.activePersonas[0].id 
          : null;
          
        // Generate response
        const responses = [
          \`I understand your question about \${message.substring(0, 20)}...\`,
          \`That's an interesting point about \${message.substring(0, 15)}...\`,
          \`Let me think about \${message.substring(0, 10)}...\`,
          \`I'd be happy to help with \${message.substring(0, 25)}...\`
        ];
        
        const response = responses[Math.floor(Math.random() * responses.length)];
        
        // Create AI message
        const aiMessage = {
          id: Date.now(),
          content: response,
          isUser: false,
          personaId: personaId,
          timestamp: new Date().toISOString()
        };
        
        // Update chat with AI response
        const newChat = [...currentState.currentChat, aiMessage];
        
        // Update state
        store.set({
          currentChat: newChat,
          isLoading: false
        });
      }, 1000);
    },
    
    regenerateResponse: function(message) {
      if (!message) return;
      
      const state = store.get();
      const messageIndex = state.currentChat.findIndex(m => m.id === message.id);
      
      if (messageIndex !== -1) {
        // Remove the message and all subsequent messages
        const updatedChat = state.currentChat.slice(0, messageIndex);
        
        store.set({
          currentChat: updatedChat,
          isLoading: true
        });
        
        // Generate new response
        setTimeout(() => {
          const currentState = store.get();
          
          // Generate a new response
          const responses = [
            \`Let me try again: \${message.content.substring(0, 20)}...\`,
            \`Here's another perspective: \${message.content.substring(0, 15)}...\`,
            \`Let me rethink this: \${message.content.substring(0, 10)}...\`,
            \`I'll approach this differently: \${message.content.substring(0, 25)}...\`
          ];
          
          const response = responses[Math.floor(Math.random() * responses.length)];
          
          // Create new AI message
          const newMessage = {
            id: Date.now(),
            content: response,
            isUser: false,
            personaId: message.personaId || (currentState.activePersonas[0]?.id),
            timestamp: new Date().toISOString()
          };
          
          // Update chat with new response
          const newChat = [...currentState.currentChat, newMessage];
          
          // Update state
          store.set({
            currentChat: newChat,
            isLoading: false
          });
        }, 1000);
      }
    }
  };
  
  // Render the app
  function renderApp() {
    const state = store.get();
    
    // Clear the app container
    appElement.innerHTML = '';
    
    // Render main chat component
    const chat = GaiaComponents.chat.render({
      currentChat: state.currentChat,
      personas: state.personas,
      activePersonas: state.activePersonas,
      setActivePersonas: (personas) => {
        store.set({ activePersonas: personas });
      },
      setCurrentChat: (chat) => {
        store.set({ currentChat: chat });
      },
      onSendMessage: actions.sendMessage,
      onRegenerate: actions.regenerateResponse
    });
    
    appElement.appendChild(chat);
  }
  
  // Subscribe to state changes
  store.subscribe(renderApp);
  
  // Initial render
  GaiaUI.render(appElement, '#app');
  
  // Add some test messages after initial render
  setTimeout(() => {
    const welcomeMessages = [
      {
        id: Date.now(),
        content: "👋 Welcome to GaiaChat! This is a demo of the GaiaScript UI implementation.",
        isUser: false,
        personaId: "1",
        timestamp: new Date().toISOString()
      },
      {
        id: Date.now() + 1,
        content: "You can type a message below and press send to test the UI.",
        isUser: false,
        personaId: "1",
        timestamp: new Date(Date.now() + 1000).toISOString()
      },
      {
        id: Date.now() + 2,
        content: "Try clicking the 👥 button in the top right to see the participants panel.",
        isUser: false,
        personaId: "1",
        timestamp: new Date(Date.now() + 2000).toISOString()
      }
    ];
    
    store.set(state => ({
      ...state,
      currentChat: [...state.currentChat, ...welcomeMessages]
    }));
  }, 500);
});`;
  
  fs.writeFileSync(path.join(PUBLIC_DIR, 'app.js'), app);
  
  // Copy assets if needed
  const assetsDir = path.join(PUBLIC_DIR, 'assets', 'personas');
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }
  
  // Try to copy the default avatar if it exists
  const sourceAvatar = path.join(__dirname, '..', '..', '..', 'public', 'assets', 'personas', 'gaia-default.jpeg');
  const destAvatar = path.join(assetsDir, 'gaia-default.jpeg');
  
  try {
    if (fs.existsSync(sourceAvatar)) {
      fs.copyFileSync(sourceAvatar, destAvatar);
    }
  } catch (error) {
    console.warn('Warning: Could not copy avatar image: ', error.message);
  }
  
  console.log('GaiaScript compiled and web files generated successfully');
}

// Create HTTP server
const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);
  
  // Handle root path
  let filePath = req.url === '/' 
    ? path.join(PUBLIC_DIR, 'index.html')
    : path.join(PUBLIC_DIR, req.url);
  
  // Ensure the path is within the public directory
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }
  
  // Get file extension for content type
  const extname = path.extname(filePath);
  const contentType = MIME_TYPES[extname] || 'application/octet-stream';
  
  // Read the file
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('File Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(`Server Error: ${err.code}`);
      }
      return;
    }
    
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content, 'utf-8');
  });
});

// Generate web files from GaiaScript
generateWebFiles();

// Start the server
console.log(`Server running at http://localhost:${PORT}/`);
server.listen(PORT);