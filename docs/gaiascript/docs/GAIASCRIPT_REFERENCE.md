# GaiaScript Language Reference

## Overview

GaiaScript is a symbolic programming language designed for extreme brevity and expressive power.
This file contains the complete implementation of the Gaia Chat interface using GaiaScript.

## Core Concepts

- GaiaScript uses Unicode symbols for brevity
- Component-based architecture with state management
- Reactive UI updates based on state changes
- Supports custom personas and formatting
- Minimal runtime footprint

## API Reference

### MTD()

**Parameters:**

- `state` (object)

**Returns:**

None

**Example:**

```javascript
state:⟨
  messages: [],
  inputValue: "",
  isTyping: false
⟩
```

### MTD()

**Parameters:**

- `component` (object)

**Returns:**

None

**Example:**

```javascript
C〈chat〉chat:⟨{
  state:⟨
    messages: [],
    inputValue: ""
  ⟩,
  render:⟨
    П class:"chat-container"→[
      П class:"message-list"→[
        messages.map(message⟨
          П class:(message.isUser|"user-message"|"ai-message")→[
            ⌑"${message.content}"
          ]
        ⟩)
      ],
      П class:"input-area"→[
        ⌤ type:"text" value:inputValue @input→handleInput @keydown→handleKeyDown,
        ⌘"Send"@click→sendMessage
      ]
    ]
  ⟩,
  methods:⟨
    handleInput:(e)⟨
      inputValue⊜e.target.value
    ⟩,
    handleKeyDown:(e)⟨
      if(e.key⊜"Enter"&&!e.shiftKey)⟨
        e.preventDefault(),
        sendMessage()
      ⟩
    ⟩,
    sendMessage:()⟨
      if(inputValue.trim())⟨
        messages⊕{
          id: Date.now(),
          content: inputValue,
          isUser: true
        },
        generateResponse(inputValue),
        inputValue⊜""
      ⟩
    ⟩,
    generateResponse:(text)⟨
      setTimeout(()⟨
        messages⊕{
          id: Date.now(),
          content: "I understand your message about " + text.substring(0, 20) + "...",
          isUser: false
        }
      ⟩, 1000)
    ⟩
  ⟩
}⟩
```

### MTD()

**Parameters:**

- `chatInput` (object)

**Returns:**

None

**Example:**

```javascript
C〈chatInput〉chatInput:⟨{
  props:⟨
    onSendMessage: null,
    isLoading: false
  ⟩,
  state:⟨
    inputValue: ""
  ⟩,
  render:⟨
    П class:"chat-input"→[
      ⌤ tag:"textarea" 
        placeholder:"Type your message..." 
        value:inputValue 
        @input→handleInput 
        @keydown→handleKeyDown,
        
      ⌘ disabled:props.isLoading 
        @click→handleSend→
        (props.isLoading|"Sending..."|"Send")
    ]
  ⟩,
  methods:⟨
    handleInput:(e)⟨
      inputValue⊜e.target.value
    ⟩,
    
    handleKeyDown:(e)⟨
      if(e.key⊜"Enter" && !e.shiftKey)⟨
        e.preventDefault(),
        handleSend()
      ⟩
    ⟩,
    
    handleSend:()⟨
      if(inputValue.trim() && props.onSendMessage)⟨
        props.onSendMessage(inputValue.trim()),
        inputValue⊜""
      ⟩
    ⟩
  ⟩
}⟩
```

### MTD()

**Parameters:**

- `personas` (array)

**Returns:**

None

**Example:**

```javascript
C〈persona〉personaSelector:⟨{
  state:⟨
    personas: [
      {id: "1", name: "Gaia", image: "/assets/personas/gaia-default.svg", isDefault: true},
      {id: "2", name: "Sage", image: "/assets/personas/gaia-default.svg"},
      {id: "3", name: "Guru", image: "/assets/personas/gaia-default.svg"}
    ],
    selectedPersona: null
  ⟩,
  init:()⟨
    selectedPersona⊜personas.find(p⟨p.isDefault⟩)||personas[0]
  ⟩,
  render:⟨
    П class:"persona-selector"→[
      ⌑"Current Persona: ${selectedPersona.name}",
      П class:"persona-options"→[
        personas.map(persona⟨
          П class:(selectedPersona.id⊜persona.id|"persona-item selected"|"persona-item")@click→()⟨selectPersona(persona)⟩→[
            ⌹ src:persona.image class:"persona-image",
            ⌑"${persona.name}"
          ]
        ⟩)
      ]
    ]
  ⟩,
  methods:⟨
    selectPersona:(persona)⟨
      selectedPersona⊜persona,
      
      // Provide notification to chat that persona changed
      if(window.GaiaEvents && window.GaiaEvents.onPersonaChanged)⟨
        window.GaiaEvents.onPersonaChanged(persona)
      ⟩
    ⟩
  ⟩
}⟩
```

