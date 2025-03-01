import React, { useState, useEffect, useRef } from 'react';
import '../styles/Message.css';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import ReactMarkdown from 'react-markdown';
import { generateSpeech, getTTSEngine, splitTextIntoSentences, generateSpeechChunks } from '../services/voiceService';

// CRUCIAL UPDATE: Added debug info at top level - after imports to avoid eslint errors
console.log('%c *** MESSAGE.JS LOADED WITH DEBUG VERSION ***', 'background: red; color: white; font-size: 24px; padding: 10px;');
window.DEBUG_MESSAGE_LOADED = true;

const Message = ({ message, onRegenerate, personas }) => {
  const persona = message.personaId ? personas.find(p => p.id === message.personaId) : null;
  const [showToolDetails, setShowToolDetails] = useState(false);
  const [audioUrls, setAudioUrls] = useState([]);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [formatted, setFormatted] = useState(false);
  const [formattedContent, setFormattedContent] = useState('');
  const [currentAudioIndex, setCurrentAudioIndex] = useState(0);
  const audioRef = useRef(null);
  const audioQueue = useRef([]);
  const audioContext = useRef(null);
  
  // Log every time audioUrls changes
  useEffect(() => {
    console.log('🔊 [AUDIO-TRACK] audioUrls state changed:', {
      length: audioUrls.length,
      isEmpty: audioUrls.length === 0,
      isArray: Array.isArray(audioUrls),
      type: typeof audioUrls,
      firstItem: audioUrls.length > 0 ? typeof audioUrls[0] : 'N/A',
      preview: audioUrls.length > 0 ? audioUrls[0]?.substring(0, 30) + '...' : 'empty'
    });
  }, [audioUrls]);

  // Function to play next audio in queue
  const playNextAudio = async () => {
    console.log(`🔊 [AUDIO-PLAY] playNextAudio called, index ${currentAudioIndex + 1}`);
    
    // Check if this is an initial playback and handle accordingly
    if (window._initialAudioPlayback) {
      console.log('🔊 [AUDIO-PLAY] Initial playback detected - ensuring we start from index 0');
      window._initialAudioPlayback = false; // Clear the flag
      
      // Make sure we're at index 0 for the first playback
      if (currentAudioIndex !== 0) {
        console.log('🔊 [AUDIO-PLAY] Resetting index to 0 for initial playback');
        setCurrentAudioIndex(0);
        return; // The state update will trigger another call to this function
      }
    }
    
    // Try to use window backup if state is empty (fallback mechanism)
    let urlsToUse = audioUrls;
    if (!audioUrls || audioUrls.length === 0) {
      if (window._debugAudioUrls && window._debugAudioUrls.length > 0) {
        console.log('🔊 [AUDIO-PLAY] Using backup array from window._debugAudioUrls');
        urlsToUse = window._debugAudioUrls;
        // Update state with backup
        setAudioUrls(window._debugAudioUrls);
      }
    }
    
    console.log(`🔊 [AUDIO-PLAY] Attempting to play audio chunk ${currentAudioIndex + 1}/${urlsToUse.length}`);
    console.time(`🔊 [AUDIO-PLAY] Chunk ${currentAudioIndex + 1} playback`);
    
    // Check if audioUrls array exists and has items
    if (!urlsToUse || urlsToUse.length === 0) {
      console.error('🔊 [AUDIO-PLAY] ERROR: Audio array is empty or undefined!', {
        stateArray: audioUrls,
        backupArray: window._debugAudioUrls
      });
      setIsPlaying(false);
      return;
    }
    
    // Log full array for debugging - using multiple methods to ensure visibility
    console.log(`🔊 [AUDIO-PLAY] FULL AUDIO URLS ARRAY (stringified):`, JSON.stringify(urlsToUse));
    console.log(`🔊 [AUDIO-PLAY] AUDIO ARRAY LENGTH: ${urlsToUse.length}`);
    if (urlsToUse.length > 0) {
      console.log(`🔊 [AUDIO-PLAY] FIRST AUDIO URL (truncated): ${urlsToUse[0] ? urlsToUse[0].substring(0, 50) + '...' : 'undefined'}`);
    }
    // Force array display in console
    console.table(urlsToUse);
    
    // Log each URL with a safe substring to avoid console errors
    console.log(`🔊 [AUDIO-PLAY] Audio URLs array summary (${urlsToUse.length} items):`);
    urlsToUse.forEach((url, i) => {
      // Handle potential undefined or null URLs
      let urlPreview;
      try {
        urlPreview = url ? 
          (typeof url === 'string' ? 
            (url.startsWith('blob:') ? 
              `blob:${url.substring(5, 15)}...` : 
              (url.startsWith('data:audio') ? 
                `data:audio/${url.substring(11, 30)}...` : 
                `other:${url.substring(0, 20)}...`)) : 
            `non-string type: ${typeof url}`) : 
          'null';
      } catch (e) {
        urlPreview = `Error getting preview: ${e.message}`;
      }
      
      console.log(`🔊 [AUDIO-PLAY] URL[${i}]: ${urlPreview}${i === currentAudioIndex ? ' (current)' : ''}`);
    });
    
    if (currentAudioIndex < urlsToUse.length) {
      try {
        // Debug info about current audio state
        console.log(`🔊 [AUDIO-CURRENT] Playing chunk ${currentAudioIndex + 1}/${urlsToUse.length}`);
        console.log(`🔊 [AUDIO-CURRENT] Current URL: ${urlsToUse[currentAudioIndex] ? 
          (typeof urlsToUse[currentAudioIndex] === 'string' ? 
            urlsToUse[currentAudioIndex].substring(0, 50) + '...' : 
            `non-string: ${typeof urlsToUse[currentAudioIndex]}`) : 
          'null/undefined'}`);
        
        if (audioRef.current) {
          console.log(`🔊 [AUDIO-PLAY] Setting source to chunk ${currentAudioIndex + 1}/${urlsToUse.length}`);
          console.time(`🔊 [AUDIO-PLAY] Audio load time for chunk ${currentAudioIndex + 1}`);
          
          // Debug verification before setting source
          if (!urlsToUse[currentAudioIndex]) {
            console.error(`🔊 [AUDIO-ERROR] URL at index ${currentAudioIndex} is null or undefined!`);
            throw new Error(`Invalid audio URL at index ${currentAudioIndex}`);
          }
          
          audioRef.current.src = urlsToUse[currentAudioIndex];
          console.log(`🔊 [AUDIO-CURRENT] Set audio element src to: ${urlsToUse[currentAudioIndex].substring(0, 50)}...`);
          
          // Listen for the canplaythrough event to measure load time
          const loadPromise = new Promise(resolve => {
            const loadHandler = () => {
              console.timeEnd(`[AUDIO-PLAY] Audio load time for chunk ${currentAudioIndex + 1}`);
              console.log(`🔊 [AUDIO-CURRENT] Audio can play through - ready to start playback`);
              audioRef.current.removeEventListener('canplaythrough', loadHandler);
              resolve();
            };
            audioRef.current.addEventListener('canplaythrough', loadHandler, { once: true });
            
            // Set a timeout in case canplaythrough doesn't fire
            setTimeout(() => {
              audioRef.current.removeEventListener('canplaythrough', loadHandler);
              console.log(`[AUDIO-PLAY] Chunk ${currentAudioIndex + 1} load timeout, proceeding anyway`);
              resolve();
            }, 2000);
          });
          
          await loadPromise;
          console.time(`[AUDIO-PLAY] Play() call for chunk ${currentAudioIndex + 1}`);
          console.log(`🔊 [AUDIO-CURRENT] Starting playback now...`);
          await audioRef.current.play();
          console.timeEnd(`[AUDIO-PLAY] Play() call for chunk ${currentAudioIndex + 1}`);
          
          console.log(`[AUDIO-PLAY] Successfully started playing chunk ${currentAudioIndex + 1}/${audioUrls.length}`);
          setIsPlaying(true);
        }
      } catch (error) {
        console.error(`[AUDIO-PLAY] Error playing chunk ${currentAudioIndex + 1}:`, error);
        console.timeEnd(`[AUDIO-PLAY] Chunk ${currentAudioIndex + 1} playback`);
        
        // Skip to next audio if this one fails
        console.log(`[AUDIO-PLAY] Skipping to next chunk due to error`);
        setCurrentAudioIndex(prevIndex => prevIndex + 1);
        setTimeout(playNextAudio, 100);
      }
    } else {
      // End of queue
      console.log(`🔊 [AUDIO-PLAY] Reached end of audio queue (${urlsToUse.length} chunks), resetting index`);
      console.timeEnd(`🔊 [AUDIO-PLAY] Chunk ${currentAudioIndex + 1} playback`);
      console.timeEnd('[AUDIO-FLOW] Total audio process time');
      setIsPlaying(false);
      setCurrentAudioIndex(0);
    }
  };

  // Function to generate and play TTS audio
  const handlePlayAudio = async () => {
    console.log(`%c 🎤 HANDLEPLAYAUDIO CALLED 🎤`, 'background: #ff0000; color: white; font-size: 24px; padding: 10px;');
    console.log(`%c THIS IS THE EXPECTED ENTRY POINT`, 'background: #ff0000; color: white; font-size: 18px;');
    alert('AUDIO PLAY TRIGGERED - CHECK CONSOLE'); // This will make it super obvious
    
    console.log(`🔊 [AUDIO-START] Play button clicked: isPlaying=${isPlaying}, audioUrls.length=${audioUrls.length}`);
    console.log(`🔊 [AUDIO-START] Audio state:`, {
      isArray: Array.isArray(audioUrls),
      length: audioUrls.length,
      currentIndex: currentAudioIndex,
      isPlaying: isPlaying,
      isLoading: isLoadingAudio,
      hasAudioElement: !!audioRef.current
    });
    console.time('[AUDIO-FLOW] Total audio process time');
    
    // Force log the first few URLs if they exist
    if (audioUrls && audioUrls.length > 0) {
      console.log(`🔊 [AUDIO-START] First audio URL: ${audioUrls[0]?.substring(0, 50)}...`);
      if (audioUrls.length > 1) {
        console.log(`🔊 [AUDIO-START] Second audio URL: ${audioUrls[1]?.substring(0, 50)}...`);
      }
    } else {
      console.log(`🔊 [AUDIO-START] No audio URLs in state yet`);
    }
    
    // If already playing, pause
    if (isPlaying && audioRef.current) {
      console.log(`🔊 [AUDIO-PAUSE] Pausing playback at chunk ${currentAudioIndex + 1}/${audioUrls.length}`);
      audioRef.current.pause();
      setIsPlaying(false);
      console.timeEnd('[AUDIO-FLOW] Total audio process time');
      return;
    }
    
    // If we have already generated the audio
    if (audioUrls.length > 0) {
      console.log(`🔊 [AUDIO-RESUME] Using ${audioUrls.length} cached audio chunks`);
      console.log(`🔊 [AUDIO-RESUME] Resuming playback from chunk ${currentAudioIndex + 1}/${audioUrls.length}`);
      console.log(`🔊 [AUDIO-RESUME] Current URL: ${audioUrls[currentAudioIndex]?.substring(0, 50)}...`);
      console.time('[AUDIO-FLOW] Playback start time');
      playNextAudio();
      console.timeEnd('[AUDIO-FLOW] Playback start time');
      return;
    }
    
    // Otherwise, generate new audio
    // Get the current TTS engine
    const currentEngine = getTTSEngine();
    
    // Use the persona's voice ID if it's set, or use a default for the current engine
    let voiceToUse = persona?.voiceId || null;
    
    // If no voice is set, use a default based on the engine and persona type
    if (!voiceToUse) {
      if (currentEngine === 'zonos') {
        // Zonos defaults
        if (persona?.name === "GAIA") {
          voiceToUse = "american_female";
        } else if (persona?.name?.includes("Science")) {
          voiceToUse = "british_male";
        } else if (persona?.name?.includes("Art")) {
          voiceToUse = "british_female";
        } else if (persona?.name?.includes("Business")) {
          voiceToUse = "american_male";
        } else {
          voiceToUse = "random";
        }
      } else {
        // Kokoro defaults
        if (persona?.name === "GAIA") {
          voiceToUse = "af_nova";
        } else if (persona?.name?.includes("Science")) {
          voiceToUse = "bm_daniel";
        } else if (persona?.name?.includes("Art")) {
          voiceToUse = "bf_emma";
        } else if (persona?.name?.includes("Business")) {
          voiceToUse = "am_michael";
        } else {
          voiceToUse = "af_bella";
        }
      }
    }
    
    console.log(`[AUDIO-FLOW] Generating new audio for message from persona: ${persona?.name || "Unknown"} using voiceId: ${voiceToUse}`);
    console.log(`[AUDIO-FLOW] TTS engine: ${currentEngine}`);
    
    setIsLoadingAudio(true);
    try {
      console.time('[AUDIO-FLOW] Text preprocessing');
      // Get plain text content without markdown for better speech
      let textContent = message.content;
      console.log(`[AUDIO-FLOW] Original message length: ${textContent.length} characters`);
      
      // Remove markdown artifacts
      textContent = textContent.replace(/\*\*/g, ''); // Remove bold markers
      textContent = textContent.replace(/\n/g, ' '); // Replace newlines with spaces
      textContent = textContent.replace(/```[^`]*```/g, ''); // Remove code blocks
      textContent = textContent.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // Replace markdown links with just text
      
      console.log(`[AUDIO-FLOW] Preprocessed text length: ${textContent.length} characters`);
      console.log(`[AUDIO-FLOW] Text preview: ${textContent.substring(0, 100)}...`);
      console.timeEnd('[AUDIO-FLOW] Text preprocessing');
      
      // Split text into sentences
      console.time('[AUDIO-FLOW] Text chunking');
      const textChunks = splitTextIntoSentences(textContent);
      console.log(`[AUDIO-FLOW] Split text into ${textChunks.length} chunks for TTS processing`);
      
      // Log the first few chunks and last chunk
      const chunkPreviewCount = Math.min(3, textChunks.length);
      for (let i = 0; i < chunkPreviewCount; i++) {
        console.log(`[AUDIO-FLOW] Chunk ${i+1}: "${textChunks[i]}"`);
      }
      if (textChunks.length > chunkPreviewCount) {
        console.log(`[AUDIO-FLOW] ... ${textChunks.length - chunkPreviewCount} more chunks ...`);
        console.log(`[AUDIO-FLOW] Last chunk: "${textChunks[textChunks.length-1]}"`);
      }
      console.timeEnd('[AUDIO-FLOW] Text chunking');
      
      // Generate speech for all chunks in parallel
      console.time('[AUDIO-FLOW] Speech generation');
      console.log(`[AUDIO-FLOW] Starting parallel TTS requests for ${textChunks.length} chunks`);
      
      // Ensure we always generate and log the audio array
      let urls = [];
      try {
        // Generate speech for chunks
        console.log(`%c 🎯 CALLING generateSpeechChunks with ${textChunks.length} chunks`, 'background: #0000ff; color: white; font-size: 16px');
        
        const result = await generateSpeechChunks(textChunks, voiceToUse);
        
        console.log(`%c 🎯 RECEIVED RESULT FROM generateSpeechChunks`, 'background: #0000ff; color: white; font-size: 16px');
        console.log(`%c Result type: ${typeof result}`, 'background: #0000ff; color: white');
        console.log(`%c Result is array: ${Array.isArray(result)}`, 'background: #0000ff; color: white');
        console.log(`%c Result length: ${result?.length || 'undefined'}`, 'background: #0000ff; color: white');
        console.log(`%c Result value:`, 'background: #0000ff; color: white', result);
        
        // Store immediately in a global variable
        window.lastReceivedAudioUrls = result;
        
        // Explicitly assign
        urls = result;
        
        // Force log the returned URLs
        console.log(`🔊 [AUDIO-DEBUG] RETURNED URLS TYPE: ${typeof urls}, IS ARRAY: ${Array.isArray(urls)}`);
        console.log(`🔊 [AUDIO-DEBUG] RETURNED URLS LENGTH: ${urls ? urls.length : 'undefined'}`);
        
        // Try multiple logging methods to ensure we see the data
        try {
          console.log(`🔊 [AUDIO-DEBUG] URLS DIRECT:`, urls);
        } catch (e) {
          console.log(`🔊 [AUDIO-DEBUG] Error logging direct URLs:`, e);
        }
        
        try {
          console.log(`🔊 [AUDIO-DEBUG] URLS JSON:`, JSON.stringify(urls));
        } catch (e) {
          console.log(`🔊 [AUDIO-DEBUG] Error JSON stringifying URLs:`, e);
        }
        
        try {
          console.dir(urls);
        } catch (e) {
          console.log(`🔊 [AUDIO-DEBUG] Error console.dir URLs:`, e);
        }
        
        // Log each URL individually to bypass any console limitations
        if (Array.isArray(urls)) {
          urls.forEach((url, idx) => {
            console.log(`🔊 [AUDIO-DEBUG] URL[${idx}]: ${typeof url === 'string' ? url.substring(0, 50) + '...' : typeof url}`);
          });
        } else {
          console.log(`🔊 [AUDIO-DEBUG] Cannot iterate - not an array`);
        }
        
        // Ensure it's always an array
        if (!Array.isArray(urls)) {
          console.warn(`[AUDIO-FLOW] Converting non-array response to array`);
          urls = urls ? [urls] : [];
        }
        
        console.log(`[AUDIO-FLOW] Received ${urls.length} audio URLs`);
      } catch (err) {
        console.error(`[AUDIO-FLOW] Error generating speech chunks:`, err);
        urls = [];
      }
      console.timeEnd('[AUDIO-FLOW] Speech generation');
      
      if (urls && urls.length > 0) {
        console.log(`🔊 [AUDIO-URLS] Received ${urls.length} audio URLs from generation`);
        console.log('🔊 [AUDIO-URLS] AUDIO ARRAY CONTENT:');
        
        // Log each URL individually
        urls.forEach((url, idx) => {
          if (url) {
            console.log(`🔊 [AUDIO-URLS] URL[${idx}]: ${url.substring(0, 50)}...`);
          } else {
            console.error(`🔊 [AUDIO-URLS] URL[${idx}] is null or undefined!`);
          }
        });
        
        // Verify each URL in the array
        let validUrls = true;
        urls.forEach((url, index) => {
          if (!url) {
            console.error(`🔊 [AUDIO-URLS] Invalid URL at index ${index}: URL is ${url}`);
            validUrls = false;
          }
        });
        
        if (!validUrls) {
          console.error('🔊 [AUDIO-URLS] Some URLs in the audio array are invalid');
        }
        
        // Store in a local variable first - this ensures we use the same exact array for both logging and state setting 
        const audioUrlsToUse = [...urls];
        console.log(`🔊 [AUDIO-URLS] Setting state with ${audioUrlsToUse.length} URLs`);
        
        // Set state
        setAudioUrls(audioUrlsToUse);
        setCurrentAudioIndex(0);
        
        // Debug: Immediately check if state was updated
        console.log(`🔊 [AUDIO-URLS] State audioUrls:`, {
          stateValue: audioUrls, // This will still show old value due to closure
          newValue: audioUrlsToUse
        });
        
        // Start playing the first audio file with more logging
        console.log(`🔊 [AUDIO-PLAY] Starting playback in 300ms with ${audioUrlsToUse.length} URLs`);
        console.time('🔊 [AUDIO-PLAY] Time to first audio');
        
        setTimeout(() => {
          console.timeEnd('🔊 [AUDIO-PLAY] Time to first audio');
          console.log('🔊 [AUDIO-PLAY] Timeout elapsed, starting playback');
          console.log('🔊 [AUDIO-PLAY] Using URLs array:', audioUrlsToUse);
          
          // Important: Set state again right before playing to ensure it's current
          setAudioUrls(audioUrlsToUse);
          
          // BUGFIX: Only set index to 0 if not already at 0 (prevents duplicate playback of first chunk)
          // setCurrentAudioIndex(0); - removing this line to prevent duplicate playback
          
          // Use a global variable as a fallback to ensure the audio array is available
          window._debugAudioUrls = audioUrlsToUse;
          
          // Add a flag to track whether we're in an initial playback
          window._initialAudioPlayback = true;
          
          console.log('🔊 [AUDIO-PLAY] Set backup array to window._debugAudioUrls');
          setTimeout(() => {
            console.log('🔊 [AUDIO-PLAY] About to call playNextAudio()');
            console.log('🔊 [AUDIO-PLAY] Current audioUrls state:', audioUrls);
            console.log('🔊 [AUDIO-PLAY] Backup array:', window._debugAudioUrls);
            playNextAudio();
          }, 100);
        }, 300);
      } else {
        console.warn("[AUDIO-FLOW] No audio URLs returned from speech generation");
        console.timeEnd('[AUDIO-FLOW] Total audio process time');
        setIsLoadingAudio(false);
      }
    } catch (error) {
      console.error("[AUDIO-FLOW] Error in audio processing:", error);
      console.timeEnd('[AUDIO-FLOW] Total audio process time');
      setIsLoadingAudio(false);
    } finally {
      setIsLoadingAudio(false);
    }
  };

  // Handle audio playback events
  useEffect(() => {
    const audio = audioRef.current;
    
    const handleEnded = () => {
      console.timeEnd(`🔊 [AUDIO-PLAY] Chunk ${currentAudioIndex + 1} playback`);
      
      // Get the current state of audio URLs (might have changed since component render)
      const currentAudioUrls = window._debugAudioUrls || audioUrls;
      
      // Move to the next audio in the queue
      setCurrentAudioIndex(prevIndex => {
        const nextIndex = prevIndex + 1;
        console.log(`🔊 [AUDIO-PLAY] Chunk ${prevIndex + 1}/${currentAudioUrls.length} ended, moving to chunk ${nextIndex + 1}`);
        
        // If we're at the end of the queue, reset
        if (nextIndex >= currentAudioUrls.length) {
          console.log(`🔊 [AUDIO-PLAY] Reached end of audio queue (${currentAudioUrls.length} chunks), stopping playback`);
          console.timeEnd('[AUDIO-FLOW] Total audio process time');
          setIsPlaying(false);
          return 0;
        }
        
        // Otherwise play the next audio
        console.log(`🔊 [AUDIO-PLAY] Playing next chunk (${nextIndex + 1}/${currentAudioUrls.length}) in 100ms`);
        setTimeout(() => playNextAudio(), 100);
        return nextIndex;
      });
    };
    
    const handleTimeUpdate = () => {
      if (audio) {
        const currentTime = audio.currentTime;
        const duration = audio.duration || 0;
        const percent = duration > 0 ? (currentTime / duration) * 100 : 0;
        
        // Only log at 25%, 50%, 75% to avoid flooding the console
        if (percent >= 25 && percent < 26 || 
            percent >= 50 && percent < 51 || 
            percent >= 75 && percent < 76) {
          console.log(`[AUDIO-PLAY] Chunk ${currentAudioIndex + 1} progress: ${Math.round(percent)}%, time: ${currentTime.toFixed(1)}/${duration.toFixed(1)}s`);
        }
      }
    };
    
    if (audio) {
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('timeupdate', handleTimeUpdate);
      
      return () => {
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        
        // Cleanup audio URLs when component unmounts
        console.log(`[AUDIO-PLAY] Cleaning up ${audioUrls.length} audio blob URLs`);
        audioUrls.forEach((url, i) => {
          if (url && url.startsWith('blob:')) {
            console.log(`[AUDIO-PLAY] Revoking URL for chunk ${i + 1}`);
            URL.revokeObjectURL(url);
          }
        });
      };
    }
  }, [audioUrls, currentAudioIndex]);

  // DIRECT FORMATTER FUNCTION - No external module dependencies
  const applyFormatting = () => {
    console.log("Message.js: Starting format operation...");
    console.log("Message.js: Persona:", persona?.name || "Unknown");
    console.log("Message.js: Format settings:", JSON.stringify(persona?.formatSettings, null, 2));
    
    if (!persona) {
      console.log("Message.js: No persona found for personaId:", message.personaId);
      return;
    }
    
    // Get the original content
    const originalContent = message.content;
    console.log("Message.js: Original content:", originalContent.substring(0, 100) + (originalContent.length > 100 ? '...' : ''));
    
    try {
      // Start with original content
      let formattedText = originalContent;
      
      // Apply custom format rules if available
      const applyCustomRules = () => {
        // Only proceed if custom formatting is enabled
        if (persona?.formatSettings?.customFormatting && 
            persona?.formatSettings?.formatRules &&
            persona.formatSettings.formatRules.length > 0) {
          
          console.log("Message.js: Applying custom format rules");
          
          // Process each rule
          let rulesApplied = false;
          persona.formatSettings.formatRules.forEach(rule => {
            if (rule.enabled) {
              console.log("Message.js: Applying rule:", rule.name);
              
              // Create regex patterns from the start/end tags
              const startTagEscaped = rule.startTag ? rule.startTag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : '';
              const endTagEscaped = rule.endTag ? rule.endTag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : '';
              
              if (startTagEscaped && endTagEscaped) {
                const pattern = new RegExp(`${startTagEscaped}(.*?)${endTagEscaped}`, 'gs');
                const matches = formattedText.match(pattern);
                console.log("Message.js: Matches for pattern", rule.startTag, "to", rule.endTag, ":", matches);
                
                if (matches && matches.length > 0) {
                  rulesApplied = true;
                  formattedText = formattedText.replace(pattern, (match, content) => {
                    console.log(`Message.js: Replacing rule match '${match.substring(0, 30)}...' with format '${rule.markdownFormat}'`);
                    return rule.markdownFormat.replace('{{content}}', content);
                  });
                }
              }
            }
          });
          
          return rulesApplied;
        }
        
        return false;
      };
      
      // Apply standard roleplay markdown formatting
      const applyRoleplayMarkdown = () => {
        console.log("Message.js: Applying roleplay markdown formatting");
        
        // Process speech tags with attributes
        formattedText = formattedText.replace(
          /<speech\s+[^>]*?as=["']([^"']+)["'][^>]*>([\s\S]*?)<\/speech>/gi,
          (match, character, content) => {
            console.log(`Message.js: Found speech tag for ${character}, content: "${content.substring(0, 30)}..."`);
            return `**${character}:** ${content.trim()}\n\n`;
          }
        );
        
        // Process action tags with attributes
        formattedText = formattedText.replace(
          /<action\s+[^>]*?as=["']([^"']+)["'][^>]*>([\s\S]*?)<\/action>/gi,
          (match, character, content) => {
            console.log(`Message.js: Found action tag for ${character}, content: "${content.substring(0, 30)}..."`);
            return `*${character} ${content.trim()}*\n\n`;
          }
        );
        
        // Process simple speech tags
        formattedText = formattedText.replace(
          /<speech>([\s\S]*?)<\/speech>/gi,
          (match, content) => `**${content.trim()}**\n\n`
        );
        
        // Process simple action tags
        formattedText = formattedText.replace(
          /<action>([\s\S]*?)<\/action>/gi,
          (match, content) => `*${content.trim()}*\n\n`
        );
        
        // Process function tags
        formattedText = formattedText.replace(
          /<function>([\s\S]*?)<\/function>/gi,
          (match, content) => `\`\`\`\n${content.trim()}\n\`\`\`\n\n`
        );
        
        // Process markdown tags
        formattedText = formattedText.replace(
          /<markdown>([\s\S]*?)<\/markdown>/gi,
          (match, content) => content.trim() + '\n\n'
        );
        
        // Remove yield tags
        formattedText = formattedText.replace(/<yield[^>]*\/>/gi, '');
        formattedText = formattedText.replace(/<yield[^>]*>.*?<\/yield>/gi, '');
        
        return true;
      };
      
      // First try custom rules, then roleplay markdown if needed
      const customRulesApplied = applyCustomRules();
      if (!customRulesApplied) {
        applyRoleplayMarkdown();
      }
      
      console.log("Message.js: Formatted result:", formattedText);
      setFormattedContent(formattedText);
      setFormatted(true);
    } catch (err) {
      console.error("Message.js: Error in formatting:", err);
      setFormattedContent(originalContent);
      setFormatted(true);
    }
  };

  const renderContent = () => {
    // If formatted view is active, show formatted content
    if (formatted && formattedContent) {
      return <ReactMarkdown>{formattedContent}</ReactMarkdown>;
    }
    
    // Handle file content display
    if (message.fileData?.parsedText) {
      return (
        <div className="file-content-preview">
          <div className="file-meta">{message.content}</div>
          <div className="parsed-text">
            {message.fileData.parsedText.substring(0, 500)}...
          </div>
        </div>
      );
    }
    
    // Handle image content
    if (message.isCommand && message.content.includes('<img')) {
      return <div dangerouslySetInnerHTML={{ __html: message.content }} />;
    }
    
    // Handle tool usage display
    if (message.isToolUsage) {
      
      // Parse the content for detailed display
      let toolInput = '';
      let toolResult = '';
      let toolSummary = '';
      
      try {
        // Extract input and result from the content
        const inputMatch = message.content.match(/\*\*Input\*\*: (.*?)(?=\n\*\*Result\*\*|$)/s);
        const resultMatch = message.content.match(/\*\*Result\*\*: (.*)/s);
        
        if (inputMatch && inputMatch[1]) {
          toolInput = inputMatch[1].trim();
        }
        
        if (resultMatch && resultMatch[1]) {
          toolResult = resultMatch[1].trim();
          
          // For dice rolls, extract just the roll result as summary
          if (message.toolName === "Dice Roll" && toolResult.includes('Rolling')) {
            const diceMatch = toolResult.match(/Rolling (.*?):/);
            const resultMatch = toolResult.match(/\[(.*?)\] = (\d+)/);
            
            if (diceMatch && resultMatch) {
              toolSummary = `${diceMatch[1]}: ${resultMatch[2]}`;
            } else {
              toolSummary = toolResult;
            }
          } else {
            // For other tools, just use a generic summary
            toolSummary = `Result: ${toolResult.substring(0, 50)}${toolResult.length > 50 ? '...' : ''}`;
          }
        }
      } catch (error) {
        console.error('Error parsing tool content:', error);
        // Fall back to showing the original content
        toolInput = 'Error parsing input';
        toolResult = message.content;
      }
      
      // Log tool usage in console
      console.log(`Tool used: ${message.toolName}`, {
        input: toolInput,
        result: toolResult,
        message: message
      });
      
      // Special styling for dice rolls
      if (message.toolName === "Dice Roll") {
        return (
          <div className="tool-usage dice-roll">
            <div className="tool-header">
              <div className="tool-header-left">
                <span className="tool-icon">🎲</span>
                <span className="tool-name">{message.toolName}</span>
              </div>
              <button 
                className="tool-toggle" 
                onClick={() => setShowToolDetails(!showToolDetails)}
                aria-label={showToolDetails ? "Hide details" : "Show details"}
              >
                {showToolDetails ? '−' : '+'}
              </button>
            </div>
            {showToolDetails ? (
              <div className="tool-details">
                <strong>Input:</strong> {toolInput}
                <br/>
                <strong>Result:</strong> {toolResult}
              </div>
            ) : (
              <div className="tool-summary">
                {toolSummary || 'Dice rolled'}
              </div>
            )}
          </div>
        );
      }
      
      // Default tool display
      return (
        <div className="tool-usage">
          <div className="tool-header">
            <div className="tool-header-left">
              <span className="tool-icon">🛠️</span>
              <span className="tool-name">{message.toolName}</span>
            </div>
            <button 
              className="tool-toggle" 
              onClick={() => setShowToolDetails(!showToolDetails)}
              aria-label={showToolDetails ? "Hide details" : "Show details"}
            >
              {showToolDetails ? '−' : '+'}
            </button>
          </div>
          {showToolDetails ? (
            <div className="tool-details">
              <strong>Input:</strong> {toolInput}
              <br/>
              <strong>Result:</strong> {toolResult}
            </div>
          ) : (
            <div className="tool-summary">
              {toolSummary || 'Tool used'}
            </div>
          )}
        </div>
      );
    }
    
    // Handle thinking content
    if (message.content.startsWith('<think>') && message.content.endsWith('</think>')) {
      const thinkContent = message.content.slice(7, -8);
      return <ReactMarkdown>{`*${thinkContent}*`}</ReactMarkdown>;
    }
    
    // Default markdown rendering
    return <ReactMarkdown>{message.content}</ReactMarkdown>;
  };

  // Show which tools are available for this persona (for debugging)
  const renderToolInfo = () => {
    if (!persona || !persona.agentSettings?.toolConfig) return null;
    
    const toolConfig = persona.agentSettings.toolConfig;
    const enabledTools = Object.entries(toolConfig)
      .filter(([name, enabled]) => enabled)
      .map(([name]) => name);
    
    if (enabledTools.length === 0) return null;
    
    return (
      <div className="tool-debug-info">
        <span className="tools-label">🛠️ Tools:</span>
        {enabledTools.map(tool => (
          <span key={tool} className="tool-badge">{tool}</span>
        ))}
      </div>
    );
  };

  // Hidden audio element for TTS playback
  const renderAudio = () => {
    return (
      <audio 
        ref={audioRef}
        onLoadStart={() => console.log(`[AUDIO-PLAY] Loading started for chunk ${currentAudioIndex + 1}`)}
        onDurationChange={(e) => console.log(`[AUDIO-PLAY] Duration determined for chunk ${currentAudioIndex + 1}: ${e.target.duration.toFixed(2)}s`)}
        onLoadedData={() => console.log(`[AUDIO-PLAY] Data loaded for chunk ${currentAudioIndex + 1}`)}
        onEnded={() => {}} // The ended event is handled in the useEffect
        onError={(e) => {
          console.error(`[AUDIO-PLAY] Error playing chunk ${currentAudioIndex + 1}/${audioUrls.length}:`, e);
          console.timeEnd(`[AUDIO-PLAY] Chunk ${currentAudioIndex + 1} playback`);
          
          // Try to move to the next chunk if this one fails
          if (currentAudioIndex < audioUrls.length - 1) {
            console.warn(`[AUDIO-PLAY] Skipping to next chunk due to error (${currentAudioIndex + 1} → ${currentAudioIndex + 2}/${audioUrls.length})`);
            setCurrentAudioIndex(currentAudioIndex + 1);
            setTimeout(playNextAudio, 100);
          } else {
            // If this was the last chunk, reset playback state
            setIsPlaying(false);
            console.warn("[AUDIO-PLAY] Failed to play last audio chunk - playback stopped");
            console.timeEnd('[AUDIO-FLOW] Total audio process time');
          }
        }}
      />
    );
  };

  return (
    <div className={`message ${message.isUser ? 'user' : 'assistant'}`}>
      {persona && (
        <div className="persona-header">
          {persona.image && <img src={persona.image} alt={persona.name} className="persona-avatar" />}
          <span className="persona-name">{persona.name}</span>
          {process.env.NODE_ENV === 'development' && renderToolInfo()}
        </div>
      )}
      <div className="message-content">
        {renderContent()}
        {renderAudio()}
      </div>
      <div className="message-actions">
        <CopyToClipboard text={message.content}>
          <button className="copy-button" title="Copy to clipboard">
            <span role="img" aria-label="Copy">📋</span>
          </button>
        </CopyToClipboard>
        {!message.isUser && !message.isCommand && !message.isToolUsage && (
          <>
            <button className="regenerate-button" onClick={() => onRegenerate(message)} title="Regenerate response">
              <span role="img" aria-label="Regenerate">🔄</span>
            </button>
            <button 
              id="debug-voice-button"
              data-debug="true"
              className={`voice-button ${isPlaying ? 'playing' : ''} ${isLoadingAudio ? 'loading' : ''}`}
              onClick={(e) => {
                // Store timestamp when clicked
                window.lastVoiceButtonClick = {
                  timestamp: new Date().toISOString(),
                  target: e.target.id || e.target.className,
                  callPath: 'Message.js button click handler'
                };
                
                // Add direct debug
                console.log(`%c 🔊 PLAY BUTTON CLICKED - DEBUG VERSION`, 'background: #ff0000; color: white; font-size: 16px');
                
                // Try to access the function directly for debugging
                try {
                  console.log(`%c Calling handlePlayAudio...`, 'background: #ff0000; color: white');
                  handlePlayAudio();
                } catch (err) {
                  console.error('Error calling handlePlayAudio:', err);
                  alert('Error calling audio function. See console.');
                }
              }}
              disabled={isLoadingAudio}
              title={isPlaying ? "Pause voice (debug)" : "Play voice (debug)"}
            >
              {isLoadingAudio ? (
                <span className="loading-indicator">⏳</span>
              ) : isPlaying ? (
                <span role="img" aria-label="Pause">⏸️</span>
              ) : (
                <span role="img" aria-label="Play">🔊</span>
              )}
            </button>
            <button className="format-button" onClick={applyFormatting} title="Format message (updated)">
              <span role="img" aria-label="Format">⭐</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Message;