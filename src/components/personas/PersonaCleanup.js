import React, { useEffect } from 'react';
import { personaDB } from '../../services/db';
import { DEFAULT_PERSONA_ID } from '../../config/defaultPersona';

const PersonaCleanup = () => {
  useEffect(() => {
    const deleteAllPersonasExceptGaia = async () => {
      console.log('EXECUTING AUTOMATIC PERSONA CLEANUP...');
      
      try {
        // Get all personas
        const allPersonas = await personaDB.getAllPersonas();
        console.log(`Found ${allPersonas.length} personas in database`);
        
        // Delete each persona except GAIA
        for (const persona of allPersonas) {
          if (persona.id !== DEFAULT_PERSONA_ID) {
            console.log(`Deleting persona: ${persona.name} (ID: ${persona.id})`);
            await personaDB.deletePersona(persona.id);
          }
        }
        
        console.log('CLEANUP COMPLETE - Only GAIA remains');
      } catch (error) {
        console.error('Error during cleanup:', error);
      }
    };
    
    // Execute immediately
    deleteAllPersonasExceptGaia();
  }, []);
  
  return null;
};

export default PersonaCleanup;