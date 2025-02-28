import { openDB } from 'idb';

// Database configuration
const DB_NAME = 'chatApp';
const DB_VERSION = 6; // Increased version to force another upgrade
const CHAT_STORE = 'chats';
const PERSONA_STORE = 'personas';
const KNOWLEDGE_STORE = 'knowledge_files';
const WORKFLOW_STORE = 'workflows';
const TEMPLATE_STORE = 'workflow_templates';
const USER_STORE = 'users'; // New store for users

// Function to create a fresh database, only if needed
const resetDatabase = async () => {
  try {
    // Delete the existing database
    await window.indexedDB.deleteDatabase(DB_NAME);
    console.log('Database reset successfully');
    
    // Recreate it by opening a connection
    return openDB(DB_NAME, 6, {
      upgrade(db) {
        // Create all stores from scratch
        const chatStore = db.createObjectStore(CHAT_STORE, { keyPath: 'id' });
        chatStore.createIndex('userId', 'userId');
        
        const personaStore = db.createObjectStore(PERSONA_STORE, { 
          keyPath: 'id',
          autoIncrement: true 
        });
        personaStore.createIndex('userId', 'userId');
        
        const knowledgeStore = db.createObjectStore(KNOWLEDGE_STORE, {
          keyPath: 'id',
          autoIncrement: true
        });
        knowledgeStore.createIndex('userId', 'userId');
        
        const workflowStore = db.createObjectStore(WORKFLOW_STORE, { 
          keyPath: 'id',
        });
        workflowStore.createIndex('updatedAt', 'updatedAt');
        workflowStore.createIndex('name', 'name');
        workflowStore.createIndex('userId', 'userId');
        
        const templateStore = db.createObjectStore(TEMPLATE_STORE, { 
          keyPath: 'id',
        });
        templateStore.createIndex('category', 'category');
        templateStore.createIndex('userId', 'userId');
        
        const userStore = db.createObjectStore(USER_STORE, { 
          keyPath: 'id' 
        });
        userStore.createIndex('email', 'email', { unique: true });
        userStore.createIndex('username', 'username', { unique: true });
      },
    });
  } catch (error) {
    console.error('Error resetting database:', error);
    throw error;
  }
};

// Create/open the database with a simple upgrade function
let dbPromise = openDB(DB_NAME, 6, {
  upgrade(db, oldVersion, newVersion, transaction) {
    // In the upgrade handler, just create missing stores
    if (!db.objectStoreNames.contains(CHAT_STORE)) {
      const chatStore = db.createObjectStore(CHAT_STORE, { keyPath: 'id' });
      chatStore.createIndex('userId', 'userId');
    }
    
    if (!db.objectStoreNames.contains(PERSONA_STORE)) {
      const personaStore = db.createObjectStore(PERSONA_STORE, { 
        keyPath: 'id',
        autoIncrement: true 
      });
      personaStore.createIndex('userId', 'userId');
    }
    
    if (!db.objectStoreNames.contains(KNOWLEDGE_STORE)) {
      const knowledgeStore = db.createObjectStore(KNOWLEDGE_STORE, {
        keyPath: 'id',
        autoIncrement: true
      });
      knowledgeStore.createIndex('userId', 'userId');
    }
    
    if (!db.objectStoreNames.contains(WORKFLOW_STORE)) {
      const workflowStore = db.createObjectStore(WORKFLOW_STORE, { 
        keyPath: 'id',
      });
      workflowStore.createIndex('updatedAt', 'updatedAt');
      workflowStore.createIndex('name', 'name');
      workflowStore.createIndex('userId', 'userId');
    }
    
    if (!db.objectStoreNames.contains(TEMPLATE_STORE)) {
      const templateStore = db.createObjectStore(TEMPLATE_STORE, { 
        keyPath: 'id',
      });
      templateStore.createIndex('category', 'category');
      templateStore.createIndex('userId', 'userId');
    }
    
    if (!db.objectStoreNames.contains(USER_STORE)) {
      const userStore = db.createObjectStore(USER_STORE, { 
        keyPath: 'id' 
      });
      userStore.createIndex('email', 'email', { unique: true });
      userStore.createIndex('username', 'username', { unique: true });
    }
  }
});

