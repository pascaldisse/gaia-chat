# How to Delete All Personas Except GAIA

There are THREE ways to delete all personas except GAIA:

## Method 1: Developer Overlay (RECOMMENDED)
1. Open your Gaia Chat app in the browser
2. Press the backtick key (`) to open the Developer Overlay
3. In the "Data Cleanup" tab, click "Delete All Personas Except GAIA"
4. The tool will show you what was deleted

## Method 2: Browser Console
1. Open your Gaia Chat app
2. Open browser console (F12 or right-click → Inspect → Console)
3. Copy and paste this command:

```javascript
// Quick one-liner to delete all personas except GAIA
(async()=>{const p=await personaDB.getAllPersonas();for(const x of p)if(x.id!=='GAIA_DEFAULT')await personaDB.deletePersona(x.id);console.log('Done! Only GAIA remains.')})();
```

Or use the full script from `/public/delete-personas-console.js` for more detailed output.

## Method 3: Cleanup HTML Page
1. Navigate to: `http://localhost:3001/cleanup-personas.html`
2. Click the "Delete All Personas Except GAIA" button

## What Will Be Deleted
The following personas will be removed:
- oldraj (oldraj-mxoemu)
- Succubus (nsfw-partner-1)
- ProfessorEinstein (partner-1)
- ChefMario (partner-2)
- CodeWizard (partner-3)
- DDNarrator (partner-4)
- Any other user-created personas

## What Will Remain
- GAIA (ID: GAIA_DEFAULT) - The default system persona

## Verification
After running the cleanup:
1. Check the sidebar - only GAIA should appear
2. Or run in console: `await personaDB.getAllPersonas()`
3. Should return an array with only one persona (GAIA)

## Files Created
- `/src/utils/deletePersonasExceptGaia.js` - Cleanup utility
- `/src/components/admin/PersonaCleanup.js` - UI component
- `/src/utils/cleanupPersonas.js` - Main cleanup function
- `/public/cleanup-personas.html` - Standalone cleanup page
- `/public/delete-personas-console.js` - Console script

The cleanup is already integrated into the Developer Overlay for easy access!