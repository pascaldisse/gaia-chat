import axios from 'axios';

// TTS API endpoints
const TTS_ENDPOINTS = {
  zonos: "https://api.deepinfra.com/v1/inference/Zyphra/Zonos-v0.1-hybrid",
  kokoro: "https://api.deepinfra.com/v1/inference/hexgrad/Kokoro-82M"
};

// API Key - in a real application, this should be stored securely
const API_KEY = "Bearer u5q1opMM9uw9x84EJLtxqaQ6HcnXbUAq";

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
 * Generate TTS audio from text
 * @param {string} text - Text to convert to speech
 * @param {string} voiceId - Voice ID to use for TTS
 * @returns {Promise<string>} Audio URL
 */
export const generateSpeech = async (text, voiceId) => {
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
            return URL.createObjectURL(blob);
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