// Function to check if a store has the userId index and reset if needed
const ensureUserIdIndex = async () => {
  try {
    const db = await dbPromise;
    
    // Try to access the chat store's 'userId' index as a test
    const tx = db.transaction(CHAT_STORE);
    const store = tx.objectStore(CHAT_STORE);
    
    // If this store doesn't have the userId index, we need to reset
    if (!store.indexNames.contains('userId')) {
      console.warn('Missing userId index detected, resetting database...');
      // Close the transaction
      tx.abort();
      
      // Reset the database
      dbPromise = await resetDatabase();
      return true;
    }
    
    // Close the transaction properly
    await tx.done;
    return false;
  } catch (error) {
    console.error('Error checking indexes:', error);
    // If there's an error, try to reset the database
    dbPromise = await resetDatabase();
    return true;
  }
};

// Check for and fix missing indexes when the module is loaded
ensureUserIdIndex().then(wasReset => {
  if (wasReset) {
    console.log('Database was reset to ensure proper indexes');
  } else {
    console.log('Database indexes are in good shape');
  }
}).catch(error => {
  console.error('Failed to ensure database indexes:', error);
});

// Database operations with error handling and fallbacks
export const chatDB = {
  // Get all chats from the database
  async getAllChats() {
    try {
      const db = await dbPromise;
      return db.getAll(CHAT_STORE);
    } catch (error) {
      console.error('Error getting all chats:', error);
      return [];
    }
  },
  
  // Get all chats for a specific user (chats they own or are a participant in)
  async getChatsByUser(userId) {
    if (!userId) return [];
    
    try {
      const db = await dbPromise;
      // Get all chats and filter client-side
      const allChats = await db.getAll(CHAT_STORE);
      
      // A user can see a chat if:
      // 1. They are the original creator (userId === their ID), OR
      // 2. They are in the participants array
      const userChats = allChats.filter(chat => 
        chat.userId === userId || 
        (Array.isArray(chat.participants) && chat.participants.includes(userId))
      );
      
      return userChats.sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
      console.error('Error getting chats by user:', error);
      return [];
    }
  },

  // Save a new chat
  async saveChat(chat) {
    try {
      const db = await dbPromise;
      await db.put(CHAT_STORE, chat);
    } catch (error) {
      console.error('Error saving chat:', error);
      throw error;
    }
  },

  // Delete a chat by ID
  async deleteChat(id) {
    try {
      const db = await dbPromise;
      await db.delete(CHAT_STORE, id);
    } catch (error) {
      console.error('Error deleting chat:', error);
      throw error;
    }
  },

  // Update an existing chat
  async updateChat(chat) {
    try {
      const db = await dbPromise;
      await db.put(CHAT_STORE, chat);
    } catch (error) {
      console.error('Error updating chat:', error);
      throw error;
    }
  },

  // Get a chat by ID
  async getChatById(id) {
    try {
      const db = await dbPromise;
      return db.get(CHAT_STORE, id);
    } catch (error) {
      console.error('Error getting chat by ID:', error);
      return null;
    }
  },
  
  // Get a chat by ID and verify the user has access to it
  async getUserChatById(id, userId) {
    if (!userId) return null;
    
    try {
      const db = await dbPromise;
      const chat = await db.get(CHAT_STORE, id);
      
      // Check if chat exists and the user has access to it 
      // (either as owner or participant)
      if (!chat || (
          chat.userId !== userId && 
          !(Array.isArray(chat.participants) && chat.participants.includes(userId))
        )) {
        return null;
      }
      
      return chat;
    } catch (error) {
      console.error('Error getting user chat by ID:', error);
      return null;
    }
  },
  
  // Move all anonymous chats to a user
  async assignChatsToUser(userId, chats = null) {
    try {
      const db = await dbPromise;
      
      // If no chats specified, assign all chats that don't have a userId
      if (!chats) {
        chats = await db.getAll(CHAT_STORE);
        chats = chats.filter(chat => !chat.userId);
      }
      
      // Update each chat with the userId
      for (const chat of chats) {
        chat.userId = userId;
        
        // Initialize participants array if it doesn't exist
        if (!Array.isArray(chat.participants)) {
          chat.participants = [];
        }
        
        // Add the user as a participant if not already included
        if (!chat.participants.includes(userId)) {
          chat.participants.push(userId);
        }
        
        await db.put(CHAT_STORE, chat);
      }
      
      return chats.length;
    } catch (error) {
      console.error('Error assigning chats to user:', error);
      return 0;
    }
  },
  
  // Add a user as a participant in a chat
  async addParticipantToChat(chatId, userId) {
    try {
      const db = await dbPromise;
      const chat = await db.get(CHAT_STORE, chatId);
      
      if (!chat) {
        throw new Error(`Chat with ID ${chatId} not found`);
      }
      
      // Initialize participants array if it doesn't exist
      if (!Array.isArray(chat.participants)) {
        chat.participants = [];
      }
      
      // Add the user as a participant if not already included
      if (!chat.participants.includes(userId)) {
        chat.participants.push(userId);
        await db.put(CHAT_STORE, chat);
        return true;
      }
      
      return false; // User was already a participant
    } catch (error) {
      console.error('Error adding participant to chat:', error);
      throw error;
    }
  },
  
  // Remove a user as a participant from a chat
  async removeParticipantFromChat(chatId, userId) {
    try {
      const db = await dbPromise;
      const chat = await db.get(CHAT_STORE, chatId);
      
      if (!chat) {
        throw new Error(`Chat with ID ${chatId} not found`);
      }
      
      // If the participants array doesn't exist or the user isn't in it
      if (!Array.isArray(chat.participants) || !chat.participants.includes(userId)) {
        return false;
      }
      
      // Remove the user from participants
      chat.participants = chat.participants.filter(id => id !== userId);
      await db.put(CHAT_STORE, chat);
      return true;
    } catch (error) {
      console.error('Error removing participant from chat:', error);
      throw error;
    }
  }
};

