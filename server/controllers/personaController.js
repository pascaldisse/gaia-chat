const personaService = require('../services/personaService');
const { RPGSystem } = require('../../src/utils/RPGSystem');

/**
 * Get all personas
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getAllPersonas = async (req, res) => {
  try {
    const personas = await personaService.getAllPersonas();
    res.json({ personas });
  } catch (error) {
    console.error('Error fetching personas:', error);
    res.status(500).json({
      error: true,
      message: error.message || 'Error fetching personas'
    });
  }
};

/**
 * Get persona by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getPersonaById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        error: true,
        message: 'Missing required parameter: id'
      });
    }
    
    const persona = await personaService.getPersonaById(id);
    
    if (!persona) {
      return res.status(404).json({
        error: true,
        message: `Persona with id ${id} not found`
      });
    }
    
    res.json({ persona });
  } catch (error) {
    console.error(`Error fetching persona ${req.params.id}:`, error);
    res.status(500).json({
      error: true,
      message: error.message || 'Error fetching persona'
    });
  }
};

/**
 * Create a new persona
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.createPersona = async (req, res) => {
  try {
    const personaData = req.body;
    
    // Validate required fields
    if (!personaData.name || !personaData.systemPrompt || !personaData.model) {
      return res.status(400).json({
        error: true,
        message: 'Missing required fields: name, systemPrompt, and model are required'
      });
    }
    
    const newPersona = await personaService.createPersona(personaData);
    
    res.status(201).json({
      persona: newPersona,
      message: 'Persona created successfully'
    });
  } catch (error) {
    console.error('Error creating persona:', error);
    res.status(500).json({
      error: true,
      message: error.message || 'Error creating persona'
    });
  }
};

/**
 * Chat with a specific persona
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.chatWithPersona = async (req, res) => {
  try {
    const { id } = req.params;
    const { message, history = [] } = req.body;
    
    if (!id || !message) {
      return res.status(400).json({
        error: true,
        message: 'Missing required parameters: id and message are required'
      });
    }
    
    // Get persona
    const persona = await personaService.getPersonaById(id);
    
    if (!persona) {
      return res.status(404).json({
        error: true,
        message: `Persona with id ${id} not found`
      });
    }
    
    // Generate RPG context
    const context = {
      topicAlignment: true, // Default assumption, can be refined later
      unfamiliarTopic: false, // Default assumption, can be refined later
      mentionedPersonaIds: []
    };
    
    // Calculate RPG outcome
    const outcome = RPGSystem.calculateOutcome(persona, context);
    
    // Get response
    const response = await personaService.chatWithPersona(persona, message, history, outcome);
    
    res.json({
      response,
      outcome,
      persona: {
        id: persona.id,
        name: persona.name
      }
    });
  } catch (error) {
    console.error(`Error chatting with persona ${req.params.id}:`, error);
    res.status(500).json({
      error: true,
      message: error.message || 'Error generating chat response'
    });
  }
};

/**
 * Stream chat with a specific persona
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.streamWithPersona = async (req, res) => {
  try {
    const { id } = req.params;
    const { message, history = [] } = req.body;
    
    if (!id || !message) {
      return res.status(400).json({
        error: true,
        message: 'Missing required parameters: id and message are required'
      });
    }
    
    // Get persona
    const persona = await personaService.getPersonaById(id);
    
    if (!persona) {
      return res.status(404).json({
        error: true,
        message: `Persona with id ${id} not found`
      });
    }
    
    // Generate RPG context
    const context = {
      topicAlignment: true, // Default assumption, can be refined later
      unfamiliarTopic: false, // Default assumption, can be refined later
      mentionedPersonaIds: []
    };
    
    // Calculate RPG outcome
    const outcome = RPGSystem.calculateOutcome(persona, context);
    
    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // Send the outcome data
    res.write(`data: ${JSON.stringify({ type: 'outcome', data: outcome })}\n\n`);
    
    // Stream callback function
    const onTokenStream = (token) => {
      res.write(`data: ${JSON.stringify({ type: 'token', token })}\n\n`);
    };
    
    try {
      await personaService.streamWithPersona(persona, message, history, outcome, onTokenStream);
      
      // Signal completion
      res.write(`data: ${JSON.stringify({ type: 'done', done: true })}\n\n`);
      res.end();
    } catch (err) {
      res.write(`data: ${JSON.stringify({ type: 'error', error: err.message })}\n\n`);
      res.end();
    }
  } catch (error) {
    console.error(`Error streaming with persona ${req.params.id}:`, error);
    res.status(500).json({
      error: true,
      message: error.message || 'Error streaming chat response'
    });
  }
};