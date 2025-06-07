import { personaDB } from '../services/db';
import { DEFAULT_PERSONA_ID } from '../config/defaultPersona';

// List of persona IDs to delete (based on SamplePersonas.js)
const PERSONAS_TO_DELETE = [
  'oldraj-mxoemu',
  'nsfw-partner-1', // Succubus
  'partner-1', // ProfessorEinstein
  'partner-2', // ChefMario
  'partner-3', // CodeWizard
  'partner-4', // DDNarrator
  'user-1', // MedievalBard
  'user-2', // ProductivityCoach
  'user-3', // DungeonMaster
  'user-4', // RomanceNovelist
];

async function deletePersonasExceptGaia() {
  console.log('Starting deletion of all personas except GAIA...');
  console.log('GAIA ID:', DEFAULT_PERSONA_ID);
  
  try {
    // Get all personas from the database
    const allPersonas = await personaDB.getAllPersonas();
    console.log(`Found ${allPersonas.length} personas in database`);
    
    // Filter out personas to delete (everything except GAIA)
    const personasToDelete = allPersonas.filter(persona => 
      persona.id !== DEFAULT_PERSONA_ID && 
      persona.name !== 'GAIA' // Double check by name too
    );
    
    console.log(`Will delete ${personasToDelete.length} personas:`);
    personasToDelete.forEach(persona => {
      console.log(`  - ${persona.name} (ID: ${persona.id})`);
    });
    
    // Delete each persona
    let deletedCount = 0;
    for (const persona of personasToDelete) {
      try {
        console.log(`Deleting ${persona.name} (ID: ${persona.id})...`);
        await personaDB.deletePersona(persona.id);
        deletedCount++;
        console.log(`  ✓ Deleted successfully`);
      } catch (error) {
        console.error(`  ✗ Failed to delete ${persona.name}:`, error);
      }
    }
    
    console.log(`\nDeletion complete. Deleted ${deletedCount} out of ${personasToDelete.length} personas.`);
    
    // Verify what's left
    const remainingPersonas = await personaDB.getAllPersonas();
    console.log(`\nRemaining personas (${remainingPersonas.length}):`);
    remainingPersonas.forEach(persona => {
      console.log(`  - ${persona.name} (ID: ${persona.id})`);
    });
    
  } catch (error) {
    console.error('Error during deletion process:', error);
  }
}

// Export for use in other files
export default deletePersonasExceptGaia;

// Run if this file is executed directly
if (typeof window !== 'undefined') {
  // Browser environment - add to window for easy access
  window.deletePersonasExceptGaia = deletePersonasExceptGaia;
  console.log('Function added to window. Run window.deletePersonasExceptGaia() in console.');
} else {
  // Node environment
  deletePersonasExceptGaia();
}