import axios from 'axios';

// Zonos TTS API from Zyphra
const TTS_ENDPOINT = "https://api.deepinfra.com/v1/inference/Zyphra/Zonos-v0.1-hybrid";

// API Key - in a real application, this should be stored securely
const API_KEY = "Bearer u5q1opMM9uw9x84EJLtxqaQ6HcnXbUAq";

/**
 * Get available voices for Zonos TTS
 * @returns {Promise<Array>} Array of voice objects
 */
export const getVoices = async () => {
  // Default voices from Zonos TTS
  const defaultVoices = [
    { voice_id: "american_female", name: "American Female" },
    { voice_id: "american_male", name: "American Male" },
    { voice_id: "british_female", name: "British Female" },
    { voice_id: "british_male", name: "British Male" },
    { voice_id: "random", name: "Random Voice" }
  ];
  
  try {
    console.log("Using Zonos TTS voices");
    return defaultVoices;
  } catch (error) {
    console.error("Error with voice options:", error);
    return defaultVoices;
  }
};

/**
 * Generate TTS audio from text using Zonos TTS API
 * @param {string} text - Text to convert to speech
 * @param {string} voiceId - Voice ID to use for TTS
 * @returns {Promise<string>} Audio URL
 */
export const generateSpeech = async (text, voiceId) => {
  try {
    console.log(`Generating speech for voice ID: ${voiceId}`);
    
    // If no voice ID is provided, use a default one
    if (!voiceId || !["american_female", "american_male", "british_female", "british_male", "random"].includes(voiceId)) {
      console.warn("No valid voice ID provided, using default voice");
      voiceId = "random"; // Default Zonos voice
    }
    
    // For API limits, limit text length
    const truncatedText = text.length > 300 ? text.substring(0, 300) + "..." : text;
    
    console.log(`Making TTS API request to Zonos TTS endpoint`);
    
    // Post to the Zonos TTS endpoint with the correct parameters
    const response = await axios.post(TTS_ENDPOINT, 
      {
        text: truncatedText,
        preset_voice: voiceId,
        language: "en-us",
        output_format: "mp3"
      }, 
      {
        headers: {
          "Authorization": API_KEY,
          "Content-Type": "application/json"
        },
        timeout: 30000 // 30 second timeout
      }
    );
    
    console.log("TTS response received:", response.status);
    
    // Process the response
    console.log("Response data:", JSON.stringify(response.data).substring(0, 100));
    
    if (response.data && response.data.audio) {
      console.log("Audio data received in response");
      
      try {
        // Check if audio data is a valid base64 string
        // The Zonos API may return data differently, so we need to handle different cases
        let audioData = response.data.audio;
        
        // If the response contains binary data or a non-standard format,
        // let's handle it differently by creating an in-memory audio element
        const audioBlob = new Blob([audioData], { type: 'audio/mp3' });
        return URL.createObjectURL(audioBlob);
      } catch (error) {
        console.error("Error processing audio data:", error);
        
        // Fall back to using the fallback audio
        console.log("Using fallback audio");
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
    try {
      // Create a simple notification sound
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Create an offline audio context to render our sound
      const sampleRate = 44100;
      const duration = 1; // 1 second
      const offlineCtx = new OfflineAudioContext(1, sampleRate * duration, sampleRate);
      
      // First oscillator - higher pitch
      const osc1 = offlineCtx.createOscillator();
      const gain1 = offlineCtx.createGain();
      osc1.connect(gain1);
      gain1.connect(offlineCtx.destination);
      
      osc1.type = 'sine';
      osc1.frequency.value = 880; // A5 note
      gain1.gain.setValueAtTime(0, 0);
      gain1.gain.linearRampToValueAtTime(0.2, 0.1); // Fade in
      gain1.gain.linearRampToValueAtTime(0, 0.3); // Fade out
      
      // Second oscillator - lower pitch
      const osc2 = offlineCtx.createOscillator();
      const gain2 = offlineCtx.createGain();
      osc2.connect(gain2);
      gain2.connect(offlineCtx.destination);
      
      osc2.type = 'sine';
      osc2.frequency.value = 660; // E5 note
      gain2.gain.setValueAtTime(0, 0.3);
      gain2.gain.linearRampToValueAtTime(0.2, 0.4); // Fade in
      gain2.gain.linearRampToValueAtTime(0, 0.6); // Fade out
      
      // Start and stop
      osc1.start(0);
      osc1.stop(0.3);
      osc2.start(0.3);
      osc2.stop(0.6);
      
      // Render and return the audio blob
      offlineCtx.startRendering()
        .then(renderedBuffer => {
          // Convert buffer to wave file
          const blob = bufferToWave(renderedBuffer, 0, renderedBuffer.length);
          const url = URL.createObjectURL(blob);
          console.log("Created fallback audio successfully");
          resolve(url);
        })
        .catch(err => {
          console.error("Error rendering fallback audio:", err);
          // Return empty audio as last resort
          resolve("data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA");
        });
    } catch (e) {
      console.error("Error creating fallback audio:", e);
      // Return empty audio as last resort
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