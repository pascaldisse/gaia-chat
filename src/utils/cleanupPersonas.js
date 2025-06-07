import { personaDB } from '../services/db';
import { DEFAULT_PERSONA_ID } from '../config/defaultPersona';

export async function cleanupPersonas() {
  try {
    console.log('Starting persona cleanup...');
    
    // Get all personas
    const allPersonas = await personaDB.getAllPersonas();
    console.log(`Found ${allPersonas.length} total personas`);
    
    // Filter out GAIA (default persona)
    const personasToDelete = allPersonas.filter(persona => 
      persona.id !== DEFAULT_PERSONA_ID
    );
    
    console.log(`Will delete ${personasToDelete.length} personas (keeping GAIA)`);
    
    // Delete each non-GAIA persona
    for (const persona of personasToDelete) {
      try {
        await personaDB.deletePersona(persona.id);
        console.log(`Deleted persona: ${persona.name} (${persona.id})`);
      } catch (error) {
        console.error(`Error deleting persona ${persona.name}:`, error);
      }
    }
    
    console.log('Persona cleanup complete!');
    
    // Return summary
    return {
      total: allPersonas.length,
      deleted: personasToDelete.length,
      kept: 1, // GAIA
      deletedPersonas: personasToDelete.map(p => ({
        id: p.id,
        name: p.name
      }))
    };
  } catch (error) {
    console.error('Error during persona cleanup:', error);
    throw error;
  }
}

// Function to get current user info
export async function getCurrentUserInfo() {
  try {
    // Check localStorage for user info
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      const user = JSON.parse(userStr);
      console.log('Current user from localStorage:', user);
      return user;
    }
    
    // Check sessionStorage
    const sessionUserStr = sessionStorage.getItem('currentUser');
    if (sessionUserStr) {
      const user = JSON.parse(sessionUserStr);
      console.log('Current user from sessionStorage:', user);
      return user;
    }
    
    console.log('No user currently logged in');
    return null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}