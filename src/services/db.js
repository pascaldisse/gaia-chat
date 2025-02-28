import { openDB } from 'idb';

// Database configuration
const DB_NAME = 'chatApp';
const DB_VERSION = 5; // Increased version for new store
const CHAT_STORE = 'chats';
const PERSONA_STORE = 'personas';
const KNOWLEDGE_STORE = 'knowledge_files';
const WORKFLOW_STORE = 'workflows';
const TEMPLATE_STORE = 'workflow_templates';
const USER_STORE = 'users'; // New store for users

// Create/open the database
const dbPromise = openDB(DB_NAME, DB_VERSION, {
  upgrade(db, oldVersion) {
    // Create all object stores if they don't exist
    if (!db.objectStoreNames.contains(CHAT_STORE)) {
      const chatStore = db.createObjectStore(CHAT_STORE, { keyPath: 'id' });
      chatStore.createIndex('userId', 'userId'); // Index to query chats by user
    }
    
    if (!db.objectStoreNames.contains(PERSONA_STORE)) {
      const personaStore = db.createObjectStore(PERSONA_STORE, { 
        keyPath: 'id',
        autoIncrement: true 
      });
      personaStore.createIndex('userId', 'userId'); // Index to query personas by user
    }
    
    if (!db.objectStoreNames.contains(KNOWLEDGE_STORE)) {
      const knowledgeStore = db.createObjectStore(KNOWLEDGE_STORE, {
        keyPath: 'id',
        autoIncrement: true
      });
      knowledgeStore.createIndex('userId', 'userId'); // Index to query files by user
    }
    
    if (!db.objectStoreNames.contains(WORKFLOW_STORE)) {
      const workflowStore = db.createObjectStore(WORKFLOW_STORE, { 
        keyPath: 'id',
      });
      workflowStore.createIndex('updatedAt', 'updatedAt');
      workflowStore.createIndex('name', 'name');
      workflowStore.createIndex('userId', 'userId'); // Index to query workflows by user
    }
    
    if (!db.objectStoreNames.contains(TEMPLATE_STORE)) {
      const templateStore = db.createObjectStore(TEMPLATE_STORE, { 
        keyPath: 'id',
      });
      templateStore.createIndex('category', 'category');
      templateStore.createIndex('userId', 'userId'); // Index to query templates by user
    }
    
    // Create users store
    if (!db.objectStoreNames.contains(USER_STORE)) {
      const userStore = db.createObjectStore(USER_STORE, { 
        keyPath: 'id' 
      });
      userStore.createIndex('email', 'email', { unique: true });
      userStore.createIndex('username', 'username', { unique: true });
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
  
  // Get all chats for a specific user
  async getChatsByUser(userId) {
    if (!userId) return [];
    
    const db = await dbPromise;
    const index = db.transaction(CHAT_STORE).store.index('userId');
    const userChats = await index.getAll(userId);
    return userChats.sort((a, b) => b.createdAt - a.createdAt);
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
  },
  
  // Get a chat by ID and verify it belongs to a user
  async getUserChatById(id, userId) {
    if (!userId) return null;
    
    const db = await dbPromise;
    const chat = await db.get(CHAT_STORE, id);
    
    // Check if chat exists and belongs to the user
    if (!chat || chat.userId !== userId) {
      return null;
    }
    
    return chat;
  },
  
  // Move all anonymous chats to a user
  async assignChatsToUser(userId, chats = null) {
    const db = await dbPromise;
    
    // If no chats specified, assign all chats that don't have a userId
    if (!chats) {
      chats = await db.getAll(CHAT_STORE);
      chats = chats.filter(chat => !chat.userId);
    }
    
    // Update each chat with the userId
    for (const chat of chats) {
      chat.userId = userId;
      await db.put(CHAT_STORE, chat);
    }
    
    return chats.length;
  }
};

export const personaDB = {
  async getAllPersonas() {
    const db = await dbPromise;
    return db.getAll(PERSONA_STORE);
  },
  
  async getPersonasByUser(userId) {
    if (!userId) return [];
    
    const db = await dbPromise;
    const index = db.transaction(PERSONA_STORE).store.index('userId');
    return index.getAll(userId);
  },
  
  async savePersona(persona) {
    const db = await dbPromise;
    await db.put(PERSONA_STORE, persona);
  },
  
  async deletePersona(id) {
    const db = await dbPromise;
    await db.delete(PERSONA_STORE, id);
  },
  
  async getPersonaById(id) {
    const db = await dbPromise;
    return db.get(PERSONA_STORE, id);
  },
  
  async getUserPersonaById(id, userId) {
    if (!userId) return null;
    
    const db = await dbPromise;
    const persona = await db.get(PERSONA_STORE, id);
    
    // Check if persona exists and belongs to the user
    if (!persona || (persona.userId && persona.userId !== userId)) {
      return null;
    }
    
    return persona;
  },
  
  // Move all public/system personas to a user
  async assignPersonasToUser(userId, personas = null) {
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
  
  // Get all files for a specific user
  async getFilesByUser(userId) {
    if (!userId) return [];
    
    const db = await dbPromise;
    const index = db.transaction(KNOWLEDGE_STORE).store.index('userId');
    const files = await index.getAll(userId);
    
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
  
  // Get user files by their IDs
  async getUserFiles(fileIds, userId) {
    if (!userId) return [];
    
    const files = await this.getFiles(fileIds);
    return files.filter(file => !file.userId || file.userId === userId);
  },
  
  // Delete a file by ID
  async deleteFile(fileId) {
    const db = await dbPromise;
    await db.delete(KNOWLEDGE_STORE, fileId);
  },
  
  // Delete a user's file by ID
  async deleteUserFile(fileId, userId) {
    if (!userId) return false;
    
    const db = await dbPromise;
    const file = await db.get(KNOWLEDGE_STORE, fileId);
    
    // Check if file exists and belongs to the user
    if (!file || (file.userId && file.userId !== userId)) {
      return false;
    }
    
    await db.delete(KNOWLEDGE_STORE, fileId);
    return true;
  },
  
  // Assign files to a user
  async assignFilesToUser(userId, files = null) {
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
  },
  
  // Search files by content (advanced implementation with PDF parsing)
  async searchFiles(query, userId = null) {
    try {
      const db = await dbPromise;
      let allFiles;
      
      // If userId is provided, only search that user's files
      if (userId) {
        const index = db.transaction(KNOWLEDGE_STORE).store.index('userId');
        allFiles = await index.getAll(userId);
      } else {
        allFiles = await db.getAll(KNOWLEDGE_STORE);
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
  
  // Get a workflow by ID and verify it belongs to a user
  async getUserWorkflow(id, userId) {
    if (!userId) return null;
    
    const db = await dbPromise;
    const workflow = await db.get(WORKFLOW_STORE, id);
    
    // Check if workflow exists and belongs to the user
    if (!workflow || (workflow.userId && workflow.userId !== userId)) {
      return null;
    }
    
    return workflow;
  },
  
  // Get all workflows
  async getAllWorkflows() {
    const db = await dbPromise;
    const workflows = await db.getAll(WORKFLOW_STORE);
    return workflows.sort((a, b) => b.updatedAt - a.updatedAt);
  },
  
  // Get all workflows for a specific user
  async getWorkflowsByUser(userId) {
    if (!userId) return [];
    
    const db = await dbPromise;
    const index = db.transaction(WORKFLOW_STORE).store.index('userId');
    const workflows = await index.getAll(userId);
    return workflows.sort((a, b) => b.updatedAt - a.updatedAt);
  },
  
  // Delete a workflow
  async deleteWorkflow(id) {
    const db = await dbPromise;
    await db.delete(WORKFLOW_STORE, id);
    return true;
  },
  
  // Delete a user's workflow by ID
  async deleteUserWorkflow(id, userId) {
    if (!userId) return false;
    
    const db = await dbPromise;
    const workflow = await db.get(WORKFLOW_STORE, id);
    
    // Check if workflow exists and belongs to the user
    if (!workflow || (workflow.userId && workflow.userId !== userId)) {
      return false;
    }
    
    await db.delete(WORKFLOW_STORE, id);
    return true;
  },
  
  // Assign workflows to a user
  async assignWorkflowsToUser(userId, workflows = null) {
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
  
  // Get a template by ID and verify it belongs to a user
  async getUserTemplate(id, userId) {
    if (!userId) return null;
    
    const db = await dbPromise;
    const template = await db.get(TEMPLATE_STORE, id);
    
    // Check if template exists and belongs to the user or is a public template
    if (!template || (template.userId && template.userId !== userId && !template.isPublic)) {
      return null;
    }
    
    return template;
  },
  
  // Get all templates
  async getAllTemplates() {
    const db = await dbPromise;
    return db.getAll(TEMPLATE_STORE);
  },
  
  // Get all templates for a specific user (including public templates)
  async getTemplatesByUser(userId) {
    if (!userId) return [];
    
    const db = await dbPromise;
    const allTemplates = await db.getAll(TEMPLATE_STORE);
    
    // Return user's templates and public templates
    return allTemplates.filter(template => 
      !template.userId || template.userId === userId || template.isPublic
    );
  },
  
  // Get templates by category
  async getTemplatesByCategory(category) {
    const db = await dbPromise;
    const index = db.transaction(TEMPLATE_STORE).store.index('category');
    return index.getAll(category);
  },
  
  // Get templates by user and category (including public templates)
  async getTemplatesByUserAndCategory(userId, category) {
    if (!userId || !category) return [];
    
    const templates = await this.getTemplatesByUser(userId);
    return templates.filter(template => template.category === category);
  },
  
  // Delete a template
  async deleteTemplate(id) {
    const db = await dbPromise;
    await db.delete(TEMPLATE_STORE, id);
    return true;
  },
  
  // Delete a user's template by ID
  async deleteUserTemplate(id, userId) {
    if (!userId) return false;
    
    const db = await dbPromise;
    const template = await db.get(TEMPLATE_STORE, id);
    
    // Check if template exists and belongs to the user
    if (!template || (template.userId && template.userId !== userId)) {
      return false;
    }
    
    await db.delete(TEMPLATE_STORE, id);
    return true;
  },
  
  // Make a template public/private
  async setTemplateVisibility(id, userId, isPublic) {
    if (!userId) return false;
    
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
  },
  
  // Assign templates to a user
  async assignTemplatesToUser(userId, templates = null) {
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
  }
};

// In the chat schema
const chatSchema = {
  id: { type: 'number', primary: true },
  userId: { type: 'string', index: true }, // User who owns this chat
  messages: { type: 'array' },
  systemPrompt: { type: 'string' },
  model: { type: 'string' },
  createdAt: { type: 'number' },
  timestamp: { type: 'number' },
  title: { type: 'string' },
  activePersonas: { type: 'array' } // Array of persona IDs
};

// User database service
export const userDB = {
  // Register a new user
  async registerUser(userData) {
    const db = await dbPromise;
    
    // Check if email already exists
    const emailIndex = db.transaction(USER_STORE).store.index('email');
    const existingEmail = await emailIndex.get(userData.email.toLowerCase());
    if (existingEmail) {
      throw new Error('Email already registered');
    }
    
    // Check if username already exists
    if (userData.username) {
      const usernameIndex = db.transaction(USER_STORE).store.index('username');
      const existingUsername = await usernameIndex.get(userData.username.toLowerCase());
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
  },
  
  // Login user by email and password hash
  async loginUser(email, passwordHash) {
    const db = await dbPromise;
    const emailIndex = db.transaction(USER_STORE).store.index('email');
    const user = await emailIndex.get(email.toLowerCase());
    
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
  },
  
  // Get user by ID
  async getUserById(id) {
    if (!id) return null;
    
    const db = await dbPromise;
    const user = await db.get(USER_STORE, id);
    
    if (!user) return null;
    
    // Return user without password hash
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },
  
  // Get user by email
  async getUserByEmail(email) {
    if (!email) return null;
    
    const db = await dbPromise;
    const emailIndex = db.transaction(USER_STORE).store.index('email');
    const user = await emailIndex.get(email.toLowerCase());
    
    if (!user) return null;
    
    // Return user without password hash
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },
  
  // Update user details
  async updateUser(userId, updates) {
    const db = await dbPromise;
    const user = await db.get(USER_STORE, userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Check if email is being updated and is not already taken
    if (updates.email && updates.email.toLowerCase() !== user.email) {
      const emailIndex = db.transaction(USER_STORE).store.index('email');
      const existingEmail = await emailIndex.get(updates.email.toLowerCase());
      if (existingEmail) {
        throw new Error('Email already registered');
      }
    }
    
    // Check if username is being updated and is not already taken
    if (updates.username && updates.username.toLowerCase() !== user.username) {
      const usernameIndex = db.transaction(USER_STORE).store.index('username');
      const existingUsername = await usernameIndex.get(updates.username.toLowerCase());
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
  },
  
  // Update user settings
  async updateUserSettings(userId, newSettings) {
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
  },
  
  // Delete a user (set as inactive)
  async deleteUser(userId) {
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
  },
  
  // Permanently delete a user and all associated data (DANGER)
  async permanentlyDeleteUser(userId) {
    const db = await dbPromise;
    
    // Delete the user
    await db.delete(USER_STORE, userId);
    
    // Delete all user's data
    await Promise.all([
      // Delete chats
      (async () => {
        const chatIndex = db.transaction(CHAT_STORE).store.index('userId');
        const userChats = await chatIndex.getAll(userId);
        for (const chat of userChats) {
          await db.delete(CHAT_STORE, chat.id);
        }
      })(),
      
      // Delete personas
      (async () => {
        const personaIndex = db.transaction(PERSONA_STORE).store.index('userId');
        const userPersonas = await personaIndex.getAll(userId);
        for (const persona of userPersonas) {
          await db.delete(PERSONA_STORE, persona.id);
        }
      })(),
      
      // Delete knowledge files
      (async () => {
        const knowledgeIndex = db.transaction(KNOWLEDGE_STORE).store.index('userId');
        const userFiles = await knowledgeIndex.getAll(userId);
        for (const file of userFiles) {
          await db.delete(KNOWLEDGE_STORE, file.id);
        }
      })(),
      
      // Delete workflows
      (async () => {
        const workflowIndex = db.transaction(WORKFLOW_STORE).store.index('userId');
        const userWorkflows = await workflowIndex.getAll(userId);
        for (const workflow of userWorkflows) {
          await db.delete(WORKFLOW_STORE, workflow.id);
        }
      })(),
      
      // Delete templates
      (async () => {
        const templateIndex = db.transaction(TEMPLATE_STORE).store.index('userId');
        const userTemplates = await templateIndex.getAll(userId);
        for (const template of userTemplates) {
          await db.delete(TEMPLATE_STORE, template.id);
        }
      })()
    ]);
    
    return true;
  }
};