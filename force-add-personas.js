const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch({
      executablePath: '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
      headless: true
    });
    
    const page = await browser.newPage();
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    
    console.log('🔄 Loading page and forcing persona addition...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const result = await page.evaluate(async () => {
      console.log('=== FORCING PERSONA ADDITION ===');
      
      // Sample personas data (hardcoded for direct insertion)
      const samplePersonas = [
        {
          id: 'nsfw-partner-1',
          name: 'Succubus',
          systemPrompt: 'You are "Succubus" and you are a succubus.',
          model: 'meta-llama/Meta-Llama-3-70B-Instruct',
          image: 'https://placehold.co/400x400/9C0A5F/FFFFFF?text=Succubus',
          description: 'A mysterious supernatural character for roleplay.',
          published: true,
          partnerCreated: true,
          isNsfw: true
        },
        {
          id: 'partner-1',
          name: 'ProfessorEinstein',
          systemPrompt: 'You are Professor Einstein, a brilliant physicist.',
          model: 'meta-llama/Meta-Llama-3-70B-Instruct',
          image: 'https://placehold.co/400x400/2196F3/FFFFFF?text=Einstein',
          description: 'Learn physics with Einstein.',
          published: true,
          partnerCreated: true,
          isNsfw: false
        },
        {
          id: 'partner-2',
          name: 'ChefMario',
          systemPrompt: 'You are Chef Mario, an Italian culinary expert.',
          model: 'meta-llama/Meta-Llama-3-70B-Instruct',
          image: 'https://placehold.co/400x400/FF5722/FFFFFF?text=Chef',
          description: 'Authentic Italian recipes and cooking tips.',
          published: true,
          partnerCreated: true,
          isNsfw: false
        },
        {
          id: 'partner-3',
          name: 'CodeWizard',
          systemPrompt: 'You are CodeWizard, an expert software developer.',
          model: 'meta-llama/Meta-Llama-3-70B-Instruct',
          image: 'https://placehold.co/400x400/9C27B0/FFFFFF?text=Code',
          description: 'Programming help and code reviews.',
          published: true,
          partnerCreated: true,
          isNsfw: false
        },
        {
          id: 'oldraj-mxoemu',
          name: 'oldraj',
          systemPrompt: 'you are rajkosto, founder and lead developer of mxoemu',
          model: 'meta-llama/Meta-Llama-3-70B-Instruct',
          image: 'https://placehold.co/400x400/0D47A1/FFFFFF?text=oldraj',
          description: 'rajkosto from the early days of MXOEmu.',
          published: true,
          partnerCreated: true,
          isNsfw: false
        },
        {
          id: 'partner-4',
          name: 'DDNarrator',
          systemPrompt: 'You are a D&D Narrator who creates immersive fantasy adventures.',
          model: 'meta-llama/Meta-Llama-3-70B-Instruct',
          image: 'https://placehold.co/400x400/673AB7/FFFFFF?text=Narrator',
          description: 'D&D adventure narrator with rich storytelling.',
          published: true,
          partnerCreated: true,
          isNsfw: false
        }
      ];
      
      try {
        // Open database
        const db = await new Promise((resolve, reject) => {
          const request = indexedDB.open('chatApp', 6);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
        
        console.log('Database opened, adding personas...');
        
        const transaction = db.transaction(['personas'], 'readwrite');
        const store = transaction.objectStore('personas');
        
        let addedCount = 0;
        
        // Add each persona
        for (const persona of samplePersonas) {
          try {
            await new Promise((resolve, reject) => {
              const request = store.put(persona);
              request.onsuccess = () => {
                console.log('✅ Added persona:', persona.name);
                addedCount++;
                resolve();
              };
              request.onerror = () => {
                console.log('❌ Failed to add persona:', persona.name, request.error);
                resolve(); // Continue with others
              };
            });
          } catch (error) {
            console.log('Error adding', persona.name, ':', error.message);
          }
        }
        
        db.close();
        
        console.log(`Successfully added ${addedCount} personas to database`);
        
        return {
          success: true,
          addedCount: addedCount,
          totalExpected: samplePersonas.length
        };
        
      } catch (error) {
        console.error('Database operation failed:', error);
        return {
          success: false,
          error: error.message
        };
      }
    });
    
    console.log('\n🎯 FORCE ADD RESULT:', result);
    
    if (result.success) {
      console.log(`✅ Successfully added ${result.addedCount}/${result.totalExpected} personas`);
      console.log('\n🔄 Refreshing page to show new personas...');
      
      // Refresh the page to see the new personas
      await page.reload({ waitUntil: 'networkidle0' });
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check final result
      const finalPersonas = await page.evaluate(() => {
        const personaDivs = document.querySelectorAll('.persona-item');
        const personas = [];
        personaDivs.forEach(div => {
          const nameEl = div.querySelector('.persona-title');
          if (nameEl) {
            personas.push(nameEl.textContent.trim());
          }
        });
        return personas;
      });
      
      console.log('\n🎉 FINAL RESULT:');
      console.log('Personas now visible:', finalPersonas);
      console.log('Total count:', finalPersonas.length);
      
      if (finalPersonas.length > 1) {
        console.log('✅ SUCCESS: Sample personas have been restored!');
      } else {
        console.log('⚠️  Still only showing GAIA - may need app restart');
      }
      
    } else {
      console.log('❌ Failed to add personas:', result.error);
    }
    
    await browser.close();
    
  } catch (error) {
    console.error('Error:', error);
  }
})();