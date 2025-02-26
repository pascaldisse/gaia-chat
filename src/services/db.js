import { openDB } from 'idb';

// Database configuration
const DB_NAME = 'chatApp';
const DB_VERSION = 3;
const CHAT_STORE = 'chats';
const PERSONA_STORE = 'personas';
const KNOWLEDGE_STORE = 'knowledge_files';

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
  
  // Search files by content (basic implementation)
  async searchFiles(query) {
    const db = await dbPromise;
    const allFiles = await db.getAll(KNOWLEDGE_STORE);
    
    // Simple string matching search (could be improved with proper indexing)
    return allFiles.filter(file => 
      file.content && file.content.toLowerCase().includes(query.toLowerCase())
    );
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

