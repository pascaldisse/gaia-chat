import { createPersonaTools } from '../services/tools';
import { isDiceRollCommand, extractDiceParams } from '../utils/ToolUtilities';
import Persona from '../models/Persona';

// Mock the knowledgeDB
const mockKnowledgeDB = {
  searchFiles: jest.fn().mockResolvedValue([])
};

// Mock component reference
const mockComponentRef = {
  knowledgeDB: mockKnowledgeDB,
  generateImage: jest.fn().mockResolvedValue('image-generated'),
  imageModel: 'test-model',
  selectedStyle: 'test-style',
  setCurrentChat: jest.fn()
};

describe('Persona Tools', () => {
  let persona;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create a test persona with tools enabled
    persona = new Persona({
      id: 'test-persona-123',
      name: 'Test Persona',
      systemPrompt: 'You are a test persona',
      model: 'test-model',
      agentSettings: {
        maxIterations: 3,
        toolConfig: {
          fileSearch: true,
          imageGeneration: true,
          diceRoll: true
        }
      }
    });
  });
  
  test('createPersonaTools creates correct tools based on persona config', () => {
    // Create tools
    const tools = createPersonaTools(mockComponentRef, persona);
    
    // Check if correct number of tools are created
    expect(tools.length).toBe(3);
    
    // Check if all expected tools are created
    const toolNames = tools.map(tool => tool.name);
    expect(toolNames).toContain('file_search');
    expect(toolNames).toContain('generate_image');
    expect(toolNames).toContain('dice_roll');
  });
  
  test('tools are not created when disabled in persona config', () => {
    // Create a persona with some tools disabled
    const limitedPersona = new Persona({
      id: 'limited-persona',
      name: 'Limited Persona',
      model: 'test-model',
      agentSettings: {
        maxIterations: 3,
        toolConfig: {
          fileSearch: true,
          imageGeneration: false,
          diceRoll: false
        }
      }
    });
    
    // Create tools
    const tools = createPersonaTools(mockComponentRef, limitedPersona);
    
    // Should only have file_search
    expect(tools.length).toBe(1);
    expect(tools[0].name).toBe('file_search');
  });
  
  test('dice_roll tool correctly handles d notation', async () => {
    // Create tools and get the dice_roll tool
    const tools = createPersonaTools(mockComponentRef, persona);
    const diceRollTool = tools.find(tool => tool.name === 'dice_roll');
    
    // Test with d20 notation
    const result1 = await diceRollTool.func('d20');
    expect(result1).toContain('Rolling 1d20');
    
    // Test with 3d6 notation
    const result2 = await diceRollTool.func('3d6');
    expect(result2).toContain('Rolling 3d6');
  });
  
  test('dice_roll tool correctly handles comma notation', async () => {
    // Create tools and get the dice_roll tool
    const tools = createPersonaTools(mockComponentRef, persona);
    const diceRollTool = tools.find(tool => tool.name === 'dice_roll');
    
    // Test with 20,1 notation (20-sided die, 1 roll)
    const result1 = await diceRollTool.func('20,1');
    expect(result1).toContain('Rolling 1d20');
    
    // Test with 6,3 notation (6-sided die, 3 rolls)
    const result2 = await diceRollTool.func('6,3');
    expect(result2).toContain('Rolling 3d6');
  });
  
  test('dice_roll tool handles invalid input', async () => {
    // Create tools and get the dice_roll tool
    const tools = createPersonaTools(mockComponentRef, persona);
    const diceRollTool = tools.find(tool => tool.name === 'dice_roll');
    
    // Test with invalid input
    const result = await diceRollTool.func('invalid');
    expect(result).toContain('Invalid dice format');
  });
  
  test('file_search tool uses knowledgeDB correctly', async () => {
    // Setup mock to return sample results
    mockKnowledgeDB.searchFiles.mockResolvedValueOnce([
      { id: 'file1', name: 'Test File 1' },
      { id: 'file2', name: 'Test File 2' }
    ]);
    
    // Create tools and get the file_search tool
    const tools = createPersonaTools(mockComponentRef, persona);
    const fileSearchTool = tools.find(tool => tool.name === 'file_search');
    
    // Test the tool
    const result = await fileSearchTool.func('test query');
    
    // Check if knowledgeDB.searchFiles was called correctly
    expect(mockKnowledgeDB.searchFiles).toHaveBeenCalledWith('test query');
    
    // Check if the result is as expected
    const parsedResult = JSON.parse(result);
    expect(parsedResult).toHaveLength(2);
    expect(parsedResult[0].name).toBe('Test File 1');
    expect(parsedResult[1].name).toBe('Test File 2');
  });
  
  test('generate_image tool calls component method correctly', async () => {
    // Create tools and get the generate_image tool
    const tools = createPersonaTools(mockComponentRef, persona);
    const imageGenTool = tools.find(tool => tool.name === 'generate_image');
    
    // Test the tool
    await imageGenTool.func('a beautiful landscape');
    
    // Check if generateImage was called with correct params
    expect(mockComponentRef.generateImage).toHaveBeenCalledWith({
      prompt: 'a beautiful landscape',
      model: 'test-model',
      style: 'test-style'
    });
  });
});

// Test utilities for detecting dice roll commands
describe('Dice Roll Command Detection', () => {
  test('isDiceRollCommand detects standard dice notation', () => {
    expect(isDiceRollCommand('roll d20')).toBe(true);
    expect(isDiceRollCommand('roll a d20')).toBe(true);
    expect(isDiceRollCommand('roll 3d6')).toBe(true);
    expect(isDiceRollCommand('d20')).toBe(true);
    expect(isDiceRollCommand('3d6')).toBe(true);
  });
  
  test('isDiceRollCommand detects non-standard dice commands', () => {
    expect(isDiceRollCommand('roll a 20 sided dice')).toBe(true);
    expect(isDiceRollCommand('roll dice')).toBe(true);
    expect(isDiceRollCommand('can you roll some dice for me?')).toBe(true);
  });
  
  test('isDiceRollCommand ignores unrelated messages', () => {
    expect(isDiceRollCommand('what time is it?')).toBe(false);
    expect(isDiceRollCommand('tell me a joke')).toBe(false);
    expect(isDiceRollCommand('hello there')).toBe(false);
  });
  
  test('extractDiceParams handles different notation formats', () => {
    // Test d notation
    expect(extractDiceParams('roll d20')).toEqual({ sides: 20, count: 1 });
    expect(extractDiceParams('roll 3d6')).toEqual({ sides: 6, count: 3 });
    
    // Test sided dice format
    expect(extractDiceParams('roll a 20 sided dice')).toEqual({ sides: 20, count: 1 });
    
    // Test default for generic roll request
    expect(extractDiceParams('roll dice')).toEqual({ sides: 20, count: 1 });
  });
});