import { userDB, chatDB, personaDB, knowledgeDB, workflowDB, templateDB } from './db';
import { DEFAULT_PERSONA_ID } from '../config/defaultPersona';

// Simple hashing function for passwords (in a real app, use bcrypt or similar)
export const hashPassword = async (password) => {
  try {
    // Check if the Web Crypto API is available
    if (!window.crypto || !window.crypto.subtle) {
      // Fallback for environments where crypto.subtle is not available (like insecure contexts)
      console.warn('Web Crypto API not available, using simple hash fallback');
      let hash = 0;
      for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      // Convert to hex string and pad
      const hashHex = (hash >>> 0).toString(16).padStart(64, '0');
      return hashHex;
    }
    
    // Standard Web Crypto implementation
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  } catch (error) {
    console.error('Error in hashPassword:', error);
    // Emergency fallback - NOT SECURE, but prevents app breakage
    return Array.from(password)
      .reduce((hash, char) => ((hash << 5) - hash) + char.charCodeAt(0), 0)
      .toString(36)
      .padStart(64, '0');
  }
};

// Generate a session token
export const generateToken = () => {
  // Generate a random token
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
};

// Store user token in localStorage
export const storeUserSession = (user, token) => {
  const session = {
    userId: user.id,
    token: token,
    expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
    userData: {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      settings: user.settings
    }
  };
  
  localStorage.setItem('userSession', JSON.stringify(session));
  return session;
};

// Get user session from localStorage
export const getUserSession = () => {
  const sessionData = localStorage.getItem('userSession');
  if (!sessionData) return null;
  
  try {
    const session = JSON.parse(sessionData);
    
    // Check if session is expired
    if (session.expiresAt < Date.now()) {
      // Session expired, clear it
      localStorage.removeItem('userSession');
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('Error parsing user session:', error);
    localStorage.removeItem('userSession');
    return null;
  }
};

// Clear user session
export const clearUserSession = () => {
  localStorage.removeItem('userSession');
};

// Register a new user
export const registerUser = async (userData) => {
  try {
    // Hash the password
    const passwordHash = await hashPassword(userData.password);
    
    // Create user object
    const userToRegister = {
      email: userData.email,
      username: userData.username,
      displayName: userData.displayName || userData.username,
      passwordHash,
      settings: {
        theme: 'light',
        defaultModel: 'meta-llama/Meta-Llama-3-70B-Instruct',
        defaultPersona: DEFAULT_PERSONA_ID
      }
    };
    
    // Register user in database
    const user = await userDB.registerUser(userToRegister);
    
    // Generate a token for the user
    const token = generateToken();
    
    // Store user session
    const session = storeUserSession(user, token);
    
    // Copy existing data to the new user
    await assignExistingDataToUser(user.id);
    
    return {
      user,
      token,
      expiresAt: session.expiresAt
    };
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
};

// Login a user
export const loginUser = async (email, password) => {
  try {
    // Hash the password
    const passwordHash = await hashPassword(password);
    
    // Try to login
    const user = await userDB.loginUser(email, passwordHash);
    
    // Generate a token for the user
    const token = generateToken();
    
    // Store user session
    const session = storeUserSession(user, token);
    
    return {
      user,
      token,
      expiresAt: session.expiresAt
    };
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
};

// Logout a user
export const logoutUser = () => {
  clearUserSession();
};

// Verify if user is logged in
export const isLoggedIn = () => {
  return getUserSession() !== null;
};

// Get current user data
export const getCurrentUser = async () => {
  const session = getUserSession();
  if (!session) return null;
  
  try {
    // Get fresh user data from the database
    const user = await userDB.getUserById(session.userId);
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// Update user data
export const updateUserData = async (updates) => {
  const session = getUserSession();
  if (!session) throw new Error('User not logged in');
  
  try {
    // Update the user in the database
    const updatedUser = await userDB.updateUser(session.userId, updates);
    
    // Update session in localStorage with new user data
    session.userData = {
      id: updatedUser.id,
      email: updatedUser.email,
      username: updatedUser.username,
      displayName: updatedUser.displayName,
      settings: updatedUser.settings
    };
    
    localStorage.setItem('userSession', JSON.stringify(session));
    
    return updatedUser;
  } catch (error) {
    console.error('Error updating user data:', error);
    throw error;
  }
};

// Update user settings
export const updateUserSettings = async (newSettings) => {
  const session = getUserSession();
  if (!session) throw new Error('User not logged in');
  
  try {
    // Update settings in the database
    const updatedSettings = await userDB.updateUserSettings(session.userId, newSettings);
    
    // Update session in localStorage
    session.userData.settings = updatedSettings;
    localStorage.setItem('userSession', JSON.stringify(session));
    
    return updatedSettings;
  } catch (error) {
    console.error('Error updating user settings:', error);
    throw error;
  }
};

// Helper function to assign existing anonymous data to a new user
const assignExistingDataToUser = async (userId) => {
  try {
    // Assign chats
    await chatDB.assignChatsToUser(userId);
    
    // Assign personas
    await personaDB.assignPersonasToUser(userId);
    
    // Assign knowledge files
    await knowledgeDB.assignFilesToUser(userId);
    
    // Assign workflows
    await workflowDB.assignWorkflowsToUser(userId);
    
    // Assign templates
    await templateDB.assignTemplatesToUser(userId);
    
    return true;
  } catch (error) {
    console.error('Error assigning existing data to user:', error);
    return false;
  }
};

// Delete user account
export const deleteUserAccount = async (password) => {
  const session = getUserSession();
  if (!session) throw new Error('User not logged in');
  
  try {
    // Verify password
    const passwordHash = await hashPassword(password);
    const user = await userDB.getUserById(session.userId);
    
    // Get user with password hash
    const db = await (await import('./db')).dbPromise;
    const fullUser = await db.get('users', session.userId);
    
    if (fullUser.passwordHash !== passwordHash) {
      throw new Error('Invalid password');
    }
    
    // Delete user from database
    await userDB.deleteUser(session.userId);
    
    // Clear session
    clearUserSession();
    
    return true;
  } catch (error) {
    console.error('Error deleting user account:', error);
    throw error;
  }
};