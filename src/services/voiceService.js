import axios from 'axios';
import API_KEYS from '../config.keys.js';

// Add a debug utility function that can be called from the console
window.debugGaiaAudio = function() {
  console.log('%c GAIA AUDIO DEBUG UTILITY', 'background: purple; color: white; font-size: 20px; padding: 10px;');
  console.log('This utility will patch the running code to debug audio issues');
  
  // Add a more aggressive audio tracker
  window.trackAllAudio = function() {
    // Store original Audio class
    window.OriginalAudio = window.OriginalAudio || window.Audio;
    
    // Override Audio constructor to log all audio creation
    window.Audio = function(...args) {
      console.log('%c NEW AUDIO ELEMENT CREATED', 'background: red; color: white; font-size: 16px');
      console.log('Arguments:', args);
      
      // Create the audio element using the original constructor
      const audio = new window.OriginalAudio(...args);
      
      // Track all audio elements
      window.audioElements = window.audioElements || [];
      window.audioElements.push(audio);
      
      // Override src setter
      const originalSrcSetter = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'src').set;
      Object.defineProperty(audio, 'src', {
        set: function(value) {
          console.log('%c AUDIO SRC SET:', 'background: green; color: white;', value?.substring(0, 100) + '...');
          window.lastAudioSrc = value;
          
          // Store in history
          window.audioSrcHistory = window.audioSrcHistory || [];
          window.audioSrcHistory.push({
            timestamp: new Date().toISOString(),
            src: value?.substring(0, 100) + '...'
          });
          
          return originalSrcSetter.call(this, value);
        }
      });
      
      // Override play method
      const originalPlay = audio.play;
      audio.play = function() {
        console.log('%c AUDIO PLAY CALLED', 'background: blue; color: white;');
        console.log('Current src:', this.src?.substring(0, 100) + '...');
        
        window.lastPlayedAudio = {
          timestamp: new Date().toISOString(),
          src: this.src
        };
        
        return originalPlay.call(this);
      };
      
      return audio;
    };
    
    console.log('%c Audio tracking applied - all new audio elements will be logged', 'background: green; color: white;');
  };
  
  // Also track XMLHttpRequest to see API calls
  window.trackXHR = function() {
    const originalXHROpen = window.XMLHttpRequest.prototype.open;
    const originalXHRSend = window.XMLHttpRequest.prototype.send;
    
    window.XMLHttpRequest.prototype.open = function(method, url, ...args) {
      if (url.includes('inference') || url.includes('api') || url.includes('voice') || url.includes('speech')) {
        console.log('%c XHR OPEN:', 'background: orange; color: black;', method, url);
        this._audioApiUrl = url;
      }
      return originalXHROpen.call(this, method, url, ...args);
    };
    
    window.XMLHttpRequest.prototype.send = function(body) {
      if (this._audioApiUrl) {
        console.log('%c XHR SEND to audio API:', 'background: orange; color: black;', this._audioApiUrl);
        if (body) {
          try {
            const data = JSON.parse(body);
            console.log('Request data:', data);
            window.lastAudioRequest = {
              url: this._audioApiUrl,
              data: data,
              timestamp: new Date().toISOString()
            };
          } catch (e) {
            console.log('Raw body:', body);
          }
        }
      }
      return originalXHRSend.call(this, body);
    };
    
    console.log('%c XHR tracking applied - all API calls will be logged', 'background: orange; color: black;');
  };
  
  // Track fetch API too
  window.trackFetch = function() {
    const originalFetch = window.fetch;
    window.fetch = function(url, options) {
      if (typeof url === 'string' && (url.includes('inference') || url.includes('api') || url.includes('voice') || url.includes('speech'))) {
        console.log('%c FETCH:', 'background: yellow; color: black;', url);
        if (options?.body) {
          try {
            const data = JSON.parse(options.body);
            console.log('Request data:', data);
            window.lastFetchRequest = {
              url: url,
              data: data,
              timestamp: new Date().toISOString()
            };
          } catch (e) {
            console.log('Raw body:', options.body);
          }
        }
      }
      return originalFetch.call(this, url, options);
    };
    
    console.log('%c Fetch tracking applied - all API calls will be logged', 'background: yellow; color: black;');
  };
  
  // Apply all trackers
  window.trackAllAudio();
  window.trackXHR();
  window.trackFetch();
  
  console.log('%c All audio debug features enabled. Click the play button and check the console.', 'background: purple; color: white;');
  console.log('You can check window.lastAudioSrc and window.lastPlayedAudio after clicking play.');
  
  return 'Audio debugging enabled. Click play button and check console for logs.';
};

