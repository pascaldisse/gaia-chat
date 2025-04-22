const { ChatDeepInfra } = require('@langchain/community/chat_models/deepinfra');
const { ChatPromptTemplate, HumanMessagePromptTemplate } = require('@langchain/core/prompts');
const { HumanMessage } = require('@langchain/core/messages');

// Import API key directly
const API_KEY = 'u5q1opMM9uw9x84EJLtxqaQ6HcnXbUAq';

/**
 * Generate a text completion using the specified model
 * @param {string} model - Model ID
 * @param {string} prompt - Text prompt
 * @param {number} temperature - Temperature parameter (0-1)
 * @param {number} max_tokens - Maximum tokens to generate
 * @returns {Promise<string>} Generated completion text
 */
exports.generateCompletion = async (model, prompt, temperature = 0.7, max_tokens = 800) => {
  // Create the chat model
  const chat = new ChatDeepInfra({
    apiKey: API_KEY,
    modelName: model,
    temperature: temperature,
    maxTokens: max_tokens
  });

  // Build a simple prompt with the user's input
  const promptTemplate = ChatPromptTemplate.fromMessages([
    HumanMessagePromptTemplate.fromTemplate("{text}")
  ]);

  // Generate the completion
  const chain = promptTemplate.pipe(chat);
  const response = await chain.invoke({ text: prompt });

  return response.content;
};

/**
 * Convert message format from API to LangChain format
 * @param {Array} messages - Array of message objects
 * @returns {Array} Formatted messages for LangChain
 */
const formatMessages = (messages) => {
  return messages.map(msg => {
    if (msg.role === 'user' || msg.role === 'human') {
      return new HumanMessage(msg.content);
    } else {
      // Convert other roles to appropriate message types if needed
      // For simplicity, we're treating all non-user messages as AI messages
      return { type: 'ai', content: msg.content };
    }
  });
};

/**
 * Generate a chat response using the specified model
 * @param {string} model - Model ID
 * @param {Array} messages - Array of message objects
 * @param {number} temperature - Temperature parameter (0-1)
 * @param {number} max_tokens - Maximum tokens to generate
 * @returns {Promise<string>} Generated chat response
 */
exports.generateChatResponse = async (model, messages, temperature = 0.7, max_tokens = 800) => {
  // Create the chat model
  const chat = new ChatDeepInfra({
    apiKey: API_KEY,
    modelName: model,
    temperature: temperature,
    maxTokens: max_tokens
  });

  // Format messages for the model
  const formattedMessages = formatMessages(messages);
  
  // Call the model with the messages
  const response = await chat.call(formattedMessages);
  
  return response.content;
};

/**
 * Stream a chat response using the specified model
 * @param {string} model - Model ID
 * @param {Array} messages - Array of message objects
 * @param {number} temperature - Temperature parameter (0-1)
 * @param {number} max_tokens - Maximum tokens to generate
 * @param {Function} onTokenStream - Callback function for token streaming
 */
exports.streamChatResponse = async (model, messages, temperature = 0.7, max_tokens = 800, onTokenStream) => {
  // Create the chat model with streaming enabled
  const chat = new ChatDeepInfra({
    apiKey: API_KEY,
    modelName: model,
    temperature: temperature,
    maxTokens: max_tokens,
    streaming: true,
    callbacks: [
      {
        handleLLMNewToken(token) {
          onTokenStream(token);
        }
      }
    ]
  });

  // Format messages for the model
  const formattedMessages = formatMessages(messages);
  
  // Call the model with streaming
  await chat.call(formattedMessages);
};