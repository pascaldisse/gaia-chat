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
    // FIXED: Use indices consistently and accurately track completion
    window.debugAudioProgress = window.debugAudioProgress || [];
    window.debugAudioProgress.push({
      time: new Date().toISOString(),
      function: 'playNextAudio',
      index: currentAudioIndex,
      isPlaying
    });
    
    console.log(`🔊 [AUDIO-PLAY] playNextAudio called, current index: ${currentAudioIndex}`);
    
    // FIXED: Make sure we're working with stable, consistent state
    const stableIndex = currentAudioIndex;
    
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
    
    // Validate index bounds
    if (stableIndex < 0 || stableIndex >= urlsToUse.length) {
      console.error(`🔊 [AUDIO-PLAY] Index out of bounds: ${stableIndex} (array length: ${urlsToUse.length})`);
      setIsPlaying(false);
      return;
    }
    
    console.log(`🔊 [AUDIO-PLAY] Attempting to play audio chunk ${stableIndex + 1}/${urlsToUse.length}`);
    
    // Create unique timer for each chunk playback attempt to avoid duplicate timer errors
    const chunkTimerId = `🔊 [AUDIO-PLAY] Chunk ${stableIndex + 1} playback-${Date.now()}`;
    console.time(chunkTimerId);
    
    // Check if audioUrls array exists and has items
    if (!urlsToUse || urlsToUse.length === 0) {
      console.error('🔊 [AUDIO-PLAY] ERROR: Audio array is empty or undefined!', {
        stateArray: audioUrls,
        backupArray: window._debugAudioUrls
      });
      setIsPlaying(false);
      return;
    }
    
    // FIXED: Track which chunks have been played to prevent duplicates
    window.playedChunks = window.playedChunks || {};
    
    // If we've already played this chunk and we're not at index 0, skip to next
    const chunkKey = `chunk-${stableIndex}`;
    if (window.playedChunks[chunkKey] && stableIndex > 0) {
      console.log(`🔊 [AUDIO-PLAY] Chunk ${stableIndex + 1} already played, skipping to next`);
      
      // Find the next unplayed chunk
      let nextIndex = stableIndex + 1;
      
      // Ensure we don't create an infinite loop - count how many chunks we've checked
      let checksCount = 0;
      const maxChecks = urlsToUse.length * 2; // Reasonable upper limit
      
      // Skip ahead until we find an unplayed chunk or reach the end
      while (window.playedChunks[`chunk-${nextIndex}`] && nextIndex < urlsToUse.length && checksCount < maxChecks) {
        console.log(`🔊 [AUDIO-PLAY] Chunk ${nextIndex + 1} also already played, skipping ahead`);
        nextIndex++;
        checksCount++;
      }
      
      // Check if we've reached the end or exceeded check limit
      if (nextIndex >= urlsToUse.length || checksCount >= maxChecks) {
        console.log(`🔊 [AUDIO-PLAY] Reached end of audio queue or maximum check limit, stopping playback`);
        setIsPlaying(false);
        setCurrentAudioIndex(0);
        window.playedChunks = {}; // Reset played chunks
        try {
          console.timeEnd('[AUDIO-FLOW] Total audio process time');
        } catch (e) {
          console.log('[AUDIO-FLOW] Audio playback complete');
        }
        return;
      }
      
      // Continue to next unplayed chunk
      console.log(`🔊 [AUDIO-PLAY] Found next unplayed chunk ${nextIndex + 1}, continuing playback`);
      setCurrentAudioIndex(nextIndex);
      setTimeout(() => playNextAudio(), 10);
      return;
    }
    
    // Mark this chunk as played
    window.playedChunks[chunkKey] = true;
    
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
    
    // FIXED: We already validated the index above, so we know it's in bounds
    try {
      // Debug info about current audio state
      console.log(`🔊 [AUDIO-CURRENT] Playing chunk ${stableIndex + 1}/${urlsToUse.length}`);
      console.log(`🔊 [AUDIO-CURRENT] Current URL: ${urlsToUse[stableIndex] ? 
        (typeof urlsToUse[stableIndex] === 'string' ? 
          urlsToUse[stableIndex].substring(0, 50) + '...' : 
          `non-string: ${typeof urlsToUse[stableIndex]}`) : 
        'null/undefined'}`);
      
      if (audioRef.current) {
        console.log(`🔊 [AUDIO-PLAY] Setting source to chunk ${stableIndex + 1}/${urlsToUse.length}`);
        console.time(`🔊 [AUDIO-PLAY] Audio load time for chunk ${stableIndex + 1}`);
        
        // Debug verification before setting source
        if (!urlsToUse[stableIndex]) {
          console.error(`🔊 [AUDIO-ERROR] URL at index ${stableIndex} is null or undefined!`);
          throw new Error(`Invalid audio URL at index ${stableIndex}`);
        }
        
        audioRef.current.src = urlsToUse[stableIndex];
        console.log(`🔊 [AUDIO-CURRENT] Set audio element src to: ${urlsToUse[stableIndex].substring(0, 50)}...`);
          
          // Listen for the canplaythrough event to measure load time
          const loadPromise = new Promise(resolve => {
            const loadHandler = () => {
              console.timeEnd(`[AUDIO-PLAY] Audio load time for chunk ${stableIndex + 1}`);
              console.log(`🔊 [AUDIO-CURRENT] Audio can play through - ready to start playback`);
              audioRef.current.removeEventListener('canplaythrough', loadHandler);
              resolve();
            };
            audioRef.current.addEventListener('canplaythrough', loadHandler, { once: true });
            
            // Set a timeout in case canplaythrough doesn't fire
            setTimeout(() => {
              audioRef.current.removeEventListener('canplaythrough', loadHandler);
              console.log(`[AUDIO-PLAY] Chunk ${stableIndex + 1} load timeout, proceeding anyway`);
              resolve();
            }, 2000);
          });
          
          await loadPromise;
          console.time(`[AUDIO-PLAY] Play() call for chunk ${stableIndex + 1}`);
          console.log(`🔊 [AUDIO-CURRENT] Starting playback now...`);
          
          try {
            await audioRef.current.play();
            console.timeEnd(`[AUDIO-PLAY] Play() call for chunk ${stableIndex + 1}`);
            
            console.log(`[AUDIO-PLAY] Successfully started playing chunk ${stableIndex + 1}/${urlsToUse.length}`);
            window.lastPlayedChunk = stableIndex;
            setIsPlaying(true);
          } catch (playError) {
            console.error(`[AUDIO-PLAY] Error in play() call:`, playError);
            // Skip to next audio if this one fails
            setCurrentAudioIndex(stableIndex + 1);
            setTimeout(() => playNextAudio(), 100);
          }
        }
      } catch (error) {
        console.error(`[AUDIO-PLAY] Error playing chunk ${stableIndex + 1}:`, error);
        console.log(`[AUDIO-PLAY] Chunk ${stableIndex + 1} playback failed`);
        
        // Skip to next audio if this one fails
        console.log(`[AUDIO-PLAY] Skipping to next chunk due to error`);
        const nextIndex = stableIndex + 1;
        
        if (nextIndex < urlsToUse.length) {
          setCurrentAudioIndex(nextIndex);
          setTimeout(playNextAudio, 100);
        } else {
          // We've reached the end
          console.log(`[AUDIO-PLAY] That was the last chunk, ending playback`);
          console.timeEnd('[AUDIO-FLOW] Total audio process time');
          setIsPlaying(false);
          setCurrentAudioIndex(0);
          window.playedChunks = {}; // Reset for next playback
        }
      }
    };

  // Function to generate and play TTS audio
  const handlePlayAudio = async () => {
    console.log(`%c 🎤 HANDLEPLAYAUDIO CALLED 🎤`, 'background: #ff0000; color: white; font-size: 24px; padding: 10px;');
    console.log(`%c THIS IS THE EXPECTED ENTRY POINT`, 'background: #ff0000; color: white; font-size: 18px;');
    
    // Reset tracking variables to prevent loops from previous playback attempts
    window.playedChunks = {};
    window.audioEndEvents = [];
    window.debugAudioProgress = [];
    window.lastPlayedChunk = undefined;
    
    // Remove debug alert
    // alert('AUDIO PLAY TRIGGERED - CHECK CONSOLE');
    
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
      
      try {
        // Safe preprocessing to remove markdown without using complex regex
        // Remove markdown artifacts more safely
        
        // Simple replacements first
        textContent = textContent.replace(/\*\*/g, ''); // Remove bold markers
        textContent = textContent.replace(/\*/g, ''); // Remove italic markers
        textContent = textContent.replace(/\n/g, ' '); // Replace newlines with spaces
        
        // Handle code blocks (```code```) by replacing them with placeholder
        let cleanText = '';
        let inCodeBlock = false;
        
        for (let i = 0; i < textContent.length; i++) {
          // Check for start/end of code block
          if (textContent.substring(i, i + 3) === '```') {
            inCodeBlock = !inCodeBlock;
            i += 2; // Skip the ```
            continue;
          }
          
          // Only add text if not in code block
          if (!inCodeBlock) {
            cleanText += textContent[i];
          }
        }
        
        textContent = cleanText;
        
        // Handle markdown links by simple text replacement
        if (textContent.includes('[') && textContent.includes('](')) {
          const linkPattern = /\[([^\]]+)\]\([^)]+\)/g;
          textContent = textContent.replace(linkPattern, '$1');
        }
      } catch (e) {
        console.warn("[AUDIO-FLOW] Error during text preprocessing:", e);
        // If preprocessing fails, just use plain text with minimal formatting
        textContent = message.content.replace(/[*#`]/g, '');
      }
      
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
        
        // Reset tracking variables for a fresh start
        window.playedChunks = {};
        window.audioEndEvents = [];
        window.debugAudioProgress = [];
        window.lastPlayedChunk = undefined;
        
        // Set a session ID to track the entire playback sequence
        window.audioSessionId = Date.now();
        
        console.log(`🔊 [AUDIO-FIX] Starting new audio session ${window.audioSessionId}`);
        
        // Set state ONCE
        setAudioUrls(audioUrlsToUse);
        setCurrentAudioIndex(0);
        
        // Debug: Immediately check if state was updated
        console.log(`🔊 [AUDIO-URLS] State audioUrls:`, {
          stateValue: audioUrls, // This will still show old value due to closure
          newValue: audioUrlsToUse
        });
        
        // Start playing the first audio file with more logging
        console.log(`🔊 [AUDIO-PLAY] Starting playback in 100ms with ${audioUrlsToUse.length} URLs`);
        console.time('🔊 [AUDIO-PLAY] Time to first audio');
        
        // Set the global backup immediately
        window._debugAudioUrls = audioUrlsToUse;
        
        // Use a delay to ensure React has updated state before playing
        setTimeout(() => {
          console.timeEnd('🔊 [AUDIO-PLAY] Time to first audio');
          console.log('🔊 [AUDIO-PLAY] Timeout elapsed, starting playback');
          
          // CRITICAL FIX: Only call playNextAudio, don't set state again
          console.log('🔊 [AUDIO-PLAY] Starting playback sequence - current index is 0');
          playNextAudio();
        }, 100);
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
      console.log('🔊 [AUDIO-END] Audio chunk ended event triggered');
      
      // Get the current stable index for more reliable tracking
      const stableIndex = window.lastPlayedChunk !== undefined ? window.lastPlayedChunk : currentAudioIndex;
      console.log(`🔊 [AUDIO-END] Using stable index ${stableIndex} (window.lastPlayedChunk: ${window.lastPlayedChunk}, currentAudioIndex: ${currentAudioIndex})`);
      
      try {
        // Just log completion time without using timeEnd to avoid timer not found errors
        console.log(`🔊 [AUDIO-PLAY] Chunk ${stableIndex + 1} playback complete`);
      } catch (e) {
        console.log(`🔊 [AUDIO-PLAY] Chunk ${stableIndex + 1} playback complete (error logging)`);
      }
      
      // Track all events for debugging
      window.audioEndEvents = window.audioEndEvents || [];
      window.audioEndEvents.push({
        timestamp: new Date().toISOString(),
        index: stableIndex,
        nextIndex: stableIndex + 1
      });
      
      // Get the current state of audio URLs (might have changed since component render)
      const currentAudioUrls = window._debugAudioUrls || audioUrls;
      
      // Calculate next index
      const nextIndex = stableIndex + 1;
      
      // Record which chunks have been played
      window.playedChunks = window.playedChunks || {};
      window.playedChunks[`chunk-${stableIndex}`] = true;
      
      // Log detailed information
      console.log(`🔊 [AUDIO-PLAY] Chunk ${stableIndex + 1}/${currentAudioUrls.length} ended, considering next chunk ${nextIndex + 1}`);
      
      // If we're at the end of the queue, reset
      if (nextIndex >= currentAudioUrls.length) {
        console.log(`🔊 [AUDIO-PLAY] Reached end of audio queue (${currentAudioUrls.length} chunks), stopping playback`);
        try {
          console.timeEnd('[AUDIO-FLOW] Total audio process time');
        } catch (e) {
          console.log('[AUDIO-FLOW] Audio playback complete');
        }
        setIsPlaying(false);
        setCurrentAudioIndex(0);
        
        // Reset for next playback
        window.playedChunks = {};
        return;
      }
      
      // Otherwise proceed to next chunk
      // Skip chunks that have already been played
      let playableIndex = nextIndex;
      // Ensure we don't create an infinite loop - count how many chunks we've checked
      let checksCount = 0;
      const maxChecks = currentAudioUrls.length * 2; // Reasonable upper limit
      
      // Skip ahead until we find an unplayed chunk or reach the end
      while (window.playedChunks[`chunk-${playableIndex}`] && playableIndex < currentAudioUrls.length && checksCount < maxChecks) {
        console.log(`🔊 [AUDIO-END] Chunk ${playableIndex + 1} already played, skipping ahead`);
        playableIndex++;
        checksCount++;
      }
      
      // Check if we've reached the end
      if (playableIndex >= currentAudioUrls.length || checksCount >= maxChecks) {
        console.log(`🔊 [AUDIO-END] No more unplayed chunks, ending playback`);
        setIsPlaying(false);
        setCurrentAudioIndex(0);
        window.playedChunks = {}; // Reset for next playback
        return;
      }
      
      console.log(`🔊 [AUDIO-PLAY] Playing next chunk (${playableIndex + 1}/${currentAudioUrls.length}) in 10ms`);
      setCurrentAudioIndex(playableIndex);
      setTimeout(() => playNextAudio(), 10);
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

  // State for audio debug UI
  const [showAudioDebug, setShowAudioDebug] = useState(false);
  
  // Refresh audio array state from window backup
  const refreshAudioArray = () => {
    if (window._debugAudioUrls && window._debugAudioUrls.length > 0) {
      setAudioUrls([...window._debugAudioUrls]);
      console.log(`Refreshed audio URLs array with ${window._debugAudioUrls.length} items`);
    } else {
      console.log("No backup audio URLs found in window._debugAudioUrls");
    }
  };
  
  // Play a specific audio chunk
  const playSpecificChunk = (index) => {
    if (index >= 0 && index < audioUrls.length) {
      // Stop current playback if any
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      // Set the index and start playback
      setCurrentAudioIndex(index);
      window.playedChunks = {}; // Reset played chunks
      window.playedChunks[`chunk-${index}`] = true; // Mark only this one as played
      
      // Set audio source directly and play
      if (audioRef.current) {
        console.log(`Playing specific chunk ${index + 1}/${audioUrls.length}`);
        audioRef.current.src = audioUrls[index];
        audioRef.current.play().catch(err => {
          console.error(`Error playing specific chunk ${index + 1}:`, err);
        });
      }
    }
  };
  
  // Hidden audio element for TTS playback
  const renderAudio = () => {
    return (
      <>
        <audio 
          ref={audioRef}
          onLoadStart={() => console.log(`[AUDIO-PLAY] Loading started for chunk ${currentAudioIndex + 1}`)}
          onDurationChange={(e) => console.log(`[AUDIO-PLAY] Duration determined for chunk ${currentAudioIndex + 1}: ${e.target.duration.toFixed(2)}s`)}
          onLoadedData={() => console.log(`[AUDIO-PLAY] Data loaded for chunk ${currentAudioIndex + 1}`)}
          onEnded={() => {}} // The ended event is handled in the useEffect
          onError={(e) => {
            console.error(`[AUDIO-PLAY] Error playing chunk ${currentAudioIndex + 1}/${audioUrls.length}:`, e);
            console.log(`[AUDIO-PLAY] Chunk ${currentAudioIndex + 1} playback failed`);
            
            // Try to move to the next chunk if this one fails
            if (currentAudioIndex < audioUrls.length - 1) {
              console.warn(`[AUDIO-PLAY] Skipping to next chunk due to error (${currentAudioIndex + 1} → ${currentAudioIndex + 2}/${audioUrls.length})`);
              setCurrentAudioIndex(currentAudioIndex + 1);
              setTimeout(playNextAudio, 100);
            } else {
              // If this was the last chunk, reset playback state
              setIsPlaying(false);
              console.warn("[AUDIO-PLAY] Failed to play last audio chunk - playback stopped");
              console.log('[AUDIO-FLOW] Audio playback complete');
            }
          }}
        />
        
        {/* Audio Debug UI */}
        {showAudioDebug && (
          <div className="audio-debug-ui">
            <div className="audio-debug-header">
              <h4>Audio Debug - {audioUrls.length} chunks</h4>
              <div className="audio-debug-controls">
                <button 
                  className="refresh-audio-btn" 
                  onClick={refreshAudioArray}
                  title="Refresh audio array from window._debugAudioUrls"
                >
                  🔄 Refresh
                </button>
                <button 
                  className="close-debug-btn" 
                  onClick={() => setShowAudioDebug(false)}
                  title="Close debug panel"
                >
                  ✖
                </button>
              </div>
            </div>
            
            <div className="audio-chunks-list">
              {audioUrls.length > 0 ? (
                audioUrls.map((url, index) => (
                  <div 
                    key={`audio-chunk-${index}`} 
                    className={`audio-chunk-item ${index === currentAudioIndex ? 'current' : ''} ${window.playedChunks && window.playedChunks[`chunk-${index}`] ? 'played' : ''}`}
                  >
                    <div className="chunk-info">
                      <span className="chunk-number">#{index + 1}</span>
                      <span className="chunk-url">{typeof url === 'string' ? (url.startsWith('blob:') ? 'Blob URL' : url.substring(0, 30) + '...') : 'Invalid URL'}</span>
                    </div>
                    <button 
                      className="play-chunk-btn" 
                      onClick={() => playSpecificChunk(index)}
                      title={`Play chunk #${index + 1}`}
                    >
                      ▶
                    </button>
                  </div>
                ))
              ) : (
                <div className="no-audio-chunks">No audio chunks available</div>
              )}
            </div>
          </div>
        )}
      </>
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
            
            {/* Audio Debug Button - only show if we have audio URLs */}
            {audioUrls.length > 0 && (
              <button 
                className={`audio-debug-button ${showAudioDebug ? 'active' : ''}`}
                onClick={() => setShowAudioDebug(!showAudioDebug)}
                title="Show audio chunks debug panel"
              >
                <span role="img" aria-label="Audio Debug">🎚️</span>
              </button>
            )}
            
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