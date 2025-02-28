import React, { createContext, useState, useEffect, useContext } from 'react';
import { 
  getUserSession, 
  registerUser, 
  loginUser, 
  logoutUser, 
  updateUserData,
  updateUserSettings,
  deleteUserAccount,
  getCurrentUser
} from '../services/auth';

// Create the context
export const UserContext = createContext();

// Create a provider component
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Initialize user state from localStorage session
  useEffect(() => {
    const initializeUser = async () => {
      try {
        setIsLoading(true);
        
        // Try to get current user from session
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        
        setError(null);
      } catch (err) {
        console.error('Error initializing user session:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeUser();
  }, []);
  
  // Register a new user
  const register = async (userData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await registerUser(userData);
      setUser(result.user);
      
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Login an existing user
  const login = async (email, password) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await loginUser(email, password);
      setUser(result.user);
      
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Logout the current user
  const logout = () => {
    logoutUser();
    setUser(null);
    
    // Force a reload to reset application state
    window.location.reload();
  };
  
  // Update user data
  const updateUser = async (updates) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const updatedUser = await updateUserData(updates);
      setUser(updatedUser);
      
      return updatedUser;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Update user settings
  const updateSettings = async (newSettings) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const updatedSettings = await updateUserSettings(newSettings);
      setUser(prev => ({
        ...prev,
        settings: updatedSettings
      }));
      
      return updatedSettings;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Delete user account
  const deleteAccount = async (password) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await deleteUserAccount(password);
      setUser(null);
      
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  // The context value that will be provided
  const contextValue = {
    user,
    isLoading,
    error,
    register,
    login,
    logout,
    updateUser,
    updateSettings,
    deleteAccount,
    isLoggedIn: !!user
  };
  
  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook for using the user context
export const useUser = () => {
  const context = useContext(UserContext);
  
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  
  return context;
};