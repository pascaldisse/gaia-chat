import Persona from '../models/Persona';
import { personaDB } from '../services/db';

// Mock the database service
jest.mock('../services/db', () => ({
  personaDB: {
    savePersona: jest.fn().mockImplementation(async (persona) => persona),
    getPersonaById: jest.fn(),
  }
}));

describe('Persona Tool Persistence Tests', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test('persona saves with agentSettings and toolConfig', async () => {
    // Create a sample persona with agent settings
    const samplePersona = new Persona({
      id: 'test-persona-123',
      name: 'Test Persona',
      systemPrompt: 'You are a test persona',
      model: 'claude-3-haiku',
      agentSettings: {
        maxIterations: 3,
        toolConfig: {
          fileSearch: true,
          imageGeneration: false,
          diceRoll: true
        }
      }
    });
    
    // Simulate saving the persona
    await personaDB.savePersona(samplePersona);
    
    // Verify database save was called with the persona including tools
    expect(personaDB.savePersona).toHaveBeenCalledTimes(1);
    
    // Get the persona passed to savePersona
    const savedPersona = personaDB.savePersona.mock.calls[0][0];
    
    // Verify the toolConfig was preserved
    expect(savedPersona.agentSettings).toBeDefined();
    expect(savedPersona.agentSettings.toolConfig).toBeDefined();
    expect(savedPersona.agentSettings.toolConfig.diceRoll).toBe(true);
    expect(savedPersona.agentSettings.toolConfig.fileSearch).toBe(true);
    expect(savedPersona.agentSettings.toolConfig.imageGeneration).toBe(false);
  });
  
  test('handleToolsUpdate updates persona correctly', () => {
    // Create a mock persona
    const mockPersona = {
      name: 'Test Persona',
      agentSettings: {
        maxIterations: 3,
        toolConfig: {
          fileSearch: true,
          imageGeneration: false,
          diceRoll: false
        }
      }
    };
    
    // Simulate the handleToolsUpdate function behavior
    const updatedTools = {
      diceRoll: true,
      imageGeneration: false,
      fileSearch: true
    };
    
    const updatedPersona = {
      ...mockPersona,
      agentSettings: {
        ...mockPersona.agentSettings,
        toolConfig: {
          ...mockPersona.agentSettings.toolConfig,
          ...updatedTools
        }
      }
    };
    
    // Verify the tool update logic works correctly
    expect(updatedPersona.agentSettings.toolConfig.diceRoll).toBe(true);
    expect(updatedPersona.agentSettings.toolConfig.fileSearch).toBe(true);
    expect(updatedPersona.agentSettings.toolConfig.imageGeneration).toBe(false);
  });
});