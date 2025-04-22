/**
 * Example client for Gaia API
 * 
 * This is a simple Node.js script that demonstrates how to use the Gaia API.
 * It includes examples for:
 * - Fetching available models
 * - Generating completions
 * - Chatting with the LLM directly
 * - Working with personas
 * 
 * Run with: node api-client.js
 */

const fetch = require('node-fetch');
const { createReadStream } = require('fs');
const { EventSource } = require('eventsource');

// API base URL
const API_BASE = 'http://localhost:5000/api';
const API_KEY = 'your_api_key'; // Replace with your actual API key

// Headers for regular requests
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${API_KEY}`
};

/**
 * Get available LLM models
 */
async function getModels() {
  try {
    const response = await fetch(`${API_BASE}/llm/models`, { headers });
    const data = await response.json();
    
    console.log('Available models:');
    data.models.forEach(model => {
      console.log(`- ${model.name}: ${model.id}`);
    });
    
    return data.models;
  } catch (error) {
    console.error('Error fetching models:', error);
  }
}

/**
 * Generate a text completion
 * @param {string} model - Model ID
 * @param {string} prompt - Text prompt
 */
async function generateCompletion(model, prompt) {
  try {
    const response = await fetch(`${API_BASE}/llm/completion`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        prompt,
        temperature: 0.7,
        max_tokens: 800
      })
    });
    
    const data = await response.json();
    
    console.log('\nCompletion result:');
    console.log(data.completion);
    
    return data.completion;
  } catch (error) {
    console.error('Error generating completion:', error);
  }
}

/**
 * Generate a chat response
 * @param {string} model - Model ID
 * @param {Array} messages - Array of message objects
 */
async function generateChatResponse(model, messages) {
  try {
    const response = await fetch(`${API_BASE}/llm/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 800
      })
    });
    
    const data = await response.json();
    
    console.log('\nChat response:');
    console.log(data.message);
    
    return data.message;
  } catch (error) {
    console.error('Error generating chat response:', error);
  }
}

/**
 * Stream a chat response
 * @param {string} model - Model ID
 * @param {Array} messages - Array of message objects
 */
function streamChatResponse(model, messages) {
  return new Promise((resolve, reject) => {
    try {
      // First create the streaming request
      fetch(`${API_BASE}/llm/stream`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
          max_tokens: 800
        })
      }).then(response => {
        // Create event source for streaming
        const eventSource = new EventSource(response.url);
        let fullResponse = '';
        
        console.log('\nStreaming response:');
        
        // Handle incoming tokens
        eventSource.onmessage = (event) => {
          const data = JSON.parse(event.data);
          
          if (data.token) {
            process.stdout.write(data.token);
            fullResponse += data.token;
          }
          
          if (data.done) {
            console.log('\n\nStream completed.');
            eventSource.close();
            resolve(fullResponse);
          }
          
          if (data.error) {
            console.error('\nError:', data.error);
            eventSource.close();
            reject(new Error(data.error));
          }
        };
        
        // Handle errors
        eventSource.onerror = (error) => {
          console.error('\nStream error:', error);
          eventSource.close();
          reject(error);
        };
      });
    } catch (error) {
      console.error('Error setting up stream:', error);
      reject(error);
    }
  });
}

/**
 * Get all personas
 */
async function getPersonas() {
  try {
    const response = await fetch(`${API_BASE}/personas`, { headers });
    const data = await response.json();
    
    console.log('\nAvailable personas:');
    data.personas.forEach(persona => {
      console.log(`- ${persona.name} (${persona.id})`);
    });
    
    return data.personas;
  } catch (error) {
    console.error('Error fetching personas:', error);
  }
}

/**
 * Chat with a specific persona
 * @param {string} personaId - Persona ID
 * @param {string} message - Message to send
 * @param {Array} history - Chat history
 */
