import SwiftUI
import WebKit

// MARK: - WebView Implementation
struct GaiaWebView: NSViewRepresentable {
    let bridge = GaiaScriptBridge()
    
    func makeNSView(context: Context) -> WKWebView {
        // Configure WebView with preferences
        let preferences = WKPreferences()
        preferences.javaScriptCanOpenWindowsAutomatically = true
        
        let configuration = WKWebViewConfiguration()
        configuration.preferences = preferences
        
        // Enable JavaScript on modern macOS
        if #available(macOS 11.0, *) {
            let pagePreferences = WKWebpagePreferences()
            pagePreferences.allowsContentJavaScript = true
            configuration.defaultWebpagePreferences = pagePreferences
        } else {
            // Fallback for older macOS versions
            preferences.setValue(true, forKey: "javaScriptEnabled")
        }
        
        // Add the message handler
        configuration.userContentController.add(bridge, name: "gaiaBridge")
        
        // Create the WebView
        let webView = WKWebView(frame: .zero, configuration: configuration)
        bridge.webView = webView
        
        // Set up notification observer for JavaScript execution
        NotificationCenter.default.addObserver(forName: NSNotification.Name("ExecuteJavaScript"), 
                                             object: nil, 
                                             queue: .main) { notification in
            if let script = notification.userInfo?["script"] as? String {
                webView.evaluateJavaScript(script) { result, error in
                    if let error = error {
                        print("Error executing JavaScript: \(error)")
                    }
                }
            }
        }
        
        // Load the HTML content
        let htmlContent = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>GAIA Desktop</title>
    <style>
    body, html {
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        height: 100%;
        width: 100%;
        background-color: transparent;
        overflow: hidden;
    }
    
