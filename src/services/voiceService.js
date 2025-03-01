import axios from 'axios';

// DeepInfra API URLs
const VOICES_URL = "https://api.deepinfra.com/v1/voices/list";
// For TTS, we need to use the correct voices endpoint
const TTS_BASE_URL = "https://api.deepinfra.com/v1/voices";

// API Key - in a real application, this should be stored securely
const API_KEY = "Bearer u5q1opMM9uw9x84EJLtxqaQ6HcnXbUAq";

/**
 * Get available voices from DeepInfra API
 * @returns {Promise<Array>} Array of voice objects
 */
export const getVoices = async () => {
  // Default voices from DeepInfra
  const defaultVoices = [
    { voice_id: "luna", name: "Luna" },
    { voice_id: "aura", name: "Aura" },
    { voice_id: "quartz", name: "Quartz" },
    { voice_id: "af_bella", name: "Bella (Female)" },
    { voice_id: "af_nova", name: "Nova (Female)" },
    { voice_id: "am_adam", name: "Adam (Male)" },
    { voice_id: "am_michael", name: "Michael (Male)" },
    { voice_id: "bm_daniel", name: "Daniel (British Male)" },
    { voice_id: "bm_george", name: "George (British Male)" },
    { voice_id: "bf_emma", name: "Emma (British Female)" }
  ];
  
  try {
    console.log("Fetching voices from DeepInfra API...");
    const response = await axios.get(VOICES_URL, {
      headers: {
        "Authorization": API_KEY,
        "Content-Type": "application/json"
      }
    });
    
    if (response.data && response.data.voices) {
      console.log(`Retrieved ${response.data.voices.length} voices from DeepInfra API`);
      return response.data.voices;
    } else {
      console.warn("No voices in DeepInfra API response, using default voices");
      return defaultVoices;
    }
  } catch (error) {
    console.error("Failed to fetch voices from DeepInfra API:", error);
    console.log("Using default voice list");
    return defaultVoices;
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
    console.log(`Generating speech for voice ID: ${voiceId}`);
    
    // If no voice ID is provided, use a default one
    if (!voiceId) {
      console.warn("No voice ID provided, using default voice");
      voiceId = "luna"; // Default DeepInfra voice
    }
    
    // For API limits, limit text length
    const truncatedText = text.length > 300 ? text.substring(0, 300) + "..." : text;
    
    // Construct the correct URL with the voice ID
    const ttsEndpoint = `${TTS_BASE_URL}/${voiceId}`;
    
    console.log(`Making TTS API request to: ${ttsEndpoint}`);
    
    // Post request to the voice endpoint
    const response = await axios.post(ttsEndpoint, 
      {
        text: truncatedText
      }, 
      {
        headers: {
          "Authorization": API_KEY,
          "Content-Type": "application/json"
        },
        timeout: 15000 // 15 second timeout
      }
    );
    
    console.log("TTS response received:", response.status);
    
    // Process the response based on its type
    if (response.data) {
      if (typeof response.data === 'object' && response.data.audio) {
        // Handle response with audio property (base64)
        console.log("Audio data received as base64");
        const audioBlob = base64ToBlob(response.data.audio, 'audio/mp3');
        return URL.createObjectURL(audioBlob);
      }
    }
    
    // If we get here, we didn't get usable audio data
    console.error("No audio data in the response");
    throw new Error("No audio data returned from the API");
  } catch (error) {
    console.error("Error in speech generation:", error);
    // Don't use any fallbacks - let the caller handle the error
    throw error;
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
 * @returns {string} URL to fallback audio blob
 */
const createFallbackAudio = () => {
  try {
    // Create a simple beep sound
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.value = 440; // A4 note
    gainNode.gain.value = 0.3; // lower volume
    
    // Create an offline audio context to render our sound
    const offlineCtx = new OfflineAudioContext(1, 44100, 44100);
    const offlineOsc = offlineCtx.createOscillator();
    const offlineGain = offlineCtx.createGain();
    
    offlineOsc.connect(offlineGain);
    offlineGain.connect(offlineCtx.destination);
    
    offlineOsc.type = 'sine';
    offlineOsc.frequency.value = 440;
    offlineGain.gain.value = 0.3;
    
    // Start and stop
    offlineOsc.start();
    offlineOsc.stop(0.5); // half a second duration
    
    // Render and return the audio blob
    return offlineCtx.startRendering().then(renderedBuffer => {
      // Convert buffer to wave file
      const audio = new Audio();
      const blob = bufferToWave(renderedBuffer, 0, renderedBuffer.length);
      const url = URL.createObjectURL(blob);
      console.log("Created fallback audio successfully");
      return url;
    });
  } catch (e) {
    console.error("Error creating fallback audio:", e);
    // Return empty audio as last resort
    return "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";
  }
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
 * Convert base64 string to Blob
 * @param {string} base64 - Base64 encoded string
 * @param {string} mimeType - MIME type of the data
 * @returns {Blob} Blob object
 */
const base64ToBlob = (base64, mimeType) => {
  const byteCharacters = atob(base64);
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
};