async function chatWithPersona(personaId, message, history = []) {
  try {
    const response = await fetch(`${API_BASE}/personas/${personaId}/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        message,
        history
      })
    });
    
    const data = await response.json();
    
    console.log(`\nResponse from ${data.persona.name}:`);
    console.log(data.response);
    console.log('\nRPG outcome:', data.outcome);
    
    return data;
  } catch (error) {
    console.error('Error chatting with persona:', error);
  }
}

/**
 * Stream chat with a specific persona
 * @param {string} personaId - Persona ID
 * @param {string} message - Message to send
 * @param {Array} history - Chat history
 */
function streamWithPersona(personaId, message, history = []) {
  return new Promise((resolve, reject) => {
    try {
      // First create the streaming request
      fetch(`${API_BASE}/personas/${personaId}/stream`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message,
          history
        })
      }).then(response => {
        // Create event source for streaming
        const eventSource = new EventSource(response.url);
        let fullResponse = '';
        let outcome = null;
        
        console.log('\nStreaming response from persona:');
        
        // Handle incoming data
        eventSource.onmessage = (event) => {
          const data = JSON.parse(event.data);
          
          if (data.type === 'outcome') {
            outcome = data.data;
            console.log('RPG outcome received:', outcome);
          }
          
          if (data.type === 'token') {
            process.stdout.write(data.token);
            fullResponse += data.token;
          }
          
          if (data.type === 'done') {
            console.log('\n\nStream completed.');
            eventSource.close();
            resolve({ response: fullResponse, outcome });
          }
          
          if (data.type === 'error') {
            console.error('\nError:', data.error);
            eventSource.close();
            reject(new Error(data.error));
          }
        };
        
        // Handle errors
        eventSource.onerror = (error) => {
          console.error('\nStream error:', error);
          eventSource.close();
          reject(error);
        };
      });
    } catch (error) {
      console.error('Error setting up stream:', error);
      reject(error);
    }
  });
}

/**
 * Create a new persona
 * @param {Object} personaData - Persona data
 */
async function createPersona(personaData) {
  try {
    const response = await fetch(`${API_BASE}/personas`, {
      method: 'POST',
      headers,
      body: JSON.stringify(personaData)
    });
    
    const data = await response.json();
    
    console.log('\nPersona created:');
    console.log(data.message);
    console.log(data.persona);
    
    return data.persona;
  } catch (error) {
    console.error('Error creating persona:', error);
  }
}

// Example usage
async function runExamples() {
  // Get available models
  const models = await getModels();
  const defaultModel = models[0]?.id || 'meta-llama/Meta-Llama-3-70B-Instruct';
  
  // Generate a text completion
  await generateCompletion(
    defaultModel, 
    'Explain the concept of APIs in simple terms'
  );
  
  // Generate a chat response
  await generateChatResponse(
    defaultModel,
    [
      { role: 'user', content: 'Hello, can you tell me about the weather today?' }
    ]
  );
  
  // Stream a chat response
  await streamChatResponse(
    defaultModel,
    [
      { role: 'user', content: 'Write a short poem about technology.' }
    ]
  );
  
  // Get all personas
  const personas = await getPersonas();
  const defaultPersona = personas[0]?.id || 'default-assistant';
  
  // Chat with a persona
  const chatResult = await chatWithPersona(
    defaultPersona,
    'Tell me something interesting about space exploration.'
  );
  
  // Use the chat history for a continued conversation
  const history = [
    { role: 'user', content: 'Tell me something interesting about space exploration.' },
    { role: 'assistant', content: chatResult.response }
  ];
  
  // Stream chat with a persona
  await streamWithPersona(
    defaultPersona,
    'Can you expand on that with more details?',
    history
  );
  
  // Create a new persona
  await createPersona({
    name: 'Science Educator',
    systemPrompt: 'You are a science educator who specializes in explaining complex scientific concepts in simple terms.',
    model: defaultModel,
    initiative: 6,
    talkativeness: 8,
    confidence: 9,
    curiosity: 9,
    empathy: 7,
    creativity: 8,
    humor: 6
  });
}

// Run the examples
runExamples().catch(console.error);