// Console instructions 
console.log('%c To debug audio issues, run this in the console:', 'background: blue; color: white; font-size: 16px;');
console.log('%c window.debugGaiaAudio()', 'background: black; color: white; font-size: 14px;');

// TTS API endpoints
const TTS_ENDPOINTS = {
  zonos: "https://api.deepinfra.com/v1/inference/Zyphra/Zonos-v0.1-hybrid",
  kokoro: "https://api.deepinfra.com/v1/inference/hexgrad/Kokoro-82M"
};

// API Key from secure config file
const API_KEY = `Bearer ${API_KEYS.DEEPINFRA_API_KEY}`;

// Get current TTS engine preference from localStorage, default to zonos
export const getTTSEngine = () => {
  return localStorage.getItem('tts_engine') || 'zonos';
};

// Set TTS engine preference in localStorage
export const setTTSEngine = (engine) => {
  localStorage.setItem('tts_engine', engine);
  return engine;
};

/**
 * Get available voices based on the selected TTS engine
 * @returns {Promise<Array>} Array of voice objects
 */
export const getVoices = async () => {
  const engine = getTTSEngine();
  
  // Select voices based on engine
  if (engine === 'zonos') {
    // Zonos TTS voices
    const zonosVoices = [
      { voice_id: "american_female", name: "American Female", engine: 'zonos' },
      { voice_id: "american_male", name: "American Male", engine: 'zonos' },
      { voice_id: "british_female", name: "British Female", engine: 'zonos' },
      { voice_id: "british_male", name: "British Male", engine: 'zonos' },
      { voice_id: "random", name: "Random Voice", engine: 'zonos' }
    ];
    
    console.log("Using Zonos TTS voices");
    return zonosVoices;
  } else {
    // Kokoro TTS voices
    const kokoroVoices = [
      { voice_id: "af_bella", name: "Bella (Female)", engine: 'kokoro' },
      { voice_id: "af_nova", name: "Nova (Female)", engine: 'kokoro' },
      { voice_id: "af_nicole", name: "Nicole (Female)", engine: 'kokoro' },
      { voice_id: "am_adam", name: "Adam (Male)", engine: 'kokoro' },
      { voice_id: "am_michael", name: "Michael (Male)", engine: 'kokoro' },
      { voice_id: "bf_emma", name: "Emma (British Female)", engine: 'kokoro' },
      { voice_id: "bm_daniel", name: "Daniel (British Male)", engine: 'kokoro' },
      { voice_id: "bm_george", name: "George (British Male)", engine: 'kokoro' }
    ];
    
    console.log("Using Kokoro TTS voices");
    return kokoroVoices;
  }
};

/**
 * Split text into sentences for chunked TTS processing
 * @param {string} text - Text to split into sentences
 * @returns {Array<string>} Array of sentences
 */
