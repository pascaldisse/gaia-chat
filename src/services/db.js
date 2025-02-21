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
  async addFile(file) {
    const db = await dbPromise;
    return db.add(KNOWLEDGE_STORE, file);
  },

  async deleteFile(id) {
    const db = await dbPromise;
    return db.delete(KNOWLEDGE_STORE, id);
  },

  async getFiles(ids) {
    const db = await dbPromise;
    const files = await Promise.all(ids.map(id => db.get(KNOWLEDGE_STORE, id)));
    return files.map(file => ({
      ...file,
      parsedText: file.parsedText || '' // Ensure parsedText exists
    }));
  },

  async getAllFiles() {
    const db = await dbPromise;
    return db.getAll(KNOWLEDGE_STORE);
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

