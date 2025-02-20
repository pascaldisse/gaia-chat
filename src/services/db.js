import { openDB } from 'idb';

// Database configuration
const DB_NAME = 'chatApp';
const DB_VERSION = 1;
const CHAT_STORE = 'chats';

// Create/open the database
const dbPromise = openDB(DB_NAME, DB_VERSION, {
  upgrade(db) {
    // Create the object store if it doesn't exist
    if (!db.objectStoreNames.contains(CHAT_STORE)) {
      db.createObjectStore(CHAT_STORE, { keyPath: 'id' });
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