export const splitTextIntoSentences = (text) => {
  console.log("Splitting text into sentences:", text.substring(0, 50) + "...");
  
  try {
    // SIMPLIFIED APPROACH: Just split by common sentence ending punctuation
    // This avoids regex issues with special characters
    if (!text || typeof text !== 'string') {
      console.warn("Invalid text input to splitTextIntoSentences:", text);
      return ["Error processing text"];
    }
    
    // Handle special markdown cases that cause problems
    let cleanText = text;
    
    // If text starts with italic markers (like *character does action*), 
    // just strip the markers for TTS
    if (cleanText.startsWith('*') && cleanText.includes('*', 1)) {
      cleanText = cleanText.replace(/^\*(.*?)\*/m, '$1');
    }
    
    // Split text at sentence boundaries with simple string splitting
    // Periods, question marks, exclamation points followed by space or newline
    const chunks = [];
    let currentChunk = "";
    
    // Pre-split to avoid processing too much text at once
    const paragraphs = cleanText.split('\n');
    
    paragraphs.forEach(paragraph => {
      // Skip empty paragraphs
      if (!paragraph.trim()) return;
      
      // Simple split on common sentence-ending punctuation
      const segments = paragraph.split(/(?<=[.!?])\s+/);
      
      segments.forEach(segment => {
        const trimmed = segment.trim();
        if (!trimmed) return;
        
        // Ensure each segment ends with punctuation
        let processedSegment = trimmed;
        if (!processedSegment.match(/[.!?]$/)) {
          processedSegment += '.';
        }
        
        // Check if adding this segment would make the chunk too long
        if (currentChunk.length + processedSegment.length > 150 && currentChunk.length > 0) {
          chunks.push(currentChunk);
          currentChunk = processedSegment;
        } else {
          // Add to current chunk with space if needed
          currentChunk += (currentChunk ? ' ' : '') + processedSegment;
        }
      });
    });
    
    // Add the last chunk if not empty
    if (currentChunk) {
      chunks.push(currentChunk);
    }
    
    // If we somehow ended up with no chunks, return the original text as one chunk
    if (chunks.length === 0) {
      return [cleanText];
    }
    
    console.log(`Split text into ${chunks.length} chunks`);
    return chunks;
  } catch (error) {
    console.error("Error splitting text into sentences:", error);
    // Return a simplified version of the text as a fallback
    return [text.substring(0, 200) + "..."];
  }
};

/**
 * Generate TTS audio from text
 * @param {string} text - Text to convert to speech
 * @param {string} voiceId - Voice ID to use for TTS
 * @returns {Promise<string>} Audio URL
 */
