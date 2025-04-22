const { ChatDeepInfra } = require('@langchain/community/chat_models/deepinfra');
const { ChatPromptTemplate } = require('@langchain/core/prompts');

// Import API key directly
const API_KEY = 'u5q1opMM9uw9x84EJLtxqaQ6HcnXbUAq';

// In-memory storage for personas until we have proper DB integration
const personas = new Map();

/**
 * Initialize with default personas
 */
const initDefaultPersonas = () => {
  const defaultPersonas = [
    {
      id: 'default-assistant',
      name: 'Assistant',
      systemPrompt: 'You are a helpful AI assistant.',
      model: 'meta-llama/Meta-Llama-3-70B-Instruct',
      initiative: 7,
      talkativeness: 8,
      confidence: 7,
      curiosity: 8,
      empathy: 8,
      creativity: 7,
      humor: 6,
      adaptability: 8,
      patience: 9,
      skepticism: 5,
      optimism: 7,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      agentSettings: {
        maxIterations: 3,
        toolConfig: {
          fileSearch: true,
          imageGeneration: false,
          diceRoll: false
        }
      }
    },
    {
      id: 'technical-expert',
      name: 'Technical Expert',
      systemPrompt: 'You are an expert in technology, engineering, and computer science. Provide technical details and accurate information about technology topics.',
      model: 'meta-llama/Meta-Llama-3-70B-Instruct',
      initiative: 6,
      talkativeness: 7,
      confidence: 9,
      curiosity: 7,
      empathy: 6,
      creativity: 6,
      humor: 4,
      adaptability: 7,
      patience: 8,
      skepticism: 8,
      optimism: 6,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      agentSettings: {
        maxIterations: 3,
        toolConfig: {
          fileSearch: true,
          imageGeneration: false,
          diceRoll: false
        }
      }
    }
  ];
  
  defaultPersonas.forEach(persona => {
    personas.set(persona.id, persona);
  });
};

// Initialize default personas
initDefaultPersonas();

/**
 * Get all personas
 * @returns {Promise<Array>} Array of all personas
 */
exports.getAllPersonas = async () => {
  return Array.from(personas.values());
};

/**
 * Get persona by ID
 * @param {string} id - Persona ID
 * @returns {Promise<Object>} Persona object or null if not found
 */
exports.getPersonaById = async (id) => {
  return personas.get(id) || null;
};

/**
 * Create a new persona
 * @param {Object} personaData - Persona data
 * @returns {Promise<Object>} Created persona object
 */
exports.createPersona = async (personaData) => {
  const id = personaData.id || `persona-${Date.now()}`;
  const newPersona = {
    ...personaData,
    id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  personas.set(id, newPersona);
  return newPersona;
};

/**
 * Generate RPG instructions based on outcome
 * @param {Object} outcome - RPG outcome object
 * @returns {string} RPG instructions as string
 */
const generateRpgInstructions = (outcome) => {
  const instructions = [];
  
  if (outcome.assertiveness === 'hesitant') {
    instructions.push('Respond with hesitation and caution in your tone.');
  } else if (outcome.assertiveness === 'assertive') {
    instructions.push('Respond with confidence and assertiveness in your tone.');
  }
  
  if (outcome.emotionalTone === 'detached') {
    instructions.push('Maintain a logical, detached tone without emotional language.');
  } else if (outcome.emotionalTone === 'empathetic') {
    instructions.push('Respond with empathy and emotional understanding.');
  }
  
  if (outcome.questionDepth === 'deep') {
    instructions.push('Ask a thoughtful, insightful question that shows deep understanding of the topic.');
  } else if (outcome.questionDepth === 'shallow') {
    instructions.push('Keep your response more direct without asking probing questions.');
  }
  
  return instructions.join('\n');
};

/**
 * Chat with a specific persona
 * @param {Object} persona - Persona object
 * @param {string} message - User message
 * @param {Array} history - Chat history
 * @param {Object} outcome - RPG outcome object
 * @returns {Promise<string>} Chat response
 */
exports.chatWithPersona = async (persona, message, history, outcome) => {
  // Create the chat model
  const chat = new ChatDeepInfra({
    apiKey: API_KEY,
    modelName: persona.model,
    temperature: persona.creativity / 10 || 0.7,
    maxTokens: 1000
  });

  // Format history for the prompt
  const formattedHistory = history.map(msg => 
    `${msg.role === 'user' ? 'Human' : 'AI'}: ${msg.content}`
  ).join('\n');

  // Build a prompt template for this persona
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", `You are ${persona.name}. ${persona.systemPrompt}

${generateRpgInstructions(outcome)}

Current conversation:
${formattedHistory}`],
    ["human", message]
  ]);

  // Generate the completion
  const response = await prompt.pipe(chat).invoke({});
  
  return response.content;
};

/**
 * Stream chat with a specific persona
 * @param {Object} persona - Persona object
 * @param {string} message - User message
 * @param {Array} history - Chat history
 * @param {Object} outcome - RPG outcome object
 * @param {Function} onTokenStream - Callback function for token streaming
 */
exports.streamWithPersona = async (persona, message, history, outcome, onTokenStream) => {
  // Create the chat model with streaming enabled
  const chat = new ChatDeepInfra({
    apiKey: API_KEY,
    modelName: persona.model,
    temperature: persona.creativity / 10 || 0.7,
    maxTokens: 1000,
    streaming: true,
    callbacks: [
      {
        handleLLMNewToken(token) {
          onTokenStream(token);
        }
      }
    ]
  });

  // Format history for the prompt
  const formattedHistory = history.map(msg => 
    `${msg.role === 'user' ? 'Human' : 'AI'}: ${msg.content}`
  ).join('\n');

  // Build a prompt template for this persona
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", `You are ${persona.name}. ${persona.systemPrompt}

${generateRpgInstructions(outcome)}

Current conversation:
${formattedHistory}`],
    ["human", message]
  ]);

  // Generate the streaming completion
  await prompt.pipe(chat).invoke({});
};