export const personaDB = {
  async getAllPersonas() {
    try {
      const db = await dbPromise;
      return db.getAll(PERSONA_STORE);
    } catch (error) {
      console.error('Error getting all personas:', error);
      return [];
    }
  },
  
  async getPersonasByUser(userId) {
    if (!userId) return [];
    
    try {
      const db = await dbPromise;
      // Get all personas and filter client-side
      const allPersonas = await db.getAll(PERSONA_STORE);
      return allPersonas.filter(persona => persona.userId === userId);
    } catch (error) {
      console.error('Error getting personas by user:', error);
      return [];
    }
  },
  
  async savePersona(persona) {
    try {
      console.log('DB Service: Saving persona with data:', persona);
      
      // Ensure the persona is a plain object (not a class instance)
      const personaObj = { ...persona };
      
      const db = await dbPromise;
      await db.put(PERSONA_STORE, personaObj);
      console.log('DB Service: Persona saved successfully');
      return personaObj;
    } catch (error) {
      console.error('Error saving persona:', error);
      throw error;
    }
  },
  
  async deletePersona(id) {
    try {
      const db = await dbPromise;
      await db.delete(PERSONA_STORE, id);
    } catch (error) {
      console.error('Error deleting persona:', error);
      throw error;
    }
  },
  
  async getPersonaById(id) {
    try {
      const db = await dbPromise;
      return db.get(PERSONA_STORE, id);
    } catch (error) {
      console.error('Error getting persona by ID:', error);
      return null;
    }
  },
  
  async getUserPersonaById(id, userId) {
    if (!userId) return null;
    
    try {
      const db = await dbPromise;
      const persona = await db.get(PERSONA_STORE, id);
      
      // Check if persona exists and belongs to the user
      if (!persona || (persona.userId && persona.userId !== userId)) {
        return null;
      }
      
      return persona;
    } catch (error) {
      console.error('Error getting user persona by ID:', error);
      return null;
    }
  },
  
  // Move all public/system personas to a user
  async assignPersonasToUser(userId, personas = null) {
    try {
      const db = await dbPromise;
      
      // If no personas specified, assign all personas that don't have a userId
      if (!personas) {
        personas = await db.getAll(PERSONA_STORE);
        personas = personas.filter(persona => !persona.userId);
      }
      
      // Update each persona with the userId
      for (const persona of personas) {
        persona.userId = userId;
        await db.put(PERSONA_STORE, persona);
      }
      
      return personas.length;
    } catch (error) {
      console.error('Error assigning personas to user:', error);
      return 0;
    }
  }
};