### MTD()

**Parameters:**

- `tags` (object)

**Returns:**

None

**Example:**

```javascript
C〈formatter〉messageFormatter:⟨{
  props:⟨
    message: null
  ⟩,
  state:⟨
    formattedContent: ""
  ⟩,
  init:()⟨
    formattedContent⊜formatMessage(props.message.content)
  ⟩,
  render:⟨
    П class:"formatted-message"→formattedContent
  ⟩,
  methods:⟨
    formatMessage:(text)⟨
      if(!text)⟨return ""⟩,
      text.replace(/<speech>(.*?)<\/speech>/g, '<span class="speech">$1</span>')
         .replace(/<action>(.*?)<\/action>/g, '<span class="action">$1</span>')
         .replace(/<function>(.*?)<\/function>/g, '<span class="function">$1</span>')
    ⟩
  ⟩
}⟩
```

### MTD()

**Parameters:**

- `app` (object)

**Returns:**

None

**Example:**

```javascript
UI〈Σ⊕Π⊕Ω〉
  Σ:⟨{
    currentChat: [],
    personas: [
      {id: "1", name: "Gaia", image: "/assets/personas/gaia-default.svg", isDefault: true},
      {id: "2", name: "Sage", image: "/assets/personas/gaia-default.svg"},
      {id: "3", name: "Guru", image: "/assets/personas/gaia-default.svg"}
    ],
    activePersonas: [],
    isLoading: false,
    inputValue: "",
    showSuggestions: false,
    filteredSuggestions: [],
    mentionStartIndex: null,
    selectedSuggestionIndex: 0,
    webSearchEnabled: false
  }⟩
  
  Π:⟨{
    components:{
      chat,
      personaSelector,
      messageFormatter,
      chatInput,
      knowledgeBase,
      rpgSystem,
      voiceSystem
    },
    theme:{
      colors:{
        primary: "#4a6fa5",
        secondary: "#45aaf2",
        background: "#f8f9fa",
        text: "#333333",
        accent: "#fc5c65"
      },
      spacing:{
        small: "8px",
        medium: "16px",
        large: "24px"
      },
      fonts:{
        normal: "16px",
        large: "20px",
        small: "14px"
      }
    }
  }⟩
  
  Ω:⟨{
    state:⟨
      currentChat: [],
      personas: [
        {id: "1", name: "Gaia", image: "/assets/personas/gaia-default.svg", isDefault: true},
        {id: "2", name: "Sage", image: "/assets/personas/gaia-default.svg"},
        {id: "3", name: "Guru", image: "/assets/personas/gaia-default.svg"}
      ],
      activePersonas: [],
      isLoading: false,
      inputValue: "",
      showSuggestions: false,
      filteredSuggestions: [],
      mentionStartIndex: null,
      selectedSuggestionIndex: 0,
      webSearchEnabled: false
    ⟩,
    
    init:()⟨
      activePersonas⊜[personas.find(p⟨p.isDefault⟩)||personas[0]]
    ⟩,
    
    actions:⟨
      sendMessage:(message)⟨
        if(!message.trim())⟨return⟩,
        
        currentChat⊕{
          id: Date.now(),
          content: message,
          isUser: true
        },
        
        isLoading⊜true,
        inputValue⊜"",
        
        setTimeout(()⟨
          const response⊜generateResponse(message),
          
          currentChat⊕{
            id: Date.now(),
            content: response,
            isUser: false,
            personaId: activePersonas[0].id
          },
          
          isLoading⊜false
        ⟩, 1000)
      ⟩,
      
      regenerateResponse:(message)⟨
        if(!message)⟨return⟩,
        
        const messageIndex⊜currentChat.findIndex(m⟨m.id⊜message.id⟩),
        
        if(messageIndex!⊜-1)⟨
          currentChat⊜currentChat.slice(0, messageIndex),
          isLoading⊜true,
          
          setTimeout(()⟨
            currentChat⊕{
              id: Date.now(),
              content: generateResponse(message.content),
              isUser: false,
              personaId: activePersonas[0].id
            },
            
            isLoading⊜false
          ⟩, 1000)
        ⟩
      ⟩,
      
      handleInput:(e)⟨
        const value⊜e.target.value,
        const cursorPos⊜e.target.selectionStart,
        const substring⊜value.substring(0, cursorPos),
        const atIndex⊜substring.lastIndexOf('@'),
        
        if(atIndex⊜-1)⟨
          inputValue⊜value,
          showSuggestions⊜false,
          mentionStartIndex⊜null,
          return
        ⟩,
        
        const mentionQuery⊜substring.substring(atIndex+1),
        
        const personaMatches⊜personas.filter(p⟨
          p.name.toLowerCase().startsWith(mentionQuery.toLowerCase())
        ⟩),
        
        inputValue⊜value,
        mentionStartIndex⊜atIndex,
        filteredSuggestions⊜personaMatches,
        showSuggestions⊜personaMatches.length>0,
        selectedSuggestionIndex⊜0
      ⟩,
      
      selectSuggestion:(suggestion)⟨
        if(mentionStartIndex⊜null)⟨return⟩,
        
        const before⊜inputValue.substring(0, mentionStartIndex),
        const after⊜inputValue.substring(document.querySelector('textarea').selectionStart),
        
        inputValue⊜`${before}@${suggestion.name} ${after}`.trim(),
        showSuggestions⊜false
      ⟩,
      
      toggleWebSearch:(enabled)⟨
        webSearchEnabled⊜enabled
      ⟩
    ⟩,
    
    render:⟨
      П class:"app-container"→[
        П class:"messages"→[
          currentChat.map(message⟨
            П class:(message.isUser|"message user-message"|"message ai-message")→message.content
          ⟩)
        ],
        
        П class:"input-container"→[
          ⌤ tag:"textarea" placeholder:"Type your message..." value:inputValue @input→handleInput @keydown→handleKeyDown,
          ⌘ disabled:isLoading@click→()⟨sendMessage(inputValue)⟩→(isLoading|"Sending..."|"Send"),
          
          showSuggestions&&filteredSuggestions.length>0⟨
            П class:"suggestions"→[
              filteredSuggestions.map((suggestion,index)⟨
                П class:(index⊜selectedSuggestionIndex|"suggestion selected"|"suggestion")@click→()⟨selectSuggestion(suggestion)⟩→suggestion.name
              ⟩)
            ]
          ⟩
        ]
      ]
    ⟩
  }⟩
```

