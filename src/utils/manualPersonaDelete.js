// Manual IndexedDB persona deletion script
// This directly opens the database and deletes specific persona entries

async function manualDeletePersonas() {
  const DB_NAME = 'chatApp';
  const DB_VERSION = 6;
  const PERSONA_STORE = 'personas';
  
  // Personas to delete
  const personasToDelete = [
    'oldraj',
    'Succubus', 
    'ProfessorEinstein',
    'ChefMario',
    'CodeWizard',
    'DDNarrator'
  ];
  
  console.log('Opening database connection...');
  
  // Open direct connection to IndexedDB
  const openRequest = indexedDB.open(DB_NAME, DB_VERSION);
  
  openRequest.onerror = function() {
    console.error('Error opening database:', openRequest.error);
  };
  
  openRequest.onsuccess = function() {
    const db = openRequest.result;
    console.log('Database opened successfully');
    
    // Start a transaction
    const transaction = db.transaction([PERSONA_STORE], 'readwrite');
    const objectStore = transaction.objectStore(PERSONA_STORE);
    
    // First, let's get all personas to see their IDs
    const getAllRequest = objectStore.getAll();
    
    getAllRequest.onsuccess = function() {
      const allPersonas = getAllRequest.result;
      console.log(`Found ${allPersonas.length} total personas in database`);
      
      // Find personas by name
      const personasToRemove = allPersonas.filter(persona => 
        personasToDelete.includes(persona.name)
      );
      
      console.log(`Found ${personasToRemove.length} personas to delete:`);
      personasToRemove.forEach(persona => {
        console.log(`- ${persona.name} (ID: ${persona.id})`);
      });
      
      // Delete each persona one by one
      personasToRemove.forEach(persona => {
        console.log(`\nDeleting ${persona.name} (ID: ${persona.id})...`);
        
        const deleteRequest = objectStore.delete(persona.id);
        
        deleteRequest.onsuccess = function() {
          console.log(`✓ Successfully deleted ${persona.name}`);
        };
        
        deleteRequest.onerror = function() {
          console.error(`✗ Error deleting ${persona.name}:`, deleteRequest.error);
        };
      });
    };
    
    getAllRequest.onerror = function() {
      console.error('Error getting all personas:', getAllRequest.error);
    };
    
    transaction.oncomplete = function() {
      console.log('\nTransaction completed. Verifying deletions...');
      
      // Open a new transaction to verify
      const verifyTransaction = db.transaction([PERSONA_STORE], 'readonly');
      const verifyStore = verifyTransaction.objectStore(PERSONA_STORE);
      const verifyRequest = verifyStore.getAll();
      
      verifyRequest.onsuccess = function() {
        const remainingPersonas = verifyRequest.result;
        const remainingNames = remainingPersonas.map(p => p.name);
        
        console.log(`\nRemaining personas (${remainingPersonas.length} total):`);
        remainingPersonas.forEach(persona => {
          console.log(`- ${persona.name} (ID: ${persona.id})`);
        });
        
        // Check if our target personas were deleted
        const stillExists = personasToDelete.filter(name => 
          remainingNames.includes(name)
        );
        
        if (stillExists.length > 0) {
          console.error('\n⚠️ WARNING: These personas still exist:', stillExists);
        } else {
          console.log('\n✅ All target personas successfully deleted!');
        }
        
        db.close();
      };
    };
    
    transaction.onerror = function() {
      console.error('Transaction error:', transaction.error);
      db.close();
    };
  };
  
  openRequest.onupgradeneeded = function() {
    console.log('Database upgrade needed - this should not happen');
  };
}

// Alternative method using cursor for individual deletion
async function deletePersonaByIdDirectly(personaId) {
  const DB_NAME = 'chatApp';
  const DB_VERSION = 6;
  const PERSONA_STORE = 'personas';
  
  return new Promise((resolve, reject) => {
    const openRequest = indexedDB.open(DB_NAME, DB_VERSION);
    
    openRequest.onsuccess = function() {
      const db = openRequest.result;
      const transaction = db.transaction([PERSONA_STORE], 'readwrite');
      const objectStore = transaction.objectStore(PERSONA_STORE);
      
      console.log(`Attempting to delete persona with ID: ${personaId}`);
      
      const deleteRequest = objectStore.delete(personaId);
      
      deleteRequest.onsuccess = function() {
        console.log(`Successfully deleted persona ID: ${personaId}`);
        resolve(true);
      };
      
      deleteRequest.onerror = function() {
        console.error(`Error deleting persona ID ${personaId}:`, deleteRequest.error);
        reject(deleteRequest.error);
      };
      
      transaction.oncomplete = function() {
        db.close();
      };
    };
    
    openRequest.onerror = function() {
      reject(openRequest.error);
    };
  });
}

// Method to find and delete personas by exact ID
async function findAndDeleteByExactIds() {
  const DB_NAME = 'chatApp';
  const DB_VERSION = 6;
  const PERSONA_STORE = 'personas';
  
  console.log('Finding personas and their exact IDs...');
  
  const openRequest = indexedDB.open(DB_NAME, DB_VERSION);
  
  openRequest.onsuccess = async function() {
    const db = openRequest.result;
    const transaction = db.transaction([PERSONA_STORE], 'readonly');
    const objectStore = transaction.objectStore(PERSONA_STORE);
    
    const getAllRequest = objectStore.getAll();
    
    getAllRequest.onsuccess = async function() {
      const allPersonas = getAllRequest.result;
      
      // Group by name to see duplicates
      const personasByName = {};
      allPersonas.forEach(persona => {
        if (!personasByName[persona.name]) {
          personasByName[persona.name] = [];
        }
        personasByName[persona.name].push(persona);
      });
      
      console.log('\nPersonas grouped by name:');
      Object.entries(personasByName).forEach(([name, personas]) => {
        console.log(`\n${name}: ${personas.length} instance(s)`);
        personas.forEach(p => {
          console.log(`  ID: ${p.id}, Created: ${new Date(p.createdAt).toLocaleString()}`);
        });
      });
      
      db.close();
      
      // Now delete specific IDs
      const idsToDelete = [];
      
      // Find IDs for our target personas
      ['oldraj', 'Succubus', 'ProfessorEinstein', 'ChefMario', 'CodeWizard', 'DDNarrator'].forEach(name => {
        if (personasByName[name]) {
          personasByName[name].forEach(p => idsToDelete.push(p.id));
        }
      });
      
      if (idsToDelete.length > 0) {
        console.log('\nDeleting the following IDs:', idsToDelete);
        
        for (const id of idsToDelete) {
          try {
            await deletePersonaByIdDirectly(id);
          } catch (error) {
            console.error(`Failed to delete ID ${id}:`, error);
          }
        }
      }
    };
  };
}

// Export functions for use
export { manualDeletePersonas, deletePersonaByIdDirectly, findAndDeleteByExactIds };

// If running directly in browser console
if (typeof window !== 'undefined') {
  window.manualDeletePersonas = manualDeletePersonas;
  window.deletePersonaByIdDirectly = deletePersonaByIdDirectly;
  window.findAndDeleteByExactIds = findAndDeleteByExactIds;
}