// Add knowledgeDB service
export const knowledgeDB = {
  // Add a file to the database
  async addFile(fileData) {
    try {
      const db = await dbPromise;
      return db.add(KNOWLEDGE_STORE, fileData);
    } catch (error) {
      console.error('Error adding file:', error);
      throw error;
    }
  },
  
  // Get all knowledge files
  async getAllFiles() {
    try {
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
    } catch (error) {
      console.error('Error getting all files:', error);
      return [];
    }
  },
  
  // Get all files for a specific user
  async getFilesByUser(userId) {
    if (!userId) return [];
    
    try {
      const db = await dbPromise;
      const allFiles = await db.getAll(KNOWLEDGE_STORE);
      const userFiles = allFiles.filter(file => file.userId === userId);
      
      // Calculate and add file sizes for binary content if missing
      return userFiles.map(file => {
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
    } catch (error) {
      console.error('Error getting files by user:', error);
      return [];
    }
  },
  
  // Get files by their IDs
  async getFiles(fileIds) {
    try {
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
    } catch (error) {
      console.error('Error getting files by IDs:', error);
      return [];
    }
  },
  
  // Get user files by their IDs
  async getUserFiles(fileIds, userId) {
    if (!userId) return [];
    
    try {
      const files = await this.getFiles(fileIds);
      return files.filter(file => !file.userId || file.userId === userId);
    } catch (error) {
      console.error('Error getting user files:', error);
      return [];
    }
  },
  
  // Delete a file by ID
  async deleteFile(fileId) {
    try {
      const db = await dbPromise;
      await db.delete(KNOWLEDGE_STORE, fileId);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  },
  
  // Delete a user's file by ID
  async deleteUserFile(fileId, userId) {
    if (!userId) return false;
    
    try {
      const db = await dbPromise;
      const file = await db.get(KNOWLEDGE_STORE, fileId);
      
      // Check if file exists and belongs to the user
      if (!file || (file.userId && file.userId !== userId)) {
        return false;
      }
      
      await db.delete(KNOWLEDGE_STORE, fileId);
      return true;
    } catch (error) {
      console.error('Error deleting user file:', error);
      return false;
    }
  },
  
  // Assign files to a user
  async assignFilesToUser(userId, files = null) {
    try {
      const db = await dbPromise;
      
      // If no files specified, assign all files that don't have a userId
      if (!files) {
        files = await db.getAll(KNOWLEDGE_STORE);
        files = files.filter(file => !file.userId);
      }
      
      // Update each file with the userId
      for (const file of files) {
        file.userId = userId;
        await db.put(KNOWLEDGE_STORE, file);
      }
      
      return files.length;
    } catch (error) {
      console.error('Error assigning files to user:', error);
      return 0;
    }
  },
  
  // Search files by content (advanced implementation with PDF parsing)
  async searchFiles(query, userId = null) {
    try {
      const db = await dbPromise;
      let allFiles = await db.getAll(KNOWLEDGE_STORE);
      
      // If userId is provided, filter to only that user's files
      if (userId) {
        allFiles = allFiles.filter(file => file.userId === userId);
      }
      
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
    try {
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
    } catch (error) {
      console.error('Error saving workflow:', error);
      throw error;
    }
  },
  
  // Get a workflow by ID
  async getWorkflow(id) {
    try {
      const db = await dbPromise;
      return db.get(WORKFLOW_STORE, id);
    } catch (error) {
      console.error('Error getting workflow:', error);
      return null;
    }
  },
  
  // Get a workflow by ID and verify it belongs to a user
  async getUserWorkflow(id, userId) {
    if (!userId) return null;
    
    try {
      const db = await dbPromise;
      const workflow = await db.get(WORKFLOW_STORE, id);
      
      // Check if workflow exists and belongs to the user
      if (!workflow || (workflow.userId && workflow.userId !== userId)) {
        return null;
      }
      
      return workflow;
    } catch (error) {
      console.error('Error getting user workflow:', error);
      return null;
    }
  },
  
  // Get all workflows
  async getAllWorkflows() {
    try {
      const db = await dbPromise;
      const workflows = await db.getAll(WORKFLOW_STORE);
      return workflows.sort((a, b) => b.updatedAt - a.updatedAt);
    } catch (error) {
      console.error('Error getting all workflows:', error);
      return [];
    }
  },
  
  // Get all workflows for a specific user
  async getWorkflowsByUser(userId) {
    if (!userId) return [];
    
    try {
      const db = await dbPromise;
      const allWorkflows = await db.getAll(WORKFLOW_STORE);
      const userWorkflows = allWorkflows.filter(workflow => workflow.userId === userId);
      return userWorkflows.sort((a, b) => b.updatedAt - a.updatedAt);
    } catch (error) {
      console.error('Error getting workflows by user:', error);
      return [];
    }
  },
  
  // Delete a workflow
  async deleteWorkflow(id) {
    try {
      const db = await dbPromise;
      await db.delete(WORKFLOW_STORE, id);
      return true;
    } catch (error) {
      console.error('Error deleting workflow:', error);
      throw error;
    }
  },
  
  // Delete a user's workflow by ID
  async deleteUserWorkflow(id, userId) {
    if (!userId) return false;
    
    try {
      const db = await dbPromise;
      const workflow = await db.get(WORKFLOW_STORE, id);
      
      // Check if workflow exists and belongs to the user
      if (!workflow || (workflow.userId && workflow.userId !== userId)) {
        return false;
      }
      
      await db.delete(WORKFLOW_STORE, id);
      return true;
    } catch (error) {
      console.error('Error deleting user workflow:', error);
      return false;
    }
  },
  
  // Assign workflows to a user
  async assignWorkflowsToUser(userId, workflows = null) {
    try {
      const db = await dbPromise;
      
      // If no workflows specified, assign all workflows that don't have a userId
      if (!workflows) {
        workflows = await db.getAll(WORKFLOW_STORE);
        workflows = workflows.filter(workflow => !workflow.userId);
      }
      
      // Update each workflow with the userId
      for (const workflow of workflows) {
        workflow.userId = userId;
        await db.put(WORKFLOW_STORE, workflow);
      }
      
      return workflows.length;
    } catch (error) {
      console.error('Error assigning workflows to user:', error);
      return 0;
    }
  }
};

// Add workflow template database service
export const templateDB = {
  // Save a workflow template
  async saveTemplate(template) {
    try {
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
    } catch (error) {
      console.error('Error saving template:', error);
      throw error;
    }
  },
  
  // Get a template by ID
  async getTemplate(id) {
    try {
      const db = await dbPromise;
      return db.get(TEMPLATE_STORE, id);
    } catch (error) {
      console.error('Error getting template:', error);
      return null;
    }
  },
  
  // Get a template by ID and verify it belongs to a user
  async getUserTemplate(id, userId) {
    if (!userId) return null;
    
    try {
      const db = await dbPromise;
      const template = await db.get(TEMPLATE_STORE, id);
      
      // Check if template exists and belongs to the user or is a public template
      if (!template || (template.userId && template.userId !== userId && !template.isPublic)) {
        return null;
      }
      
      return template;
    } catch (error) {
      console.error('Error getting user template:', error);
      return null;
    }
  },
  
  // Get all templates
  async getAllTemplates() {
    try {
      const db = await dbPromise;
      return db.getAll(TEMPLATE_STORE);
    } catch (error) {
      console.error('Error getting all templates:', error);
      return [];
    }
  },
  
  // Get all templates for a specific user (including public templates)
  async getTemplatesByUser(userId) {
    if (!userId) return [];
    
    try {
      const db = await dbPromise;
      const allTemplates = await db.getAll(TEMPLATE_STORE);
      
      // Return user's templates and public templates
      return allTemplates.filter(template => 
        !template.userId || template.userId === userId || template.isPublic
      );
    } catch (error) {
      console.error('Error getting templates by user:', error);
      return [];
    }
  },
  
  // Get templates by category
  async getTemplatesByCategory(category) {
    try {
      const db = await dbPromise;
      const allTemplates = await db.getAll(TEMPLATE_STORE);
      return allTemplates.filter(template => template.category === category);
    } catch (error) {
      console.error('Error getting templates by category:', error);
      return [];
    }
  },
  
  // Get templates by user and category (including public templates)
  async getTemplatesByUserAndCategory(userId, category) {
    if (!userId || !category) return [];
    
    try {
      const templates = await this.getTemplatesByUser(userId);
      return templates.filter(template => template.category === category);
    } catch (error) {
      console.error('Error getting templates by user and category:', error);
      return [];
    }
  },
  
  // Delete a template
  async deleteTemplate(id) {
    try {
      const db = await dbPromise;
      await db.delete(TEMPLATE_STORE, id);
      return true;
    } catch (error) {
      console.error('Error deleting template:', error);
      throw error;
    }
  },
  
  // Delete a user's template by ID
  async deleteUserTemplate(id, userId) {
    if (!userId) return false;
    
    try {
      const db = await dbPromise;
      const template = await db.get(TEMPLATE_STORE, id);
      
      // Check if template exists and belongs to the user
      if (!template || (template.userId && template.userId !== userId)) {
        return false;
      }
      
      await db.delete(TEMPLATE_STORE, id);
      return true;
    } catch (error) {
      console.error('Error deleting user template:', error);
      return false;
    }
  },
  
  // Make a template public/private
  async setTemplateVisibility(id, userId, isPublic) {
    if (!userId) return false;
    
    try {
      const db = await dbPromise;
      const template = await db.get(TEMPLATE_STORE, id);
      
      // Check if template exists and belongs to the user
      if (!template || (template.userId && template.userId !== userId)) {
        return false;
      }
      
      template.isPublic = isPublic;
      template.updatedAt = Date.now();
      await db.put(TEMPLATE_STORE, template);
      
      return template;
    } catch (error) {
      console.error('Error setting template visibility:', error);
      return false;
    }
  },
  
  // Assign templates to a user
  async assignTemplatesToUser(userId, templates = null) {
    try {
      const db = await dbPromise;
      
      // If no templates specified, assign all templates that don't have a userId
      if (!templates) {
        templates = await db.getAll(TEMPLATE_STORE);
        templates = templates.filter(template => !template.userId);
      }
      
      // Update each template with the userId
      for (const template of templates) {
        template.userId = userId;
        await db.put(TEMPLATE_STORE, template);
      }
      
      return templates.length;
    } catch (error) {
      console.error('Error assigning templates to user:', error);
      return 0;
    }
  }
};

// User database service
export const userDB = {
  // Get all users
  async getAllUsers() {
    try {
      const db = await dbPromise;
      const allUsers = await db.getAll(USER_STORE);
      
      // Return users without password hashes
      return allUsers
        .filter(user => user.isActive !== false) // Only include active users
        .map(user => {
          const { passwordHash, ...userWithoutPassword } = user;
          return userWithoutPassword;
        });
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  },
  
  // Register a new user
  async registerUser(userData) {
    try {
      const db = await dbPromise;
      
      // Check if email already exists
      const allUsers = await db.getAll(USER_STORE);
      const existingEmail = allUsers.find(user => 
        user.email.toLowerCase() === userData.email.toLowerCase()
      );
      
      if (existingEmail) {
        throw new Error('Email already registered');
      }
      
      // Check if username already exists
      if (userData.username) {
        const existingUsername = allUsers.find(user => 
          user.username && user.username.toLowerCase() === userData.username.toLowerCase()
        );
        
        if (existingUsername) {
          throw new Error('Username already taken');
        }
      }
      
      // Create user object
      const user = {
        id: `user-${Date.now()}`,
        email: userData.email.toLowerCase(),
        username: userData.username ? userData.username.toLowerCase() : null,
        displayName: userData.displayName || userData.username,
        passwordHash: userData.passwordHash, // Should be pre-hashed
        createdAt: Date.now(),
        updatedAt: Date.now(),
        lastLogin: Date.now(),
        settings: userData.settings || {},
        isActive: true
      };
      
      // Save user to database
      await db.put(USER_STORE, user);
      
      // Return user without password hash
      const { passwordHash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      console.error('Error registering user:', error);
      throw error;
    }
  },
  
  // Login user by email and password hash
  async loginUser(email, passwordHash) {
    try {
      const db = await dbPromise;
      const allUsers = await db.getAll(USER_STORE);
      
      // Find user by email
      const user = allUsers.find(user => 
        user.email.toLowerCase() === email.toLowerCase()
      );
      
      if (!user) {
        throw new Error('User not found');
      }
      
      if (user.passwordHash !== passwordHash) {
        throw new Error('Invalid credentials');
      }
      
      // Update last login time
      user.lastLogin = Date.now();
      user.updatedAt = Date.now();
      await db.put(USER_STORE, user);
      
      // Return user without password hash
      const { passwordHash: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  },
  
  // Get user by ID
  async getUserById(id) {
    if (!id) return null;
    
    try {
      const db = await dbPromise;
      const user = await db.get(USER_STORE, id);
      
      if (!user) return null;
      
      // Return user without password hash
      const { passwordHash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return null;
    }
  },
  
  // Get user by email
  async getUserByEmail(email) {
    if (!email) return null;
    
    try {
      const db = await dbPromise;
      const allUsers = await db.getAll(USER_STORE);
      
      // Find user by email
      const user = allUsers.find(user => 
        user.email.toLowerCase() === email.toLowerCase()
      );
      
      if (!user) return null;
      
      // Return user without password hash
      const { passwordHash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      console.error('Error getting user by email:', error);
      return null;
    }
  },
  
  // Update user details
  async updateUser(userId, updates) {
    try {
      const db = await dbPromise;
      const user = await db.get(USER_STORE, userId);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      const allUsers = await db.getAll(USER_STORE);
      
      // Check if email is being updated and is not already taken
      if (updates.email && updates.email.toLowerCase() !== user.email) {
        const existingEmail = allUsers.find(u => 
          u.id !== userId && u.email.toLowerCase() === updates.email.toLowerCase()
        );
        
        if (existingEmail) {
          throw new Error('Email already registered');
        }
      }
      
      // Check if username is being updated and is not already taken
      if (updates.username && updates.username.toLowerCase() !== user.username) {
        const existingUsername = allUsers.find(u => 
          u.id !== userId && u.username && 
          u.username.toLowerCase() === updates.username.toLowerCase()
        );
        
        if (existingUsername) {
          throw new Error('Username already taken');
        }
      }
      
      // Update user fields
      const updatedUser = {
        ...user,
        email: updates.email ? updates.email.toLowerCase() : user.email,
        username: updates.username ? updates.username.toLowerCase() : user.username,
        displayName: updates.displayName || user.displayName,
        passwordHash: updates.passwordHash || user.passwordHash,
        settings: {
          ...user.settings,
          ...(updates.settings || {})
        },
        updatedAt: Date.now()
      };
      
      // Save updated user
      await db.put(USER_STORE, updatedUser);
      
      // Return user without password hash
      const { passwordHash, ...userWithoutPassword } = updatedUser;
      return userWithoutPassword;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },
  
  // Update user settings
  async updateUserSettings(userId, newSettings) {
    try {
      const db = await dbPromise;
      const user = await db.get(USER_STORE, userId);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Update settings
      user.settings = {
        ...user.settings,
        ...newSettings
      };
      
      user.updatedAt = Date.now();
      await db.put(USER_STORE, user);
      
      // Return updated settings
      return user.settings;
    } catch (error) {
      console.error('Error updating user settings:', error);
      throw error;
    }
  },
  
  // Delete a user (set as inactive)
  async deleteUser(userId) {
    try {
      const db = await dbPromise;
      const user = await db.get(USER_STORE, userId);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Set user as inactive instead of deleting
      user.isActive = false;
      user.updatedAt = Date.now();
      await db.put(USER_STORE, user);
      
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },
  
  // Permanently delete a user and all associated data (DANGER)
  async permanentlyDeleteUser(userId) {
    try {
      const db = await dbPromise;
      
      // Delete the user
      await db.delete(USER_STORE, userId);
      
      // Delete all user's data
      // Get all data and filter by userId
      const allChats = await db.getAll(CHAT_STORE);
      const userChats = allChats.filter(chat => chat.userId === userId);
      for (const chat of userChats) {
        await db.delete(CHAT_STORE, chat.id);
      }
      
      const allPersonas = await db.getAll(PERSONA_STORE);
      const userPersonas = allPersonas.filter(persona => persona.userId === userId);
      for (const persona of userPersonas) {
        await db.delete(PERSONA_STORE, persona.id);
      }
      
      const allFiles = await db.getAll(KNOWLEDGE_STORE);
      const userFiles = allFiles.filter(file => file.userId === userId);
      for (const file of userFiles) {
        await db.delete(KNOWLEDGE_STORE, file.id);
      }
      
      const allWorkflows = await db.getAll(WORKFLOW_STORE);
      const userWorkflows = allWorkflows.filter(workflow => workflow.userId === userId);
      for (const workflow of userWorkflows) {
        await db.delete(WORKFLOW_STORE, workflow.id);
      }
      
      const allTemplates = await db.getAll(TEMPLATE_STORE);
      const userTemplates = allTemplates.filter(template => template.userId === userId);
      for (const template of userTemplates) {
        await db.delete(TEMPLATE_STORE, template.id);
      }
      
      return true;
    } catch (error) {
      console.error('Error permanently deleting user:', error);
      throw error;
    }
  }
};

// In the chat schema
const chatSchema = {
  id: { type: 'number', primary: true },
  userId: { type: 'string', index: true }, // Original owner (creator) of this chat
  participants: { type: 'array' }, // Array of userIds who can access this chat
  messages: { type: 'array' },
  systemPrompt: { type: 'string' },
  model: { type: 'string' },
  createdAt: { type: 'number' },
  timestamp: { type: 'number' },
  title: { type: 'string' },
  activePersonas: { type: 'array' } // Array of persona IDs
};