export const generateSpeech = async (text, voiceId) => {
  console.log('%c 🎙️ GENERATE SPEECH CALLED', 'background: #ff00ff; color: white; font-size: 20px; padding: 8px;');
  console.log('%c Text:', 'background: #ff00ff; color: white;', text?.substring(0, 100) + '...');
  console.log('%c Voice ID:', 'background: #ff00ff; color: white;', voiceId);
  
  // Store this for debugging
  if (!window.audioGenerationCalls) window.audioGenerationCalls = [];
  window.audioGenerationCalls.push({
    timestamp: new Date().toISOString(),
    text: text?.substring(0, 100) + '...',
    voiceId
  });
  
  try {
    // Determine which engine to use
    // Either from localStorage preference or derive from voiceId formatting
    let engine = getTTSEngine();
    
    // Override engine based on voiceId if it clearly matches a specific engine's format
    if (voiceId) {
      if (["american_female", "american_male", "british_female", "british_male", "random"].includes(voiceId)) {
        engine = 'zonos';
      } else if (voiceId.startsWith('af_') || voiceId.startsWith('am_') || voiceId.startsWith('bf_') || voiceId.startsWith('bm_')) {
        engine = 'kokoro';
      }
    }
    
    console.log(`Generating speech using ${engine} engine for voice ID: ${voiceId}`);
    
    // For API limits, limit text length 
    const truncatedText = text.length > 300 ? text.substring(0, 300) + "..." : text;
    
    // Prepare request based on selected engine
    let requestData, endpoint;
    
    if (engine === 'zonos') {
      // If no voice ID is provided for Zonos, use a default one
      if (!voiceId || !["american_female", "american_male", "british_female", "british_male", "random"].includes(voiceId)) {
        console.warn("No valid Zonos voice ID provided, using default voice");
        voiceId = "random"; // Default Zonos voice
      }
      
      endpoint = TTS_ENDPOINTS.zonos;
      requestData = {
        text: truncatedText,
        preset_voice: voiceId,
        language: "en-us",
        output_format: "mp3"
      };
      
      console.log(`Making TTS API request to Zonos TTS endpoint`);
    } else {
      // If no voice ID is provided for Kokoro, use a default one
      if (!voiceId || !(voiceId.startsWith('af_') || voiceId.startsWith('am_') || voiceId.startsWith('bf_') || voiceId.startsWith('bm_'))) {
        console.warn("No valid Kokoro voice ID provided, using default voice");
        voiceId = "af_bella"; // Default Kokoro voice
      }
      
      endpoint = TTS_ENDPOINTS.kokoro;
      requestData = {
        text: truncatedText,
        preset_voice: [voiceId], // Kokoro expects an array of voices
        output_format: "mp3"
      };
      
      console.log(`Making TTS API request to Kokoro TTS endpoint`);
    }
    
    // Make the request to the selected endpoint
    const response = await axios.post(endpoint, requestData, {
      headers: {
        "Authorization": API_KEY,
        "Content-Type": "application/json"
      },
      timeout: 30000 // 30 second timeout
    });
    
    console.log("TTS response received:", response.status);
    
    // Process the response
    console.log("Response data:", JSON.stringify(response.data).substring(0, 100));
    console.log("Full response:", response.data);
    
    if (response.data && response.data.audio) {
      console.log('%c 🎵 AUDIO DATA RECEIVED FROM API', 'background: #00ff00; color: black; font-size: 20px; padding: 8px;');
      
      // Store this for debugging
      if (!window.audioAPIResponses) window.audioAPIResponses = [];
      window.audioAPIResponses.push({
        timestamp: new Date().toISOString(),
        hasAudio: !!response.data.audio,
        audioType: typeof response.data.audio,
        audioLength: typeof response.data.audio === 'string' ? response.data.audio.length : 'unknown'
      });
      
      console.log("Audio data received in response");
      
      try {
        // For the Zonos API, we need to handle the response differently
        // Check if we got any usable audio data
        if (response.data.audio === null) {
          console.warn("Audio data is null, using fallback audio");
          return createFallbackAudio();
        }
        
        // Check if the audio data is already a data URL
        if (typeof response.data.audio === 'string' && response.data.audio.startsWith('data:audio/')) {
          console.log("Audio data is already a data URL, using directly");
          return response.data.audio;
        }
        
        // Handle base64 format
        console.log("Converting audio data to blob URL");
        
        // The Zonos API response seems to include audio data as base64
        // Let's convert it to a Blob and create a URL
        try {
          // If it's a base64 string without the data URL prefix
          if (typeof response.data.audio === 'string') {
            console.log('%c 🔊 RETURNING AUDIO URL', 'background: purple; color: white; font-size: 20px; padding: 8px;');
            
            // Store in a global variable for debugging
            window.lastGeneratedAudioURL = response.data.audio.substring(0, 100) + '...';
            
            // If it's already a data URL, just return it directly
            if (response.data.audio.startsWith('data:audio')) {
              console.log('%c RETURNING DATA URL DIRECTLY', 'background: purple; color: white;');
              return response.data.audio;
            }
            
            // Extract just the base64 part if it's a data URL
            const base64Data = response.data.audio.includes('base64,') 
              ? response.data.audio.split('base64,')[1] 
              : response.data.audio;
              
            // Convert to blob
            const byteCharacters = atob(base64Data);
            const byteArrays = [];
            
            for (let offset = 0; offset < byteCharacters.length; offset += 512) {
              const slice = byteCharacters.slice(offset, offset + 512);
              
              const byteNumbers = new Array(slice.length);
              for (let i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
              }
              
              const byteArray = new Uint8Array(byteNumbers);
              byteArrays.push(byteArray);
            }
            
            const blob = new Blob(byteArrays, { type: 'audio/mp3' });
            const url = URL.createObjectURL(blob);
            console.log('%c RETURNING BLOB URL', 'background: purple; color: white;', url);
            return url;
          }
        } catch (e) {
          console.error("Error converting base64 to blob:", e);
        }
      } catch (error) {
        console.error("Error processing audio data:", error);
        
        // Fall back to using the fallback audio
        console.log("Using fallback audio due to error");
        return createFallbackAudio();
      }
    }
    
    // If we get here, we didn't get usable audio data
    console.error("No audio data in the response:", response.data);
    
    // Fall back to using the fallback audio rather than throwing an error
    console.log("Using fallback audio instead of throwing error");
    return createFallbackAudio();
  } catch (error) {
    console.error("Error in speech generation:", error);
    
    // For demo purposes, provide a simple message
    if (error.response && error.response.status === 405) {
      console.warn("API endpoint does not accept this method. Using fallback audio.");
    }
    
    // Instead of throwing, return fallback audio
    console.log("API call failed. Using fallback audio.");
    return createFallbackAudio();
  }
};

