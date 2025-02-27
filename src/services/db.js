import { openDB } from 'idb';

// Database configuration
const DB_NAME = 'chatApp';
const DB_VERSION = 4;
const CHAT_STORE = 'chats';
const PERSONA_STORE = 'personas';
const KNOWLEDGE_STORE = 'knowledge_files';
const WORKFLOW_STORE = 'workflows';
const TEMPLATE_STORE = 'workflow_templates';

// Create/open the database
const dbPromise = openDB(DB_NAME, DB_VERSION, {
  upgrade(db, oldVersion) {
    // Create the object stores if they don't exist
    if (!db.objectStoreNames.contains(CHAT_STORE)) {
      db.createObjectStore(CHAT_STORE, { keyPath: 'id' });
    }
    if (!db.objectStoreNames.contains(PERSONA_STORE)) {
      db.createObjectStore(PERSONA_STORE, { 
        keyPath: 'id',
        autoIncrement: true 
      });
    }
    if (!db.objectStoreNames.contains(KNOWLEDGE_STORE)) {
      db.createObjectStore(KNOWLEDGE_STORE, {
        keyPath: 'id',
        autoIncrement: true
      });
    }
    if (!db.objectStoreNames.contains(WORKFLOW_STORE)) {
      const workflowStore = db.createObjectStore(WORKFLOW_STORE, { 
        keyPath: 'id',
      });
      workflowStore.createIndex('updatedAt', 'updatedAt');
      workflowStore.createIndex('name', 'name');
    }
    if (!db.objectStoreNames.contains(TEMPLATE_STORE)) {
      const templateStore = db.createObjectStore(TEMPLATE_STORE, { 
        keyPath: 'id',
      });
      templateStore.createIndex('category', 'category');
    }
  },
});

// Database operations
export const chatDB = {
  // Get all chats from the database
  async getAllChats() {
    const db = await dbPromise;
    return db.getAll(CHAT_STORE);
  },

  // Save a new chat
  async saveChat(chat) {
    const db = await dbPromise;
    await db.put(CHAT_STORE, chat);
  },

  // Delete a chat by ID
  async deleteChat(id) {
    const db = await dbPromise;
    await db.delete(CHAT_STORE, id);
  },

  // Update an existing chat
  async updateChat(chat) {
    const db = await dbPromise;
    await db.put(CHAT_STORE, chat);
  },

  // Get a chat by ID
  async getChatById(id) {
    const db = await dbPromise;
    return db.get(CHAT_STORE, id);
  }
};

export const personaDB = {
  async getAllPersonas() {
    const db = await dbPromise;
    return db.getAll(PERSONA_STORE);
  },
  
  async savePersona(persona) {
    const db = await dbPromise;
    await db.put(PERSONA_STORE, persona);
  },
  
  async deletePersona(id) {
    const db = await dbPromise;
    await db.delete(PERSONA_STORE, id);
  }
};

// Add knowledgeDB service
export const knowledgeDB = {
  // Add a file to the database
  async addFile(fileData) {
    const db = await dbPromise;
    return db.add(KNOWLEDGE_STORE, fileData);
  },
  
  // Get all knowledge files
  async getAllFiles() {
    const db = await dbPromise;
    return db.getAll(KNOWLEDGE_STORE);
  },
  
  // Get files by their IDs
  async getFiles(fileIds) {
    const db = await dbPromise;
    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return [];
    }
    
    // Get each file by ID - filter out any null results from missing files
    const filesPromises = fileIds.map(id => db.get(KNOWLEDGE_STORE, id));
    const files = await Promise.all(filesPromises);
    return files.filter(file => file !== undefined);
  },
  
  // Delete a file by ID
  async deleteFile(fileId) {
    const db = await dbPromise;
    await db.delete(KNOWLEDGE_STORE, fileId);
  },
  
  // Search files by content (advanced implementation with PDF parsing)
  async searchFiles(query) {
    try {
      const db = await dbPromise;
      const allFiles = await db.getAll(KNOWLEDGE_STORE);
      const { parseFileContent } = await import('../utils/FileParser');
      
      // Process files and search in their content
      const results = [];
      
      for (const file of allFiles) {
        if (!file.content) continue;
        
        try {
          // If content is already a string, search directly
          if (typeof file.content === 'string') {
            if (file.content.toLowerCase().includes(query.toLowerCase())) {
              results.push(file);
            }
            continue;
          }
          
          // For binary content (like PDFs), parse it first
          const parsedContent = await parseFileContent(
            file.content,
            file.type,
            file.name
          );
          
          // Search in the parsed content
          if (parsedContent && 
              typeof parsedContent === 'string' && 
              parsedContent.toLowerCase().includes(query.toLowerCase())) {
            // Save the parsed content to make it available for display
            file.parsedContent = parsedContent;
            results.push(file);
          }
        } catch (error) {
          console.error(`Error processing file ${file.id || file.name} for search:`, error);
          // Continue with other files even if one fails
        }
      }
      
      return results;
    } catch (error) {
      console.error("Error in searchFiles:", error);
      return [];
    }
  }
};

// Add workflow database service
export const workflowDB = {
  // Save a workflow to the database
  async saveWorkflow(workflow) {
    if (!workflow.id) {
      workflow.id = `workflow-${Date.now()}`;
    }
    
    workflow.updatedAt = Date.now();
    if (!workflow.createdAt) {
      workflow.createdAt = Date.now();
    }
    
    const db = await dbPromise;
    await db.put(WORKFLOW_STORE, workflow);
    return workflow.id;
  },
  
  // Get a workflow by ID
  async getWorkflow(id) {
    const db = await dbPromise;
    return db.get(WORKFLOW_STORE, id);
  },
  
  // Get all workflows
  async getAllWorkflows() {
    const db = await dbPromise;
    const workflows = await db.getAll(WORKFLOW_STORE);
    return workflows.sort((a, b) => b.updatedAt - a.updatedAt);
  },
  
  // Delete a workflow
  async deleteWorkflow(id) {
    const db = await dbPromise;
    await db.delete(WORKFLOW_STORE, id);
    return true;
  }
};

// Add workflow template database service
export const templateDB = {
  // Save a workflow template
  async saveTemplate(template) {
    if (!template.id) {
      template.id = `template-${Date.now()}`;
    }
    
    template.updatedAt = Date.now();
    if (!template.createdAt) {
      template.createdAt = Date.now();
    }
    
    const db = await dbPromise;
    await db.put(TEMPLATE_STORE, template);
    return template.id;
  },
  
  // Get a template by ID
  async getTemplate(id) {
    const db = await dbPromise;
    return db.get(TEMPLATE_STORE, id);
  },
  
  // Get all templates
  async getAllTemplates() {
    const db = await dbPromise;
    return db.getAll(TEMPLATE_STORE);
  },
  
  // Get templates by category
  async getTemplatesByCategory(category) {
    const db = await dbPromise;
    const index = db.transaction(TEMPLATE_STORE).store.index('category');
    return index.getAll(category);
  },
  
  // Delete a template
  async deleteTemplate(id) {
    const db = await dbPromise;
    await db.delete(TEMPLATE_STORE, id);
    return true;
  }
};

// In the chat schema
const chatSchema = {
  id: { type: 'number', primary: true },
  messages: { type: 'array' },
  systemPrompt: { type: 'string' },
  model: { type: 'string' },
  createdAt: { type: 'number' },
  timestamp: { type: 'number' },
  title: { type: 'string' },
  activePersonas: { type: 'array' } // Array of persona IDs
};