    #app {
        height: 100%;
        width: 100%;
        background-color: transparent;
        position: relative;
    }
    
    /* GaiaScript Styles */
    .persona-bubble {
        position: absolute;
        width: 150px;
        height: 150px;
        border-radius: 50%;
        overflow: hidden;
        box-shadow: 0 4px 24px rgba(0,0,0,0.15);
        cursor: grab;
        transition: all 0.3s ease;
    }
    
    .persona-bubble img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
    
    .chat-interface {
        position: absolute;
        width: 300px;
        max-height: 400px;
        background-color: rgba(255, 255, 255, 0.95);
        color: rgba(0, 0, 0, 0.9);
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }
    
    .chat-interface.dark {
        background-color: rgba(30, 30, 30, 0.95);
        color: rgba(255, 255, 255, 0.9);
    }
    
    .chat-header {
        padding: 12px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.1);
        display: flex;
        align-items: center;
        gap: 8px;
    }
    
    .chat-header-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        overflow: hidden;
    }
    
    .chat-header-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
    
    .chat-messages {
        flex: 1;
        overflow: auto;
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 8px;
    }
    
    .message {
        padding: 8px 12px;
        border-radius: 16px;
        max-width: 80%;
        word-break: break-word;
    }
    
    .message.user {
        align-self: flex-end;
        background-color: rgba(0, 122, 255, 0.9);
        color: white;
    }
    
    .message.persona {
        align-self: flex-start;
        background-color: rgba(240, 240, 240, 0.9);
    }
    
    .chat-input {
        padding: 12px;
        border-top: 1px solid rgba(0, 0, 0, 0.1);
        display: flex;
        gap: 8px;
    }
    
    .chat-input input {
        flex: 1;
        padding: 8px 12px;
        border-radius: 16px;
        background-color: rgba(240, 240, 240, 0.9);
        border: none;
        outline: none;
    }
    
    .send-button {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background-color: rgba(0, 122, 255, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: white;
        border: none;
    }
    
    .settings-panel {
        position: fixed;
        right: 20px;
        bottom: 20px;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background-color: rgba(0, 122, 255, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        color: white;
        font-size: 20px;
    }
    </style>
</head>
<body>
    <div id="app">
        <!-- Initial Content -->
        <div id="bubbles-container"></div>
        <div id="chat-container"></div>
        <div id="settings-container"></div>
    </div>
    
    <script>
    // Gaia Desktop Application
    const app = {
        state: {
            personas: [
                {
                    id: 'gaia',
                    name: 'GAIA',
                    image: 'Resources/gaia-default.jpeg',
                    position: { x: 100, y: 100 },
                    size: 150,
                    personality: 'friendly, helpful, informative',
                    greeting: "Hello! I'm GAIA, your desktop assistant. How can I help you today?"
                }
            ],
            activePersona: 'gaia',
            chatOpen: false,
            chatHistory: {},
            isDragging: false,
            dragOffset: { x: 0, y: 0 },
            settings: {
                bubbleOpacity: 0.9,
                idleAnimations: true,
                snapToEdge: false,
                darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches
            }
        },
        
        init: function() {
            // Load saved positions if available
            const savedPositions = localStorage.getItem('personaPositions');
            if (savedPositions) {
                try {
                    const positions = JSON.parse(savedPositions);
                    this.state.personas = this.state.personas.map(p => {
                        if (positions[p.id]) {
                            return {...p, position: positions[p.id]};
                        }
                        return p;
                    });
                } catch (e) {
                    console.error('Error loading saved positions:', e);
                }
            }
            
            // Set up event listeners
            window.addEventListener('mousemove', this.handleDragMove.bind(this));
            window.addEventListener('mouseup', this.handleDragEnd.bind(this));
            
            // Match system appearance
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
                this.state.settings.darkMode = e.matches;
                this.render();
            });
            
            // Initial render
            this.render();
            
            // Start animation loop for idle animations
            if (this.state.settings.idleAnimations) {
                this.startIdleAnimations();
            }
            
            // Bridge to Swift
            if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.gaiaBridge) {
                window.webkit.messageHandlers.gaiaBridge.postMessage({
                    type: 'ready',
                    timestamp: Date.now()
                });
            }
        },
        
        getPersonaById: function(id) {
            return this.state.personas.find(p => p.id === id) || this.state.personas[0];
        },
        
        handleDragStart: function(event, personaId) {
            const persona = this.getPersonaById(personaId);
            this.state.isDragging = true;
            this.state.activePersona = personaId;
            this.state.dragOffset = {
                x: event.clientX - persona.position.x,
                y: event.clientY - persona.position.y
            };
            
            // Update cursor style
            const bubbleElement = document.getElementById(`bubble-${personaId}`);
            if (bubbleElement) {
                bubbleElement.style.cursor = 'grabbing';
            }
            
            event.preventDefault();
        },
        
        handleDragMove: function(event) {
            if (!this.state.isDragging) return;
            
            const persona = this.getPersonaById(this.state.activePersona);
            let newX = event.clientX - this.state.dragOffset.x;
            let newY = event.clientY - this.state.dragOffset.y;
            
            if (this.state.settings.snapToEdge) {
                const screenWidth = window.innerWidth;
                const screenHeight = window.innerHeight;
                
                if (newX < 20) {
                    newX = 0;
                } else if (newX > screenWidth - persona.size - 20) {
                    newX = screenWidth - persona.size;
                }
                
                if (newY < 20) {
                    newY = 0;
                } else if (newY > screenHeight - persona.size - 20) {
                    newY = screenHeight - persona.size;
                }
            }
            
            this.state.personas = this.state.personas.map(p => {
                if (p.id === this.state.activePersona) {
                    return {...p, position: {x: newX, y: newY}};
                }
                return p;
            });
            
            this.updateBubblePosition();
        },
        
        handleDragEnd: function() {
            if (!this.state.isDragging) return;
            
            this.state.isDragging = false;
            
            // Update cursor style
            const bubbleElement = document.getElementById(`bubble-${this.state.activePersona}`);
            if (bubbleElement) {
                bubbleElement.style.cursor = 'grab';
            }
            
            // Save positions
            const positions = {};
            this.state.personas.forEach(p => {
                positions[p.id] = p.position;
            });
            localStorage.setItem('personaPositions', JSON.stringify(positions));
            
            // Notify Swift
            if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.gaiaBridge) {
                window.webkit.messageHandlers.gaiaBridge.postMessage({
                    type: 'positionUpdated',
                    persona: this.state.activePersona,
                    position: this.getPersonaById(this.state.activePersona).position
                });
            }
        },
        
        handleBubbleClick: function(personaId) {
            if (this.state.isDragging) return;
            
            this.state.activePersona = personaId;
            this.state.chatOpen = !this.state.chatOpen;
            
            this.render();
            
            // Focus input if chat open
            if (this.state.chatOpen) {
                setTimeout(() => {
                    const input = document.getElementById('message-input');
                    if (input) input.focus();
                }, 100);
            }
        },
        
        handleSendMessage: function(message) {
            if (!message || message.trim() === '') return;
            
            const persona = this.getPersonaById(this.state.activePersona);
            
            // Initialize chat history for this persona if needed
            if (!this.state.chatHistory[persona.id]) {
                this.state.chatHistory[persona.id] = [];
            }
            
            // Add user message
            this.state.chatHistory[persona.id].push({
                type: 'user',
                content: message,
                timestamp: Date.now()
            });
            
            this.renderChatMessages();
            
            // Generate a simple response (in real app, this would use AI)
            // Send message to Swift for processing
            if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.gaiaBridge) {
                window.webkit.messageHandlers.gaiaBridge.postMessage({
                    type: 'sendMessage',
                    personaId: persona.id,
                    message: message
                });
            } else {
                // Fallback for when running without Swift bridge (e.g. in a browser)
                setTimeout(() => {
                    // Simulate response based on personality
                    let response;
                    if (message.toLowerCase().includes('hello') || message.toLowerCase().includes('hi')) {
                        response = `Hello! I'm ${persona.name}. How can I assist you today?`;
                    } else if (message.toLowerCase().includes('help')) {
                        response = `I can help you with various tasks. Just let me know what you need!`;
                    } else if (message.toLowerCase().includes('weather')) {
                        response = `I don't have access to weather data yet, but I can help you with other things!`;
                    } else {
                        response = `I've received your message. As a demo persona, I have limited responses programmed. In a full implementation, I would use AI to generate contextual replies based on my ${persona.personality} personality.`;
                    }
                    
                    // Add persona response
                    this.state.chatHistory[persona.id].push({
                        type: 'persona',
                        content: response,
                        timestamp: Date.now()
                    });
                    
                    this.renderChatMessages();
                    
                    // Scroll to bottom
                    const messagesContainer = document.querySelector('.chat-messages');
                    if (messagesContainer) {
                        messagesContainer.scrollTop = messagesContainer.scrollHeight;
                    }
                }, 1000);
            }
        },
        
        startIdleAnimations: function() {
            const animate = () => {
                this.state.personas.forEach(persona => {
                    const bubbleElement = document.getElementById(`bubble-${persona.id}`);
                    if (bubbleElement && !this.state.isDragging) {
                        const time = Date.now() / 1000;
                        // Subtle floating movement
                        bubbleElement.style.transform = `translateY(${Math.sin(time + parseInt(persona.id, 36)) * 3}px) scale(${0.98 + 0.02 * Math.sin(time * 0.5 + parseInt(persona.id, 36))})`;
                    }
                });
                
                requestAnimationFrame(animate);
            };
            
            requestAnimationFrame(animate);
        },
        
        updateBubblePosition: function() {
            this.state.personas.forEach(persona => {
                const bubbleElement = document.getElementById(`bubble-${persona.id}`);
                if (bubbleElement) {
                    bubbleElement.style.left = `${persona.position.x}px`;
                    bubbleElement.style.top = `${persona.position.y}px`;
                }
            });
            
            // Update chat position if open
            if (this.state.chatOpen) {
                this.updateChatPosition();
            }
        },
        
        updateChatPosition: function() {
            const chatElement = document.querySelector('.chat-interface');
            if (!chatElement) return;
            
            const persona = this.getPersonaById(this.state.activePersona);
            const screenWidth = window.innerWidth;
            const personaPos = persona.position;
            
            // Position chat to the left or right of bubble based on screen position
            if (personaPos.x > screenWidth / 2) {
                // Persona is on right side, put chat on left
                chatElement.style.right = `${screenWidth - personaPos.x + 20}px`;
                chatElement.style.left = 'auto';
            } else {
                // Persona is on left side, put chat on right
                chatElement.style.left = `${personaPos.x + persona.size + 20}px`;
                chatElement.style.right = 'auto';
            }
            
            chatElement.style.top = `${personaPos.y - 20}px`;
        },
        
        renderBubbles: function() {
            const container = document.getElementById('bubbles-container');
            if (!container) return;
            
            container.innerHTML = '';
            
            this.state.personas.forEach(persona => {
                const bubble = document.createElement('div');
                bubble.id = `bubble-${persona.id}`;
                bubble.className = 'persona-bubble';
                bubble.style.left = `${persona.position.x}px`;
                bubble.style.top = `${persona.position.y}px`;
                bubble.style.width = `${persona.size}px`;
                bubble.style.height = `${persona.size}px`;
                bubble.style.opacity = this.state.settings.bubbleOpacity;
                
                // Image
                const img = document.createElement('img');
                img.src = persona.image;
                img.alt = persona.name;
                bubble.appendChild(img);
                
                // Add event listeners
                bubble.addEventListener('mousedown', (e) => this.handleDragStart(e, persona.id));
                bubble.addEventListener('click', () => this.handleBubbleClick(persona.id));
                
                container.appendChild(bubble);
            });
        },
        
        renderChatInterface: function() {
            const container = document.getElementById('chat-container');
            if (!container) return;
            
            container.innerHTML = '';
            
            if (!this.state.chatOpen) return;
            
            const persona = this.getPersonaById(this.state.activePersona);
            
            const chat = document.createElement('div');
            chat.className = `chat-interface ${this.state.settings.darkMode ? 'dark' : ''}`;
            
            // Header
            const header = document.createElement('div');
            header.className = 'chat-header';
            
            const avatar = document.createElement('div');
            avatar.className = 'chat-header-avatar';
            
            const avatarImg = document.createElement('img');
            avatarImg.src = persona.image;
            avatarImg.alt = persona.name;
            avatar.appendChild(avatarImg);
            
            const name = document.createElement('div');
            name.style.fontWeight = 'bold';
            name.textContent = persona.name;
            
            header.appendChild(avatar);
            header.appendChild(name);
            chat.appendChild(header);
            
            // Messages area
            const messages = document.createElement('div');
            messages.className = 'chat-messages';
            
            // Render messages or greeting
            const history = this.state.chatHistory[persona.id] || [];
            if (history.length === 0) {
                const greeting = document.createElement('div');
                greeting.style.textAlign = 'center';
                greeting.style.opacity = '0.7';
                greeting.style.padding = '20px';
                greeting.textContent = persona.greeting;
                messages.appendChild(greeting);
            } else {
                history.forEach(msg => {
                    const message = document.createElement('div');
                    message.className = `message ${msg.type}`;
                    message.textContent = msg.content;
                    messages.appendChild(message);
                });
            }
            
            chat.appendChild(messages);
            
            // Input area
            const inputArea = document.createElement('div');
            inputArea.className = 'chat-input';
            
            const input = document.createElement('input');
            input.type = 'text';
            input.id = 'message-input';
            input.placeholder = 'Type a message...';
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleSendMessage(e.target.value);
                    e.target.value = '';
                }
            });
            
            const sendButton = document.createElement('button');
            sendButton.className = 'send-button';
            sendButton.textContent = '→';
            sendButton.addEventListener('click', () => {
                const inputElement = document.getElementById('message-input');
                if (inputElement) {
                    this.handleSendMessage(inputElement.value);
                    inputElement.value = '';
                }
            });
            
            inputArea.appendChild(input);
            inputArea.appendChild(sendButton);
            chat.appendChild(inputArea);
            
            container.appendChild(chat);
            
            // Position chat
            this.updateChatPosition();
            
            // Scroll to bottom
            messages.scrollTop = messages.scrollHeight;
        },
        
        renderChatMessages: function() {
            const messagesContainer = document.querySelector('.chat-messages');
            if (!messagesContainer) return;
            
            const persona = this.getPersonaById(this.state.activePersona);
            const history = this.state.chatHistory[persona.id] || [];
            
            messagesContainer.innerHTML = '';
            
            if (history.length === 0) {
                const greeting = document.createElement('div');
                greeting.style.textAlign = 'center';
                greeting.style.opacity = '0.7';
                greeting.style.padding = '20px';
                greeting.textContent = persona.greeting;
                messagesContainer.appendChild(greeting);
            } else {
                history.forEach(msg => {
                    const message = document.createElement('div');
                    message.className = `message ${msg.type}`;
                    message.textContent = msg.content;
                    messagesContainer.appendChild(message);
                });
            }
            
            // Scroll to bottom
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        },
        
        renderSettingsPanel: function() {
            const container = document.getElementById('settings-container');
            if (!container) return;
            
            container.innerHTML = '';
            
            const settings = document.createElement('div');
            settings.className = 'settings-panel';
            settings.textContent = '⚙️';
            settings.addEventListener('click', () => {
                // In a real app, this would open settings interface
                // For demo, we'll just toggle dark mode
                this.state.settings.darkMode = !this.state.settings.darkMode;
                this.render();
                
                // Notify Swift
                if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.gaiaBridge) {
                    window.webkit.messageHandlers.gaiaBridge.postMessage({
                        type: 'settingsChanged',
                        settings: this.state.settings
                    });
                }
            });
            
            container.appendChild(settings);
        },
        
        render: function() {
            this.renderBubbles();
            this.renderChatInterface();
            this.renderSettingsPanel();
        }
    };
    
    // Initialize the app when the DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        app.init();
    });
    
    // iOS Bridge for GaiaScript
    window.iOSBridge = {
        sendMessage: function(message) {
            // Send message to Swift native code
            if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.gaiaBridge) {
                window.webkit.messageHandlers.gaiaBridge.postMessage(message);
            }
        },
        
        receiveMessage: function(message) {
            // Handle messages from Swift native code
            console.log("Received message from Swift:", message);
            
            if (message.type === "updateSettings") {
                // Update settings from Swift
                app.state.settings = {...app.state.settings, ...message.settings};
                app.render();
            } else if (message.type === "messageResponse") {
                // Handle response to a message
                const personaId = message.personaId;
                const responseText = message.message;
                
                if (!app.state.chatHistory[personaId]) {
                    app.state.chatHistory[personaId] = [];
                }
                
                // Add persona response
                app.state.chatHistory[personaId].push({
                    type: 'persona',
                    content: responseText,
                    timestamp: Date.now()
                });
                
                app.renderChatMessages();
                
                // Scroll to bottom
                const messagesContainer = document.querySelector('.chat-messages');
                if (messagesContainer) {
                    messagesContainer.scrollTop = messagesContainer.scrollHeight;
                }
            }
        }
    };
    
    // Function to add a new chat persona
    window.addNewChat = function() {
        // Generate a unique ID for the new persona
        const id = 'persona_' + Date.now();
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        
        // Create a new persona with default settings
        const newPersona = {
            id: id,
            name: 'New Persona',
            image: 'Resources/gaia-default.jpeg', // Default image
            position: { 
                x: Math.random() * (screenWidth - 200) + 100, 
                y: Math.random() * (screenHeight - 200) + 100 
            },
            size: 150,
            personality: 'friendly, helpful',
            greeting: "Hello! I'm a new persona. How can I help you today?"
        };
        
        // Add the new persona to the app state
        app.state.personas.push(newPersona);
        
        // Update the active persona to the new one
        app.state.activePersona = id;
        
        // Open the chat
        app.state.chatOpen = true;
        
        // Render the updated UI
        app.render();
        
        // Notify Swift about the new persona
        if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.gaiaBridge) {
            window.webkit.messageHandlers.gaiaBridge.postMessage({
                type: 'personaAdded',
                persona: newPersona
            });
        }
    };
    </script>
</body>
</html>
"""
        
        // Use the bundle URL as the base URL for resource loading
        let baseURL = Bundle.gaiaResources.resourceURL
        webView.loadHTMLString(htmlContent, baseURL: baseURL)
        
        // Make WebView background transparent
        webView.setValue(false, forKey: "drawsBackground")
        
        return webView
    }
    
    func updateNSView(_ nsView: WKWebView, context: Context) {
        // Update logic if needed
    }
}