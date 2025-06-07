// Console script to delete all personas except GAIA
// Copy and paste this into your browser console while on the Gaia Chat app

(async function deleteAllPersonasExceptGaia() {
    console.log('🧹 Starting persona cleanup...');
    
    try {
        // Check if we're in the right app
        if (!window.personaDB) {
            console.error('❌ personaDB not found. Make sure you are on the Gaia Chat app.');
            return;
        }
        
        const DEFAULT_PERSONA_ID = 'GAIA_DEFAULT';
        
        // Get all personas
        const allPersonas = await window.personaDB.getAllPersonas();
        console.log(`📊 Found ${allPersonas.length} total personas`);
        
        // Show all personas
        console.log('Current personas:');
        allPersonas.forEach(p => console.log(`  - ${p.name} (ID: ${p.id})`));
        
        // Filter out GAIA
        const personasToDelete = allPersonas.filter(persona => 
            persona.id !== DEFAULT_PERSONA_ID
        );
        
        if (personasToDelete.length === 0) {
            console.log('✅ Only GAIA exists. Nothing to delete.');
            return;
        }
        
        console.log(`🗑️ Will delete ${personasToDelete.length} personas (keeping GAIA)`);
        
        // Confirm deletion
        const confirmDelete = confirm(`Delete ${personasToDelete.length} personas? This will keep only GAIA.`);
        if (!confirmDelete) {
            console.log('❌ Deletion cancelled by user');
            return;
        }
        
        // Delete each non-GAIA persona
        let deletedCount = 0;
        for (const persona of personasToDelete) {
            try {
                await window.personaDB.deletePersona(persona.id);
                console.log(`✅ Deleted: ${persona.name} (${persona.id})`);
                deletedCount++;
            } catch (error) {
                console.error(`❌ Error deleting ${persona.name}:`, error);
            }
        }
        
        console.log(`\n🎉 Cleanup complete! Deleted ${deletedCount} personas.`);
        console.log('💚 GAIA remains as the only persona.');
        
        // Verify final state
        const remainingPersonas = await window.personaDB.getAllPersonas();
        console.log(`\nFinal state: ${remainingPersonas.length} persona(s) remaining:`);
        remainingPersonas.forEach(p => console.log(`  - ${p.name} (ID: ${p.id})`));
        
        // Reload to refresh the UI
        if (confirm('Reload the page to see changes?')) {
            window.location.reload();
        }
        
    } catch (error) {
        console.error('❌ Error during cleanup:', error);
    }
})();