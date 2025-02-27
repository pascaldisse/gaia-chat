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
    const files = await db.getAll(KNOWLEDGE_STORE);
    
    // Calculate and add file sizes for binary content if missing
    return files.map(file => {
      if (!file.size && file.content) {
        // Estimate size based on content
        if (typeof file.content === 'string') {
          file.size = file.content.length;
        } else if (file.content instanceof ArrayBuffer) {
          file.size = file.content.byteLength;
        } else if (file.content instanceof Blob) {
          file.size = file.content.size;
        } else if (file.content && typeof file.content === 'object') {
          // Rough estimate for objects
          try {
            file.size = JSON.stringify(file.content).length;
          } catch (e) {
            file.size = 1024; // Default size if can't calculate
          }
        }
      }
      return file;
    });
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
    const validFiles = files.filter(file => file !== undefined);
    
    // Calculate and add file sizes for binary content if missing
    return validFiles.map(file => {
      if (!file.size && file.content) {
        // Estimate size based on content
        if (typeof file.content === 'string') {
          file.size = file.content.length;
        } else if (file.content instanceof ArrayBuffer) {
          file.size = file.content.byteLength;
        } else if (file.content instanceof Blob) {
          file.size = file.content.size;
        } else if (file.content && typeof file.content === 'object') {
          // Rough estimate for objects
          try {
            file.size = JSON.stringify(file.content).length;
          } catch (e) {
            file.size = 1024; // Default size if can't calculate
          }
        }
      }
      return file;
    });
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
      
      console.log(`Searching ${allFiles.length} files for query: "${query}"`);
      
      for (const file of allFiles) {
        if (!file.content) {
          console.log(`Skipping file ${file.name || file.id}: No content available`);
          continue;
        }
        
        try {
          // If content is already a string, search directly
          if (typeof file.content === 'string') {
            if (file.content.toLowerCase().includes(query.toLowerCase())) {
              console.log(`Match found in text file: ${file.name}`);
              results.push(file);
            }
            continue;
          }
          
          console.log(`Parsing binary content for file: ${file.name}, type: ${file.type}`);
          
          // For binary content (like PDFs), parse it first
          const parsedContent = await parseFileContent(
            file.content,
            file.type,
            file.name
          );
          
          // Search in the parsed content
          if (parsedContent && typeof parsedContent === 'string') {
            // Implement simple fuzzy matching
            const contentLower = parsedContent.toLowerCase();
            const queryLower = query.toLowerCase();
            
            // Check exact match first
            if (contentLower.includes(queryLower)) {
              console.log(`Exact match found in file: ${file.name}`);
              file.parsedContent = parsedContent;
              file.matchType = 'exact';
              results.push(file);
              continue;
            }
            
            // Check if all words in the query appear in the content
            const queryWords = queryLower.split(/\s+/).filter(word => word.length > 2);
            const allWordsMatch = queryWords.every(word => contentLower.includes(word));
            
            if (allWordsMatch) {
              console.log(`Partial match (all words) found in file: ${file.name}`);
              file.parsedContent = parsedContent;
              file.matchType = 'partial';
              results.push(file);
              continue;
            }
            
            // Check if at least 50% of words match for longer queries
            if (queryWords.length >= 3) {
              const matchingWords = queryWords.filter(word => contentLower.includes(word));
              if (matchingWords.length >= Math.ceil(queryWords.length / 2)) {
                console.log(`Fuzzy match (${matchingWords.length}/${queryWords.length} words) found in file: ${file.name}`);
                file.parsedContent = parsedContent;
                file.matchType = 'fuzzy';
                results.push(file);
              }
            }
          }
        } catch (error) {
          console.error(`Error processing file ${file.id || file.name} for search:`, error);
          // Continue with other files even if one fails
        }
      }
      
      console.log(`Search complete. Found ${results.length} matching files.`);
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