### MTD()

**Parameters:**

- `generateResponse` (function)

**Returns:**

- `return` (string)

**Example:**

```javascript
function generateResponse(message) {
  const responses = [
    "I understand your question about " + message.substring(0, 20) + "...",
    "That's an interesting point about " + message.substring(0, 15) + "...",
    "Let me think about " + message.substring(0, 10) + "...",
    "I'd be happy to help with " + message.substring(0, 25) + "..."
  ];
  return responses[Math.floor(Math.random() * responses.length)];
}
```

### MTD()

**Parameters:**

- `knowledgeBase` (object)

**Returns:**

None

**Example:**

```javascript
C〈knowledge〉knowledgeBase:⟨{
  state:⟨
    files: [],
    activeFiles: [],
    isLoading: false,
    error: null
  ⟩,
  render:⟨
    П class:"knowledge-base"→[
      // Header
      П class:"kb-header"→[
        ⌑"Knowledge Base",
        ⌘ class:"upload-btn" @click→handleUpload→"Upload File"
      ],
      
      // File list
      П class:"kb-files"→[
        files.length⊜0⟨
          П class:"empty-state"→[
            ⌑"No files uploaded. Add files to enhance your chat."
          ]
        ⟩,
        
        files.length>0⟨
          П class:"file-list"→[
            files.map(file⟨
              П class:(activeFiles.includes(file.id)|"file-item active"|"file-item")→[
                П class:"file-info"→[
                  ⌑"${file.name}",
                  П class:"file-meta"→[
                    ⌑"${file.type} · ${formatFileSize(file.size)}"
                  ]
                ],
                П class:"file-actions"→[
                  ⌘ class:"toggle-btn" @click→()⟨toggleFile(file.id)⟩→
                    (activeFiles.includes(file.id)|"Deactivate"|"Activate"),
                  ⌘ class:"delete-btn" @click→()⟨removeFile(file.id)⟩→"✕"
                ]
              ]
            ⟩)
          ]
        ⟩
      ],
      
      // Loading state
      isLoading⟨
        П class:"kb-loading"→[
          ⌑"Processing file..."
        ]
      ⟩,
      
      // Error state
      error⟨
        П class:"kb-error"→[
          ⌑"Error: ${error}",
          ⌘ @click→()⟨error⊜null⟩→"Dismiss"
        ]
      ⟩
    ]
  ⟩,
  methods:⟨
    handleUpload:()⟨
      // Create file input and trigger click
      const input⊜document.createElement('input'),
      input.type⊜'file',
      input.accept⊜'.pdf,.doc,.docx,.txt,.json,.md,.csv',
      
      input.onchange⊜(e)⟨
        const file⊜e.target.files[0],
        if(!file)⟨return⟩,
        
        processFile(file)
      ⟩,
      
      input.click()
    ⟩,
    
    processFile:(file)⟨
      isLoading⊜true,
      error⊜null,
      
      // In a real app, this would process and extract content
      setTimeout(()⟨
        const newFile⊜{
          id: Date.now().toString(),
          name: file.name,
          type: file.type,
          size: file.size,
          uploadDate: new Date().toISOString(),
          content: "Sample content from " + file.name // Would be actual extracted content
        },
        
        files⊕newFile,
        activeFiles⊕newFile.id,
        isLoading⊜false
      ⟩, 1500)
    ⟩,
    
    toggleFile:(fileId)⟨
      if(activeFiles.includes(fileId))⟨
        // Remove from active files
        activeFiles⊜activeFiles.filter(id⟨id!⊜fileId⟩)
      ⟩else⟨
        // Add to active files
        activeFiles⊕fileId
      ⟩
    ⟩,
    
    removeFile:(fileId)⟨
      files⊜files.filter(file⟨file.id!⊜fileId⟩),
      activeFiles⊜activeFiles.filter(id⟨id!⊜fileId⟩)
    ⟩,
    
    formatFileSize:(bytes)⟨
      if(bytes < 1024)⟨
        return bytes + " B"
      ⟩else if(bytes < 1024 * 1024)⟨
        return (bytes / 1024).toFixed(1) + " KB"
      ⟩else⟨
        return (bytes / (1024 * 1024)).toFixed(1) + " MB"
      ⟩
    ⟩,
    
    getActiveFilesContent:()⟨
      return activeFiles
        .map(id⟨files.find(f⟨f.id⊜id⟩)⟩)
        .filter(file⟨file!⊜undefined⟩)
        .map(file⟨file.content⟩)
        .join("\n\n")
    ⟩
  ⟩
}⟩
```

