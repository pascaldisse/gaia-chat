// Utility to clear all user data from IndexedDB
export async function clearAllUserData() {
  try {
    console.log('Starting to clear all user data...');
    
    // List of all IndexedDB databases used by the app
    const databases = [
      'GaiaChatDB',      // Main database
      'PersonaDB',       // Personas
      'KnowledgeDB',     // Knowledge base files
      'UserDB'           // User data
    ];
    
    // Delete each database
    for (const dbName of databases) {
      try {
        await deleteDatabase(dbName);
        console.log(`Deleted database: ${dbName}`);
      } catch (error) {
        console.error(`Error deleting ${dbName}:`, error);
      }
    }
    
    // Clear localStorage
    localStorage.clear();
    console.log('Cleared localStorage');
    
    // Clear sessionStorage
    sessionStorage.clear();
    console.log('Cleared sessionStorage');
    
    console.log('All user data has been cleared successfully');
    return true;
  } catch (error) {
    console.error('Error clearing user data:', error);
    return false;
  }
}

// Helper function to delete a database
function deleteDatabase(dbName) {
  return new Promise((resolve, reject) => {
    const deleteReq = indexedDB.deleteDatabase(dbName);
    
    deleteReq.onsuccess = () => {
      console.log(`Database ${dbName} deleted successfully`);
      resolve();
    };
    
    deleteReq.onerror = () => {
      console.error(`Error deleting database ${dbName}`);
      reject(deleteReq.error);
    };
    
    deleteReq.onblocked = () => {
      console.warn(`Delete blocked for database ${dbName}`);
      // Still resolve as the database will be deleted when connections close
      resolve();
    };
  });
}

// Function to get all IndexedDB database names (for debugging)
export async function listAllDatabases() {
  try {
    const databases = await indexedDB.databases();
    console.log('Available databases:', databases);
    return databases;
  } catch (error) {
    console.error('Error listing databases:', error);
    // Fallback for browsers that don't support databases()
    console.log('This browser does not support indexedDB.databases()');
    return [];
  }
}