/**
 * Generate TTS audio for multiple text chunks in parallel
 * @param {Array<string>} textChunks - Array of text chunks to convert to speech
 * @param {string} voiceId - Voice ID to use for TTS
 * @returns {Promise<Array<string>>} Array of audio URLs
 */
export const generateSpeechChunks = async (textChunks, voiceId) => {
  console.log(`[AUDIO-API] Generating speech for ${textChunks.length} chunks in parallel`);
  
  // Handle case with empty chunks array
  if (!textChunks || textChunks.length === 0) {
    console.warn(`[AUDIO-API] No text chunks provided to generateSpeechChunks`);
    return [];
  }
  
  // Handle case with single chunk - ensure we still return an array
  if (textChunks.length === 1) {
    console.log(`[AUDIO-API] Only one chunk, processing directly`);
    try {
      const url = await generateSpeech(textChunks[0], voiceId);
      console.log(`[AUDIO-API] Generated single audio chunk`);
      console.log(`[AUDIO-API] Single chunk URL: ${url ? url.substring(0, 50) + '...' : 'undefined'}`);
      
      // Always return an array even for a single item
      const result = [url];
      console.log(`[AUDIO-API] Returning array with single URL, length: ${result.length}`);
      console.log(`[AUDIO-API] Array content:`, JSON.stringify(result));
      return result;
    } catch (err) {
      console.error(`[AUDIO-API] Failed to generate single audio chunk:`, err);
      const fallback = await createFallbackAudio();
      return [fallback];
    }
  }
  
  try {
    // Very direct debug
    console.log(`%c 🔊 GENERATING SPEECH FOR ${textChunks.length} CHUNKS`, 'background: #00ff00; color: black; font-size: 16px');
    console.log(`%c First chunk:`, 'background: #00ff00; color: black', textChunks[0]);
    
    // Add to window for debugging
    window.lastAudioGeneration = {
      timestamp: new Date().toISOString(),
      textChunks: [...textChunks],
      voiceId,
      chunkCount: textChunks.length
    };
    
    // Create an array of promises, each generating speech for one chunk
    const promises = textChunks.map((chunk, i) => {
      console.log(`%c [AUDIO-API] Starting request for chunk ${i + 1}/${textChunks.length}`, 'background: #00ff00; color: black');
      return generateSpeech(chunk, voiceId)
        .then(url => {
          console.log(`%c [AUDIO-API] Generated audio for chunk ${i + 1}/${textChunks.length}`, 'background: #00ff00; color: black');
          console.log(`%c URL for chunk ${i+1}:`, 'background: #00ff00; color: black', url?.substring(0, 50) + '...');
          
          // Store this URL in the window debug object
          if (!window.lastAudioGeneration.urls) window.lastAudioGeneration.urls = [];
          window.lastAudioGeneration.urls[i] = url;
          
          return url;
        })
        .catch(err => {
          console.error(`%c [AUDIO-API] Failed to generate audio for chunk ${i + 1}:`, 'background: #ff0000; color: white', err);
          return createFallbackAudio();
        });
    });
    
    // Wait for all promises to resolve
    const audioUrls = await Promise.all(promises);
    
    // SUPER DIRECT DEBUG - Make it impossible to miss
    console.log(`%c !!! AUDIO URLS CREATED !!!`, 'background: #ff00ff; color: white; font-size: 24px; padding: 10px;');
    console.log(`%c Array length: ${audioUrls.length}`, 'background: #ff00ff; color: white; font-size: 18px;');
    
    // Store in a global variable for debugging
    window.lastGeneratedAudioUrls = [...audioUrls];
    
    // Log each URL individually with distinct styling
    audioUrls.forEach((url, idx) => {
      console.log(`%c URL[${idx}]`, 'background: #ff00ff; color: white; font-weight: bold;', 
        url ? url.substring(0, 50) + '...' : 'null/undefined');
    });
    
    console.log(`[AUDIO-API] Successfully generated ${audioUrls.length} audio chunks`);
    
    // Log the full audio URLs array to help with debugging
    console.log('[AUDIO-API] FULL AUDIO ARRAY:', JSON.stringify(audioUrls));
    // Force logging of array length and first item
    console.log(`[AUDIO-API] ARRAY LENGTH: ${audioUrls.length}, FIRST ITEM: ${audioUrls[0] ? audioUrls[0].substring(0, 50) + '...' : 'undefined'}`);
    console.table(audioUrls);
    
    // Log the audio URLs in a more reliable way
    console.log(`[AUDIO-API] Audio URL summary:`);
    audioUrls.forEach((url, i) => {
      if (!url) {
        console.log(`[AUDIO-API] Chunk ${i+1}: null or undefined URL`);
      } else if (typeof url !== 'string') {
        console.log(`[AUDIO-API] Chunk ${i+1}: non-string URL type: ${typeof url}`);
      } else if (url.startsWith('blob:')) {
        console.log(`[AUDIO-API] Chunk ${i+1}: Blob URL (length: ${url.length})`);
      } else if (url.startsWith('data:audio')) {
        console.log(`[AUDIO-API] Chunk ${i+1}: Data URL (length: ${url.length})`);
      } else {
        console.log(`[AUDIO-API] Chunk ${i+1}: Other URL type (length: ${url.length})`);
      }
    });
    
    return audioUrls;
  } catch (error) {
    console.error("[AUDIO-API] Error generating speech chunks:", error);
    // Return at least one fallback audio URL
    return [await createFallbackAudio()];
  }
};

