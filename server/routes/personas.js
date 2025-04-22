const express = require('express');
const router = express.Router();
const personaController = require('../controllers/personaController');

/**
 * @route GET /api/personas
 * @desc Get all personas
 * @access Public
 */
router.get('/', personaController.getAllPersonas);

/**
 * @route GET /api/personas/:id
 * @desc Get persona by id
 * @access Public
 */
router.get('/:id', personaController.getPersonaById);

/**
 * @route POST /api/personas
 * @desc Create a new persona
 * @access Public
 * @body Persona object
 */
router.post('/', personaController.createPersona);

/**
 * @route POST /api/personas/:id/chat
 * @desc Chat with a specific persona
 * @access Public
 * @body {message, history}
 */
router.post('/:id/chat', personaController.chatWithPersona);

/**
 * @route POST /api/personas/:id/stream
 * @desc Stream chat with a specific persona
 * @access Public
 * @body {message, history}
 */
router.post('/:id/stream', personaController.streamWithPersona);

module.exports = router;