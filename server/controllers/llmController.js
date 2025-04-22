const { ChatDeepInfra } = require('@langchain/community/chat_models/deepinfra');
const { MODELS, API_KEY } = require('../../src/config');
const llmService = require('../services/llmService');

/**
 * Get available LLM models
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getModels = (req, res) => {
  try {
    res.json({
      models: Object.entries(MODELS).map(([key, value]) => ({
        id: value,
        name: key,
        provider: 'deepinfra',
      }))
    });
  } catch (error) {
    console.error('Error fetching models:', error);
    res.status(500).json({
      error: true,
      message: error.message || 'Error fetching models'
    });
  }
};

/**
 * Generate a text completion
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.generateCompletion = async (req, res) => {
  try {
    const { model, prompt, temperature = 0.7, max_tokens = 800 } = req.body;
    
    if (!model || !prompt) {
      return res.status(400).json({
        error: true,
        message: 'Missing required parameters: model and prompt are required'
      });
    }

    const result = await llmService.generateCompletion(model, prompt, temperature, max_tokens);
    
    res.json({
      completion: result,
      model: model,
    });
  } catch (error) {
    console.error('Error generating completion:', error);
    res.status(500).json({
      error: true,
      message: error.message || 'Error generating completion'
    });
  }
};

/**
 * Generate a chat response
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.generateChatResponse = async (req, res) => {
  try {
    const { model, messages, temperature = 0.7, max_tokens = 800 } = req.body;
    
    if (!model || !messages || !Array.isArray(messages)) {
      return res.status(400).json({
        error: true,
        message: 'Missing required parameters: model and messages array are required'
      });
    }

    const result = await llmService.generateChatResponse(model, messages, temperature, max_tokens);
    
    res.json({
      message: result,
      model: model,
    });
  } catch (error) {
    console.error('Error generating chat response:', error);
    res.status(500).json({
      error: true,
      message: error.message || 'Error generating chat response'
    });
  }
};

/**
 * Stream a chat response
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.streamChatResponse = async (req, res) => {
  try {
    const { model, messages, temperature = 0.7, max_tokens = 800 } = req.body;
    
    if (!model || !messages || !Array.isArray(messages)) {
      return res.status(400).json({
        error: true,
        message: 'Missing required parameters: model and messages array are required'
      });
    }

    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // Stream callback function
    const onTokenStream = (token) => {
      res.write(`data: ${JSON.stringify({ token })}\n\n`);
    };
    
    try {
      await llmService.streamChatResponse(model, messages, temperature, max_tokens, onTokenStream);
      
      // Signal completion
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (err) {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    }
  } catch (error) {
    console.error('Error streaming chat response:', error);
    res.status(500).json({
      error: true,
      message: error.message || 'Error streaming chat response'
    });
  }
};