/**
 * Get a static voice sample for fallback when API fails
 */
const getStaticVoiceSample = (voiceId) => {
  // Create a simple beep audio as fallback
  return createFallbackAudio();
};

/**
 * Create a fallback audio for demo/development
 * @returns {Promise<string>} URL to fallback audio blob
 */
const createFallbackAudio = () => {
  return new Promise((resolve) => {
    // For simplicity, we'll just use a pre-defined base64 WAV
    // This is a simple beep sound encoded as a WAV file in base64
    const base64Audio = "UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2Dal9ZYnBwdGxeWV1qaXN5fXtpU05XZnF8gIB0XlNTWWdyfYiMioJwX1BLTlVkcIeNlI+DdGhgYGVrdn6Bg4B5cW1qaWxxeYGHioqEeW5mYmNnb3h/hYiJhHpvZmFhZGx0e4GFiYmFfnZubGtrdXh8gISEg4B8enl3dnp9gIKEhYOAfXp5eHd6fICDhISCgH57ent8fX+Bg4OEgoB9e3p5e3x+gIKDg4KAf317e3t8fX+Bg4OCgYB+fHt7fH1/gIKDg4KBf317e3x8fn+BgoOCgYF/fXx8fH1+gIGCg4KBgH58fHx8fX+AgYKDgoGAfnx8fH1+f4CBgoKCgYB+fX19fn+AgIGBgYGAfn19fX1+f4CBgYGBgIB+fn19fn5/gIGBgYGAgH5+fn5+f3+AgYGBgYCAf35+fn5/f4CBgYGBgIB/fn5+fn+AgICBgYGAgH9+fn5+f4CAgICBgYCAf35+fn9/gICAgICAgIB/f39/f3+AgICAgICAgH9/f39/f4CAgICAgICAf39/f3+AgICAgICAgIB/f39/f4CAgICAgICAgH9/f3+AgICAgICAgIB/f39/gICAgICAgICAf39/f4CAgICAgICAgH9/f3+AgICAgICAgIB/f39/gICAgICAgICAf39/f4CAgICAgICAgH9/f3+AgICAgICAgIB/f39/gICAgICAgICAf39/f4CAgICAgICAgH9/f3+AgICAgICAgIB/f39/f4CAgICAgICAgH9/f3+AgICAgICAgIB/f39/f4CAgICAgICAgH9/f39/gICAgICAgIB/f39/f3+AgICAgICAgH9/f39/f4CAgICAgIB/f39/f3+AgICAgICAgH9/f39/f4CAgICAgIB/f39/f3+AgICAgICAgH9/f39/f4CAgICAgIB/f39/f3+AgICAgICAgH9/f39/f4CAgICAgIB/f39/f3+AgICAgICAgH9/f39/f4CAgICAgIB/f39/f3+AgICAgICAgH9/f39/f4CAgICAgIB/f39/f3+AgICAgICAgH9/f39/f4CAgICAgIB/f39/f3+AgICAgICAgH9/f39/f4CAgICAgIB/f39/f3+AgICAgICAgH9/f39/f4CAgICAgIB/f39/f3+AgICAgICAgH9/f39/f4CAgICAgIB/f39/f3+AgICAgICAgH9/f39/f4CAgICAgIB/f39/f3+AgICAgICAgH9/f39/f4CAgICAgIB/f39/f3+AgICAgICAgH9/f39/f4CAgICAgIB/f39/f3+AgICAgICAgH9/f39/f4CAgICAgIB/f39/f3+AgICAgICAgH9/f39/f4CAgICAgIB/f39/f3+AgICAgICAgH9/f39/f4CAgICAgIB/f39/f3+AgICAgICAgH9/f39/f4CAgICAgIB/f39/f3+AgICAgICAgH9/f39/f4CAgICAgIB/f39/f3+AgICAgICAgH9/f39/f4CAgICAgIB/f39/f3+AgICAgICAgH9/f39/f4CAgICAgIB/f39/f3+AgICAgICAgH9/f39/f4CAgICAgIB/f39/f3+AgICAgICAgH9/f39/f4CAgICAgIB/f39/f3+AgICAgICAgH9/f39/f4CAgICAgIB/f39/f3+AgICAgICAgH9/f39/f4CAgICAgIB/f39/f3+AgICAgICAgH9/f39/f4CAgICAgICAf39/f3+AgICAgICAgIB/f39/f4CAgICAgICAgH9/f3+AgICAgICAgIB/f39/gICAgICAgICAf39/f4CAgICAgICAgH9/f3+AgICAgICAgIB/f39/gICAgICAgICAf39/f4CAgICAgICAgH9/f3+AgICAgICAgIB/f39/gICAgICAgICAf39/f4CAgICAgICAgH9/f3+AgICAgICAgIB/f39/gICAgICAgICAf39/f4CAgICAgICAgH9/f3+AgICAgICAgIB/f3+AgICAgICAgICAf39/f4CAgICAgICAgH9/f3+AgICAgICAgIB/f39/gICAgICAgICAf39/f4CAgICAgICAgH9/f3+AgICAgICAgIB/f39/gICAgICAgICAf39/f4CAgICAgA==";
    
    try {
      // Convert base64 to Blob and create a URL
      const byteCharacters = atob(base64Audio);
      const byteNumbers = new Array(byteCharacters.length);
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      
      console.log("Created fallback audio blob URL");
      resolve(url);
    } catch (e) {
      console.error("Error creating fallback audio:", e);
      // Return a simple data URL as absolute last resort
      resolve("data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA");
    }
  });
};