### MTD()

**Parameters:**

- `rpgSystem` (object)

**Returns:**

None

**Example:**

```javascript
C〈rpgSystem〉rpgSystem:⟨{
  props:⟨
    persona: null
  ⟩,
  state:⟨
    attributes: {
      initiative: 0,
      confidence: 0,
      creativity: 0,
      empathy: 0,
      knowledge: 0,
      humor: 0,
      talkativeness: 0,
      focus: 0,
      curiosity: 0,
      friendliness: 0,
      independence: 0
    },
    currentRoll: null,
    rollHistory: []
  ⟩,
  init:()⟨
    if(props.persona)⟨
      // Copy persona attributes to state
      Object.keys(attributes).forEach(attr⟨
        if(props.persona[attr])⟨
          attributes[attr]⊜props.persona[attr]
        ⟩
      ⟩)
    ⟩
  ⟩,
  render:⟨
    П class:"rpg-system"→[
      П class:"attributes"→[
        Object.keys(attributes).map(attr⟨
          П class:"attribute"→[
            ⌑"${attr}: ${attributes[attr]}"
          ]
        ⟩)
      ],
      П class:"roll-history"→[
        rollHistory.map(roll⟨
          П class:"roll"→[
            ⌑"${roll.attribute}: ${roll.value} (DC: ${roll.dc}, ${roll.success ? 'Success' : 'Failed'})"
          ]
        ⟩)
      ]
    ]
  ⟩,
  methods:⟨
    rollAttribute:(attribute, difficultyClass)⟨
      // Simulate a d20 roll plus attribute modifier
      const baseRoll⊜Math.floor(Math.random() * 20) + 1,
      const attributeValue⊜attributes[attribute] || 0,
      const modifier⊜Math.floor((attributeValue - 10) / 2),
      const totalRoll⊜baseRoll + modifier,
      const success⊜totalRoll >= difficultyClass,
      
      const roll⊜{
        attribute,
        baseRoll,
        modifier,
        value: totalRoll,
        dc: difficultyClass,
        success,
        timestamp: Date.now()
      },
      
      currentRoll⊜roll,
      rollHistory⊕roll,
      
      return roll
    ⟩,
    
    getAttributeModifier:(attribute)⟨
      const value⊜attributes[attribute] || 0,
      return Math.floor((value - 10) / 2)
    ⟩,
    
    calculateResponseStyle:()⟨
      // Use attributes to determine response style
      const styles⊜{
        formal: 3 + getAttributeModifier("confidence"),
        casual: 3 + getAttributeModifier("friendliness"),
        technical: 3 + getAttributeModifier("knowledge"),
        creative: 3 + getAttributeModifier("creativity"),
        verbose: 3 + getAttributeModifier("talkativeness"),
        concise: 3 + getAttributeModifier("focus"),
        humorous: 3 + getAttributeModifier("humor"),
        empathetic: 3 + getAttributeModifier("empathy")
      },
      
      // Normalize so total equals 10
      const total⊜Object.values(styles).reduce((sum, val)⟨sum + val⟩, 0),
      Object.keys(styles).forEach(key⟨
        styles[key]⊜Math.round((styles[key] / total) * 10)
      ⟩),
      
      return styles
    ⟩
  ⟩
}⟩
```

