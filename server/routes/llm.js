const express = require('express');
const router = express.Router();
const llmController = require('../controllers/llmController');

/**
 * @route GET /api/llm/health
 * @desc Health check endpoint
 * @access Public
 */
router.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'LLM API is running' });
});

/**
 * @route GET /api/llm/models
 * @desc Get available LLM models
 * @access Public
 */
router.get('/models', llmController.getModels);

/**
 * @route POST /api/llm/completion
 * @desc Generate a text completion using the specified model
 * @access Public
 * @body {model, prompt, temperature, max_tokens}
 */
router.post('/completion', llmController.generateCompletion);

/**
 * @route POST /api/llm/chat
 * @desc Generate a chat response using the specified model
 * @access Public
 * @body {model, messages, temperature, max_tokens}
 */
router.post('/chat', llmController.generateChatResponse);

/**
 * @route POST /api/llm/stream
 * @desc Stream a chat response using the specified model
 * @access Public
 * @body {model, messages, temperature, max_tokens}
 */
router.post('/stream', llmController.streamChatResponse);

module.exports = router;