// Helper to convert AudioBuffer to WAV format
function bufferToWave(abuffer, offset, len) {
  const numOfChan = abuffer.numberOfChannels;
  const length = len * numOfChan * 2 + 44;
  const buffer = new ArrayBuffer(length);
  const view = new DataView(buffer);
  const channels = [];
  let sample, pos = 0;

  // Write WAVE header
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // file length - 8
  setUint32(0x45564157); // "WAVE"
  setUint32(0x20746d66); // "fmt " chunk
  setUint32(16); // length = 16
  setUint16(1); // PCM
  setUint16(numOfChan);
  setUint32(abuffer.sampleRate);
  setUint32(abuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
  setUint16(numOfChan * 2); // block align
  setUint16(16); // 16-bit
  setUint32(0x61746164); // "data" chunk
  setUint32(length - pos - 4); // chunk length

  // Write audio data
  for (let i = 0; i < abuffer.numberOfChannels; i++) {
    channels.push(abuffer.getChannelData(i));
  }

  while (pos < length) {
    for (let i = 0; i < numOfChan; i++) {
      // interleave channels
      if (offset >= len) {
        // Prevent out of bounds
        sample = 0;
      } else {
        // Get channel data
        const channelData = channels[i];
        if (channelData && offset < channelData.length) {
          sample = Math.max(-1, Math.min(1, channelData[offset])); // clamp
        } else {
          sample = 0;
        }
      }
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0; // scale to 16-bit signed int
      view.setInt16(pos, sample, true); // write 16-bit sample
      pos += 2;
    }
    offset++; // next source sample
    
    // Safety check
    if (pos >= length) break;
  }

  function setUint16(data) {
    view.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data) {
    view.setUint32(pos, data, true);
    pos += 4;
  }

  return new Blob([buffer], { type: "audio/wav" });
}

/**
 * Convert data to Blob
 * @param {string|object} data - Data to convert (base64 string, binary data, or other format)
 * @param {string} mimeType - MIME type of the data
 * @returns {Blob} Blob object
 */
const base64ToBlob = (data, mimeType) => {
  // Check if data is already a Blob
  if (data instanceof Blob) {
    return data;
  }
  
  // Handle different data formats
  try {
    if (typeof data === 'string') {
      // Try to decode as base64
      try {
        // Check if it's a valid base64 string
        const validBase64 = data.match(/^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)?$/);
        
        if (validBase64) {
          // It's a valid base64 string, decode it
          const byteCharacters = atob(data);
          const byteArrays = [];

          for (let offset = 0; offset < byteCharacters.length; offset += 512) {
            const slice = byteCharacters.slice(offset, offset + 512);
            
            const byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i++) {
              byteNumbers[i] = slice.charCodeAt(i);
            }
            
            const byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
          }
          
          return new Blob(byteArrays, { type: mimeType });
        }
      } catch (e) {
        console.warn("Not a valid base64 string:", e.message);
      }
      
      // If it's not a valid base64 string, create a Blob from the string directly
      return new Blob([data], { type: mimeType });
    } else if (data instanceof ArrayBuffer || ArrayBuffer.isView(data)) {
      // Handle ArrayBuffer or TypedArray
      return new Blob([data], { type: mimeType });
    } else if (typeof data === 'object') {
      // For other object types, try to stringify
      return new Blob([JSON.stringify(data)], { type: mimeType });
    }
  } catch (error) {
    console.error("Error converting data to Blob:", error);
  }
  
  // If all else fails, return an empty Blob
  return new Blob([], { type: mimeType });
};