### MTD()

**Parameters:**

- `voiceSystem` (object)

**Returns:**

None

**Example:**

```javascript
C〈voiceSystem〉voiceSystem:⟨{
  props:⟨
    defaultVoice: "default"
  ⟩,
  state:⟨
    availableVoices: [],
    currentVoice: "default",
    speaking: false,
    volume: 1.0,
    rate: 1.0,
    pitch: 1.0,
    queue: []
  ⟩,
  init:()⟨
    // Initialize voice system
    if('speechSynthesis' in window)⟨
      availableVoices⊜window.speechSynthesis.getVoices(),
      
      // Set up voice changed event
      window.speechSynthesis.onvoiceschanged⊜()⟨
        availableVoices⊜window.speechSynthesis.getVoices()
      ⟩,
      
      // Set default voice
      currentVoice⊜props.defaultVoice || "default"
    ⟩
  ⟩,
  render:⟨
    П class:"voice-system"→[
      П class:"voice-controls"→[
        // Voice selector
        П class:"voice-selector"→[
          ⌑"Voice: ",
          createSelect(availableVoices.map(v⟨{value: v.name, label: v.name}⟩), currentVoice, (value)⟨currentVoice⊜value⟩)
        ],
        
        // Volume slider
        П class:"volume-control"→[
          ⌑"Volume: ",
          ⌤ type:"range" min:0 max:1 step:0.1 value:volume @input→(e)⟨volume⊜parseFloat(e.target.value)⟩
        ],
        
        // Rate slider
        П class:"rate-control"→[
          ⌑"Rate: ",
          ⌤ type:"range" min:0.5 max:2 step:0.1 value:rate @input→(e)⟨rate⊜parseFloat(e.target.value)⟩
        ],
        
        // Pitch slider
        П class:"pitch-control"→[
          ⌑"Pitch: ",
          ⌤ type:"range" min:0.5 max:2 step:0.1 value:pitch @input→(e)⟨pitch⊜parseFloat(e.target.value)⟩
        ]
      ],
      
      // Status and controls
      П class:"voice-status"→[
        ⌑speaking ? "Speaking..." : "Ready",
        ⌘ disabled:!speaking @click→stopSpeaking→"Stop"
      ]
    ]
  ⟩,
  methods:⟨
    speak:(text)⟨
      if(!('speechSynthesis' in window))⟨return false⟩,
      
      // Create utterance
      const utterance⊜new SpeechSynthesisUtterance(text),
      
      // Set voice
      if(currentVoice !== "default")⟨
        const voice⊜availableVoices.find(v⟨v.name⊜currentVoice⟩),
        if(voice)⟨utterance.voice⊜voice⟩
      ⟩,
      
      // Set parameters
      utterance.volume⊜volume,
      utterance.rate⊜rate,
      utterance.pitch⊜pitch,
      
      // Add to queue
      queue⊕utterance,
      
      // Start speaking if not already
      if(!speaking)⟨
        speaking⊜true,
        processQueue()
      ⟩,
      
      return true
    ⟩,
    
    stopSpeaking:()⟨
      if('speechSynthesis' in window)⟨
        window.speechSynthesis.cancel(),
        queue⊜[],
        speaking⊜false
      ⟩
    ⟩,
    
    processQueue:()⟨
      if(queue.length⊜0)⟨
        speaking⊜false,
        return
      ⟩,
      
      const utterance⊜queue[0],
      queue⊜queue.slice(1),
      
      utterance.onend⊜()⟨
        processQueue()
      ⟩,
      
      window.speechSynthesis.speak(utterance)
    ⟩,
    
    createSelect:(options, value, onChange)⟨
      П class:"select-container"→[
        ⌤ tag:"select" value:value @change→(e)⟨onChange(e.target.value)⟩→[
          options.map(option⟨
            ⌤ tag:"option" value:option.value selected:(value⊜option.value)→option.label
          ⟩)
        ]
      ]
    ⟩
  ⟩
}⟩
```

